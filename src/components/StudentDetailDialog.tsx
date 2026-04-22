import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  User, CalendarCheck, ClipboardList, DollarSign, Phone, Mail, GraduationCap,
  BookOpen, Plus, Edit2, Trash2, Check, X,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  studentName?: string;
}

const BLANK_CONTACT = { parent_name: "", email: "", phone: "" };

const Section = ({ icon: Icon, title, action, children }: {
  icon: any; title: string; action?: React.ReactNode; children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-semibold flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" /> {title}
      </h4>
      {action}
    </div>
    {children}
  </div>
);

const StudentDetailDialog = ({ open, onOpenChange, studentId, studentName }: Props) => {
  const queryClient = useQueryClient();
  const enabled = open && !!studentId;

  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(BLANK_CONTACT);
  const [addingContact, setAddingContact] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_CONTACT);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", studentId!).single();
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("status, date").eq("student_id", studentId!).order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["student-quiz-attempts", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_attempts").select("score, total_questions, completed_at").eq("student_id", studentId!).not("completed_at", "is", null).order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: fees = [] } = useQuery({
    queryKey: ["student-fees-detail", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_fees").select("term, academic_year, total_expected, total_paid, balance").eq("student_id", studentId!).order("academic_year").order("term");
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: parentContacts = [] } = useQuery({
    queryKey: ["student-parents", studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("parent_contacts").select("*").eq("student_id", studentId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["student-enrollments", studentId],
    queryFn: async () => {
      const { data: enrData, error: enrErr } = await supabase.from("enrollments").select("course_id").eq("student_id", studentId!);
      if (enrErr) throw enrErr;
      if (!enrData?.length) return [];
      const courseIds = enrData.map((e) => e.course_id);
      const { data: courses, error: cErr } = await supabase.from("courses").select("id, title, published").in("id", courseIds);
      if (cErr) throw cErr;
      return courses ?? [];
    },
    enabled,
  });

  // ── Parent contact mutations ───────────────────────────────────────────────
  const addContactMutation = useMutation({
    mutationFn: async () => {
      if (!addForm.parent_name.trim() || !addForm.email.trim()) throw new Error("Name and email are required");
      const { error } = await supabase.from("parent_contacts").insert({
        parent_name: addForm.parent_name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || null,
        student_id: studentId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-parents", studentId] });
      setAddingContact(false);
      setAddForm(BLANK_CONTACT);
      toast.success("Contact added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateContactMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!editForm.parent_name.trim() || !editForm.email.trim()) throw new Error("Name and email are required");
      const { error } = await supabase.from("parent_contacts").update({
        parent_name: editForm.parent_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-parents", studentId] });
      setEditingContactId(null);
      toast.success("Contact updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parent_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-parents", studentId] });
      toast.success("Contact removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (contact: any) => {
    setEditingContactId(contact.id);
    setEditForm({ parent_name: contact.parent_name, email: contact.email, phone: contact.phone || "" });
    setAddingContact(false);
  };

  // ── Computed stats ─────────────────────────────────────────────────────────
  const presentCount = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attPct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : null;
  const totalScore = quizAttempts.reduce((s, a) => s + (a.score ?? 0), 0);
  const totalQ = quizAttempts.reduce((s, a) => s + (a.total_questions ?? 0), 0);
  const quizPct = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : null;
  const totalExpected = fees.reduce((s, f) => s + (f.total_expected ?? 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.total_paid ?? 0), 0);
  const totalBalance = fees.reduce((s, f) => s + (f.balance ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {studentName || profile?.full_name || "Student Profile"}
          </DialogTitle>
        </DialogHeader>

        {loadingProfile ? (
          <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <div className="space-y-5">

            {/* Profile */}
            <Section icon={User} title="Profile">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile?.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-medium">{profile?.class || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={profile?.approved ? "default" : "secondary"} className="mt-0.5">
                    {profile?.approved ? "Approved" : "Pending Approval"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Created</p>
                  <p className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            </Section>

            <Separator />

            {/* Subjects */}
            <Section icon={BookOpen} title={`Enrolled Subjects (${enrollments.length})`}>
              {enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enrolled in any subjects</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {enrollments.map((c: any) => (
                    <Badge key={c.id} variant={c.published ? "secondary" : "outline"}>{c.title}</Badge>
                  ))}
                </div>
              )}
            </Section>

            <Separator />

            {/* Attendance */}
            <Section icon={CalendarCheck} title="Attendance">
              {attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance records</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Progress value={attPct ?? 0} className="flex-1 h-2.5" />
                    <span className="text-sm font-semibold w-12 text-right">{attPct}%</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{presentCount} present</span>
                    <span>{attendance.filter((a) => a.status === "absent").length} absent</span>
                    <span>{attendance.filter((a) => a.status === "late").length} late</span>
                    <span className="text-foreground font-medium">{attendance.length} total</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {attendance.slice(0, 20).map((a, i) => (
                      <div
                        key={i}
                        className={`h-3 w-3 rounded-sm ${a.status === "present" ? "bg-green-500" : a.status === "late" ? "bg-amber-400" : "bg-destructive"}`}
                        title={`${a.date}: ${a.status}`}
                      />
                    ))}
                    {attendance.length > 20 && <span className="text-xs text-muted-foreground self-center ml-1">+{attendance.length - 20} more</span>}
                  </div>
                </div>
              )}
            </Section>

            <Separator />

            {/* Quiz Performance */}
            <Section icon={ClipboardList} title={`Quiz Performance (${quizAttempts.length} attempts)`}>
              {quizAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quizzes taken yet</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xl font-bold">{quizAttempts.length}</p>
                      <p className="text-xs text-muted-foreground">Attempts</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xl font-bold">{totalScore}/{totalQ}</p>
                      <p className="text-xs text-muted-foreground">Total Score</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className={`text-xl font-bold ${quizPct !== null && quizPct >= 50 ? "text-green-600" : "text-destructive"}`}>{quizPct ?? "—"}%</p>
                      <p className="text-xs text-muted-foreground">Average</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {quizAttempts.map((a, i) => {
                      const pct = a.total_questions ? Math.round(((a.score ?? 0) / a.total_questions) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm rounded border px-3 py-1.5">
                          <span className="text-muted-foreground text-xs">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}</span>
                          <span className="font-medium">{a.score ?? 0}/{a.total_questions ?? 0}</span>
                          <Badge variant={pct >= 50 ? "default" : "destructive"} className="text-xs">{pct}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            <Separator />

            {/* Fees */}
            <Section icon={DollarSign} title="Fee Summary">
              {fees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fee records</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-sm font-bold">KES {totalExpected.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Expected</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-sm font-bold text-green-600">KES {totalPaid.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Paid</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className={`text-sm font-bold ${totalBalance > 0 ? "text-destructive" : ""}`}>KES {totalBalance.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Balance</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {fees.map((f: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm rounded border px-3 py-2">
                        <span className="font-medium">{f.term}</span>
                        <span className="text-xs text-muted-foreground">{f.academic_year}</span>
                        <Badge variant={f.balance > 0 ? "destructive" : "default"} className="text-xs">
                          {f.balance > 0 ? `KES ${f.balance.toLocaleString()} due` : "Paid"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Separator />

            {/* Parent / Guardian Contacts — always visible, fully editable */}
            <Section
              icon={Phone}
              title="Parent / Guardian Contacts"
              action={
                !addingContact && (
                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={() => { setAddingContact(true); setEditingContactId(null); }}>
                    <Plus className="h-3 w-3" /> Add Contact
                  </Button>
                )
              }
            >
              <div className="space-y-3">
                {/* Add form */}
                {addingContact && (
                  <div className="rounded-lg border border-dashed p-3 space-y-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">New Contact</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Name *</Label>
                        <Input className="h-8 text-sm" value={addForm.parent_name} onChange={(e) => setAddForm((p) => ({ ...p, parent_name: e.target.value }))} placeholder="Parent / Guardian name" />
                      </div>
                      <div>
                        <Label className="text-xs">Email *</Label>
                        <Input className="h-8 text-sm" type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input className="h-8 text-sm" value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+254 7XX XXX XXX" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => addContactMutation.mutate()} disabled={addContactMutation.isPending}>
                        <Check className="h-3 w-3" /> {addContactMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => { setAddingContact(false); setAddForm(BLANK_CONTACT); }}>
                        <X className="h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Existing contacts */}
                {parentContacts.length === 0 && !addingContact && (
                  <p className="text-sm text-muted-foreground">No parent contact on file</p>
                )}
                {parentContacts.map((p: any) => (
                  <div key={p.id} className="rounded-lg border p-3 space-y-2">
                    {editingContactId === p.id ? (
                      /* Edit form */
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Name *</Label>
                            <Input className="h-8 text-sm" value={editForm.parent_name} onChange={(e) => setEditForm((f) => ({ ...f, parent_name: e.target.value }))} />
                          </div>
                          <div>
                            <Label className="text-xs">Email *</Label>
                            <Input className="h-8 text-sm" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input className="h-8 text-sm" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => updateContactMutation.mutate(p.id)} disabled={updateContactMutation.isPending}>
                            <Check className="h-3 w-3" /> {updateContactMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => setEditingContactId(null)}>
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="font-medium text-sm">{p.parent_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" /> {p.email}
                          </p>
                          {p.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" /> {p.phone}
                            </p>
                          )}
                          {p.message && <p className="text-xs italic text-muted-foreground mt-1">"{p.message}"</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => deleteContactMutation.mutate(p.id)}
                            disabled={deleteContactMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailDialog;
