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
import { DollarSign, TrendingUp, TriangleAlert as AlertTriangle, Users, Plus, ArrowDownToLine } from "lucide-react";

const FinancePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", mpesa_ref: "", term: "" });
  const [structureForm, setStructureForm] = useState({ class_name: "", amount_per_term: "", lunch_fee: "", academic_year: "2024/2025" });

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
      if (!selectedStudent || !paymentForm.amount) {
        throw new Error("Missing required fields");
      }
      const amount = parseFloat(paymentForm.amount);
      const fee = studentFees.find((f) => f.id === selectedStudent);
      if (!fee) throw new Error("Fee record not found");

      const newPaid = (fee.total_paid || 0) + amount;
      const newBalance = (fee.total_expected || 0) - newPaid;

      const { error } = await supabase
        .from("student_fees")
        .update({
          total_paid: newPaid,
          balance: newBalance,
          mpesa_ref: paymentForm.mpesa_ref || null,
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
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

  const createStructureMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fee_structures").insert({
        class_name: structureForm.class_name,
        amount_per_term: parseFloat(structureForm.amount_per_term),
        lunch_fee: parseFloat(structureForm.lunch_fee),
        academic_year: structureForm.academic_year,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
      setStructureDialogOpen(false);
      setStructureForm({ class_name: "", amount_per_term: "", lunch_fee: "", academic_year: "2024/2025" });
      toast.success("Fee structure created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance Overview</h1>
          <p className="text-muted-foreground">Fee collection and financial management</p>
        </div>
        <Dialog open={structureDialogOpen} onOpenChange={setStructureDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Fee Structure</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Fee Structure</DialogTitle></DialogHeader>
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
              <div>
                <Label>Academic Year</Label>
                <Input value={structureForm.academic_year} onChange={(e) => setStructureForm((p) => ({ ...p, academic_year: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => createStructureMutation.mutate()} disabled={createStructureMutation.isPending}>
                {createStructureMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Student Fee Records</CardTitle>
        </CardHeader>
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
                      <Badge variant={fee.balance > 0 ? "destructive" : "default"}>
                        KES {fee.balance?.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(fee.id);
                          setPaymentForm((p) => ({ ...p, term: fee.term }));
                          setPaymentDialogOpen(true);
                        }}
                      >
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
                  <TableHead>Total</TableHead>
                  <TableHead>Academic Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructures.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.class_name}</TableCell>
                    <TableCell>KES {s.amount_per_term?.toLocaleString()}</TableCell>
                    <TableCell>KES {s.lunch_fee?.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">KES {(s.amount_per_term + s.lunch_fee).toLocaleString()}</TableCell>
                    <TableCell>{s.academic_year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
