'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function StandardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0 text-text-primary">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar connectionStatus="disconnected" />

        <main className="flex-1 min-h-0 overflow-y-auto bg-surface-0">
          {children}
        </main>
      </div>
    </div>
  );
}
