import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  badge,
  action,
  headerBorder = false,
  padding = true,
  hover = false,
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#DCE5FF] shadow-subtle ${
        hover ? 'hover:border-[#BAC9F5] hover:shadow-subtle-hover transition-all duration-200' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action || badge) && (
        <div
          className={`flex items-center justify-between px-5 py-4 ${
            headerBorder ? 'border-b border-[#F2F4FD]' : ''
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="font-semibold text-navy-text text-base leading-snug">
                  {title}
                </h3>
              )}
              {badge && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-secondary font-medium">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-secondary leading-normal">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  );
}
