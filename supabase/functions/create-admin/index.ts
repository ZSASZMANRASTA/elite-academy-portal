import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const email = "admin@adamsjunior.ac.ke";
  const password = "Admin123!";

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) {
    // Make sure they have admin role
    await supabase.from("user_roles").upsert(
      { user_id: existing.id, role: "admin" },
      { onConflict: "user_id" }
    );
    await supabase.from("profiles").update({ approved: true }).eq("id", existing.id);
    return new Response(JSON.stringify({ message: "Admin already exists, role confirmed" }));
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Super Admin", role: "admin" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Override role to admin (trigger sets based on metadata, but let's ensure)
  await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", data.user.id);
  await supabase.from("profiles").update({ approved: true }).eq("id", data.user.id);

  return new Response(JSON.stringify({ message: "Admin created", id: data.user.id }));
});
