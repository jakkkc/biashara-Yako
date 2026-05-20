import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Shield, 
  Store,
  Loader2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  Phone,
  ArrowRight,
  X
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '../../../lib/firebase';
import firebaseConfig from '../../../../firebase-applet-config.json';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, Branch } from '../../../types';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'BranchManager': 'Manages a branch end-to-end: sales, expenses, inventory, and analytics.',
  'Salesperson': 'Operates the POS terminal; creates sales and monitors inventory levels.',
  'Cashier': 'Processes payments for sales and manages the till; read-only inventory.',
  'StockController': 'Manages inventory levels, updates stock, and handles branch transfers.'
};

export default function UsersView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    name: string;
    branch: string;
    role: string;
    password: string;
    email: string;
  } | null>(null);

  const [newUser, setNewUser] = useState({ 
    displayName: '', 
    email: '',
    phone: '',
    password: '', 
    role: 'Salesperson' as UserRole,
    branchId: ''
  });
  
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchUsers();
      fetchBranches();
    }
  }, [profile?.businessId]);

  const fetchUsers = async () => {
    if (!profile?.businessId) return;
    try {
      const q = query(
        collection(db, 'users'), 
        where('businessId', '==', profile.businessId)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const snapshot = await getDocs(collection(db, `businesses/${profile?.businessId}/branches`));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!profile?.businessId) return;
    if (!newUser.displayName || !newUser.email || !newUser.password || !newUser.branchId) {
      setError('Please fill in all required fields including branch assignment.');
      return;
    }

    if (newUser.password.length < 8 || !/\d/.test(newUser.password)) {
      setError('Password must be at least 8 characters and include one number.');
      return;
    }

    setLoading(true);
    setError(null);

    let secondaryApp;
    try {
      // 1. Check if email exists in our users collection
      const emailQuery = query(collection(db, 'users'), where('email', '==', newUser.email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        throw new Error('This email is already registered on the platform.');
      }

      // 2. Create Auth User using a secondary app instance to preserve current session
      const appName = `SecondaryApp-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const newUserId = userCredential.user.uid;

      // 3. Write profile to Firestore
      const staffProfile: UserProfile = {
        id: newUserId,
        businessId: profile.businessId,
        branchId: newUser.branchId,
        role: newUser.role,
        displayName: newUser.displayName,
        email: newUser.email,
        phone: newUser.phone,
        mustChangePassword: true,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'users', newUserId), staffProfile);

      // 4. Success state
      setSuccessData({
        name: newUser.displayName,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        branch: branches.find(b => b.id === newUser.branchId)?.name || 'Unknown'
      });
      
      setIsAdding(false);
      setNewUser({
        displayName: '',
        email: '',
        phone: '',
        password: '',
        role: 'Salesperson' as UserRole,
        branchId: ''
      });
      fetchUsers();
      
      // Cleanup
      await signOut(secondaryAuth);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure during staff registration.');
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp);
      }
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!profile?.businessId || !editingUser) return;
    setLoading(true);
    try {
      const { id, ...updateData } = editingUser;
      await setDoc(doc(db, 'users', id), updateData, { merge: true });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Terminate this operative? Access will be immediately revoked.')) return;
    try {
       await deleteDoc(doc(db, 'users', id));
       setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
       console.error(error);
    }
  };

  const copyCredentials = () => {
    if (!successData) return;
    const text = `Biashara Yako Credentials\nEmail: ${successData.email}\nTemp Password: ${successData.password}\nRole: ${successData.role}\nBranch: ${successData.branch}`;
    navigator.clipboard.writeText(text);
    alert('Credentials copied to clipboard. Share them securely with the staff member.');
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="space-y-1">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[8px] font-black uppercase tracking-widest mb-2">
             <Shield size={10} /> Personnel Protocol Gated
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter mb-2">Command Center</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Managing operative permissions and hub assignments</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="h-14 px-8 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gold/10 hover:bg-gold-light transition-all active:scale-95 duration-300"
        >
          Provision Staff Member <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {loading && !users.length ? (
           <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-gold w-10 h-10" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning encrypted personnel database...</p>
           </div>
         ) : (
           users.map(user => (
              <motion.div 
                key={user.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-navy-muted rounded-[40px] p-6 lg:p-10 border border-slate-800 flex flex-col lg:flex-row items-center gap-8 group hover:border-gold/30 transition-all shadow-xl relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all pointer-events-none" />
                  
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-inner shrink-0 transition-all duration-500 ${
                    user.role === 'Owner' ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-navy border-slate-800 text-slate-500'
                  }`}>
                    {user.role === 'Owner' ? <Shield size={40} strokeWidth={1.5} /> : <User size={40} strokeWidth={1.5} />}
                  </div>

                  <div className="flex-1 text-center lg:text-left relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-3">
                        <h3 className="text-3xl font-black text-white tracking-tight italic">{user.displayName}</h3>
                        <div className="flex gap-2 justify-center lg:justify-start">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                            user.role === 'Owner' ? 'bg-gold text-navy border-gold' : 
                            user.role === 'BranchManager' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 
                            'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            {user.role}
                          </span>
                          {user.mustChangePassword && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full animate-pulse">
                              Awaiting Setup
                            </span>
                          )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail size={14} className="text-slate-600" />
                          <span className="text-xs font-bold uppercase tracking-tight">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Store size={14} className="text-slate-600" />
                          <span className="text-xs font-bold uppercase tracking-tight">
                              {branches.find(b => b.id === user.branchId)?.name || 'All Branches'}
                          </span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Phone size={14} className="text-slate-600" />
                            <span className="text-xs font-bold uppercase tracking-tight">{user.phone}</span>
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="w-14 h-14 bg-navy border border-slate-800 rounded-2xl text-slate-500 hover:text-gold hover:border-gold/30 transition-all flex items-center justify-center group-hover:bg-gold/5"
                    >
                        <Edit2 size={24} />
                    </button>
                    <button 
                      onClick={() => deleteUser(user.id)} 
                      className="w-14 h-14 bg-navy border border-slate-800 rounded-2xl text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center group-hover:bg-red-500/5"
                    >
                        <Trash2 size={24} />
                    </button>
                  </div>
              </motion.div>
           ))
         )}

         {users.length === 0 && !loading && (
           <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 bg-navy-muted rounded-[40px] flex items-center justify-center border border-slate-800 mb-10 text-slate-800 relative">
                 <div className="absolute inset-0 bg-gold/5 blur-3xl animate-pulse rounded-full" />
                 <Users size={64} className="relative z-10" />
              </div>
              <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Command Deck Empty</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-sm leading-relaxed px-6">
                No active personnel detected in your enterprise. Enlist your first operative to begin scaling your branch network.
              </p>
           </div>
         )}
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {successData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-navy/95 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-lg bg-navy-muted border border-gold/30 rounded-[50px] p-10 lg:p-14 shadow-[0_0_80px_rgba(234,179,8,0.1)] text-center"
            >
               <div className="w-24 h-24 bg-gold rounded-[32px] flex items-center justify-center text-navy mx-auto mb-10 shadow-2xl shadow-gold/20">
                 <CheckCircle size={56} strokeWidth={2.5} />
               </div>
               <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Operative Successfully Enlisted</h3>
               <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-12">Staff credentials generated. Share these securely with the operative.</p>
               
               <div className="space-y-4 mb-12 text-left">
                  <div className="p-6 bg-navy rounded-3xl border border-slate-800">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Access Identity (Email)</p>
                    <p className="text-white font-black text-lg">{successData.email}</p>
                  </div>
                  <div className="p-6 bg-navy rounded-3xl border border-slate-800 relative">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Temporary Access Cipher</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gold font-black text-2xl tracking-[0.2em]">
                        {showPassword ? successData.password : '••••••••'}
                      </p>
                      <button onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-navy rounded-2xl border border-slate-800">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Clearance Level</p>
                      <p className="text-white font-black text-xs uppercase italic">{successData.role}</p>
                    </div>
                    <div className="p-4 bg-navy rounded-2xl border border-slate-800">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Hub Station</p>
                      <p className="text-white font-black text-xs uppercase italic">{successData.branch}</p>
                    </div>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                 <button 
                   onClick={copyCredentials}
                   className="h-16 bg-gold text-navy rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gold/10 hover:bg-gold-light transition-all flex items-center justify-center gap-3"
                 >
                   Copy Credentials <Copy size={18} />
                 </button>
                 <button 
                   onClick={() => setSuccessData(null)}
                   className="h-14 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white"
                 >
                   Dismis Terminal
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-navy/95 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 70 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 70 }}
              className="relative w-full max-w-2xl bg-navy-muted border border-slate-800 rounded-[50px] p-10 lg:p-14 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-4xl font-black text-white italic tracking-tighter">Staff Enlistment</h3>
                   <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-1">Deploying new operative to the enterprise mesh</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-12 h-12 bg-navy border border-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all hover:scale-110">
                   <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-black uppercase tracking-widest animate-shake">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                   {error}
                </div>
              )}
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Nomenclature</label>
                    <input 
                      type="text" 
                      value={newUser.displayName}
                      onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Identity</label>
                    <input 
                      type="email" 
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value.toLowerCase()})}
                      placeholder="john@enterprise.com"
                      className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Contact Protocol (Phone)</label>
                    <input 
                      type="tel" 
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      placeholder="+254 700 000 000"
                      className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Temporary Access Cipher</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Min 8 chars, 1 number"
                        className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold transition-all font-black tracking-[0.3em]"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gold transition-colors"
                      >
                         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Terminal Assignment (Branch)</label>
                  <select 
                    value={newUser.branchId}
                    onChange={(e) => setNewUser({...newUser, branchId: e.target.value})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-gold outline-none focus:border-gold transition-all font-black uppercase text-[11px] tracking-widest appearance-none"
                  >
                    <option value="">Select Operational Hub...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    {branches.length === 0 && <option disabled>No hubs available. Create one first.</option>}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Clearance Role Assignment</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
                      <button
                        key={role}
                        onClick={() => setNewUser({...newUser, role: role as UserRole})}
                        className={`p-6 text-left rounded-3xl border transition-all duration-300 ${
                          newUser.role === role 
                            ? 'bg-gold/10 border-gold shadow-lg shadow-gold/5' 
                            : 'bg-navy border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                           <div className={`w-2 h-2 rounded-full ${newUser.role === role ? 'bg-gold' : 'bg-slate-700'}`} />
                           <h4 className={`text-[10px] font-black uppercase tracking-widest ${newUser.role === role ? 'text-gold' : 'text-white'}`}>{role}</h4>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter line-clamp-2">
                          {desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-6 pt-10">
                  <button 
                    disabled={loading}
                    onClick={handleAddUser}
                    className="flex-1 h-18 bg-gold text-navy rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gold/20 hover:bg-gold-light transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Bootstrap Operative <ArrowRight size={18} strokeWidth={3} /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-navy/95 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 70 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 70 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[50px] p-10 lg:p-14 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Modify Protocol</h3>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-12">Updating clearance for {editingUser.displayName}</p>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Public Designation</label>
                  <input 
                    type="text" 
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold transition-all font-bold"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Clearance Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold appearance-none font-bold uppercase text-[11px] tracking-widest"
                  >
                    <option value="Salesperson">Salesperson</option>
                    <option value="BranchManager">Branch Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="StockController">Stock Controller</option>
                    <option value="Owner">Owner (Warning: Total Access)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Terminal Assignment</label>
                  <select 
                    value={editingUser.branchId}
                    onChange={(e) => setEditingUser({...editingUser, branchId: e.target.value})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-3xl text-white outline-none focus:border-gold appearance-none font-bold uppercase text-[11px] tracking-widest"
                  >
                    <option value="">Consortium Wide</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-6 pt-10">
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 h-14 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEditUser}
                    disabled={loading || !editingUser.displayName}
                    className="flex-[2] h-16 bg-gold text-navy rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gold/10 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    Sync Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
