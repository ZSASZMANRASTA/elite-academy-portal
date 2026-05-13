import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultFees = [
  { level: "Playgroup / PP1 / PP2", tuition: "7,000" },
  { level: "Grade 1 – 3", tuition: "9,000" },
  { level: "Grade 4 – 6", tuition: "9,500" },
  { level: "Grade 7 – 9 (JSS)", tuition: "12,500" },
];

const defaultAdditionalCharges = [
  { item: "Food (optional)", amount: "3,500 per term" },
  { item: "Transport (One Way)", amount: "6,500 per term" },
  { item: "Transport (Two Way – Town)", amount: "7,000 per term" },
  { item: "Transport (Two Way – UMWA / HOSI)", amount: "8,000 per term" },
  { item: "Admission", amount: "1,000 (One-time)" },
  { item: "School Diary", amount: "150" },
  { item: "Activity Fee", amount: "500 per term" },
  { item: "Exercise Books", amount: "500 per term (1,500 per year)" },
  { item: "Computer (Compulsory Grade 1–9)", amount: "1,000 per term" },
  { item: "Assessment Tools (PP1 – Grade 9)", amount: "300 per term" },
  { item: "Interviews (Cash)", amount: "1,000" },
];

const gradeOptions = [
  { value: "pp1", label: "PP1" },
  { value: "pp2", label: "PP2" },
  { value: "grade1", label: "Grade 1" },
  { value: "grade2", label: "Grade 2" },
  { value: "grade3", label: "Grade 3" },
  { value: "grade4", label: "Grade 4" },
  { value: "grade5", label: "Grade 5" },
  { value: "grade6", label: "Grade 6" },
  { value: "grade7", label: "Grade 7" },
  { value: "grade8", label: "Grade 8" },
  { value: "grade9", label: "Grade 9" },
];

const Admissions = () => {
  const [loading, setLoading] = useState(false);

  const { data: structures = [] } = useQuery({
    queryKey: ["public-fee-structures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("class_name, amount_per_term, lunch_fee, fee_categories, academic_year")
        .order("class_name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Aggregate one row per class_name (use max amount across terms/years)
  const feeRows = (() => {
    if (!structures.length) return defaultFees;
    const map = new Map<string, number>();
    for (const s of structures as any[]) {
      const total = (s.amount_per_term || 0) + (s.lunch_fee || 0);
      const prev = map.get(s.class_name) || 0;
      if (total > prev) map.set(s.class_name, total);
    }
    return Array.from(map.entries()).map(([level, amt]) => ({
      level,
      tuition: amt.toLocaleString(),
    }));
  })();

  // Aggregate additional charges from fee_categories across structures
  const additionalCharges = (() => {
    if (!structures.length) return defaultAdditionalCharges;
    const map = new Map<string, number>();
    for (const s of structures as any[]) {
      const cats = Array.isArray(s.fee_categories) ? s.fee_categories : [];
      for (const c of cats) {
        if (!c?.name) continue;
        const prev = map.get(c.name) || 0;
        if ((c.amount || 0) > prev) map.set(c.name, c.amount || 0);
      }
    }
    if (map.size === 0) return defaultAdditionalCharges;
    return Array.from(map.entries()).map(([item, amt]) => ({
      item,
      amount: `${amt.toLocaleString()} per term`,
    }));
  })();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Application submitted! We'll be in touch soon.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">Admissions</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Join the Adams Junior family. We welcome learners from Pre-Primary through Grade 9 Junior
        Secondary School.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        {/* Requirements & Fees */}
        <div>
          <h2 className="font-display text-xl font-bold">Requirements</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Birth certificate copy
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Two passport-size photos
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              KPSEA results slip (for Grade 7 applicants)
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Previous school report card / leaving certificate (transfers)
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Immunisation card (PP1 & PP2)
            </li>
          </ul>

          <h2 className="mt-10 font-display text-xl font-bold">Fee Structure</h2>
          <p className="mt-1 text-xs text-muted-foreground">Per term, in KES</p>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody>
                {feeRows.map((row) => (
                  <tr key={row.level} className="border-t border-border first:border-t-0">
                    <td className="px-4 py-3 font-medium">{row.level}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.tuition}</td>
                  </tr>
                ))}
                {additionalCharges.map((row) => (
                  <tr key={row.item} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{row.item}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Form */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold">Apply Now</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in your details and we'll get back to you.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Learner's Full Name</Label>
              <Input id="name" required placeholder="Full name" />
            </div>
            <div>
              <Label htmlFor="email">Parent/Guardian Email</Label>
              <Input id="email" type="email" required placeholder="parent@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" required placeholder="+254 7XX XXX XXX" />
            </div>
            <div>
              <Label>Grade Applying For</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admissions;
