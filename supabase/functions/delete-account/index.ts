import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const token = req.headers.get("Authorization")!.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return new Response("Unauthorized", { status: 401 });
  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.admin.deleteUser(user.id);
  return new Response("ok", { status: 200 });
});
