// ──────────────────────────────────────────────────────────────
// Template Hooks (TanStack Query) — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { useQuery, useMutation } from "@tanstack/react-query";
import queryClient from "../lib/queryClient";
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../lib/api";

/**
 * Fetch all templates (lightweight list).
 * Returns { data, isLoading, isError, error, refetch }
 */
export const useTemplatesList = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await getTemplates();
      return res.data;
    },
  });

/**
 * Fetch a single template by ID (full detail).
 * Only runs when id is truthy.
 */
export const useTemplate = (id) =>
  useQuery({
    queryKey: ["template", id],
    queryFn: async () => {
      const res = await getTemplate(id);
      return res.data;
    },
    enabled: !!id,
  });

/**
 * Create a new template.
 * Invalidates the templates list cache on success.
 */
export const useCreateTemplate = () =>
  useMutation({
    mutationFn: async (data) => {
      const res = await createTemplate(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

/**
 * Update an existing template.
 * Invalidates both the templates list and the individual template cache.
 */
export const useUpdateTemplate = () =>
  useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await updateTemplate(id, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({
        queryKey: ["template", variables.id],
      });
    },
  });

/**
 * Delete a template.
 * Invalidates the templates list cache on success.
 */
export const useDeleteTemplate = () =>
  useMutation({
    mutationFn: async (id) => {
      await deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
