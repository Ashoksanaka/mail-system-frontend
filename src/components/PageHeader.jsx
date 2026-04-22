// ──────────────────────────────────────────────────────────────
// PageHeader Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { motion } from "framer-motion";

/**
 * Consistent page title block with icon and subtitle.
 *
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {string} [props.subtitle] - Optional subtitle text
 * @param {import('lucide-react').LucideIcon} [props.icon] - Lucide icon component
 */
export default function PageHeader({ title, subtitle, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
