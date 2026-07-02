'use client';

import { Brain, Search, Code, ShieldCheck } from 'lucide-react';
import type { AgentRole } from '@/types';

interface AgentBadgeProps {
  role: AgentRole;
  size?: 'sm' | 'md';
}

const roleConfig: Record<AgentRole, { label: string; icon: typeof Brain; colorClass: string; bgClass: string }> = {
  orchestrator: { label: 'Orchestrator', icon: Brain, colorClass: 'text-agent-orchestrator', bgClass: 'bg-agent-orchestrator/10' },
  researcher: { label: 'Researcher', icon: Search, colorClass: 'text-agent-researcher', bgClass: 'bg-agent-researcher/10' },
  coder: { label: 'Coder', icon: Code, colorClass: 'text-agent-coder', bgClass: 'bg-agent-coder/10' },
  reviewer: { label: 'Reviewer', icon: ShieldCheck, colorClass: 'text-agent-reviewer', bgClass: 'bg-agent-reviewer/10' },
};

export function AgentBadge({ role, size = 'md' }: AgentBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/5 ${config.bgClass} ${
        isSmall ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}
    >
      <Icon className={config.colorClass} size={isSmall ? 12 : 14} strokeWidth={2} />
      <span className={`font-medium ${config.colorClass} ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
        {config.label}
      </span>
    </div>
  );
}
