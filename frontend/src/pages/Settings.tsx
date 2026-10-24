import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Lock,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";

export default function Settings() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [busyProfile, setBusyProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Credentials form state
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [credBusy, setCredBusy] = useState(false);
  const [credSuccess, setCredSuccess] = useState(false);
  const [credError, setCredError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && !newEmail) {
      setNewEmail(user.email);
    }
    if (user?.full_name && !name) {
      setName(user.full_name);
    }
  }, [user]);

  useEffect(() => {
    api
      .get("/security/status")
      .then((res) => setStatus(res.data))
      .catch((err) => console.warn("Could not fetch security status:", err));
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusyProfile(true);
    setProfileSuccess(false);
    try {
      await api.patch("/auth/me", { full_name: name });
      await refresh();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setBusyProfile(false);
    }
  }

  async function saveCredentials(e: FormEvent) {
    e.preventDefault();
    setCredError("");
    setCredSuccess(false);

    if (!currentPassword) {
      setCredError("Please enter your current password to authorize this change.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setCredError("New password must be at least 8 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredError("New password and confirmation do not match.");
        return;
      }
    }

    setCredBusy(true);
    try {
      const res = await api.post("/auth/credentials", {
        current_password: currentPassword,
        new_email: newEmail.trim() || undefined,
        new_password: newPassword || undefined,
      });

      if (res.data?.access_token) {
        localStorage.setItem("docnest_token", res.data.access_token);
      }

      await refresh();
      setCredSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setCredSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setCredError(msg || "Failed to update credentials. Please check your current password.");
    } finally {
      setCredBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Settings & Vault Security Posture"
        subtitle="Manage your profile, change your owner email and password, and inspect security parameters"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Credentials Card (Email & Password) */}
        <form onSubmit={saveCredentials} className="card p-6 space-y-4 shadow-soft bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="font-display font-bold text-base text-navy-900">Change Email & Password</h2>
              <p className="text-xs text-slate-500">Update your primary owner login credentials</p>
            </div>
          </div>

          {/* Owner Email */}
          <div>
            <label className="label" htmlFor="ownerEmail">Owner Email Address</label>
            <div className="relative">
              {!newEmail && focusedField !== "ownerEmail" && (
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              )}
              <input
                id="ownerEmail"
                type="email"
                autoComplete="off"
                className={`input text-xs transition-all ${
                  !newEmail && focusedField !== "ownerEmail" ? "pl-10" : "pl-3.5"
                }`}
                value={newEmail}
                onFocus={() => setFocusedField("ownerEmail")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="label" htmlFor="currentPass">Current Password *</label>
            <div className="relative">
              {!currentPassword && focusedField !== "currentPass" && (
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              )}
              <input
                id="currentPass"
                type={showCurrentPass ? "text" : "password"}
                autoComplete="new-password"
                className={`input pr-10 text-xs transition-all ${
                  !currentPassword && focusedField !== "currentPass" ? "pl-10" : "pl-3.5"
                }`}
                value={currentPassword}
                onFocus={() => setFocusedField("currentPass")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-navy-900 transition"
                title={showCurrentPass ? "Hide password" : "Show password"}
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Required to authorize credential updates.</p>
          </div>

          {/* New Password */}
          <div>
            <label className="label" htmlFor="newPass">New Password (leave blank to keep current)</label>
            <div className="relative">
              {!newPassword && focusedField !== "newPass" && (
                <Key className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              )}
              <input
                id="newPass"
                type={showNewPass ? "text" : "password"}
                autoComplete="new-password"
                className={`input pr-10 text-xs transition-all ${
                  !newPassword && focusedField !== "newPass" ? "pl-10" : "pl-3.5"
                }`}
                minLength={8}
                value={newPassword}
                onFocus={() => setFocusedField("newPass")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-navy-900 transition"
                title={showNewPass ? "Hide password" : "Show password"}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          {newPassword && (
            <div>
              <label className="label" htmlFor="confirmNewPass">Confirm New Password</label>
              <div className="relative">
                {!confirmPassword && focusedField !== "confirmNewPass" && (
                  <Key className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="confirmNewPass"
                  type={showNewPass ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input text-xs transition-all ${
                    !confirmPassword && focusedField !== "confirmNewPass" ? "pl-10" : "pl-3.5"
                  }`}
                  minLength={8}
                  value={confirmPassword}
                  onFocus={() => setFocusedField("confirmNewPass")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {credSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Owner credentials updated successfully!</span>
            </div>
          )}

          {credError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{credError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={credBusy || !currentPassword}
              className="btn-primary text-xs w-full justify-center !py-2.5"
            >
              {credBusy ? "Updating credentials…" : "Update Owner Credentials"}
            </button>
          </div>
        </form>

        {/* Right Column: Profile & Security Posture */}
        <div className="space-y-6">
          {/* Profile Card */}
          <form onSubmit={saveProfile} className="card p-6 space-y-4 shadow-soft bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="font-display font-bold text-base text-navy-900">User Profile</h2>
            </div>

            <div>
              <label className="label" htmlFor="userFullName">Full Name</label>
              <input
                id="userFullName"
                className="input text-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Current Active Email</label>
              <input
                className="input text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                value={user?.email || ""}
                disabled
              />
            </div>

            {profileSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={busyProfile} className="btn-secondary text-xs">
                {busyProfile ? "Saving…" : "Save Name Changes"}
              </button>
            </div>
          </form>

          {/* Security Status Card */}
          <div className="card p-6 space-y-4 shadow-soft bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h2 className="font-display font-bold text-base text-navy-900">Vault Security Status</h2>
              </div>
              <Link to="/about" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
                View About & Specs &rarr;
              </Link>
            </div>

            {status ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-teal-600" />
                    Storage Integrity
                  </span>
                  <span className="font-semibold text-emerald-600">Tamper-Proof Registry</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-teal-600" />
                    Storage Protection
                  </span>
                  <span className="font-semibold text-emerald-600">Private & Encrypted</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-indigo-600" />
                    Key Architecture
                  </span>
                  <span className="font-semibold text-slate-700">Dedicated Master Key</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Loading security status…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
