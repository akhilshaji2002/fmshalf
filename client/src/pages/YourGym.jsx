import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Calendar, CheckCircle2, CreditCard, Crown, Phone, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PLAN_LABELS = {
  daily: 'Daily',
  monthly: '1 Month',
  quarterly: '3 Months',
  six_month: '6 Months',
  yearly: 'Yearly'
};

const statusColor = (status) => {
  if (status === 'active') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (status === 'pending') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  if (status === 'expired') return 'text-red-300 border-red-500/30 bg-red-500/10';
  return 'text-gray-300 border-white/10 bg-white/5';
};

const YourGym = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const [data, setData] = useState({ gyms: [], currentGym: null });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const fetchMyGyms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/gyms/my-gyms', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || 'Failed to load gym details');
        return;
      }
      setData(body);
    } catch {
      toast.error('Network error while loading gyms');
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchMyGyms();
  }, [fetchMyGyms]);

  const activeGym = useMemo(
    () => data.gyms.find((g) => g.isActiveGym) || data.gyms[0],
    [data.gyms]
  );

  const switchGym = async (gymId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/gyms/${gymId}/switch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || 'Could not switch gym');
        return;
      }
      toast.success('Active gym switched');
      await fetchMyGyms();
    } catch {
      toast.error('Network error while switching gym');
    }
  };

  const payRenewal = async (gymId, planType, amount) => {
    setPaying(true);
    try {
      const res = await fetch('http://localhost:5000/api/finance/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({
          type: 'membership',
          gymId,
          planType,
          totalAmount: amount
        })
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || body.message || 'Failed to create renewal session');
        return;
      }
      navigate('/payment-gateway', {
        state: {
          sessionId: body.sessionId,
          amount: body.amount,
          membership: true,
          gymId
        }
      });
    } catch {
      toast.error('Network error while creating renewal');
    } finally {
      setPaying(false);
    }
  };

  const payNextMonthAdvance = (gymId, monthlyAmount) => {
    payRenewal(gymId, 'monthly', monthlyAmount);
  };

  if (loading) {
    return <div className="text-gray-400">Loading your gym profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Your Gym</h1>
        <p className="text-gray-400 mt-1">Membership status, renewal, and gym association details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 lg:col-span-2 space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Building2 size={18} /> Registered Gyms</h3>
          {data.gyms.length === 0 ? (
            <p className="text-gray-400 text-sm">No gym associations yet. Please join a gym from discovery.</p>
          ) : (
            data.gyms.map((item) => (
              <div key={item.gym._id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{item.gym.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.gym.location?.address || 'Address unavailable'}</p>
                    <p className="text-xs text-gray-500 mt-1">Role: {item.roleInGym}</p>
                  </div>
                  <button
                    onClick={() => switchGym(item.gym._id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${item.isActiveGym ? 'bg-emerald-500 text-black' : 'bg-primary text-black'}`}
                  >
                    {item.isActiveGym ? 'Current Gym' : 'Set Active'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`px-2 py-1 text-[11px] rounded border ${statusColor(item.membership.status)}`}>
                    {item.membership.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300">
                    Plan: {PLAN_LABELS[item.membership.packageType] || item.membership.packageType}
                  </span>
                  <span className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300">
                    Days left: {item.membership.daysLeft ?? '-'}
                  </span>
                  {item.membership.workoutTime && (
                    <span className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300">
                      Workout: {item.membership.workoutTime}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => payNextMonthAdvance(item.gym._id, item.renewalOptions?.monthly?.amountInr || 0)}
                    disabled={paying}
                    className="text-xs rounded-lg px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-500/30 disabled:opacity-50 flex items-center gap-1"
                    title="Pay next month in advance"
                  >
                    <CreditCard size={14} /> Pay Next Month
                  </button>
                  <span className="text-[11px] text-gray-400">Advance renewal shortcut</span>
                </div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(item.renewalOptions).map(([planType, cfg]) => (
                    <button
                      key={planType}
                      onClick={() => payRenewal(item.gym._id, planType, cfg.amountInr)}
                      disabled={paying}
                      className="text-xs rounded-lg px-2 py-2 bg-primary/20 border border-primary/30 text-primary font-bold hover:bg-primary/30 disabled:opacity-50"
                    >
                      {PLAN_LABELS[planType]}
                      {cfg.discountPercent > 0 && <span className="block text-[10px] text-emerald-300">-{cfg.discountPercent}% OFF</span>}
                      <br />₹{Number(cfg.amountInr || 0).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2"><Crown size={18} /> Active Gym Snapshot</h3>
          {activeGym ? (
            <>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400">Gym</p>
                <p className="text-white font-semibold">{activeGym.gym.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> Expiry</p>
                <p className="text-white font-semibold">
                  {activeGym.membership.expiresAt ? new Date(activeGym.membership.expiresAt).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 flex items-center gap-1"><CreditCard size={12} /> Monthly Fee</p>
                <p className="text-white font-semibold">₹{Number(activeGym.gym.monthlyFee || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> Contact</p>
                <p className="text-white font-semibold">{activeGym.gym.contactNumber || 'N/A'}</p>
              </div>
              <button
                onClick={() => navigate('/coaches?scope=gym')}
                className="w-full p-3 rounded-xl bg-primary/20 border border-primary/30 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/30"
              >
                <UserCheck size={16} /> View Coaches In This Gym
              </button>
              <div className="text-xs text-emerald-300 flex items-center gap-1"><CheckCircle2 size={12} /> Renew anytime from this page.</div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No active gym selected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default YourGym;

