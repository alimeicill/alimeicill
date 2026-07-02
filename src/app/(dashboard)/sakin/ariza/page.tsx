'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Wrench, 
  Sparkles, 
  Shield, 
  HelpCircle, 
  Calendar,
  Clock, 
  Trash2, 
  CheckCircle2, 
  MessageSquare,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface ResidentTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'cleaning' | 'noise' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'Açık' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi';
  date: string;
}

export default function ResidentTicketsPage() {
  const [tickets, setTickets] = useState<ResidentTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'technical' | 'cleaning' | 'noise' | 'security' | 'other'>('technical');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Load from localStorage
  const loadData = () => {
    const saved = localStorage.getItem('sakin_talepleri');
    if (saved) {
      setTickets(JSON.parse(saved));
    } else {
      const defaultTickets: ResidentTicket[] = [
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
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const saveTickets = (updated: ResidentTicket[]) => {
    setTickets(updated);
    localStorage.setItem('sakin_talepleri', JSON.stringify(updated));
    // Trigger custom event for other components (like dashboard)
    window.dispatchEvent(new Event('storage'));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return <Wrench className="h-4 w-4 text-amber-500" />;
      case 'cleaning':
        return <Sparkles className="h-4 w-4 text-emerald-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-indigo-500" />;
      case 'noise':
        return <MessageSquare className="h-4 w-4 text-rose-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'Teknik / Arıza',
      cleaning: 'Temizlik',
      security: 'Güvenlik',
      noise: 'Gürültü / Şikayet',
      other: 'Diğer',
    };
    return labels[category] || category;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil',
    };
    return labels[priority] || priority;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Açık':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'Devam Ediyor':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      case 'Tamamlandı':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error('Başlık ve Açıklama alanları zorunludur.');
      return;
    }

    const newTicket: ResidentTicket = {
      id: `ticket-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Açık',
      date: new Date().toLocaleDateString('tr-TR')
    };

    saveTickets([newTicket, ...tickets]);
    toast.success('Talep yönetime başarıyla iletildi.');
    
    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewCategory('technical');
    setNewPriority('medium');
    setIsOpen(false);
  };

  const handleDeleteTicket = (id: string) => {
    if (window.confirm('Bu talebi silmek istediğinize emin misiniz?')) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);
      toast.success('Talep silindi.');
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tickets, searchTerm, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter(t => t.status === 'Açık' || t.status === 'Devam Ediyor').length;
    const completed = tickets.filter(t => t.status === 'Tamamlandı').length;
    return { total, active, completed };
  }, [tickets]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Arıza & Destek Talepleri
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Daireniz veya ortak alanlardaki teknik sorunları yönetime iletin ve çözümleri takip edin
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Talep Bildir
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Talepleriniz</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Aktif / İşlemde</p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">{stats.active}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Tamamlananlar</p>
            <h3 className="text-2xl font-bold text-emerald-500 mt-1">{stats.completed}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)]">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Taleplerimde ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="technical">Teknik / Arıza</option>
            <option value="cleaning">Temizlik</option>
            <option value="security">Güvenlik</option>
            <option value="noise">Gürültü / Şikayet</option>
            <option value="other">Diğer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Açık">Açık</option>
            <option value="Devam Ediyor">Devam Ediyor</option>
            <option value="Tamamlandı">Tamamlandı</option>
            <option value="İptal Edildi">İptal Edildi</option>
          </select>
        </div>
      </div>

      {/* Tickets Display */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-[var(--text-tertiary)] flex flex-col items-center justify-center space-y-3 glass border border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]">
            <MessageSquare className="h-10 w-10 text-[var(--text-tertiary)] opacity-60" />
            <p>Kriterlere uygun arıza bildirimi bulunamadı.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div 
              key={ticket.id}
              className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between bg-[var(--bg-secondary)]"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)]/50 pb-3 mb-4">
                  <div className="flex items-center space-x-1.5 text-xs text-[var(--text-secondary)] font-semibold">
                    {getCategoryIcon(ticket.category)}
                    <span>{getCategoryLabel(ticket.category)}</span>
                  </div>
                  
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPriorityBadge(ticket.priority)}`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-[var(--text-primary)] text-sm line-clamp-1 mb-2">
                  {ticket.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-6 h-[54px] overflow-hidden">
                  {ticket.description}
                </p>
              </div>

              {/* Status and Action Row */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]/50 text-xs mt-4">
                <div className="flex items-center space-x-1.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {ticket.date}
                  </span>
                  
                  {/* Delete button only if the status is still "Açık" or "İptal Edildi" */}
                  {(ticket.status === 'Açık' || ticket.status === 'İptal Edildi') && (
                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                      title="Talebi Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Request Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Yeni Arıza / Talep Bildir</h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="space-y-4 pt-4 text-xs">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Talep Başlığı *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Koridor tavanında su sızıntısı"
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama *</label>
                <textarea
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={4}
                  placeholder="Arıza detaylarını, nerede olduğunu ve durumun aciliyetini detaylandırın..."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Kategori *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="technical">Teknik / Arıza</option>
                    <option value="cleaning">Temizlik</option>
                    <option value="security">Güvenlik</option>
                    <option value="noise">Gürültü / Şikayet</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Öncelik *</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta (Normal)</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-2 font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
