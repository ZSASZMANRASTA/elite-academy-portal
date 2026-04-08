import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ClipboardList, Calendar, MessageSquare, Upload } from "lucide-react";

const AssignmentsPage = () => {
  const { user, role } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submitOpen, setSubmitOpen] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: "", description: "", course_id: "", due_date: "" });
  const [feedbackForm, setFeedbackForm] = useState<{ id: string; feedback: string; grade: string } | null>(null);

  const isTeacher = role === "teacher" || role === "admin";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      if (isTeacher) {
        const [c, a] = await Promise.all([
          supabase.from("courses").select("*").eq("teacher_id", user.id),
          supabase.from("assignments").select("*, courses(title)").eq("teacher_id", user.id).order("created_at", { ascending: false }),
        ]);
        setCourses(c.data ?? []);
        setAssignments(a.data ?? []);
      } else {
        const { data } = await supabase.from("assignments").select("*, courses!inner(title, published)").eq("courses.published", true).order("due_date", { ascending: true });
        setAssignments(data ?? []);
      }
      setLoading(false);
    };
    load();
  }, [user, role]);

  const createAssignment = async () => {
    if (!form.title || !form.course_id) { toast.error("Title and course required"); return; }
    const { data, error } = await supabase.from("assignments").insert({
      title: form.title,
      description: form.description || null,
      course_id: form.course_id,
      teacher_id: user!.id,
      due_date: form.due_date || null,
    }).select("*, courses(title)").single();
    if (error) { toast.error(error.message); return; }
    setAssignments((prev) => [data, ...prev]);
    setForm({ title: "", description: "", course_id: "", due_date: "" });
    setCreateOpen(false);
    toast.success("Assignment created");
  };

  const loadSubmissions = async (assignmentId: string) => {
    setSubmissionsOpen(assignmentId);
    const { data } = await supabase.from("assignment_submissions").select("*").eq("assignment_id", assignmentId).order("submitted_at", { ascending: false });
    const studentIds = [...new Set((data ?? []).map((s) => s.student_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", studentIds);
    const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);
    setSubmissions((data ?? []).map((s) => ({ ...s, student_name: nameMap.get(s.student_id) ?? "Unknown" })));
  };

  const submitAssignment = async () => {
    if (!submitOpen) return;
    setSubmitting(true);
    let file_url: string | null = null;
    if (fileRef.current?.files?.[0]) {
      const file = fileRef.current.files[0];
      const path = `submissions/${user!.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("materials").upload(path, file);
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
      file_url = urlData.publicUrl;
    }
    const { error } = await supabase.from("assignment_submissions").insert({
      assignment_id: submitOpen,
      student_id: user!.id,
      text_response: textResponse || null,
      file_url,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSubmitOpen(null);
    setTextResponse("");
    toast.success("Assignment submitted!");
  };

  const saveFeedback = async () => {
    if (!feedbackForm) return;
    const { error } = await supabase.from("assignment_submissions")
      .update({ teacher_feedback: feedbackForm.feedback, grade: feedbackForm.grade })
      .eq("id", feedbackForm.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Feedback saved");
    setSubmissions((prev) => prev.map((s) => s.id === feedbackForm.id ? { ...s, teacher_feedback: feedbackForm.feedback, grade: feedbackForm.grade } : s));
    setFeedbackForm(null);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Assignments</h1>
        {isTeacher && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Assignment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                     <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Term 1 Project" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed instructions..." /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <Button onClick={createAssignment} className="w-full">Create Assignment</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assignments.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><ClipboardList className="h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">No assignments yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{(a.courses as any)?.title ?? "Unknown Subject"}</p>
                  {a.due_date && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />Due: {new Date(a.due_date).toLocaleDateString()}
                    </div>
                  )}
                  {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {isTeacher ? (
                    <Button size="sm" variant="outline" onClick={() => loadSubmissions(a.id)}>View Submissions</Button>
                  ) : (
                    <Button size="sm" onClick={() => setSubmitOpen(a.id)} className="gap-2"><Upload className="h-3 w-3" />Submit</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Submit Dialog */}
      <Dialog open={!!submitOpen} onOpenChange={() => setSubmitOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Your Response</Label><Textarea value={textResponse} onChange={(e) => setTextResponse(e.target.value)} placeholder="Write your response..." className="min-h-[120px]" /></div>
            <div><Label>Attach File (optional)</Label><Input type="file" accept=".pdf,.doc,.docx,.jpg,.png" ref={fileRef} /></div>
            <Button onClick={submitAssignment} className="w-full" disabled={submitting}>{submitting ? "Submitting…" : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Teacher View Submissions Dialog */}
      <Dialog open={!!submissionsOpen} onOpenChange={() => { setSubmissionsOpen(null); setFeedbackForm(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submissions</DialogTitle></DialogHeader>
          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{s.student_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</p>
                      </div>
                      {s.grade && <Badge>{s.grade}</Badge>}
                    </div>
                    {s.text_response && <p className="text-sm bg-muted rounded p-3">{s.text_response}</p>}
                    {s.file_url && (
                      <Button size="sm" variant="outline" asChild><a href={s.file_url} target="_blank" rel="noopener noreferrer">View File</a></Button>
                    )}
                    {s.teacher_feedback && <p className="text-sm border-l-2 border-primary pl-3 mt-2">💬 {s.teacher_feedback}</p>}
                    <Button size="sm" variant="outline" onClick={() => setFeedbackForm({ id: s.id, feedback: s.teacher_feedback || "", grade: s.grade || "" })}>
                      <MessageSquare className="h-3 w-3 mr-1" />{s.teacher_feedback ? "Edit Feedback" : "Give Feedback"}
                    </Button>
                    {feedbackForm?.id === s.id && (
                      <div className="space-y-2 mt-2">
                        <Input placeholder="Grade (e.g. A, B+, 85%)" value={feedbackForm!.grade} onChange={(e) => setFeedbackForm({ ...feedbackForm!, grade: e.target.value })} />
                        <Textarea placeholder="Write feedback..." value={feedbackForm!.feedback} onChange={(e) => setFeedbackForm({ ...feedbackForm!, feedback: e.target.value })} />
                        <Button size="sm" onClick={saveFeedback}>Save Feedback</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentsPage;
