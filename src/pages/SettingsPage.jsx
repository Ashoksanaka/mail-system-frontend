// ──────────────────────────────────────────────────────────────
// SettingsPage — Gmail SMTP credentials for the signed-in user
// ──────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { Settings, KeyRound, Mail, CheckCircle2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getSmtpSettings, updateSmtpSettings } from "../lib/api";

export default function SettingsPage() {
  const [senderEmail, setSenderEmail] = useState("");
  const [hasAppPassword, setHasAppPassword] = useState(false);
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getSmtpSettings();
        if (!mounted) return;
        setSenderEmail(data.sender_email || "");
        setHasAppPassword(Boolean(data.has_app_password));
      } catch (err) {
        toast.error(err.message || "Failed to load SMTP settings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!appPassword.trim()) {
      toast.error("Enter your Gmail app password");
      return;
    }
    setSaving(true);
    try {
      const { data } = await updateSmtpSettings(appPassword);
      setSenderEmail(data.sender_email || "");
      setHasAppPassword(Boolean(data.has_app_password));
      setAppPassword("");
      toast.success("Gmail app password saved");
    } catch (err) {
      toast.error(err.message || "Failed to save app password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Configure the Gmail account used to send bulk emails"
      />

      <div className="mt-8 rounded-2xl border border-border bg-white/[0.03] p-6 sm:p-8 space-y-8">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading settings…</p>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Mail className="w-4 h-4 text-indigo-400" />
                Sender email
              </div>
              <p className="text-xs text-slate-500">
                Fixed to the email you used when signing up. It cannot be changed here.
              </p>
              <Input
                value={senderEmail || "Not available yet — sign out and sign in again"}
                readOnly
                disabled
                className="bg-neutral-900/60"
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  Gmail app password
                </div>
                {hasAppPassword ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    Not configured
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create a 16-character App Password in your Google Account (Security →
                2-Step Verification → App passwords). Do not use your normal Google
                password.
              </p>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
              >
                Open Google App Passwords
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    hasAppPassword
                      ? "Enter a new app password to replace the saved one"
                      : "Enter your Gmail app password"
                  }
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                />
                <Button type="submit" disabled={saving || !appPassword.trim()}>
                  {saving ? "Saving…" : hasAppPassword ? "Update password" : "Save password"}
                </Button>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
