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

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  hoursWeekday: string;
  hoursSaturday: string;
  hoursSunday: string;
  mapEmbedUrl: string;
}

export const defaultContactInfo: ContactInfo = {
  phone: "0712 674 789",
  email: "adamsjunioracademy@gmail.com",
  address: "P.O. Box 179 - 01100, Kajiado",
  hoursWeekday: "Mon – Fri: 7:00 AM – 4:30 PM (Upper) · 7:30 AM – 4:00 PM (Lower & PP1/PP2)",
  hoursSaturday: "Saturday: 8:00 AM – 12:00 PM",
  hoursSunday: "Sunday: Closed",
  mapEmbedUrl: "https://maps.google.com/maps?q=Kajiado&z=13&output=embed",
};

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
