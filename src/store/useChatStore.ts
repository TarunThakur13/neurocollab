import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentMessage } from '@/types';

export interface SavedChat {
  taskId: string;
  timestamp: number;
  userPrompt: string;
  agentResponses: AgentMessage[];
}

interface ChatStore {
  savedChats: SavedChat[];
  saveChat: (chat: SavedChat) => Promise<void>;
  fetchHistory: () => Promise<void>;
  deleteChat: (taskId: string) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      savedChats: [],
      fetchHistory: async () => {
        const { useAuthStore } = await import('./useAuthStore');
        const token = useAuthStore.getState().token;
        if (!token) return;
        
        try {
          const res = await fetch('http://localhost:8000/history', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            // Maps the db format back to SavedChat
            const formatted = data.map((d: any) => ({
              taskId: d.task_id,
              timestamp: d.timestamp,
              userPrompt: d.user_prompt,
              agentResponses: d.agent_responses,
            }));
            set({ savedChats: formatted });
          }
        } catch (e) {
          console.error("Failed to fetch history", e);
        }
      },
      saveChat: async (chat) => {
        set((state) => ({ savedChats: [chat, ...state.savedChats] }));
        
        const { useAuthStore } = await import('./useAuthStore');
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
          await fetch('http://localhost:8000/history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(chat),
          });
        } catch (e) {
          console.error("Failed to sync chat to backend", e);
        }
      },
      deleteChat: (taskId) =>
        set((state) => ({
          savedChats: state.savedChats.filter((c) => c.taskId !== taskId),
        })),
      clearHistory: () => set({ savedChats: [] }),
    }),
    {
      name: 'neurocollab-chat-storage',
    }
  )
);
