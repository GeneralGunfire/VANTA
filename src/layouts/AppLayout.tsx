import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutTemplate, Compass, History, Wallet, Search, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_SURFACE, SIDEBAR_SURFACE } from '../lib/surfaces';

const navItems = [
  { name: 'Home', path: '/app/chat', icon: Home },
  { name: 'Templates', path: '/app/templates', icon: LayoutTemplate },
  { name: 'Explore', path: '/app/explore', icon: Compass },
  { name: 'History', path: '/app/history', icon: History },
  { name: 'Wallet', path: '/app/ledger', icon: Wallet },
];

const historyGroups = [
  {
    label: 'Tomorrow',
    items: [
      "What's one lesson life has taught you recently?",
      "What's one mistake that taught you a valuable...",
      "What's one goal that excites you the most...",
    ],
  },
  {
    label: '10 days ago',
    items: [
      'If animals could talk, which one would be...',
      "What's one word to describe your day?",
      "What's one habit you want to break?",
    ],
  },
];

/** Shared with routed children via <Outlet context>. */
export interface AppShellContext {
  /** Collapses the sidebar while the chat composer is active, for a focused write. */
  setComposerFocused: (focused: boolean) => void;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  /** Desktop only: the sidebar narrows to an icon rail while the composer is active. */
  const collapsed = composerFocused;

  const filteredHistoryGroups = React.useMemo(() => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return historyGroups;
    return historyGroups
      .map((group) => ({ ...group, items: group.items.filter((item) => item.toLowerCase().includes(q)) }))
      .filter((group) => group.items.length > 0);
  }, [historyFilter]);

  React.useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') !== 'signed_in') {
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <div
      className="h-screen flex font-sans text-zinc-100 overflow-hidden relative isolate"
      style={{ background: APP_SURFACE }}
    >
      {/* Mobile Header & Menu Toggle */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50"
        style={{ background: SIDEBAR_SURFACE }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-sm">
            V
          </div>
          <span className="font-serif font-bold text-lg text-zinc-50 tracking-tight">Vanta</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:sticky md:top-0 h-screen flex flex-col z-40 transition-all duration-300 ease-in-out md:transform-none shrink-0',
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64',
          collapsed ? 'md:w-18' : 'md:w-64',
        )}
      >
        {/* Soft glass panel, tinted with the same blue as the canvas so the seam disappears */}
        <div className="absolute inset-0 border-r border-white/10" style={{ background: SIDEBAR_SURFACE }} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 0% 0%, rgba(30,90,168,0.22), transparent 70%)' }}
        />

        {/* Brand + search */}
        <div className={cn('relative pt-6 pb-4 transition-all', collapsed ? 'px-3' : 'px-5')}>
          <div className={cn('flex items-center gap-2.5 mb-6 pt-10 md:pt-0', collapsed && 'justify-center')}>
            <div className="w-9 h-9 shrink-0 rounded-xl bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-lg shadow-[0_8px_20px_-8px_rgba(30,90,168,0.9)]">
              V
            </div>
            {!collapsed && (
              <span className="font-serif font-bold text-lg text-zinc-50 tracking-tight whitespace-nowrap">Vanta</span>
            )}
          </div>

          {!collapsed && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder-white/35 focus:outline-none focus:border-white/20 focus:bg-white/6 transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/25 font-mono">
                ⌘K
              </span>
            </div>
          )}
        </div>

        {/* Main Nav Items */}
        <nav className={cn('relative space-y-0.5 transition-all', collapsed ? 'px-2.5' : 'px-3')}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              title={collapsed ? item.name : undefined}
              className={cn(
                'relative flex items-center py-2 text-sm rounded-lg transition-colors group',
                collapsed ? 'justify-center px-0' : 'px-3',
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebarActive"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-linear-to-r from-blue-500/15 to-transparent border border-white/10"
                    />
                  )}
                  <span className={cn('relative flex items-center', !collapsed && 'gap-3')}>
                    <item.icon
                      size={16}
                      className={cn('shrink-0 transition-colors', isActive ? 'text-[#8FBCEA]' : 'text-white/40 group-hover:text-white/75')}
                    />
                    {!collapsed && (
                      <span className={cn('whitespace-nowrap transition-colors', isActive ? 'font-medium text-zinc-50' : 'text-white/55 group-hover:text-white/85')}>
                        {item.name}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative mx-5 my-4 h-px bg-linear-to-r from-white/10 via-white/5 to-transparent" />

        {/* Chat history */}
        {!collapsed && (
          <div className="relative flex-1 overflow-y-auto px-3 pb-3">
            {filteredHistoryGroups.length === 0 ? (
              <div className="px-2 py-3 text-[13px] text-white/35">No chats match "{historyFilter}"</div>
            ) : (
              filteredHistoryGroups.map((group) => (
                <div key={group.label} className="mb-5">
                  <div className="px-2 mb-1.5 text-[11px] text-white/30 font-medium uppercase tracking-wide">{group.label}</div>
                  <div className="space-y-0.5">
                    {group.items.map((text) => (
                      <button
                        key={text}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-[13px] text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors truncate"
                        title={text}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {collapsed && <div className="flex-1" />}

        {/* Footer */}
        <div className={cn('relative py-4 border-t border-white/10 transition-all', collapsed ? 'px-2.5' : 'px-5')}>
          <button
            onClick={() => {
              localStorage.removeItem('vanta_auth_status');
              navigate('/');
            }}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'group w-full flex items-center justify-center rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/70 transition-all hover:border-[#8FBCEA]/40 hover:bg-white/10 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBCEA]/50',
              collapsed ? 'px-0' : 'gap-2 px-3',
            )}
          >
            <LogOut size={14} className="shrink-0 text-white/50 transition-colors group-hover:text-[#8FBCEA]" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col min-w-0 h-screen overflow-hidden pt-16 md:pt-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <Outlet context={{ setComposerFocused } satisfies AppShellContext} />
        </motion.div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
