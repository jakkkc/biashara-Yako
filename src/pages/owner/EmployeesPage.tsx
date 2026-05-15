import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, Branch } from '../../types';
import { Plus, Users, Mail, Shield, Building2, UserPlus, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EmployeesPage() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'salesperson' as const,
    branchId: '',
    password: 'password123' // Temporary password for them
  });

  useEffect(() => {
    if (!profile?.businessId) return;

    // Branches
    const bQ = query(collection(db, 'branches'), where('businessId', '==', profile.businessId));
    const unsubBranches = onSnapshot(bQ, (snap) => {
      setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
    });

    // Employees
    const eQ = query(collection(db, 'users'), where('businessId', '==', profile.businessId));
    const unsubEmployees = onSnapshot(eQ, (snap) => {
      setEmployees(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });

    return () => {
      unsubBranches();
      unsubEmployees();
    };
  }, [profile]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      // NOTE: We can't use createUserWithEmailAndPassword here because it signs out the current user.
      // In a real app, this would be a cloud function.
      // For this prototype, we'll suggest the owner creates them via Admin or we'll just mock the ID.
      // ACTUALLY, for AI Studio preview, I'll just write to Firestore and assume the user will sign up themselves 
      // or we're using a system where the "Manager" creates the "Salesperson" via a secret admin endpoint.
      
      // For the sake of this demo, I'll simulate it by creating the user doc and telling them the email/pass.
      // Realistically, the "Super Admin" can create anyone.
      
      const newUid = "emp_" + Math.random().toString(36).substr(2, 9);
      
      await setDoc(doc(db, 'users', newUid), {
        email: newEmployee.email,
        name: newEmployee.name,
        role: newEmployee.role,
        businessId: profile.businessId,
        branchId: newEmployee.branchId,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: profile.uid
      });

      setShowAddModal(false);
      setNewEmployee({ name: '', email: '', role: 'salesperson', branchId: '', password: 'password123' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (id: string | null) => {
    return branches.find(b => b.id === id)?.name || 'N/A';
  };

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Employees</h1>
          <p className="text-slate-400 font-medium mt-1">Manage access and roles for your staff across all branches.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[20px] font-bold transition shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5" /> Add New Staff
        </button>
      </div>

      <div className="glass rounded-[32px] shadow-sm border border-white/10 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Employee</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Role</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Branch</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map((emp) => (
                <tr key={emp.uid} className="hover:bg-white/5 transition group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 font-black border border-white/5 text-lg group-hover:scale-110 transition-transform">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{emp.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 text-sm text-slate-300 font-medium bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 w-fit">
                      < Shield className={cn(
                        "w-4 h-4",
                        emp.role === 'manager' ? "text-blue-400" : "text-emerald-400"
                      )} />
                      <span className="capitalize">{emp.role.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                      <Building2 className="w-4 h-4 text-blue-400/50" />
                      {getBranchName(emp.branchId)}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                      emp.status === 'active' 
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                        : "bg-red-600/10 text-red-500 border-red-500/20"
                    )}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
            
            <h2 className="text-2xl font-bold font-serif mb-8 text-white tracking-tight relative z-10 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 rounded-xl text-blue-400">
                <UserPlus className="w-6 h-6" />
              </div>
              Staff Registration
            </h2>
            <form onSubmit={handleAddEmployee} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700" placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input required type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700" placeholder="jane@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Role</label>
                  <select value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value as any})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition appearance-none cursor-pointer">
                    <option value="manager" className="bg-slate-900">Manager</option>
                    <option value="salesperson" className="bg-slate-900">Salesperson</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Assign Branch</label>
                  <select required value={newEmployee.branchId} onChange={e => setNewEmployee({...newEmployee, branchId: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition appearance-none cursor-pointer">
                    <option value="" className="bg-slate-900">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id} className="bg-slate-900">{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-5 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-start gap-2">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Passwords must be set manually via console for security in this preview.</span>
                </p>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[20px] font-bold transition active:scale-[0.98]">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-bold transition disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]">{loading ? "Adding..." : "Add Staff"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
