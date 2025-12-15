"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminSettings = {
  siteName: string;
  allowSignup: boolean;
  dailyTokenLimit: number;
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

export function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [siteName, setSiteName] = useState("");
  const [allowSignup, setAllowSignup] = useState(false);
  const [dailyTokenLimit, setDailyTokenLimit] = useState(0);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        const result: ApiResponse<AdminSettings> = await response.json();

        if (result.ok) {
          setSettings(result.data);
          setSiteName(result.data.siteName);
          setAllowSignup(result.data.allowSignup);
          setDailyTokenLimit(result.data.dailyTokenLimit);
        } else {
          setError(result.error || "Failed to load settings");
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteName,
          allowSignup,
          dailyTokenLimit,
        }),
      });

      const result: ApiResponse<AdminSettings> = await response.json();

      if (result.ok) {
        setSettings(result.data);
        setSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-foreground/70">Configure admin panel settings.</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-foreground/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-foreground/70">Configure admin panel settings.</p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-500 bg-green-500/10 p-4">
          <p className="text-sm text-green-600 dark:text-green-400">
            Settings saved successfully
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Enter site name"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowSignup"
              checked={allowSignup}
              onChange={(e) => setAllowSignup(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="allowSignup" className="cursor-pointer">
              Allow Signup
            </Label>
          </div>
          <p className="text-xs text-foreground/50">
            Enable or disable user registration
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dailyTokenLimit">Daily Token Limit</Label>
          <Input
            id="dailyTokenLimit"
            type="number"
            min="0"
            value={dailyTokenLimit}
            onChange={(e) => setDailyTokenLimit(Number(e.target.value))}
            placeholder="Enter daily token limit"
            required
          />
          <p className="text-xs text-foreground/50">
            Maximum tokens allowed per day per user
          </p>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
