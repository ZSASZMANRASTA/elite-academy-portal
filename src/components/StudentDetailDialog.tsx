import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, CalendarCheck, ClipboardList, DollarSign, Phone, Mail, GraduationCap, BookOpen,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  studentName?: string;
}

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-muted-foreground" /> {title}
    </h4>
    {children}
  </div>
);

const StudentDetailDialog = ({ open, onOpenChange, studentId, studentName }: Props) => {
  const enabled = open && !!studentId;

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", studentId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["student-quiz-attempts", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("score, total_questions, completed_at")
        .eq("student_id", studentId!)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: fees = [] } = useQuery({
    queryKey: ["student-fees-detail", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_fees")
        .select("term, academic_year, total_expected, total_paid, balance")
        .eq("student_id", studentId!)
        .order("academic_year")
        .order("term");
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: parentContacts = [] } = useQuery({
    queryKey: ["student-parents", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_contacts")
        .select("*")
        .eq("student_id", studentId!);
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["student-enrollments", studentId],
    queryFn: async () => {
      const { data: enrData, error: enrErr } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", studentId!);
      if (enrErr) throw enrErr;
      if (!enrData?.length) return [];

      const courseIds = enrData.map((e) => e.course_id);
      const { data: courses, error: cErr } = await supabase
        .from("courses")
        .select("id, title, published")
        .in("id", courseIds);
      if (cErr) throw cErr;
      return courses ?? [];
    },
    enabled,
  });

  // Computed stats
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
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
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
                  <p className="font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                  </p>
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
                    <Badge key={c.id} variant={c.published ? "secondary" : "outline"}>
                      {c.title}
                    </Badge>
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
                    <span className="text-foreground font-medium">{attendance.length} total sessions</span>
                  </div>
                  {/* Last 20 sessions */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {attendance.slice(0, 20).map((a, i) => {
                      const bg =
                        a.status === "present" ? "bg-green-500"
                        : a.status === "late" ? "bg-amber-400"
                        : "bg-destructive";
                      return (
                        <div
                          key={i}
                          className={`h-3 w-3 rounded-sm ${bg}`}
                          title={`${a.date}: ${a.status}`}
                        />
                      );
                    })}
                    {attendance.length > 20 && (
                      <span className="text-xs text-muted-foreground self-center ml-1">+{attendance.length - 20} more</span>
                    )}
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
                      <p className={`text-xl font-bold ${quizPct !== null && quizPct >= 50 ? "text-green-600" : "text-destructive"}`}>
                        {quizPct ?? "—"}%
                      </p>
                      <p className="text-xs text-muted-foreground">Average</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {quizAttempts.map((a, i) => {
                      const pct = a.total_questions ? Math.round(((a.score ?? 0) / a.total_questions) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-sm rounded border px-3 py-1.5">
                          <span className="text-muted-foreground text-xs">
                            {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}
                          </span>
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
                      <p className={`text-sm font-bold ${totalBalance > 0 ? "text-destructive" : ""}`}>
                        KES {totalBalance.toLocaleString()}
                      </p>
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

            {parentContacts.length > 0 && (
              <>
                <Separator />
                <Section icon={Phone} title="Parent / Guardian">
                  <div className="space-y-3">
                    {parentContacts.map((p: any) => (
                      <div key={p.id} className="rounded-lg border p-3 space-y-1 text-sm">
                        <p className="font-medium">{p.parent_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {p.email}
                        </p>
                        {p.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {p.phone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailDialog;
