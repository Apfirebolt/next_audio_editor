"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { 
  MusicalNoteIcon, 
  SparklesIcon, 
  CpuChipIcon, 
  MicrophoneIcon, 
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  CodeBracketIcon
} from "@heroicons/react/24/outline";

export default function AboutPage() {
  const features = [
    {
      icon: <MusicalNoteIcon className="h-6 w-6 text-indigo-500" />,
      title: "50+ Virtual Instruments",
      description: "From Poly, FM, and AM synthesized lead synths to authentic acoustic guitars, orchestral strings, grand pianos, and punchy drum kits."
    },
    {
      icon: <CpuChipIcon className="h-6 w-6 text-indigo-500" />,
      title: "Real-Time Tone.js DSP",
      description: "Low-latency browser audio synthesis and signal processing routing chains powered by the Web Audio API."
    },
    {
      icon: <AdjustmentsHorizontalIcon className="h-6 w-6 text-indigo-500" />,
      title: "Multi-Track Arrangement",
      description: "GarageBand-style arrangement lanes supporting up to 5 simultaneous tracks with draggable blocks, edge-resizing, and cross-track routing."
    },
    {
      icon: <MicrophoneIcon className="h-6 w-6 text-indigo-500" />,
      title: "Voice Studio & Granular EQ",
      description: "Pro-grade vocal recording with hardware noise suppression, echo cancellation, and a 5-band parametric voice equalizer."
    },
    {
      icon: <SparklesIcon className="h-6 w-6 text-indigo-500" />,
      title: "Interactive Studio Keypads",
      description: "Seamless computer keyboard and mouse bindings across 21-key standard and 37-key professional studio octave layouts."
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6 text-indigo-500" />,
      title: "Offline Master Export",
      description: "Render complex multi-track arrangements directly in the browser via Tone.Offline and download professional WAV master mixes."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-16 space-y-20">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold tracking-wide uppercase border border-indigo-500/20">
            <CodeBracketIcon className="h-4 w-4" />
            <span>Browser-Based Digital Audio Workstation</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            About <span className="text-indigo-600 dark:text-indigo-400">Beats Lounge</span>
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
            Beats Lounge is a high-performance web-based Digital Audio Workstation (DAW) and synthesizer studio. 
            Built to bridge web technology and professional audio engineering, it lets creators compose multi-track arrangements, 
            play virtual instruments, sculpt DSP effects, and mix vocal performances directly inside the browser with zero installation.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Engineered for Producers & Developers</h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Explore the core technical capabilities that power the Beats Lounge ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, index) => (
              <div 
                key={index}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 space-y-4 hover:border-indigo-500/50 transition-all shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-base">{feat.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Callout */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-indigo-900/20 via-gray-900/40 to-indigo-950/40 border border-indigo-500/20 shadow-xl space-y-6 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Built With Modern Web Tech</h3>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto">
            Crafted using Next.js 14 (App Router), React, Tailwind CSS, Tone.js for high-level audio graph manipulation, 
            the native Web Audio API, and Wavesurfer.js for precise visual waveform inspection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {["Next.js", "React", "Tone.js", "Web Audio API", "Tailwind CSS", "MediaRecorder API"].map((tech, idx) => (
              <span key={idx} className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold">
                {tech}
              </span>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}