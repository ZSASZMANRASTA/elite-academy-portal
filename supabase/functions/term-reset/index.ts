import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TABLES = [
  "profiles", "user_roles", "classes", "class_enrollments",
  "courses", "lessons", "enrollments", "lesson_progress",
  "quizzes", "quiz_questions", "quiz_attempts", "quiz_feedback",
  "assignments", "assignment_submissions",
  "attendance", "announcements", "notifications",
  "fee_structures", "student_fees", "fee_payments",
  "newsletter_subscribers", "parent_contacts", "site_content",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify caller is admin
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(url, serviceKey);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden — admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const action: "backup" | "reset" = body.action === "reset" ? "reset" : "backup";
    const resetTargets: string[] = Array.isArray(body.resetTargets) ? body.resetTargets : [];

    // Always backup first
    const snapshot: Record<string, unknown> = {
      generated_at: new Date().toISOString(),
      generated_by: userData.user.email,
      action,
      tables: {},
    };
    for (const t of TABLES) {
      const { data, error } = await admin.from(t).select("*");
      (snapshot.tables as any)[t] = error ? { error: error.message } : data;
    }

    if (action === "reset") {
      const ops: Record<string, () => Promise<any>> = {
        attendance: () => admin.from("attendance").delete().not("id", "is", null),
        quiz_attempts: () => admin.from("quiz_attempts").delete().not("id", "is", null),
        assignment_submissions: () => admin.from("assignment_submissions").delete().not("id", "is", null),
        notifications: () => admin.from("notifications").delete().not("id", "is", null),
        announcements: () => admin.from("announcements").update({ published: false }).eq("published", true),
      };
      const results: Record<string, string> = {};
      for (const target of resetTargets) {
        const op = ops[target];
        if (!op) { results[target] = "unknown target"; continue; }
        const { error } = await op();
        results[target] = error ? `error: ${error.message}` : "cleared";
      }
      (snapshot as any).reset_results = results;
    }

    return new Response(JSON.stringify(snapshot), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
