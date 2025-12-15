// Settings page wrapper that requires admin and renders client component
import { requireAdmin } from "@/lib/auth";
import { SettingsPage } from "./settings-client";

export default async function SettingsPageWrapper() {
  await requireAdmin();

  return <SettingsPage />;
}

