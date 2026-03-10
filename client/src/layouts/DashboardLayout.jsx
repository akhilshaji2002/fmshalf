import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ShoppingBag, ShieldCheck, Dumbbell, LogOut, Settings, UserCheck, Calendar, Trophy, Sparkles, ScanEye, Building2, MessageCircle, Flame } from 'lucide-react';
import toast from 'react-hot-toast';

const SidebarItem = ({ to, icon, label }) => {
    const IconComponent = icon;
    return (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
      ${isActive
                ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`
        }
    >
        <IconComponent size={20} className="transition-transform group-hover:scale-110" />
        <span className="font-medium tracking-wide">{label}</span>
    </NavLink>
    );
};

const DashboardLayout = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: '', role: '' });

    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (!stored) {
            navigate('/login');
        } else {
            setUser(JSON.parse(stored));
        }
    }, [navigate]);

    useEffect(() => {
        if (!user?.token || user.role !== 'member') return;
        const loadProfile = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                const expiresAt = data?.subscription?.expiresAt;
                const status = data?.subscription?.status;
                if (!expiresAt || status !== 'active') return;
                const msLeft = new Date(expiresAt).getTime() - Date.now();
                if (msLeft <= 24 * 60 * 60 * 1000) {
                    toast.error('⚠️ Subscription renewal due within 1 day.');
                }
            } catch {
                // silent
            }
        };
        loadProfile();
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const isStaff = user.role === 'admin' || user.role === 'trainer';
    const isAdmin = user.role === 'admin';

    return (
        <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
            {/* Sidebar */}
            <aside className="w-72 glass border-r border-white/5 flex flex-col p-6 m-4 mr-0 rounded-3xl relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-2 mb-10 z-10">
                    <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <Dumbbell className="text-black" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white tracking-tighter">
                            FMS
                        </h1>
                        <p className="text-[10px] text-secondary font-bold tracking-widest leading-none">AI SYSTEM</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 z-10 overflow-y-auto pr-2 custom-scrollbar">
                    {user.role === 'gymOwner' ? (
                        <>
                            <SidebarItem to="/gym-owner" icon={Building2} label="Gym Management" />
                            <SidebarItem to="/chat" icon={MessageCircle} label="Community Chat" />
                            <SidebarItem to="/settings" icon={Settings} label="Settings" />
                        </>
                    ) : (
                        <>
                            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                            <SidebarItem to="/chat" icon={MessageCircle} label="Community Chat" />
                            <SidebarItem to="/ai-progress" icon={Sparkles} label="AI Progress" />
                            <SidebarItem to="/food-vision" icon={ScanEye} label="Food Vision" />

                    {/* Staff Only Links (Admin + Trainer) */}
                    {isStaff && (
                        <>
                            <SidebarItem to="/members" icon={Users} label="Members" />
                            <SidebarItem to="/security" icon={ShieldCheck} label="Security" />
                        </>
                    )}

                    <SidebarItem to="/training" icon={Activity} label={isStaff ? "Trainer Studio" : "My Plan"} />
                    {(user.role === 'member' || user.role === 'trainer') && (
                        <SidebarItem to="/your-gym" icon={Building2} label="Your Gym" />
                    )}
                    <SidebarItem to="/kinetix" icon={Flame} label="Workouts" />
                    <SidebarItem to="/sessions" icon={Calendar} label={isStaff ? "Client Sessions" : "My Sessions"} />
                    <SidebarItem to="/coaches" icon={UserCheck} label="Coaches" />

                    {/* Shop for everyone (or specifically members) */}
                    <SidebarItem to="/shop" icon={ShoppingBag} label="Gear Shop" />

                    {/* Admin Only Links */}
                    {isAdmin && (
                        <>
                            <SidebarItem to="/inventory" icon={ShoppingBag} label="Inventory Mgmt" />
                            <SidebarItem to="/admin/users" icon={ShieldCheck} label="User Management" />
                            <SidebarItem to="/admin/testimonials" icon={Trophy} label="Success Stories" />
                        </>
                    )}

                    <div className="my-4 border-t border-white/10 mx-4"></div>
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                    </>
                    )}
                </nav>

                <div className="mt-auto relative z-10">
                    <div className="p-4 glass-card bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 border-2 border-primary/50 flex items-center justify-center font-bold text-white overflow-hidden">
                                {user.profilePic ? (
                                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name?.charAt(0) || '?'
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{user.name || 'Anonymous'}</p>
                                <p className="text-xs text-primary uppercase">{user.role}</p>
                            </div>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-medium">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="h-full glass rounded-3xl overflow-hidden relative flex flex-col">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="flex-1 p-8 relative z-10 overflow-auto peer-[.chat-page]:p-0">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
export default DashboardLayout;
