import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, CalendarClock, Package, FolderLock, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SIDEBAR_SURFACE } from '../lib/surfaces';

const navItems = [
  { name: 'Home', path: '/app/chat', icon: Home },
  { name: 'Ledger', path: '/app/ledger', icon: BookOpen },
];

/**
 * Phase 2 pages — not built yet, shown as disabled entries so the nav
 * doesn't need a redesign when they land. Keep this list in one place;
 * turning one on later is just moving it into navItems with a real path.
 */
const comingSoonItems = [
  { name: 'Debtors & Creditors', icon: Users },
  { name: 'Tax Calendar', icon: CalendarClock },
  { name: 'Inventory', icon: Package },
  { name: 'Document Vault', icon: FolderLock },
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
  const [composerFocused, setComposerFocused] = useState(false);
  /** Desktop only: the sidebar narrows to an icon rail while the composer is active. */
  const collapsed = composerFocused;

  React.useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') !== 'signed_in') {
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <div className="h-screen flex font-sans text-vanta-black overflow-hidden relative isolate bg-white">
      {/* Mobile Header & Menu Toggle */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-vanta-border flex items-center justify-between px-4 z-50"
        style={{ background: SIDEBAR_SURFACE }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-vanta-navy text-white flex items-center justify-center font-serif font-semibold text-sm">
            V
          </div>
          <span className="font-serif text-lg text-vanta-black tracking-tight">Vanta</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="p-2 text-vanta-gray hover:text-vanta-black hover:bg-black/5 rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:sticky md:top-0 h-screen flex flex-col z-40 transition-all duration-300 ease-in-out md:transform-none shrink-0 border-r border-vanta-border',
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64',
          collapsed ? 'md:w-18' : 'md:w-64',
        )}
        style={{ background: SIDEBAR_SURFACE }}
      >
        {/* Brand */}
        <div className={cn('pt-6 pb-4 transition-all', collapsed ? 'px-3' : 'px-5')}>
          <div className={cn('flex items-center gap-2.5 pt-10 md:pt-0', collapsed && 'justify-center')}>
            <div className="w-9 h-9 shrink-0 rounded-full bg-vanta-navy text-white flex items-center justify-center font-serif font-semibold text-base">
              V
            </div>
            {!collapsed && (
              <span className="font-serif text-lg text-vanta-black tracking-tight whitespace-nowrap">Vanta</span>
            )}
          </div>
        </div>

        {/* Main Nav Items */}
        <nav className={cn('space-y-0.5 transition-all', collapsed ? 'px-2.5' : 'px-3')}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              title={collapsed ? item.name : undefined}
              className={cn(
                'relative flex items-center py-2.5 text-[13.5px] rounded-lg transition-colors group',
                collapsed ? 'justify-center px-0' : 'px-3.5',
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebarActive"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-[#E8F0FA]"
                    />
                  )}
                  <span className={cn('relative flex items-center', !collapsed && 'gap-3')}>
                    <item.icon
                      size={16}
                      className={cn('shrink-0 transition-colors', isActive ? 'text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black')}
                    />
                    {!collapsed && (
                      <span className={cn('whitespace-nowrap transition-colors', isActive ? 'font-semibold text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black')}>
                        {item.name}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <>
            <div className="mx-5 my-4 h-px bg-vanta-border" />
            <div className="px-3">
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-vanta-gray">
                Coming soon
              </div>
              <div className="space-y-0.5">
                {comingSoonItems.map((item) => (
                  <div
                    key={item.name}
                    title="Coming in a future update"
                    className="flex items-center gap-3 px-3.5 py-2.5 text-[13.5px] rounded-lg text-vanta-gray/60 cursor-not-allowed select-none"
                  >
                    <item.icon size={16} className="shrink-0" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Footer */}
        <div className={cn('py-4 border-t border-vanta-border transition-all', collapsed ? 'px-2.5' : 'px-5')}>
          <button
            onClick={() => {
              localStorage.removeItem('vanta_auth_status');
              navigate('/');
            }}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'group w-full flex items-center justify-center rounded-full border border-vanta-border bg-white py-2.5 text-[13px] font-medium text-vanta-gray transition-all hover:border-vanta-navy/30 hover:text-vanta-black active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vanta-navy/30',
              collapsed ? 'px-0' : 'gap-2 px-3',
            )}
          >
            <LogOut size={14} className="shrink-0 transition-colors" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col min-w-0 h-screen overflow-hidden pt-16 md:pt-0 bg-white">
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
