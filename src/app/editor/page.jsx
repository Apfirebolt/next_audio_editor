"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  ArrowUpTrayIcon,
  PlayIcon,
  PauseIcon,
  SparklesIcon,
  MusicalNoteIcon,
  AdjustmentsHorizontalIcon,
  BackwardIcon,
  ForwardIcon,
  ArrowPathIcon,
  BoltIcon,
  RadioIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from "@heroicons/react/24/outline";
import * as Tone from "tone";

const ALLOWED_EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "aac", "flac"];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
}

export default function AudioEditorPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Timeline / Length Scrubber States
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0); // in dB (-30 to +6)

  // Professional Audio Effect States
  // 1. Dynamics
  const [enableCompressor, setEnableCompressor] = useState(true);
  const [compressorThreshold, setCompressorThreshold] = useState(-24); // dB
  // 2. 3-Band Studio EQ
  const [enableEQ, setEnableEQ] = useState(true);
  const [eqLow, setEqLow] = useState(0); // dB (-12 to +12)
  const [eqMid, setEqMid] = useState(0); // dB (-12 to +12)
  const [eqHigh, setEqHigh] = useState(3); // dB (-12 to +12)
  const [vocalPresence, setVocalPresence] = useState(false); // Extra high-shelf sparkle boost
  // 3. Pitch Shift
  const [pitchShift, setPitchShift] = useState(0); // Semitones (-12 to +12)
  // 4. Hall Reverb
  const [enableReverb, setEnableReverb] = useState(false);
  const [reverbDecay, setReverbDecay] = useState(2.0); // seconds
  const [reverbWet, setReverbWet] = useState(0.3); // 0 to 1
  // 5. Echo / Delay
  const [enableDelay, setEnableDelay] = useState(false);
  const [delayTime, setDelayTime] = useState(0.25); // seconds
  const [delayFeedback, setDelayFeedback] = useState(0.35); // 0 to 0.9
  // 6. Warm Distortion / Drive
  const [enableDistortion, setEnableDistortion] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(0.3); // 0 to 1
  // 7. Chorus / Dimension
  const [enableChorus, setEnableChorus] = useState(false);
  const [chorusDepth, setChorusDepth] = useState(0.7); // 0 to 1
  // 8. Phaser / Jet sweep
  const [enablePhaser, setEnablePhaser] = useState(false);
  const [phaserFreq, setPhaserFreq] = useState(0.5); // Hz
  // 9. Tremolo / Pulse
  const [enableTremolo, setEnableTremolo] = useState(false);
  const [tremoloFreq, setTremoloFreq] = useState(4); // Hz
  // 10. Lo-Fi BitCrusher
  const [enableBitCrusher, setEnableBitCrusher] = useState(false);
  const [bitCrusherBits, setBitCrusherBits] = useState(8); // 1 to 16
  // 11. Stereo Widener
  const [enableWidener, setEnableWidener] = useState(false);
  const [widenerWidth, setWidenerWidth] = useState(0.7); // 0 to 1

  // Tone.js player & effects chain refs
  const playerRef = useRef(null);
  const compressorRef = useRef(null);
  const reverbRef = useRef(null);
  const eqRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const delayRef = useRef(null);
  const distortionRef = useRef(null);
  const chorusRef = useRef(null);
  const phaserRef = useRef(null);
  const tremoloRef = useRef(null);
  const bitCrusherRef = useRef(null);
  const widenerRef = useRef(null);
  const volumeRef = useRef(null);

  // Playhead tracking refs
  const playheadStartAudioTimeRef = useRef(0);
  const playheadStartOffsetRef = useRef(0);
  const animationFrameRef = useRef(null);
  const isPlayingRef = useRef(false);
  const durationRef = useRef(0);
  const isLoopingRef = useRef(false);

  // Keep refs in sync with state for animation loops & callbacks
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
    if (playerRef.current) {
      playerRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (volumeRef.current) {
      volumeRef.current.volume.value = masterVolume;
    }
  }, [masterVolume]);

  useEffect(() => {
    // Initialize Tone.js Effects Chain Nodes
    compressorRef.current = new Tone.Compressor({
      threshold: compressorThreshold,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });

    eqRef.current = new Tone.EQ3({
      low: eqLow,
      mid: eqMid,
      high: eqHigh
    });

    pitchShiftRef.current = new Tone.PitchShift({
      pitch: pitchShift,
      windowSize: 0.1
    });

    reverbRef.current = new Tone.Reverb({
      decay: reverbDecay,
      wet: reverbWet
    });

    delayRef.current = new Tone.FeedbackDelay({
      delayTime: delayTime,
      feedback: delayFeedback,
      wet: 0.35
    });

    distortionRef.current = new Tone.Distortion({
      distortion: distortionAmount,
      wet: 0.4
    });

    chorusRef.current = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: chorusDepth,
      wet: 0.5
    }).start();

    phaserRef.current = new Tone.Phaser({
      frequency: phaserFreq,
      octaves: 3,
      baseFrequency: 350,
      wet: 0.5
    });

    tremoloRef.current = new Tone.Tremolo({
      frequency: tremoloFreq,
      depth: 0.7,
      wet: 0.5
    }).start();

    bitCrusherRef.current = new Tone.BitCrusher({
      bits: bitCrusherBits,
      wet: 0.5
    });

    widenerRef.current = new Tone.StereoWidener({
      width: widenerWidth
    });

    volumeRef.current = new Tone.Volume(masterVolume);

    return () => {
      // Clean up Tone nodes on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      playerRef.current?.dispose();
      compressorRef.current?.dispose();
      reverbRef.current?.dispose();
      eqRef.current?.dispose();
      pitchShiftRef.current?.dispose();
      delayRef.current?.dispose();
      distortionRef.current?.dispose();
      chorusRef.current?.dispose();
      phaserRef.current?.dispose();
      tremoloRef.current?.dispose();
      bitCrusherRef.current?.dispose();
      widenerRef.current?.dispose();
      volumeRef.current?.dispose();
    };
  }, []);

  // Track playhead time smoothly using requestAnimationFrame
  const startTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const tick = () => {
      if (!isPlayingRef.current) return;

      const rawCtx = Tone.getContext().rawContext;
      const currentAudioTime = rawCtx ? rawCtx.currentTime : Tone.now();
      const elapsed = (currentAudioTime - playheadStartAudioTimeRef.current) * (playerRef.current?.playbackRate || 1);
      const totalDur = durationRef.current;

      if (totalDur > 0) {
        let computed = playheadStartOffsetRef.current + elapsed;
        if (isLoopingRef.current) {
          computed = computed % totalDur;
          setCurrentTime(computed);
          animationFrameRef.current = requestAnimationFrame(tick);
        } else {
          if (computed >= totalDur) {
            setCurrentTime(totalDur);
            setIsPlaying(false);
            isPlayingRef.current = false;
            try {
              playerRef.current?.stop();
            } catch (e) {
              console.error(e);
            }
          } else {
            setCurrentTime(computed);
            animationFrameRef.current = requestAnimationFrame(tick);
          }
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTracking = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Handle File Upload & Validation
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage("");
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setErrorMessage(`Invalid file format (.${fileExt}). Please upload a valid audio file.`);
      return;
    }

    setAudioFile(file);
    setFileName(file.name);
    setIsProcessing(true);
    setCurrentTime(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopTracking();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = Tone.getContext();
      const audioBuffer = await audioCtx.rawContext.decodeAudioData(arrayBuffer);

      setDuration(audioBuffer.duration);
      durationRef.current = audioBuffer.duration;

      // Create Tone.Player with the decoded buffer
      if (playerRef.current) {
        playerRef.current.dispose();
      }

      const player = new Tone.Player(audioBuffer);
      player.loop = isLooping;
      player.playbackRate = playbackRate;
      player.onstop = () => {
        if (!isLoopingRef.current && isPlayingRef.current) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          stopTracking();
        }
      };

      playerRef.current = player;
      
      // Build the routing chain: Player -> Effects -> Destination
      updateEffectChain();

    } catch (err) {
      console.error("Error decoding audio file:", err);
      setErrorMessage("Failed to decode audio file. The file might be corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-route audio nodes dynamically when user tweaks parameters
  const updateEffectChain = () => {
    if (!playerRef.current) return;

    playerRef.current.disconnect();
    let currentNode = playerRef.current;

    // 1. Pitch Shift / Harmonizer
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = pitchShift;
      currentNode.connect(pitchShiftRef.current);
      currentNode = pitchShiftRef.current;
    }

    // 2. 3-Band Equalizer & Vocal Presence
    if (eqRef.current) {
      if (enableEQ) {
        eqRef.current.low.value = eqLow;
        eqRef.current.mid.value = eqMid;
        eqRef.current.high.value = vocalPresence ? eqHigh + 6 : eqHigh;
        currentNode.connect(eqRef.current);
        currentNode = eqRef.current;
      }
    }

    // 3. Studio Warm Distortion / Saturation
    if (enableDistortion && distortionRef.current) {
      distortionRef.current.distortion = distortionAmount;
      currentNode.connect(distortionRef.current);
      currentNode = distortionRef.current;
    }

    // 4. Lo-Fi BitCrusher
    if (enableBitCrusher && bitCrusherRef.current) {
      bitCrusherRef.current.bits.value = bitCrusherBits;
      currentNode.connect(bitCrusherRef.current);
      currentNode = bitCrusherRef.current;
    }

    // 5. Studio Compressor
    if (enableCompressor && compressorRef.current) {
      compressorRef.current.threshold.value = compressorThreshold;
      currentNode.connect(compressorRef.current);
      currentNode = compressorRef.current;
    }

    // 6. Stereo Phaser
    if (enablePhaser && phaserRef.current) {
      phaserRef.current.frequency.value = phaserFreq;
      currentNode.connect(phaserRef.current);
      currentNode = phaserRef.current;
    }

    // 7. Tremolo Pulse
    if (enableTremolo && tremoloRef.current) {
      tremoloRef.current.frequency.value = tremoloFreq;
      currentNode.connect(tremoloRef.current);
      currentNode = tremoloRef.current;
    }

    // 8. Dimensional Chorus
    if (enableChorus && chorusRef.current) {
      chorusRef.current.depth = chorusDepth;
      currentNode.connect(chorusRef.current);
      currentNode = chorusRef.current;
    }

    // 9. Echo / Feedback Delay
    if (enableDelay && delayRef.current) {
      delayRef.current.delayTime.value = delayTime;
      delayRef.current.feedback.value = delayFeedback;
      currentNode.connect(delayRef.current);
      currentNode = delayRef.current;
    }

    // 10. Studio Hall Reverb
    if (enableReverb && reverbRef.current) {
      reverbRef.current.decay = reverbDecay;
      reverbRef.current.wet.value = reverbWet;
      currentNode.connect(reverbRef.current);
      currentNode = reverbRef.current;
    }

    // 11. Stereo Widener
    if (enableWidener && widenerRef.current) {
      widenerRef.current.width.value = widenerWidth;
      currentNode.connect(widenerRef.current);
      currentNode = widenerRef.current;
    }

    // 12. Master Volume
    if (volumeRef.current) {
      volumeRef.current.volume.value = masterVolume;
      currentNode.connect(volumeRef.current);
      currentNode = volumeRef.current;
    }

    // Final output to speakers
    currentNode.toDestination();
  };

  // Update effect nodes live when any parameter changes
  useEffect(() => {
    updateEffectChain();
  }, [
    enableCompressor,
    compressorThreshold,
    enableEQ,
    eqLow,
    eqMid,
    eqHigh,
    vocalPresence,
    pitchShift,
    enableReverb,
    reverbDecay,
    reverbWet,
    enableDelay,
    delayTime,
    delayFeedback,
    enableDistortion,
    distortionAmount,
    enableChorus,
    chorusDepth,
    enablePhaser,
    phaserFreq,
    enableTremolo,
    tremoloFreq,
    enableBitCrusher,
    bitCrusherBits,
    enableWidener,
    widenerWidth,
    masterVolume
  ]);

  // Start playback at specific time offset
  const playFromOffset = async (offset) => {
    await Tone.start();
    if (!playerRef.current) return;

    const clampedOffset = Math.max(0, Math.min(offset, durationRef.current));

    try {
      playerRef.current.stop();
    } catch (e) {
      console.error(e);
    }

    const rawCtx = Tone.getContext().rawContext;
    playheadStartAudioTimeRef.current = rawCtx ? rawCtx.currentTime : Tone.now();
    playheadStartOffsetRef.current = clampedOffset;

    const remaining = Math.max(0.01, durationRef.current - clampedOffset);
    playerRef.current.start(undefined, clampedOffset, isLoopingRef.current ? undefined : remaining);
    setIsPlaying(true);
    isPlayingRef.current = true;
    startTracking();
  };

  // Toggle Play / Pause
  const togglePlay = async () => {
    await Tone.start(); // Ensure browser audio context is unlocked

    if (isPlaying) {
      playerRef.current?.stop();
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopTracking();
      return;
    }

    let startAt = currentTime;
    if (startAt >= duration && duration > 0) {
      startAt = 0;
      setCurrentTime(0);
    }

    playFromOffset(startAt);
  };

  // Seek / Scrubber Handlers
  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekMouseDown = () => {
    setIsScrubbing(true);
    if (isPlaying) {
      playerRef.current?.stop();
      stopTracking();
    }
  };

  const handleSeekMouseUp = (e) => {
    setIsScrubbing(false);
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (isPlaying) {
      playFromOffset(newTime);
    }
  };

  const handleSkip = (seconds) => {
    const target = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(target);
    if (isPlaying) {
      playFromOffset(target);
    }
  };

  const handleResetToStart = () => {
    setCurrentTime(0);
    if (isPlaying) {
      playFromOffset(0);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Professional Studio Rack</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Upload vocals or instrument tracks, apply professional studio processing, compression, and pitch adjustments.
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
                {fileName ? <span className="text-indigo-400">{fileName}</span> : "Click to upload vocal track or drag & drop"}
              </p>
              <p className="text-xs text-gray-500">Supports MP3, WAV, FLAC, OGG, M4A</p>
            </div>
          </label>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Studio Rack Workspace */}
        {audioFile && (
          <div className="space-y-6 p-6 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Header with Master controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MusicalNoteIcon className="h-6 w-6 text-indigo-500" />
                <div>
                  <h3 className="font-semibold text-lg">Master Vocal Channel Strip</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    File: <span className="font-mono text-indigo-500 dark:text-indigo-400">{fileName}</span>
                  </p>
                </div>
              </div>

              {/* Master Volume */}
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800">
                {masterVolume <= -30 ? (
                  <SpeakerXMarkIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <SpeakerWaveIcon className="h-4 w-4 text-indigo-400" />
                )}
                <span className="text-xs text-gray-500">Vol</span>
                <input
                  type="range"
                  min="-30"
                  max="6"
                  step="1"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-24 accent-indigo-600 cursor-pointer"
                  title={`Master Volume: ${masterVolume > 0 ? `+${masterVolume}` : masterVolume} dB`}
                />
                <span className="text-xs font-mono text-gray-500 min-w-10 text-right">
                  {masterVolume > 0 ? `+${masterVolume}` : masterVolume}dB
                </span>
              </div>
            </div>

            {/* Song Scrubber & Full Length Timeline */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-gray-900/40 to-purple-950/20 border border-indigo-500/20 shadow-inner space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-semibold text-sm tracking-wide uppercase text-indigo-400">
                    Song Timeline & Playhead
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm">
                  <span className="text-indigo-400 font-bold">{formatTime(currentTime)}</span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-400">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Full Length Range Slider */}
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSeekChange}
                    onMouseDown={handleSeekMouseDown}
                    onTouchStart={handleSeekMouseDown}
                    onMouseUp={handleSeekMouseUp}
                    onTouchEnd={handleSeekMouseUp}
                    disabled={duration === 0 || isProcessing}
                    aria-label="Audio playback position scrubber"
                    className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>0:00.0</span>
                  <span>{duration > 0 ? `${((currentTime / duration) * 100).toFixed(1)}%` : "0%"}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200/40 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                  {/* Reset to Start */}
                  <button
                    onClick={handleResetToStart}
                    disabled={isProcessing}
                    title="Jump to Start"
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all disabled:opacity-40"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>

                  {/* Skip -5s */}
                  <button
                    onClick={() => handleSkip(-5)}
                    disabled={isProcessing}
                    title="Rewind 5 seconds"
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1 text-xs font-medium disabled:opacity-40"
                  >
                    <BackwardIcon className="h-4 w-4" />
                    <span>-5s</span>
                  </button>

                  {/* Play / Pause Primary Button */}
                  <button
                    onClick={togglePlay}
                    disabled={isProcessing}
                    className="px-6 py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-600/30"
                  >
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                    <span>{isPlaying ? "Pause Master" : "Play Master Preview"}</span>
                  </button>

                  {/* Skip +5s */}
                  <button
                    onClick={() => handleSkip(5)}
                    disabled={isProcessing}
                    title="Fast-forward 5 seconds"
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1 text-xs font-medium disabled:opacity-40"
                  >
                    <ForwardIcon className="h-4 w-4" />
                    <span>+5s</span>
                  </button>
                </div>

                {/* Speed & Loop toggles */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span>Speed:</span>
                    <select
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                      className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-mono text-gray-800 dark:text-gray-200 focus:outline-none"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="0.75">0.75x</option>
                      <option value="1">1.0x (Norm)</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setIsLooping(!isLooping)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                      isLooping
                        ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                        : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <ArrowPathIcon className={`h-3.5 w-3.5 ${isLooping ? "text-indigo-400" : ""}`} />
                    <span>Loop: {isLooping ? "ON" : "OFF"}</span>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Audio Effects Rack Header */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-indigo-500" />
                  Studio DSP Rack & Effects Chain
                </h4>
                <p className="text-xs text-gray-500">
                  Real-time DSP modules: Dynamics, 3-Band EQ, Pitch, Modulation, Echo, Reverb & Lo-Fi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* 1. Studio Compressor */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-indigo-400" />
                    Studio Compressor
                  </span>
                  <input
                    type="checkbox"
                    checked={enableCompressor}
                    onChange={(e) => setEnableCompressor(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Tames peaks & dynamics for a tight broadcast mix.</p>
                {enableCompressor && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Threshold</span>
                      <span className="font-mono text-indigo-400">{compressorThreshold} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="0"
                      step="1"
                      value={compressorThreshold}
                      onChange={(e) => setCompressorThreshold(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 2. 3-Band Equalizer & Vocal Presence */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-indigo-400" />
                    3-Band Studio EQ
                  </span>
                  <input
                    type="checkbox"
                    checked={enableEQ}
                    onChange={(e) => setEnableEQ(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Shape tonal balance across low, mid, and highs.</p>
                {enableEQ && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Bass Low</span>
                        <span className="font-mono">{eqLow > 0 ? `+${eqLow}` : eqLow} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqLow}
                        onChange={(e) => setEqLow(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Mid Range</span>
                        <span className="font-mono">{eqMid > 0 ? `+${eqMid}` : eqMid} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqMid}
                        onChange={(e) => setEqMid(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Treble High</span>
                        <span className="font-mono">{eqHigh > 0 ? `+${eqHigh}` : eqHigh} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={eqHigh}
                        onChange={(e) => setEqHigh(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center justify-between text-xs text-gray-400 pt-1 cursor-pointer">
                      <span>Air Sparkle Boost (+6dB)</span>
                      <input
                        type="checkbox"
                        checked={vocalPresence}
                        onChange={(e) => setVocalPresence(e.target.checked)}
                        className="accent-indigo-600 h-3.5 w-3.5"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* 3. Pitch Shift */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <MusicalNoteIcon className="h-4 w-4 text-indigo-400" />
                    Pitch Shift
                  </span>
                  <span className="text-xs font-mono text-indigo-400">
                    {pitchShift > 0 ? `+${pitchShift}` : pitchShift} st
                  </span>
                </div>
                <p className="text-xs text-gray-500">Semitone transposition (-12 to +12 octaves).</p>
                <div className="space-y-2 pt-1">
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={pitchShift}
                    onChange={(e) => setPitchShift(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between">
                    <button
                      onClick={() => setPitchShift(0)}
                      className="text-[11px] text-gray-500 hover:text-indigo-400 underline"
                    >
                      Reset (0 st)
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPitchShift(-12)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      >
                        -1 Oct
                      </button>
                      <button
                        onClick={() => setPitchShift(12)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      >
                        +1 Oct
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Echo / Feedback Delay */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <RadioIcon className="h-4 w-4 text-indigo-400" />
                    Feedback Delay / Echo
                  </span>
                  <input
                    type="checkbox"
                    checked={enableDelay}
                    onChange={(e) => setEnableDelay(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Rhythmic stereo repeats and slapback delay.</p>
                {enableDelay && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Delay Time</span>
                        <span className="font-mono text-indigo-400">{delayTime}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={delayTime}
                        onChange={(e) => setDelayTime(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Feedback</span>
                        <span className="font-mono">{Math.round(delayFeedback * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.85"
                        step="0.05"
                        value={delayFeedback}
                        onChange={(e) => setDelayFeedback(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Studio Hall Reverb */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4 text-indigo-400" />
                    Studio Hall Reverb
                  </span>
                  <input
                    type="checkbox"
                    checked={enableReverb}
                    onChange={(e) => setEnableReverb(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Acoustic room space & lush atmospheric decay.</p>
                {enableReverb && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Decay Time</span>
                        <span className="font-mono text-indigo-400">{reverbDecay}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={reverbDecay}
                        onChange={(e) => setReverbDecay(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Reverb Mix (Wet)</span>
                        <span className="font-mono">{Math.round(reverbWet * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={reverbWet}
                        onChange={(e) => setReverbWet(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Warm Saturation & Distortion */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <BoltIcon className="h-4 w-4 text-indigo-400" />
                    Warm Drive / Distortion
                  </span>
                  <input
                    type="checkbox"
                    checked={enableDistortion}
                    onChange={(e) => setEnableDistortion(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Analog tube warmth, harmonic grit and fuzz.</p>
                {enableDistortion && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Drive Amount</span>
                      <span className="font-mono text-indigo-400">{Math.round(distortionAmount * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={distortionAmount}
                      onChange={(e) => setDistortionAmount(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 7. Dimensional Chorus */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <MusicalNoteIcon className="h-4 w-4 text-indigo-400" />
                    Dimensional Chorus
                  </span>
                  <input
                    type="checkbox"
                    checked={enableChorus}
                    onChange={(e) => setEnableChorus(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Lush ensemble thickening and modulation shimmer.</p>
                {enableChorus && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Depth</span>
                      <span className="font-mono text-indigo-400">{Math.round(chorusDepth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={chorusDepth}
                      onChange={(e) => setChorusDepth(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 8. Stereo Phaser */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <RadioIcon className="h-4 w-4 text-indigo-400" />
                    Stereo Phaser
                  </span>
                  <input
                    type="checkbox"
                    checked={enablePhaser}
                    onChange={(e) => setEnablePhaser(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Swirling psychedelic 70s phase cancellation sweeps.</p>
                {enablePhaser && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Frequency</span>
                      <span className="font-mono text-indigo-400">{phaserFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={phaserFreq}
                      onChange={(e) => setPhaserFreq(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 9. Tremolo Pulse */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <BoltIcon className="h-4 w-4 text-indigo-400" />
                    Tremolo Strobe
                  </span>
                  <input
                    type="checkbox"
                    checked={enableTremolo}
                    onChange={(e) => setEnableTremolo(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Rhythmic volume fluctuation and stutter effect.</p>
                {enableTremolo && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Speed</span>
                      <span className="font-mono text-indigo-400">{tremoloFreq} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={tremoloFreq}
                      onChange={(e) => setTremoloFreq(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 10. Lo-Fi BitCrusher */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <RadioIcon className="h-4 w-4 text-indigo-400" />
                    Lo-Fi BitCrusher
                  </span>
                  <input
                    type="checkbox"
                    checked={enableBitCrusher}
                    onChange={(e) => setEnableBitCrusher(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Downsamples bit depth for vintage video game crunch.</p>
                {enableBitCrusher && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Resolution</span>
                      <span className="font-mono text-indigo-400">{bitCrusherBits} bits</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      step="1"
                      value={bitCrusherBits}
                      onChange={(e) => setBitCrusherBits(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 11. Stereo Widener */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <SpeakerWaveIcon className="h-4 w-4 text-indigo-400" />
                    Stereo Widener
                  </span>
                  <input
                    type="checkbox"
                    checked={enableWidener}
                    onChange={(e) => setEnableWidener(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">Expands the stereo panorama field for an immersive mix.</p>
                {enableWidener && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Width</span>
                      <span className="font-mono text-indigo-400">{Math.round(widenerWidth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={widenerWidth}
                      onChange={(e) => setWidenerWidth(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}