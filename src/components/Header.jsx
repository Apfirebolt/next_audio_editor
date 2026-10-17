'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  ScissorsIcon,
  MusicalNoteIcon,
  InformationCircleIcon,
  Bars3Icon, 
  XMarkIcon,
  SunIcon,
  MoonIcon
} from "@heroicons/react/24/outline";

const Header = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme on mount based on localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    // Default to dark mode if nothing is saved
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle theme handler
  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo & Theme Toggle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-wider">
              Beats<span className="text-indigo-500">Lounge</span> 
            </span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors border border-indigo-500/20 flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <SunIcon className="h-4 w-4 text-indigo-400" />
            ) : (
              <MoonIcon className="h-4 w-4 text-gray-900" />
            )}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-3 font-sans">
            <li>
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  pathname === '/' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/editor" 
                className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  pathname === '/editor' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <ScissorsIcon className="h-4 w-4" />
                <span>Editor</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/instrument" 
                className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  pathname === '/instrument' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <MusicalNoteIcon className="h-4 w-4" />
                <span>Instrument</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/about" 
                className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  pathname === '/about' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <InformationCircleIcon className="h-4 w-4" />
                <span>About</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-indigo-500/10 focus:outline-none transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-indigo-500" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-4 space-y-2 shadow-2xl">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              pathname === '/' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-500'
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span>Home</span>
          </Link>
          
          <Link
            href="/editor"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              pathname === '/editor' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-500'
            }`}
          >
            <ScissorsIcon className="h-5 w-5" />
            <span>Editor</span>
          </Link>

          <Link
            href="/instrument"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              pathname === '/instrument' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-500'
            }`}
          >
            <MusicalNoteIcon className="h-5 w-5" />
            <span>Instrument</span>
          </Link>

          <Link
            href="/about"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              pathname === '/about' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-500'
            }`}
          >
            <InformationCircleIcon className="h-5 w-5" />
            <span>About</span>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;