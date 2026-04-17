import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  icon: Icon,
  ...props 
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-100',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-green-100',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className={clsx('w-4 h-4', children && 'mr-2')} />}
      {children}
    </button>
  );
}
