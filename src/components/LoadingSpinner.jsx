// ──────────────────────────────────────────────────────────────
// LoadingSpinner Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

/**
 * Centered animated loading spinner.
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner size
 * @param {string} [props.message] - Optional text displayed below the spinner
 */
const sizeMap = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function LoadingSpinner({ size = "md", message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Loader2
          className={`${sizeMap[size]} text-indigo-400`}
          strokeWidth={2.5}
        />
      </motion.div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
