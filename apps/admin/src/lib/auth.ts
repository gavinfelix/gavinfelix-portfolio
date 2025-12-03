import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;

  if (role !== "admin") {
    redirect("/");
  }

  return user;
}

