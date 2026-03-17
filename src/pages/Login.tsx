import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, ShieldCheck, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("student");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email");
  };

  const roleInfo = [
    { value: "student", label: "Student", icon: BookOpen, desc: "Access courses, quizzes & assignments" },
    { value: "teacher", label: "Teacher", icon: Users, desc: "Manage courses, materials & grading" },
    { value: "admin", label: "Admin", icon: ShieldCheck, desc: "Full access — users, analytics & oversight" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your Adam's Junior account</p>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role indicator */}
            <div>
              <Label className="mb-2 block">I am signing in as</Label>
              <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-3 gap-2">
                {roleInfo.map((r) => (
                  <label
                    key={r.value}
                    htmlFor={`role-${r.value}`}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                      selectedRole === r.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value={r.value} id={`role-${r.value}`} className="sr-only" />
                    <r.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{r.label}</span>
                  </label>
                ))}
              </RadioGroup>
              <p className="mt-1.5 text-xs text-muted-foreground text-center">
                {roleInfo.find((r) => r.value === selectedRole)?.desc}
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@adamsjunior.ac.ke" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-end text-sm">
              <button type="button" onClick={handleForgotPassword} className="text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : `Sign In as ${roleInfo.find((r) => r.value === selectedRole)?.label}`}
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
