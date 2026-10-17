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
  SpeakerXMarkIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  InformationCircleIcon
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

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // audio format (1 = PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: "audio/wav" });
}

// Real-time encode AudioBuffer to WebM, OGG, or MP4 using MediaRecorder with accelerated playback
async function encodeAudioBufferWithMediaRecorder(buffer, mimeType, bitrate = 192000, onProgress = () => {}) {
  const offlineCtx = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: buffer.sampleRate
  });
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = buffer;

  // Accelerate encoding playback if browser allows (e.g. 2x) to cut export time in half
  const speedMultiplier = 2.0;
  sourceNode.playbackRate.value = speedMultiplier;

  const destNode = offlineCtx.createMediaStreamDestination();
  sourceNode.connect(destNode);

  const recorderOptions = { audioBitsPerSecond: bitrate };
  if (mimeType && MediaRecorder.isTypeSupported(mimeType)) {
    recorderOptions.mimeType = mimeType;
  }

  const recorder = new MediaRecorder(destNode.stream, recorderOptions);
  const chunks = [];

  const recordPromise = new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    recorder.onstop = () => {
      offlineCtx.close();
      const outputType = recorder.mimeType || mimeType || "audio/webm";
      resolve(new Blob(chunks, { type: outputType }));
    };
    recorder.onerror = (err) => {
      offlineCtx.close();
      reject(err);
    };
  });

  const durationSec = buffer.duration / speedMultiplier;
  const startTime = Date.now();
  const progressTimer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const pct = Math.min(95, Math.round((elapsed / Math.max(0.1, durationSec)) * 100));
    onProgress(pct);
  }, 200);

  recorder.start();
  sourceNode.start(0);

  sourceNode.onended = () => {
    clearInterval(progressTimer);
    setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, 150);
  };

  return recordPromise;
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
  // 12. Noise Cancellation / Gate & Rumble Filter
  const [enableNoiseCancel, setEnableNoiseCancel] = useState(false);
  const [noiseGateThreshold, setNoiseGateThreshold] = useState(-38); // dB (-60 to -15)
  const [noiseSmoothing, setNoiseSmoothing] = useState(0.08); // seconds

  // Export Settings States
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0); // 0 to 100
  const [exportFormat, setExportFormat] = useState("wav"); // "wav" | "webm" | "ogg" | "mp4"
  const [exportBitrate, setExportBitrate] = useState("192000"); // 128000 | 192000 | 256000 | 320000
  const [exportChannels, setExportChannels] = useState("2"); // 1 | 2
  const [exportStatusText, setExportStatusText] = useState("");
  const [decodedBuffer, setDecodedBuffer] = useState(null);

  // Tone.js player & effects chain refs
  const playerRef = useRef(null);
  const noiseGateRef = useRef(null);
  const rumbleFilterRef = useRef(null);
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
    noiseGateRef.current = new Tone.Gate({
      threshold: noiseGateThreshold,
      smoothing: noiseSmoothing
    });

    rumbleFilterRef.current = new Tone.Filter({
      frequency: 75,
      type: "highpass",
      rolloff: -12
    });

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
      noiseGateRef.current?.dispose();
      rumbleFilterRef.current?.dispose();
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

      setDecodedBuffer(audioBuffer);
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

    // 0. Intelligent Noise Gate & Rumble Filter (Placed upfront to clean background hiss & low rumble)
    if (enableNoiseCancel) {
      if (rumbleFilterRef.current) {
        currentNode.connect(rumbleFilterRef.current);
        currentNode = rumbleFilterRef.current;
      }
      if (noiseGateRef.current) {
        noiseGateRef.current.threshold = noiseGateThreshold;
        noiseGateRef.current.smoothing = noiseSmoothing;
        currentNode.connect(noiseGateRef.current);
        currentNode = noiseGateRef.current;
      }
    }

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
    enableNoiseCancel,
    noiseGateThreshold,
    noiseSmoothing,
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

  // Offline rendering and export pipeline
  const handleExportAudio = async () => {
    if (!decodedBuffer || duration <= 0) {
      setErrorMessage("Please upload an audio file first before exporting.");
      return;
    }

    // Stop live playback before rendering
    if (isPlaying) {
      playerRef.current?.stop();
      setIsPlaying(false);
      isPlayingRef.current = false;
      stopTracking();
    }

    setIsExporting(true);
    setExportProgress(10);
    setExportStatusText("Initializing offline DSP render engine...");

    try {
      const renderDuration = duration / (playbackRate || 1);
      const channels = parseInt(exportChannels, 10) || 2;
      const sampleRate = decodedBuffer.sampleRate || 44100;

      setExportProgress(25);
      setExportStatusText("Applying studio effects chain...");

      // Tone.Offline executes all scheduling synchronously and renders faster than real-time
      const renderedToneBuffer = await Tone.Offline(async () => {
        const offlinePlayer = new Tone.Player(decodedBuffer);
        offlinePlayer.playbackRate = playbackRate;

        let node = offlinePlayer;

        // 0. Intelligent Noise Gate & Rumble Filter
        if (enableNoiseCancel) {
          const offlineRumble = new Tone.Filter({
            frequency: 75,
            type: "highpass",
            rolloff: -12
          });
          const offlineGate = new Tone.Gate({
            threshold: noiseGateThreshold,
            smoothing: noiseSmoothing
          });
          node.connect(offlineRumble);
          offlineRumble.connect(offlineGate);
          node = offlineGate;
        }

        // 1. Pitch Shift
        if (pitchShift !== 0) {
          const offlinePitch = new Tone.PitchShift({
            pitch: pitchShift,
            windowSize: 0.1
          });
          node.connect(offlinePitch);
          node = offlinePitch;
        }

        // 2. EQ
        if (enableEQ) {
          const offlineEQ = new Tone.EQ3({
            low: eqLow,
            mid: eqMid,
            high: vocalPresence ? eqHigh + 6 : eqHigh
          });
          node.connect(offlineEQ);
          node = offlineEQ;
        }

        // 3. Distortion
        if (enableDistortion) {
          const offlineDist = new Tone.Distortion({
            distortion: distortionAmount,
            wet: 0.4
          });
          node.connect(offlineDist);
          node = offlineDist;
        }

        // 4. BitCrusher
        if (enableBitCrusher) {
          const offlineCrush = new Tone.BitCrusher({
            bits: bitCrusherBits,
            wet: 0.5
          });
          node.connect(offlineCrush);
          node = offlineCrush;
        }

        // 5. Compressor
        if (enableCompressor) {
          const offlineComp = new Tone.Compressor({
            threshold: compressorThreshold,
            ratio: 4,
            attack: 0.003,
            release: 0.25
          });
          node.connect(offlineComp);
          node = offlineComp;
        }

        // 6. Phaser
        if (enablePhaser) {
          const offlinePhaser = new Tone.Phaser({
            frequency: phaserFreq,
            octaves: 3,
            baseFrequency: 350,
            wet: 0.5
          });
          node.connect(offlinePhaser);
          node = offlinePhaser;
        }

        // 7. Tremolo
        if (enableTremolo) {
          const offlineTremolo = new Tone.Tremolo({
            frequency: tremoloFreq,
            depth: 0.7,
            wet: 0.5
          }).start(0);
          node.connect(offlineTremolo);
          node = offlineTremolo;
        }

        // 8. Chorus
        if (enableChorus) {
          const offlineChorus = new Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: chorusDepth,
            wet: 0.5
          }).start(0);
          node.connect(offlineChorus);
          node = offlineChorus;
        }

        // 9. Delay
        if (enableDelay) {
          const offlineDelay = new Tone.FeedbackDelay({
            delayTime: delayTime,
            feedback: delayFeedback,
            wet: 0.35
          });
          node.connect(offlineDelay);
          node = offlineDelay;
        }

        // 10. Reverb
        if (enableReverb) {
          const offlineReverb = new Tone.Reverb({
            decay: reverbDecay,
            wet: reverbWet
          });
          await offlineReverb.generate();
          node.connect(offlineReverb);
          node = offlineReverb;
        }

        // 11. Widener
        if (enableWidener) {
          const offlineWidener = new Tone.StereoWidener({
            width: widenerWidth
          });
          node.connect(offlineWidener);
          node = offlineWidener;
        }

        // 12. Volume
        const offlineVol = new Tone.Volume(masterVolume);
        node.connect(offlineVol);
        offlineVol.toDestination();

        // Start playback inside offline context
        offlinePlayer.start(0);
      }, renderDuration, channels, sampleRate);

      setExportProgress(65);
      setExportStatusText(`Encoding audio to ${exportFormat.toUpperCase()} format...`);

      const rawAudioBuffer = renderedToneBuffer.get();
      let outputBlob = null;
      let fileExtension = exportFormat;

      if (exportFormat === "wav") {
        outputBlob = audioBufferToWav(rawAudioBuffer);
        fileExtension = "wav";
      } else if (exportFormat === "ogg") {
        const supportedType = [
          "audio/ogg;codecs=opus",
          "audio/ogg",
          "audio/webm;codecs=opus"
        ].find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "audio/ogg";
        outputBlob = await encodeAudioBufferWithMediaRecorder(
          rawAudioBuffer,
          supportedType,
          parseInt(exportBitrate, 10),
          (pct) => {
            setExportProgress(65 + Math.round(pct * 0.25));
            setExportStatusText(`Encoding compressed OGG stream (${pct}%)...`);
          }
        );
        fileExtension = "ogg";
      } else if (exportFormat === "mp4") {
        const supportedType = [
          "audio/mp4",
          "audio/aac",
          "audio/webm;codecs=opus"
        ].find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "audio/mp4";
        outputBlob = await encodeAudioBufferWithMediaRecorder(
          rawAudioBuffer,
          supportedType,
          parseInt(exportBitrate, 10),
          (pct) => {
            setExportProgress(65 + Math.round(pct * 0.25));
            setExportStatusText(`Encoding compressed AAC/MP4 stream (${pct}%)...`);
          }
        );
        fileExtension = "m4a";
      } else {
        // webm
        const supportedType = [
          "audio/webm;codecs=opus",
          "audio/webm"
        ].find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "audio/webm";
        outputBlob = await encodeAudioBufferWithMediaRecorder(
          rawAudioBuffer,
          supportedType,
          parseInt(exportBitrate, 10),
          (pct) => {
            setExportProgress(65 + Math.round(pct * 0.25));
            setExportStatusText(`Encoding compressed WebM stream (${pct}%)...`);
          }
        );
        fileExtension = "webm";
      }

      setExportProgress(90);
      setExportStatusText("Triggering file download...");

      // Download file via synthetic anchor tag
      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "master-audio";
      const downloadUrl = URL.createObjectURL(outputBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `${baseName}-processed.${fileExtension}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up object URL after small timeout
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 5000);

      setExportProgress(100);
      setExportStatusText(`Export complete: ${baseName}-processed.${fileExtension}`);
      setTimeout(() => {
        setIsExporting(false);
        setExportStatusText("");
        setExportProgress(0);
      }, 2500);

    } catch (err) {
      console.error("Export error:", err);
      setErrorMessage(`Export failed: ${err.message || "An unexpected error occurred during rendering."}`);
      setIsExporting(false);
      setExportStatusText("");
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
                  Real-time DSP modules: Noise Cancellation, Dynamics, 3-Band EQ, Pitch, Modulation, Echo, Reverb & Lo-Fi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* 0. Noise Cancellation & Rumble Gate */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                    Noise Cancel / Gate
                  </span>
                  <input
                    type="checkbox"
                    checked={enableNoiseCancel}
                    onChange={(e) => setEnableNoiseCancel(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Filters sub-75Hz mic rumble & cuts out room hiss when vocals pause.
                </p>
                {enableNoiseCancel && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Noise Gate Cutoff</span>
                        <span className="font-mono text-emerald-400">{noiseGateThreshold} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="-15"
                        step="1"
                        value={noiseGateThreshold}
                        onChange={(e) => setNoiseGateThreshold(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Gate Release Speed</span>
                        <span className="font-mono">{Math.round(noiseSmoothing * 1000)}ms</span>
                      </div>
                      <input
                        type="range"
                        min="0.02"
                        max="0.3"
                        step="0.01"
                        value={noiseSmoothing}
                        onChange={(e) => setNoiseSmoothing(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

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

            <hr className="border-gray-200 dark:border-gray-800" />

            {/* Export & Master Render Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-gray-900/20 border border-indigo-500/20 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg flex items-center gap-2 text-indigo-400">
                    <ArrowDownTrayIcon className="h-6 w-6 text-indigo-500" />
                    Export Processed Master Audio
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Bakes all active DSP effects, EQ curves, transposition, dynamics, and master volume directly into your choice of audio format.
                  </p>
                </div>
                <button
                  onClick={handleExportAudio}
                  disabled={isExporting || isProcessing || !audioFile}
                  className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>{isExporting ? "Exporting..." : `Export .${exportFormat.toUpperCase()}`}</span>
                </button>
              </div>

              {/* Informative Processing Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <InformationCircleIcon className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-400">Export Processing Notice:</p>
                  <p className="text-gray-400">
                    Exporting compiles all studio effects, transposition, and dynamic processing. For long tracks or compressed formats (WebM/OGG/M4A), real-time stream encoding occurs and may take a moment.
                    <span className="text-amber-300 font-medium ml-1">Tip: Choose WAV for instant near-realtime download.</span>
                  </p>
                </div>
              </div>

              {/* Export format & options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Format selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Output Audio Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    disabled={isExporting}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="wav">WAV (Lossless 16-bit PCM)</option>
                    <option value="webm">WebM (Opus Codec - Web Standard)</option>
                    <option value="ogg">OGG (Ogg Container / Opus)</option>
                    <option value="mp4">M4A / MP4 (AAC / Universal)</option>
                  </select>
                </div>

                {/* Bitrate / Quality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Audio Bitrate</label>
                  <select
                    value={exportBitrate}
                    onChange={(e) => setExportBitrate(e.target.value)}
                    disabled={isExporting || exportFormat === "wav"}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
                  >
                    <option value="128000">128 kbps (Standard Quality)</option>
                    <option value="192000">192 kbps (High Quality)</option>
                    <option value="256000">256 kbps (Studio Quality)</option>
                    <option value="320000">320 kbps (Maximum Bitrate)</option>
                  </select>
                </div>

                {/* Channel configuration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400">Channel Mode</label>
                  <select
                    value={exportChannels}
                    onChange={(e) => setExportChannels(e.target.value)}
                    disabled={isExporting}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2">Stereo (2 Channels)</option>
                    <option value="1">Mono (1 Channel)</option>
                  </select>
                </div>
              </div>

              {/* Export Progress Bar */}
              {isExporting && (
                <div className="space-y-2 pt-2 border-t border-gray-200/20 dark:border-gray-800/40">
                  <div className="flex justify-between text-xs">
                    <span className="text-indigo-400 font-medium">{exportStatusText}</span>
                    <span className="font-mono text-gray-400">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}