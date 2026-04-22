import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, UserPlus, ArrowLeft, ArrowRightLeft } from "lucide-react";

const ClassesPage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({ name: "", stream: "" });
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ full_name: "", email: "", password: "", class_id: "" });
  const [transferStudent, setTransferStudent] = useState<any>(null);
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const isTeacherOrAdmin = role === "teacher" || role === "admin";

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["classes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*, class_enrollments(count)")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["class-students", selectedClass],
    queryFn: async () => {
      const { data: enrollments, error: enrollErr } = await supabase
        .from("class_enrollments")
        .select("id, student_id, enrolled_at, class_id")
        .eq("class_id", selectedClass!);
      if (enrollErr) throw enrollErr;
      if (!enrollments || enrollments.length === 0) return [];

      const studentIds = enrollments.map((e) => e.student_id);
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name, class, approved")
        .in("id", studentIds);
      if (profileErr) throw profileErr;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return enrollments.map((e) => ({
        ...e,
        profiles: profileMap.get(e.student_id) ?? null,
      }));
    },
    enabled: !!selectedClass,
  });

  const createClassMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .insert({ name: classForm.name.trim(), stream: classForm.stream.trim() || null, teacher_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newClass) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setClassForm({ name: "", stream: "" });
      setClassDialogOpen(false);
      const label = newClass.stream ? `${newClass.name} — ${newClass.stream}` : newClass.name;
      toast.success(`Class "${label}" created`);
    },
    onError: (error: any) => toast.error(`Failed to create class: ${error.message}`),
  });

  const createStudentMutation = useMutation({
    mutationFn: async (form: typeof studentForm) => {
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
      );

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role: "student" } },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user account");

      const newUserId = signUpData.user.id;

      const { error: enrollErr } = await supabase
        .from("class_enrollments")
        .insert({ student_id: newUserId, class_id: form.class_id });
      if (enrollErr) throw enrollErr;

      // Set profiles.class to the class name (+ stream if set) for fee synchronisation
      const classObj = classes.find((c: any) => c.id === form.class_id);
      if (classObj) {
        const className = classObj.stream ? `${classObj.name} ${classObj.stream}` : classObj.name;
        await supabase.from("profiles").update({ class: className }).eq("id", newUserId);
      }

      return newUserId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-students", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setStudentForm({ full_name: "", email: "", password: "", class_id: "" });
      setStudentDialogOpen(false);
      toast.success("Student created and enrolled successfully");
    },
    onError: (error: any) => toast.error(`Failed to create student: ${error.message}`),
  });

  const transferMutation = useMutation({
    mutationFn: async ({ studentId, oldClassId, newClassId }: { studentId: string; oldClassId: string; newClassId: string }) => {
      const { error: delErr } = await supabase
        .from("class_enrollments")
        .delete()
        .eq("student_id", studentId)
        .eq("class_id", oldClassId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase
        .from("class_enrollments")
        .insert({ student_id: studentId, class_id: newClassId });
      if (insErr) throw insErr;

      const newClassObj = classes.find((c: any) => c.id === newClassId);
      if (newClassObj) {
        const className = newClassObj.stream ? `${newClassObj.name} ${newClassObj.stream}` : newClassObj.name;
        await supabase.from("profiles").update({ class: className }).eq("id", studentId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-students", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setTransferDialogOpen(false);
      setTransferStudent(null);
      setTransferTarget("");
      toast.success("Student transferred successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Group classes by name for display
  const classGroups: Record<string, any[]> = {};
  classes.forEach((c: any) => {
    if (!classGroups[c.name]) classGroups[c.name] = [];
    classGroups[c.name].push(c);
  });

  const selectedClassObj = classes.find((c: any) => c.id === selectedClass);

  // ── Detail view (students in a class) ──────────────────────────────────────
  if (selectedClass) {
    const otherClasses = classes.filter((c: any) => c.id !== selectedClass);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClass(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedClassObj?.name}</h1>
            {selectedClassObj?.stream && (
              <Badge variant="secondary" className="mt-0.5">{selectedClassObj.stream}</Badge>
            )}
          </div>
          <Badge variant="outline">{students.length} students</Badge>
        </div>

        {isTeacherOrAdmin && (
          <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setStudentForm((p) => ({ ...p, class_id: selectedClass }))}>
                <UserPlus className="h-4 w-4 mr-2" /> Create & Assign Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Student Account</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={studentForm.full_name} onChange={(e) => setStudentForm((p) => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={studentForm.email} onChange={(e) => setStudentForm((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={studentForm.password} onChange={(e) => setStudentForm((p) => ({ ...p, password: e.target.value }))} />
                </div>
                <Button
                  className="w-full"
                  disabled={createStudentMutation.isPending}
                  onClick={() => createStudentMutation.mutate(studentForm)}
                >
                  {createStudentMutation.isPending ? "Creating..." : "Create Student"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  {isTeacherOrAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingStudents ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : students.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No students enrolled</TableCell></TableRow>
                ) : (
                  students.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.profiles?.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.profiles?.approved ? "default" : "secondary"}>
                          {s.profiles?.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.enrolled_at).toLocaleDateString()}
                      </TableCell>
                      {isTeacherOrAdmin && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => { setTransferStudent(s); setTransferTarget(""); setTransferDialogOpen(true); }}
                          >
                            <ArrowRightLeft className="h-3 w-3" /> Transfer
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transfer Dialog */}
        <Dialog open={transferDialogOpen} onOpenChange={(open) => { setTransferDialogOpen(open); if (!open) { setTransferStudent(null); setTransferTarget(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Moving <span className="font-semibold text-foreground">{transferStudent?.profiles?.full_name}</span> to a new class.
              </p>
              <div>
                <Label>Transfer to</Label>
                <Select value={transferTarget} onValueChange={setTransferTarget}>
                  <SelectTrigger><SelectValue placeholder="Select target class" /></SelectTrigger>
                  <SelectContent>
                    {otherClasses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.stream ? ` — ${c.stream}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!transferTarget || transferMutation.isPending}
                onClick={() => transferMutation.mutate({
                  studentId: transferStudent.student_id,
                  oldClassId: selectedClass!,
                  newClassId: transferTarget,
                })}
              >
                {transferMutation.isPending ? "Transferring..." : "Confirm Transfer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Class list (grouped by class name) ─────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classes</h1>
        {isTeacherOrAdmin && (
          <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Class</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Class Level</Label>
                  <Input
                    placeholder="e.g. Grade 7, PP1, Form 3"
                    value={classForm.name}
                    onChange={(e) => setClassForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">The general level — used to group streams and sync fees</p>
                </div>
                <div>
                  <Label>Stream / Section <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    placeholder="e.g. East, A, Blue, Morning"
                    value={classForm.stream}
                    onChange={(e) => setClassForm((p) => ({ ...p, stream: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Specialization within the class level</p>
                </div>
                <Button
                  className="w-full"
                  disabled={!classForm.name.trim() || createClassMutation.isPending}
                  onClick={() => createClassMutation.mutate()}
                >
                  {createClassMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loadingClasses ? (
        <p className="text-muted-foreground">Loading classes...</p>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No classes yet. Create your first class to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(classGroups).map(([levelName, levelClasses]) => (
            <div key={levelName}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{levelName}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {levelClasses.map((c: any) => {
                  const studentCount = c.class_enrollments?.[0]?.count ?? 0;
                  return (
                    <Card
                      key={c.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedClass(c.id)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {c.name}
                          {c.stream && <Badge variant="secondary">{c.stream}</Badge>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{studentCount} {studentCount === 1 ? "student" : "students"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
