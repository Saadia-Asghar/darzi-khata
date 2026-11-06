import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Users, UserPlus, UserX, Search, Copy, CheckCircle, Share2, BarChart2, CheckCircle2, Clock, Scissors } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuthContext } from '../context/auth-context';
import { useOrders } from '../hooks/use-orders';
import { getAccounts } from '../hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamModal({ open, onOpenChange }: TeamModalProps) {
  const { currentUser, userId } = useAuthContext();
  const { orders } = useOrders();
  const { toast } = useToast();
  const { label } = usePreferences();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{ name: string; email: string; id: string } | null | 'not_found' | 'already_member' | 'self'>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'add' | 'invite'>('activity');

  // All karigars in this owner's team
  const teamMembers = useMemo(() => getAccounts().filter(
    (a) => a.role === 'karigar' && a.ownerId === userId
  ), [userId, open]); // re-derive on open change

  // Per-karigar work stats from real orders
  const karigarStats = useMemo(() => {
    return teamMembers.map((m) => {
      const myOrders = orders.filter((o) => (o.karigar ?? '').toLowerCase() === m.name.toLowerCase());
      const pending = myOrders.filter((o) => o.status === 'pending').length;
      const stitching = myOrders.filter((o) => o.status === 'stitching').length;
      const ready = myOrders.filter((o) => o.status === 'ready').length;
      const delivered = myOrders.filter((o) => o.status === 'delivered').length;
      const active = pending + stitching + ready;
      const urgentCount = myOrders.filter((o) => o.urgent && o.status !== 'delivered').length;
      const recentComments = myOrders.flatMap((o) => (o.comments ?? []).filter((c) => c.authorId === m.id)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 1);
      return { member: m, pending, stitching, ready, delivered, active, urgentCount, lastMessage: recentComments[0] ?? null };
    });
  }, [teamMembers, orders]);

  // Unassigned orders (no karigar)
  const unassigned = useMemo(() =>
    orders.filter((o) => !o.karigar && o.status !== 'delivered').length,
    [orders]
  );

  const handleSearch = () => {
    const q = searchEmail.toLowerCase().trim();
    if (!q) return;
    if (q === currentUser?.email) { setSearchResult('self'); return; }
    const accounts = getAccounts();
    const found = accounts.find((a) => a.email.toLowerCase() === q);
    if (!found) { setSearchResult('not_found'); return; }
    if (found.ownerId === userId) { setSearchResult('already_member'); return; }
    setSearchResult({ name: found.name, email: found.email, id: found.id });
  };

  const handleAddMember = () => {
    if (!searchResult || typeof searchResult === 'string') return;
    const accounts = getAccounts();
    const updated = accounts.map((a) =>
      a.id === searchResult.id ? { ...a, ownerId: userId, ownerShopName: currentUser?.shopName } : a
    );
    localStorage.setItem('darzi-khata-accounts', JSON.stringify(updated));
    toast({ title: label(`${searchResult.name} added to team`, `${searchResult.name} ٹیم میں شامل`) });
    setSearchEmail('');
    setSearchResult(null);
    onOpenChange(false);
    setTimeout(() => onOpenChange(true), 50);
  };

  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const handleRemoveMember = (memberId: string, memberName: string) => setRemoveTarget({ id: memberId, name: memberName });
  const confirmRemoveMember = (memberId: string, memberName: string) => {
    const accounts = getAccounts();
    const updated = accounts.map((a) =>
      a.id === memberId ? { ...a, ownerId: undefined, ownerShopName: undefined } : a
    );
    localStorage.setItem('darzi-khata-accounts', JSON.stringify(updated));
    toast({ title: label(`${memberName} removed from team`, `${memberName} ٹیم سے ہٹا دیا`) });
    onOpenChange(false);
    setTimeout(() => onOpenChange(true), 50);
  };

  const inviteText = `Assalamu Alaikum!\n\nMujhe apni dukan "${currentUser?.shopName}" ke liye Darzi Khata app par join karein.\n\nSteps:\n1. App kholen\n2. Sign Up → "Karigar" select karein\n3. Owner Email mein yeh likhein:\n   ${currentUser?.email}\n4. Apna naam aur password set karein\n\nApp link: ${window.location.origin}\n\nShukria!`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: label('Invite message copied', 'دعوتی پیغام کاپی ہو گیا') });
    });
  };

  const handleShareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: 'Darzi Khata — Team Invite', text: inviteText });
    } else handleCopyInvite();
  };

  function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return label(`${mins} min ago`, `${mins} منٹ پہلے`);
    if (mins < 1440) return label(`${Math.floor(mins / 60)} h ago`, `${Math.floor(mins / 60)} گھنٹے پہلے`);
    return label(`${Math.floor(mins / 1440)} days ago`, `${Math.floor(mins / 1440)} دن پہلے`);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-0 shadow-2xl outline-none max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 border-b bg-emerald-800 text-white shrink-0 flex justify-between items-center">
            <div>
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                <Users size={18} className="text-amber-400" aria-hidden /> {label('Team', 'ٹیم')}
              </Dialog.Title>
              <Dialog.Description className="text-emerald-300 text-xs mt-0.5">
                {currentUser?.shopName} · {label(`${teamMembers.length} karigar`, `${teamMembers.length} کاریگر`)}
                {unassigned > 0 && <span className="ms-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{label(`${unassigned} unassigned`, `${unassigned} بغیر کاریگر`)}</span>}
              </Dialog.Description>
              <p className="text-amber-200 text-[10px] mt-1 leading-snug">{label('Same browser/device only, no cloud sync. Karigars must log in on this device.', 'صرف اسی ڈیوائس پر، کوئی کلاؤڈ نہیں۔ کاریگر اسی ڈیوائس پر لاگ ان کریں')}</p>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-emerald-700 text-white" aria-label={label('Close', 'بند کریں')}><X size={20} /></button>
            </Dialog.Close>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-border shrink-0 bg-muted">
            {([
              { id: 'activity' as const, label: label('Activity', 'کارکردگی'), },
              { id: 'add' as const, label: label('Add karigar', 'کاریگر شامل'), },
              { id: 'invite' as const, label: label('Invite', 'دعوت'), },
            ]).map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 min-h-[44px] text-xs font-bold transition-colors ${activeTab === t.id ? 'bg-background text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-12 bg-muted rounded-xl border border-dashed border-border">
                    <Users size={28} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground font-medium">{label('No team members', 'کوئی ٹیم ممبر نہیں')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label('Start from Add karigar or Invite', 'کاریگر شامل یا دعوت سے شروع کریں')}</p>
                  </div>
                ) : (
                  karigarStats.map(({ member, pending, stitching, ready, delivered, active, urgentCount, lastMessage }) => (
                    <div key={member.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      {/* Karigar header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center shrink-0">
                            <span className="text-sm font-black text-amber-800 dark:text-amber-200">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{member.name}</p>
                            <p className="text-[10px] text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {urgentCount > 0 && (
                            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">{label(`${urgentCount} urgent`, `${urgentCount} ہنگامی`)}</span>
                          )}
                          <button onClick={() => handleRemoveMember(member.id, member.name)} aria-label={label(`Remove ${member.name}`, `${member.name} کو ہٹائیں`)} className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><UserX size={16} aria-hidden /></button>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                        {[
                          { label: label('Pending', 'زیرِ التوا'), count: pending, color: 'text-gray-600 dark:text-gray-400' },
                          { label: label('Stitching', 'سلائی'), count: stitching, color: 'text-blue-600 dark:text-blue-400' },
                          { label: label('Ready', 'تیار'), count: ready, color: 'text-emerald-600 dark:text-emerald-400' },
                          { label: label('Delivered', 'دے دیا'), count: delivered, color: 'text-slate-500' },
                        ].map((s) => (
                          <div key={s.label} className="py-2.5 text-center">
                            <p className={`text-xl font-black ${s.color}`}>{s.count}</p>
                            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="px-4 py-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{label(`${active} active · ${delivered} complete`, `${active} جاری · ${delivered} مکمل`)}</span>
                          <span>{active + delivered > 0 ? Math.round((delivered / (active + delivered)) * 100) : 0}% {label('done', 'مکمل')}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${active + delivered > 0 ? (delivered / (active + delivered)) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Last message */}
                      {lastMessage && (
                        <div className="px-4 pb-3">
                          <p className="text-[10px] text-muted-foreground">
                            <span className="italic">"{lastMessage.text.slice(0, 60)}{lastMessage.text.length > 60 ? '…' : ''}"</span>
                            {' · '}{timeAgo(lastMessage.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {unassigned > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-center gap-3">
                    <Clock size={18} className="text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-orange-700 dark:text-orange-400">{label(`${unassigned} orders unassigned`, `${unassigned} آرڈر بغیر کاریگر`)}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-500">{label('Assign them to karigars from the order form', 'آرڈر فارم سے کاریگر مقرر کریں')}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── ADD TAB ── */}
            {activeTab === 'add' && (
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                  <p className="text-xs text-muted-foreground">{label('If the karigar already has an account, add them by email:', 'اگر کاریگر کا اکاؤنٹ ہے تو ای میل سے شامل کریں:')}</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="karigar@email.com" aria-label={label('Karigar email', 'کاریگر ای میل')}
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-muted-foreground"
                    />
                    <button onClick={handleSearch} className="px-4 min-h-[44px] bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl transition-colors flex items-center gap-1.5 text-sm font-semibold">
                      <Search size={15} aria-hidden /> {label('Search', 'تلاش')}
                    </button>
                  </div>

                  {searchResult && (
                    <div className={`rounded-xl p-3 text-sm ${typeof searchResult === 'object' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                      {searchResult === 'not_found' && <p className="text-red-600 dark:text-red-400">{label('No account with this email. Send a message from the Invite tab.', 'اس ای میل کا اکاؤنٹ نہیں ملا۔ دعوت ٹیب سے پیغام بھیجیں')}</p>}
                      {searchResult === 'already_member' && <p className="text-amber-600 dark:text-amber-400">{label('This user is already in your team.', 'یہ پہلے سے آپ کی ٹیم میں ہے')}</p>}
                      {searchResult === 'self' && <p className="text-gray-500">{label('This is your own email.', 'یہ آپ کی اپنی ای میل ہے')}</p>}
                      {typeof searchResult === 'object' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-emerald-800 dark:text-emerald-300">{searchResult.name}</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{searchResult.email}</p>
                          </div>
                          <button onClick={handleAddMember} className="px-3 min-h-[44px] bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors">
                            {label('Add', 'شامل کریں')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-muted rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{label('Demo accounts', 'ڈیمو اکاؤنٹ')}:</strong> bashir@darzikhata.com, ahmed@darzikhata.com, rustam@darzikhata.com — {label('all use password demo1234', 'سب کا پاس ورڈ demo1234')}
                  </p>
                </div>
              </div>
            )}

            {/* ── INVITE TAB ── */}
            {activeTab === 'invite' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">{label('If the karigar is not on the app yet, share this message. They sign up and join your team:', 'اگر کاریگر ایپ پر نہیں تو یہ پیغام بھیجیں۔ سائن اپ کر کے ٹیم میں شامل ہوں گے')}</p>
                <div className="bg-muted rounded-xl p-3.5 text-xs text-foreground whitespace-pre-wrap leading-relaxed border border-border font-mono">
                  {inviteText}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopyInvite} className="flex items-center justify-center gap-1.5 min-h-[44px] bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied ? label('Copied', 'کاپی ہو گیا') : label('Copy', 'کاپی کریں')}
                  </button>
                  <button onClick={handleShareInvite} className="flex items-center justify-center gap-1.5 min-h-[44px] bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors">
                    <Share2 size={14} aria-hidden /> {label('WhatsApp / Share', 'واٹس ایپ / شیئر')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>{label(`Remove ${removeTarget?.name ?? ''} from team?`, `${removeTarget?.name ?? ''} کو ٹیم سے ہٹائیں؟`)}</AlertDialogTitle>
            <AlertDialogDescription>{label('Their account stays, but they lose access to your shop orders.', 'اکاؤنٹ رہے گا لیکن آپ کے آرڈر نہیں دیکھ سکیں گے')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('Cancel', 'منسوخ')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-red-600 hover:bg-red-700" onClick={() => { if (removeTarget) confirmRemoveMember(removeTarget.id, removeTarget.name); setRemoveTarget(null); }} data-testid="btn-confirm-remove-member">{label('Remove', 'ہٹائیں')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog.Root>
  );
}
