import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutTemplate, Compass, History, Wallet, Search, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SIDEBAR_SURFACE } from '../lib/surfaces';
import { MarbleBackground } from '../components/ui/marble-background';

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
    <div className="h-screen flex font-sans text-[#26282B] overflow-hidden relative isolate">
      <MarbleBackground />

      {/* Mobile Header & Menu Toggle */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50"
        style={{ background: SIDEBAR_SURFACE }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#EDEDEE] text-[#26282B] flex items-center justify-center font-serif font-semibold text-sm">
            V
          </div>
          <span className="font-serif text-lg text-white tracking-tight">Vanta</span>
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
        <div className="absolute inset-0 shadow-[8px_0_30px_-12px_rgba(0,0,0,0.35)]" style={{ background: SIDEBAR_SURFACE }} />

        {/* Brand + search */}
        <div className={cn('relative pt-6 pb-4 transition-all', collapsed ? 'px-3' : 'px-5')}>
          <div className={cn('flex items-center gap-2.5 mb-6 pt-10 md:pt-0', collapsed && 'justify-center')}>
            <div className="w-9 h-9 shrink-0 rounded-full bg-[#EDEDEE] text-[#26282B] flex items-center justify-center font-serif font-semibold text-base">
              V
            </div>
            {!collapsed && (
              <span className="font-serif text-lg text-white tracking-tight whitespace-nowrap">Vanta</span>
            )}
          </div>

          {!collapsed && (
            <div className="relative group/search">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 transition-colors group-focus-within/search:text-white/70" />
              <input
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-white/8 border border-white/10 rounded-full pl-8 pr-8 py-2 text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-white/25 focus:bg-white/14 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-all"
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
                'relative flex items-center py-2 text-[13.5px] rounded-full transition-colors group',
                collapsed ? 'justify-center px-0' : 'px-3.5',
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebarActive"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_8px_-2px_rgba(0,0,0,0.3)]"
                    />
                  )}
                  <span className={cn('relative flex items-center', !collapsed && 'gap-3')}>
                    <item.icon
                      size={16}
                      className={cn('shrink-0 transition-colors', isActive ? 'text-white' : 'text-white/45 group-hover:text-white/75')}
                    />
                    {!collapsed && (
                      <span className={cn('whitespace-nowrap transition-colors', isActive ? 'font-medium text-white' : 'text-white/60 group-hover:text-white/85')}>
                        {item.name}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative mx-5 my-4 h-px bg-white/10" />

        {/* Chat history */}
        {!collapsed && (
          <div className="relative flex-1 overflow-y-auto px-3 pb-3">
            {filteredHistoryGroups.length === 0 ? (
              <div className="px-2 py-3 text-[13px] text-white/40">No chats match "{historyFilter}"</div>
            ) : (
              filteredHistoryGroups.map((group) => (
                <div key={group.label} className="mb-5">
                  <div className="px-2 mb-1.5 text-[12px] text-white/40">{group.label}</div>
                  <div className="space-y-0.5">
                    {group.items.map((text) => (
                      <button
                        key={text}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-[13px] text-white/60 hover:text-white hover:bg-white/8 transition-colors truncate"
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
              'group w-full flex items-center justify-center rounded-full border border-white/10 bg-white/8 py-2.5 text-[13px] font-medium text-white/75 transition-all hover:bg-white/14 hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
              collapsed ? 'px-0' : 'gap-2 px-3',
            )}
          >
            <LogOut size={14} className="shrink-0 text-white/55 transition-colors group-hover:text-white" />
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
