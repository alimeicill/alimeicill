import React, { useState } from 'react';
import { DashboardMessage } from '@/types/dashboard';
import { Mail, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

interface RecentMessagesProps {
  messages: DashboardMessage[];
  onMarkRead: (id: string) => void;
}

export function RecentMessages({ messages, onMarkRead }: RecentMessagesProps) {
  const [selectedMsg, setSelectedMsg] = useState<DashboardMessage | null>(null);

  const handleOpenDetail = (msg: DashboardMessage) => {
    setSelectedMsg(msg);
    onMarkRead(msg.id);
  };

  const handleSendMail = (email: string) => {
    toast.success(`${email} adresine bilgilendirme e-postası başarıyla gönderildi.`);
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Son Sakin Mesajları & Talepler
        </h3>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
          {messages.filter(m => !m.read).length} Okunmamış
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-155/30 bg-slate-50/50 dark:bg-slate-700/30 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th className="p-3">Tarih</th>
              <th className="p-3">Sakin</th>
              <th className="p-3">Konu</th>
              <th className="p-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-slate-700 dark:text-slate-300">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-xs text-slate-400 italic">
                  Henüz bir mesaj bulunmuyor.
                </td>
              </tr>
            ) : (
              messages.map(msg => (
                <tr 
                  key={msg.id}
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-all ${
                    !msg.read ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <td className="p-3 font-mono text-[10px] text-slate-400">{msg.date}</td>
                  <td className="p-3 flex items-center gap-1.5">
                    {!msg.read && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />}
                    <span>{msg.sender}</span>
                  </td>
                  <td className="p-3 truncate max-w-[150px]">{msg.subject}</td>
                  <td className="p-3 text-right space-x-1.5">
                    <button 
                      onClick={() => handleSendMail(msg.sender)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-250 hover:text-emerald-600 transition-colors inline-flex"
                      title="E-posta Gönder"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleOpenDetail(msg)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:border-indigo-250 hover:text-indigo-600 transition-colors inline-flex"
                      title="Mesajı Oku"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Message detail modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/50">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Sakin Bildirim / Talep Detayı
              </h3>
              <button 
                onClick={() => setSelectedMsg(null)} 
                className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 text-[10px] text-slate-400">
                <div>
                  <span className="font-bold block uppercase">Gönderen:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{selectedMsg.sender}</span>
                </div>
                <div>
                  <span className="font-bold block uppercase">Tarih:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{selectedMsg.date}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-[10px] text-slate-400 uppercase">Konu:</span>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{selectedMsg.subject}</p>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                <span className="font-bold text-[10px] text-slate-400 uppercase">Açıklama:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium mt-1">
                  {selectedMsg.content}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    handleSendMail(selectedMsg.sender);
                    setSelectedMsg(null);
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-sm"
                >
                  Cevapla (E-posta)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMsg(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
