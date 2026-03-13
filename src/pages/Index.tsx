import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroCarousel from "@/components/HeroCarousel";
import StatsCard from "@/components/StatsCard";
import { Users, Trophy, BookOpen, Award } from "lucide-react";

const Index = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[520px] md:h-[600px]">
        <HeroCarousel />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container text-center">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-card md:text-6xl animate-fade-in">
              Excellence in Education
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-card/90 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Adam's Junior Academy — nurturing tomorrow's leaders through academic rigour, character, and innovation.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" variant="accent" asChild>
                <Link to="/admissions">Apply Now</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-card/30 bg-card/10 text-card hover:bg-card/20" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-12 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard value="1,200+" label="Students Enrolled" icon={<Users className="h-6 w-6" />} />
          <StatsCard value="95%" label="KCSE Pass Rate" icon={<Trophy className="h-6 w-6" />} />
          <StatsCard value="48" label="Qualified Teachers" icon={<BookOpen className="h-6 w-6" />} />
          <StatsCard value="15+" label="Years of Excellence" icon={<Award className="h-6 w-6" />} />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container py-20">
        <h2 className="text-center font-display text-3xl font-bold">Why Adam's Junior Academy?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          We combine academic excellence with holistic development to prepare students for success in a rapidly changing world.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { title: "Academic Excellence", desc: "Consistently top-performing in KCSE with a focus on STEM and humanities.", icon: <BookOpen className="h-6 w-6" /> },
            { title: "Character Development", desc: "Leadership programs, mentorship, and community service that build well-rounded individuals.", icon: <Award className="h-6 w-6" /> },
            { title: "Modern Facilities", desc: "State-of-the-art labs, library, sports complex, and digital learning resources.", icon: <Trophy className="h-6 w-6" /> },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {item.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground">Ready to Join Adam's Junior Academy?</h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Applications are now open for the next academic year. Take the first step toward an exceptional education.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="accent" asChild>
              <Link to="/admissions">Start Application</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
