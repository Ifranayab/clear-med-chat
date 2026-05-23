import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface Report {
  id: string;
  analysis: any;
  report_type: string;
  created_at: string;
}

const TRACKED_TESTS = ["Hemoglobin", "WBC", "Platelet", "RBC", "SGPT", "SGOT", "Creatinine", "Blood Sugar", "Cholesterol"];
const CHART_COLORS = ["hsl(207, 79%, 51%)", "hsl(122, 40%, 45%)", "hsl(0, 72%, 51%)", "hsl(45, 100%, 51%)", "hsl(270, 60%, 55%)", "hsl(180, 50%, 45%)"];

export default function TrendsView({ reports }: { reports: Report[] }) {
  const bloodReports = useMemo(() =>
    reports
      .filter(r => r.report_type === "blood" && r.analysis?.testResults?.length > 0)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [reports]
  );

  const { chartData, availableTests, trends } = useMemo(() => {
    if (bloodReports.length < 1) return { chartData: [], availableTests: [] as string[], trends: [] as any[] };

    const testSet = new Set<string>();
    bloodReports.forEach(r => {
      r.analysis.testResults.forEach((t: any) => {
        const name = t.name?.trim();
        if (name && TRACKED_TESTS.some(tt => name.toLowerCase().includes(tt.toLowerCase()))) {
          testSet.add(name);
        }
      });
    });

    const availableTests = Array.from(testSet).slice(0, 6);

    const chartData = bloodReports.map(r => {
      const point: any = { date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) };
      r.analysis.testResults.forEach((t: any) => {
        if (availableTests.includes(t.name?.trim())) {
          const val = parseFloat(t.value);
          if (!isNaN(val)) point[t.name.trim()] = val;
        }
      });
      return point;
    });

    // Calculate trends
    const trends = availableTests.map(test => {
      const values = chartData.map((d: any) => d[test]).filter((v: any) => v !== undefined);
      if (values.length < 2) return { name: test, trend: "stable", change: 0 };
      const last = values[values.length - 1];
      const prev = values[values.length - 2];
      // const change = ((last - prev) / prev) * 100;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const change = ((last - avg) / avg) * 100;
      return { name: test, trend: change > 5 ? "up" : change < -5 ? "down" : "stable", change: Math.round(change) };
    });

    return { chartData, availableTests, trends };
  }, [bloodReports]);

  if (bloodReports.length < 1) {
    return (
      <div className="text-center py-16 bg-muted/40 rounded-xl">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Upload at least one blood report to see trends.</p>
        <p className="text-xs text-muted-foreground mt-1">Trends compare values across multiple blood reports over time.</p>
      </div>
    );
  }

    const getStatus = (test: string, value: number) => {
    const ranges: any = {
      Hemoglobin: { min: 16, max: 29 },
      WBC: { min: 3578, max: 13452 },
    };

    const range = ranges[test];
    if (!range) return "normal";

    if (value < range.min) return "low";
    if (value > range.max) return "high";
    return "normal";
  };

  return (
    <div className="space-y-6">
      {/* Trend Summary Cards */}
      {trends.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {trends.map(t => (
            <div key={t.name} className="bg-card border rounded-xl p-4 shadow-card">
              <p className="text-xs text-muted-foreground mb-1">{t.name}</p>
              <div className="flex items-center gap-2">
                {t.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-medical-danger" />
                ) : t.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-secondary" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-sm font-semibold ${t.trend === "up" ? "text-medical-danger" : t.trend === "down" ? "text-secondary" : "text-muted-foreground"}`}>
                  {t.change > 0 ? "+" : ""}{t.change}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t.trend === "up" ? "Increased" : t.trend === "down" ? "Decreased" : "Stable"} since last report
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && availableTests.length > 0 && (
        <div className="bg-card border rounded-xl p-6 shadow-card">
          <h3 className="font-semibold mb-4">Value Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {availableTests.map((test, i) => (
                <Line key={test} type="monotone" dataKey={test} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
