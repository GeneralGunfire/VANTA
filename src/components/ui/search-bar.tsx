import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const GooeyFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
    <defs>
      <filter id="gooey-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
);

interface SearchBarProps {
  placeholder?: string;
  /** Static suggestion list to filter against, e.g. transaction categories. */
  suggestions?: string[];
  /** Fires on every keystroke — use this for live filtering. */
  onChange?: (query: string) => void;
  /** Fires on submit or when a suggestion is picked. */
  onSearch?: (query: string) => void;
}

const SearchBar = ({ placeholder = 'Search...', suggestions: suggestionSource = [], onChange, onSearch }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isClicked, setIsClicked] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const isUnsupportedBrowser = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
    const isChromeOniOS = ua.includes('crios');
    return isSafari || isChromeOniOS;
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onChange?.(value);

    if (value.trim()) {
      const filtered = suggestionSource.filter((item) => item.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isFocused) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 800);
  };

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const searchIconVariants = {
    initial: { scale: 1 },
    animate: {
      rotate: isAnimating ? [0, -15, 15, -10, 10, 0] : 0,
      scale: isAnimating ? [1, 1.3, 1] : 1,
      transition: { duration: 0.6, ease: 'easeInOut' as const },
    },
  };

  const suggestionVariants = {
    hidden: (i: number) => ({
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, delay: i * 0.05 },
    }),
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 15, delay: i * 0.07 },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -5,
      scale: 0.9,
      transition: { duration: 0.1, delay: i * 0.03 },
    }),
  };

  // Ambient particles — a single blue tone at varying opacity, not a rainbow of hues
  const particles = Array.from({ length: isFocused ? 18 : 0 }, (_, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0 }}
      animate={{
        x: [0, (Math.random() - 0.5) * 40],
        y: [0, (Math.random() - 0.5) * 40],
        scale: [0, Math.random() * 0.8 + 0.4],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration: Math.random() * 1.5 + 1.5,
        ease: 'easeInOut',
        repeat: Number.POSITIVE_INFINITY,
        repeatType: 'reverse',
      }}
      className="absolute w-3 h-3 rounded-full bg-vanta-navy"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        filter: 'blur(2px)',
      }}
    />
  ));

  const clickParticles = isClicked
    ? Array.from({ length: 14 }, (_, i) => (
        <motion.div
          key={`click-${i}`}
          initial={{ x: mousePosition.x, y: mousePosition.y, scale: 0, opacity: 1 }}
          animate={{
            x: mousePosition.x + (Math.random() - 0.5) * 160,
            y: mousePosition.y + (Math.random() - 0.5) * 160,
            scale: Math.random() * 0.8 + 0.2,
            opacity: [1, 0],
          }}
          transition={{ duration: Math.random() * 0.8 + 0.5, ease: 'easeOut' }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: `rgba(30, 90, 168, ${Math.random() * 0.4 + 0.4})`,
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
          }}
        />
      ))
    : null;

  return (
    <div className="relative w-full">
      <GooeyFilter />
      <motion.form
        onSubmit={handleSubmit}
        className="relative flex items-center justify-center w-full mx-auto"
        initial={{ width: '240px' }}
        animate={{ width: isFocused ? '340px' : '240px', scale: isFocused ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className={cn(
            'flex items-center w-full rounded-full border relative overflow-hidden backdrop-blur-md',
            isFocused ? 'border-transparent shadow-xl' : 'border-vanta-border bg-vanta-sidebar/60',
          )}
          animate={{
            boxShadow: isClicked
              ? '0 0 40px rgba(30, 90, 168, 0.35), 0 0 15px rgba(30, 90, 168, 0.5) inset'
              : isFocused
              ? '0 15px 35px rgba(28, 28, 28, 0.15)'
              : '0 0 0 rgba(0, 0, 0, 0)',
          }}
          onClick={handleClick}
        >
          {isFocused && (
            <motion.div
              className="absolute inset-0 -z-10 bg-vanta-navy"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.05, 0.12, 0.05] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />
          )}

          <div
            className="absolute inset-0 overflow-hidden rounded-full -z-5"
            style={{ filter: isUnsupportedBrowser ? 'none' : 'url(#gooey-effect)' }}
          >
            {particles}
          </div>

          {isClicked && (
            <>
              <motion.div
                className="absolute inset-0 -z-5 rounded-full bg-vanta-navy/10"
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 -z-5 rounded-full bg-white"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </>
          )}

          {clickParticles}

          <motion.div className="pl-4 py-3" variants={searchIconVariants} initial="initial" animate="animate">
            <Search
              size={20}
              strokeWidth={isFocused ? 2.5 : 2}
              className={cn(
                'transition-all duration-300',
                isAnimating ? 'text-vanta-navy' : isFocused ? 'text-vanta-navy' : 'text-vanta-gray',
              )}
            />
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className={cn(
              'w-full py-3 bg-transparent outline-none placeholder:text-vanta-gray/70 font-medium text-base relative z-10',
              isFocused ? 'text-vanta-black tracking-wide' : 'text-vanta-black',
            )}
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2 mr-2 text-sm font-semibold rounded-full bg-vanta-navy text-white transition-all shadow-sm hover:bg-vanta-navy-dark"
              >
                Search
              </motion.button>
            )}
          </AnimatePresence>

          {isFocused && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.08, 0.15, 0.08, 0],
                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 70%)',
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: 'loop' }}
            />
          )}
        </motion.div>
      </motion.form>

      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-2 overflow-hidden bg-white backdrop-blur-md rounded-lg shadow-xl border border-vanta-border"
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              filter: isUnsupportedBrowser ? 'none' : 'drop-shadow(0 15px 15px rgba(0,0,0,0.08))',
            }}
          >
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion}
                  custom={index}
                  variants={suggestionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    onChange?.(suggestion);
                    if (onSearch) onSearch(suggestion);
                    setIsFocused(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer rounded-md hover:bg-vanta-sidebar group"
                >
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.06 }}>
                    <CircleDot size={16} className="text-vanta-gray group-hover:text-vanta-navy" />
                  </motion.div>
                  <motion.span
                    className="text-vanta-black group-hover:text-vanta-navy"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    {suggestion}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { SearchBar };
