import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Shop = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;

        fetch('http://localhost:5000/api/inventory', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) return [];
                return res.json();
            })
            .then(data => setProducts(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error(err);
                setProducts([]);
            });
    }, []);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item._id === product._id);
            if (existing) {
                return prev.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success(`Added ${product.name} to cart`);
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i._id !== id));
    const adjustQuantity = (id, delta) => {
        setCart(cart.map(i => {
            if (i._id === id) {
                const newQ = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQ };
            }
            return i;
        }));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckingOut(true);
        const userStr = localStorage.getItem('userInfo');
        const userInfo = userStr ? JSON.parse(userStr) : null;

        try {
            const res = await fetch('http://localhost:5000/api/finance/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    items: cart,
                    totalAmount: total,
                    type: 'retail'
                })
            });
            const data = await res.json();
            if (res.ok) {
                navigate('/payment-gateway', { state: { sessionId: data.sessionId, amount: total, items: cart } });
            } else {
                toast.error(data.error || 'Checkout failed');
            }
        } catch (err) {
            toast.error('Connection error');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-white mb-2">
                        FMS Pro Store
                    </h1>
                    <p className="text-gray-400">Premium gear and supplements to fuel your progress.</p>
                </div>
                <button
                    onClick={() => setShowCart(true)}
                    className="relative p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group"
                >
                    <ShoppingBag className="text-primary group-hover:scale-110 transition-transform" size={24} />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce">
                            {cart.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Cart Drawer */}
            {showCart && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-surface border-l border-white/10 p-8 flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <ShoppingBag className="text-primary" /> Your Cart
                            </h2>
                            <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-white">Close</button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">Your cart is empty.</div>
                            ) : (
                                cart.map(item => (
                                    <div key={item._id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                                        <div className="w-16 h-16 bg-black/50 rounded-xl p-2 flex items-center justify-center">
                                            <img src={item.image || 'https://via.placeholder.com/50'} className="max-h-full" alt={item.name} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                                <button onClick={() => removeFromCart(item._id)} className="text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                                            </div>
                                            <p className="text-primary font-bold text-sm">₹{item.price}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button onClick={() => adjustQuantity(item._id, -1)} className="p-1 bg-white/5 rounded-lg text-gray-400"><Minus size={12} /></button>
                                                <span className="text-white text-xs">{item.quantity}</span>
                                                <button onClick={() => adjustQuantity(item._id, 1)} className="p-1 bg-white/5 rounded-lg text-gray-400"><Plus size={12} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                            <div className="flex justify-between items-center text-xl">
                                <span className="text-gray-400">Total</span>
                                <span className="text-white font-bold">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isCheckingOut}
                                className="w-full py-4 bg-primary text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.length > 0 ? products.map(product => (
                    <div key={product._id} className="glass-card group hover:border-primary/50 transition-all overflow-hidden relative">
                        {/* Product Image Placeholder since we don't have real images in DB yet, assign random from unsplash based on category */}
                        <div className="h-48 bg-black/50 relative flex items-center justify-center p-4">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <img
                                    src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80`}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-20"
                                />
                            )}
                            <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-tighter shadow-lg">
                                <Star size={8} className="text-primary" fill="currentColor" /> Premium
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="mb-2">
                                <span className="text-xs text-primary uppercase tracking-wider">{product?.category || 'Category'}</span>
                                <h3 className="text-lg font-bold text-white">{product?.name || 'Product'}</h3>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <span className="text-xl font-bold text-white">₹{product?.price || 0}</span>
                                <button onClick={() => addToCart(product)} className="p-2 bg-white/10 hover:bg-primary hover:text-black rounded-lg transition-colors">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-4 text-center py-20 text-gray-500 space-y-4">
                        <ShoppingBag size={48} className="mx-auto opacity-50" />
                        <p>Store inventory is loading or empty.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Shop;
