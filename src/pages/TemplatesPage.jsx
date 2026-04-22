// ──────────────────────────────────────────────────────────────
// TemplatesPage — Bulk Email Dispatch Platform (Phase 4)
// ──────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../components/ui/alert-dialog";

import EmptyState from "../components/EmptyState";
import PlaceholderChip from "../components/PlaceholderChip";
import { templateSchema } from "../lib/schemas";
import { getTemplate } from "../lib/api";
import {
  useTemplatesList,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "../hooks/useTemplates";
import useAppStore from "../store/useAppStore";

// ── Animation Variants ────────────────────────────────────────
const listItemVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.06, ease: "easeOut" },
  }),
};

const chipVariant = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// ══════════════════════════════════════════════════════════════
// TemplatesPage Component
// ══════════════════════════════════════════════════════════════
export default function TemplatesPage() {
  const navigate = useNavigate();
  const setSelectedTemplate = useAppStore((s) => s.setSelectedTemplate);

  // ── State ───────────────────────────────────────────────────
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [editorMode, setEditorMode] = useState("idle"); // 'idle' | 'create' | 'edit'
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // ── Queries & Mutations ─────────────────────────────────────
  const { data: templates, isLoading, isError, error } = useTemplatesList();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  // ── React Hook Form ─────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", subject: "", has_attachments: false, has_global_attachment: false, attachment_names: [], description: "", body: "" },
  });

  const bodyValue = watch("body");
  const subjectValue = watch("subject");
  const hasAttachments = watch("has_attachments");
  const hasGlobalAttachment = watch("has_global_attachment");
  const attachmentNames = watch("attachment_names") || [];

  // ── Custom Debounce ─────────────────────────────────────────
  const [debouncedBodyValue, setDebouncedBodyValue] = useState(bodyValue);
  const [debouncedSubjectValue, setDebouncedSubjectValue] = useState(subjectValue);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBodyValue(bodyValue);
      setDebouncedSubjectValue(subjectValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [bodyValue, subjectValue]);

  // ── Live Placeholder Detection ──────────────────────────────
  const detectedPlaceholders = useMemo(() => {
    const combinedText = `${debouncedSubjectValue || ""} ${debouncedBodyValue || ""}`;
    if (!combinedText.trim()) return [];
    const matches = combinedText.match(/\{\{(\s*\w+\s*)\}\}/g);
    if (!matches) return [];
    // Extract names, strip whitespace, deduplicate preserving order
    const names = matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim());
    return [...new Map(names.map((n) => [n, n])).values()];
  }, [debouncedBodyValue]);

  // ── Select Template for Editing ─────────────────────────────
  const handleSelectTemplate = async (template) => {
    setActiveTemplateId(template.id);
    setEditorMode("edit");
    // Fetch full template detail (list serializer may exclude body)
    try {
      const res = await getTemplate(template.id);
      const fullTemplate = res.data;
      reset({
        name: fullTemplate.name,
        subject: fullTemplate.subject,
        has_attachments: fullTemplate.has_attachments || false,
        has_global_attachment: fullTemplate.has_global_attachment || false,
        attachment_names: fullTemplate.attachment_names || [],
        description: fullTemplate.description,
        body: fullTemplate.body,
      });
    } catch {
      // Fallback: use what we have from the list
      reset({
        name: template.name,
        subject: template.subject || "",
        has_attachments: template.has_attachments || false,
        has_global_attachment: template.has_global_attachment || false,
        attachment_names: template.attachment_names || [],
        description: template.description,
        body: template.body || "",
      });
    }
  };

  // ── Handle New Template Click ───────────────────────────────
  const handleNewTemplate = () => {
    setActiveTemplateId(null);
    setEditorMode("create");
    reset({ name: "", subject: "", has_attachments: false, has_global_attachment: false, attachment_names: [], description: "", body: "" });
  };

  // ── Cancel / Clear ──────────────────────────────────────────
  const handleCancel = () => {
    setActiveTemplateId(null);
    setEditorMode("idle");
    reset({ name: "", subject: "", has_attachments: false, has_global_attachment: false, attachment_names: [], description: "", body: "" });
  };

  // ── Form Submit (Create or Update) ──────────────────────────
  const onSubmit = async (data) => {
    try {
      // Prevent XSS — strip HTML tags if any are detected
      data.body = data.body.replace(/<[^>]*>?/gm, '');

      if (editorMode === "create") {
        const created = await createMutation.mutateAsync(data);
        toast.success("Template created!");
        // Auto-select the newly created template
        setActiveTemplateId(created.id);
        setEditorMode("edit");
        reset({
          name: created.name,
          subject: created.subject,
          has_attachments: created.has_attachments,
          has_global_attachment: created.has_global_attachment,
          attachment_names: created.attachment_names,
          description: created.description,
          body: created.body,
        });
      } else if (editorMode === "edit" && activeTemplateId) {
        await updateMutation.mutateAsync({ id: activeTemplateId, data });
        toast.success("Template updated!");
      }
    } catch (err) {
      toast.error(err?.message || "Something went wrong");
    }
  };

  // ── Delete Handler ──────────────────────────────────────────
  const handleDelete = async (templateId) => {
    try {
      await deleteMutation.mutateAsync(templateId);
      toast.success("Template deleted");
      // If we deleted the active template, clear editor
      if (activeTemplateId === templateId) {
        handleCancel();
      }
    } catch (err) {
      toast.error(err?.message || "Failed to delete template");
    }
  };

  // ── Use This Template ───────────────────────────────────────
  const handleUseTemplate = () => {
    if (!activeTemplateId || !templates) return;
    const listTemplate = templates.find((t) => t.id === activeTemplateId);
    if (listTemplate) {
      const formValues = getValues();
      setSelectedTemplate({
        id: listTemplate.id,
        name: formValues.name || listTemplate.name,
        subject: formValues.subject || listTemplate.subject,
        has_attachments: formValues.has_attachments ?? listTemplate.has_attachments,
        has_global_attachment: formValues.has_global_attachment ?? listTemplate.has_global_attachment,
        attachment_names: formValues.attachment_names || listTemplate.attachment_names,
        description: formValues.description || listTemplate.description,
        body: formValues.body,
      });
      navigate("/generate-csv");
    }
  };

  // ── Get active template for "Use This Template" ─────────────
  const activeTemplate = templates?.find((t) => t.id === activeTemplateId);
  const deleteTarget = templates?.find((t) => t.id === deleteTargetId);

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* ═══════════════════════════════════════════════════════
            LEFT PANEL — Template List (35%)
            ═══════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[35%] flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-white">Templates</h1>
            <Button
              id="btn-new-template"
              onClick={handleNewTemplate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 hover:scale-[1.02]"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>

          {/* Loading State — Skeleton Cards */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm">
              {error?.message || "Failed to load templates"}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && templates?.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No templates yet"
              description="Create your first email template to get started with bulk dispatching."
              actionLabel="Create your first template"
              onAction={handleNewTemplate}
            />
          )}

          {/* Template List */}
          {!isLoading && !isError && templates?.length > 0 && (
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-14rem)] scrollbar-thin pr-1">
              <AnimatePresence>
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    custom={index}
                    variants={listItemVariant}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    layout
                    className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      activeTemplateId === template.id
                        ? "border-indigo-500/30 bg-indigo-500/[0.06] border-l-4 border-l-indigo-500"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]"
                    }`}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-1">
                          {template.description}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(template.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          id={`btn-edit-template-${template.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors duration-150"
                          title="Edit template"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              id={`btn-delete-template-${template.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTargetId(template.id);
                              }}
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150"
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete Template
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Are you sure you want to delete "
                                {template.name}"? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(template.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            RIGHT PANEL — Template Editor (65%)
            ═══════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[65%] flex flex-col">
          <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 lg:p-8">
            {/* ── State A: Idle — No template selected ──────────── */}
            {editorMode === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center mb-5">
                  <Mail className="w-8 h-8 text-neutral-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Select a template to edit
                </h3>
                <p className="text-sm text-slate-400">
                  or create a new one
                </p>
              </motion.div>
            )}

            {/* ── State B: Create / Edit Form ──────────────────── */}
            {(editorMode === "create" || editorMode === "edit") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Form Header */}
                <h2 className="text-xl font-bold text-white mb-6">
                  {editorMode === "create"
                    ? "New Template"
                    : `Edit Template`}
                  {editorMode === "edit" && activeTemplate && (
                    <span className="text-indigo-400 ml-2 text-base font-normal">
                      — {activeTemplate.name}
                    </span>
                  )}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Template Name */}
                  <div>
                    <label
                      htmlFor="template-name"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Template Name
                    </label>
                    <Input
                      id="template-name"
                      placeholder="e.g. Order Confirmation"
                      {...register("name")}
                      className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                    />
                    {errors.name && (
                      <p className="text-xs text-rose-400 mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Subject Line */}
                  <div>
                    <label
                      htmlFor="template-subject"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Email Subject
                    </label>
                    <Input
                      id="template-subject"
                      placeholder="e.g. Action Required: {{event_name}}"
                      {...register("subject")}
                      className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                    />
                    {errors.subject && (
                      <p className="text-xs text-rose-400 mt-1">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>

                  {/* Attachments Configuration */}
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="has_attachments"
                        {...register("has_attachments")}
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <label htmlFor="has_attachments" className="text-sm font-medium text-slate-200 cursor-pointer">
                        Enable Attachments
                      </label>
                    </div>

                    <AnimatePresence>
                      {hasAttachments && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="flex items-center gap-3 pl-1">
                            <input
                              type="checkbox"
                              id="has_global_attachment"
                              {...register("has_global_attachment")}
                              className="w-4 h-4 rounded border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                            />
                            <label htmlFor="has_global_attachment" className="text-sm text-slate-300 cursor-pointer">
                              Same attachment(s) for all recipients
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Expected Attachments
                            </label>
                            <div className="space-y-2">
                              {attachmentNames.map((name, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    value={name}
                                    onChange={(e) => {
                                      const newNames = [...attachmentNames];
                                      newNames[index] = e.target.value;
                                      setValue("attachment_names", newNames);
                                    }}
                                    placeholder="e.g. Invoice, Certificate"
                                    className="bg-white/[0.04] border-white/[0.1] text-white focus:border-indigo-500/50"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                      const newNames = attachmentNames.filter((_, i) => i !== index);
                                      setValue("attachment_names", newNames);
                                    }}
                                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setValue("attachment_names", [...attachmentNames, ""])}
                                className="w-full border-dashed border-white/20 text-slate-300 hover:text-white hover:border-white/40 mt-2"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Attachment Label
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="template-description"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Description
                    </label>
                    <Textarea
                      id="template-description"
                      placeholder="Describe when to use this template..."
                      rows={3}
                      {...register("description")}
                      className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-indigo-500/50 resize-none"
                    />
                    {errors.description && (
                      <p className="text-xs text-rose-400 mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Template Body */}
                  <div>
                    <label
                      htmlFor="template-body"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Template Body
                    </label>
                    <Textarea
                      id="template-body"
                      placeholder={`Dear {{name}},\n\nYour order {{order_id}} has been confirmed.\n\nThank you for your purchase!`}
                      rows={14}
                      {...register("body")}
                      className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-indigo-500/50 font-mono text-sm leading-relaxed resize-none"
                    />
                    {errors.body && (
                      <p className="text-xs text-rose-400 mt-1">
                        {errors.body.message}
                      </p>
                    )}

                    {/* Live Placeholder Detection */}
                    <div className="mt-3">
                      {detectedPlaceholders.length > 0 ? (
                        <>
                          <p className="text-xs text-slate-400 mb-2 font-medium">
                            Detected placeholders:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <AnimatePresence mode="popLayout">
                              {detectedPlaceholders.map((placeholder) => (
                                <motion.div
                                  key={placeholder}
                                  variants={chipVariant}
                                  initial="initial"
                                  animate="animate"
                                  exit="exit"
                                  transition={{ duration: 0.2 }}
                                  layout
                                >
                                  <PlaceholderChip label={placeholder} />
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </>
                      ) : (bodyValue || subjectValue) ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                          ⚠ No placeholders detected
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      id="btn-cancel-template"
                      type="button"
                      variant="ghost"
                      onClick={handleCancel}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      id="btn-save-template"
                      type="submit"
                      disabled={
                        createMutation.isPending || updateMutation.isPending
                      }
                      className="bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200"
                    >
                      {(createMutation.isPending ||
                        updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      )}
                      {editorMode === "create" ? "Save" : "Update"}
                    </Button>
                  </div>
                </form>

                {/* Use This Template Button (edit mode only) */}
                {editorMode === "edit" && activeTemplateId && (
                  <div className="mt-8 pt-6 border-t border-white/[0.06]">
                    <Button
                      id="btn-use-template"
                      onClick={handleUseTemplate}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 text-base font-semibold shadow-lg shadow-emerald-500/15 transition-all duration-300 hover:shadow-emerald-500/25 hover:scale-[1.01]"
                      size="lg"
                    >
                      Use This Template
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
