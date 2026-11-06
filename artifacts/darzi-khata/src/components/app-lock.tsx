import { tl } from '../lib/i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuthContext } from '../context/auth-context';
import { useStoredValue, writeStorage } from '../lib/local-store';
import { createPinLock, migrateLegacyPin, pinKey, unlockPin, verifyPin, type PinLock } from '../lib/pin';
import { readJSON } from '../lib/storage';
import { useToast } from '../hooks/use-toast';
import { usePreferences } from '../hooks/use-preferences';
const LOCK_EVENT = 'darzi-khata-lock-now';
export function AppLockGate({ children }: { children: ReactNode }) {
  const { userId,logout } = useAuthContext();
  const { label } = usePreferences();
  const lock = useStoredValue<PinLock|null>(pinKey(userId),null);
  const [ready,setReady] = useState(false);
  const [unlocked,setUnlocked] = useState(false);
  const [pin,setPin] = useState('');
  const [error,setError] = useState('');
  const [initializationError,setInitializationError] = useState('');
  const [busy,setBusy] = useState(false);
  const [clock,setClock] = useState(Date.now());
  useEffect(() => {
    let active = true;
    migrateLegacyPin(userId).then(()=>{if(active){
      setUnlocked(!readJSON<PinLock|null>(pinKey(userId),null)?.enabled);
      setReady(true);
    }})
      .catch(()=>{if(active){setInitializationError(tl('m_pin_migration_failed_original_retained'));setReady(true);}});
    const listener = () => { setUnlocked(false); setPin(''); };
    window.addEventListener(LOCK_EVENT,listener);
    return () => { active=false;window.removeEventListener(LOCK_EVENT,listener); };
  }, [userId]);
  useEffect(() => {
    if (!lock?.lockedUntil || lock.lockedUntil<=Date.now()) return;
    const timer = setInterval(()=>setClock(Date.now()),500);
    return ()=>clearInterval(timer);
  }, [lock?.lockedUntil]);
  if (!ready) return <div role="status" className="min-h-screen grid place-items-center">{label('opening_khata')}</div>;
  if (initializationError) return <div className="min-h-screen grid place-items-center p-6"><div><p role="alert">{initializationError}</p><button className="min-h-11 underline" onClick={logout}>{label('sign_out')}</button></div></div>;
  if (!lock?.enabled || unlocked) return children;
  const wait = Math.max(0,Math.ceil((lock.lockedUntil-clock)/1000));
  return <div className="min-h-[100dvh] bg-background text-foreground grid place-items-center p-5">
    <form className="w-full max-w-sm space-y-4" onSubmit={async e=>{
      e.preventDefault();if(busy||wait)return;setBusy(true);setError('');
      try { if(await unlockPin(userId,pin)){setUnlocked(true);setPin('');}else {setError(label('wrong_pin'));setPin('');setClock(Date.now());} }
      catch(err){setError(err instanceof Error?err.message:label('could_not_unlock'));}
      finally{setBusy(false);}
    }}>
      <LockKeyhole size={40} className="text-primary" aria-hidden/>
      <h1 className="text-xl font-semibold">{label('unlock_your_khata')}</h1>
      <label className="block">{label('app_pin')}
        <input className="mt-2 w-full min-h-[56px] rounded-lg border border-input px-4 bg-card text-foreground text-2xl num tracking-[.4em] focus:outline-none focus:ring-2 focus:ring-ring" type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} autoComplete="off" required data-testid="unlock-pin"/>
      </label>
      {wait>0&&<p role="status">{label('t_try_again_in_ns', { wait })}</p>}
      {error&&<p role="alert" className="text-danger font-medium">{error}</p>}
      <button disabled={busy||wait>0} className="min-h-12 w-full bg-primary text-primary-foreground rounded-md text-base font-semibold disabled:opacity-50" data-testid="unlock-submit">{label('unlock')}</button>
      <button type="button" onClick={logout} className="min-h-11 w-full underline">{label('sign_out')}</button>
      <p className="text-sm text-muted-foreground">{label('local_privacy_lock_only_data_is_not_encr')}</p>
    </form>
  </div>;
}
export function PinSettings() {
  const { userId } = useAuthContext();
  const { label } = usePreferences();
  const { toast } = useToast();
  const lock = useStoredValue<PinLock|null>(pinKey(userId),null);
  const [current,setCurrent] = useState(''), [pin,setPin] = useState(''),[confirm,setConfirm] = useState('');
  const [busy,setBusy] = useState(false);
  async function save(disable=false) {
    if(busy)return;
    setBusy(true);
    try {
      const existing = readJSON<PinLock|null>(pinKey(userId),null);
      if(existing?.enabled) {
        if(!await unlockPin(userId,current))throw new Error(label('wrong_current_pin_or_temporarily_locked'));
        if(!await verifyPin(existing,current))throw new Error(label('wrong_pin'));
      }
      if(disable) {
        if(existing)writeStorage(pinKey(userId),{...existing,enabled:false,failures:0,lockedUntil:0});
      } else {
        if(pin!==confirm)throw new Error(label('pins_do_not_match'));
        writeStorage(pinKey(userId),await createPinLock(pin));
      }
      setCurrent('');setPin('');setConfirm('');
      toast({title:label(disable?'pin_disabled':'pin_saved')});
    } catch(err){toast({title:err instanceof Error?err.message:label('could_not_save_pin'),variant:'destructive'});}
    finally{setBusy(false);}
  }
  return <section className="rounded-lg border border-border p-4 space-y-3" data-testid="pin-settings">
    <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18}/>{label('optional_app_lock')}</h3>
    <p className="text-sm text-muted-foreground">{label('k_4_8_digits_five_wrong_tries_lock_for_30_')}</p>
    {lock?.enabled&&<label className="block text-sm">{label('current_pin')}<input aria-label={label('current_pin')} className="mt-1 w-full border rounded-lg p-3 bg-background" type="password" inputMode="numeric" maxLength={8} autoComplete="off" value={current} onChange={e=>setCurrent(e.target.value.replace(/\D/g,''))} data-testid="current-pin"/></label>}
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm">{label('new_pin')}<input aria-label={label('new_pin')} className="mt-1 w-full border rounded-lg p-3 bg-background" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} data-testid="new-pin"/></label>
      <label className="text-sm">{label('confirm_pin')}<input aria-label={label('confirm_pin')} className="mt-1 w-full border rounded-lg p-3 bg-background" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,''))} data-testid="confirm-pin"/></label>
    </div>
    <button type="button" disabled={busy} onClick={()=>save()} className="min-h-11 px-4 rounded-lg bg-primary text-primary-foreground font-semibold" data-testid="save-pin">{label('save_pin')}</button>
    {lock?.enabled&&<div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>save(true)} className="min-h-11 border rounded-lg px-3">{label('disable_pin')}</button><button type="button" onClick={()=>window.dispatchEvent(new Event(LOCK_EVENT))} className="min-h-11 border rounded-lg px-3" data-testid="lock-now">{label('lock_now')}</button></div>}
  </section>;
}
