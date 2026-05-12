import { Users, Target, Eye, Building2 } from "lucide-react";
import { useSiteContent, AboutContent } from "@/hooks/useSiteContent";

const defaultAbout: AboutContent = {
  description: "Adams Junior Academy is a CBC school based in Kajiado, founded in 2013 with the vision of bringing quality, accessible education closer to young learners. Today we are home to 384 girls and boys across PP1 to Grade 9, guided by our motto — Education Liberates.",
  mission: "To empower children to recognize and optimize their full potential — academically, spiritually, and socially.",
  vision: "To build character and instill discipline by providing a safe, caring environment where children develop the skills and values to rejoin their communities with success.",
  academicStructure: [
    { phase: "Pre-Primary (PP1 & PP2)", grades: "Ages 4–6", desc: "Foundational literacy, numeracy and social skills through play-based learning. Hours: 7:30 AM – 4:00 PM." },
    { phase: "Lower & Upper Primary", grades: "Grades 1–6", desc: "Pupil-centred teaching in English with practical activities, experiments and math symposiums. KPSEA assessment at end of Grade 6." },
    { phase: "Junior Secondary School", grades: "Grades 7–9", desc: "Specialist subjects with continuous SBAs. Upper-class hours: 7:00 AM – 4:30 PM." },
  ],
  team: [
    { name: "Mary Njambi", role: "Director", initials: "MN" },
    { name: "Mr. Adam Mwangi", role: "Manager", initials: "AM" },
    { name: "Tr. Vincent", role: "Head of Languages", initials: "TV" },
    { name: "Tr. Saumu", role: "Head of I.R.E.", initials: "TS" },
  ],
};

const About = () => {
  const { data: about } = useSiteContent<AboutContent>("about", defaultAbout);
  const content = about ?? defaultAbout;

  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">About Us</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{content.description}</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Our Mission</h2>
          <p className="mt-2 text-muted-foreground">{content.mission}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10 text-success">
            <Eye className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Our Vision</h2>
          <p className="mt-2 text-muted-foreground">{content.vision}</p>
        </div>
      </div>

      {/* Academic Structure */}
      <h2 className="mt-16 font-display text-2xl font-bold">Our Academic Structure</h2>
      <p className="mt-2 text-muted-foreground">
        As a Comprehensive School, we host learners across the full CBC pathway under one campus and
        one Board of Management.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.academicStructure.map((item) => (
          <div key={item.phase} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 font-display font-semibold text-primary">{item.phase}</h3>
            <p className="mt-1 text-sm font-medium">{item.grades}</p>
            <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Leadership Team</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {content.team.map((member) => (
          <div key={member.name} className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="mx-auto h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold">
                {member.initials}
              </div>
            )}
            <h3 className="mt-4 font-display font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
