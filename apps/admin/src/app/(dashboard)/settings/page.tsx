import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getAdminUserById } from "@/lib/queries";
import { SettingsPage } from "./settings-client";

export default async function SettingsPageWrapper() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getAdminUserById(session.id);

  if (!user) {
    redirect("/login");
  }

  return <SettingsPage user={user} />;
}
