import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Settings, LogOut, ChevronDown, ShoppingBag, Undo, 
  Wallet, Calendar, Award, Activity, FileText, Check, Globe, RefreshCw, 
  Sliders, ShieldAlert, PlusCircle, Trash2, Edit, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, query, where, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { logAudit } from '../utils/auditLogger';
import { createStaffMember } from '../utils/staffCreator';
import { formatCurrency } from '../utils/crypto';

// Sub sections
import POSSection from './POSSection';
import InventorySection from './InventorySection';
import ReportsSection from './ReportsSection';

interface DashboardContainerProps {
  onNavigate: (page: string) => void;
}

export default function DashboardContainer({ onNavigate }: DashboardContainerProps) {
  const { t, locale, setLocale } = useI18n();
  const { user, profile, business, logout, isSuperAdmin, refreshProfile } = useAuth();

  // Navigation Panel Tab State
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Lists & Operations state
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Active Branch select (Only Owner can switch branches for global reporting)
  const [activeBranchId, setActiveBranchId] = useState<string>(profile?.branchId || 'main_hq');

  // New item modal triggers
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Form Fields State
  // Expense
  const [expAmt, setExpAmt] = useState(0);
  const [expCat, setExpCat] = useState('Rent');
  const [expDesc, setExpDesc] = useState('');

  // Branch
  const [branchName, setBranchName] = useState('');
  const [branchLoc, setBranchLoc] = useState('');

  // Staff Creators
  const [staffUser, setStaffUser] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [staffRole, setStaffRole] = useState<'BranchManager' | 'Salesperson' | 'Cashier' | 'StockController'>('Salesperson');

  // Shifts state
  const [shiftFloat, setShiftFloat] = useState(2000); // 2000 Ksh standard opening float

  // Receipt customization template
  const [customRecName, setCustomRecName] = useState(business?.receiptConfig?.businessName || business?.name || '');
  const [customRecTagline, setCustomRecTagline] = useState(business?.receiptConfig?.tagline || 'Thank you!');
  const [customRecFoot, setCustomRecFoot] = useState(business?.receiptConfig?.footerMessage || 'Welcome again!');

  // Sync Offline Queue helper
  const syncOfflineQueue = async () => {
    if (!navigator.onLine || !business?.id) return;
    try {
      const q = JSON.parse(localStorage.getItem('byako_offline_sales') || '[]');
      if (q.length === 0) return;

      setLoading(true);
      for (const sale of q) {
        // Post queued sale to Firestore
        const id = `sale_offline_${Date.now()}_${Math.random().toString(36).substring(2,5)}`;
        await setDoc(doc(db, `businesses/${business.id}/sales`, id), {
          ...sale,
          syncedAt: new Date().toISOString()
        });
      }
      localStorage.removeItem('byako_offline_sales');
      alert('Offline cached sales synchronized successfully!');
      loadData();
    } catch (e) {
      console.warn('Queue Sync failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!business?.id) return;
    try {
      // 1. Sales
      const sSnap = await getDocs(collection(db, `businesses/${business.id}/sales`));
      setSalesHistory(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 2. Expenses
      const eSnap = await getDocs(collection(db, `businesses/${business.id}/expenses`));
      setExpenses(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 3. Branches
      const bSnap = await getDocs(collection(db, `businesses/${business.id}/branches`));
      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 4. Staff via users directory
      const uSnap = await getDocs(query(collection(db, 'users'), where('businessId', '==', business.id)));
      setStaffList(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 5. Shifts logs
      const shSnap = await getDocs(collection(db, `businesses/${business.id}/shifts`));
      setShifts(shSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.warn('Dashboard Load error:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Listeners for network online
    const goOnline = () => { setIsOffline(false); syncOfflineQueue(); };
    const goOffline = () => { setIsOffline(true); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [business?.id]);

  // Handle addition operations
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !user) return;
    setLoading(true);
    try {
      const expId = `exp_${Date.now()}`;
      const payload = {
        amount: Number(expAmt),
        category: expCat,
        description: expDesc.trim(),
        branchId: activeBranchId,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, `businesses/${business.id}/expenses`, expId), payload);
      await logAudit(
        business.id,
        'EXPENSE_LOGGED',
        'expenses',
        expId,
        activeBranchId,
        user.uid,
        profile?.displayName || 'Owner',
        { amount: expAmt, category: expCat }
      );

      setIsExpenseModalOpen(false);
      setExpAmt(0);
      setExpDesc('');
      loadData();
    } catch (err) {
      alert('Failed saving expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !user) return;
    
    // Check Branch privileges quota limit
    const maxBranches = business.privileges?.maxBranches || 3;
    if (branches.length >= maxBranches) {
      alert(`Limit met! Your current subscription limits branch registrations to a maximum of ${maxBranches} locations.`);
      return;
    }

    setLoading(true);
    try {
      const bId = `branch_${Date.now()}`;
      await setDoc(doc(db, `businesses/${business.id}/branches`, bId), {
        name: branchName.trim(),
        location: branchLoc.trim(),
        active: true,
        createdAt: new Date().toISOString()
      });

      await logAudit(
        business.id,
        'BRANCH_MODIFIED',
        'branches',
        bId,
        activeBranchId,
        user.uid,
        profile?.displayName || 'Owner',
        { name: branchName, action: 'add' }
      );

      setIsBranchModalOpen(false);
      setBranchName('');
      setBranchLoc('');
      loadData();
    } catch (err) {
      alert('Error saving branch.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaffAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !user) return;

    setLoading(true);
    try {
      // Create staff credentials using context helper
      const staffUid = await createStaffMember(
        staffUser.trim() + ' Account',
        staffUser.trim().toLowerCase(),
        staffPass.trim(),
        staffRole,
        activeBranchId,
        business.id,
        user.uid,
        profile?.displayName || 'Owner'
      );

      await logAudit(
        business.id,
        'STAFF_MODIFIED',
        'users',
        staffUid,
        activeBranchId,
        user.uid,
        profile?.displayName || 'Owner',
        { username: staffUser, role: staffRole }
      );

      alert('Staff accounts successfully instantiated on Firebase Authenticated node!');
      setIsStaffModalOpen(false);
      setStaffUser('');
      setStaffPass('');
      loadData();
    } catch (err: any) {
      alert(`Staff Creation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffStatus = async (staff: any) => {
    if (!business?.id || !user) return;
    const nextStatus = !staff.isActive;
    try {
      await updateDoc(doc(db, 'users', staff.id), { isActive: nextStatus });
      loadData();
    } catch (e) {
      alert('Failed to toggle staff status.');
    }
  };

  const handleOpenShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !user) return;
    setLoading(true);
    try {
      const shiftId = `shift_${Date.now()}`;
      await setDoc(doc(db, `businesses/${business.id}/shifts`, shiftId), {
        branchId: activeBranchId,
        createdBy: user.uid,
        createdByName: profile?.displayName || 'Cashier',
        openingFloat: Number(shiftFloat),
        actualSales: 0,
        actualCash: 0,
        variance: 0,
        status: 'open',
        createdAt: new Date().toISOString()
      });

      alert('Shift Cash Drawer opened successfully! POS Terminal matches active float.');
      setIsShiftModalOpen(false);
      loadData();
    } catch (e) {
      alert('Error opening register shift.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (shift: any) => {
    const inputCashStr = prompt(`Closing Register Shift drawer. Enter Actual Cash count value in drawer (Ksh):`);
    if (inputCashStr === null) return;
    
    const actualCash = parseFloat(inputCashStr) || 0;
    const expectedCash = shift.openingFloat + (shift.actualSales || 0);
    const variance = actualCash - expectedCash;

    try {
      await updateDoc(doc(db, `businesses/${business.id}/shifts`, shift.id), {
        actualCash,
        variance,
        status: 'closed',
        closedAt: new Date().toISOString()
      });
      alert(`Shift resolved! Expected: ${expectedCash} Ksh, Actual Entered: ${actualCash} Ksh. Variance: ${variance} Ksh.`);
      loadData();
    } catch (e) {
      alert('Error closing register shift.');
    }
  };

  const handleUpdateReceiptConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    try {
      await updateDoc(doc(db, 'businesses', business.id), {
        receiptConfig: {
          businessName: customRecName.trim(),
          tagline: customRecTagline.trim(),
          contactInfo: `Branch Location: ${activeBranchId}`,
          footerMessage: customRecFoot.trim()
        }
      });
      alert('Receipt print layouts successfully synchronized with database!');
      refreshProfile();
    } catch (err) {
      alert('Receipt config override failed.');
    }
  };

  const handleExecuteRefund = async (sale: any) => {
    if (!confirm('Refund transaction? This reverses stock deduction and logs an audit trail.')) return;
    if (!business?.id || !user) return;
    try {
      await runTransaction(db, async (trans) => {
        const saleRef = doc(db, `businesses/${business.id}/sales`, sale.id);
        
        // Loop through item array to rollback stock values
        for (const item of sale.items) {
          const itemRef = doc(db, `businesses/${business.id}/inventory`, item.itemId);
          const iSnap = await trans.get(itemRef);
          if (iSnap.exists()) {
            const currentStock = iSnap.data().stock || 0;
            trans.update(itemRef, { stock: currentStock + item.quantity });
          }
        }
        trans.update(saleRef, { status: 'refunded' });
      });

      await logAudit(
        business.id,
        'INVENTORY_ROLLBACK',
        'sales',
        sale.id,
        activeBranchId,
        user.uid,
        profile?.displayName || 'Owner',
        { refundTotal: sale.total }
      );

      alert('Sale transaction refunded. Quantities rolled back to inventory.');
      loadData();
    } catch (e) {
      alert('Refund processing failure.');
    }
  };

  // Roles verification logic flags
  const isOwner = profile?.role === 'Owner';
  const isManager = profile?.role === 'BranchManager';
  const isCashier = profile?.role === 'Cashier' || profile?.role === 'Salesperson';
  const isStockController = profile?.role === 'StockController';

  // Toggle Swahili language workflow
  const toggleSwahiliLocale = () => {
    setLocale(locale === 'en' ? 'sw' : 'en');
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white flex flex-col md:flex-row font-sans">
      
      {/* 1. Responsively structured Dashboard Sidebar (Desktop) */}
      <aside className="w-full md:w-64 bg-[#0F0F10] border-r border-stone-850 flex flex-col shrink-0">
        
        {/* Branch / Business identifier header */}
        <div className="p-6 border-b border-stone-850">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 border border-[#C5A059] bg-[#161618] flex items-center justify-center font-bold text-[#C5A059]">
              B
            </div>
            <h2 className="serif text-base font-light tracking-wide text-white uppercase">{business?.name}</h2>
          </div>
          <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest font-normal block">{profile?.role}</p>
        </div>

        {/* Global offline status indicator banner */}
        {isOffline && (
          <div className="bg-amber-950/20 border-b border-stone-850 text-[#C5A059] px-4 py-2.5 text-[9px] uppercase font-mono tracking-widest text-center">
            ● OFFLINE MODE COMPATIBLE
          </div>
        )}

        {/* Sidebar Nav anchors */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto max-h-[480px]">
          
          {(isOwner || isManager || isCashier) && (
            <button 
              onClick={() => setActiveTab('pos')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'pos' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {t('posTerminal')}
            </button>
          )}

          {(isOwner || isManager || isStockController) && (
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'inventory' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              {t('inventory')}
            </button>
          )}

          {(isOwner || isManager || isCashier) && (
            <button 
              onClick={() => setActiveTab('sales_history')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'sales_history' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <FileText className="w-4 h-4" />
              Mauzo (Sales Ledger)
            </button>
          )}

          {(isOwner || isManager) && (
            <button 
              onClick={() => setActiveTab('expenses')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'expenses' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Gharama (Expenses)
            </button>
          )}

          {(isOwner || isManager) && (
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'reports' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Activity className="w-4 h-4" />
              {t('reports')}
            </button>
          )}

          {(isOwner) && (
            <button 
              onClick={() => setActiveTab('branches')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'branches' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Matawi (Branches)
            </button>
          )}

          {(isOwner || isManager) && (
            <button 
              onClick={() => setActiveTab('shifts')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'shifts' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calculated Shifts
            </button>
          )}

          {(isOwner || isManager) && (
            <button 
              onClick={() => setActiveTab('staff')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'staff' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Users className="w-4 h-4" />
              Wafanyakazi (Staff)
            </button>
          )}

          {(isOwner || isManager) && (
            <button 
              onClick={() => setActiveTab('receipt_editor')}
              className={`w-full text-left px-4 py-3 rounded-none text-[10px] uppercase font-mono tracking-wider font-semibold transition-all flex items-center gap-3 ${
                activeTab === 'receipt_editor' ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white hover:bg-[#161618]'
              }`}
            >
              <Settings className="w-4 h-4" />
              Receipt Printer Layouts
            </button>
          )}

        </nav>

        {/* Locale language selector and Logout buttons */}
        <div className="p-4 border-t border-stone-850 space-y-2">
          <button 
            onClick={toggleSwahiliLocale}
            className="w-full py-2.5 bg-black/30 border border-stone-850 hover:border-[#C5A059] text-[9px] uppercase tracking-wider font-mono text-stone-300 rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
            Locale: {locale === 'en' ? 'English (En)' : 'Swahili (Sw)'}
          </button>

          {isSuperAdmin() && (
            <button
              onClick={() => onNavigate('super_admin')}
              className="w-full py-2.5 bg-cyan-950/30 border border-cyan-900/40 hover:border-cyan-400 text-cyan-400 text-[9px] uppercase tracking-wider font-mono rounded-none transition-all cursor-pointer"
            >
              ← SuperAdmin Panel
            </button>
          )}

          <button 
            onClick={logout}
            className="w-full py-2.5 bg-[#1C1C1E]/50 border border-stone-800 text-stone-400 hover:text-red-400 hover:border-red-950/80 rounded-none text-[9px] uppercase tracking-wider font-mono flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-500" />
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* 2. Main screen center elements container */}
      <main className="flex-1 p-6 md:p-8 max-h-screen overflow-y-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-stone-850">
          <div>
            <h1 className="serif text-3xl font-light text-white tracking-wide uppercase">
              {activeTab === 'pos' && t('posTerminal')}
              {activeTab === 'inventory' && t('inventory')}
              {activeTab === 'sales_history' && 'Sales ledger Log history'}
              {activeTab === 'expenses' && 'Gharama Log ledger'}
              {activeTab === 'reports' && t('reports')}
              {activeTab === 'branches' && 'Manage business multi-branches'}
              {activeTab === 'shifts' && 'Shift Cash Drawer management'}
              {activeTab === 'staff' && 'Merchant Staff administration'}
              {activeTab === 'receipt_editor' && 'Custom Receipts Layout overrides'}
            </h1>
            <p className="text-[10px] text-stone-500 mt-1.5 font-mono uppercase tracking-widest leading-relaxed">
              OPERATING BRANCH ID: {activeBranchId.toUpperCase()} • LOGGED: {profile?.displayName || 'Merchant'}
            </p>
          </div>

          {/* If Owner: option to dynamically filter/switch reporting branches */}
          {isOwner && branches.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider">Viewing Tawi Branch:</span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-[#0C0C0D] border border-stone-800 focus:border-[#C5A059] px-3 py-2 text-xs font-mono rounded-none text-white outline-none"
              >
                <option value="main_hq">Main HQ Branch (Default)</option>
                {branches.filter(b => b.id !== 'main_hq').map((b, idx) => (
                  <option key={idx} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* 3. Dynamic sub content display */}
        {activeTab === 'pos' && (
          <POSSection branchId={activeBranchId} isOffline={isOffline} />
        )}

        {activeTab === 'inventory' && (
          <InventorySection branchId={activeBranchId} />
        )}

        {activeTab === 'reports' && (
          <ReportsSection />
        )}

        {activeTab === 'sales_history' && (
          <div className="space-y-6">
            <h3 className="font-display font-bold text-sm text-white">Full Transaction Audit Log list</h3>
            <div className="bg-[#001529] border border-[#0A2540] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#0A2540] bg-[#000B1A]/40 text-[#C9A84C] font-mono">
                      <th className="p-4">RECEIPT ID</th>
                      <th className="p-4">TIMESTAMP</th>
                      <th className="p-4">PAYMENT MODE</th>
                      <th className="p-4">PERFORMED BY</th>
                      <th className="p-4">AGGREGATE AMOUNT</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">RESOLUTION ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2540]/30 font-mono">
                    {salesHistory
                      .filter(sh => sh.branchId === activeBranchId)
                      .map((sh, idx) => (
                        <tr key={idx} className="hover:bg-[#002040]/15">
                          <td className="p-4 text-gray-300 font-bold">{sh.id}</td>
                          <td className="p-4 text-gray-400">{new Date(sh.createdAt).toLocaleString()}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-[#002040] text-[#00C2FF] font-bold text-[10px] uppercase">
                              {sh.paymentMethod}
                            </span>
                          </td>
                          <td className="p-4 text-[#A0B4C8] font-sans">{sh.createdByName}</td>
                          <td className="p-4 font-bold text-white">Ksh {sh.total.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sh.status === 'completed' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-[#FF3D57]/10 text-[#FF3D57]'
                            }`}>
                              {sh.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {sh.status === 'completed' && (isOwner || isManager) && (
                              <button
                                onClick={() => handleExecuteRefund(sh)}
                                className="px-2.5 py-1.5 bg-[#FF3D57]/10 hover:bg-[#FF3D57] hover:text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Refund (Daud)
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {salesHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#A0B4C8]">No transaction records found inside target branch logic.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#001529] p-4 rounded-xl border border-[#0A2540]">
              <p className="text-xs font-semibold text-[#A0B4C8]">Log and audit branch operating expenses</p>
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-4 py-2 bg-[#C9A84C] text-[#000B1A] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                Log New Expense
              </button>
            </div>

            <div className="bg-[#001529] border border-[#0A2540] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#0A2540] bg-[#000B1A]/40 text-[#C9A84C] font-mono">
                      <th className="p-4">TIMESTAMP</th>
                      <th className="p-4">CATEGORY CODE</th>
                      <th className="p-4">DESCRIPTION PREAMBLE</th>
                      <th className="p-4">AMOUNT (KSH)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2540]/30 font-mono">
                    {expenses
                      .filter(e => e.branchId === activeBranchId)
                      .map((exp, idx) => (
                        <tr key={idx} className="hover:bg-[#002040]/15">
                          <td className="p-4 text-gray-400">{new Date(exp.createdAt).toLocaleString()}</td>
                          <td className="p-4 text-white font-bold">{exp.category}</td>
                          <td className="p-4 font-sans text-[#A0B4C8] truncate max-w-xs">{exp.description}</td>
                          <td className="p-4 text-[#FF3D57] font-bold tabular-nums">Ksh {exp.amount.toFixed(1)}</td>
                        </tr>
                      ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-[#A0B4C8]">No registered expenses ledger details found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#001529] p-4 rounded-xl border border-[#0A2540]">
              <p className="text-xs font-semibold text-[#A0B4C8]">Multi-branches database nodes register</p>
              <button 
                onClick={() => setIsBranchModalOpen(true)}
                className="px-4 py-2 bg-[#C9A84C] text-[#000B1A] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                Register New Branch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {branches.map((b, idx) => (
                <div key={idx} className="bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#002040] flex items-center justify-center text-[#C9A84C]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white leading-tight">{b.name}</h4>
                    <p className="text-xs text-[#A0B4C8] mt-1 font-mono">{b.location}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#00E676]/10 text-[#00E676] rounded-full">ACTIVE NODE</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#001529] p-4 rounded-xl border border-[#0A2540]">
              <p className="text-xs font-semibold text-[#A0B4C8]">Cash drawer shift audits and variance tracing</p>
              <button 
                onClick={() => setIsShiftModalOpen(true)}
                className="px-4 py-2 bg-[#C9A84C] text-[#000B1A] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                Open Register Session Shift
              </button>
            </div>

            <div className="bg-[#001529] border border-[#0A2540] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#0A2540] bg-[#000B1A]/40 text-[#C9A84C] font-mono">
                      <th className="p-4">SESSION CODE</th>
                      <th className="p-4">CREATED BY</th>
                      <th className="p-4">OPENING FLOAT</th>
                      <th className="p-4">RECORDED SALES</th>
                      <th className="p-4">VARIANCE STATUS</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">RESOLUTION ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2540]/30 font-mono">
                    {shifts
                      .filter(sh => sh.branchId === activeBranchId)
                      .map((sh, idx) => (
                        <tr key={idx} className="hover:bg-[#002040]/15">
                          <td className="p-4">{sh.id}</td>
                          <td className="p-4 text-sky-400 font-sans">{sh.createdByName}</td>
                          <td className="p-4">Ksh {sh.openingFloat}</td>
                          <td className="p-4 font-semibold text-white">Ksh {sh.actualSales || 0}</td>
                          <td className={`p-4 font-bold ${sh.variance >= 0 ? 'text-[#00E676]' : 'text-[#FF3D57]'}`}>
                            {sh.status === 'open' ? 'In progress' : `Ksh ${sh.variance.toFixed(1)}`}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sh.status === 'open' ? 'bg-[#FFB300]/10 text-[#FFB300]' : 'bg-gray-800 text-gray-400'
                            }`}>
                              {sh.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {sh.status === 'open' && (
                              <button
                                onClick={() => handleCloseShift(sh)}
                                className="px-2 py-1 bg-[#FF3D57]/10 hover:bg-[#FF3D57] hover:text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Close Shift
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {shifts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#A0B4C8]">No register sessions tracked yet inside current branch details.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#001529] p-4 rounded-xl border border-[#0A2540]">
              <p className="text-xs font-semibold text-[#A0B4C8]">Merchant credentials registration and security controls</p>
              <button 
                onClick={() => setIsStaffModalOpen(true)}
                className="px-4 py-2 bg-[#C9A84C] text-[#000B1A] font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                Register Staff Account
              </button>
            </div>

            <div className="bg-[#001529] border border-[#0A2540] rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#0A2540] bg-[#000B1A]/40 text-[#C9A84C] font-mono">
                      <th className="p-4">STAFF USERNAME</th>
                      <th className="p-4">TAWI BRANCH ID</th>
                      <th className="p-4">ASSIGNED ROLE</th>
                      <th className="p-4">LOGIN TIMEOUTS LIMITS</th>
                      <th className="p-4">ACCOUNT STATUS</th>
                      <th className="p-4 text-right font-semibold">RESOLUTION ACTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A2540]/30 font-mono">
                    {staffList.map((st, idx) => (
                      <tr key={idx} className="hover:bg-[#002040]/15">
                        <td className="p-4 text-white font-bold font-sans">{st.displayName}</td>
                        <td className="p-4 text-[#A0B4C8]">{st.branchId || 'main_hq'}</td>
                        <td className="p-4 text-sky-400 font-sans">{st.role}</td>
                        <td className="p-4 text-gray-400">15 Mins idle lock</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            st.isActive !== false ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-[#FF3D57]/10 text-[#FF3D57]'
                          }`}>
                            {st.isActive !== false ? 'Active' : 'Locked out / Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleStaffStatus(st)}
                            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              st.isActive !== false ? 'bg-[#FF3D57]/10 text-[#FF3D57]' : 'bg-[#00E676]/10 text-[#00E676]'
                            }`}
                          >
                            {st.isActive !== false ? 'Toggle Suspend' : 'Enable Account'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'receipt_editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#001529] border border-[#0A2540] p-6 rounded-2xl h-fit">
              <h3 className="font-display font-bold text-sm text-white mb-4">Print layouts settings</h3>
              <form onSubmit={handleUpdateReceiptConfig} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-gray-400 block mb-1">Receipt Header Brand *</label>
                  <input 
                    type="text" 
                    required
                    value={customRecName}
                    onChange={(e) => setCustomRecName(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-gray-400 block mb-1">Brand Tagline *</label>
                  <input 
                    type="text" 
                    required
                    value={customRecTagline}
                    onChange={(e) => setCustomRecTagline(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-gray-400 block mb-1">Receipt Footer Message *</label>
                  <input 
                    type="text" 
                    required
                    value={customRecFoot}
                    onChange={(e) => setCustomRecFoot(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl text-xs uppercase cursor-pointer"
                >
                  Save Receipt Settings
                </button>
              </form>
            </div>

            {/* Receipt visual template mockup */}
            <div className="bg-white text-black p-6 rounded-2xl border border-gray-300 font-mono text-xs w-full max-w-sm mx-auto shadow-2xl relative">
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-gray-100 text-[8px] text-gray-500 font-sans font-bold border">VISUAL TEMPLATE PREVIEW</div>
              <div className="space-y-3 text-center border-b border-dashed border-gray-300 pb-3 pt-6">
                <h4 className="font-bold text-sm uppercase">{customRecName || 'BIASHARA CORP'}</h4>
                <p className="text-[11px] text-gray-500 leading-tight">{customRecTagline || 'Serving you with smart POS'}</p>
                <p className="text-[9px] text-gray-500">Branch Loc: {activeBranchId.toUpperCase()}</p>
              </div>
              
              <div className="space-y-2 py-4 text-left border-b border-dashed border-gray-300">
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Standard 2Kg Flour</span>
                  <span>Ksh 180.00</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Maji Kitale 1L</span>
                  <span>Ksh 60.00</span>
                </div>
              </div>

              <div className="pt-3 uppercase text-[10px] text-gray-500 text-center">
                {customRecFoot || 'Welcome again!'}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FORM MODAL: Log expenses */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleLogExpense} className="w-full max-w-sm bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Log Operating Expense</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Expense Amount (Ksh) *</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={expAmt}
                  onChange={(e) => setExpAmt(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Expense Category *</label>
                <select
                  value={expCat}
                  onChange={(e) => setExpCat(e.target.value)}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Inventory purchase">Inventory Purchase</option>
                  <option value="Utilities">Water / Electricity Utilities</option>
                  <option value="Marketing">Marketing / Branding</option>
                  <option value="Transport">Transport / Logistics</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Description / Particulars *</label>
                <textarea
                  required
                  rows={3}
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g. Purchased cleaning items for kitale store branch"
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-[#0A2540]">
              <button 
                type="button" 
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 border border-[#0A2540] hover:bg-[#000B1A] rounded-xl font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
              >
                Log Ledger Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORM MODAL: Create Multi-branch */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateBranch} className="w-full max-w-sm bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Register Multi-branch (Tawi Node)</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Tawi Branch Name *</label>
                <input 
                  type="text" 
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Westlands Bypass Store"
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">City / Region Location *</label>
                <input 
                  type="text" 
                  required
                  value={branchLoc}
                  onChange={(e) => setBranchLoc(e.target.value)}
                  placeholder="e.g. Ring Road, Nairobi"
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-[#0A2540]">
              <button 
                type="button" 
                onClick={() => setIsBranchModalOpen(false)}
                className="px-4 py-2 border border-[#0A2540] hover:bg-[#000B1A] rounded-xl font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
              >
                Assemble Branch Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORM MODAL: Register staff member credentials */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleAddStaffAccount} className="w-full max-w-sm bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Register Staff Credentials Account</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Assigned Username *</label>
                <input 
                  type="text" 
                  required
                  value={staffUser}
                  onChange={(e) => setStaffUser(e.target.value)}
                  placeholder="e.g. mutua_cashier"
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Access Password *</label>
                <input 
                  type="password" 
                  required
                  value={staffPass}
                  onChange={(e) => setStaffPass(e.target.value)}
                  placeholder="e.g. cashier123"
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">System Privileges Role *</label>
                <select
                  value={staffRole}
                  onChange={(e: any) => setStaffRole(e.target.value)}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="BranchManager">Branch Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Salesperson">Salesperson</option>
                  <option value="StockController">Stock Controller</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-[#0A2540]">
              <button 
                type="button" 
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 border border-[#0A2540] hover:bg-[#000B1A] rounded-xl font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
              >
                Commit Credentials
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FORM MODAL: Open register shift */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form onSubmit={handleOpenShiftSubmit} className="w-full max-w-sm bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
            <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Open Cash Drawer Shift Session</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 block mb-1">Opening Cash Float amount (Ksh) *</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={shiftFloat}
                  onChange={(e) => setShiftFloat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-[#0A2540]">
              <button 
                type="button" 
                onClick={() => setIsShiftModalOpen(false)}
                className="px-4 py-2 border border-[#0A2540] hover:bg-[#000B1A] rounded-xl font-bold text-gray-400"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
              >
                Start Shift Register
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
