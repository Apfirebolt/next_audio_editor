"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  XMarkIcon, 
  PlayIcon, 
  PauseIcon, 
  ArrowDownTrayIcon, 
  MusicalNoteIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon, 
  ArrowPathIcon 
} from "@heroicons/react/24/outline";
import * as Tone from "tone";

export default function PlayInstrumentModal({ isOpen, onClose, tracks, recordedClips, selectedSynth }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0); // in seconds
  const [isDraggingCursor, setIsDraggingCursor] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // New Studio Features
  const [masterVolume, setMasterVolume] = useState(0); // in dB (-30 to +6)
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  const timelineRef = useRef(null);
  const playbackTimerRef = useRef(null);

  // Maximum timeline duration in seconds (defaults to 10s or max clip end)
  const maxDuration = Math.max(10, ...recordedClips.map((c) => c.offset + c.duration));

  useEffect(() => {
    if (!isOpen) {
      stopPlayback();
    }
  }, [isOpen]);

  // Apply Volume and Mute to Synth if available
  useEffect(() => {
    if (selectedSynth) {
      selectedSynth.volume.value = isMuted ? -Infinity : masterVolume;
    }
  }, [masterVolume, isMuted, selectedSynth]);

  // Handle Playback & Real-Time Note Triggering
  const startPlayback = async () => {
    await Tone.start();
    if (!selectedSynth) return;

    setIsPlaying(true);
    const now = Tone.now();
    const startOffset = cursorPosition;

    // Apply playback speed modifier to timing
    const effectiveSpeed = playbackSpeed;

    recordedClips.forEach((clip) => {
      const track = tracks.find((t) => t.id === clip.trackId);
      if (track && !track.muted) {
        if (clip.offset >= startOffset) {
          const delay = (clip.offset - startOffset) / effectiveSpeed;
          selectedSynth.triggerAttackRelease(
            clip.note,
            clip.duration / effectiveSpeed,
            now + delay
          );
        } else if (clip.offset + clip.duration > startOffset) {
          const remainingDuration = (clip.duration - (startOffset - clip.offset)) / effectiveSpeed;
          selectedSynth.triggerAttackRelease(
            clip.note,
            remainingDuration,
            now
          );
        }
      }
    });

    // Animate playback cursor
    const startTimeRef = Date.now() - (cursorPosition * 1000) / effectiveSpeed;
    playbackTimerRef.current = setInterval(() => {
      const elapsed = ((Date.now() - startTimeRef) / 1000) * effectiveSpeed;
      if (elapsed >= maxDuration) {
        if (isLooping) {
          setCursorPosition(0);
          stopPlayback();
          startPlayback();
        } else {
          stopPlayback();
          setCursorPosition(0);
        }
      } else {
        setCursorPosition(elapsed);
      }
    }, 50);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    clearInterval(playbackTimerRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // --- TIMELINE CURSOR SCRUBBING (DRAG & DROP) ---
  const handleTimelineMouseDown = (e) => {
    setIsDraggingCursor(true);
    updateCursorFromMouseEvent(e);
  };

  const updateCursorFromMouseEvent = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = Math.max(0, e.clientX - rect.left);
    const percentage = clickX / rect.width;
    const newTime = percentage * maxDuration;
    setCursorPosition(Math.min(newTime, maxDuration));
    if (isPlaying) {
      stopPlayback();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingCursor) {
        updateCursorFromMouseEvent(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingCursor(false);
    };

    if (isDraggingCursor) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingCursor, maxDuration, isPlaying]);

  // --- EXPORT MASTER MIX (WAV) USING TONE.OFFLINE ---
  const exportMasterMix = async () => {
    setIsExporting(true);
    try {
      const buffer = await Tone.Offline(async () => {
        const offlineSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        offlineSynth.volume.value = masterVolume;
        recordedClips.forEach((clip) => {
          const track = tracks.find((t) => t.id === clip.trackId);
          if (track && !track.muted) {
            offlineSynth.triggerAttackRelease(clip.note, clip.duration / playbackSpeed, clip.offset / playbackSpeed);
          }
        });
      }, (maxDuration / playbackSpeed) + 1);

      const wavBlob = audioBufferToWav(buffer);
      const url = URL.createObjectURL(wavBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "beats-lounge-master-mix.wav";
      a.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const audioBufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let channels = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setString(str) {
      for (let i = 0; i < str.length; i++) {
        out.setUint8(pos++, str.charCodeAt(i));
      }
    }

    function setUint16(data) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    setString("RIFF");
    setUint32(length - 8);
    setString("WAVE");
    setString("fmt ");
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setString("data");
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: "audio/wav" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white/90 dark:bg-dark/95 border border-tertiary/20 dark:border-tertiary/10 shadow-2xl p-8 space-y-6 backdrop-blur-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tertiary/20 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight font-heading flex items-center gap-2">
              <MusicalNoteIcon className="h-5 w-5 text-primary" />
              <span>Studio Master Arrangement Player</span>
            </h2>
            <p className="text-xs text-dark/60 dark:text-light/60 font-sans">Scrub the playback cursor, preview your multi-track MIDI arrangements, or export.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-tertiary/10 hover:bg-tertiary/20 text-dark dark:text-light transition-colors border border-tertiary/20"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Playback Controls & Studio Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-light/50 dark:bg-dark/50 p-4 rounded-2xl border border-tertiary/20">
          
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="px-6 py-2.5 rounded-xl font-bold bg-primary hover:bg-secondary text-white transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/25"
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              <span>{isPlaying ? "Pause Master" : "Play Master Mix"}</span>
            </button>
            <div className="font-mono text-sm font-bold text-primary">
              {cursorPosition.toFixed(2)}s / {maxDuration.toFixed(2)}s
            </div>
          </div>

          {/* New Studio Options: Volume, Speed, Loop, Rewind, Export */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Master Volume Slider & Mute */}
            <div className="flex items-center gap-2 bg-white dark:bg-dark px-3 py-1.5 rounded-xl border border-tertiary/20">
              <button onClick={() => setIsMuted(!isMuted)} className="text-primary hover:opacity-80">
                {isMuted || masterVolume <= -30 ? <SpeakerXMarkIcon className="h-4 w-4 text-danger" /> : <SpeakerWaveIcon className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="-30"
                max="6"
                step="1"
                value={isMuted ? -30 : masterVolume}
                onChange={(e) => {
                  setMasterVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 accent-primary cursor-pointer"
                title="Master Volume"
              />
              <span className="text-[10px] font-mono text-dark/60 dark:text-light/60 min-w-8 text-right">
                {masterVolume > 0 ? `+${masterVolume}` : masterVolume}dB
              </span>
            </div>

            {/* Playback Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-white dark:bg-dark border border-tertiary/30 rounded-xl px-2.5 py-1.5 text-xs font-mono text-dark dark:text-light focus:outline-none"
            >
              <option value="0.5">0.5x Speed</option>
              <option value="1">1.0x Normal</option>
              <option value="1.25">1.25x Speed</option>
              <option value="1.5">1.5x Speed</option>
            </select>

            {/* Loop Toggle */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isLooping ? "bg-primary/20 border-primary text-primary" : "bg-white dark:bg-dark border-tertiary/30 text-dark/60 dark:text-light/60"
              }`}
            >
              Loop: {isLooping ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => setCursorPosition(0)}
              className="text-xs font-bold text-dark/60 dark:text-light/60 hover:text-primary transition-colors font-sans px-2"
            >
              Rewind
            </button>

            <button
              onClick={exportMasterMix}
              disabled={isExporting || recordedClips.length === 0}
              className="px-4 py-2.5 rounded-xl font-bold bg-success text-white hover:opacity-90 transition-all flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{isExporting ? "Rendering WAV..." : "Export (WAV)"}</span>
            </button>
          </div>
        </div>

        {/* Interactive Timeline Grid with Movable Cursor */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-dark/50 dark:text-light/50 uppercase tracking-wider font-heading">
            Multi-Track Lanes (Click to Scrub)
          </div>

          <div 
            ref={timelineRef}
            onMouseDown={handleTimelineMouseDown}
            className="relative h-72 rounded-2xl bg-light dark:bg-dark border border-tertiary/20 overflow-y-auto overflow-x-hidden p-4 space-y-3 cursor-pointer select-none shadow-inner"
          >
            {/* Movable Playback Cursor Line */}
            <div
              style={{ left: `${(cursorPosition / maxDuration) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-danger z-30 pointer-events-none flex flex-col items-center"
            >
              <div className="w-3 h-3 bg-danger rounded-full -mt-1 shadow-md" />
            </div>

            {/* Render Tracks & MIDI Blocks */}
            {tracks.map((track) => {
              const trackClips = recordedClips.filter((c) => c.trackId === track.id);

              return (
                <div key={track.id} className="relative p-3.5 rounded-xl bg-white/60 dark:bg-dark/60 border border-tertiary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary font-heading">{track.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${track.muted ? "bg-danger/20 text-danger" : "bg-success/20 text-success"}`}>
                      {track.muted ? "MUTED" : "ACTIVE"}
                    </span>
                  </div>

                  <div className="relative h-14 bg-light/50 dark:bg-dark/80 rounded-lg overflow-hidden flex items-center px-2 border border-tertiary/10">
                    {trackClips.map((clip) => {
                      const leftPercent = (clip.offset / maxDuration) * 100;
                      const widthPercent = (clip.duration / maxDuration) * 100;

                      return (
                        <div
                          key={clip.id}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(widthPercent, 5)}%`,
                          }}
                          className="absolute h-10 rounded-lg bg-primary border border-tertiary/40 text-white p-1.5 flex flex-col justify-between shadow-md pointer-events-none"
                        >
                          <div className="text-[9px] font-mono font-bold truncate">{clip.note}</div>
                          <div className="text-[8px] text-light/80 truncate font-sans">{clip.instrumentName}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}