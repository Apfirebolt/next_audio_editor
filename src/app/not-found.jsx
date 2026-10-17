'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HomeIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-anime-dark dark:text-anime-light flex flex-col font-sans selection:bg-anime-sage selection:text-anime-dark transition-colors duration-200">
      <Header />

      <main className="flex-grow flex items-center justify-center px-6 py-24">
        <div className="max-w-xl w-full text-center space-y-8 relative">
          
          {/* Subtle background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-anime-coral/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative z-10 w-20 h-20 mx-auto rounded-2xl bg-anime-coral/10 border border-anime-coral/20 flex items-center justify-center text-anime-coral shadow-lg shadow-anime-coral/5">
            <ExclamationTriangleIcon className="h-10 w-10" />
          </div>

          {/* Heading & Error Code */}
          <div className="relative z-10 space-y-3">
            <span className="text-xs font-mono tracking-widest uppercase text-anime-coral font-semibold">
              Error 404
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight">
              Page Not Found
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-anime-light/60 max-w-md mx-auto leading-relaxed">
              Oops! The page or title you are looking for has vanished into another dimension or doesn't exist.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold font-heading bg-anime-sage text-anime-dark hover:bg-anime-sage/90 transition-all shadow-lg shadow-anime-sage/10 flex items-center justify-center gap-2"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <Link
              href="/anime"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold font-heading bg-gray-100 dark:bg-anime-dark/50 border border-gray-300 dark:border-anime-sage/30 hover:border-anime-sage text-gray-800 dark:text-anime-light transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Browse Catalog</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;