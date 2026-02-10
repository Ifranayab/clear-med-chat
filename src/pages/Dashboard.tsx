import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Stethoscope, Upload, FileText, Activity, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReportUploader from "@/components/ReportUploader";
import ReportResults from "@/components/ReportResults";
import PatientHistory from "@/components/PatientHistory";
import TrendsView from "@/components/TrendsView";
import ProfileView from "@/components/ProfileView";
import Disclaimer from "@/components/Disclaimer";
import type { User as SupaUser } from "@supabase/supabase-js";

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

type Tab = "upload" | "history" | "trends" | "profile";

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "history", label: "History", icon: FileText },
  { key: "trends", label: "Trends", icon: Activity },
  { key: "profile", label: "Profile", icon: User },
];

export default function Dashboard() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("upload");
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
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setReports(data as Report[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchReports();
  }, [user, fetchReports]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSelectReport = (r: Report) => {
    setSelectedReport(r);
  };

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <main className="container py-8 max-w-5xl">
          <ReportResults report={selectedReport} onBack={() => setSelectedReport(null)} />
        </main>
        <Disclaimer className="container max-w-5xl mb-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container py-6 max-w-5xl">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl mb-8 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                  active ? "bg-card shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "upload" && (
          <div className="space-y-8">
            <ReportUploader onUploaded={fetchReports} userId={user?.id} />
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Recent Reports
              </h2>
              <PatientHistory reports={reports.slice(0, 4)} loading={loading} onSelect={handleSelectReport} />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Patient History
            </h2>
            <PatientHistory reports={reports} loading={loading} onSelect={handleSelectReport} />
          </div>
        )}

        {activeTab === "trends" && (
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Blood Report Trends
            </h2>
            <TrendsView reports={reports} />
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileView user={user} reportCount={reports.length} onLogout={handleLogout} />
        )}

        <Disclaimer className="mt-10" />
      </main>
    </div>
  );
}

function Header({ user }: { user: SupaUser | null }) {
  return (
    <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">MediExplain AI</span>
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
      </div>
    </header>
  );
}
