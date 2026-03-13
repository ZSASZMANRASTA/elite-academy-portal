import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const fees = [
  { form: "Form 1", tuition: "45,000", boarding: "30,000", total: "75,000" },
  { form: "Form 2", tuition: "42,000", boarding: "30,000", total: "72,000" },
  { form: "Form 3", tuition: "42,000", boarding: "30,000", total: "72,000" },
  { form: "Form 4", tuition: "48,000", boarding: "30,000", total: "78,000" },
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
        Join the Rongai Elite family. We welcome applications from motivated students ready to excel.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        {/* Requirements & Fees */}
        <div>
          <h2 className="font-display text-xl font-bold">Requirements</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />KCPE results slip or equivalent</li>
            <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Birth certificate copy</li>
            <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Two passport-size photos</li>
            <li className="flex items-start gap-2"><div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />Previous school leaving certificate (transfers)</li>
          </ul>

          <h2 className="mt-10 font-display text-xl font-bold">Fee Structure (KES per term)</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-display font-semibold">Class</th>
                  <th className="px-4 py-3 text-right font-display font-semibold">Tuition</th>
                  <th className="px-4 py-3 text-right font-display font-semibold">Boarding</th>
                  <th className="px-4 py-3 text-right font-display font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((row) => (
                  <tr key={row.form} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{row.form}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.tuition}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.boarding}</td>
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
          <p className="mt-1 text-sm text-muted-foreground">Fill in your details and we'll get back to you.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required placeholder="Student's full name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="parent@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" required placeholder="+254 7XX XXX XXX" />
            </div>
            <div>
              <Label>Grade Applying For</Label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="form1">Form 1</SelectItem>
                  <SelectItem value="form2">Form 2</SelectItem>
                  <SelectItem value="form3">Form 3</SelectItem>
                  <SelectItem value="form4">Form 4</SelectItem>
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
