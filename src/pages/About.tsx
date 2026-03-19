import { Users, Target, Eye, Building2 } from "lucide-react";

const team = [
  { name: "Mr. Daniel Kipkoech", role: "Principal", initials: "DK" },
  { name: "Mrs. Grace Mutua", role: "Deputy Principal (Primary)", initials: "GM" },
  { name: "Mr. James Ochieng", role: "Deputy Principal (JSS)", initials: "JO" },
  { name: "Mrs. Sarah Wanjiku", role: "Head of Early Years", initials: "SW" },
];

const About = () => {
  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">About Us</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Adam's Junior Academy is a Comprehensive School in Saina, Kajiado Central, offering a
        complete 11-year learning journey from Kindergarten (PP1) through Grade 9 Junior Secondary
        School under Kenya's Competency-Based Curriculum (CBC).
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Our Mission</h2>
          <p className="mt-2 text-muted-foreground">
            To provide quality, affordable CBC education that nurtures every learner's competencies,
            moral integrity, and leadership skills — preparing them to excel in Senior School and
            beyond.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10 text-success">
            <Eye className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Our Vision</h2>
          <p className="mt-2 text-muted-foreground">
            To be a centre of excellence in competency-based education, producing well-rounded
            graduates who are innovative, responsible, and ready to make a positive impact in
            society.
          </p>
        </div>
      </div>

      {/* Academic Structure */}
      <h2 className="mt-16 font-display text-2xl font-bold">Our Academic Structure</h2>
      <p className="mt-2 text-muted-foreground">
        As a Comprehensive School, we host learners across the full CBC pathway under one campus and
        one Board of Management.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            phase: "Early Years Education",
            grades: "PP1, PP2, Grades 1–3",
            desc: "Building foundational literacy, numeracy, and social skills through play-based and activity-driven learning.",
          },
          {
            phase: "Upper Primary (Middle School I)",
            grades: "Grades 4–6",
            desc: "Deepening competencies across subjects. Learners sit the KPSEA at the end of Grade 6 for assessment and transition.",
          },
          {
            phase: "Junior Secondary School (Middle School II)",
            grades: "Grades 7–9",
            desc: "Specialist-taught subjects including Integrated Science, Pre-Technical Studies, and Agriculture. Continuous School-Based Assessments (SBAs) count 40% toward Senior School placement.",
          },
        ].map((item) => (
          <div
            key={item.phase}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
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
        {team.map((member) => (
          <div
            key={member.name}
            className="rounded-lg border border-border bg-card p-6 text-center shadow-sm"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold">
              {member.initials}
            </div>
            <h3 className="mt-4 font-display font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
