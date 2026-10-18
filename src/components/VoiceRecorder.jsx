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

export default function VoiceRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Advanced Studio Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("audio/webm");
  const [bitrate, setBitrate] = useState("128000");
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

      let mimeType = selectedFormat;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = "";
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
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        if (onRecordingComplete) {
          onRecordingComplete(url);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
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
    <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 shadow-xl space-y-6" data-aos="fade-up">
      
      {/* Header & Advanced Drawer Toggle */}
      <div className="flex items-center justify-between border-b border-tertiary/20 pb-4">
        <div>
          <h3 className="font-bold text-xl tracking-tight font-heading">Studio Voice Channel</h3>
          <p className="text-xs text-dark/60 dark:text-light/60 font-sans">Pro-grade browser audio capture with stream encoding.</p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
            showAdvanced 
              ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
              : "bg-light dark:bg-dark/80 border-tertiary/30 text-dark/70 dark:text-light/70 hover:border-primary"
          }`}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          <span>{showAdvanced ? "Hide Hardware DSP" : "Hardware DSP & Formats"}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs text-center font-bold">
          {errorMessage}
        </div>
      )}

      {/* Advanced Studio Configuration Drawer */}
      {showAdvanced && (
        <div className="p-5 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Format Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-dark/50 dark:text-light/50 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <SignalIcon className="h-3.5 w-3.5 text-primary" />
                Container Format
              </label>
              <select
                value={selectedFormat}
                disabled={isRecording}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-dark border border-tertiary/30 text-xs font-mono disabled:opacity-50 focus:outline-none"
              >
                <option value="audio/webm">WebM (Opus - Highly Optimized)</option>
                <option value="audio/mp4">MP4 / M4A (Apple / Safari Standard)</option>
                <option value="audio/ogg">OGG Opus (Open Standard)</option>
              </select>
            </div>

            {/* Bitrate Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-dark/50 dark:text-light/50 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-primary" />
                Audio Bitrate Quality
              </label>
              <select
                value={bitrate}
                disabled={isRecording}
                onChange={(e) => setBitrate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-dark border border-tertiary/30 text-xs font-mono disabled:opacity-50 focus:outline-none"
              >
                <option value="64000">64 kbps (Voice / Draft)</option>
                <option value="128000">128 kbps (Standard Stream)</option>
                <option value="256000">256 kbps (Studio High Quality)</option>
              </select>
            </div>
          </div>

          {/* Hardware DSP Toggles */}
          <div className="pt-2 border-t border-tertiary/20 grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer font-sans">
              <input 
                type="checkbox" 
                checked={noiseSuppression} 
                disabled={isRecording}
                onChange={(e) => setNoiseSuppression(e.target.checked)} 
                className="accent-primary h-3.5 w-3.5 rounded" 
              />
              <span className="text-dark/70 dark:text-light/70">Noise Filter</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-sans">
              <input 
                type="checkbox" 
                checked={echoCancellation} 
                disabled={isRecording}
                onChange={(e) => setEchoCancellation(e.target.checked)} 
                className="accent-primary h-3.5 w-3.5 rounded" 
              />
              <span className="text-dark/70 dark:text-light/70">Echo Cancel</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer font-sans">
              <input 
                type="checkbox" 
                checked={autoGainControl} 
                disabled={isRecording}
                onChange={(e) => setAutoGainControl(e.target.checked)} 
                className="accent-primary h-3.5 w-3.5 rounded" 
              />
              <span className="text-dark/70 dark:text-light/70">Auto Gain</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Recording Console */}
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        
        {/* Visualizer Pulse / Mic Badge */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <div className="absolute w-28 h-28 rounded-full bg-danger/20 animate-ping pointer-events-none" />
          )}
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            isRecording 
              ? "bg-danger text-white shadow-danger/30 scale-105" 
              : "bg-primary text-white shadow-primary/25"
          }`}>
            <MicrophoneIcon className="h-10 w-10 animate-pulse" />
          </div>
        </div>

        {/* Live Timer & Status */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-mono font-bold tracking-widest text-dark dark:text-light">
            {formatTime(recordingTime)}
          </div>
          <p className="text-xs font-bold text-primary font-heading">
            {isRecording ? "🔴 Recording Live Stream..." : "Ready to Capture"}
          </p>
        </div>

        {/* Control Button */}
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-8 py-3.5 rounded-2xl font-bold bg-danger text-white hover:opacity-90 transition-all shadow-xl shadow-danger/25 flex items-center gap-2.5 text-sm"
            >
              <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-8 py-3.5 rounded-2xl font-bold bg-dark text-light hover:bg-tertiary transition-all shadow-xl border border-danger/40 flex items-center gap-2.5 text-sm"
            >
              <StopIcon className="h-5 w-5 text-danger" />
              <span>Stop & Process</span>
            </button>
          )}
        </div>
      </div>

      {/* Playback & Export Preview */}
      {audioUrl && (
        <div className="space-y-4 pt-6 border-t border-tertiary/20 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs font-bold text-dark/50 dark:text-light/50 uppercase tracking-wider font-heading">Session Preview Ready</span>
            </div>
            <button 
              onClick={() => { setAudioUrl(null); setAudioBlob(null); }}
              className="text-dark/40 dark:text-light/40 hover:text-danger transition-colors p-1"
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
              className="px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-secondary transition-all flex items-center gap-2 shadow-lg shadow-primary/20 text-sm"
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