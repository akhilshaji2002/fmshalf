import React, { useState, useEffect } from 'react';
import { Activity, Zap, Brain, UserCheck, Lock, Trophy, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSafeUser } from '../utils/auth';
import DietChart from '../components/DietChart';

const Training = () => {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState('');
    const [formData, setFormData] = useState({
        weight: 70, height: 175, age: 25, gender: 'male', activityLevel: 'moderate',
        goals: 'Maintain',
        dietType: 'balanced',
        foodAllergies: [],
        healthConditions: []
    });
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState({ role: 'member' });
    const [pendingTestimonials, setPendingTestimonials] = useState([]);

    useEffect(() => {
        const userData = getSafeUser();
        setUser(userData || { role: 'member' });
        const token = userData?.token;

        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        if (userData.role === 'admin' || userData.role === 'trainer') {
            // Trainer Mode: Fetch Members
            fetch('http://localhost:5000/api/members', { headers })
                .then(res => res.json())
                .then(data => setMembers(Array.isArray(data) ? data : []))
                .catch(err => console.error(err));

            // Fetch Pending Testimonials
            fetch('http://localhost:5000/api/testimonials/pending', { headers })
                .then(res => res.json())
                .then(data => setPendingTestimonials(Array.isArray(data) ? data : []))
                .catch(err => console.error(err));
        } else {
            // Member Mode: Fetch My Plan
            setLoading(true);
            fetch('http://localhost:5000/api/ai/my-plan', { headers })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('No plan found');
                })
                .then(data => {
                    if (data.dietPlan) {
                        setResults({
                            tdee: data.metrics?.tdee || 0,
                            bmr: data.metrics?.bmr || 0,
                            dietPlan: data.dietPlan || []
                        });
                    }
                })
                .catch(() => console.log("No existing plan found"))
                .finally(() => setLoading(false));
        }
    }, []);

    const handleMemberSelect = (e) => {
        const memberId = e.target.value;
        setSelectedMember(memberId);
        if (memberId) {
            const member = members.find(m => m._id === memberId);
            if (member && member.metrics && member.metrics.weight) {
                setFormData(prev => ({ ...prev, ...member.metrics, goals: prev.goals || 'Maintain' }));
            }
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleHealthConditionChange = (condition) => {
        if (condition === 'None') {
            setFormData(prev => ({ ...prev, healthConditions: [] }));
            return;
        }
        setFormData(prev => {
            const current = prev.healthConditions || [];
            if (current.includes(condition)) {
                return { ...prev, healthConditions: current.filter(c => c !== condition) };
            } else {
                return { ...prev, healthConditions: [...current.filter(c => c !== 'None'), condition] };
            }
        });
    };

    const handleAllergyChange = (allergy) => {
        if (allergy === 'None') {
            setFormData(prev => ({ ...prev, foodAllergies: [] }));
            return;
        }
        setFormData(prev => {
            const current = prev.foodAllergies || [];
            if (current.includes(allergy)) {
                return { ...prev, foodAllergies: current.filter(c => c !== allergy) };
            }
            return { ...prev, foodAllergies: [...current.filter(c => c !== 'None'), allergy] };
        });
    };

    const validateForm = () => {
        const weight = Number(formData.weight);
        const height = Number(formData.height);
        const age = Number(formData.age);
        if (Number.isNaN(weight) || weight < 25 || weight > 350) return "Weight should be between 25 and 350 kg.";
        if (Number.isNaN(height) || height < 120 || height > 240) return "Height should be between 120 and 240 cm.";
        if (Number.isNaN(age) || age < 12 || age > 100) return "Age should be between 12 and 100.";
        if (isStaff && !selectedMember) return "Select a member to save a plan.";
        return null;
    };

    const calculate = async () => {
        const validationError = validateForm();
        if (validationError) {
            toast.error(validationError);
            return;
        }
        setLoading(true);
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr).token : null;

        try {
            const payload = {
                ...formData,
                userId: (user.role === 'admin' || user.role === 'trainer') ? selectedMember : user._id
            };

            const res = await fetch('http://localhost:5000/api/ai/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || "Unable to generate plan.");
            }
            setResults(data);
            toast.success("Plan Updated Successfully!");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to generate plan.");
        } finally {
            setLoading(false);
        }
    };

    const handleTestimonialStatus = async (id, status) => {
        const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
        try {
            const res = await fetch(`http://localhost:5000/api/testimonials/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success(`Success Story ${status}!`);
                setPendingTestimonials(prev => prev.filter(t => t._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const isStaff = user?.role === 'admin' || user?.role === 'trainer';

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white mb-2">
                    {isStaff ? "AI Training Studio" : "My Smart Plan"}
                </h1>
                <p className="text-gray-400">
                    {isStaff ? "Assign personalized plans to members." : "Your AI-generated nutrition and power insights."}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="glass-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-primary/20 rounded-xl text-primary"><Activity /></div>
                        <h2 className="text-xl font-semibold text-white">
                            {isStaff ? "Member Biometrics" : "Update My Stats"}
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {isStaff && (
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Select Member</label>
                                <select value={selectedMember} onChange={handleMemberSelect}
                                    className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none">
                                    <option value="">-- Guest Mode --</option>
                                    {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Weight (kg)</label>
                                <input type="number" name="weight" value={formData.weight} onChange={handleChange}
                                    className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Height (cm)</label>
                                <input type="number" name="height" value={formData.height} onChange={handleChange}
                                    className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Age</label>
                                <input type="number" name="age" value={formData.age} onChange={handleChange}
                                    className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Gender</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}
                                    className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Activity Level</label>
                            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}
                                className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none">
                                <option value="sedentary">Sedentary</option>
                                <option value="light">Light Active</option>
                                <option value="moderate">Moderately Active</option>
                                <option value="active">Very Active</option>
                                <option value="very_active">Super Active</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Goal</label>
                            <select name="goals" value={formData.goals} onChange={handleChange}
                                className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none">
                                <option value="Maintain">Maintain</option>
                                <option value="Weight Loss">Weight Loss</option>
                                <option value="Muscle Gain">Muscle Gain</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Diet Type</label>
                            <select name="dietType" value={formData.dietType} onChange={handleChange}
                                className="w-full bg-surface border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none">
                                <option value="balanced">Balanced</option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                                <option value="high_protein">High Protein</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Medical Conditions (Select all that apply)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Diabetic', 'High Cholesterol', 'Hypertension', 'Thyroid', 'PCOS/PCOD', 'None'].map(cond => (
                                    <button
                                        key={cond}
                                        onClick={() => handleHealthConditionChange(cond)}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${(formData.healthConditions || []).includes(cond) || (cond === 'None' && (formData.healthConditions || []).length === 0)
                                            ? 'bg-primary text-black border-primary'
                                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {cond}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Food Allergies / Intolerances</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Milk/Dairy', 'Shrimp/Shellfish', 'Fish', 'Egg', 'Peanut', 'Tree Nuts', 'Soy', 'Gluten', 'None'].map(allergy => (
                                    <button
                                        key={allergy}
                                        onClick={() => handleAllergyChange(allergy)}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${(formData.foodAllergies || []).includes(allergy) || (allergy === 'None' && (formData.foodAllergies || []).length === 0)
                                            ? 'bg-primary text-black border-primary'
                                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {allergy}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={calculate} disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                            {loading ? <Zap className="animate-spin" /> : <Brain />}
                            {loading ? 'Processing...' : (isStaff ? 'Generate Plan' : 'Update My Plan')}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {results ? (
                        <>
                            {results.saved && (
                                <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                                    <UserCheck size={20} /> Plan saved successfully.
                                </div>
                            )}

                            <div className="glass-card p-8 border-primary/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Daily Energy Needs</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-white">{results.tdee}</span>
                                    <span className="text-primary font-medium">kcal/day</span>
                                </div>
                                <div className="mt-4 flex gap-4 text-sm text-gray-400">
                                    <span>BMR: <strong className="text-white">{results.bmr}</strong></span>
                                </div>
                            </div>

                            <div className="glass-card p-8">
                                <h3 className="text-xl font-semibold text-white mb-6">Suggested Macros</h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-emerald-400 font-bold text-xl">{results.dietPlan?.macros?.protein}g</div>
                                        <div className="text-xs text-gray-500 mt-1">Protein</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-blue-400 font-bold text-xl">{results.dietPlan?.macros?.fats}g</div>
                                        <div className="text-xs text-gray-500 mt-1">Fats</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-orange-400 font-bold text-xl">{results.dietPlan?.macros?.carbs}g</div>
                                        <div className="text-xs text-gray-500 mt-1">Carbs</div>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20 text-primary text-sm">
                                    {results.dietPlan?.suggestion}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full glass-card flex flex-col items-center justify-center text-center p-8 opacity-50 border-dashed">
                            {isStaff ? (
                                <>
                                    <Brain size={48} className="text-gray-600 mb-4" />
                                    <p className="text-gray-400">Select a member to generate<br />AI insights.</p>
                                </>
                            ) : (
                                <>
                                    <Lock size={48} className="text-gray-600 mb-4" />
                                    <p className="text-gray-400">No active plan found.<br />Click "Update My Plan" to start.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Diet Chart Section */}
            {results && results.dietPlan && (
                <div className="pt-8 border-t border-white/5">
                    <DietChart dietPlan={results.dietPlan} tdee={results.tdee} />
                </div>
            )}

            {/* Pending Testimonials Section for Trainers */}
            {user?.role === 'trainer' && pendingTestimonials.length > 0 && (
                <div className="pt-12 border-t border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3 italic">
                                <Trophy className="text-primary" /> PENDING SUCCESS STORIES
                            </h2>
                            <p className="text-gray-400 text-sm">Review these transformations before they go live on your profile.</p>
                        </div>
                        <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black animate-pulse">
                            {pendingTestimonials.length} WAITING
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingTestimonials.map(t => (
                            <div key={t._id} className="glass-card group overflow-hidden flex flex-col border-primary/20 hover:border-primary transition-all">
                                <div className="h-48 relative overflow-hidden">
                                    <img src={t.transformationImage} alt="Transformation" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute top-4 left-4 bg-primary text-black text-[10px] font-black px-2 py-1 rounded shadow-xl">
                                        {t.achievement}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-primary/50 overflow-hidden">
                                            <img src={t.member?.profilePic || '/assets/default_user.png'} alt={t.member?.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-sm">{t.member?.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Student</div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm italic mb-6 line-clamp-3">"{t.content}"</p>

                                    <div className="mt-auto flex gap-3">
                                        <button
                                            onClick={() => handleTestimonialStatus(t._id, 'approved')}
                                            className="flex-1 py-3 bg-primary text-black font-black text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            APPROVE & FEATURE
                                        </button>
                                        <button
                                            onClick={() => handleTestimonialStatus(t._id, 'rejected')}
                                            className="flex-1 py-3 bg-white/5 text-gray-400 font-bold text-xs rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all"
                                        >
                                            REJECT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default Training;
