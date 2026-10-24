import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Share2,
  Lock,
  Clock,
  ShieldAlert,
  Ban,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { api, Grant, localTime, formatDate } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";

export default function Sharing() {
  const { household } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!household) return;
    setLoading(true);
    try {
      const res = await api.get("/shares", { params: { household_id: household.id } });
      setGrants(res.data || []);
    } catch (err) {
      console.warn("Unable to fetch sharing grants:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [household]);

  async function revokeGrant(id: string) {
    if (!confirm("Revoke this sharing grant immediately? The recipient will lose access.")) return;
    try {
      await api.post(`/shares/${id}/revoke`);
      load();
    } catch (err) {
      console.error("Revoke failed:", err);
    }
  }

  const activeGrants = grants.filter((g) => !g.revoked_at);
  const revokedGrants = grants.filter((g) => g.revoked_at);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Sharing & Permissions"
        subtitle="Temporary access granted to family members, accountants, guests, and advisors"
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {grants.length} Total Grants
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Active Grants"
          value={activeGrants.length}
          subtitle="Currently accessible"
          icon={Share2}
          iconColor="teal"
        />

        <MetricCard
          title="Revoked Grants"
          value={revokedGrants.length}
          subtitle="Access terminated"
          icon={Ban}
          iconColor="rose"
        />

        <MetricCard
          title="Privacy Protection"
          value="Private"
          subtitle="Time-limited access only"
          icon={Lock}
          iconColor="indigo"
        />
      </div>

      <div className="card overflow-hidden shadow-soft">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-navy-900">Access Grants Roster</h2>
            <p className="text-xs text-slate-500">Every grant is tied to a specific document and expiration boundary</p>
          </div>
          <Link to="/documents" className="btn-secondary !text-xs !py-1.5">
            Share a Document
          </Link>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : grants.length === 0 ? (
          <EmptyState
            icon={Share2}
            title="No active sharing grants"
            description="To share an insurance policy or vehicle document with an external advisor, open any document from the repository and use the 'Grant Temporary Access' form."
            action={{
              label: "Browse repository to share",
              href: "/documents",
            }}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {grants.map((g) => {
              const isRevoked = Boolean(g.revoked_at);

              return (
                <div key={g.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-navy-900">{g.document_title || "Document"}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isRevoked
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        {isRevoked ? "Revoked" : "Active"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Grantee: <span className="font-mono text-slate-700 font-semibold">{g.grantee_email}</span> · Scope: <span className="capitalize font-semibold text-teal-700">{g.permission}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Granted: {localTime(g.starts_at)}</span>
                      <span>·</span>
                      <span>{g.expires_at ? `Expires: ${localTime(g.expires_at)}` : "No expiration specified"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/documents/${g.document_id}`}
                      className="btn-ghost !text-xs !py-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Doc</span>
                    </Link>

                    {!isRevoked && (
                      <button
                        onClick={() => revokeGrant(g.id)}
                        className="btn-danger !text-xs !py-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
