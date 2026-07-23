import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Not authenticated" }, 401);

    // Only admins can fully delete a student
    const { data: isAdmin } = await callerClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Only admins can delete students" }, 403);

    const { student_id } = await req.json();
    if (!student_id) return json({ error: "Missing student_id" }, 400);
    if (student_id === caller.id) return json({ error: "You cannot delete your own account" }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify target is a student (safety: don't allow deleting teachers/admins here)
    const { data: targetRole } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", student_id)
      .maybeSingle();
    if (targetRole && targetRole.role !== "student") {
      return json({ error: "Target user is not a student" }, 400);
    }

    // Best-effort cleanup of related rows (in case FKs aren't cascading).
    // Tables that key rows by the student's auth uid via `student_id`:
    const byStudentId = [
      "class_enrollments",
      "enrollments",
      "attendance",
      "assignment_submissions",
      "quiz_attempts",
      "lesson_progress",
      "parent_contacts",
      "student_fees",
    ] as const;
    for (const t of byStudentId) {
      await admin.from(t).delete().eq("student_id", student_id);
    }

    // fee_payments has no student_id — payments belong to student_fees which
    // we just deleted above, so their fee_payments cascade (FK) or are already
    // orphaned. Explicitly clear any left behind that were recorded by/for this user:
    await admin.from("fee_payments").delete().eq("recorded_by", student_id);

    // Notifications reference the user via target_user_id / sender_id, not student_id.
    await admin.from("notifications").delete().eq("target_user_id", student_id);
    await admin.from("notifications").delete().eq("sender_id", student_id);

    // Shop orders use user_id.
    await admin.from("shop_orders").delete().eq("user_id", student_id);

    // Quiz feedback has no direct student column (it's keyed by attempt_id which
    // was cascaded when we deleted quiz_attempts above), nothing to do here.

    await admin.from("user_roles").delete().eq("user_id", student_id);
    await admin.from("profiles").delete().eq("id", student_id);

    // Finally delete the auth user
    const { error: authErr } = await admin.auth.admin.deleteUser(student_id);
    if (authErr) return json({ error: authErr.message }, 400);

    return json({ success: true });
  } catch (err: any) {
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
