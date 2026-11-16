import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Factory,
  FlaskConical,
  Globe,
  Layers,
  PackageCheck,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {SHEET_TABS} from '../data/seedData';
import type {RoleType, SheetTabKey} from '../types/tsc';

interface SidebarProps {
  activeTab: SheetTabKey;
  onSelectTab: (tab: SheetTabKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenGasCenter: () => void;
  onOpenUserModal: () => void;
  onOpenPublicPortal?: () => void;
  currentRole: RoleType;
  tabCounts: Record<SheetTabKey, number>;
  isPublicPortal?: boolean;
}

const TAB_ICONS: Record<SheetTabKey, React.ComponentType<{className?: string}>> = {
  '153 BK': Factory,
  'TIS KBT24': FlaskConical,
  'KARANG BK': Layers,
  'F REGULER (LN, AVE)': PackageCheck,
};

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onOpenGasCenter,
  onOpenUserModal,
  onOpenPublicPortal,
  currentRole,
  tabCounts,
  isPublicPortal = false,
}) => {
  const canManageUsers =
    !isPublicPortal &&
    (currentRole === 'Developer/Site Enginer' ||
      currentRole === 'Bendahara Utama');

  return (
    <aside
      aria-label="Navigasi Lini PRUF Komposisi TSC"
      className={`hidden md:flex flex-col shrink-0 bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-200 select-none ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed ? (
          <div className="min-w-0">
            <p className="font-display text-sm font-bold tracking-tight text-white truncate">
              PRUF - KOMPOSISI TSC
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              PT Batu Karang · Produksi I
            </p>
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto font-display font-bold text-emerald-400 text-sm"
            title="PRUF - KOMPOSISI TSC"
          >
            PT
          </div>
        )}

        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Tutup ke Mode Mini Sidebar"
            aria-label="Tutup ke Mode Mini Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Perluas Sidebar"
            aria-label="Perluas Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sheet Tabs Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!collapsed && (
          <div className="px-2 pb-1 text-[11px] font-medium text-slate-400">
            Lini &amp; Tab Google Sheets
          </div>
        )}

        {SHEET_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.key];
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              title={tab.key}
              className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm truncate whitespace-nowrap">
                    {tab.key}
                  </span>
                  <span
                    className={`font-mono tabular-nums text-xs ${
                      isActive ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Actions (hidden in read-only Public Portal) */}
      {!isPublicPortal ? (
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          {onOpenPublicPortal && (
            <button
              type="button"
              onClick={onOpenPublicPortal}
              title="Link Portal Publik (Read-Only)"
              className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Globe className="w-5 h-5 shrink-0 text-emerald-400" />
              {!collapsed && (
                <span className="truncate whitespace-nowrap">Portal Publik</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenGasCenter}
            title="Headless GAS Center"
            className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Database className="w-5 h-5 shrink-0 text-emerald-400" />
            {!collapsed && (
              <span className="truncate whitespace-nowrap">Headless GAS Center</span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenUserModal}
            title={
              canManageUsers
                ? 'Kelola Pengguna & Peran (RBAC)'
                : 'Info Akses & Peran (RBAC)'
            }
            className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            {canManageUsers ? (
              <ShieldCheck className="w-5 h-5 shrink-0 text-sky-400" />
            ) : (
              <SlidersHorizontal className="w-5 h-5 shrink-0 text-slate-400" />
            )}
            {!collapsed && (
              <span className="truncate whitespace-nowrap">Akses &amp; Pengguna</span>
            )}
          </button>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-800">
          {!collapsed ? (
            <div className="px-2 py-1.5 text-[11px] text-slate-400 leading-relaxed">
              Mode Portal Publik (Read-Only) · Divisi Produksi I
            </div>
          ) : (
            <div
              className="w-full min-h-[40px] flex items-center justify-center text-emerald-400"
              title="Portal Publik Read-Only"
            >
              <Globe className="w-4 h-4" />
            </div>
          )}
        </div>
      )}
    </aside>
  );
});
