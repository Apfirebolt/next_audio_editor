'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  FilmIcon,
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
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-anime-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-anime-sage/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo & Theme Toggle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold font-heading text-anime-sage tracking-wider">
              Anime<span className="text-anime-coral">Lounge</span> 
            </span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-anime-sage/10 hover:bg-anime-sage/20 text-anime-sage transition-colors border border-anime-sage/20 flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <SunIcon className="h-4 w-4 text-anime-sage" />
            ) : (
              <MoonIcon className="h-4 w-4 text-anime-dark" />
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
                    ? 'bg-anime-sage text-anime-dark' 
                    : 'text-gray-700 dark:text-anime-light/85 hover:text-anime-sage dark:hover:text-anime-sage hover:bg-anime-sage/10'
                }`}
              >
                <HomeIcon className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/anime" 
                className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                  pathname.startsWith('/anime') && pathname !== '/compare' && pathname !== '/characters'
                    ? 'bg-anime-sage text-anime-dark' 
                    : 'text-gray-700 dark:text-anime-light/85 hover:text-anime-sage dark:hover:text-anime-sage hover:bg-anime-sage/10'
                }`}
              >
                <FilmIcon className="h-4 w-4" />
                <span>Anime</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-gray-700 dark:text-anime-light hover:bg-anime-sage/10 focus:outline-none transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-anime-sage" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-anime-dark border-b border-gray-200 dark:border-anime-sage/20 px-4 py-4 space-y-2 shadow-2xl">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              pathname === '/' 
                ? 'bg-anime-sage text-anime-dark' 
                : 'text-gray-700 dark:text-anime-light/85 hover:bg-anime-sage/10 hover:text-anime-sage'
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span>Home</span>
          </Link>
          
          <Link
            href="/anime"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              pathname.startsWith('/anime') && pathname !== '/compare' && pathname !== '/characters'
                ? 'bg-anime-sage text-anime-dark' 
                : 'text-gray-700 dark:text-anime-light/85 hover:bg-anime-sage/10 hover:text-anime-sage'
            }`}
          >
            <FilmIcon className="h-5 w-5" />
            <span>Anime</span>
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;