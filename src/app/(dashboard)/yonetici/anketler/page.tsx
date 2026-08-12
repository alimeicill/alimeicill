'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, BarChart3, Clock, Trash2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  question: string;
  options: PollOption[];
  dueDate: string;
  status: 'active' | 'completed';
  createdAt: string;
}

const mockPolls: Poll[] = [
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
  },
  {
    id: 'poll-2',
    title: 'Ortak Bahçe Peyzaj Projesi',
    question: 'Ortak çocuk oyun parkının yanına yapılacak ek kamelya/çardak projesi onaylansın mı?',
    options: [
      { id: 'opt-2-1', text: 'Evet, Onaylıyorum', votes: 28 },
      { id: 'opt-2-2', text: 'Hayır, Onaylamıyorum', votes: 4 }
    ],
    dueDate: '2026-07-10',
    status: 'completed',
    createdAt: '2026-06-20'
  }
];

export default function PollsManagementPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [dueDate, setDueDate] = useState('2026-08-31');

  useEffect(() => {
    const saved = localStorage.getItem('site_anketler');
    if (saved) {
      setPolls(JSON.parse(saved));
    } else {
      localStorage.setItem('site_anketler', JSON.stringify(mockPolls));
      setPolls(mockPolls);
    }
  }, []);

  const savePolls = (newPolls: Poll[]) => {
    setPolls(newPolls);
    localStorage.setItem('site_anketler', JSON.stringify(newPolls));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.warning('En fazla 6 seçenek ekleyebilirsiniz.');
      return;
    }
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning('En az 2 seçenek olmalıdır.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim()) {
      toast.error('Lütfen başlık ve açıklama giriniz.');
      return;
    }
    const filteredOptions = options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      toast.error('Lütfen en az 2 geçerli seçenek giriniz.');
      return;
    }

    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      title: title.trim(),
      question: question.trim(),
      options: filteredOptions.map((opt, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text: opt.trim(),
        votes: 0
      })),
      dueDate,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    savePolls([newPoll, ...polls]);
    toast.success('Yeni anket başarıyla oluşturuldu ve sakine açıldı.');
    setIsAddModalOpen(false);
    setTitle('');
    setQuestion('');
    setOptions(['', '']);
  };

  const handleDeletePoll = (id: string) => {
    if (confirm('Bu anketi silmek istediğinize emin misiniz?')) {
      const updated = polls.filter(p => p.id !== id);
      savePolls(updated);
      toast.success('Anket silindi.');
    }
  };

  const handleSimulateVote = (pollId: string, optionId: string) => {
    const updated = polls.map(p => {
      if (p.id === pollId) {
        return {
          ...p,
          options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
        };
      }
      return p;
    });
    savePolls(updated);
    toast.success('Simüle oy başarıyla kaydedildi.');
  };

  const stats = useMemo(() => {
    const activeCount = polls.filter(p => p.status === 'active').length;
    const completedCount = polls.filter(p => p.status === 'completed').length;
    const totalVotes = polls.reduce((sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0), 0);
    return { activeCount, completedCount, totalVotes };
  }, [polls]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Anket & Oylama Yönetimi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site sakinlerinin katılabileceği oylamalar düzenleyin ve sonuçları takip edin.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Anket Başlat
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative bg-gradient-to-br from-indigo-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Aktif Oylamalar</span>
          <h3 className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.activeCount} Anket</h3>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative bg-gradient-to-br from-emerald-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Tamamlanan Oylamalar</span>
          <h3 className="text-3xl font-extrabold text-emerald-500">{stats.completedCount} Anket</h3>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-5 relative bg-gradient-to-br from-amber-500/5 to-transparent">
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Toplam Kullanılan Oy</span>
          <h3 className="text-3xl font-extrabold text-amber-500">{stats.totalVotes} Katılım</h3>
        </div>
      </div>

      {/* Polls List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {polls.length === 0 ? (
          <div className="lg:col-span-2 glass rounded-2xl border border-[var(--border-color)] p-12 text-center text-[var(--text-tertiary)]">
            Henüz aktif veya tamamlanmış bir anket bulunmuyor.
          </div>
        ) : (
          polls.map(poll => {
            const totalPollVotes = poll.options.reduce((sum, o) => sum + o.votes, 0) || 1;
            return (
              <div key={poll.id} className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm bg-[var(--bg-secondary)] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      poll.status === 'active' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {poll.status === 'active' ? 'Devam Ediyor' : 'Sonlandı'}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Son Katılım: {poll.dueDate}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{poll.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{poll.question}</p>
                </div>

                {/* Options and votes result */}
                <div className="space-y-3 pt-2">
                  {poll.options.map(opt => {
                    const percentage = Math.round((opt.votes / totalPollVotes) * 100);
                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[var(--text-primary)]">{opt.text}</span>
                          <span className="text-[var(--text-secondary)] font-mono">{opt.votes} oy ({percentage}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)]/30 overflow-hidden relative">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {poll.status === 'active' && (
                          <div className="flex justify-end pt-0.5">
                            <button
                              onClick={() => handleSimulateVote(poll.id, opt.id)}
                              className="text-[9px] text-indigo-500 font-semibold hover:underline"
                            >
                              + Oy Simüle Et
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border-color)]/40 pt-3 text-[10px] text-[var(--text-tertiary)]">
                  <span>Toplam Katılım: <strong>{totalPollVotes} Sakin</strong></span>
                  
                  <button
                    onClick={() => handleDeletePoll(poll.id)}
                    className="text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Sil
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Yeni Oylamalı Anket Başlat
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Anket Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kamelya Onay Oylaması"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Anket Sorusu / Açıklama</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Sakinlere sorulacak soruyu detaylı yazın..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex justify-between">
                  <span>Seçenekler</span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-indigo-500 hover:underline font-bold"
                  >
                    + Seçenek Ekle
                  </button>
                </label>
                
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder={`Seçenek ${index + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="block flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-rose-500 hover:text-rose-600 p-1 rounded hover:bg-[var(--bg-tertiary)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Son Katılım Tarihi</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow"
                >
                  Anketi Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
