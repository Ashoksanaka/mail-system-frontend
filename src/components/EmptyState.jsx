// ──────────────────────────────────────────────────────────────
// EmptyState Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Button } from "./ui/button";

/**
 * Centered empty state card shown when lists/tables have no data.
 *
 * @param {Object} props
 * @param {import('lucide-react').LucideIcon} [props.icon] - Lucide icon component
 * @param {string} props.title - Empty state title
 * @param {string} [props.description] - Explanatory text
 * @param {string} [props.actionLabel] - CTA button label
 * @param {function} [props.onAction] - CTA button click handler
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-800/50 border border-neutral-700/50 mb-5">
          <Icon className="w-8 h-8 text-neutral-500" />
        </div>
      )}

      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
