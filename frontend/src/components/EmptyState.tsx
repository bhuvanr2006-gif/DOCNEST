import React, { ReactNode } from "react";
import { LucideIcon, FileQuestion } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: LucideIcon;
  };
  children?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  children,
  className = "",
}) => {
  return (
    <div className={`card flex flex-col items-center justify-center p-8 sm:p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50/60 ${className}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 shadow-sm mb-4">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-md">{description}</p>

      {action && (
        <div className="mt-5">
          {action.href ? (
            <a href={action.href} className="btn-primary">
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </a>
          ) : (
            <button onClick={action.onClick} className="btn-primary">
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </button>
          )}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
