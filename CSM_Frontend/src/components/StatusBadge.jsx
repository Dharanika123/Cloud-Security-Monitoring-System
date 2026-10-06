import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (str) => {
    if (!str) return 'badge-neutral';
    const s = str.toUpperCase();

    // Success / Healthy Statuses (Green)
    if (['HEALTHY', 'LOW', 'RESOLVED', 'READY', 'PATCHED', 'APPROVED'].includes(s)) {
      return 'badge-healthy';
    }

    // Info / Blue Statuses
    if (['ASSIGNED', 'CREATE_ASSET'].includes(s)) {
      return 'badge-blue';
    }

    // Warning / Pending Statuses (Yellow/Orange)
    if (['WARNING', 'MEDIUM', 'TESTING', 'PENDING', 'INVESTIGATION'].includes(s)) {
      return 'badge-warning';
    }

    // Critical / Failed / Rejected Statuses (Red)
    if (['CRITICAL', 'HIGH', 'OPEN', 'FAILED', 'REJECTED'].includes(s)) {
      return 'badge-critical';
    }

    if(['OFFLINE', 'DISCONNECTED'].includes(s)) {
      return 'badge-disconnected';
    }

    // Other Specific Types
    if (s === 'PASSWORD_CHANGE') return 'badge-purple';
    if (s === 'GENERIC_ACTION') return 'badge-teal';
    if (s === 'MESSAGE') return 'badge-pink';

    return 'badge-neutral';
  };

  const formattedText = status ? status.replace(/_/g, ' ') : 'N/A';

  return <span className={`badge ${getBadgeClass(status)}`}>{formattedText}</span>;
};