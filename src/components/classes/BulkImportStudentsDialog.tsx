import { useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
}

interface RowParsed {
  student_id: string;
  first_name: string;
  second_name: string;
}

interface RowResult {
  student_id: string;
  full_name: string;
  status: "created" | "updated" | "error";
  message?: string;
}

const EMAIL_DOMAIN = "students.adamsjunior.local";

const normalizeKey = (k: string) =>
  k.toLowerCase().replace(/[\s_-]/g, "");

const pickField = (row: Record<string, any>, candidates: string[]): string => {
  const map: Record<string, any> = {};
  Object.keys(row).forEach((k) => (map[normalizeKey(k)] = row[k]));
  for (const c of candidates) {
    const v = map[normalizeKey(c)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
};

const BulkImportStudentsDialog = ({ open, onOpenChange, classId, className }: Props) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<RowParsed[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<RowResult[]>([]);
  const [defaultPassword, setDefaultPassword] = useState("Student@2026");

  const reset = () => {
    setFile(null);
    setRows([]);
    setParseError(null);
    setResults([]);
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setParseError(null);
    setResults([]);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!json.length) throw new Error("File is empty");

      const parsed: RowParsed[] = json.map((r) => ({
        student_id: pickField(r, ["student id", "studentid", "id", "adm", "admission no", "admno"]),
        first_name: pickField(r, ["first name", "firstname", "fname", "given name"]),
        second_name: pickField(r, ["second name", "secondname", "last name", "lastname", "surname", "sname"]),
      })).filter((r) => r.student_id);

      if (!parsed.length) throw new Error("No valid rows found. Required columns: Student ID, First Name, Second Name");
      setRows(parsed);
    } catch (e: any) {
      setParseError(e.message || "Failed to parse file");
      setRows([]);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Student ID": "ADM001", "First Name": "Jane", "Second Name": "Doe" },
      { "Student ID": "ADM002", "First Name": "John", "Second Name": "Smith" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student-import-template.xlsx");
  };

  const runImport = async () => {
    setImporting(true);
    const out: RowResult[] = [];

    for (const row of rows) {
      const full_name = `${row.first_name} ${row.second_name}`.trim() || row.student_id;
      try {
        // Check if a profile with this student_id already exists
        const { data: existing } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("student_id", row.student_id)
          .maybeSingle();

        let userId: string;

        if (existing) {
          userId = existing.id;
          // Update profile + ensure enrollment in this class + sync class label
          await supabase
            .from("profiles")
            .update({ full_name, class: className })
            .eq("id", userId);

          const { data: enr } = await supabase
            .from("class_enrollments")
            .select("id")
            .eq("student_id", userId)
            .eq("class_id", classId)
            .maybeSingle();
          if (!enr) {
            // remove other enrollments to keep one class
            await supabase.from("class_enrollments").delete().eq("student_id", userId);
            await supabase.from("class_enrollments").insert({ student_id: userId, class_id: classId });
          }
          out.push({ student_id: row.student_id, full_name, status: "updated" });
        } else {
          // Create a fresh auth user via signUp (no admin endpoint available client-side)
          const tempClient = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
          );
          const email = `${row.student_id.toLowerCase().replace(/[^a-z0-9]/g, "")}@${EMAIL_DOMAIN}`;
          const { data: signUp, error: signErr } = await tempClient.auth.signUp({
            email,
            password: defaultPassword,
            options: { data: { full_name, role: "student" } },
          });
          if (signErr) throw signErr;
          if (!signUp.user) throw new Error("No user returned");
          userId = signUp.user.id;

          // Update profile with student_id and class label
          await supabase
            .from("profiles")
            .update({ student_id: row.student_id, full_name, class: className })
            .eq("id", userId);

          await supabase.from("class_enrollments").insert({ student_id: userId, class_id: classId });

          out.push({ student_id: row.student_id, full_name, status: "created" });
        }
      } catch (e: any) {
        out.push({ student_id: row.student_id, full_name, status: "error", message: e.message });
      }
    }

    setResults(out);
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["class-students"] });
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    const created = out.filter((r) => r.status === "created").length;
    const updated = out.filter((r) => r.status === "updated").length;
    const errors = out.filter((r) => r.status === "error").length;
    toast.success(`${created} created · ${updated} updated · ${errors} errors`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Students — {className}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with columns: <strong>Student ID</strong>, <strong>First Name</strong>, <strong>Second Name</strong>.
            Existing students (matched by Student ID) will be updated; new ones get accounts created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1">
            <Download className="h-3.5 w-3.5" /> Download template (.xlsx)
          </Button>

          <div className="space-y-2">
            <Label>Default password for new accounts</Label>
            <Input
              value={defaultPassword}
              onChange={(e) => setDefaultPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
            <p className="text-xs text-muted-foreground">
              New students sign in with email <code>&lt;studentid&gt;@{EMAIL_DOMAIN}</code> and this password. They should change it after first login.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Choose file</Label>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {rows.length > 0 && !results.length && (
            <>
              <div className="rounded-lg border max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Student ID</th>
                      <th className="text-left p-2">First Name</th>
                      <th className="text-left p-2">Second Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono text-xs">{r.student_id}</td>
                        <td className="p-2">{r.first_name}</td>
                        <td className="p-2">{r.second_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">{rows.length} row(s) ready to import.</p>
              <Button onClick={runImport} disabled={importing || defaultPassword.length < 6} className="w-full gap-2">
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4" /> Import {rows.length} students</>}
              </Button>
            </>
          )}

          {results.length > 0 && (
            <div className="rounded-lg border max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2"><span className="font-mono text-xs mr-2">{r.student_id}</span>{r.full_name}</td>
                      <td className="p-2">
                        {r.status === "error" ? (
                          <span className="text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {r.message}</span>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1 capitalize"><CheckCircle2 className="h-3 w-3" /> {r.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportStudentsDialog;
