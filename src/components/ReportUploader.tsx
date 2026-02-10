import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileImage, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onUploaded: () => void;
  userId?: string;
}

export default function ReportUploader({ onUploaded, userId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !userId) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("medical-reports").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Create report record
    const { data: report, error: insertError } = await supabase.from("reports").insert({
      user_id: userId,
      file_name: file.name,
      file_url: path,
      file_type: file.type,
      status: "analyzing",
      report_type: "general",
    }).select().single();

    if (insertError) {
      toast({ title: "Error", description: insertError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    setUploading(false);
    setAnalyzing(true);

    // Convert file to base64 for AI analysis
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("analyze-report", {
          body: { reportId: report.id, fileBase64: base64, fileName: file.name, fileType: file.type },
        });

        if (fnError) throw fnError;

        toast({ title: "Analysis complete", description: "Your report has been analyzed successfully." });
      } catch (err: any) {
        toast({ title: "Analysis failed", description: err.message || "Could not analyze report", variant: "destructive" });
        await supabase.from("reports").update({ status: "error" }).eq("id", report.id);
      }

      setAnalyzing(false);
      setFile(null);
      onUploaded();
    };
    reader.readAsDataURL(file);
  };

  const isImage = file?.type.startsWith("image/");

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5 text-primary" /> Upload Medical Report
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Upload any medical document — blood report, prescription, ultrasound/X-ray, or discharge summary. We'll detect the type automatically.
      </p>
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center bg-card hover:border-primary/50 transition-colors cursor-pointer"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !file && document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              {isImage ? <FileImage className="h-8 w-8 text-primary" /> : <FileText className="h-8 w-8 text-primary" />}
              <span className="font-medium">{file.name}</span>
            </div>
            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</Button>
              <Button
                size="sm"
                className="bg-gradient-hero text-primary-foreground"
                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                disabled={uploading || analyzing}
              >
                {(uploading || analyzing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {analyzing ? "Analyzing..." : uploading ? "Uploading..." : "Upload Medical Report"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">Drop your report here or click to browse</p>
            <p className="text-sm text-muted-foreground mt-1">Supports PDF, PNG, JPG — Blood reports, prescriptions, X-rays, discharge summaries</p>
          </div>
        )}
      </div>
    </div>
  );
}
