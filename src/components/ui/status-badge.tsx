import { cn } from '@/lib/utils';
import type { JobStatus, BidStatus, ContractStatus, PaymentStatus } from '@/types/database';

type StatusType = JobStatus | BidStatus | ContractStatus | PaymentStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Job statuses
  draft: { label: 'Borrador', className: 'status-badge-pending' },
  open: { label: 'Abierto', className: 'status-badge-open' },
  assigned: { label: 'Asignado', className: 'status-badge-assigned' },
  in_progress: { label: 'En Progreso', className: 'status-badge-in-progress' },
  completed_pending_client: { label: 'Pendiente Confirmación', className: 'status-badge-in-progress' },
  completed: { label: 'Completado', className: 'status-badge-completed' },
  canceled: { label: 'Cancelado', className: 'status-badge-canceled' },
  
  // Bid statuses
  submitted: { label: 'Enviada', className: 'status-badge-open' },
  withdrawn: { label: 'Retirada', className: 'status-badge-pending' },
  accepted: { label: 'Aceptada', className: 'status-badge-completed' },
  rejected: { label: 'Rechazada', className: 'status-badge-canceled' },
  
  // Contract statuses (some overlap with job)
  active: { label: 'Activo', className: 'status-badge-open' },
  
  // Payment statuses
  unpaid: { label: 'Sin Pagar', className: 'status-badge-pending' },
  pending_verification: { label: 'Verificando', className: 'status-badge-in-progress' },
  paid_held: { label: 'Retenido', className: 'status-badge-assigned' },
  released: { label: 'Liberado', className: 'status-badge-completed' },
  refunded: { label: 'Reembolsado', className: 'status-badge-canceled' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'status-badge-pending' };
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
