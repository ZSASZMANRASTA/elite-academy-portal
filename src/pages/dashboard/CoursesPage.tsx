import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

const CoursesPage = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      setCourses(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Courses</h1>
        {(role === "teacher" || role === "admin") && (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Course
          </Button>
        )}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No courses yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                {course.subject && (
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {course.subject}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description || "No description"}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs font-medium ${course.published ? "text-green-600" : "text-muted-foreground"}`}>
                    {course.published ? "Published" : "Draft"}
                  </span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
