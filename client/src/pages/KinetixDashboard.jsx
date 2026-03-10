import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import DynamicScroller from '../components/kinetix/DynamicScroller';
import ExerciseCard from '../components/kinetix/ExerciseCard';
import { createExerciseSvgDataUrl, createFormDemoSvgDataUrl, resolveExerciseImage } from '../components/kinetix/exerciseImage';

const API = 'http://localhost:5000';

const TIERS = [
    { id: "Tier 1", label: "Sub-Juniors (<14)" },
    { id: "Tier 2", label: "Juniors (<18)" },
    { id: "Tier 3", label: "Youth (<23)" },
    { id: "Tier 4", label: "Seniors (24-40)" },
    { id: "Tier 5", label: "Masters (40+)" },
    { id: "Tier 6", label: "Grandmasters (60+)" }
];

const KinetixDashboard = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDayIndex, setActiveDayIndex] = useState(new Date().getDay()); // Defaults to today (0=Sun, 1=Mon)
  const [activeTier, setActiveTier] = useState("Tier 4"); // Default to Seniors
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [completedSetsMap, setCompletedSetsMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [flowMode, setFlowMode] = useState(false);
  const [flowExerciseIndex, setFlowExerciseIndex] = useState(0);
  const [flowSecondsLeft, setFlowSecondsLeft] = useState(30);
  const [flowRunning, setFlowRunning] = useState(false);
  const [anatomyView, setAnatomyView] = useState('auto');

  const getAuthConfig = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const token = localStorage.getItem('token') || userInfo?.token;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const config = getAuthConfig();
      const { data } = await axios.get(`${API}/api/kinetix/plan?tier=${encodeURIComponent(activeTier)}`, config);
      setPlan(data);
    } catch (err) {
      console.error("Failed to load Kinetix Plan:", err);
      setError('Unable to load Kinetix plan. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [activeTier]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Find the exact day data from the plan's 7-day array
  const activeSession = useMemo(
    () => plan?.days?.find(d => d.dayOfWeek === activeDayIndex),
    [plan, activeDayIndex]
  );
  const availableMuscles = useMemo(() => {
    const set = new Set((activeSession?.blocks || []).map(b => b?.exercise?.muscleGroup?.primary).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [activeSession]);
  const filteredBlocks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (activeSession?.blocks || []).filter(block => {
      const exName = block?.exercise?.name?.toLowerCase() || '';
      const primary = block?.exercise?.muscleGroup?.primary || '';
      const matchesSearch = !q || exName.includes(q);
      const matchesMuscle = muscleFilter === 'all' || primary === muscleFilter;
      return matchesSearch && matchesMuscle;
    });
  }, [activeSession, searchTerm, muscleFilter]);
  const sessionMetrics = useMemo(() => {
    if (!activeSession || activeSession.isRestDay) return { totalMoves: 0, totalSets: 0, estMinutes: 0 };
    const totalMoves = filteredBlocks.length || 0;
    const totalSets = filteredBlocks.reduce((sum, b) => sum + (b?.targetSets || 0), 0);
    const estMinutes = Math.max(15, Math.round(totalSets * 2.2));
    return { totalMoves, totalSets, estMinutes };
  }, [activeSession, filteredBlocks]);
  const completedExerciseCount = useMemo(() => {
    return Object.values(completedSetsMap).filter(sets => Array.isArray(sets) && sets.length > 0).length;
  }, [completedSetsMap]);
  const fullProgramExercises = useMemo(() => {
    const byId = new Map();
    (plan?.days || []).forEach(day => {
      (day?.blocks || []).forEach(block => {
        const ex = block?.exercise;
        if (!ex?._id) return;
        const k = String(ex._id);
        if (!byId.has(k)) byId.set(k, ex);
      });
    });
    return Array.from(byId.values());
  }, [plan]);
  const sessionExercises = useMemo(() => {
    const byId = new Map();
    (activeSession?.blocks || []).forEach((block) => {
      const ex = block?.exercise;
      if (!ex?._id) return;
      byId.set(String(ex._id), ex);
    });
    return Array.from(byId.values());
  }, [activeSession]);
  const showAdvancedLibrary = Boolean(plan?.philosophyName?.includes('Tier 3') || plan?.philosophyName?.includes('Tier 4'));
  const activeSessionDayName = activeSession?.dayName || '';
  const activeSessionIsRestDay = Boolean(activeSession?.isRestDay);
  const currentPlanId = plan?._id || '';
  const phaseIndex = Math.abs(Math.floor(flowSecondsLeft * 2)) % 3;
  const phaseLabel = ['Setup', 'Eccentric', 'Concentric'][phaseIndex];
  const getExerciseDescription = (ex) => {
    if (ex?.description?.trim()) return ex.description.trim();
    const muscle = ex?.muscleGroup?.primary || 'target muscle';
    const equipment = ex?.equipmentRequired || 'gym equipment';
    return `Controlled ${ex?.name || 'exercise'} focused on ${muscle}. Use ${equipment}, maintain full range of motion, and keep tempo strict.`;
  };
  const getFormCues = (ex) => {
    const m = (ex?.muscleGroup?.primary || '').toLowerCase();
    if (m.includes('chest') || m.includes('triceps') || m.includes('delt')) {
      return ['Set shoulders down and back before each rep.', 'Lower under control for 2-3 seconds.', 'Press smoothly without locking aggressively.'];
    }
    if (m.includes('back') || m.includes('lat') || m.includes('biceps')) {
      return ['Brace core and keep spine neutral.', 'Lead pull with elbows, not wrists.', 'Pause briefly at contraction, then controlled return.'];
    }
    if (m.includes('quad') || m.includes('hamstring') || m.includes('glute') || m.includes('calf')) {
      return ['Set stance first and keep knees tracking toes.', 'Control eccentric phase to protect joints.', 'Drive through mid-foot and avoid bouncing.'];
    }
    return ['Brace core before movement starts.', 'Control the full range of motion.', 'Breathe rhythmically and avoid jerky reps.'];
  };
  const renderExerciseAnimation = (ex) => {
    const media = ex?.animationURL || '';
    const isVideo = /\.(mp4|webm|ogg)$/i.test(media);
    if (media) {
      return isVideo
        ? <video src={media} controls className="w-full h-full object-cover rounded-xl" />
        : <img src={media} alt={`${ex?.name} animation`} className="w-full h-full object-cover rounded-xl" />;
    }
    return (
      <div className="w-full h-full rounded-xl border border-neutral-700 bg-neutral-900 relative overflow-hidden">
        <img
          src={createFormDemoSvgDataUrl(ex?.name || 'Workout', ex?.muscleGroup?.primary || 'General', {
            animate: flowMode && flowRunning,
            phase: flowSecondsLeft,
            view: anatomyView,
            secondaryMuscles: ex?.muscleGroup?.secondary || []
          })}
          alt={`${ex?.name} guided form demo`}
          className={`w-full h-full object-cover ${flowMode && flowRunning ? 'animate-pulse' : ''}`}
        />
        <div className="absolute bottom-3 left-3 right-3 text-[11px] text-neutral-100 bg-black/50 border border-neutral-700 rounded-lg px-2 py-1">
          Guided form loop: setup, controlled rep, lockout, reset.
        </div>
      </div>
    );
  };
  const modalExerciseList = useMemo(
    () => (flowMode ? sessionExercises : fullProgramExercises),
    [flowMode, sessionExercises, fullProgramExercises]
  );
  const selectedExerciseIndex = useMemo(() => {
    if (!selectedExercise?._id) return -1;
    return modalExerciseList.findIndex((ex) => String(ex._id) === String(selectedExercise._id));
  }, [selectedExercise, modalExerciseList]);
  const closeExerciseModal = () => {
    setSelectedExercise(null);
    setFlowMode(false);
    setFlowRunning(false);
    setAnatomyView('auto');
  };
  const openExercise = (ex) => {
    setFlowMode(false);
    setFlowRunning(false);
    setSelectedExercise(ex);
    setAnatomyView('auto');
  };
  const navigateSelectedExercise = (delta) => {
    if (!modalExerciseList.length || selectedExerciseIndex < 0) return;
    const nextIdx = (selectedExerciseIndex + delta + modalExerciseList.length) % modalExerciseList.length;
    setSelectedExercise(modalExerciseList[nextIdx]);
    if (flowMode) {
      setFlowExerciseIndex(nextIdx);
      setFlowSecondsLeft(30);
    }
  };
  const startWorkoutFlow = () => {
    if (!sessionExercises.length) return;
    setFlowMode(true);
    setFlowExerciseIndex(0);
    setFlowSecondsLeft(30);
    setFlowRunning(true);
    setSelectedExercise(sessionExercises[0]);
    setAnatomyView('auto');
  };

  const loadTodayLog = useCallback(async () => {
    if (!currentPlanId || !activeSessionDayName) return;
    try {
      const config = getAuthConfig();
      const { data } = await axios.get(
        `${API}/api/kinetix/log/today?planId=${encodeURIComponent(currentPlanId)}&sessionName=${encodeURIComponent(activeSessionDayName)}`,
        config
      );
      const map = {};
      (data?.exercises || []).forEach(item => {
        const id = item?.exercise?._id || item?.exercise;
        if (!id) return;
        map[String(id)] = (item?.sets || []).map(s => ({
          setNumber: s.setNumber,
          weight: String(s.weight),
          reps: String(s.reps)
        }));
      });
      setCompletedSetsMap(map);
    } catch (e) {
      console.error('Failed to restore day log:', e);
      setCompletedSetsMap({});
    }
  }, [currentPlanId, activeSessionDayName]);

  useEffect(() => {
    setCompletedSetsMap({});
    setSearchTerm('');
    setMuscleFilter('all');
    if (currentPlanId && activeSessionDayName && !activeSessionIsRestDay) {
      loadTodayLog();
    }
  }, [currentPlanId, activeSessionDayName, activeSessionIsRestDay, loadTodayLog]);

  useEffect(() => {
    if (!flowMode) return;
    const ex = sessionExercises[flowExerciseIndex];
    if (ex) setSelectedExercise(ex);
    setFlowSecondsLeft(30);
  }, [flowExerciseIndex, flowMode, sessionExercises]);

  useEffect(() => {
    if (!flowMode || !flowRunning) return;
    if (flowSecondsLeft <= 0) return;
    const t = setTimeout(() => setFlowSecondsLeft((s) => Number((s - 0.5).toFixed(1))), 500);
    return () => clearTimeout(t);
  }, [flowMode, flowRunning, flowSecondsLeft]);

  useEffect(() => {
    if (!flowMode || !flowRunning) return;
    if (flowSecondsLeft > 0) return;
    if (flowExerciseIndex < sessionExercises.length - 1) {
      setFlowExerciseIndex((i) => i + 1);
    } else {
      setFlowRunning(false);
      setFlowSecondsLeft(0);
    }
  }, [flowMode, flowRunning, flowSecondsLeft, flowExerciseIndex, sessionExercises.length]);

  const handleExerciseComplete = async ({ exerciseId, sets }) => {
    if (!exerciseId || !plan?._id || !activeSession?.dayName) return;
    const exIdStr = String(exerciseId);
    setCompletedSetsMap(prev => ({ ...prev, [exIdStr]: sets }));
    try {
      setSaving(true);
      const config = getAuthConfig();
      const payloadExercises = Object.entries({ ...completedSetsMap, [exIdStr]: sets }).map(([id, exSets]) => ({
        exercise: id,
        sets: exSets.map(s => ({
          setNumber: Number(s.setNumber),
          weight: Number(s.weight),
          reps: Number(s.reps)
        }))
      }));
      await axios.post(`${API}/api/kinetix/log`, {
        planId: plan._id,
        sessionName: activeSession.dayName,
        exercises: payloadExercises,
        durationMinutes: Math.max(5, Math.round(payloadExercises.length * 6))
      }, config);
    } catch (e) {
      console.error('Failed to save exercise progress:', e);
      setError('Progress save failed. Your latest set may not be synced.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex-1 min-h-screen bg-[#0a0a0a] p-8 text-center text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">No Active Workout Plan</h2>
        <p className="text-neutral-400">Please contact your coach to assign a workout program.</p>
        
        <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TIERS.map(tier => (
                <button key={tier.id} onClick={() => setActiveTier(tier.id)} className="px-4 py-2 bg-neutral-800 rounded-full text-xs text-white">Load {tier.label}</button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0a] text-white flex flex-col pt-16 lg:pt-0 overflow-x-hidden">
        {/* Header Section */}
        <header className="p-6 md:p-8 bg-neutral-900/50 border-b border-neutral-800 shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="text-yellow-500">⚡</span>
                Workouts <span className="text-neutral-500 font-light">| {plan.philosophyName}</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-2 max-w-2xl">{plan.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 text-xs rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200">
                  Moves: <strong className="text-white">{sessionMetrics.totalMoves}</strong>
                </span>
                <span className="px-3 py-1.5 text-xs rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200">
                  Sets: <strong className="text-white">{sessionMetrics.totalSets}</strong>
                </span>
                <span className="px-3 py-1.5 text-xs rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200">
                  Est. Time: <strong className="text-white">{sessionMetrics.estMinutes} min</strong>
                </span>
                <span className="px-3 py-1.5 text-xs rounded-full bg-green-500/10 border border-green-500/30 text-green-200">
                  Completed: <strong className="text-green-100">{completedExerciseCount}</strong>
                </span>
                {saving && (
                  <span className="px-3 py-1.5 text-xs rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-200">
                    Syncing...
                  </span>
                )}
            </div>
        </header>

        {/* Tier Selection Tabs */}
        <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 overflow-x-auto hide-scrollbar shrink-0">
            <div className="flex gap-2 min-w-max md:justify-center">
                {TIERS.map(tier => (
                    <button
                        key={tier.id}
                        onClick={() => setActiveTier(tier.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                            activeTier === tier.id 
                            ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
                            : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                    >
                        <span className="opacity-70 mr-1">{tier.id}:</span> {tier.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Dynamic Weekly Scroller Navbar */}
        <DynamicScroller 
            activeDayIndex={activeDayIndex} 
            setActiveDayIndex={setActiveDayIndex} 
            days={plan.days} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            <div className="max-w-4xl mx-auto">
                {error && (
                  <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm flex items-center justify-between gap-3">
                    <span>{error}</span>
                    <button onClick={fetchPlan} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition">Retry</button>
                  </div>
                )}
                <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black uppercase text-white tracking-wide">{activeSession?.dayName}</h2>
                        <h3 className="text-yellow-400 font-medium tracking-wide mt-1 uppercase text-sm">{activeSession?.focus}</h3>
                    </div>
                    <div className="flex gap-2">
                      {!activeSession?.isRestDay && (
                        <button
                          onClick={startWorkoutFlow}
                          className="px-3 py-2 text-xs rounded-lg bg-yellow-500 text-black font-semibold border border-yellow-400/40 hover:bg-yellow-400 transition"
                        >
                          Play Workout Flow
                        </button>
                      )}
                      <button
                        onClick={() => setActiveDayIndex((prev) => (prev + 6) % 7)}
                        className="px-3 py-2 text-xs rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition"
                      >
                        Prev Day
                      </button>
                      <button
                        onClick={() => setActiveDayIndex((prev) => (prev + 1) % 7)}
                        className="px-3 py-2 text-xs rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition"
                      >
                        Next Day
                      </button>
                    </div>
                </div>
                {!activeSession?.isRestDay && (
                  <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search exercise..."
                      className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500"
                    />
                    <select
                      value={muscleFilter}
                      onChange={(e) => setMuscleFilter(e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500"
                    >
                      {availableMuscles.map(m => (
                        <option key={m} value={m}>{m === 'all' ? 'All Muscles' : m}</option>
                      ))}
                    </select>
                    <button
                      onClick={loadTodayLog}
                      className="bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm hover:bg-neutral-800 transition"
                    >
                      Restore Today Progress
                    </button>
                  </div>
                )}

                {activeSession?.isRestDay ? (
                    <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 text-center mt-8">
                        <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💤</div>
                        <h3 className="text-xl font-bold text-white mb-2">Active Recovery Day</h3>
                        <p className="text-neutral-400 mb-6 max-w-md mx-auto">Use today to let your CNS recover. Try these structured mobility flows instead of lifting.</p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {activeSession.recoverySuggestions.map((sug, i) => (
                                <span key={i} className="px-4 py-2 bg-neutral-800 rounded-lg text-sm font-medium border border-neutral-700">{sug}</span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredBlocks.map((block, idx) => (
                            <ExerciseCard 
                                key={block._id || idx} 
                                block={block} 
                                index={idx + 1}
                                initialCompletedSets={completedSetsMap[String(block?.exercise?._id)] || []}
                                onComplete={handleExerciseComplete}
                            />
                        ))}
                    </div>
                )}

                {showAdvancedLibrary && (
                  <section className="mt-10">
                    <div className="flex items-end justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-black tracking-wide">Full Program Exercise Library</h3>
                        <p className="text-neutral-400 text-sm">All workouts in this tier with dedicated 2D thumbnails.</p>
                      </div>
                      <span className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200">
                        Total Exercises: <strong className="text-white">{fullProgramExercises.length}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {fullProgramExercises.map((ex) => (
                        <button
                          key={ex._id}
                          onClick={() => openExercise(ex)}
                          className="text-left bg-neutral-900 border border-neutral-800 rounded-xl p-3 hover:border-yellow-500/50 transition"
                        >
                          <div className="aspect-square rounded-lg bg-neutral-800 border border-neutral-700/60 overflow-hidden mb-2">
                            <img
                              src={resolveExerciseImage(ex, false, { view: 'auto' })}
                              alt={ex.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.src = createExerciseSvgDataUrl(
                                  ex?.name || 'Workout',
                                  ex?.muscleGroup?.primary || 'General',
                                  ex?.equipmentRequired || 'Gym'
                                );
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-white font-semibold leading-snug">{ex.name}</p>
                          <p className="text-[10px] text-neutral-400 mt-1">{ex?.muscleGroup?.primary || 'General'}</p>
                          <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{getExerciseDescription(ex)}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
            </div>
        </main>

        {selectedExercise && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedExercise.name}</h4>
                  <p className="text-xs text-yellow-400">{selectedExercise?.muscleGroup?.primary || 'General'} • {selectedExercise?.equipmentRequired || 'Gym'}</p>
                </div>
                <button onClick={closeExerciseModal} className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">2D Visual</p>
                  <div className="mb-2 flex gap-2">
                    {['auto', 'front', 'back'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAnatomyView(v)}
                        className={`px-2.5 py-1 text-[11px] rounded-md border transition ${anatomyView === v ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'}`}
                      >
                        {v === 'auto' ? 'Auto' : v[0].toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800">
                    <img
                      src={resolveExerciseImage(selectedExercise, false, { view: anatomyView })}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = createExerciseSvgDataUrl(
                          selectedExercise?.name || 'Workout',
                          selectedExercise?.muscleGroup?.primary || 'General',
                          selectedExercise?.equipmentRequired || 'Gym',
                          {
                            view: anatomyView,
                            secondaryMuscles: selectedExercise?.muscleGroup?.secondary || []
                          }
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Form Animation</p>
                    <div className="h-52">
                      {renderExerciseAnimation(selectedExercise)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button onClick={() => navigateSelectedExercise(-1)} className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs hover:bg-neutral-700 transition">Previous</button>
                      <button onClick={() => navigateSelectedExercise(1)} className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs hover:bg-neutral-700 transition">Next</button>
                      {flowMode && (
                        <>
                          <button
                            onClick={() => setFlowRunning((v) => !v)}
                            className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs hover:bg-yellow-500/30 transition"
                          >
                            {flowRunning ? 'Pause Flow' : 'Resume Flow'}
                          </button>
                          <span className="text-xs px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200">
                            {Math.floor(flowSecondsLeft / 60)}:{String(Math.floor(flowSecondsLeft % 60)).padStart(2, '0')}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            Step {Math.min(flowExerciseIndex + 1, sessionExercises.length)} / {sessionExercises.length}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
                            Phase: {phaseLabel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-neutral-400 mb-1 uppercase tracking-wider">Description</p>
                    <p className="text-sm text-neutral-200 leading-relaxed">{getExerciseDescription(selectedExercise)}</p>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                    <p className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Form Cues</p>
                    <ul className="space-y-1.5">
                      {getFormCues(selectedExercise).map((cue, i) => (
                        <li key={i} className="text-sm text-neutral-200">• {cue}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              {flowMode && (
                <div className="px-5 pb-5">
                  <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden border border-neutral-700">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${sessionExercises.length ? ((flowExerciseIndex + 1) / sessionExercises.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default KinetixDashboard;
