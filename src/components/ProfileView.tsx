import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, Calendar, FileText } from "lucide-react";

interface Props {
  user: User | null;
  reportCount: number;
  onLogout: () => void;
}

export default function ProfileView({ user, reportCount, onLogout }: Props) {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-card border rounded-xl p-8 shadow-card text-center">
        <div className="h-20 w-20 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-primary-foreground">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <h2 className="text-xl font-bold">{user?.email}</h2>
        <p className="text-sm text-muted-foreground mt-1">Patient Account</p>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="text-sm font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Reports Uploaded</p>
            <p className="text-sm font-medium">{reportCount}</p>
          </div>
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
