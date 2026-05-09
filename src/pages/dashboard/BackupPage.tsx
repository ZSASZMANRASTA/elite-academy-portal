import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, FileJson, FileSpreadsheet, AlertTriangle, Loader2, Archive } from "lucide-react";

const RESET_OPTIONS = [
  { id: "attendance", label: "Attendance records", desc: "Clear all attendance entries" },
  { id: "quiz_attempts", label: "Quiz attempts", desc: "Clear student quiz scores & answers" },
  { id: "assignment_submissions", label: "Assignment submissions", desc: "Clear submitted student work" },
  { id: "notifications", label: "Notifications", desc: "Clear all in-app notifications" },
  { id: "announcements", label: "Announcements", desc: "Unpublish all current announcements" },
];

const downloadBlob = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const toCSV = (rows: any[]): string => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

const BackupPage = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [resetTargets, setResetTargets] = useState<string[]>(["attendance", "quiz_attempts", "assignment_submissions", "notifications"]);
  const [confirmText, setConfirmText] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const callBackupFn = async (action: "backup" | "reset") => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/term-reset`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action, resetTargets }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  };

  const downloadFullBackup = async () => {
    setLoading("json");
    try {
      const data = await callBackupFn("backup");
      downloadBlob(JSON.stringify(data, null, 2), `site-backup-${today}.json`, "application/json");
      toast.success("Full backup downloaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const exportSheet = async (label: string, fetcher: () => Promise<any[]>) => {
    setLoading(label);
    try {
      const rows = await fetcher();
      if (!rows.length) { toast.info(`No ${label} to export`); return; }
      downloadBlob(toCSV(rows), `${label}-${today}.csv`, "text/csv");
      toast.success(`${label} exported (${rows.length} rows)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const exportStudents = () => exportSheet("students", async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "student");
    const ids = (roles || []).map((r: any) => r.user_id);
    if (!ids.length) return [];
    const { data } = await supabase.from("profiles").select("id, full_name, class, created_at").in("id", ids);
    return data || [];
  });

  const exportTeachers = () => exportSheet("teachers", async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
    const ids = (roles || []).map((r: any) => r.user_id);
    if (!ids.length) return [];
    const { data } = await supabase.from("profiles").select("id, full_name, subject, created_at").in("id", ids);
    return data || [];
  });

  const exportFeesSummary = () => exportSheet("fees-summary", async () => {
    const { data: fees } = await supabase.from("student_fees").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, class");
    const map = new Map((profiles || []).map((p: any) => [p.id, p]));
    return (fees || []).map((f: any) => ({
      student_name: map.get(f.student_id)?.full_name || "",
      class: map.get(f.student_id)?.class || "",
      academic_year: f.academic_year,
      term: f.term,
      total_expected: f.total_expected,
      total_paid: f.total_paid,
      balance: f.balance,
    }));
  });

  const exportPayments = () => exportSheet("payments", async () => {
    const { data } = await supabase.from("fee_payments").select("*");
    return data || [];
  });

  const exportAttendance = () => exportSheet("attendance", async () => {
    const { data: att } = await supabase.from("attendance").select("*");
    const { data: profiles } = await supabase.from("profiles").select("id, full_name");
    const map = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
    return (att || []).map((a: any) => ({
      date: a.date,
      student_name: map.get(a.student_id) || "",
      status: a.status,
      absence_reason: a.absence_reason || "",
    }));
  });

  const exportParentContacts = () => exportSheet("parent-contacts", async () => {
    const { data } = await supabase.from("parent_contacts").select("*");
    return data || [];
  });

  const performReset = async () => {
    if (confirmText !== "RESET") { toast.error("Type RESET to confirm"); return; }
    setLoading("reset");
    try {
      const data = await callBackupFn("reset");
      downloadBlob(JSON.stringify(data, null, 2), `pre-reset-backup-${today}.json`, "application/json");
      toast.success("Backup downloaded & selected data cleared");
      setConfirmText("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const sheets = [
    { key: "students", label: "Students", fn: exportStudents },
    { key: "teachers", label: "Teachers", fn: exportTeachers },
    { key: "fees-summary", label: "Fees Summary", fn: exportFeesSummary },
    { key: "payments", label: "Fee Payments", fn: exportPayments },
    { key: "attendance", label: "Attendance", fn: exportAttendance },
    { key: "parent-contacts", label: "Parent Contacts", fn: exportParentContacts },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Backup & Term Reset</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download backups regularly. Use term reset to start a fresh term — a safety backup is generated automatically before any data is cleared.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-4 w-4" /> Full Site Backup (JSON)
          </CardTitle>
          <CardDescription>
            Complete snapshot of every table. Store this file safely — it can be used to restore data if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadFullBackup} disabled={loading === "json"} className="gap-2">
            {loading === "json" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
            Download Full Backup
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4" /> Export as Spreadsheets (CSV)
          </CardTitle>
          <CardDescription>
            Open these in Excel or Google Sheets. Useful for sharing student lists, financial reports, or attendance records with the school office.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sheets.map((s) => (
            <Button key={s.key} variant="outline" onClick={s.fn} disabled={loading === s.key} className="justify-start gap-2 h-auto py-3">
              {loading === s.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {s.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" /> Start a New Term — Reset Data
          </CardTitle>
          <CardDescription>
            Selected records will be permanently cleared after a backup is downloaded. Student profiles, classes, subjects, fee structures, and site content are <strong>never</strong> touched.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {RESET_OPTIONS.map((opt) => (
              <div key={opt.id} className="flex items-start gap-3">
                <Checkbox
                  id={opt.id}
                  checked={resetTargets.includes(opt.id)}
                  onCheckedChange={(c) => setResetTargets((prev) => c ? [...prev, opt.id] : prev.filter((x) => x !== opt.id))}
                />
                <div>
                  <Label htmlFor={opt.id} className="cursor-pointer font-medium">{opt.label}</Label>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading === "reset" || resetTargets.length === 0} className="gap-2">
                {loading === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Backup & Reset Selected Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm term reset</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>You are about to clear: <strong>{resetTargets.join(", ")}</strong>.</p>
                    <p>A backup will be downloaded automatically before deletion. This action cannot be undone from the app — you will need the backup file to restore.</p>
                    <div>
                      <Label className="text-xs">Type <code className="bg-muted px-1 rounded">RESET</code> to confirm</Label>
                      <input
                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={performReset} disabled={confirmText !== "RESET"}>
                  Backup & Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupPage;
