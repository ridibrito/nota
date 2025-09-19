import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'issued' | 'failed' | 'canceled' | 'default';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={clsx(
        'badge',
        {
          'badge-pending': variant === 'pending',
          'badge-issued': variant === 'issued',
          'badge-failed': variant === 'failed',
          'badge-canceled': variant === 'canceled',
          'bg-gray-100 text-gray-800': variant === 'default',
        },
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';

// Utilitário para converter status em variant
export function getStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'issued':
      return 'issued';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'canceled';
    default:
      return 'default';
  }
}

// Utilitário para converter status em texto legível
export function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'issued':
      return 'Emitida';
    case 'failed':
      return 'Falhou';
    case 'canceled':
      return 'Cancelada';
    default:
      return status;
  }
}
