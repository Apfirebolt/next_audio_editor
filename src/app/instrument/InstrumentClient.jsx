"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import VoiceRecorder from "../../components/VoiceRecorder";
import VoiceEqualizer from "../../components/VoiceEqualizer";
import PlayInstrumentModal from "../../components/PlayInstrumentModal";
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
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import * as Tone from "tone";
import {
  INSTRUMENTS,
  KEYPAD_NOTES_21,
  KEYPAD_NOTES_37,
} from "../../utils/constants";

export default function InstrumentPage() {
  const [activeTab, setActiveTab] = useState("synth");
  const [keyboardMode, setKeyboardMode] = useState("21"); // "21" or "37"

  const activeKeypad =
    keyboardMode === "37" ? KEYPAD_NOTES_37 : KEYPAD_NOTES_21;

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

  const [filterCutoff, setFilterCutoff] = useState(
    selectedInstrument.filterCutoff,
  );
  const [filterType, setFilterType] = useState("lowpass");
  const [enableDistortion, setEnableDistortion] = useState(false);
  const [distortionAmount, setDistortionAmount] = useState(0.2);
  const [enableDelay, setEnableDelay] = useState(false);
  const [delayTime, setDelayTime] = useState("8n");
  const [enableReverb, setEnableReverb] = useState(false);
  const [reverbDecay, setReverbDecay] = useState(2.5);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const distortionRef = useRef(null);
  const delayRef = useRef(null);
  const reverbRef = useRef(null);
  const limiterRef = useRef(null);

  useEffect(() => {
    filterRef.current = new Tone.Filter({
      frequency: selectedInstrument.filterCutoff,
      type: "lowpass",
    });
    distortionRef.current = new Tone.Distortion({ distortion: 0.2, wet: 0.5 });
    delayRef.current = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.3,
      wet: 0.4,
    });
    reverbRef.current = new Tone.Reverb({ decay: 2.5, wet: 0.4 });
    limiterRef.current = new Tone.Limiter(-1);

    if (selectedInstrument.type === "fm") {
      synthRef.current = new Tone.PolySynth(
        Tone.FMSynth,
        selectedInstrument.options,
      );
    } else if (selectedInstrument.type === "am") {
      synthRef.current = new Tone.PolySynth(
        Tone.AMSynth,
        selectedInstrument.options,
      );
    } else {
      synthRef.current = new Tone.PolySynth(
        Tone.Synth,
        selectedInstrument.options,
      );
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
  }, [
    filterCutoff,
    filterType,
    enableDistortion,
    distortionAmount,
    enableDelay,
    delayTime,
    enableReverb,
    reverbDecay,
  ]);

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
    // Only set up keyboard event listeners if the active tab is "synth"
    if (activeTab !== "synth") return;
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
  }, [
    activeTab,
    activeNotes,
    activeKeypad,
    isRecording,
    selectedInstrument,
    selectedTargetTrackId,
  ]);

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
          now + clip.offset,
        );
      }
    });

    const maxDuration = Math.max(
      ...recordedClips.map((c) => c.offset + c.duration),
    );
    setTimeout(
      () => {
        setIsPlayingArrangement(false);
      },
      maxDuration * 1000 + 500,
    );
  };

  const deleteClip = (id) => {
    setRecordedClips((prev) => prev.filter((c) => c.id !== id));
  };

  const addTrack = () => {
    if (tracks.length >= 5) return;
    const newTrackId = tracks.length + 1;
    setTracks((prev) => [
      ...prev,
      { id: newTrackId, name: `Track ${newTrackId}: Melody`, muted: false },
    ]);
  };

  const deleteTrack = (id) => {
    if (tracks.length <= 1) return;
    setTracks((prev) => prev.filter((t) => t.id !== id));
    setRecordedClips((prev) => prev.filter((c) => c.trackId !== id));
    if (selectedTargetTrackId === id) {
      const remaining = tracks.filter((t) => t.id !== id);
      setSelectedTargetTrackId(remaining[0].id);
    }
  };

  const changeClipTrack = (clipId, newTrackId) => {
    setRecordedClips((prev) =>
      prev.map((c) =>
        c.id === clipId ? { ...c, trackId: Number(newTrackId) } : c,
      ),
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
        const newDuration = Math.max(
          initialDurationRef.current + deltaX / 50,
          0.2,
        );
        setRecordedClips((prev) =>
          prev.map((c) =>
            c.id === resizingClipId ? { ...c, duration: newDuration } : c,
          ),
        );
      } else if (draggingClipId) {
        const newOffset = Math.max(initialOffsetRef.current + deltaX / 40, 0);
        setRecordedClips((prev) =>
          prev.map((c) =>
            c.id === draggingClipId ? { ...c, offset: newOffset } : c,
          ),
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
    <div className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light flex flex-col font-sans selection:bg-primary selection:text-white">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 space-y-10">
        
        {/* Top Header & Navigation Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4" data-aos="fade-down">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight font-heading">
              Virtual Beats & Multi-Track Studio
            </h1>
            <p className="text-dark/60 dark:text-light/65 text-sm font-sans">
              Arrange MIDI notes across up to 5 tracks, resize blocks by dragging, and sculpt sound.
            </p>
          </div>

          <div className="flex p-1.5 rounded-2xl bg-tertiary/10 dark:bg-tertiary/5 border border-tertiary/20 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("synth")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "synth"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-dark/70 dark:text-light/70 hover:text-primary"
              }`}
            >
              Virtual Instruments
            </button>
            <button
              onClick={() => setActiveTab("mic")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "mic"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-dark/70 dark:text-light/70 hover:text-primary"
              }`}
            >
              <MicrophoneIcon className="h-4 w-4" />
              <span>Voice Studio</span>
            </button>
          </div>
        </div>

        {activeTab === "synth" && (
          <div className="space-y-10">
            
            {/* INSTRUMENT PRESET GRID */}
            <div className="space-y-4" data-aos="fade-up">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-dark/50 dark:text-light/50">
                Select Instrument Preset ({INSTRUMENTS.length} Available)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[340px] overflow-y-auto pr-2">
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => handleInstrumentChange(inst)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 group ${
                      selectedInstrument.id === inst.id
                        ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10 scale-[1.02]"
                        : "border-tertiary/20 bg-white/60 dark:bg-dark/60 hover:border-primary/50 text-dark dark:text-light"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MusicalNoteIcon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="font-bold text-xs truncate font-heading">{inst.name}</p>
                    <p className="text-[10px] text-dark/50 dark:text-light/50 uppercase tracking-wide">{inst.type} synth</p>
                  </button>
                ))}
              </div>
            </div>

            {/* MULTI-TRACK GARAGEBAND TIMELINE */}
            <div className="p-6 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-6 shadow-xl" data-aos="fade-up" data-aos-delay="100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-tertiary/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <SparklesIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-heading">
                      Multi-Track Arrangement Timeline ({tracks.length}/5)
                    </h3>
                    <p className="text-xs text-dark/60 dark:text-light/60 font-sans">
                      Record notes into selected track, drag blocks to move, or resize right edge.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-sans">
                    <span className="text-dark/50 dark:text-light/50">Record to:</span>
                    <select
                      value={selectedTargetTrackId}
                      onChange={(e) =>
                        setSelectedTargetTrackId(Number(e.target.value))
                      }
                      className="p-2 rounded-xl bg-light dark:bg-dark border border-tertiary/30 font-bold text-primary focus:outline-none"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {tracks.length < 5 && (
                    <button
                      onClick={addTrack}
                      className="px-3.5 py-2 rounded-xl bg-tertiary/20 hover:bg-tertiary/30 text-dark dark:text-light text-xs font-bold flex items-center gap-1.5 border border-tertiary/30 transition-all"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>Add Track</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded-xl font-bold bg-primary hover:bg-secondary text-white transition-all flex items-center gap-2 text-xs shadow-md shadow-primary/20"
                  >
                    <MusicalNoteIcon className="h-4 w-4" />
                    <span>Master Player</span>
                  </button>

                  {recordedClips.length > 0 && (
                    <button
                      onClick={playArrangement}
                      disabled={isPlayingArrangement}
                      className="px-4 py-2 rounded-xl font-bold bg-success text-white hover:opacity-90 transition-all flex items-center gap-2 text-xs shadow-md"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span>{isPlayingArrangement ? "Playing..." : "Play Mix"}</span>
                    </button>
                  )}

                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="px-5 py-2 rounded-xl font-bold bg-danger text-white hover:opacity-90 transition-all flex items-center gap-2 text-xs shadow-lg shadow-danger/25"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      <span>Record</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="px-5 py-2 rounded-xl font-bold bg-dark text-light hover:bg-tertiary transition-all flex items-center gap-2 text-xs animate-pulse border border-danger/50"
                    >
                      <StopIcon className="h-4 w-4 text-danger" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Multi-Track Lanes Container */}
              <div className="space-y-3">
                {tracks.map((track) => {
                  const trackClips = recordedClips.filter(
                    (c) => c.trackId === track.id,
                  );

                  return (
                    <div
                      key={track.id}
                      className="p-3.5 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary font-heading">
                            {track.name}
                          </span>
                          {selectedTargetTrackId === track.id &&
                            isRecording && (
                              <span className="px-2 py-0.5 rounded-md bg-danger/20 text-danger text-[10px] font-bold animate-pulse">
                                ● RECORDING
                              </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTracks((prev) =>
                                prev.map((t) =>
                                  t.id === track.id
                                    ? { ...t, muted: !t.muted }
                                    : t,
                                ),
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              track.muted
                                ? "bg-danger/20 text-danger border border-danger/30"
                                : "bg-success/20 text-success border border-success/30"
                            }`}
                          >
                            {track.muted ? "MUTED" : "ACTIVE"}
                          </button>
                          {tracks.length > 1 && (
                            <button
                              onClick={() => deleteTrack(track.id)}
                              className="text-dark/40 dark:text-light/40 hover:text-danger transition-colors p-1"
                              title="Delete Track"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Track Lane Horizontal Scroll Area */}
                      <div className="relative h-20 rounded-xl bg-white dark:bg-dark border border-tertiary/20 overflow-x-auto overflow-y-hidden p-2 flex items-center shadow-inner">
                        {trackClips.length === 0 ? (
                          <div className="w-full text-center text-[11px] text-dark/40 dark:text-light/40 font-sans">
                            Empty Track. Select this track in top toolbar and play notes to record blocks.
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-full relative h-full pt-1">
                            {trackClips.map((clip) => (
                              <div
                                key={clip.id}
                                onMouseDown={(e) =>
                                  handleDragStart(e, clip.id, clip.offset)
                                }
                                style={{
                                  marginLeft: `${clip.offset * 40}px`,
                                  width: `${Math.max(clip.duration * 60, 60)}px`,
                                }}
                                className="group relative h-16 rounded-xl bg-primary border border-tertiary/40 text-white p-2.5 flex flex-col justify-between shadow-lg cursor-grab active:cursor-grabbing hover:bg-secondary transition-all"
                              >
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="font-bold">{clip.note}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteClip(clip.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-white hover:text-danger transition-opacity"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-light/80">
                                  <span className="truncate font-sans">{clip.instrumentName}</span>
                                  <select
                                    value={clip.trackId}
                                    onChange={(e) =>
                                      changeClipTrack(clip.id, e.target.value)
                                    }
                                    className="bg-dark text-light rounded px-1.5 py-0.5 border border-tertiary/30 cursor-pointer text-[9px] font-mono"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {tracks.map((t) => (
                                      <option key={t.id} value={t.id}>
                                        T{t.id}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div
                                  onMouseDown={(e) =>
                                    handleResizeStart(e, clip.id, clip.duration)
                                  }
                                  className="absolute right-0 top-0 bottom-0 w-3 bg-white/20 hover:bg-white cursor-ew-resize rounded-r-xl transition-colors flex items-center justify-center"
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

            {/* EFFECTS RACK */}
            <div className="p-6 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-6 shadow-xl" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-heading">Pro Effects Rack</h3>
                  <p className="text-xs text-dark/60 dark:text-light/60 font-sans">Sculpt live frequencies, overdrive, delay, and reverb chains.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 p-4 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20">
                  <div className="flex justify-between items-center text-xs font-bold font-heading">
                    <span>Filter Cutoff</span>
                    <span className="font-mono text-primary">{filterCutoff} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="8000"
                    step="100"
                    value={filterCutoff}
                    onChange={(e) => setFilterCutoff(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20">
                  <div className="flex justify-between items-center text-xs font-bold font-heading">
                    <span>Overdrive Distortion</span>
                    <input
                      type="checkbox"
                      checked={enableDistortion}
                      onChange={(e) => setEnableDistortion(e.target.checked)}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={distortionAmount}
                    disabled={!enableDistortion}
                    onChange={(e) =>
                      setDistortionAmount(Number(e.target.value))
                    }
                    className="w-full accent-primary cursor-pointer disabled:opacity-40"
                  />
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-light/50 dark:bg-dark/50 border border-tertiary/20">
                  <div className="flex justify-between items-center text-xs font-bold font-heading">
                    <span>Echo Delay</span>
                    <input
                      type="checkbox"
                      checked={enableDelay}
                      onChange={(e) => setEnableDelay(e.target.checked)}
                      className="accent-primary h-4 w-4 cursor-pointer"
                    />
                  </div>
                  <select
                    value={delayTime}
                    disabled={!enableDelay}
                    onChange={(e) => setDelayTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-dark border border-tertiary/30 text-xs font-mono disabled:opacity-40 focus:outline-none"
                  >
                    <option value="8n">Eighth Note</option>
                    <option value="4n">Quarter Note</option>
                    <option value="2n">Half Note</option>
                  </select>
                </div>
              </div>
            </div>

            {/* INTERACTIVE KEYPAD */}
            <div className="p-8 rounded-3xl bg-white/70 dark:bg-dark/70 backdrop-blur-xl border border-tertiary/20 dark:border-tertiary/10 space-y-6 shadow-xl" data-aos="fade-up" data-aos-delay="300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-tertiary/20 pb-4">
                <div>
                  <h3 className="font-bold text-lg font-heading">Interactive Studio Keypad</h3>
                  <p className="text-xs text-dark/60 dark:text-light/60 font-sans">
                    {keyboardMode === "21"
                      ? "Standard 21-Key Layout"
                      : "Expanded 37-Key Pro Layout"}
                  </p>
                </div>

                <div className="flex p-1 rounded-xl bg-tertiary/10 border border-tertiary/20">
                  <button
                    onClick={() => setKeyboardMode("21")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      keyboardMode === "21"
                        ? "bg-primary text-white shadow-md"
                        : "text-dark/70 dark:text-light/70 hover:text-primary"
                    }`}
                  >
                    21-Key Standard
                  </button>
                  <button
                    onClick={() => setKeyboardMode("37")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      keyboardMode === "37"
                        ? "bg-primary text-white shadow-md"
                        : "text-dark/70 dark:text-light/70 hover:text-primary"
                    }`}
                  >
                    37-Key Pro
                  </button>
                </div>
              </div>

              <div
                className={`grid gap-1.5 max-w-7xl mx-auto overflow-x-auto pb-2 ${
                  keyboardMode === "37"
                    ? "grid-cols-12 sm:grid-cols-37"
                    : "grid-cols-7 sm:grid-cols-25"
                }`}
              >
                {activeKeypad.map((k) => (
                  <button
                    key={k.note}
                    onMouseDown={() => playNote(k.note)}
                    onMouseUp={() => stopNote(k.note)}
                    onMouseLeave={() => stopNote(k.note)}
                    onTouchStart={() => playNote(k.note)}
                    onTouchEnd={() => stopNote(k.note)}
                    className={`h-32 rounded-xl border flex flex-col items-center justify-between p-2.5 transition-all select-none min-w-[34px] shadow-sm ${
                      k.note.includes("#")
                        ? "bg-dark text-light border-tertiary/50"
                        : "bg-light dark:bg-dark/90 border-tertiary/30 text-dark dark:text-light"
                    } ${
                      activeNotes[k.note]
                        ? "!bg-primary !text-white !border-primary scale-95 shadow-inner"
                        : "hover:border-primary"
                    }`}
                  >
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-tertiary/20 text-dark/70 dark:text-light/70">
                      {k.key}
                    </span>
                    <span className="font-bold text-[10px] sm:text-[11px] font-mono">{k.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-60"></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOICE STUDIO */}
        {activeTab === "mic" && (
          <div className="space-y-8 animate-fadeIn" data-aos="fade-up">
            <VoiceRecorder
              onRecordingComplete={(url) => setLatestMicAudioUrl(url)}
            />

            <div className="pt-6 border-t border-tertiary/20">
              <div className="max-w-3xl mx-auto mb-6 text-center space-y-1">
                <h4 className="font-bold text-lg font-heading">
                  Post-Production Voice Mixing
                </h4>
                <p className="text-xs text-dark/60 dark:text-light/60 font-sans">
                  Apply granular EQ shaping on your recorded vocal tracks.
                </p>
              </div>
              <VoiceEqualizer audioUrl={latestMicAudioUrl} />
            </div>
          </div>
        )}

        {/* Modal Component */}
        <PlayInstrumentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tracks={tracks}
          recordedClips={recordedClips}
          selectedSynth={synthRef.current}
        />
      </main>

      <Footer />
    </div>
  );
}