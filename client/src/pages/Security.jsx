import React, { useEffect, useState } from 'react';
import { ShieldCheck, Scan, Clock, ArrowRight, ArrowLeft, User, ExternalLink } from 'lucide-react';
import MemberProfileModal from '../components/MemberProfileModal';

const Security = () => {
    const [logs, setLogs] = useState([]);
    const [scanInput, setScanInput] = useState('');
    const [lastAction, setLastAction] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const fetchLogs = async () => {
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/security/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!scanInput) return;
        const token = JSON.parse(localStorage.getItem('userInfo'))?.token;

        try {
            const res = await fetch('http://localhost:5000/api/security/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ memberId: scanInput })
            });
            const data = await res.json();

            setLastAction({
                msg: data.message,
                type: data.type === 'in' ? 'check-in' : 'check-out',
                user: data.log // basic details
            });

            setScanInput('');
            fetchLogs();

            // Clear alert after 3s
            setTimeout(() => setLastAction(null), 3000);

        } catch (err) {
            alert('Invalid Scan / Member ID Not Found');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Access Control Panel */}
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-card p-6 border-l-4 border-l-primary">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/5 rounded-full"><Scan size={24} className="text-primary" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Access Control</h2>
                            <p className="text-gray-400 text-xs">QR Scanner / ID Entry</p>
                        </div>
                    </div>

                    <form onSubmit={handleScan} className="relative">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Scan QR or Enter Member ID..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-12 text-white font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={scanInput}
                            onChange={e => setScanInput(e.target.value)}
                        />
                        <Scan className="absolute left-4 top-4 text-gray-500" size={20} />
                    </form>

                    <div className="mt-4 text-xs text-gray-500 text-center">
                        System Ready • Secure Connection
                    </div>
                </div>

                {/* Live Action Feedback */}
                {lastAction && (
                    <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4
            ${lastAction.type === 'check-in' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}>
                        <div className={`p-3 rounded-full ${lastAction.type === 'check-in' ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                            {lastAction.type === 'check-in' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{lastAction.type === 'check-in' ? 'Access Granted' : 'Goodbye'}</h3>
                            <p className="text-sm opacity-80">{lastAction.msg}</p>
                        </div>
                    </div>
                )}

                <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-transparent">
                    <h3 className="text-white font-semibold mb-2">Simulate Entry</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Copy a Member ID from the Members page and paste it above to test the Check-in/out flow.
                    </p>
                    <a href="/members" className="text-primary text-sm hover:underline">Go to Members List &rarr;</a>
                </div>
            </div>

            {/* Live Logs */}
            <div className="lg:col-span-2 glass-card p-0 overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock size={20} className="text-gray-400" /> Live Access Logs
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-mono text-primary">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        LIVE
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="p-4">Member</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Event</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {logs.map(log => (
                                <tr key={log._id} className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setSelectedUserId(log.user?._id)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center text-xs text-white border border-white/10">
                                                {log.user?.profilePic ? (
                                                    <img src={log.user.profilePic} alt={log.user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={14} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                                                    {log.user?.name || 'Unknown'} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="text-xs text-gray-500">{log.user?.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-400 font-mono text-sm">
                                        {new Date(log.checkIn).toLocaleTimeString()}
                                    </td>
                                    <td className="p-4">
                                        {log.checkOut ? (
                                            <span className="text-orange-400 text-sm flex items-center gap-1"><ArrowLeft size={14} /> Check Out</span>
                                        ) : (
                                            <span className="text-emerald-400 text-sm flex items-center gap-1"><ArrowRight size={14} /> Check In</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {log.status === 'active' ? 'ON SITE' : 'LEFT'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {logs.length === 0 && <div className="p-10 text-center text-gray-500">No activity recorded today.</div>}
                </div>
            </div>

            {selectedUserId && (
                <MemberProfileModal memberId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
        </div>
    );
};
export default Security;
