import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity, Filter } from "lucide-react";

interface Report {
  id: string;
  analysis: any;
  report_type: string;
  created_at: string;
}

// Dynamically generate distinct HSL colors — no hardcoded list, no cap
function generateColor(index: number): string {
  const hues = [207, 122, 0, 45, 270, 180, 330, 30, 150, 300, 60, 240];
  const hue = hues[index % hues.length];
  const lightness = index < hues.length ? 45 : 35 + (index % 3) * 10;
  return `hsl(${hue}, 65%, ${lightness}%)`;
}

// Trend threshold configurable (not a magic number buried in logic)
const TREND_THRESHOLD_PCT = 5;

// Normalise test names for grouping (e.g. "Hemoglobin (Hb)" → "Hemoglobin")
function normaliseTestName(raw: string): string {
  return raw.trim().replace(/\s*\(.*?\)/g, "").trim();
}

// Format date respecting user locale from the browser
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TrendsView({ reports }: { reports: Report[] }) {
  const [selectedTests, setSelectedTests] = useState<Set<string> | null>(null); // null = all

  const bloodReports = useMemo(() =>
    reports
      .filter(r => r.report_type === "blood" && r.analysis?.testResults?.length > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [reports]
  );

  const { chartData, availableTests, trends, referenceRanges } = useMemo(() => {
    if (bloodReports.length < 1) {
      return { chartData: [], availableTests: [] as string[], trends: [] as any[], referenceRanges: {} as Record<string, { min?: number; max?: number }> };
    }

    // Collect all unique normalised test names across all reports
    const testSet = new Set<string>();
    bloodReports.forEach(r => {
      r.analysis.testResults.forEach((t: any) => {
        const name = normaliseTestName(t.name ?? "");
        if (name) testSet.add(name);
      });
    });

    const availableTests = Array.from(testSet); // no slice — all tests

    // Build chart data points
    const chartData = bloodReports.map(r => {
      const point: Record<string, any> = {
        date: formatDate(r.created_at),
        _rawDate: r.created_at,
      };
      r.analysis.testResults.forEach((t: any) => {
        const name = normaliseTestName(t.name ?? "");
        if (availableTests.includes(name)) {
          const val = parseFloat(t.value);
          if (!isNaN(val)) point[name] = val;
        }
      });
      return point;
    });

    // Collect reference ranges (min/max) from the latest report that has them
    const referenceRanges: Record<string, { min?: number; max?: number }> = {};
    [...bloodReports].reverse().forEach(r => {
      r.analysis.testResults.forEach((t: any) => {
        const name = normaliseTestName(t.name ?? "");
        if (!referenceRanges[name] && (t.referenceMin != null || t.referenceMax != null)) {
          referenceRanges[name] = {
            min: t.referenceMin != null ? parseFloat(t.referenceMin) : undefined,
            max: t.referenceMax != null ? parseFloat(t.referenceMax) : undefined,
          };
        }
      });
    });

    // Calculate trends for each test
    const trends = availableTests.map(test => {
      const values = chartData
        .map((d: any) => d[test])
        .filter((v: any) => v !== undefined) as number[];

      if (values.length < 2) return { name: test, trend: "stable" as const, change: 0, hasData: values.length > 0 };

      const last = values[values.length - 1];
      const prev = values[values.length - 2];
      const change = prev !== 0 ? ((last - prev) / prev) * 100 : 0;

      return {
        name: test,
        trend: change > TREND_THRESHOLD_PCT ? "up" as const : change < -TREND_THRESHOLD_PCT ? "down" as const : "stable" as const,
        change: Math.round(change),
        hasData: true,
      };
    });

    return { chartData, availableTests, trends, referenceRanges };
  }, [bloodReports]);

  // Derived: which tests are actually shown on chart
  const visibleTests = selectedTests
    ? availableTests.filter(t => selectedTests.has(t))
    : availableTests;

  function toggleTest(name: string) {
    setSelectedTests(prev => {
      const current = prev ?? new Set(availableTests);
      const next = new Set(current);
      if (next.has(name)) {
        if (next.size === 1) return current; // keep at least one
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  if (bloodReports.length < 1) {
    return (
      <div className="text-center py-16 bg-muted/40 rounded-xl">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Upload at least one blood report to see trends.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Trends compare values across multiple blood reports over time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Trend Summary Cards — all tests, dynamic */}
      {trends.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {trends.filter(t => t.hasData).map((t, i) => (
            <button
              key={t.name}
              onClick={() => toggleTest(t.name)}
              className={`bg-card border rounded-xl p-4 shadow-card text-left transition-opacity ${
                selectedTests && !selectedTests.has(t.name) ? "opacity-40" : "opacity-100"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1 truncate">{t.name}</p>
              <div className="flex items-center gap-2">
                {t.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
                ) : t.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    t.trend === "up"
                      ? "text-red-500"
                      : t.trend === "down"
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.change > 0 ? "+" : ""}{t.change}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.trend === "up" ? "Increased" : t.trend === "down" ? "Decreased" : "Stable"} since last report
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Filter hint when many tests */}
      {availableTests.length > 6 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Tap a card above to toggle it on/off in the chart.
        </p>
      )}

      {/* Chart — shows all visible tests */}
      {chartData.length >= 1 && visibleTests.length > 0 && (
        <div className="bg-card border rounded-xl p-6 shadow-card">
          <h3 className="font-semibold mb-4">Value Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const range = referenceRanges[name];
                  const suffix = range
                    ? ` (ref: ${range.min ?? "?"}–${range.max ?? "?"})`
                    : "";
                  return [`${value}${suffix}`, name];
                }}
              />
              <Legend />
              {visibleTests.map((test, i) => {
                const range = referenceRanges[test];
                return [
                  <Line
                    key={test}
                    type="monotone"
                    dataKey={test}
                    stroke={generateColor(i)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls // connect across missing data points
                  />,
                  range?.min != null && (
                    <ReferenceLine
                      key={`${test}-min`}
                      y={range.min}
                      stroke={generateColor(i)}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                  ),
                  range?.max != null && (
                    <ReferenceLine
                      key={`${test}-max`}
                      y={range.max}
                      stroke={generateColor(i)}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                    />
                  ),
                ].filter(Boolean);
              })}
            </LineChart>
          </ResponsiveContainer>
          {chartData.length === 1 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Upload more reports to see trends over time.
            </p>
          )}
        </div>
      )}
    </div>
  );
}