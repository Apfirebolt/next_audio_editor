'use client';

import Link from 'next/link';
import { RadioIcon, ArrowRightIcon, ShieldCheckIcon, CpuChipIcon } from "@heroicons/react/24/outline";

const Footer = () => {
  return (
    <footer className="bg-light dark:bg-dark border-t border-tertiary/20 dark:border-tertiary/10 text-dark/70 dark:text-light/70 transition-colors">
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Left Column: Brand, Description & Quick Links */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <RadioIcon className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <span className="text-2xl font-extrabold tracking-wider font-heading text-dark dark:text-light">
                  SoftGenie <span className="text-primary">Beats</span>
                </span>
              </Link>
              <p className="text-sm text-dark/60 dark:text-light/60 max-w-lg leading-relaxed font-sans">
                A professional browser-based audio workstation and multi-instrument studio powered by the Web Audio API, Tone.js, and high-performance client-side rendering.
              </p>
            </div>

            {/* Quick Links Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-dark dark:text-light uppercase tracking-wider font-heading">
                  Studio Navigation
                </h3>
                <ul className="space-y-2 text-sm font-sans">
                  <li>
                    <Link href="/" className="hover:text-primary transition-colors">
                      Home Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/editor" className="hover:text-primary transition-colors">
                      Audio Editor
                    </Link>
                  </li>
                  <li>
                    <Link href="/instrument" className="hover:text-primary transition-colors">
                      Virtual Instruments
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-primary transition-colors">
                      About Platform
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-dark dark:text-light uppercase tracking-wider font-heading">
                  Architecture
                </h3>
                <ul className="space-y-2 text-sm font-sans">
                  <li className="flex items-center gap-1.5 text-dark/50 dark:text-light/50">
                    <CpuChipIcon className="h-4 w-4 text-primary" />
                    <span>Tone.js DSP Engine</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-dark/50 dark:text-light/50">
                    <ShieldCheckIcon className="h-4 w-4 text-success" />
                    <span>Offline WAV Rendering</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Newsletter & Studio Updates Card */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-tertiary/10 dark:bg-tertiary/5 border border-tertiary/20 dark:border-tertiary/10 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-dark dark:text-light font-heading">
                Stay Ahead of the Beat
              </h3>
              <p className="text-xs text-dark/60 dark:text-light/60 font-sans leading-relaxed">
                Get notified when new virtual synthesizer patches, pro effects racks, and AI arrangement tools are released.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-3 font-sans">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your producer email"
                  className="w-full px-4 py-3 text-sm bg-white dark:bg-dark border border-tertiary/30 rounded-xl focus:outline-none focus:border-primary text-dark dark:text-light placeholder-dark/30 dark:placeholder-light/30 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-secondary rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                <span>Join Producer List</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-tertiary/20 dark:border-tertiary/10 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-dark/50 dark:text-light/50 font-sans gap-4">
          <p>&copy; {new Date().getFullYear()} BeatsLounge Studio. All rights reserved.</p>
          
          <div className="flex space-x-6">
            <span className="hover:text-primary cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              Terms of Service
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              Audio Licensing
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;