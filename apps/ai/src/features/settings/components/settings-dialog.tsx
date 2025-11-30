"use client";

// Settings dialog component for managing user chat preferences
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/toast";
import { chatModels, DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { fetchUserSettings, updateUserSettings } from "../lib/settings-client";

export function SettingsDialog() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number | null>(null);
  const [useTemplatesAsSystem, setUseTemplatesAsSystem] =
    useState<boolean>(true);

  // Fetch user settings when dialog opens
  useEffect(() => {
    if (open && session?.user?.id) {
      setLoading(true);
      fetchUserSettings()
        .then((settings) => {
          if (settings) {
            setModel(settings.model || DEFAULT_CHAT_MODEL);
            setTemperature(
              settings.temperature ? parseFloat(settings.temperature) : 0.7
            );
            setMaxTokens(settings.maxTokens || null);
            setUseTemplatesAsSystem(settings.useTemplatesAsSystem ?? true);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load user settings:", error);
          setLoading(false);
        });
    }
  }, [open, session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      return;
    }

    setSaving(true);
    try {
      await updateUserSettings({
        model: model === DEFAULT_CHAT_MODEL ? null : model,
        temperature: temperature,
        maxTokens: maxTokens,
        useTemplatesAsSystem: useTemplatesAsSystem,
      });

      toast({
        type: "success",
        description: "Settings saved successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        type: "error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
          <DialogDescription>
            Configure your chat preferences. These settings will be applied to
            all new conversations.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading settings...
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_CHAT_MODEL}>Default</SelectItem>
                  {chatModels.map((chatModel) => (
                    <SelectItem key={chatModel.id} value={chatModel.id}>
                      {chatModel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature</Label>
                <span className="text-sm text-muted-foreground">
                  {temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={([value]) => setTemperature(value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness. Lower values make responses more focused
                and deterministic.
              </p>
            </div>

            {/* Max Tokens Input */}
            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min={1}
                placeholder="Leave empty for default"
                value={maxTokens || ""}
                onChange={(e) =>
                  setMaxTokens(
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of tokens to generate. Leave empty to use the
                model's default.
              </p>
            </div>

            {/* Use Templates as System Prompt Switch */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="use-templates">
                  Use templates as system prompt
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, selected prompt templates will be prepended to
                  the system prompt.
                </p>
              </div>
              <Switch
                id="use-templates"
                checked={useTemplatesAsSystem}
                onCheckedChange={setUseTemplatesAsSystem}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
