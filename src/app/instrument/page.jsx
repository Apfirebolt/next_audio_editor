"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VoiceRecorder from "../../components/VoiceRecorder";
import VoiceEqualizer from "../../components/VoiceEqualizer";
import { MusicalNoteIcon, PlayIcon, StopIcon, ArrowDownTrayIcon, SparklesIcon, AdjustmentsHorizontalIcon, MicrophoneIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";
import { INSTRUMENTS, KEYPAD_NOTES_21, KEYPAD_NOTES_37 } from "../../utils/constants";

export default function InstrumentPage() {
  const [activeTab, setActiveTab] = useState("synth");
  const [keyboardMode, setKeyboardMode] = useState("21"); // "21" or "37"

  const activeKeypad = keyboardMode === "37" ? KEYPAD_NOTES_37 : KEYPAD_NOTES_21;

  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [activeNotes, setActiveNotes] = useState({});

  const [latestMicAudioUrl, setLatestMicAudioUrl] = useState(null);

  const [filterCutoff, setFilterCutoff] = useState(selectedInstrument.filterCutoff);
  const [filterType, setFilterType] = useState("lowpass");
  const [enableDistortion, setEnableDistortion] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(0.2);
  const [enableDelay, setEnableDelay] = useState(false);
  const [delayTime, setDelayTime] = useState("8n");
  const [enableReverb, setEnableReverb] = useState(false);
  const [reverbDecay, setReverbDecay] = useState(2.5);

  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const distortionRef = useRef(null);
  const delayRef = useRef(null);
  const reverbRef = useRef(null);
  const limiterRef = useRef(null);

  const destRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    destRef.current = Tone.getContext().createMediaStreamDestination();

    filterRef.current = new Tone.Filter({ frequency: selectedInstrument.filterCutoff, type: "lowpass" });
    distortionRef.current = new Tone.Distortion({ distortion: 0.2, wet: 0.5 });
    delayRef.current = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.3, wet: 0.4 });
    reverbRef.current = new Tone.Reverb({ decay: 2.5, wet: 0.4 });
    limiterRef.current = new Tone.Limiter(-1);

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
      delayRef.current?.dispose();
      reverbRef.current?.dispose();
      limiterRef.current?.dispose();
    };
  }, [selectedInstrument]);

  const updateAudioRouting = () => {
    if (!synthRef.current || !filterRef.current) return;

    synthRef.current.disconnect();
    filterRef.current.disconnect();
    distortionRef.current?.disconnect();
    delayRef.current?.disconnect();
    reverbRef.current?.disconnect();
    limiterRef.current?.disconnect();

    let currentNode = synthRef.current;

    if (enableDistortion && distortionRef.current) {
      distortionRef.current.distortion = distortionAmount;
      currentNode.connect(distortionRef.current);
      currentNode = distortionRef.current;
    }

    if (filterRef.current) {
      filterRef.current.frequency.value = filterCutoff;
      filterRef.current.type = filterType;
      currentNode.connect(filterRef.current);
      currentNode = filterRef.current;
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
  }, [filterCutoff, filterType, enableDistortion, distortionAmount, enableDelay, delayTime, enableReverb, reverbDecay]);

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

  // Keyboard Event Listeners bound dynamically to active keypad layout
  useEffect(() => {
    const handleKeyDown = (e) => {
      const found = activeKeypad.find((k) => k.key === e.key.toUpperCase());
      if (found && !activeNotes[found.note]) {
        playNote(found.note);
      }
    };

    const handleKeyUp = (e) => {
      const found = activeKeypad.find((k) => k.key === e.key.toUpperCase());
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
  }, [activeNotes, activeKeypad]);

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

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Virtual Synth & Voice Studio</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Play virtual instruments across customizable keyboard layouts, route effects, or record and equalize vocals.
            </p>
          </div>

          <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("synth")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "synth" ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              Virtual Instruments
            </button>
            <button
              onClick={() => setActiveTab("mic")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "mic" ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <MicrophoneIcon className="h-4 w-4" />
              <span>Voice Studio</span>
            </button>
          </div>
        </div>

        {activeTab === "synth" && (
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Select Instrument Preset</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
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
                    <p className="font-semibold text-sm truncate">{inst.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{inst.type} synthesis</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Effects Rack */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <AdjustmentsHorizontalIcon className="h-6 w-6 text-indigo-500" />
                <h3 className="font-semibold text-lg">Pro Effects Rack</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
            </div>

            {/* Performance Capture */}
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

            {/* Interactive Keypad with Layout Switcher */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                  <h3 className="font-semibold text-lg">Interactive Studio Keypad</h3>
                  <p className="text-xs text-gray-500">
                    {keyboardMode === "21" 
                      ? "Standard 21-Key Layout (Octaves 3 & 4)" 
                      : "Expanded 37-Key Professional Studio Layout (Octaves 3, 4 & 5)"}
                  </p>
                </div>

                {/* Keyboard Layout Toggle Switch */}
                <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setKeyboardMode("21")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      keyboardMode === "21" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    21-Key Standard
                  </button>
                  <button
                    onClick={() => setKeyboardMode("37")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      keyboardMode === "37" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    37-Key Pro
                  </button>
                </div>
              </div>

              {/* Keypad Grid */}
              <div className={`grid gap-1.5 max-w-7xl mx-auto overflow-x-auto pb-2 ${
                keyboardMode === "37" ? "grid-cols-12 sm:grid-cols-37" : "grid-cols-7 sm:grid-cols-25"
              }`}>
                {activeKeypad.map((k) => (
                  <button
                    key={k.note}
                    onMouseDown={() => playNote(k.note)}
                    onMouseUp={() => stopNote(k.note)}
                    onMouseLeave={() => stopNote(k.note)}
                    onTouchStart={() => playNote(k.note)}
                    onTouchEnd={() => stopNote(k.note)}
                    className={`h-32 rounded-lg border flex flex-col items-center justify-between p-2 transition-all select-none min-w-[32px] ${
                      k.note.includes("#")
                        ? "bg-gray-900 text-gray-200 border-gray-700"
                        : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                    } ${
                      activeNotes[k.note] ? "!bg-indigo-600 !text-white !border-indigo-500 scale-95 shadow-inner" : "hover:border-indigo-500"
                    }`}
                  >
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {k.key}
                    </span>
                    <span className="font-bold text-[10px] sm:text-[11px] font-mono">{k.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-40"></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOICE STUDIO */}
        {activeTab === "mic" && (
          <div className="space-y-8 animate-fadeIn">
            <VoiceRecorder onRecordingComplete={(url) => setLatestMicAudioUrl(url)} />

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="max-w-3xl mx-auto mb-4 text-center">
                <h4 className="font-bold text-lg">Post-Production Voice Mixing</h4>
                <p className="text-xs text-gray-500">Apply granular EQ shaping on your recorded vocal tracks.</p>
              </div>
              <VoiceEqualizer audioUrl={latestMicAudioUrl} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}