import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, BarChart2, Users, LogOut,
  Menu, X, Briefcase, ChevronRight, Wrench, Calendar, UsersRound,
  UserCheck, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import type { Role, User } from '../../types';

const navItems = [
  { to: '/',                   label: 'Dashboard',  icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Trasportatore', 'Caposquadra'], section: null },
  { to: '/consegne',           label: 'Consegne',   icon: Package,         roles: ['Admin', 'Manager', 'Trasportatore'],               section: 'Consegne' },
  { to: '/lavori',             label: 'Lavori',     icon: Wrench,          roles: ['Admin', 'Manager', 'Caposquadra'],                  section: 'Installazioni' },
  { to: '/lavori/calendario',  label: 'Calendario', icon: Calendar,        roles: ['Admin', 'Manager', 'Caposquadra'],                  section: 'Installazioni' },
  { to: '/squadre',            label: 'Squadre',    icon: UsersRound,      roles: ['Admin', 'Manager'],                                 section: 'Installazioni' },
  { to: '/report',             label: 'Report',     icon: BarChart2,       roles: ['Admin', 'Manager'],                                 section: 'Gestione' },
  { to: '/utenti',             label: 'Utenti',     icon: Users,           roles: ['Admin'],                                            section: 'Gestione' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, originalUser, isImpersonating, logout, hasRole, stopImpersonation, startImpersonation } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const visibleNavItems = navItems.filter(item => hasRole(...(item.roles as Role[])));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200">
        <SidebarContent
          items={visibleNavItems}
          user={user}
          originalUser={originalUser}
          isImpersonating={isImpersonating}
          onLogout={handleLogout}
          onStopImpersonation={stopImpersonation}
          onStartImpersonation={startImpersonation}
        />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <SidebarContent
              items={visibleNavItems}
              user={user}
              originalUser={originalUser}
              isImpersonating={isImpersonating}
              onLogout={handleLogout}
              onClose={() => setSidebarOpen(false)}
              onStopImpersonation={stopImpersonation}
              onStartImpersonation={startImpersonation}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm">I Miei Lavori</span>
          </div>
        </header>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <UserCheck size={15} className="text-amber-500" />
              <span>
                Stai navigando come{' '}
                <strong>{user?.nome} {user?.cognome}</strong>{' '}
                <span className="text-amber-600">({user?.role})</span>
              </span>
            </div>
            <button
              onClick={stopImpersonation}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
            >
              Esci dall'impersonazione
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  items, user, originalUser, isImpersonating,
  onLogout, onClose, onStopImpersonation, onStartImpersonation,
}: {
  items: typeof navItems;
  user: User | null;
  originalUser: User | null;
  isImpersonating: boolean;
  onLogout: () => void;
  onClose?: () => void;
  onStopImpersonation: () => void;
  onStartImpersonation: (u: User) => void;
}) {
  // The real user (admin) can impersonate when not already impersonating
  const canImpersonate = !isImpersonating && originalUser === null && user?.role === 'Admin';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">I Miei</p>
            <p className="text-xs text-gray-500 leading-tight">Lavori</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {(() => {
          const sections: string[] = [];
          return items.map((item) => {
            const showHeader = item.section && !sections.includes(item.section);
            if (item.section && showHeader) sections.push(item.section);
            return (
              <div key={item.to}>
                {showHeader && (
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-4 mb-1">
                    {item.section}
                  </p>
                )}
                <NavLink
                  to={item.to}
                  end={item.to === '/' || item.to === '/lavori'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
                    </>
                  )}
                </NavLink>
              </div>
            );
          });
        })()}
      </nav>

      {/* Impersonation selector (Admin only, when not impersonating) */}
      {canImpersonate && (
        <div className="px-3 py-2 border-t border-gray-100">
          <ImpersonationSelector onSelect={onStartImpersonation} onClose={onClose} />
        </div>
      )}

      {/* User info + logout */}
      <div className="border-t border-gray-100 px-3 py-3">
        {isImpersonating && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-1 bg-amber-50 rounded-lg">
            <UserCheck size={13} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 truncate">
              Admin: {originalUser?.nome} {originalUser?.cognome}
            </p>
            <button onClick={onStopImpersonation} className="ml-auto text-[10px] text-amber-600 hover:text-amber-800 font-medium flex-shrink-0">
              Esci
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isImpersonating ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <span className={`text-xs font-bold ${isImpersonating ? 'text-amber-700' : 'text-blue-700'}`}>
              {user?.nome?.[0]}{user?.cognome?.[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.nome} {user?.cognome}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Esci
        </button>
      </div>
    </div>
  );
}

function ImpersonationSelector({
  onSelect, onClose,
}: {
  onSelect: (u: User) => void;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const { data: utenti } = useQuery({
    queryKey: ['utenti'],
    queryFn: authService.getUtenti,
    enabled: open,
  });

  const ROLE_COLOR: Record<string, string> = {
    Admin: 'text-purple-600', Manager: 'text-blue-600',
    Trasportatore: 'text-green-600', Caposquadra: 'text-orange-600',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <UserCheck size={14} className="text-gray-400" />
        <span>Impersona utente</span>
        <ChevronDown size={12} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10 max-h-64 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">
            Seleziona utente
          </p>
          {!utenti ? (
            <p className="text-xs text-gray-400 px-3 py-2">Caricamento...</p>
          ) : (
            utenti.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  onSelect(u);
                  setOpen(false);
                  onClose?.();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 text-left"
              >
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-500">
                    {u.nome[0]}{u.cognome[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{u.nome} {u.cognome}</p>
                  <p className={`text-[10px] ${ROLE_COLOR[u.role] ?? 'text-gray-500'}`}>{u.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
