"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { MusicalNoteIcon, PlayIcon, StopIcon, ArrowDownTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";

const INSTRUMENTS = [
  { id: "synth", name: "Cyber Synth", type: "sawtooth", filterCutoff: 1500 },
  { id: "piano", name: "Grand Piano (Sim)", type: "triangle", filterCutoff: 3000 },
  { id: "pad", name: "Warm Ambient Pad", type: "sine", filterCutoff: 800 },
  { id: "pluck", name: "Plucked Pluck", type: "square", filterCutoff: 2500 },
];

const KEYPAD_NOTES = [
  { key: "A", note: "C4", label: "C4" },
  { key: "S", note: "D4", label: "D4" },
  { key: "D", note: "E4", label: "E4" },
  { key: "F", note: "F4", label: "F4" },
  { key: "G", note: "G4", label: "G4" },
  { key: "H", note: "A4", label: "A4" },
  { key: "J", note: "B4", label: "B4" },
  { key: "K", note: "C5", label: "C5" },
];

export default function InstrumentPage() {
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [activeNotes, setActiveNotes] = useState({});

  // Tone.js Synth & Audio Routing Refs
  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const destRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    // Setup Audio Destination stream for recording
    destRef.current = Tone.getContext().createMediaStreamDestination();

    // Setup Biquad Filter for Instrument Timbre
    filterRef.current = new Tone.Filter({
      frequency: selectedInstrument.filterCutoff,
      type: "lowpass",
    });

    // Setup Synth Polyphony
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: selectedInstrument.type },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 },
    });

    // Connect chain: Synth -> Filter -> Speakers & Media Recorder Stream
    synthRef.current.connect(filterRef.current);
    filterRef.current.connect(Tone.getDestination());
    filterRef.current.connect(destRef.current);

    return () => {
      synthRef.current?.dispose();
      filterRef.current?.dispose();
    };
  }, [selectedInstrument]);

  // Handle instrument change
  const handleInstrumentChange = (inst) => {
    setSelectedInstrument(inst);
    if (synthRef.current && filterRef.current) {
      synthRef.current.set({ oscillator: { type: inst.type } });
      filterRef.current.frequency.value = inst.filterCutoff;
    }
  };

  // Play a note
  const playNote = async (note) => {
    await Tone.start();
    if (synthRef.current) {
      synthRef.current.triggerAttack(note);
      setActiveNotes((prev) => ({ ...prev, [note]: true }));
    }
  };

  // Stop a note
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

  // Start Recording Session
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

  // Stop Recording Session
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Virtual Instrument & Recording Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Select your instrument, play notes using your mouse or computer keyboard, record your session, and export your audio performance.
          </p>
        </div>

        {/* Instrument Selector Cards */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Choose Instrument</h3>
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
                <p className="text-xs text-gray-500 capitalize">{inst.id} engine</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recorder Controller Toolbar */}
        <div className="flex flex-wrap items-center justify-between p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <SparklesIcon className="h-6 w-6 text-indigo-500" />
            <div>
              <h4 className="font-semibold text-base">Performance Capture</h4>
              <p className="text-xs text-gray-500">Record your live keypad performance into an exportable audio file.</p>
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
            <h4 className="font-semibold text-indigo-400">Recorded Session Ready</h4>
            <audio controls src={recordedBlobUrl} className="w-full" />
            <div className="flex justify-end">
              <a
                href={recordedBlobUrl}
                download="instrument-performance.webm"
                className="px-6 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-md"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download Audio Recording</span>
              </a>
            </div>
          </div>
        )}

        {/* Interactive Keypad */}
        <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 text-center shadow-sm">
          <h3 className="font-semibold text-lg">Interactive Music Keypad</h3>
          <p className="text-xs text-gray-500">Click keys or use keyboard keys [A, S, D, F, G, H, J, K] to play.</p>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 max-w-3xl mx-auto">
            {KEYPAD_NOTES.map((k) => (
              <button
                key={k.note}
                onMouseDown={() => playNote(k.note)}
                onMouseUp={() => stopNote(k.note)}
                onMouseLeave={() => stopNote(k.note)}
                onTouchStart={() => playNote(k.note)}
                onTouchEnd={() => stopNote(k.note)}
                className={`h-36 rounded-xl border flex flex-col items-center justify-between p-4 transition-all select-none ${
                  activeNotes[k.note]
                    ? "bg-indigo-600 text-white border-indigo-500 scale-95 shadow-inner"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 hover:border-indigo-500 text-gray-800 dark:text-gray-200"
                }`}
              >
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {k.key}
                </span>
                <span className="font-bold text-lg font-mono">{k.label}</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 opacity-40"></span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}