import { FormEvent, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Copy,
  Check,
  Info,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { api, Member, formatDate } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { MetricCard } from "../components/MetricCard";

export default function Members() {
  const { household, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviteFocused, setInviteFocused] = useState(false);
  const [role, setRole] = useState("adult");
  const [inviteToken, setInviteToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [busyInvite, setBusyInvite] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [busyAccept, setBusyAccept] = useState(false);
  const [acceptMessage, setAcceptMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function load() {
    if (!household) return;
    setLoading(true);
    try {
      const res = await api.get(`/households/${household.id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error("Unable to fetch members from backend:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [household]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!household) return;
    setBusyInvite(true);
    setErrorMessage("");
    try {
      const res = await api.post(`/households/${household.id}/invitations`, { email, role });
      setInviteToken(res.data.token);
      setEmail("");
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMessage(message || "Failed to create invitation.");
    } finally {
      setBusyInvite(false);
    }
  }

  async function accept(e: FormEvent) {
    e.preventDefault();
    setBusyAccept(true);
    setAcceptMessage("");
    setErrorMessage("");
    try {
      const res = await api.post("/households/invitations/accept", { token: tokenInput });
      setAcceptMessage(res.data.message || "Invitation accepted successfully!");
      setTokenInput("");
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMessage(message || "Invalid or expired invitation token.");
    } finally {
      setBusyAccept(false);
    }
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!household) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this household?`)) return;
    try {
      await api.delete(`/households/${household.id}/members/${memberId}`);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || "Failed to remove member.");
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(inviteToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ownersCount = members.filter((m) => m.role === "owner").length;
  const adultsCount = members.filter((m) => m.role === "adult").length;
  const dependentsCount = members.filter((m) => m.role === "dependent").length;
  const guestsCount = members.filter((m) => m.role === "guest").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Family Members & Role Access"
        subtitle={`Role-based access control and family vault permissions for ${household?.name || "Household"}`}
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard
          title="Household Owners"
          value={ownersCount}
          subtitle="Full vault admin rights"
          icon={Shield}
          iconColor="navy"
        />

        <MetricCard
          title="Adult Members"
          value={adultsCount}
          subtitle="Upload and manage"
          icon={Users}
          iconColor="teal"
        />

        <MetricCard
          title="Dependents"
          value={dependentsCount}
          subtitle="Protected read-only"
          icon={Users}
          iconColor="indigo"
        />

        <MetricCard
          title="Guest Grants"
          value={guestsCount}
          subtitle="Purpose-limited access"
          icon={Users}
          iconColor="amber"
        />
      </div>

      {/* Role Definitions Info Box */}
      <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-xs text-teal-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-teal-950">Family Member Roles & Permissions:</p>
          <p className="text-teal-800 leading-relaxed">
            <strong>Owner:</strong> Manages household, settings, and audits. ·{" "}
            <strong>Adult:</strong> Uploads, views, and links documents to household assets. ·{" "}
            <strong>Dependent:</strong> View access to family records without deletion permissions. ·{" "}
            <strong>Guest:</strong> Access strictly limited to specific documents shared with time limits.
          </p>
        </div>
      </div>

      {/* Members Roster Table */}
      <div className="card overflow-hidden shadow-soft">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-navy-900">Current Members</h2>
            <p className="text-xs text-slate-500">Authorized accounts linked to {household?.name}</p>
          </div>
          <span className="text-xs font-semibold text-teal-700">
            {members.length} Active {members.length === 1 ? "Account" : "Accounts"}
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No members found in this household.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5 pl-5">Member</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role & Permissions</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white font-bold text-xs shadow-sm">
                          {m.full_name ? m.full_name.charAt(0).toUpperCase() : "M"}
                        </div>
                        <span className="font-semibold text-navy-900">{m.full_name}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-xs text-slate-600 font-mono">
                      {m.email}
                    </td>

                    <td className="p-3.5">
                      <StatusBadge type="role" value={m.role} />
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>

                    <td className="p-3.5 text-xs text-slate-500">
                      {formatDate(m.created_at)}
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      {m.role !== "owner" && user?.id !== m.user_id ? (
                        <button
                          onClick={() => removeMember(m.id, m.full_name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Remove member from household"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Primary Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Column Invitation Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invite Member Form */}
        <div className="card p-5 space-y-4 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="font-display font-bold text-base text-navy-900">Invite Family Member</h3>
              <p className="text-xs text-slate-500">Generate a one-time invitation token for an adult, dependent, or guest</p>
            </div>
          </div>

          <form onSubmit={invite} className="space-y-3.5">
            <div>
              <label className="label" htmlFor="inviteEmail">Member Email</label>
              <div className="relative">
                {!email && !inviteFocused && (
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                )}
                <input
                  id="inviteEmail"
                  type="email"
                  autoComplete="off"
                  className={`input text-xs transition-all ${
                    !email && !inviteFocused ? "pl-10" : "pl-3.5"
                  }`}
                  value={email}
                  onFocus={() => setInviteFocused(true)}
                  onBlur={() => setInviteFocused(false)}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="inviteRole">Assigned Vault Role</label>
              <select
                id="inviteRole"
                className="input text-xs cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="adult">Adult — Can upload and link records</option>
                <option value="dependent">Dependent — Read-only access to household records</option>
                <option value="guest">Guest — Strictly limited to individually shared records</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={busyInvite}
              className="btn-primary w-full text-xs justify-center"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{busyInvite ? "Creating invitation…" : "Generate Invitation Token"}</span>
            </button>
          </form>

          {inviteToken && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  Invitation Created!
                </span>
                <button
                  onClick={copyToken}
                  className="btn-secondary !text-xs !py-1 !px-2.5 bg-white"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Token"}</span>
                </button>
              </div>
              <p className="text-teal-800">
                Share this secure one-time token with the recipient to join:
              </p>
              <code className="block rounded-lg bg-white p-2.5 font-mono text-[11px] text-navy-950 border border-teal-200 break-all select-all">
                {inviteToken}
              </code>
            </div>
          )}
        </div>

        {/* Accept Invitation Form */}
        <div className="card p-5 space-y-4 shadow-soft">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="font-display font-bold text-base text-navy-900">Accept Household Invitation</h3>
              <p className="text-xs text-slate-500">Join another household using an invitation token received from its owner</p>
            </div>
          </div>

          <form onSubmit={accept} className="space-y-3.5">
            <div>
              <label className="label" htmlFor="tokenInput">Invitation Token</label>
              <input
                id="tokenInput"
                type="text"
                autoComplete="off"
                className="input text-xs font-mono"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={busyAccept || !tokenInput}
              className="btn-secondary w-full text-xs justify-center"
            >
              <span>{busyAccept ? "Validating token…" : "Accept & Join Household"}</span>
            </button>
          </form>

          {acceptMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{acceptMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
