import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE_URL
  ? `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/api`
  : "/api";

export const api = axios.create({
  baseURL: apiBase,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("docnest_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  timezone: string;
};

export type Household = {
  id: string;
  name: string;
  owner_id: string;
  role?: string;
};

export type Field = {
  id?: string;
  field_name: string;
  extracted_value?: string | null;
  corrected_value?: string | null;
  confidence?: number | null;
  source: string;
};

export type Document = {
  id: string;
  household_id: string;
  owner_user_id: string;
  title: string;
  category: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  ocr_status: string;
  ocr_confidence?: number | null;
  quality_score?: number | null;
  quality_notes?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  archived: boolean;
  integrity_mode: string;
  created_at: string;
  updated_at: string;
  expiry_status?: string | null;
  duplicate_of?: string | null;
  fields: Field[];
  ocr_text?: string | null;
};

export type Asset = {
  id: string;
  name: string;
  asset_type: string;
  description?: string | null;
  purchase_date?: string | null;
  value_amount?: number | null;
  warranty_date?: string | null;
  notes?: string | null;
  document_ids: string[];
};

export type Grant = {
  id: string;
  document_id: string;
  permission: string;
  starts_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  document_title?: string | null;
  grantee_email?: string | null;
};

export type Audit = {
  id: string;
  household_id?: string | null;
  actor_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  created_at: string;
};

export type Dashboard = {
  total_documents: number;
  by_category: Record<string, number>;
  recent_documents: Document[];
  upcoming_expirations: Document[];
  expired_documents: Document[];
  assets_count: number;
  recent_shares: Grant[];
  recent_audit: Audit[];
};

export type Reminder = {
  id: string;
  title: string;
  window_days: number;
  target_date: string;
  status: string;
  document_id?: string | null;
  asset_id?: string | null;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type Member = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: "owner" | "adult" | "dependent" | "guest" | string;
  status: string;
  created_at: string;
};

export type ConsentItem = {
  id: string;
  household_id: string;
  document_id?: string | null;
  grantor_id: string;
  grantee_id: string;
  scope: string;
  permission: string;
  starts_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
};

export type SecurityStatus = {
  encryption_algorithm: string;
  sha256_verification_enabled: boolean;
  integrity_mode: string;
  blockchain_enabled: boolean;
  active_key_count: number;
  tamper_detection_active: boolean;
};

export function localTime(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso.endsWith("Z") ? iso : `${iso}Z`).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Not set";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatINR(val?: number | null) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}



