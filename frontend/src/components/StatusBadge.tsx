import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Shield, Database, Sparkles, Cpu } from "lucide-react";

type BadgeType = "category" | "expiry" | "role" | "integrity" | "ocr" | "source";

interface StatusBadgeProps {
  type: BadgeType;
  value: string;
  size?: "sm" | "md";
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = "sm", className = "" }) => {
  const norm = (value || "").toLowerCase().trim();
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  if (type === "source") {
    const isLive = norm === "live";
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${
          isLive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
            : "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
        } ${className}`}
      >
        {isLive ? "Live Vault Data" : "Active Vault"}
      </span>
    );
  }

  if (type === "category") {
    const categoryStyles: Record<string, { bg: string; text: string; border: string }> = {
      identity: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      pan: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
      education: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
      medical: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
      insurance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      property: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
      financial: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
      vehicle: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
      other: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
    };

    const style = categoryStyles[norm] || categoryStyles.other;
    return (
      <span className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeClasses} ${className}`}>
        {norm}
      </span>
    );
  }

  if (type === "expiry") {
    if (norm === "expired") {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-medium ${sizeClasses} ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Expired
        </span>
      );
    }
    if (norm === "expiring_soon" || norm === "urgent") {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium ${sizeClasses} ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Expiring soon
        </span>
      );
    }
    if (norm === "valid" || norm === "active") {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Valid
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium ${sizeClasses} ${className}`}>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        No expiry
      </span>
    );
  }

  if (type === "role") {
    const roleStyles: Record<string, { bg: string; text: string; border: string }> = {
      owner: { bg: "bg-navy-900 text-white", text: "text-white", border: "border-navy-950" },
      adult: { bg: "bg-teal-50 text-teal-800", text: "text-teal-800", border: "border-teal-200" },
      dependent: { bg: "bg-blue-50 text-blue-700", text: "text-blue-700", border: "border-blue-200" },
      guest: { bg: "bg-slate-100 text-slate-600", text: "text-slate-600", border: "border-slate-200" },
    };
    const style = roleStyles[norm] || roleStyles.guest;
    return (
      <span className={`inline-flex items-center capitalize font-semibold rounded-full border px-2.5 py-0.5 text-xs ${style.bg} ${style.border} ${className}`}>
        {norm}
      </span>
    );
  }

  if (type === "integrity") {
    if (norm === "blockchain") {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-medium ${sizeClasses} ${className}`}>
          <Cpu className="w-3.5 h-3.5 text-purple-600" />
          Blockchain Digest
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-medium ${sizeClasses} ${className}`}>
        <Database className="w-3.5 h-3.5 text-teal-600" />
        SHA-256 Vault
      </span>
    );
  }

  if (type === "ocr") {
    if (norm === "complete") {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium ${sizeClasses} ${className}`}>
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          OCR Complete
        </span>
      );
    }
    if (norm === "needs_review") {
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium ${sizeClasses} ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Needs Review
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium ${sizeClasses} ${className}`}>
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        Manual Entry
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses} ${className}`}>
      {value}
    </span>
  );
};
