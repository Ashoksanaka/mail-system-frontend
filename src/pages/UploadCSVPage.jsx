// ──────────────────────────────────────────────────────────────
// UploadCSVPage — Bulk Email Dispatch Platform
// Upload filled CSV → validate → preview in TanStack Table → dispatch
// ──────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Upload,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  File as FileIcon,
  X,
  Columns,
  Paperclip,
} from "lucide-react";
import toast from "react-hot-toast";

import PageHeader from "../components/PageHeader";
import ErrorBanner from "../components/ErrorBanner";
import { Skeleton } from "../components/ui/skeleton";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { useTemplatesList } from "../hooks/useTemplates";
import { uploadCSV } from "../lib/api";
import useAppStore from "../store/useAppStore";

// ── Helpers ────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadCSVPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── Zustand state ────────────────────────────────────────
  const selectedTemplate = useAppStore((s) => s.selectedTemplate);
  const setSelectedTemplate = useAppStore((s) => s.setSelectedTemplate);
  const csvPreviewData = useAppStore((s) => s.csvPreviewData);
  const setCsvPreviewData = useAppStore((s) => s.setCsvPreviewData);
  const clearCsvPreviewData = useAppStore((s) => s.clearCsvPreviewData);
  const setUploadedFile = useAppStore((s) => s.setUploadedFile);
  
  const globalFiles = useAppStore((s) => s.globalFiles);
  const setGlobalFiles = useAppStore((s) => s.setGlobalFiles);
  const perRowFiles = useAppStore((s) => s.perRowFiles);
  const setPerRowFiles = useAppStore((s) => s.setPerRowFiles);

  // ── Local state ──────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(selectedTemplate?.id || "");
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | success | error
  const [uploadError, setUploadError] = useState(null);
  const [errorDetails, setErrorDetails] = useState([]);

  // ── Templates list ───────────────────────────────────────
  const { data: templates, isLoading: templatesLoading } = useTemplatesList();

  // ── Auto-populate from Zustand ───────────────────────────
  useEffect(() => {
    if (selectedTemplate?.id) {
      setSelectedId(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  // ── Handle template selection change ─────────────────────
  const handleTemplateChange = (value) => {
    setSelectedId(value);
    clearCsvPreviewData();
    setFile(null);
    setUploadState("idle");
    setUploadError(null);
    setErrorDetails([]);

    const tpl = templates?.find((t) => t.id === value);
    if (tpl) {
      setSelectedTemplate(tpl);
    }
  };

  // ── File validation ──────────────────────────────────────
  const validateFile = useCallback((f) => {
    if (!f) return "No file selected";
    if (!f.name.endsWith(".csv")) return "Only .csv files are accepted";
    if (f.size > 10 * 1024 * 1024) return "File must be under 10MB";
    return null;
  }, []);

  // ── Handle file selection (from input or drop) ───────────
  const handleFile = useCallback(
    async (f) => {
      const error = validateFile(f);
      if (error) {
        toast.error(error);
        return;
      }

      if (!selectedId) {
        toast.error("Please select a template first");
        return;
      }

      setFile(f);
      setUploadState("uploading");
      setUploadError(null);
      setErrorDetails([]);

      try {
        const response = await uploadCSV(selectedId, f);
        const data = response.data;

        if (data.valid) {
          setUploadState("success");
          setCsvPreviewData({
            headers: data.headers,
            rows: data.preview_rows,
            total_rows: data.total_rows,
            template_id: data.template_id,
            template_name: data.template_name,
          });
          setUploadedFile(f);
          toast.success(
            `CSV validated! ${data.total_rows} recipients found.`
          );
        }
      } catch (err) {
        setUploadState("error");
        const errMsg =
          err.message || err.data?.error || "CSV validation failed";
        const details = err.data?.details || [];
        setUploadError(errMsg);
        setErrorDetails(details);
      }
    },
    [selectedId, validateFile, setCsvPreviewData, setUploadedFile]
  );

  // ── Drag & drop handlers ─────────────────────────────────
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // ── Reset upload ─────────────────────────────────────────
  const resetUpload = () => {
    setFile(null);
    setUploadState("idle");
    setUploadError(null);
    setErrorDetails([]);
    clearCsvPreviewData();
    setUploadedFile(null);
    setGlobalFiles({});
    setPerRowFiles({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── TanStack Table ───────────────────────────────────────
  const tableColumns = useMemo(() => {
    if (!csvPreviewData?.headers) return [];

    // Row number column
    const cols = [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs font-mono">
            {row.index + 1}
          </span>
        ),
        size: 50,
      },
    ];

    // CSV header columns
    csvPreviewData.headers.forEach((header) => {
      cols.push({
        accessorKey: header,
        header: header,
        cell: ({ getValue }) => {
          const value = getValue();
          if (value === undefined || value === null || value === "") {
            return (
              <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-xs">
                —
              </span>
            );
          }
          if (header === "receiver_email_ID") {
            return (
              <a
                href={`mailto:${value}`}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors text-sm"
              >
                {value}
              </a>
            );
          }
          return <span className="text-sm">{value}</span>;
        },
      });
    });

    // Attachment columns
    if (selectedTemplate?.has_attachments && !selectedTemplate?.has_global_attachment) {
      selectedTemplate.attachment_names?.forEach((attName, attIdx) => {
        cols.push({
          id: `attachment_${attIdx}`,
          header: () => (
            <div className="flex items-center gap-1.5 text-indigo-300">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attName}</span>
            </div>
          ),
          cell: ({ row }) => {
            const rowIndex = row.index;
            const file = perRowFiles[rowIndex]?.[attIdx];
            
            return (
              <div className="min-w-[150px]">
                {!file ? (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 cursor-pointer transition-colors text-xs text-slate-300">
                    <Paperclip className="w-3.5 h-3.5" />
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setPerRowFiles({
                            ...perRowFiles,
                            [rowIndex]: {
                              ...(perRowFiles[rowIndex] || {}),
                              [attIdx]: f
                            }
                          });
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                    <span className="truncate max-w-[100px] text-indigo-300" title={file.name}>
                      {file.name}
                    </span>
                    <button
                      onClick={() => {
                        const newRowFiles = { ...perRowFiles };
                        if (newRowFiles[rowIndex]) {
                          delete newRowFiles[rowIndex][attIdx];
                          setPerRowFiles(newRowFiles);
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          },
        });
      });
    }

    return cols;
  }, [csvPreviewData?.headers, selectedTemplate, perRowFiles]);

  const tableData = useMemo(
    () => csvPreviewData?.rows || [],
    [csvPreviewData?.rows]
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // ── Pagination info ──────────────────────────────────────
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = tableData.length;
  const startRow = pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  // ── Proceed to dispatch ──────────────────────────────────
  const handleProceed = () => {
    navigate("/dispatch");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* ── SECTION 1: Page Header ─────────────────────────── */}
      <PageHeader
        icon={Upload}
        title="Upload Recipient CSV"
        subtitle="Upload your filled CSV file and preview before sending"
      />

      {/* ── SECTION 2: Template Selection ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-8"
      >
        <label
          htmlFor="upload-template-select"
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
          <Select value={selectedId} onValueChange={handleTemplateChange}>
            <SelectTrigger
              id="upload-template-select"
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

      {/* ── SECTION 3: File Upload Zone ────────────────────── */}
      <AnimatePresence mode="wait">
        {selectedId && uploadState !== "success" && (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleInputChange}
              className="hidden"
              id="csv-file-input"
            />

            {/* Drag & Drop Area */}
            {uploadState === "idle" || uploadState === "error" ? (
              <>
                {!file ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-10 text-center ${
                      isDragOver
                        ? "border-indigo-500 bg-indigo-500/5"
                        : "border-slate-600 hover:border-slate-500 bg-transparent"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FileUp
                        className={`w-12 h-12 transition-colors ${
                          isDragOver ? "text-indigo-400" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-base font-medium text-slate-200">
                          {isDragOver
                            ? "Drop it!"
                            : "Drag & drop your CSV file here"}
                        </p>
                        {!isDragOver && (
                          <p className="mt-1 text-sm">
                            <span className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
                              or click to browse
                            </span>
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Only .csv files are accepted • Max 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <FileIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetUpload();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors flex-shrink-0"
                    >
                      Change file
                    </button>
                  </div>
                )}
              </>
            ) : null}

            {/* ── SECTION 4: Upload Validation Feedback ─────── */}
            {/* Loading state */}
            {uploadState === "uploading" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-5 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <p className="text-sm font-medium text-slate-300">
                    Validating your CSV...
                  </p>
                </div>
                <Progress className="h-2" value={undefined} />
              </motion.div>
            )}

            {/* Error state */}
            {uploadState === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <ErrorBanner
                  message={uploadError}
                  onDismiss={() => setUploadError(null)}
                />

                {errorDetails.length > 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/15">
                    <p className="text-xs font-medium text-rose-400 uppercase tracking-wider mb-2">
                      Details
                    </p>
                    <ul className="space-y-1">
                      {errorDetails.map((detail, i) => (
                        <li
                          key={i}
                          className="text-sm text-rose-300 flex items-start gap-2"
                        >
                          <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-400" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={resetUpload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Banner ──────────────────────────────────── */}
      <AnimatePresence>
        {uploadState === "success" && csvPreviewData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-300">
              CSV validated successfully — {csvPreviewData.total_rows} recipients
              found
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 5: CSV Preview Table ───────────────────── */}
      <AnimatePresence>
        {uploadState === "success" && csvPreviewData && tableData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="mb-8"
          >
            {/* Global Attachments Area */}
            {selectedTemplate?.has_attachments && selectedTemplate?.has_global_attachment && (
              <div className="mb-6 p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Global Attachments</h3>
                  <span className="text-xs text-slate-400 ml-2">(Sent to all recipients)</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedTemplate.attachment_names?.map((attName, attIdx) => {
                    const file = globalFiles[attIdx];
                    return (
                      <div key={attIdx} className="p-4 rounded-lg bg-slate-900/50 border border-white/5">
                        <p className="text-xs font-medium text-slate-300 mb-2">{attName}</p>
                        
                        {!file ? (
                          <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/5 cursor-pointer transition-colors text-center">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="text-xs text-slate-400">Click to upload</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setGlobalFiles({
                                    ...globalFiles,
                                    [attIdx]: f
                                  });
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-emerald-300 truncate" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const newFiles = { ...globalFiles };
                                delete newFiles[attIdx];
                                setGlobalFiles(newFiles);
                              }}
                              className="text-rose-400 hover:text-rose-300 p-1 bg-white/5 rounded-md transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Table Summary Bar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">
                Showing{" "}
                <span className="text-slate-200 font-medium">
                  {startRow}–{endRow}
                </span>{" "}
                of{" "}
                <span className="text-slate-200 font-medium">{totalRows}</span>{" "}
                recipients
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
                <Columns className="w-3 h-3" />
                {csvPreviewData.headers.length} columns
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider bg-indigo-500/8 border-b border-white/10 text-indigo-300 whitespace-nowrap"
                          style={{
                            width:
                              header.column.getSize() !== 150
                                ? header.column.getSize()
                                : undefined,
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                        idx % 2 === 0
                          ? "bg-slate-900/50"
                          : "bg-slate-800/30"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const value = cell.getValue?.();
                        const isEmpty =
                          cell.column.id !== "rowNumber" &&
                          (value === undefined ||
                            value === null ||
                            value === "");
                        return (
                          <td
                            key={cell.id}
                            className={`px-4 py-3 text-sm whitespace-nowrap ${
                              isEmpty
                                ? "bg-rose-500/8"
                                : ""
                            }`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <p className="text-sm text-slate-400">
                Page{" "}
                <span className="text-slate-200 font-medium">
                  {pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="text-slate-200 font-medium">
                  {table.getPageCount()}
                </span>
              </p>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 6: Action Buttons ──────────────────────── */}
      <AnimatePresence>
        {uploadState === "success" && csvPreviewData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            {/* Re-upload Button */}
            <button
              onClick={resetUpload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Re-upload CSV
            </button>

            {/* Proceed to Dispatch Button */}
            <button
              onClick={handleProceed}
              disabled={uploadState !== "success"}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
            >
              Proceed to Send Emails
              <Send className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
