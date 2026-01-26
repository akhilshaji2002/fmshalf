import React, { useState, useEffect } from 'react';
import { QrCode, ShoppingBag, Activity, Calendar, Trophy, Zap, ChevronRight, Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MemberDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [coaches, setCoaches] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [trainingType, setTrainingType] = useState('gym');
    const [showTestimonialModal, setShowTestimonialModal] = useState(false);
    const [testimonialData, setTestimonialData] = useState({
        coachId: '',
        content: '',
        achievement: '',
        transformationImage: ''
    });

    const heroImage = user?.metrics?.gender === 'female' ? '/assets/hero_female.png' : '/assets/hero_male.png';

    // Fetch Data
    useEffect(() => {
        const userStr = localStorage.getItem('userInfo');
        const userData = userStr ? JSON.parse(userStr) : null;
        if (!userData?.token) return;
        const headers = { Authorization: `Bearer ${userData.token}` };

        // Get Coaches
        fetch('http://localhost:5000/api/trainers', { headers })
            .then(res => res.json())
            .then(data => setCoaches(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));

        // Get My Bookings
        fetch('http://localhost:5000/api/bookings', { headers })
            .then(res => res.json())
            .then(data => setBookings(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, []);

    const handleBook = async () => {
        if (!selectedCoach) {
            toast.error('Please select a coach');
            return;
        }
        if (!bookingDate) {
            toast.error('Please select a date and time');
            return;
        }

        const userStr = localStorage.getItem('userInfo');
        const userInfo = userStr ? JSON.parse(userStr) : null;
        const token = userInfo?.token;

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
                // Refresh bookings
                const refreshRes = await fetch('http://localhost:5000/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const d = await refreshRes.json();
                setBookings(Array.isArray(d) ? d : []);
            } else {
                const errData = await res.json();
                toast.error(errData.message || 'Booking failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Connection error');
        }
    };

    const handleTestimonialSubmit = async (e) => {
        e.preventDefault();
        const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

        if (!testimonialData.coachId || !testimonialData.content || !testimonialData.achievement || !testimonialData.transformationImage) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/testimonials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(testimonialData)
            });

            if (res.ok) {
                toast.success('Wait for coach approval!');
                setShowTestimonialModal(false);
                setTestimonialData({ coachId: '', content: '', achievement: '', transformationImage: '' });
            } else {
                const data = await res.json();
                toast.error(data.message || 'Submission failed');
            }
        } catch (err) {
            toast.error('Connection error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section (Unchanged) */}
            <div className="relative h-[400px] rounded-3xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                <img src={heroImage} alt="Hero" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600'; }} />

                <div className="absolute bottom-0 left-0 p-8 z-20 max-w-2xl">
                    <span className="inline-block py-1 px-3 rounded-full bg-primary text-black font-bold text-xs uppercase tracking-widest mb-4">Elite Member</span>
                    <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4 leading-tight">FORGE YOUR <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">LEGACY.</span></h1>
                    <div className="flex gap-4">
                        <button onClick={() => navigate('/training')} className="bg-primary text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2">
                            <Zap fill="currentColor" size={18} /> GO TO TRAINING
                        </button>
                        <button onClick={() => setShowTestimonialModal(true)} className="bg-white/10 text-white border border-white/20 px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all">
                            SHARE YOUR PROGRESS
                        </button>
                    </div>
                </div>
            </div>

            {/* Testimonial Submission Modal */}
            {showTestimonialModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
                    <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
                        <div className="mb-6">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter">SHARE YOUR <span className="text-primary">TRANSFORMATION</span></h2>
                            <p className="text-gray-400 text-sm">Inspire others with your journey. Your coach will review and feature it!</p>
                        </div>

                        <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block uppercase font-bold tracking-widest">Select Your Coach</label>
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    value={testimonialData.coachId}
                                    onChange={e => setTestimonialData({ ...testimonialData, coachId: e.target.value })}
                                    required
                                >
                                    <option value="">Choose a Trainer</option>
                                    {coaches.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs mb-1 block uppercase font-bold tracking-widest">Tag Your Achievement</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lost 15kg in 3 months"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    value={testimonialData.achievement}
                                    onChange={e => setTestimonialData({ ...testimonialData, achievement: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs mb-1 block uppercase font-bold tracking-widest">Your Story</label>
                                <textarea
                                    placeholder="How was your experience with the coach? What kept you motivated?"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none h-32 resize-none"
                                    value={testimonialData.content}
                                    onChange={e => setTestimonialData({ ...testimonialData, content: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs mb-1 block uppercase font-bold tracking-widest">Transformation Photo URL</label>
                                <input
                                    type="text"
                                    placeholder="Paste your transformation photo link"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    value={testimonialData.transformationImage}
                                    onChange={e => setTestimonialData({ ...testimonialData, transformationImage: e.target.value })}
                                    required
                                />
                                <p className="text-[10px] text-gray-500 mt-1 italic">Use Unsplash or a direct image link for best results.</p>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setShowTestimonialModal(false)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl hover:bg-white/10 font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-primary text-black font-black rounded-2xl hover:scale-[1.02] transition-transform">SUBMIT JOURNEY</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Stories / Testimonials - High Visibility Placement */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Trophy className="text-primary" size={24} /> Community Success Stories
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Real transformations from our dedicated members.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            story: "FMS coaches pushed me beyond my limits. The tracking clarity kept me motivated every single day.",
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
                            <div className="h-32 relative overflow-hidden">
                                <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                                <div className="absolute top-2 left-2">
                                    <span className="bg-primary text-black text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-lg">
                                        {t.tag}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 space-y-2 bg-black/40">
                                <div>
                                    <h4 className="text-white font-bold text-sm">{t.name}</h4>
                                    <p className="text-[10px] text-primary font-medium">{t.role}</p>
                                </div>
                                <p className="text-gray-400 text-xs italic leading-relaxed">"{t.story}"</p>
                                <div className="pt-1 flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="text-primary" fill="currentColor" />)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* QR Pass */}
                    <div className="glass-card p-6 bg-gradient-to-br from-white/10 to-transparent border-primary/20 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div><h3 className="text-white font-bold text-lg">Digital Pass</h3><p className="text-primary text-xs uppercase">Access Granted</p></div>
                            <QrCode className="text-white" size={32} />
                        </div>
                        <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?._id || 'guest'}`} alt="QR" className="opacity-90 mix-blend-multiply" />
                        </div>
                    </div>

                    {/* Bookings List */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500"><Calendar size={20} /></div>
                            <h3 className="text-white font-bold">Upcoming Sessions</h3>
                        </div>
                        <div className="space-y-3">
                            {bookings.length > 0 ? bookings.map(b => (
                                <div key={b._id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-white flex items-center gap-2">
                                            {b.coachName}
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-tighter ${b.trainingType === 'online' ? 'bg-blue-500/20 text-blue-400' : b.trainingType === 'home' ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'}`}>
                                                {b.trainingType}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400">{new Date(b.date).toLocaleString()}</div>
                                    </div>
                                    <Check size={16} className="text-emerald-500" />
                                </div>
                            )) : (
                                <div className="text-gray-500 text-sm text-center">No sessions booked.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Shop Link */}
                    <div className="flex justify-between items-center p-6 glass-card bg-gradient-to-r from-primary/10 to-transparent cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate('/shop')}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-black rounded-xl"><ShoppingBag size={24} /></div>
                            <div><h3 className="text-xl font-bold text-white">Visit Gear Shop</h3><p className="text-gray-400 text-sm">Supplements & Apparel</p></div>
                        </div>
                        <ChevronRight className="text-white" />
                    </div>

                    {/* Coaches Grid */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Trophy className="text-primary" /> Elite Coaches</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {coaches.length > 0 ? coaches.map((coach, i) => (
                                <div key={coach._id} className="glass-card p-4 flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/50 bg-gray-800 flex items-center justify-center">
                                        {coach.profilePic ? (
                                            <img src={coach.profilePic} alt={coach.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{coach?.name?.[0] || '?'}</div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{coach.name}</h4>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest">Personal Trainer</p>
                                        <button onClick={() => { setSelectedCoach(coach); setShowBookingModal(true); }}
                                            className="mt-2 text-xs bg-white/10 hover:bg-primary hover:text-black py-1 px-3 rounded text-white transition-colors">
                                            Book Session
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-500">Loading coaches...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
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
                                        <button key={type} onClick={() => setTrainingType(type)}
                                            className={`py-2 text-xs rounded-lg border transition-all capitalize ${trainingType === type ? 'bg-primary border-primary text-black font-bold' : 'bg-black/50 border-white/10 text-gray-400'}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setShowBookingModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">Cancel</button>
                                <button onClick={handleBook} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/80">Confirm</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default MemberDashboard;
