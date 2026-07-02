'use client';

import React, { useState, useEffect } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ListTodo, Calendar, CheckSquare, Clock, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function PersonelDashboardPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  const loadTasks = () => {
    const saved = localStorage.getItem('site_tasks');
    if (saved) {
      const allTasks = JSON.parse(saved);
      // Filter tasks assigned to Murat Usta
      const myTasks = allTasks.filter((t: any) => t.assigneeName === 'Murat Usta');
      // Map properties to match dashboard expected structure
      const mapped = myTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        area: t.category === 'maintenance' ? 'Bakım/Onarım' : t.category === 'cleaning' ? 'Temizlik' : t.category === 'security' ? 'Güvenlik' : 'Ortak Alan',
        priority: t.priority === 'low' ? 'Düşük' : t.priority === 'medium' ? 'Orta' : t.priority === 'high' ? 'Yüksek' : 'Acil',
        status: t.status === 'open' ? 'Açık' : t.status === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'
      }));
      setTasks(mapped);
    } else {
      const defaultTasks = [
        { id: 'task-002', title: 'Bahçe sulama sistemi arızası', area: 'Bakım/Onarım', priority: 'Orta', status: 'Açık' },
        { id: 'task-006', title: 'A Blok Asansör Lambası Değişimi', area: 'Bakım/Onarım', priority: 'Yüksek', status: 'Devam Ediyor' },
      ];
      setTasks(defaultTasks);
    }
  };

  useEffect(() => {
    loadTasks();
    window.addEventListener('storage', loadTasks);
    return () => {
      window.removeEventListener('storage', loadTasks);
    };
  }, []);

  const handleToggleComplete = (id: string) => {
    const saved = localStorage.getItem('site_tasks');
    if (saved) {
      const allTasks = JSON.parse(saved);
      const updated = allTasks.map((t: any) => {
        if (t.id === id) {
          const isDone = t.status === 'done';
          return {
            ...t,
            status: isDone ? 'in_progress' : 'done',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem('site_tasks', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      toast.success('Görev durumu başarıyla güncellendi.');
    } else {
      // Fallback local update if no localStorage
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            status: t.status === 'Tamamlandı' ? 'Devam Ediyor' : 'Tamamlandı'
          };
        }
        return t;
      }));
    }
  };

  const getPriorityBadgeColor = (prio: string) => {
    switch (prio) {
      case 'Acil':
      case 'Yüksek':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
      case 'Orta':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Personel Kontrol Paneli
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Hoş geldiniz, Murat Usta — Baş Teknisyen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Atanmış İşler"
          value={tasks.length}
          subtitle="Üzerinizdeki aktif iş emirleri sayısı"
          icon={ListTodo}
          color="blue"
        />

        <StatCard
          title="Tamamlanan İşler"
          value={tasks.filter((t: any) => t.status === 'Tamamlandı').length}
          subtitle="Bugün tamamladığınız görevler"
          icon={CheckSquare}
          color="green"
        />

        <StatCard
          title="Nöbet / Vardiya"
          value="Gündüz (08:00 - 18:00)"
          subtitle="Bugünkü aktif çalışma saatiniz"
          icon={Calendar}
          color="amber"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Job Orders */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary-500" />
            <span>Aktif İş Emirleriniz</span>
          </h3>

          <div className="space-y-4">
            {tasks.map((task) => {
              const isCompleted = task.status === 'Tamamlandı';
              return (
                <div 
                  key={task.id} 
                  onClick={() => handleToggleComplete(task.id)}
                  className={`rounded-xl border border-[var(--border-color)] p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all hover:bg-[var(--bg-tertiary)]/20 ${
                    isCompleted ? 'opacity-65 bg-[var(--bg-tertiary)]/10 line-through' : 'bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <button type="button" className="shrink-0 text-primary-600">
                      {isCompleted ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-[var(--text-tertiary)]" />}
                    </button>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[var(--text-primary)] block truncate">{task.title}</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{task.area}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getPriorityBadgeColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Shifts / Vardiya List */}
        <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            <span>Haftalık Vardiya Çizelgesi</span>
          </h3>

          <div className="space-y-3">
            {[
              { day: 'Pazartesi', hours: '08:00 - 18:00', type: 'Gündüz Nöbeti' },
              { day: 'Salı', hours: '08:00 - 18:00', type: 'Gündüz Nöbeti' },
              { day: 'Çarşamba', hours: '08:00 - 18:00', type: 'Gündüz Nöbeti' },
              { day: 'Perşembe', hours: '18:00 - 08:00', type: 'Gece Nöbeti' },
              { day: 'Cuma', hours: 'İzinli', type: 'Haftalık İzin' },
            ].map((shift, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)]">{shift.day}</span>
                <div className="text-right">
                  <span className="block font-semibold text-[var(--text-secondary)]">{shift.hours}</span>
                  <span className="text-[9px] text-[var(--text-tertiary)]">{shift.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
