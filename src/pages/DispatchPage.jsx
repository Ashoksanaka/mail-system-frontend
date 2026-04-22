// ──────────────────────────────────────────────────────────────
// DispatchPage — Bulk Email Dispatch Platform
// Real-time dispatch dashboard using WebSockets
// ──────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
  Send,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import PageHeader from "../components/PageHeader";
import { Progress } from "../components/ui/progress";
import useAppStore from "../store/useAppStore";
import { useDispatchWebSocket } from "../hooks/useWebSocket";
import { startDispatch, getJobStatus } from "../lib/api";

// ── Components ─────────────────────────────────────────────────

// Animated Number Counter
function AnimatedCounter({ value }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

// Confetti Particle
function ConfettiParticle({ index }) {
  const colors = ["#10b981", "#6366f1", "#f43f5e", "#f59e0b", "#3b82f6"];
  const color = colors[index % colors.length];
  
  // Random starting position along top edge
  const startX = Math.random() * 100;
  
  // Random curve and end position
  const endX = startX + (Math.random() * 40 - 20); // Drift left/right
  const endY = 100 + Math.random() * 20; // Fall past bottom

  return (
    <motion.div
      initial={{ 
        x: `${startX}vw`, 
        y: "-5vh", 
        rotate: 0, 
        scale: 0 
      }}
      animate={{ 
        x: `${endX}vw`, 
        y: `${endY}vh`, 
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.5 + 0.5 
      }}
      transition={{ 
        duration: 2.5 + Math.random() * 1.5,
        ease: "easeOut",
        delay: Math.random() * 0.3
      }}
      className="absolute w-3 h-3 rounded-sm pointer-events-none z-50"
      style={{ backgroundColor: color }}
    />
  );
}

// Memoized Log Item
const LogItem = React.memo(function LogItem({ log, idx }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`grid grid-cols-[50px_150px_220px_100px_90px_1fr] gap-2 p-3 rounded-lg text-sm items-center ${
        log.status === "FAILED" 
          ? "bg-rose-950/30 border-l-2 border-rose-500" 
          : "hover:bg-white/5"
      }`}
    >
      <div className="text-slate-500 text-xs">{idx + 1}</div>
      <div className="truncate font-medium text-slate-300">{log.name}</div>
      <div className="truncate text-slate-400">{log.email}</div>
      <div>
        {log.status === "SUCCESS" ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
            Success
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400">
            Failed
          </span>
        )}
      </div>
      <div className="text-xs text-slate-500">{log.sent_at}</div>
      <div className="text-xs text-rose-400 truncate" title={log.error || ""}>
        {log.error || <span className="text-slate-600">—</span>}
      </div>
    </motion.div>
  );
});

