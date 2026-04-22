// ──────────────────────────────────────────────────────────────
// HomePage — Bulk Email Dispatch Platform (Phase 4)
// ──────────────────────────────────────────────────────────────
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Upload,
  Eye,
  Send,
  Zap,
  Shield,
  BarChart2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";

// ── Animation Variants ────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// ── Workflow Steps Data ───────────────────────────────────────
const workflowSteps = [
  {
    icon: FileText,
    title: "Create a Template",
    description:
      "Design your email template with dynamic placeholders like {{name}} and {{order_id}} for personalized messaging.",
  },
  {
    icon: Download,
    title: "Generate CSV",
    description:
      "Auto-generate a CSV file with the correct headers based on your template's placeholders. No guesswork needed.",
  },
  {
    icon: Upload,
    title: "Fill & Upload CSV",
    description:
      "Fill in recipient data in the CSV and upload it back. The system validates everything before dispatch.",
  },
  {
    icon: Eye,
    title: "Preview Recipients",
    description:
      "Review every recipient and their personalized email content before sending. Catch errors early.",
  },
  {
    icon: Send,
    title: "Dispatch Emails",
    description:
      "Hit send and watch emails fly out in real-time with live progress tracking via WebSocket updates.",
  },
];

// ── Features Data ─────────────────────────────────────────────
const features = [
  {
    icon: Zap,
    title: "Blazing Fast Dispatch",
    description:
      "Celery-powered background processing sends thousands of emails without blocking your browser.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "Credentials stay on your server. No data leaves your infrastructure.",
  },
  {
    icon: BarChart2,
    title: "Real-Time Monitoring",
    description:
      "Watch every email land in real-time with live WebSocket status updates.",
  },
];

// ── Tech Stack Badges ─────────────────────────────────────────
const techStack = [
  { name: "React", color: "#61DAFB" },
  { name: "Django", color: "#092E20" },
  { name: "PostgreSQL", color: "#4169E1" },
  { name: "Redis", color: "#DC382D" },
  { name: "Celery", color: "#37814A" },
  { name: "Docker", color: "#2496ED" },
];

// ══════════════════════════════════════════════════════════════
// HomePage Component
// ══════════════════════════════════════════════════════════════
export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* ── SECTION 1 — Hero ──────────────────────────────────── */}
      <section
        id="hero-section"
        className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 30%, #1e1b4b 60%, #0f172a 100%)",
        }}
      >
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 30, -50, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(79,70,229,0.6) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 40, -60, 0],
            y: [0, -60, 30, 0],
            scale: [1, 1.2, 0.85, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
          >
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
              MailBlast
            </span>
          </motion.h1>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Personalized bulk emails. Beautifully simple.
          </motion.p>

          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              id="hero-cta-get-started"
              size="lg"
              onClick={() => navigate("/templates")}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl px-8 py-3 text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              id="hero-cta-view-templates"
              size="lg"
              variant="outline"
              onClick={() => navigate("/templates")}
              className="rounded-xl px-8 py-3 text-base font-semibold border-slate-600 text-slate-300 hover:bg-white/5 hover:border-slate-500 transition-all duration-300"
            >
              View Templates
            </Button>
          </motion.div>
        </div>

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── SECTION 2 — How It Works ──────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From template to inbox in 5 simple steps
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 relative"
          >
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={cardVariant}
                className="relative group"
              >
                {/* Connecting arrow (desktop only, between cards) */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-indigo-500/40">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}

                <div className="h-full flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] hover:border-indigo-500/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-indigo-500/5">
                  {/* Step number circle */}
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {index + 1}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3 — Features Highlight ────────────────────── */}
      <section id="features-section" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Built for speed, security, and real-time visibility
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={cardVariant}
                className="group relative p-8 rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md hover:bg-white/[0.08] hover:border-indigo-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/5"
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-500" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 4 — Tech Stack Badges / Footer ────────────── */}
      <section id="tech-stack-section" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm text-slate-500 uppercase tracking-widest mb-6 font-medium">
              Built with
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 font-medium hover:bg-white/[0.08] transition-colors duration-200"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tech.color }}
                  />
                  {tech.name}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} MailBlast — Bulk Email Dispatch Platform
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
