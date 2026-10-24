import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  UploadCloud,
  Shield,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../auth";
import { Sidebar } from "../components/Sidebar";

export default function AppLayout() {
  const { user, household, households, setHousehold, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Component */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 lg:px-8 backdrop-blur-md">
          {/* Left: Mobile hamburger & Vault Status indicator */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-navy-900 lg:hidden transition"
              onClick={() => setOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {/* Security Pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <Shield className="h-3.5 w-3.5 text-teal-600" />
              <span>Vault Protected</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Right: Quick actions, notifications, household, and user profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Upload CTA */}
            <Link
              to="/upload"
              className="btn-teal !py-1.5 !px-3 text-xs shadow-sm hidden md:inline-flex"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </Link>

            {/* Notification Bell */}
            <Link
              to="/reminders"
              className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900 transition"
              title="Expirations & Reminders"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </Link>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Household Dropdown if multiple */}
            {households.length > 1 && (
              <div className="relative hidden md:block">
                <select
                  className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-navy-900 outline-none focus:border-teal-500 transition cursor-pointer appearance-none"
                  value={household?.id || ""}
                  onChange={(e) => {
                    const next = households.find((h) => h.id === e.target.value);
                    if (next) setHousehold(next);
                  }}
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            )}

            {/* User Profile Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-900 text-white font-bold text-xs shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-navy-900 leading-tight truncate max-w-[120px]">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-[10px] text-teal-700 font-medium capitalize">
                    {household?.role || "Member"}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-elevated z-40">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-navy-900 truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="mt-1 inline-block rounded bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                        {household?.name} · {household?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon size={14} />
                        Profile & Settings
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await logout();
                          navigate("/login");
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
