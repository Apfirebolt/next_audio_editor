"use client";

import React, { useState, useRef, useEffect } from "react";
import WavesurferPlayer from "@wavesurfer/react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { 
  PlayIcon, 
  PauseIcon, 
  TrashIcon, 
  ScissorsIcon, 
  ArrowPathIcon,
  MusicalNoteIcon
} from "@heroicons/react/24/outline";

export default function MultiTrackTimeline() {
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Handle Audio File Upload into Multi-Track Stack
  const handleTrackUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newTracks = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      url: URL.createObjectURL(file),
      volume: 1.0,
      muted: false,
      solo: false,
      wavesurferRef: React.createRef(),
      regionsRef: null,
    }));

    setTracks((prev) => [...prev, ...newTracks]);
  };

  // Remove a track from timeline
  const removeTrack = (id) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle Global Play/Pause across all tracks
  const togglePlayAll = () => {
    setIsPlaying(!isPlaying);
    tracks.forEach((track) => {
      const ws = track.wavesurferRef.current;
      if (ws) {
        if (!isPlaying) {
          ws.play();
        } else {
          ws.pause();
        }
      }
    });
  };

  // Add a Region (Selection for looping/trimming) on a specific track
  const addRegion = (track) => {
    if (track.regionsRef) {
      track.regionsRef.addRegion({
        start: 1,
        end: 4,
        color: "rgba(99, 102, 241, 0.3)", // Indigo accent
        drag: true,
        resize: true,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
      
      {/* Timeline Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h3 className="font-bold text-xl tracking-tight">Multi-Track DAW Timeline</h3>
          <p className="text-xs text-gray-500">Stack tracks, inspect waveforms, and slice audio regions.</p>
        </div>

        <div className="flex items-center gap-3">
          {tracks.length > 0 && (
            <button
              onClick={togglePlayAll}
              className="px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20"
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              <span>{isPlaying ? "Pause Master" : "Play Master Mix"}</span>
            </button>
          )}

          <label className="cursor-pointer px-5 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all text-sm border border-gray-300 dark:border-gray-700">
            <span>+ Add Audio Track</span>
            <input type="file" accept="audio/*" multiple onChange={handleTrackUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Tracks Container */}
      {tracks.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-12 text-center space-y-3 bg-gray-50/50 dark:bg-gray-950/40">
          <MusicalNoteIcon className="h-10 w-10 mx-auto text-indigo-400 opacity-60" />
          <h4 className="font-semibold text-base">No Tracks on Timeline</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Upload MP3, WAV, or OGG audio files to begin multi-track editing and waveform slicing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tracks.map((track, index) => (
            <TrackLane 
              key={track.id} 
              track={track} 
              index={index} 
              onRemove={() => removeTrack(track.id)}
              onAddRegion={() => addRegion(track)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component for individual track lane & waveform rendering
function TrackLane({ track, index, onRemove, onAddRegion }) {
  const [isLanePlaying, setIsLanePlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [muted, setMuted] = useState(false);

  const onReady = (wavesurfer) => {
    track.wavesurferRef.current = wavesurfer;
    
    // Initialize Regions Plugin for slicing / looping
    const wsRegions = wavesurfer.registerPlugin(RegionsPlugin.create());
    track.regionsRef = wsRegions;

    wavesurfer.on("play", () => setIsLanePlaying(true));
    wavesurfer.on("pause", () => setIsLanePlaying(false));
    wavesurfer.on("finish", () => setIsLanePlaying(false));
  };

  const toggleLanePlay = () => {
    const ws = track.wavesurferRef.current;
    if (ws) ws.playPause();
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const ws = track.wavesurferRef.current;
    if (ws) ws.setVolume(val);
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    const ws = track.wavesurferRef.current;
    if (ws) ws.setMuted(nextMuted);
  };

  return (
    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-xs flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <span className="font-semibold text-sm truncate max-w-xs">{track.name}</span>
        </div>

        {/* Track Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddRegion}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Create selectable region for looping/trimming"
          >
            <ScissorsIcon className="h-3.5 w-3.5" />
            <span>Add Region</span>
          </button>

          <button
            onClick={toggleMute}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              muted ? "bg-red-500/20 text-red-400" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {muted ? "Muted" : "Mute"}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 accent-indigo-600 cursor-pointer"
            title="Track Volume"
          />

          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
            title="Delete Track"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* WaveSurfer.js Waveform Container */}
      <div className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <WavesurferPlayer
          height={64}
          waveColor="#6366f1"
          progressColor="#4338ca"
          cursorColor="#ffffff"
          barWidth={3}
          barGap={2}
          barRadius={3}
          url={track.url}
          onReady={onReady}
        />
      </div>
    </div>
  );
}