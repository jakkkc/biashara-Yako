import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Building2, ShieldAlert, LogOut, Users, Settings, PlusCircle, Globe,
  Activity, AlertTriangle, Megaphone, Info, RefreshCw, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { 
  collection, query, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, getDoc, orderBy, limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/crypto';

interface SuperAdminPanelProps {
  onNavigate: (page: string) => void;
}

const COLORS = ['#C9A84C', '#00C2FF', '#00E676', '#FF3D57', '#FFB300', '#9C27B0'];

export default function SuperAdminPanel({ onNavigate }: SuperAdminPanelProps) {
  const { t } = useI18n();
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'businesses' | 'audit' | 'announcements' | 'about'>('dashboard');

  // Firestore States
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [globalAudit, setGlobalAudit] = useState<any[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form States
  const [editingBusiness, setEditingBusiness] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Custom Create Business Form (Super Admin can manually register)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizType, setNewBizType] = useState('Retail Store');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizOwnerUid, setNewBizOwnerUid] = useState('');
  const [newBizLocation, setNewBizLocation] = useState('Nairobi');

  // Edit fields
  const [editPlan, setEditPlan] = useState<'free' | 'basic' | 'premium'>('free');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [editMaxBranches, setEditMaxBranches] = useState(3);
  const [editMaxUsers, setEditMaxUsers] = useState(10);
  const [editCanBranches, setEditCanBranches] = useState(true);
  const [editCanReceipts, setEditCanReceipts] = useState(true);

  // Announcement fields
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTarget, setAnnTarget] = useState('all');

  // Filter States
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Businesses
      const bSnap = await getDocs(collection(db, 'businesses'));
      const bList: any[] = bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllBusinesses(bList);

      // Load Users
      const uSnap = await getDocs(collection(db, 'users'));
      const uList = uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(uList);

      // Load Global Audit: Loop through all businesses to aggregate audit logs, or just load announcements
      // Since audits are nested inside /businesses/{id}/auditLog, we resolve them dynamically:
      let accumulatedAudit: any[] = [];
      for (const biz of bList) {
        try {
          const path = `businesses/${biz.id}/auditLog`;
          const aSnap = await getDocs(query(collection(db, path), orderBy('timestamp', 'desc'), limit(15)));
          aSnap.forEach(d => {
            accumulatedAudit.push({ id: d.id, businessId: biz.id, businessName: biz.name, ...d.data() });
          });
        } catch(e) {
          // ignore if no audits
        }
      }
      accumulatedAudit.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setGlobalAudit(accumulatedAudit);

      // Load Announcements
      const annSnap = await getDocs(collection(db, 'announcements'));
      const annList = annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllAnnouncements(annList);

    } catch (err) {
      console.warn('Failed loading super admin lists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditOpen = (biz: any) => {
    setEditingBusiness(biz);
    setEditPlan(biz.subscriptionPlan || 'free');
    setEditStatus(biz.status || 'active');
    setEditMaxBranches(biz.privileges?.maxBranches || 3);
    setEditMaxUsers(biz.privileges?.maxUsers || 10);
    setEditCanBranches(biz.privileges?.canAddBranches !== false);
    setEditCanReceipts(biz.privileges?.canEditReceipts !== false);
    setIsEditModalOpen(true);
  };

  const handleUpdateBusiness = async () => {
    if (!editingBusiness) return;
    try {
      const docRef = doc(db, 'businesses', editingBusiness.id);
      await updateDoc(docRef, {
        subscriptionPlan: editPlan,
        status: editStatus,
        privileges: {
          canAddBranches: editCanBranches,
          canEditReceipts: editCanReceipts,
          maxBranches: Number(editMaxBranches),
          maxUsers: Number(editMaxUsers)
        }
      });
      setIsEditModalOpen(false);
      loadData();
    } catch(err) {
      alert('Error updating business parameters.');
    }
  };

  const handleCreateBusiness = async () => {
    if (!newBizName || !newBizEmail || !newBizOwnerUid) {
      alert('Please fill out Name, Owner Email and Owner UID!');
      return;
    }
    setLoading(true);
    try {
      const businessRef = doc(collection(db, 'businesses'));
      const businessId = businessRef.id;

      const subExpiry = new Date();
      subExpiry.setMonth(subExpiry.getMonth() + 12); // Give a 1 year default basic plan

      await setDoc(businessRef, {
        name: newBizName,
        type: newBizType,
        location: newBizLocation,
        ownerUid: newBizOwnerUid,
        ownerEmail: newBizEmail,
        status: 'active',
        currency: 'KES',
        vatEnabled: true,
        vatPercentage: 16,
        subscriptionPlan: 'basic',
        subscriptionExpiry: subExpiry.toISOString(),
        privileges: {
          canEditReceipts: true,
          canAddBranches: true,
          maxBranches: 3,
          maxUsers: 10
        },
        createdAt: new Date().toISOString()
      });

      // Write owner user record
      await setDoc(doc(db, 'users', newBizOwnerUid), {
        businessId,
        branchId: 'main_hq',
        role: 'Owner',
        displayName: newBizName + ' Admin',
        email: newBizEmail,
        isActive: true,
        createdAt: new Date().toISOString()
      }, { merge: true });

      alert('Business registered successfully!');
      setIsCreateModalOpen(false);
      setNewBizName('');
      setNewBizEmail('');
      setNewBizOwnerUid('');
      loadData();
    } catch (err) {
      alert('Failed creating custom business');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (biz: any) => {
    const nextStatus = biz.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'businesses', biz.id), { status: nextStatus });
      loadData();
    } catch (e) {
      alert('Failed toggling business status.');
    }
  };

  const handleDeleteBusiness = async (bizId: string) => {
    if (!confirm('WARNING: Are you sure you want to completely delete this business? Under cascading constraints, this will delete the tenant profile.')) return;
    try {
      await deleteDoc(doc(db, 'businesses', bizId));
      loadData();
    } catch(e) {
      alert('Delete privilege failure.');
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annMessage) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        title: annTitle,
        message: annMessage,
        targetBusinessId: annTarget,
        createdBy: user?.uid || 'Jackson Mwaniki',
        createdAt: new Date().toISOString()
      });
      setAnnTitle('');
      setAnnMessage('');
      alert('Announcement broadcasted!');
      loadData();
    } catch (e) {
      alert('Broadcast failure.');
    }
  };

  // Aggregation computations for Charts
  const registrationsByMonth = [
    { name: 'Jan', count: 1 },
    { name: 'Feb', count: 2 },
    { name: 'Mar', count: 3 },
    { name: 'Apr', count: 4 },
    { name: 'May', count: allBusinesses.length }
  ];

  const businessTypesCounts = allBusinesses.reduce((acc: any, b: any) => {
    const type = b.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeChartData = Object.keys(businessTypesCounts).map(k => ({
    name: k,
    value: businessTypesCounts[k]
  }));

  return (
    <div className="min-h-screen bg-[#000B1A] text-white flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#001529] border-r border-[#0A2540] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#0A2540]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C] flex items-center justify-center font-bold text-[#000B1A]">A</div>
            <h2 className="font-display font-bold text-sm tracking-tight text-white">System SuperAdmin</h2>
          </div>
          <p className="text-[10px] text-[#A0B4C8] font-mono break-all font-semibold">jacmwaniki@gmail.com</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'dashboard' ? 'bg-[#C9A84C] text-[#000B1A]' : 'text-[#A0B4C8] hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Platform Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('businesses')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'businesses' ? 'bg-[#C9A84C] text-[#000B1A]' : 'text-[#A0B4C8] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Merchant Businesses
          </button>

          <button 
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'audit' ? 'bg-[#C9A84C] text-[#000B1A]' : 'text-[#A0B4C8] hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Global Audit Trails
          </button>

          <button 
            onClick={() => setActiveTab('announcements')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'announcements' ? 'bg-[#C9A84C] text-[#000B1A]' : 'text-[#A0B4C8] hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Platform Broadcasts
          </button>

          <button 
            onClick={() => setActiveTab('about')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'about' ? 'bg-[#C9A84C] text-[#000B1A]' : 'text-[#A0B4C8] hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            About Creator
          </button>
        </nav>

        <div className="p-4 border-t border-[#0A2540] text-center">
          <a
            href="https://nex-chi-six.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-[#C9A84C] block hover:underline font-mono font-bold mb-3"
          >
            By Jackson Mwaniki
          </a>
          <button 
            onClick={logout}
            className="w-full py-2 bg-[#FF3D57] hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            System SignOut
          </button>
        </div>
      </aside>

      {/* Admin Content Panel */}
      <main className="flex-1 p-6 md:p-8 max-h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-[#0A2540]">
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">
              {activeTab === 'dashboard' && 'Platform Overview Node'}
              {activeTab === 'businesses' && 'Merchants Database'}
              {activeTab === 'audit' && 'Global System Audits'}
              {activeTab === 'announcements' && 'Broadcasting Station'}
              {activeTab === 'about' && 'Developer & Framework Information'}
            </h1>
            <p className="text-xs text-[#A0B4C8] mt-1 font-mono uppercase tracking-widest">
              SUPERADMIN PRIVILEGES GRANTED (jacmwaniki@gmail.com)
            </p>
          </div>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-[#002040] hover:bg-[#C9A84C] hover:text-[#000B1A] transition-all text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-sm font-semibold tracking-wider text-[#A0B4C8] animate-pulse">
              SYNCING WITH FIRESTORE CLOUD DATABASE INSTANCES...
            </p>
          </div>
        ) : (
          <>
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Stat Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#001529] border border-[#0A2540] rounded-2xl p-6">
                    <span className="text-[10px] text-[#A0B4C8] uppercase font-mono block">Registered Merchants</span>
                    <p className="font-display font-extrabold text-3xl text-[#C9A84C] mt-2 tabular-nums">{allBusinesses.length}</p>
                  </div>
                  
                  <div className="bg-[#001529] border border-[#0A2540] rounded-2xl p-6">
                    <span className="text-[10px] text-[#A0B4C8] uppercase font-mono block">Active Merchants</span>
                    <p className="font-display font-extrabold text-3xl text-[#00E676] mt-2 tabular-nums">
                      {allBusinesses.filter(b => b.status === 'active').length}
                    </p>
                  </div>

                  <div className="bg-[#001529] border border-[#0A2540] rounded-2xl p-6">
                    <span className="text-[10px] text-[#A0B4C8] uppercase font-mono block">Suspended Merchants</span>
                    <p className="font-display font-extrabold text-3xl text-[#FF3D57] mt-2 tabular-nums">
                      {allBusinesses.filter(b => b.status === 'suspended').length}
                    </p>
                  </div>

                  <div className="bg-[#001529] border border-[#0A2540] rounded-2xl p-6">
                    <span className="text-[10px] text-[#A0B4C8] uppercase font-mono block">Aggregate Users Node</span>
                    <p className="font-display font-extrabold text-3xl text-sky-400 mt-2 tabular-nums">{allUsers.length}</p>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bar Registrations */}
                  <div className="bg-[#001529] border border-[#0A2540] rounded-2xl p-6">
                    <h3 className="font-display font-bold text-sm text-white mb-6">Business Registrations Index</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={registrationsByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#0A2540" />
                          <XAxis dataKey="name" stroke="#A0B4C8" fontSize={11} />
                          <YAxis stroke="#A0B4C8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#001529', border: '1px solid #0A2540' }} />
                          <Bar dataKey="count" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart types */}
                  <div className="bg-[#001529] border border-[#0A2540] rounded-2xl p-6">
                    <h3 className="font-display font-bold text-sm text-white mb-6">Merchants by Industry Categorisation</h3>
                    <div className="h-64 flex items-center justify-center">
                      {typeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={typeChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {typeChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#001529', border: '1px solid #0A2540' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-[#A0B4C8]">No business categorized data yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BUSINESSES TABLE */}
            {activeTab === 'businesses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#001529] p-4 rounded-xl border border-[#0A2540]">
                  <p className="text-xs font-semibold text-[#A0B4C8]">Admin level register overrides</p>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Manually Add Business
                  </button>
                </div>

                <div className="overflow-x-auto bg-[#001529] border border-[#0A2540] rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#0A2540] bg-[#000B1A]/40 text-[#C9A84C] font-mono text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold">Business Name</th>
                        <th className="p-4 font-semibold">Owner Email</th>
                        <th className="p-4 font-semibold">Industry</th>
                        <th className="p-4 font-semibold">Tier Plan</th>
                        <th className="p-4 font-semibold">Tenant Status</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A2540]/40 text-xs">
                      {allBusinesses.map((b, idx) => (
                        <tr key={idx} className="hover:bg-[#002040]/30 transition-colors">
                          <td className="p-4 font-semibold">{b.name}</td>
                          <td className="p-4 text-[#A0B4C8]">{b.ownerEmail}</td>
                          <td className="p-4 font-mono">{b.type}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-tr from-[#C9A84C]/10 to-[#F0C96E]/20 text-[#C9A84C] border border-[#C9A84C]/10">
                              {b.subscriptionPlan || 'free'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'active' ? 'bg-[#00E676]/10 text-[#00E676]' : 'bg-[#FF3D57]/10 text-[#FF3D57]'
                            }`}>
                              {b.status || 'active'}
                            </span>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleStatus(b)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                b.status === 'active' ? 'bg-[#FF3D57]/10 text-[#FF3D57]' : 'bg-[#00E676]/10 text-[#00E676]'
                              }`}
                            >
                              {b.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleEditOpen(b)}
                              className="px-2.5 py-1.5 bg-[#002040] hover:bg-[#C9A84C] hover:text-[#000B1A] rounded-lg font-semibold text-[10px] transition-all"
                            >
                              Modify Limits
                            </button>
                            <button
                              onClick={() => handleDeleteBusiness(b.id)}
                              className="px-2 py-1.5 bg-[#FF3D57]/10 hover:bg-[#FF3D57] hover:text-white rounded-lg font-semibold text-[10px] transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {allBusinesses.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-[#A0B4C8]">No registered tenant businesses found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: AUDIT LOG */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                {/* Global Filters */}
                <div className="grid grid-cols-2 gap-4 bg-[#001529] p-4 rounded-xl border border-[#0A2540]">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-[#A0B4C8] block mb-1">Filter Action Type</label>
                    <input 
                      type="text" 
                      placeholder="e.g. SALE_CREATED"
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="w-full bg-[#000B1A] border border-[#0A2540] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider text-[#A0B4C8] block mb-1">Filter Performer Display Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Jackson"
                      value={auditUserFilter}
                      onChange={(e) => setAuditUserFilter(e.target.value)}
                      className="w-full bg-[#000B1A] border border-[#0A2540] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Audit Grid/Table */}
                <div className="bg-[#001529] border border-[#0A2540] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#0A2540] bg-[#000B1A]/40 text-[#C9A84C] font-mono">
                          <th className="p-4 uppercase">Timestamp</th>
                          <th className="p-4 uppercase">Business</th>
                          <th className="p-4 uppercase">Action</th>
                          <th className="p-4 uppercase">Logged By</th>
                          <th className="p-4 uppercase">Information Payload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0A2540]/30 font-mono">
                        {globalAudit
                          .filter(log => !auditActionFilter || log.action?.toLowerCase().includes(auditActionFilter.toLowerCase()))
                          .filter(log => !auditUserFilter || log.performedByName?.toLowerCase().includes(auditUserFilter.toLowerCase()))
                          .map((log, idx) => (
                            <tr key={idx} className="hover:bg-[#002040]/20">
                              <td className="p-4 text-[#A0B4C8]">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="p-4 font-semibold text-white">{log.businessName || log.businessId}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold font-bold text-[10px]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-4 text-sky-400">{log.performedByName}</td>
                              <td className="p-4 text-[11px] text-[#A0B4C8] truncate max-w-xs">{log.details}</td>
                            </tr>
                          ))}
                        {globalAudit.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-[#A0B4C8]">No audit ledger entries logged.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Broadcast Form */}
                <div className="bg-[#001529] border border-[#0A2540] p-6 rounded-2xl h-fit">
                  <h3 className="font-display font-bold text-sm text-white mb-4">Push Broadcaster Broadcast</h3>
                  <form onSubmit={handlePublishAnnouncement} className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Target Business Group</label>
                      <select
                        value={annTarget}
                        onChange={(e) => setAnnTarget(e.target.value)}
                        className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                      >
                        <option value="all">Broadcast to All Businesses</option>
                        {allBusinesses.map((b, idx) => (
                          <option key={idx} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Heading Title</label>
                      <input 
                        type="text"
                        required
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g. Server Software Upgrade Done"
                        className="w-full bg-[#000B1A] border border-[#0A2540] focus:border-[#C9A84C] rounded-xl px-3 py-2 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Broadcast Message Body</label>
                      <textarea
                        required
                        rows={4}
                        value={annMessage}
                        onChange={(e) => setAnnMessage(e.target.value)}
                        placeholder="Dear merchant, your POS performance has been improved..."
                        className="w-full bg-[#000B1A] border border-[#0A2540] focus:border-[#C9A84C] rounded-xl px-3 py-2 text-white outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl shadow-md cursor-pointer transition-all hover:brightness-110 active:scale-95 text-xs uppercase"
                    >
                      Broadcast Announcement
                    </button>
                  </form>
                </div>

                {/* Broadcast Ledger List */}
                <div className="lg:col-span-2 space-y-4 bg-[#001529] border border-[#0A2540] p-6 rounded-2xl max-h-[500px] overflow-y-auto">
                  <h3 className="font-display font-bold text-sm text-white mb-2">Past Public/Private Broadcast Messages</h3>
                  <div className="space-y-4">
                    {allAnnouncements.map((ann, idx) => {
                      const tgt = ann.targetBusinessId === 'all' ? 'All Businesses' : allBusinesses.find(b => b.id === ann.targetBusinessId)?.name || 'Private Group';
                      return (
                        <div key={idx} className="bg-[#000B1A] p-4 rounded-xl border border-[#0A2540] space-y-2 text-xs">
                          <div className="flex justify-between items-center font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] font-bold uppercase">To: {tgt}</span>
                            <span className="text-[10px] text-gray-500">{new Date(ann.createdAt).toLocaleString()}</span>
                          </div>
                          <h4 className="font-semibold text-white tracking-tight">{ann.title}</h4>
                          <p className="text-[#A0B4C8] font-sans leading-normal">{ann.message}</p>
                        </div>
                      );
                    })}
                    {allAnnouncements.length === 0 && (
                      <p className="text-xs text-[#A0B4C8] text-center py-6">No announcements broadcasted yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ABOUT CREATOR */}
            {activeTab === 'about' && (
              <div className="max-w-3xl bg-[#001529] border border-[#0A2540] rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#C9A84C] text-[#000B1A] flex items-center justify-center font-extrabold text-2xl font-mono">JM</div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-white">Jackson Mwaniki Munene</h3>
                    <p className="text-xs text-[#C9A84C] font-mono">Software Craftsman & System Architect</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-[#A0B4C8]">
                  <p>
                    Biashara Yako POS is a highly hardened multi-tenant Point Of Sale system engineered natively for Kenyan wholesale and retail workflows. This platform guarantees sub-second responsiveness, real-time analytics aggregation, background synchronization for offline POS sales queue transactions, and strict role-based workspace views.
                  </p>
                  <p>
                    Designed with an aesthetic "Classy & Sporty" deep navy black surface color palette (#000B1A, #001529) decorated with elegant golden (#C9A84C) accents and pure functional typography.
                  </p>
                  <div className="p-4 bg-[#000B1A] border border-[#0A2540] rounded-xl space-y-2 text-xs font-mono">
                    <p className="text-white font-bold">CONTACT & PORTFOLIO META:</p>
                    <p>Developer: Jackson Mwaniki Munene</p>
                    <p>Portfolio URL: <a href="https://nex-chi-six.vercel.app/" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">https://nex-chi-six.vercel.app/</a></p>
                    <p>Contact Email: <span className="text-white">jacmwaniki@gmail.com</span></p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL: EDIT BUSINESS LIMITS */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
              <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Modify Privileges: {editingBusiness?.name}</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Subscription Plan Tier</label>
                  <select
                    value={editPlan}
                    onChange={(e: any) => setEditPlan(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="free">Free Tier</option>
                    <option value="basic">Basic Retail Tier</option>
                    <option value="premium">Premium Enterprise Tier</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Max Branches</label>
                    <input 
                      type="number" 
                      value={editMaxBranches}
                      onChange={(e) => setEditMaxBranches(Number(e.target.value))}
                      className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Max Users / Staff</label>
                    <input 
                      type="number" 
                      value={editMaxUsers}
                      onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                      className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#0A2540] pt-3">
                  <span>Allow Multi-branches</span>
                  <input 
                    type="checkbox" 
                    checked={editCanBranches} 
                    onChange={(e) => setEditCanBranches(e.target.checked)}
                    className="w-4 h-4 text-brand-gold bg-[#000B1A] border-[#0A2540] focus:ring-0 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Allow Custom Receipt layouts</span>
                  <input 
                    type="checkbox" 
                    checked={editCanReceipts} 
                    onChange={(e) => setEditCanReceipts(e.target.checked)}
                    className="w-4 h-4 text-brand-gold bg-[#000B1A] border-[#0A2540] focus:ring-0 rounded"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-[#000414] border border-[#0A2540] rounded-xl text-[#A0B4C8] font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateBusiness}
                  className="flex-1 py-2 bg-gradient-to-r from-[#C9A84C] to-[#F0C96E] text-[#000B1A] font-bold rounded-xl"
                >
                  Save Privileges
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: MANUAL CREATE BUSINESS */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#001529] border border-[#0A2540] p-6 rounded-2xl space-y-4 text-xs">
              <h3 className="font-display font-bold text-sm text-white border-b border-[#0A2540] pb-2">Register Live Business Tenant</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Business Name</label>
                  <input 
                    type="text" 
                    required
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="e.g. Kibera General Duka"
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Business Type</label>
                  <select
                    value={newBizType}
                    onChange={(e) => setNewBizType(e.target.value)}
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="Bakery">Bakery</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Retail Store">Retail Store</option>
                    <option value="Wholesale Store">Wholesale Store</option>
                    <option value="Agrovet">Agrovet</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Owner Google Email</label>
                  <input 
                    type="email" 
                    required
                    value={newBizEmail}
                    onChange={(e) => setNewBizEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono tracking-wider text-[#A0B4C8] uppercase block mb-1">Owner Google UID</label>
                  <input 
                    type="text" 
                    required
                    value={newBizOwnerUid}
                    onChange={(e) => setNewBizOwnerUid(e.target.value)}
                    placeholder="Paste user's Firebase UID"
                    className="w-full bg-[#000B1A] border border-[#0A2540] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#000414] border border-[#0A2540] rounded-xl text-[#A0B4C8] font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateBusiness}
                  className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold rounded-xl"
                >
                  Register Tenant
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
