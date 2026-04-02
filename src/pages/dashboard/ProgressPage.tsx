import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, ClipboardList, CalendarCheck, User, Mail, GraduationCap, DollarSign, Phone } from "lucide-react";

const ProgressPage = () => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["all-students-progress"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");
      if (rolesErr) throw rolesErr;
      if (!roles.length) return [];

      const ids = roles.map((r) => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, class, approved")
        .in("id", ids);
      if (profErr) throw profErr;
      return profiles || [];
    },
    enabled: !!user,
  });

  const { data: attendanceStats = {} } = useQuery({
    queryKey: ["attendance-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("student_id, status");
      if (error) throw error;
      const stats: Record<string, { total: number; present: number }> = {};
      (data || []).forEach((a: any) => {
        if (!stats[a.student_id]) stats[a.student_id] = { total: 0, present: 0 };
        stats[a.student_id].total++;
        if (a.status === "present" || a.status === "late") stats[a.student_id].present++;
      });
      return stats;
    },
    enabled: !!user,
  });

  const { data: quizStats = {} } = useQuery({
    queryKey: ["quiz-stats-progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_attempts").select("student_id, score, total_questions").not("completed_at", "is", null);
      if (error) throw error;
      const stats: Record<string, { attempts: number; totalScore: number; totalQ: number }> = {};
      (data || []).forEach((a: any) => {
        if (!stats[a.student_id]) stats[a.student_id] = { attempts: 0, totalScore: 0, totalQ: 0 };
        stats[a.student_id].attempts++;
        stats[a.student_id].totalScore += a.score || 0;
        stats[a.student_id].totalQ += a.total_questions || 0;
      });
      return stats;
    },
    enabled: !!user,
  });

  const { data: feeStats = {} } = useQuery({
    queryKey: ["fee-stats-progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_fees").select("student_id, total_expected, total_paid, balance");
      if (error) throw error;
      const stats: Record<string, { expected: number; paid: number; balance: number }> = {};
      (data || []).forEach((f: any) => {
        if (!stats[f.student_id]) stats[f.student_id] = { expected: 0, paid: 0, balance: 0 };
        stats[f.student_id].expected += f.total_expected || 0;
        stats[f.student_id].paid += f.total_paid || 0;
        stats[f.student_id].balance += f.balance || 0;
      });
      return stats;
    },
    enabled: !!user,
  });

  const { data: enrollmentStats = {} } = useQuery({
    queryKey: ["enrollment-stats-progress"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrollments").select("student_id, course_id");
      if (error) throw error;
      const stats: Record<string, number> = {};
      (data || []).forEach((e: any) => {
        stats[e.student_id] = (stats[e.student_id] || 0) + 1;
      });
      return stats;
    },
    enabled: !!user,
  });

  const openDetail = (student: any) => {
    setSelectedStudent(student);
    setDetailOpen(true);
  };

  const getStudentDetail = (s: any) => {
    const att = attendanceStats[s.id] as { total: number; present: number } | undefined;
    const attPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
    const quiz = quizStats[s.id] as { attempts: number; totalScore: number; totalQ: number } | undefined;
    const quizPct = quiz && quiz.totalQ > 0 ? Math.round((quiz.totalScore / quiz.totalQ) * 100) : null;
    const fee = feeStats[s.id] as { expected: number; paid: number; balance: number } | undefined;
    const courses = enrollmentStats[s.id] || 0;
    return { attPct, att, quiz, quizPct, fee, courses };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student Progress Overview</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{students.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{students.filter((s: any) => s.approved).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{Object.values(quizStats).reduce((a: number, b: any) => a + b.attempts, 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance Records</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{Object.values(attendanceStats).reduce((a: number, b: any) => a + b.total, 0)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Students</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Avg Quiz Score</TableHead>
                <TableHead>Fee Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : (
                students.map((s: any) => {
                  const { attPct, quizPct, fee } = getStudentDetail(s);
                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetail(s)}
                    >
                      <TableCell className="font-medium">{s.full_name || "—"}</TableCell>
                      <TableCell>{s.class || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.approved ? "default" : "secondary"}>{s.approved ? "Approved" : "Pending"}</Badge>
                      </TableCell>
                      <TableCell>
                        {attPct !== null ? (
                          <div className="flex items-center gap-2">
                            <Progress value={attPct} className="w-16 h-2" />
                            <span className="text-sm">{attPct}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {quizPct !== null ? (
                          <span className="text-sm font-medium">{quizPct}%</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {fee ? (
                          <Badge variant={fee.balance > 0 ? "destructive" : "default"}>
                            KES {fee.balance.toLocaleString()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Student Details
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (() => {
            const { attPct, att, quiz, quizPct, fee, courses } = getStudentDetail(selectedStudent);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{selectedStudent.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Class</p>
                    <p className="font-medium">{selectedStudent.class || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={selectedStudent.approved ? "default" : "secondary"}>
                      {selectedStudent.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Enrolled Courses</p>
                    <p className="font-medium flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {courses}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4" /> Attendance
                  </h4>
                  {att && att.total > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <Progress value={attPct!} className="flex-1 h-2.5" />
                        <span className="text-sm font-medium w-12 text-right">{attPct}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{att.present} present out of {att.total} sessions</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No attendance records</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4" /> Quiz Performance
                  </h4>
                  {quiz && quiz.attempts > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-2.5 text-center">
                        <p className="text-lg font-bold">{quiz.attempts}</p>
                        <p className="text-xs text-muted-foreground">Attempts</p>
                      </div>
                      <div className="rounded-lg border p-2.5 text-center">
                        <p className="text-lg font-bold">{quiz.totalScore}/{quiz.totalQ}</p>
                        <p className="text-xs text-muted-foreground">Total Score</p>
                      </div>
                      <div className="rounded-lg border p-2.5 text-center">
                        <p className="text-lg font-bold">{quizPct}%</p>
                        <p className="text-xs text-muted-foreground">Average</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No quizzes taken</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" /> Fee Summary
                  </h4>
                  {fee ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border p-2.5 text-center">
                        <p className="text-lg font-bold">KES {fee.expected.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Expected</p>
                      </div>
                      <div className="rounded-lg border p-2.5 text-center">
                        <p className="text-lg font-bold text-green-600">KES {fee.paid.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                      <div className="rounded-lg border p-2.5 text-center">
                        <p className={`text-lg font-bold ${fee.balance > 0 ? "text-destructive" : ""}`}>
                          KES {fee.balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No fee records</p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgressPage;
