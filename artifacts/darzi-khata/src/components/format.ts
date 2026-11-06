export const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) return `${d.slice(0, 4)} ${d.slice(4)}`;
  if (d.length === 12 && d.startsWith('92')) return `+92 ${d.slice(2, 5)} ${d.slice(5)}`;
  return p;
};
export const digits = (p: string) => p.replace(/\D/g, '');
export const rs = (n: number) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;
/** Match name, phone, or last four digits of phone. */
export function matchesCustomer(q: string, name: string, phone: string) {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const qd = digits(t);
  return name.toLowerCase().includes(t) || (qd.length > 0 && (digits(phone).includes(qd) || digits(phone).endsWith(qd)));
}
