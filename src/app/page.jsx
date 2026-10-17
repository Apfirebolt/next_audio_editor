import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { SparklesIcon, ScissorsIcon, CpuChipIcon, ArrowRightIcon, ShieldCheckIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "AudioLab | Professional Browser-Based Audio Editor & Processor",
  description: "Edit, trim, apply AI noise cancellation, adjust pitch/auto-tune, and export audio files in multiple formats instantly in your browser.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32 px-6">
          {/* Subtle background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
              <SparklesIcon className="h-4 w-4" />
              <span>Next-Gen Web Audio API & WASM Powered</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Professional Audio Editing, <span className="text-indigo-500">Right in Your Browser.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Upload, trim, clean up background noise, adjust pitch, and export your audio tracks across multiple formats with custom quality controls. Zero installation required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/editor"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
              >
                <span>Launch Audio Editor</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/docs"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <span>View Features</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features / Engineering Highlights Section */}
        <section className="py-20 px-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Engineered for High-Performance Sound
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Built with robust Web Audio DSP algorithms and client-side encoders to deliver low-latency performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-4 hover:border-indigo-500/50 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <ScissorsIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Multi-Format Conversion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Import standard audio files and export instantly to MP3, WAV, or OGG with granular bitrates and sample rate control powered by client-side transcoding.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-4 hover:border-indigo-500/50 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Advanced Noise Cancellation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Isolate vocals and remove background hum, hiss, or static frequencies utilizing precision filtering nodes and modern suppression algorithms.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-4 hover:border-indigo-500/50 transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <MusicalNoteIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Pitch Shift & Auto-Tune</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Modify track key signatures, apply semitone shifts, or shape vocal frequencies dynamically with low-latency Tone.js audio node routing.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}