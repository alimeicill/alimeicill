'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

export function PromotionalModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal after 600ms on first render
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('promo_dismissed');
      if (!dismissed) {
        setIsOpen(true);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('promo_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl text-white overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow background effects */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 border border-slate-700"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Özel Tanıtım Fırsatı</span>
        </div>

        {/* Main Header */}
        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-2">
          Akıllı Site ve Apartman Yönetimi: <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Şeffaf, Kolay, Güvenli
          </span>
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Sitenizin aidat takibini, banka entegrasyonlarını, e-fatura kayıtlarını ve sakin iletişimini 30 gün boyunca hiçbir ücret ödemeden deneyimleyin!
        </p>

        {/* Bullet points */}
        <div className="space-y-2.5 mb-6 text-xs text-slate-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>%99.8 Otomatik Banka Tahsilat Eşleşmesi</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Resmi GİB E-Fatura & Tek Düzen Muhasebe Entegrasyonu</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Ziyaretçi QR Davet Kodu & Kapı Güvenlik Modülü</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/yonetici/dashboard"
            onClick={handleClose}
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 group"
          >
            <span>Demo Paneline Gir</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all duration-200"
          >
            İncelemeye Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
