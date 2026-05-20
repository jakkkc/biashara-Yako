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
  User
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, Branch } from '../../../types';

export default function UsersView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUser, setNewUser] = useState({ 
    displayName: '', 
    username: '', 
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
    if (!profile?.businessId || !newUser.username) return;
    setLoading(true);
    const id = `USER-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    try {
      await setDoc(doc(db, 'users', id), {
        ...newUser,
        id,
        businessId: profile.businessId,
        createdAt: Date.now(),
        isStaff: true // Flag to allow password login
      });
      setIsAdding(false);
      fetchUsers();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Terminate this operative from the consortium? Access will be immediately revoked.')) return;
    try {
       await deleteDoc(doc(db, 'users', id));
       setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
       console.error(error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
           <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">Enterprise Personnel</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Managing operative permissions and hub assignments</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="h-14 px-8 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gold/10 hover:bg-gold-light transition-all"
        >
          Enlist Operative <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {loading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-gold" /></div> : (
           users.map(user => (
             <div key={user.id} className="bg-navy-muted rounded-[32px] p-6 lg:p-8 border border-slate-800 flex flex-col lg:flex-row items-center gap-6 group hover:border-gold/20 transition-all">
                <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-slate-500 border border-slate-800 shadow-inner shrink-0">
                   <User size={32} />
                </div>
                <div className="flex-1 text-center lg:text-left">
                   <div className="flex items-center justify-center lg:justify-start gap-3 mb-1">
                      <h3 className="text-xl font-black text-white tracking-tight italic">{user.displayName || user.username}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        user.role === 'Owner' ? 'bg-gold/10 border-gold/20 text-gold' : 
                        user.role === 'BranchManager' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        {user.role}
                      </span>
                   </div>
                   <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <Mail size={12} />
                         <span className="text-[10px] font-bold uppercase tracking-tighter">{user.email || `@${user.username}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <Store size={12} />
                         <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {branches.find(b => b.id === user.branchId)?.name || 'All Branches'}
                         </span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setEditingUser(user)}
                     className="p-4 bg-navy border border-slate-800 rounded-2xl text-slate-600 hover:text-gold transition-colors"
                   >
                      <Edit2 size={20} />
                   </button>
                   <button onClick={() => deleteUser(user.id)} className="p-4 bg-navy border border-slate-800 rounded-2xl text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={20} />
                   </button>
                </div>
             </div>
           ))
         )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">Operational Enlistment</h3>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-10">Deploying new personnel to the enterprise matrix</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Public Designation (Display Name)</label>
                  <input 
                    type="text" 
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System Identifier (Username)</label>
                  <input 
                    type="text" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value.toLowerCase()})}
                    placeholder="e.g. jdoe_nairobi"
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Access Cipher (Password)</label>
                  <div className="relative">
                     <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                     <input 
                       type="password" 
                       value={newUser.password}
                       onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                       placeholder="••••••••"
                       className="w-full h-16 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                     />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Role Assignment</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 appearance-none font-bold"
                  >
                    <option value="Salesperson">Salesperson</option>
                    <option value="BranchManager">Branch Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="StockController">Stock Controller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Terminal Assignment (Branch)</label>
                  <select 
                    value={newUser.branchId}
                    onChange={(e) => setNewUser({...newUser, branchId: e.target.value})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 appearance-none font-bold"
                  >
                    <option value="">Consortium Wide (All Branches)</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 h-14 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleAddUser}
                    disabled={loading || !newUser.username || !newUser.password}
                    className="flex-[2] h-14 bg-gold text-navy rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gold/10 disabled:opacity-30"
                  >
                    Authorize Enlistment
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
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">Modify Protocol</h3>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-10">Updating clearance for {editingUser.displayName || editingUser.username}</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Public Designation</label>
                  <input 
                    type="text" 
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Role Assignment</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 appearance-none font-bold"
                  >
                    <option value="Salesperson">Salesperson</option>
                    <option value="BranchManager">Branch Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="StockController">Stock Controller</option>
                    <option value="Owner">Owner (Warning: Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Terminal Assignment (Branch)</label>
                  <select 
                    value={editingUser.branchId}
                    onChange={(e) => setEditingUser({...editingUser, branchId: e.target.value})}
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 appearance-none font-bold"
                  >
                    <option value="">Consortium Wide</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="flex-1 h-14 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEditUser}
                    disabled={loading || !editingUser.displayName}
                    className="flex-[2] h-14 bg-gold text-navy rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gold/10 disabled:opacity-30"
                  >
                    Confirm Changes
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
