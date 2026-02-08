import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) navigate("/dashboard");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) { toast({ title: "Error", description: emailResult.error.errors[0].message, variant: "destructive" }); return; }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) { toast({ title: "Error", description: passResult.error.errors[0].message, variant: "destructive" }); return; }

    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent a confirmation link to your email." });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Stethoscope className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">MediExplain AI</h1>
          <p className="text-muted-foreground text-sm mt-1">{isSignUp ? "Create your account" : "Welcome back"}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-xl shadow-card space-y-5 border">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button className="w-full bg-gradient-hero text-primary-foreground" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
