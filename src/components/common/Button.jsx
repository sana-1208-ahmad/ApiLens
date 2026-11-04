import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  title,
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    xs: "px-2.5 py-1 text-xs rounded-md",
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-base rounded-xl",
  };

  const variantStyles = {
    primary: "bg-primary-container text-white hover:bg-primary active:scale-[0.98] shadow-sm",
    secondary: "bg-white border border-[#DCE5FF] text-navy-text hover:bg-surface-container-low hover:border-[#BAC9F5] shadow-sm",
    outline: "bg-transparent border border-[#DCE5FF] text-secondary hover:bg-surface-container-low hover:text-navy-text",
    ghost: "bg-transparent text-secondary hover:bg-surface-container-low hover:text-navy-text",
    danger: "bg-error text-white hover:bg-red-700 shadow-sm",
    lavender: "bg-lavender text-primary-container hover:bg-[#DCE5FF] font-semibold",
    subtle: "bg-surface-container text-secondary hover:text-navy-text hover:bg-surface-container-high",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      title={title}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}
