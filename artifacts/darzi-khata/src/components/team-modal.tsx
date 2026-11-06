import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from './page-dialog';
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
  const { label, one } = usePreferences();
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
    toast({ title: label('t_n_added_to_team', { name: searchResult.name }) });
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
    toast({ title: label('t_n_removed_from_team', { memberName }) });
    onOpenChange(false);
    setTimeout(() => onOpenChange(true), 50);
  };

  const inviteText = one('team_invite_text', { shop: currentUser?.shopName ?? '', email: currentUser?.email ?? '', link: window.location.origin });

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: label('invite_message_copied') });
    });
  };

  const handleShareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: one('team_invite_title'), text: inviteText });
    } else handleCopyInvite();
  };

  function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return label('t_n_min_ago', { mins });
    if (mins < 1440) return label('t_n_h_ago', { mins: Math.floor(mins / 60) });
    return label('t_n_days_ago', { mins: Math.floor(mins / 1440) });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50 " />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-0  outline-none max-h-[90vh] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 border-b bg-card text-foreground border-border shrink-0 flex justify-between items-center">
            <div>
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                <Users size={18} className="text-warning" aria-hidden /> {label('team')}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm mt-0.5">
                {currentUser?.shopName} · {label('t_n_karigar', { teamMembersCount: teamMembers.length })}
                {unassigned > 0 && <span className="ms-2 bg-danger text-danger-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">{label('t_n_unassigned', { unassigned })}</span>}
              </Dialog.Description>
              <p className="text-accent-foreground text-xs mt-1 leading-snug">{label('same_browser_device_only_no_cloud_sync_k')}</p>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground" aria-label={label('close')}><X size={20} /></button>
            </Dialog.Close>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-border shrink-0 bg-muted">
            {([
              { id: 'activity' as const, label: label('activity'), },
              { id: 'add' as const, label: label('add_karigar'), },
              { id: 'invite' as const, label: label('invite'), },
            ]).map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex-1 min-h-[44px] text-sm font-bold transition-colors ${activeTab === t.id ? 'bg-background text-primary  border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-12 bg-muted rounded-lg border border-dashed border-border">
                    <Users size={28} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground font-medium">{label('no_team_members')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{label('start_from_add_karigar_or_invite')}</p>
                  </div>
                ) : (
                  karigarStats.map(({ member, pending, stitching, ready, delivered, active, urgentCount, lastMessage }) => (
                    <div key={member.id} className="bg-card border border-border rounded-lg overflow-hidden">
                      {/* Karigar header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-warning-soft  border-b border-border ">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-warning-soft  flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-warning ">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {urgentCount > 0 && (
                            <span className="text-xs bg-danger text-danger-foreground font-bold px-2 py-0.5 rounded-full">{label('t_n_urgent', { urgentCount })}</span>
                          )}
                          <button onClick={() => handleRemoveMember(member.id, member.name)} aria-label={label('t_remove_n', { name: member.name })} className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-danger hover:bg-danger-soft  rounded-lg transition-colors"><UserX size={16} aria-hidden /></button>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                        {[
                          { label: label('pending'), count: pending, color: 'text-muted-foreground ' },
                          { label: label('stitching'), count: stitching, color: 'text-info ' },
                          { label: label('ready'), count: ready, color: 'text-primary ' },
                          { label: label('delivered'), count: delivered, color: 'text-muted-foreground' },
                        ].map((s) => (
                          <div key={s.label} className="py-2.5 text-center">
                            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                            <p className="text-xs font-semibold text-muted-foreground  ">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="px-4 py-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{label('t_n_active_n_complete', { active, delivered })}</span>
                          <span>{active + delivered > 0 ? Math.round((delivered / (active + delivered)) * 100) : 0}% {label('done')}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${active + delivered > 0 ? (delivered / (active + delivered)) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Last message */}
                      {lastMessage && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-muted-foreground">
                            <span className="italic">"{lastMessage.text.slice(0, 60)}{lastMessage.text.length > 60 ? '…' : ''}"</span>
                            {' · '}{timeAgo(lastMessage.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {unassigned > 0 && (
                  <div className="bg-warning-soft  border border-border  rounded-lg p-3 flex items-center gap-3">
                    <Clock size={18} className="text-warning shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-warning ">{label('t_n_orders_unassigned', { unassigned })}</p>
                      <p className="text-sm text-warning ">{label('assign_them_to_karigars_from_the_order_f')}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── ADD TAB ── */}
            {activeTab === 'add' && (
              <div className="space-y-4">
                <div className="bg-card p-4 rounded-lg border border-border space-y-3">
                  <p className="text-sm text-muted-foreground">{label('if_the_karigar_already_has_an_account_ad')}</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="karigar@email.com" aria-label={label('karigar_email')}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
                    />
                    <button onClick={handleSearch} className="px-4 min-h-[44px] bg-primary hover:bg-primary text-primary-foreground rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold">
                      <Search size={15} aria-hidden /> {label('search')}
                    </button>
                  </div>

                  {searchResult && (
                    <div className={`rounded-lg p-3 text-sm ${typeof searchResult === 'object' ? 'bg-primary-soft  border border-border ' : 'bg-danger-soft  border border-border '}`}>
                      {searchResult === 'not_found' && <p className="text-danger ">{label('no_account_with_this_email_send_a_messag')}</p>}
                      {searchResult === 'already_member' && <p className="text-warning ">{label('this_user_is_already_in_your_team')}</p>}
                      {searchResult === 'self' && <p className="text-muted-foreground">{label('this_is_your_own_email')}</p>}
                      {typeof searchResult === 'object' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-primary ">{searchResult.name}</p>
                            <p className="text-sm text-primary ">{searchResult.email}</p>
                          </div>
                          <button onClick={handleAddMember} className="px-3 min-h-[44px] bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary transition-colors">
                            {label('add_3')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-muted rounded-lg p-3 border border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{label('demo_accounts')}:</strong> bashir@darzikhata.com, ahmed@darzikhata.com, rustam@darzikhata.com · {label('all_use_password_demo1234')}
                  </p>
                </div>
              </div>
            )}

            {/* ── INVITE TAB ── */}
            {activeTab === 'invite' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{label('if_the_karigar_is_not_on_the_app_yet_sha')}</p>
                <div className="bg-muted rounded-lg p-3.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border font-mono">
                  {inviteText}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopyInvite} className="flex items-center justify-center gap-1.5 min-h-[44px] bg-primary hover:bg-primary text-primary-foreground text-sm font-bold rounded-lg transition-colors">
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied ? label('copied') : label('copy')}
                  </button>
                  <button onClick={handleShareInvite} className="flex items-center justify-center gap-1.5 min-h-[44px] bg-accent hover:bg-accent text-accent-foreground text-sm font-bold rounded-lg transition-colors">
                    <Share2 size={14} aria-hidden /> {label('whatsapp_share')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-lg z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('t_remove_n_from_team', { name: removeTarget?.name ?? '' })}</AlertDialogTitle>
            <AlertDialogDescription>{label('their_account_stays_but_they_lose_access')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('cancel_x')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-danger hover:bg-danger" onClick={() => { if (removeTarget) confirmRemoveMember(removeTarget.id, removeTarget.name); setRemoveTarget(null); }} data-testid="btn-confirm-remove-member">{label('remove')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog.Root>
  );
}
