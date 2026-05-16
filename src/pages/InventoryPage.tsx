import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { useAI } from '../hooks/useAI';
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Edit, 
  Trash2, 
  Upload, 
  ArrowUpRight, 
  AlertTriangle, 
  ChevronDown, 
  Download, 
  Check, 
  Archive,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatters';
import { SYSTEM_CATEGORIES } from '../utils/constants';
import { AIInsightModal } from '../components/ui/AIInsightModal';
import toast from 'react-hot-toast';

export const InventoryPage: React.FC = () => {
  const { user, business, currentBranch } = useAuth();
  const { addProduct, updateProduct, deleteProductDoc, restockProduct } = useFirestore();
  const { getLowStockSuggestions } = useAI();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Add/Edit Modals Triggers
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [restockItem, setRestockItem] = useState<any | null>(null);

  // CSV states
  const [importProgress, setImportProgress] = useState<number | null>(null);

  // AI low stock prediction states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Product Form states
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: SYSTEM_CATEGORIES[0].split(' / ')[0],
    buyingPrice: 0,
    sellingPrice: 0,
    quantity: 0,
    unit: 'Pcs',
    lowStockAlert: 5
  });

  // Restock state qty additions
  const [restockQty, setRestockQty] = useState(10);

  const currencySymbol = business?.currency?.symbol || 'KES';

  // Watch products
  useEffect(() => {
    if (!user || !user.businessId || !currentBranch) return;

    const q = query(
      collection(db, 'products'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setProducts(items);
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [user, currentBranch]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: name === 'buyingPrice' || name === 'sellingPrice' || name === 'quantity' || name === 'lowStockAlert'
        ? Number(value)
        : value
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      toast.error('Please enter name and SKU.');
      return;
    }

    const success = await addProduct(productForm);
    if (success) {
      setAddProductModalOpen(false);
      setProductForm({
        name: '',
        sku: '',
        category: SYSTEM_CATEGORIES[0].split(' / ')[0],
        buyingPrice: 0,
        sellingPrice: 0,
        quantity: 0,
        unit: 'Pcs',
        lowStockAlert: 5
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const updates = {
      name: editProduct.name,
      sku: editProduct.sku,
      category: editProduct.category,
      buyingPrice: Number(editProduct.buyingPrice),
      sellingPrice: Number(editProduct.sellingPrice),
      quantity: Number(editProduct.quantity),
      unit: editProduct.unit,
      lowStockAlert: Number(editProduct.lowStockAlert)
    };

    await updateProduct(editProduct.id, updates);
    setEditProduct(null);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;

    await restockProduct(
      restockItem.id, 
      restockQty, 
      restockItem.quantity, 
      `${restockItem.name} - Restock additional`
    );
    setRestockItem(null);
    setRestockQty(10);
  };

  /**
   * Bulk Product import using client-side CSV parsing - CRITICAL IMPROVEMENT 3
   */
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !user.businessId || !currentBranch) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        setImportProgress(10);
        const rows = text.split('\n').map((row) => row.split(','));
        const headers = rows[0].map(h => h.trim().toLowerCase());

        // Validate basic columns format
        // Template expectation: name,sku,category,buyingPrice,sellingPrice,quantity,unit,lowStockAlert
        const productsToImport = [];
        setImportProgress(30);

        for (let idx = 1; idx < rows.length; idx++) {
          const rowVals = rows[idx];
          if (rowVals.length < 5 || !rowVals[0]) continue; // blank rows skip

          const itemObj = {
            name: (rowVals[0] || '').trim(),
            sku: (rowVals[1] || '').trim(),
            category: (rowVals[2] || 'General').trim(),
            buyingPrice: Number(rowVals[3]) || 0,
            sellingPrice: Number(rowVals[4]) || 0,
            quantity: Number(rowVals[5]) || 0,
            unit: (rowVals[6] || 'Pcs').trim(),
            lowStockAlert: Number(rowVals[7]) || 5
          };
          productsToImport.push(itemObj);
        }

        if (productsToImport.length === 0) {
          toast.error('No valid products found in CSV files.');
          setImportProgress(null);
          return;
        }

        setImportProgress(60);
        // Stage batch writes
        const batch = writeBatch(db);
        const timestamp = new Date().toISOString();

        productsToImport.forEach((p) => {
          const newRef = doc(collection(db, 'products'));
          batch.set(newRef, {
            ...p,
            businessId: user.businessId,
            branchId: currentBranch.id,
            status: 'active',
            createdAt: timestamp,
            createdBy: user.name
          });
        });

        await batch.commit();
        setImportProgress(100);
        toast.success(`Uingizaji umekamilika! Imported ${productsToImport.length} products successfully.`);
        
        setTimeout(() => setImportProgress(null), 2000);
      } catch (err) {
        console.error('CSV import parsing error:', err);
        toast.error('Internal parsing error. Check file headers.');
        setImportProgress(null);
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // AI Low stock reordering alerts
  const triggerAIReorders = async () => {
    const lowStocks = products.filter((p) => p.quantity <= (p.lowStockAlert || 5));
    if (lowStocks.length === 0) {
      toast.error('Congratulations! No products has fallen below their low stock margins.');
      return;
    }

    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await getLowStockSuggestions(lowStocks);
      setAiInsight(res);
    } catch {
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter lists
  const filteredList = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) || p.sku.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category.includes(selectedCategory);
    
    if (stockFilter === 'low') {
      return matchSearch && matchCat && p.quantity > 0 && p.quantity <= (p.lowStockAlert || 5);
    }
    if (stockFilter === 'out') {
      return matchSearch && matchCat && p.quantity <= 0;
    }
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Title section with bulk uploads */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Ghala la Bidhaa / Inventory Catalog
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Monitor stocks balances, manage catalogs, and bulk upload CSV product sheets.
          </span>
        </div>

        {/* Buttons tool chest */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI predictions */}
          <button
            onClick={triggerAIReorders}
            className="btn-ghost text-xs text-indigo-400 font-bold border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <Sparkles className="h-4 w-4 animate-pulse" /> Automated Reorder Predictions
          </button>

          {/* Bulk CSV imports */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost text-xs text-emerald-400 font-bold border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Bulk CSV Import
            </button>
          </div>

          <button
            onClick={() => setAddProductModalOpen(true)}
            className="btn-primary text-xs font-bold flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Product / Weka Bidhaa
          </button>
        </div>
      </div>

      {/* Upload CSV progress bar progress bar */}
      {importProgress !== null && (
        <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between text-xs text-emerald-400 font-mono font-bold">
            <span>Staging bulk import transaction...</span>
            <span>{importProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${importProgress}%` }} />
          </div>
        </div>
      )}

      {/* Quick guide downloads templates */}
      <div className="text-[10px] text-slate-500 bg-slate-950/40 p-3 rounded-lg border border-slate-900 flex items-center justify-between">
        <span>CSV Format template headers (Case insensitive): <code className="text-slate-400 text-[9px] font-mono">name, sku, category, buyingPrice, sellingPrice, quantity, unit, lowStockAlert</code></span>
        <a 
          href="data:text/csv;charset=utf-8,name,sku,category,buyingPrice,sellingPrice,quantity,unit,lowStockAlert%0ASoda Coca Cola,COKE350,Beverages,30,50,150,Pcs,15%0AMaziwa Fresh,MAZ500,General,45,65,40,Packet,10" 
          download="biashara_pos_template.csv"
          className="text-indigo-400 font-bold hover:underline flex items-center gap-1 shrink-0"
        >
          <Download className="h-3 w-3" /> Template
        </a>
      </div>

      {/* Filter Toolbar grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by SKU or Name / Tafuta bidhaa..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input pl-10 pr-4 py-2 w-full text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input py-2 px-3 text-xs uppercase bg-slate-900 border text-slate-300 w-full font-medium"
        >
          <option value="All">All Categories</option>
          {SYSTEM_CATEGORIES.map((cat, idx) => (
            <option key={idx} value={cat.split(' / ')[0]}>
              {cat}
            </option>
          ))}
        </select>

        {/* Tab stocks status selector */}
        <div className="flex border border-slate-800 rounded-xl overflow-hidden text-xs bg-slate-950 bg-opacity-40">
          {(['all', 'low', 'out'] as any[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStockFilter(filter)}
              className={`flex-1 py-2 text-center text-[10px] font-mono uppercase font-bold transition ${
                stockFilter === filter
                  ? 'bg-slate-900 text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog table listing */}
      <GlassCard className="border-indigo-500/10 p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold pb-2">
                <th className="py-2.5">Product Name</th>
                <th>SKU ID</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>Buying Price</th>
                <th>Balances (Qty)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredList.map((p) => {
                const isLow = p.quantity > 0 && p.quantity <= (p.lowStockAlert || 5);
                const isOut = p.quantity <= 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-900/10 text-slate-300">
                    <td className="py-3.5 font-bold text-white max-w-[180px] truncate">{p.name}</td>
                    <td className="font-mono text-slate-400">{p.sku}</td>
                    <td className="text-slate-400">{p.category}</td>
                    <td className="font-mono text-slate-200">{formatCurrency(p.sellingPrice, currencySymbol)}</td>
                    <td className="font-mono text-slate-500">{formatCurrency(p.buyingPrice, currencySymbol)}</td>
                    <td>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={`font-bold ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {p.quantity} {p.unit || 'Pcs'}
                        </span>
                        {isOut && <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">OUT</span>}
                        {isLow && <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">LOW</span>}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => setRestockItem(p)}
                          className="p-1 px-2.2 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white transition text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => setEditProduct(p)}
                          className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500 hover:text-white transition cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this product permanently? Irreversible.')) {
                              deleteProductDoc(p.id);
                            }
                          }}
                          className="p-1.5 rounded bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic font-medium">
                    Hakuna bidhaa inayofanya kazi nayo katika ghala kwa tawi hili.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* AI low stock modal */}
      <AIInsightModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        insight={aiInsight}
        loading={aiLoading}
        onRefresh={triggerAIReorders}
      />

      {/* ADD COMPONENT MODAL */}
      <Modal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        title="Add Product Card / Weka Bidhaa Mpya"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-sm font-sans text-slate-300">
          <Input
            label="Product Name / Jina la Bidhaa"
            name="name"
            placeholder="E.g. Coca Cola Soda Can 350ml"
            value={productForm.name}
            onChange={handleFormChange}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU / Kitambulishi"
              name="sku"
              placeholder="E.g. COKE350"
              value={productForm.sku}
              onChange={handleFormChange}
              required
            />

            <div>
              <label htmlFor="form-category" className="text-xs font-semibold text-slate-300 block mb-1">
                Category / Makundi
              </label>
              <select
                id="form-category"
                name="category"
                value={productForm.category}
                onChange={handleFormChange}
                className="input px-4 py-2.5 w-full bg-slate-950 text-slate-100 text-xs text-medium border"
              >
                {SYSTEM_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat.split(' / ')[0]}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Buying Price / Thamani ya Nunua (${currencySymbol})`}
              name="buyingPrice"
              type="number"
              placeholder="35"
              value={productForm.buyingPrice || ''}
              onChange={handleFormChange}
            />
            <Input
              label={`Selling Price / Thamani ya Uza (${currencySymbol})`}
              name="sellingPrice"
              type="number"
              placeholder="50"
              value={productForm.sellingPrice || ''}
              onChange={handleFormChange}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Stoki (Initial)"
              name="quantity"
              type="number"
              placeholder="100"
              value={productForm.quantity || ''}
              onChange={handleFormChange}
            />
            <Input
              label="Unit / Kipimo"
              name="unit"
              placeholder="Pcs/Packet/KG"
              value={productForm.unit}
              onChange={handleFormChange}
            />
            <Input
              label="Warn Lim / Tahadhari"
              name="lowStockAlert"
              type="number"
              placeholder="10"
              value={productForm.lowStockAlert || ''}
              onChange={handleFormChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 rounded-xl font-bold mt-2 cursor-pointer"
          >
            Sajili Bidhaa / Complete Add
          </button>
        </form>
      </Modal>

      {/* EDIT COMPONENT MODAL */}
      <Modal
        isOpen={editProduct !== null}
        onClose={() => setEditProduct(null)}
        title="Edit Inventory Card"
      >
        {editProduct && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-sm font-sans text-slate-301">
            <Input
              label="Product Name"
              name="name"
              placeholder="Soda"
              value={editProduct.name}
              onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="SKU Reference ID"
                name="sku"
                placeholder="SKU"
                value={editProduct.sku}
                onChange={(e) => setEditProduct({ ...editProduct, sku: e.target.value })}
                required
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={editProduct.category}
                  onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  className="input px-4 py-2.5 w-full bg-slate-950 text-slate-100 text-xs font-semibold border"
                >
                  {SYSTEM_CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat.split(' / ')[0]}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Buying Price"
                type="number"
                value={editProduct.buyingPrice || ''}
                onChange={(e) => setEditProduct({ ...editProduct, buyingPrice: Number(e.target.value) })}
              />
              <Input
                label="Selling Price"
                type="number"
                value={editProduct.sellingPrice || ''}
                onChange={(e) => setEditProduct({ ...editProduct, sellingPrice: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Stock In Hand"
                type="number"
                value={editProduct.quantity || ''}
                onChange={(e) => setEditProduct({ ...editProduct, quantity: Number(e.target.value) })}
              />
              <Input
                label="Unit Measurement"
                value={editProduct.unit}
                onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })}
              />
              <Input
                label="Low Stock Guard"
                type="number"
                value={editProduct.lowStockAlert || ''}
                onChange={(e) => setEditProduct({ ...editProduct, lowStockAlert: Number(e.target.value) })}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-xl font-bold mt-2 cursor-pointer"
            >
              Update product profile
            </button>
          </form>
        )}
      </Modal>

      {/* RESTOCK DIALOG */}
      <Modal
        isOpen={restockItem !== null}
        onClose={() => setRestockItem(null)}
        title={`Restock Product: ${restockItem?.name}`}
      >
        {restockItem && (
          <form onSubmit={handleRestockSubmit} className="space-y-4 text-sm font-sans text-slate-300">
            <p className="text-xs text-slate-400">
              Current stock on shelf: <span className="text-white font-bold">{restockItem.quantity} {restockItem.unit}</span>
            </p>
            <Input
              label="Additional Quantity to Add / Ongeza Kiasi hapa"
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              required
            />
            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-xl font-bold cursor-pointer"
            >
              Committed Restock
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};

// Footer Credits Export
export default () => {
  return (
    <>
      <InventoryPage />
      <footer className="text-center py-6 border-t border-slate-900 mt-6 text-[11px] text-slate-500 font-mono">
        <span>© {new Date().getFullYear()} Biashara Yako POS. Developed by{' '}</span>
        <a 
          href="https://nex-chi-six.vercel.app/" 
          target="_blank" 
          referrerPolicy="no-referrer"
          className="text-indigo-400 hover:text-indigo-300 transition underline font-sans font-semibold"
        >
          Munene Jackson Mwaniki from Nex-Ink
        </a>
      </footer>
    </>
  );
};
