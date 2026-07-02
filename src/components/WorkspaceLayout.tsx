'use client';

import { useState, useCallback, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { UserWorkspace } from './UserWorkspace';
import { AgentStream } from './AgentStream';
import { useAgentSocket } from '@/hooks/useAgentSocket';
import { useChatStore } from '@/store/useChatStore';
import type { Task } from '@/types';

export function WorkspaceLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const saveChat = useChatStore((state) => state.saveChat);

  const handleTaskComplete = useCallback(() => {
    setTasks((prev) => {
      if (prev.length === 0) return prev;
      const currentTask = prev[0];
      return [
        { ...currentTask, status: 'completed' as const },
        ...prev.slice(1),
      ];
    });
  }, []);

  const { messages, connectionStatus, sendTask, clearMessages } = useAgentSocket({
    onComplete: handleTaskComplete,
  });

  // We need an effect to save the chat after tasks update to completed, 
  // so we capture the final messages state accurately.
  useEffect(() => {
    if (tasks.length > 0 && tasks[0].status === 'completed') {
      // Avoid duplicate saves by checking if this taskId is already in the store
      const currentTask = tasks[0];
      const isAlreadySaved = useChatStore.getState().savedChats.some(c => c.taskId === currentTask.id);
      if (!isAlreadySaved) {
        saveChat({
          taskId: currentTask.id,
          timestamp: currentTask.createdAt.getTime(),
          userPrompt: currentTask.content,
          agentResponses: messages,
        });
      }
    }
  }, [tasks, messages, saveChat]);

  const handleSubmitTask = useCallback(
    (content: string) => {
      const newTask: Task = {
        id: Math.random().toString(36).substring(2, 12),
        content,
        status: 'running',
        createdAt: new Date(),
      };
      setTasks((prev) => [newTask, ...prev]);
      sendTask(content);
    },
    [sendTask]
  );

  const handleClear = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar connectionStatus={connectionStatus} />

        <main className="flex-1 min-h-0">
          <Group orientation="horizontal" className="h-full">
            <Panel defaultSize="45%" minSize="25%">
              <UserWorkspace
                onSubmitTask={handleSubmitTask}
                tasks={tasks}
              />
            </Panel>

            <Separator className="group relative flex items-center justify-center w-[9px] hover:w-[11px] transition-all duration-150">
              <div className="absolute inset-y-0 w-px bg-border-default group-hover:bg-accent/40 transition-colors" />
              <div className="relative z-10 flex items-center justify-center w-4 h-8 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={12} className="text-text-tertiary" />
              </div>
            </Separator>

            <Panel defaultSize="55%" minSize="30%">
              <div className="relative h-full">
                <AgentStream messages={messages} onClear={handleClear} />
              </div>
            </Panel>
          </Group>
        </main>
      </div>
    </div>
  );
}
