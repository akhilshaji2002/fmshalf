import React, { useEffect, useState } from 'react';
import { X, User, Phone, Mail, Activity, Calendar, Weight, Ruler, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

const MemberProfileModal = ({ memberId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            try {
                const res = await fetch(`http://localhost:5000/api/members/${memberId}/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await res.json();
                if (res.ok) {
                    setData(result);
                } else {
                    toast.error(result.message || 'Failed to load profile');
                }
            } catch (err) {
                toast.error('Connection error');
            } finally {
                setLoading(false);
            }
        };

        if (memberId) fetchProfile();
    }, [memberId]);

    if (loading) return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center">
            <div className="text-primary animate-pulse flex flex-col items-center gap-4">
                <Zap size={48} fill="currentColor" />
                <span className="font-bold tracking-widest text-xs uppercase">Loading Dossier...</span>
            </div>
        </div>
    );

    if (!data) return null;

    const { profile, history = [] } = data;
    const historyArray = Array.isArray(history) ? history : [];
    const chartData = [...historyArray].reverse().map(h => ({
        date: h?.recordedAt ? new Date(h.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Unknown',
        weight: h?.weight || 0,
        bmr: h?.bmr || 0,
        tdee: h?.tdee || 0
    }));

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-surface border border-white/10 rounded-[2rem] w-full max-w-6xl h-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 bg-gray-900 flex-shrink-0 relative group">
                            {profile.profilePic ? (
                                <img src={profile.profilePic} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">{profile.name[0]}</div>
                            )}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{profile.name}</h2>
                                <span className="px-3 py-1 bg-primary text-black text-[10px] font-black rounded-full uppercase tracking-widest">Active Member</span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <span className="flex items-center gap-2 text-gray-400 text-xs font-medium"><Mail size={14} className="text-primary" /> {profile.email}</span>
                                <span className="flex items-center gap-2 text-white text-xs font-bold"><Phone size={14} className="text-primary" /> {profile.mobileNumber || 'No Contact Info'}</span>
                                <span className="flex items-center gap-2 text-gray-400 text-xs font-medium"><Calendar size={14} className="text-primary" /> Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl transition-all group">
                        <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Current Weight', value: `${profile.metrics?.weight || '--'} kg`, icon: Weight, color: 'text-blue-500' },
                            { label: 'Height', value: `${profile.metrics?.height || '--'} cm`, icon: Ruler, color: 'text-emerald-500' },
                            { label: 'Current Age', value: `${profile.metrics?.age || '--'} Yrs`, icon: User, color: 'text-orange-500' },
                            { label: 'Daily Target', value: `${profile.metrics?.tdee || '--'} kcal`, icon: Activity, color: 'text-primary' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-4 rounded-2xl flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-white/5 ${stat.color} border border-white/5`}>
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-black text-white italic tracking-tighter">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Charts Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="glass-card p-6 rounded-3xl border border-white/5 h-[400px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-white italic flex items-center gap-2 underline decoration-primary underline-offset-8">
                                        <TrendingUp size={18} className="text-primary" /> PROGRESS ANALYTICS
                                    </h3>
                                    <div className="flex gap-4 text-[10px] uppercase font-black tracking-widest">
                                        <span className="flex items-center gap-2 text-primary"><span className="w-2 h-2 rounded-full bg-primary" /> Weight Trajectory</span>
                                    </div>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="date" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="weight" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-card p-6 rounded-3xl border border-white/5">
                                    <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Metabolic Overview</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-white">Basal Metabolic Rate (BMR)</span>
                                            <span className="text-sm font-black text-primary italic">{profile.metrics?.bmr} kcal</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '65%' }} />
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-xs text-white">Daily Target (TDEE)</span>
                                            <span className="text-sm font-black text-emerald-500 italic">{profile.metrics?.tdee} kcal</span>
                                        </div>
                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                                    <div className="text-center">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Latest Scan Tag</p>
                                        <div className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                            {profile.metrics?.activityLevel?.replace('_', ' ')}
                                        </div>
                                        <div className="mt-4 flex justify-center gap-2">
                                            {['Agile', 'Vibrant', 'Driven'].map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-white/5 text-[8px] text-gray-400 rounded-md font-bold uppercase tracking-widest border border-white/5">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History Records */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-primary" /> HISTORY LOGS
                            </h3>
                            <div className="space-y-3">
                                {history.length > 0 ? history.map((h, i) => (
                                    <div key={i} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/5 transition-colors group">
                                        <div>
                                            <div className="text-xs font-black text-white italic group-hover:text-primary transition-colors">{new Date(h.recordedAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                            <div className="text-[10px] text-gray-500 font-medium">{h.activityLevel.replace('_', ' ')} phase</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-white">{h.weight}kg</div>
                                            <div className="text-[8px] text-primary uppercase font-bold">{h.tdee} kcal</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-gray-500 text-xs italic">No history records found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                    <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                        GENERATE REPORT <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemberProfileModal;
