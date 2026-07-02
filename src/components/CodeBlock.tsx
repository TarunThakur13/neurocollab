'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'punctuation' | 'plain';
  value: string;
}

const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return',
  'if', 'else', 'for', 'while', 'class', 'interface', 'type', 'extends',
  'implements', 'new', 'this', 'super', 'async', 'await', 'default',
  'switch', 'case', 'break', 'continue', 'throw', 'try', 'catch', 'finally',
  'typeof', 'instanceof', 'in', 'of', 'as', 'readonly', 'enum', 'null',
  'undefined', 'true', 'false', 'void', 'never', 'any', 'unknown',
]);

const TYPE_NAMES = /^[A-Z][a-zA-Z0-9]*$/;

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '/') {
      let comment = '';
      while (i < code.length && code[i] !== '\n') {
        comment += code[i++];
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    if (code[i] === '/' && code[i + 1] === '*') {
      let comment = '';
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        comment += code[i++];
      }
      if (i < code.length) {
        comment += code[i++];
        comment += code[i++];
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    if (code[i] === "'" || code[i] === '"' || code[i] === '`') {
      const quote = code[i];
      let str = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          str += code[i++];
        }
        if (i < code.length) {
          str += code[i++];
        }
      }
      if (i < code.length) str += code[i++];
      tokens.push({ type: 'string', value: str });
      continue;
    }

    if (/[0-9]/.test(code[i])) {
      let num = '';
      while (i < code.length && /[0-9.]/.test(code[i])) {
        num += code[i++];
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    if (/[a-zA-Z_$]/.test(code[i])) {
      let word = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        word += code[i++];
      }
      if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (TYPE_NAMES.test(word)) {
        tokens.push({ type: 'type', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      continue;
    }

    if (/[{}()[\];:.,<>=!&|?+\-*/^%~@#]/.test(code[i])) {
      tokens.push({ type: 'punctuation', value: code[i++] });
      continue;
    }

    tokens.push({ type: 'plain', value: code[i++] });
  }

  return tokens;
}

const tokenColors: Record<Token['type'], string> = {
  keyword: 'text-violet-400',
  string: 'text-emerald-400',
  comment: 'text-zinc-500 italic',
  number: 'text-amber-400',
  type: 'text-cyan-400',
  punctuation: 'text-zinc-400',
  plain: 'text-zinc-200',
};

export function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const tokens = tokenize(code);

  return (
    <div className="group relative my-3 rounded-lg border border-white/[0.06] bg-surface-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono">
        <code>
          {tokens.map((token, i) => (
            <span key={i} className={tokenColors[token.type]}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