// ── Main Page ──────────────────────────────────────────────────
export default function DispatchPage() {
  const navigate = useNavigate();
  const logsEndRef = useRef(null);

  // ── Zustand State ──────────────────────────────────────────
  const activeJobId = useAppStore((s) => s.activeJobId);
  const setActiveJobId = useAppStore((s) => s.setActiveJobId);
  const selectedTemplate = useAppStore((s) => s.selectedTemplate);
  const uploadedFile = useAppStore((s) => s.uploadedFile);
  const globalFiles = useAppStore((s) => s.globalFiles);
  const perRowFiles = useAppStore((s) => s.perRowFiles);
  const clearAll = useAppStore((s) => s.clearAll);

  // ── Local State ────────────────────────────────────────────
  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(!activeJobId && !!uploadedFile);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const [dispatchState, setDispatchState] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    job_status: "PENDING", // PENDING | IN_PROGRESS | COMPLETED | FAILED
    logs: [],
  });

  // ── 1. Initialization Sequence ──────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initDispatch = async () => {
      // Case A: Missing context entirely
      if (!activeJobId && !uploadedFile) {
        setInitError("No active dispatch job found. Please start from Upload CSV.");
        return;
      }

      // Case B: Fresh start from UploadCSVPage
      if (!activeJobId && uploadedFile && selectedTemplate) {
        try {
          setIsInitializing(true);
          const response = await startDispatch(selectedTemplate.id, uploadedFile, globalFiles, perRowFiles);
          
          if (mounted) {
            setActiveJobId(response.data.job_id);
            setDispatchState(prev => ({
              ...prev,
              total: response.data.total_recipients,
              pending: response.data.total_recipients,
            }));
            setIsInitializing(false);
          }
        } catch (err) {
          if (mounted) {
            setInitError(err.message || "Failed to start dispatch job");
            setIsInitializing(false);
          }
        }
      }
    };

    initDispatch();
    return () => { mounted = false; };
  }, [activeJobId, uploadedFile, selectedTemplate, setActiveJobId]);

  // ── 2. WebSocket Connection & Handler ────────────────────────
  const handleWsMessage = (data) => {
    setDispatchState(prev => {
      // Append new log if present
      const newLogs = [...prev.logs];
      if (data.last_recipient) {
        newLogs.push({
          ...data.last_recipient,
          sent_at: new Date().toLocaleTimeString('en-US', { hour12: false }),
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
        });
      }

      // Check for completion
      if (data.job_status === "COMPLETED" || data.job_status === "FAILED") {
        setHasCompleted(true);
      }

      return {
        total: data.total,
        sent: data.sent,
        failed: data.failed,
        pending: data.pending,
        job_status: data.job_status,
        logs: newLogs,
      };
    });
  };

  const { connectionStatus } = useDispatchWebSocket(activeJobId, handleWsMessage);

  // ── 3. Handle Reconnection / Sync ────────────────────────────
  useEffect(() => {
    // If we reconnect, fetch the latest state from REST API to fill any gaps
    if (connectionStatus === "connected" && activeJobId) {
      getJobStatus(activeJobId).then(response => {
        const { job, logs } = response.data;
        
        // Transform logs to match WS schema
        const formattedLogs = logs.map(l => ({
          id: l.id,
          name: l.recipient_name,
          email: l.recipient_email,
          status: l.status,
          error: l.error_message,
          sent_at: new Date(l.sent_at).toLocaleTimeString('en-US', { hour12: false })
        }));

        setDispatchState({
          total: job.total_recipients,
          sent: job.sent_count,
          failed: job.failed_count,
          pending: job.total_recipients - job.sent_count - job.failed_count,
          job_status: job.status,
          logs: formattedLogs,
        });

        if (job.status === "COMPLETED" || job.status === "FAILED") {
          setHasCompleted(true);
        }
      }).catch(err => {
        console.error("Failed to sync job status on reconnect:", err);
      });
    }
  }, [connectionStatus, activeJobId]);

  // ── 4. Auto-scroll Logs ─────────────────────────────────────
  useEffect(() => {
    if (logsEndRef.current) {
      // Simple auto-scroll behavior
      logsEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [dispatchState.logs.length]);

  const { total, sent, failed, pending, job_status, logs } = dispatchState;
  const progressPercent = total > 0 ? Math.round(((sent + failed) / total) * 100) : 0;
  
  // Recharts Data
  const chartData = useMemo(() => [
    { name: "Sent", value: sent, color: "#10b981" }, // Emerald
    { name: "Failed", value: failed, color: "#f43f5e" }, // Rose
    { name: "Pending", value: pending, color: "#475569" }, // Slate
  ].filter(d => d.value > 0), [sent, failed, pending]); // Hide empty segments

  // ── Render Helpers ──────────────────────────────────────────
  
  if (initError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <PageHeader
            icon={Send}
            title="Email Dispatch"
            subtitle="Real-time dispatch monitor"
          />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Cannot Start Dispatch</h2>
          <p className="text-slate-400 mb-8">{initError}</p>
          <Link 
            to="/upload-csv"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload CSV
          </Link>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-medium text-slate-200">Initializing dispatch job...</h2>
        <p className="text-slate-400 mt-2">Connecting to background workers</p>
      </div>
    );
  }

  const getStatusDot = () => {
    switch (connectionStatus) {
      case "connected": 
        return <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Live</div>;
      case "connecting":
        return <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Reconnecting...</div>;
      case "disconnected":
      default:
        return <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full"><div className="w-2 h-2 rounded-full bg-rose-500" />Disconnected</div>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ── SECTION 1: Page Header ─────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          icon={Send}
          title="Email Dispatch"
          subtitle={selectedTemplate ? `Using template: ${selectedTemplate.name}` : "Real-time dispatch monitor"}
        />
        {getStatusDot()}
      </div>

      {/* ── SECTION 2: Stat Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: total, icon: Users, color: "slate" },
          { label: "Pending", value: pending, icon: Clock, color: "amber" },
          { label: "Sent", value: sent, icon: CheckCircle2, color: "emerald" },
          { label: "Failed", value: failed, icon: XCircle, color: "rose" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          const bgColors = {
            slate: "bg-slate-800 border-slate-700",
            amber: "bg-amber-950/40 border-amber-800/40",
            emerald: "bg-emerald-950/40 border-emerald-800/40",
            rose: "bg-rose-950/40 border-rose-800/40",
          };
          const iconColors = {
            slate: "text-slate-400",
            amber: "text-amber-500",
            emerald: "text-emerald-500",
            rose: "text-rose-500",
          };

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`relative overflow-hidden p-5 rounded-2xl border ${bgColors[stat.color]}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${iconColors[stat.color]}`} />
                <span className="text-sm font-medium text-slate-300">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold tracking-tight text-white">
                <AnimatedCounter value={stat.value} />
              </p>
              
              {/* Value change pulse effect could be added here with a key change on value */}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* ── SECTION 3: Progress Visualization ─────────────── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col"
        >
          <h3 className="text-sm font-medium text-slate-300 mb-6">Overall Progress</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-48 h-48 rounded-full border-[20px] border-slate-800" />
            )}
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold">{progressPercent}%</span>
              <span className="text-xs text-slate-400">Complete</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-4 mb-6">
            {[
              { label: "Sent", color: "#10b981", value: sent },
              { label: "Failed", color: "#f43f5e", value: failed },
              { label: "Pending", color: "#475569", value: pending },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
                <span className="text-slate-500 font-mono">({item.value})</span>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <p className="text-xs text-slate-400 mb-2 text-center">
              {sent + failed} of {total} emails processed ({progressPercent}%)
            </p>
            <Progress 
              value={progressPercent} 
              className="h-2 bg-slate-800"
              indicatorClassName={failed > 0 ? "bg-gradient-to-r from-indigo-500 to-rose-500" : "bg-indigo-500"}
            />
          </div>
        </motion.div>

        {/* ── SECTION 4: Live Dispatch Log Table ────────────── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col h-[400px]"
        >
          {/* Sticky Header */}
          <div className="grid grid-cols-[50px_150px_220px_100px_90px_1fr] gap-2 p-4 border-b border-white/10 bg-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
            <div>#</div>
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
            <div>Time</div>
            <div>Error</div>
          </div>

          {/* Scrolling Body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <div className="w-6 h-6 border-2 border-indigo-500/50 border-t-indigo-500 rounded-full animate-spin" />
                <p>Waiting for dispatch to begin...</p>
              </div>
            ) : (
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {logs.map((log, idx) => (
                    <LogItem key={log.id} log={log} idx={idx} />
                  ))}
                </AnimatePresence>
                <div ref={logsEndRef} className="h-2" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── SECTION 5: Completion State ─────────────────────── */}
      <AnimatePresence>
        {hasCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 border border-white/10 bg-white/5 text-center relative overflow-hidden"
          >
            {/* Confetti (only on full success) */}
            {failed === 0 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                  <ConfettiParticle key={i} index={i} />
                ))}
              </div>
            )}

            <div className="relative z-10">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                failed === 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
              }`}>
                {failed === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {failed === 0
                  ? "Dispatch Complete! 🎉"
                  : sent === 0
                    ? "Dispatch Failed"
                    : "Dispatch Complete with Errors"}
              </h2>
              
              <div className="text-slate-400 mb-4 space-y-1">
                <p>{sent} emails sent successfully.</p>
                {failed > 0 && <p className="text-rose-400">{failed} emails failed.</p>}
              </div>

              <p className="text-xs text-slate-500 mb-8">
                Completed at {new Date().toLocaleString()}
              </p>

              <h3 className="text-sm font-medium text-slate-300 mb-4">
                What would you like to do next?
              </h3>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => {
                    clearAll();
                    navigate("/");
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Home
                </button>
                <button
                  onClick={() => {
                    clearAll();
                    navigate("/templates");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
                >
                  View Templates
                </button>
              </div>

              <button
                onClick={() => {
                  clearAll();
                  navigate("/upload-csv");
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
              >
                Start a New Dispatch →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
