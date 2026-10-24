import { FormEvent, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Image as ImageIcon,
  Calendar,
  Lock,
} from "lucide-react";
import { api, Document, Field, formatBytes } from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

export default function Upload() {
  const { household } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doc, setDoc] = useState<Document | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("other");
  const [expiry, setExpiry] = useState("");
  const [issue, setIssue] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!household || !file) return;
    setBusy(true);
    setError("");

    const data = new FormData();
    data.append("household_id", household.id);
    data.append("title", title || file.name.replace(/\.[^/.]+$/, ""));
    data.append("file", file);

    try {
      const res = await api.post("/documents/upload", data);
      const uploaded: Document = res.data;
      setDoc(uploaded);
      setCategory(uploaded.category);
      setIssue(uploaded.issue_date || "");
      setExpiry(uploaded.expiry_date || "");

      const next: Record<string, string> = {};
      uploaded.fields.forEach((f: Field) => {
        next[f.field_name] = f.corrected_value || f.extracted_value || "";
      });
      setFields(next);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(message || "Upload and OCR processing failed. Check file format and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveReview() {
    if (!doc) return;
    setSavingReview(true);
    try {
      await api.patch(`/documents/${doc.id}`, {
        category,
        issue_date: issue || null,
        expiry_date: expiry || null,
        fields: Object.entries(fields).map(([field_name, corrected_value]) => ({
          field_name,
          corrected_value,
        })),
      });
      navigate(`/documents/${doc.id}`);
    } catch (err) {
      console.error("Save review error:", err);
      setError("Failed to save corrections.");
    } finally {
      setSavingReview(false);
    }
  }

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const copyOCR = () => {
    if (!doc?.ocr_text) return;
    navigator.clipboard.writeText(doc.ocr_text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Upload Document"
        subtitle="Securely upload household documents with automatic text extraction and private encrypted storage"
        isLive={true}
      />

      {/* Upload Workflow Progress Steps */}
      <div className="grid grid-cols-3 gap-2 pb-2">
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          !doc ? "border-teal-400 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-400"
        }`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white text-[10px]">1</span>
          <span>Upload & Ingest</span>
        </div>

        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          busy ? "border-amber-400 bg-amber-50 text-amber-900 animate-pulse" : doc ? "border-teal-400 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-400"
        }`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px]">2</span>
          <span>Scan & Process</span>
        </div>

        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          doc ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-400"
        }`}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-slate-700 text-[10px]">3</span>
          <span>Review & Save</span>
        </div>
      </div>

      {/* Step 1: Upload Form */}
      {!doc && (
        <div className="space-y-4">
          <form onSubmit={onSubmit} className="card p-6 md:p-8 space-y-6 shadow-soft">
            <div>
              <label className="label" htmlFor="docTitle">Document Title (Optional)</label>
              <input
                id="docTitle"
                type="text"
                autoComplete="off"
                className="input text-xs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-slate-400">If left blank, the file name will be used.</p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-teal-500 bg-teal-50/60 scale-[1.01]"
                  : file
                  ? "border-teal-400 bg-teal-50/20"
                  : "border-slate-200 hover:border-teal-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  setFile(picked);
                  if (picked && !title) setTitle(picked.name.replace(/\.[^/.]+$/, ""));
                }}
              />

              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 shadow-sm mb-3">
                  <UploadCloud className="h-7 w-7" />
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="font-display font-bold text-sm text-navy-900">{file.name}</p>
                    <p className="text-xs text-teal-700 font-semibold">{formatBytes(file.size)}</p>
                    <p className="text-[11px] text-slate-400">Click or drag another file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-display font-bold text-sm text-navy-900">
                      Drop your document file here, or <span className="text-teal-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500">Supports PDF documents and JPG / PNG / WebP images</p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Encrypted ingestion: Maximum upload size is 10 MB per file.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Ingestion Security Notice */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-navy-900">Encrypted Storage Protection:</p>
                <p className="text-[11px] text-slate-500">
                  Documents are automatically encrypted before being saved. Only authorized members of your household can view or download them.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy || !file}
                className="btn-primary text-xs !py-3 !px-6"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Document…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span>Upload & Continue to Review</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2 & 3: Review & Correction */}
      {doc && (
        <div className="space-y-6">
          {/* Status Header */}
          <div className="card p-5 bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="font-display font-bold text-base text-navy-900">
                  Document Processed & Securely Saved!
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Review the automatically recognized fields below. You can make any corrections before finalizing.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge type="ocr" value={doc.ocr_status} />
              {doc.quality_score != null && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-sm">
                  Quality: {doc.quality_score}%
                </span>
              )}
            </div>
          </div>

          {doc.duplicate_of && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>A document with the exact same file content already exists in this household vault.</span>
            </div>
          )}

          {doc.quality_notes && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
              <p className="font-semibold text-navy-900 mb-0.5">Quality Assessment Notes:</p>
              <p>{doc.quality_notes}</p>
            </div>
          )}

          {/* Two-Column Review Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Editable Metadata & Extracted Fields */}
            <div className="card p-6 space-y-4 shadow-soft">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-display font-bold text-base text-navy-900">Document Information & Corrections</h3>
                <p className="text-xs text-slate-500">Verify or edit the recognized details below</p>
              </div>

              <div>
                <label className="label">Assigned Category</label>
                <select
                  className="input text-xs cursor-pointer capitalize"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["identity", "pan", "education", "medical", "insurance", "property", "financial", "other"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Issue Date</label>
                  <input
                    type="date"
                    className="input text-xs"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input
                    type="date"
                    className="input text-xs"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Extracted Fields */}
              <div className="pt-2 border-t border-slate-100 space-y-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Extracted Document Fields ({doc.fields.length})
                </p>

                {doc.fields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No structured fields recognized automatically. You can review the raw OCR text on the right.</p>
                ) : (
                  doc.fields.map((field) => (
                    <div key={field.field_name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-700 capitalize">
                          {field.field_name.replaceAll("_", " ")}
                        </label>
                        {field.confidence != null && (
                          <span className="text-[11px] font-mono text-teal-700">
                            Confidence: {Math.round(field.confidence * 100)}%
                          </span>
                        )}
                      </div>

                      <input
                        className="input text-xs font-medium"
                        value={fields[field.field_name] || ""}
                        onChange={(e) =>
                          setFields({ ...fields, [field.field_name]: e.target.value })
                        }
                      />

                      {field.extracted_value && (
                        <p className="text-[11px] text-slate-400">
                          Raw OCR output: <span className="font-mono">{field.extracted_value}</span>
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={saveReview}
                  disabled={savingReview}
                  className="btn-primary w-full text-xs justify-center !py-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>{savingReview ? "Saving to Vault…" : "Confirm and Save to Vault"}</span>
                </button>
              </div>
            </div>

            {/* Right: Raw OCR Text & Verification Details */}
            <div className="card p-6 space-y-4 shadow-soft">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-navy-900">Raw OCR Extracted Text</h3>
                  <p className="text-xs text-slate-500">Unprocessed optical character recognition transcription</p>
                </div>
                <button
                  onClick={copyOCR}
                  className="btn-secondary !text-xs !py-1 !px-2.5"
                  title="Copy OCR Text"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-y-auto max-h-[460px] leading-relaxed shadow-inner">
                {doc.ocr_text ? (
                  <pre className="whitespace-pre-wrap">{doc.ocr_text}</pre>
                ) : (
                  <p className="text-slate-500 italic">No text recognized for this image. You can type in details manually on the left.</p>
                )}
              </div>

              {/* Digital Fingerprint Tag */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-navy-900">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Digital Fingerprint:</span>
                </div>
                <p className="font-mono text-[11px] text-slate-600 break-all select-all">
                  {doc.sha256}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
