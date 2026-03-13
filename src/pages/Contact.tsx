import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll respond shortly.");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">Contact Us</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Get in touch with Adam's Junior Academy. We'd love to hear from you.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Address</h3>
                <p className="text-sm text-muted-foreground">Saina, Kajiado Central, Kajiado County, Kenya</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Phone</h3>
                <p className="text-sm text-muted-foreground">+254 700 123 456</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Email</h3>
                <p className="text-sm text-muted-foreground">info@adamsjunior.ac.ke</p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mt-8 overflow-hidden rounded-lg border border-border">
            <iframe
              title="Adam's Junior Academy Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15955.42!2d36.7!3d-1.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMcKwMjQnMDAuMCJTIDM2wrA0MicwMC4wIkU!5e0!3m2!1sen!2ske!4v1"
              width="100%"
              height="280"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h2 className="font-display text-xl font-bold">Send a Message</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required placeholder="Your name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required placeholder="How can we help?" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required placeholder="Your message…" rows={4} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
