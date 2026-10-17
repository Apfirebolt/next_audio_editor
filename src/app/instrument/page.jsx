"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { MusicalNoteIcon, PlayIcon, StopIcon, ArrowDownTrayIcon, SparklesIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";

const INSTRUMENTS = [
  { 
    id: "synth", 
    name: "Cyber Synth", 
    type: "poly", 
    options: { oscillator: { type: "sawtooth" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 1 } },
    filterCutoff: 2500 
  },
  { 
    id: "guitar", 
    name: "Acoustic Guitar", 
    type: "fm", 
    options: { harmonicity: 1.5, modulationIndex: 10, oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 0.8 } },
    filterCutoff: 3000 
  },
  { 
    id: "elec-guitar", 
    name: "Electric Guitar", 
    type: "fm", 
    options: { harmonicity: 2.0, modulationIndex: 12, oscillator: { type: "sawtooth" }, envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.6 } },
    filterCutoff: 4000 
  },
  { 
    id: "steel-drum", 
    name: "Steel Drum", 
    type: "fm", 
    options: { harmonicity: 2.7, modulationIndex: 8, oscillator: { type: "triangle" }, envelope: { attack: 0.002, decay: 0.5, sustain: 0.05, release: 0.4 } },
    filterCutoff: 3500 
  },
  { 
    id: "slap-bass", 
    name: "Slap Bass", 
    type: "poly", 
    options: { oscillator: { type: "triangle8" }, envelope: { attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.3 } },
    filterCutoff: 1200 
  },
  { 
    id: "piano", 
    name: "Grand Piano", 
    type: "fm", 
    options: { harmonicity: 2, modulationIndex: 5, oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.8, sustain: 0.2, release: 1.2 } },
    filterCutoff: 4000 
  },
  { 
    id: "pad", 
    name: "Ambient Pad", 
    type: "am", 
    options: { harmonicity: 0.5, oscillator: { type: "sine" }, envelope: { attack: 0.8, decay: 1.0, sustain: 0.8, release: 2.0 } },
    filterCutoff: 1000 
  },
  { 
    id: "organ", 
    name: "Classic Organ", 
    type: "poly", 
    options: { oscillator: { type: "square8" }, envelope: { attack: 0.01, decay: 0.01, sustain: 1.0, release: 0.1 } },
    filterCutoff: 3500 
  },
  { 
    id: "brass", 
    name: "80s Brass", 
    type: "poly", 
    options: { oscillator: { type: "sawtooth" }, envelope: { attack: 0.15, decay: 0.3, sustain: 0.6, release: 0.8 } },
    filterCutoff: 4500 
  },
  { 
    id: "flute", 
    name: "Smooth Flute", 
    type: "poly", 
    options: { oscillator: { type: "sine" }, envelope: { attack: 0.2, decay: 0.1, sustain: 0.9, release: 0.5 } },
    filterCutoff: 1800 
  },
  { 
    id: "bass", 
    name: "Deep Sub Bass", 
    type: "mono", 
    options: { oscillator: { type: "sine" }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.4 } },
    filterCutoff: 400 
  },
  { 
    id: "bell", 
    name: "Lo-Fi Bell", 
    type: "fm", 
    options: { harmonicity: 3.5, modulationIndex: 15, oscillator: { type: "sine" }, envelope: { attack: 0.002, decay: 1.5, sustain: 0.0, release: 1.5 } },
    filterCutoff: 6000 
  },
  { 
    id: "pluck", 
    name: "Square Pluck", 
    type: "poly", 
    options: { oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 } },
    filterCutoff: 2200 
  }
];

