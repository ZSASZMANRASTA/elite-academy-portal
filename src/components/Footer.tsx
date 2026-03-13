import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">Adam's Junior Academy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nurturing future leaders through excellence in education, character, and innovation.
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
              <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> +254 700 123 456</span>
              <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@rongaielite.ac.ke</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Rongai, Kajiado County</span>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-3">Hours</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Mon – Fri: 7:00 AM – 5:00 PM</p>
              <p>Saturday: 8:00 AM – 12:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Rongai Elite Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
