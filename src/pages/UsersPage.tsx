import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  Plus, 
  Users, 
  ShieldCheck, 
  X, 
  Check, 
  Edit, 
  GitMerge, 
  AlertTriangle,
  Mail,
  Lock,
  UserCheck
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const UsersPage: React.FC = () => {
  const { user, branches } = useAuth();
  const { inviteUser, updateUserProfile } = useFirestore();

  // Loading
  const [loading, setLoading] = useState(true);

  // States
  const [team, setTeam] = useState<any[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'salesperson' as 'manager' | 'salesperson',
    branchId: ''
  });

  const [passwd, setPasswd] = useState('');

  // Watch users
  useEffect(() => {
    if (!user || !user.businessId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'users'),
      where('businessId', '==', user.businessId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() });
      });
      setTeam(list);
      setLoading(false);
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [user]);

  // Handle defaults
  useEffect(() => {
    if (branches.length > 0 && !inviteForm.branchId) {
      setInviteForm(prev => ({ ...prev, branchId: branches[0].id }));
    }
  }, [branches, inviteForm.branchId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email || !passwd) {
      toast.error('All registration fields are required.');
      return;
    }

    if (passwd.length < 6) {
      toast.error('Password must be 6 or more characters.');
      return;
    }

    await inviteUser(inviteForm, passwd);
    setInviteModalOpen(false);
    setInviteForm({
      name: '',
      email: '',
      role: 'salesperson',
      branchId: branches[0]?.id || ''
    });
    setPasswd('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    const updates = {
      name: editUser.name,
      role: editUser.role,
      branchId: editUser.branchId,
      status: editUser.status
    };

    await updateUserProfile(editUser.uid, updates);
    setEditUser(null);
  };

  // Toggle suspends - CRITICAL PROTECTION FOR jacmwaniki@gmail.com
  const handleToggleSuspension = async (member: any) => {
    if (member.email === 'jacmwaniki@gmail.com') {
      toast.error('Ulinzi Imara! All write policies are locked for the Super Admin account.');
      return;
    }

    const nextStatus = member.status === 'suspended' ? 'active' : 'suspended';
    await updateUserProfile(member.uid, { status: nextStatus });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-800/40 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header toolbars */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Wafanyakazi wa Duka / Team Roster
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Register salespeople, assign managers to specific branches, and suspend licenses.
          </span>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="btn-primary text-xs font-bold flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Invite Staff Member
        </button>
      </div>

      {/* Team catalog roster list */}
      <GlassCard className="border-indigo-500/10 p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-indigo-400" /> Active Roster
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm font-sans text-slate-300">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-bold pb-2">
                <th className="py-2.5">Name</th>
                <th>Email Address</th>
                <th>Branch Assignment</th>
                <th>Role Badge</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {team.map((member) => {
                const isSuperAdminSafe = member.email === 'jacmwaniki@gmail.com';
                const branchMap = branches.find((b) => b.id === member.branchId);

                return (
                  <tr key={member.uid} className="hover:bg-slate-900/10 text-slate-300">
                    <td className="py-3.5 font-bold text-white">{member.name}</td>
                    <td className="font-mono text-slate-400">{member.email}</td>
                    <td>
                      <span className="text-slate-200">
                        {branchMap ? branchMap.name : 'Vyoote (Corporate)'}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-indigo-400 border border-indigo-500/20 bg-indigo-500/5`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        member.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2">
                        {/* Suspension toggles with shields checks */}
                        <button
                          onClick={() => handleToggleSuspension(member)}
                          disabled={isSuperAdminSafe}
                          className={`p-1 px-2.2 rounded text-[10px] font-bold uppercase transition cursor-pointer ${
                            isSuperAdminSafe 
                              ? 'bg-slate-900 text-slate-650 opacity-40 cursor-not-allowed border border-slate-950'
                              : member.status === 'active'
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          {member.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => setEditUser(member)}
                          disabled={isSuperAdminSafe}
                          className={`p-1.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500 hover:text-white transition cursor-pointer ${isSuperAdminSafe ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* INVITE NEW MEMBER DIALOG */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Store Associate / Sajili Mwanachama"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 text-sm font-sans text-slate-300">
          
          <div className="relative">
            <UserCheck className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
            <Input
              label="Staff Member Full Name"
              placeholder="Juma Mwanyiki"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="pl-10"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
            <Input
              label="Staff Email Address"
              type="email"
              placeholder="clerk@mwaniki.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
            <Input
              label="Assigned Password / Nenosiri lake"
              type="password"
              placeholder="••••••••"
              value={passwd}
              onChange={(e) => setPasswd(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="invite-role" className="text-xs font-semibold text-slate-300 block mb-1">
                Access Tier Group / Daraja la Kazi
              </label>
              <select
                id="invite-role"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                className="input px-3 py-2 w-full bg-slate-950 font-medium text-slate-100 text-xs border"
              >
                <option value="salesperson">Sales Clerk / Mhudumu</option>
                <option value="manager">Manager / Msimamizi</option>
              </select>
            </div>

            <div>
              <label htmlFor="invite-branch" className="text-xs font-semibold text-slate-300 block mb-1">
                Designated Branch / Piga Tawi lake
              </label>
              <select
                id="invite-branch"
                value={inviteForm.branchId}
                onChange={(e) => setInviteForm({ ...inviteForm, branchId: e.target.value })}
                className="input px-3 py-2 w-full bg-slate-950 font-medium text-slate-100 text-xs border"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 rounded-xl font-bold mt-2 cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
          >
            Sajili Mwanakazi / Complete Invite
          </button>
        </form>
      </Modal>

      {/* EDIT COMPONENT DIALOG */}
      <Modal
        isOpen={editUser !== null}
        onClose={() => setEditUser(null)}
        title="Edit Staff Member Access"
      >
        {editUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-sm font-sans text-slate-300">
            <Input
              label="Staff Full Name"
              placeholder="Name"
              value={editUser.name}
              onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Employment Status</label>
                <select
                  value={editUser.status}
                  onChange={(e) => setEditUser({ ...editUser, status: e.target.value as any })}
                  className="input px-3 py-2 w-full bg-slate-950 font-medium text-slate-100 text-xs border"
                >
                  <option value="active">Active / Kazi</option>
                  <option value="suspended">Suspended / Simamishwa</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Designated Branch</label>
                <select
                  value={editUser.branchId || ''}
                  onChange={(e) => setEditUser({ ...editUser, branchId: e.target.value })}
                  className="input px-3 py-2 w-full bg-slate-950 font-medium text-slate-100 text-xs border"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Role Permissions Badge</label>
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value as any })}
                className="input px-3 py-2 w-full bg-slate-950 font-medium text-slate-100 text-xs border"
              >
                <option value="salesperson">Sales Clerk / Mhudumu</option>
                <option value="manager">Manager / Msimamizi</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-xl font-bold mt-2 cursor-pointer"
            >
              Committed user revisions
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};
export default UsersPage;
