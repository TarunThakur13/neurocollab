'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AgentMessage, ConnectionStatus, AgentRole } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';

interface UseAgentSocketReturn {
  messages: AgentMessage[];
  connectionStatus: ConnectionStatus;
  sendTask: (content: string) => void;
  clearMessages: () => void;
}

interface UseAgentSocketProps {
  onComplete?: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/chat';

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

function mapAgentRole(agent: string): AgentRole {
  switch (agent) {
    case 'researcher':
      return 'researcher';
    case 'coder':
      return 'coder';
    case 'orchestrator':
    case 'supervisor':
      return 'orchestrator';
    default:
      return 'reviewer';
  }
}

export function useAgentSocket({ onComplete }: UseAgentSocketProps = {}): UseAgentSocketReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const activeMessageRef = useRef<Map<string, string>>(new Map());
  const onCompleteRef = useRef(onComplete);

  // Keep ref fresh to avoid stale closures
  onCompleteRef.current = onComplete;

  const sendTask = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      ws.send(JSON.stringify({ message: content }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.status === 'complete') {
          activeMessageRef.current.forEach((msgId) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId ? { ...msg, isStreaming: false, isComplete: true } : msg
              )
            );
          });
          activeMessageRef.current.clear();
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return;
        }

        if (data.status === 'error') {
          const errorId = generateId();
          setMessages((prev) => [
            ...prev,
            {
              id: errorId,
              role: 'orchestrator',
              content: `**Error**: ${data.message || 'Unknown error occurred'}`,
              timestamp: new Date(),
              isStreaming: false,
              isComplete: true,
            },
          ]);
          return;
        }

        const agent = data.agent || 'orchestrator';
        const role = mapAgentRole(agent);

        if (data.type === 'status') {
          const statusId = generateId();
          setMessages((prev) => [
            ...prev,
            {
              id: statusId,
              role,
              content: data.content || '',
              timestamp: new Date(),
              isStreaming: false,
              isComplete: true,
            },
          ]);
          return;
        }

        if (data.type === 'agent_start') {
          const msgId = generateId();
          activeMessageRef.current.set(agent, msgId);
          setMessages((prev) => [
            ...prev,
            {
              id: msgId,
              role,
              content: '',
              timestamp: new Date(),
              isStreaming: true,
              isComplete: false,
            },
          ]);
          return;
        }

        if (data.type === 'agent_done') {
          const msgId = activeMessageRef.current.get(agent);
          if (msgId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId ? { ...msg, isStreaming: false, isComplete: true } : msg
              )
            );
            activeMessageRef.current.delete(agent);
          }
          return;
        }

        if (data.type === 'token' && data.token) {
          const msgId = activeMessageRef.current.get(agent);
          if (msgId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === msgId ? { ...msg, content: msg.content + data.token } : msg
              )
            );
          }
          return;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      wsRef.current = null;
    };
  }, []);

  const clearMessages = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    activeMessageRef.current.clear();
    setMessages([]);
    setConnectionStatus('disconnected');
  }, []);

  return { messages, connectionStatus, sendTask, clearMessages };
}
