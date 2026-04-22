// ──────────────────────────────────────────────────────────────
// GenerateCSVPage — Bulk Email Dispatch Platform
// Select a template → preview placeholders → download CSV scaffold
// ──────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Upload,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "../components/PageHeader";
import PlaceholderChip from "../components/PlaceholderChip";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";

import { useTemplatesList } from "../hooks/useTemplates";
import { extractPlaceholders, generateCSV } from "../lib/api";
import useAppStore from "../store/useAppStore";

export default function GenerateCSVPage() {
  const navigate = useNavigate();

  // ── Zustand state ────────────────────────────────────────
  const selectedTemplate = useAppStore((s) => s.selectedTemplate);
  const setSelectedTemplate = useAppStore((s) => s.setSelectedTemplate);
  const clearCsvPreviewData = useAppStore((s) => s.clearCsvPreviewData);

  // ── Local state ──────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(
    selectedTemplate?.id || ""
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [showNextSteps, setShowNextSteps] = useState(false);

  // ── Templates list ───────────────────────────────────────
  const {
    data: templates,
    isLoading: templatesLoading,
  } = useTemplatesList();

  // ── Auto-populate from Zustand on mount ──────────────────
  useEffect(() => {
    if (selectedTemplate?.id) {
      setSelectedId(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  // ── Fetch placeholders when template changes ─────────────
  const {
    data: placeholdersData,
    isLoading: placeholdersLoading,
    isError: placeholdersError,
  } = useQuery({
    queryKey: ["placeholders", selectedId],
    queryFn: async () => {
      const res = await extractPlaceholders(selectedId);
      return res.data;
    },
    enabled: !!selectedId,
  });

  const placeholders = placeholdersData?.placeholders || [];

  // ── Find selected template object ────────────────────────
  const selectedTpl = templates?.find((t) => t.id === selectedId);

  // ── Handle template selection change ─────────────────────
  const handleTemplateChange = (value) => {
    setSelectedId(value);
    setShowNextSteps(false);
    clearCsvPreviewData();

    const tpl = templates?.find((t) => t.id === value);
    if (tpl) {
      setSelectedTemplate(tpl);
    }
  };

  // ── Download CSV ─────────────────────────────────────────
  const handleDownloadCSV = async () => {
    if (!selectedId) return;

    setIsDownloading(true);
    try {
      const response = await generateCSV(selectedId);
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recipients_${selectedTpl?.name || "template"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("CSV downloaded! Fill it and return to upload.");
      setShowNextSteps(true);
    } catch (err) {
      toast.error(err.message || "Failed to generate CSV");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Column badges ────────────────────────────────────────
  const csvColumns = [
    { name: "receiver_email_ID", locked: true },
    { name: "receiver_name", locked: true },
    ...placeholders.map((p) => ({ name: p, locked: false })),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* ── SECTION 1: Page Header ─────────────────────────── */}
      <PageHeader
        icon={Download}
        title="Generate Recipient CSV"
        subtitle="Select a template to generate a pre-formatted CSV file"
      />

      {/* ── SECTION 2: Template Selection ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-8"
      >
        <label
          htmlFor="template-select"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Select Template
        </label>

        {templatesLoading ? (
          <Skeleton className="h-10 w-full sm:w-1/2 rounded-md" />
        ) : !templates || templates.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              No templates found.{" "}
              <Link
                to="/templates"
                className="underline hover:text-amber-300 transition-colors"
              >
                Create one first
              </Link>
            </span>
          </div>
        ) : (
          <Select
            value={selectedId}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger
              id="template-select"
              className="w-full sm:w-1/2 bg-white/5 border-white/10 hover:border-indigo-500/40 transition-colors"
            >
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{tpl.name}</span>
                    {tpl.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {tpl.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* ── SECTION 3: Template Preview Card ───────────────── */}
      <AnimatePresence mode="wait">
        {selectedId && (
          <motion.div
            key={`preview-${selectedId}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mb-8 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            {/* Template name & description */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedTpl?.name || "Loading..."}
              </span>
            </div>
            {selectedTpl?.description && (
              <p className="text-sm text-slate-400 mb-4">
                {selectedTpl.description}
              </p>
            )}

            <Separator className="my-4 bg-white/10" />

            {/* Placeholders */}
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Detected Placeholders
            </p>

            {placeholdersLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            ) : placeholdersError ? (
              <p className="text-sm text-rose-400">
                Failed to load placeholders
              </p>
            ) : placeholders.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>This template has no placeholders</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {placeholders.map((p) => (
                    <motion.div
                      key={p}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <PlaceholderChip label={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 4: CSV Column Preview ──────────────────── */}
      <AnimatePresence>
        {selectedId && !placeholdersLoading && !placeholdersError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <p className="text-sm font-medium text-slate-300 mb-3">
              Your CSV will have these columns:
            </p>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
              <table className="w-full">
                <thead>
                  <tr>
                    {csvColumns.map((col, i) => (
                      <th
                        key={col.name}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-white/10"
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                            col.locked
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                              : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                          }`}
                        >
                          {col.locked && (
                            <Lock className="w-3 h-3 opacity-60" />
                          )}
                          {col.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {csvColumns.map((col) => (
                      <td
                        key={col.name}
                        className="px-4 py-3 text-sm text-slate-600 italic"
                      >
                        —
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Columns 1 and 2 are required and cannot be removed
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 5: Download Button ─────────────────────── */}
      <AnimatePresence>
        {selectedId && !placeholdersLoading && !placeholdersError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-8"
          >
            <button
              onClick={handleDownloadCSV}
              disabled={isDownloading || !selectedId}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? "Generating..." : "Generate & Download CSV"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 5b: Next Steps Card ────────────────────── */}
      <AnimatePresence>
        {showNextSteps && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            {/* Success indicator */}
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-foreground">
                CSV Downloaded Successfully!
              </h3>
            </div>

            <p className="text-sm text-slate-400 mb-5">
              Follow these steps to prepare your recipient data:
            </p>

            <ol className="space-y-3 mb-6">
              {[
                {
                  icon: FileSpreadsheet,
                  text: "Open the downloaded CSV file in Excel or Google Sheets",
                },
                {
                  icon: FileSpreadsheet,
                  text: "Fill in receiver_email_ID and receiver_name for each recipient",
                },
                {
                  icon: FileSpreadsheet,
                  text: "Fill in all placeholder columns with personalized values",
                },
                {
                  icon: FileSpreadsheet,
                  text: "Save the file as .csv format",
                },
                {
                  icon: Upload,
                  text: "Return here and click 'Upload CSV' to proceed",
                },
              ].map((step, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.08, duration: 0.25 }}
                  className="flex items-start gap-3"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300 pt-0.5">
                    {step.text}
                  </span>
                </motion.li>
              ))}
            </ol>

            <button
              onClick={() => navigate("/upload-csv")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              Upload CSV
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
