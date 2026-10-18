"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdjustmentsHorizontalIcon, PlayIcon, StopIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";

const EQ_BANDS = [
  { id: "lowCut", label: "Low-Cut", sub: "Rumble Filter", min: 20, max: 300, step: 5, unit: "Hz", defaultVal: 80 },
  { id: "band1", label: "Lows", sub: "250 Hz", min: -24, max: 24, step: 1, unit: "dB", defaultVal: 0 },
  { id: "band2", label: "Body", sub: "500 Hz", min: -24, max: 24, step: 1, unit: "dB", defaultVal: 0 },
  { id: "band3", label: "Presence", sub: "2 kHz", min: -24, max: 24, step: 1, unit: "dB", defaultVal: 0 },
  { id: "band4", label: "Crisp", sub: "4 kHz", min: -24, max: 24, step: 1, unit: "dB", defaultVal: 0 },
  { id: "air", label: "Air", sub: "8 kHz", min: -24, max: 24, step: 1, unit: "dB", defaultVal: 0 },
];

export default function VoiceEqualizer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // Consolidated EQ State Object
  const [eqValues, setEqValues] = useState({
    lowCut: 80,
    band1: 0,
    band2: 0,
    band3: 0,
    band4: 0,
    air: 0,
  });

  // Audio Node Refs
  const playerRef = useRef(null);
  const filterRef = useRef(null);
  const eqRef = useRef(null);
  const highShelfRef = useRef(null);
  const limiterRef = useRef(null);

  // Initialize Audio Graph on audioUrl change
  useEffect(() => {
    if (!audioUrl) return;

    filterRef.current = new Tone.Filter({ frequency: eqValues.lowCut, type: "highpass" });
    
    eqRef.current = new Tone.EQ3({
      low: eqValues.band1,
      mid: eqValues.band2,
      high: eqValues.band3,
      lowFrequency: 300,
      highFrequency: 2500,
    });

    // Extra filter nodes to handle Band 4 and Air High-Shelf cleanly
    highShelfRef.current = new Tone.Filter({ frequency: 6000, type: "highshelf", gain: eqValues.air });
    limiterRef.current = new Tone.Limiter(-1);

    const player = new Tone.Player({
      url: audioUrl,
      autostart: false,
      onstop: () => setIsPlaying(false),
    });

    playerRef.current = player;
    rebuildRouting();

    return () => {
      player.dispose();
      filterRef.current?.dispose();
      eqRef.current?.dispose();
      highShelfRef.current?.dispose();
      limiterRef.current?.dispose();
    };
  }, [audioUrl]);

  // Handle live parameter updates without re-instantiating nodes
  useEffect(() => {
    if (!playerRef.current) return;

    if (filterRef.current) filterRef.current.frequency.value = eqValues.lowCut;
    if (eqRef.current) {
      eqRef.current.low.value = eqValues.band1;
      eqRef.current.mid.value = eqValues.band2;
      eqRef.current.high.value = eqValues.band3;
    }
    if (highShelfRef.current) highShelfRef.current.gain.value = eqValues.air;
  }, [eqValues]);

  const rebuildRouting = () => {
    if (!playerRef.current) return;

    playerRef.current.disconnect();
    filterRef.current?.disconnect();
    eqRef.current?.disconnect();
    highShelfRef.current?.disconnect();
    limiterRef.current?.disconnect();

    if (!isEnabled) {
      playerRef.current.toDestination();
      return;
    }

    // Connect chain: Player -> Highpass -> EQ3 -> HighShelf -> Limiter -> Destination
    playerRef.current
      .connect(filterRef.current)
      .connect(eqRef.current)
      .connect(highShelfRef.current)
      .connect(limiterRef.current)
      .toDestination();
  };

  useEffect(() => {
    rebuildRouting();
  }, [isEnabled]);

  const handleSliderChange = (id, val) => {
    setEqValues((prev) => ({ ...prev, [id]: val }));
  };

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
    setEqValues({ lowCut: 80, band1: 0, band2: 0, band3: 0, band4: 0, air: 0 });
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
      
      {/* Header Toolbar */}
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

      {/* Dynamic Sliders Grid (Mapped cleanly without code repetition) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
        {EQ_BANDS.map((band) => {
          const val = eqValues[band.id];
          const isPositive = val > 0;
          const displayVal = band.unit === "dB" && isPositive ? `+${val}` : val;

          return (
            <div key={band.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-between space-y-4">
              <div className="text-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{band.label}</span>
                <div className={`text-sm font-mono font-bold mt-1 ${band.unit === "Hz" ? "text-indigo-400" : isPositive ? "text-indigo-400" : val < 0 ? "text-amber-400" : "text-gray-300"}`}>
                  {displayVal} {band.unit}
                </div>
              </div>

              <div className="h-40 flex items-center justify-center">
                <input
                  type="range"
                  min={band.min}
                  max={band.max}
                  step={band.step}
                  value={val}
                  onChange={(e) => handleSliderChange(band.id, Number(e.target.value))}
                  className="w-36 -rotate-90 accent-indigo-600 cursor-pointer"
                />
              </div>

              <span className="text-[10px] text-gray-500 font-medium text-center">{band.sub}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}