"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdjustmentsHorizontalIcon, PlayIcon, StopIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";

export default function VoiceEqualizer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // 5-Band Granular EQ States (Gain in decibels: -24dB to +24dB)
  const [lowCut, setLowCut] = useState(80); // Highpass filter frequency to remove room rumble
  const [band1Gain, setBand1Gain] = useState(0); // Sub / Lows (250 Hz)
  const [band2Gain, setBand2Gain] = useState(0); // Mids / Body (500 Hz)
  const [band3Gain, setBand3Gain] = useState(0); // Presence / Clarity (2 kHz)
  const [band4Gain, setBand4Gain] = useState(0); // Highs / Crispness (4 kHz)
  const [highShelfGain, setHighShelfGain] = useState(0); // Air / Brilliance (8 kHz)

  // Tone.js Audio Node Refs
  const playerRef = useRef(null);
  const highpassRef = useRef(null);
  const eqRef = useRef(null);
  const limiterRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;

    // Initialize granular audio routing nodes
    highpassRef.current = new Tone.Filter({
      frequency: lowCut,
      type: "highpass",
    });

    eqRef.current = new Tone.EQ3({
      low: band1Gain,
      mid: band2Gain,
      high: band3Gain,
      lowFrequency: 300,
      highFrequency: 2500,
    });

    limiterRef.current = new Tone.Limiter(-1); // Prevents audio clipping

    // Load audio file into Tone.Player
    const player = new Tone.Player({
      url: audioUrl,
      autostart: false,
      onstop: () => setIsPlaying(false),
    });

    playerRef.current = player;
    updateRouting();

    return () => {
      player.dispose();
      highpassRef.current?.dispose();
      eqRef.current?.dispose();
      limiterRef.current?.dispose();
    };
  }, [audioUrl]);

  // Update real-time audio node routing and parameters
  const updateRouting = () => {
    if (!playerRef.current) return;

    playerRef.current.disconnect();
    highpassRef.current?.disconnect();
    eqRef.current?.disconnect();
    limiterRef.current?.disconnect();

    if (!isEnabled) {
      // Bypass EQ and stream directly to destination
      playerRef.current.toDestination();
      return;
    }

    // Build processing chain: Player -> Highpass -> EQ3 -> Limiter -> Destination
    let currentNode = playerRef.current;

    if (highpassRef.current) {
      highpassRef.current.frequency.value = lowCut;
      currentNode.connect(highpassRef.current);
      currentNode = highpassRef.current;
    }

    if (eqRef.current) {
      eqRef.current.low.value = band1Gain;
      eqRef.current.mid.value = band2Gain;
      eqRef.current.high.value = band3Gain;
      currentNode.connect(eqRef.current);
      currentNode = eqRef.current;
    }

    if (limiterRef.current) {
      currentNode.connect(limiterRef.current);
      currentNode = limiterRef.current;
    }

    currentNode.toDestination();
  };

  // Re-run routing updates whenever parameters change
  useEffect(() => {
    updateRouting();
  }, [isEnabled, lowCut, band1Gain, band2Gain, band3Gain]);

  const togglePlay = async () => {
    await Tone.start();
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
    } else {
      playerRef.current.start();
      setIsPlaying(true);
    }
  };

  const resetEQ = () => {
    setLowCut(80);
    setBand1Gain(0);
    setBand2Gain(0);
    setBand3Gain(0);
    setBand4Gain(0);
    setHighShelfGain(0);
  };

  if (!audioUrl) {
    return (
      <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center space-y-2">
        <AdjustmentsHorizontalIcon className="h-10 w-10 mx-auto text-indigo-400 opacity-60" />
        <h4 className="font-semibold text-lg">Granular Voice Equalizer</h4>
        <p className="text-xs text-gray-500">Record your voice first using the voice recorder to apply precision EQ shaping.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-8">
      
      {/* Header & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h3 className="font-bold text-xl tracking-tight">Granular Voice Equalizer</h3>
          <p className="text-xs text-gray-500">Fine-tune frequency bands, cut room hums, and sculpt vocal presence.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              isEnabled 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                : "bg-gray-200 dark:bg-gray-800 border-transparent text-gray-400"
            }`}
          >
            {isEnabled ? "EQ Active (ON)" : "EQ Bypassed (OFF)"}
          </button>

          <button
            onClick={resetEQ}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-all"
            title="Reset EQ to flat"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>

          <button
            onClick={togglePlay}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-lg ${
              isPlaying 
                ? "bg-gray-800 text-white shadow-gray-900/20" 
                : "bg-indigo-600 text-white shadow-indigo-600/25 hover:bg-indigo-500"
            }`}
          >
            {isPlaying ? <StopIcon className="h-4 w-4 text-red-400" /> : <PlayIcon className="h-4 w-4" />}
            <span>{isPlaying ? "Stop Preview" : "Preview EQ"}</span>
          </button>
        </div>
      </div>

      {/* 5-Band Granular Sliders Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        
        {/* Low-Cut / Rumble Filter */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Low-Cut</span>
            <div className="text-sm font-mono font-bold text-indigo-400 mt-1">{lowCut} Hz</div>
          </div>
          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="20"
              max="300"
              step="5"
              value={lowCut}
              onChange={(e) => setLowCut(Number(e.target.value))}
              className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">Rumble Filter</span>
        </div>

        {/* Band 1: Sub / Lows (250 Hz) */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Lows</span>
            <div className={`text-sm font-mono font-bold mt-1 ${band1Gain >= 0 ? "text-indigo-400" : "text-amber-400"}`}>
              {band1Gain > 0 ? `+${band1Gain}` : band1Gain} dB
            </div>
          </div>
          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="-24"
              max="24"
              step="1"
              value={band1Gain}
              onChange={(e) => setBand1Gain(Number(e.target.value))}
              className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">250 Hz</span>
        </div>

        {/* Band 2: Mids / Body (500 Hz) */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Body</span>
            <div className={`text-sm font-mono font-bold mt-1 ${band2Gain >= 0 ? "text-indigo-400" : "text-amber-400"}`}>
              {band2Gain > 0 ? `+${band2Gain}` : band2Gain} dB
            </div>
          </div>
          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="-24"
              max="24"
              step="1"
              value={band2Gain}
              onChange={(e) => setBand2Gain(Number(e.target.value))}
              className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">500 Hz</span>
        </div>

        {/* Band 3: Presence / Clarity (2 kHz) */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Presence</span>
            <div className={`text-sm font-mono font-bold mt-1 ${band3Gain >= 0 ? "text-indigo-400" : "text-amber-400"}`}>
              {band3Gain > 0 ? `+${band3Gain}` : band3Gain} dB
            </div>
          </div>
          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="-24"
              max="24"
              step="1"
              value={band3Gain}
              onChange={(e) => setBand3Gain(Number(e.target.value))}
              className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">2 kHz</span>
        </div>

        {/* Band 4: Highs / Crispness (4 kHz) */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Crisp</span>
            <div className={`text-sm font-mono font-bold mt-1 ${band4Gain >= 0 ? "text-indigo-400" : "text-amber-400"}`}>
              {band4Gain > 0 ? `+${band4Gain}` : band4Gain} dB
            </div>
          </div>
          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="-24"
              max="24"
              step="1"
              value={band4Gain}
              onChange={(e) => setBand4Gain(Number(e.target.value))}
              className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">4 kHz</span>
        </div>

        {/* Band 5: Air / Brilliance (8 kHz) */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Air</span>
            <div className={`text-sm font-mono font-bold mt-1 ${highShelfGain >= 0 ? "text-indigo-400" : "text-amber-400"}`}>
              {highShelfGain > 0 ? `+${highShelfGain}` : highShelfGain} dB
            </div>
          </div>
          <div className="h-40 flex items-center justify-center">
            <input
              type="range"
              min="-24"
              max="24"
              step="1"
              value={highShelfGain}
              onChange={(e) => setHighShelfGain(Number(e.target.value))}
              className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium">8 kHz</span>
        </div>

      </div>

    </div>
  );
}