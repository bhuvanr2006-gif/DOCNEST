import React, { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  isLive?: boolean;
  actions?: ReactNode;
  badge?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  isLive,
  actions,
  badge,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/80 mb-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-navy-900">{title}</h1>
          {badge}
          {isLive !== undefined && (
            <StatusBadge type="source" value={isLive ? "live" : "demo"} />
          )}
        </div>
        {subtitle && <p className="text-sm text-slate-500 max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
};
