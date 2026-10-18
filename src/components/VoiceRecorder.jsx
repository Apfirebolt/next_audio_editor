"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MicrophoneIcon, 
  StopIcon, 
  ArrowDownTrayIcon, 
  TrashIcon, 
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  SignalIcon
} from "@heroicons/react/24/outline";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Advanced Studio Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("audio/webm");
  const [bitrate, setBitrate] = useState("128000"); // 128 kbps standard
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    setErrorMessage("");
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation,
          noiseSuppression,
          autoGainControl,
        },
      });

      // Determine supported MIME type (including mp4/aac containers)
      let mimeType = selectedFormat;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = ""; // Browser default fallback
        }
      }

      const options = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: parseInt(bitrate),
      };

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // Collect data slices every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setErrorMessage("Microphone permission denied or unsupported by browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getFileExtension = (type) => {
    if (type.includes("mp4") || type.includes("m4a")) return "m4a";
    if (type.includes("ogg")) return "ogg";
    if (type.includes("wav")) return "wav";
    return "webm";
  };

  return (
    <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      
      {/* Header & Advanced Drawer Toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h3 className="font-bold text-xl tracking-tight">Studio Voice Channel</h3>
          <p className="text-xs text-gray-500">Pro-grade browser audio capture with stream encoding.</p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-medium ${
            showAdvanced 
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-500"
          }`}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          <span>{showAdvanced ? "Hide Hardware DSP" : "Hardware DSP & Formats"}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
          {errorMessage}
        </div>
      )}

      {/* Advanced Studio Configuration Drawer */}
      {showAdvanced && (
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Format Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <SignalIcon className="h-3.5 w-3.5 text-indigo-400" />
                Container Format
              </label>
              <select
                value={selectedFormat}
                disabled={isRecording}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-xs disabled:opacity-50"
              >
                <option value="audio/webm">WebM (Opus - Highly Optimized)</option>
                <option value="audio/mp4">MP4 / M4A (Apple / Safari Standard)</option>
                <option value="audio/ogg">OGG Opus (Open Standard)</option>
              </select>
            </div>

            {/* Bitrate Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-indigo-400" />
                Audio Bitrate Quality
              </label>
              <select
                value={bitrate}
                disabled={isRecording}
                onChange={(e) => setBitrate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-xs disabled:opacity-50"
              >
                <option value="64000">64 kbps (Voice / Draft)</option>
                <option value="128000">128 kbps (Standard Stream)</option>
                <option value="256000">256 kbps (Studio High Quality)</option>
              </select>
            </div>
          </div>

          {/* Hardware DSP Toggles */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800 grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={noiseSuppression} 
                disabled={isRecording}
                onChange={(e) => setNoiseSuppression(e.target.checked)} 
                className="accent-indigo-600 h-3.5 w-3.5 rounded" 
              />
              <span className="text-gray-600 dark:text-gray-300">Noise Filter</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={echoCancellation} 
                disabled={isRecording}
                onChange={(e) => setEchoCancellation(e.target.checked)} 
                className="accent-indigo-600 h-3.5 w-3.5 rounded" 
              />
              <span className="text-gray-600 dark:text-gray-300">Echo Cancel</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoGainControl} 
                disabled={isRecording}
                onChange={(e) => setAutoGainControl(e.target.checked)} 
                className="accent-indigo-600 h-3.5 w-3.5 rounded" 
              />
              <span className="text-gray-600 dark:text-gray-300">Auto Gain</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Recording Console */}
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        
        {/* Visualizer Pulse / Mic Badge */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <div className="absolute w-28 h-28 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
          )}
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            isRecording 
              ? "bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-600/30 scale-105" 
              : "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-indigo-600/20"
          }`}>
            <MicrophoneIcon className="h-10 w-10 animate-pulse" />
          </div>
        </div>

        {/* Live Timer & Status */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-mono font-bold tracking-widest">
            {formatTime(recordingTime)}
          </div>
          <p className="text-xs font-medium text-indigo-400">
            {isRecording ? "🔴 Recording Live Stream..." : "Ready to Capture"}
          </p>
        </div>

        {/* Control Button */}
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-8 py-3.5 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-500 transition-all shadow-xl shadow-red-600/25 flex items-center gap-2.5 text-sm"
            >
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-8 py-3.5 rounded-2xl font-bold bg-gray-900 dark:bg-gray-800 text-white hover:bg-black transition-all shadow-xl border border-gray-700 flex items-center gap-2.5 text-sm"
            >
              <StopIcon className="h-5 w-5 text-red-400" />
              <span>Stop & Process</span>
            </button>
          )}
        </div>
      </div>

      {/* Playback & Export Preview */}
      {audioUrl && (
        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-800 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Session Preview Ready</span>
            </div>
            <button 
              onClick={() => { setAudioUrl(null); setAudioBlob(null); }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Discard recording"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <audio controls src={audioUrl} className="w-full rounded-xl" />

          <div className="flex justify-end pt-2">
            <a
              href={audioUrl}
              download={`studio-recording.${getFileExtension(audioBlob?.type || "audio/webm")}`}
              className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Download Master File</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}