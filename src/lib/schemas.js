// ──────────────────────────────────────────────────────────────
// Zod Validation Schemas — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { z } from "zod";

/**
 * Schema for creating/editing an email template.
 * - name: required, max 255 chars, trimmed
 * - description: required, trimmed
 * - body: required, must contain at least one {{placeholder}}
 */
export const templateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(255, "Name too long")
    .trim(),
  description: z
    .string()
    .min(1, "Description is required")
    .trim(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(255, "Subject too long")
    .trim(),
  has_attachments: z.boolean().default(false),
  has_global_attachment: z.boolean().default(false),
  attachment_names: z.array(z.string()).default([]),
  body: z
    .string()
    .min(1, "Template body is required")
    .refine(
      (val) => /\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}/.test(val),
      "Template must contain at least one {{placeholder}}"
    ),
});

/**
 * Schema for CSV file upload.
 * - template_id: must be a valid UUID
 * - csv_file: must be a File instance, .csv extension, max 10MB
 */
export const csvUploadSchema = z.object({
  template_id: z.string().uuid("Please select a valid template"),
  csv_file: z
    .instanceof(File, { message: "Please upload a CSV file" })
    .refine((f) => f.name.endsWith(".csv"), "File must be a .csv")
    .refine(
      (f) => f.size <= 10 * 1024 * 1024,
      "File must be under 10MB"
    ),
});
