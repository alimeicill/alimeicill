import React, { useState, useMemo } from 'react';
import { DashboardNote } from '@/types/dashboard';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  X, 
  Trash2 
} from 'lucide-react';
import { toast } from 'sonner';

interface NotesCalendarProps {
  notes: DashboardNote[];
  onAddNote: (title: string, content: string, date: string) => void;
  onDeleteNote: (id: string) => void;
}

export function NotesCalendar({ notes, onAddNote, onDeleteNote }: NotesCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noteSearch, setNoteSearch] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Calendar Days generator
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = endOfMonth.getDate();
    const startDay = startOfMonth.getDay();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Spacer days from previous month
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthEnd - i;
      const mStr = String(month === 0 ? 12 : month).padStart(2, '0');
      const yStr = month === 0 ? year - 1 : year;
      days.push({
        dateStr: `${yStr}-${mStr}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false
      });
    }

    // Current Month days
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      days.push({
        dateStr: `${year}-${mStr}-${String(i).padStart(2, '0')}`,
        dayNum: i,
        isCurrentMonth: true
      });
    }

    return days;
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesDate = note.date === selectedDate;
      const matchesSearch = note.title.toLowerCase().includes(noteSearch.toLowerCase()) || 
                            note.content.toLowerCase().includes(noteSearch.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [notes, selectedDate, noteSearch]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Lütfen not başlığı giriniz.');
      return;
    }
    onAddNote(newTitle, newContent, selectedDate);
    setNewTitle('');
    setNewContent('');
    setShowNoteModal(false);
    toast.success('Not kaydedildi.');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Note List widget */}
      <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between min-h-[350px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Kayıtlı Notlar ({filteredNotes.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Notlarda ara..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="pl-8 pr-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none w-28 focus:w-40 transition-all duration-300"
                />
              </div>
              <button 
                onClick={() => setShowNoteModal(true)}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 shadow-sm transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                {selectedDate} tarihine ait not bulunamadı. Yeni bir not ekleyebilirsiniz.
              </div>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id} 
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/50 dark:border-slate-700 flex items-start justify-between gap-2 group shadow-sm"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {note.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                      {note.content}
                    </p>
                  </div>
                  <button 
                    onClick={() => onDeleteNote(note.id)}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2 flex items-center justify-between font-medium">
          <span>Seçili Gün: <strong>{selectedDate}</strong></span>
          <span>Toplam not: {notes.length}</span>
        </div>
      </div>

      {/* Calendar view widget */}
      <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Ajanda & Takvim
            </h3>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Pz</span><span>Pt</span><span>Sa</span><span>Ça</span><span>Pe</span><span>Cu</span><span>Ct</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const noteCount = notes.filter(n => n.date === day.dateStr).length;
              const isSelected = selectedDate === day.dateStr;
              const isToday = new Date().toISOString().split('T')[0] === day.dateStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`relative h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-105' 
                      : isToday 
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/30'
                        : day.isCurrentMonth
                          ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                          : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  <span>{day.dayNum}</span>
                  {noteCount > 0 && (
                    <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-indigo-600'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between font-medium">
          <span>Bu Ay</span>
          <span>Not filtrelemek için gün seçin</span>
        </div>
      </div>

      {/* dialog modal for add note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-indigo-500" />
                Ajandaya Yeni Not Ekle
              </h3>
              <button 
                onClick={() => setShowNoteModal(false)} 
                className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Not Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Banka Mutabakat Kontrolü"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-650 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Açıklama Detayı</label>
                <textarea
                  rows={3}
                  placeholder="Not detaylarını yazınız..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-650 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Seçilen Tarih</label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={selectedDate}
                  className="block w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-xs font-semibold shadow-sm"
                >
                  Notu Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
