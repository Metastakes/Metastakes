import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-success-100 text-success-800': variant === 'success',
          'bg-warning-100 text-warning-800': variant === 'warning',
          'bg-error-100 text-error-800': variant === 'error',
          'bg-primary-100 text-primary-800': variant === 'info',
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