const KEYPAD_NOTES = [
  { key: "A", note: "C4", label: "C4" },
  { key: "W", note: "C#4", label: "C#4" },
  { key: "S", note: "D4", label: "D4" },
  { key: "E", note: "D#4", label: "D#4" },
  { key: "D", note: "E4", label: "E4" },
  { key: "F", note: "F4", label: "F4" },
  { key: "T", note: "F#4", label: "F#4" },
  { key: "G", note: "G4", label: "G4" },
  { key: "Y", note: "G#4", label: "G#4" },
  { key: "H", note: "A4", label: "A4" },
  { key: "U", note: "A#4", label: "A#4" },
  { key: "J", note: "B4", label: "B4" },
  { key: "K", note: "C5", label: "C5" },
];

export default function InstrumentPage() {
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [activeNotes, setActiveNotes] = useState({});

  // Core & Effect Controls State
  const [filterCutoff, setFilterCutoff] = useState(selectedInstrument.filterCutoff);
  const [filterType, setFilterType] = useState("lowpass");
  
  const [enableDistortion, setEnableDistortion] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(0.2);

  const [enableBitCrusher, setEnableBitCrusher] = useState(false);
  const [bitCrusherBits, setBitCrusherBits] = useState(8);

  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  const [enableAutoWah, setEnableAutoWah] = useState(false);
  const [enableChorus, setEnableChorus] = useState(false);
  const [enablePhaser, setEnablePhaser] = useState(false);
  const [enableTremolo, setEnableTremolo] = useState(false);
  const [enableVibrato, setEnableVibrato] = useState(false);

  const [enablePitchShift, setEnablePitchShift] = useState(false);
  const [pitchShiftSemitones, setPitchShiftSemitones] = useState(0);

  const [enableDelay, setEnableDelay] = useState(false);
  const [delayTime, setDelayTime] = useState("8n");

  const [enableReverb, setEnableReverb] = useState(false);
  const [reverbDecay, setReverbDecay] = useState(2.5);

  // Audio Node Refs
  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const distortionRef = useRef(null);
  const bitCrusherRef = useRef(null);
  const eqRef = useRef(null);
  const autoWahRef = useRef(null);
  const chorusRef = useRef(null);
  const phaserRef = useRef(null);
  const tremoloRef = useRef(null);
  const vibratoRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const delayRef = useRef(null);
  const reverbRef = useRef(null);
  const stereoWidenerRef = useRef(null);
  const limiterRef = useRef(null);

  const destRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Initialize Audio Effects & Synth Architecture
  useEffect(() => {
    destRef.current = Tone.getContext().createMediaStreamDestination();

    filterRef.current = new Tone.Filter({ frequency: selectedInstrument.filterCutoff, type: "lowpass" });
    distortionRef.current = new Tone.Distortion({ distortion: 0.2, wet: 0.5 });
    bitCrusherRef.current = new Tone.BitCrusher({ bits: 8, wet: 0.5 });
    eqRef.current = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
    autoWahRef.current = new Tone.AutoWah({ baseFrequency: 150, octaves: 6, wet: 0.5 });
    chorusRef.current = new Tone.Chorus({ frequency: 4, delayTime: 2.5, depth: 0.5, wet: 0.5 });
    phaserRef.current = new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350, wet: 0.4 });
    tremoloRef.current = new Tone.Tremolo({ frequency: 5, depth: 0.7, wet: 0.5 }).start();
    vibratoRef.current = new Tone.Vibrato({ frequency: 5, depth: 0.2, wet: 0.5 });
    pitchShiftRef.current = new Tone.PitchShift({ pitch: 0, wet: 1.0 });
    delayRef.current = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.3, wet: 0.4 });
    reverbRef.current = new Tone.Reverb({ decay: 2.5, wet: 0.4 });
    stereoWidenerRef.current = new Tone.StereoWidener({ width: 0.5 });
    limiterRef.current = new Tone.Limiter(-1);

    // Instantiate appropriate poly synth engine
    if (selectedInstrument.type === "fm") {
      synthRef.current = new Tone.PolySynth(Tone.FMSynth, selectedInstrument.options);
    } else if (selectedInstrument.type === "am") {
      synthRef.current = new Tone.PolySynth(Tone.AMSynth, selectedInstrument.options);
    } else {
      synthRef.current = new Tone.PolySynth(Tone.Synth, selectedInstrument.options);
    }

    updateAudioRouting();

    return () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      distortionRef.current?.dispose();
      bitCrusherRef.current?.dispose();
      eqRef.current?.dispose();
      autoWahRef.current?.dispose();
      chorusRef.current?.dispose();
      phaserRef.current?.dispose();
      tremoloRef.current?.dispose();
      vibratoRef.current?.dispose();
      pitchShiftRef.current?.dispose();
      delayRef.current?.dispose();
      reverbRef.current?.dispose();
      stereoWidenerRef.current?.dispose();
      limiterRef.current?.dispose();
    };
  }, [selectedInstrument]);

  // Dynamic Audio Routing Chain
  const updateAudioRouting = () => {
    if (!synthRef.current || !filterRef.current) return;

    synthRef.current.disconnect();
    filterRef.current.disconnect();
    distortionRef.current?.disconnect();
    bitCrusherRef.current?.disconnect();
    eqRef.current?.disconnect();
    autoWahRef.current?.disconnect();
    chorusRef.current?.disconnect();
    phaserRef.current?.disconnect();
    tremoloRef.current?.disconnect();
    vibratoRef.current?.disconnect();
    pitchShiftRef.current?.disconnect();
    delayRef.current?.disconnect();
    reverbRef.current?.disconnect();
    stereoWidenerRef.current?.disconnect();
    limiterRef.current?.disconnect();

    let currentNode = synthRef.current;

    if (enableDistortion && distortionRef.current) {
      distortionRef.current.distortion = distortionAmount;
      currentNode.connect(distortionRef.current);
      currentNode = distortionRef.current;
    }

    if (enableBitCrusher && bitCrusherRef.current) {
      bitCrusherRef.current.bits = bitCrusherBits;
      currentNode.connect(bitCrusherRef.current);
      currentNode = bitCrusherRef.current;
    }

    if (eqRef.current) {
      eqRef.current.low.value = eqLow;
      eqRef.current.mid.value = eqMid;
      eqRef.current.high.value = eqHigh;
      currentNode.connect(eqRef.current);
      currentNode = eqRef.current;
    }

    if (filterRef.current) {
      filterRef.current.frequency.value = filterCutoff;
      filterRef.current.type = filterType;
      currentNode.connect(filterRef.current);
      currentNode = filterRef.current;
    }

    if (enableAutoWah && autoWahRef.current) {
      currentNode.connect(autoWahRef.current);
      currentNode = autoWahRef.current;
    }

    if (enableChorus && chorusRef.current) {
      currentNode.connect(chorusRef.current);
      currentNode = chorusRef.current;
    }

    if (enablePhaser && phaserRef.current) {
      currentNode.connect(phaserRef.current);
      currentNode = phaserRef.current;
    }

    if (enableTremolo && tremoloRef.current) {
      currentNode.connect(tremoloRef.current);
      currentNode = tremoloRef.current;
    }

    if (enableVibrato && vibratoRef.current) {
      currentNode.connect(vibratoRef.current);
      currentNode = vibratoRef.current;
    }

    if (enablePitchShift && pitchShiftRef.current) {
      pitchShiftRef.current.pitch = pitchShiftSemitones;
      currentNode.connect(pitchShiftRef.current);
      currentNode = pitchShiftRef.current;
    }

    if (enableDelay && delayRef.current) {
      delayRef.current.delayTime.value = delayTime;
      currentNode.connect(delayRef.current);
      currentNode = delayRef.current;
    }

    if (enableReverb && reverbRef.current) {
      reverbRef.current.decay = reverbDecay;
      currentNode.connect(reverbRef.current);
      currentNode = reverbRef.current;
    }

    if (stereoWidenerRef.current) {
      currentNode.connect(stereoWidenerRef.current);
      currentNode = stereoWidenerRef.current;
    }

    if (limiterRef.current) {
      currentNode.connect(limiterRef.current);
      currentNode = limiterRef.current;
    }

    const finalNode = limiterRef.current || currentNode;
    finalNode.connect(Tone.getDestination());
    if (destRef.current) {
      finalNode.connect(destRef.current);
    }
  };

  useEffect(() => {
    updateAudioRouting();
  }, [
    filterCutoff, filterType, enableDistortion, distortionAmount,
    enableBitCrusher, bitCrusherBits, eqLow, eqMid, eqHigh,
    enableAutoWah, enableChorus, enablePhaser, enableTremolo,
    enableVibrato, enablePitchShift, pitchShiftSemitones,
    enableDelay, delayTime, enableReverb, reverbDecay
  ]);

  const handleInstrumentChange = (inst) => {
    setSelectedInstrument(inst);
    setFilterCutoff(inst.filterCutoff);
  };

  const playNote = async (note) => {
    await Tone.start();
    if (synthRef.current) {
      synthRef.current.triggerAttack(note);
      setActiveNotes((prev) => ({ ...prev, [note]: true }));
    }
  };

  const stopNote = (note) => {
    if (synthRef.current) {
      synthRef.current.triggerRelease([note]);
      setActiveNotes((prev) => ({ ...prev, [note]: false }));
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const found = KEYPAD_NOTES.find((k) => k.key === e.key.toUpperCase());
      if (found && !activeNotes[found.note]) {
        playNote(found.note);
      }
    };

    const handleKeyUp = (e) => {
      const found = KEYPAD_NOTES.find((k) => k.key === e.key.toUpperCase());
      if (found) {
        stopNote(found.note);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeNotes]);

  const startRecording = () => {
    if (!destRef.current) return;
    recordedChunksRef.current = [];

    const stream = destRef.current.stream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedBlobUrl(url);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Virtual Synth & Instrument Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Choose from 13 distinct studio instrument presets, route professional audio effects chains, and record live performances.
          </p>
        </div>

        {/* Instrument Selector Grid */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Select Instrument Preset</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {INSTRUMENTS.map((inst) => (
              <button
                key={inst.id}
                onClick={() => handleInstrumentChange(inst)}
                className={`p-4 rounded-xl border text-left transition-all space-y-1 ${
                  selectedInstrument.id === inst.id
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-md shadow-indigo-500/10"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400"
                }`}
              >
                <MusicalNoteIcon className="h-5 w-5 mb-2" />
                <p className="font-semibold text-sm">{inst.name}</p>
                <p className="text-xs text-gray-500 capitalize">{inst.type} synthesis</p>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Effects Rack */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-indigo-500" />
            <h3 className="font-semibold text-lg">Pro Effects Rack</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filter Cutoff */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Filter Cutoff</span>
                <span className="font-mono text-xs text-indigo-400">{filterCutoff} Hz</span>
              </div>
              <input
                type="range"
                min="200"
                max="8000"
                step="100"
                value={filterCutoff}
                onChange={(e) => setFilterCutoff(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Distortion */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overdrive Distortion</span>
                <input
                  type="checkbox"
                  checked={enableDistortion}
                  onChange={(e) => setEnableDistortion(e.target.checked)}
                  className="accent-indigo-600 h-4 w-4 cursor-pointer"
                />
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={distortionAmount}
                disabled={!enableDistortion}
                onChange={(e) => setDistortionAmount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Delay */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Echo Delay</span>
                <input
                  type="checkbox"
                  checked={enableDelay}
                  onChange={(e) => setEnableDelay(e.target.checked)}
                  className="accent-indigo-600 h-4 w-4 cursor-pointer"
                />
              </div>
              <select
                value={delayTime}
                disabled={!enableDelay}
                onChange={(e) => setDelayTime(e.target.value)}
                className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm disabled:opacity-40"
              >
                <option value="8n">Eighth Note</option>
                <option value="4n">Quarter Note</option>
                <option value="2n">Half Note</option>
              </select>
            </div>

            {/* Reverb */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Hall Reverb</span>
                <input
                  type="checkbox"
                  checked={enableReverb}
                  onChange={(e) => setEnableReverb(e.target.checked)}
                  className="accent-indigo-600 h-4 w-4 cursor-pointer"
                />
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.5"
                value={reverbDecay}
                disabled={!enableReverb}
                onChange={(e) => setReverbDecay(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Modulation Toggles */}
            <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 md:col-span-2">
              <span className="text-sm font-medium">Modulation Effects</span>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={enableChorus} onChange={(e) => setEnableChorus(e.target.checked)} className="accent-indigo-600 h-4 w-4" />
                  Chorus
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={enablePhaser} onChange={(e) => setEnablePhaser(e.target.checked)} className="accent-indigo-600 h-4 w-4" />
                  Phaser
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={enableTremolo} onChange={(e) => setEnableTremolo(e.target.checked)} className="accent-indigo-600 h-4 w-4" />
                  Tremolo
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={enableVibrato} onChange={(e) => setEnableVibrato(e.target.checked)} className="accent-indigo-600 h-4 w-4" />
                  Vibrato
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={enableAutoWah} onChange={(e) => setEnableAutoWah(e.target.checked)} className="accent-indigo-600 h-4 w-4" />
                  Auto-Wah
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Recorder Controller Toolbar */}
        <div className="flex flex-wrap items-center justify-between p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-indigo-500" />
            <div>
              <h4 className="font-semibold text-base">Performance Capture</h4>
              <p className="text-xs text-gray-500">Record your live notes and active effects into an audio file.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-5 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-500 transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
              >
                <PlayIcon className="h-5 w-5" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-all flex items-center gap-2 animate-pulse"
              >
                <StopIcon className="h-5 w-5 text-red-400" />
                <span>Stop Recording</span>
              </button>
            )}
          </div>
        </div>

        {/* Recorded Audio Preview & Download */}
        {recordedBlobUrl && (
          <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
            <h4 className="font-semibold text-indigo-400">Recorded Performance Ready</h4>
            <audio controls src={recordedBlobUrl} className="w-full" />
            <div className="flex justify-end">
              <a
                href={recordedBlobUrl}
                download="synthesizer-session.webm"
                className="px-6 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-md"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download Performance</span>
              </a>
            </div>
          </div>
        )}

        {/* Interactive Keypad */}
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 text-center shadow-sm">
          <h3 className="font-semibold text-lg">Interactive Music Keypad</h3>
          <p className="text-xs text-gray-500">Play using your computer keyboard [A, S, D, F, G, H, J, K] for natural keys and [W, E, T, Y, U] for accidentals.</p>

          <div className="grid grid-cols-7 sm:grid-cols-13 gap-2 max-w-4xl mx-auto">
            {KEYPAD_NOTES.map((k) => (
              <button
                key={k.note}
                onMouseDown={() => playNote(k.note)}
                onMouseUp={() => stopNote(k.note)}
                onMouseLeave={() => stopNote(k.note)}
                onTouchStart={() => playNote(k.note)}
                onTouchEnd={() => stopNote(k.note)}
                className={`h-36 rounded-xl border flex flex-col items-center justify-between p-3 transition-all select-none ${
                  k.note.includes("#")
                    ? "bg-gray-900 text-gray-200 border-gray-700"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                } ${
                  activeNotes[k.note] ? "!bg-indigo-600 !text-white !border-indigo-500 scale-95 shadow-inner" : "hover:border-indigo-500"
                }`}
              >
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {k.key}
                </span>
                <span className="font-bold text-xs sm:text-sm font-mono">{k.label}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-40"></span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}