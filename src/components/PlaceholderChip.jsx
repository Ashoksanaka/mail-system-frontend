// ──────────────────────────────────────────────────────────────
// PlaceholderChip Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────

import { memo } from "react";

/**
 * Styled chip displaying a {{placeholder}} label.
 * Used in the template editor (live preview) and CSV generator page.
 *
 * @param {Object} props
 * @param {string} props.label - Placeholder name (without braces)
 */
const PlaceholderChip = memo(function PlaceholderChip({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-medium tracking-tight">
      <span className="text-indigo-500/60">{"{{"}</span>
      {label}
      <span className="text-indigo-500/60">{"}}"}</span>
    </span>
  );
});

export default PlaceholderChip;
