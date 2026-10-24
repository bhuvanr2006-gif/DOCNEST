import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Upload from "./pages/Upload";
import DocumentDetail from "./pages/DocumentDetail";
import Assets from "./pages/Assets";
import Reminders from "./pages/Reminders";
import Members from "./pages/Members";
import Sharing from "./pages/Sharing";
import Consent from "./pages/Consent";
import Audit from "./pages/Audit";
import Settings from "./pages/Settings";
import About from "./pages/About";

function Guard({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/members" element={<Members />} />
        <Route path="/sharing" element={<Sharing />} />
        <Route path="/consent" element={<Consent />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}
