import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Image, 
  Percent, 
  CheckCircle2, 
  ShoppingBag,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { setDoc, doc, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { logAudit } from '../utils/auditLogger';
import { useI18n } from '../i18n/context';

interface RegisterWizardProps {
  onComplete: () => void;
  onNavigate: (page: string) => void;
}

const KENYAN_BUSINESS_TYPES = [
  'Bakery', 'Restaurant', 'Retail Store', 'Wholesale Store', 'Agrovet', 
  'Pharmacy / Chemist', 'Hardware Shop', 'Salon & Spa', 'Kibanda', 'Supermarket', 
  'Electronics Store', 'Posho Mill', 'Matatu Sacco', 'Boutique', 'Butchery', 'Hardware', 'Other'
];

export default function RegisterWizard({ onComplete, onNavigate }: RegisterWizardProps) {
  const { t } = useI18n();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Fields State
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail Store');
  const [location, setLocation] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatPercentage, setVatPercentage] = useState(16);

  const totalSteps = 5;

  const nextStep = () => {
    if (step === 2 && !businessName.trim()) return;
    if (step === 2 && !location.trim()) return;
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const selectPresetLogo = (url: string) => {
    setLogoUrl(url);
  };

  const handleLaunch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Generate unique business id
      const businessRef = doc(collection(db, 'businesses'));
      const businessId = businessRef.id;

      const subscriptionExpiry = new Date();
      subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 3); // 3 months free plan trial

      const bPayload = {
        name: businessName.trim(),
        type: businessType,
        location: location.trim(),
        ownerUid: user.uid,
        ownerEmail: user.email || '',
        logoUrl: logoUrl.trim() || 'https://img.icons8.com/color/192/000000/shop.png',
        status: 'active',
        currency: 'KES',
        vatEnabled,
        vatPercentage: vatEnabled ? Number(vatPercentage) : 0,
        receiptConfig: {
          logoUrl: logoUrl.trim() || 'https://img.icons8.com/color/192/000000/shop.png',
          businessName: businessName.trim(),
          tagline: 'Thank you for your business!',
          contactInfo: `Location: ${location.trim()}`,
          footerMessage: 'Welcome again!'
        },
        subscriptionPlan: 'free',
        subscriptionExpiry: subscriptionExpiry.toISOString(),
        privileges: {
          canEditReceipts: true,
          canAddBranches: true,
          maxBranches: 3,
          maxUsers: 10
        },
        createdAt: new Date().toISOString()
      };

      // 2. Set business configuration
      await setDoc(businessRef, bPayload);

      // 3. Create or update owner record in /users/
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        businessId,
        branchId: 'main_hq', // default first branch
        role: 'Owner',
        displayName: user.displayName || 'Owner',
        email: user.email || '',
        isActive: true,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // 4. Create default branch document under /businesses/{businessId}/branches/main_hq
      await setDoc(doc(db, `businesses/${businessId}/branches`, 'main_hq'), {
        name: 'Main HQ Branch',
        location: location.trim(),
        contactNumber: '0700000000',
        active: true,
        createdAt: new Date().toISOString()
      });

      // 5. Log audit trail
      await logAudit(
        businessId,
        'BUSINESS_CREATED',
        'businesses',
        businessId,
        'main_hq',
        user.uid,
        user.displayName || 'Owner',
        { name: businessName.trim(), type: businessType }
      );

      // Refresh auth profile to read the new role/business details
      await refreshProfile();
      onComplete();
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register business. Please verify connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white flex flex-col justify-center items-center px-4 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2C2C2E_1px,transparent_1px),linear-gradient(to_bottom,#2C2C2E_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_100%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Brand logo at top */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => onNavigate('landing')}>
        <div className="w-10 h-10 border border-[#C5A059] bg-[#161618] flex items-center justify-center">
          <span className="serif text-xl font-bold text-[#C5A059]">V</span>
        </div>
        <span className="font-display font-light text-2xl tracking-wide uppercase">{t('appName')}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-6 px-1">
        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-2 font-mono uppercase tracking-wider">
          <span>{t('wizardTitle')}</span>
          <span>{step} / {totalSteps}</span>
        </div>
        <div className="h-1.5 w-full bg-[#161618] border border-stone-800">
          <div 
            className="h-full bg-[#C5A059] transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Step card */}
      <div className="w-full max-w-lg glass rounded-none border border-stone-850 p-6 md:p-8 relative">
        {step === 1 && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mx-auto mb-4 font-light">
              <ShoppingBag className="w-6 h-6" />
            </div>
            
            <h2 className="serif text-2xl md:text-3xl text-white font-light uppercase tracking-wide">
              {t('wizardWelcome')}
            </h2>
            
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto font-light">
              Hello, <span className="font-semibold text-[#C5A059]">{user?.displayName}</span>! Follow these simple steps to set up your store database, configure branch locations, tax thresholds, and receipt formats.
            </p>

            <button
              onClick={nextStep}
              className="w-full py-4 bg-[#C5A059] border border-[#C5A059] text-black hover:bg-transparent hover:text-[#C5A059] transition-all font-semibold rounded-none flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer duration-300"
            >
              Set Up My Store
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="serif text-xl text-white flex items-center gap-2 mb-4 font-light uppercase tracking-wider">
              <Building2 className="w-5 h-5 text-[#C5A059]" />
              Business Profile
            </h3>

            <div>
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block mb-2">
                {t('businessName')} *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Mutua Wholesalers LTD"
                className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none px-4 py-3 text-white text-sm outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block mb-2">
                {t('businessType')}
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-[#030303] border border-stone-800 rounded-none px-4 py-3 text-white text-sm outline-none cursor-pointer font-mono"
              >
                {KENYAN_BUSINESS_TYPES.map((type, id) => (
                  <option key={id} value={type} className="bg-[#161618]">{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block mb-2">
                {t('cityTown')} *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Mombasa Road, Nairobi"
                className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none px-4 py-3 text-white text-sm outline-none font-mono"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={prevStep} className="px-5 py-3 border border-stone-800 hover:border-[#C5A059] rounded-none text-xs uppercase tracking-wider text-stone-400 hover:text-white font-mono transition-colors">
                Back
              </button>
              <button 
                onClick={nextStep}
                disabled={!businessName.trim() || !location.trim()}
                className="flex-1 py-3 bg-[#C5A059] border border-[#C5A059] text-black hover:bg-transparent hover:text-[#C5A059] disabled:opacity-40 font-semibold rounded-none text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer duration-300"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="serif text-xl text-white flex items-center gap-2 mb-4 font-light uppercase tracking-wider">
              <Image className="w-5 h-5 text-[#C5A059]" />
              Store Logo & Design
            </h3>

            <div>
              <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block mb-2">
                {t('logoUpload')} (Optional)
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Paste direct URL to a logo or icon image"
                className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none px-4 py-3 text-white text-sm outline-none font-mono"
              />
              <p className="text-[10px] text-stone-500 mt-2 font-mono">
                Leave empty or select one of the Kenya preset store icons below:
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 pt-2">
              {[
                { label: 'Shop', URL: 'https://img.icons8.com/color/192/000000/shop.png' },
                { label: 'Cart', URL: 'https://img.icons8.com/color/192/000000/shopping-cart.png' },
                { label: 'Grocery', URL: 'https://img.icons8.com/color/192/000000/vegetables.png' },
                { label: 'Tech', URL: 'https://img.icons8.com/color/192/000000/smartphone.png' }
              ].map((icon, id) => (
                <button
                  key={id}
                  onClick={() => selectPresetLogo(icon.URL)}
                  className={`p-3 rounded-none bg-black/30 border ${logoUrl === icon.URL ? 'border-[#C5A059] bg-[#161618]' : 'border-stone-850'} text-center hover:border-white transition-all`}
                >
                  <img src={icon.URL} alt={icon.label} className="w-8 h-8 mx-auto mb-1.5 object-contain" />
                  <span className="text-[9px] block text-stone-500 font-semibold uppercase tracking-wider font-mono">{icon.label}</span>
                </button>
              ))}
            </div>

            {logoUrl && (
              <div className="flex items-center gap-3 bg-[#030303] p-3 rounded-none border border-stone-850 text-xs">
                <img src={logoUrl} alt="Logo Preview" className="w-10 h-10 object-contain rounded-none bg-stone-900 p-1" />
                <span className="text-stone-400 break-all truncate font-mono text-[10px]">{logoUrl}</span>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button onClick={prevStep} className="px-5 py-3 border border-stone-800 hover:border-[#C5A059] rounded-none text-xs uppercase tracking-wider text-stone-400 hover:text-white font-mono transition-colors">
                Back
              </button>
              <button onClick={nextStep} className="flex-1 py-3 bg-[#C5A059] border border-[#C5A059] text-black hover:bg-transparent hover:text-[#C5A059] font-semibold rounded-none text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer duration-300">
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h3 className="serif text-xl text-white flex items-center gap-2 mb-4 font-light uppercase tracking-wider">
              <Percent className="w-5 h-5 text-[#C5A059]" />
              Kenyan Fiscal Settings
            </h3>

            <div className="bg-[#030303] p-4 border border-stone-850 text-xs space-y-1">
              <p className="font-semibold text-[#C5A059] uppercase tracking-wide text-[10px] font-mono">Currency: KES (Kenyan Shilling)</p>
              <p className="text-stone-400 leading-normal font-light">Our system enforces compliance formatting in Kenyan Shillings (Ksh) out of the box. No currency conversions necessary.</p>
            </div>

            <div className="flex items-center justify-between bg-[#030303] border border-stone-850 p-4">
              <div>
                <span className="text-xs font-semibold text-white block uppercase tracking-wide">Value Added Tax (VAT)</span>
                <span className="text-[10px] text-stone-500 block">Add tax automatically to POS transactions</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatEnabled}
                  onChange={(e) => setVatEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C5A059]" />
              </label>
            </div>

            {vatEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-[10px] text-stone-400 uppercase tracking-widest font-mono block">
                  Kenya Standard VAT Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={vatPercentage}
                  onChange={(e) => setVatPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                  placeholder="16"
                  className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none px-4 py-3 text-white text-sm outline-none font-mono"
                />
              </motion.div>
            )}

            <div className="flex gap-4 pt-6">
              <button onClick={prevStep} className="px-5 py-3 border border-stone-800 hover:border-[#C5A059] rounded-none text-xs uppercase tracking-wider text-stone-400 hover:text-white font-mono transition-colors">
                Back
              </button>
              <button onClick={nextStep} className="flex-1 py-3 bg-[#C5A059] border border-[#C5A059] text-black hover:bg-transparent hover:text-[#C5A059] font-semibold rounded-none text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer duration-300">
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="serif text-xl text-white flex items-center gap-2 mb-4 font-light uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse" />
              Summary & Review
            </h3>

            <div className="space-y-2.5 text-xs bg-[#030303] border border-stone-850 p-4 rounded-none font-mono">
              <p><span className="text-stone-500 UPPERCASE font-bold mr-2 text-[10px]">Business Name:</span> {businessName}</p>
              <p><span className="text-stone-500 UPPERCASE font-bold mr-2 text-[10px]">Type:</span> {businessType}</p>
              <p><span className="text-stone-500 UPPERCASE font-bold mr-2 text-[10px]">Location:</span> {location}</p>
              <p><span className="text-stone-500 UPPERCASE font-bold mr-2 text-[10px]">VAT Enabled:</span> {vatEnabled ? `Yes (${vatPercentage}%)` : 'No'}</p>
              <p><span className="text-stone-500 UPPERCASE font-bold mr-2 text-[10px]">Trial Plan:</span> 90 Days Premium Trial (KES 0.00)</p>
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                onClick={prevStep} 
                className="px-5 py-3 border border-stone-800 hover:border-[#C5A059] rounded-none text-xs uppercase tracking-wider text-stone-400 hover:text-white font-mono transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-500 text-black border border-emerald-500 hover:bg-transparent hover:text-emerald-500 font-semibold rounded-none text-xs uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer transition-all duration-300"
              >
                {loading ? t('loading') : t('launchMyBusiness')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
