import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroCarousel from "@/components/HeroCarousel";
import StatsCard from "@/components/StatsCard";
import HomepageAnnouncements from "@/components/HomepageAnnouncements";
import NewsletterSignup from "@/components/NewsletterSignup";
import ParentContactForm from "@/components/ParentContactForm";
import { Users, Trophy, BookOpen, Award, Star } from "lucide-react";
import { useSiteContent, StatItem } from "@/hooks/useSiteContent";

const defaultStats: StatItem[] = [
  { value: "1,200+", label: "Learners (PP1–Grade 9)", icon: "Users" },
  { value: "100%", label: "KPSEA Transition Rate", icon: "Trophy" },
  { value: "56", label: "Specialist & Primary Teachers", icon: "BookOpen" },
  { value: "15+", label: "Years of Excellence", icon: "Award" },
];

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-6 w-6" />,
  Trophy: <Trophy className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  Star: <Star className="h-6 w-6" />,
};

const Index = () => {
  const { data: stats } = useSiteContent<StatItem[]>("stats", defaultStats);
  const currentStats = stats ?? defaultStats;

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
            <p
              className="mx-auto mt-4 max-w-xl text-lg text-card/90 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Adam's Junior Academy — a Comprehensive School nurturing learners from Kindergarten
              through Grade 9 JSS under Kenya's CBC.
            </p>
            <div
              className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <Button size="lg" variant="accent" asChild>
                <Link to="/admissions">Apply Now</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-card/30 bg-card/10 text-card hover:bg-card/20"
                asChild
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-12 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {currentStats.map((s, i) => (
            <StatsCard
              key={i}
              value={s.value}
              label={s.label}
              icon={iconMap[s.icon] || <Star className="h-6 w-6" />}
            />
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container py-20">
        <h2 className="text-center font-display text-3xl font-bold">
          Why Adam's Junior Academy?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          As a CBC Comprehensive School, we provide a seamless 11-year learning journey — combining
          academic rigour, continuous assessment, and holistic development under one campus.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "CBC Excellence",
              desc: "Competency-based learning with strong KPSEA and SBA outcomes, preparing learners for Senior School success.",
              icon: <BookOpen className="h-6 w-6" />,
            },
            {
              title: "Character & Leadership",
              desc: "Mentorship programmes, community service, and co-curricular activities that build well-rounded individuals.",
              icon: <Award className="h-6 w-6" />,
            },
            {
              title: "Modern Facilities",
              desc: "Integrated science lab, pre-technical workshop, ICT lab, library, and dedicated early-years play areas.",
              icon: <Trophy className="h-6 w-6" />,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {item.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Announcements */}
      <HomepageAnnouncements />

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Parent Contact Form */}
      <ParentContactForm />

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground">
            Ready to Join Adam's Junior Academy?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
            Applications are open for PP1 through Grade 9. Give your child the gift of a
            comprehensive, competency-based education.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="accent" asChild>
              <Link to="/admissions">Start Application</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
