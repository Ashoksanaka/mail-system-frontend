// ──────────────────────────────────────────────────────────────
// ErrorBanner Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * Dismissible Rose-colored error banner using Shadcn Alert.
 *
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {function} [props.onDismiss] - Called when the dismiss button is clicked
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mb-6"
    >
      <Alert
        variant="destructive"
        className="border-danger-500/20 bg-danger-500/10 text-danger-400 [&>svg]:text-danger-400"
      >
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-danger-500/20 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
