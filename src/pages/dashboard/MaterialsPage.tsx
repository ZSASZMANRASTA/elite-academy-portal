import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FileText, Video, Trash2, Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const MaterialsPage = () => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [lessons, setLessons] = useState<Tables<"lessons">[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: "", course_id: "", video_url: "", type: "pdf" as "pdf" | "video" });

  const isTeacher = role === "teacher" || role === "admin";

  useEffect(() => {
    const load = async () => {
      const courseQuery = isTeacher
        ? supabase.from("courses").select("*").eq("teacher_id", user!.id)
        : supabase.from("courses").select("*").eq("published", true);
      const [c, l] = await Promise.all([
        courseQuery,
        supabase.from("lessons").select("*").order("sort_order"),
      ]);
      setCourses(c.data ?? []);
      setLessons(l.data ?? []);
      setLoading(false);
    };
    if (user) load();
  }, [user, role]);

  const uploadMaterial = async () => {
    if (!form.title || !form.course_id) { toast.error("Title and course required"); return; }
    setUploading(true);

    let pdf_url: string | null = null;
    let video_url: string | null = null;

    if (form.type === "pdf" && fileRef.current?.files?.[0]) {
      const file = fileRef.current.files[0];
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("materials").upload(path, file);
      if (error) { toast.error(error.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
      pdf_url = urlData.publicUrl;
    } else if (form.type === "video") {
      video_url = form.video_url || null;
    }

    const { data, error } = await supabase.from("lessons").insert({
      title: form.title,
      course_id: form.course_id,
      pdf_url,
      video_url,
      sort_order: lessons.filter((l) => l.course_id === form.course_id).length,
    }).select().single();

    setUploading(false);
    if (error) { toast.error(error.message); return; }
    setLessons((prev) => [...prev, data]);
    setForm({ title: "", course_id: "", video_url: "", type: "pdf" });
    setUploadOpen(false);
    toast.success("Material uploaded");
  };

  const deleteLesson = async (id: string) => {
    await supabase.from("lessons").delete().eq("id", id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
    toast.success("Material deleted");
  };

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Materials</h1>
        {isTeacher && (
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Upload Material</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Material</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                     <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 1 Notes" /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF / Past Paper</SelectItem>
                      <SelectItem value="video">Video (YouTube/URL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.type === "pdf" ? (
                  <div><Label>File</Label><Input type="file" accept=".pdf,.doc,.docx" ref={fileRef} /></div>
                ) : (
                  <div><Label>Video URL</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></div>
                )}
                <Button onClick={uploadMaterial} className="w-full" disabled={uploading}>
                  {uploading ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {lessons.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><FileText className="h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">No materials yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {lesson.video_url ? <Video className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                  <div>
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground">{courseMap.get(lesson.course_id) ?? "Unknown Subject"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lesson.pdf_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3 mr-1" />Download</a>
                    </Button>
                  )}
                  {lesson.video_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={lesson.video_url} target="_blank" rel="noopener noreferrer"><Video className="h-3 w-3 mr-1" />Watch</a>
                    </Button>
                  )}
                  {isTeacher && (
                    <Button size="icon" variant="ghost" onClick={() => deleteLesson(lesson.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
