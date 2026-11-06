import { useEffect, useState } from 'react';
import { getFabricPhoto } from '../lib/photos';
export function useFabricPhoto(id?: string) {
  const [state,setState] = useState<{src?:string;loading:boolean;error?:string}>({ loading: !!id });
  useEffect(() => {
    let cancelled = false, src: string | undefined;
    setState({ loading: !!id });
    if (id) getFabricPhoto(id).then(blob => {
      if (cancelled) return;
      if (!blob) { setState({ loading:false,error:'Photo not found / تصویر دستیاب نہیں' }); return; }
      src = URL.createObjectURL(blob); setState({ src, loading:false });
    }).catch(() => { if (!cancelled) setState({ loading:false,error:'Photo unavailable / تصویر دستیاب نہیں' }); });
    return () => { cancelled = true; if (src) URL.revokeObjectURL(src); };
  }, [id]);
  return state;
}
