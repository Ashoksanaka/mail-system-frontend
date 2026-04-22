// ──────────────────────────────────────────────────────────────
// Axios API Client — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import axios from "axios";

// ── Create Axios instance ─────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Log requests in development mode
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error object for consistent handling across the app
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      "An unexpected error occurred";

    const normalizedError = {
      message,
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    return Promise.reject(normalizedError);
  }
);

// ──────────────────────────────────────────────────────────────
// Template API Functions
// ──────────────────────────────────────────────────────────────

/** Fetch all templates (lightweight list) */
export const getTemplates = () => api.get("/api/templates/");

/** Fetch a single template by ID (full detail) */
export const getTemplate = (id) => api.get(`/api/templates/${id}/`);

/** Create a new template */
export const createTemplate = (data) => api.post("/api/templates/", data);

/** Update an existing template */
export const updateTemplate = (id, data) =>
  api.put(`/api/templates/${id}/`, data);

/** Delete a template */
export const deleteTemplate = (id) => api.delete(`/api/templates/${id}/`);

/** Extract placeholders from a template's body */
export const extractPlaceholders = (id) =>
  api.get(`/api/templates/${id}/extract-placeholders/`);

// ──────────────────────────────────────────────────────────────
// Dispatch API Functions
// ──────────────────────────────────────────────────────────────

/** Generate a CSV file with headers based on template placeholders */
export const generateCSV = (templateId) =>
  api.post(
    "/api/dispatch/generate-csv/",
    { template_id: templateId },
    { responseType: "blob" } // Required for file download
  );

/** Upload and validate a filled CSV file */
export const uploadCSV = (templateId, file) => {
  const form = new FormData();
  form.append("template_id", templateId);
  form.append("csv_file", file);
  return api.post("/api/dispatch/upload-csv/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** Start bulk email dispatch */
export const startDispatch = (templateId, file, globalFiles = {}, perRowFiles = {}) => {
  const form = new FormData();
  form.append("template_id", templateId);
  form.append("csv_file", file);

  // Append global files
  Object.keys(globalFiles).forEach((key) => {
    form.append(`global_${key}`, globalFiles[key]);
  });

  // Append per-row files
  Object.keys(perRowFiles).forEach((rowIndex) => {
    Object.keys(perRowFiles[rowIndex]).forEach((attIdx) => {
      form.append(`row_${rowIndex}_att_${attIdx}`, perRowFiles[rowIndex][attIdx]);
    });
  });

  return api.post("/api/dispatch/start/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** Get dispatch job status and logs */
export const getJobStatus = (jobId) =>
  api.get(`/api/dispatch/jobs/${jobId}/`);

export default api;
