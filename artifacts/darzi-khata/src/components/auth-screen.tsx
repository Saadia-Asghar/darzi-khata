import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, Loader2, Store, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { DICT, setCurrentLang, type DictKey } from '../lib/i18n';
import { BrandMark } from './brand-mark';
import { LanguageSwitch } from './language-switch';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Opening tab, e.g. from /app/login?mode=signup. */
  initialTab?: 'login' | 'signup';
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

export function AuthScreen({ onLogin, onSignup, initialTab = 'login' }: AuthScreenProps) {
  const [urduFirst, setUrduFirst] = useState(() => { try { return localStorage.getItem('darzi-khata-auth-lang') === 'ur'; } catch { return false; } });
  setCurrentLang(urduFirst ? 'ur' : 'en');
  const L = (k: DictKey) => DICT[k][urduFirst ? 'ur' : 'en'];
  const [tab, setTab] = useState<Tab>(initialTab);
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
    if (!result.success) setLoginError(result.error ?? L('auth_login_failed'));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    if (signupPassword !== signupConfirm) { setSignupError(L('auth_pw_mismatch')); return; }
    setSignupLoading(true);
    const result = await onSignup(signupName, signupEmail, signupPassword, signupShop, signupRole, signupOwnerEmail);
    setSignupLoading(false);
    if (!result.success) setSignupError(result.error ?? L('auth_signup_failed'));
  };

  const quickLogin = async (email: string, password: string) => {
    setLoginError('');
    setLoginLoading(true);
    setTab('login');
    setLoginEmail(email);
    setLoginPassword(password);
    const result = await onLogin(email, password);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.error ?? L('auth_login_failed'));
  };

  const field = 'w-full min-h-[48px] px-3.5 rounded-md border border-input bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';
  const lab = 'block text-sm font-medium text-foreground mb-1';
  const tabCls = (on: boolean) => `flex-1 min-h-[48px] text-base font-medium flex items-center justify-center gap-2 border-b-2 ${on ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`;
  return (
    <main className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" lang={urduFirst ? 'ur' : 'en'} dir={urduFirst ? 'rtl' : 'ltr'}>
      <aside className="hidden lg:flex flex-col justify-center gap-4 px-4 py-4 bg-primary-soft border-e border-border" data-testid="auth-intro">
        <div className="max-w-[560px] w-full mx-auto space-y-4">
          <div className="flex items-center gap-3"><BrandMark size={40} /><span className="text-lg font-semibold">{L('app_name')}</span></div>
          <h2 className="text-2xl font-semibold text-foreground">{L('dk_auth_intro_title')}</h2>
          <ul className="space-y-2">
            {(['dk_auth_intro_1', 'dk_auth_intro_2', 'dk_auth_intro_3'] as const).map((k) => (
              <li key={k} className="flex items-start gap-2 text-base"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{L(k)}</li>
            ))}
          </ul>
          <img src={`${import.meta.env.BASE_URL}screens/orders-${urduFirst ? 'ur' : 'en'}.webp`} alt={L('dk_auth_shot_alt')} loading="lazy"
            className="w-full max-h-[52vh] object-contain object-top rounded-lg border border-border bg-card shadow-lg" data-testid="img-auth-screenshot" />
        </div>
      </aside>
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-4">
      <div className="w-full max-w-sm flex justify-end mb-2">
        <LanguageSwitch value={urduFirst ? 'ur' : 'en'} onChange={language => {
          setUrduFirst(language === 'ur');
          try { localStorage.setItem('darzi-khata-auth-lang', language); } catch { /* private mode */ }
        }} />
      </div>
      <div className="w-full max-w-sm mb-4 flex items-center gap-3">
        <BrandMark size={48} />
        <div className="min-w-0">
          <h1 className={`text-xl font-semibold text-foreground ${urduFirst ? 'font-urdu' : ''}`} lang={urduFirst ? 'ur' : 'en'}>{L('app_name')}</h1>
        </div>
      </div>
      <p className="w-full max-w-sm text-base text-muted-foreground mb-4">{L('auth_tagline')}</p>

      <div className="w-full max-w-sm bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex border-b border-border" role="tablist">
          <button role="tab" aria-selected={tab === 'login'} onClick={() => { setTab('login'); setLoginError(''); }} className={tabCls(tab === 'login')} data-testid="tab-login"><LogIn size={20} aria-hidden /> {L('auth_login')}</button>
          <button role="tab" aria-selected={tab === 'signup'} onClick={() => { setTab('signup'); setSignupError(''); }} className={tabCls(tab === 'signup')} data-testid="tab-signup"><UserPlus size={20} aria-hidden /> {L('auth_signup')}</button>
        </div>
        <div className="p-4">
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className={lab}>{L('auth_email')}</label>
                <input id="login-email" type="email" required autoComplete="email" aria-label={L('auth_email')} placeholder={L('auth_email_placeholder')} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={field} dir="ltr" data-testid="input-login-email" />
              </div>
              <div>
                <label htmlFor="login-password" className={lab}>{L('auth_password')}</label>
                <div className="relative">
                  <input id="login-password" type={loginShowPw ? 'text' : 'password'} required autoComplete="current-password" aria-label={L('auth_password')} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`${field} pe-12`} dir="ltr" data-testid="input-login-password" />
                  <button type="button" onClick={() => setLoginShowPw((v) => !v)} className="absolute end-0 top-0 h-[48px] w-[48px] flex items-center justify-center text-muted-foreground" aria-label={L(loginShowPw ? 'auth_hide_pw' : 'auth_show_pw')}>{loginShowPw ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}</button>
                </div>
              </div>
              {loginError && <p role="alert" className="text-danger text-sm font-medium bg-danger-soft rounded-md px-3 py-2">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="w-full min-h-[48px] bg-primary disabled:opacity-60 text-primary-foreground text-base font-semibold rounded-md flex items-center justify-center gap-2" data-testid="btn-login">
                {loginLoading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <LogIn size={20} aria-hidden />}
                {L('auth_login')}
              </button>

              <div className="border-t border-border pt-2">
                <button type="button" onClick={() => setDemoOpen((v) => !v)} aria-expanded={demoOpen} className="w-full min-h-[48px] flex items-center justify-between px-3.5 text-base font-medium hover:bg-muted" data-testid="btn-demo-accounts">
                  <span>{L('auth_demo_accounts')}</span>
                  {demoOpen ? <ChevronUp size={20} aria-hidden /> : <ChevronDown size={20} aria-hidden />}
                </button>
                {demoOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button key={acc.email} type="button" disabled={loginLoading} onClick={() => quickLogin(acc.email, acc.password)} className="w-full min-h-[56px] px-3.5 py-2 flex items-center justify-between gap-2 text-start hover:bg-muted disabled:opacity-50" data-testid={`demo-login-${acc.email.split('@')[0]}`}>
                        <span className="min-w-0">
                          <span className="block text-base font-medium">{acc.name} <span className="text-sm text-muted-foreground">· {acc.color === 'emerald' ? L('shop_owner') : L('auth_karigar')}</span></span>
                          <span className="block text-sm text-muted-foreground" dir="ltr">{acc.email}</span>
                        </span>
                        <LogIn size={20} aria-hidden className="text-primary shrink-0" />
                      </button>
                    ))}
                    <p className="px-3.5 py-2 text-sm text-muted-foreground">{L('auth_demo_pw')} <span className="num font-semibold" dir="ltr">demo1234</span></p>
                  </div>
                )}
              </div>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <fieldset>
                <legend className={lab}>{L('auth_who')}</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed={signupRole === 'owner'} onClick={() => setSignupRole('owner')} className={`min-h-[72px] p-3 rounded-md border flex flex-col items-center gap-1 ${signupRole === 'owner' ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground'}`} data-testid="btn-role-owner">
                    <Store size={20} aria-hidden /><span className="text-sm font-medium">{L('shop_owner')}</span>
                  </button>
                  <button type="button" aria-pressed={signupRole === 'karigar'} onClick={() => setSignupRole('karigar')} className={`min-h-[72px] p-3 rounded-md border flex flex-col items-center gap-1 ${signupRole === 'karigar' ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground'}`} data-testid="btn-role-karigar">
                    <Users size={20} aria-hidden /><span className="text-sm font-medium">{L('auth_karigar')}</span>
                  </button>
                </div>
              </fieldset>
              <div>
                <label htmlFor="su-name" className={lab}>{L('auth_your_name')}</label>
                <input id="su-name" type="text" required aria-label={L('auth_your_name')} value={signupName} onChange={(e) => setSignupName(e.target.value)} className={field} data-testid="input-signup-name" />
              </div>
              <div>
                <label htmlFor="su-shop" className={lab}>{signupRole === 'owner' ? L('auth_shop_name') : L('auth_display_name')}</label>
                <input id="su-shop" type="text" aria-label={signupRole === 'owner' ? L('auth_shop_name') : L('auth_display_name')} value={signupShop} onChange={(e) => setSignupShop(e.target.value)} className={field} data-testid="input-signup-shop" />
              </div>
              {signupRole === 'karigar' && (
                <div>
                  <label htmlFor="su-owner" className={lab}>{L('auth_owner_email')}</label>
                  <input id="su-owner" type="email" required aria-label={L('auth_owner_email')} placeholder="malik@email.com" value={signupOwnerEmail} onChange={(e) => setSignupOwnerEmail(e.target.value)} className={field} dir="ltr" data-testid="input-signup-owner" />
                  <p className="text-sm text-muted-foreground mt-1">{L('auth_owner_hint')}</p>
                </div>
              )}
              <div>
                <label htmlFor="su-email" className={lab}>{L('auth_email')}</label>
                <input id="su-email" type="email" required autoComplete="email" aria-label={L('auth_email')} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className={field} dir="ltr" data-testid="input-signup-email" />
              </div>
              <div>
                <label htmlFor="su-pw" className={lab}>{L('auth_password')} <span className="font-normal text-muted-foreground">{L('auth_pw_min')}</span></label>
                <div className="relative">
                  <input id="su-pw" type={signupShowPw ? 'text' : 'password'} required minLength={6} autoComplete="new-password" aria-label={L('auth_password')} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className={`${field} pe-12`} dir="ltr" data-testid="input-signup-password" />
                  <button type="button" onClick={() => setSignupShowPw((v) => !v)} className="absolute end-0 top-0 h-[48px] w-[48px] flex items-center justify-center text-muted-foreground" aria-label={L(signupShowPw ? 'auth_hide_pw' : 'auth_show_pw')}>{signupShowPw ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}</button>
                </div>
              </div>
              <div>
                <label htmlFor="su-pw2" className={lab}>{L('auth_pw_confirm')}</label>
                <input id="su-pw2" type={signupShowPw ? 'text' : 'password'} required aria-label={L('auth_pw_confirm')} value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} className={`${field} ${signupConfirm && signupPassword !== signupConfirm ? 'border-danger' : ''}`} dir="ltr" data-testid="input-signup-confirm" />
              </div>
              {signupError && <p role="alert" className="text-danger text-sm font-medium bg-danger-soft rounded-md px-3 py-2">{signupError}</p>}
              <button type="submit" disabled={signupLoading} className="w-full min-h-[48px] bg-primary disabled:opacity-60 text-primary-foreground text-base font-semibold rounded-md flex items-center justify-center gap-2" data-testid="btn-signup">
                {signupLoading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <UserPlus size={20} aria-hidden />}
                {signupRole === 'karigar' ? L('auth_join_team') : L('auth_create_shop')}
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="w-full max-w-sm text-sm text-muted-foreground mt-4 text-center">{L('data_note')}</p>
      </div>
    </main>
  );
}
