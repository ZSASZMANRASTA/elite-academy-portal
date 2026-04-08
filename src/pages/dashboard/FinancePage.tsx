import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TriangleAlert as AlertTriangle, Users, Plus, ArrowDownToLine, Trash2, Edit2 } from "lucide-react";

interface FeeCategory {
  name: string;
  amount: number;
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CURRENT_YEAR = "2024/2025";

const FinancePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTerm, setSelectedTerm] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(CURRENT_YEAR);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", mpesa_ref: "", term: "" });
  const [structureForm, setStructureForm] = useState({
    class_name: "",
    amount_per_term: "",
    lunch_fee: "",
    academic_year: CURRENT_YEAR,
    fee_categories: [] as FeeCategory[],
  });
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: feeStats } = useQuery({
    queryKey: ["fee-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_fees").select("total_expected, total_paid, balance");
      if (error) throw error;
      const totalExpected = data.reduce((sum, f) => sum + (f.total_expected || 0), 0);
      const totalPaid = data.reduce((sum, f) => sum + (f.total_paid || 0), 0);
      const totalBalance = data.reduce((sum, f) => sum + (f.balance || 0), 0);
      const studentsWithArrears = data.filter((f) => (f.balance || 0) > 0).length;
      return { totalExpected, totalPaid, totalBalance, studentsWithArrears };
    },
    enabled: !!user,
  });

  const { data: studentFees = [] } = useQuery({
    queryKey: ["all-student-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_fees")
        .select("*, profiles:student_id(full_name, class)")
        .order("balance", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ["fee-structures"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_structures").select("*").order("class_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent || !paymentForm.amount) throw new Error("Missing required fields");
      const amount = parseFloat(paymentForm.amount);
      const fee = studentFees.find((f) => f.id === selectedStudent);
      if (!fee) throw new Error("Fee record not found");
      const newPaid = (fee.total_paid || 0) + amount;
      const newBalance = (fee.total_expected || 0) - newPaid;
      const { error } = await supabase
        .from("student_fees")
        .update({ total_paid: newPaid, balance: newBalance, mpesa_ref: paymentForm.mpesa_ref || null, payment_date: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", selectedStudent);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["fee-stats"] });
      setPaymentDialogOpen(false);
      setSelectedStudent(null);
      setPaymentForm({ amount: "", mpesa_ref: "", term: "" });
      toast.success("Payment recorded successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveStructureMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        class_name: structureForm.class_name,
        amount_per_term: parseFloat(structureForm.amount_per_term) || 0,
        lunch_fee: parseFloat(structureForm.lunch_fee) || 0,
        academic_year: structureForm.academic_year,
        fee_categories: structureForm.fee_categories as any,
      };
      if (editingStructure) {
        const { error } = await supabase.from("fee_structures").update(payload).eq("id", editingStructure.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fee_structures").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      closeStructureDialog();
      toast.success(editingStructure ? "Fee structure updated" : "Fee structure created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteStructureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      toast.success("Fee structure deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeStructureDialog = () => {
    setStructureDialogOpen(false);
    setEditingStructure(null);
    setStructureForm({ class_name: "", amount_per_term: "", lunch_fee: "", academic_year: "2024/2025", fee_categories: [] });
    setNewCategoryName("");
  };

  const openEditStructure = (s: any) => {
    const cats: FeeCategory[] = Array.isArray(s.fee_categories) ? s.fee_categories : [];
    setEditingStructure(s);
    setStructureForm({
      class_name: s.class_name,
      amount_per_term: String(s.amount_per_term),
      lunch_fee: String(s.lunch_fee),
      academic_year: s.academic_year,
      fee_categories: cats,
    });
    setStructureDialogOpen(true);
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (structureForm.fee_categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists");
      return;
    }
    setStructureForm((p) => ({ ...p, fee_categories: [...p.fee_categories, { name, amount: 0 }] }));
    setNewCategoryName("");
  };

  const updateCategoryAmount = (index: number, amount: string) => {
    setStructureForm((p) => {
      const cats = [...p.fee_categories];
      cats[index] = { ...cats[index], amount: parseFloat(amount) || 0 };
      return { ...p, fee_categories: cats };
    });
  };

  const removeCategory = (index: number) => {
    setStructureForm((p) => ({ ...p, fee_categories: p.fee_categories.filter((_, i) => i !== index) }));
  };

  const getStructureTotal = (s: any) => {
    const base = (s.amount_per_term || 0) + (s.lunch_fee || 0);
    const cats: FeeCategory[] = Array.isArray(s.fee_categories) ? s.fee_categories : [];
    return base + cats.reduce((sum: number, c: FeeCategory) => sum + (c.amount || 0), 0);
  };

  const getFormTotal = () => {
    const base = (parseFloat(structureForm.amount_per_term) || 0) + (parseFloat(structureForm.lunch_fee) || 0);
    return base + structureForm.fee_categories.reduce((sum, c) => sum + (c.amount || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance Overview</h1>
          <p className="text-muted-foreground">Fee collection and financial management</p>
        </div>
        <Dialog open={structureDialogOpen} onOpenChange={(open) => { if (!open) closeStructureDialog(); else setStructureDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Fee Structure</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingStructure ? "Edit" : "Create"} Fee Structure</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Class Name</Label>
                <Input value={structureForm.class_name} onChange={(e) => setStructureForm((p) => ({ ...p, class_name: e.target.value }))} placeholder="e.g. Grade 7" />
              </div>
              <div>
                <Label>Tuition per Term (KES)</Label>
                <Input type="number" value={structureForm.amount_per_term} onChange={(e) => setStructureForm((p) => ({ ...p, amount_per_term: e.target.value }))} />
              </div>
              <div>
                <Label>Lunch Fee (KES)</Label>
                <Input type="number" value={structureForm.lunch_fee} onChange={(e) => setStructureForm((p) => ({ ...p, lunch_fee: e.target.value }))} />
              </div>

              {/* Dynamic fee categories */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Additional Fee Categories</Label>
                {structureForm.fee_categories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm min-w-[100px] truncate">{cat.name}</span>
                    <Input
                      type="number"
                      placeholder="Amount"
                      className="flex-1"
                      value={cat.amount || ""}
                      onChange={(e) => updateCategoryAmount(i, e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Transport, Activity Fee"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCategory} disabled={!newCategoryName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                <span className="font-semibold">Total per Term:</span> KES {getFormTotal().toLocaleString()}
              </div>

              <div>
                <Label>Academic Year</Label>
                <Input value={structureForm.academic_year} onChange={(e) => setStructureForm((p) => ({ ...p, academic_year: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => saveStructureMutation.mutate()} disabled={saveStructureMutation.isPending}>
                {saveStructureMutation.isPending ? "Saving..." : editingStructure ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {feeStats?.totalExpected.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {feeStats?.totalPaid.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">KES {feeStats?.totalBalance.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Fee arrears</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Students with Arrears</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeStats?.studentsWithArrears || 0}</div>
            <p className="text-xs text-muted-foreground">Need follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Fee Records */}
      <Card>
        <CardHeader><CardTitle>Student Fee Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentFees.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No fee records yet</TableCell></TableRow>
              ) : (
                studentFees.map((fee: any) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.profiles?.full_name || "—"}</TableCell>
                    <TableCell>{fee.profiles?.class || "—"}</TableCell>
                    <TableCell>{fee.term}</TableCell>
                    <TableCell>KES {fee.total_expected?.toLocaleString()}</TableCell>
                    <TableCell>KES {fee.total_paid?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={fee.balance > 0 ? "destructive" : "default"}>KES {fee.balance?.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedStudent(fee.id); setPaymentForm((p) => ({ ...p, term: fee.term })); setPaymentDialogOpen(true); }}>
                        <ArrowDownToLine className="h-3 w-3 mr-1" /> Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Fee Structures */}
      {feeStructures.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Fee Structures</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Tuition</TableHead>
                  <TableHead>Lunch</TableHead>
                  {/* Collect all unique extra category names */}
                  {(() => {
                    const allCats = new Set<string>();
                    feeStructures.forEach((s: any) => {
                      const cats: FeeCategory[] = Array.isArray(s.fee_categories) ? s.fee_categories : [];
                      cats.forEach((c) => allCats.add(c.name));
                    });
                    return Array.from(allCats).map((name) => (
                      <TableHead key={name}>{name}</TableHead>
                    ));
                  })()}
                  <TableHead>Total</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const allCatNames: string[] = [];
                  const catSet = new Set<string>();
                  feeStructures.forEach((s: any) => {
                    const cats: FeeCategory[] = Array.isArray(s.fee_categories) ? s.fee_categories : [];
                    cats.forEach((c) => { if (!catSet.has(c.name)) { catSet.add(c.name); allCatNames.push(c.name); } });
                  });
                  return feeStructures.map((s: any) => {
                    const cats: FeeCategory[] = Array.isArray(s.fee_categories) ? s.fee_categories : [];
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.class_name}</TableCell>
                        <TableCell>KES {s.amount_per_term?.toLocaleString()}</TableCell>
                        <TableCell>KES {s.lunch_fee?.toLocaleString()}</TableCell>
                        {allCatNames.map((name) => {
                          const cat = cats.find((c) => c.name === name);
                          return <TableCell key={name}>{cat ? `KES ${cat.amount.toLocaleString()}` : "—"}</TableCell>;
                        })}
                        <TableCell className="font-semibold">KES {getStructureTotal(s).toLocaleString()}</TableCell>
                        <TableCell>{s.academic_year}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditStructure(s)}><Edit2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteStructureMutation.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (KES)</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <Label>M-Pesa Reference (Optional)</Label>
              <Input value={paymentForm.mpesa_ref} onChange={(e) => setPaymentForm((p) => ({ ...p, mpesa_ref: e.target.value }))} placeholder="e.g. SH12345678" />
            </div>
            <Button className="w-full" onClick={() => recordPaymentMutation.mutate()} disabled={recordPaymentMutation.isPending}>
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancePage;
