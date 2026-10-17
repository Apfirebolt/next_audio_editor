// components/Footer.jsx
'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-anime-dark border-t border-gray-200 dark:border-anime-sage/20 text-gray-600 dark:text-anime-light/80 transition-colors">
      <div className="container mx-auto px-6 pt-12 pb-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold font-heading text-anime-sage tracking-wider">
                Anime<span className="text-anime-coral">Lounge</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-anime-light/60 leading-relaxed font-sans">
              A modern multi-domain recommendation platform for anime powered by intelligent similarity vectors.
            </p>
          </div>

          {/* Discovery Links */}
          <div className="space-y-3 font-sans">
            <h3 className="text-sm font-semibold font-heading text-gray-900 dark:text-anime-light uppercase tracking-wider">
              Discover
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/anime" className="hover:text-anime-sage transition-colors">
                  Anime
                </Link>
              </li>
              <li>
                <Link href="/manga" className="hover:text-anime-sage transition-colors">
                  Manga
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-anime-sage transition-colors">
                  Compare
                </Link>
              </li>
              <li>
                <Link href="/top-by-year" className="hover:text-anime-sage transition-colors">
                  Top By Year
                </Link>
              </li>
            </ul>
          </div>

          {/* System & API Links */}
          <div className="space-y-3 font-sans">
            <h3 className="text-sm font-semibold font-heading text-gray-900 dark:text-anime-light uppercase tracking-wider">
              System
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/algorithm" className="hover:text-anime-sage transition-colors">
                  Similarity Engine
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-anime-sage transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Connect / Newsletter */}
          <div className="space-y-3 font-sans">
            <h3 className="text-sm font-semibold font-heading text-gray-900 dark:text-anime-light uppercase tracking-wider">
              Stay Updated
            </h3>
            <p className="text-sm text-gray-500 dark:text-anime-light/60">
              Get notified when new features and datasets are indexed.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-anime-dark/50 border border-gray-300 dark:border-anime-sage/30 rounded-md focus:outline-none focus:border-anime-sage text-gray-900 dark:text-anime-light placeholder-gray-400 dark:placeholder-anime-light/40"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium font-semibold text-anime-dark bg-anime-sage hover:bg-anime-sage/90 rounded-md transition-colors"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-gray-200 dark:border-anime-sage/20 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 dark:text-anime-light/50 font-sans gap-4">
          <p>&copy; {new Date().getFullYear()} AnimeLounge Platform. All rights reserved.</p>
          
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-anime-light transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-anime-light transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;