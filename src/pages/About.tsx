import { Users, Target, Eye } from "lucide-react";

const team = [
  { name: "Dr. Sarah Wanjiku", role: "Principal", initials: "SW" },
  { name: "Mr. James Ochieng", role: "Deputy Principal", initials: "JO" },
  { name: "Mrs. Grace Mutua", role: "Dean of Studies", initials: "GM" },
  { name: "Mr. Peter Kamau", role: "Head of Sciences", initials: "PK" },
];

const About = () => {
  return (
    <div className="container py-16">
      <h1 className="font-display text-4xl font-bold">About Us</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Adam's Junior Academy is a premier school in Saina, Kajiado Central, committed to holistic education since 2009.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Our Mission</h2>
          <p className="mt-2 text-muted-foreground">
            To provide quality, affordable education that nurtures intellectual curiosity, moral integrity, and leadership skills, preparing students to excel nationally and globally.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10 text-success">
            <Eye className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Our Vision</h2>
          <p className="mt-2 text-muted-foreground">
            To be a centre of excellence in education, producing well-rounded graduates who are innovative, responsible, and ready to make a positive impact in society.
          </p>
        </div>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold">Leadership Team</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((member) => (
          <div key={member.name} className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
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
