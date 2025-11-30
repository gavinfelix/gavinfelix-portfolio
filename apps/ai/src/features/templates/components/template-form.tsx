"use client";

// Template form component for creating and editing templates
import { useEffect, useState } from "react";
import type { PromptTemplate } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type TemplateFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    content: string;
    isFavorite?: boolean;
  }) => Promise<void>;
  initialValue?: PromptTemplate | null;
  isSubmitting?: boolean;
};

export function TemplateForm({
  open,
  onOpenChange,
  onSubmit,
  initialValue,
  isSubmitting = false,
}: TemplateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  // Reset form when dialog opens/closes or initialValue changes
  useEffect(() => {
    if (open) {
      if (initialValue) {
        setName(initialValue.name);
        setDescription(initialValue.description || "");
        setContent(initialValue.content);
        setIsFavorite(initialValue.isFavorite);
      } else {
        setName("");
        setDescription("");
        setContent("");
        setIsFavorite(false);
      }
    }
  }, [open, initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !content.trim()) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
      isFavorite,
    });
  };

  const isEditMode = !!initialValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Template" : "New Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your prompt template"
              : "Create a new prompt template for your chats"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="template-name">Name *</Label>
              <Input
                id="template-name"
                placeholder="Template name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description field */}
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Content field */}
            <div className="space-y-2">
              <Label htmlFor="template-content">Content *</Label>
              <Textarea
                id="template-content"
                placeholder="Enter your prompt template content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
                disabled={isSubmitting}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This content will be used as the prompt when the template is
                selected.
              </p>
            </div>

            {/* Favorite switch */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="template-favorite">Favorite</Label>
                <p className="text-xs text-muted-foreground">
                  Mark this template as a favorite for quick access.
                </p>
              </div>
              <Switch
                id="template-favorite"
                checked={isFavorite}
                onCheckedChange={setIsFavorite}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !content.trim()}>
              {isSubmitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

