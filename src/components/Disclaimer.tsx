import { Shield } from "lucide-react";

export default function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-accent/50 rounded-xl p-4 border border-primary/10 flex gap-3 items-start ${className}`}>
      <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">Disclaimer:</strong> This application does NOT provide medical diagnosis or treatment. Always consult a qualified doctor.
      </p>
    </div>
  );
}
