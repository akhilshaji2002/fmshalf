import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Users, UserCheck, DollarSign, Settings, Activity, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const GymOwnerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [contractDrafts, setContractDrafts] = useState({});
    const [gymReviewSummary, setGymReviewSummary] = useState({ average: 0, count: 0, reviews: [] });
    
    // Registration form state
    const [formData, setFormData] = useState({
        name: '',
        location: { address: '', lat: 0, lng: 0 },
        admissionFee: 0,
        monthlyFee: 0,
        facilities: '',
        contactNumber: ''
    });

    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/gyms/stats', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                setStats(data);
                setIsRegistering(false);
                if (data?.gymDetails?._id) {
                    const r = await fetch(`http://localhost:5000/api/testimonials/gym/${data.gymDetails._id}/summary`);
                    const rv = await r.json();
                    setGymReviewSummary(rv || { average: 0, count: 0, reviews: [] });
                }
            } else if (res.status === 404) {
                // Owner hasn't registered a gym yet
                setIsRegistering(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user.token]);

    const saveCoachContract = async (coachId) => {
        const draft = contractDrafts[coachId] || {};
        try {
            const res = await fetch(`http://localhost:5000/api/gyms/coach-contracts/${coachId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(draft)
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to save coach contract');
                return;
            }
            toast.success('Coach contract updated');
            fetchStats();
        } catch {
            toast.error('Network error while updating contract');
        }
    };

    const removeFromGym = async (userId) => {
        if (!window.confirm('Remove this user from your gym?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/gyms/owner/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to remove user');
                return;
            }
            toast.success('User removed from gym');
            fetchStats();
        } catch {
            toast.error('Network error while removing user');
        }
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleRegisterGym = async (e) => {
        e.preventDefault();
        try {
            // Split facilities string into array
            const payload = {
                ...formData,
                facilities: formData.facilities.split(',').map(f => f.trim())
            };

            const res = await fetch('http://localhost:5000/api/gyms/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Gym registered successfully! Please log in again.');
                // Clear auth to enforce re-login as requested
                localStorage.removeItem('userInfo');
                // Redirect to login with a state flag to show success message
                setTimeout(() => {
                    window.location.href = '/login?registered=gym';
                }, 1500);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Registration failed');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Activity className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (isRegistering) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="glass-card p-8 border-primary/30 relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                    <h2 className="text-3xl font-bold mb-2">Register Your <span className="text-primary italic">Gym</span></h2>
                    <p className="text-gray-400 mb-8">Set up your facility details to start accepting members and coaches.</p>
                    
                    <form onSubmit={handleRegisterGym} className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Gym Name</label>
                            <input type="text" required
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Address</label>
                            <input type="text" required
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                value={formData.location.address} onChange={e => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Admission Fee (INR)</label>
                                <input type="number" required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                    value={formData.admissionFee} onChange={e => setFormData({ ...formData, admissionFee: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Monthly Fee (INR)</label>
                                <input type="number" required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                    value={formData.monthlyFee} onChange={e => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-1">Facilities (comma separated)</label>
                            <input type="text" placeholder="e.g., Cardio, Sauna, Free Weights, Pool" required
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                value={formData.facilities} onChange={e => setFormData({ ...formData, facilities: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary to-primary/80 text-black font-bold rounded-xl mt-6">
                            Create Gym Profile
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Dashboard View
    if (!stats) {
        return (
            <div className="flex h-full items-center justify-center">
                <Activity className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-6 overflow-y-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white tracking-tighter">
                        {stats.gymDetails.name}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                        <Building2 size={14} /> Owner Dashboard
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6 text-center border-white/10 rounded-2xl">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <DollarSign size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">₹{Number(stats.financialStatus.totalEarnings || 0).toLocaleString('en-IN')}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Earnings</p>
                </div>
                
                <div className="glass p-6 text-center border-white/10 rounded-2xl">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                        <Users size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.members.length}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Active Members</p>
                </div>
                
                <div className="glass p-6 text-center border-white/10 rounded-2xl">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                        <UserCheck size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.coaches.length}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Registered Coaches</p>
                </div>
                <div className="glass p-6 text-center border-white/10 rounded-2xl">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stats.attendance?.activeNow || 0}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Checked In Now</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                <div className="glass-card p-5 border-white/10">
                    <h4 className="text-white font-bold mb-3">Revenue Report</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300"><span>Membership</span><span>₹{Number(stats.revenueReport?.membership || 0).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between text-gray-300"><span>Retail</span><span>₹{Number(stats.revenueReport?.retail || 0).toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between text-gray-300"><span>Coach Salaries</span><span>-₹{Number(stats.revenueReport?.salary || 0).toLocaleString('en-IN')}</span></div>
                        <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold text-white"><span>Net Revenue</span><span>₹{Number(stats.revenueReport?.net || 0).toLocaleString('en-IN')}</span></div>
                    </div>
                </div>
                <div className="glass-card p-5 border-white/10 lg:col-span-2">
                    <h4 className="text-white font-bold mb-3">Subscription Alerts (1 day left)</h4>
                    {stats.expiringSoon?.length ? (
                        <div className="space-y-2">
                            {stats.expiringSoon.map((m) => (
                                <div key={m.memberId} className="flex justify-between text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                                    <span className="text-amber-300">⚠️ {m.name}</span>
                                    <span className="text-gray-300">{m.daysLeft <= 0 ? 'Expired' : 'Expires tomorrow'}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No urgent renewals today.</p>
                    )}
                </div>
            </div>
            <div className="glass-card p-5 border-white/10">
                <h4 className="text-white font-bold mb-2">Gym Reviews & Feedback</h4>
                <p className="text-sm text-yellow-400 mb-3">Rating: ★ {Number(gymReviewSummary.average || 0).toFixed(1)} ({gymReviewSummary.count || 0} reviews)</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(gymReviewSummary.reviews || []).slice(0, 5).map((r, idx) => (
                        <div key={idx} className="text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <p className="text-gray-200">{r.review}</p>
                            <p className="text-xs text-gray-500 mt-1">— {r.member?.name || 'Member'} • ★ {r.rating}</p>
                        </div>
                    ))}
                    {!gymReviewSummary.reviews?.length && (
                        <p className="text-gray-500 text-sm">No gym reviews yet.</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
                {/* Members List */}
                <div className="glass-card p-6 border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Users className="text-primary" size={20} /> Gym Members
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {stats.members.length === 0 ? (
                            <p className="text-gray-500 text-sm italic text-center py-4">No members have joined yet.</p>
                        ) : (
                            stats.members.map(member => (
                                <div key={member._id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                                    <div className="w-10 h-10 bg-gray-800 rounded-full overflow-hidden flex-shrink-0 border border-primary/30">
                                        {member.profilePic ? (
                                            <img src={member.profilePic} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary font-bold">{member.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{member.name}</h4>
                                        <p className="text-[#9CA3AF] text-xs">{member.email}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-gray-500">
                                        Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={() => removeFromGym(member._id)}
                                        className="text-[11px] font-bold text-red-300 border border-red-500/40 px-2 py-1 rounded hover:bg-red-500/10"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Coaches List */}
                <div className="glass-card p-6 border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <UserCheck className="text-primary" size={20} /> Associated Coaches
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {stats.coaches.length === 0 ? (
                            <p className="text-gray-500 text-sm italic text-center py-4">No coaches are currently registered with this gym.</p>
                        ) : (
                            stats.coaches.map(coach => (
                                <div key={coach._id} className="p-3 bg-white/5 rounded-xl space-y-3">
                                    <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-800 rounded-full overflow-hidden flex-shrink-0 border border-primary/30">
                                        {coach.profilePic ? (
                                            <img src={coach.profilePic} alt={coach.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary font-bold">{coach.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{coach.name}</h4>
                                        <div className="flex gap-1 mt-1">
                                            {coach.specializations?.slice(0, 2).map((spec, i) => (
                                                <span key={i} className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromGym(coach._id)}
                                        className="text-[11px] font-bold text-red-300 border border-red-500/40 px-2 py-1 rounded hover:bg-red-500/10 ml-auto"
                                    >
                                        Remove
                                    </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <input
                                            type="number"
                                            placeholder="Salary/session"
                                            value={contractDrafts[coach._id]?.salaryPerSession ?? ''}
                                            onChange={(e) => setContractDrafts((prev) => ({
                                                ...prev,
                                                [coach._id]: { ...prev[coach._id], salaryPerSession: Number(e.target.value) || 0 }
                                            }))}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="From (07:00)"
                                            value={contractDrafts[coach._id]?.workingHours?.from ?? ''}
                                            onChange={(e) => setContractDrafts((prev) => ({
                                                ...prev,
                                                [coach._id]: {
                                                    ...prev[coach._id],
                                                    workingHours: { ...(prev[coach._id]?.workingHours || {}), from: e.target.value }
                                                }
                                            }))}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="To (19:00)"
                                            value={contractDrafts[coach._id]?.workingHours?.to ?? ''}
                                            onChange={(e) => setContractDrafts((prev) => ({
                                                ...prev,
                                                [coach._id]: {
                                                    ...prev[coach._id],
                                                    workingHours: { ...(prev[coach._id]?.workingHours || {}), to: e.target.value }
                                                }
                                            }))}
                                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white"
                                        />
                                    </div>
                                    <button
                                        onClick={() => saveCoachContract(coach._id)}
                                        className="w-full text-xs font-bold bg-primary/90 text-black rounded-lg py-2 hover:bg-primary"
                                    >
                                        Save Salary & Hours
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GymOwnerDashboard;
