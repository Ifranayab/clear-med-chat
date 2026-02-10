import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, CheckCircle, AlertCircle, Pill, Stethoscope, Volume2, Download, Shield, Image, FileText } from "lucide-react";
import { motion } from "framer-motion";
import Disclaimer from "./Disclaimer";

interface Report {
  id: string;
  file_name: string;
  status: string;
  analysis: any;
  report_type: string;
  created_at: string;
}

const riskStyles = {
  low: { gradient: "from-medical-success/10 to-medical-success/5", border: "border-medical-success/30", icon: CheckCircle, color: "text-medical-success", label: "Low Risk" },
  medium: { gradient: "from-medical-warning/10 to-medical-warning/5", border: "border-medical-warning/30", icon: AlertTriangle, color: "text-medical-warning", label: "Medium Risk" },
  high: { gradient: "from-medical-danger/10 to-medical-danger/5", border: "border-medical-danger/30", icon: AlertCircle, color: "text-medical-danger", label: "High Risk" },
  mild: { gradient: "from-medical-success/10 to-medical-success/5", border: "border-medical-success/30", icon: CheckCircle, color: "text-medical-success", label: "Mild" },
  moderate: { gradient: "from-medical-warning/10 to-medical-warning/5", border: "border-medical-warning/30", icon: AlertTriangle, color: "text-medical-warning", label: "Moderate" },
  severe: { gradient: "from-medical-danger/10 to-medical-danger/5", border: "border-medical-danger/30", icon: AlertCircle, color: "text-medical-danger", label: "Severe" },
};

const typeLabels: Record<string, string> = {
  blood: "Blood Report",
  prescription: "Prescription",
  imaging: "Ultrasound / X-Ray",
  general: "Clinical Report",
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

  const riskKey = (a.riskLevel || a.severityLevel) as keyof typeof riskStyles;
  const style = riskStyles[riskKey] || riskStyles.low;
  const RiskIcon = style.icon;

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    const content = generateTextReport(report);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MediExplain_${report.file_name.replace(/\.[^/.]+$/, "")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports</Button>
        <Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-4 w-4 mr-1" /> Download</Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            {typeLabels[report.report_type] || "Report"}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{report.file_name}</h1>
        <p className="text-sm text-muted-foreground">Analyzed on {new Date(report.created_at).toLocaleDateString()}</p>
      </motion.div>

      {/* Detected Type Confirmation */}
      {a.detectedType && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-accent/50 rounded-lg p-3 text-sm">
          We detected this as a <strong>{typeLabels[a.detectedType] || a.detectedType}</strong>.
        </motion.div>
      )}

      {/* Risk/Severity Badge */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className={`bg-gradient-to-r ${style.gradient} border ${style.border} rounded-xl p-5 flex items-center gap-4`}>
        <RiskIcon className={`h-10 w-10 ${style.color}`} />
        <div>
          <p className={`text-lg font-bold ${style.color}`}>{style.label}</p>
          <p className="text-sm text-muted-foreground">{a.riskExplanation || a.severityExplanation || "Based on your report values."}</p>
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
        {a.keyTakeaways?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {a.keyTakeaways.map((f: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />{f}</li>
            ))}
          </ul>
        )}
      </Section>

      {/* Test Results (Blood) */}
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

      {/* Findings (Imaging) */}
      {a.findings?.length > 0 && (
        <Section title="Findings Explained" icon={<Image className="h-5 w-5 text-primary" />}>
          <div className="space-y-3">
            {a.findings.map((f: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${f.abnormal ? "bg-medical-warning/5 border-medical-warning/20" : "bg-muted/40"}`}>
                <p className="font-medium">{f.finding}</p>
                <p className="text-sm mt-1">{f.explanation}</p>
                {f.abnormal && <p className="text-xs text-medical-warning mt-1 font-medium">⚠ Abnormal finding</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Diagnosis Terms (General) */}
      {a.diagnosisTerms?.length > 0 && (
        <Section title="Diagnosis Terms Explained" icon={<FileText className="h-5 w-5 text-primary" />}>
          <div className="space-y-3">
            {a.diagnosisTerms.map((d: any, i: number) => (
              <div key={i} className="p-4 rounded-lg bg-muted/40 border">
                <p className="font-medium">{d.term}</p>
                <p className="text-sm mt-1 text-muted-foreground">{d.explanation}</p>
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
                <p className="text-sm text-muted-foreground"><strong>How to take:</strong> {m.usage}</p>
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

      <Disclaimer />
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

function generateTextReport(report: Report): string {
  const a = report.analysis;
  let text = `MediExplain AI - Simplified Report\n${"=".repeat(40)}\n`;
  text += `File: ${report.file_name}\nType: ${typeLabels[report.report_type] || "Report"}\nDate: ${new Date(report.created_at).toLocaleDateString()}\n\n`;
  text += `Risk Level: ${a.riskLevel || a.severityLevel || "N/A"}\n${a.riskExplanation || a.severityExplanation || ""}\n\n`;
  text += `SUMMARY\n${"-".repeat(20)}\n${a.summary}\n\n`;
  if (a.keyFindings?.length) text += `KEY FINDINGS\n${a.keyFindings.map((f: string) => `• ${f}`).join("\n")}\n\n`;
  if (a.testResults?.length) {
    text += `TEST RESULTS\n${"-".repeat(20)}\n`;
    a.testResults.forEach((t: any) => { text += `${t.name}: ${t.value} ${t.unit || ""} ${t.abnormal ? "(ABNORMAL)" : ""}\n  ${t.explanation}\n\n`; });
  }
  if (a.medicines?.length) {
    text += `MEDICINES\n${"-".repeat(20)}\n`;
    a.medicines.forEach((m: any) => { text += `${m.name}\n  Purpose: ${m.purpose}\n  Usage: ${m.usage}\n${m.warning ? `  ⚠ ${m.warning}\n` : ""}\n`; });
  }
  if (a.doctorQuestions?.length) text += `QUESTIONS FOR YOUR DOCTOR\n${a.doctorQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}\n\n`;
  text += `\nDISCLAIMER: This does NOT provide medical diagnosis. Always consult a qualified doctor.`;
  return text;
}
