import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Star, Building2, ArrowRight, Activity, Users, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Mock Google Maps data for visual presentation since API key wasn't provided yet
const MOCK_GOOGLE_DATA = [
    {
        _id: 'mock1',
        name: 'Iron Forge Fitness',
        location: { address: '123 Downtown Ave, NY', lat: 40.7128, lng: -74.0060 },
        rating: 4.8,
        reviews: 124,
        images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'],
        facilities: ['Cardio', 'Free Weights', 'Sauna'],
        admissionFee: 50,
        monthlyFee: 100
    },
    {
        _id: 'mock2',
        name: 'Elite Training Studio',
        location: { address: '45 West St, NY', lat: 40.7200, lng: -74.0100 },
        rating: 4.9,
        reviews: 89,
        images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80'],
        facilities: ['Personal Training', 'Yoga', 'HIIT'],
        admissionFee: 0,
        monthlyFee: 150
    }
];

const GymDiscovery = () => {
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState('Fetching location...');
    const [coords, setCoords] = useState(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const affiliationGymIds = Array.isArray(user.affiliations) ? user.affiliations.map((a) => String(a.gym)) : [];
    const activeGymId = user.currentGym ? String(user.currentGym) : '';

    const refreshUserProfile = async () => {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        if (!res.ok) return null;
        const profile = await res.json();
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
        return merged;
    };

    const fetchGyms = useCallback(async () => {
        try {
            const token = user.token;
            // Fetch registered gyms from our DB
            const query = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
            const res = await fetch(`http://localhost:5000/api/gyms/nearby${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                // Merge DB gyms with Mock Google Maps gyms
                setGyms([...data.data, ...MOCK_GOOGLE_DATA]);
            }
        } catch (error) {
            console.error(error);
            setGyms(MOCK_GOOGLE_DATA); // Fallback to mock
        } finally {
            setLoading(false);
        }
    }, [user.token, coords]);

    useEffect(() => {
        fetchGyms();
        
        // Simulate HTML5 Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation(`Lat: ${pos.coords.latitude.toFixed(2)}, Lng: ${pos.coords.longitude.toFixed(2)}`);
                    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => setLocation('Location access denied. Showing popular gyms.')
            );
        }
    }, [fetchGyms]);

    const handleSwitchGym = async (gymId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/gyms/${gymId}/switch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to switch gym');
                return;
            }
            await refreshUserProfile();
            toast.success('Active gym switched');
            navigate('/');
        } catch {
            toast.error('Network error');
        }
    };

    const handleLeaveGym = async (gymId) => {
        try {
            const res = await fetch(`http://localhost:5000/api/gyms/${gymId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to leave gym');
                return;
            }
            await refreshUserProfile();
            toast.success('You have exited this gym');
            window.location.reload();
        } catch {
            toast.error('Network error');
        }
    };

    const handleJoinGym = async (gymId) => {
        if (gymId.startsWith('mock')) {
            toast.error("This is a mock gym from Google Maps. Register a real gym down below to join!");
            return;
        }
        navigate(`/gym-associate/${gymId}`);
    };

    return (
        <div className="min-h-screen bg-background text-white p-6 pb-20 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="z-10">
                        <h1 className="text-4xl font-bold tracking-tight mb-2">Find Your <span className="text-primary italic">Arena</span></h1>
                        <p className="text-gray-400 flex items-center gap-2">
                            <MapPin size={16} className="text-primary" /> {location}
                        </p>
                    </div>

                    <div className="z-10 flex gap-4">
                        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium text-sm flex items-center gap-2">
                            Skip to Dashboard <ArrowRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Gym Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Activity className="animate-spin text-primary" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gyms.map((gym, i) => (
                            <div key={i} className="glass border border-white/10 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300">
                                <div className="h-48 relative overflow-hidden">
                                    <img 
                                        src={gym.images && gym.images.length > 0 ? gym.images[0] : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'} 
                                        alt={gym.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/10 text-sm font-bold">
                                        <Star size={14} className="text-primary" fill="currentColor" />
                                        {gym.rating || 'N/A'} <span className="text-gray-400 text-xs font-normal">({gym.reviews?.length || gym.reviews || 0})</span>
                                    </div>
                                    {gym.admissionFee === 0 && (
                                        <div className="absolute top-4 left-4 bg-green-500/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                            No Joining Fee
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{gym.name}</h3>
                                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                                            <MapPin size={12} /> {gym.location?.address || 'Location specific'}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {gym.facilities?.slice(0, 3).map((f, j) => (
                                            <span key={j} className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                                {f}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Monthly Plan</p>
                                            <p className="text-lg font-bold text-white">₹{Number(gym.monthlyFee || 0).toLocaleString('en-IN')}</p>
                                            {gym.distanceKm != null && (
                                                <p className="text-[11px] text-primary font-semibold mt-1">{gym.distanceKm} km away</p>
                                            )}
                                        </div>
                                        {affiliationGymIds.includes(String(gym._id)) ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSwitchGym(gym._id)}
                                                    className={`px-3 py-2 text-black font-bold text-sm rounded-lg hover:scale-105 transition-transform ${activeGymId === String(gym._id) ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-primary/80'}`}
                                                >
                                                    {activeGymId === String(gym._id) ? 'Current' : 'Use'}
                                                </button>
                                                <button
                                                    onClick={() => handleLeaveGym(gym._id)}
                                                    className="px-3 py-2 text-red-300 font-bold text-sm rounded-lg border border-red-500/40 hover:bg-red-500/10"
                                                >
                                                    Exit
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleJoinGym(gym._id)}
                                                className="px-5 py-2 bg-gradient-to-r from-primary to-primary/80 text-black font-bold text-sm rounded-lg hover:scale-105 transition-transform flex items-center gap-1"
                                            >
                                                <span>Join</span> <Building2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default GymDiscovery;
