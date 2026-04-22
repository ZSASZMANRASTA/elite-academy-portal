import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, CalendarDays, CalendarOff, Edit2, Check, X } from "lucide-react";

const ACADEMIC_YEARS = ["2024/2025", "2025/2026", "2026/2027"];
const TERM_NAMES = ["Term 1", "Term 2", "Term 3"];

const BLANK_TERM = {
  academic_year: "2025/2026",
  term_name: "Term 1",
  start_date: "",
  end_date: "",
  include_saturday: false,
};

const SchoolCalendarPage = () => {
  const queryClient = useQueryClient();
  const [addingTerm, setAddingTerm] = useState(false);
  const [termForm, setTermForm] = useState(BLANK_TERM);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editTermForm, setEditTermForm] = useState(BLANK_TERM);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayDesc, setHolidayDesc] = useState("");

  const { data: terms = [], isLoading: loadingTerms } = useQuery({
    queryKey: ["school-terms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_terms").select("*").order("academic_year").order("start_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: holidays = [], isLoading: loadingHolidays } = useQuery({
    queryKey: ["school-holidays"],
    queryFn: async () => {
      const { data, error } = await supabase.from("school_holidays").select("*").order("date");
      if (error) throw error;
      return data;
    },
  });

  const addTermMutation = useMutation({
    mutationFn: async () => {
      if (!termForm.start_date || !termForm.end_date) throw new Error("Start and end dates are required");
      if (termForm.start_date > termForm.end_date) throw new Error("Start date must be before end date");
      const { error } = await supabase.from("school_terms").insert(termForm);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-terms"] });
      setAddingTerm(false);
      setTermForm(BLANK_TERM);
      toast.success("Term added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTermMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!editTermForm.start_date || !editTermForm.end_date) throw new Error("Start and end dates are required");
      if (editTermForm.start_date > editTermForm.end_date) throw new Error("Start date must be before end date");
      const { error } = await supabase.from("school_terms").update(editTermForm).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-terms"] });
      setEditingTermId(null);
      toast.success("Term updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTermMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_terms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-terms"] });
      toast.success("Term removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addHolidayMutation = useMutation({
    mutationFn: async () => {
      if (!holidayDate) throw new Error("Date is required");
      const { error } = await supabase.from("school_holidays").insert({
        date: holidayDate,
        description: holidayDesc.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-holidays"] });
      setHolidayDate("");
      setHolidayDesc("");
      toast.success("Holiday added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_holidays").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-holidays"] });
      toast.success("Holiday removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const startEditTerm = (term: any) => {
    setEditingTermId(term.id);
    setEditTermForm({
      academic_year: term.academic_year,
      term_name: term.term_name,
      start_date: term.start_date,
      end_date: term.end_date,
      include_saturday: term.include_saturday,
    });
    setAddingTerm(false);
  };

  const TermFormFields = ({ form, setForm }: { form: typeof BLANK_TERM; setForm: (v: any) => void }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Academic Year</Label>
          <select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
          >
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Term</Label>
          <select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.term_name}
            onChange={(e) => setForm({ ...form, term_name: e.target.value })}
          >
            {TERM_NAMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Start Date</Label>
          <Input className="h-9 mt-1" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs">End Date</Label>
          <Input className="h-9 mt-1" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id={`sat-${form.term_name}`}
          checked={form.include_saturday}
          onCheckedChange={(v) => setForm({ ...form, include_saturday: v })}
        />
        <Label htmlFor={`sat-${form.term_name}`} className="text-sm cursor-pointer">
          Include Saturday as a school day
        </Label>
      </div>
    </div>
  );

  const groupedByYear: Record<string, any[]> = {};
  terms.forEach((t: any) => {
    if (!groupedByYear[t.academic_year]) groupedByYear[t.academic_year] = [];
    groupedByYear[t.academic_year].push(t);
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">School Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Define term dates and holidays. Attendance can only be marked on open school days.
        </p>
      </div>

      {/* ── Terms ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Academic Terms
          </CardTitle>
          {!addingTerm && (
            <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => { setAddingTerm(true); setEditingTermId(null); }}>
              <Plus className="h-3.5 w-3.5" /> Add Term
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add form */}
          {addingTerm && (
            <div className="rounded-lg border border-dashed p-4 space-y-3 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Term</p>
              <TermFormFields form={termForm} setForm={setTermForm} />
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="gap-1 h-8" onClick={() => addTermMutation.mutate()} disabled={addTermMutation.isPending}>
                  <Check className="h-3.5 w-3.5" /> {addTermMutation.isPending ? "Saving..." : "Save Term"}
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={() => { setAddingTerm(false); setTermForm(BLANK_TERM); }}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              </div>
            </div>
          )}

          {loadingTerms ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : terms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No terms defined yet</p>
          ) : (
            Object.entries(groupedByYear).sort().map(([year, yearTerms]) => (
              <div key={year}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{year}</p>
                <div className="space-y-2">
                  {yearTerms.map((term: any) => (
                    <div key={term.id} className="rounded-lg border p-3">
                      {editingTermId === term.id ? (
                        <div className="space-y-3">
                          <TermFormFields form={editTermForm} setForm={setEditTermForm} />
                          <div className="flex gap-2">
                            <Button size="sm" className="gap-1 h-8" onClick={() => updateTermMutation.mutate(term.id)} disabled={updateTermMutation.isPending}>
                              <Check className="h-3.5 w-3.5" /> {updateTermMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={() => setEditingTermId(null)}>
                              <X className="h-3.5 w-3.5" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{term.term_name}</p>
                              {term.include_saturday && <Badge variant="secondary" className="text-xs">Sat included</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(term.start_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              {" — "}
                              {new Date(term.end_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditTerm(term)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTermMutation.mutate(term.id)} disabled={deleteTermMutation.isPending}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Holidays ───────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarOff className="h-4 w-4" /> Holidays & Closures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="space-y-1 flex-shrink-0">
              <Label className="text-xs">Date</Label>
              <Input className="h-9 w-44" type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Description (optional)</Label>
              <Input className="h-9" placeholder="e.g. Madaraka Day, Midterm break..." value={holidayDesc} onChange={(e) => setHolidayDesc(e.target.value)} />
            </div>
            <Button className="h-9 gap-1.5 shrink-0" onClick={() => addHolidayMutation.mutate()} disabled={addHolidayMutation.isPending || !holidayDate}>
              <Plus className="h-3.5 w-3.5" /> {addHolidayMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>

          <Separator />

          {loadingHolidays ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No holidays or closures defined</p>
          ) : (
            <div className="space-y-2">
              {holidays.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between text-sm rounded-lg border px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {new Date(h.date).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {h.description && <span className="text-muted-foreground">{h.description}</span>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteHolidayMutation.mutate(h.id)} disabled={deleteHolidayMutation.isPending}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolCalendarPage;
