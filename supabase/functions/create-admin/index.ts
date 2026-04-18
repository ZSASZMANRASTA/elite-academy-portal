import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface RequestPayload {
  email: string;
  full_name: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { email, full_name } = (await req.json()) as RequestPayload;

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Missing email or full_name" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authUser = JSON.parse(
      new TextDecoder().decode(
        new Uint8Array(
          atob(authHeader.replace("Bearer ", "").split(".")[1])
            .split("")
            .map((c) => c.charCodeAt(0))
        )
      )
    );

    const adminCheckRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/has_role`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authHeader.split(" ")[1]}`,
          "X-Client-Info": "functions-js/0.0.0",
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          _user_id: authUser.sub,
          _role: "admin",
        }),
      }
    );

    if (!adminCheckRes.ok) {
      return new Response(
        JSON.stringify({ error: "Permission denied. Only admins can create admins." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isAdmin = await adminCheckRes.json();
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Permission denied. Only admins can create admins." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const createUserRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          "X-Client-Info": "functions-js/0.0.0",
        },
        body: JSON.stringify({
          email,
          password: Math.random().toString(36).slice(-12),
          email_confirm: true,
          user_metadata: {
            full_name,
          },
        }),
      }
    );

    if (!createUserRes.ok) {
      const error = await createUserRes.json();
      return new Response(
        JSON.stringify({ error: error.message || "Failed to create user" }),
        {
          status: createUserRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUser = await createUserRes.json();
    const userId = newUser.user.id;

    const createProfileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          "X-Client-Info": "functions-js/0.0.0",
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          id: userId,
          full_name,
          approved: true,
        }),
      }
    );

    if (!createProfileRes.ok) {
      const error = await createProfileRes.json();
      return new Response(
        JSON.stringify({ error: error.message || "Failed to create profile" }),
        {
          status: createProfileRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const createRoleRes = await fetch(
      `${supabaseUrl}/rest/v1/user_roles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          "X-Client-Info": "functions-js/0.0.0",
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          user_id: userId,
          role: "admin",
        }),
      }
    );

    if (!createRoleRes.ok) {
      const error = await createRoleRes.json();
      return new Response(
        JSON.stringify({ error: error.message || "Failed to assign admin role" }),
        {
          status: createRoleRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin account created successfully",
        user_id: userId,
        email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
