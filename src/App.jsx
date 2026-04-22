// ──────────────────────────────────────────────────────────────
// App Router — Bulk Email Dispatch Platform
// ──────────────────────────────────────────────────────────────
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "./components/Layout";
import { lazy, Suspense } from "react";
import HomePage from "./pages/HomePage";
import TemplatesPage from "./pages/TemplatesPage";
import GenerateCSVPage from "./pages/GenerateCSVPage";

const UploadCSVPage = lazy(() => import("./pages/UploadCSVPage"));
const DispatchPage = lazy(() => import("./pages/DispatchPage"));

// ── Page Transition Wrapper ───────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const pageTransition = {
  duration: 0.25,
  ease: "easeInOut",
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

// ── App Component ─────────────────────────────────────────────
function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <HomePage />
              </AnimatedPage>
            }
          />
          <Route
            path="/templates"
            element={
              <AnimatedPage>
                <TemplatesPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/generate-csv"
            element={
              <AnimatedPage>
                <GenerateCSVPage />
              </AnimatedPage>
            }
          />
          <Route
            path="/upload-csv"
            element={
              <AnimatedPage>
                <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading Upload...</div>}>
                  <UploadCSVPage />
                </Suspense>
              </AnimatedPage>
            }
          />
          <Route
            path="/dispatch"
            element={
              <AnimatedPage>
                <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading Dispatch...</div>}>
                  <DispatchPage />
                </Suspense>
              </AnimatedPage>
            }
          />
          {/* Catch-all: redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
