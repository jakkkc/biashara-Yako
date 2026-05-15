import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import { Plus, Package, Search, Edit3, TrendingUp, AlertTriangle, Filter } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

export default function InventoryPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'general',
    buyingPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    unit: 'pcs',
    lowStockAlert: 5
  });

  useEffect(() => {
    if (!profile?.branchId) return;

    const q = query(
      collection(db, 'products'),
      where('branchId', '==', profile.branchId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        businessId: profile.businessId,
        branchId: profile.branchId,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: profile.uid
      });
      setShowAddModal(false);
      setNewProduct({ name: '', sku: '', category: 'general', buyingPrice: 0, sellingPrice: 0, quantity: 0, unit: 'pcs', lowStockAlert: 5 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Inventory</h1>
          <p className="text-slate-400 font-medium mt-1">Track and manage your branch stock levels.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[20px] font-bold transition shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition backdrop-blur-md placeholder:text-slate-600"
          />
        </div>
        <button className="px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] hover:bg-white/10 transition backdrop-blur-md">
          <Filter className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="glass rounded-[32px] shadow-sm border border-white/10 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Product</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Stock</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Price</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-white/5 transition group">
                  <td className="px-8 py-5">
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{product.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-0.5">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold",
                        product.quantity <= product.lowStockAlert ? "text-amber-500" : "text-slate-300"
                      )}>
                        {product.quantity} {product.unit}
                      </span>
                      {product.quantity <= product.lowStockAlert && (
                        <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div>
                      <p className="text-sm font-bold text-blue-400">{formatCurrency(product.sellingPrice)}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Cost: {formatCurrency(product.buyingPrice)}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      <button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition text-slate-500 hover:text-blue-400">
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition text-slate-500 hover:text-blue-400">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass rounded-[40px] p-10 max-w-2xl w-full shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
            
            <h2 className="text-2xl font-bold font-serif mb-8 flex items-center gap-3 text-white tracking-tight relative z-10">
              <div className="p-2.5 bg-blue-600/20 rounded-xl text-blue-400">
                <Package className="w-6 h-6" />
              </div>
              New Product Entry
            </h2>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-6 relative z-10">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Product Name</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700" placeholder="e.g. Premium Wireless Mouse" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">SKU / ID</label>
                <input required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition" placeholder="PROD-001" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition appearance-none cursor-pointer">
                  <option value="general" className="bg-slate-900">General</option>
                  <option value="electronics" className="bg-slate-900">Electronics</option>
                  <option value="food" className="bg-slate-900">Food & Drinks</option>
                  <option value="clothing" className="bg-slate-900">Clothing</option>
                  <option value="other" className="bg-slate-900">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Buying Price</label>
                <input required type="number" value={newProduct.buyingPrice} onChange={e => setNewProduct({...newProduct, buyingPrice: Number(e.target.value)})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Selling Price</label>
                <input required type="number" value={newProduct.sellingPrice} onChange={e => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Opening Stock</label>
                <input required type="number" value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Low Stock Level</label>
                <input required type="number" value={newProduct.lowStockAlert} onChange={e => setNewProduct({...newProduct, lowStockAlert: Number(e.target.value)})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition" />
              </div>
              <div className="col-span-2 flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[20px] font-bold transition active:scale-[0.98]">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-bold transition disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]">{loading ? "Saving..." : "Add to Inventory"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
