'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Landmark, 
  FileCheck2, 
  Wallet, 
  QrCode, 
  Sparkles,
  Pause,
  Play
} from 'lucide-react';

interface Slide {
  id: string;
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  gradientClass: string;
  icon: React.ElementType;
}

const slides: Slide[] = [
  {
    id: 'bank-sync',
    badge: 'YENİ MODÜL YAYINDA',
    title: 'Banka Entegrasyonu ve Otomatik Tahsilat',
    description: 'Banka hareketlerini anlık çekin, akıllı kurallarla daire borçlarını otomatik kapatın.',
    buttonText: 'Entegre Et',
    buttonHref: '/yonetici/banka-sync',
    gradientClass: 'from-violet-700 via-indigo-700 to-purple-800',
    icon: Landmark
  },
  {
    id: 'official-finance',
    badge: 'FİNANS & MUHASEBE',
    title: 'Tek Düzen Muhasebe & GİB E-Fatura Motoru',
    description: 'Resmi Yevmiye Defteri, KDV hesaplayıcı, Personel Bordrolama ve GİB uyumlu e-Belge görüntüleme.',
    buttonText: 'Modüle Git',
    buttonHref: '/yonetici/finans-gelismis',
    gradientClass: 'from-blue-700 via-indigo-800 to-violet-900',
    icon: FileCheck2
  },
  {
    id: 'dues-auto',
    badge: 'OTOMATİK TAHSİLAT',
    title: 'Dinamik Aidat & İcra Takip Sistemi',
    description: 'Her ay otomatik borçlandırma, gecikme faizi hesaplama ve icra dosyaları yönetimi.',
    buttonText: 'Aidat Yönetimi',
    buttonHref: '/yonetici/aidat',
    gradientClass: 'from-indigo-800 via-purple-800 to-fuchsia-900',
    icon: Wallet
  },
  {
    id: 'visitor-qr',
    badge: 'GÜVENLİK & KONTROL',
    title: 'Ziyaretçi QR Davet Kodu & Kapı Geçiş',
    description: 'Sakinlerin tek tıkla QR davet kodu üretmesi ve güvenlik kapı entegrasyonu.',
    buttonText: 'Geçiş Sistemleri',
    buttonHref: '/yonetici/sakinler',
    gradientClass: 'from-purple-800 via-fuchsia-800 to-indigo-950',
    icon: QrCode
  }
];

export function HeroCarouselBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStart(null);
  };

  const currentSlide = slides[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <div 
      className="relative group rounded-2xl overflow-hidden shadow-lg border border-white/10 text-white transition-all duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background slide wrapper with animated gradient background */}
      <div 
        className={`relative h-40 sm:h-36 w-full bg-gradient-to-r ${currentSlide.gradientClass} p-5 sm:p-6 flex items-center justify-between transition-all duration-700 ease-in-out`}
      >
        {/* Decorative background glow circle */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute left-1/3 -bottom-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Content Section */}
        <div className="relative z-10 space-y-1.5 max-w-[72%] transition-all duration-500 transform translate-x-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full uppercase text-white shadow-inner">
              <Sparkles className="h-3 w-3 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
              {currentSlide.badge}
            </span>

            {isPaused && (
              <span className="inline-flex items-center gap-1 text-[9px] bg-black/30 px-2 py-0.5 rounded-full text-indigo-200">
                <Pause className="h-2.5 w-2.5" /> Duraklatıldı
              </span>
            )}
          </div>

          <h2 className="text-sm sm:text-base font-extrabold leading-snug tracking-tight text-white drop-shadow-sm flex items-center gap-2">
            <IconComponent className="h-4 w-4 shrink-0 text-indigo-200 hidden sm:inline-block" />
            {currentSlide.title}
          </h2>

          <p className="text-[10px] sm:text-xs text-indigo-100/90 leading-relaxed font-normal line-clamp-2">
            {currentSlide.description}
          </p>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 shrink-0">
          <Link 
            href={currentSlide.buttonHref}
            className="bg-white hover:bg-slate-100 text-indigo-900 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 hover:scale-105 active:scale-95 group/btn"
          >
            <span>{currentSlide.buttonText}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>

        {/* Navigation Arrows (visible on hover or focus) */}
        <button
          onClick={handlePrev}
          aria-label="Önceki Slayt"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Sonraki Slayt"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/20 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Dynamic Auto-play Progress Bar at top/bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            key={currentIndex}
            className={`h-full bg-white/70 transition-all ${isPaused ? 'w-full opacity-30' : 'animate-carousel-progress'}`}
            style={{
              animationDuration: '4.5s',
              animationTimingFunction: 'linear'
            }}
          />
        </div>
      </div>

      {/* Slide Navigation Pagination Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'w-6 bg-white shadow-sm' 
                : 'w-1.5 bg-white/40 hover:bg-white/70'
            }`}
            title={slide.title}
          />
        ))}
      </div>
    </div>
  );
}
