import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentRole } from '@/types';

export interface AgentConfiguration {
  id: string; // The agent role/id
  model: string;
  temperature: number;
  customPrompt: string;
}

const DEFAULT_CONFIGS: Record<string, AgentConfiguration> = {
  supervisor: {
    id: 'supervisor',
    model: 'gpt-4o',
    temperature: 0.2,
    customPrompt: 'You are the core Supervisor. Manage sub-agents efficiently.',
  },
  orchestrator: {
    id: 'orchestrator',
    model: 'gpt-4o',
    temperature: 0.3,
    customPrompt: 'You orchestrate tasks by breaking them down into steps.',
  },
  researcher: {
    id: 'researcher',
    model: 'llama-3-70b',
    temperature: 0.7,
    customPrompt: 'You are an expert researcher. Use tools to gather information.',
  },
  coder: {
    id: 'coder',
    model: 'gpt-4o',
    temperature: 0.1,
    customPrompt: 'You write secure, performant, and clean code.',
  },
  reviewer: {
    id: 'reviewer',
    model: 'gpt-4o',
    temperature: 0.1,
    customPrompt: 'You review code for security vulnerabilities and logical errors.',
  },
};

interface AgentStore {
  configs: Record<string, AgentConfiguration>;
  updateConfig: (id: string, config: Partial<AgentConfiguration>) => void;
  resetConfig: (id: string) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      configs: DEFAULT_CONFIGS,
      
      updateConfig: (id, config) => set((state) => ({
        configs: {
          ...state.configs,
          [id]: { ...state.configs[id], ...config },
        },
      })),
      
      resetConfig: (id) => set((state) => ({
        configs: {
          ...state.configs,
          [id]: { ...DEFAULT_CONFIGS[id] },
        }
      })),
    }),
    {
      name: 'neurocollab-agent-configs',
    }
  )
);
