import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled,
  icon: Icon,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 shadow-sm hover:shadow shadow-primary/20',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary/50 shadow-sm hover:shadow shadow-secondary/20',
    outline: 'border-2 border-primary text-primary hover:bg-primary/5 focus:ring-primary/50',
    ghost: 'text-text-secondary hover:bg-surface-hover hover:text-text-primary focus:ring-border',
    danger: 'bg-danger text-white hover:bg-[#c92a2a] focus:ring-danger/50 shadow-sm hover:shadow',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${isDisabled ? 'opacity-60 cursor-not-allowed active:scale-100' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span className="font-bangla">{children}</span>
    </button>
  );
}
