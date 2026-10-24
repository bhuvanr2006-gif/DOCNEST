import { FormEvent, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Plus,
  Car,
  Home,
  Tv,
  Shield,
  Package,
  Calendar,
  FileText,
  Trash2,
  ExternalLink,
  Search,
} from "lucide-react";
import {
  api,
  Asset,
  Document,
  formatINR,
  formatDate,
} from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";

const typeIconMap: Record<string, typeof Package> = {
  vehicle: Car,
  property: Home,
  electronics: Tv,
  insurance: Shield,
  other: Package,
};

const assetCategories = ["all", "property", "vehicle", "electronics", "insurance", "other"];

export default function Assets() {
  const { household } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [busySubmitting, setBusySubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    asset_type: "vehicle",
    description: "",
    purchase_date: "",
    value_amount: "",
    warranty_date: "",
    document_ids: [] as string[],
  });

  async function load() {
    if (!household) return;
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        api.get("/assets", { params: { household_id: household.id } }),
        api.get("/documents", { params: { household_id: household.id } }),
      ]);
      setAssets(a.data || []);
      setDocs(d.data || []);
    } catch (err) {
      console.error("Unable to fetch assets from backend:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [household]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!household) return;
    setBusySubmitting(true);
    try {
      await api.post(
        "/assets",
        {
          name: form.name,
          asset_type: form.asset_type,
          description: form.description || null,
          purchase_date: form.purchase_date || null,
          value_amount: form.value_amount ? Number(form.value_amount) : null,
          warranty_date: form.warranty_date || null,
          document_ids: form.document_ids,
        },
        { params: { household_id: household.id } }
      );
      setForm({
        name: "",
        asset_type: "vehicle",
        description: "",
        purchase_date: "",
        value_amount: "",
        warranty_date: "",
        document_ids: [],
      });
      setShowAddForm(false);
      load();
    } catch (err) {
      console.error("Failed to add asset:", err);
      alert("Failed to save asset. Check fields and retry.");
    } finally {
      setBusySubmitting(false);
    }
  }

  async function deleteAsset(id: string) {
    if (!confirm("Are you sure you want to remove this asset record?")) return;
    try {
      await api.delete(`/assets/${id}`);
      load();
    } catch (err) {
      console.error("Failed to delete asset:", err);
    }
  }

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (selectedType !== "all" && a.asset_type.toLowerCase() !== selectedType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [assets, selectedType, searchQuery]);

  // Aggregate metrics
  const totalValue = assets.reduce((sum, a) => sum + (a.value_amount || 0), 0);
  const activeWarrantiesCount = assets.filter((a) => a.warranty_date).length;
  const totalLinkedDocsCount = assets.reduce((sum, a) => sum + (a.document_ids?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Household Assets & Warranties"
        subtitle={`Track properties, vehicles, electronics, and attach official proof of ownership for ${household?.name || "Household"}`}
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {assets.length} {assets.length === 1 ? "asset" : "assets"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary !text-xs !py-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "Close Form" : "Record New Asset"}</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard
          title="Total Assets"
          value={assets.length}
          subtitle="Household catalogued items"
          icon={Wallet}
          iconColor="teal"
        />

        <MetricCard
          title="Portfolio Valuation"
          value={formatINR(totalValue)}
          subtitle="Estimated declared value"
          icon={Wallet}
          iconColor="emerald"
        />

        <MetricCard
          title="Monitored Warranties"
          value={activeWarrantiesCount}
          subtitle="Policies & guarantees"
          icon={Calendar}
          iconColor="amber"
        />

        <MetricCard
          title="Attached Records"
          value={totalLinkedDocsCount}
          subtitle="Deeds, receipts, insurance"
          icon={FileText}
          iconColor="indigo"
        />
      </div>

      {/* Add Asset Form Modal/Drawer */}
      {showAddForm && (
        <form onSubmit={onSubmit} className="card p-6 space-y-4 shadow-elevated border-teal-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" />
              <h3 className="font-display font-bold text-base text-navy-900">Record New Household Asset</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-navy-900"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="assetName">Asset Name *</label>
              <input
                id="assetName"
                className="input text-xs"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="assetType">Asset Classification</label>
              <select
                id="assetType"
                className="input text-xs cursor-pointer capitalize"
                value={form.asset_type}
                onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
              >
                <option value="vehicle">Vehicle (Car / Two-Wheeler)</option>
                <option value="property">Real Estate & Property</option>
                <option value="electronics">Electronics & Appliances</option>
                <option value="insurance">Insurance Coverage</option>
                <option value="other">Other High-Value Item</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="assetVal">Declared / Purchase Value (INR)</label>
              <input
                id="assetVal"
                type="number"
                className="input text-xs"
                value={form.value_amount}
                onChange={(e) => setForm({ ...form, value_amount: e.target.value })}
              />
            </div>

            <div>
              <label className="label" htmlFor="purchaseDate">Purchase / Acquisition Date</label>
              <input
                id="purchaseDate"
                type="date"
                className="input text-xs"
                value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label" htmlFor="warrantyDate">Warranty or Policy Expiry Date</label>
              <input
                id="warrantyDate"
                type="date"
                className="input text-xs"
                value={form.warranty_date}
                onChange={(e) => setForm({ ...form, warranty_date: e.target.value })}
              />
            </div>

            <div>
              <label className="label" htmlFor="assetDesc">Description / Registration No</label>
              <input
                id="assetDesc"
                className="input text-xs"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Link Existing Documents */}
          {docs.length > 0 && (
            <div className="pt-2">
              <label className="label">Link Stored Vault Documents (Proof of Ownership / Warranty)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {docs.map((doc) => {
                  const checked = form.document_ids.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                        checked
                          ? "border-teal-500 bg-teal-50/80 text-teal-900"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, document_ids: [...form.document_ids, doc.id] });
                          } else {
                            setForm({
                              ...form,
                              document_ids: form.document_ids.filter((id) => id !== doc.id),
                            });
                          }
                        }}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{doc.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary !text-xs !py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busySubmitting || !form.name}
              className="btn-primary !text-xs !py-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{busySubmitting ? "Saving record…" : "Save Asset Record"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
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

          {/* Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {assetCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedType(cat)}
                className={`shrink-0 capitalize rounded-full px-3 py-1 font-medium transition ${
                  selectedType === cat
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-6 w-20 bg-slate-200 rounded-md" />
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets recorded"
          description="Register household vehicles, real estate, electronics, or appliances, and link them to digital receipts and warranty certificates."
          action={{
            label: "Add your first asset",
            onClick: () => setShowAddForm(true),
            icon: Plus,
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => {
            const Icon = typeIconMap[asset.asset_type.toLowerCase()] || Package;

            return (
              <div
                key={asset.id}
                className="card-interactive p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-800 border border-teal-200/80">
                      <Icon className="w-3.5 h-3.5 text-teal-600" />
                      {asset.asset_type}
                    </span>

                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                      title="Remove asset record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-display font-bold text-base text-navy-900 group-hover:text-teal-700 transition">
                    {asset.name}
                  </h3>

                  {asset.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {asset.description}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Valuation:</span>
                      <span className="font-bold text-navy-900">
                        {formatINR(asset.value_amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Warranty:</span>
                      <span className="font-medium text-slate-700">
                        {asset.warranty_date ? formatDate(asset.warranty_date) : "None"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Linked Documents Tags */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Linked Vault Records ({asset.document_ids?.length || 0})
                  </p>

                  {asset.document_ids && asset.document_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {asset.document_ids.map((docId) => {
                        const linked = docs.find((d) => d.id === docId);
                        return (
                          <Link
                            key={docId}
                            to={`/documents/${docId}`}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200 px-2 py-0.5 text-[11px] text-slate-700 transition"
                          >
                            <FileText className="w-3 h-3 text-teal-600" />
                            <span className="truncate max-w-[120px]">
                              {linked ? linked.title : "Document"}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No documents attached</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
