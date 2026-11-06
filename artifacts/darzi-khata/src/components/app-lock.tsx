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
      .catch(()=>{if(active){setInitializationError('PIN migration failed; original retained / پن تبدیل نہیں ہوا، اصل برقرار ہے');setReady(true);}});
    const listener = () => { setUnlocked(false); setPin(''); };
    window.addEventListener(LOCK_EVENT,listener);
    return () => { active=false;window.removeEventListener(LOCK_EVENT,listener); };
  }, [userId]);
  useEffect(() => {
    if (!lock?.lockedUntil || lock.lockedUntil<=Date.now()) return;
    const timer = setInterval(()=>setClock(Date.now()),500);
    return ()=>clearInterval(timer);
  }, [lock?.lockedUntil]);
  if (!ready) return <div role="status" className="min-h-screen grid place-items-center">{label('Opening khata…','کھاتہ کھل رہا ہے…')}</div>;
  if (initializationError) return <div className="min-h-screen grid place-items-center p-6"><div><p role="alert">{initializationError}</p><button className="min-h-11 underline" onClick={logout}>{label('Sign out','سائن آؤٹ')}</button></div></div>;
  if (!lock?.enabled || unlocked) return children;
  const wait = Math.max(0,Math.ceil((lock.lockedUntil-clock)/1000));
  return <div className="min-h-screen bg-emerald-950 text-white grid place-items-center p-5">
    <form className="w-full max-w-sm space-y-4" onSubmit={async e=>{
      e.preventDefault();if(busy||wait)return;setBusy(true);setError('');
      try { if(await unlockPin(userId,pin)){setUnlocked(true);setPin('');}else {setError(label('Wrong PIN','غلط پن'));setPin('');setClock(Date.now());} }
      catch(err){setError(err instanceof Error?err.message:label('Could not unlock','کھاتہ نہیں کھلا'));}
      finally{setBusy(false);}
    }}>
      <LockKeyhole size={44} className="text-amber-400"/>
      <h1 className="text-2xl font-bold">{label('Unlock your khata','اپنا کھاتہ کھولیں')}</h1>
      <label className="block">{label('App PIN','ایپ پن')}
        <input className="mt-2 w-full rounded-xl p-4 bg-white text-emerald-950 text-2xl tracking-[.4em]" type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} autoComplete="off" required data-testid="unlock-pin"/>
      </label>
      {wait>0&&<p role="status">{label(`Try again in ${wait}s`,` ${wait} سیکنڈ بعد کوشش کریں`)}</p>}
      {error&&<p role="alert" className="text-amber-200">{error}</p>}
      <button disabled={busy||wait>0} className="min-h-12 w-full bg-amber-400 text-emerald-950 rounded-xl font-bold disabled:opacity-50" data-testid="unlock-submit">{label('Unlock','کھولیں')}</button>
      <button type="button" onClick={logout} className="min-h-11 w-full underline">{label('Sign out','سائن آؤٹ')}</button>
      <p className="text-xs text-emerald-200">{label('Local privacy lock only. Data is not encrypted.','صرف مقامی پرائیویسی لاک، ڈیٹا انکرپٹ نہیں ہوتا۔')}</p>
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
        if(!await unlockPin(userId,current))throw new Error(label('Wrong current PIN or temporarily locked','موجودہ پن غلط ہے یا عارضی لاک ہے'));
        if(!await verifyPin(existing,current))throw new Error(label('Wrong PIN','غلط پن'));
      }
      if(disable) {
        if(existing)writeStorage(pinKey(userId),{...existing,enabled:false,failures:0,lockedUntil:0});
      } else {
        if(pin!==confirm)throw new Error(label('PINs do not match','پن ایک جیسے نہیں'));
        writeStorage(pinKey(userId),await createPinLock(pin));
      }
      setCurrent('');setPin('');setConfirm('');
      toast({title:label(disable?'PIN disabled':'PIN saved',disable?'پن بند ہوگیا':'پن محفوظ ہوگیا')});
    } catch(err){toast({title:err instanceof Error?err.message:label('Could not save PIN','پن محفوظ نہیں ہوا'),variant:'destructive'});}
    finally{setBusy(false);}
  }
  return <section className="rounded-xl border border-border p-4 space-y-3" data-testid="pin-settings">
    <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18}/>{label('Optional app lock','اختیاری ایپ لاک')}</h3>
    <p className="text-xs text-muted-foreground">{label('4–8 digits. Five wrong tries lock for 30 seconds. Not data encryption.','چار سے آٹھ ہندسے۔ پانچ غلط کوششوں پر تیس سیکنڈ لاک۔ ڈیٹا انکرپشن نہیں۔')}</p>
    {lock?.enabled&&<label className="block text-sm">{label('Current PIN','موجودہ پن')}<input aria-label={label('Current PIN','موجودہ پن')} className="mt-1 w-full border rounded-lg p-3 bg-background" type="password" inputMode="numeric" maxLength={8} autoComplete="off" value={current} onChange={e=>setCurrent(e.target.value.replace(/\D/g,''))} data-testid="current-pin"/></label>}
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm">{label('New PIN','نیا پن')}<input aria-label={label('New PIN','نیا پن')} className="mt-1 w-full border rounded-lg p-3 bg-background" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} data-testid="new-pin"/></label>
      <label className="text-sm">{label('Confirm PIN','پن دہرائیں')}<input aria-label={label('Confirm PIN','پن دہرائیں')} className="mt-1 w-full border rounded-lg p-3 bg-background" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,''))} data-testid="confirm-pin"/></label>
    </div>
    <button type="button" disabled={busy} onClick={()=>save()} className="min-h-11 px-4 rounded-lg bg-emerald-700 text-white font-semibold" data-testid="save-pin">{label('Save PIN','پن محفوظ کریں')}</button>
    {lock?.enabled&&<div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>save(true)} className="min-h-11 border rounded-lg px-3">{label('Disable PIN','پن بند کریں')}</button><button type="button" onClick={()=>window.dispatchEvent(new Event(LOCK_EVENT))} className="min-h-11 border rounded-lg px-3" data-testid="lock-now">{label('Lock now','ابھی لاک کریں')}</button></div>}
  </section>;
}
