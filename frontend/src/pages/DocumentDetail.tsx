import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FileText,
  Download,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Share2,
  Calendar,
  Lock,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { api, Document, localTime, formatDate, formatBytes } from "../api";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);

  // Verification state
  const [verify, setVerify] = useState<Record<string, unknown> | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Sharing form state
  const [shareEmail, setShareEmail] = useState("");
  const [permission, setPermission] = useState("view");
  const [expires, setExpires] = useState("");
  const [sharingBusy, setSharingBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data);
    } catch {
      setError("You are not authorized to view this document or it has been deleted.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function download() {
    if (!doc) return;
    try {
      const res = await api.get(`/documents/${id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name || "document";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Download failed. Make sure you have view/download permissions.");
    }
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await api.post(`/documents/${id}/verify`);
      setVerify(res.data);
    } catch (err) {
      console.error("Verification error:", err);
      setVerify({
        status: "error",
        message: "Unable to verify document integrity.",
      });
    } finally {
      setVerifying(false);
    }
  }

  async function handleTamperDemo() {
    if (!confirm("This simulation demonstrates tamper detection by simulating file alteration. Continue?")) return;
    setVerifying(true);
    try {
      const res = await api.post(`/documents/${id}/tamper-demo`);
      setVerify(res.data);
    } catch (err) {
      console.error("Tamper demo error:", err);
    } finally {
      setVerifying(false);
    }
  }

  async function onShare(e: FormEvent) {
    e.preventDefault();
    setSharingBusy(true);
    setShareMessage("");
    setShareError("");
    try {
      await api.post(`/documents/${id}/share`, {
        grantee_email: shareEmail,
        permission,
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      setShareMessage(`Temporary ${permission} access granted to ${shareEmail}. A consent record has been logged.`);
      setShareEmail("");
      setExpires("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setShareError(msg || "Failed to grant temporary share access.");
    } finally {
      setSharingBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Permanently delete this document, its ciphertext, and its encryption key from the vault?")) return;
    try {
      await api.delete(`/documents/${id}`);
      navigate("/documents");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete document.");
    }
  }

  const copyHash = () => {
    if (!doc?.sha256) return;
    navigator.clipboard.writeText(doc.sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="card p-8 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="font-display font-bold text-lg text-navy-900">Document Unavailable</h2>
        <p className="text-sm text-slate-500">{error || "Document not found."}</p>
        <Link to="/documents" className="btn-primary inline-flex text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Repository</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Action Header */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy-900 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document Repository</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge type="category" value={doc.category} />
              {doc.expiry_status && doc.expiry_status !== "none" && (
                <StatusBadge type="expiry" value={doc.expiry_status} />
              )}
              <StatusBadge type="integrity" value={doc.integrity_mode} />
            </div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-navy-900">
              {doc.title}
            </h1>
            <p className="text-xs text-slate-500">
              {doc.file_name} · {formatBytes(doc.file_size)} · Uploaded {localTime(doc.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button onClick={download} className="btn-secondary !text-xs !py-2">
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download File</span>
            </button>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="btn-teal !text-xs !py-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{verifying ? "Checking…" : "Verify Authenticity"}</span>
            </button>

            <button
              onClick={handleTamperDemo}
              disabled={verifying}
              className="btn-secondary !text-xs !py-2 text-rose-700 hover:bg-rose-50 border-rose-200"
              title="Demonstrates detection of file modification"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Test Tamper Alert</span>
            </button>

            <button
              onClick={onDelete}
              className="btn-danger !text-xs !py-2"
              title="Permanently remove file from vault"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verify && (
        <div
          className={`card p-5 border text-xs space-y-2 transition-all shadow-soft ${
            verify.status === "verified"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
              : "border-rose-200 bg-rose-50/80 text-rose-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              {verify.status === "verified" ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
              <span>Authenticity Check: {String(verify.status).toUpperCase()}</span>
            </div>
            <span className="font-semibold px-2.5 py-0.5 rounded-full bg-white/80 border border-current text-[11px]">
              Status: {String(verify.status) === "verified" ? "Genuine" : "Altered"}
            </span>
          </div>

          <p className="font-medium text-xs">{String(verify.message)}</p>

          <div className="font-mono text-[11px] bg-white/80 p-2.5 rounded-lg border border-current/20 space-y-1">
            <p className="break-all">Stored Fingerprint: {String(verify.sha256 || doc.sha256)}</p>
            {Boolean(verify.computed_sha256) && (
              <p className="break-all">Current Fingerprint: {String(verify.computed_sha256)}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Details, Scanned fields, Sharing */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Metadata & Extracted Fields */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4 shadow-soft">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-base text-navy-900">Document Information</h2>
              <p className="text-xs text-slate-500">File details & authenticity</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Issue Date</span>
                <span className="font-semibold text-navy-900">{formatDate(doc.issue_date)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Expiry Date</span>
                <span className="font-semibold text-navy-900">
                  {formatDate(doc.expiry_date)} ({doc.expiry_status || "none"})
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Format</span>
                <span className="font-mono text-slate-700">{doc.mime_type}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Protection Status</span>
                <span className="font-semibold text-emerald-600">Secure & Verified</span>
              </div>

              <div className="py-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500">Digital Fingerprint (Hash)</span>
                  <button
                    onClick={copyHash}
                    className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:underline"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Copied" : "Copy Fingerprint"}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-200 break-all select-all">
                  {doc.sha256}
                </p>
              </div>
            </div>
          </div>

          {/* Extracted Fields Card */}
          <div className="card p-6 space-y-4 shadow-soft">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-display font-bold text-base text-navy-900">Extracted Document Data</h2>
              <p className="text-xs text-slate-500">Key values automatically recognized from the document</p>
            </div>

            {doc.fields.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No custom fields extracted.</p>
            ) : (
              <div className="space-y-3">
                {doc.fields.map((f) => (
                  <div key={f.field_name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 capitalize">
                        {f.field_name.replaceAll("_", " ")}
                      </span>
                      {f.confidence != null && (
                        <span className="text-[10px] text-teal-700 font-mono">
                          {Math.round(f.confidence * 100)}% match
                        </span>
                      )}
                    </div>
                    <p className="font-display font-bold text-sm text-navy-900">
                      {f.corrected_value || f.extracted_value || "—"}
                    </p>
                    {f.corrected_value && f.extracted_value && f.corrected_value !== f.extracted_value && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Scanned original: <span className="font-mono">{f.extracted_value}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Temporary Sharing & Text Preview */}
        <div className="space-y-6">
          {/* Temporary Sharing Form */}
          <form onSubmit={onShare} className="card p-6 space-y-4 shadow-soft border-teal-100">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-600" />
                <h2 className="font-display font-bold text-base text-navy-900">Share Document Securely</h2>
              </div>
              <p className="text-xs text-slate-500">
                Grant time-limited access to a family member, guest, or advisor. An access record is kept.
              </p>
            </div>

            {shareMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shareMessage}</span>
              </div>
            )}

            {shareError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {shareError}
              </div>
            )}

            <div>
              <label className="label" htmlFor="recipientEmail">Recipient Email Address *</label>
              <input
                id="recipientEmail"
                type="email"
                autoComplete="off"
                className="input text-xs"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="sharePerm">Permission Scope</label>
                <select
                  id="sharePerm"
                  className="input text-xs cursor-pointer"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                >
                  <option value="view">View Only (No Download)</option>
                  <option value="download">View & Download</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="shareExpires">Expires At (Optional)</label>
                <input
                  id="shareExpires"
                  type="datetime-local"
                  className="input text-xs"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sharingBusy || !shareEmail}
              className="btn-primary w-full text-xs justify-center"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{sharingBusy ? "Saving & Granting Access…" : "Grant Temporary Access"}</span>
            </button>
          </form>

          {/* Raw Text Box */}
          <div className="card p-6 space-y-3 shadow-soft">
            <h2 className="font-display font-bold text-base text-navy-900">Scanned Text Content</h2>
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-y-auto max-h-[300px] leading-relaxed shadow-inner">
              {doc.ocr_text ? (
                <pre className="whitespace-pre-wrap">{doc.ocr_text}</pre>
              ) : (
                <p className="text-slate-500 italic">No text extracted.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
