import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: "teal" | "navy" | "amber" | "rose" | "indigo" | "emerald";
  trend?: {
    label: string;
    positive?: boolean;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

const colorMap = {
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-100",
    ring: "group-hover:border-teal-300",
  },
  navy: {
    bg: "bg-navy-100/60",
    text: "text-navy-900",
    border: "border-slate-200",
    ring: "group-hover:border-navy-400",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    ring: "group-hover:border-amber-300",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-100",
    ring: "group-hover:border-rose-300",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
    ring: "group-hover:border-indigo-300",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    ring: "group-hover:border-emerald-300",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "teal",
  trend,
  action,
  children,
  className = "",
}) => {
  const scheme = colorMap[iconColor] || colorMap.teal;

  return (
    <div className={`card group p-5 hover:border-slate-300 hover:shadow-card transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-navy-900">{value}</span>
            {trend && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {trend.label}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 pt-0.5">{subtitle}</p>}
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${scheme.bg} ${scheme.text} ${scheme.border} transition-transform duration-200 group-hover:scale-110 shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {children && <div className="mt-3 pt-3 border-t border-slate-100">{children}</div>}

      {action && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={action.onClick}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition"
          >
            {action.label} &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
