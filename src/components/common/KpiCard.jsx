import React from 'react';

export default function KpiCard({
  title,
  value = '--',
  subtitle = 'Awaiting HAR data',
  icon: Icon,
  variant = 'default',
  trend,
  className = '',
}) {
  const iconColors = {
    default: 'bg-secondary-fixed/50 text-primary-container',
    warning: 'bg-surface-container text-secondary',
    error: 'bg-error-container text-error',
    success: 'bg-[#DEF7EC] text-success',
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-[#DCE5FF] shadow-subtle hover:shadow-subtle-hover transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-secondary uppercase tracking-wider font-semibold">
          {title}
        </span>
        {Icon && (
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              iconColors[variant] || iconColors.default
            }`}
          >
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>

      <div className="my-3">
        <div className="font-mono text-3xl font-bold text-outline leading-none">
          {value}
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-xs text-secondary">
        <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0"></span>
        <span className="truncate">{subtitle}</span>
      </div>
    </div>
  );
}
