import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, Save, CheckCircle, XCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late";

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; variant: "default" | "destructive" | "secondary" }> = {
  present: { label: "Present", icon: CheckCircle, variant: "default" },
  absent: { label: "Absent", icon: XCircle, variant: "destructive" },
  late: { label: "Late", icon: Clock, variant: "secondary" },
};

const AttendancePage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  const isTeacherOrAdmin = role === "teacher" || role === "admin";
  const isStudent = role === "student";

  const { data: classes = [] } = useQuery({
    queryKey: ["my-classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["class-students-attendance", selectedClass],
    queryFn: async () => {
      const { data: enrollments, error: enrollErr } = await supabase
        .from("class_enrollments")
        .select("student_id")
        .eq("class_id", selectedClass);
      if (enrollErr) throw enrollErr;
      if (!enrollments || enrollments.length === 0) return [];

      const studentIds = enrollments.map((e) => e.student_id);
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);
      if (profileErr) throw profileErr;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return enrollments.map((e) => ({
        student_id: e.student_id,
        profiles: profileMap.get(e.student_id) ?? null,
      }));
    },
    enabled: !!selectedClass,
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ["attendance", selectedClass, dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", dateStr);
      if (error) throw error;
      const map: Record<string, AttendanceStatus> = {};
      const reasons: Record<string, string> = {};
      data.forEach((a: any) => {
        map[a.student_id] = a.status;
        if (a.absence_reason) reasons[a.student_id] = a.absence_reason;
      });
      setAttendanceMap(map);
      setReasonMap(reasons);
      return data;
    },
    enabled: !!selectedClass && !!dateStr,
  });

  // Student: view own attendance
  const { data: myAttendance = [] } = useQuery({
    queryKey: ["my-attendance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, classes:class_id(name)")
        .eq("student_id", user!.id)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: isStudent && !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendanceMap).map(([student_id, status]) => ({
        date: dateStr,
        student_id,
        class_id: selectedClass,
        status: status as AttendanceStatus,
        marked_by: user!.id,
        absence_reason: status !== "present" ? (reasonMap[student_id] || null) : null,
      }));
      const { error } = await supabase.from("attendance").upsert(records, { onConflict: "date,student_id,class_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  const cycleStatus = (studentId: string) => {
    const order: AttendanceStatus[] = ["present", "absent", "late"];
    const current = attendanceMap[studentId] || "present";
    const next = order[(order.indexOf(current) + 1) % order.length];
    setAttendanceMap((p) => ({ ...p, [studentId]: next }));
  };

  if (isStudent) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendance.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No attendance records yet</TableCell></TableRow>
                ) : (
                  myAttendance.map((a: any) => {
                    const cfg = statusConfig[a.status as AttendanceStatus];
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                        <TableCell>{a.classes?.name || "—"}</TableCell>
                        <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      </TableRow>
                    );
                  })
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
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Mark Attendance — {format(selectedDate, "PP")}</CardTitle>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || students.length === 0}>
              <Save className="h-4 w-4 mr-2" /> {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason (if absent/late)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No students in this class</TableCell></TableRow>
                ) : (
                  students.map((s: any) => {
                    const status: AttendanceStatus = attendanceMap[s.student_id] || "present";
                    const cfg = statusConfig[status];
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={s.student_id}>
                        <TableCell className="font-medium">{s.profiles?.full_name || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-2" onClick={() => cycleStatus(s.student_id)}>
                            <Icon className="h-4 w-4" />
                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          </Button>
                        </TableCell>
                        <TableCell>
                          {status !== "present" && (
                            <Input
                              placeholder="Reason..."
                              className="h-8 w-48"
                              value={reasonMap[s.student_id] || ""}
                              onChange={(e) => setReasonMap((p) => ({ ...p, [s.student_id]: e.target.value }))}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendancePage;
