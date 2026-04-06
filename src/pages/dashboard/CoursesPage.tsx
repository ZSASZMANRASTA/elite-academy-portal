import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, ArrowLeft, FileText, Video, ClipboardList, PenTool, Download, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

const CoursesPage = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", published: false, class_id: "" });

  // Student detail view state
  const [selectedCourse, setSelectedCourse] = useState<Tables<"courses"> | null>(null);
  const [courseContent, setCourseContent] = useState<{
    materials: Tables<"lessons">[];
    assignments: any[];
    quizzes: Tables<"quizzes">[];
  } | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const loadClasses = async () => {
    const { data } = await supabase.from("classes").select("id, name").order("name");
    return data ?? [];
  };
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => { loadClasses().then(setClasses); }, []);

  const loadCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });
    setCourses(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCourses(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("courses").insert({
      title: form.title,
      description: form.description || null,
      subject: form.subject || null,
      published: form.published,
      teacher_id: user.id,
      class_id: form.class_id || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Subject created!");
    setForm({ title: "", description: "", subject: "", published: false, class_id: "" });
    setDialogOpen(false);
    loadCourses();
  };

  const openCourseDetail = async (course: Tables<"courses">) => {
    setSelectedCourse(course);
    setContentLoading(true);
    setCourseContent(null);

    const [materialsRes, assignmentsRes, quizzesRes] = await Promise.all([
      supabase.from("lessons").select("*").eq("course_id", course.id).order("sort_order"),
      supabase.from("assignments").select("*, assignment_submissions(id, student_id)").eq("course_id", course.id).order("due_date", { ascending: true }),
      supabase.from("quizzes").select("*").eq("course_id", course.id).eq("published", true).order("created_at", { ascending: false }),
    ]);

    setCourseContent({
      materials: materialsRes.data ?? [],
      assignments: assignmentsRes.data ?? [],
      quizzes: quizzesRes.data ?? [],
    });
    setContentLoading(false);
  };

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

  // Student detail view for a selected subject
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCourse(null); setCourseContent(null); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">{selectedCourse.title}</h1>
            {selectedCourse.subject && (
              <Badge variant="secondary" className="mt-1">{selectedCourse.subject}</Badge>
            )}
          </div>
        </div>

        {selectedCourse.description && (
          <p className="text-sm text-muted-foreground">{selectedCourse.description}</p>
        )}

        {contentLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : courseContent ? (
          <Tabs defaultValue="materials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="materials" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Materials ({courseContent.materials.length})
              </TabsTrigger>
              <TabsTrigger value="assignments" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Assignments ({courseContent.assignments.length})
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="gap-1.5">
                <PenTool className="h-3.5 w-3.5" /> Quizzes ({courseContent.quizzes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="space-y-3 mt-4">
              {courseContent.materials.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No materials uploaded yet</p>
                </CardContent></Card>
              ) : (
                courseContent.materials.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {m.video_url ? <Video className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                        <p className="font-medium text-sm">{m.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.pdf_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={m.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3 mr-1" />Download</a>
                          </Button>
                        )}
                        {m.video_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={m.video_url} target="_blank" rel="noopener noreferrer"><Video className="h-3 w-3 mr-1" />Watch</a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-3 mt-4">
              {courseContent.assignments.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-8">
                  <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No assignments yet</p>
                </CardContent></Card>
              ) : (
                courseContent.assignments.map((a: any) => {
                  const submitted = a.assignment_submissions?.some((s: any) => s.student_id === user?.id);
                  return (
                    <Card key={a.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{a.title}</p>
                            {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                            {a.due_date && (
                              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />Due: {new Date(a.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Badge variant={submitted ? "default" : "secondary"}>
                            {submitted ? "Submitted" : "Pending"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-3 mt-4">
              {courseContent.quizzes.length === 0 ? (
                <Card><CardContent className="flex flex-col items-center py-8">
                  <PenTool className="h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No quizzes available</p>
                </CardContent></Card>
              ) : (
                courseContent.quizzes.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{q.title}</p>
                          {q.description && <p className="text-sm text-muted-foreground mt-1">{q.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {q.time_limit_minutes && <Badge variant="outline">{q.time_limit_minutes} min</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Subjects</h1>
        {(role === "teacher" || role === "admin") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mathematics Form 1" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject Category</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
                </div>
                <div>
                  <Label htmlFor="class">Assign to Class</Label>
                  <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Subject description..." rows={3} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Publish immediately</Label>
                  <Switch id="published" checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={saving || !form.title.trim()}>
                  {saving ? "Creating…" : "Create Subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No subjects yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/40"
              onClick={() => openCourseDetail(course)}
            >
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
