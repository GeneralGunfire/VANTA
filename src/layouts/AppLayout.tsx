import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, ScrollText, MessageCircleQuestion, Users, CalendarClock, Package, FolderLock, TrendingUp, FileText, FileCheck, Truck, History, HelpCircle, Menu, LogOut, Search, Building2, Trash2, ShieldCheck, PanelLeft, ChevronsUpDown, MoreHorizontal, ChevronDown, MessageSquare, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_SURFACE, SHADOW_MD, SHADOW_LG } from '../lib/surfaces';
import { useTransactions } from '../hooks/useTransactions';
import { useBusinessProfile } from '../hooks/useBusinessProfile';
import { useConversations } from '../hooks/useConversations';
import { needsReviewCount } from '../lib/metrics';
import { Badge } from '../components/ui/badge';
import { CommandPalette, useCommandPalette } from '../components/CommandPalette';
import { VantaLogo } from '../components/VantaLogo';

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

/**
 * The four most-used destinations stay directly on the rail so they never
 * scroll out of view; everything else lives behind "More", which is where
 * Recents needs the room. See AppLayout's render for how these two pieces
 * fit together — this isn't just a cosmetic split, it's what makes space
 * for the chat history list without turning the sidebar into a long menu.
 */
const CORE_ITEMS: NavItem[] = [
  { name: 'Home', path: '/app/chat', icon: Home },
  { name: 'Vanta Brief', path: '/app/brief', icon: ScrollText },
  { name: 'Ask Vanta', path: '/app/ask', icon: MessageCircleQuestion },
  { name: 'Ledger', path: '/app/ledger', icon: BookOpen },
];

