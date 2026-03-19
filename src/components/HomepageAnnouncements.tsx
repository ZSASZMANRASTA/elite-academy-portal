import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

const HomepageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    supabase
      .from("announcements")
      .select("id, title, content, priority, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setAnnouncements(data); });
  }, []);

  if (announcements.length === 0) return null;

  return (
    <section className="container py-16">
      <div className="flex items-center gap-2 justify-center mb-2">
        <Megaphone className="h-6 w-6 text-primary" />
        <h2 className="text-center font-display text-3xl font-bold">Announcements</h2>
      </div>
      <p className="mx-auto mt-1 max-w-xl text-center text-muted-foreground mb-10">
        Stay updated with the latest news from Adam's Junior Academy.
      </p>
      <div className="mx-auto max-w-3xl space-y-4">
        {announcements.map(a => (
          <div
            key={a.id}
            className={`rounded-lg border p-5 transition-shadow hover:shadow-md ${
              a.priority === "urgent"
                ? "border-destructive/50 bg-destructive/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                  {a.title}
                  {a.priority !== "normal" && (
                    <Badge variant={a.priority === "urgent" ? "destructive" : "default"}>
                      {a.priority}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(a.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomepageAnnouncements;
