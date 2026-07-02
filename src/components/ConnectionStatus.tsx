'use client';

import { motion } from 'framer-motion';
import type { ConnectionStatus as ConnectionStatusType } from '@/types';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

const statusConfig = {
  connected: { color: 'bg-emerald-400', label: 'Connected', shadow: 'shadow-emerald-400/50' },
  connecting: { color: 'bg-amber-400', label: 'Connecting', shadow: 'shadow-amber-400/50' },
  disconnected: { color: 'bg-zinc-500', label: 'Offline', shadow: '' },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-4 h-4">
        {status === 'connecting' && (
          <motion.div
            className={`absolute w-3 h-3 rounded-full ${config.color} opacity-40`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {status === 'connected' && (
          <motion.div
            className={`absolute w-3 h-3 rounded-full ${config.color} opacity-20`}
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          className={`relative w-2 h-2 rounded-full ${config.color} shadow-sm ${config.shadow}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      </div>
      <span className="text-xs font-medium text-text-secondary">{config.label}</span>
    </div>
  );
}
