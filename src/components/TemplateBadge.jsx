// ──────────────────────────────────────────────────────────────
// TemplateBadge Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { memo } from "react";
import { FileText } from "lucide-react";

/**
 * Small Indigo badge/chip displaying a template name.
 *
 * @param {Object} props
 * @param {string} props.name - Template name to display
 */
const TemplateBadge = memo(function TemplateBadge({ name }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
      <FileText className="w-3 h-3" />
      {name}
    </span>
  );
});

export default TemplateBadge;
