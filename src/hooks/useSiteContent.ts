import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSlide {
  src: string;
  alt: string;
  caption?: string;
}

export interface StatItem {
  value: string;
  label: string;
  icon: string; // icon name from lucide
}

export interface GalleryPhoto {
  src: string;
  alt: string;
  label: string;
}

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  photo?: string;
}

export interface AboutContent {
  mission: string;
  vision: string;
  description: string;
  academicStructure: {
    phase: string;
    grades: string;
    desc: string;
  }[];
  team: TeamMember[];
}

export function useSiteContent<T>(section: string, fallback: T) {
  return useQuery({
    queryKey: ["site-content", section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content")
        .eq("section", section)
        .maybeSingle();
      if (error || !data) return fallback;
      return data.content as T;
    },
    staleTime: 60_000,
  });
}
