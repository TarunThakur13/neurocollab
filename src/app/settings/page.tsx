'use client';

import { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Settings, Key, Sliders, Monitor, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';

type TabId = 'general' | 'api' | 'advanced';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  
  const settings = useSettingsStore();
  const clearHistory = useChatStore((state) => state.clearHistory);

  const tabs = [
    { id: 'general', label: 'General', icon: Monitor },
    { id: 'api', label: 'API Configuration', icon: Key },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
  ] as const;

  return (
    <StandardLayout>
      <div className="p-8 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Settings className="text-accent" />
              Settings
            </h1>
            <p className="text-text-secondary text-sm mt-1">Manage your workspace preferences.</p>
          </div>
          
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 bg-surface-1 border border-border-default rounded-2xl p-6 sm:p-8">
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Theme Preferences</h3>
                <p className="text-sm text-text-tertiary mb-4">Customize the appearance of your workspace.</p>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => settings.setTheme('dark')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.theme === 'dark' 
                        ? 'bg-surface-2 border-2 border-accent text-text-primary' 
                        : 'bg-surface-0 border-2 border-border-default text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    Dark Mode
                  </button>
                  <button 
                    onClick={() => settings.setTheme('light')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.theme === 'light' 
                        ? 'bg-surface-2 border-2 border-accent text-text-primary' 
                        : 'bg-surface-0 border-2 border-border-default text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    Light Mode
                  </button>
                </div>
              </div>
              
              <div className="h-px bg-border-default w-full" />
              
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Data Management</h3>
                <p className="text-sm text-text-tertiary mb-4">Manage your local storage and history data.</p>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Clear Local History</h4>
                    <p className="text-xs text-text-tertiary mt-1">This will permanently delete all task history from your browser.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
                        clearHistory();
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <Trash2 size={16} />
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">API Keys</h3>
                <p className="text-sm text-text-tertiary mb-6">Enter your API keys to enable agent reasoning capabilities. Keys are stored securely in your browser's local storage.</p>
                
                <div className="space-y-6">
                  {/* Groq Key */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Groq API Key
                    </label>
                    <div className="relative">
                      <input 
                        type={showGroqKey ? "text" : "password"}
                        value={settings.groqApiKey}
                        onChange={(e) => settings.setGroqApiKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full bg-surface-0 border border-border-default rounded-md py-2.5 pl-4 pr-12 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                      />
                      <button 
                        onClick={() => setShowGroqKey(!showGroqKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                      >
                        {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">Used for fast inference models like Llama 3.</p>
                  </div>

                  {/* OpenAI Key */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <input 
                        type={showOpenaiKey ? "text" : "password"}
                        value={settings.openaiApiKey}
                        onChange={(e) => settings.setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-surface-0 border border-border-default rounded-md py-2.5 pl-4 pr-12 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
                      />
                      <button 
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                      >
                        {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">Used for complex reasoning models like GPT-4o.</p>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
                    <Save size={16} />
                    Save Keys
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Developer Settings</h3>
                <p className="text-sm text-text-tertiary mb-6">Advanced configuration for debugging and UI behavior.</p>
                
                <div className="space-y-6">
                  {/* Debug Mode */}
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center h-5 mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={settings.debugMode}
                        onChange={(e) => settings.setDebugMode(e.target.checked)}
                      />
                      <div className="w-10 h-5.5 bg-surface-0 border border-border-default rounded-full peer-checked:bg-accent peer-checked:border-accent transition-colors"></div>
                      <div className="absolute left-1 top-1 bg-text-tertiary w-3.5 h-3.5 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-transform"></div>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Enable Debug Mode</span>
                      <span className="block text-xs text-text-tertiary mt-1">Logs verbose agent operations and network requests to the browser console.</span>
                    </div>
                  </label>

                  {/* Show Thoughts */}
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center h-5 mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={settings.showAgentThoughts}
                        onChange={(e) => settings.setShowAgentThoughts(e.target.checked)}
                      />
                      <div className="w-10 h-5.5 bg-surface-0 border border-border-default rounded-full peer-checked:bg-accent peer-checked:border-accent transition-colors"></div>
                      <div className="absolute left-1 top-1 bg-text-tertiary w-3.5 h-3.5 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-transform"></div>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-text-primary group-hover:text-accent transition-colors">Show Agent Thoughts in UI</span>
                      <span className="block text-xs text-text-tertiary mt-1">Displays the internal reasoning steps of agents before they output their final response.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
}
