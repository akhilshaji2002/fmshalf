import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PACKAGE_MULTIPLIERS = {
  daily: 0,
  monthly: 1,
  quarterly: 3,
  six_month: 6,
  yearly: 12
};
const applyPlanDiscount = (planType, amount) => (
  ['quarterly', 'six_month', 'yearly'].includes(planType) ? Math.round(amount * 0.9) : Math.round(amount)
);

const GymAssociate = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const [gym, setGym] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [planType, setPlanType] = useState('monthly');
  const [workoutTime, setWorkoutTime] = useState('07:00');
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || '');
  const [aadhar, setAadhar] = useState(user?.nationalId?.idNumber || '');
  const [ptTrainerId, setPtTrainerId] = useState('');
  const [ptAmountInr, setPtAmountInr] = useState(0);
  const [loading, setLoading] = useState(false);
  const isTrainer = user?.role === 'trainer';

  useEffect(() => {
    const load = async () => {
      try {
        const [gymsRes, tRes] = await Promise.all([
          fetch('http://localhost:5000/api/gyms/nearby', { headers: { Authorization: `Bearer ${user.token}` } }),
          fetch('http://localhost:5000/api/trainers?trainingType=online', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        const gymsData = await gymsRes.json();
        const tData = await tRes.json();
        const found = (gymsData?.data || []).find((g) => String(g._id) === String(gymId));
        setGym(found || null);
        setTrainers(Array.isArray(tData) ? tData : []);
      } catch {
        toast.error('Failed to load association page');
      }
    };
    load();
  }, [gymId, user.token]);

  const amountInr = useMemo(() => {
    const monthly = Number(gym?.monthlyFee || 0);
    const base = planType === 'daily' ? 100 : monthly * (PACKAGE_MULTIPLIERS[planType] || 1);
    const discountedBase = applyPlanDiscount(planType, base);
    return discountedBase + Number(ptAmountInr || 0);
  }, [gym?.monthlyFee, planType, ptAmountInr]);

  const refreshUserProfile = async () => {
    const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      const merged = { ...user, ...profile };
      localStorage.setItem('userInfo', JSON.stringify(merged));
      localStorage.setItem('user', JSON.stringify({
        _id: merged._id,
        name: merged.name,
        email: merged.email,
        role: merged.role,
        profilePic: merged.profilePic || '',
        token: merged.token || user.token
      }));
    }
  };

  const handleTrainerAssociate = async () => {
    if (!mobileNumber || !aadhar) {
      toast.error('Mobile number and Aadhar are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/gyms/${gymId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.message || 'Failed to join gym as trainer');
        return;
      }
      await refreshUserProfile();
      toast.success('Trainer associated with gym successfully');
      navigate('/');
    } catch {
      toast.error('Network error during trainer association');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!mobileNumber || !aadhar) {
      toast.error('Mobile number and Aadhar are required');
      return;
    }
    setLoading(true);
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
          totalAmount: amountInr,
          enrollmentDetails: {
            mobileNumber,
            nationalId: { idType: 'aadhar', idNumber: aadhar },
            workoutTime
          },
          trainerAddOn: ptTrainerId && Number(ptAmountInr) > 0
            ? { trainerId: ptTrainerId, amountInr: Number(ptAmountInr) }
            : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || 'Failed to create membership checkout');
        return;
      }
      navigate('/payment-gateway', {
        state: {
          sessionId: data.sessionId,
          amount: data.amount,
          membership: true,
          gymId,
          returnTo: '/discovery'
        }
      });
    } catch {
      toast.error('Network error during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <div className="max-w-3xl mx-auto glass-card p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Associate With Gym</h1>
          <p className="text-gray-400 text-sm mt-1">{gym?.name || 'Selected gym'}</p>
        </div>

        {!isTrainer && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {['daily', 'monthly', 'quarterly', 'six_month', 'yearly'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlanType(p)}
                className={`px-3 py-2 rounded-lg border text-sm capitalize ${planType === p ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-gray-300'}`}
              >
                {p.replace('_', ' ')}
                {['quarterly', 'six_month', 'yearly'].includes(p) && (
                  <span className="block text-[10px] text-emerald-300">10% off</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Workout time</label>
            <input type="time" value={workoutTime} onChange={(e) => setWorkoutTime(e.target.value)} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Mobile number</label>
            <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Aadhar number</label>
            <input type="text" value={aadhar} onChange={(e) => setAadhar(e.target.value)} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Optional PT trainer</label>
            <select value={ptTrainerId} onChange={(e) => setPtTrainerId(e.target.value)} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
              <option value="">No personal training</option>
              {trainers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
          {!isTrainer && (
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400">PT add-on amount (INR)</label>
              <input type="number" value={ptAmountInr} onChange={(e) => setPtAmountInr(Number(e.target.value) || 0)} className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2" />
            </div>
          )}
        </div>

        {!isTrainer && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-gray-300">Total payable</span>
            <span className="text-2xl font-bold">₹{Number(amountInr).toLocaleString('en-IN')}</span>
          </div>
        )}
        {isTrainer && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-200 rounded-xl px-4 py-3 text-sm">
            Trainer flow: no membership payment. This will register you under this gym as coach.
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/discovery')} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300">Back</button>
          <button onClick={isTrainer ? handleTrainerAssociate : handleProceed} disabled={loading} className="flex-1 py-3 rounded-xl bg-primary text-black font-bold disabled:opacity-60">
            {loading ? 'Processing...' : (isTrainer ? 'Join as Trainer' : 'Pay & Join Gym')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GymAssociate;

