"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { MusicalNoteIcon, PlayIcon, StopIcon, ArrowDownTrayIcon, SparklesIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";

const INSTRUMENTS = [
  { id: "synth", name: "Cyber Synth", type: "sawtooth", filterCutoff: 2000 },
  { id: "piano", name: "Grand Piano", type: "triangle", filterCutoff: 3500 },
  { id: "pad", name: "Ambient Pad", type: "sine", filterCutoff: 900 },
  { id: "pluck", name: "Square Pluck", type: "square", filterCutoff: 2500 },
  { id: "brass", name: "80s Brass", type: "sawtooth", filterCutoff: 4000 },
  { id: "flute", name: "Smooth Flute", type: "sine", filterCutoff: 1500 },
  { id: "bass", name: "Deep Sub Bass", type: "triangle", filterCutoff: 400 },
  { id: "bell", name: "Lo-Fi Bell", type: "sine", filterCutoff: 5000 },
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

  // Effect States
  const [enableDelay, setEnableDelay] = useState(false);
  const [delayTime, setDelayTime] = useState("8n");
  const [enableDistortion, setEnableDistortion] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(0.2);
  const [filterCutoff, setFilterCutoff] = useState(selectedInstrument.filterCutoff);

  // Tone.js Refs
  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const delayRef = useRef(null);
  const distortionRef = useRef(null);
  const destRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    // Setup Audio Destination stream for recording
    destRef.current = Tone.getContext().createMediaStreamDestination();

    // Setup Effects Nodes
    filterRef.current = new Tone.Filter({
      frequency: selectedInstrument.filterCutoff,
      type: "lowpass",
    });

    delayRef.current = new Tone.FeedbackDelay({
      delayTime: delayTime,
      feedback: 0.3,
      wet: 0.4,
    });

    distortionRef.current = new Tone.Distortion({
      distortion: distortionAmount,
      wet: 0.5,
    });

    // Setup Synth Polyphony
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: selectedInstrument.type },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 1 },
    });

    updateAudioRouting();

    return () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      delayRef.current?.dispose();
      distortionRef.current?.dispose();
    };
  }, [selectedInstrument]);

  // Build and update audio node routing chain dynamically
  const updateAudioRouting = () => {
    if (!synthRef.current || !filterRef.current) return;

    synthRef.current.disconnect();
    filterRef.current.disconnect();
    delayRef.current?.disconnect();
    distortionRef.current?.disconnect();

    let currentNode = synthRef.current;

    // 1. Distortion
    if (enableDistortion && distortionRef.current) {
      distortionRef.current.distortion = distortionAmount;
      currentNode.connect(distortionRef.current);
      currentNode = distortionRef.current;
    }

    // 2. Filter
    if (filterRef.current) {
      filterRef.current.frequency.value = filterCutoff;
      currentNode.connect(filterRef.current);
      currentNode = filterRef.current;
    }

    // 3. Delay / Echo
    if (enableDelay && delayRef.current) {
      delayRef.current.delayTime.value = delayTime;
      currentNode.connect(delayRef.current);
      currentNode = delayRef.current;
    }

    // Connect to output speakers & recorder stream
    currentNode.connect(Tone.getDestination());
    if (destRef.current) {
      currentNode.connect(destRef.current);
    }
  };

  useEffect(() => {
    updateAudioRouting();
  }, [enableDelay, delayTime, enableDistortion, distortionAmount, filterCutoff]);

  const handleInstrumentChange = (inst) => {
    setSelectedInstrument(inst);
    setFilterCutoff(inst.filterCutoff);
    if (synthRef.current) {
      synthRef.current.set({ oscillator: { type: inst.type } });
    }
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
            Choose from 8 distinct synthesizer engines, tweak audio effects, play notes via your keyboard, and record your performance.
          </p>
        </div>

        {/* Instrument Selector Grid */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Select Instrument Preset</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <p className="text-xs text-gray-500 capitalize">{inst.type} oscillator</p>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Effects Rack */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-indigo-500" />
            <h3 className="font-semibold text-lg">Studio Effects Chain</h3>
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
                <option value="8n">Eighth Note (Fast)</option>
                <option value="4n">Quarter Note (Standard)</option>
                <option value="2n">Half Note (Slow)</option>
              </select>
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