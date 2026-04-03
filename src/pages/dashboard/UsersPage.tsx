import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, Users, Mail, BookOpen, ClipboardCheck, DollarSign, GraduationCap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UserWithRole {
  id: string;
  full_name: string;
  approved: boolean;
  created_at: string;
  class: string | null;
  subject: string | null;
  role?: string;
}

interface UserDetail {
  attendanceSummary: { total: number; present: number; absent: number; late: number };
  quizAttempts: { count: number; avgScore: number };
  lessonsCompleted: number;
  feeBalance: number;
  parentContacts: { parent_name: string; email: string; phone: string | null }[];
  enrolledClasses: string[];
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, approved, created_at, class, subject")
      .order("created_at", { ascending: false });

    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
    const combined = (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? "student" }));
    setUsers(combined);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleApproval = async (userId: string, currentlyApproved: boolean) => {
    const { error } = await supabase.from("profiles").update({ approved: !currentlyApproved }).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(currentlyApproved ? "User unapproved" : "User approved");
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, approved: !currentlyApproved } : u));
  };

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Role changed to ${newRole}`);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const openUserDetail = async (user: UserWithRole) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setDetail(null);

    const [attendanceRes, quizRes, progressRes, feesRes, parentRes, enrollRes] = await Promise.all([
      supabase.from("attendance").select("status").eq("student_id", user.id),
      supabase.from("quiz_attempts").select("score, total_questions").eq("student_id", user.id).not("completed_at", "is", null),
      supabase.from("lesson_progress").select("id").eq("student_id", user.id).eq("completed", true),
      supabase.from("student_fees").select("balance").eq("student_id", user.id),
      supabase.from("parent_contacts").select("parent_name, email, phone").eq("student_id", user.id),
      supabase.from("class_enrollments").select("class_id, classes(name)").eq("student_id", user.id),
    ]);

    const att = attendanceRes.data ?? [];
    const quizzes = quizRes.data ?? [];
    const totalScore = quizzes.reduce((s, q) => s + (q.score ?? 0), 0);
    const totalQ = quizzes.reduce((s, q) => s + (q.total_questions ?? 0), 0);

    setDetail({
      attendanceSummary: {
        total: att.length,
        present: att.filter((a) => a.status === "present").length,
        absent: att.filter((a) => a.status === "absent").length,
        late: att.filter((a) => a.status === "late").length,
      },
      quizAttempts: { count: quizzes.length, avgScore: totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0 },
      lessonsCompleted: progressRes.data?.length ?? 0,
      feeBalance: (feesRes.data ?? []).reduce((s, f) => s + Number(f.balance), 0),
      parentContacts: (parentRes.data ?? []) as UserDetail["parentContacts"],
      enrolledClasses: (enrollRes.data ?? []).map((e: any) => e.classes?.name ?? "Unknown"),
    });
    setDetailLoading(false);
  };

  const filtered = filter === "all" ? users : filter === "pending" ? users.filter((u) => !u.approved) : users.filter((u) => u.role === filter);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Manage Users</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><Users className="h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">No users found</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <Card key={user.id} className="cursor-pointer transition-colors hover:border-primary/40" onClick={() => openUserDetail(user)}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.full_name || "Unnamed"}</p>
                    <Badge variant={user.approved ? "default" : "secondary"} className="text-xs">
                      {user.approved ? "Approved" : "Pending"}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                    {user.class && ` · Class: ${user.class}`}
                    {user.subject && ` · Subject: ${user.subject}`}
                  </p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant={user.approved ? "outline" : "default"} onClick={() => toggleApproval(user.id, user.approved)}>
                    {user.approved ? <><XCircle className="h-3 w-3 mr-1" />Revoke</> : <><CheckCircle className="h-3 w-3 mr-1" />Approve</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.full_name || "Unnamed"}
              <Badge variant="outline" className="capitalize text-xs">{selectedUser?.role}</Badge>
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : detail && selectedUser ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>Status</span>
                <Badge variant={selectedUser.approved ? "default" : "secondary"} className="w-fit text-xs">{selectedUser.approved ? "Approved" : "Pending"}</Badge>
                <span>Joined</span>
                <span className="text-foreground">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                {selectedUser.class && <><span>Class</span><span className="text-foreground">{selectedUser.class}</span></>}
                {selectedUser.subject && <><span>Subject</span><span className="text-foreground">{selectedUser.subject}</span></>}
                {detail.enrolledClasses.length > 0 && (
                  <><span>Enrolled Classes</span><span className="text-foreground">{detail.enrolledClasses.join(", ")}</span></>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><ClipboardCheck className="h-3.5 w-3.5" />Attendance</div>
                  <p className="text-lg font-semibold">
                    {detail.attendanceSummary.total > 0
                      ? `${Math.round((detail.attendanceSummary.present / detail.attendanceSummary.total) * 100)}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {detail.attendanceSummary.present}P · {detail.attendanceSummary.late}L · {detail.attendanceSummary.absent}A
                  </p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><GraduationCap className="h-3.5 w-3.5" />Quizzes</div>
                  <p className="text-lg font-semibold">{detail.quizAttempts.count} taken</p>
                  <p className="text-xs text-muted-foreground">Avg: {detail.quizAttempts.avgScore}%</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><BookOpen className="h-3.5 w-3.5" />Lessons</div>
                  <p className="text-lg font-semibold">{detail.lessonsCompleted}</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><DollarSign className="h-3.5 w-3.5" />Fee Balance</div>
                  <p className="text-lg font-semibold">KES {detail.feeBalance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{detail.feeBalance > 0 ? "outstanding" : "cleared"}</p>
                </Card>
              </div>

              {detail.parentContacts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Mail className="h-3.5 w-3.5" />Parent / Guardian</h4>
                    {detail.parentContacts.map((pc, i) => (
                      <div key={i} className="text-sm mb-1">
                        <span className="font-medium">{pc.parent_name}</span>
                        <span className="text-muted-foreground"> · {pc.email}{pc.phone && ` · ${pc.phone}`}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
