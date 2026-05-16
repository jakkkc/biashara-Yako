import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection, useFirestore } from '../../hooks/useFirestore';
import { Product } from '../../types';
import { where, orderBy } from 'firebase/firestore';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import { Modal } from '../../components/ui/Modal';
import { PRODUCT_UNITS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { userProfile } = useAuth();
  const { addDocument, updateDocument, deleteDocument } = useFirestore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: products, loading } = useCollection<Product>('products', [
    where('businessId', '==', userProfile?.businessId),
    orderBy('name', 'asc')
  ]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Retail',
    sku: '',
    price: 0,
    cost: 0,
    stock: 0,
    minStock: 5,
    unit: 'pcs'
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument('products', {
        ...formData,
        businessId: userProfile?.businessId,
        updatedAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: 'Retail',
        sku: '',
        price: 0,
        cost: 0,
        stock: 0,
        minStock: 5,
        unit: 'pcs'
      });
      toast.success('Product added successfully');
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Inventory</h1>
          <p className="text-slate-400">Manage your products and stock levels.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6 border-l-4 border-indigo-500">
          <p className="text-slate-400 text-sm font-medium mb-1">Total Products</p>
          <h3 className="text-2xl font-bold font-display">{products.length}</h3>
        </GlassCard>
        <GlassCard className="p-6 border-l-4 border-red-500">
          <p className="text-slate-400 text-sm font-medium mb-1">Low Stock Alerts</p>
          <h3 className="text-2xl font-bold font-display text-red-400">{lowStockCount}</h3>
        </GlassCard>
        <GlassCard className="p-6 border-l-4 border-emerald-500">
          <p className="text-slate-400 text-sm font-medium mb-1">Inventory Value</p>
          <h3 className="text-2xl font-bold font-display text-emerald-400">
            {formatCurrency(products.reduce((acc, p) => acc + (p.stock * p.cost), 0))}
          </h3>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              className="w-full glass-input pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-sm hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-8 bg-white/5 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No products found</td>
                </tr>
              ) : filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.category} • {product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-400">{product.sku || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-brand">{formatCurrency(product.price)}</p>
                    <p className="text-[10px] text-slate-500">Cost: {formatCurrency(product.cost)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${product.stock <= product.minStock ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.minStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                      <button 
                        onClick={() => deleteDocument('products', product.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Product"
        size="lg"
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Product Name *</label>
              <input 
                required
                type="text" 
                className="w-full glass-input"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Category</label>
              <input 
                type="text" 
                className="w-full glass-input"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">SKU / Code</label>
              <input 
                type="text" 
                className="w-full glass-input"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Selling Price *</label>
              <input 
                required
                type="number" 
                className="w-full glass-input"
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Cost Price *</label>
              <input 
                required
                type="number" 
                className="w-full glass-input"
                value={formData.cost}
                onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Initial Stock *</label>
              <input 
                required
                type="number" 
                className="w-full glass-input"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Min Stock Alert</label>
              <input 
                required
                type="number" 
                className="w-full glass-input"
                value={formData.minStock}
                onChange={e => setFormData({...formData, minStock: parseInt(e.target.value)})}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(false)}
              className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
