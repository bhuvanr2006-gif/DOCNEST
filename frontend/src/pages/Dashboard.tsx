import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  FileText,
  Wallet,
  AlertTriangle,
  Clock,
  UploadCloud,
  Plus,
  ShieldCheck,
  ArrowRight,
  Database,
  Lock,
  Layers,
  RefreshCw,
  Info,
} from "lucide-react";
import { api, Dashboard as Dash, localTime, formatDate } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";

const categoryColorMap: Record<string, string> = {
  identity: "#2563EB",
  pan: "#D97706",
  education: "#7C3AED",
  medical: "#E11D48",
  insurance: "#059669",
  property: "#0D9488",
  financial: "#4F46E5",
  vehicle: "#0284C7",
  other: "#0F2744",
};

export default function Dashboard() {
  const { household } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = () => {
    if (!household) return;
    setLoading(true);
    setError("");

    api
      .get("/dashboard", { params: { household_id: household.id } })
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError("Unable to load live dashboard data. Please verify your connection.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [household]);

  const totalDocs = data?.total_documents ?? 0;
  const totalAssets = data?.assets_count ?? 0;
  const upcomingExpirations = data?.upcoming_expirations ?? [];
  const expiredDocs = data?.expired_documents ?? [];
  const recentDocs = data?.recent_documents ?? [];
  const recentAudit = data?.recent_audit ?? [];

  const categoryCounts: Record<string, number> = data?.by_category ?? {};

  const chartData = Object.entries(categoryCounts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    categoryKey: name.toLowerCase(),
    count,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-72 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Household Vault Overview"
        subtitle={`Managing secure documents and assets for ${household?.name || "Household"}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="btn-secondary !text-xs !py-2"
              title="Refresh dashboard data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Refresh</span>
            </button>
            <Link to="/upload" className="btn-primary !text-xs !py-2">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-semibold underline text-amber-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Documents"
          value={totalDocs}
          subtitle="Securely Saved"
          icon={FileText}
          iconColor="teal"
          trend={{ label: "Vault secured", positive: true }}
        />

        <MetricCard
          title="Household Assets"
          value={totalAssets}
          subtitle="Linked with records"
          icon={Wallet}
          iconColor="indigo"
          trend={{ label: "Active portfolio", positive: true }}
        />

        <MetricCard
          title="Expiring in 30 Days"
          value={upcomingExpirations.length}
          subtitle="Action required"
          icon={Clock}
          iconColor="amber"
          trend={upcomingExpirations.length > 0 ? { label: "Review dates", positive: false } : undefined}
        />

        <MetricCard
          title="Expired Documents"
          value={expiredDocs.length}
          subtitle="Needs immediate renewal"
          icon={AlertTriangle}
          iconColor="rose"
          trend={expiredDocs.length > 0 ? { label: "Critical", positive: false } : { label: "All current", positive: true }}
        />
      </div>

      {/* Security Highlights Banner */}
      <div className="card p-5 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 text-white shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <h2 className="font-display text-base font-bold text-white">Vault Security & Privacy Active</h2>
              <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[11px] font-medium text-teal-300 border border-teal-500/30">
                Private & Protected
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Your family records, policies, and files are stored privately on your secure system. Only authorized household members can view or access documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link to="/about" className="btn bg-white/10 text-white hover:bg-white/20 text-xs !py-2 border border-white/10">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              <span>About DocNest</span>
            </Link>
            <Link to="/upload" className="btn bg-teal-500 text-navy-950 hover:bg-teal-400 font-bold text-xs !py-2 shadow">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Grid: Category Distribution & Vault Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Distribution Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-base text-navy-900">Documents by Category</h2>
              <p className="text-xs text-slate-500">Distribution across recognized household document types</p>
            </div>
            <Link to="/documents" className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition">
              Browse all &rarr;
            </Link>
          </div>

          {chartData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No categorized documents in this household yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs">
                            <p className="font-semibold text-navy-900">{item.name}</p>
                            <p className="text-teal-700 font-bold">{item.count} document{item.count > 1 ? "s" : ""}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.categoryKey}
                        fill={categoryColorMap[entry.categoryKey] || "#0D9488"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Vault Quick Status Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display font-bold text-base text-navy-900">Vault Health</h2>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Optimal
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Storage Protection</span>
              <span className="font-semibold text-emerald-600">Private & Encrypted</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">File Authenticity</span>
              <span className="font-semibold text-emerald-600">Tamper-Proof Verified</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Active Household</span>
              <span className="font-semibold text-navy-900">{household?.name || "Bhuvan Family Vault"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Access Mode</span>
              <span className="font-semibold text-teal-700 capitalize">{household?.role || "Owner"}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Document Scanner</span>
              <span className="font-semibold text-navy-900">Automated Text Capture</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/upload"
              className="w-full btn-teal text-xs justify-center flex"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Upcoming Expirations & Recent Documents */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Expirations Card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-base text-navy-900">Upcoming Expirations</h2>
              <p className="text-xs text-slate-500">Policies and identity documents requiring attention</p>
            </div>
            <Link to="/reminders" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
              All reminders &rarr;
            </Link>
          </div>

          {upcomingExpirations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-slate-100">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No documents expiring in the next 30 days.</p>
              <p className="text-[11px] text-slate-400 mt-1">All policy and registration dates are current.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingExpirations.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-navy-900 truncate group-hover:text-teal-700 transition">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Expires: {formatDate(doc.expiry_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge type="expiry" value={doc.expiry_status || "expiring_soon"} />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents Card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-base text-navy-900">Recent Documents</h2>
              <p className="text-xs text-slate-500">Latest additions to the household vault</p>
            </div>
            <Link to="/documents" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
              Repository &rarr;
            </Link>
          </div>

          {recentDocs.length === 0 ? (
            <EmptyState
              title="No documents uploaded yet"
              description="Upload your identity or policy documents to get started with encrypted storage and OCR capture."
              action={{
                label: "Upload document",
                href: "/upload",
                icon: UploadCloud,
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {recentDocs.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-navy-800 shadow-sm">
                      <FileText className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-navy-900 truncate group-hover:text-teal-700 transition">
                        {doc.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {doc.file_name} · {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge type="category" value={doc.category} />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Audit Trail Preview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-base text-navy-900">Recent Vault Activity & Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable record of security, authentication, and document access events</p>
          </div>
          <Link to="/audit" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
            Full audit log &rarr;
          </Link>
        </div>

        {recentAudit.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 text-center">No recent audit events.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAudit.slice(0, 4).map((row) => (
              <div key={row.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Database className="w-3.5 h-3.5 text-teal-600" />
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-navy-900">{row.action}</span>
                    <span className="text-slate-400 ml-2">on {row.resource_type}</span>
                    {row.details && (
                      <span className="text-slate-500 ml-1.5 truncate max-w-xs block sm:inline">
                        ({row.details})
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 whitespace-nowrap text-[11px] shrink-0">
                  {localTime(row.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
