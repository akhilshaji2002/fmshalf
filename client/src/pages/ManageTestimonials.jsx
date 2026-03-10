import React, { useState, useEffect } from 'react';
import { Trophy, Check, X, Edit2, Trash2, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageTestimonials = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ content: '', achievement: '', status: '', beforeImage: '', afterImage: '', coachRating: 5, gymRating: 5, coachReview: '', gymReview: '' });

    const fetchAll = async () => {
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;
        try {
            const res = await fetch('http://localhost:5000/api/testimonials', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setTestimonials(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this success story?')) return;
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;
        try {
            const res = await fetch(`http://localhost:5000/api/testimonials/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Testimonial removed');
                setTestimonials(prev => prev.filter(t => t._id !== id));
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;
        try {
            const res = await fetch(`http://localhost:5000/api/testimonials/${editingItem._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                toast.success('Successfully updated');
                setEditingItem(null);
                fetchAll();
            }
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const filtered = testimonials.filter(t =>
        t.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.coach?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.achievement?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
                        <Trophy className="text-primary" size={36} /> MASTER <span className="text-primary">TESTIMONIALS</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Audit, edit, and moderate community success stories.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search student, coach, or tag..."
                        className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-white text-sm focus:border-primary outline-none w-full md:w-80 transition-all font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filtered.map(t => (
                    <div key={t._id} className="glass-card p-6 flex flex-col lg:flex-row gap-8 items-start hover:border-white/20 transition-all group">
                        {/* Image Preview */}
                        <div className="w-full lg:w-56 h-48 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 relative grid grid-cols-2">
                            <img src={t.beforeImage || t.transformationImage} alt="Before" className="w-full h-full object-cover" />
                            <img src={t.afterImage || t.transformationImage} alt="After" className="w-full h-full object-cover" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 px-2 py-1 rounded">
                                <span className={`w-2 h-2 rounded-full ${t.status === 'approved' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : t.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">{t.status}</span>
                            </div>
                        </div>

                        {/* Content Info */}
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Student</span>
                                    <span className="text-white font-bold">{t.member?.name || 'Deleted User'}</span>
                                    <span className="text-[10px] text-gray-400">{t.member?.email}</span>
                                </div>
                                <div className="flex flex-col border-l border-white/10 pl-6">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Coach / Mentor</span>
                                    <span className="text-primary font-bold">{t.coach?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex flex-col border-l border-white/10 pl-6">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gym</span>
                                    <span className="text-primary font-bold">{t.gym?.name || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col border-l border-white/10 pl-6">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Achievement</span>
                                    <span className="bg-white/10 px-3 py-1 rounded text-xs font-black text-white italic">"{t.achievement}"</span>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm italic leading-relaxed border-l-2 border-primary/20 pl-4">
                                "{t.content}"
                            </p>
                            <p className="text-xs text-yellow-400">Coach ★ {t.coachRating || 0} • Gym ★ {t.gymRating || 0}</p>
                            <p className="text-xs text-gray-400">Coach Review: {t.coachReview || '—'}</p>
                            <p className="text-xs text-gray-400">Gym Review: {t.gymReview || '—'}</p>

                            <div className="text-[10px] text-gray-600 flex items-center gap-2">
                                <Info size={12} /> ID: {t._id} • CREATED: {new Date(t.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Actions */}
                            <div className="w-full lg:w-auto flex lg:flex-col gap-2 mt-4 lg:mt-0">
                            <button
                                onClick={async () => {
                                    const userStr = localStorage.getItem('userInfo');
                                    const token = userStr ? JSON.parse(userStr)?.token : null;
                                    const nextStatus = t.status === 'hidden' ? 'approved' : 'hidden';
                                    const res = await fetch(`http://localhost:5000/api/testimonials/${t._id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ status: nextStatus })
                                    });
                                    if (res.ok) {
                                        toast.success(nextStatus === 'hidden' ? 'Story hidden from public feed' : 'Story visible in public feed');
                                        fetchAll();
                                    } else {
                                        toast.error('Failed to update visibility');
                                    }
                                }}
                                className="flex-1 lg:w-32 py-3 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Info size={14} /> {t.status === 'hidden' ? 'UNHIDE' : 'HIDE'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditingItem(t);
                                    setEditForm({
                                        content: t.content,
                                        achievement: t.achievement,
                                        status: t.status,
                                        beforeImage: t.beforeImage || '',
                                        afterImage: t.afterImage || '',
                                        coachRating: t.coachRating || 5,
                                        gymRating: t.gymRating || 5,
                                        coachReview: t.coachReview || '',
                                        gymReview: t.gymReview || ''
                                    });
                                }}
                                className="flex-1 lg:w-32 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Edit2 size={14} /> EDIT
                            </button>
                            <button
                                onClick={() => handleDelete(t._id)}
                                className="flex-1 lg:w-32 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold"
                            >
                                <Trash2 size={14} /> DELETE
                            </button>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && !loading && (
                    <div className="h-64 glass-card flex flex-col items-center justify-center text-center opacity-40 italic">
                        <Trophy size={48} className="mb-4" />
                        <p>No testimonials found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 rounded-3xl w-full max-w-xl p-8 relative shadow-[0_0_50px_rgba(255,193,7,0.1)]">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter">EDIT <span className="text-primary">JOURNEY</span></h2>
                            <p className="text-gray-400 text-sm">Modifying student story for official quality assurance.</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div>
                                <label className="text-white text-xs font-black uppercase mb-2 block tracking-widest">Achievement Tag</label>
                                <input
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none"
                                    value={editForm.achievement}
                                    onChange={e => setEditForm({ ...editForm, achievement: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-white text-xs font-black uppercase mb-2 block tracking-widest">Testimonial Content</label>
                                <textarea
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none h-40 resize-none leading-relaxed"
                                    value={editForm.content}
                                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-white text-xs font-black uppercase mb-2 block tracking-widest">Before Image</label>
                                    <input className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                        value={editForm.beforeImage}
                                        onChange={e => setEditForm({ ...editForm, beforeImage: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-white text-xs font-black uppercase mb-2 block tracking-widest">After Image</label>
                                    <input className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                        value={editForm.afterImage}
                                        onChange={e => setEditForm({ ...editForm, afterImage: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-white text-xs font-black uppercase mb-2 block tracking-widest">Visibility Status</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['pending', 'approved', 'hidden', 'rejected'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, status: s })}
                                            className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${editForm.status === s ? (s === 'approved' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : s === 'pending' ? 'bg-amber-500/20 border-amber-500 text-amber-500' : s === 'hidden' ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-red-500/20 border-red-500 text-red-500') : 'bg-black/50 border-white/5 text-gray-500 hover:border-white/20'}`}
                                        >
                                            {s === 'approved' && <Check size={12} className="inline mr-1" />}
                                            {s === 'rejected' && <X size={12} className="inline mr-1" />}
                                            {s === 'hidden' && <Info size={12} className="inline mr-1" />}
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-4 bg-white/5 text-white rounded-2xl hover:bg-white/10 font-bold transition-all underline underline-offset-4">Discard Changes</button>
                                <button type="submit" className="flex-1 py-4 bg-primary text-black font-black rounded-2xl hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,193,7,0.3)] transition-all">SAVE MASTER EDIT</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTestimonials;
