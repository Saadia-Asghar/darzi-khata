import type { CreditProfile } from './credit-score';
import type { Lang } from './i18n';

export interface LenderSnapshot {
  kind: 'lender'; lang: Lang; shop: string; homeBased: boolean; demo: boolean;
  profile: CreditProfile; profit: number; expenses: number; issuedAt: number; expiresAt: number;
}
export interface TrackingSnapshot {
  kind: 'track'; lang: Lang; shop: string; reference: string;
  status: string; deliveryDate: string; issuedAt: number; expiresAt: number;
  payment?: { balance: number; account: string; title: string; details: string };
}
export type PublicSnapshot = LenderSnapshot | TrackingSnapshot;
const encoder = new TextEncoder();
function base64(bytes: Uint8Array) {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function unbase64(s: string) {
  return Uint8Array.from(atob(s.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
}
// Each link signs a consented snapshot, not bank-verified financial evidence.
// Ephemeral keys are never stored/exported. Signature verifies integrity, not business identity.
export async function signSnapshot(snapshot: PublicSnapshot): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = await crypto.subtle.exportKey('raw', key.publicKey);
  const data = encoder.encode(JSON.stringify(snapshot));
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, data);
  return [base64(data), base64(new Uint8Array(pub)), base64(new Uint8Array(signature))].join('.');
}
export async function verifySnapshot(token: string, kind: PublicSnapshot['kind'], now = Date.now()): Promise<PublicSnapshot> {
  if (token.length > 40000) throw new Error('invalid');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid');
  const [data, pub, signature] = parts.map(unbase64);
  const key = await crypto.subtle.importKey('raw', pub, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  if (!await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signature, data)) throw new Error('invalid');
  const value = JSON.parse(new TextDecoder().decode(data)) as PublicSnapshot;
  if (value.kind !== kind || !['en', 'ur'].includes(value.lang) || typeof value.shop !== 'string'
    || !Number.isFinite(value.issuedAt) || value.issuedAt > now + 60000
    || !Number.isFinite(value.expiresAt) || value.expiresAt - value.issuedAt > 7 * 86400000
    || value.expiresAt <= value.issuedAt) throw new Error('invalid');
  if (value.expiresAt <= now) throw new Error('expired');
  if (kind === 'lender') {
    const p = (value as LenderSnapshot).profile;
    if (!p || !Array.isArray(p.monthly) || p.monthly.length > 12 || !Array.isArray(p.factors)
      || p.factors.length > 10 || !Number.isFinite(p.score) || p.score < 0 || p.score > 100
      || p.monthly.some(m => !m || !/^\d{4}-\d{2}$/.test(m.month) || !Number.isFinite(m.revenue) || m.revenue < 0)
      || p.factors.some(f => !f || typeof f.key !== 'string' || !Number.isFinite(f.score) || !Number.isFinite(f.weight))
      || [p.monthsActive, p.onTimePercent, p.collectionPercent, p.digitalPercent, p.collected,
        (value as LenderSnapshot).profit, (value as LenderSnapshot).expenses].some(n => !Number.isFinite(n))) throw new Error('invalid');
  } else {
    const s = value as TrackingSnapshot;
    if (!['pending', 'stitching', 'ready', 'delivered'].includes(s.status)
      || typeof s.reference !== 'string' || !Number.isFinite(Date.parse(s.deliveryDate))) throw new Error('invalid');
    if (s.payment && (!Number.isFinite(s.payment.balance) || s.payment.balance < 0
      || typeof s.payment.account !== 'string' || typeof s.payment.title !== 'string' || typeof s.payment.details !== 'string')) throw new Error('invalid');
  }
  return value;
}
export function snapshotUrl(kind: PublicSnapshot['kind'], token: string) {
  return `${location.origin}${import.meta.env.BASE_URL}${kind === 'lender' ? 'lender' : 'track'}/${token}`;
}
