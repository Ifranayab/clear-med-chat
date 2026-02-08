import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReportUploader from "@/components/ReportUploader";
import ReportCard from "@/components/ReportCard";
import type { User } from "@supabase/supabase-js";

interface Report {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  status: string;
  analysis: any;
  created_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (!error && data) setReports(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchReports();
  }, [user, fetchReports]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">MediExplain AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-1" /> Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-5xl">
        {selectedReport ? (
          <ReportResults report={selectedReport} onBack={() => setSelectedReport(null)} />
        ) : (
          <>
            <ReportUploader onUploaded={fetchReports} userId={user?.id} />

            <div className="mt-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Your Reports
              </h2>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12 bg-muted/40 rounded-xl">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No reports yet. Upload your first medical report above.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {reports.map(r => (
                    <ReportCard key={r.id} report={r} onClick={() => setSelectedReport(r)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Inline results component
import ReportResults from "@/components/ReportResults";
