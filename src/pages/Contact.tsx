import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useSiteContent, defaultContactInfo, type ContactInfo } from "@/hooks/useSiteContent";

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const { data: contact } = useSiteContent<ContactInfo>("contact_info", defaultContactInfo);
  const c = contact ?? defaultContactInfo;

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
                <p className="text-sm text-muted-foreground">{c.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Phone</h3>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Email</h3>
                <p className="text-sm text-muted-foreground">{c.email}</p>
              </div>
            </div>
          </div>

          {/* Map */}
          {c.mapEmbedUrl && (
            <div className="mt-8 overflow-hidden rounded-lg border border-border">
              <iframe
                title="Adam's Junior Academy Location"
                src={c.mapEmbedUrl}
                width="100%"
                height="280"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
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
