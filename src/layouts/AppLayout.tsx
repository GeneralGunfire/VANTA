import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, CalendarClock, Package, FolderLock, TrendingUp, FileText, FileCheck, Truck, History, HelpCircle, Menu, LogOut, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_SURFACE, SHADOW_MD } from '../lib/surfaces';
import { useTransactions } from '../hooks/useTransactions';
import { needsReviewCount } from '../lib/metrics';
import { Badge } from '../components/ui/badge';
import { CommandPalette, useCommandPalette } from '../components/CommandPalette';

interface NavItem {
  name: string;
  path: string;
  icon: typeof Home;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  disabled?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Home', path: '/app/chat', icon: Home },
      { name: 'Ledger', path: '/app/ledger', icon: BookOpen },
      { name: 'Forecast', path: '/app/forecast', icon: TrendingUp },
      { name: 'Debtors & Creditors', path: '/app/debtors', icon: Users },
      { name: 'Invoices', path: '/app/invoices', icon: FileText },
      { name: 'Tax Calendar', path: '/app/tax-calendar', icon: CalendarClock },
      { name: 'Inventory', path: '/app/inventory', icon: Package },
      { name: 'Suppliers', path: '/app/suppliers', icon: Truck },
      { name: 'Timeline', path: '/app/timeline', icon: History },
      { name: 'What If', path: '/app/what-if', icon: HelpCircle },
      { name: 'Document Vault', path: '/app/documents', icon: FolderLock },
      { name: 'Business Record', path: '/app/business-record', icon: FileCheck },
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
  const [composerFocused, setComposerFocused] = useState(false);
  /** Desktop only: the sidebar narrows to an icon rail while the composer is active. */
  const collapsed = composerFocused;

  const { transactions } = useTransactions();
  const reviewCount = needsReviewCount(transactions);

  const palette = useCommandPalette();

  React.useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') !== 'signed_in') {
      navigate('/auth');
    }
  }, [navigate]);

  return (
    <div className="h-screen flex font-sans text-vanta-black overflow-hidden relative isolate" style={{ background: APP_SURFACE }}>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />

      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-vanta-border bg-white flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-vanta-navy text-white flex items-center justify-center font-semibold text-sm">
            V
          </div>
          <span className="text-[15px] font-semibold text-vanta-black tracking-tight">Vanta</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="p-2 text-vanta-gray hover:text-vanta-black hover:bg-muted rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar — floats slightly off the canvas with its own elevation */}
      <div
        className={cn(
          'fixed md:sticky md:top-0 h-screen flex flex-col z-40 transition-all duration-200 ease-out md:transform-none shrink-0',
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
        )}
      >
        <div className={cn('flex flex-col h-full transition-all', collapsed ? 'p-2' : 'p-3')}>
          <div
            className="flex flex-col h-full rounded-2xl border border-vanta-border bg-white overflow-hidden"
            style={{ boxShadow: SHADOW_MD }}
          >
            {/* Brand */}
            <div className={cn('pt-5 pb-3 transition-all', collapsed ? 'px-3' : 'px-4')}>
              <div className={cn('flex items-center gap-2.5 pt-10 md:pt-0', collapsed && 'justify-center')}>
                <div className="w-8 h-8 shrink-0 rounded-lg bg-vanta-navy text-white flex items-center justify-center font-semibold text-sm">
                  V
                </div>
                {!collapsed && (
                  <span className="text-[15px] font-semibold text-vanta-black tracking-tight whitespace-nowrap">Vanta</span>
                )}
              </div>
            </div>

            {/* Command palette trigger */}
            <div className={cn('pb-3 transition-all', collapsed ? 'px-3' : 'px-3')}>
              <button
                onClick={() => palette.setOpen(true)}
                title={collapsed ? 'Search or jump to…' : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg border border-vanta-border bg-[#FAFAFB] py-2 text-[13px] text-vanta-gray transition-colors duration-150 hover:border-vanta-border-strong hover:text-vanta-black',
                  collapsed ? 'justify-center px-0' : 'justify-between px-3',
                )}
              >
                <span className="flex items-center gap-2">
                  <Search size={14} className="shrink-0" />
                  {!collapsed && <span>Search</span>}
                </span>
                {!collapsed && (
                  <span className="text-[11px] font-mono text-vanta-gray-light bg-white border border-vanta-border rounded px-1.5 py-0.5">
                    ⌘K
                  </span>
                )}
              </button>
            </div>

            {/* Nav groups */}
            <div className="flex-1 overflow-y-auto">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="mb-1">
                  {!collapsed && (
                    <div className="px-3.5 mb-1.5 mt-3 text-[11px] font-medium uppercase tracking-wider text-vanta-gray-light">
                      {group.label}
                    </div>
                  )}
                  <nav className={cn('space-y-0.5 transition-all', collapsed ? 'px-2' : 'px-2')}>
                    {group.items.map((item) =>
                      group.disabled ? (
                        <div
                          key={item.name}
                          title="Coming in a future update"
                          className={cn(
                            'flex items-center py-2 text-[13.5px] rounded-lg text-vanta-gray-light cursor-not-allowed select-none',
                            collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                          )}
                        >
                          <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                            <item.icon size={15} />
                          </span>
                          {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                        </div>
                      ) : (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          title={collapsed ? item.name : undefined}
                          className={cn(
                            'relative flex items-center py-2 text-[13.5px] rounded-lg transition-colors duration-150 group',
                            collapsed ? 'justify-center px-0' : 'px-2.5',
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="sidebarActive"
                                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                                  className="absolute inset-0 rounded-lg bg-accent"
                                />
                              )}
                              {isActive && (
                                <motion.span
                                  layoutId="sidebarActiveRail"
                                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                                  className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-vanta-navy"
                                />
                              )}
                              <span className={cn('relative flex items-center flex-1', !collapsed && 'gap-2.5')}>
                                <span
                                  className={cn(
                                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors',
                                    isActive ? 'text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black',
                                  )}
                                >
                                  <item.icon size={15} />
                                </span>
                                {!collapsed && (
                                  <span
                                    className={cn(
                                      'whitespace-nowrap transition-colors flex-1',
                                      isActive ? 'font-medium text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black',
                                    )}
                                  >
                                    {item.name}
                                  </span>
                                )}
                                {!collapsed && item.name === 'Ledger' && reviewCount > 0 && (
                                  <Badge variant="secondary" className="relative ml-auto">
                                    {reviewCount}
                                  </Badge>
                                )}
                              </span>
                            </>
                          )}
                        </NavLink>
                      ),
                    )}
                  </nav>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={cn('py-3 border-t border-vanta-border transition-all', collapsed ? 'px-2' : 'px-3')}>
              <button
                onClick={() => {
                  localStorage.removeItem('vanta_auth_status');
                  navigate('/');
                }}
                title={collapsed ? 'Sign out' : undefined}
                className={cn(
                  'group w-full flex items-center justify-center rounded-lg text-[13px] font-medium text-vanta-gray transition-colors duration-150 hover:bg-muted hover:text-vanta-black active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vanta-navy/30',
                  collapsed ? 'px-0 py-2' : 'gap-2 px-2.5 py-2',
                )}
              >
                <LogOut size={14} className="shrink-0 transition-colors" />
                {!collapsed && <span>Sign out</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col min-w-0 h-screen overflow-hidden pt-16 md:pt-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
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
