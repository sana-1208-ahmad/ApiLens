import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon: SecondaryActionIcon,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center mx-auto ${
        compact ? 'py-8 px-4 max-w-sm' : 'py-14 px-6 max-w-lg'
      } ${className}`}
    >
      {Icon && (
        <div
          className={`rounded-2xl bg-surface-container-low flex items-center justify-center text-secondary mb-4 shadow-sm border border-[#DCE5FF]/50 ${
            compact ? 'w-12 h-12' : 'w-16 h-16'
          }`}
        >
          <Icon className={compact ? 'w-6 h-6 text-primary-container' : 'w-8 h-8 text-primary-container'} />
        </div>
      )}

      {title && (
        <h3 className="font-semibold text-navy-text text-base md:text-lg tracking-tight mb-1.5">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-secondary text-sm leading-relaxed mb-6 max-w-md">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && (
            <Button
              variant="primary"
              size={compact ? 'sm' : 'md'}
              icon={ActionIcon}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && (
            <Button
              variant="secondary"
              size={compact ? 'sm' : 'md'}
              icon={SecondaryActionIcon}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
