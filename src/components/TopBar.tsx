'use client';

import { Sparkles, LogOut } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionStatus as ConnectionStatusType } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  connectionStatus: ConnectionStatusType;
}

const COOL_EMOTICONS = ['😎', '🚀', '👽', '🤖', '👾', '🔥', '✨', '⚡', '🐉', '🦄', '👻', '🦊'];

export function TopBar({ connectionStatus }: TopBarProps) {
  const { username, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Pick an emoticon based on username length or just use a fixed one if username is not available
  const emoticon = username ? COOL_EMOTICONS[username.length % COOL_EMOTICONS.length] : '😎';

  return (
    <header className="flex items-center justify-between h-12 px-4 bg-surface-1 border-b border-border-default shrink-0">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-tertiary">NeuroCollab</span>
        <span className="text-text-tertiary/50">/</span>
        <span className="text-text-primary font-medium">Workspace</span>
      </div>

      <div className="flex items-center gap-4">
        <ConnectionStatus status={connectionStatus} />
        <div className="w-px h-4 bg-border-default" />
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-xs font-medium">
          <Sparkles size={13} />
          New Task
        </button>
        
        <div className="w-px h-4 bg-border-default" />
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 text-base shadow-sm cursor-help hover:scale-110 hover:shadow-accent/20 transition-all duration-300" 
              title={username || 'User'}
            >
              {emoticon}
            </div>
            {username && (
              <span className="text-sm font-medium text-text-secondary hidden sm:inline-block">
                {username}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
