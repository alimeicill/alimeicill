'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/StatCard';
import { AnnouncementsWidget } from '@/components/dashboard/AnnouncementsWidget';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Megaphone, ShieldCheck, ListTodo, Plus, Info, CreditCard, Send, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function SakinDashboardPage() {
  const router = useRouter();
  const [unpaidDues, setUnpaidDues] = useState<any[]>([]);
  const [activeDuesSum, setActiveDuesSum] = useState(0);
  const [activeInvCount, setActiveInvCount] = useState(0);
  const [latestGuestName, setLatestGuestName] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('technical');
  
  const [polls, setPolls] = useState<any[]>([]);

  const loadData = () => {
    // Unpaid Dues
    const savedDues = localStorage.getItem('sakin_dues');
    if (savedDues) {
      const parsedDues = JSON.parse(savedDues);
      setUnpaidDues(parsedDues);
      setActiveDuesSum(parsedDues.reduce((sum: number, due: any) => sum + due.amount, 0));
    } else {
      const defaultDues = [
        { id: 'due-1', type: 'Haziran 2026 Aidatı', period: 'Haziran 2026', amount: 1500, dueDate: '15.06.2026', status: 'PENDING' },
        { id: 'due-2', type: 'Ortak Alan Elektrik', period: 'Haziran 2026', amount: 240, dueDate: '20.06.2026', status: 'PENDING' },
      ];
      localStorage.setItem('sakin_dues', JSON.stringify(defaultDues));
      setUnpaidDues(defaultDues);
      setActiveDuesSum(1740);
    }

    // Active Invitations for QR card
    const savedInv = localStorage.getItem('sakin_invitations');
    if (savedInv) {
      const parsedInv = JSON.parse(savedInv);
      setActiveInvCount(parsedInv.length);
      if (parsedInv.length > 0) {
        setLatestGuestName(parsedInv[0].guestName);
      } else {
        setLatestGuestName('');
      }
    } else {
      setActiveInvCount(1);
      setLatestGuestName('Ali Demir');
    }

    // Load tickets from localStorage
    const savedTickets = localStorage.getItem('sakin_talepleri');
    if (savedTickets) {
      setTickets(JSON.parse(savedTickets));
    } else {
      const defaultTickets = [
        {
          id: 'ticket-1',
          title: 'Mutfak bataryasında sızıntı var',
          description: 'Mutfak tezgahının altındaki batarya bağlantısından su sızıyor. Contaların değişmesi gerekebilir.',
          category: 'technical',
          priority: 'medium',
          status: 'Devam Ediyor',
          date: '18.06.2026'
        },
        {
          id: 'ticket-2',
          title: '3. kat merdiven aydınlatması çalışmıyor',
          description: 'A Blok 3. kat asansör önündeki sensörlü lamba yanmıyor, ampulü değişmeli.',
          category: 'technical',
          priority: 'low',
          status: 'Açık',
          date: '24.06.2026'
        }
      ];
      localStorage.setItem('sakin_talepleri', JSON.stringify(defaultTickets));
      setTickets(defaultTickets);
    }

    // Load active polls
    const savedPolls = localStorage.getItem('site_anketler');
    if (savedPolls) {
      setPolls(JSON.parse(savedPolls).filter((p: any) => p.status === 'active'));
    } else {
      const defaultPolls = [
        {
          id: 'poll-1',
          title: 'Dış Cephe Boya Seçimi',
          question: 'A ve B blok dış cephe mantolama sonrası hangi ana renk tonu uygulansın?',
          options: [
            { id: 'opt-1-1', text: 'Kül Grisi & Antrasit Detaylar', votes: 14 },
            { id: 'opt-1-2', text: 'Krem Rengi & Taba Detaylar', votes: 8 },
            { id: 'opt-1-3', text: 'Kum Beji & Beyaz Detaylar', votes: 19 }
          ],
          dueDate: '2026-08-30',
          status: 'active',
          createdAt: '2026-07-15'
        }
      ];
      localStorage.setItem('site_anketler', JSON.stringify(defaultPolls));
      setPolls(defaultPolls);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const handlePayDue = (id: string, amount: number) => {
    router.push('/sakin/aidat');
  };

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;

    const newTicket = {
      id: `ticket-${Date.now()}`,
      title: newTicketTitle.trim(),
      description: 'Dashboard üzerinden hızlı arıza bildirimi.',
      category: newTicketCategory,
      priority: 'medium',
      status: 'Açık',
      date: new Date().toLocaleDateString('tr-TR'),
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    localStorage.setItem('sakin_talepleri', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    
    setNewTicketTitle('');
    toast.success('Talep yönetime başarıyla iletildi.');
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    const saved = localStorage.getItem('site_anketler');
    if (!saved) return;
    const allPolls = JSON.parse(saved);
    const updated = allPolls.map((p: any) => {
      if (p.id === pollId) {
        return {
          ...p,
          options: p.options.map((o: any) => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
        };
      }
      return p;
    });
    localStorage.setItem('site_anketler', JSON.stringify(updated));
    setPolls(updated.filter((p: any) => p.status === 'active'));
    
    // Save voted state to session storage
    const votedList = JSON.parse(sessionStorage.getItem('voted_polls') || '[]');
    sessionStorage.setItem('voted_polls', JSON.stringify([...votedList, pollId]));

    toast.success('Oyunuz başarıyla kaydedildi. Katılımınız için teşekkür ederiz!');
    window.dispatchEvent(new Event('storage'));
  };

  const categoryLabels: Record<string, string> = {
    technical: 'Teknik / Arıza',
    cleaning: 'Temizlik',
    noise: 'Gürültü / Şikayet',
    security: 'Güvenlik',
    other: 'Diğer'
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Açık':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      case 'Devam Ediyor':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
      case 'Tamamlandı':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Sakin Kontrol Paneli
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Hoş geldiniz, Mehmet Kaya — Blok A, Daire 12
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Toplam Borç"
          value={formatCurrency(activeDuesSum)}
          subtitle="Ödenmemiş aidat ve ek ödemeleriniz"
          icon={Wallet}
          trend={activeDuesSum > 0 ? 'up' : 'down'}
          trendValue={activeDuesSum > 0 ? '2 Fatura' : 'Ödendi'}
          color="red"
        />

        <StatCard
          title="Aktif Talepleriniz"
          value={tickets.filter(t => t.status === 'Açık' || t.status === 'Devam Ediyor').length}
          subtitle="Site yönetimine ilettiğiniz açık talepler"
          icon={ListTodo}
          color="blue"
        />

        <StatCard
          title="Son QR Kod Geçerliliği"
          value={activeInvCount > 0 ? `${activeInvCount} Aktif Davet` : 'Aktif Değil'}
          subtitle={activeInvCount > 0 ? `Misafir: ${latestGuestName}` : 'Misafirleriniz için QR daveti oluşturun'}
          icon={ShieldCheck}
          color={activeInvCount > 0 ? 'green' : 'blue'}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Unpaid Dues & Payments */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-rose-500" />
            <span>Ödenmemiş Faturalar</span>
          </h3>

          <div className="space-y-4">
            {unpaidDues.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-color)] p-8 text-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)]">
                Ödenmemiş aidatınız bulunmamaktadır. Teşekkürler!
              </div>
            ) : (
              unpaidDues.map((due) => (
                <div key={due.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{due.type} ({due.period})</span>
                    <span className="block text-[10px] text-[var(--text-tertiary)]">Son Ödeme: {due.dueDate}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-extrabold text-[var(--text-primary)]">{formatCurrency(due.amount)}</span>
                    <button
                      onClick={() => handlePayDue(due.id, due.amount)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Öde
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Announcements */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-500" />
            <span>Duyurular</span>
          </h3>
          <AnnouncementsWidget />
        </div>

        {/* Surveys and Polls widget */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-500" />
            <span>Aktif Anketler & Karar Oylamaları</span>
          </h3>

          <div className="space-y-4">
            {polls.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-color)] p-8 text-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-primary)]">
                Şu an katılabileceğiniz aktif bir oylama bulunmamaktadır.
              </div>
            ) : (
              polls.map((poll) => {
                let votedList = [];
                if (typeof window !== 'undefined') {
                  votedList = JSON.parse(sessionStorage.getItem('voted_polls') || '[]');
                }
                const isVoted = votedList.includes(poll.id);
                const totalVotes = poll.options.reduce((sum: number, o: any) => sum + o.votes, 0) || 1;
                return (
                  <div key={poll.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 space-y-3 shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{poll.title}</h4>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">{poll.question}</p>
                    </div>

                    <div className="space-y-2">
                      {poll.options.map((opt: any) => {
                        const pct = Math.round((opt.votes / totalVotes) * 100);
                        return (
                          <div key={opt.id} className="relative">
                            {isVoted ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold">
                                  <span>{opt.text}</span>
                                  <span className="text-[var(--text-secondary)]">{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleVotePoll(poll.id, opt.id)}
                                className="w-full text-left px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-[11px] font-medium text-[var(--text-primary)]"
                              >
                                {opt.text}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isVoted && (
                      <p className="text-[9px] text-emerald-500 font-semibold italic flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Oyunuz kaydedildi. Toplam Katılım: {totalVotes} Sakin
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ticket Raising / Support system */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md bg-[var(--bg-secondary)]">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary-500" />
            <span>Talep & Şikayet Bildir</span>
          </h3>

          <form onSubmit={handleAddTicket} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Talep Başlığı</label>
              <input
                type="text"
                required
                value={newTicketTitle}
                onChange={(e) => setNewTicketTitle(e.target.value)}
                placeholder="Örn: 3. kat lambası yanmıyor..."
                className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Kategori</label>
              <select
                value={newTicketCategory}
                onChange={(e) => setNewTicketCategory(e.target.value)}
                className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="technical">Teknik / Arıza</option>
                <option value="cleaning">Temizlik</option>
                <option value="noise">Gürültü / Şikayet</option>
                <option value="security">Güvenlik</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Talebi Gönder
              </button>
            </div>
          </form>
        </div>

        {/* Support Tickets status preview */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md bg-[var(--bg-secondary)] flex flex-col h-[340px] overflow-hidden">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Talep Geçmişiniz</h3>
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border-color)] p-8 text-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-primary)]">
                Henüz bir talep iletmediniz.
              </div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3.5 flex items-center justify-between text-xs shadow-sm">
                  <div className="space-y-1 min-w-0 pr-2">
                    <span className="font-bold text-[var(--text-primary)] truncate block">{t.title}</span>
                    <span className="block text-[10px] text-[var(--text-tertiary)]">{categoryLabels[t.category] || t.category} • {t.date}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${getStatusBadgeColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
