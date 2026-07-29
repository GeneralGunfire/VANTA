import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutTemplate, Compass, History, Wallet, Search, Menu, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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
      style={{ background: 'radial-gradient(ellipse 90% 70% at 22% 20%, #0B1428 0%, #060A16 45%, #04060D 100%)' }}
    >
      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 z-50 bg-[#060A16]/90">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">
            A
          </div>
          <span className="font-semibold text-lg text-zinc-50">Axora</span>
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
        <div className="absolute inset-0 bg-white/1.5 backdrop-blur-sm border-r border-white/6" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 0% 0%, rgba(45,120,255,0.08), transparent 70%)' }}
        />

        {/* Brand + search */}
        <div className={cn('relative pt-6 pb-4 transition-all', collapsed ? 'px-3' : 'px-5')}>
          <div className={cn('flex items-center gap-2.5 mb-6 pt-10 md:pt-0', collapsed && 'justify-center')}>
            <div
              className="w-7 h-7 shrink-0 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
            >
              A
            </div>
            {!collapsed && <span className="font-semibold text-[15px] text-zinc-50 tracking-tight whitespace-nowrap">Axora</span>}
          </div>

          {!collapsed && (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-white/4 border border-white/8 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder-white/35 focus:outline-none focus:border-white/20 focus:bg-white/6 transition-colors"
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
                      className={cn('shrink-0 transition-colors', isActive ? 'text-[#6EA8FF]' : 'text-white/40 group-hover:text-white/75')}
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
        <div className={cn('relative py-4 border-t border-white/6 transition-all', collapsed ? 'px-2.5' : 'px-5')}>
          <button
            onClick={() => {
              localStorage.removeItem('vanta_auth_status');
              navigate('/');
            }}
            title={collapsed ? 'Visit site' : undefined}
            className={cn(
              'flex items-center text-xs text-white/45 hover:text-white/85 transition-colors',
              collapsed ? 'justify-center w-full' : 'gap-1.5',
            )}
          >
            {!collapsed && 'Visit site'}
            <ExternalLink size={12} />
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
