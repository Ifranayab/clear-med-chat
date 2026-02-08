import { FileText, AlertTriangle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Report {
  id: string;
  file_name: string;
  status: string;
  analysis: any;
  created_at: string;
}

const riskConfig = {
  low: { label: "Low Risk", color: "text-medical-success", bg: "bg-medical-success/10", icon: CheckCircle },
  medium: { label: "Medium Risk", color: "text-medical-warning", bg: "bg-medical-warning/10", icon: AlertTriangle },
  high: { label: "High Risk", color: "text-medical-danger", bg: "bg-medical-danger/10", icon: AlertCircle },
};

export default function ReportCard({ report, onClick }: { report: Report; onClick: () => void }) {
  const risk = report.analysis?.riskLevel as keyof typeof riskConfig;
  const config = risk ? riskConfig[risk] : null;
  const RiskIcon = config?.icon;

  return (
    <button
      onClick={onClick}
      className="bg-card border rounded-xl p-5 text-left shadow-card hover:shadow-elevated transition-all w-full group"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-primary transition-colors">{report.file_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(report.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <div className="mt-2">
            {report.status === "analyzing" ? (
              <span className="inline-flex items-center gap-1 text-xs text-primary"><Loader2 className="h-3 w-3 animate-spin" /> Analyzing…</span>
            ) : report.status === "error" ? (
              <span className="inline-flex items-center gap-1 text-xs text-medical-danger"><AlertCircle className="h-3 w-3" /> Error</span>
            ) : config && RiskIcon ? (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                <RiskIcon className="h-3 w-3" /> {config.label}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}
