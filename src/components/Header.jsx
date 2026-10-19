'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookie from "js-cookie";
import { 
  HomeIcon, 
  ScissorsIcon,
  MusicalNoteIcon,
  InformationCircleIcon,
  Bars3Icon, 
  XMarkIcon,
  SunIcon,
  MoonIcon,
  RadioIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ArrowRightIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize theme and check user session on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Check user cookie session
    const userCookie = Cookie.get('user');
    if (userCookie) {
      try {
        setUser(JSON.parse(userCookie));
      } catch (err) {
        console.error("Failed to parse user cookie:", err);
      }
    }
  }, [pathname]);

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

  // Logout handler
  const handleLogout = () => {
    Cookie.remove('user');
    Cookie.remove('token');
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Editor", href: "/editor", icon: ScissorsIcon },
    { name: "Instrument", href: "/instrument", icon: MusicalNoteIcon },
    { name: "About", href: "/about", icon: InformationCircleIcon },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark/90 backdrop-blur-xl border-b border-tertiary/20 dark:border-tertiary/10 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand / Logo & Theme Toggle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <RadioIcon className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-wider font-heading">
              SoftGenie <span className="text-primary">Beats</span> 
            </span>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-tertiary/20 hover:bg-tertiary/30 text-primary transition-colors border border-tertiary/30 flex items-center justify-center shadow-inner cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <SunIcon className="h-4 w-4 text-warning" />
            ) : (
              <MoonIcon className="h-4 w-4 text-dark" />
            )}
          </button>
        </div>

        {/* Desktop Navigation Links & Auth Actions */}
        <div className="hidden md:flex items-center gap-6">
          <nav>
            <ul className="flex items-center gap-2 font-sans">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center space-x-2 transition-all duration-200 whitespace-nowrap ${
                        isActive 
                          ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]' 
                          : 'text-dark dark:text-light/80 hover:text-primary dark:hover:text-tertiary hover:bg-primary/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop Auth Section */}
          <div className="flex items-center gap-3 pl-4 border-l border-tertiary/20">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-dark dark:text-light">
                  <UserCircleIcon className="h-4 w-4 text-primary" />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-dark dark:text-light hover:bg-primary/10 transition-colors border border-tertiary/30"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-secondary transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  <span>Sign up</span>
                  <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-dark dark:text-light hover:bg-primary/10 focus:outline-none transition-colors border border-tertiary/20 cursor-pointer"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-primary" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-light/95 dark:bg-dark/95 backdrop-blur-2xl border-b border-tertiary/20 px-4 py-4 space-y-3 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-dark dark:text-light/90 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* Mobile Auth Section */}
          <div className="pt-4 border-t border-tertiary/20 space-y-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-dark dark:text-light">
                  <UserCircleIcon className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="py-3 text-center rounded-xl text-xs font-bold text-dark dark:text-light hover:bg-primary/10 border border-tertiary/30 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="py-3 text-center rounded-xl text-xs font-bold text-white bg-primary hover:bg-secondary transition-all shadow-md shadow-primary/20"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;