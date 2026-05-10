import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useInactivityLogout(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;

    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        toast.warning("Signed out due to inactivity");
        await supabase.auth.signOut();
        window.location.href = "/login";
      }, TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [enabled]);
}