const MORE_GROUPS: NavGroup[] = [
  {
    label: 'Money',
    items: [
      { name: 'Debtors & Creditors', path: '/app/debtors', icon: Users },
      { name: 'Invoices', path: '/app/invoices', icon: FileText },
    ],
  },
  {
    label: 'Business',
    items: [
      { name: 'Inventory', path: '/app/inventory', icon: Package },
      { name: 'Suppliers', path: '/app/suppliers', icon: Truck },
      { name: 'Business Record', path: '/app/business-record', icon: FileCheck },
      { name: 'Timeline', path: '/app/timeline', icon: History },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'What If', path: '/app/what-if', icon: HelpCircle },
      { name: 'Cashflow Forecast', path: '/app/forecast', icon: TrendingUp },
    ],
  },
  {
    label: 'Documents',
    items: [
      { name: 'Document Vault', path: '/app/documents', icon: FolderLock },
      { name: 'Tax Calendar', path: '/app/tax-calendar', icon: CalendarClock },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Business Profile', path: '/app/business-profile', icon: Building2 },
      { name: 'Data & Privacy', path: '/app/data-privacy', icon: ShieldCheck },
      { name: 'Recently Deleted', path: '/app/recently-deleted', icon: Trash2 },
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
  /** Starts minimized on every fresh sign-in; a deliberate click on the toggle flips it, independent of composer focus. */
  const [manuallyCollapsed, setManuallyCollapsed] = useState(true);
  /** Desktop only: the sidebar narrows to an icon rail either by choice or while the composer is active. */
  const collapsed = manuallyCollapsed || composerFocused;
  /** The desktop icon-rail treatment must never apply to the mobile drawer — it always shows full content when open. */
  const iconOnly = collapsed && !isMobileMenuOpen;
  const [moreOpen, setMoreOpen] = useState(false);

  const { transactions } = useTransactions();
  const reviewCount = needsReviewCount(transactions);
  const { profile } = useBusinessProfile();
  const businessName = profile?.business_name?.trim() || 'My business';
  const businessInitial = businessName.charAt(0).toUpperCase();
  const { conversations, deleteConversation } = useConversations();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const palette = useCommandPalette();

  React.useEffect(() => {
    if (localStorage.getItem('vanta_auth_status') !== 'signed_in') {
      navigate('/auth');
    }
  }, [navigate]);

  // Click-outside / Escape close for the profile menu — same convention as the mobile nav overlay.
  useEffect(() => {
    if (!profileMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [profileMenuOpen]);

  return (
    <div className="h-screen flex font-sans text-vanta-black overflow-hidden relative isolate" style={{ background: APP_SURFACE }}>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />

      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-vanta-border bg-white flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5">
          <VantaLogo size={28} className="shrink-0" />
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
          iconOnly ? 'md:w-[76px]' : 'md:w-64',
        )}
      >
        <div className={cn('flex flex-col h-full transition-all', iconOnly ? 'p-2' : 'p-3')}>
          <div
            className="flex flex-col h-full rounded-2xl border border-vanta-border bg-white"
            style={{ boxShadow: SHADOW_MD }}
          >
            {/* Brand */}
            <div className={cn('pt-5 pb-3 transition-all', iconOnly ? 'px-3' : 'px-4')}>
              <div className={cn('flex items-center pt-10 md:pt-0', iconOnly ? 'flex-col gap-3' : 'gap-2.5 justify-between')}>
                <div className={cn('flex items-center gap-2.5 min-w-0', iconOnly && 'justify-center')}>
                  <VantaLogo size={32} className="shrink-0" />
                  {!iconOnly && (
                    <span className="text-[15px] font-semibold text-vanta-black tracking-tight whitespace-nowrap">Vanta</span>
                  )}
                </div>
                <button
                  onClick={() => setManuallyCollapsed((v) => !v)}
                  title={iconOnly ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-vanta-gray-light hover:text-vanta-black hover:bg-muted transition-colors duration-150 shrink-0"
                >
                  <PanelLeft size={15} />
                </button>
              </div>
            </div>

            {/* Command palette trigger */}
            <div className={cn('pb-3 transition-all', iconOnly ? 'px-3' : 'px-3')}>
              <button
                onClick={() => palette.setOpen(true)}
                title={iconOnly ? 'Search or jump to…' : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg border border-vanta-border bg-vanta-sidebar py-2 text-[13px] text-vanta-gray-light transition-colors duration-150 hover:border-vanta-border-strong hover:text-vanta-black',
                  iconOnly ? 'justify-center px-0' : 'justify-between px-3',
                )}
              >
                <span className="flex items-center gap-2">
                  <Search size={14} className="shrink-0" />
                  {!iconOnly && <span>Search</span>}
                </span>
                {!iconOnly && (
                  <span className="text-[11px] font-mono text-vanta-gray-light bg-white border border-vanta-border rounded px-1.5 py-0.5">
                    ⌘K
                  </span>
                )}
              </button>
            </div>

            {/* Core — always visible, never scrolls out of reach */}
            <nav className={cn('space-y-0.5 transition-all', iconOnly ? 'px-2' : 'px-2')}>
              {CORE_ITEMS.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/app/chat'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={iconOnly ? item.name : undefined}
                  className={cn(
                    'relative flex items-center h-10 text-sm rounded-lg transition-colors duration-150 group',
                    iconOnly ? 'justify-center px-0' : 'px-2.5',
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
                      <span className={cn('relative flex items-center flex-1', !iconOnly && 'gap-2.5')}>
                        <span
                          className={cn(
                            'w-4.5 h-4.5 flex items-center justify-center shrink-0 transition-colors',
                            isActive ? 'text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black',
                          )}
                        >
                          <item.icon size={18} />
                        </span>
                        {!iconOnly && (
                          <span
                            className={cn(
                              'whitespace-nowrap transition-colors flex-1',
                              isActive ? 'font-medium text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black',
                            )}
                          >
                            {item.name}
                          </span>
                        )}
                        {!iconOnly && item.name === 'Ledger' && reviewCount > 0 && (
                          <Badge variant="secondary" className="relative ml-auto">
                            {reviewCount}
                          </Badge>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Recents + More — hidden on the icon rail; this is the room that
                collapsing everything else by default was for. Recents scrolls
                in its own region; More stays put below it, not carried away
                by that scroll. */}
            <div className="flex-1 min-h-0 flex flex-col">
              {!iconOnly && (
                <>
                  <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="flex items-center justify-between px-3.5 mb-1.5 mt-5">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-vanta-gray-light">Recents</span>
                    <button
                      onClick={() => { navigate('/app/chat'); setIsMobileMenuOpen(false); }}
                      title="New chat"
                      className="p-1 rounded-md text-vanta-gray-light hover:text-vanta-black hover:bg-muted transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="px-2 space-y-0.5 mb-2">
                    {conversations.length === 0 ? (
                      <p className="px-2.5 py-1.5 text-[12px] text-vanta-gray-light leading-relaxed">
                        Your recent conversations will show up here.
                      </p>
                    ) : (
                      conversations.map((c) => {
                        const path = `/app/chat/${c.id}`;
                        const isActive = location.pathname === path;
                        return (
                          <div key={c.id} className="group relative">
                            <NavLink
                              to={path}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-2.5 h-9 pl-2.5 pr-7 rounded-lg text-[13px] transition-colors duration-150',
                                isActive ? 'bg-accent text-vanta-navy font-medium' : 'text-vanta-gray hover:text-vanta-black hover:bg-muted',
                              )}
                            >
                              <MessageSquare size={15} className="shrink-0" />
                              <span className="truncate">{c.title}</span>
                            </NavLink>
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  await deleteConversation(c.id);
                                  if (isActive) navigate('/app/chat');
                                } catch (err: any) {
                                  console.error('Error deleting conversation:', err);
                                }
                              }}
                              aria-label="Delete conversation"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-vanta-gray-light opacity-0 group-hover:opacity-100 hover:text-vanta-black hover:bg-white transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                  </div>

                  {/* Pinned below the Recents scroll region — stays in view regardless of how far Recents scrolls. */}
                  <div className="shrink-0 border-t border-vanta-border pt-1">
                    <button
                      onClick={() => setMoreOpen((v) => !v)}
                      className="w-full flex items-center justify-between gap-2 px-3.5 h-9 rounded-lg text-[13px] font-medium text-vanta-gray hover:text-vanta-black hover:bg-muted transition-colors duration-150 mb-1"
                    >
                      <span className="flex items-center gap-2.5">
                        <MoreHorizontal size={16} />
                        More
                      </span>
                      <ChevronDown size={14} className={cn('transition-transform duration-150', moreOpen && 'rotate-180')} />
                    </button>

                    <AnimatePresence initial={false}>
                      {moreOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-y-auto max-h-70"
                        >
                        {MORE_GROUPS.map((group) => (
                          <div key={group.label} className="mb-1">
                            <div className="px-3.5 mb-1.5 mt-4 text-[11px] font-medium uppercase tracking-wider text-vanta-gray-light">
                              {group.label}
                            </div>
                            <nav className="px-2 space-y-0.5">
                              {group.items.map((item) => (
                                <NavLink
                                  key={item.name}
                                  to={item.path}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="relative flex items-center gap-2.5 h-10 px-2.5 text-sm rounded-lg transition-colors duration-150 group"
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
                                      <span className={cn('relative w-4.5 h-4.5 flex items-center justify-center shrink-0 transition-colors', isActive ? 'text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black')}>
                                        <item.icon size={18} />
                                      </span>
                                      <span className={cn('relative whitespace-nowrap transition-colors flex-1', isActive ? 'font-medium text-vanta-navy' : 'text-vanta-gray group-hover:text-vanta-black')}>
                                        {item.name}
                                      </span>
                                    </>
                                  )}
                                </NavLink>
                              ))}
                            </nav>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            {/* Footer — a profile chip, not a bare sign-out button. Sign out lives inside its menu. */}
            <div ref={profileMenuRef} className={cn('relative py-3 border-t border-vanta-border transition-all', iconOnly ? 'px-2' : 'px-3')}>
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={iconOnly ? { opacity: 0, x: -4, scale: 0.98 } : { opacity: 0, y: 4, scale: 0.98 }}
                    animate={iconOnly ? { opacity: 1, x: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    exit={iconOnly ? { opacity: 0, x: -4, scale: 0.98 } : { opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className={cn(
                      'absolute w-48 rounded-xl border border-vanta-border bg-white p-1.5 z-10',
                      // Collapsed rail: flies out to the side of the avatar, the
                      // standard collapsed-sidebar pattern, instead of stacking
                      // above a narrow 76px column where text has no room.
                      iconOnly ? 'left-full ml-2 bottom-0' : 'bottom-full mb-2 left-3 right-3 w-auto',
                    )}
                    style={{ boxShadow: SHADOW_LG }}
                  >
                    <NavLink
                      to="/app/business-profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-vanta-black hover:bg-muted transition-colors"
                    >
                      <Building2 size={14} className="text-vanta-gray shrink-0" />
                      Business profile
                    </NavLink>
                    <button
                      onClick={() => {
                        localStorage.removeItem('vanta_auth_status');
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-vanta-black hover:bg-muted transition-colors"
                    >
                      <LogOut size={14} className="text-vanta-gray shrink-0" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                title={iconOnly ? businessName : undefined}
                className={cn(
                  'w-full flex items-center rounded-lg transition-colors duration-150 hover:bg-muted active:scale-[0.98]',
                  iconOnly ? 'justify-center py-1.5 px-0' : 'gap-2.5 px-2 py-1.5',
                )}
              >
                <span className="w-7 h-7 rounded-full bg-vanta-accent-tint text-vanta-navy text-[12px] font-semibold flex items-center justify-center shrink-0">
                  {businessInitial}
                </span>
                {!iconOnly && (
                  <>
                    <span className="text-[13px] font-medium text-vanta-black truncate flex-1 text-left">{businessName}</span>
                    <ChevronsUpDown size={13} className="text-vanta-gray-light shrink-0" />
                  </>
                )}
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
