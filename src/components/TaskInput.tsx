'use client';

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, CornerDownLeft } from 'lucide-react';

interface TaskInputProps {
  onSubmit: (content: string) => void;
  isDisabled?: boolean;
}

export function TaskInput({ onSubmit, isDisabled = false }: TaskInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSubmit(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSubmit]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-surface-1 overflow-hidden focus-within:border-accent/30 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe your task for the agent swarm..."
        disabled={isDisabled}
        rows={3}
        className="w-full bg-transparent px-4 pt-4 pb-2 text-sm text-text-primary placeholder:text-text-tertiary/60 resize-none outline-none"
      />

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.04]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-text-tertiary font-mono">
            {value.length} chars
          </span>
          <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
            <CornerDownLeft size={10} />
            <span>Ctrl+Enter to send</span>
          </div>
        </div>

        <motion.button
          onClick={handleSubmit}
          disabled={!value.trim() || isDisabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={12} />
          Send to Agents
        </motion.button>
      </div>
    </div>
  );
}
