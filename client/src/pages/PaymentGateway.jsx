import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, CreditCard, Smartphone, CheckCircle2, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentGateway = () => {
    const navigate = useNavigate();
    const { state } = useLocation(); // { sessionId, amount, items }
    const [method, setMethod] = useState('upi'); // upi, card
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form States
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
    const [upiId, setUpiId] = useState('');

    const userStr = localStorage.getItem('userInfo');
    const userInfo = userStr ? JSON.parse(userStr) : null;
    const isDemoMembershipFlow = Boolean(state?.membership);

    useEffect(() => {
        if (!state?.sessionId) {
            navigate('/discovery');
        }
    }, [state, navigate]);

    if (!state?.sessionId) {
        return null;
    }

    const handlePayment = async () => {
        const upiValid = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/i.test((upiId || '').trim());
        const cardValid = /^\d{16}$/.test((cardData.number || '').replace(/\s+/g, '')) && /^\d{3}$/.test((cardData.cvv || '').trim());
        if (method === 'upi' && !upiValid) return toast.error('Enter valid UPI ID');
        if (method === 'card' && !cardValid) return toast.error('Enter valid Card details');

        setProcessing(true);

        // Simulate Gateway Latency
        setTimeout(async () => {
            try {
                // Demo-first membership flow: attempt verify, but still allow successful join if verify is flaky.
                if (isDemoMembershipFlow) {
                    await fetch('http://localhost:5000/api/finance/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${userInfo?.token}`
                        },
                        body: JSON.stringify({
                            sessionId: state.sessionId,
                            paymentMethod: method,
                            transactionId: `DEMO_TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
                        })
                    });

                    if (state?.gymId) {
                        await fetch(`http://localhost:5000/api/gyms/${state.gymId}/join`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${userInfo?.token}`
                            }
                        });
                    }

                    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
                        headers: { Authorization: `Bearer ${userInfo?.token}` }
                    });
                    if (profileRes.ok) {
                        const profile = await profileRes.json();
                        const updated = { ...userInfo, currentGym: profile.currentGym, subscription: profile.subscription, affiliations: profile.affiliations };
                        localStorage.setItem('userInfo', JSON.stringify(updated));
                    }
                    setSuccess(true);
                    setProcessing(false);
                    toast.success('Demo payment successful. Gym membership activated!');
                    return;
                }

                const res = await fetch('http://localhost:5000/api/finance/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userInfo?.token}`
                    },
                    body: JSON.stringify({
                        sessionId: state.sessionId,
                        paymentMethod: method,
                        transactionId: `FMS_TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
                    })
                });

                if (!res.ok) {
                    toast.error('Payment Failed at Gateway');
                    setProcessing(false);
                    return;
                }
                setSuccess(true);
                setProcessing(false);
                toast.success('Payment Successful!');
            } catch (err) {
                toast.error('Gateway Connection Error');
                setProcessing(false);
            }
        }, 3000);
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-background z-[200] flex items-center justify-center p-4">
                <div className="text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                        <CheckCircle2 size={120} className="text-primary relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Payment Confirmed</h1>
                        <p className="text-gray-400">Your order has been placed and inventory reserved.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 max-w-xs mx-auto">
                        <div className="flex justify-between text-xs text-gray-500 mb-2 font-mono">
                            <span>TRANS ID</span>
                            <span className="text-primary">FMS_CONF_8829</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                            <span>TOTAL PAID</span>
                            <span className="text-white">₹{Number(state.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <button onClick={() => navigate(state?.membership ? '/coaches' : '/shop')} className="px-12 py-4 bg-primary text-black font-bold rounded-2xl hover:scale-105 transition-transform">
                        {state?.membership ? 'View Trainers' : 'Back to Shop'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-4 overflow-y-auto">
            {/* Secure Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-8 px-2">
                <button onClick={() => navigate('/shop')} className="text-gray-500 hover:text-white flex items-center gap-1 text-sm">
                    <ArrowLeft size={16} /> Cancel
                </button>
                <div className="flex items-center gap-2 text-primary font-bold tracking-tighter">
                    <ShieldCheck size={20} /> SECURE GATEWAY
                </div>
            </div>

            <div className="w-full max-w-md glass-card border border-white/10 p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Summary Strip */}
                <div className="bg-primary p-6 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] text-black/60 font-bold uppercase">Order Amount</p>
                        <h2 className="text-3xl font-black text-black">₹{Number(state.amount || 0).toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-black/60 font-bold uppercase">FMS Merchant</p>
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=fms_gateway" className="w-10 h-10 rounded opacity-80 mix-blend-multiply" alt="QR" />
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Method Selector */}
                    <div className="flex gap-4">
                        <button onClick={() => setMethod('upi')}
                            className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${method === 'upi' ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 text-gray-500 hover:border-white/10'}`}>
                            <Smartphone />
                            <span className="text-xs font-bold uppercase tracking-widest">UPI Pay</span>
                        </button>
                        <button onClick={() => setMethod('card')}
                            className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${method === 'card' ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 text-gray-500 hover:border-white/10'}`}>
                            <CreditCard />
                            <span className="text-xs font-bold uppercase tracking-widest">Debit/Credit</span>
                        </button>
                    </div>

                    {/* Dynamic Form */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        {method === 'upi' ? (
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-2 font-bold tracking-widest">Unified Payment ID</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="user@upi or user@okaxis"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
                                    {['PhonePe', 'GPay', 'Paytm', 'BHIM'].map(app => (
                                        <div key={app} className="flex-shrink-0 px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 border border-white/5">{app}</div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-2 font-bold tracking-widest">Card Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-primary outline-none"
                                            value={cardData.number}
                                            onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                                            maxLength={16}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-2 font-bold tracking-widest">Expiry</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-primary outline-none"
                                            value={cardData.expiry}
                                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase ml-1 block mb-2 font-bold tracking-widest">CVV</label>
                                        <input
                                            type="password"
                                            placeholder="***"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-4 text-white focus:border-primary outline-none"
                                            value={cardData.cvv}
                                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                                            maxLength={3}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full py-5 bg-white text-black font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="animate-spin" /> AUTHORIZING...
                            </>
                        ) : (
                            <>
                                PAY ₹{Number(state.amount || 0).toLocaleString('en-IN')} NOW
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
                        <Lock size={10} /> PCI-DSS COMPLIANT • END-TO-END ENCRYPTED
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
