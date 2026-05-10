import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Audit {
  id: string;
  email: string | null;
  event: string;
  success: boolean;
  mfa_used: boolean;
  user_agent: string | null;
  created_at: string;
}

export default function AdminSecurityPage() {
  const [factors, setFactors] = useState<any[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: f }, { data: a }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      (supabase as any).from("admin_login_audit").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setFactors(f?.totp ?? []);
    setAudit((a as Audit[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeFactor = async (id: string) => {
    if (!confirm("Remove this 2FA device? You'll be required to re-enroll on next sign-in.")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) toast.error(error.message);
    else { toast.success("Factor removed"); load(); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Account Security</h1>
        <p className="text-sm text-muted-foreground">Manage 2FA devices and review admin sign-in activity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Two-Factor Devices
          </CardTitle>
          <CardDescription>Authenticator apps registered to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            factors.length === 0 ? <p className="text-sm text-muted-foreground">No devices registered.</p> :
            <ul className="space-y-2">
              {factors.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{f.friendly_name || "Authenticator"}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(f.created_at).toLocaleDateString()} ·{" "}
                      <Badge variant={f.status === "verified" ? "default" : "secondary"}>{f.status}</Badge>
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeFactor(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" /> Recent Admin Activity
          </CardTitle>
          <CardDescription>Last 50 admin sign-in attempts across all admin accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{row.email}</TableCell>
                  <TableCell className="text-xs">{row.event}</TableCell>
                  <TableCell>
                    <Badge variant={row.success ? "default" : "destructive"}>
                      {row.success ? "success" : "failed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{row.user_agent}</TableCell>
                </TableRow>
              ))}
              {audit.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No activity yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
