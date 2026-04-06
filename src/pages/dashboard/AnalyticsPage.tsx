import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, ClipboardList, Trophy, FileText } from "lucide-react";

const AnalyticsPage = () => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (role === "admin") {
        const [profiles, courses, enrollments, quizAttempts, assignments] = await Promise.all([
          supabase.from("profiles").select("id, approved"),
          supabase.from("courses").select("id, published"),
          supabase.from("enrollments").select("id"),
          supabase.from("quiz_attempts").select("id, score, total_questions").not("completed_at", "is", null),
          supabase.from("assignments").select("id"),
        ]);
        const pending = profiles.data?.filter((p) => !p.approved).length ?? 0;
        const avgScore = quizAttempts.data?.length
          ? Math.round(quizAttempts.data.reduce((sum, a) => sum + ((a.score ?? 0) / (a.total_questions ?? 1)) * 100, 0) / quizAttempts.data.length)
          : 0;
        setStats({
          totalUsers: profiles.data?.length ?? 0,
          pendingApprovals: pending,
          totalCourses: courses.data?.length ?? 0,
          publishedCourses: courses.data?.filter((c) => c.published).length ?? 0,
          totalEnrollments: enrollments.data?.length ?? 0,
          quizzesTaken: quizAttempts.data?.length ?? 0,
          avgQuizScore: avgScore,
          totalAssignments: assignments.data?.length ?? 0,
        });
      } else {
        const [courses, enrollments, attempts] = await Promise.all([
          supabase.from("courses").select("id").eq("teacher_id", user.id),
          supabase.from("enrollments").select("id"),
          supabase.from("quiz_attempts").select("id, score, total_questions").not("completed_at", "is", null),
        ]);
        const avgScore = attempts.data?.length
          ? Math.round(attempts.data.reduce((sum, a) => sum + ((a.score ?? 0) / (a.total_questions ?? 1)) * 100, 0) / attempts.data.length)
          : 0;
        setStats({
          myCourses: courses.data?.length ?? 0,
          totalStudents: enrollments.data?.length ?? 0,
          quizzesTaken: attempts.data?.length ?? 0,
          avgQuizScore: avgScore,
        });
      }
      setLoading(false);
    };
    load();
  }, [user, role]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}</div></div>;

  const cards = role === "admin"
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users },
        { label: "Pending Approvals", value: stats.pendingApprovals, icon: Users },
        { label: "Total Subjects", value: stats.totalCourses, icon: BookOpen },
        { label: "Published Subjects", value: stats.publishedCourses, icon: BookOpen },
        { label: "Enrollments", value: stats.totalEnrollments, icon: ClipboardList },
        { label: "Quizzes Taken", value: stats.quizzesTaken, icon: Trophy },
        { label: "Avg Quiz Score", value: `${stats.avgQuizScore}%`, icon: Trophy },
        { label: "Assignments", value: stats.totalAssignments, icon: FileText },
      ]
    : [
        { label: "My Courses", value: stats.myCourses, icon: BookOpen },
        { label: "Total Students", value: stats.totalStudents, icon: Users },
        { label: "Quizzes Taken", value: stats.quizzesTaken, icon: Trophy },
        { label: "Avg Quiz Score", value: `${stats.avgQuizScore}%`, icon: Trophy },
      ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{card.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsPage;
