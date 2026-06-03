import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    paid: 'badge-paid',
    pending: 'badge-pending',
    overdue: 'badge-overdue',
    active: 'bg-secondary/10 text-secondary border border-secondary/20',
    closed: 'bg-text-muted/10 text-text-secondary border border-border',
    default: 'bg-surface-hover text-text-primary border border-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-bangla ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
}
