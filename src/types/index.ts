export type AgentRole = 'researcher' | 'coder' | 'reviewer' | 'orchestrator';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: Date;
  isStreaming: boolean;
  isComplete: boolean;
}

export interface Task {
  id: string;
  content: string;
  status: 'pending' | 'running' | 'completed';
  createdAt: Date;
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  icon: string;
  color: string;
}

export const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  orchestrator: {
    role: 'orchestrator',
    name: 'Orchestrator',
    icon: 'brain',
    color: 'var(--agent-orchestrator)',
  },
  researcher: {
    role: 'researcher',
    name: 'Researcher',
    icon: 'search',
    color: 'var(--agent-researcher)',
  },
  coder: {
    role: 'coder',
    name: 'Coder',
    icon: 'code',
    color: 'var(--agent-coder)',
  },
  reviewer: {
    role: 'reviewer',
    name: 'Reviewer',
    icon: 'shield-check',
    color: 'var(--agent-reviewer)',
  },
};
