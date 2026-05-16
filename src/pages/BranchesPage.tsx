import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Phone, 
  Store, 
  Edit, 
  User, 
  Check, 
  Info,
  GitBranch
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const BranchesPage: React.FC = () => {
  const { user, branches: contextBranches } = useAuth();
  const { addBranchDoc, updateBranchDoc } = useFirestore();

  // States
  const [branches, setBranches] = useState<any[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editBranchItem, setEditBranchItem] = useState<any | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    location: '',
    phone: '',
    managerId: '' // optional designate id placeholder
  });

  // Keep branch references synced
  useEffect(() => {
    if (!user || !user.businessId) return;

    const q = query(
      collection(db, 'branches'),
      where('businessId', '==', user.businessId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setBranches(list);
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [user]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.phone) {
      toast.error('All branch fields are required.');
      return;
    }

    const res = await addBranchDoc(form);
    if (res) {
      setAddModalOpen(false);
      setForm({
        name: '',
        location: '',
        phone: '',
        managerId: ''
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchItem) return;

    const success = await updateBranchDoc(editBranchItem.id, {
      name: editBranchItem.name,
      location: editBranchItem.location,
      phone: editBranchItem.phone,
      managerId: editBranchItem.managerId || ''
    });

    if (success) {
      setEditBranchItem(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header toolbars */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Matawi ya Biashara / Branches Management
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Provision new physical store assets, configure locations and branch telephones.
          </span>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-primary text-xs font-bold flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Provision New Branch
        </button>
      </div>

      {/* Grid listing branches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((b) => (
          <GlassCard key={b.id} className="border-indigo-500/10 p-5 space-y-4 hover:border-indigo-500/20 group transition duration-300">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Store className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{b.name}</h3>
                  <span className="text-[9px] font-mono text-slate-500">ID: {b.id.substring(0, 10)}...</span>
                </div>
              </div>

              <button
                onClick={() => setEditBranchItem(b)}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 group-hover:text-white transition cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 font-medium">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" /> Location: {b.location}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" /> Phone: {b.phone}
              </p>
            </div>
          </GlassCard>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 italic">
            Hakuna matawi mengine yaliyosajiliwa kuliko tawi lako la msingi kuanzia usajili.
          </div>
        )}
      </div>

      {/* PROVISION BRANCH MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Provision New Branch Location"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-sm font-sans text-slate-300">
          <Input
            label="Branch Name / Jina la Tawi"
            name="name"
            placeholder="E.g. Mombasa Road Branch"
            value={form.name}
            onChange={handleFormChange}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Physical Address / Location"
              name="location"
              placeholder="E.g. Gateway Plaza, Ground Floor"
              value={form.location}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Branch Official Phone"
              name="phone"
              placeholder="E.g. +254 712 345678"
              value={form.phone}
              onChange={handleFormChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
          >
            Provision Branch / Kamilisha
          </button>
        </form>
      </Modal>

      {/* EDIT BRANCH MODAL */}
      <Modal
        isOpen={editBranchItem !== null}
        onClose={() => setEditBranchItem(null)}
        title="Edit Branch Storefront Details"
      >
        {editBranchItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4 text-sm font-sans text-slate-300">
            <Input
              label="Branch Name"
              value={editBranchItem.name}
              onChange={(e) => setEditBranchItem({ ...editBranchItem, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Physical Address"
                value={editBranchItem.location}
                onChange={(e) => setEditBranchItem({ ...editBranchItem, location: e.target.value })}
                required
              />

              <Input
                label="Store official phone number"
                value={editBranchItem.phone}
                onChange={(e) => setEditBranchItem({ ...editBranchItem, phone: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 rounded-xl font-bold cursor-pointer"
            >
              Update storefront details
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};
export default BranchesPage;
