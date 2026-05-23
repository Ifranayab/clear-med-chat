import { FileText, Activity, Pill, Image, FlaskConical, Stethoscope, Bone, Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Report {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  status: string;
  analysis: any;
  report_type: string;
  created_at: string;
}

// ─── Type config ────────────────────────────────────────────────────────────
// Add new report types here without touching any other logic.
// "default" is the guaranteed fallback — it must always exist.
const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  blood:        { icon: Activity,     label: "Blood Report",     color: "text-medical-danger"   },
  prescription: { icon: Pill,         label: "Prescription",     color: "text-secondary"        },
  imaging:      { icon: Image,        label: "Ultrasound / X-Ray", color: "text-primary"        },
  xray:         { icon: Bone,         label: "X-Ray",            color: "text-primary"          },
  ecg:          { icon: Heart,        label: "ECG / EKG",        color: "text-medical-danger"   },
  pathology:    { icon: FlaskConical, label: "Pathology",        color: "text-secondary"        },
  consultation: { icon: Stethoscope,  label: "Consultation",     color: "text-muted-foreground" },
  general:      { icon: FileText,     label: "Clinical Report",  color: "text-muted-foreground" },
  default:      { icon: FileText,     label: "Medical Report",   color: "text-muted-foreground" },
};

function getTypeConfig(reportType: string) {
  // exact match → known partial match → default
  if (TYPE_CONFIG[reportType]) return TYPE_CONFIG[reportType];
  const partial = Object.keys(TYPE_CONFIG).find(k => reportType?.toLowerCase().includes(k));
  return partial ? TYPE_CONFIG[partial] : TYPE_CONFIG.default;
}

// ─── Risk / severity config ──────────────────────────────────────────────────
// Ordered from most severe to least — first match wins.
// Add new levels (e.g. "critical", "normal") here.
const RISK_LEVELS: Array<{
  keys: string[];           // all aliases that map to this level
  badge: string;            // tailwind classes
  label: string;            // display text (overrides raw value if needed)
}> = [
  {
    keys: ["critical", "severe"],
    badge: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    label: "CRITICAL",
  },
  {
    keys: ["high", "danger", "abnormal"],
    badge: "bg-medical-danger/15 text-medical-danger border-medical-danger/30",
    label: "HIGH",
  },
  {
    keys: ["medium", "moderate", "warning"],
    badge: "bg-medical-warning/15 text-medical-warning border-medical-warning/30",
    label: "MEDIUM",
  },
  {
    keys: ["low", "normal", "healthy"],
    badge: "bg-medical-success/15 text-medical-success border-medical-success/30",
    label: "NORMAL",
  },
];

function getRiskConfig(rawLevel?: string) {
  if (!rawLevel) return null;
  const lower = rawLevel.toLowerCase().trim();
  const match = RISK_LEVELS.find(r => r.keys.includes(lower));
  // Unknown level: still render a neutral badge rather than silently hiding it
  if (!match) {
    return {
      badge: "bg-muted/40 text-muted-foreground border-border",
      label: rawLevel.toUpperCase(),
    };
  }
  return match;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PatientHistory({
  reports,
  loading,
  onSelect,
}: {
  reports: Report[];
  loading: boolean;
  onSelect: (r: Report) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/40 rounded-xl">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No reports yet. Upload your first medical report.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reports.map((r, i) => {
        const type = getTypeConfig(r.report_type);
        const Icon = type.icon;

        // Support both riskLevel and severityLevel fields, raw value preserved
        const rawRisk = r.analysis?.riskLevel ?? r.analysis?.severityLevel ?? r.analysis?.risk;
        const riskConfig = getRiskConfig(rawRisk);

        // Locale-aware date, falls back to ISO string if parsing fails
        const dateLabel = (() => {
          try {
            return new Date(r.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          } catch {
            return r.created_at;
          }
        })();

        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border rounded-xl p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer group"
            onClick={() => onSelect(r)}
          >
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${type.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
                  {/* min-w-0 + truncate = respects flex container width, not a fixed px cap */}
                  <p className="text-sm font-semibold truncate">{r.file_name}</p>
                </div>
              </div>
              {riskConfig && (
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${riskConfig.badge}`}
                >
                  {riskConfig.label}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-2">{dateLabel}</p>

            {r.analysis?.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">{r.analysis.summary}</p>
            )}

            <p className="text-xs text-primary font-medium mt-3 group-hover:underline">
              View Details →
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}