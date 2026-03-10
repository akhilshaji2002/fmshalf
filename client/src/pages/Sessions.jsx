import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, MoreVertical, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSafeUser } from '../utils/auth';
import MemberProfileModal from '../components/MemberProfileModal';

const Sessions = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = getSafeUser();
    const isTrainer = user?.role === 'trainer';
    const isAdmin = user?.role === 'admin';
    const [selectedMember, setSelectedMember] = useState(null);

    const fetchBookings = useCallback(async () => {
        if (!user?.token) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('http://localhost:5000/api/bookings', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error('Failed to load sessions');
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'text-emerald-500 bg-emerald-500/10';
            case 'pending': return 'text-yellow-500 bg-yellow-500/10';
            case 'cancelled': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getTrainingTypeIcon = (type) => {
        switch (type) {
            case 'online': return <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md text-[10px] font-bold uppercase">Online</div>;
            case 'home': return <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-md text-[10px] font-bold uppercase">Home</div>;
            default: return <div className="p-1.5 bg-primary/20 text-primary rounded-md text-[10px] font-bold uppercase">Gym</div>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Training Sessions</h1>
                <p className="text-gray-400">View and manage upcoming appointments.</p>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Date & Time</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">{isTrainer ? "Member" : "Coach"}</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Type</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Status</th>
                                {isAdmin && <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading sessions...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No sessions found.</td></tr>
                            ) : bookings.map((b) => (
                                <tr key={b._id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg text-primary">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{new Date(b.date).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-white">
                                        {isTrainer ? (
                                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSelectedMember(b.member?._id)}>
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] group-hover:border-primary border border-transparent transition-all">
                                                    {b.member?.profilePic ? <img src={b.member.profilePic} className="w-full h-full rounded-full object-cover" /> : b.member?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="group-hover:text-primary transition-colors flex items-center gap-1">{b.member?.name || 'Deleted User'} <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                                    {(isAdmin || isTrainer) && <div className="text-[10px] text-gray-500">{b.member?.mobileNumber || '--'}</div>}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">
                                                    {b.coach?.profilePic ? <img src={b.coach.profilePic} className="w-full h-full rounded-full object-cover" /> : b.coachName?.charAt(0) || '?'}
                                                </div>
                                                <span>{b.coachName || 'Unnamed Coach'}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {getTrainingTypeIcon(b.trainingType)}
                                    </td>
                                    <td className="p-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${getStatusColor(b.status)}`}>
                                            {b.status === 'confirmed' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            {b.status}
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td className="p-4">
                                            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedMember && (
                <MemberProfileModal memberId={selectedMember} onClose={() => setSelectedMember(null)} />
            )}
        </div>
    );
};

export default Sessions;
