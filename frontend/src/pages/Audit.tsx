import { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Database,
  FileCheck2,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  Key,
  Eye,
  RefreshCw,
} from "lucide-react";
import { api, Audit, Document, localTime } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";

export default function AuditPage() {
  const { household } = useAuth();
  const [rows, setRows] = useState<Audit[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Integrity tester state
  const [selectedDocId, setSelectedDocId] = useState("");
  const [testingIntegrity, setTestingIntegrity] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<Record<string, unknown> | null>(null);

  async function loadData() {
    if (!household) return;
    setLoading(true);
    setError("");

    try {
      const [auditRes, docsRes] = await Promise.all([
        api.get("/audit", { params: { household_id: household.id } }),
        api.get("/documents", { params: { household_id: household.id } }),
      ]);
      setRows(auditRes.data || []);
      setDocs(docsRes.data || []);
      if (docsRes.data && docsRes.data.length > 0) {
        setSelectedDocId(docsRes.data[0].id);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || "Only household owners can view the complete administrative audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [household]);

  // Run integrity verification on selected doc
  async function runVerify() {
    if (!selectedDocId) return;
    setTestingIntegrity(true);
    setIntegrityResult(null);
    try {
      const res = await api.post(`/documents/${selectedDocId}/verify`);
      setIntegrityResult(res.data);
      loadData();
    } catch (err) {
      console.error("Verification failed:", err);
      setIntegrityResult({
        status: "error",
        message: "Failed to communicate with verification engine.",
      });
    } finally {
      setTestingIntegrity(false);
    }
  }

  // Run tamper demo
  async function runTamperDemo() {
    if (!selectedDocId) return;
    if (!confirm("This will simulate file alteration to test tamper detection. Proceed?")) return;
    setTestingIntegrity(true);
    try {
      const res = await api.post(`/documents/${selectedDocId}/tamper-demo`);
      setIntegrityResult(res.data);
      loadData();
    } catch (err) {
      console.error("Tamper demo failed:", err);
    } finally {
      setTestingIntegrity(false);
    }
  }

  // Filtered audit events
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterAction !== "all" && !r.action.toLowerCase().includes(filterAction)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.action.toLowerCase().includes(q) ||
          r.resource_type.toLowerCase().includes(q) ||
          (r.details && r.details.toLowerCase().includes(q)) ||
          (r.actor_id && r.actor_id.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [rows, filterAction, searchQuery]);

  const uniqueActions = ["all", "auth.login", "document.upload", "document.read", "document.verify", "document.delete", "document.share"];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Security Center & Audit Log"
        subtitle="Security status, activity log, and verification records for your household vault"
        isLive={!error}
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {rows.length} Total Audit Records
          </span>
        }
        actions={
          <button onClick={loadData} className="btn-secondary !text-xs !py-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Security Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard
          title="Storage Security"
          value="Private Encryption"
          subtitle="Per-document key protection"
          icon={Lock}
          iconColor="teal"
          trend={{ label: "Authenticated", positive: true }}
        />

        <MetricCard
          title="Integrity Verification"
          value="Tamper-Proof"
          subtitle="Digital fingerprint registry"
          icon={FileCheck2}
          iconColor="emerald"
          trend={{ label: "Active", positive: true }}
        />

        <MetricCard
          title="Access Governance"
          value="Role Protected"
          subtitle="Family & guest permissions"
          icon={Key}
          iconColor="indigo"
        />

        <MetricCard
          title="Logged Events"
          value={rows.length}
          subtitle="Secure activity history"
          icon={Database}
          iconColor="navy"
        />
      </div>

      {/* Interactive Integrity & Tamper Testing */}
      <div className="card p-5 space-y-4 shadow-soft border-teal-200/80 bg-gradient-to-br from-white to-teal-50/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-bold text-base text-navy-900">Document Authenticity Verification</h2>
              <p className="text-xs text-slate-500">Verify that your stored documents match their original digital fingerprint</p>
            </div>
          </div>

          {docs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input !w-auto text-xs py-1.5 cursor-pointer max-w-xs"
                value={selectedDocId}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  setIntegrityResult(null);
                }}
              >
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.file_name})
                  </option>
                ))}
              </select>

              <button
                onClick={runVerify}
                disabled={testingIntegrity}
                className="btn-teal text-xs !py-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{testingIntegrity ? "Verifying…" : "Verify Authenticity"}</span>
              </button>

              <button
                onClick={runTamperDemo}
                disabled={testingIntegrity}
                className="btn-secondary text-xs !py-1.5 text-rose-700 hover:bg-rose-50 border-rose-200"
                title="Simulates file modification to demonstrate automatic alert detection"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Test Tamper Alert</span>
              </button>
            </div>
          )}
        </div>

        {integrityResult && (
          <div
            className={`rounded-xl border p-4 text-xs space-y-2 transition-all ${
              integrityResult.status === "verified"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                : "border-rose-200 bg-rose-50/80 text-rose-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                {integrityResult.status === "verified" ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span>Verification Result: {String(integrityResult.status).toUpperCase()}</span>
              </div>
              <span className="font-semibold px-2 py-0.5 rounded bg-white/70 border border-current text-[11px]">
                Mode: {String(integrityResult.mode || "database")}
              </span>
            </div>

            <p className="font-medium">{String(integrityResult.message)}</p>

            {Boolean(integrityResult.sha256) && (
              <div className="space-y-1 font-mono text-[11px] bg-white/80 p-2.5 rounded-lg border border-current/20">
                <p>Expected SHA-256: {String(integrityResult.sha256)}</p>
                {Boolean(integrityResult.computed_sha256) && (
                  <p>Computed SHA-256: {String(integrityResult.computed_sha256)}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Log Controls & Filters */}
      <div className="card p-4 space-y-3 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            {!searchQuery && !searchFocused && (
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            )}
            <input
              type="text"
              autoComplete="off"
              className={`input text-xs transition-all ${
                !searchQuery && !searchFocused ? "pl-10" : "pl-3.5"
              }`}
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {uniqueActions.map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`shrink-0 rounded-full px-3 py-1 font-medium transition ${
                  filterAction === act
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {act.replace("document.", "").replace("auth.", "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card overflow-hidden shadow-soft">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-navy-900">Event Audit Trail</h2>
            <p className="text-xs text-slate-500">Every login, document view, decryption, and grant is cryptographically recorded</p>
          </div>
          <span className="text-xs font-semibold text-teal-700">
            Showing {filteredRows.length} events
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No audit events found"
            description="Audit events are automatically generated whenever users sign in, view files, upload documents, or modify roles."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5 pl-5">Timestamp (IST)</th>
                  <th className="p-3.5">Action Event</th>
                  <th className="p-3.5">Target Resource</th>
                  <th className="p-3.5">Details & Metadata</th>
                  <th className="p-3.5 pr-5 text-right">Actor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const isDelete = row.action.includes("delete");
                  const isUpload = row.action.includes("upload");
                  const isAuth = row.action.includes("login");
                  const isVerify = row.action.includes("verify");

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-5 whitespace-nowrap text-xs font-mono text-slate-500">
                        {localTime(row.created_at)}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isDelete
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isUpload
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : isAuth
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : isVerify
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {row.action}
                        </span>
                      </td>

                      <td className="p-3.5 text-xs text-slate-700 font-medium capitalize">
                        {row.resource_type}
                      </td>

                      <td className="p-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {row.details || "—"}
                      </td>

                      <td className="p-3.5 pr-5 text-right whitespace-nowrap text-xs font-mono text-slate-400">
                        {row.actor_id ? `${row.actor_id.substring(0, 8)}…` : "system"}
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
