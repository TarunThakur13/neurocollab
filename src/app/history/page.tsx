'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StandardLayout } from '@/components/StandardLayout';
import { Clock, Search, ChevronDown, Bot, Trash2 } from 'lucide-react';
import { useChatStore, SavedChat } from '@/store/useChatStore';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const savedChats = useChatStore((state) => state.savedChats);
  const deleteChat = useChatStore((state) => state.deleteChat);

  const filteredChats = savedChats.filter(chat => 
    chat.userPrompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <StandardLayout>
      <div className="p-8 max-w-5xl mx-auto w-full">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Clock className="text-accent" />
                Task History
              </h1>
              <p className="text-text-secondary mt-1">A complete ledger of your interactions with the agents.</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-text-tertiary" />
              </div>
              <input
                type="text"
                placeholder="Search past tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-1 border border-border-default rounded-md py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredChats.map((chat) => (
              <HistoryItem
                key={chat.taskId}
                chat={chat}
                isExpanded={expandedId === chat.taskId}
                onToggle={() => setExpandedId(expandedId === chat.taskId ? null : chat.taskId)}
                onDelete={() => deleteChat(chat.taskId)}
              />
            ))}

            {filteredChats.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl bg-white/[0.01]">
                <Bot size={32} className="text-text-tertiary mb-4" />
                <h3 className="text-text-secondary font-medium text-lg mb-1">No history found</h3>
                <p className="text-sm text-text-tertiary">
                  {searchQuery ? 'Try adjusting your search terms.' : "You haven't completed any tasks yet."}
                </p>
              </div>
            )}
          </div>
        </div>
    </StandardLayout>
  );
}

function HistoryItem({ 
  chat, 
  isExpanded, 
  onToggle, 
  onDelete 
}: { 
  chat: SavedChat; 
  isExpanded: boolean; 
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-surface-1 border border-border-default rounded-xl overflow-hidden transition-all duration-200">
      <div 
        className="px-6 py-4 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary mb-1 truncate">
            {chat.userPrompt}
          </p>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span>{new Date(chat.timestamp).toLocaleString()}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Bot size={12} /> {chat.agentResponses.length} interactions
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-text-tertiary hover:text-red-400 hover:bg-white/[0.04] rounded-md transition-colors"
            title="Delete record"
          >
            <Trash2 size={16} />
          </button>
          <div className={`p-1.5 text-text-tertiary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border-default bg-surface-0/50"
          >
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Original Prompt</h4>
                <div className="bg-surface-1 border border-border-default rounded-md p-4 text-sm text-text-secondary whitespace-pre-wrap">
                  {chat.userPrompt}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Agent Execution Log</h4>
                <div className="space-y-3">
                  {chat.agentResponses.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.04] border border-border-default">
                          <span className="text-[10px] font-bold text-text-tertiary">
                            {msg.role.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 bg-surface-1 border border-border-default rounded-md p-3 text-sm text-text-secondary">
                        <span className="font-semibold text-text-primary capitalize mb-1 block">
                          {msg.role}
                        </span>
                        <div className="whitespace-pre-wrap text-xs">
                          {msg.content || '(Started execution...)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
