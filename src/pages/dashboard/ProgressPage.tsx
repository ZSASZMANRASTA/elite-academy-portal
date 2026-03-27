import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, BookOpen, ClipboardList, CalendarCheck } from "lucide-react";

const ProgressPage = () => {
  const { user } = useAuth();

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : (
                students.map((s: any) => {
                  const att = attendanceStats[s.id as string] as { total: number; present: number } | undefined;
                  const attPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
                  const quiz = quizStats[s.id as string] as { attempts: number; totalScore: number; totalQ: number } | undefined;
                  const quizPct = quiz && quiz.totalQ > 0 ? Math.round((quiz.totalScore / quiz.totalQ) * 100) : null;

                  return (
                    <TableRow key={s.id}>
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
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPage;
