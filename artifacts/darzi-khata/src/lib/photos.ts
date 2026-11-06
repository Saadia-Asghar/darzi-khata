type PhotoRecord = { id: string; scope: string; blob: Blob };
export type PhotoBackup = { id: string; data: string };
let connection: Promise<IDBDatabase> | undefined;
function database() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('Photo storage unavailable / تصویر محفوظ نہیں ہو سکتی'));
  connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('darzi-khata-photos', 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('photos', { keyPath: 'id' });
      store.createIndex('scope', 'scope');
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); connection = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { connection = undefined; reject(request.error); };
    request.onblocked = () => { connection = undefined; reject(new Error('Close another app tab to enable photos / دوسری ٹیب بند کریں')); };
  });
  return connection;
}
async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode);
    const request = operation(tx.objectStore('photos'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error || new Error('Photo storage failed / تصویر محفوظ نہیں ہوئی'));
    tx.onabort = () => reject(tx.error || new Error('Photo storage cancelled / تصویر محفوظ نہیں ہوئی'));
  });
}
export async function compressFabricPhoto(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(file.type) || file.size > 20 * 1024 * 1024)
    throw new Error('Choose an image under 20 MB / بیس ایم بی سے چھوٹی تصویر چنیں');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Invalid image / تصویر درست نہیں');
    const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    let width = Math.max(1, Math.round(image.naturalWidth * scale));
    let height = Math.max(1, Math.round(image.naturalHeight * scale));
    for (let round = 0; round < 8; round++) {
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Image compression unavailable / تصویر چھوٹی نہیں ہو سکتی');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,width,height); ctx.drawImage(image,0,0,width,height);
      for (const quality of [0.85, 0.65, 0.45]) {
        const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Image conversion failed')), 'image/jpeg', quality));
        if (blob.size < 200000) return blob;
      }
      width = Math.max(1,Math.round(width*0.7)); height = Math.max(1,Math.round(height*0.7));
    }
    throw new Error('Could not compress photo under 200 KB / تصویر چھوٹی نہ ہو سکی');
  } finally { URL.revokeObjectURL(url); }
}
export async function storeFabricPhoto(file: File, scope: string) {
  const blob = await compressFabricPhoto(file);
  const id = `${scope}:${crypto.randomUUID()}`;
  await transaction('readwrite', s => s.put({ id, scope, blob } satisfies PhotoRecord));
  return id;
}
export async function getFabricPhoto(id: string) {
  return (await transaction<PhotoRecord | undefined>('readonly', s => s.get(id)))?.blob;
}
export async function deleteFabricPhoto(id: string) { await transaction('readwrite', s => s.delete(id)); }
export async function clearPhotos(scope: string) {
  if (!globalThis.indexedDB) return;
  const ids = await transaction<IDBValidKey[]>('readonly', s => s.index('scope').getAllKeys(scope));
  if (!ids.length) return;
  const db = await database();
  await new Promise<void>((resolve,reject) => {
    const tx = db.transaction('photos','readwrite');
    ids.forEach(id => tx.objectStore('photos').delete(id));
    tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error);
  });
}
export async function exportPhotos(ids: string[]): Promise<PhotoBackup[]> {
  return Promise.all([...new Set(ids)].map(async id => {
    const blob = await getFabricPhoto(id);
    if (!blob) throw new Error('A fabric photo is missing; backup stopped / تصویر دستیاب نہیں، بیک اپ روک دیا');
    const data = await new Promise<string>((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { id, data };
  }));
}
export async function importPhotos(records: PhotoBackup[], scope: string) {
  if (!Array.isArray(records) || records.length > 1000) throw new Error('Invalid photo backup / تصویر بیک اپ درست نہیں');
  const map = new Map<string,string>();
  const photos = records.map(record => {
    if (typeof record.id !== 'string' || typeof record.data !== 'string' || record.data.length > 270000
      || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(record.data) || map.has(record.id))
      throw new Error('Invalid backup photo / بیک اپ تصویر درست نہیں');
    const [header, encoded] = record.data.split(',');
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    if (!bytes.length || bytes.length >= 200000) throw new Error('Backup photo exceeds 200 KB / تصویر بڑی ہے');
    const id = `${scope}:${crypto.randomUUID()}`;
    map.set(record.id,id);
    return { id, scope, blob: new Blob([bytes], { type: header.slice(5,header.indexOf(';')) }) };
  });
  if (photos.length) {
    const db = await database();
    await new Promise<void>((resolve,reject) => {
      const tx = db.transaction('photos','readwrite');
      photos.forEach(p => tx.objectStore('photos').put(p));
      tx.oncomplete = () => resolve(); tx.onabort = tx.onerror = () => reject(tx.error);
    });
  }
  return map;
}
