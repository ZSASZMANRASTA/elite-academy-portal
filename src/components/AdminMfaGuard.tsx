import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

type Phase = "loading" | "ok" | "enroll" | "challenge";

export const AdminMfaGuard = ({ children }: { children: React.ReactNode }) => {
  const { actualRole, signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (actualRole !== "admin") {
      setPhase("ok");
      return;
    }
    setPhase("loading");
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === "verified");
    if (!verified) {
      // need to enroll
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `admin-${Date.now()}` });
      if (error) { toast.error(error.message); return; }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setPhase("enroll");
      return;
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") {
      setFactorId(verified.id);
      setPhase("challenge");
      return;
    }
    setPhase("ok");
  };

  useEffect(() => { check(); /* eslint-disable-next-line */ }, [actualRole]);

  const verifyEnroll = async () => {
    if (!factorId) return;
    setBusy(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { setBusy(false); toast.error(chErr.message); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Two-factor authentication enabled");
    setCode("");
    await logAudit(true);
    check();
  };

  const verifyChallenge = async () => {
    if (!factorId) return;
    setBusy(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { setBusy(false); toast.error(chErr.message); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    setBusy(false);
    if (error) { await logAudit(false); toast.error("Invalid code"); return; }
    await logAudit(true);
    setCode("");
    check();
  };

  const logAudit = async (success: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from("admin_login_audit").insert({
      user_id: user.id,
      email: user.email,
      event: success ? "mfa_verified" : "mfa_failed",
      success,
      mfa_used: true,
      user_agent: navigator.userAgent,
    });
  };

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "ok") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center mt-2">
            {phase === "enroll" ? "Set up two-factor authentication" : "Verify your identity"}
          </CardTitle>
          <CardDescription className="text-center">
            {phase === "enroll"
              ? "Admin accounts must enable 2FA. Scan the QR code with Google Authenticator, Authy, or any TOTP app."
              : "Enter the 6-digit code from your authenticator app to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "enroll" && qr && (
            <div className="space-y-3">
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <img src={qr} alt="MFA QR code" className="h-48 w-48" />
              </div>
              {secret && (
                <div className="text-xs text-muted-foreground">
                  Or enter this key manually: <code className="break-all rounded bg-muted px-1.5 py-0.5">{secret}</code>
                </div>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="code">6-digit code</Label>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center text-2xl tracking-widest"
            />
          </div>
          <Button
            onClick={phase === "enroll" ? verifyEnroll : verifyChallenge}
            disabled={busy || code.length !== 6}
            className="w-full"
          >
            {busy ? "Verifying…" : phase === "enroll" ? "Enable 2FA" : "Verify"}
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMfaGuard;
