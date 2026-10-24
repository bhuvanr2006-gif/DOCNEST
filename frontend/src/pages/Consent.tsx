import { useEffect, useState } from "react";
import { ShieldCheck, Info, CheckCircle, Ban, Clock } from "lucide-react";
import { api, localTime } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";

export default function Consent() {
  const { household } = useAuth();
  const [rows, setRows] = useState<Array<Record<string, string | null>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!household) return;
    setLoading(true);
    api
      .get("/consent", { params: { household_id: household.id } })
      .then((res) => setRows(res.data || []))
      .catch((err) => console.warn("Failed to fetch consent records:", err))
      .finally(() => setLoading(false));
  }, [household]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sharing History & Consent Records"
        subtitle="Log of all temporary access permissions, recipient emails, and expiration times"
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {rows.length} Logged Entries
          </span>
        }
      />

      {/* Privacy Notice Banner */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-xs text-teal-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-teal-950">Privacy & Consent Protection:</p>
          <p className="text-teal-800 leading-relaxed">
            A permanent access log is recorded whenever a document is shared. You can review all active and past sharing records here at any time.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden shadow-soft">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-base text-navy-900">Recorded Consent Entries</h2>
          <p className="text-xs text-slate-500">Every external view or download grant generates a corresponding consent entry</p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No consent records generated yet"
            description="When you grant document access to family members or guests, consent artifacts are automatically created and tracked here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5 pl-5">Created (IST)</th>
                  <th className="p-3.5">Scope</th>
                  <th className="p-3.5">Permission Level</th>
                  <th className="p-3.5">Consent Status</th>
                  <th className="p-3.5 pr-5 text-right">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const isRevoked = Boolean(row.revoked_at);

                  return (
                    <tr key={String(row.id)} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-5 whitespace-nowrap text-xs font-mono text-slate-500">
                        {localTime(String(row.created_at))}
                      </td>

                      <td className="p-3.5 text-xs font-semibold text-navy-900 capitalize">
                        {String(row.scope || "document")}
                      </td>

                      <td className="p-3.5 text-xs text-teal-800 font-semibold capitalize">
                        {String(row.permission)}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isRevoked
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {isRevoked ? <Ban className="w-3 h-3 text-rose-600" /> : <CheckCircle className="w-3 h-3 text-emerald-600" />}
                          <span>{isRevoked ? `Revoked on ${localTime(String(row.revoked_at))}` : "Active Consent"}</span>
                        </span>
                      </td>

                      <td className="p-3.5 pr-5 text-right whitespace-nowrap text-xs text-slate-500">
                        {row.expires_at ? localTime(String(row.expires_at)) : "No expiry"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
