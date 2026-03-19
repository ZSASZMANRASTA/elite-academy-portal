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

const fees = [
  { level: "PP1 – PP2", tuition: "15,000", lunch: "8,000", total: "23,000" },
  { level: "Grade 1 – 3", tuition: "18,000", lunch: "8,000", total: "26,000" },
  { level: "Grade 4 – 6", tuition: "22,000", lunch: "8,000", total: "30,000" },
  { level: "Grade 7 – 9 (JSS)", tuition: "28,000", lunch: "10,000", total: "38,000" },
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
        Join the Adam's Junior family. We welcome learners from Pre-Primary through Grade 9 Junior
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

          <h2 className="mt-10 font-display text-xl font-bold">Fee Structure (KES per term)</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-display font-semibold">Level</th>
                  <th className="px-4 py-3 text-right font-display font-semibold">Tuition</th>
                  <th className="px-4 py-3 text-right font-display font-semibold">Lunch</th>
                  <th className="px-4 py-3 text-right font-display font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((row) => (
                  <tr key={row.level} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{row.level}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.tuition}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.lunch}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.total}</td>
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
