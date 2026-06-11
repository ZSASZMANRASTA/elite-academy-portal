import { useEffect, useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

type PhaseId = "early" | "upper" | "junior";

const PHASES: { id: PhaseId; label: string }[] = [
  { id: "early", label: "Early Years (PP1–Grade 3)" },
  { id: "upper", label: "Upper Primary (Grades 4–6)" },
  { id: "junior", label: "Junior Secondary (Grades 7–9)" },
];

type Subject = {
  name: string;
  appliesTo: "all" | PhaseId[];
};

const defaultSubjects: Subject[] = [
  { name: "Mathematics", appliesTo: "all" },
  { name: "English", appliesTo: ["early", "upper", "junior"] },
  { name: "Kiswahili", appliesTo: ["early", "upper", "junior"] },
];

export default function SubjectsPage() {
  // The hook typically returns { data, setData } or similar; adapt below if your hook differs.
  const site = useSiteContent<Subject[]>("subjects", defaultSubjects) as any;
  const initial = site?.data ?? defaultSubjects;

  const [subjects, setSubjects] = useState<Subject[]>(initial);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [allClasses, setAllClasses] = useState(true);
  const [phases, setPhases] = useState<PhaseId[]>([]);

  useEffect(() => {
    setSubjects(initial);
  }, [initial]);

  function resetEditor() {
    setEditingIndex(null);
    setName("");
    setAllClasses(true);
    setPhases([]);
  }

  function startEdit(idx: number) {
    const s = subjects[idx];
    setEditingIndex(idx);
    setName(s.name);
    if (s.appliesTo === "all") {
      setAllClasses(true);
      setPhases([]);
    } else {
      setAllClasses(false);
      setPhases(s.appliesTo);
    }
  }

  function togglePhase(id: PhaseId) {
    setPhases((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function saveLocal() {
    const appliesTo: Subject["appliesTo"] = allClasses ? "all" : phases;
    const newSubject: Subject = { name: name.trim(), appliesTo };
    if (!newSubject.name) {
      alert("Please enter a subject name.");
      return;
    }

    let newList: Subject[];
    if (editingIndex !== null) {
      newList = [...subjects];
      newList[editingIndex] = newSubject;
    } else {
      newList = [...subjects, newSubject];
    }
    setSubjects(newList);
    resetEditor();
  }

  async function persist() {
    // Try common save shapes. If your hook exposes a different API, adapt this call.
    if (typeof site?.setData === "function") {
      await site.setData(subjects);
      alert("Subjects saved.");
      return;
    }
    if (typeof site?.mutate === "function") {
      await site.mutate(subjects);
      alert("Subjects saved.");
      return;
    }
    alert(
      "Subjects updated locally. To persist, wire useSiteContent's save/mutate API or tell me how your hook saves site content and I'll adapt."
    );
  }

  function remove(idx: number) {
    if (!confirm(`Remove subject "${subjects[idx].name}"?`)) return;
    const next = subjects.filter((_, i) => i !== idx);
    setSubjects(next);
  }

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-bold">Subjects</h1>
      <p className="mt-2 text-muted-foreground">
        Create and manage subjects; use "Apply to all classes" for core subjects like Mathematics.
      </p>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold">Edit / Add Subject</h2>

          <label className="block mt-4">
            <span className="text-sm">Subject name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full input"
              placeholder="Mathematics"
            />
          </label>

          <label className="flex items-center gap-2 mt-4">
            <input type="checkbox" checked={allClasses} onChange={(e) => setAllClasses(e.target.checked)} />
            <span className="text-sm">Apply to all classes</span>
          </label>

          {!allClasses && (
            <div className="mt-3 grid gap-2">
              {PHASES.map((p) => (
                <label key={p.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={phases.includes(p.id)} onChange={() => togglePhase(p.id)} />
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button onClick={saveLocal} className="btn btn-primary">
              {editingIndex === null ? "Add" : "Update"}
            </button>
            <button onClick={resetEditor} className="btn">
              Clear
            </button>
            <button onClick={persist} className="btn btn-outline ml-auto">
              Save to site
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold">Existing Subjects</h2>
          <ul className="mt-3 space-y-2">
            {subjects.map((s, i) => (
              <li key={`${s.name}-${i}`} className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.appliesTo === "all" ? "All classes" : s.appliesTo.join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(i)} className="btn btn-sm">
                    Edit
                  </button>
                  <button onClick={() => remove(i)} className="btn btn-sm btn-ghost">
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {subjects.length === 0 && <li className="text-sm text-muted-foreground">No subjects defined.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
