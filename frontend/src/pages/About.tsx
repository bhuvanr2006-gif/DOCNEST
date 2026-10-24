import {
  ShieldCheck,
  Lock,
  FileCheck2,
  Cpu,
  Database,
  Layers,
  Key,
  CheckCircle2,
  Server,
  Code,
  Shield,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="About DocNest"
        subtitle="System architecture, cryptographic security specifications, and project information"
      />

      {/* Hero Overview Card */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white shadow-elevated border-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <span className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  DocNest
                  <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/30">
                    v1.0 Production Ready
                  </span>
                </span>
                <p className="text-xs text-slate-400">Encrypted Household Vault & Document Management System</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed pt-1">
              DocNest is an authentic, secure family records vault engineered for private document ingestion, automated text capture, asset tracking, and role-based sharing. It is built to provide complete privacy without exposing sensitive personal records to third-party cloud data harvesters.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs space-y-2 shrink-0 backdrop-blur-sm">
            <div className="flex justify-between gap-6 text-slate-300">
              <span className="text-slate-400">Architecture:</span>
              <span className="font-semibold text-white">Zero-Knowledge Local Vault</span>
            </div>
            <div className="flex justify-between gap-6 text-slate-300">
              <span className="text-slate-400">Primary Encryption:</span>
              <span className="font-semibold text-teal-400">AES-256-GCM</span>
            </div>
            <div className="flex justify-between gap-6 text-slate-300">
              <span className="text-slate-400">Integrity Protocol:</span>
              <span className="font-semibold text-teal-400">SHA-256 Digest Registry</span>
            </div>
            <div className="flex justify-between gap-6 text-slate-300">
              <span className="text-slate-400">Data Governance:</span>
              <span className="font-semibold text-emerald-400">DPDP Act (2023) Aligned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Security & Cryptographic Specifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-teal-600" />
          <h2 className="font-display font-bold text-lg text-navy-900">Cryptographic Security Specifications</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5 space-y-2.5 bg-white shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-navy-900">Envelope Encryption (AES-256)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every document is encrypted with a unique, randomly generated 256-bit AES-GCM data encryption key (DEK). The DEK is then wrapped using the master key and stored isolated from ciphertext.
            </p>
          </div>

          <div className="card p-5 space-y-2.5 bg-white shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-navy-900">SHA-256 Integrity Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Before encryption, an immutable SHA-256 cryptographic digest is computed. When opened or tested, the raw bytes are re-hashed to detect any tampering or disk corruption.
            </p>
          </div>

          <div className="card p-5 space-y-2.5 bg-white shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-navy-900">Isolated Local Storage</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ciphertext files are stored in a dedicated local directory that is never exposed as static web assets. Decryption only happens in-memory upon authorized owner authentication.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Document Processing Engine */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-teal-600" />
          <h2 className="font-display font-bold text-lg text-navy-900">Document Processing & Extraction Engine</h2>
        </div>

        <div className="card p-6 bg-white shadow-soft space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                OCR Engine & Image Preprocessing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by the <strong>Tesseract OCR</strong> engine coupled with <strong>OpenCV</strong> image processing pipelines. Scanned photos undergo grayscale conversion, adaptive thresholding, and noise reduction to extract identity numbers, dates, and policy codes.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                PDF Vector Parser
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Incorporates <strong>PyMuPDF (Fitz)</strong> for native digital PDF parsing. Embedded textual layers are extracted with exact character positioning, ensuring high confidence field capture.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Data Protection & Privacy Framework */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h2 className="font-display font-bold text-lg text-navy-900">Data Protection Framework (DPDP Alignment)</h2>
        </div>

        <div className="card p-6 bg-white shadow-soft space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            DocNest implements principles derived from the Digital Personal Data Protection (DPDP) Act, 2023 to ensure secure handling of personal records:
          </p>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-navy-900">Purpose-Limited Sharing</span>
              <p className="text-slate-500">
                Documents shared with third parties (like tax advisors or bank verifiers) require a specified purpose and an automatic expiration timestamp.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-navy-900">Immutable Consent Logging</span>
              <p className="text-slate-500">
                Every authorization event generates an indelible consent record detailing grantor, recipient, permission scope, and exact timestamps.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-navy-900">Role-Based Access Control (RBAC)</span>
              <p className="text-slate-500">
                Strict separation between Vault Owners, Adult Members, Dependents (read-only), and Guests (isolated document view).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="font-bold text-navy-900">Right to Erasure & Key Destruction</span>
              <p className="text-slate-500">
                Deleting a document cryptographically destroys its wrapped data key and permanently unlinks ciphertext on the local file system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Technology Stack & Technical Specifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-teal-600" />
          <h2 className="font-display font-bold text-lg text-navy-900">Technology Stack & System Details</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card p-5 space-y-3 bg-white shadow-soft text-xs">
            <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              Backend Infrastructure
            </h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Framework:</span>
                <span className="font-semibold text-navy-900">FastAPI (Python 3.11+)</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">ORM & Database:</span>
                <span className="font-semibold text-navy-900">SQLAlchemy, Alembic, SQLite</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Security Suite:</span>
                <span className="font-semibold text-navy-900">Cryptography (Fernet/AES-GCM), Passlib (Bcrypt)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">OCR & Document Engine:</span>
                <span className="font-semibold text-navy-900">Pytesseract, OpenCV, PyMuPDF</span>
              </li>
            </ul>
          </div>

          <div className="card p-5 space-y-3 bg-white shadow-soft text-xs">
            <h3 className="font-bold text-sm text-navy-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Frontend Client
            </h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Framework:</span>
                <span className="font-semibold text-navy-900">React 18 & TypeScript</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Build Tool & Bundler:</span>
                <span className="font-semibold text-navy-900">Vite 6</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Styling & Design System:</span>
                <span className="font-semibold text-navy-900">TailwindCSS, Lucide Icons</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-400">Analytics & Charts:</span>
                <span className="font-semibold text-navy-900">Recharts Data Visualization</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
