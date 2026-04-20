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
import { Plus, Users, UserPlus, ArrowLeft } from "lucide-react";

const ClassesPage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({ full_name: "", email: "", password: "", class_id: "" });

  const isTeacherOrAdmin = role === "teacher" || role === "admin";

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["classes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["class-students", selectedClass],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select("*, profiles:student_id(id, full_name, class, approved)")
        .eq("class_id", selectedClass!);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
  });

  const createClassMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
          .from("classes")
          .insert({
            name: name.trim(),
            teacher_id: user!.id
          })
          .select()
          .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newClass) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setNewClassName("");
      setClassDialogOpen(false);
      toast.success(`Class "${newClass.name}" created successfully`);
    },
    onError: (error: any) => {
      console.error("Create class error:", error);
      toast.error(`Failed to create class: ${error.message || "Unknown error"}`);
    },
  });


  const createStudentMutation = useMutation({
    mutationFn: async (form: typeof studentForm) => {
      // Use an isolated, non-persisting client so the admin's session is never touched.
      // signUp on the main client would swap the active session to the new student.
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

      // The handle_new_user trigger auto-creates the profile + user_role(student).
      // Now enroll in class using the admin's real client.
      const { error: enrollErr } = await supabase
        .from("class_enrollments")
        .insert({ student_id: newUserId, class_id: form.class_id });

      if (enrollErr) throw enrollErr;

      return newUserId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-students", selectedClass] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setStudentForm({ full_name: "", email: "", password: "", class_id: "" });
      setStudentDialogOpen(false);
      toast.success("Student created and enrolled successfully");
    },
    onError: (error: any) => {
      console.error("Create student error:", error);
      toast.error(`Failed to create student: ${error.message || "Unknown error"}`);
    },
  });





  const selectedClassObj = classes.find((c: any) => c.id === selectedClass);

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClass(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{selectedClassObj?.name}</h1>
          <Badge variant="secondary">{students.length} students</Badge>
        </div>

        {isTeacherOrAdmin && (
          <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setStudentForm((p) => ({ ...p, class_id: selectedClass }))}>
                <UserPlus className="h-4 w-4 mr-2" /> Create & Assign Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Student Account</DialogTitle>
              </DialogHeader>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingStudents ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : students.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No students enrolled</TableCell></TableRow>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Classes</h1>
        {isTeacherOrAdmin && (
          <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Class</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Class Name</Label>
                  <Input placeholder="e.g. Grade 7A" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                </div>
                <Button className="w-full" disabled={!newClassName || createClassMutation.isPending} onClick={() => createClassMutation.mutate(newClassName)}>
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
        <Card><CardContent className="py-12 text-center text-muted-foreground">No classes yet. Create your first class to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((c: any) => (
            <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedClass(c.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> Click to view students
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassesPage;
