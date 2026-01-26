import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Lock, User } from 'lucide-react';

const Settings = () => {
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const userStr = localStorage.getItem('userInfo');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleUpdate = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords don't match");
            return;
        }
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Updating...',
                success: 'Password Updated!',
                error: 'Error updating'
            }
        );
        // In real app, call API here
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-gray-400">Manage your credentials and preferences.</p>
            </div>

            <div className="glass-card p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-full border-2 border-primary/50 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden bg-gray-800">
                        {user?.profilePic ? (
                            <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            user?.name?.[0]
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                        <p className="text-gray-400 capitalize">{user?.role}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Lock size={20} className="text-primary" /> Security
                    </h3>

                    <div>
                        <label className="text-gray-400 text-sm mb-2 block">Current Password</label>
                        <input type="password" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                            value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">New Password</label>
                            <input type="password" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-2 block">Confirm Password</label>
                            <input type="password" required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none"
                                value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/80 transition-colors">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
