import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, CreditCard, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'supplement', stock: '', sku: '', image: '' });

    // Fetch Products
    const fetchProducts = async () => {
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/inventory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Cart Logic
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item._id === product._id);
            if (existing) {
                return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item._id !== id));
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item._id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // API Interactions
    const handleSubmit = async (e) => {
        e.preventDefault();
        const userStr = localStorage.getItem('userInfo');
        const token = userStr ? JSON.parse(userStr)?.token : null;
        const method = editingProduct ? 'PUT' : 'POST';
        const url = editingProduct
            ? `http://localhost:5000/api/inventory/${editingProduct._id}`
            : 'http://localhost:5000/api/inventory';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newProduct)
            });

            if (res.ok) {
                toast.success(editingProduct ? 'Product Updated!' : 'Product Added!');
                setShowAddModal(false);
                setEditingProduct(null);
                setNewProduct({ name: '', price: '', category: 'supplement', stock: '', sku: '', image: '' });
                fetchProducts();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Operation failed');
            }
        } catch (err) {
            console.error(err);
            toast.error('Connection error');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setNewProduct({
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.stock,
            sku: product.sku,
            image: product.image || ''
        });
        setShowAddModal(true);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
        try {
            const items = cart.map(item => ({
                productId: item._id,
                quantity: item.qty,
                price: item.price
            }));

            const res = await fetch('http://localhost:5000/api/inventory/sale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ items, totalAmount: cartTotal })
            });

            if (res.ok) {
                toast.success('Sale Processed Successfully!');
                setCart([]);
                fetchProducts(); // Refresh stock
            } else {
                toast.error('Sale Failed');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6">
            {/* Product Grid Area */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inventory & POS</h1>
                        <p className="text-gray-400">Manage stock and process sales.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">
                        <Plus size={18} /> Add Product
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product._id} className="glass-card flex flex-col group overflow-hidden">
                            <div className="h-40 bg-black/20 relative group-hover:bg-black/10 transition-colors flex items-center justify-center p-4">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                                ) : (
                                    <ShoppingBag size={48} className="text-white/10" />
                                )}
                            </div>
                            <div className="p-4 flex flex-col justify-between flex-1">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded uppercase tracking-widest">{product.category}</span>
                                        <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                                    </div>
                                    <h3 className="text-white font-semibold">{product.name}</h3>
                                    <p className="text-xl font-bold text-white mt-1">₹{product.price}</p>
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <button onClick={() => addToCart(product)} disabled={product.stock <= 0}
                                        className="w-full py-2 bg-white/5 hover:bg-primary hover:text-black text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>

                                    {JSON.parse(localStorage.getItem('userInfo'))?.role === 'admin' && (
                                        <button onClick={() => handleEdit(product)}
                                            className="w-full py-2 border border-white/10 text-gray-400 hover:text-white hover:border-primary/50 rounded-lg transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                            <Tag size={12} /> Modify Product
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="w-96 glass rounded-2xl flex flex-col p-6">
                <div className="flex items-center gap-2 mb-6 text-white pb-4 border-b border-white/10">
                    <ShoppingBag />
                    <h2 className="text-xl font-bold">Current Sale</h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">Cart is empty</div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl">
                                <div className="w-10 h-10 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag size={16} className="text-white/20" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-medium text-sm truncate w-32">{item.name}</h4>
                                    <div className="text-[10px] text-primary font-bold uppercase tracking-widest">₹{item.price} x {item.qty}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateQty(item._id, -1)} className="p-1 text-gray-400 hover:text-white"><Minus size={14} /></button>
                                    <span className="text-white text-sm w-4 text-center">{item.qty}</span>
                                    <button onClick={() => updateQty(item._id, 1)} className="p-1 text-gray-400 hover:text-white"><Plus size={14} /></button>
                                    <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500/50 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-400">Total</span>
                        <span className="text-3xl font-bold text-white">₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button onClick={handleCheckout} disabled={cart.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50">
                        <CreditCard size={20} /> Checkout
                    </button>
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md">
                        <h2 className="text-2xl font-bold text-white mb-6 underline decoration-primary underline-offset-8">
                            {editingProduct ? 'Update Product' : 'Add Inventory'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div>
                                <label className="text-gray-400 text-xs uppercase tracking-tighter mb-1 block">Product Name</label>
                                <input required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-gray-400 text-xs uppercase tracking-tighter mb-1 block">Price (₹)</label>
                                    <input required type="number" step="1" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                        value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
                                <div><label className="text-gray-400 text-xs uppercase tracking-tighter mb-1 block">Initial Stock</label>
                                    <input required type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                        value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} /></div>
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs uppercase tracking-tighter mb-1 block">SKU / Serial Code</label>
                                <input required className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none font-mono"
                                    value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                            </div>

                            <div>
                                <label className="text-gray-400 text-xs uppercase tracking-tighter mb-1 block">Product Image URL</label>
                                <input className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    placeholder="https://..."
                                    value={newProduct.image} onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} />
                            </div>

                            <div><label className="text-gray-400 text-xs uppercase tracking-tighter mb-1 block">Category</label>
                                <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                    value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                    <option value="supplement">Supplement</option>
                                    <option value="gear">Gear</option>
                                    <option value="drink">Energy Drink</option>
                                    <option value="apparel">Apparel</option>
                                    <option value="other">Other</option>
                                </select></div>

                            <div className="flex gap-4 mt-8">
                                <button type="button" onClick={() => { setShowAddModal(false); setEditingProduct(null); setNewProduct({ name: '', price: '', category: 'supplement', stock: '', sku: '', image: '' }); }} className="flex-1 py-4 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors font-medium">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-primary text-black font-bold rounded-xl hover:scale-[1.02] transition-transform">
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Inventory;
