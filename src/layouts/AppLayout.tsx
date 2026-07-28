import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, BookOpen, Settings, HelpCircle, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ConfigModal from '../components/ConfigModal';
import SecurityModal from '../components/SecurityModal';
import { SIDEBAR_SURFACE } from '../lib/surfaces';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

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
    <div className="h-screen flex bg-vanta-bg font-sans text-vanta-black overflow-hidden relative isolate">
      {/* Config & Security Popups */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />

      {/* Shared atmospheric backdrop so the sidebar and content read as one canvas, not two blocks.
          Layered tints keep the shell off-white so white cards and the composer glow read against it. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: 'linear-gradient(180deg, #F4F7FB 0%, #FAFCFE 45%, #F7F9FC 100%)' }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 0% 0%, rgba(30,90,168,0.07), transparent 70%), radial-gradient(ellipse 45% 40% at 100% 100%, rgba(30,90,168,0.05), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(#DCE3EC 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

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
        "fixed md:sticky md:top-0 h-screen w-64 md:w-72 flex flex-col z-40 transition-transform duration-300 ease-in-out md:transform-none shrink-0 border-r border-white/10",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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
        <div className="relative hidden md:block px-6 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-xl rounded-xl shadow-[0_8px_20px_-8px_rgba(30,90,168,0.9)]">
              V
            </div>
            <div className="font-serif font-bold text-xl text-zinc-50 leading-tight">Vanta</div>
          </div>
        </div>

        {/* Main Nav Items */}
        <div className="relative flex-1 overflow-y-auto px-4 py-6 pt-20 md:pt-0">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative flex items-center px-3.5 py-2.5 text-sm rounded-xl transition-colors group"
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
                    <span className="relative flex items-center gap-3.5">
                      <item.icon
                        size={18}
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-[#8FBCEA]' : 'text-white/45 group-hover:text-white/80',
                        )}
                      />
                      <span
                        className={cn(
                          'transition-colors',
                          isActive ? 'font-semibold text-zinc-50' : 'font-medium text-white/60 group-hover:text-white/90',
                        )}
                      >
                        {item.name}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* System Section */}
          <div className="mt-8 mb-3 px-3.5 text-[10px] uppercase tracking-[0.18em] text-white/30 font-bold">
            System
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => { setIsConfigOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl transition-colors text-left group"
            >
              <Settings size={18} className="text-white/45 group-hover:text-white/80 group-hover:rotate-45 transition-all duration-300" />
              <span>Config</span>
            </button>
            <button
              onClick={() => { setIsSecurityOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 rounded-xl transition-colors text-left group"
            >
              <HelpCircle size={18} className="text-white/45 group-hover:text-white/80 transition-colors" />
              <span>Security</span>
            </button>
          </nav>
        </div>

        {/* Sign Out */}
        <div className="relative px-4 pb-6 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('vanta_auth_status');
              navigate('/');
            }}
            className="group w-full flex items-center justify-center gap-2.5 px-3.5 py-3 text-sm font-semibold text-white/80 bg-white/6 hover:bg-white/12 border border-white/12 hover:border-[#8FBCEA]/40 rounded-xl transition-all hover:text-white active:scale-[0.98] hover:shadow-[0_8px_22px_-10px_rgba(30,90,168,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FBCEA]/50"
          >
            <LogOut size={17} className="text-white/55 group-hover:text-[#8FBCEA] transition-colors" />
            <span>Sign out</span>
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
          <Outlet />
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
