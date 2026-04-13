import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, GripVertical } from "lucide-react";
import type { HeroSlide, StatItem, GalleryPhoto, AboutContent, TeamMember } from "@/hooks/useSiteContent";

// Defaults matching current hardcoded content
import heroSchool from "@/assets/hero-school.jpg";
import heroLab from "@/assets/hero-lab.jpg";
import heroSports from "@/assets/hero-sports.jpg";

const defaultHero: HeroSlide[] = [
  { src: heroSchool, alt: "Adam's Junior Academy campus", caption: "" },
  { src: heroLab, alt: "Students in science laboratory", caption: "" },
  { src: heroSports, alt: "Students playing sports", caption: "" },
];

const defaultStats: StatItem[] = [
  { value: "1,200+", label: "Learners (PP1–Grade 9)", icon: "Users" },
  { value: "100%", label: "KPSEA Transition Rate", icon: "Trophy" },
  { value: "56", label: "Specialist & Primary Teachers", icon: "BookOpen" },
  { value: "15+", label: "Years of Excellence", icon: "Award" },
];

const defaultGallery: GalleryPhoto[] = [
  { src: heroSchool, alt: "School campus", label: "Campus" },
  { src: heroLab, alt: "Science lab", label: "Science Lab" },
  { src: heroSports, alt: "Sports field", label: "Sports" },
  { src: heroSchool, alt: "Assembly hall", label: "Assembly" },
  { src: heroLab, alt: "Practical session", label: "Practicals" },
  { src: heroSports, alt: "Athletics", label: "Athletics" },
];

const defaultAbout: AboutContent = {
  description: "Adam's Junior Academy is a Comprehensive School in Saina, Kajiado Central, offering a complete 11-year learning journey from Kindergarten (PP1) through Grade 9 Junior Secondary School under Kenya's Competency-Based Curriculum (CBC).",
  mission: "To provide quality, affordable CBC education that nurtures every learner's competencies, moral integrity, and leadership skills — preparing them to excel in Senior School and beyond.",
  vision: "To be a centre of excellence in competency-based education, producing well-rounded graduates who are innovative, responsible, and ready to make a positive impact in society.",
  academicStructure: [
    { phase: "Early Years Education", grades: "PP1, PP2, Grades 1–3", desc: "Building foundational literacy, numeracy, and social skills through play-based and activity-driven learning." },
    { phase: "Upper Primary (Middle School I)", grades: "Grades 4–6", desc: "Deepening competencies across subjects. Learners sit the KPSEA at the end of Grade 6 for assessment and transition." },
    { phase: "Junior Secondary School (Middle School II)", grades: "Grades 7–9", desc: "Specialist-taught subjects including Integrated Science, Pre-Technical Studies, and Agriculture. Continuous School-Based Assessments (SBAs) count 40% toward Senior School placement." },
  ],
  team: [
    { name: "Mr. Daniel Kipkoech", role: "Principal", initials: "DK" },
    { name: "Mrs. Grace Mutua", role: "Deputy Principal (Primary)", initials: "GM" },
    { name: "Mr. James Ochieng", role: "Deputy Principal (JSS)", initials: "JO" },
    { name: "Mrs. Sarah Wanjiku", role: "Head of Early Years", initials: "SW" },
  ],
};

function useSectionContent<T>(section: string, fallback: T) {
  return useQuery({
    queryKey: ["site-content", section],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", section)
        .maybeSingle();
      return (data?.content as T) ?? fallback;
    },
  });
}

