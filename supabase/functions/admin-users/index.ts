import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "FUNCTION_NOT_CONFIGURED" }, 500);
  }
  if (!authorization) {
    return json({ error: "AUTH_REQUIRED" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authorization },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json({ error: "AUTH_REQUIRED" }, 401);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data: caller, error: callerError } = await serviceClient
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .single();

  if (callerError || caller?.role !== "admin" || caller.active !== true) {
    return json({ error: "ADMIN_REQUIRED" }, 403);
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "admin" ? "admin" : "sales";

  if (
    !email ||
    !displayName ||
    password.length < 8 ||
    !["admin", "sales"].includes(role)
  ) {
    return json({ error: "INVALID_ACCOUNT_INPUT" }, 400);
  }

  const { data: created, error: createError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    });

  if (createError || !created.user) {
    return json(
      { error: createError?.message || "CREATE_USER_FAILED" },
      400,
    );
  }

  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .upsert(
      {
        id: created.user.id,
        display_name: displayName,
        role,
        active: true,
      },
      { onConflict: "id" },
    )
    .select("id, display_name, role, active")
    .single();

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return json({ error: profileError.message }, 400);
  }

  return json(profile);
});
