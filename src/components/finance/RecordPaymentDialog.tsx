import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: any;
}

const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
];

const BANKS = [
  "KCB Bank",
  "Equity Bank",
  "Co-operative Bank",
  "ABSA Kenya",
  "Standard Chartered",
  "Stanbic Bank",
  "NCBA Bank",
  "I&M Bank",
  "DTB Bank",
  "Family Bank",
  "Other",
];

const RecordPaymentDialog = ({ open, onOpenChange, studentFee }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    amount: "",
    payment_method: "mpesa" as string,
    reference_code: "",
    bank_name: "",
    notes: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!studentFee || !form.amount || !user) throw new Error("Missing required fields");
      const amount = parseFloat(form.amount);
      if (amount <= 0) throw new Error("Amount must be positive");

      let receipt_url: string | null = null;

      // Upload receipt if provided
      if (receiptFile) {
        setUploading(true);
        const ext = receiptFile.name.split(".").pop();
        const path = `${studentFee.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("fee-receipts")
          .upload(path, receiptFile);
        if (uploadError) throw new Error("Failed to upload receipt: " + uploadError.message);
        const { data: urlData } = supabase.storage.from("fee-receipts").getPublicUrl(path);
        receipt_url = urlData.publicUrl;
        setUploading(false);
      }

      // Insert payment record
      const { error: payError } = await supabase.from("fee_payments").insert({
        student_fee_id: studentFee.id,
        amount,
        payment_method: form.payment_method as any,
        reference_code: form.reference_code || null,
        bank_name: form.payment_method === "bank" ? form.bank_name : null,
        receipt_url,
        notes: form.notes || null,
        recorded_by: user.id,
      });
      if (payError) throw payError;

      // Update student_fees totals
      const newPaid = (studentFee.total_paid || 0) + amount;
      const newBalance = (studentFee.total_expected || 0) - newPaid;
      const { error: updateError } = await supabase
        .from("student_fees")
        .update({
          total_paid: newPaid,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentFee.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["fee-stats"] });
      queryClient.invalidateQueries({ queryKey: ["fee-payments"] });
      onOpenChange(false);
      resetForm();
      toast.success("Payment recorded successfully");
    },
    onError: (e: any) => {
      setUploading(false);
      toast.error(e.message);
    },
  });

  const resetForm = () => {
    setForm({ amount: "", payment_method: "mpesa", reference_code: "", bank_name: "", notes: "" });
    setReceiptFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          {studentFee && (
            <p className="text-sm text-muted-foreground">
              {studentFee.profiles?.full_name} · {studentFee.term} · Balance: KES {studentFee.balance?.toLocaleString()}
            </p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Amount (KES) *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <Label>Payment Method *</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm((p) => ({ ...p, payment_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.payment_method === "mpesa" && (
            <div>
              <Label>M-Pesa Transaction Code *</Label>
              <Input
                value={form.reference_code}
                onChange={(e) => setForm((p) => ({ ...p, reference_code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SH12345678"
              />
            </div>
          )}

          {form.payment_method === "bank" && (
            <>
              <div>
                <Label>Bank Name *</Label>
                <Select value={form.bank_name} onValueChange={(v) => setForm((p) => ({ ...p, bank_name: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {BANKS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bank Reference / Slip Number</Label>
                <Input
                  value={form.reference_code}
                  onChange={(e) => setForm((p) => ({ ...p, reference_code: e.target.value }))}
                  placeholder="Transaction reference"
                />
              </div>
            </>
          )}

          {form.payment_method === "cash" && (
            <div>
              <Label>Receipt Number (Optional)</Label>
              <Input
                value={form.reference_code}
                onChange={(e) => setForm((p) => ({ ...p, reference_code: e.target.value }))}
                placeholder="Cash receipt number"
              />
            </div>
          )}

          {/* Receipt / Bank Slip Upload */}
          <div>
            <Label>Upload Evidence (Receipt / Bank Slip)</Label>
            <div
              className="mt-1 border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {receiptFile ? (
                <p className="text-sm text-foreground">{receiptFile.name}</p>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Click to upload image or PDF</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || uploading}
          >
            {mutation.isPending || uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording...</>
            ) : (
              "Record Payment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordPaymentDialog;
