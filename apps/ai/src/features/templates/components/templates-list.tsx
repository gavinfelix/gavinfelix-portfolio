"use client";

// Templates list component displaying user's prompt templates
import { formatDistanceToNow } from "date-fns";
import { Edit, Star, Trash2 } from "lucide-react";
import type { PromptTemplate } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader } from "@/components/elements/loader";

type TemplatesListProps = {
  templates: PromptTemplate[];
  isLoading?: boolean;
  onEdit: (template: PromptTemplate) => void;
  onDelete: (template: PromptTemplate) => void;
};

export function TemplatesList({
  templates,
  isLoading,
  onEdit,
  onDelete,
}: TemplatesListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Your prompt templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader size={24} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Your prompt templates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No templates yet. Create your first template to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render list of template items with edit and delete actions
  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates</CardTitle>
        <CardDescription>Your prompt templates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual template item card with metadata and action buttons
function TemplateItem({
  template,
  onEdit,
  onDelete,
}: {
  template: PromptTemplate;
  onEdit: (template: PromptTemplate) => void;
  onDelete: (template: PromptTemplate) => void;
}) {
  const updatedAt = new Date(template.updatedAt);
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });

  // Render template card with name, description, favorite indicator, and action buttons
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{template.name}</h4>
          {template.isFavorite && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Updated {timeAgo}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(template)}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit template</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(template)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete template</span>
        </Button>
      </div>
    </div>
  );
}

