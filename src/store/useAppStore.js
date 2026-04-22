// ──────────────────────────────────────────────────────────────
// Zustand Global Store — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set) => ({
      // ── Template Slice ────────────────────────────────────────
      // Currently selected template: { id, name, description, body }
      selectedTemplate: null,
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      // ── CSV Slice ─────────────────────────────────────────────
      // CSV preview data: { headers, rows, total_rows, template_id }
      csvPreviewData: null,
      setCsvPreviewData: (data) => set({ csvPreviewData: data }),
      clearCsvPreviewData: () => set({ csvPreviewData: null }),

      // ── Upload Slice ────────────────────────────────────────
      // Raw File object from CSV upload (used to re-send on dispatch)
      uploadedFile: null,
      setUploadedFile: (file) => set({ uploadedFile: file }),

      // Raw File objects for attachments
      globalFiles: {},
      setGlobalFiles: (files) => set({ globalFiles: files }),
      perRowFiles: {},
      setPerRowFiles: (files) => set({ perRowFiles: files }),

      // ── Dispatch Slice ────────────────────────────────────────
      // UUID string of the current DispatchJob
      activeJobId: null,
      setActiveJobId: (id) => set({ activeJobId: id }),

      // Real-time status object received from WebSocket
      dispatchStatus: null,
      setDispatchStatus: (status) => set({ dispatchStatus: status }),

      // ── Reset ─────────────────────────────────────────────────
      // Clear all state (used when starting a new session)
      clearAll: () =>
        set({
          selectedTemplate: null,
          csvPreviewData: null,
          uploadedFile: null,
          globalFiles: {},
          perRowFiles: {},
          activeJobId: null,
          dispatchStatus: null,
        }),
    }),
    {
      name: "bulkmail-store",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist selectedTemplate across page refreshes
      partialize: (state) => ({
        selectedTemplate: state.selectedTemplate,
      }),
    }
  )
);

export default useAppStore;
