import { useState, useMemo } from "react";
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
import { CalendarIcon, Save, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, isWeekend, isSunday, isSaturday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type AttendanceStatus = "present" | "absent" | "late";

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; variant: "default" | "destructive" | "secondary" }> = {
  present: { label: "Present", icon: CheckCircle, variant: "default" },
  absent: { label: "Absent", icon: XCircle, variant: "destructive" },
  late: { label: "Late", icon: Clock, variant: "secondary" },
};

/** Returns true if a given date is a school open day given the terms/holidays */
function isOpenDay(date: Date, terms: any[], holidays: Set<string>): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  if (holidays.has(dateStr)) return false;
  const dayOfWeek = date.getDay(); // 0=Sun,1=Mon,...,6=Sat
  if (dayOfWeek === 0) return false; // never open on Sunday

  const matchingTerm = terms.find(
    (t) => dateStr >= t.start_date && dateStr <= t.end_date
  );
  if (!matchingTerm) return false; // not within any term

  if (dayOfWeek === 6 && !matchingTerm.include_saturday) return false; // Saturday not allowed

  return true;
}

const AttendancePage = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  const isTeacherOrAdmin = role === "teacher" || role === "admin";
  const isStudent = role === "student";

  const { data: terms = [] } = useQuery({
    queryKey: ["school-terms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_terms").select("*").order("start_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: holidayRows = [] } = useQuery({
    queryKey: ["school-holidays"],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_holidays").select("date");
      if (error) throw error;
      return data;
    },
  });

  const holidaySet = useMemo(
    () => new Set(holidayRows.map((h: any) => h.date as string)),
    [holidayRows]
  );

  const calendarOpenDay = (date: Date) => isOpenDay(date, terms, holidaySet);

  // Find which term the selected date belongs to
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedTerm = useMemo(
    () => terms.find((t: any) => selectedDateStr >= t.start_date && selectedDateStr <= t.end_date) ?? null,
    [terms, selectedDateStr]
  );
  const selectedDateIsOpenDay = useMemo(
    () => isOpenDay(selectedDate, terms, holidaySet),
    [selectedDate, terms, holidaySet]
  );

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

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ["attendance", selectedClass, selectedDateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("date", selectedDateStr);
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
    enabled: !!selectedClass && !!selectedDateStr,
  });

  // Student: view own attendance with open-day stats
  const { data: myAttendance = [] } = useQuery({
    queryKey: ["my-attendance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, classes:class_id(name)")
        .eq("student_id", user!.id)
        .order("date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: isStudent && !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendanceMap).map(([student_id, status]) => ({
        date: selectedDateStr,
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

  const cycleStatus = (studentId: string) => {
    const order: AttendanceStatus[] = ["present", "absent", "late"];
    const current = attendanceMap[studentId] || "present";
    const next = order[(order.indexOf(current) + 1) % order.length];
    setAttendanceMap((p) => ({ ...p, [studentId]: next }));
  };

  // ── Student view ─────────────────────────────────────────────────────────
  if (isStudent) {
    // Calculate open-day attendance rate
    const presentOrLate = myAttendance.filter((a: any) => a.status === "present" || a.status === "late").length;
    const total = myAttendance.length;
    const pct = total > 0 ? Math.round((presentOrLate / total) * 100) : null;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          {pct !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              Attendance rate: <span className={cn("font-semibold", pct >= 80 ? "text-green-600" : pct >= 60 ? "text-red-500" : "text-destructive")}>{pct}%</span>
              {" "}({presentOrLate} of {total} recorded school days)
            </p>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendance.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No attendance records yet</TableCell></TableRow>
                ) : (
                  myAttendance.map((a: any) => {
                    const cfg = statusConfig[a.status as AttendanceStatus];
                    const d = new Date(a.date);
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell className="text-muted-foreground">{d.toLocaleDateString("en-KE", { weekday: "long" })}</TableCell>
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

  // ── Teacher / Admin view ─────────────────────────────────────────────────
  const warningMessage = (() => {
    if (terms.length === 0) return "No school terms have been defined yet. Set up the school calendar first.";
    if (holidaySet.has(selectedDateStr)) return "This date is marked as a holiday or school closure.";
    if (!selectedTerm) return "This date is outside all defined school terms.";
    const dow = selectedDate.getDay();
    if (dow === 0) return "Sundays are not school days.";
    if (dow === 6 && !selectedTerm.include_saturday) return `Saturdays are not school days in ${selectedTerm.term_name}.`;
    return null;
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        {terms.length === 0 && (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            No school terms defined — go to School Calendar to set up term dates before marking attendance.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[220px] justify-start text-left font-normal",
                  !selectedDateIsOpenDay && "border-red-400 text-red-700"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
                {!selectedDateIsOpenDay && " ⚠"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
                modifiers={{
                  openDay: (d) => calendarOpenDay(d),
                  holiday: (d) => holidaySet.has(format(d, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  openDay: "font-semibold text-foreground",
                  holiday: "line-through text-muted-foreground opacity-50",
                }}
                disabled={(d) => d > new Date()}
              />
              <div className="px-3 pb-3 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><span className="font-semibold text-foreground">Bold</span> = open school day</p>
                <p className="flex items-center gap-1.5"><span className="line-through opacity-50">Strikethrough</span> = holiday/closure</p>
              </div>
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

      {/* Warning banner for non-open days */}
      {warningMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{warningMessage} Attendance can still be saved if needed.</span>
        </div>
      )}

      {selectedClass && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              Mark Attendance — {format(selectedDate, "EEEE, PP")}
              {selectedTerm && <span className="text-sm font-normal text-muted-foreground ml-2">({selectedTerm.term_name})</span>}
            </CardTitle>
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
