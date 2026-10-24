import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Image as ImageIcon, Calendar, ShieldCheck, ArrowRight, Copy, Check } from "lucide-react";
import { Document, formatBytes, formatDate } from "../api";
import { StatusBadge } from "./StatusBadge";

interface DocumentCardProps {
  doc: Document;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ doc }) => {
  const [copied, setCopied] = useState(false);
  const isImage = doc.mime_type?.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(doc.file_name);

  const copyHash = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(doc.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-interactive p-5 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <StatusBadge type="category" value={doc.category} />
          {doc.expiry_status && doc.expiry_status !== "none" && (
            <StatusBadge type="expiry" value={doc.expiry_status} />
          )}
        </div>

        <div className="flex items-start gap-3 mt-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-navy-800 border border-slate-200/80 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 transition-colors">
            {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/documents/${doc.id}`}
              className="font-display font-bold text-navy-900 group-hover:text-teal-700 transition line-clamp-1 block text-base"
              title={doc.title}
            >
              {doc.title}
            </Link>
            <p className="text-xs text-slate-500 truncate mt-0.5" title={doc.file_name}>
              {doc.file_name} · {formatBytes(doc.file_size)}
            </p>
          </div>
        </div>

        {/* Extracted fields snippet */}
        {doc.fields && doc.fields.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1">
            {doc.fields.slice(0, 2).map((f) => (
              <div key={f.field_name} className="flex justify-between items-center text-xs">
                <span className="text-slate-400 capitalize">{f.field_name.replaceAll("_", " ")}:</span>
                <span className="font-medium text-slate-700 truncate max-w-[140px]">
                  {f.corrected_value || f.extracted_value || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5" title={doc.expiry_date ? `Expires: ${doc.expiry_date}` : "No expiry date"}>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{doc.expiry_date ? formatDate(doc.expiry_date) : "No expiry"}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={copyHash}
            title={`SHA-256: ${doc.sha256} (click to copy)`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{doc.sha256 ? doc.sha256.substring(0, 6) : "hash"}</span>
          </button>

          <Link
            to={`/documents/${doc.id}`}
            className="p-1 rounded-lg text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition"
            title="View Details"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
