import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, Clock } from 'lucide-react';
import { resolveExerciseImage } from './exerciseImage';

const ExerciseCard = ({ block, index, initialCompletedSets = [], onComplete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentSet, setCurrentSet] = useState(1);
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [restRemaining, setRestRemaining] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [completedSets, setCompletedSets] = useState([]);
    const [showInfo, setShowInfo] = useState(false);
    const [assetError, setAssetError] = useState(false);

    const exercise = block.exercise;
    const resolvedIcon = resolveExerciseImage(exercise, assetError);
    const animationUrl = exercise?.animationURL || '';
    const isVideoPreview = /\.(mp4|webm|ogg)$/i.test(animationUrl);

    // Rest Timer Logic
    useEffect(() => {
        let interval;
        if (isResting && restRemaining > 0) {
            interval = setInterval(() => {
                setRestRemaining(prev => prev - 1);
            }, 1000);
        } else if (restRemaining === 0 && isResting) {
            setIsResting(false);
            setCurrentSet(prev => Math.min(prev + 1, block.targetSets));
            // Trigger audio chime here if desired
        }
        return () => clearInterval(interval);
    }, [isResting, restRemaining, block.targetSets]);

    useEffect(() => {
        setCompletedSets(Array.isArray(initialCompletedSets) ? initialCompletedSets : []);
        const nextSet = (Array.isArray(initialCompletedSets) ? initialCompletedSets.length : 0) + 1;
        setCurrentSet(Math.min(nextSet, block.targetSets));
    }, [initialCompletedSets, block.targetSets]);

    const handleSaveSet = () => {
        if (!weight || !reps) return; // Basic validation
        
        setCompletedSets(prev => [...prev, { setNumber: currentSet, weight, reps }]);
        setWeight('');
        setReps('');

        if (currentSet < block.targetSets) {
            setRestRemaining(block.restTimerSeconds);
            setIsResting(true);
        } else {
            // Exercise complete
            const finalSets = [...completedSets, { setNumber: currentSet, weight, reps }];
            if (onComplete) {
                onComplete({
                    exerciseId: exercise?._id,
                    sets: finalSets.map(s => ({ ...s, weight: Number(s.weight), reps: Number(s.reps) }))
                });
            }
            setIsExpanded(false);
        }
    };

    const isComplete = completedSets.length === block.targetSets;

    return (
        <>
            <div 
                onClick={() => !isExpanded && !isComplete && setIsExpanded(true)}
                className={`relative bg-neutral-900 border ${isComplete ? 'border-green-500/30' : 'border-neutral-800 hover:border-yellow-500/50'} rounded-2xl overflow-hidden cursor-pointer transition-colors shadow-lg ${isExpanded ? 'opacity-0' : ''}`}
            >
                <div className="flex p-4 gap-4 items-center">
                    {/* Unique 2D Asset */}
                    <div className="w-20 h-20 rounded-xl bg-neutral-800 shrink-0 border border-neutral-700/50 flex items-center justify-center p-1 overflow-hidden relative">
                        <img
                            src={resolvedIcon}
                            alt={exercise.name}
                            loading="lazy"
                            decoding="async"
                            onError={() => setAssetError(true)}
                            className="w-full h-full object-contain filter drop-shadow-md"
                        />
                        {isComplete && (
                            <div className="absolute inset-0 bg-green-900/40 backdrop-blur-sm flex items-center justify-center">
                                <CheckCircle className="text-green-400 w-8 h-8" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-yellow-500 font-mono text-xs font-bold tracking-widest">{index < 10 ? `0${index}` : index}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-400">
                                {exercise.muscleGroup.primary}
                            </span>
                        </div>
                        <h3 className="text-white font-bold leading-tight line-clamp-1">{exercise.name}</h3>
                        <p className="text-neutral-500 text-xs mt-1 font-medium tracking-wide">
                            {block.targetSets} SETS <span className="mx-1">•</span> {block.targetReps} REPS
                        </p>
                    </div>
                </div>

                {/* Progress Bar Mini */}
                {completedSets.length > 0 && !isComplete && (
                    <div className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-300" style={{ width: `${(completedSets.length / block.targetSets) * 100}%` }} />
                )}
            </div>

            {/* EXPANDED ACTIVE SET PLAYER (Portal/Modal Style) */}
            <AnimatePresence>
                {isExpanded && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div 
                            className="w-full max-w-md bg-neutral-900 rounded-3xl border border-neutral-700 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-800 p-1">
                                        <img
                                            src={resolvedIcon}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            onError={() => setAssetError(true)}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold max-w-[200px] truncate">{exercise.name}</h2>
                                        <p className="text-yellow-500 text-xs font-medium tracking-wide">SET {currentSet} OF {block.targetSets}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowInfo(!showInfo)} className="p-2 text-neutral-400 hover:text-white transition bg-neutral-800 rounded-full">
                                        <Info className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setIsExpanded(false)} className="w-9 h-9 flex items-center justify-center bg-neutral-800 text-neutral-400 hover:text-white rounded-full font-bold">
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Pro-Tip Modal Overlay */}
                            <AnimatePresence>
                                {showInfo && (
                                    <div 
                                        className="bg-blue-900/20 border-b border-blue-900/30 p-4 text-sm text-blue-100"
                                    >
                                        <strong className="text-blue-400 font-bold block mb-1">PRO TIP:</strong>
                                        {exercise.description}
                                        {animationUrl && (
                                            <div className="mt-3 rounded-xl overflow-hidden border border-blue-900/40 bg-black/20">
                                                {isVideoPreview ? (
                                                    <video src={animationUrl} controls className="w-full max-h-52 object-cover" />
                                                ) : (
                                                    <img src={animationUrl} alt={`${exercise.name} demo`} className="w-full max-h-52 object-cover" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AnimatePresence>

                            {/* Rest Timer OR Input Form */}
                            <div className="p-6 flex-1 flex flex-col justify-center relative">
                                {isResting ? (
                                    <div className="text-center">
                                        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                                        <h3 className="text-2xl font-black text-white mb-2">REST</h3>
                                        <div className="text-7xl font-mono text-yellow-500 font-bold tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                            {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, '0')}
                                        </div>
                                        <button 
                                            onClick={() => setIsResting(false)} 
                                            className="mt-8 px-6 py-2 border border-neutral-700 text-neutral-400 rounded-full text-sm font-semibold hover:bg-neutral-800 hover:text-white transition"
                                        >
                                            Skip Rest
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
                                            <div>
                                                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">Target</p>
                                                <p className="text-white font-medium">{block.targetReps} Reps @ RPE {block.targetRPE}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-neutral-400 text-xs font-bold uppercase tracking-widest pl-1">Weight (kg)</label>
                                                <input 
                                                    type="number" 
                                                    value={weight} 
                                                    onChange={e => setWeight(e.target.value)} 
                                                    className="w-full bg-neutral-1000 border border-neutral-700 bg-neutral-900 text-white rounded-xl px-4 py-4 text-2xl text-center font-bold focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition"
                                                    placeholder="0"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-neutral-400 text-xs font-bold uppercase tracking-widest pl-1">Actual Reps</label>
                                                <input 
                                                    type="number" 
                                                    value={reps} 
                                                    onChange={e => setReps(e.target.value)} 
                                                    className="w-full bg-neutral-1000 border border-neutral-700 bg-neutral-900 text-white rounded-xl px-4 py-4 text-2xl text-center font-bold focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleSaveSet}
                                            disabled={!weight || !reps}
                                            className="w-full bg-yellow-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-lg hover:bg-yellow-400 transition transform active:scale-[0.98]"
                                        >
                                            {currentSet === block.targetSets ? 'Finish Exercise' : 'Save & Rest'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Completed Sets History Mini-table */}
                            {completedSets.length > 0 && (
                                <div className="bg-neutral-950 p-4 border-t border-neutral-800">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">History</span>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                                        {completedSets.map((s, i) => (
                                            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 min-w-[70px] shrink-0 text-center">
                                                <p className="text-[10px] text-neutral-500 font-bold">SET {s.setNumber}</p>
                                                <p className="text-white font-medium text-sm">{s.weight}kg</p>
                                                <p className="text-neutral-400 text-xs">{s.reps} reps</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ExerciseCard;
