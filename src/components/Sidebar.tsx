'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Layers,
  Bot,
  Clock,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Layers, label: 'Workspace', href: '/' },
  { icon: Bot, label: 'Agents', href: '/agents' },
  { icon: Clock, label: 'History', href: '/history' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  return (
    <motion.aside
      className="relative flex flex-col h-full bg-surface-1 border-r border-border-default z-20"
      animate={{ width: isCollapsed ? 48 : 220 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center h-12 px-3 border-b border-border-default">
        {!isCollapsed && (
          <motion.div
            className="flex items-center gap-2 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-accent/20">
              <Zap size={14} className="text-accent" />
            </div>
            <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
              NeuroCollab
            </span>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-accent/20">
              <Zap size={14} className="text-accent" />
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center w-full rounded-md transition-colors ${
                isCollapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-2'
              } ${
                isActive
                  ? 'bg-white/[0.08] text-text-primary'
                  : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={16} strokeWidth={1.8} />
              {!isCollapsed && (
                <motion.span
                  className="text-sm font-medium whitespace-nowrap"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-border-default">
        <button
          onClick={onToggle}
          className="flex items-center w-full rounded-md text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] transition-colors justify-center px-0 py-2"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
