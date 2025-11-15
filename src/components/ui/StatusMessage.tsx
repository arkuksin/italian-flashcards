import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export type StatusType = 'success' | 'error' | 'warning' | 'info';

export interface StatusMessageProps {
  type: StatusType;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const statusConfig = {
  success: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-300 dark:border-green-800',
    text: 'text-green-900 dark:text-green-300',
    iconColor: 'text-green-600 dark:text-green-500',
    icon: CheckCircle,
    pattern: '45deg',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-300 dark:border-red-800',
    text: 'text-red-900 dark:text-red-300',
    iconColor: 'text-red-600 dark:text-red-500',
    icon: XCircle,
    pattern: '-45deg',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-300 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-300',
    iconColor: 'text-yellow-600 dark:text-yellow-500',
    icon: AlertTriangle,
    pattern: '90deg',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-300 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-500',
    icon: Info,
    pattern: '0deg',
  },
};

export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  title,
  message,
  icon,
  children,
  className = '',
}) => {
  const config = statusConfig[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`relative p-4 rounded-xl border-2 flex items-start gap-3 ${config.bg} ${config.border} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {/* Pattern background for additional visual distinction */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none rounded-xl"
        style={{
          backgroundImage: `repeating-linear-gradient(${config.pattern}, currentColor 0px, currentColor 10px, transparent 10px, transparent 20px)`,
        }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div className={`${config.iconColor} flex-shrink-0 relative z-10`} aria-hidden="true">
        {icon || <IconComponent className="w-6 h-6" />}
      </div>

      {/* Content */}
      <div className="flex-1 relative z-10">
        <p className={`font-semibold ${config.text}`}>{title}</p>
        {message && <p className={`mt-1 text-sm ${config.text}`}>{message}</p>}
        {children}
      </div>
    </div>
  );
};
