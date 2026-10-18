"use client";

import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon, PlayIcon, PauseIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as Tone from "tone";

export default function PlayInstrumentModal({ isOpen, onClose, tracks, recordedClips, selectedSynth }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0); // in seconds
  const [isDraggingCursor, setIsDraggingCursor] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const timelineRef = useRef(null);
  const playbackTimerRef = useRef(null);

  // Maximum timeline duration in seconds (defaults to 10s or max clip end)
  const maxDuration = Math.max(10, ...recordedClips.map((c) => c.offset + c.duration));

  useEffect(() => {
    if (!isOpen) {
      stopPlayback();
    }
  }, [isOpen]);

  // Handle Playback & Real-Time Note Triggering
  const startPlayback = async () => {
    await Tone.start();
    if (!selectedSynth) return;

    setIsPlaying(true);
    const now = Tone.now();
    const startOffset = cursorPosition;

    // Trigger clips starting from current cursor position
    recordedClips.forEach((clip) => {
      const track = tracks.find((t) => t.id === clip.trackId);
      if (track && !track.muted) {
        if (clip.offset >= startOffset) {
          const delay = clip.offset - startOffset;
          selectedSynth.triggerAttackRelease(
            clip.note,
            clip.duration,
            now + delay
          );
        } else if (clip.offset + clip.duration > startOffset) {
          // Clip has already started, play remaining duration
          const remainingDuration = clip.duration - (startOffset - clip.offset);
          selectedSynth.triggerAttackRelease(
            clip.note,
            remainingDuration,
            now
          );
        }
      }
    });

    // Animate playback cursor
    const startTimeRef = Date.now() - cursorPosition * 1000;
    playbackTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef) / 1000;
      if (elapsed >= maxDuration) {
        stopPlayback();
        setCursorPosition(0);
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
      stopPlayback(); // Stop current playback if scrubbing live
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
        recordedClips.forEach((clip) => {
          const track = tracks.find((t) => t.id === clip.trackId);
          if (track && !track.muted) {
            offlineSynth.triggerAttackRelease(clip.note, clip.duration, clip.offset);
          }
        });
      }, maxDuration + 1);

      // Convert AudioBuffer to WAV Blob
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

  // Helper to convert AudioBuffer to standard WAV Blob format
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Studio Master Arrangement Player</h2>
            <p className="text-xs text-gray-500">Scrub the playback cursor, preview your multi-track MIDI arrangements, or export.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Playback Controls & Export Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/25"
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              <span>{isPlaying ? "Pause Master" : "Play Master Mix"}</span>
            </button>
            <div className="font-mono text-sm font-bold text-indigo-400">
              {cursorPosition.toFixed(2)}s / {maxDuration.toFixed(2)}s
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCursorPosition(0)}
              className="text-xs font-semibold text-gray-500 hover:text-indigo-400 transition-colors"
            >
              Rewind
            </button>

            <button
              onClick={exportMasterMix}
              disabled={isExporting || recordedClips.length === 0}
              className="px-4 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-2 text-xs shadow-md disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{isExporting ? "Rendering WAV..." : "Export Master Mix (WAV)"}</span>
            </button>
          </div>
        </div>

        {/* Interactive Timeline Grid with Movable Cursor */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Multi-Track Lanes (Click to Scrub)</div>

          <div 
            ref={timelineRef}
            onMouseDown={handleTimelineMouseDown}
            className="relative h-72 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-hidden p-4 space-y-3 cursor-pointer select-none"
          >
            {/* Movable Playback Cursor Line */}
            <div
              style={{ left: `${(cursorPosition / maxDuration) * 100}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none flex flex-col items-center"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full -mt-1 shadow-md" />
            </div>

            {/* Render Tracks & MIDI Blocks */}
            {tracks.map((track) => {
              const trackClips = recordedClips.filter((c) => c.trackId === track.id);

              return (
                <div key={track.id} className="relative p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-indigo-400">{track.name}</span>
                    <span className="text-[10px] text-gray-500">{track.muted ? "Muted" : "Active"}</span>
                  </div>

                  <div className="relative h-14 bg-gray-50 dark:bg-gray-950 rounded-lg overflow-hidden flex items-center px-2">
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
                          className="absolute h-10 rounded-lg bg-indigo-600/90 border border-indigo-400 text-white p-1.5 flex flex-col justify-between shadow-sm pointer-events-none"
                        >
                          <div className="text-[9px] font-mono font-bold truncate">{clip.note}</div>
                          <div className="text-[8px] text-indigo-200 truncate">{clip.instrumentName}</div>
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