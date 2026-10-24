import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  CalendarClock,
  Users,
  Wallet,
  ShieldAlert,
  Share2,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  ChevronDown,
  Info,
} from "lucide-react";
import { useAuth } from "../auth";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navSections = [
  {
    title: "VAULT CORE",
    links: [
      { to: "/", label: "Overview", icon: LayoutDashboard },
      { to: "/documents", label: "Documents", icon: Files },
      { to: "/upload", label: "Upload Document", icon: UploadCloud },
      { to: "/reminders", label: "Expiry Tracker", icon: CalendarClock },
    ],
  },
  {
    title: "HOUSEHOLD & ASSETS",
    links: [
      { to: "/assets", label: "Household Assets", icon: Wallet },
      { to: "/members", label: "Family Members", icon: Users },
      { to: "/sharing", label: "Sharing Grants", icon: Share2 },
    ],
  },
  {
    title: "SECURITY & ABOUT",
    links: [
      { to: "/audit", label: "Security & Audit", icon: ShieldAlert },
      { to: "/settings", label: "Vault Settings", icon: Settings },
      { to: "/about", label: "About DocNest", icon: Info },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, household, households, setHousehold, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between bg-navy-950 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-navy-900/80 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top: Logo & Household selector */}
        <div>
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-navy-900/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  DocNest
                  <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/30 uppercase tracking-wider">
                    v1.0
                  </span>
                </span>
                <p className="text-xs text-slate-400">Encrypted Household Vault</p>
              </div>
            </div>

            <button
              className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Household Switcher */}
          <div className="px-4 py-3 border-b border-navy-900/80 bg-navy-900/40">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 px-2 block mb-1">
              Active Household
            </label>
            {households.length > 1 ? (
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl bg-navy-900 border border-navy-800 px-3 py-2 text-xs font-medium text-white outline-none focus:border-teal-500 transition cursor-pointer pr-8"
                  value={household?.id || ""}
                  onChange={(e) => {
                    const next = households.find((h) => h.id === e.target.value);
                    if (next) setHousehold(next);
                  }}
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id} className="bg-navy-900 text-white">
                      {h.name} ({h.role || "member"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm font-semibold text-white truncate">{household?.name || "My Household"}</span>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-400 border border-teal-500/20 capitalize">
                  {household?.role || "Owner"}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6 px-3 py-4 max-h-[calc(100vh-250px)] overflow-y-auto">
            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-1.5">
                  {sec.title}
                </p>
                {sec.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-teal-500/15 text-teal-300 border-l-4 border-teal-400 shadow-sm"
                          : "text-slate-300 hover:bg-navy-900/80 hover:text-white"
                      }`
                    }
                  >
                    <link.icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Profile Footer */}
        <div className="border-t border-navy-900/80 bg-navy-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm shadow-sm">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || "User"}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-navy-900 hover:text-rose-400 transition"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
