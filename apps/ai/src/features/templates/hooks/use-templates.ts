"use client";

// React hook for fetching and managing prompt templates
import { useCallback } from "react";
import useSWR from "swr";
import type { PromptTemplate } from "@/lib/db/schema";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from "../lib/templates-client";

export function useTemplates() {
  const cacheKey = "/api/templates";

  const {
    data: templates,
    error,
    isLoading,
    mutate,
  } = useSWR<PromptTemplate[]>(cacheKey, fetchTemplates, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Reload templates from server
  const reload = useCallback(() => {
    return mutate();
  }, [mutate]);

  // Create a new template with optimistic cache update and server revalidation
  const create = useCallback(
    async (input: CreateTemplateInput): Promise<PromptTemplate> => {
      const newTemplate = await createTemplate(input);

      // Optimistically update the cache by prepending new template
      await mutate(
        (current) => {
          if (!current) return [newTemplate];
          return [newTemplate, ...current];
        },
        { revalidate: false }
      );

      // Revalidate to ensure consistency
      await mutate();

      return newTemplate;
    },
    [mutate]
  );

  // Update an existing template with optimistic cache update and server revalidation
  const update = useCallback(
    async (id: string, input: UpdateTemplateInput): Promise<PromptTemplate> => {
      const updatedTemplate = await updateTemplate(id, input);

      // Optimistically update the cache by replacing matching template
      await mutate(
        (current) => {
          if (!current) return [updatedTemplate];
          return current.map((template) =>
            template.id === id ? updatedTemplate : template
          );
        },
        { revalidate: false }
      );

      // Revalidate to ensure consistency
      await mutate();

      return updatedTemplate;
    },
    [mutate]
  );

  // Delete a template with optimistic cache update and server revalidation
  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteTemplate(id);

      // Optimistically update the cache by filtering out deleted template
      await mutate(
        (current) => {
          if (!current) return [];
          return current.filter((template) => template.id !== id);
        },
        { revalidate: false }
      );

      // Revalidate to ensure consistency
      await mutate();
    },
    [mutate]
  );

  return {
    templates: templates || [],
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : undefined,
    reload,
    create,
    update,
    remove,
  };
}
