'use client';

import { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Search, Brain, Network, Code, ShieldCheck, Microscope, X } from 'lucide-react';
import { useAgentStore, AgentConfiguration } from '@/store/useAgentStore';

const AGENTS = [
  {
    id: 'supervisor',
    name: 'Supervisor',
    role: 'System Coordinator',
    description: 'Oversees the entire multi-agent workflow, delegating tasks and ensuring successful execution of complex goals.',
    icon: Brain,
    status: 'Core System',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
  },
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'Task Manager',
    description: 'Breaks down high-level objectives into sequential steps and manages dependencies between different specialized agents.',
    icon: Network,
    status: 'Active',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Information Gatherer',
    description: 'Scours databases, documentation, and the web to gather context and answer complex domain-specific questions.',
    icon: Microscope,
    status: 'Idle',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/20',
  },
  {
    id: 'coder',
    name: 'Coder',
    role: 'Software Engineer',
    description: 'Writes, refactors, and debugs code across multiple languages. Implements features based on structured plans.',
    icon: Code,
    status: 'Idle',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/20',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    role: 'Quality Assurance',
    description: 'Analyzes generated code for security, performance, and best practices. Suggests optimizations before final delivery.',
    icon: ShieldCheck,
    status: 'Idle',
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/20',
  },
];

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [configuringAgentId, setConfiguringAgentId] = useState<string | null>(null);

  const { configs, updateConfig, resetConfig } = useAgentStore();

  const filteredAgents = AGENTS.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const configuringAgent = AGENTS.find(a => a.id === configuringAgentId);
  const activeConfig = configuringAgentId ? configs[configuringAgentId] : null;

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (configuringAgentId) {
      updateConfig(configuringAgentId, {
        model: formData.get('model') as string,
        temperature: parseFloat(formData.get('temperature') as string),
        customPrompt: formData.get('customPrompt') as string,
      });
      setConfiguringAgentId(null);
    }
  };

  return (
    <StandardLayout>
      <div className="p-8 max-w-7xl mx-auto relative">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Agent Directory</h1>
            <p className="text-text-secondary mt-1">Manage and monitor your specialized AI nodes.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-1 border border-border-default rounded-md py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="flex flex-col bg-surface-1 border border-border-default rounded-xl p-6 hover:border-accent/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${agent.bgColor} ${agent.borderColor} border`}>
                  <agent.icon className={agent.color} size={24} />
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  agent.status === 'Core System' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  agent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}>
                  {agent.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                {agent.name}
              </h3>
              <p className="text-sm text-text-tertiary font-medium mb-3">{agent.role}</p>
              
              <p className="text-sm text-text-secondary leading-relaxed flex-1">
                {agent.description}
              </p>
              
              <div className="mt-6 pt-4 border-t border-border-default flex items-center justify-between">
                <span className="text-xs text-text-tertiary">Model: {configs[agent.id]?.model || 'Default'}</span>
                <button 
                  onClick={() => setConfiguringAgentId(agent.id)}
                  className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
          
          {filteredAgents.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-border-default rounded-xl">
              <p className="text-text-tertiary">No agents found matching your search.</p>
            </div>
          )}
        </div>
        
        {/* Configuration Modal overlay */}
        {configuringAgent && activeConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface-1 border border-border-default rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-border-default">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${configuringAgent.bgColor} ${configuringAgent.borderColor} border`}>
                    <configuringAgent.icon className={configuringAgent.color} size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Configure {configuringAgent.name}</h2>
                    <p className="text-xs text-text-tertiary">{configuringAgent.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfiguringAgentId(null)}
                  className="p-2 text-text-tertiary hover:text-text-primary rounded-md hover:bg-white/[0.04] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    LLM Model
                  </label>
                  <select 
                    name="model" 
                    defaultValue={activeConfig.model}
                    className="w-full bg-surface-0 border border-border-default rounded-md py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  >
                    <option value="gpt-4o">GPT-4o (OpenAI)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (OpenAI)</option>
                    <option value="llama-3-70b">Llama 3 70B (Groq)</option>
                    <option value="llama-3-8b">Llama 3 8B (Groq)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2 flex justify-between">
                    <span>Temperature</span>
                    <span className="text-text-tertiary font-normal" id="temp-display">{activeConfig.temperature}</span>
                  </label>
                  <input 
                    type="range" 
                    name="temperature"
                    min="0" max="1" step="0.1" 
                    defaultValue={activeConfig.temperature}
                    onChange={(e) => {
                      const display = document.getElementById('temp-display');
                      if (display) display.textContent = e.target.value;
                    }}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-text-tertiary mt-1">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Custom System Prompt
                  </label>
                  <textarea 
                    name="customPrompt"
                    defaultValue={activeConfig.customPrompt}
                    rows={4}
                    className="w-full bg-surface-0 border border-border-default rounded-md py-2.5 px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none custom-scrollbar"
                  ></textarea>
                </div>
                
                <div className="pt-4 flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => resetConfig(configuringAgent.id)}
                    className="text-sm font-medium text-text-tertiary hover:text-red-400 transition-colors"
                  >
                    Reset Defaults
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setConfiguringAgentId(null)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
}
