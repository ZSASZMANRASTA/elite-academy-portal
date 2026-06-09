import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Item {
  name: string;
  amount: number;
  included: boolean;
  optional?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: any;
}

const CustomizeFeeDialog = ({ open, onOpenChange, studentFee }: Props) => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Item[]>([]);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  // Find matching fee structure to seed defaults if student has no custom items yet
  const { data: structure } = useQuery({
    queryKey: ["fee-structure-for", studentFee?.profiles?.class, studentFee?.academic_year, studentFee?.term],
    queryFn: async () => {
      if (!studentFee?.profiles?.class) return null;
      const { data } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("class_name", studentFee.profiles.class)
        .eq("academic_year", studentFee.academic_year);
      if (!data?.length) return null;
      // prefer term-specific, else generic
      return data.find((s: any) => s.term === studentFee.term) || data.find((s: any) => !s.term) || data[0];
    },
    enabled: open && !!studentFee,
  });

  useEffect(() => {
    if (!open || !studentFee) return;
    const existing: Item[] = Array.isArray(studentFee.selected_items) ? studentFee.selected_items : [];
    if (existing.length > 0) {
      setItems(existing);
      return;
    }
    // Seed from structure
    if (structure) {
      const seeded: Item[] = [];
      if (structure.amount_per_term > 0) seeded.push({ name: "Tuition", amount: Number(structure.amount_per_term), included: true, optional: false });
      if (structure.lunch_fee > 0) seeded.push({ name: "Lunch", amount: Number(structure.lunch_fee), included: true, optional: true });
      const cats = Array.isArray(structure.fee_categories) ? structure.fee_categories : [];
      cats.forEach((c: any) => {
        seeded.push({ name: c.name, amount: Number(c.amount) || 0, included: !c.optional, optional: !!c.optional });
      });
      setItems(seeded);
    } else {
      // No structure — start with a single Tuition item using current expected total
      setItems([{ name: "Tuition", amount: Number(studentFee.total_expected) || 0, included: true, optional: false }]);
    }
  }, [open, studentFee, structure]);

  const total = items.filter((i) => i.included).reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const toggle = (i: number, v: boolean) => setItems((p) => p.map((it, idx) => (idx === i ? { ...it, included: v } : it)));
  const updateAmount = (i: number, v: string) =>
    setItems((p) => p.map((it, idx) => (idx === i ? { ...it, amount: parseFloat(v) || 0 } : it)));
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const addItem = () => {
    const name = newName.trim();
    const amt = parseFloat(newAmount) || 0;
    if (!name) return;
    setItems((p) => [...p, { name, amount: amt, included: true, optional: true }]);
    setNewName("");
    setNewAmount("");
  };

  const save = useMutation({
    mutationFn: async () => {
      const totalPaid = Number(studentFee.total_paid) || 0;
      const balance = total - totalPaid;
      const { error } = await supabase
        .from("student_fees")
        .update({
          selected_items: items as any,
          total_expected: total,
          balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentFee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["fee-stats"] });
      toast.success("Fee items updated");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Fee Items</DialogTitle>
          {studentFee && (
            <DialogDescription>
              {studentFee.profiles?.full_name} · {studentFee.term} · {studentFee.academic_year}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No items yet. Add one below.</p>
          )}
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox checked={it.included} onCheckedChange={(v) => toggle(i, !!v)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {it.name}
                  {it.optional && <span className="ml-1 text-xs text-muted-foreground">(optional)</span>}
                </p>
              </div>
              <Input
                type="number"
                className="w-28 h-8"
                value={it.amount || ""}
                onChange={(e) => updateAmount(i, e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <div className="space-y-2 rounded-md border border-dashed p-2">
            <Label className="text-xs">Add custom item</Label>
            <div className="flex gap-2">
              <Input placeholder="e.g. Transport" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8" />
              <Input type="number" placeholder="Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-28 h-8" />
              <Button size="icon" variant="outline" onClick={addItem} disabled={!newName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm flex justify-between">
            <span className="font-semibold">New Expected Total:</span>
            <span className="font-semibold">KES {total.toLocaleString()}</span>
          </div>

          <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizeFeeDialog;
