import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  wrapperClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary font-bangla">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary
            transition-all duration-200
            placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            disabled:bg-surface-alt disabled:text-text-muted disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger font-bangla mt-0.5 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
