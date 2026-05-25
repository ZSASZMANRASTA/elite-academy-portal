import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { useSiteContent, defaultContactInfo, type ContactInfo } from "@/hooks/useSiteContent";

const Footer = () => {
  const { data: contact } = useSiteContent<ContactInfo>("contact_info", defaultContactInfo);
  const c = contact ?? defaultContactInfo;

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Adams Junior Academy</span>
            </div>
            <p className="text-xs italic text-primary mb-1">Education Liberates</p>
            <p className="text-sm text-muted-foreground">
              Academic Superiority Upbringing with Passion. A CBC school in Kajiado nurturing learners from PP1 through Grade 9 since 2013.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {["About", "Academics", "Admissions", "Gallery", "Contact"].map((l) => (
                <Link key={l} to={`/${l.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {c.phone}</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {c.email}</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {c.address}</span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Hours</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{c.hoursWeekday}</p>
              <p>{c.hoursSaturday}</p>
              <p>{c.hoursSunday}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Adams Junior Academy. All rights reserved.</span>
          <Link to="/login" className="hover:text-primary transition-colors text-xs opacity-60 hover:opacity-100">Portal</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
