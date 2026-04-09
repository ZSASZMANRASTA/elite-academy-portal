import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, Image } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const ReceiptLink = ({ path }: { path: string }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Handle both old public URLs and new path-only values
      const storagePath = path.includes("/storage/v1/") ? path.split("/fee-receipts/")[1] : path;
      const { data, error } = await supabase.storage.from("fee-receipts").createSignedUrl(storagePath, 300);
      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, "_blank");
    } catch {
      // Fallback for old public URLs
      window.open(path, "_blank");
    } finally {
      setLoading(false);
    }
  };

  const isImage = path.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
    >
      {isImage ? <Image className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
      {loading ? "…" : "View"}
      <ExternalLink className="h-3 w-3" />
    </button>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: any;
}

const methodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  bank: "Bank Transfer",
  cash: "Cash",
};

const methodColors: Record<string, string> = {
  mpesa: "default",
  bank: "secondary",
  cash: "outline",
};

const PaymentHistoryDialog = ({ open, onOpenChange, studentFee }: Props) => {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["fee-payments", studentFee?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_fee_id", studentFee.id)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!studentFee?.id && open,
  });

  const totalPaidFromPayments = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          {studentFee && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{studentFee.profiles?.full_name} · {studentFee.term} · {studentFee.academic_year}</p>
              <div className="flex gap-4 text-xs">
                <span>Expected: <strong>KES {studentFee.total_expected?.toLocaleString()}</strong></span>
                <span>Paid: <strong>KES {totalPaidFromPayments.toLocaleString()}</strong></span>
                <span>Balance: <strong className={studentFee.balance > 0 ? "text-destructive" : ""}>
                  KES {studentFee.balance?.toLocaleString()}
                </strong></span>
              </div>
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No payments recorded yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">
                    {format(new Date(p.paid_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    KES {p.amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={methodColors[p.payment_method] as any || "default"}>
                      {methodLabels[p.payment_method] || p.payment_method}
                    </Badge>
                    {p.bank_name && (
                      <span className="text-xs text-muted-foreground block mt-0.5">{p.bank_name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {p.reference_code || "—"}
                  </TableCell>
                  <TableCell>
                    {p.receipt_url ? (
                      <ReceiptLink path={p.receipt_url} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                    {p.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryDialog;
