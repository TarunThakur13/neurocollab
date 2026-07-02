'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AgentMessage as AgentMessageType, AgentRole } from '@/types';
import { AgentBadge } from './AgentBadge';
import { CodeBlock } from './CodeBlock';

interface AgentMessageProps {
  message: AgentMessageType;
  index: number;
}

const borderColors: Record<AgentRole, string> = {
  orchestrator: 'border-l-agent-orchestrator',
  researcher: 'border-l-agent-researcher',
  coder: 'border-l-agent-coder',
  reviewer: 'border-l-agent-reviewer',
};

interface ParsedSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

function parseContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', content: match[2], language: match[1] || 'text' });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return segments;
}

function renderTextContent(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    let processed: React.ReactNode;

    if (line.startsWith('### ')) {
      processed = (
        <h3 key={lineIdx} className="text-sm font-semibold text-text-primary mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      processed = (
        <h2 key={lineIdx} className="text-base font-semibold text-text-primary mt-3 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('**') && line.endsWith('**') && !line.includes('\n')) {
      processed = (
        <h3 key={lineIdx} className="text-sm font-semibold text-text-primary mt-3 mb-1">
          {line.slice(2, -2)}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      processed = (
        <blockquote
          key={lineIdx}
          className="border-l-2 border-accent/40 pl-3 my-1 text-text-secondary italic"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      processed = (
        <div key={lineIdx} className="flex gap-2 ml-1 my-0.5">
          <span className="text-text-tertiary mt-0.5 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        processed = (
          <div key={lineIdx} className="flex gap-2 ml-1 my-0.5">
            <span className="text-text-tertiary mt-0.5 shrink-0 text-xs font-mono w-4 text-right">
              {numMatch[1]}.
            </span>
            <span>{renderInline(numMatch[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith('|') && line.endsWith('|')) {
      return;
    } else if (line.trim() === '') {
      processed = <div key={lineIdx} className="h-2" />;
    } else {
      processed = (
        <p key={lineIdx} className="my-0.5">
          {renderInline(line)}
        </p>
      );
    }

    if (processed) elements.push(processed);
  });

  const tableRegex = /(\|.+\|\n)+/g;
  const tableMatch = text.match(tableRegex);
  if (tableMatch) {
    tableMatch.forEach((table, tIdx) => {
      const rows = table.trim().split('\n');
      const headerRow = rows[0];
      const dataRows = rows.slice(2);

      if (headerRow) {
        const headers = headerRow.split('|').filter((c) => c.trim());
        elements.push(
          <div key={`table-${tIdx}`} className="my-3 rounded-lg border border-white/[0.06] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03]">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-text-secondary">
                      {renderInline(h.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => {
                  const cells = row.split('|').filter((c) => c.trim());
                  return (
                    <tr key={rIdx} className="border-t border-white/[0.04]">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-text-primary">
                          {renderInline(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
    });
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-text-primary">
          {match[2]}
        </strong>
      );
    } else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-white/[0.06] text-accent text-[12px] font-mono"
        >
          {match[4]}
        </code>
      );
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length === 1 ? parts[0] : parts;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AgentMessageCard({ message, index }: AgentMessageProps) {
  const segments = useMemo(() => parseContent(message.content), [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      className={`relative rounded-lg border border-white/[0.06] bg-surface-1 overflow-hidden border-l-2 ${borderColors[message.role]}`}
    >
      {message.isStreaming && !message.isComplete && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.05) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
          }}
        />
      )}

      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <AgentBadge role={message.role} size="sm" />
          {message.isStreaming && !message.isComplete && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-accent"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-text-tertiary ml-1">streaming</span>
            </motion.div>
          )}
        </div>
        <span className="text-[10px] text-text-tertiary font-mono">
          {formatTime(message.timestamp)}
        </span>
      </div>

      <div className="px-4 py-3 text-[13px] leading-relaxed text-text-secondary">
        {segments.map((segment, i) =>
          segment.type === 'code' ? (
            <CodeBlock key={i} code={segment.content} language={segment.language} />
          ) : (
            <div key={i}>{renderTextContent(segment.content)}</div>
          )
        )}
        {message.isStreaming && !message.isComplete && (
          <motion.span
            className="inline-block w-[6px] h-[14px] bg-accent/70 ml-0.5 align-middle rounded-sm"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </motion.div>
  );
}
