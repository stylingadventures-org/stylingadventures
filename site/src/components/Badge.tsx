/**
 * Reusable UI Components - Badge & Tags
 */

import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-purple-100 text-purple-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${variantClasses[variant]} ${className || ''}`}>
      {children}
    </span>
  );
}

interface TagProps {
  label: string;
  onRemove?: () => void;
  color?: string;
}

export function Tag({ label, onRemove, color = 'purple' }: TagProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-${color}-100 text-${color}-800`}>
      <span className="text-sm">{label}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-${color}-600 hover:text-${color}-800 font-bold">
          ×
        </button>
      )}
    </div>
  );
}
