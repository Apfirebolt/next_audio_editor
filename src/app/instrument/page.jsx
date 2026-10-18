"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VoiceRecorder from "../../components/VoiceRecorder";
import VoiceEqualizer from "../../components/VoiceEqualizer";
import { 
  MusicalNoteIcon, 
  PlayIcon, 
  StopIcon, 
  ArrowDownTrayIcon, 
  SparklesIcon, 
  AdjustmentsHorizontalIcon, 
  MicrophoneIcon, 
  TrashIcon,
  PlusIcon,
  ArrowsRightLeftIcon
} from "@heroicons/react/24/outline";
import * as Tone from "tone";
import { INSTRUMENTS, KEYPAD_NOTES_21, KEYPAD_NOTES_37 } from "../../utils/constants";

export default function InstrumentPage() {
  const [activeTab, setActiveTab] = useState("synth");
  const [keyboardMode, setKeyboardMode] = useState("21"); // "21" or "37"

  const activeKeypad = keyboardMode === "37" ? KEYPAD_NOTES_37 : KEYPAD_NOTES_21;

  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeNotes, setActiveNotes] = useState({});

  // Multi-Track Arrangement State (Max 5 tracks)
  const [tracks, setTracks] = useState([
    { id: 1, name: "Track 1: Synth Lead", muted: false },
    { id: 2, name: "Track 2: Rhythm Keys", muted: false },
  ]);
  const [selectedTargetTrackId, setSelectedTargetTrackId] = useState(1);

  // GarageBand-style Region Clips Array mapped to trackId
  const [recordedClips, setRecordedClips] = useState([]);
  const [isPlayingArrangement, setIsPlayingArrangement] = useState(false);

  const recordingStartTimeRef = useRef(null);
  const activeNotePressesRef = useRef({});

  // Drag & Resize Interactive State Tracking
  const [resizingClipId, setResizingClipId] = useState(null);
  const [draggingClipId, setDraggingClipId] = useState(null);
  const dragStartXRef = useRef(0);
  const initialDurationRef = useRef(0);
  const initialOffsetRef = useRef(0);

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

  useEffect(() => {
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

    currentNode.toDestination();
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

      if (isRecording) {
        activeNotePressesRef.current[note] = Date.now();
      }
    }
  };

  const stopNote = (note) => {
    if (synthRef.current) {
      synthRef.current.triggerRelease([note]);
      setActiveNotes((prev) => ({ ...prev, [note]: false }));

      if (isRecording && activeNotePressesRef.current[note]) {
        const startTime = activeNotePressesRef.current[note];
        const duration = (Date.now() - startTime) / 1000;
        const offsetTime = (startTime - recordingStartTimeRef.current) / 1000;

        const newClip = {
          id: Date.now() + Math.random(),
          trackId: selectedTargetTrackId,
          note,
          instrumentName: selectedInstrument.name,
          duration: Math.max(duration, 0.3),
          offset: Math.max(offsetTime, 0),
        };

        setRecordedClips((prev) => [...prev, newClip]);
        delete activeNotePressesRef.current[note];
      }
    }
  };

  // Keyboard Event Listeners
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
  }, [activeNotes, activeKeypad, isRecording, selectedInstrument, selectedTargetTrackId]);

  const startRecording = () => {
    recordingStartTimeRef.current = Date.now();
    activeNotePressesRef.current = {};
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const playArrangement = async () => {
    await Tone.start();
    if (recordedClips.length === 0 || !synthRef.current) return;

    setIsPlayingArrangement(true);
    const now = Tone.now();

    recordedClips.forEach((clip) => {
      const track = tracks.find((t) => t.id === clip.trackId);
      if (track && !track.muted) {
        synthRef.current.triggerAttackRelease(
          clip.note,
          clip.duration,
          now + clip.offset
        );
      }
    });

    const maxDuration = Math.max(...recordedClips.map((c) => c.offset + c.duration));
    setTimeout(() => {
      setIsPlayingArrangement(false);
    }, maxDuration * 1000 + 500);
  };

  const deleteClip = (id) => {
    setRecordedClips((prev) => prev.filter((c) => c.id !== id));
  };

  const addTrack = () => {
    if (tracks.length >= 5) return;
    const newTrackId = tracks.length + 1;
    setTracks((prev) => [...prev, { id: newTrackId, name: `Track ${newTrackId}: Melody`, muted: false }]);
  };

  const deleteTrack = (id) => {
    if (tracks.length <= 1) return; // Keep at least 1 track
    setTracks((prev) => prev.filter((t) => t.id !== id));
    setRecordedClips((prev) => prev.filter((c) => c.trackId !== id));
    if (selectedTargetTrackId === id) {
      const remaining = tracks.filter((t) => t.id !== id);
      setSelectedTargetTrackId(remaining[0].id);
    }
  };

  const changeClipTrack = (clipId, newTrackId) => {
    setRecordedClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, trackId: Number(newTrackId) } : c))
    );
  };

  // --- MOUSE DRAG & RESIZE HANDLERS FOR BLOCKS ---
  const handleResizeStart = (e, clipId, currentDuration) => {
    e.stopPropagation();
    setResizingClipId(clipId);
    dragStartXRef.current = e.clientX;
    initialDurationRef.current = currentDuration;
  };

  const handleDragStart = (e, clipId, currentOffset) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "SELECT") return;
    setDraggingClipId(clipId);
    dragStartXRef.current = e.clientX;
    initialOffsetRef.current = currentOffset;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStartXRef.current;

      if (resizingClipId) {
        const newDuration = Math.max(initialDurationRef.current + deltaX / 50, 0.2);
        setRecordedClips((prev) =>
          prev.map((c) => (c.id === resizingClipId ? { ...c, duration: newDuration } : c))
        );
      } else if (draggingClipId) {
        const newOffset = Math.max(initialOffsetRef.current + deltaX / 40, 0);
        setRecordedClips((prev) =>
          prev.map((c) => (c.id === draggingClipId ? { ...c, offset: newOffset } : c))
        );
      }
    };

    const handleMouseUp = () => {
      setResizingClipId(null);
      setDraggingClipId(null);
    };

    if (resizingClipId || draggingClipId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingClipId, draggingClipId]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Virtual Synth & Multi-Track Studio</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Arrange MIDI notes across up to 5 tracks, resize blocks by dragging, and sculpt sound.
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

            {/* MULTI-TRACK GARAGEBAND TIMELINE (UP TO 5 TRACKS) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="h-6 w-6 text-indigo-500" />
                  <div>
                    <h3 className="font-bold text-base">Multi-Track Arrangement Timeline ({tracks.length}/5)</h3>
                    <p className="text-xs text-gray-500">Record notes into selected track, drag blocks to move, or resize right edge.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Target Recording Track Selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Record to:</span>
                    <select
                      value={selectedTargetTrackId}
                      onChange={(e) => setSelectedTargetTrackId(Number(e.target.value))}
                      className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-semibold"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {tracks.length < 5 && (
                    <button
                      onClick={addTrack}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold flex items-center gap-1 border border-gray-300 dark:border-gray-700"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>Add Track</span>
                    </button>
                  )}

                  {recordedClips.length > 0 && (
                    <button
                      onClick={playArrangement}
                      disabled={isPlayingArrangement}
                      className="px-4 py-2 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center gap-2 text-xs shadow-md"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span>{isPlayingArrangement ? "Playing..." : "Play Arrangement"}</span>
                    </button>
                  )}

                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-5 py-2 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-500 transition-all flex items-center gap-2 text-xs shadow-lg shadow-red-600/20"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      <span>Record</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-5 py-2 rounded-xl font-semibold bg-gray-800 text-white hover:bg-gray-700 transition-all flex items-center gap-2 text-xs animate-pulse"
                    >
                      <StopIcon className="h-4 w-4 text-red-400" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Track Lanes Container */}
              <div className="space-y-3">
                {tracks.map((track) => {
                  const trackClips = recordedClips.filter((c) => c.trackId === track.id);

                  return (
                    <div key={track.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-400">{track.name}</span>
                          {selectedTargetTrackId === track.id && isRecording && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[10px] font-bold animate-pulse">
                              RECORDING
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTracks((prev) =>
                                prev.map((t) => (t.id === track.id ? { ...t, muted: !t.muted } : t))
                              );
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              track.muted ? "bg-red-500/20 text-red-400" : "bg-gray-200 dark:bg-gray-800 text-gray-400"
                            }`}
                          >
                            {track.muted ? "Muted" : "Active"}
                          </button>
                          {tracks.length > 1 && (
                            <button
                              onClick={() => deleteTrack(track.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete Track"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Track Lane Horizontal Scroll Area */}
                      <div className="relative h-20 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-x-auto overflow-y-hidden p-2 flex items-center">
                        {trackClips.length === 0 ? (
                          <div className="w-full text-center text-[11px] text-gray-400">
                            Empty Track. Select this track in top toolbar and play notes to record blocks.
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-full relative h-full pt-1">
                            {trackClips.map((clip) => (
                              <div
                                key={clip.id}
                                onMouseDown={(e) => handleDragStart(e, clip.id, clip.offset)}
                                style={{
                                  marginLeft: `${clip.offset * 40}px`,
                                  width: `${Math.max(clip.duration * 60, 60)}px`,
                                }}
                                className="group relative h-16 rounded-lg bg-indigo-600/90 border border-indigo-400 text-white p-2 flex flex-col justify-between shadow-md cursor-grab active:cursor-grabbing hover:bg-indigo-500 transition-colors"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="font-bold">{clip.note}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteClip(clip.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-white hover:text-red-300 transition-opacity"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-indigo-200">
                                  <span className="truncate">{clip.instrumentName}</span>
                                  {/* Track Switcher Dropdown */}
                                  <select
                                    value={clip.trackId}
                                    onChange={(e) => changeClipTrack(clip.id, e.target.value)}
                                    className="bg-indigo-900 text-white rounded text-[9px] px-1 py-0.5 border border-indigo-400 cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {tracks.map((t) => (
                                      <option key={t.id} value={t.id}>T{t.id}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Right Edge Resize Handle */}
                                <div
                                  onMouseDown={(e) => handleResizeStart(e, clip.id, clip.duration)}
                                  className="absolute right-0 top-0 bottom-0 w-2.5 bg-indigo-400/40 hover:bg-white cursor-ew-resize rounded-r-lg transition-colors flex items-center justify-center"
                                  title="Drag to resize tone duration"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

            {/* Interactive Keypad with Layout Switcher */}
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
                <div>
                  <h3 className="font-semibold text-lg">Interactive Studio Keypad</h3>
                  <p className="text-xs text-gray-500">
                    {keyboardMode === "21" ? "Standard 21-Key Layout" : "Expanded 37-Key Pro Layout"}
                  </p>
                </div>

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