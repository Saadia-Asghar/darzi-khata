import { useState } from 'react';
import { Scissors, Eye, EyeOff, LogIn, UserPlus, Loader2, Store, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignup: (name: string, email: string, password: string, shopName: string, role: 'owner' | 'karigar', ownerEmail?: string) => Promise<{ success: boolean; error?: string }>;
}

type Tab = 'login' | 'signup';
type SignupRole = 'owner' | 'karigar';

const DEMO_ACCOUNTS = [
  { label: 'Shop Owner', name: 'Muhammad Arif', shop: 'Al-Madina Tailors', email: 'demo@darzikhata.com', password: 'demo1234', color: 'emerald' },
  { label: 'Ustad Bashir', name: 'Ustad Bashir', shop: 'Karigar', email: 'bashir@darzikhata.com', password: 'demo1234', color: 'amber' },
  { label: 'Ahmed Karigar', name: 'Ahmed Karigar', shop: 'Karigar', email: 'ahmed@darzikhata.com', password: 'demo1234', color: 'amber' },
  { label: 'Rustam Ustad', name: 'Rustam Ustad', shop: 'Karigar', email: 'rustam@darzikhata.com', password: 'demo1234', color: 'amber' },
];

export function AuthScreen({ onLogin, onSignup }: AuthScreenProps) {
  const [tab, setTab] = useState<Tab>('login');
  const [demoOpen, setDemoOpen] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
  const [signupRole, setSignupRole] = useState<SignupRole>('owner');
  const [signupName, setSignupName] = useState('');
  const [signupShop, setSignupShop] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupOwnerEmail, setSignupOwnerEmail] = useState('');
  const [signupShowPw, setSignupShowPw] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const result = await onLogin(loginEmail, loginPassword);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.error ?? 'Login fail ho gaya.');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (signupPassword !== signupConfirm) { setSignupError('Dono passwords match nahi kar rahe.'); return; }
    setSignupLoading(true);
    const result = await onSignup(signupName, signupEmail, signupPassword, signupShop, signupRole, signupOwnerEmail);
    setSignupLoading(false);
    if (!result.success) setSignupError(result.error ?? 'Account nahi bana.');
  };

  const quickLogin = async (email: string, password: string) => {
    setLoginError('');
    setLoginLoading(true);
    setTab('login');
    setLoginEmail(email);
    setLoginPassword(password);
    const result = await onLogin(email, password);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.error ?? 'Login fail ho gaya.');
  };

  return (
    <div className="min-h-[100dvh] bg-emerald-900 dark:bg-gray-950 flex flex-col items-center justify-center px-5 py-8">

      {/* Branding */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-700 rounded-full shadow-2xl mb-4">
          <Scissors size={36} color="#d97706" className="rotate-90" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-widest uppercase">DARZI KHATA</h1>
        <h2 className="font-urdu text-emerald-300 text-2xl mt-1">درزی کھاتہ</h2>
        <p className="text-emerald-400 text-sm mt-1">Tailor Shop Management App</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex">
          <button onClick={() => { setTab('login'); setLoginError(''); }} className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'login' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-gray-700'}`}>
            <LogIn size={15} /> Login
          </button>
          <button onClick={() => { setTab('signup'); setSignupError(''); }} className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${tab === 'signup' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-gray-700'}`}>
            <UserPlus size={15} /> Sign Up
          </button>
        </div>

        <div className="p-5">
          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email Address</label>
                <input type="email" required autoComplete="email" placeholder="aapka@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <input type={loginShowPw ? 'text' : 'password'} required autoComplete="current-password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400" />
                  <button type="button" onClick={() => setLoginShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>{loginShowPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              {loginError && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                {loginLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loginLoading ? 'Login ho raha hai...' : 'Login'}
              </button>

              {/* Demo section */}
              <div className="border border-dashed border-amber-300 dark:border-amber-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDemoOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <span className="text-xs font-bold flex items-center gap-2">Demo Accounts se try karein</span>
                  {demoOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {demoOpen && (
                  <div className="border-t border-dashed border-amber-200 dark:border-amber-800 divide-y divide-amber-100 dark:divide-amber-900">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={loginLoading}
                        onClick={() => quickLogin(acc.email, acc.password)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50 ${acc.color === 'emerald' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {acc.label}
                            {acc.color === 'emerald' && <span className="ml-2 text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">Owner</span>}
                            {acc.color === 'amber' && <span className="ml-2 text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">Karigar</span>}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{acc.email}</p>
                        </div>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold shrink-0 ml-2">Login →</span>
                      </button>
                    ))}
                    <p className="px-3.5 py-2 text-[10px] text-gray-400 text-center">Sab accounts ka password: <span className="font-mono font-bold">demo1234</span></p>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ── SIGNUP ── */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Aap kaun hain? *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSignupRole('owner')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${signupRole === 'owner' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'}`}>
                    <Store size={20} className={signupRole === 'owner' ? 'text-emerald-700' : 'text-gray-400'} />
                    <span className={`text-xs font-bold ${signupRole === 'owner' ? 'text-emerald-700' : 'text-gray-500'}`}>Shop Owner</span>
                    <span className="text-[10px] text-gray-400">Apni dukan banana</span>
                  </button>
                  <button type="button" onClick={() => setSignupRole('karigar')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-colors ${signupRole === 'karigar' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'}`}>
                    <Users size={20} className={signupRole === 'karigar' ? 'text-amber-600' : 'text-gray-400'} />
                    <span className={`text-xs font-bold ${signupRole === 'karigar' ? 'text-amber-600' : 'text-gray-500'}`}>Karigar</span>
                    <span className="text-[10px] text-gray-400">Team mein shamil hona</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Aapka Naam *</label>
                  <input type="text" required placeholder="Ahmed Ali" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{signupRole === 'owner' ? 'Dukan ka Naam' : 'Display Naam'}</label>
                  <input type="text" placeholder={signupRole === 'owner' ? 'Al-Rehman Tailors' : 'Ustad Ahmed'} value={signupShop} onChange={(e) => setSignupShop(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400" />
                </div>
              </div>

              {signupRole === 'karigar' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
                  <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Owner ki Email *</label>
                  <input type="email" required={signupRole === 'karigar'} placeholder="malik@email.com" value={signupOwnerEmail} onChange={(e) => setSignupOwnerEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400" />
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">Jis owner ki team mein shamil hona chahte hain</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email Address *</label>
                <input type="email" required autoComplete="email" placeholder="aapka@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Password * <span className="font-normal text-gray-400">(min 6 huroof)</span></label>
                <div className="relative">
                  <input type={signupShowPw ? 'text' : 'password'} required minLength={6} autoComplete="new-password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400" />
                  <button type="button" onClick={() => setSignupShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>{signupShowPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Password Confirm *</label>
                <input type={signupShowPw ? 'text' : 'password'} required placeholder="••••••••" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${signupConfirm && signupPassword !== signupConfirm ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`} />
              </div>

              {signupError && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{signupError}</p>}

              <button type="submit" disabled={signupLoading} className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                {signupLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {signupLoading ? 'Account ban raha hai...' : signupRole === 'karigar' ? 'Team Mein Shamil Hon' : 'Shop Banayein'}
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="text-emerald-600 dark:text-emerald-700 text-xs mt-6">Darzi Khata v2.0 — درزی کھاتہ · Data device par محفوظ</p>
    </div>
  );
}
