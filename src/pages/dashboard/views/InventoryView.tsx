import { useState } from 'react';
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
  Barcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const dummyInventory = [
  { id: '1', name: 'Fresh Milk 500ml', sku: 'MIL-001', category: 'Beverages', cost: 95, price: 120, stock: 45, reorder: 20 },
  { id: '2', name: 'Ajab Flour 2kg', sku: 'FLR-002', category: 'Flour', cost: 145, price: 180, stock: 12, reorder: 15 },
  { id: '3', name: 'Kabras Sugar 1kg', sku: 'SGR-003', category: 'Sugar', cost: 130, price: 155, stock: 30, reorder: 10 },
  { id: '4', name: 'Cooking Oil 1L', sku: 'OIL-004', category: 'Oil', cost: 190, price: 230, stock: 8, reorder: 10 },
  { id: '5', name: 'Geisha Soap', sku: 'HYG-005', category: 'Hygiene', cost: 65, price: 85, stock: 55, reorder: 20 },
];

export default function InventoryView() {
  const [showAddModal, setShowAddModal] = useState(false);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
                  {dummyInventory.map((item) => {
                    const isLowStock = item.stock <= item.reorder;
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
                                    style={{ width: `${Math.min(100, (item.stock / 100) * 100)}%` }}
                                  />
                               </div>
                               <span className={`text-xs font-black ${isLowStock ? 'text-red-500' : 'text-slate-300'}`}>
                                  {item.stock}
                               </span>
                               {isLowStock && <AlertTriangle size={14} className="text-red-500" />}
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">COST: Ksh {item.cost}</span>
                               <span className="text-white font-bold">SELL: Ksh {item.price}</span>
                            </div>
                         </td>
                         <td className="px-6 py-5 text-slate-300">
                            <span className="font-black">Ksh {(item.stock * item.price).toLocaleString()}</span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                  <Edit2 size={16} />
                               </button>
                               <button className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-all">
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
         </div>
         <div className="p-6 bg-slate-800/20 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <div>Showing 5 results</div>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-navy-muted border border-slate-800 rounded-md disabled:opacity-50 hover:text-white transition-colors">Prev</button>
               <button className="px-3 py-1 bg-navy-muted border border-slate-800 rounded-md hover:text-white transition-colors">Next</button>
            </div>
         </div>
      </div>
    </div>
  );
}
