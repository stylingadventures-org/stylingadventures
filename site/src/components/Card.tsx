/**
 * Reusable UI Components - Card
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hoverable, onClick }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800 rounded-xl shadow-md
        transition-all duration-200
        ${hoverable ? 'hover:shadow-lg hover:scale-105 cursor-pointer' : ''}
        ${className || ''}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  color?: 'purple' | 'pink' | 'blue' | 'emerald' | 'amber' | 'red';
}

const colorClasses: Record<string, string> = {
  purple: 'bg-purple-50 dark:bg-purple-900',
  pink: 'bg-pink-50 dark:bg-pink-900',
  blue: 'bg-blue-50 dark:bg-blue-900',
  emerald: 'bg-emerald-50 dark:bg-emerald-900',
  amber: 'bg-amber-50 dark:bg-amber-900',
  red: 'bg-red-50 dark:bg-red-900',
};

export function StatCard({ label, value, icon, trend, color = 'purple' }: StatCardProps) {
  return (
    <Card className={`p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </Card>
  );
}
