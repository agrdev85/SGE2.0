import { cn } from '@/lib/utils';
import { AbstractStatus } from '@/lib/mockApi';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AbstractStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<AbstractStatus, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  'EN_PROCESO': {
    label: 'En Proceso',
    icon: Clock,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  'APROBADO': {
    label: 'Aprobado',
    icon: CheckCircle,
    className: 'bg-accent/10 text-accent border-accent/20',
  },
  'APROBADO_CON_CAMBIOS': {
    label: 'Aprobado con Cambios',
    icon: AlertCircle,
    className: 'bg-info/10 text-info border-info/20',
  },
  'RECHAZADO': {
    label: 'Rechazado',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      config.className,
      size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <Icon className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />
      {config.label}
    </span>
  );
}
