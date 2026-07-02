'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Trash2, ArrowDown } from 'lucide-react';
import type { AgentMessage } from '@/types';
import { AgentMessageCard } from './AgentMessage';

interface AgentStreamProps {
  messages: AgentMessage[];
  onClear: () => void;
}

export function AgentStream({ messages, onClear }: AgentStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (isAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAutoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setIsAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      setIsAutoScroll(true);
      setShowScrollButton(false);
    }
  };

  const activeAgents = new Set(messages.filter((m) => m.isStreaming).map((m) => m.role)).size;

  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="flex items-center justify-between px-4 h-12 border-b border-border-default shrink-0">
        <div className="flex items-center gap-2.5">
          <Radio size={14} className="text-accent" />
          <h2 className="text-sm font-semibold text-text-primary">Agent Stream</h2>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-text-tertiary bg-white/[0.05]">
              {messages.length}
            </span>
          )}
          {activeAgents > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-accent bg-accent/10"
            >
              {activeAgents} active
            </motion.span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] transition-colors"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Radio size={20} className="text-text-tertiary" />
            </div>
            <p className="text-sm text-text-tertiary mb-1">No agent activity</p>
            <p className="text-xs text-text-tertiary/60">Submit a task to see agents collaborate in real-time</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <AgentMessageCard key={message.id} message={message} index={index} />
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-white/[0.08] text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors shadow-lg shadow-black/30 text-xs"
          >
            <ArrowDown size={12} />
            Scroll to bottom
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
