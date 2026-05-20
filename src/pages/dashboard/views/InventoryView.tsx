import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreHorizontal, 
  AlertTriangle,
  ArrowUpDown,
  Edit2,
  Trash2,
  Barcode,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Product, Branch } from '../../../types';

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Retail',
    sku: '',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    reorderLevel: 5,
    branchId: ''
  });
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchBranches();
      if (profile.branchId && !selectedBranchId) {
        setSelectedBranchId(profile.branchId);
      }
    }
  }, [profile?.businessId, profile?.role]);

  useEffect(() => {
    if (profile?.businessId) {
      fetchInventory();
    }
  }, [profile?.businessId, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const snapshot = await getDocs(collection(db, `businesses/${profile?.businessId}/branches`));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(data);
    } catch (error) {
       console.error(error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, `businesses/${profile?.businessId}/inventory`));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Filter by branch if selected
      if (selectedBranchId) {
        data = data.filter(p => p.branchId === selectedBranchId);
      } else if (profile?.role !== 'Owner' && profile?.branchId) {
        data = data.filter(p => p.branchId === profile.branchId);
      }
      
      setInventory(data);
    } catch (error) {
       console.error('Inventory fetch error:', error);
    } finally {
       setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!profile?.businessId) return;
    setLoading(true);
    const id = `PRD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const sku = newProduct.sku || `SKU-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    try {
      await setDoc(doc(db, `businesses/${profile.businessId}/inventory`, id), {
        ...newProduct,
        id,
        sku,
        branchId: newProduct.branchId || profile.branchId || 'main',
        createdAt: Date.now()
      });
      setShowAddModal(false);
      setNewProduct({
        name: '',
        category: 'Retail',
        sku: '',
        costPrice: 0,
        sellingPrice: 0,
        quantity: 0,
        reorderLevel: 5,
        branchId: ''
      });
      fetchInventory();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!profile?.businessId || !editingProduct) return;
    setLoading(true);
    try {
      const { id, ...updateData } = editingProduct;
      await setDoc(doc(db, `businesses/${profile.businessId}/inventory`, id), updateData, { merge: true });
      setEditingProduct(null);
      fetchInventory();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!profile?.businessId || !window.confirm('Remove this item from inventory?')) return;
    try {
      await deleteDoc(doc(db, `businesses/${profile.businessId}/inventory`, id));
      setInventory(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
          <p className="text-slate-400">Track, manage and optimize your stock levels.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 bg-navy-muted border border-slate-800 rounded-xl text-slate-300 font-bold text-sm hover:text-white transition-all flex items-center gap-2">
              <Upload size={18} /> Import
           </button>
           <button className="px-4 py-2 bg-navy-muted border border-slate-800 rounded-xl text-slate-300 font-bold text-sm hover:text-white transition-all flex items-center gap-2">
              <Download size={18} /> Export
           </button>
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-6 py-2.5 bg-gold text-navy rounded-xl font-bold text-sm hover:bg-gold-light shadow-lg shadow-gold/10 transition-all flex items-center gap-2"
           >
              <Plus size={18} /> Add Product
           </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-navy-muted p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, SKU or barcode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-navy border border-transparent focus:border-slate-700 rounded-xl text-sm transition-all outline-none text-white"
            />
         </div>
         <div className="flex flex-wrap gap-2">
            {profile?.role === 'Owner' && (
              <select 
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-4 py-2 bg-navy border border-slate-800 hover:border-gold/30 rounded-xl text-slate-400 font-bold text-xs flex items-center gap-2 transition-all outline-none"
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <button className="px-4 py-2 bg-navy border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 font-bold text-sm flex items-center gap-2 transition-all">
               <Filter size={18} /> Category
            </button>
         </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-navy-muted rounded-3xl border border-slate-800 shadow-sm overflow-hidden whitespace-nowrap">
         <div className="overflow-x-auto">
            {loading && inventory.length === 0 ? (
               <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-gold" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory Mapping...</p>
               </div>
            ) : (
               <table className="w-full text-left font-medium">
                  <thead>
                     <tr className="bg-slate-800/30 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                        <th className="px-8 py-5">Product Info</th>
                        <th className="px-6 py-5">Category</th>
                        <th className="px-6 py-5">Stock Level</th>
                        <th className="px-6 py-5">Cost/Price</th>
                        <th className="px-6 py-5">Value</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                     {filteredInventory.map((item) => {
                        const isLowStock = item.quantity <= item.reorderLevel;
                        return (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-8 py-5">
                              <div>
                                 <p className="font-bold text-white mb-0.5">{item.name}</p>
                                 <div className="flex items-center gap-1.5 text-slate-500">
                                    <Barcode size={14} />
                                    <span className="text-[10px] font-mono font-bold tracking-tighter">{item.sku}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                                 {item.category}
                              </span>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="flex-1 w-24 h-1.5 bg-navy rounded-full overflow-hidden">
                                    <div 
                                       className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : 'bg-gold'}`}
                                       style={{ width: `${Math.min(100, (item.quantity / 100) * 100)}%` }}
                                    />
                                 </div>
                                 <span className={`text-xs font-black ${isLowStock ? 'text-red-500' : 'text-slate-300'}`}>
                                    {item.quantity}
                                 </span>
                                 {isLowStock && <AlertTriangle size={14} className="text-red-500" />}
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex flex-col">
                                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">COST: Ksh {item.costPrice}</span>
                                 <span className="text-white font-bold">SELL: Ksh {item.sellingPrice}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-slate-300">
                              <span className="font-black">Ksh {(item.quantity * item.sellingPrice).toLocaleString()}</span>
                           </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => setEditingProduct(item)}
                                   className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                 >
                                    <Edit2 size={16} />
                                 </button>
                                 <button onClick={() => deleteProduct(item.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-all">
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                        );
                     })}
                  </tbody>
               </table>
            )}
         </div>
         <div className="p-6 bg-slate-800/20 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <div>Showing {filteredInventory.length} results</div>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-navy-muted border border-slate-800 rounded-md disabled:opacity-50 hover:text-white transition-colors">Prev</button>
               <button className="px-3 py-1 bg-navy-muted border border-slate-800 rounded-md hover:text-white transition-colors">Next</button>
            </div>
         </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter">Inventory Influx</h3>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-1">Registering new stock units in the enterprise ledger</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-navy border border-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                     <X size={20} />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Product Nomenclature</label>
                        <input 
                           type="text" 
                           value={newProduct.name}
                           onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                           placeholder="e.g. Premium White Flour"
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System SKU (Unique)</label>
                        <input 
                           type="text" 
                           value={newProduct.sku}
                           onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                           placeholder="e.g. WHI-FLR-01"
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-mono uppercase"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Sector Classification</label>
                        <select 
                           value={newProduct.category}
                           onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold appearance-none"
                        >
                           <option value="Retail">Retail</option>
                           <option value="Beverages">Beverages</option>
                           <option value="Agrovet">Agrovet</option>
                           <option value="Hygiene">Hygiene</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Hub (Branch)</label>
                        <select 
                           value={newProduct.branchId}
                           onChange={(e) => setNewProduct({...newProduct, branchId: e.target.value})}
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-gold outline-none focus:border-gold/50 transition-all font-bold appearance-none"
                        >
                           <option value="">Default (Current Active)</option>
                           {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Acquisition Cost</label>
                           <input 
                              type="number" 
                              value={newProduct.costPrice}
                              onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-gold outline-none focus:border-gold/50 transition-all font-black text-lg"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Retail Price</label>
                           <input 
                              type="number" 
                              value={newProduct.sellingPrice}
                              onChange={(e) => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-black text-lg"
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Initial Quantum</label>
                           <input 
                              type="number" 
                              value={newProduct.quantity}
                              onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-black text-lg"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Reorder Threshold</label>
                           <input 
                              type="number" 
                              value={newProduct.reorderLevel}
                              onChange={(e) => setNewProduct({...newProduct, reorderLevel: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-red-500 outline-none focus:border-red-500/50 transition-all font-black text-lg cursor-help"
                              title="Alert will trigger when stock drops below this value"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <button 
                  onClick={handleAddProduct}
                  disabled={loading || !newProduct.name}
                  className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gold/10 hover:bg-gold-light transition-all mt-10 disabled:opacity-30"
               >
                  {loading ? <Loader2 className="animate-spin" /> : 'Authorize Inventory Integration'}
               </button>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setEditingProduct(null)}
               className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter">Stock Adjustment</h3>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-1">Reconfiguring parameters for {editingProduct.name}</p>
                  </div>
                  <button onClick={() => setEditingProduct(null)} className="w-10 h-10 bg-navy border border-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                     <X size={20} />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Product Nomenclature</label>
                        <input 
                           type="text" 
                           value={editingProduct.name}
                           onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System SKU (Unique)</label>
                        <input 
                           type="text" 
                           value={editingProduct.sku}
                           onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-mono uppercase"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Hub (Branch)</label>
                        <select 
                           value={editingProduct.branchId}
                           onChange={(e) => setEditingProduct({...editingProduct, branchId: e.target.value})}
                           className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-gold outline-none focus:border-gold/50 transition-all font-bold appearance-none"
                        >
                           {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Acquisition Cost</label>
                           <input 
                              type="number" 
                              value={editingProduct.costPrice}
                              onChange={(e) => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-gold outline-none focus:border-gold/50 transition-all font-black text-lg"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Retail Price</label>
                           <input 
                              type="number" 
                              value={editingProduct.sellingPrice}
                              onChange={(e) => setEditingProduct({...editingProduct, sellingPrice: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-black text-lg"
                           />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Current Quantum</label>
                           <input 
                              type="number" 
                              value={editingProduct.quantity}
                              onChange={(e) => setEditingProduct({...editingProduct, quantity: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-black text-lg"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Reorder Threshold</label>
                           <input 
                              type="number" 
                              value={editingProduct.reorderLevel}
                              onChange={(e) => setEditingProduct({...editingProduct, reorderLevel: Number(e.target.value)})}
                              className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-red-500 outline-none focus:border-red-500/50 transition-all font-black text-lg cursor-help"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <button 
                  onClick={handleEditProduct}
                  disabled={loading || !editingProduct.name}
                  className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gold/10 hover:bg-gold-light transition-all mt-10 disabled:opacity-30"
               >
                  {loading ? <Loader2 className="animate-spin" /> : 'Confirm Parameter Sync'}
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
