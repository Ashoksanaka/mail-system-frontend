// ──────────────────────────────────────────────────────────────
// Layout Component — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Home, FileText, Download, Upload, Menu, X } from "lucide-react";

// ── Navigation Items ──────────────────────────────────────────
const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/generate-csv", label: "Generate CSV", icon: Download },
  { to: "/upload-csv", label: "Upload CSV", icon: Upload },
];

// ── Layout Wrapper ────────────────────────────────────────────
export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <nav className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Logo / App Name */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-indigo-400">Bulk</span>
              <span className="text-foreground">Mail</span>
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-indigo-400 bg-indigo-500/10"
                      : "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {/* Active indicator underline */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-[1px] left-3 right-3 h-0.5 bg-indigo-400 rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-neutral-400 hover:text-foreground hover:bg-neutral-800/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>

        {/* Subtle gradient border under navbar */}
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        {/* ── Mobile Menu ──────────────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-b border-border bg-background/95 backdrop-blur-xl"
            >
              <div className="container mx-auto px-4 py-3 space-y-1">
                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                          : "text-neutral-400 hover:text-foreground hover:bg-neutral-800/50"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Page Content ───────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
