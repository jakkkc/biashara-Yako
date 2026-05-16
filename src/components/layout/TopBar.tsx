import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, WifiOff, RefreshCw, ChevronDown, Check, Building } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export const TopBar: React.FC = () => {
  const { user, branches, currentBranch, switchBranch } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  // Network offline listener - CRITICAL IMPROVEMENT 2
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Low stock real-time notification monitor - CRITICAL IMPROVEMENT 8
  useEffect(() => {
    if (!user || !user.businessId || !currentBranch) return;

    const pRef = collection(db, 'products');
    const q = query(
      pRef, 
      where('businessId', '==', user.businessId), 
      where('branchId', '==', currentBranch.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let lowQty = 0;
      snapshot.forEach((pDoc) => {
        const prodData = pDoc.data();
        if (prodData.quantity <= (prodData.lowStockAlert || 0)) {
          lowQty++;
        }
      });
      setLowStockCount(lowQty);
    }, (err) => {
      console.error('Error in TopBar notification subscriber:', err);
    });

    return () => unsubscribe();
  }, [user, currentBranch]);

  if (!user) return null;

  return (
    <>
      {/* Offline banner check */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-white font-bold text-xs py-2 px-4 shadow flex items-center justify-center gap-2 animate-pulse text-center w-full z-50">
          <WifiOff className="h-4 w-4" />
          <span>Hukuna mtandao! App running in offline viewing mode. Reconnecting shortly...</span>
        </div>
      )}

      <header className="h-16 border-b border-white/5 bg-[#070714]/40 backdrop-blur-md px-6 flex items-center justify-between text-slate-100 w-full shrink-0 relative z-30">
        
        {/* Left Side: Page Title or Branch details */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-200">
              Biashara Yako POS
            </h1>
            {currentBranch && (
              <span className="text-[10px] text-slate-400 font-mono tracking-wide flex items-center gap-1">
                <Building className="h-2.5 w-2.5 text-indigo-400" /> {currentBranch.name} • {currentBranch.location}
              </span>
            )}
          </div>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-4">
          
          {/* Branch Switcher (only for Owner and Super Admin - Managers and clerks have sticky assignments) */}
          {user.role === 'business_owner' && branches.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-white/5 hover:border-indigo-500/30 text-xs font-semibold hover:bg-slate-950/80 transition text-slate-300"
              >
                <span>Branch: {currentBranch?.name || 'Vyoote'}</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              {showBranchDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBranchDropdown(false)} />
                  <div className="absolute right-0 mt-1.5 w-48 bg-[#070714]/90 backdrop-blur-lg border border-white/10 rounded-lg shadow-xl py-1 z-50">
                    <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase">Swasisha Tawi</p>
                    {branches.map((b) => (
                      <button
                        key={b.id}
                        disabled={b.status !== 'active'}
                        onClick={() => {
                          switchBranch(b.id);
                          setShowBranchDropdown(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left transition select-none ${
                          currentBranch?.id === b.id
                            ? 'bg-indigo-600/10 text-indigo-400 font-bold'
                            : 'text-slate-400 hover:bg-slate-850 hover:text-white'
                        } ${b.status !== 'active' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span>{b.name}</span>
                        {currentBranch?.id === b.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notification bell */}
          {!user.role.includes('super_admin') && (
            <div className="relative" title={`${lowStockCount} products are running low on inventory!`}>
              <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-amber-400 transition cursor-help">
                <Bell className="h-4.5 w-4.5" />
                {lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center animate-bounce">
                    {lowStockCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Active status indicator green bubble */}
          <div className="flex items-center gap-1.5 bg-slate-950/45 border border-white/5 px-2.5 py-1 rounded-full">
            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
            <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest leading-none">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

        </div>
      </header>
    </>
  );
};
export default TopBar;
