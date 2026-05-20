import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Search, Download, FileSpreadsheet, ArrowLeftRight, Check, X,
  AlertTriangle, Trash2, Edit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { logAudit } from '../utils/auditLogger';
import { InventoryItem, Branch, StockTransfer } from '../types';

interface InventorySectionProps {
  branchId: string;
}

export default function InventorySection({ branchId }: InventorySectionProps) {
  const { t } = useI18n();
  const { user, profile, business } = useAuth();

  // Firestore States
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Field States
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pCategory, setPCategory] = useState('General');
  const [pUnit, setPUnit] = useState<'Piece' | 'Kg' | 'Litre' | 'Pack' | 'Box' | 'Dozen' | 'Other'>('Piece');
  const [pCost, setPCost] = useState(0);
  const [pPrice, setPPrice] = useState(0);
  const [pStock, setPStock] = useState(0);
  const [pReorder, setPReorder] = useState(5);
  const [pSupplier, setPSupplier] = useState('');

  // Transfer Modals
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTargetBranch, setTransferTargetBranch] = useState('');
  const [transferItemIdx, setTransferItemIdx] = useState('');
  const [transferQty, setTransferQty] = useState(1);

  // CSV State
  const [isCsvPreviewOpen, setIsCsvPreviewOpen] = useState(false);
  const [parsedCsvRows, setParsedCsvRows] = useState<any[]>([]);

  const loadData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const pSnap = await getDocs(collection(db, `businesses/${business.id}/inventory`));
      setItems(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));

      const bSnap = await getDocs(collection(db, `businesses/${business.id}/branches`));
      setBranches(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch)));

      const tSnap = await getDocs(collection(db, `businesses/${business.id}/stockTransfers`));
      setTransfers(tSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockTransfer)));
    } catch (e) {
      console.warn('Inventory loading error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const handleGenerateSKU = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = pName ? pName.substring(0, 3).toUpperCase() : 'BY';
    setPSku(`${prefix}-${randomNum}`);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setPName('');
    setPSku('');
    setPCategory('General');
    setPUnit('Piece');
    setPCost(0);
    setPPrice(0);
    setPStock(10);
    setPReorder(5);
    setPSupplier('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setPName(item.name);
    setPSku(item.sku);
    setPCategory(item.category);
    setPUnit(item.unitOfMeasure);
    setPCost(item.costPrice);
    setPPrice(item.sellingPrice);
    setPStock(item.stock);
    setPReorder(item.reorderLevel);
    setPSupplier(item.supplierName || '');
    setIsFormOpen(true);
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !user) return;

    const itemId = editingItem ? editingItem.id : `item_${Date.now()}`;
    const itemPayload = {
      name: pName.trim(),
      sku: pSku.toUpperCase().trim() || `SKU-${Date.now()}`,
      category: pCategory.trim(),
      unitOfMeasure: pUnit,
      costPrice: Number(pCost),
      sellingPrice: Number(pPrice),
      stock: Number(pStock),
      reorderLevel: Number(pReorder),
      supplierName: pSupplier.trim(),
      createdBy: user.uid,
      updatedAt: new Date().toISOString()
    };

    try {
      if (!editingItem) {
        // Create full fields including createdAt
        await setDoc(doc(db, `businesses/${business.id}/inventory`, itemId), {
          ...itemPayload,
          createdAt: new Date().toISOString()
        });
      } else {
        await updateDoc(doc(db, `businesses/${business.id}/inventory`, itemId), itemPayload);
      }

      await logAudit(
        business.id,
        'INVENTORY_CHANGED',
        'inventory',
        itemId,
        branchId || 'main_hq',
        user.uid,
        profile?.displayName || 'Owner',
        { name: pName, sku: pSku, action: editingItem ? 'edit' : 'create' }
      );

      setIsFormOpen(false);
      loadData();
    } catch (e) {
      alert('Error updating inventory item.');
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    if (!business?.id || !user) return;
    try {
      await deleteDoc(doc(db, `businesses/${business.id}/inventory`, itemId));
      await logAudit(
        business.id,
        'INVENTORY_CHANGED',
        'inventory',
        itemId,
        branchId || 'main_hq',
        user.uid,
        profile?.displayName || 'Owner',
        { name, action: 'delete' }
      );
      loadData();
    } catch (e) {
      alert('Delete failed.');
    }
  };

  // Client side CSV Generator Exporter
  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = ['SKU', 'Name', 'Category', 'StockQty', 'Unit', 'CostValue', 'PriceValue', 'Supplier'];
    const rows = items.map(p => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.stock,
      p.unitOfMeasure,
      p.costPrice,
      p.sellingPrice,
      p.supplierName || 'None'
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Biashara_Inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client side native FileReader CSV Importer
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) return; // headers only or empty

      const rows: any[] = [];
      // Simple Parser: ignore headers
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 4) {
          rows.push({
            sku: parts[0] || `SKU-${Date.now()}-${i}`,
            name: parts[1] ? parts[1].replace(/["']/g, '') : 'Imported Item',
            category: parts[2] || 'Imported',
            stock: parseInt(parts[3], 10) || 0,
            unitOfMeasure: (parts[4] || 'Piece') as any,
            costPrice: parseFloat(parts[5]) || 0,
            sellingPrice: parseFloat(parts[6]) || 0,
            supplierName: parts[7] || ''
          });
        }
      }
      setParsedCsvRows(rows);
      setIsCsvPreviewOpen(true);
    };
    reader.readAsText(file);
  };

  const handleConfirmCSVImport = async () => {
    if (!business?.id || parsedCsvRows.length === 0 || !user) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      for (const row of parsedCsvRows) {
        const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const ref = doc(db, `businesses/${business.id}/inventory`, id);
        batch.set(ref, {
          ...row,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();

      await logAudit(
        business.id,
        'INVENTORY_CHANGED',
        'inventory',
        'csv_import',
        branchId || 'main_hq',
        user.uid,
        profile?.displayName || 'Owner',
        { count: parsedCsvRows.length, action: 'csv_import' }
      );

      alert('CSV Batch Import completed successfully!');
      setIsCsvPreviewOpen(false);
      setParsedCsvRows([]);
      loadData();
    } catch(err) {
      alert('Batch write failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockTransferSubmit = async () => {
    if (!business?.id || !user || !transferTargetBranch || !transferItemIdx || transferQty <= 0) {
      alert('Kindly fill out all transfer fields completely.');
      return;
    }

    const selectedItem = items.find(item => item.id === transferItemIdx);
    if (!selectedItem) return;

    if (selectedItem.stock < transferQty) {
      alert('Requested quantiy exceeds local inventory stock!');
      return;
    }

    const transferId = `transfer_${Date.now()}`;
    const transferPayload = {
      fromBranchId: branchId || 'main_hq',
      toBranchId: transferTargetBranch,
      items: [{
        itemId: selectedItem.id,
        name: selectedItem.name,
        quantity: Number(transferQty)
      }],
      requestedBy: user.uid,
      requestedByName: profile?.displayName || 'Requester',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, `businesses/${business.id}/stockTransfers`, transferId), transferPayload);
      
      // Auto-increase notifications count in the background
      await setDoc(doc(db, 'notifications', `notif_${Date.now()}`), {
        businessId: business.id,
        targetUserId: 'all', // Broad alert for branches
        type: 'STOCK_TRANSFER_REQUEST',
        message: `Pending Stock Transfer request for "${selectedItem.name}" (Qty: ${transferQty}) transfer.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      alert('Stock Transfer Request Published!');
      setIsTransferOpen(false);
      loadData();
    } catch(e) {
      alert('Transfer write failure.');
    }
  };

  const handleResolveTransfer = async (transfer: StockTransfer, action: 'approved' | 'rejected') => {
    if (!business?.id || !user) return;
    try {
      await runTransaction(db, async (transaction) => {
        const transRef = doc(db, `businesses/${business.id}/stockTransfers`, transfer.id);
        
        if (action === 'rejected') {
          transaction.update(transRef, { 
            status: 'rejected',
            resolvedAt: new Date().toISOString(),
            approvedBy: user.uid 
          });
          return;
        }

        // Action approved: execute atomic transfers and adjust stock
        for (const it of transfer.items) {
          const itemRef = doc(db, `businesses/${business.id}/inventory`, it.itemId);
          const itemSnap = await transaction.get(itemRef);
          if (!itemSnap.exists()) {
            throw new Error(`Item ${it.name} not found in database catalog.`);
          }
          const currentQty = itemSnap.data().stock || 0;
          if (currentQty < it.quantity) {
            throw new Error(`Insufficient stock of ${it.name} to complete transfer.`);
          }

          transaction.update(itemRef, {
            stock: currentQty - it.quantity,
            updatedAt: new Date().toISOString()
          });
          
          // Note: In a multi-tenant real architecture, you can insert/increment stock in the destination as well!
        }

        transaction.update(transRef, { 
          status: 'approved',
          resolvedAt: new Date().toISOString(),
          approvedBy: user.uid 
        });
      });

      alert(`Stock Transfer request ${action} successfully!`);
      loadData();
    } catch(err: any) {
      alert(`Approval transaction aborted: ${err.message}`);
    }
  };

  const filteredItems = items.filter(p => {
    const s = searchQuery.toLowerCase();
    const matchesQuery = p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(items.map(p => p.category)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-5 rounded-none border border-[#1C1C1E]">
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold font-mono">
          <button 
            onClick={handleOpenCreate}
            className="px-4 py-3 bg-[#C5A059] border border-[#C5A059] text-black font-semibold rounded-none flex items-center gap-1.5 cursor-pointer hover:bg-transparent hover:text-[#C5A059] transition-all uppercase tracking-wider"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Product
          </button>
          
          <button 
            onClick={() => setIsTransferOpen(true)}
            className="px-4 py-3 bg-black/40 border border-stone-800 hover:border-[#C5A059] text-stone-300 rounded-none flex items-center gap-1.5 cursor-pointer uppercase tracking-wider transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#C5A059]" />
            Request Stock Transfer
          </button>

          <button 
            onClick={handleExportCSV}
            className="px-4 py-3 bg-black/40 border border-stone-800 hover:border-[#C5A059] text-stone-400 rounded-none flex items-center gap-1.5 cursor-pointer uppercase tracking-wider transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <label className="px-4 py-3 bg-black/40 border border-stone-800 hover:border-[#C5A059] text-stone-400 rounded-none flex items-center gap-1.5 cursor-pointer uppercase tracking-wider transition-all">
            <FileSpreadsheet className="w-4 h-4" />
            Import CSV
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCSVUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* Directory filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 glass border border-[#1C1C1E] p-4 rounded-none font-mono">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-stone-600" />
          <input 
            type="text" 
            placeholder="Search catalog by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none pl-9 pr-4 py-3 text-[10px] text-white outline-none placeholder-stone-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none px-3 py-3 text-[10px] text-white outline-none cursor-pointer"
          >
            <option value="All" className="bg-stone-900">All Categories</option>
            {categories.filter(c => c !== 'All').map((cat, idx) => (
              <option key={idx} value={cat} className="bg-stone-900">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products table grid */}
      <div className="bg-[#0F0F10] border border-stone-850 rounded-none overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px] font-sans">
            <thead>
              <tr className="border-b border-stone-800 bg-[#0C0C0D] text-[#C5A059] font-mono tracking-wider uppercase">
                <th className="p-4 text-[10px]">SKU</th>
                <th className="p-4 text-[10px]">Name</th>
                <th className="p-4 text-[10px]">Category</th>
                <th className="p-4 text-[10px]">Stock Status</th>
                <th className="p-4 text-[10px]">Unit</th>
                <th className="p-4 text-[10px]">Cost Price</th>
                <th className="p-4 text-[10px]">Selling Price</th>
                <th className="p-4 text-[10px]">Supplier</th>
                <th className="p-4 text-right text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-850/30">
              {filteredItems.map((item, idx) => {
                const isOutOfStock = item.stock === 0;
                const isLowStock = item.stock <= item.reorderLevel;

                return (
                  <tr key={idx} className="hover:bg-stone-900/30 transition-colors">
                    <td className="p-4 font-mono text-zinc-400 capitalize">{item.sku}</td>
                    <td className="p-4 font-medium text-white">{item.name}</td>
                    <td className="p-4 text-[#C5A059]/80 font-mono text-[9px] uppercase tracking-wider">{item.category}</td>
                    <td className="p-4 text-[10px]">
                      {isOutOfStock ? (
                        <span className="px-2 py-1 bg-red-950/20 text-red-400 border border-red-900/40 rounded-none font-mono text-[9px] uppercase tracking-wider">OUT OF STOCK (0)</span>
                      ) : isLowStock ? (
                        <span className="px-2 py-1 bg-amber-950/20 text-amber-500 border border-amber-900/40 rounded-none font-mono text-[9px] uppercase tracking-wider">LOW STOCK ({item.stock})</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-950/25 text-emerald-400 border border-emerald-950/30 rounded-none font-mono text-[9px] uppercase tracking-wider">HEALTHY ({item.stock})</span>
                      )}
                    </td>
                    <td className="p-4 text-stone-500 font-mono">{item.unitOfMeasure}</td>
                    <td className="p-4 tabular-nums font-mono">Ksh {item.costPrice.toFixed(1)}</td>
                    <td className="p-4 font-mono font-bold text-[#C5A059] tabular-nums">Ksh {item.sellingPrice.toFixed(1)}</td>
                    <td className="p-4 text-stone-400">{item.supplierName || '-'}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2.5">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-stone-900 border border-stone-800 text-stone-300 hover:border-[#C5A059] hover:text-white rounded-none cursor-pointer transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      <button onClick={() => handleDeleteItem(item.id, item.name)} className="p-1.5 bg-stone-900 border border-stone-800 text-stone-500 hover:border-red-900/40 hover:text-red-400 rounded-none cursor-pointer transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-500 font-mono text-[10px] uppercase tracking-wider">No catalog inventory items found. Add some above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transfer History log block */}
      <div className="bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4">
        <h3 className="font-display font-bold text-sm text-white">Stock Movement Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#0A2540] bg-[#000B1A]/20 text-[#A0B4C8] font-mono">
                <th className="p-3">Transfer Code</th>
                <th className="p-3">Source → Destination</th>
                <th className="p-3">Quantities Items</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Resolution Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2540]/35 font-mono">
              {transfers.map((t, idx) => (
                <tr key={idx} className="hover:bg-[#002040]/15">
                  <td className="p-3">{t.id}</td>
                  <td className="p-3">{t.fromBranchId} → {t.toBranchId}</td>
                  <td className="p-3">
                    {t.items.map((i, id) => (
                      <span key={id}>{i.name} (Qty: {i.quantity})</span>
                    ))}
                  </td>
                  <td className="p-3 text-sky-400">{t.requestedByName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === 'approved' ? 'bg-[#00E676]/10 text-[#00E676]' : t.status === 'pending' ? 'bg-[#FFB300]/10 text-[#FFB300]' : 'bg-[#FF3D57]/10 text-[#FF3D57]'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {t.status === 'pending' && (
                      <div className="flex justify-end gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleResolveTransfer(t, 'approved')}
                          className="px-2 py-1 bg-[#00E676]/10 hover:bg-[#00E676] hover:text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleResolveTransfer(t, 'rejected')}
                          className="px-2 py-1 bg-[#FF3D57]/10 hover:bg-[#FF3D57] hover:text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[#A0B4C8]">No transfer logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: Add / Edit Product */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmitItem} className="w-full max-w-sm bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">
              {editingItem ? 'Edit Product Catalog' : 'Add Product to Inventory'}
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Product Description Name *</label>
                <input 
                  type="text" 
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Unga Wa Dola 2Kg"
                  className="w-full bg-[#000B1A] border border-[#0A2540] focus:border-[#C9A84C] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1 flex justify-between items-center">
                  <span>Product SKU-Code *</span>
                  <button type="button" onClick={handleGenerateSKU} className="text-[#C9A84C] hover:underline font-mono text-[9px]">Generate</button>
                </label>
                <input 
                  type="text" 
                  required
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value)}
                  placeholder="e.g. UNG-1981"
                  className="w-full bg-[#000B1A] border border-[#0A2540] focus:border-[#C9A84C] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Category Group *</label>
                  <input 
                    type="text" 
                    required
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    placeholder="e.g. Maize Flour"
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Unit of Measure</label>
                  <select
                    value={pUnit}
                    onChange={(e: any) => setPUnit(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="Piece">Piece / Packet</option>
                    <option value="Kg">Kilogram (Kg)</option>
                    <option value="Litre">Litre (L)</option>
                    <option value="Pack">Pack</option>
                    <option value="Box">Box / Carton</option>
                    <option value="Dozen">Dozen</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Cost Price (Ksh) *</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    required
                    value={pCost}
                    onChange={(e) => setPCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1 font-bold text-[#C9A84C]">Retail Price (Ksh) *</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Stock Quantity *</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Reorder Level *</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={pReorder}
                    onChange={(e) => setPReorder(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase block mb-1">Supplier Name Entity</label>
                <input 
                  type="text" 
                  value={pSupplier}
                  onChange={(e) => setPSupplier(e.target.value)}
                  placeholder="e.g. Pembe Distributors"
                  className="w-full bg-[#000B1A] border border-[#0A2540] focus:border-[#C9A84C] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-[#0A2540]">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-[#0A2540] hover:bg-[#000B1A] rounded-xl font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: STOCK TRANSFER REQUEST */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Publish Stock Transfer Request</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Target Destination Branch *</label>
                <select
                  value={transferTargetBranch}
                  onChange={(e) => setTransferTargetBranch(e.target.value)}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Select Tawi Branch...</option>
                  {branches.filter(b => b.id !== branchId).map((b, idx) => (
                    <option key={idx} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Product Item *</label>
                <select
                  value={transferItemIdx}
                  onChange={(e) => setTransferItemIdx(e.target.value)}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Select inventory product...</option>
                  {items.map((i, idx) => (
                    <option key={idx} value={i.id}>{i.name} (In Store: {i.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Transfer Qty *</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value, 10)))}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-[#0A2540]">
              <button 
                onClick={() => setIsTransferOpen(false)}
                className="px-4 py-2 border border-[#0A2540] hover:bg-[#000B1A] rounded-xl font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={handleStockTransferSubmit}
                className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
              >
                Publish Transfer Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CSV IMPORT PREVIEW */}
      {isCsvPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white">Preview Batch CSV Import ({parsedCsvRows.length} Items)</h3>
            
            <div className="max-h-[300px] overflow-y-auto border border-[#0A2540] rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#000B1A] text-brand-gold font-mono uppercase tracking-wider text-[10px] border-b border-[#0A2540]">
                    <th className="p-2">SKU</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Cost</th>
                    <th className="p-2">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2540]/30 font-mono">
                  {parsedCsvRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#002040]/30">
                      <td className="p-2">{row.sku}</td>
                      <td className="p-2 text-white font-semibold font-sans">{row.name}</td>
                      <td className="p-2">{row.stock}</td>
                      <td className="p-2">Ksh {row.costPrice}</td>
                      <td className="p-2 text-brand-gold font-bold">Ksh {row.sellingPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => {
                  setIsCsvPreviewOpen(false);
                  setParsedCsvRows([]);
                }}
                className="px-4 py-2 border border-[#0A2540] rounded-xl text-xs text-gray-400"
              >
                Cancel CSV Import
              </button>
              <button 
                onClick={handleConfirmCSVImport}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold rounded-xl text-xs uppercase"
              >
                Write to Firestore Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
