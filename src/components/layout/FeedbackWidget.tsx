'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, X, Send, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('Hata Bildirimi');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();

  // Resolve user info from the path, matching the header user mock resolver
  const getFeedbackUser = (path: string) => {
    if (path.startsWith('/super-admin')) {
      return { name: 'Hakan Demir', role: 'SaaS Platform Sahibi' };
    }
    if (path.startsWith('/sakin')) {
      return { name: 'Mehmet Kaya', role: 'Daire Sakini' };
    }
    if (path.startsWith('/personel')) {
      return { name: 'Murat Usta', role: 'Teknik Personel' };
    }
    return { name: 'Hasan Korkmaz', role: 'Site Yöneticisi' };
  };

  const currentUser = getFeedbackUser(pathname);

  // Close modal on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Lütfen bir mesaj giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        Konu: subject,
        Mesaj: message,
        Rol: currentUser.role,
        AdSoyad: currentUser.name,
        Url: typeof window !== 'undefined' ? window.location.href : pathname,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Geri bildiriminiz geliştiriciye başarıyla iletildi. Teşekkür ederiz!');
        setMessage('');
        setSubject('Hata Bildirimi');
        setIsOpen(false);
      } else {
        throw new Error(data.error || 'Bir hata oluştu.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Geri bildirim gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-300 group"
        title="Geri Bildirim Gönder"
        aria-label="Geri Bildirim"
      >
        <MessageSquarePlus className="h-6 w-6 animate-pulse group-hover:scale-110 group-hover:rotate-3 transition-transform" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl animate-scale-in">
            {/* Gradient Header Decorator */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Geri Bildirim Gönder
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Görüş, öneri ve hata bildirimlerinizi bizimle paylaşın.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Dynamic User Capture Badge Info */}
              <div className="rounded-xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-color)]/50 p-3 space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-tertiary)] block">
                  Otomatik Bilgi Toplama
                </span>
                <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold">{currentUser.name}</span>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">
                    {currentUser.role}
                  </span>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <span className="truncate max-w-[200px] font-mono text-[10px] text-[var(--text-tertiary)]" title={typeof window !== 'undefined' ? window.location.pathname : ''}>
                    {typeof window !== 'undefined' ? window.location.pathname : '/'}
                  </span>
                </div>
              </div>

              {/* Subject (Konu) Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Bildirim Türü
                </label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Hata Bildirimi">🐛 Hata Bildirimi (Bug Report)</option>
                    <option value="Geliştirme Önerisi">✨ Geliştirme Önerisi (Feature Request)</option>
                    <option value="Diğer">❓ Diğer</option>
                  </select>
                </div>
              </div>

              {/* Message Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Açıklama *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    subject === 'Hata Bildirimi'
                      ? 'Hatayı nasıl tetiklediğinizi ve ne olduğunu adım adım yazın...'
                      : subject === 'Geliştirme Önerisi'
                      ? 'Sistemde nasıl bir yenilik veya kolaylık olmasını istersiniz?'
                      : 'Mesajınızı buraya girin...'
                  }
                  className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Help tip */}
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                {subject === 'Hata Bildirimi' && (
                  <>
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    <span>Hata oluştuğu an sistem logları ve sayfa adresi otomatik eklenir.</span>
                  </>
                )}
                {subject === 'Geliştirme Önerisi' && (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Öneriniz doğrudan geliştirme yol haritamıza eklenecektir.</span>
                  </>
                )}
                {subject === 'Diğer' && (
                  <>
                    <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Genel sorularınız ve diğer konular için yazabilirsiniz.</span>
                  </>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Geri Bildirimi İlet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
