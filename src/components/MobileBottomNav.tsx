import React from 'react';
import {
  Factory,
  FlaskConical,
  Layers,
  PackageCheck,
  Users,
} from 'lucide-react';
import {SHEET_TABS} from '../data/seedData';
import type {SheetTabKey} from '../types/tsc';

interface MobileBottomNavProps {
  activeTab: SheetTabKey;
  onSelectTab: (tab: SheetTabKey) => void;
  onOpenUserModal: () => void;
  isPublicPortal?: boolean;
}

const MOBILE_ICONS: Record<SheetTabKey, React.ComponentType<{className?: string}>> = {
  '153 BK': Factory,
  'TIS KBT24': FlaskConical,
  'KARANG BK': Layers,
  'F REGULER (LN, AVE)': PackageCheck,
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenUserModal,
  isPublicPortal = false,
}) => {
  return (
    <nav
      aria-label="Navigasi Cepat Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
    >
      <div
        className={`grid ${
          isPublicPortal ? 'grid-cols-4' : 'grid-cols-5'
        } items-center h-14 [@media(orientation:landscape)_and_(max-height:540px)]:h-12 pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))]`}
      >
        {SHEET_TABS.map((tab) => {
          const Icon = MOBILE_ICONS[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[10px] leading-tight truncate max-w-full">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}

        {!isPublicPortal && (
          <button
            type="button"
            onClick={onOpenUserModal}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-[10px] leading-tight truncate max-w-full">
              RBAC
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
