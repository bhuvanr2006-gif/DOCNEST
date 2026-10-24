import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  ExternalLink,
  CheckCheck,
} from "lucide-react";
import {
  api,
  Reminder,
  NotificationItem,
  formatDate,
  localTime,
} from "../api";
import { useAuth } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";

export default function Reminders() {
  const { household } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "urgent" | "active">("all");

  useEffect(() => {
    if (!household) return;
    setLoading(true);

    Promise.all([
      api.get("/reminders", { params: { household_id: household.id } }),
      api.get("/notifications"),
    ])
      .then(([remRes, notifRes]) => {
        setReminders(remRes.data || []);
        setNotifications(notifRes.data || []);
      })
      .catch((err) => {
        console.error("Reminders API error:", err);
      })
      .finally(() => setLoading(false));
  }, [household]);

  // Calculate days difference
  const getDaysDiff = (targetDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const urgentCount = reminders.filter((r) => getDaysDiff(r.target_date) <= 30 && getDaysDiff(r.target_date) >= 0).length;
  const expiredCount = reminders.filter((r) => getDaysDiff(r.target_date) < 0).length;
  const validCount = reminders.filter((r) => getDaysDiff(r.target_date) > 30).length;

  const filteredReminders = reminders.filter((r) => {
    const days = getDaysDiff(r.target_date);
    if (filterTab === "urgent") return days <= 30;
    if (filterTab === "active") return days > 30;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Expiry Tracker & Reminders"
        subtitle="Automatic monitoring of policy expirations, warranty deadlines, and document renewals"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/upload" className="btn-primary !text-xs !py-2">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Add Document Expiry</span>
            </Link>
          </div>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Expired Items"
          value={expiredCount}
          subtitle="Requires immediate renewal"
          icon={AlertTriangle}
          iconColor="rose"
          trend={expiredCount > 0 ? { label: "Action required", positive: false } : { label: "Zero overdue", positive: true }}
        />

        <MetricCard
          title="Expiring Within 30 Days"
          value={urgentCount}
          subtitle="Prepare documentation"
          icon={Clock}
          iconColor="amber"
          trend={urgentCount > 0 ? { label: "Upcoming", positive: false } : undefined}
        />

        <MetricCard
          title="Valid & Current"
          value={validCount}
          subtitle="Long-term active records"
          icon={CheckCircle2}
          iconColor="emerald"
          trend={{ label: "Monitored", positive: true }}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Reminders & Timeline (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-display font-bold text-base text-navy-900">Scheduled Expiry Windows</h2>
                <p className="text-xs text-slate-500">Track deadlines before service interruption or penalties</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filterTab === "all" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900"
                  }`}
                >
                  All ({reminders.length})
                </button>
                <button
                  onClick={() => setFilterTab("urgent")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filterTab === "urgent" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-navy-900"
                  }`}
                >
                  Urgent ({urgentCount + expiredCount})
                </button>
                <button
                  onClick={() => setFilterTab("active")}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    filterTab === "active" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-navy-900"
                  }`}
                >
                  Healthy ({validCount})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredReminders.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No active reminders"
                description="Documents with expiration dates (like insurance, passports, vehicle registration) automatically appear here."
                action={{
                  label: "Upload document with expiry",
                  href: "/upload",
                  icon: CalendarClock,
                }}
              />
            ) : (
              <div className="space-y-3 pt-4">
                {filteredReminders.map((r) => {
                  const days = getDaysDiff(r.target_date);
                  const isExpired = days < 0;
                  const isUrgent = days >= 0 && days <= 30;

                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl border p-4 transition-all duration-150 ${
                        isExpired
                          ? "border-rose-200 bg-rose-50/40"
                          : isUrgent
                          ? "border-amber-200 bg-amber-50/40"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isExpired ? "bg-rose-500" : isUrgent ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            <h3 className="font-display font-bold text-sm text-navy-900">{r.title}</h3>
                          </div>
                          <p className="text-xs text-slate-500">
                            Target Deadline: <span className="font-semibold text-slate-700">{formatDate(r.target_date)}</span> · Advance alert window: {r.window_days} days
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isExpired ? (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-200">
                              Expired {Math.abs(days)} day{Math.abs(days) > 1 ? "s" : ""} ago
                            </span>
                          ) : isUrgent ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                              Expires in {days} day{days > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                              Valid · {days} days left
                            </span>
                          )}

                          {r.document_id && (
                            <Link
                              to={`/documents/${r.document_id}`}
                              className="btn-ghost !p-2"
                              title="View Document"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-500" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: In-App Notifications History */}
        <div className="space-y-4">
          <div className="card p-5 shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <h2 className="font-display font-bold text-base text-navy-900">Notification Feed</h2>
              </div>
              <span className="text-xs text-slate-400">
                {notifications.length} alerts
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent in-app notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl border p-3.5 text-xs transition ${
                      !n.is_read
                        ? "border-teal-200 bg-teal-50/40"
                        : "border-slate-100 bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-navy-900">{n.title}</p>
                      {!n.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-2">{n.body}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{localTime(n.created_at)}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
