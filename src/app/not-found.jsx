'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HomeIcon, ScissorsIcon, MusicalNoteIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <Header />

      <main className="flex-grow flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full text-center space-y-8 relative">
          
          {/* Subtle background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative z-10 w-20 h-20 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-lg shadow-indigo-500/5">
            <ExclamationTriangleIcon className="h-10 w-10" />
          </div>

          {/* Heading & Error Code */}
          <div className="relative z-10 space-y-3">
            <span className="text-xs font-mono tracking-widest uppercase text-indigo-400 font-semibold">
              Error 404
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Frequency Not Found
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              Oops! The audio track, workspace, or page you are looking for has been muted, deleted, or doesn't exist.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/editor"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 hover:border-indigo-500 text-gray-800 dark:text-gray-200 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ScissorsIcon className="h-4 w-4 text-indigo-500" />
              <span>Open Audio Editor</span>
            </Link>

            <Link
              href="/instrument"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 hover:border-indigo-500 text-gray-800 dark:text-gray-200 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MusicalNoteIcon className="h-4 w-4 text-indigo-500" />
              <span>Virtual Instruments</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;