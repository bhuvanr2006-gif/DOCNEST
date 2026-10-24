import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Image as ImageIcon, ShieldCheck, Copy, Check, ExternalLink } from "lucide-react";
import { Document, formatBytes, formatDate } from "../api";
import { StatusBadge } from "./StatusBadge";

interface DocumentRowProps {
  doc: Document;
}

export const DocumentRow: React.FC<DocumentRowProps> = ({ doc }) => {
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
    <tr className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
      <td className="p-3.5 pl-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-navy-800 border border-slate-200">
            {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <Link
              to={`/documents/${doc.id}`}
              className="font-medium text-navy-900 hover:text-teal-700 transition block truncate max-w-xs md:max-w-sm"
              title={doc.title}
            >
              {doc.title}
            </Link>
            <p className="text-xs text-slate-400 truncate">{doc.file_name} · {formatBytes(doc.file_size)}</p>
          </div>
        </div>
      </td>

      <td className="p-3.5">
        <StatusBadge type="category" value={doc.category} />
      </td>

      <td className="p-3.5 whitespace-nowrap text-xs text-slate-600">
        <div className="flex flex-col gap-1">
          <span>{doc.expiry_date ? formatDate(doc.expiry_date) : "—"}</span>
          {doc.expiry_status && doc.expiry_status !== "none" && (
            <StatusBadge type="expiry" value={doc.expiry_status} />
          )}
        </div>
      </td>

      <td className="p-3.5 whitespace-nowrap">
        <StatusBadge type="integrity" value={doc.integrity_mode} />
      </td>

      <td className="p-3.5 whitespace-nowrap">
        <button
          onClick={copyHash}
          title={`Full SHA-256: ${doc.sha256}`}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono transition"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>{doc.sha256 ? `${doc.sha256.substring(0, 8)}…` : "—"}</span>
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
        </button>
      </td>

      <td className="p-3.5 pr-4 text-right">
        <Link
          to={`/documents/${doc.id}`}
          className="btn-ghost !px-2.5 !py-1 text-xs"
        >
          <span>Open</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  );
};
