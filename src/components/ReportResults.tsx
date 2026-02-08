import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, CheckCircle, AlertCircle, Pill, Stethoscope, Volume2, Download, Shield } from "lucide-react";
import { motion } from "framer-motion";

interface Report {
  id: string;
  file_name: string;
  status: string;
  analysis: any;
  created_at: string;
}

const riskStyles = {
  low: { gradient: "from-medical-success/10 to-medical-success/5", border: "border-medical-success/30", icon: CheckCircle, color: "text-medical-success", label: "Low Risk" },
  medium: { gradient: "from-medical-warning/10 to-medical-warning/5", border: "border-medical-warning/30", icon: AlertTriangle, color: "text-medical-warning", label: "Medium Risk" },
  high: { gradient: "from-medical-danger/10 to-medical-danger/5", border: "border-medical-danger/30", icon: AlertCircle, color: "text-medical-danger", label: "High Risk" },
};

export default function ReportResults({ report, onBack }: { report: Report; onBack: () => void }) {
  const a = report.analysis;

  if (!a || report.status !== "completed") {
    return (
      <div>
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        <div className="text-center py-16 text-muted-foreground">
          {report.status === "analyzing" ? "Report is still being analyzed…" : "Analysis not available."}
        </div>
      </div>
    );
  }

  const risk = a.riskLevel as keyof typeof riskStyles;
  const style = riskStyles[risk] || riskStyles.low;
  const RiskIcon = style.icon;

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports</Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{report.file_name}</h1>
        <p className="text-sm text-muted-foreground">Analyzed on {new Date(report.created_at).toLocaleDateString()}</p>
      </motion.div>

      {/* Risk Badge */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className={`bg-gradient-to-r ${style.gradient} border ${style.border} rounded-xl p-5 flex items-center gap-4`}>
        <RiskIcon className={`h-10 w-10 ${style.color}`} />
        <div>
          <p className={`text-lg font-bold ${style.color}`}>{style.label}</p>
          <p className="text-sm text-muted-foreground">{a.riskExplanation || "Based on your report values."}</p>
        </div>
      </motion.div>

      {/* Summary */}
      <Section title="Summary" icon={<Stethoscope className="h-5 w-5 text-primary" />} onSpeak={() => speak(a.summary)}>
        <p className="text-foreground leading-relaxed">{a.summary}</p>
        {a.keyFindings?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {a.keyFindings.map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{f}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Test Results */}
      {a.testResults?.length > 0 && (
        <Section title="Test Results Explained" icon={<AlertTriangle className="h-5 w-5 text-medical-warning" />}>
          <div className="space-y-3">
            {a.testResults.map((t: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${t.abnormal ? "bg-medical-danger/5 border-medical-danger/20" : "bg-muted/40"}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium">{t.name}</span>
                  <span className={`text-sm font-mono ${t.abnormal ? "text-medical-danger font-bold" : "text-muted-foreground"}`}>
                    {t.value} {t.unit && <span className="text-xs">({t.unit})</span>}
                  </span>
                </div>
                {t.referenceRange && <p className="text-xs text-muted-foreground mt-1">Normal: {t.referenceRange}</p>}
                <p className="text-sm mt-2">{t.explanation}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Medicines */}
      {a.medicines?.length > 0 && (
        <Section title="Medicines" icon={<Pill className="h-5 w-5 text-secondary" />}>
          <div className="space-y-3">
            {a.medicines.map((m: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-muted/40 border">
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground mt-1"><strong>Purpose:</strong> {m.purpose}</p>
                <p className="text-sm text-muted-foreground"><strong>Usage:</strong> {m.usage}</p>
                {m.sideEffects && <p className="text-sm text-muted-foreground"><strong>Side Effects:</strong> {m.sideEffects}</p>}
                {m.warning && <p className="text-sm text-medical-danger mt-1">⚠️ {m.warning}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Doctor Questions */}
      {a.doctorQuestions?.length > 0 && (
        <Section title="Questions for Your Doctor" icon={<Stethoscope className="h-5 w-5 text-primary" />}>
          <ol className="space-y-2">
            {a.doctorQuestions.map((q: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Disclaimer */}
      <div className="bg-accent/50 rounded-xl p-5 border border-primary/10 flex gap-3">
        <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> This is an AI-generated interpretation and does NOT constitute medical diagnosis or treatment advice. Always consult a qualified medical professional.
        </p>
      </div>
    </div>
  );
}

function Section({ title, icon, children, onSpeak }: { title: string; icon: React.ReactNode; children: React.ReactNode; onSpeak?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border rounded-xl p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">{icon}{title}</h3>
        {onSpeak && (
          <Button variant="ghost" size="sm" onClick={onSpeak}><Volume2 className="h-4 w-4 mr-1" /> Listen</Button>
        )}
      </div>
      {children}
    </motion.div>
  );
}
