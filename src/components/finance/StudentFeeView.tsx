import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, History } from "lucide-react";
import PaymentHistoryDialog from "@/components/finance/PaymentHistoryDialog";

interface Props {
  userId: string | undefined;
}

const StudentFeeView = ({ userId }: Props) => {
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: myFees = [] } = useQuery({
    queryKey: ["my-fees", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_fees")
        .select("*")
        .eq("student_id", userId!)
        .order("academic_year", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const totalBalance = myFees.reduce((sum, f: any) => sum + (f.balance || 0), 0);
  const totalPaid = myFees.reduce((sum, f: any) => sum + (f.total_paid || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Fees</h1>
        <p className="text-muted-foreground">View your fee records and payment history</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={totalBalance > 0 ? "destructive" : "default"}>
                KES {totalBalance.toLocaleString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Fee Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No fee records found
                  </TableCell>
                </TableRow>
              ) : (
                myFees.map((fee: any) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.term}</TableCell>
                    <TableCell>{fee.academic_year}</TableCell>
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
                        variant="ghost"
                        onClick={() => { setSelectedFee(fee); setHistoryOpen(true); }}
                      >
                        <History className="h-3 w-3 mr-1" /> Payment History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaymentHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        studentFee={selectedFee}
      />
    </div>
  );
};

export default StudentFeeView;
