import React, { useState } from 'react';
import { Dumbbell, ArrowRight, AlertTriangle, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'member',
        mobileNumber: '',
        profilePic: '',
        nationalId: { idType: 'aadhar', idNumber: '' },
        experience: '0',
        specializations: [],
        bio: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('userInfo', JSON.stringify(data));
                navigate('/');
                window.location.reload();
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (err) {
            console.error(err);
            setError('Connection to server failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative overflow-y-auto">
            {/* Login Section */}
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px]" />
                </div>

                <div className="glass-card w-full max-w-md p-8 z-10 border-white/10">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 bg-gradient-to-tr from-primary to-secondary rounded-2xl mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                            <Dumbbell className="text-black" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">FMS</h1>
                        <p className="text-gray-400 text-sm tracking-widest uppercase">AI Fitness System</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                            <AlertTriangle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="flex gap-4 p-1 bg-white/5 rounded-xl mb-6">
                                <button type="button" onClick={() => setFormData({ ...formData, role: 'member' })}
                                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${formData.role === 'member' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                                    REGULAR MEMBER
                                </button>
                                <button type="button" onClick={() => setFormData({ ...formData, role: 'trainer' })}
                                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${formData.role === 'trainer' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                                    COACH / TRAINER
                                </button>
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Full Name</label>
                                <input type="text" required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Email Address</label>
                            <input type="email" required
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Password</label>
                            <input type="password" required
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {/* Common Profile Registration Fields */}
                        {!isLogin && (
                            <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1">Profile Photo URL</label>
                                        <input type="text" placeholder="https://..."
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-primary outline-none"
                                            value={formData.profilePic} onChange={e => setFormData({ ...formData, profilePic: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1">Mobile Number</label>
                                        <input type="tel" required
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-primary outline-none"
                                            value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1">ID Type</label>
                                        <select className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-primary outline-none"
                                            value={formData.nationalId.idType} onChange={e => setFormData({ ...formData, nationalId: { ...formData.nationalId, idType: e.target.value } })}>
                                            <option value="aadhar">Aadhar</option>
                                            <option value="voter">Voter ID</option>
                                            <option value="license">License</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1">ID Number</label>
                                        <input type="text" required
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-primary outline-none"
                                            value={formData.nationalId.idNumber} onChange={e => setFormData({ ...formData, nationalId: { ...formData.nationalId, idNumber: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Coach Specific Fields */}
                        {!isLogin && formData.role === 'trainer' && (
                            <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1">Experience (Years)</label>
                                        <input type="number" required
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-primary outline-none"
                                            value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1">Expertise</label>
                                        <select multiple className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-xs text-white focus:border-primary outline-none h-20"
                                            value={formData.specializations} onChange={e => {
                                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                                setFormData({ ...formData, specializations: values });
                                            }}>
                                            <option value="Bodybuilding">Bodybuilding</option>
                                            <option value="Powerlifting">Powerlifting</option>
                                            <option value="Cardio">Cardio</option>
                                            <option value="Weight Loss">Weight Loss</option>
                                            <option value="Yoga">Yoga</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-black font-bold rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : (formData.role === 'trainer' ? 'Join as Coach' : 'Create Account'))}
                            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-gray-500 hover:text-white transition-colors">
                            {isLogin ? "New user? Create an account" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Stories / Landing Elements for New Users */}
            <div className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white italic tracking-tighter">TRANSFORM YOUR <span className="text-primary">LIFE.</span></h2>
                    <p className="text-gray-500 max-w-lg mx-auto text-sm">Join thousands who have already achieved their dream physique with FMS AI-driven programming.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            name: "Sarah Jenkins",
                            role: "Lost 22kg",
                            story: "The AI meal plans were a game changer. I never felt restricted but the results were undeniable.",
                            image: "https://images.unsplash.com/photo-1548690312-e3b507d17a4d?w=400&q=80",
                            tag: "Weight Loss"
                        },
                        {
                            name: "Marcus Thorne",
                            role: "Muscle Gain +15kg",
                            story: "FMS coaches pushed me beyond my limits. The tracking clarity kept me motivated every day.",
                            image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
                            tag: "Muscle Build"
                        },
                        {
                            name: "Elena Rodriguez",
                            role: "Marathon Finisher",
                            story: "From struggling to run 5k to finishing my first marathon. FMS provided the structure I lacked.",
                            image: "https://images.unsplash.com/photo-1486739985386-d4fae04ca6f7?w=400&q=80",
                            tag: "Athletic"
                        }
                    ].map((t, i) => (
                        <div key={i} className="glass-card group overflow-hidden flex flex-col hover:border-primary/30 transition-all border border-white/5">
                            <div className="h-48 relative overflow-hidden">
                                <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-primary text-black text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg">
                                        {t.tag}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 space-y-3 bg-black/40">
                                <div>
                                    <h4 className="text-white font-bold">{t.name}</h4>
                                    <p className="text-xs text-primary font-medium">{t.role}</p>
                                </div>
                                <p className="text-gray-400 text-sm italic leading-relaxed">"{t.story}"</p>
                                <div className="pt-2 flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-primary" fill="currentColor" />)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
                        <Trophy size={14} className="text-primary" /> TRUSTED BY 5,000+ ATHLETES WORLDWIDE
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
