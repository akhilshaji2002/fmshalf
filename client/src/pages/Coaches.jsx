import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { User, Plus, Trash2, Calendar, Star, Trophy } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Coaches = () => {
    const location = useLocation();
    const scope = new URLSearchParams(location.search).get('scope');
    const gymOnlyScope = scope === 'gym';
    const [coaches, setCoaches] = useState([]);
    const [coachSummaries, setCoachSummaries] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCoach, setNewCoach] = useState({
        name: '',
        email: '',
        profilePic: '',
        nationalId: { idType: 'aadhar', idNumber: '' },
        experience: '',
        specializations: [],
        bio: ''
    });
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [trainingType, setTrainingType] = useState('gym');
    const [showTestimonialModal, setShowTestimonialModal] = useState(false);
    const [activeTestimonials, setActiveTestimonials] = useState([]);
    const [bookingDate, setBookingDate] = useState('');
    const userStr = localStorage.getItem('userInfo');
    const user = userStr ? JSON.parse(userStr) : null;
    const isStaff = user?.role === 'admin';

    const fetchCoaches = useCallback(async () => {
        const token = user?.token;
        try {
            const res = await fetch('http://localhost:5000/api/trainers?trainingType=online', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setCoaches(gymOnlyScope ? list.filter((c) => c.canInGymBooking) : list);
            const summaries = await Promise.all(
                (gymOnlyScope ? list.filter((c) => c.canInGymBooking) : list).map(async (c) => {
                    try {
                        const sRes = await fetch(`http://localhost:5000/api/testimonials/coach/${c._id}/summary`);
                        const s = await sRes.json();
                        return [c._id, s];
                    } catch {
                        return [c._id, { average: 0, count: 0 }];
                    }
                })
            );
            setCoachSummaries(Object.fromEntries(summaries));
        } catch (err) {
            console.error(err);
        }
    }, [user?.token, gymOnlyScope]);

    useEffect(() => {
        fetchCoaches();
    }, [fetchCoaches]);

    const handleBook = async () => {
        if (!selectedCoach) {
            toast.error('Please select a coach');
            return;
        }
        if (!bookingDate) {
            toast.error('Please select a date and time');
            return;
        }
        const token = user?.token;
        if (trainingType !== 'online' && selectedCoach && !selectedCoach.canInGymBooking) {
            toast.error('This coach is from another gym. Join their gym or choose online.');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    coachId: selectedCoach._id,
                    coachName: selectedCoach.name,
                    date: bookingDate,
                    trainingType
                })
            });

            if (res.ok) {
                toast.success('Session Confirmed!');
                setShowBookingModal(false);
                setBookingDate('');
            } else {
                toast.error('Booking failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error booking session');
        }
    };

    const handleAddCoach = async (e) => {
        e.preventDefault();
        const token = user?.token;
        try {
            const res = await fetch('http://localhost:5000/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...newCoach, role: 'trainer' })
            });
            if (res.ok) {
                toast.success('Coach Added!');
                setShowAddModal(false);
                setNewCoach({
                    name: '',
                    email: '',
                    profilePic: '',
                    nationalId: { idType: 'aadhar', idNumber: '' },
                    experience: '',
                    specializations: [],
                    bio: ''
                });
                fetchCoaches();
            } else {
                toast.error('Failed to add coach');
            }
        } catch (err) {
            toast.error('Error adding coach');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this coach?')) return;
        const token = user?.token;
        try {
            await fetch(`http://localhost:5000/api/members/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Coach Removed');
            fetchCoaches();
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const fetchCoachTestimonials = async (coachId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/testimonials/coach/${coachId}`);
            const data = await res.json();
            setActiveTestimonials(data);
            setShowTestimonialModal(true);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load stories');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Our Elite Coaches</h1>
                    <p className="text-gray-400">
                        {gymOnlyScope
                            ? 'Gym-only mode from Your Gym: listing coaches registered under your active gym.'
                            : trainingType === 'online'
                                ? 'Online mode: coaches across gyms are available.'
                                : 'Gym/Home mode: only coaches from your selected gym are shown.'}
                    </p>
                </div>
                {isStaff && (
                    <button onClick={() => setShowAddModal(true)} className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/80">
                        <Plus size={18} /> Add Coach
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coaches.map(coach => (
                    <div key={coach._id} className="glass-card p-6 flex flex-col items-center text-center group hover:border-primary/50 transition-colors">
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-primary mb-4 flex items-center justify-center bg-gray-800">
                            {coach.profilePic ? (
                                <img src={coach.profilePic} alt={coach.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-white uppercase">{coach.name[0]}</span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white">{coach.name}</h3>
                        <p className="text-primary text-xs uppercase tracking-widest mb-2">Master Trainer</p>

                        <div className="flex flex-wrap justify-center gap-1 mb-3">
                            {coach.specializations?.map((spec, i) => (
                                <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 capitalize">
                                    {spec}
                                </span>
                            ))}
                        </div>

                        <div className="text-sm text-gray-400 mb-4 line-clamp-2 px-2">
                            {coach.bio || "No bio available."}
                        </div>
                        {!coach.canInGymBooking && (
                            <div className="mb-4 text-[11px] text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded-lg px-2 py-1">
                                Different gym: available for online coaching only.
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
                            <span>{coach.experience} Years Exp</span>
                            <div className="flex gap-0.5 text-yellow-500">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                            </div>
                        </div>
                        <div className="mb-4 text-[11px] text-yellow-400">
                            Coach Rating: ★ {Number(coachSummaries[coach._id]?.average || 0).toFixed(1)} ({coachSummaries[coach._id]?.count || 0} reviews)
                        </div>

                        {isStaff && coach.nationalId?.idNumber && (
                            <div className="mb-6 p-2 bg-black/30 rounded-lg w-full text-left">
                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter">ID Verification ({coach.nationalId.idType})</p>
                                <p className="text-xs font-mono text-emerald-400">{coach.nationalId.idNumber}</p>
                            </div>
                        )}

                        {isStaff ? (
                            <button onClick={() => handleDelete(coach._id)} className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={16} /> Remove Coach
                            </button>
                        ) : (
                            <div className="w-full flex gap-2">
                                <button onClick={() => fetchCoachTestimonials(coach._id)} className="flex-1 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold">
                                    Success Stories
                                </button>
                                <button onClick={() => { setSelectedCoach(coach); setShowBookingModal(true); }} className="flex-[2] py-2 bg-primary text-black rounded-lg hover:bg-primary/80 transition-all flex items-center justify-center gap-2 text-xs font-black">
                                    <Calendar size={14} /> Book Now
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Coach Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6 underline decoration-primary underline-offset-8">Recruit New Coach</h2>
                        <form onSubmit={handleAddCoach} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-gray-400 text-xs mb-1 block">Full Name</label>
                                    <input required className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        value={newCoach.name} onChange={e => setNewCoach({ ...newCoach, name: e.target.value })} /></div>
                                <div><label className="text-gray-400 text-xs mb-1 block">Email Address</label>
                                    <input required type="email" className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        value={newCoach.email} onChange={e => setNewCoach({ ...newCoach, email: e.target.value })} /></div>
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Profile Picture URL</label>
                                <input className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                    placeholder="https://images.unsplash.com/..."
                                    value={newCoach.profilePic} onChange={e => setNewCoach({ ...newCoach, profilePic: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">ID Type</label>
                                    <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        value={newCoach.nationalId.idType} onChange={e => setNewCoach({ ...newCoach, nationalId: { ...newCoach.nationalId, idType: e.target.value } })}>
                                        <option value="aadhar">Aadhar Card</option>
                                        <option value="voter">Voter ID</option>
                                        <option value="license">Driving License</option>
                                        <option value="other">Other ID</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">ID Number</label>
                                    <input required className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        value={newCoach.nationalId.idNumber} onChange={e => setNewCoach({ ...newCoach, nationalId: { ...newCoach.nationalId, idNumber: e.target.value } })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Experience (Years)</label>
                                    <input required type="number" className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none"
                                        value={newCoach.experience} onChange={e => setNewCoach({ ...newCoach, experience: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs mb-1 block">Specialization</label>
                                    <select multiple className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary outline-none h-24"
                                        value={newCoach.specializations} onChange={e => {
                                            const values = Array.from(e.target.selectedOptions, option => option.value);
                                            setNewCoach({ ...newCoach, specializations: values });
                                        }}>
                                        <option value="cardio">Cardio</option>
                                        <option value="weight gain">Weight Gain</option>
                                        <option value="weight loss">Weight Loss</option>
                                        <option value="bodybuilding">Bodybuilding</option>
                                        <option value="powerlifter">Powerlifter</option>
                                        <option value="sports">Sports Performance</option>
                                        <option value="crossfit">Crossfit</option>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">Hold Ctrl to select multiple</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Bio / Summary</label>
                                <textarea className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-primary outline-none h-20 resize-none"
                                    value={newCoach.bio} onChange={e => setNewCoach({ ...newCoach, bio: e.target.value })} />
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl text-sm font-medium">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm">Save Coach</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6">Book Session</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Coach</label>
                                <div className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white">{selectedCoach?.name}</div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Date & Time</label>
                                <input type="datetime-local" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary invert-calendar"
                                    value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Training Location</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['gym', 'home', 'online'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setTrainingType(type)}
                                            disabled={(gymOnlyScope && type === 'online') || (!selectedCoach?.canInGymBooking && type !== 'online')}
                                            className={`py-2 text-xs rounded-lg border transition-all capitalize ${trainingType === type ? 'bg-primary border-primary text-black font-bold' : 'bg-black/50 border-white/10 text-gray-400'} ${!selectedCoach?.canInGymBooking && type !== 'online' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                {gymOnlyScope && (
                                    <p className="text-[11px] text-emerald-300 mt-2">Gym-only mode active.</p>
                                )}
                                {!gymOnlyScope && !selectedCoach?.canInGymBooking && (
                                    <p className="text-[11px] text-amber-300 mt-2">Join this coach's gym to unlock gym/home sessions.</p>
                                )}
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">Cancel</button>
                                <button onClick={handleBook} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/80">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Testimonials Modal */}
            {showTestimonialModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div>
                                <h2 className="text-3xl font-black text-white italic tracking-tighter">STUDENT <span className="text-primary">TRANSFORMATIONS</span></h2>
                                <p className="text-gray-400 text-sm">Real results from real people. Verified by FMS.</p>
                            </div>
                            <button onClick={() => setShowTestimonialModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white">
                                <Trash2 size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {activeTestimonials.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {activeTestimonials.map(t => (
                                        <div key={t._id} className="glass-card overflow-hidden flex flex-col border-white/5 bg-white/5">
                                            <div className="h-64 relative overflow-hidden grid grid-cols-2">
                                                <img src={t.beforeImage || t.transformationImage} alt="Before" className="w-full h-full object-cover" />
                                                <img src={t.afterImage || t.transformationImage} alt="After" className="w-full h-full object-cover" />
                                                <div className="absolute top-4 left-4 bg-primary text-black text-[10px] font-black px-2 py-1 rounded">
                                                    {t.achievement}
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={t.member?.profilePic || '/assets/default_user.png'} className="w-10 h-10 rounded-full border border-primary/30" alt="" />
                                                    <div>
                                                        <div className="text-white font-bold">{t.member?.name}</div>
                                                        <div className="text-[10px] text-primary font-medium tracking-widest uppercase">Member Since {new Date(t.date).getFullYear()}</div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-400 text-sm italic leading-relaxed">"{t.content}"</p>
                                                <p className="text-[11px] text-yellow-400">Coach ★ {t.coachRating || 0} • Gym ★ {t.gymRating || 0}</p>
                                                {t.coachReview && <p className="text-[11px] text-gray-300">Coach Review: {t.coachReview}</p>}
                                                {t.gymReview && <p className="text-[11px] text-gray-300">Gym Review: {t.gymReview}</p>}
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="text-primary" fill="currentColor" />)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
                                    <Trophy size={64} className="mb-4" />
                                    <p className="text-xl font-bold text-white">No stories featured yet.</p>
                                    <p className="text-sm text-gray-400">Be the first to share your transformation!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Coaches;
