export interface SiteNote {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface SiteMessage {
  id: string;
  sender: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
}

export interface SoftwareAnnouncement {
  id: string;
  title: string;
  date: string;
  url?: string;
}

const defaultNotes: SiteNote[] = [
  {
    id: 'note-1',
    title: 'A Asansör Bakımı',
    content: 'A Blok sağ asansörün aylık periyodik bakımı Usta Asansör firması tarafından yapılacaktır.',
    date: '2026-08-12',
    createdAt: '2026-08-10'
  },
  {
    id: 'note-2',
    title: 'Bahçe İlaçlaması',
    content: 'Ortak yeşil alanlar ve çocuk oyun parkı haşerelere karşı ilaçlanacaktır.',
    date: '2026-08-15',
    createdAt: '2026-08-11'
  },
  {
    id: 'note-3',
    title: 'Yönetim Kurulu Toplantısı',
    content: 'Ağustos ayı olağan yönetim kurulu toplantısı yönetim ofisinde yapılacaktır.',
    date: '2026-08-20',
    createdAt: '2026-08-12'
  }
];

const defaultMessages: SiteMessage[] = [
  {
    id: 'msg-1',
    sender: 'Mehmet Yılmaz (A-12)',
    subject: 'Sıcak Su Kesintisi Hk.',
    content: 'Merhabalar, dün akşamdan beri A blokta sıcak su basıncı çok düşük, kombi arıza veriyor. Kontrol edebilir misiniz?',
    date: '12.08.2026 14:32',
    read: false
  },
  {
    id: 'msg-2',
    sender: 'Ayşe Demir (B-3)',
    subject: 'Otopark İşgali',
    content: 'B blok otopark girişinde benim daireme tahsisli alana yabancı plakalı bir araç park edilmiş durumda. Güvenliğin uyarılmasını rica ederim.',
    date: '11.08.2026 09:15',
    read: false
  },
  {
    id: 'msg-3',
    sender: 'Ahmet Şahin (C-5)',
    subject: 'Aidat Makbuzu Talebi',
    content: 'Temmuz ayı aidat ödememi banka havalesiyle yaptım. Dekontu sisteme yükledim, makbuzumu e-posta olarak gönderebilir misiniz?',
    date: '10.08.2026 17:45',
    read: true
  }
];

const defaultAnnouncements: SoftwareAnnouncement[] = [
  {
    id: 'sa-1',
    title: 'SiteHesabim v4.2.0 Güncelleme Notları yayınlandı.',
    date: '10.08.2026'
  },
  {
    id: 'sa-2',
    title: 'Yeni Özellik: Otomatik SMS şablonları aktif edildi.',
    date: '05.08.2026'
  },
  {
    id: 'sa-3',
    title: 'Banka entegrasyon listesine 3 yeni banka eklendi.',
    date: '01.08.2026'
  }
];

export class SiteHesabimService {
  static getNotes(): SiteNote[] {
    if (typeof window === 'undefined') return defaultNotes;
    const saved = localStorage.getItem('sh_notes');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('sh_notes', JSON.stringify(defaultNotes));
    return defaultNotes;
  }

  static addNote(title: string, content: string, date: string): SiteNote {
    const notes = this.getNotes();
    const newNote: SiteNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      date,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newNote, ...notes];
    localStorage.setItem('sh_notes', JSON.stringify(updated));
    return newNote;
  }

  static deleteNote(id: string): SiteNote[] {
    const notes = this.getNotes();
    const updated = notes.filter(n => n.id !== id);
    localStorage.setItem('sh_notes', JSON.stringify(updated));
    return updated;
  }

  static getMessages(): SiteMessage[] {
    if (typeof window === 'undefined') return defaultMessages;
    const saved = localStorage.getItem('sh_messages');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('sh_messages', JSON.stringify(defaultMessages));
    return defaultMessages;
  }

  static markMessageRead(id: string): SiteMessage[] {
    const messages = this.getMessages();
    const updated = messages.map(m => m.id === id ? { ...m, read: true } : m);
    localStorage.setItem('sh_messages', JSON.stringify(updated));
    return updated;
  }

  static getSoftwareAnnouncements(): SoftwareAnnouncement[] {
    return defaultAnnouncements;
  }

  static getSummaryStats() {
    return {
      generalDurum: {
        alacaklarPct: 81,
        kasaPct: 19,
        toplamAlacak: 48500,
        kasaBakiye: 11200
      },
      tasinmazDurumu: {
        toplamTasinmaz: 15,
        borcluOlan: 13,
        alacakliOlan: 1
      },
      uyeDurumu: {
        kalanBorcPct: 86,
        tahsilEdilenPct: 14,
        toplamBorc: 24500,
        tahsilEdilen: 4000
      }
    };
  }
}
