import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Question = Tables<"quiz_questions">;

interface QuizWithCourse {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  course_id: string;
  courses: { title: string } | null;
}

type Phase = "list" | "taking" | "results";

const QuizTakePage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("list");
  const [quizzes, setQuizzes] = useState<QuizWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz-taking state
  const [quiz, setQuiz] = useState<QuizWithCourse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results state
  const [score, setScore] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [pastAttempts, setPastAttempts] = useState<Tables<"quiz_attempts">[]>([]);

  // Load published quizzes
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("id, title, description, time_limit_minutes, course_id, courses(title)")
        .eq("published", true)
        .order("created_at", { ascending: false });
      setQuizzes((data as QuizWithCourse[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  // Load past attempts for list view
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_id", user.id)
        .order("started_at", { ascending: false });
      setPastAttempts(data ?? []);
    })();
  }, [user, phase]);

  // Timer
  useEffect(() => {
    if (phase !== "taking" || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLeft]);

  const startQuiz = async (q: QuizWithCourse) => {
    const { data: qs } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", q.id)
      .order("sort_order");
    if (!qs || qs.length === 0) {
      toast.error("This quiz has no questions yet");
      return;
    }
    setQuiz(q);
    setQuestions(qs);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(q.time_limit_minutes ? q.time_limit_minutes * 60 : null);
    setPhase("taking");
  };

  const selectAnswer = (questionId: string, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!quiz || !user) return;

    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });

    const { data, error } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quiz.id,
        student_id: user.id,
        answers: answers as any,
        score: correct,
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setScore(correct);
    setTotalQ(questions.length);
    setAttemptId(data?.id ?? null);
    setPhase("results");
  }, [quiz, user, questions, answers]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const percentage = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;

  // ── LIST VIEW ──
  if (phase === "list") {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Available Quizzes</h1>
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No quizzes available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => {
              const attempts = pastAttempts.filter((a) => a.quiz_id === q.id);
              const bestScore = attempts.length > 0
                ? Math.max(...attempts.map((a) => a.score ?? 0))
                : null;
              return (
                <Card key={q.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{q.title}</CardTitle>
                    {q.courses && (
                      <Badge variant="secondary" className="w-fit text-xs">{q.courses.title}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3">
                    {q.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{q.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {q.time_limit_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {q.time_limit_minutes} min
                        </span>
                      )}
                      {bestScore !== null && (
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3.5 w-3.5" /> Best: {bestScore}/{attempts[0]?.total_questions}
                        </span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => startQuiz(q)} className="mt-auto">
                      {attempts.length > 0 ? "Retake Quiz" : "Start Quiz"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── TAKING VIEW ──
  if (phase === "taking" && quiz) {
    const question = questions[currentIdx];
    const options = (question.options as string[]) || [];
    const progress = ((currentIdx + 1) / questions.length) * 100;
    const answered = Object.keys(answers).length;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIdx + 1} of {questions.length}
            </p>
          </div>
          {timeLeft !== null && (
            <Badge
              variant={timeLeft < 60 ? "destructive" : "secondary"}
              className="gap-1 text-sm font-mono"
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectAnswer(question.id, idx)}
                className={`w-full rounded-lg border p-3.5 text-left text-sm transition-colors ${
                  answers[question.id] === idx
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx((i) => i - 1)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentIdx((i) => i + 1)}
              className="gap-1"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={answered < questions.length}
              className="gap-1"
            >
              Submit ({answered}/{questions.length})
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS VIEW ──
  if (phase === "results") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="text-center">
          <CardContent className="py-10 space-y-4">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              percentage >= 70 ? "bg-green-100 text-green-600" : percentage >= 40 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
            }`}>
              <Trophy className="h-10 w-10" />
            </div>
            <h1 className="font-display text-3xl font-bold">{percentage}%</h1>
            <p className="text-muted-foreground">
              You scored <span className="font-semibold text-foreground">{score}</span> out of{" "}
              <span className="font-semibold text-foreground">{totalQ}</span> questions
            </p>
            <Badge variant={percentage >= 70 ? "default" : percentage >= 40 ? "secondary" : "destructive"}>
              {percentage >= 70 ? "Excellent!" : percentage >= 40 ? "Good effort" : "Keep practising"}
            </Badge>
          </CardContent>
        </Card>

        {/* Answer review */}
        <h2 className="font-display text-lg font-bold">Answer Review</h2>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            const opts = (q.options as string[]) || [];
            return (
              <Card key={q.id} className={`border-l-4 ${isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                  </div>
                  <div className="ml-7 space-y-1 text-sm">
                    {!isCorrect && (
                      <p className="text-red-600">
                        Your answer: {opts[userAns] ?? "No answer"}
                      </p>
                    )}
                    <p className="text-green-600">
                      Correct: {opts[q.correct_answer]}
                    </p>
                    {q.explanation && (
                      <p className="text-muted-foreground mt-1 text-xs">{q.explanation}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => quiz && startQuiz(quiz)}>
            <RotateCcw className="h-4 w-4" /> Retake
          </Button>
          <Button onClick={() => setPhase("list")}>Back to Quizzes</Button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizTakePage;
