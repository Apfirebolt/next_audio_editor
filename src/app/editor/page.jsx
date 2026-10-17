"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { ArrowUpTrayIcon, PlayIcon, PauseIcon, SparklesIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";

const ALLOWED_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "aac", "flac"];

export default function AudioEditorPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio effect states
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [pitchShift, setPitchShift] = useState(1.0); // Playback rate modifier

  // Web Audio Refs
  const audioCtxRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    // Initialize AudioContext on client mount
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }

    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  // Handle File Upload & Validation
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setErrorMessage(`Invalid file format (.${fileExt}). Please upload an MP3, WAV, OGG, M4A, or FLAC file.`);
      return;
    }

    setAudioFile(file);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }
        audioBufferRef.current = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      }
    } catch (err) {
      console.error("Error decoding audio file:", err);
      setErrorMessage("Failed to decode audio file. The file might be corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio with applied effects
  const togglePlay = () => {
    if (!audioBufferRef.current || !audioCtxRef.current) return;

    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    const ctx = audioCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    
    // Apply pitch shift (playbackRate changes both speed and pitch in native buffers)
    source.playbackRate.value = pitchShift;

    let lastNode = source;

    // Apply basic simulated noise cancellation using a BiquadFilter (Lowpass/Highpass combo)
    if (noiseReduction) {
      const highPassFilter = ctx.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = 100; // Cut off low-end room hums / rumble

      const lowPassFilter = ctx.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = 8000; // Cut off high-end hiss / static

      lastNode.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lastNode = lowPassFilter;
    }

    lastNode.connect(ctx.destination);
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
    };
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Audio Editor Workspace</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Upload an audio track, validate formats, apply clean-up filters, and manage audio properties.
          </p>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-gray-900/30 hover:border-indigo-500/50 transition-colors">
          <input
            type="file"
            id="audio-upload"
            accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ArrowUpTrayIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">
                {fileName ? <span className="text-indigo-400">{fileName}</span> : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs text-gray-500">Supports MP3, WAV, OGG, M4A, FLAC</p>
            </div>
          </label>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Workspace Controls (Enabled when file is loaded) */}
        {audioFile && (
          <div className="space-y-6 p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MusicalNoteIcon className="h-6 w-6 text-indigo-500" />
                <h3 className="font-semibold text-lg">Track Controls & Effects</h3>
              </div>
              <button
                onClick={togglePlay}
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-600/20"
              >
                {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                <span>{isPlaying ? "Pause" : "Play Preview"}</span>
              </button>
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Noise Cancellation Effect Toggle */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-indigo-400" />
                    AI-Simulated Noise Reduction
                  </span>
                  <input
                    type="checkbox"
                    checked={noiseReduction}
                    onChange={(e) => setNoiseReduction(e.target.checked)}
                    className="toggle accent-indigo-600 h-4 w-4"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Applies high-pass and low-pass frequency filters to strip out background hums and static noise.
                </p>
              </div>

              {/* Pitch / Speed Control */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Playback Speed / Pitch</span>
                  <span className="text-xs font-mono text-indigo-400">{pitchShift}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={pitchShift}
                  onChange={(e) => setPitchShift(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}