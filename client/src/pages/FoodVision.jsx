import React, { useMemo, useRef, useState } from 'react';
import { Upload, X, ScanEye, Zap, Activity, Droplets, Leaf, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FoodVision = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [portionGrams, setPortionGrams] = useState(150);
    const [mealHint, setMealHint] = useState('');
    const [foodType, setFoodType] = useState('auto');
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
        setResult(null); // Reset previous results
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const analyzeFood = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);
        formData.append('portionGrams', String(portionGrams));
        formData.append('mealHint', mealHint.trim());
        formData.append('foodType', foodType);

        try {
            const userStr = localStorage.getItem('userInfo');
            const token = userStr ? JSON.parse(userStr).token : null;

            const res = await fetch('http://localhost:5000/api/ai/analyze-food', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data.meal_analysis);
                toast.success("Analysis Complete!");
            } else {
                toast.error(data.message || "Analysis Failed");
            }

        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const displayedNutrition = useMemo(() => {
        if (!result) return null;
        const per100 = result.nutrition_per_100g;
        if (per100) {
            const ratio = portionGrams / 100;
            return {
                calories: Math.round((per100.calories || 0) * ratio),
                protein: Number(((per100.protein || 0) * ratio).toFixed(1)),
                carbs: Number(((per100.carbs || 0) * ratio).toFixed(1)),
                fats: Number(((per100.fats || 0) * ratio).toFixed(1)),
                fiber: Number(((per100.fiber || 0) * ratio).toFixed(1)),
                sugar: Number(((per100.sugar || 0) * ratio).toFixed(1)),
                sodium_mg: Math.round((per100.sodium_mg || 0) * ratio),
                saturated_fat: Number(((per100.saturated_fat || 0) * ratio).toFixed(1))
            };
        }
        return result.nutrition || result.macros || null;
    }, [result, portionGrams]);

    // Helper for Health Grade Color
    const getGradeColor = (grade) => {
        switch (grade?.toLowerCase()) {
            case 'excellent': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'great': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'average': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'poor': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                    <ScanEye size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">AI Food Vision</h1>
                    <p className="text-gray-400">Snap a photo. Get instant macro breakdown & health grading.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Upload Section */}
                <div className="glass-card p-6 h-fit">
                    <h2 className="text-xl font-bold text-white mb-6">Upload Meal Photo</h2>

                    <div
                        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out flex flex-col items-center justify-center cursor-pointer min-h-[300px]
                            ${dragActive ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'border-gray-700 hover:border-indigo-400 hover:bg-white/5'}
                            ${preview ? 'p-0 border-none' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !preview && inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {preview ? (
                            <div className="relative w-full h-full">
                                <img src={preview} alt="Preview" className="w-full h-[300px] object-cover rounded-xl shadow-2xl" />
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                    className="absolute top-3 right-3 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition-all"
                                >
                                    <X size={20} />
                                </button>

                                {!loading && !result && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); analyzeFood(); }}
                                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
                                        >
                                            <ScanEye size={20} /> Analyze Meal
                                        </button>
                                    </div>
                                )}

                                {loading && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white">
                                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="font-bold animate-pulse">Analyzing...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center pointer-events-none p-8">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                                    <Upload size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Click or Drag Image</h3>
                                <p className="text-sm text-gray-400">Supports JPG, PNG, WEBP</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase tracking-wider text-gray-400">Meal Weight (grams)</label>
                            <input
                                type="range"
                                min={50}
                                max={700}
                                step={10}
                                value={portionGrams}
                                onChange={(e) => setPortionGrams(Number(e.target.value))}
                                className="w-full mt-2 accent-indigo-500"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                {[100, 150, 250, 350].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setPortionGrams(g)}
                                        className={`px-2 py-1 rounded-md text-xs border ${portionGrams === g ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40' : 'border-white/10 text-gray-300'}`}
                                    >
                                        {g}g
                                    </button>
                                ))}
                                <input
                                    type="number"
                                    min={50}
                                    max={1500}
                                    value={portionGrams}
                                    onChange={(e) => setPortionGrams(Math.min(1500, Math.max(50, Number(e.target.value) || 50)))}
                                    className="ml-auto w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wider text-gray-400">Meal Hint (optional)</label>
                            <input
                                type="text"
                                value={mealHint}
                                onChange={(e) => setMealHint(e.target.value)}
                                placeholder="e.g., chicken biryani, grilled chicken plate"
                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
                            />
                            <p className="text-[11px] text-gray-500 mt-2">
                                Helps improve dish detection when image quality is low.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="text-xs uppercase tracking-wider text-gray-400">Meal Type Override</label>
                        <select
                            value={foodType}
                            onChange={(e) => setFoodType(e.target.value)}
                            className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        >
                            <option value="auto">Auto detect</option>
                            <option value="biryani">Biryani</option>
                            <option value="chicken">Grilled chicken meal</option>
                            <option value="pizza">Pizza</option>
                        </select>
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {result ? (
                        <div className="animate-in slide-in-from-right duration-500 space-y-6">

                            {/* Health Grade Badge */}
                            <div className={`p-6 rounded-2xl border ${getGradeColor(result.health_grade)} flex items-center justify-between`}>
                                <div>
                                    <p className="text-xs uppercase tracking-widest font-bold opacity-70">Health Score</p>
                                    <h2 className="text-3xl font-black">{result.health_grade}</h2>
                                    <p className="text-xs opacity-70 mt-1">
                                        Confidence: {Math.round((result.confidence || 0.8) * 100)}%
                                    </p>
                                </div>
                                <Activity size={40} className="opacity-50" />
                            </div>

                            {/* Coach's Insight */}
                            <div className="glass-card p-6 border-l-4 border-l-indigo-500">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-indigo-400" />
                                    Coach's Insight
                                </h3>
                                <p className="text-gray-300 italic">"{result.coach_note}"</p>
                            </div>

                            {/* Detected Items */}
                            <div className="glass-card p-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Detected Items</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.items_detected.map((item, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-200 border border-white/10">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Macro Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="text-gray-400 text-xs mb-1 flex items-center gap-1"><Zap size={12} /> Calories</div>
                                    <div className="text-2xl font-bold text-white">{displayedNutrition?.calories ?? 0}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="text-emerald-400 text-xs mb-1">Protein</div>
                                    <div className="text-2xl font-bold text-emerald-400">{displayedNutrition?.protein ?? 0}g</div>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                    <div className="text-blue-400 text-xs mb-1">Fats</div>
                                    <div className="text-2xl font-bold text-blue-400">{displayedNutrition?.fats ?? 0}g</div>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <div className="text-orange-400 text-xs mb-1">Carbs</div>
                                    <div className="text-2xl font-bold text-orange-400">{displayedNutrition?.carbs ?? 0}g</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[11px] text-gray-400">Fiber</p>
                                    <p className="text-lg font-bold text-white">{displayedNutrition?.fiber ?? 0}g</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[11px] text-gray-400">Sugar</p>
                                    <p className="text-lg font-bold text-white">{displayedNutrition?.sugar ?? 0}g</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[11px] text-gray-400">Sodium</p>
                                    <p className="text-lg font-bold text-white">{displayedNutrition?.sodium_mg ?? 0}mg</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-[11px] text-gray-400">Sat. Fat</p>
                                    <p className="text-lg font-bold text-white">{displayedNutrition?.saturated_fat ?? 0}g</p>
                                </div>
                            </div>

                            <div className="glass-card p-4">
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Advanced Insights</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                        <p className="text-gray-400 text-xs">Estimated Plate</p>
                                        <p className="text-white font-semibold">{result.estimated_weight_g || portionGrams}g</p>
                                    </div>
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                        <p className="text-gray-400 text-xs">Current Portion</p>
                                        <p className="text-white font-semibold">{portionGrams}g</p>
                                    </div>
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                        <p className="text-gray-400 text-xs">Meal Type</p>
                                        <p className="text-white font-semibold capitalize">{result.meal_type || 'mixed'}</p>
                                    </div>
                                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                        <p className="text-gray-400 text-xs">Glycemic Load</p>
                                        <p className="text-white font-semibold capitalize">{result.glycemic_load || 'moderate'}</p>
                                    </div>
                                </div>
                            </div>

                            {Array.isArray(result.micronutrients) && result.micronutrients.length > 0 && (
                                <div className="glass-card p-4">
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Micronutrients</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.micronutrients.map((m, idx) => (
                                            <span key={idx} className="px-2 py-1 rounded-md text-xs bg-indigo-500/10 border border-indigo-400/20 text-indigo-300">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                                <div className="glass-card p-4 border-l-4 border-l-amber-500">
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Recommendations</p>
                                    <ul className="space-y-1 text-sm text-gray-300">
                                        {result.recommendations.map((tip, idx) => (
                                            <li key={idx}>• {tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="h-full glass-card flex flex-col items-center justify-center text-center p-8 opacity-50 border-dashed">
                            <ScanEye size={48} className="text-gray-600 mb-4" />
                            <p className="text-gray-400">Upload a meal photo to see<br />Artificial Intelligence analysis here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoodVision;
