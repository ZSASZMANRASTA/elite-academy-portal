import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Eye, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const QuizManagePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Tables<"courses">[]>([]);
  const [quizzes, setQuizzes] = useState<Tables<"quizzes">[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState<string | null>(null);
  const [attemptsOpen, setAttemptsOpen] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Tables<"quiz_questions">[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);

  // Create quiz form
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", course_id: "", time_limit_minutes: "" });

  // Question form
  const [newQuestion, setNewQuestion] = useState({ question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" });

  // Feedback form
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackAttemptId, setFeedbackAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [c, q] = await Promise.all([
        supabase.from("courses").select("*").eq("teacher_id", user.id),
        supabase.from("quizzes").select("*, courses!inner(teacher_id)").eq("courses.teacher_id", user.id),
      ]);
      setCourses(c.data ?? []);
      setQuizzes((q.data as any) ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  const createQuiz = async () => {
    if (!newQuiz.title || !newQuiz.course_id) { toast.error("Title and course are required"); return; }
    const { data, error } = await supabase.from("quizzes").insert({
      title: newQuiz.title,
      description: newQuiz.description || null,
      course_id: newQuiz.course_id,
      time_limit_minutes: newQuiz.time_limit_minutes ? parseInt(newQuiz.time_limit_minutes) : null,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setQuizzes((prev) => [data, ...prev]);
    setNewQuiz({ title: "", description: "", course_id: "", time_limit_minutes: "" });
    setCreateOpen(false);
    toast.success("Quiz created");
  };

  const togglePublish = async (quiz: Tables<"quizzes">) => {
    const { error } = await supabase.from("quizzes").update({ published: !quiz.published }).eq("id", quiz.id);
    if (error) { toast.error(error.message); return; }
    setQuizzes((prev) => prev.map((q) => q.id === quiz.id ? { ...q, published: !q.published } : q));
    toast.success(quiz.published ? "Quiz unpublished" : "Quiz published");
  };

  const loadQuestions = async (quizId: string) => {
    setQuestionsOpen(quizId);
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("sort_order");
    setQuestions(data ?? []);
  };

  const addQuestion = async () => {
    if (!questionsOpen || !newQuestion.question || newQuestion.options.some((o) => !o.trim())) {
      toast.error("Fill in the question and all options"); return;
    }
    const { data, error } = await supabase.from("quiz_questions").insert({
      quiz_id: questionsOpen,
      question: newQuestion.question,
      options: newQuestion.options,
      correct_answer: newQuestion.correct_answer,
      explanation: newQuestion.explanation || null,
      sort_order: questions.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setQuestions((prev) => [...prev, data]);
    setNewQuestion({ question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" });
    toast.success("Question added");
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from("quiz_questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.success("Question deleted");
  };

  const loadAttempts = async (quizId: string) => {
    setAttemptsOpen(quizId);
    const { data } = await supabase
      .from("quiz_attempts")
      .select("*, quiz_feedback(*)")
      .eq("quiz_id", quizId)
      .order("completed_at", { ascending: false });
    // Fetch student names
    const studentIds = [...new Set((data ?? []).map((a) => a.student_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", studentIds);
    const nameMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);
    setAttempts((data ?? []).map((a) => ({ ...a, student_name: nameMap.get(a.student_id) ?? "Unknown" })));
  };

  const submitFeedback = async () => {
    if (!feedbackAttemptId || !feedbackText.trim()) return;
    const { error } = await supabase.from("quiz_feedback").insert({
      attempt_id: feedbackAttemptId,
      teacher_id: user!.id,
      feedback: feedbackText,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Feedback sent");
    setFeedbackText("");
    setFeedbackAttemptId(null);
    if (attemptsOpen) loadAttempts(attemptsOpen);
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Quizzes</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Quiz</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Course</Label>
                <Select value={newQuiz.course_id} onValueChange={(v) => setNewQuiz({ ...newQuiz, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={newQuiz.title} onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={newQuiz.description} onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })} /></div>
              <div><Label>Time Limit (minutes, optional)</Label><Input type="number" value={newQuiz.time_limit_minutes} onChange={(e) => setNewQuiz({ ...newQuiz, time_limit_minutes: e.target.value })} /></div>
              <Button onClick={createQuiz} className="w-full">Create Quiz</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><p className="text-muted-foreground">No quizzes yet. Create one to get started.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{quiz.title}</p>
                    <Badge variant={quiz.published ? "default" : "secondary"}>{quiz.published ? "Published" : "Draft"}</Badge>
                    {quiz.time_limit_minutes && <Badge variant="outline">{quiz.time_limit_minutes} min</Badge>}
                  </div>
                  {quiz.description && <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadQuestions(quiz.id)}>Questions</Button>
                  <Button size="sm" variant="outline" onClick={() => loadAttempts(quiz.id)}><Eye className="h-3 w-3 mr-1" />Attempts</Button>
                  <Button size="sm" variant={quiz.published ? "secondary" : "default"} onClick={() => togglePublish(quiz)}>
                    {quiz.published ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Questions Dialog */}
      <Dialog open={!!questionsOpen} onOpenChange={() => setQuestionsOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Manage Questions</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Q{i + 1}: {q.question}</p>
                      <div className="mt-2 space-y-1">
                        {(q.options as string[]).map((opt, oi) => (
                          <p key={oi} className={`text-sm ${oi === q.correct_answer ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                            {String.fromCharCode(65 + oi)}. {opt} {oi === q.correct_answer && "✓"}
                          </p>
                        ))}
                      </div>
                      {q.explanation && <p className="mt-2 text-xs text-muted-foreground italic">Explanation: {q.explanation}</p>}
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-dashed">
              <CardHeader><CardTitle className="text-base">Add Question</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Question</Label><Textarea value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} /></div>
                {newQuestion.options.map((opt, i) => (
                  <div key={i}>
                    <Label>{String.fromCharCode(65 + i)}. Option</Label>
                    <Input value={opt} onChange={(e) => {
                      const opts = [...newQuestion.options];
                      opts[i] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: opts });
                    }} />
                  </div>
                ))}
                <div>
                  <Label>Correct Answer</Label>
                  <Select value={String(newQuestion.correct_answer)} onValueChange={(v) => setNewQuestion({ ...newQuestion, correct_answer: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map((l, i) => <SelectItem key={i} value={String(i)}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Explanation (optional)</Label><Input value={newQuestion.explanation} onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })} /></div>
                <Button onClick={addQuestion} className="w-full">Add Question</Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attempts & Feedback Dialog */}
      <Dialog open={!!attemptsOpen} onOpenChange={() => { setAttemptsOpen(null); setFeedbackAttemptId(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Student Attempts</DialogTitle></DialogHeader>
          {attempts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attempts yet</p>
          ) : (
            <div className="space-y-3">
              {attempts.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{a.student_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {a.score ?? "—"}/{a.total_questions ?? "—"} · {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "In progress"}
                        </p>
                        {a.quiz_feedback?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {a.quiz_feedback.map((f: any) => (
                              <p key={f.id} className="text-sm bg-muted rounded p-2">💬 {f.feedback}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setFeedbackAttemptId(feedbackAttemptId === a.id ? null : a.id)}>
                        <MessageSquare className="h-3 w-3 mr-1" />Feedback
                      </Button>
                    </div>
                    {feedbackAttemptId === a.id && (
                      <div className="mt-3 flex gap-2">
                        <Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Write feedback..." className="min-h-[60px]" />
                        <Button onClick={submitFeedback} size="sm">Send</Button>
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

export default QuizManagePage;
