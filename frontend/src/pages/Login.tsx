import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../auth";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);



  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid credentials. Please verify your email and password.");
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

        {/* Center Content with Friendly Vault Picture */}
        <div className="my-auto space-y-6 max-w-lg relative z-10">
          {/* User-friendly relative picture */}
          <div className="relative group overflow-hidden rounded-2xl border border-navy-800 bg-navy-900/50 shadow-2xl">
            <img
              src="/vault_hero.jpg"
              alt="Secure Family Vault"
              className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-102"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Simple, User-friendly Message */}
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="font-display text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
              All your family records, safely organized in one place.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Store and manage your family's identity cards, insurance policies, property papers, and certificates with total privacy and simplicity.
            </p>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="text-xs text-slate-400 border-t border-navy-900/80 pt-4 flex items-center justify-between relative z-10">
          <span>Private & Secure Household Storage</span>
          <span>Simple · Safe · Accessible</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-slate-50">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold text-navy-900">Sign in to your Vault</h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to unlock and view your household documents.
            </p>
          </div>

          {user && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-xs text-teal-900 flex items-center justify-between shadow-xs">
              <div>
                <p className="font-semibold text-teal-950">Active session found</p>
                <p className="text-teal-700">Signed in as {user.full_name || user.email}</p>
              </div>
              <Link
                to="/"
                className="btn-primary !py-1.5 !px-3 text-xs"
              >
                Go to Vault &rarr;
              </Link>
            </div>
          )}

          <form onSubmit={onSubmit} autoComplete="off" className="card p-6 space-y-4 shadow-soft bg-white">
            <div>
              <label className="label" htmlFor="loginEmail">Email Address / Username</label>
              <input
                id="loginEmail"
                name="login_email"
                type="email"
                autoComplete="off"
                className="input text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="loginPass">Password</label>
              <input
                id="loginPass"
                name="login_password"
                type="password"
                autoComplete="new-password"
                className="input text-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full text-xs justify-center !py-3"
            >
              <span>{busy ? "Authenticating…" : "Sign In & Unlock Vault"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Need a new household?{" "}
            <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
