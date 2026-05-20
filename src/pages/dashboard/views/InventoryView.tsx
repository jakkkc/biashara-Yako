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
import { Product } from '../../../types';

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Retail',
    sku: '',
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    reorderLevel: 5
  });
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchInventory();
    }
  }, [profile?.businessId, profile?.branchId]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      // In a real multi-branch setup, we'd filter or fetch from a subcollection
      // For this implementation, we use a central inventory subcollection per business
      const q = query(collection(db, `businesses/${profile?.businessId}/inventory`));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
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
        branchId: profile.branchId || 'main',
        createdAt: Date.now()
      });
      setShowAddModal(false);
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
         <div className="flex gap-2">
            <button className="px-4 py-2 bg-navy border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 font-bold text-sm flex items-center gap-2 transition-all">
               <Filter size={18} /> Category
            </button>
            <button className="px-4 py-2 bg-navy border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 font-bold text-sm flex items-center gap-2 transition-all">
               <ArrowUpDown size={18} /> Sort
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
                                 <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                    <Edit2 size={16} />
                                 </button>
                                 <button onClick={() => deleteProduct(item.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-all">
                                    <Trash2 size={16} />
                                 </button>
                                 <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                    <MoreHorizontal size={16} />
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
      </AnimatePresence>
    </div>
  );
}
