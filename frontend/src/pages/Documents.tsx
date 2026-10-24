import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  UploadCloud,
  LayoutGrid,
  List,
  Filter,
  X,
  Layers,
} from "lucide-react";
import { api, Document } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { DocumentCard } from "../components/DocumentCard";
import { DocumentRow } from "../components/DocumentRow";
import { EmptyState } from "../components/EmptyState";

const categories = [
  { id: "all", label: "All Documents" },
  { id: "identity", label: "Identity" },
  { id: "pan", label: "PAN Card" },
  { id: "education", label: "Education" },
  { id: "insurance", label: "Insurance" },
  { id: "property", label: "Property" },
  { id: "medical", label: "Medical" },
  { id: "financial", label: "Financial" },
  { id: "other", label: "Other" },
];

export default function Documents() {
  const { household } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "table">("grid");

  const loadDocuments = () => {
    if (!household) return;
    setLoading(true);

    const apiCategory = selectedCategory === "all" ? undefined : selectedCategory;
    const apiSort = sort === "newest" ? "created_at" : sort === "title" ? "title" : "expiry_date";

    api
      .get("/documents", {
        params: {
          household_id: household.id,
          q: q || undefined,
          category: apiCategory,
          sort: apiSort,
        },
      })
      .then((res) => {
        setDocs(res.data);
      })
      .catch((err) => {
        console.error("Unable to fetch live documents:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, [household, q, selectedCategory, sort]);

  // Expiry status client filter
  const displayedDocs = useMemo(() => {
    if (expiryFilter === "all") return docs;
    return docs.filter((d) => {
      if (expiryFilter === "expiring_soon") return d.expiry_status === "expiring_soon";
      if (expiryFilter === "expired") return d.expiry_status === "expired";
      if (expiryFilter === "valid") return d.expiry_status === "valid";
      return true;
    });
  }, [docs, expiryFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Document Repository"
        subtitle="Secure household records, policies, and family documents"
        badge={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            {displayedDocs.length} {displayedDocs.length === 1 ? "document" : "documents"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/upload" className="btn-primary !text-xs !py-2">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Control Bar */}
      <div className="card p-4 space-y-3.5 shadow-soft">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            {!q && !searchFocused && (
              <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            )}
            <input
              type="text"
              autoComplete="off"
              className={`input pr-9 !py-2 text-xs transition-all ${
                !q && !searchFocused ? "pl-10" : "pl-3.5"
              }`}
              value={q}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-navy-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort & Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-navy-900 outline-none focus:border-teal-500 cursor-pointer"
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
              >
                <option value="all">All Expiry Statuses</option>
                <option value="valid">Valid & Current</option>
                <option value="expiring_soon">Expiring Soon (30d)</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <select
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-navy-900 outline-none focus:border-teal-500 cursor-pointer"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="title">Sort: Title (A-Z)</option>
                <option value="expiry">Sort: Expiry Date</option>
              </select>
            </div>

            {/* View Grid/Table Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5">
              <button
                onClick={() => setView("grid")}
                className={`rounded-lg p-1.5 text-xs transition ${
                  view === "grid"
                    ? "bg-white text-navy-900 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-navy-900"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("table")}
                className={`rounded-lg p-1.5 text-xs transition ${
                  view === "table"
                    ? "bg-white text-navy-900 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-navy-900"
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          {categories.map((c) => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
              <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayedDocs.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No documents found"
          description={
            q || selectedCategory !== "all" || expiryFilter !== "all"
              ? "Try adjusting your search terms or clearing the selected category filters."
              : "Upload your identity cards, certificates, or insurance documents to populate your vault."
          }
          action={{
            label: q || selectedCategory !== "all" ? "Reset All Filters" : "Upload Document",
            onClick:
              q || selectedCategory !== "all"
                ? () => {
                    setQ("");
                    setSelectedCategory("all");
                    setExpiryFilter("all");
                  }
                : undefined,
            href: !(q || selectedCategory !== "all") ? "/upload" : undefined,
            icon: UploadCloud,
          }}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3.5 pl-4">Document Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Expiry Status</th>
                  <th className="p-3.5">Integrity</th>
                  <th className="p-3.5">Digital Fingerprint</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedDocs.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
