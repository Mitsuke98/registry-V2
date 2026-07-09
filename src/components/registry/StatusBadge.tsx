import React from 'react';

interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'rejected';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border select-none leading-none tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};
