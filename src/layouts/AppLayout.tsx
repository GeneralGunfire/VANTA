import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, BookOpen, Settings, HelpCircle, Menu, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ConfigModal from '../components/ConfigModal';
import SecurityModal from '../components/SecurityModal';

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
    <div className="h-screen flex bg-vanta-bg font-sans text-vanta-black overflow-hidden relative">
      {/* Config & Security Popups */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} />

      {/* Shared atmospheric backdrop so the sidebar and content read as one canvas, not two blocks */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 0% 0%, rgba(30,90,168,0.05), transparent 70%)' }}
      />

      {/* Mobile Header & Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-vanta-bg/95 backdrop-blur-sm border-b border-vanta-border/60 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-sm rounded-sm">
            V
          </div>
          <span className="font-serif font-bold text-lg text-vanta-navy">Vanta</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-vanta-navy hover:bg-vanta-sidebar rounded-sm transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar — shares the main content's backdrop, but a bold side line and outlined details keep it a distinct panel */}
      <div className={cn(
        "fixed md:sticky md:top-0 h-screen w-64 md:w-72 flex flex-col z-40 transition-transform duration-300 ease-in-out md:transform-none shrink-0 border-r-2 border-vanta-border",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="absolute inset-0 bg-vanta-bg md:bg-transparent" />
        {/* Brand */}
        <div className="relative p-8 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vanta-navy text-white flex items-center justify-center font-serif font-bold text-xl rounded-lg border-2 border-vanta-navy-dark shadow-md">
              V
            </div>
            <div className="font-serif font-bold text-xl text-vanta-navy leading-tight">Vanta</div>
          </div>
        </div>

        {/* Main Nav Items */}
        <div className="relative flex-1 overflow-y-auto px-5 py-6 pt-20 md:pt-2">
          <nav className="space-y-1.5 mb-8">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center justify-between px-3.5 py-3 text-sm font-medium rounded-full transition-all relative group border-2",
                  isActive
                    ? "bg-vanta-sidebar text-vanta-navy font-bold border-vanta-navy/25 shadow-[0_1px_2px_rgba(28,28,28,0.05)]"
                    : "border-transparent text-vanta-gray hover:text-vanta-navy hover:border-vanta-border"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <item.icon size={19} className="transition-transform group-hover:scale-105 text-vanta-navy" />
                  <span>{item.name}</span>
                </div>
                {location.pathname === item.path && (
                  <motion.span
                    layoutId="sidebarActiveDot"
                    className="w-2 h-2 rounded-full bg-vanta-navy shadow-xs"
                  />
                )}
              </NavLink>
            ))}
          </nav>

          {/* System Section */}
          <div className="text-[10px] uppercase tracking-widest text-vanta-gray mb-4 px-2 font-bold border-t-2 border-vanta-border pt-5">System</div>
          <nav className="space-y-1.5">
            <button
              onClick={() => { setIsConfigOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 text-sm font-medium text-vanta-gray hover:text-vanta-navy rounded-full transition-all text-left group border-2 border-transparent hover:border-vanta-border"
            >
              <Settings size={19} className="group-hover:rotate-45 transition-transform duration-300 text-vanta-navy" />
              <span>Config</span>
            </button>
            <button
              onClick={() => { setIsSecurityOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 text-sm font-medium text-vanta-gray hover:text-vanta-navy rounded-full transition-all text-left group border-2 border-transparent hover:border-vanta-border"
            >
              <HelpCircle size={19} className="group-hover:scale-110 transition-transform text-vanta-navy" />
              <span>Security</span>
            </button>
          </nav>
        </div>

        {/* Sign Out */}
        <div className="relative p-6 flex items-center justify-end border-t-2 border-vanta-border">
          <button
            onClick={() => {
              localStorage.removeItem('vanta_auth_status');
              navigate('/');
            }}
            title="Sign Out"
            className="flex items-center gap-2 text-vanta-gray hover:text-vanta-navy px-3.5 py-2 transition-colors rounded-full border-2 border-transparent hover:border-vanta-border text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={16} />
            Sign Out
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
