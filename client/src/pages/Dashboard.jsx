import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Activity, TrendingUp, Heart, Zap, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { getSafeUser } from '../utils/auth';
import MemberDashboard from './MemberDashboard';
import ProgressAI from '../components/ProgressAI';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <div className="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={100} />
        </div>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl bg-white/5 ${color} text-white`}>
                <Icon size={24} />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    <TrendingUp size={14} /> {trend}
                </span>
            )}
        </div>
        <div className="relative z-10">
            <h3 className="text-gray-400 text-sm font-medium">{label}</h3>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);

const LiveMonitor = ({ onClose, memberName }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const initial = Array(20).fill(0).map((_, i) => ({ time: i, bpm: 70 + Math.random() * 10 }));
        setData(initial);

        const interval = setInterval(() => {
            setData(prev => {
                const nextTime = prev[prev.length - 1].time + 1;
                const nextBpm = Math.floor(100 + Math.random() * 40 + Math.sin(nextTime / 5) * 20);
                return [...prev.slice(1), { time: nextTime, bpm: nextBpm }];
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-2xl p-6 border-primary/50">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-pulse">
                            <Heart fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Live Telemetry</h2>
                            <p className="text-primary">{memberName} • Treadmill Zone 2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 p-2 rounded-lg hover:bg-white/20">Close</button>
                </div>

                <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <YAxis domain={[60, 180]} stroke="#666" />
                            <Line type="monotone" dataKey="bpm" stroke="#EF4444" strokeWidth={3} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-gray-400 text-xs uppercase">Current BPM</div>
                        <div className="text-3xl font-bold text-red-500">{data[data.length - 1]?.bpm || '--'}</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-gray-400 text-xs uppercase">Zone</div>
                        <div className="text-3xl font-bold text-orange-500">Aerobic</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <div className="text-gray-400 text-xs uppercase">Calories/Hr</div>
                        <div className="text-3xl font-bold text-yellow-500">650</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [activeMembers, setActiveMembers] = useState([]);
    const [monitorMember, setMonitorMember] = useState(null);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({ role: 'visitor' });
    const [wallet, setWallet] = useState({ balance: 0, totalEarnings: 0 });
    const [history, setHistory] = useState([]);
    const [dossierUserId, setDossierUserId] = useState(null);

    useEffect(() => {
        const parsedUser = getSafeUser();
        const token = parsedUser?.token;

        if (parsedUser) {
            setUser(parsedUser);

            // Fetch Wallet for Trainers
            if (parsedUser.role === 'trainer') {
                fetch('http://localhost:5000/api/finance/earnings', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => setWallet(data && typeof data === 'object' ? data : { balance: 0, totalEarnings: 0 }))
                    .catch(err => console.error(err));

                // Fetch Recent Earnings
                fetch('http://localhost:5000/api/finance/history', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => setHistory(Array.isArray(data) ? data : []))
                    .catch(err => console.error(err));
            }
        }

        if (!token) {
            setError('Please log in');
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // Fetch stats
        fetch('http://localhost:5000/api/dashboard/stats', { headers })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch stats');
                return res.json();
            })
            .then(data => setStats(data))
            .catch(err => {
                console.error(err);
                if (err.message.includes('401')) setError('Unauthorized');
            });

        // Fetch active logs
        fetch('http://localhost:5000/api/security/logs', { headers })
            .then(res => {
                if (res.status === 401) return []; // Access denied for regular members
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const online = data.filter(log => log.status === 'active');
                    setActiveMembers(online);
                }
            })
            .catch(err => console.error(err));
    }, []);

    if (error) return <div className="text-red-500">{error}</div>;

    // Member View
    if (user.role === 'member') {
        return <MemberDashboard user={user} />;
    }

    if (!stats) return <div className="text-white">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400 mt-2">Welcome back, here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {user.role === 'trainer' ? (
                    <>
                        <StatCard icon={DollarSign} label="Wallet Balance" value={`₹${wallet.balance}`} trend="Available" color="bg-emerald-500" />
                        <StatCard icon={TrendingUp} label="Career Earnings" value={`₹${wallet.totalEarnings}`} trend="Lifetime" color="bg-primary" />
                        <StatCard icon={Users} label="My Clients" value={stats?.totalMembers || 0} color="bg-blue-500" />
                        <StatCard icon={Activity} label="Active Clients" value={activeMembers?.length || 0} color="bg-purple-500" />
                    </>
                ) : (
                    <>
                        <StatCard icon={Users} label="Total Members" value={stats?.totalMembers || 0} trend="+12%" color="bg-blue-500" />
                        <StatCard icon={Activity} label="Active Now" value={activeMembers?.length || stats?.activeNow || 0} trend="+5%" color="bg-emerald-500" />
                        <StatCard icon={DollarSign} label="Revenue" value={`₹${(stats?.revenue || 0).toLocaleString('en-IN')}`} trend="+8%" color="bg-primary" />
                        <StatCard icon={TrendingUp} label="Total Sessions" value={stats?.sessions || 0} trend="+15%" color="bg-purple-500" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Graph */}
                <div className="lg:col-span-2 glass-card p-6 flex flex-col h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Analytics</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.revenueChart || []}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#333' }} />
                            <Area type="monotone" dataKey="value" stroke="#D4AF37" fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Live Active Members List */}
                <div className="glass-card p-6 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Live Workout Floor</h3>
                        <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase animate-pulse">
                            <Zap size={12} fill="currentColor" /> Live
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                        {activeMembers.length === 0 ? (
                            <div className="text-gray-500 text-center mt-10">No members checked in.</div>
                        ) : (
                            activeMembers.map(log => (
                                <div key={log._id}
                                    className="p-3 bg-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setDossierUserId(log.user?._id)}>
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20 group-hover:border-primary transition-all">
                                            {log.user?.profilePic ? (
                                                <img src={log.user.profilePic} alt={log.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                log.user?.name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm flex items-center gap-1 group-hover:text-primary transition-colors">
                                                {log.user?.name || 'Unknown User'} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-xs text-gray-500">Checking in: {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMonitorMember(log.user?.name); }}
                                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-black transition-all"
                                        title="Live Telemetry"
                                    >
                                        <Activity size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {user.role === 'trainer' && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Recent Earnings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.length > 0 ? history.map(txn => (
                            <div key={txn._id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-white">₹{txn.amount}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Credited</span>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-10 text-gray-500">No recent transactions.</div>
                        )}
                    </div>
                </div>
            )}

            {monitorMember && <LiveMonitor memberName={monitorMember} onClose={() => setMonitorMember(null)} />}
            <ProgressAI />

            {dossierUserId && (
                <MemberProfileModal memberId={dossierUserId} onClose={() => setDossierUserId(null)} />
            )}
        </div>
    );
};

export default Dashboard;
