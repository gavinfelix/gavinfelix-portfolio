// Client-side functions for fetching and managing prompt templates via API
import type { PromptTemplate } from "@/lib/db/schema";

export type CreateTemplateInput = {
  name: string;
  description?: string;
  content: string;
  isFavorite?: boolean;
};

export type UpdateTemplateInput = Partial<
  Pick<CreateTemplateInput, "name" | "description" | "content" | "isFavorite">
>;

/**
 * Fetch all templates for the current user
 */
export async function fetchTemplates(): Promise<PromptTemplate[]> {
  const response = await fetch("/api/templates", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch templates: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new template for the current user
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<PromptTemplate> {
  const response = await fetch("/api/templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.error || "Invalid input");
    }
    throw new Error(`Failed to create template: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing template (only if it belongs to the current user)
 */
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<PromptTemplate> {
  const response = await fetch(`/api/templates/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 404) {
      throw new Error("Template not found");
    }
    if (response.status === 400) {
      const error = await response.json();
      throw new Error(error.error || "Invalid input");
    }
    throw new Error(`Failed to update template: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete an existing template (only if it belongs to the current user)
 */
export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`/api/templates/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    if (response.status === 404) {
      throw new Error("Template not found");
    }
    throw new Error(`Failed to delete template: ${response.statusText}`);
  }
}

