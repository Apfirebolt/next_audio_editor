// components/Footer.jsx
'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
      <div className="container mx-auto px-6 pt-12 pb-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold tracking-wider">
                Beats<span className="text-indigo-500">Lounge</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-sans">
              A professional browser-based audio workstation and multi-instrument studio powered by Web Audio API and WASM.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3 font-sans">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Studio
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-indigo-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/editor" className="hover:text-indigo-500 transition-colors">
                  Audio Editor
                </Link>
              </li>
              <li>
                <Link href="/instrument" className="hover:text-indigo-500 transition-colors">
                  Virtual Instruments
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-indigo-500 transition-colors">
                  About Platform
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Resources */}
          <div className="space-y-3 font-sans">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-400 dark:text-gray-500 cursor-default">
                  Tone.js DSP Routing
                </span>
              </li>
              <li>
                <span className="text-gray-400 dark:text-gray-500 cursor-default">
                  Web Audio API
                </span>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-indigo-500 transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Connect / Newsletter */}
          <div className="space-y-3 font-sans">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Stay Updated
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get notified when new synthesizer patches and effects are released.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-md focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-md shadow-indigo-600/20"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 dark:text-gray-500 font-sans gap-4">
          <p>&copy; {new Date().getFullYear()} BeatsLounge Studio. All rights reserved.</p>
          
          <div className="flex space-x-6">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;