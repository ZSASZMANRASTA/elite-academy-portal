import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder — Supabase auth will replace this
    setTimeout(() => {
      setLoading(false);
      toast.info("Backend not connected yet. Enable Lovable Cloud to activate authentication.");
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your Rongai Elite account</p>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@rongaielite.ac.ke" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <button type="button" className="text-primary hover:underline">Forgot password?</button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            New student?{" "}
            <Link to="/register" className="text-primary hover:underline">Create an account</Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
