'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock } from 'lucide-react';
import { TaskInput } from './TaskInput';
import type { Task } from '@/types';

interface UserWorkspaceProps {
  onSubmitTask: (content: string) => void;
  tasks: Task[];
  isDisabled?: boolean;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function UserWorkspace({ onSubmitTask, tasks, isDisabled }: UserWorkspaceProps) {
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border-default shrink-0">
        <FileText size={14} className="text-text-tertiary" />
        <h2 className="text-sm font-semibold text-text-primary">Workspace</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs text-text-tertiary mb-3">
            Compose a task below. Your agent swarm will decompose, research, implement, and review it in parallel.
          </p>
          <TaskInput onSubmit={onSubmitTask} isDisabled={isDisabled} />
        </div>

        {tasks.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Task History
            </h3>
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-lg border border-white/[0.06] bg-surface-1 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-text-secondary line-clamp-2 flex-1">
                      {task.content}
                    </p>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        task.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : task.status === 'running'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-white/[0.05] text-text-tertiary'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-text-tertiary">
                    <Clock size={10} />
                    <span>{formatRelativeTime(task.createdAt)}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
