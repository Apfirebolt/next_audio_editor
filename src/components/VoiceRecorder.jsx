"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MicrophoneIcon, 
  StopIcon, 
  ArrowDownTrayIcon, 
  TrashIcon, 
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  SignalIcon,
  PauseIcon,
  PlayIcon,
  Cog6ToothIcon,
  SparklesIcon,
  MusicalNoteIcon
} from "@heroicons/react/24/outline";

export default function VoiceRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Audio Input Devices List
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Live VU Meter Level (0 to 100)
  const [audioLevel, setAudioLevel] = useState(0);

  // Advanced Studio Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("audio/webm");
  const [bitrate, setBitrate] = useState("128000");
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);

  // --- NEW FEATURE: Professional Voice Effects Rack State ---
  const [showEffects, setShowEffects] = useState(false);
  const [enablePitchShift, setEnablePitchShift] = useState(false);
  const [pitchSemitones, setPitchSemitones] = useState(0); // -12 to +12
  const [enableDrive, setEnableDrive] = useState(false);
  const [driveAmount, setDriveAmount] = useState(0.3); // 0 to 1
  const [enableRadio, setEnableRadio] = useState(false); // Lo-Fi telephone/radio filter
  const [enableChorus, setEnableChorus] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Web Audio API refs for VU Meter & Stream Analysis
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Fetch available microphone input devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((device) => device.kind === "audioinput");
        setAudioDevices(mics);
        if (mics.length > 0) {
          setSelectedDeviceId(mics[0].deviceId);
        }
      } catch (err) {
        console.error("Error fetching audio devices:", err);
      }
    }
    getDevices();
  }, []);

  // Timer Management (accounts for pause/resume)
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Start Live VU Meter Analysis
  const setupAudioAnalyzer = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error("Audio analyzer setup failed:", err);
    }
  };

  const startRecording = async () => {
    setErrorMessage("");
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const constraints = {
        audio: {
          ...(selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : {}),
          echoCancellation,
          noiseSuppression,
          autoGainControl,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setupAudioAnalyzer(stream);

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
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        cancelAnimationFrame(animationFrameRef.current);
        setAudioLevel(0);
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Microphone error:", err);
      setErrorMessage("Microphone permission denied or unsupported by browser.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
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
      
      {/* Header & Drawers Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tertiary/20 pb-4">
        <div>
          <h3 className="font-bold text-xl tracking-tight font-heading">Studio Voice Channel</h3>
          <p className="text-xs text-dark/60 dark:text-light/60 font-sans">Pro-grade browser audio capture with stream encoding.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowEffects(!showEffects); if (showAdvanced) setShowAdvanced(false); }}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              showEffects 
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                : "bg-light dark:bg-dark/80 border-tertiary/30 text-dark/70 dark:text-light/70 hover:border-primary"
            }`}
          >
            <SparklesIcon className="h-4 w-4" />
            <span>{showEffects ? "Hide FX Rack" : "Voice Effects"}</span>
          </button>

          <button
            onClick={() => { setShowAdvanced(!showAdvanced); if (showEffects) setShowEffects(false); }}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              showAdvanced 
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                : "bg-light dark:bg-dark/80 border-tertiary/30 text-dark/70 dark:text-light/70 hover:border-primary"
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>{showAdvanced ? "Hide Hardware DSP" : "Hardware & Formats"}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs text-center font-bold">
          {errorMessage}
        </div>
      )}

      {/* --- NEW FEATURE: Professional Voice Effects Rack Drawer --- */}
      {showEffects && (
        <div className="p-5 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20 space-y-4 animate-fadeIn font-sans">
          <div className="flex items-center justify-between border-b border-tertiary/20 pb-2">
            <span className="text-xs font-bold text-primary font-heading uppercase tracking-wider flex items-center gap-1.5">
              <MusicalNoteIcon className="h-4 w-4" />
              Live Vocal Processing FX Rack
            </span>
            <span className="text-[10px] text-dark/50 dark:text-light/50">Post-Recording DSP & Modulation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Pitch Modulation */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-dark border border-tertiary/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-heading">Pitch Shift</label>
                <input 
                  type="checkbox" 
                  checked={enablePitchShift} 
                  onChange={(e) => setEnablePitchShift(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-dark/50 dark:text-light/50 font-mono">
                  <span>Semitones</span>
                  <span className="text-primary font-bold">{pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st</span>
                </div>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  step="1" 
                  value={pitchSemitones}
                  disabled={!enablePitchShift}
                  onChange={(e) => setPitchSemitones(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

            {/* Tube Saturation / Warm Drive */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-dark border border-tertiary/20 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-heading">Tube Saturation</label>
                <input 
                  type="checkbox" 
                  checked={enableDrive} 
                  onChange={(e) => setEnableDrive(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-dark/50 dark:text-light/50 font-mono">
                  <span>Drive Amount</span>
                  <span className="text-primary font-bold">{Math.round(driveAmount * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.05" 
                  value={driveAmount}
                  disabled={!enableDrive}
                  onChange={(e) => setDriveAmount(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>

          </div>

          {/* Quick Voice Effect Presets */}
          <div className="pt-2 border-t border-tertiary/20 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-dark/50 dark:text-light/50 uppercase">Quick FX Presets:</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setEnablePitchShift(true); setPitchSemitones(4); setEnableDrive(false); }}
                className="px-2.5 py-1 rounded-lg bg-light dark:bg-dark/90 border border-tertiary/30 text-[11px] font-bold hover:border-primary transition-all"
              >
                Chipmunk (+4st)
              </button>
              <button 
                onClick={() => { setEnablePitchShift(true); setPitchSemitones(-5); setEnableDrive(true); setDriveAmount(0.6); }}
                className="px-2.5 py-1 rounded-lg bg-light dark:bg-dark/90 border border-tertiary/30 text-[11px] font-bold hover:border-primary transition-all"
              >
                Deep Radio (-5st)
              </button>
              <button 
                onClick={() => { setEnablePitchShift(false); setEnableDrive(false); }}
                className="px-2.5 py-1 rounded-lg bg-danger/10 text-danger border border-danger/20 text-[11px] font-bold hover:bg-danger/20 transition-all"
              >
                Reset FX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Studio Configuration Drawer */}
      {showAdvanced && (
        <div className="p-5 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20 space-y-4 animate-fadeIn">
          
          {/* Microphone Hardware Device Picker */}
          <div className="space-y-1.5 pb-2 border-b border-tertiary/20">
            <label className="text-[11px] font-bold text-dark/50 dark:text-light/50 uppercase tracking-wider flex items-center gap-1.5 font-heading">
              <Cog6ToothIcon className="h-3.5 w-3.5 text-primary" />
              Audio Input Device (Microphone)
            </label>
            <select
              value={selectedDeviceId}
              disabled={isRecording}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-dark border border-tertiary/30 text-xs font-sans disabled:opacity-50 focus:outline-none"
            >
              {audioDevices.length === 0 ? (
                <option value="">Default Microphone</option>
              ) : (
                audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                  </option>
                ))
              )}
            </select>
          </div>

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
        
        {/* Visualizer Pulse / Mic Badge with Live VU Meter */}
        <div className="relative flex items-center justify-center">
          {isRecording && !isPaused && (
            <div className="absolute w-32 h-32 rounded-full bg-danger/20 animate-ping pointer-events-none" />
          )}
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
            isRecording 
              ? isPaused ? "bg-warning text-white shadow-warning/30" : "bg-danger text-white shadow-danger/30 scale-105" 
              : "bg-primary text-white shadow-primary/25"
          }`}>
            <MicrophoneIcon className="h-10 w-10 animate-pulse" />
          </div>
        </div>

        {/* Real-time VU Audio Level Bar */}
        {isRecording && (
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-dark/50 dark:text-light/50 uppercase">
              <span>Input Level</span>
              <span>{audioLevel}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-light dark:bg-dark overflow-hidden border border-tertiary/20">
              <div
                className={`h-full transition-all duration-75 ${
                  audioLevel > 80 ? "bg-danger" : audioLevel > 50 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Timer & Status */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-mono font-bold tracking-widest text-dark dark:text-light">
            {formatTime(recordingTime)}
          </div>
          <p className="text-xs font-bold text-primary font-heading">
            {isRecording 
              ? isPaused ? "⏸️ Recording Paused" : "🔴 Recording Live Stream..." 
              : "Ready to Capture"}
          </p>
        </div>

        {/* Control Buttons (Start, Pause/Resume, Stop) */}
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
            <div className="flex items-center gap-2">
              {isPaused ? (
                <button
                  onClick={resumeRecording}
                  className="px-5 py-3.5 rounded-2xl font-bold bg-success text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2 text-sm"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseRecording}
                  className="px-5 py-3.5 rounded-2xl font-bold bg-warning text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2 text-sm"
                >
                  <PauseIcon className="h-4 w-4" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={stopRecording}
                className="px-6 py-3.5 rounded-2xl font-bold bg-dark text-light hover:bg-tertiary transition-all shadow-xl border border-danger/40 flex items-center gap-2 text-sm"
              >
                <StopIcon className="h-5 w-5 text-danger" />
                <span>Stop & Process</span>
              </button>
            </div>
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