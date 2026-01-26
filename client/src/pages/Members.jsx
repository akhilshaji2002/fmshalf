import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Search, User, Mail, Calendar, Eye } from 'lucide-react';
import { getSafeUser } from '../utils/auth';
import MemberProfileModal from '../components/MemberProfileModal';

const Members = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '' });
    const [selectedMemberId, setSelectedMemberId] = useState(null);

    const getHeaders = () => {
        const user = getSafeUser();
        const token = user?.token;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/members', {
                headers: getHeaders()
            });
            const data = await res.json();
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:5000/api/members', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newMember)
            });
            setShowAddModal(false);
            setNewMember({ name: '', email: '' });
            fetchMembers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            try {
                await fetch(`http://localhost:5000/api/members/${id}`, {
                    method: 'DELETE',
                    headers: getHeaders()
                });
                fetchMembers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Member Management</h1>
                    <p className="text-gray-400">Total Members: {members.length}</p>
                </div>
                <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                    <Plus size={20} /> Add Member
                </button>
            </div>

            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                    <div key={member._id} className="glass-card p-6 flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-gray-800">
                                {member.profilePic ? (
                                    <img src={member.profilePic} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl font-bold text-white">{member.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSelectedMemberId(member._id)} className="p-2 hover:bg-primary/20 text-gray-500 hover:text-primary rounded-lg transition-colors" title="View Dossier">
                                    <Eye size={18} />
                                </button>
                                <button onClick={() => handleDelete(member._id)} className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors" title="Delete Member">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{member.name}</h3>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Mail size={14} /> {member.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User size={14} /> {member.role}
                                </div>
                                {member.mobileNumber && (
                                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                        <span className="text-[10px] text-gray-500 uppercase">Mobile:</span> {member.mobileNumber}
                                    </div>
                                )}
                                {member.nationalId?.idNumber && (
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono">
                                        <span className="text-gray-500 uppercase">ID:</span> {member.nationalId.idType} - {member.nationalId.idNumber}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} /> Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {loading && <div className="text-center text-gray-500 py-10">Loading members...</div>}

            {/* Simple Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
                        <h2 className="text-2xl font-bold text-white mb-6">Add New Member</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
                                <input required className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                    value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm mb-2 block">Email Address</label>
                                <input required type="email" className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                    value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/80">Save Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedMemberId && (
                <MemberProfileModal memberId={selectedMemberId} onClose={() => setSelectedMemberId(null)} />
            )}
        </div>
    );
};
export default Members;
