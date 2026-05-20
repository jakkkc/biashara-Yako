import React, { useState } from 'react';
import { ShoppingBag, Key, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { t } = useI18n();
  const { loginWithGoogle, loginWithStaff, profile, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'owner' | 'staff'>('owner');
  
  // Staff form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      // On success, state listener in App will route them.
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please provide both username and password.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithStaff(username, password);
      // Auth success listener in App will fetch profile and route correct dashboard.
    } catch (err: any) {
      setErrorMsg(err.message || 'Staff Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white flex flex-col justify-center items-center px-4 relative font-sans">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2C2C2E_1px,transparent_1px),linear-gradient(to_bottom,#2C2C2E_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_100%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center cursor-pointer" onClick={() => onNavigate('landing')}>
        <div className="w-12 h-12 border border-[#C5A059] bg-[#161618] flex items-center justify-center shadow-lg shadow-[#C5A059]/10 mb-3">
          <span className="serif text-2xl font-bold text-[#C5A059]">V</span>
        </div>
        <h1 className="font-display font-light text-3xl tracking-wide uppercase">{t('appName')}</h1>
        <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-mono mt-1">{t('tagline')}</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass rounded-none shadow-2xl p-6 md:p-8 relative overflow-hidden border border-stone-800">
        {/* Tab Header Selector */}
        <div className="grid grid-cols-2 bg-[#0C0C0D] border border-stone-800 rounded-none p-1 mb-6">
          <button
            onClick={() => {
              setActiveTab('owner');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-none text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-[#C5A059] text-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {t('ownerTab')}
          </button>
          
          <button
            onClick={() => {
              setActiveTab('staff');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-none text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[#C5A059] text-black'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            {t('staffTab')}
          </button>
        </div>

        {/* Error Block */}
        {errorMsg && (
          <div className="mb-4 bg-red-950/20 border border-red-900/50 text-red-400 rounded-none p-4 flex items-start gap-3.5 text-xs font-light">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C5A059]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* OWNER TAB VIEW */}
        {activeTab === 'owner' && (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="text-xs text-stone-400 mb-8 max-w-xs leading-relaxed font-light">
              Sign in with your registered Google account to access your store configuration, branches, reports, and global billing.
            </p>
            
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-stone-100 disabled:opacity-50 text-black font-semibold transition-all flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-wider rounded-none cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.14-5.136 4.14A5.4 5.4 0 0 1 8.53 13.1a5.4 5.4 0 0 1 5.462-5.442c1.478 0 2.8.538 3.834 1.424l3.193-3.19C19.094 3.614 16.63 2.5 13.99 2.5a10.4 10.4 0 0 0-10.4 10.4 10.4 10.4 0 0 0 10.4 10.4c5.783 0 10.4-3.9 10.4-10.4a11 11 0 0 0-.15-1.928H12.24z"
                />
              </svg>
              {loading ? t('loading') : t('googleSignIn')}
            </button>
          </div>
        )}

        {/* STAFF TAB VIEW */}
        {activeTab === 'staff' && (
          <form onSubmit={handleStaffLoginSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block mb-2">
                {t('username')}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('enterUsername')}
                disabled={loading}
                className="w-full bg-[#0C0C0D] border border-stone-800 focus:border-[#C5A059] rounded-none px-4 py-3.5 text-white text-sm outline-none transition-all placeholder:text-stone-600 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                disabled={loading}
                className="w-full bg-[#0C0C0D] border border-stone-800 focus:border-[#C5A059] rounded-none px-4 py-3.5 text-white text-sm outline-none transition-all placeholder:text-stone-600 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#C5A059] border border-[#C5A059] text-black hover:bg-transparent hover:text-[#C5A059] disabled:opacity-50 font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 text-xs uppercase tracking-widest mt-8 cursor-pointer rounded-none"
            >
              {loading ? t('loading') : t('login')}
            </button>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-stone-500 uppercase tracking-wide leading-relaxed font-mono">
                {t('forgotPasswordWarning')}
              </span>
            </div>
          </form>
        )}
      </div>

      {/* Back to Home Link */}
      <button 
        onClick={() => onNavigate('landing')}
        className="mt-8 text-xs text-stone-500 hover:text-[#C5A059] uppercase tracking-widest font-mono transition-colors"
      >
        ← Back to Landing Page
      </button>
    </div>
  );
}
