import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  // General
  theme: 'dark' | 'light' | 'system';
  
  // API Configuration
  groqApiKey: string;
  openaiApiKey: string;
  
  // Advanced
  debugMode: boolean;
  showAgentThoughts: boolean;
  
  // Actions
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setGroqApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setDebugMode: (enabled: boolean) => void;
  setShowAgentThoughts: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      groqApiKey: '',
      openaiApiKey: '',
      debugMode: false,
      showAgentThoughts: true,
      
      setTheme: (theme) => set({ theme }),
      setGroqApiKey: (key) => set({ groqApiKey: key }),
      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
      setDebugMode: (enabled) => set({ debugMode: enabled }),
      setShowAgentThoughts: (enabled) => set({ showAgentThoughts: enabled }),
    }),
    {
      name: 'neurocollab-settings',
    }
  )
);
