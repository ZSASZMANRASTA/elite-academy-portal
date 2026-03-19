import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Users } from "lucide-react";

const grades = ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];

const ParentContactForm = () => {
  const [form, setForm] = useState({
    parent_name: "", email: "", phone: "", child_name: "", child_grade: "", message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parent_name.trim() || !form.email.trim()) {
      toast.error("Parent name and email are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("parent_contacts").insert({
      parent_name: form.parent_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      child_name: form.child_name.trim() || null,
      child_grade: form.child_grade || null,
      message: form.message.trim() || null,
    });
    setLoading(false);
    if (error) { toast.error("Something went wrong. Please try again."); return; }
    toast.success("Thank you! We'll be in touch shortly.");
    setForm({ parent_name: "", email: "", phone: "", child_name: "", child_grade: "", message: "" });
  };

  return (
    <section className="container py-16">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle className="font-display text-2xl">Parent Enquiry Form</CardTitle>
          </div>
          <CardDescription>
            Interested in enrolling your child? Fill in your details and we'll get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Parent / Guardian Name *</Label>
                <Input value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} placeholder="Full name" required />
              </div>
              <div>
                <Label>Email Address *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" />
              </div>
              <div>
                <Label>Child's Name</Label>
                <Input value={form.child_name} onChange={e => setForm({ ...form, child_name: e.target.value })} placeholder="Child's full name" />
              </div>
            </div>
            <div>
              <Label>Grade Applying For</Label>
              <Select value={form.child_grade} onValueChange={v => setForm({ ...form, child_grade: v })}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Any questions or comments..." rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Enquiry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default ParentContactForm;
