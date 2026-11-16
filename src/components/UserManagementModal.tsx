import React, {useState} from 'react';
import {ShieldCheck, Trash2, UserPlus, X} from 'lucide-react';
import type {RBACUser, RoleType} from '../types/tsc';
import {formatWibDateTime} from '../utils/formatters';

interface UserManagementModalProps {
  users: RBACUser[];
  activeUser: RBACUser;
  onAddUser: (name: string, role: RoleType) => void;
  onRemoveUser: (userId: string) => void;
  onSelectUser: (userId: string) => void;
  onClose: () => void;
}

const ROLES: RoleType[] = [
  'User',
  'Admin',
  'Bendahara Utama',
  'Developer/Site Enginer',
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  users,
  activeUser,
  onAddUser,
  onRemoveUser,
  onSelectUser,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('User');

  const canManage =
    activeUser.role === 'Developer/Site Enginer' ||
    activeUser.role === 'Bendahara Utama';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !name.trim()) return;
    onAddUser(name.trim(), role);
    setName('');
    setRole('User');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Manajemen Pengguna RBAC"
    >
      <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Manajemen Peran &amp; Pengguna (RBAC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Peran aktif: <strong>{activeUser.name}</strong> ({activeUser.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5">
          {/* Add User Form (Restricted to Developer/Site Enginer & Bendahara Utama) */}
          {canManage ? (
            <form
              onSubmit={handleSubmit}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
            >
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Tambah Pengguna Baru (Otoritas {activeUser.role})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama operator / staf..."
                  className="sm:col-span-6 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleType)}
                  className="sm:col-span-4 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-white"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="sm:col-span-2 min-h-[44px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              Penambahan pengguna hanya dapat dilakukan oleh peran{' '}
              <strong>Developer/Site Enginer</strong> atau{' '}
              <strong>Bendahara Utama</strong>.
            </div>
          )}

          {/* User List */}
          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
            {users.map((u) => {
              const isCurrent = u.id === activeUser.id;
              const isProtected = u.createdBy === 'System';
              return (
                <div
                  key={u.id}
                  className="p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {u.role} · Dibuat oleh {u.createdBy} ·{' '}
                      {formatWibDateTime(u.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectUser(u.id)}
                      className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {isCurrent ? 'Aktif' : 'Pakai'}
                    </button>

                    {canManage && !isProtected && !isCurrent && (
                      <button
                        type="button"
                        onClick={() => onRemoveUser(u.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label={`Hapus ${u.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
