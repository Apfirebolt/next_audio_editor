import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import { SparklesIcon, ScissorsIcon, CpuChipIcon, ArrowRightIcon, ShieldCheckIcon, MusicalNoteIcon, BoltIcon } from "@heroicons/react/24/outline";

export const metadata = {
  title: "Beats Lounge | Professional Browser-Based Audio Editor & Processor",
  description: "Edit, trim, apply noise cancellation, adjust pitch/auto-tune, and export audio files in multiple formats instantly in your browser.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-200">
      <Header />

      <main className="flex-grow overflow-hidden">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-24 lg:py-32 px-6">
          {/* Ambient background glow effect using theme primary token */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8" data-aos="fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <SparklesIcon className="h-4 w-4 animate-pulse" />
              <span>Next-Gen Web Audio API & WASM Powered</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight font-heading">
              Professional Audio Editing, <span className="text-primary">Right in Your Browser.</span>
            </h1>

            <p className="text-base sm:text-lg text-dark/70 dark:text-light/70 max-w-2xl mx-auto leading-relaxed font-sans">
              Upload, trim, clean up background noise, adjust pitch, and export your audio tracks across multiple formats with custom quality controls. Zero installation required.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/editor"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-primary text-white hover:bg-secondary transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 group"
              >
                <span>Launch Audio Editor</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/instrument"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-tertiary/20 hover:bg-tertiary/30 text-dark dark:text-light border border-tertiary/30 transition-all flex items-center justify-center gap-2"
              >
                <MusicalNoteIcon className="h-4 w-4 text-primary" />
                <span>Virtual Instruments</span>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES / ENGINEERING HIGHLIGHTS SECTION */}
        <section className="py-24 px-6 border-t border-tertiary/20 dark:border-tertiary/10 bg-light/50 dark:bg-dark/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto space-y-16">
            
            <div className="text-center space-y-3 max-w-xl mx-auto" data-aos="fade-up">
              <h2 className="text-3xl font-bold tracking-tight font-heading">
                Engineered for High-Performance Sound
              </h2>
              <p className="text-xs text-dark/60 dark:text-light/60 font-sans">
                Built with robust Web Audio DSP algorithms and client-side encoders to deliver low-latency performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div 
                className="p-8 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-4 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <ScissorsIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-heading">Multi-Format Conversion</h3>
                <p className="text-xs text-dark/70 dark:text-light/70 leading-relaxed font-sans">
                  Import standard audio files and export instantly to MP3, WAV, or OGG with granular bitrates and sample rate control powered by client-side transcoding.
                </p>
              </div>

              {/* Feature 2 */}
              <div 
                className="p-8 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-4 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-heading">Advanced Noise Cancellation</h3>
                <p className="text-xs text-dark/70 dark:text-light/70 leading-relaxed font-sans">
                  Isolate vocals and remove background hum, hiss, or static frequencies utilizing precision filtering nodes and modern suppression algorithms.
                </p>
              </div>

              {/* Feature 3 */}
              <div 
                className="p-8 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-4 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <MusicalNoteIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-heading">Pitch Shift & Auto-Tune</h3>
                <p className="text-xs text-dark/70 dark:text-light/70 leading-relaxed font-sans">
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