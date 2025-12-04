// Settings page wrapper that fetches admin user data and renders client component
import { requireAdmin } from "@/lib/auth";
import { getAdminUserById } from "@/lib/queries";
import { SettingsPage } from "./settings-client";

export default async function SettingsPageWrapper() {
  const user = await requireAdmin();

  const adminUser = await getAdminUserById(user.id);

  if (!adminUser) {
    return null;
  }

  return <SettingsPage user={adminUser} />;
}

