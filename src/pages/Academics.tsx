import { BookOpen, FlaskConical, Monitor, Dumbbell } from "lucide-react";

const subjects = [
  { category: "Sciences", items: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"] },
  { category: "Humanities", items: ["English", "Kiswahili", "History", "Geography", "CRE/IRE"] },
  { category: "Technical", items: ["Business Studies", "Agriculture", "Home Science", "Art & Design"] },
];

const facilities = [
  { name: "Science Laboratories", desc: "Fully equipped Physics, Chemistry, and Biology labs", icon: <FlaskConical className="h-6 w-6" /> },
  { name: "Computer Lab", desc: "40+ workstations with high-speed internet", icon: <Monitor className="h-6 w-6" /> },
  { name: "Library", desc: "Over 10,000 volumes and digital resources", icon: <BookOpen className="h-6 w-6" /> },
  { name: "Sports Complex", desc: "Football pitch, basketball court, athletics track", icon: <Dumbbell className="h-6 w-6" /> },
];

const Academics = () => {
  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">Academics</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Our comprehensive curriculum follows the Kenyan 8-4-4 / CBC system, enriched with co-curricular programmes.
      </p>

      <h2 className="mt-12 font-display text-2xl font-bold">Subjects Offered</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {subjects.map((group) => (
          <div key={group.category} className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold text-primary">{group.category}</h3>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Facilities</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facilities.map((f) => (
          <div key={f.name} className="rounded-lg border border-border bg-card p-6 shadow-sm">
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
