import { BookOpen, FlaskConical, Monitor, Dumbbell, Sprout, Palette } from "lucide-react";

const curriculumPhases = [
  {
    phase: "Early Years (PP1–Grade 3)",
    areas: [
      "Literacy & Indigenous Languages",
      "Kiswahili & English",
      "Mathematics",
      "Environmental Activities",
      "Creative Arts",
      "Religious Education (CRE/IRE)",
    ],
  },
  {
    phase: "Upper Primary (Grades 4–6)",
    areas: [
      "English",
      "Kiswahili",
      "Mathematics",
      "Science & Technology",
      "Social Studies",
      "Agriculture & Nutrition",
      "Creative Arts & Sports",
      "Religious Education",
    ],
  },
  {
    phase: "Junior Secondary (Grades 7–9)",
    areas: [
      "English",
      "Kiswahili",
      "Mathematics",
      "Integrated Science",
      "Pre-Technical Studies",
      "Social Studies",
      "Agriculture",
      "Creative Arts & Sports",
      "Religious Education",
      "Business Studies",
    ],
  },
];

const facilities = [
  {
    name: "Integrated Science Lab",
    desc: "Purpose-built laboratory for JSS practicals in Physics, Chemistry, and Biology",
    icon: <FlaskConical className="h-6 w-6" />,
  },
  {
    name: "ICT & Computer Lab",
    desc: "40+ workstations with internet for digital literacy across all levels",
    icon: <Monitor className="h-6 w-6" />,
  },
  {
    name: "Library & Resource Centre",
    desc: "Over 10,000 volumes plus digital resources supporting the CBC curriculum",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    name: "Pre-Technical Workshop",
    desc: "Equipped for woodwork, metalwork, and hands-on pre-technical projects",
    icon: <Palette className="h-6 w-6" />,
  },
  {
    name: "Sports Complex",
    desc: "Football pitch, basketball court, and athletics track with staggered schedules",
    icon: <Dumbbell className="h-6 w-6" />,
  },
  {
    name: "Early Years Play Area",
    desc: "Safe, dedicated outdoor play and learning space for PP1–Grade 3 learners",
    icon: <Sprout className="h-6 w-6" />,
  },
];

const Academics = () => {
  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">Academics</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Our curriculum follows Kenya's Competency-Based Curriculum (CBC), spanning Early Years
        Education through Junior Secondary School (Grade 9). We emphasise continuous School-Based
        Assessments, practical learning, and holistic competency development.
      </p>

      {/* Assessment Info */}
      <div className="mt-8 rounded-lg border border-accent bg-accent/10 p-6">
        <h3 className="font-display font-semibold">Assessment & Transition</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span><strong>KPSEA</strong> — Sat at the end of Grade 6 for assessment and transition to JSS.</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span><strong>School-Based Assessments (SBAs)</strong> — Continuous projects and practicals in Grades 7–8 contribute 40% of the final placement score.</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span><strong>KJSEA</strong> — Sat at the end of Grade 9, contributing 60% toward Senior School placement.</span>
          </li>
        </ul>
      </div>

      <h2 className="mt-12 font-display text-2xl font-bold">Curriculum by Phase</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {curriculumPhases.map((group) => (
          <div
            key={group.phase}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="font-display font-semibold text-primary">{group.phase}</h3>
            <ul className="mt-3 space-y-2">
              {group.areas.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Facilities</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <div
            key={f.name}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {f.icon}
            </div>
            <h3 className="mt-3 font-display font-semibold">{f.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Academics;
