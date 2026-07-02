'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { LayoutDashboard, CheckCircle2, Bot, Clock, Plus, ArrowRight } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const savedChats = useChatStore((state) => state.savedChats);

  const totalTasks = savedChats.length;
  // Mock average execution time for effect
  const avgTime = totalTasks > 0 ? '18.4s' : '--';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <LayoutDashboard className="text-accent" />
                Dashboard
              </h1>
              <p className="text-text-secondary mt-1">Overview of your NeuroCollab workspace.</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-md font-medium transition-colors shadow-lg shadow-accent/20"
            >
              <Plus size={18} />
              New Task
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              icon={CheckCircle2}
              label="Total Tasks Completed"
              value={totalTasks.toString()}
              color="text-emerald-400"
            />
            <MetricCard
              icon={Bot}
              label="Agents Active"
              value="4"
              color="text-blue-400"
            />
            <MetricCard
              icon={Clock}
              label="Avg Execution Time"
              value={avgTime}
              color="text-amber-400"
            />
          </div>

          <div className="bg-surface-1 rounded-xl border border-border-default overflow-hidden">
            <div className="px-6 py-4 border-b border-border-default bg-white/[0.02]">
              <h2 className="font-semibold text-text-primary">Recent Activity</h2>
            </div>
            
            <div className="divide-y divide-border-default">
              {savedChats.slice(0, 4).map((chat, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={chat.taskId}
                  className="p-6 hover:bg-white/[0.02] transition-colors group flex items-start justify-between"
                >
                  <div className="pr-4">
                    <p className="text-sm font-medium text-text-primary line-clamp-1 mb-1">
                      {chat.userPrompt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                      <span>{new Date(chat.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span>{chat.agentResponses.length} messages</span>
                    </div>
                  </div>
                  <Link href="/history" className="shrink-0 text-text-tertiary hover:text-accent transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 text-sm">
                    View
                    <ArrowRight size={14} />
                  </Link>
                </motion.div>
              ))}
              
              {savedChats.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                    <Bot size={24} className="text-text-tertiary" />
                  </div>
                  <h3 className="text-text-secondary font-medium mb-1">No tasks yet</h3>
                  <p className="text-sm text-text-tertiary max-w-xs mx-auto">
                    Head over to the workspace to dispatch your first task to the agents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-surface-1 rounded-xl border border-border-default p-6 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <div className={`p-2 rounded-md bg-white/[0.04] ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-3xl font-bold text-text-primary">
        {value}
      </div>
    </motion.div>
  );
}
