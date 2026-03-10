import React, { useMemo, useState } from 'react';
import { Calendar, ShoppingCart, Droplets, PieChart, Smile, Frown, Meh, Utensils, ImageOff, Loader } from 'lucide-react';

const createMealVisual = (mealName = '') => {
    const n = mealName.toLowerCase();
    let main = '#fbbf24'; // carbs
    let accent = '#34d399'; // greens
    if (n.includes('chicken') || n.includes('paneer') || n.includes('egg') || n.includes('fish') || n.includes('steak')) {
        main = '#ef4444'; // protein
        accent = '#f59e0b';
    } else if (n.includes('salad') || n.includes('veggie') || n.includes('greens')) {
        main = '#22c55e';
        accent = '#16a34a';
    } else if (n.includes('shake') || n.includes('yogurt') || n.includes('snack')) {
        main = '#60a5fa';
        accent = '#3b82f6';
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>
      <rect width='160' height='160' rx='18' fill='#141820'/>
      <circle cx='80' cy='88' r='40' fill='#0b0f14' stroke='#263142' stroke-width='4'/>
      <ellipse cx='64' cy='86' rx='22' ry='14' fill='${main}' fill-opacity='0.85'/>
      <ellipse cx='90' cy='96' rx='20' ry='12' fill='${accent}' fill-opacity='0.85'/>
      <ellipse cx='84' cy='72' rx='16' ry='10' fill='#e5e7eb' fill-opacity='0.35'/>
      <text x='12' y='145' font-size='12' fill='#b3bcc9' font-family='Arial'>${mealName.slice(0, 18)}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const MealImage = ({ mealName }) => {
    const [imageState, setImageState] = useState('loading'); // 'loading', 'loaded', 'error'

    // Deterministic visual avoids network failures and broken cards.
    const imageUrl = createMealVisual(mealName);

    return (
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 relative">
            {/* Loading Skeleton */}
            {imageState === 'loading' && (
                <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
                    <Loader size={16} className="text-gray-500 animate-spin" />
                </div>
            )}

            {/* Error State */}
            {imageState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/5 text-gray-500">
                    <ImageOff size={16} />
                    <span className="text-[10px] mt-1">No Image</span>
                </div>
            )}

            {/* Actual Image */}
            <img
                src={imageUrl}
                alt={mealName}
                className={`w-full h-full object-cover transition-opacity duration-500 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageState('loaded')}
                onError={() => setImageState('error')}
            />
        </div>
    );
};

const DietChart = ({ dietPlan, tdee }) => {
    const [activeDay, setActiveDay] = useState(0);
    const [checkedItems, setCheckedItems] = useState({});

    // Interactive Plate State
    const [macroRatios, setMacroRatios] = useState({
        protein: 25,
        fats: 25,
        carbs: 25,
        veggies: 25
    });

    // Tracking State (Local for UI demo)
    const [hungerRating, setHungerRating] = useState(5);
    const [selectedMood, setSelectedMood] = useState('neutral');
    const [dietType, setDietType] = useState(dietPlan?.dietType || 'balanced');
    const [allergies, setAllergies] = useState(dietPlan?.foodAllergies || []);
    const [likedFoods, setLikedFoods] = useState([]);

    const weeklyPlan = useMemo(() => {
        const raw = dietPlan?.weeklyPlan || [];
        if (raw.length <= 1) return raw;

        const signatures = raw.map(day =>
            (day.meals || []).map(m => `${m.name}|${m.description}`).join('||')
        );
        const uniqueCount = new Set(signatures).size;
        if (uniqueCount > 2) return raw; // already varied enough

        // Auto-variation fallback for old saved plans that repeat the same menu all days
        const variantPool = {
            Breakfast: [
                "Oatmeal with nuts and banana",
                "Egg white omelette with toast",
                "Poha with peanuts and curd",
                "Greek yogurt bowl with berries",
                "Besan chilla with chutney",
                "Idli-sambar with protein side",
                "Paneer wrap with vegetables"
            ],
            "Snack 1": [
                "Apple + almonds",
                "Greek yogurt + seeds",
                "Sprout salad",
                "Fruit + roasted chana",
                "Protein smoothie",
                "Coconut water + nuts",
                "Buttermilk + peanuts"
            ],
            Lunch: [
                "Grilled chicken/paneer with rice and salad",
                "Rajma-chawal with cucumber salad",
                "Dal, roti and mixed sabzi",
                "Fish/tofu with quinoa and greens",
                "Chole with jeera rice",
                "Chicken stir-fry with millet roti",
                "Sambar rice with curd"
            ],
            "Snack 2": [
                "Protein shake + walnuts",
                "Banana + peanut butter",
                "Makhana (roasted)",
                "Hummus with veggie sticks",
                "Corn + paneer cubes",
                "Lassi + mixed nuts",
                "Paneer tikka bites"
            ],
            Dinner: [
                "Light salad with lean protein",
                "Moong dal khichdi + curd",
                "Soup + whole grain toast",
                "Paneer/tofu bowl with veggies",
                "Egg bhurji + sauteed greens",
                "Dal + 2 phulkas + sabzi",
                "Quinoa pulao + raita"
            ]
        };

        return raw.map((day, dayIdx) => ({
            ...day,
            meals: (day.meals || []).map((meal) => ({
                ...meal,
                description: variantPool[meal.name]?.[dayIdx % 7] || meal.description
            }))
        }));
    }, [dietPlan.weeklyPlan]);
    if (!dietPlan || weeklyPlan.length === 0) {
        return null;
    }

    const safeDayIndex = Math.min(activeDay, weeklyPlan.length - 1);
    const currentDay = weeklyPlan[safeDayIndex];

    const allergyOptions = ['Milk/Dairy', 'Shrimp/Shellfish', 'Fish', 'Egg', 'Peanut', 'Tree Nuts', 'Soy', 'Gluten'];
    const isRestricted = (text = '') => {
        const t = text.toLowerCase();
        if (dietType === 'vegan' && /(milk|curd|yogurt|paneer|cheese|ghee|egg|chicken|fish|shrimp|meat|keema)/i.test(t)) return true;
        if (dietType === 'vegetarian' && /(chicken|fish|shrimp|meat|keema)/i.test(t)) return true;
        if (allergies.includes('Milk/Dairy') && /(milk|curd|yogurt|paneer|cheese|ghee|lassi|buttermilk|raita)/i.test(t)) return true;
        if (allergies.includes('Shrimp/Shellfish') && /(shrimp|shellfish|prawn|lobster|crab)/i.test(t)) return true;
        if (allergies.includes('Fish') && /(fish|salmon|tuna)/i.test(t)) return true;
        if (allergies.includes('Egg') && /(egg|omelette)/i.test(t)) return true;
        if (allergies.includes('Peanut') && /(peanut)/i.test(t)) return true;
        if (allergies.includes('Tree Nuts') && /(almond|walnut|cashew|pistachio|nuts)/i.test(t)) return true;
        if (allergies.includes('Soy') && /(soy|tofu|soya)/i.test(t)) return true;
        if (allergies.includes('Gluten') && /(wheat|toast|roti|bread)/i.test(t)) return true;
        return false;
    };
    const safeDescription = (meal) => {
        if (!isRestricted(meal?.description || '')) return meal?.description || '';
        return 'Allergy-safe alternative: lean protein + fiber-rich carbs + mixed vegetables.';
    };
    const toggleAllergy = (name) => {
        setAllergies(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);
    };
    const toggleLikedFood = (item) => {
        setLikedFoods(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
    };

    const toggleGroceryItem = (item) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item]
        }));
    };

    const handleSliderChange = (e) => {
        const { name, value } = e.target;
        const nextValue = parseInt(value, 10);
        setMacroRatios(prev => {
            const keys = ['protein', 'fats', 'carbs', 'veggies'];
            const others = keys.filter(k => k !== name);
            const currentOthersTotal = others.reduce((sum, k) => sum + prev[k], 0) || 1;
            const remaining = Math.max(0, 100 - nextValue);

            const next = { ...prev, [name]: nextValue };
            others.forEach(k => {
                next[k] = Math.max(0, Math.round((prev[k] / currentOthersTotal) * remaining));
            });

            // Fix rounding drift to always keep exact 100.
            const total = keys.reduce((s, k) => s + next[k], 0);
            if (total !== 100) next[others[0]] = Math.max(0, next[others[0]] + (100 - total));
            return next;
        });
    };

    // Base macro parse from meal object
    const getBaseMealMacros = (meal) => {
        const p = Number(meal?.macros?.p || 0);
        const f = Number(meal?.macros?.f || 0);
        const c = Number(meal?.macros?.c || 0);
        if (p > 0 || f > 0 || c > 0) return { p, f, c };

        // Fallback if meal macros are missing: approximate split from meal calories
        const calories = Number(meal?.calories || 0);
        return {
            p: Math.round((calories * 0.3) / 4),
            f: Math.round((calories * 0.3) / 9),
            c: Math.round((calories * 0.4) / 4)
        };
    };

    // Dynamic macro + calories model from interactive plate
    // Keep total macro grams near baseline, redistribute by sliders.
    const getAdjustedMeal = (meal) => {
        const base = getBaseMealMacros(meal);
        const baseTotalGrams = Math.max(1, base.p + base.f + base.c);

        const totalShare = macroRatios.protein + macroRatios.fats + macroRatios.carbs + macroRatios.veggies;
        const safeTotal = totalShare === 0 ? 1 : totalShare;
        const proteinShare = macroRatios.protein / safeTotal;
        const fatShare = macroRatios.fats / safeTotal;
        const carbShare = (macroRatios.carbs + macroRatios.veggies) / safeTotal;

        let p = Math.round(baseTotalGrams * proteinShare);
        let f = Math.round(baseTotalGrams * fatShare);
        let c = Math.max(0, Math.round(baseTotalGrams * carbShare));

        // Correct rounding drift on grams
        const drift = baseTotalGrams - (p + f + c);
        c = Math.max(0, c + drift);

        const calories = Math.round((p * 4) + (f * 9) + (c * 4));
        return { calories, macros: { p, f, c } };
    };
    const dayTotals = currentDay.meals.reduce((acc, meal) => {
        const adjusted = getAdjustedMeal(meal);
        acc.calories += adjusted.calories || 0;
        acc.p += adjusted.macros.p || 0;
        acc.f += adjusted.macros.f || 0;
        acc.c += adjusted.macros.c || 0;
        return acc;
    }, { calories: 0, p: 0, f: 0, c: 0 });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                    <Utensils size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Advanced Nutrition Plan</h2>
                    <p className="text-gray-400 text-sm">Hyper-personalized 7-Day Diet Chart</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Weekly Schedule */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Day Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {weeklyPlan.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveDay(index)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeDay === index
                                        ? 'bg-primary text-black scale-105'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {day.day || `Day ${index + 1}`}
                            </button>
                        ))}
                    </div>

                    {/* Meals List */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-primary" />
                            {currentDay.day || `Day ${activeDay + 1}`} Menu
                        </h3>
                        <div className="grid grid-cols-4 gap-2 mb-2 text-center">
                            <div className="bg-white/5 rounded-lg p-2"><p className="text-[10px] text-gray-500">Kcal</p><p className="text-white text-sm font-bold">{dayTotals.calories}</p></div>
                            <div className="bg-white/5 rounded-lg p-2"><p className="text-[10px] text-gray-500">P</p><p className="text-emerald-400 text-sm font-bold">{dayTotals.p}g</p></div>
                            <div className="bg-white/5 rounded-lg p-2"><p className="text-[10px] text-gray-500">F</p><p className="text-blue-400 text-sm font-bold">{dayTotals.f}g</p></div>
                            <div className="bg-white/5 rounded-lg p-2"><p className="text-[10px] text-gray-500">C</p><p className="text-orange-400 text-sm font-bold">{dayTotals.c}g</p></div>
                        </div>

                        <div className="space-y-4">
                            {currentDay.meals.map((meal, idx) => {
                                const adjusted = getAdjustedMeal(meal);
                                const displayMacros = adjusted.macros;
                                const displayCalories = adjusted.calories;

                                return (
                                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors group">
                                        <div className="flex gap-4">

                                            {/* Robust Image Component */}
                                            <MealImage mealName={meal.name} />

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white text-lg">{meal.name}</h4>
                                                    <span className="text-xs bg-black/30 px-2 py-1 rounded text-primary font-mono">
                                                        {displayCalories} kcal
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm mb-2 line-clamp-2">{safeDescription(meal)}</p>
                                                {isRestricted(meal?.description || '') && (
                                                    <p className="text-[10px] text-yellow-400 mb-1">Auto-adjusted for selected allergy/diet type</p>
                                                )}

                                                {/* Macros Mini-Bar */}
                                                <div className="flex gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> P: {displayMacros?.p}g</span>
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div> F: {displayMacros?.f}g</span>
                                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> C: {displayMacros?.c}g</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Behavioral Tracking */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Daily Tracking</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mood */}
                            <div>
                                <label className="text-gray-400 text-sm block mb-3">Post-Meal Mood</label>
                                <div className="flex gap-4">
                                    <button onClick={() => setSelectedMood('happy')} className={`p-3 rounded-xl transition-all ${selectedMood === 'happy' ? 'bg-green-500/20 text-green-400 scale-110' : 'bg-white/5 text-gray-500'}`}><Smile /></button>
                                    <button onClick={() => setSelectedMood('neutral')} className={`p-3 rounded-xl transition-all ${selectedMood === 'neutral' ? 'bg-yellow-500/20 text-yellow-400 scale-110' : 'bg-white/5 text-gray-500'}`}><Meh /></button>
                                    <button onClick={() => setSelectedMood('sad')} className={`p-3 rounded-xl transition-all ${selectedMood === 'sad' ? 'bg-red-500/20 text-red-400 scale-110' : 'bg-white/5 text-gray-500'}`}><Frown /></button>
                                </div>
                            </div>

                            {/* Hunger */}
                            <div>
                                <label className="text-gray-400 text-sm block mb-3">Hunger Rating (1-10)</label>
                                <input
                                    type="range"
                                    min="1" max="10"
                                    value={hungerRating}
                                    onChange={(e) => setHungerRating(e.target.value)}
                                    className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>Starving</span>
                                    <span className="text-primary font-bold">{hungerRating}</span>
                                    <span>Stuffed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Grocery List & Plate Method */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Diet Preferences & Allergies</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-xs block mb-2 uppercase">Diet Type</label>
                                <select
                                    value={dietType}
                                    onChange={(e) => setDietType(e.target.value)}
                                    className="w-full bg-surface border border-white/5 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                >
                                    <option value="balanced">Balanced</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="high_protein">High Protein</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs block mb-2 uppercase">Food Allergies</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {allergyOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => toggleAllergy(opt)}
                                            className={`p-2 rounded-lg text-[11px] font-semibold border transition ${allergies.includes(opt) ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Plate Method */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <PieChart size={18} className="text-primary" />
                            Interactive Plate
                        </h3>

                        {/* Sliders */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-green-400">Veggies</span>
                                    <span className="text-white">{macroRatios.veggies}%</span>
                                </div>
                                <input type="range" name="veggies" min="0" max="100" value={macroRatios.veggies} onChange={handleSliderChange} className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-red-400">Protein</span>
                                    <span className="text-white">{macroRatios.protein}%</span>
                                </div>
                                <input type="range" name="protein" min="0" max="100" value={macroRatios.protein} onChange={handleSliderChange} className="w-full accent-red-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-yellow-400">Carbs</span>
                                    <span className="text-white">{macroRatios.carbs}%</span>
                                </div>
                                <input type="range" name="carbs" min="0" max="100" value={macroRatios.carbs} onChange={handleSliderChange} className="w-full accent-yellow-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-blue-400">Fats</span>
                                    <span className="text-white">{macroRatios.fats}%</span>
                                </div>
                                <input type="range" name="fats" min="0" max="100" value={macroRatios.fats} onChange={handleSliderChange} className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>

                        {/* Visual Plate */}
                        <div className="w-48 h-48 mx-auto rounded-full border-4 border-white/10 relative flex overflow-hidden shadow-2xl">
                            {/* We use flex-basis based on ratio for a rough pie chart visualization */}
                            <div style={{ flex: macroRatios.veggies }} className="h-full bg-green-500/40 flex items-center justify-center transition-all duration-300"></div>
                            <div style={{ flex: macroRatios.protein }} className="h-full bg-red-500/40 flex items-center justify-center transition-all duration-300"></div>
                            <div style={{ flex: macroRatios.carbs }} className="h-full bg-yellow-500/40 flex items-center justify-center transition-all duration-300"></div>
                            <div style={{ flex: macroRatios.fats }} className="h-full bg-blue-500/40 flex items-center justify-center transition-all duration-300"></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center italic">
                            Adjust sliders to customize your meal portions. Meal macros will update automatically.
                        </p>
                        {tdee ? (
                            <p className={`text-xs mt-2 text-center ${Math.abs(dayTotals.calories - tdee) <= 150 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                Projected day calories: {dayTotals.calories} kcal (target {tdee} kcal)
                            </p>
                        ) : null}
                    </div>

                    {/* Hydration Target */}
                    <div className="glass-card p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Droplets size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Hydration Goal</h3>
                            <p className="text-gray-400 text-sm">{dietPlan.hydrationTarget || "Stay hydrated! Aim for 3-4 liters of water daily."}</p>
                        </div>
                    </div>

                    {/* Grocery List */}
                    <div className="glass-card p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShoppingCart size={18} className="text-primary" />
                            Grocery List
                        </h3>
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 mb-2">Foods you like (prioritize in list):</p>
                            <div className="flex flex-wrap gap-2">
                                {(dietPlan.groceryList || []).slice(0, 12).map(item => (
                                    <button
                                        key={`like-${item}`}
                                        onClick={() => toggleLikedFood(item)}
                                        className={`text-[11px] px-2.5 py-1 rounded-full border transition ${likedFoods.includes(item) ? 'bg-primary text-black border-primary' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                            {dietPlan.groceryList?.length > 0 ? (
                                [...dietPlan.groceryList]
                                    .filter(item => !isRestricted(item))
                                    .sort((a, b) => Number(likedFoods.includes(b)) - Number(likedFoods.includes(a)))
                                    .map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`grocery-${index}`}
                                            checked={checkedItems[item] || false}
                                            onChange={() => toggleGroceryItem(item)}
                                            className="w-5 h-5 accent-primary rounded-md border-white/10 focus:ring-primary"
                                        />
                                        <label htmlFor={`grocery-${index}`} className={`flex-1 text-sm ${checkedItems[item] ? 'line-through text-gray-500' : 'text-white'}`}>
                                            {item}
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">Your grocery list will appear here once a plan is generated.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DietChart;
