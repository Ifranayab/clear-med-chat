import { FileText, Activity, Pill, Image, Loader2 } from "lucide-react";
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

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  blood: { icon: Activity, label: "Blood Report", color: "text-medical-danger" },
  prescription: { icon: Pill, label: "Prescription", color: "text-secondary" },
  imaging: { icon: Image, label: "Ultrasound / X-Ray", color: "text-primary" },
  general: { icon: FileText, label: "Clinical Report", color: "text-muted-foreground" },
};

const riskBadge: Record<string, string> = {
  low: "bg-medical-success/15 text-medical-success border-medical-success/30",
  medium: "bg-medical-warning/15 text-medical-warning border-medical-warning/30",
  high: "bg-medical-danger/15 text-medical-danger border-medical-danger/30",
};

export default function PatientHistory({ reports, loading, onSelect }: { reports: Report[]; loading: boolean; onSelect: (r: Report) => void }) {
  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
        const type = typeConfig[r.report_type] || typeConfig.general;
        const Icon = type.icon;
        const risk = r.analysis?.riskLevel || r.analysis?.severityLevel;
        const badgeClass = risk ? riskBadge[risk] || riskBadge.low : null;

        return (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border rounded-xl p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer group"
            onClick={() => onSelect(r)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${type.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
                  <p className="text-sm font-semibold truncate max-w-[180px]">{r.file_name}</p>
                </div>
              </div>
              {badgeClass && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                  {risk?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </p>
            {r.analysis?.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">{r.analysis.summary}</p>
            )}
            <p className="text-xs text-primary font-medium mt-3 group-hover:underline">View Details →</p>
          </motion.div>
        );
      })}
    </div>
  );
}
