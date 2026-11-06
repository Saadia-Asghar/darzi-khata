import { useRef, useState } from 'react';
import { Camera, ImageOff, Trash2, Loader2 } from 'lucide-react';
import { useFabricPhoto } from '../hooks/use-fabric-photo';
import { storeFabricPhoto } from '../lib/photos';
import { useAuthContext } from '../context/auth-context';
import { useDemoMode } from '../hooks/use-demo-mode';
import { usePreferences } from '../hooks/use-preferences';

export function usePhotoScope() {
  const { dataOwnerId } = useAuthContext();
  const { demoMode } = useDemoMode();
  return `${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
}

/** Small shared thumbnail used on cards, receipts and lists. */
export function FabricThumb({ id, size = 56, className = '' }: { id?: string; size?: number; className?: string }) {
  const { src, loading, error } = useFabricPhoto(id);
  const { label } = usePreferences();
  if (!id) return null;
  const box = { width: size, height: size };
  if (loading) return <div style={box} className={`rounded-lg bg-muted animate-pulse motion-reduce:animate-none shrink-0 ${className}`} aria-label={label('Loading photo', 'تصویر لوڈ ہو رہی ہے')} />;
  if (error || !src) return <div style={box} className={`rounded-lg bg-muted border border-dashed border-border flex items-center justify-center shrink-0 ${className}`} title={label('Photo unavailable', 'تصویر دستیاب نہیں')}><ImageOff size={16} className="text-muted-foreground" aria-hidden /></div>;
  return <img src={src} alt={label('Fabric photo', 'کپڑے کی تصویر')} style={box} className={`rounded-lg object-cover border border-border shrink-0 ${className}`} data-testid="img-fabric" />;
}

/** Camera / gallery picker. Stores compressed image in IndexedDB and returns its id. Never deletes old photos (needed for undo). */
export function FabricPhotoPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const scope = usePhotoScope();
  const { label } = usePreferences();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); setErr(undefined);
    try { onChange(await storeFabricPhoto(file, scope)); }
    catch (e) { setErr(e instanceof Error ? e.message : label('Photo could not be saved', 'تصویر محفوظ نہیں ہو سکی')); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  return (
    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
      <div className="flex items-center gap-3">
        {value ? <FabricThumb id={value} size={64} /> : <div className="h-16 w-16 rounded-lg bg-card border border-border flex items-center justify-center shrink-0"><Camera size={22} className="text-amber-600" aria-hidden /></div>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold">{label('Fabric photo', 'کپڑے کی تصویر')}</div>
          <div className="text-[11px] text-muted-foreground">{label('Saved on this phone only, under 200 KB', 'صرف اس فون پر، 200 KB سے کم')}</div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="min-h-[44px] px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-60" data-testid="btn-fabric-photo">
              {busy ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <Camera size={14} aria-hidden />}
              {value ? label('Retake', 'دوبارہ') : label('Take photo', 'تصویر لیں')}
            </button>
            {value && <button type="button" onClick={() => onChange(undefined)} className="min-h-[44px] min-w-[44px] rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-red-600" aria-label={label('Remove photo from order', 'تصویر ہٹائیں')} data-testid="btn-remove-photo"><Trash2 size={15} /></button>}
          </div>
        </div>
      </div>
      {err && <p role="alert" className="text-xs text-red-600 mt-2">{err}</p>}
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} data-testid="input-fabric-photo" />
    </div>
  );
}
