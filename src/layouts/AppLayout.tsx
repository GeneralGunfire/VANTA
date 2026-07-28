import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, BookOpen, Settings, HelpCircle, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ConfigModal from '../components/ConfigModal';
import SecurityModal from '../components/SecurityModal';
import { APP_SURFACE, SIDEBAR_SURFACE } from '../lib/surfaces';

/** Shared with routed children via <Outlet context>. */
export interface AppShellContext {
  /** Collapses the sidebar while the chat composer is active, for a focused write. */
  setComposerFocused: (focused: boolean) => void;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  /** Desktop only: the sidebar narrows to an icon rail while the composer is active. */
  const collapsed = composerFocused;

  // Check auth
  React.useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') !== 'signed_in') {
      navigate('/auth');
    }
  }, [navigate]);

  const navItems = [
    { name: 'Chat', path: '/app/chat', icon: MessageSquare },
    { name: 'Ledger', path: '/app/ledger', icon: BookOpen },
  ];

  return (
    <div
      className="h-screen flex font-sans text-zinc-100 overflow-hidden relative isolate"
      style={{ background: APP_SURFACE }}
    >
      {/* Config & Security Popups */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />

      {/* Mobile Header & Menu Toggle */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50"
        style={{ background: SIDEBAR_SURFACE }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-sm rounded-lg">
            V
          </div>
          <span className="font-serif font-bold text-lg text-zinc-50">Vanta</span>
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
      <div className={cn(
        "fixed md:sticky md:top-0 h-screen w-64 flex flex-col z-40 transition-all duration-300 ease-in-out md:transform-none shrink-0 border-r border-white/10",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-19" : "md:w-72",
      )}>
        <div className="absolute inset-0" style={{ background: SIDEBAR_SURFACE }} />
        {/* Ambient wash so the panel isn't a flat block */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 30% at 0% 0%, rgba(30,90,168,0.22), transparent 70%)',
          }}
        />

        {/* Brand */}
        <div className={cn('relative hidden md:block pt-7 pb-6 transition-all', collapsed ? 'px-4' : 'px-6')}>
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-10 h-10 shrink-0 bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-xl rounded-xl shadow-[0_8px_20px_-8px_rgba(30,90,168,0.9)]">
              V
            </div>
            {!collapsed && (
              <div className="font-serif font-bold text-xl text-zinc-50 leading-tight whitespace-nowrap">Vanta</div>
            )}
          </div>
        </div>

        {/* Main Nav Items */}
        <div className={cn('relative flex-1 overflow-y-auto py-6 pt-20 md:pt-0 transition-all', collapsed ? 'px-3' : 'px-4')}>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'relative flex items-center py-2.5 text-sm rounded-xl transition-colors group',
                  collapsed ? 'justify-center px-0' : 'px-3.5',
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebarActive"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute inset-0 rounded-xl bg-white/10 border border-white/15"
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="sidebarRail"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-full bg-[#8FBCEA] shadow-[0_0_10px_rgba(143,188,234,0.9)]"
                      />
                    )}
                    <span className={cn('relative flex items-center', !collapsed && 'gap-3.5')}>
                      <item.icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-[#8FBCEA]' : 'text-white/45 group-hover:text-white/80',
                        )}
                      />
                      {!collapsed && (
                        <span
                          className={cn(
                            'whitespace-nowrap transition-colors',
                            isActive ? 'font-semibold text-zinc-50' : 'font-medium text-white/60 group-hover:text-white/90',
                          )}
                        >
                          {item.name}
                        </span>
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* System Section */}
          {collapsed ? (
            <div className="mt-8 mb-3 mx-auto h-px w-6 bg-white/15" />
          ) : (
            <div className="mt-8 mb-3 px-3.5 text-[10px] uppercase tracking-[0.18em] text-white/30 font-bold">
              System
            </div>
          )}
          <nav className="space-y-1">
            <button
              onClick={() => { setIsConfigOpen(true); setIsMobileMenuOpen(false); }}
              title={collapsed ? 'Config' : undefined}
              className={cn(
                'w-full flex items-center py-2.5 text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl transition-colors group',
                collapsed ? 'justify-center px-0' : 'gap-3.5 px-3.5 text-left',
              )}
            >
              <Settings size={18} className="shrink-0 text-white/45 group-hover:text-white/80 group-hover:rotate-45 transition-all duration-300" />
              {!collapsed && <span className="whitespace-nowrap">Config</span>}
            </button>
            <button
              onClick={() => { setIsSecurityOpen(true); setIsMobileMenuOpen(false); }}
              title={collapsed ? 'Security' : undefined}
              className={cn(
                'w-full flex items-center py-2.5 text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl transition-colors group',
                collapsed ? 'justify-center px-0' : 'gap-3.5 px-3.5 text-left',
              )}
            >
              <HelpCircle size={18} className="shrink-0 text-white/45 group-hover:text-white/80 transition-colors" />
              {!collapsed && <span className="whitespace-nowrap">Security</span>}
            </button>
          </nav>
        </div>

        {/* Sign Out */}
        <div className={cn('relative pb-6 pt-4 border-t border-white/10 transition-all', collapsed ? 'px-3' : 'px-4')}>
          <button
            onClick={() => {
              localStorage.removeItem('vanta_auth_status');
              navigate('/');
            }}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'group w-full flex items-center justify-center py-3 text-sm font-semibold text-white/80 bg-white/6 hover:bg-white/12 border border-white/12 hover:border-[#8FBCEA]/40 rounded-xl transition-all hover:text-white active:scale-[0.98] hover:shadow-[0_8px_22px_-10px_rgba(30,90,168,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBCEA]/50',
              collapsed ? 'px-0' : 'gap-2.5 px-3.5',
            )}
          >
            <LogOut size={17} className="shrink-0 text-white/55 group-hover:text-[#8FBCEA] transition-colors" />
            {!collapsed && <span className="whitespace-nowrap">Sign out</span>}
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