function useSaveSection() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ section, content }: { section: string; content: any }) => {
      const { error } = await supabase.from("site_content").upsert(
        { section, content, updated_by: user?.id },
        { onConflict: "section" }
      );
      if (error) throw error;
    },
    onSuccess: (_, { section }) => {
      qc.invalidateQueries({ queryKey: ["site-content", section] });
      toast.success("Changes saved!");
    },
    onError: () => toast.error("Failed to save changes"),
  });
}

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Hero Editor ──────────────────────────────────────
function HeroEditor() {
  const { data: slides, isLoading } = useSectionContent<HeroSlide[]>("hero", defaultHero);
  const save = useSaveSection();
  const [items, setItems] = useState<HeroSlide[] | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);

  const current = items ?? slides ?? defaultHero;

  const update = (idx: number, field: keyof HeroSlide, val: string) => {
    const next = [...current];
    next[idx] = { ...next[idx], [field]: val };
    setItems(next);
  };

  const handleUpload = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const url = await uploadImage(file);
      update(idx, "src", url);
    } catch { toast.error("Upload failed"); }
    setUploading(null);
  };

  const addSlide = () => setItems([...current, { src: "", alt: "", caption: "" }]);
  const removeSlide = (idx: number) => setItems(current.filter((_, i) => i !== idx));

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-4">
      {current.map((s, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Slide {i + 1}</span>
              <Button size="icon" variant="ghost" className="ml-auto h-8 w-8 text-destructive" onClick={() => removeSlide(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {s.src && <img src={s.src} alt={s.alt} className="h-32 w-full rounded object-cover" />}
            <div>
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleUpload(i, e.target.files[0])}
                  disabled={uploading === i}
                />
                {uploading === i && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>
            <div>
              <Label>Alt text</Label>
              <Input value={s.alt} onChange={(e) => update(i, "alt", e.target.value)} />
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input value={s.caption || ""} onChange={(e) => update(i, "caption", e.target.value)} />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={addSlide}><Plus className="mr-1 h-4 w-4" /> Add Slide</Button>
        <Button onClick={() => save.mutate({ section: "hero", content: current })} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Save Hero
        </Button>
      </div>
    </div>
  );
}

// ─── Stats Editor ──────────────────────────────────────
function StatsEditor() {
  const { data: stats, isLoading } = useSectionContent<StatItem[]>("stats", defaultStats);
  const save = useSaveSection();
  const [items, setItems] = useState<StatItem[] | null>(null);
  const current = items ?? stats ?? defaultStats;

  const update = (idx: number, field: keyof StatItem, val: string) => {
    const next = [...current];
    next[idx] = { ...next[idx], [field]: val };
    setItems(next);
  };

  const addStat = () => setItems([...current, { value: "", label: "", icon: "Star" }]);
  const removeStat = (idx: number) => setItems(current.filter((_, i) => i !== idx));

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-4">
      {current.map((s, i) => (
        <Card key={i}>
          <CardContent className="pt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Value</Label>
              <Input value={s.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="1,200+" />
            </div>
            <div>
              <Label>Label</Label>
              <Input value={s.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="Learners" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Icon</Label>
                <Input value={s.icon} onChange={(e) => update(i, "icon", e.target.value)} placeholder="Users" />
              </div>
              <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => removeStat(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={addStat}><Plus className="mr-1 h-4 w-4" /> Add Stat</Button>
        <Button onClick={() => save.mutate({ section: "stats", content: current })} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Save Stats
        </Button>
      </div>
    </div>
  );
}

// ─── Gallery Editor ────────────────────────────────────
function GalleryEditor() {
  const { data: photos, isLoading } = useSectionContent<GalleryPhoto[]>("gallery", defaultGallery);
  const save = useSaveSection();
  const [items, setItems] = useState<GalleryPhoto[] | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const current = items ?? photos ?? defaultGallery;

  const update = (idx: number, field: keyof GalleryPhoto, val: string) => {
    const next = [...current];
    next[idx] = { ...next[idx], [field]: val };
    setItems(next);
  };

  const handleUpload = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const url = await uploadImage(file);
      update(idx, "src", url);
    } catch { toast.error("Upload failed"); }
    setUploading(null);
  };

  const addPhoto = () => setItems([...current, { src: "", alt: "", label: "" }]);
  const removePhoto = (idx: number) => setItems(current.filter((_, i) => i !== idx));

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {current.map((p, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-3">
              {p.src && <img src={p.src} alt={p.alt} className="h-28 w-full rounded object-cover" />}
              <div>
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(i, e.target.files[0])} disabled={uploading === i} />
              </div>
              <div>
                <Label>Alt text</Label>
                <Input value={p.alt} onChange={(e) => update(i, "alt", e.target.value)} />
              </div>
              <div>
                <Label>Label</Label>
                <Input value={p.label} onChange={(e) => update(i, "label", e.target.value)} />
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removePhoto(i)}>
                <Trash2 className="mr-1 h-3 w-3" /> Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={addPhoto}><Plus className="mr-1 h-4 w-4" /> Add Photo</Button>
        <Button onClick={() => save.mutate({ section: "gallery", content: current })} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Save Gallery
        </Button>
      </div>
    </div>
  );
}

// ─── About Editor ──────────────────────────────────────
function AboutEditor() {
  const { data: about, isLoading } = useSectionContent<AboutContent>("about", defaultAbout);
  const save = useSaveSection();
  const [content, setContent] = useState<AboutContent | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const current = content ?? about ?? defaultAbout;

  const set = (field: keyof AboutContent, val: any) => setContent({ ...current, [field]: val });

  const updateTeam = (idx: number, field: keyof TeamMember, val: string) => {
    const next = [...current.team];
    next[idx] = { ...next[idx], [field]: val };
    set("team", next);
  };

  const handleTeamPhoto = async (idx: number, file: File) => {
    setUploading(idx);
    try {
      const url = await uploadImage(file);
      updateTeam(idx, "photo", url);
    } catch { toast.error("Upload failed"); }
    setUploading(null);
  };

  const updateStructure = (idx: number, field: string, val: string) => {
    const next = [...current.academicStructure];
    next[idx] = { ...next[idx], [field]: val };
    set("academicStructure", next);
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <div className="space-y-6">
      <div>
        <Label>Page Description</Label>
        <Textarea value={current.description} onChange={(e) => set("description", e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Mission</Label>
        <Textarea value={current.mission} onChange={(e) => set("mission", e.target.value)} rows={3} />
      </div>
      <div>
        <Label>Vision</Label>
        <Textarea value={current.vision} onChange={(e) => set("vision", e.target.value)} rows={3} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Academic Structure</h3>
        {current.academicStructure.map((s, i) => (
          <Card key={i} className="mb-3">
            <CardContent className="pt-4 grid gap-2 sm:grid-cols-3">
              <div><Label>Phase</Label><Input value={s.phase} onChange={(e) => updateStructure(i, "phase", e.target.value)} /></div>
              <div><Label>Grades</Label><Input value={s.grades} onChange={(e) => updateStructure(i, "grades", e.target.value)} /></div>
              <div><Label>Description</Label><Input value={s.desc} onChange={(e) => updateStructure(i, "desc", e.target.value)} /></div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={() => set("academicStructure", [...current.academicStructure, { phase: "", grades: "", desc: "" }])}>
          <Plus className="mr-1 h-3 w-3" /> Add Phase
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Leadership Team</h3>
        {current.team.map((m, i) => (
          <Card key={i} className="mb-3">
            <CardContent className="pt-4 space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <div><Label>Name</Label><Input value={m.name} onChange={(e) => updateTeam(i, "name", e.target.value)} /></div>
                <div><Label>Role</Label><Input value={m.role} onChange={(e) => updateTeam(i, "role", e.target.value)} /></div>
                <div><Label>Initials</Label><Input value={m.initials} onChange={(e) => updateTeam(i, "initials", e.target.value)} /></div>
              </div>
              <div className="flex items-center gap-2">
                {m.photo && <img src={m.photo} alt={m.name} className="h-12 w-12 rounded-full object-cover" />}
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleTeamPhoto(i, e.target.files[0])} disabled={uploading === i} />
                <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => set("team", current.team.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" size="sm" onClick={() => set("team", [...current.team, { name: "", role: "", initials: "", photo: "" }])}>
          <Plus className="mr-1 h-3 w-3" /> Add Member
        </Button>
      </div>

      <Button onClick={() => save.mutate({ section: "about", content: current })} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Save About Page
      </Button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────
const SiteEditorPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Site Content Editor</h1>
        <p className="text-muted-foreground">Edit images, text, and content on the public website.</p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="hero" className="mt-4"><HeroEditor /></TabsContent>
        <TabsContent value="stats" className="mt-4"><StatsEditor /></TabsContent>
        <TabsContent value="gallery" className="mt-4"><GalleryEditor /></TabsContent>
        <TabsContent value="about" className="mt-4"><AboutEditor /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteEditorPage;
