import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection, useFirestore } from '../../hooks/useFirestore';
import { UserProfile } from '../../types';
import { where, orderBy } from 'firebase/firestore';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  MoreVertical,
  Activity,
  Award
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { userProfile, firebaseUser } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: team, loading } = useCollection<UserProfile>('users', [
    where('businessId', '==', userProfile?.businessId)
  ]);

  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'salesperson' as any,
    branchId: 'main'
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idToken = await firebaseUser?.getIdToken();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteData,
          businessId: userProfile?.businessId,
          callerToken: idToken
        })
      });

      if (!response.ok) throw new Error('Invitation failed');

      toast.success(`Invitation sent to ${inviteData.email}`);
      setIsInviteModalOpen(false);
      setInviteData({ email: '', name: '', role: 'salesperson', branchId: 'main' });
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const filteredTeam = team.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Team Management</h1>
          <p className="text-slate-400">View and manage your staff and permissions.</p>
        </div>
        
        <button 
          onClick={() => setIsInviteModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Invite Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>)
        ) : filteredTeam.map(member => (
          <GlassCard key={member.uid} className="p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 transition-all group-hover:scale-150 ${member.role === 'business_owner' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
            
            <div className="flex items-start justify-between relative mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl font-bold text-indigo-400">
                {member.name.charAt(0)}
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {member.status}
              </div>
            </div>

            <div className="relative">
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-2 mb-4">
                <Mail className="w-3 h-3" /> {member.email}
              </p>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 bg-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  <span className="capitalize">{member.role.replace('_', ' ')}</span>
                </div>
                {member.branchId && (
                  <div className="flex items-center gap-1 pl-4 border-l border-white/10">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span>{member.branchId}</span>
                  </div>
                )}
              </div>
            </div>
            
            {member.uid !== userProfile?.uid && (
              <button className="absolute bottom-4 right-4 p-2 text-slate-600 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            )}
          </GlassCard>
        ))}
      </div>

      <Modal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full glass-input"
              value={inviteData.name}
              onChange={e => setInviteData({...inviteData, name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email Address (Google Account)</label>
            <input 
              required
              type="email" 
              className="w-full glass-input"
              value={inviteData.email}
              onChange={e => setInviteData({...inviteData, email: e.target.value})}
              placeholder="user@gmail.com"
            />
            <p className="text-[10px] text-slate-500 mt-2 px-1">Member must sign in with this Google account to accept.</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Assign Role</label>
            <select 
              className="w-full glass-input appearance-none"
              value={inviteData.role}
              onChange={e => setInviteData({...inviteData, role: e.target.value as any})}
            >
              <option value="salesperson" className="bg-slate-900">Salesperson (Sales only)</option>
              <option value="manager" className="bg-slate-900">Manager (Full access minus billing)</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-3 pt-6">
            <button type="submit" className="btn-primary w-full py-4">
              Send Invitation
            </button>
            <button 
              type="button" 
              onClick={() => setIsInviteModalOpen(false)}
              className="text-sm font-semibold text-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
