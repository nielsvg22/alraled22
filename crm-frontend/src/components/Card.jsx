import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className }) {
  return (
    <div className={twMerge('bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={twMerge('p-6', className)}>
      {children}
    </div>
  );
}
