import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Trophy, Clock, CalendarCheck, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DashboardHome = () => {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (role === "student") {
        const [enrollments, attempts, attendance, fees] = await Promise.all([
          supabase.from("enrollments").select("id, course_id, courses(title)").eq("student_id", user.id),
          supabase.from("quiz_attempts").select("score, total_questions, completed_at").eq("student_id", user.id).order("completed_at", { ascending: false }).limit(5),
          supabase.from("attendance").select("id, status").eq("student_id", user.id),
          supabase.from("student_fees").select("total_expected, total_paid, balance").eq("student_id", user.id),
        ]);
        const attendanceRecords = attendance.data ?? [];
        const presentCount = attendanceRecords.filter(a => a.status === "present" || a.status === "late").length;
        const attendancePercentage = attendanceRecords.length > 0
          ? Math.round((presentCount / attendanceRecords.length) * 100)
          : 0;
        const feeData = fees.data?.[0];
        setStats({
          enrolledCourses: enrollments.data?.length ?? 0,
          recentQuizzes: attempts.data ?? [],
          attendancePercentage,
          totalAttendance: attendanceRecords.length,
          feesBalance: feeData?.balance ?? 0,
          feesPaid: feeData?.total_paid ?? 0,
          feesExpected: feeData?.total_expected ?? 0,
        });
      } else if (role === "teacher") {
        const [courses, enrollments] = await Promise.all([
          supabase.from("courses").select("id").eq("teacher_id", user.id),
          supabase.from("enrollments").select("id"),
        ]);
        setStats({
          totalCourses: courses.data?.length ?? 0,
          totalStudents: enrollments.data?.length ?? 0,
        });
      } else if (role === "admin") {
        const [profiles, courses, enrollments] = await Promise.all([
          supabase.from("profiles").select("id"),
          supabase.from("courses").select("id"),
          supabase.from("enrollments").select("id"),
        ]);
        setStats({
          totalUsers: profiles.data?.length ?? 0,
          totalCourses: courses.data?.length ?? 0,
          totalEnrollments: enrollments.data?.length ?? 0,
        });
      }
      setLoading(false);
    };
    load();
  }, [user, role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Welcome, {profile?.full_name || "User"} 👋
        </h1>
        <p className="text-muted-foreground capitalize">{role} Dashboard</p>
      </div>

      {role === "student" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.enrolledCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentQuizzes?.length ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Attendance</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.attendancePercentage}%</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.totalAttendance} sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {stats?.feesBalance?.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Balance due</span>
                  <Badge variant={stats?.feesBalance > 0 ? "destructive" : "default"} className="text-xs">
                    {stats?.feesBalance > 0 ? "Arrears" : "Paid"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.recentQuizzes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Quiz Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentQuizzes.map((attempt: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(attempt.completed_at).toLocaleDateString()}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        {attempt.score}/{attempt.total_questions}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {role === "teacher" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCourses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCourses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEnrollments}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
