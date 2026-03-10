import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, Shield, Key, Trash2, Calendar, Mail, Phone, UserCheck, ShieldAlert, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSafeUser } from '../utils/auth';
import MemberProfileModal from '../components/MemberProfileModal';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPass, setNewPass] = useState('');
    const [expandedUser, setExpandedUser] = useState(null);
    const [dossierUserId, setDossierUserId] = useState(null);

    const adminInfo = getSafeUser();

    const fetchAllUsers = useCallback(async () => {
        if (!adminInfo?.token) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${adminInfo.token}` }
            });
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error('Failed to load user database');
        } finally {
            setLoading(false);
        }
    }, [adminInfo?.token]);

    useEffect(() => {
        fetchAllUsers();
    }, [fetchAllUsers]);

    const handleResetPassword = async () => {
        if (!newPass) return toast.error('Enter a new password');
        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${selectedUser._id}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminInfo.token}`
                },
                body: JSON.stringify({ newPassword: newPass })
            });
            if (res.ok) {
                toast.success('Password updated successfully');
                setSelectedUser(null);
                setNewPass('');
            } else {
                toast.error('Reset failed');
            }
        } catch (err) {
            toast.error('Error connecting to server');
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${user.name}? This action cannot be undone.`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/members/${user._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${adminInfo.token}` }
            });
            if (res.ok) {
                toast.success('User removed from system');
                fetchAllUsers();
            }
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Shield className="text-primary" /> Master User Management
                    </h1>
                    <p className="text-gray-400">Total System Oversight: View all registration details and manage credentials.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest text-center">Role</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Identity & Contact</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Verification</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest">Growth/Metrics</th>
                                <th className="p-4 font-bold text-gray-400 uppercase text-[10px] tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Accessing secure database...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users match your search.</td></tr>
                            ) : filteredUsers.map(user => (
                                <React.Fragment key={user._id}>
                                    <tr className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-center">
                                            <div className={`inline-block p-2 rounded-lg cursor-pointer ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : user.role === 'trainer' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'}`}
                                                onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}>
                                                {user.role === 'admin' ? <Shield size={16} /> : user.role === 'trainer' ? <UserCheck size={16} /> : <Users size={16} />}
                                                <span className="block text-[8px] font-bold uppercase mt-1">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 cursor-pointer" onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border border-primary/20 bg-gray-800 flex items-center justify-center font-bold text-white uppercase overflow-hidden">
                                                    {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : user.name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold">{user.name}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                                                        {user.mobileNumber && <span className="text-[10px] text-primary flex items-center gap-1 font-medium"><Phone size={10} /> {user.mobileNumber}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.nationalId?.idNumber ? (
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">{user.nationalId.idType}</div>
                                                    <div className="text-emerald-500 font-mono text-xs">{user.nationalId.idNumber}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 italic text-[10px]">Unverified</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {user.role === 'trainer' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-white font-bold">{user.experience}Y Experience</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.specializations?.slice(0, 2).map((s, i) => (
                                                            <span key={i} className="text-[8px] bg-white/5 px-1 py-0.5 rounded text-gray-400">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : user.role === 'member' ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-2 text-[10px]">
                                                        <span className="text-gray-400">Wt: <span className="text-white font-bold">{user.metrics?.weight || '--'}kg</span></span>
                                                        <span className="text-gray-400">Ht: <span className="text-white font-bold">{user.metrics?.height || '--'}cm</span></span>
                                                    </div>
                                                    <span className="text-[8px] text-primary uppercase font-bold tracking-tighter">{user.metrics?.activityLevel?.replace('_', ' ') || 'Sedentary'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-600 italic text-[10px]">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-black transition-all"
                                                    title="Reset Password"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                {user.role === 'member' && (
                                                    <button
                                                        onClick={() => setDossierUserId(user._id)}
                                                        className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                                                        title="View Dossier"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedUser === user._id && (
                                        <tr className="bg-primary/5 border-l-2 border-primary animate-in slide-in-from-top-2 duration-300">
                                            <td colSpan="5" className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <div>
                                                        <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">Registration Summary</h4>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-gray-500 text-xs">Joined Date</span>
                                                                <span className="text-white text-xs">{new Date(user.joinedAt).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-gray-500 text-xs">System ID</span>
                                                                <span className="text-gray-400 font-mono text-[10px]">{user._id}</span>
                                                            </div>
                                                            <div className="flex justify-between border-b border-white/5 pb-2">
                                                                <span className="text-gray-500 text-xs">Bio / Notes</span>
                                                                <span className="text-white text-xs text-right max-w-[150px] italic">"{user.bio || 'No bio provided'}"</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {user.role === 'trainer' && (
                                                        <div>
                                                            <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">Professional Stats</h4>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between border-b border-white/5 pb-2">
                                                                    <span className="text-gray-500 text-xs">Experience</span>
                                                                    <span className="text-white text-xs">{user.experience} Years</span>
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <span className="text-gray-500 text-xs">Specializations</span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {user.specializations?.map((s, i) => (
                                                                            <span key={i} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded capitalize">{s}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {user.role === 'member' && (
                                                        <div>
                                                            <h4 className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">Physical Metrics</h4>
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                                                        <div className="text-[9px] text-gray-500 uppercase">Weight</div>
                                                                        <div className="text-lg font-bold text-white">{user.metrics?.weight || '--'} <span className="text-[10px] font-normal text-gray-500">kg</span></div>
                                                                    </div>
                                                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                                                        <div className="text-[9px] text-gray-500 uppercase">Height</div>
                                                                        <div className="text-lg font-bold text-white">{user.metrics?.height || '--'} <span className="text-[10px] font-normal text-gray-500">cm</span></div>
                                                                    </div>
                                                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                                                        <div className="text-[9px] text-gray-500 uppercase">Age</div>
                                                                        <div className="text-lg font-bold text-white">{user.metrics?.age || '--'}</div>
                                                                    </div>
                                                                    <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                                                        <div className="text-[9px] text-gray-500 uppercase">Gndr</div>
                                                                        <div className="text-lg font-bold text-white capitalize">{user.metrics?.gender || '--'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                                                    <div className="text-[9px] text-primary uppercase font-bold">Health Summary</div>
                                                                    <div className="text-xs text-white mt-1">BMR: {user.metrics?.bmr?.toFixed(0) || '--'} kcal | TDEE: {user.metrics?.tdee?.toFixed(0) || '--'} kcal</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Password Reset Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass-card border border-primary/30 p-8 w-full max-w-sm relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-4 bg-primary rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.5)]">
                            <ShieldAlert size={32} className="text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white text-center mt-4">Security Override</h2>
                        <p className="text-gray-400 text-xs text-center mb-6 mt-2">Update credentials for <br /><span className="text-primary font-bold">{selectedUser.email}</span></p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase ml-1">New System Password</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none text-sm placeholder:text-gray-700"
                                    placeholder="Enter new plain text password..."
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                />
                                <p className="text-[9px] text-gray-600 mt-2 italic">* Password will be automatically hashed before storage.</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setSelectedUser(null)} className="flex-1 py-3 bg-white/5 text-white rounded-xl text-sm hover:bg-white/10 transition-colors">Abort</button>
                                <button onClick={handleResetPassword} className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">Confirm Force Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {dossierUserId && (
                <MemberProfileModal memberId={dossierUserId} onClose={() => setDossierUserId(null)} />
            )}
        </div>
    );
};

export default AdminUsers;
