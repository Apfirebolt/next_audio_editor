"use client";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { 
  MusicalNoteIcon, 
  SparklesIcon, 
  CpuChipIcon, 
  MicrophoneIcon, 
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ArrowRightIcon,
  BoltIcon
} from "@heroicons/react/24/outline";

const AboutPage = () => {
  const features = [
    {
      icon: <MusicalNoteIcon className="h-6 w-6 text-primary" />,
      title: "50+ Virtual Instruments",
      description: "From Poly, FM, and AM synthesized lead synths to authentic acoustic guitars, orchestral strings, grand pianos, and punchy drum kits."
    },
    {
      icon: <CpuChipIcon className="h-6 w-6 text-primary" />,
      title: "Real-Time Tone.js DSP",
      description: "Low-latency browser audio synthesis and signal processing routing chains powered by the Web Audio API."
    },
    {
      icon: <AdjustmentsHorizontalIcon className="h-6 w-6 text-primary" />,
      title: "Multi-Track Arrangement",
      description: "GarageBand-style arrangement lanes supporting up to 5 simultaneous tracks with draggable blocks, edge-resizing, and cross-track routing."
    },
    {
      icon: <MicrophoneIcon className="h-6 w-6 text-primary" />,
      title: "Voice Studio & Granular EQ",
      description: "Pro-grade vocal recording with hardware noise suppression, echo cancellation, and a 5-band parametric voice equalizer."
    },
    {
      icon: <SparklesIcon className="h-6 w-6 text-primary" />,
      title: "Interactive Studio Keypads",
      description: "Seamless computer keyboard and mouse bindings across 21-key standard and 37-key professional studio octave layouts."
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6 text-primary" />,
      title: "Offline Master Export",
      description: "Render complex multi-track arrangements directly in the browser via Tone.Offline and download professional WAV master mixes."
    }
  ];

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light flex flex-col font-sans selection:bg-primary selection:text-white">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-20 space-y-28">
        
        {/* HERO SECTION with AOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6" data-aos="fade-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase border border-primary/20 shadow-sm">
              <CodeBracketIcon className="h-4 w-4 animate-pulse" />
              <span>Browser-based DAW</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-heading leading-tight">
              Crafting Audio Engineering <span className="text-primary">Without Boundaries.</span>
            </h1>
            
            <p className="text-dark/70 dark:text-light/70 text-base sm:text-lg leading-relaxed font-sans max-w-2xl">
              Beats Lounge bridges high-level web technology and professional audio engineering. Compose multi-track arrangements, 
              sculpt real-time DSP effects, and mix virtual instruments directly inside your browser with zero installation.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="/instrument"
                className="px-6 py-3.5 rounded-2xl font-bold bg-primary hover:bg-secondary text-white transition-all flex items-center gap-2 shadow-lg shadow-primary/25 group"
              >
                <span>Launch Workstation</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/editor"
                className="px-6 py-3.5 rounded-2xl font-bold bg-tertiary/20 hover:bg-tertiary/30 text-dark dark:text-light transition-all border border-tertiary/30"
              >
                Explore Audio Editor
              </a>
            </div>
          </div>

          {/* Visual Card with AOS */}
          <div className="lg:col-span-5" data-aos="fade-left" data-aos-delay="200">
            <div className="relative p-8 rounded-3xl bg-gradient-to-tr from-primary/15 via-tertiary/10 to-transparent border border-primary/20 dark:border-primary/10 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-tertiary/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span className="text-xs font-mono text-dark/50 dark:text-light/50">beats-lounge-dsp.wasm</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-dark/5 dark:bg-white/5 border border-tertiary/20 flex items-center justify-between">
                  <span className="text-primary font-bold">SYNTH_ENGINE</span>
                  <span className="text-success">Active (Poly/FM/AM)</span>
                </div>
                <div className="p-3 rounded-xl bg-dark/5 dark:bg-white/5 border border-tertiary/20 flex items-center justify-between">
                  <span className="text-primary font-bold">ARRANGEMENT_TRACKS</span>
                  <span className="text-light">5 Simultaneous Lanes</span>
                </div>
                <div className="p-3 rounded-xl bg-dark/5 dark:bg-white/5 border border-tertiary/20 flex items-center justify-between">
                  <span className="text-primary font-bold">LATENCY</span>
                  <span className="text-warning">&lt; 12ms (Web Audio)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3 text-xs text-dark/60 dark:text-light/60">
                <BoltIcon className="h-4 w-4 text-primary" />
                <span>Zero backend audio processing. Fully client-side rendered.</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE GRID with AOS */}
        <div className="space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto" data-aos="fade-up">
            <h2 className="text-3xl font-bold tracking-tight font-heading">Engineered for Producers & Developers</h2>
            <p className="text-xs text-dark/60 dark:text-light/60 font-sans">
              Explore the core technical capabilities powering the Beats Lounge audio ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => (
              <div 
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="p-8 rounded-3xl bg-white/60 dark:bg-dark/60 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-4 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-lg font-heading">{feat.title}</h3>
                <p className="text-xs text-dark/70 dark:text-light/70 leading-relaxed font-sans">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TECH STACK CALLOUT with AOS */}
        <div 
          data-aos="zoom-in"
          className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-primary/20 via-tertiary/10 to-primary/10 border border-primary/30 shadow-2xl space-y-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
          
          <h3 className="text-3xl font-extrabold tracking-tight font-heading">Powered by Modern Web Standards</h3>
          <p className="text-sm text-dark/70 dark:text-light/70 max-w-2xl mx-auto font-sans leading-relaxed">
            Crafted with Next.js App Router, React, Tailwind CSS, Tone.js for high-level audio graph manipulation, 
            the native Web Audio API, and Wavesurfer.js for precise visual waveform inspection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {["Next.js", "React", "Tone.js", "Web Audio API", "Tailwind CSS", "MediaRecorder API"].map((tech, idx) => (
              <span key={idx} className="px-4 py-2 rounded-xl bg-white/80 dark:bg-dark/80 border border-tertiary/30 text-primary font-mono text-xs font-bold shadow-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;

