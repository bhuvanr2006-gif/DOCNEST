import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  User,
  Mail,
  Home,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../auth";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    household_name: "",
  });

  if (user) return <Navigate to="/" replace />;

  const handleNameChange = (val: string) => {
    // If household_name is empty or was previously auto-derived, auto-suggest a warm vault name
    const currentDerived = form.full_name ? `${form.full_name.trim()} Family Vault` : "";
    const isAutoOrEmpty = !form.household_name || form.household_name === currentDerived || form.household_name === "My Family Vault";

    setForm({
      ...form,
      full_name: val,
      household_name: isAutoOrEmpty && val.trim() ? `${val.trim()} Family Vault` : form.household_name,
    });
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setBusy(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        household_name: form.household_name.trim() || "My Family Vault",
      });
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Registration failed. An account with this email may already exist.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Hero Panel */}
      <div className="hidden bg-navy-950 p-10 text-white lg:flex lg:flex-col lg:justify-between border-r border-navy-900/80 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-navy-800/20 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              DocNest
              <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/30">
                v1.0
              </span>
            </span>
            <p className="text-xs text-slate-400">Encrypted Household Vault</p>
          </div>
        </div>

        {/* Center Content with Friendly Vault Picture & Benefits */}
        <div className="my-auto space-y-6 max-w-lg relative z-10">
          {/* Friendly Vault Graphic Card */}
          <div className="relative group overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/50 shadow-2xl">
            <img
              src="/vault_hero.jpg"
              alt="Secure Family Vault"
              className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-102"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Easy Family Setup
            </span>
            <h1 className="font-display text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              Set up your safe digital family vault in minutes.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Join thousands of families securing their identity papers, policies, and property documents in one organized, private home vault.
            </p>
          </div>

          {/* Friendly Feature Highlights */}
          <div className="space-y-2.5 pt-2 border-t border-navy-900/80 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Full privacy with dedicated local encryption keys</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Smart search for insurance, deeds, and identification</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Never miss an expiry deadline with automated alerts</span>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="text-xs text-slate-400 border-t border-navy-900/80 pt-4 flex items-center justify-between relative z-10">
          <span>Private & Encrypted Storage</span>
          <span>Zero Third-Party Sharing</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 bg-slate-50">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold text-navy-900">Create your Household Vault</h2>
            <p className="text-xs text-slate-500">
              Fill in your details below to become the primary owner and administrator of your family vault.
            </p>
          </div>

          <form onSubmit={onSubmit} autoComplete="off" className="card p-6 sm:p-8 space-y-4 shadow-soft bg-white">
            {/* Full Name */}
            <div>
              <label className="label" htmlFor="fullName">Your Full Name</label>
              <div className="relative">
                {!form.full_name && focused !== "fullName" && (
                  <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="fullName"
                  name="user_fullname"
                  type="text"
                  autoComplete="off"
                  className={`input text-xs transition-all ${
                    !form.full_name && focused !== "fullName" ? "pl-10" : "pl-3.5"
                  }`}
                  value={form.full_name}
                  onFocus={() => setFocused("fullName")}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="label" htmlFor="regEmail">Email Address</label>
              <div className="relative">
                {!form.email && focused !== "email" && (
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="regEmail"
                  name="user_email"
                  type="email"
                  autoComplete="off"
                  className={`input text-xs transition-all ${
                    !form.email && focused !== "email" ? "pl-10" : "pl-3.5"
                  }`}
                  value={form.email}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Household Name */}
            <div>
              <label className="label" htmlFor="householdName">Vault / Household Name</label>
              <div className="relative">
                {!form.household_name && focused !== "household" && (
                  <Home className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="householdName"
                  name="user_household"
                  type="text"
                  autoComplete="off"
                  className={`input text-xs transition-all ${
                    !form.household_name && focused !== "household" ? "pl-10" : "pl-3.5"
                  }`}
                  value={form.household_name}
                  onFocus={() => setFocused("household")}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setForm({ ...form, household_name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="regPassword">Master Password (min 8 characters)</label>
              <div className="relative">
                {!form.password && focused !== "password" && (
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="regPassword"
                  name="user_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input pr-10 text-xs transition-all ${
                    !form.password && focused !== "password" ? "pl-10" : "pl-3.5"
                  }`}
                  minLength={8}
                  value={form.password}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-navy-900 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                {!confirmPassword && focused !== "confirmPassword" && (
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="confirmPassword"
                  name="user_confirm_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input text-xs transition-all ${
                    !confirmPassword && focused !== "confirmPassword" ? "pl-10" : "pl-3.5"
                  }`}
                  minLength={8}
                  value={confirmPassword}
                  onFocus={() => setFocused("confirmPassword")}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full text-xs justify-center !py-3 shadow-sm hover:shadow"
            >
              <span>{busy ? "Setting up your vault…" : "Create & Unlock Vault"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Already have a household vault?{" "}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
