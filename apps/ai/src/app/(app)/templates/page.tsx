"use client";

// Templates management page for creating, editing, and deleting prompt templates
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@/contexts/session-context";
import { useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/elements/loader";
import { toast } from "@/components/toast";
import { TemplatesList } from "@/features/templates/components/templates-list";
import { TemplateForm } from "@/features/templates/components/template-form";
import { DeleteTemplateDialog } from "@/features/templates/components/delete-template-dialog";
import { useTemplates } from "@/features/templates/hooks/use-templates";
import type { PromptTemplate } from "@/lib/db/schema";

export default function TemplatesPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading } = useSessionContext();
  const {
    templates,
    isLoading,
    isError,
    error,
    reload,
    create,
    update,
    remove,
  } = useTemplates();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(
    null
  );
  const [deletingTemplate, setDeletingTemplate] =
    useState<PromptTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/login");
    }
  }, [isSessionLoading, session, router]);

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size={32} />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h2 className="text-lg font-semibold text-destructive">
            Error loading templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error || "Failed to load templates"}
          </p>
        </div>
      </div>
    );
  }

  const handleCreate = async (data: {
    name: string;
    description?: string;
    content: string;
    isFavorite?: boolean;
  }) => {
    try {
      setIsSubmitting(true);
      await create(data);
      setIsCreateDialogOpen(false);
      await reload();
      toast({
        type: "success",
        description: "Template created successfully",
      });
    } catch (err) {
      console.error("Failed to create template:", err);
      toast({
        type: "error",
        description:
          err instanceof Error ? err.message : "Failed to create template",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    content: string;
    isFavorite?: boolean;
  }) => {
    if (!editingTemplate) return;

    try {
      setIsSubmitting(true);
      await update(editingTemplate.id, data);
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      await reload();
      toast({
        type: "success",
        description: "Template updated successfully",
      });
    } catch (err) {
      console.error("Failed to update template:", err);
      toast({
        type: "error",
        description:
          err instanceof Error ? err.message : "Failed to update template",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (template: PromptTemplate) => {
    setDeletingTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;

    try {
      setIsDeleting(true);
      await remove(deletingTemplate.id);
      setIsDeleteDialogOpen(false);
      setDeletingTemplate(null);
      await reload();
      toast({
        type: "success",
        description: "Template deleted successfully",
      });
    } catch (err) {
      console.error("Failed to delete template:", err);
      toast({
        type: "error",
        description:
          err instanceof Error ? err.message : "Failed to delete template",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prompt Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your prompt templates for chat conversations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Templates list */}
      <TemplatesList
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create template dialog */}
      <TemplateForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* Edit template dialog */}
      <TemplateForm
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingTemplate(null);
          }
        }}
        onSubmit={handleUpdate}
        initialValue={editingTemplate}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation dialog */}
      <DeleteTemplateDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeletingTemplate(null);
          }
        }}
        template={deletingTemplate}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
