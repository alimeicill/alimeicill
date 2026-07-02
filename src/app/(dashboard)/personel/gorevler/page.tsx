'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { mockTasks } from '@/lib/mock-data';
import { getPriorityColor, formatDate } from '@/lib/utils';
import { 
  Wrench, 
  Sparkles, 
  Shield, 
  HelpCircle,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Play,
  FileText,
  Search,
  X,
  Plus
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';
import { toast } from 'sonner';

export default function PersonelTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done'>('active');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Complete task modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  const loadTasks = () => {
    const saved = localStorage.getItem('site_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const seededTasks = mockTasks.map((task) => {
        // Let's assign some maintenance tasks to Murat Usta (technical staff)
        if (task.id === 'task-002' || task.id === 'task-006' || task.id === 'task-009' || task.id === 'task-013') {
          return {
            ...task,
            assigneeId: 'user-personel-1',
            assigneeName: 'Murat Usta',
          };
        }
        return task;
      });
      localStorage.setItem('site_tasks', JSON.stringify(seededTasks));
      setTasks(seededTasks);
    }
  };

  useEffect(() => {
    loadTasks();
    window.addEventListener('storage', loadTasks);
    return () => {
      window.removeEventListener('storage', loadTasks);
    };
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('site_tasks', JSON.stringify(newTasks));
    window.dispatchEvent(new Event('storage'));
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-amber-500" />;
      case 'cleaning':
        return <Sparkles className="h-4 w-4 text-emerald-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-indigo-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: TaskCategory) => {
    const labels: Record<TaskCategory, string> = {
      maintenance: 'Bakım/Onarım',
      cleaning: 'Temizlik',
      security: 'Güvenlik',
      other: 'Diğer',
    };
    return labels[category];
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels: Record<TaskPriority, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil',
    };
    return labels[priority];
  };

  const handleStartTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: 'in_progress' as TaskStatus, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasks(updated);
    toast.success('İş emri başlatıldı. Kolay gelsin!');
  };

  const handleOpenCompleteModal = (task: Task) => {
    setSelectedTask(task);
    setCompletionNote('');
  };

  const handleCompleteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const updated = tasks.map((t) =>
      t.id === selectedTask.id
        ? { 
            ...t, 
            status: 'done' as TaskStatus, 
            updatedAt: new Date().toISOString(),
            description: completionNote.trim() 
              ? `${t.description}\n\n[Usta Notu - ${new Date().toLocaleDateString('tr-TR')}]: ${completionNote.trim()}`
              : t.description
          }
        : t
    );

    saveTasks(updated);
    toast.success('Görev başarıyla tamamlandı. Elinize sağlık!');
    setSelectedTask(null);
  };

  // Filter tasks: ONLY show those assigned to Murat Usta
  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeName === 'Murat Usta');
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return myTasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (t.status === 'open' || t.status === 'in_progress')) ||
        (statusFilter === 'done' && t.status === 'done');

      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [myTasks, searchTerm, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const total = myTasks.length;
    const active = myTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const completed = myTasks.filter(t => t.status === 'done').length;
    return { total, active, completed };
  }, [myTasks]);

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          İş Emirlerim
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Size atanan site içi arıza, bakım ve diğer operasyonel görevlerin takibi
        </p>
      </div>

      {/* Stats Summary Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="glass rounded-2xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Toplam Görevlerim</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Devam Eden / Açık</p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">{stats.active}</h3>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-2xl border border-[var(--border-color)] p-4 flex items-center justify-between bg-[var(--bg-secondary)]">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">Tamamladıklarım</p>
            <h3 className="text-2xl font-bold text-emerald-500 mt-1">{stats.completed}</h3>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-secondary)]">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="İş emirlerinde ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)] text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 transition-colors ${statusFilter === 'active' ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
            >
              Aktif İşler
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-3 py-2 transition-colors ${statusFilter === 'done' ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
            >
              Tamamlananlar
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 transition-colors ${statusFilter === 'all' ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
            >
              Tümü
            </button>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Öncelikler</option>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-[var(--text-tertiary)] flex flex-col items-center justify-center space-y-3 glass border border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]">
            <Wrench className="h-10 w-10 text-[var(--text-tertiary)] opacity-60" />
            <p>Atanmış iş emriniz bulunmamaktadır.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id}
              className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between bg-[var(--bg-secondary)]"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)]/50 pb-3 mb-4">
                  <div className="flex items-center space-x-1.5 text-xs text-[var(--text-secondary)] font-semibold">
                    {getCategoryIcon(task.category)}
                    <span>{getCategoryLabel(task.category)}</span>
                  </div>
                  
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-[var(--text-primary)] text-sm line-clamp-1 mb-2">
                  {task.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-6 whitespace-pre-line min-h-[54px]">
                  {task.description}
                </p>

                {/* Assignment details */}
                <div className="space-y-2 mt-4 text-[11px] text-[var(--text-secondary)] border-t border-[var(--border-color)]/30 pt-3">
                  <div className="flex items-center space-x-1.5">
                    <User className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    <span>Bildiren: <strong className="text-[var(--text-primary)]">{task.reporterName}</strong></span>
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <span>Termin Tarihi: <strong className="text-[var(--text-primary)]">{formatDate(task.dueDate)}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border-color)]/50 mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Kayıt: {formatDate(task.createdAt)}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    task.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                    task.status === 'in_progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {task.status === 'open' ? 'Açık' : task.status === 'in_progress' ? 'Devam Ediyor' : 'Tamamlandı'}
                  </span>
                </div>

                {/* Actions depending on status */}
                {task.status === 'open' && (
                  <button
                    onClick={() => handleStartTask(task.id)}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Çalışmaya Başla
                  </button>
                )}

                {task.status === 'in_progress' && (
                  <button
                    onClick={() => handleOpenCompleteModal(task)}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Görevi Tamamla
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Task Note Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">İş Emrini Kapat</h3>
              <button 
                onClick={() => setSelectedTask(null)} 
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCompleteTask} className="space-y-4 pt-4 text-xs">
              <div className="bg-[var(--bg-primary)] p-3.5 rounded-xl border border-[var(--border-color)]/30 space-y-1">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">İş Emri</span>
                <h4 className="font-bold text-sm text-[var(--text-primary)]">{selectedTask.title}</h4>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Usta Raporu / Yapılan İşlem (İsteğe Bağlı)</label>
                <textarea
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  rows={4}
                  placeholder="örn: Arıza giderildi, parça değiştirildi veya kontrol edildi..."
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 font-semibold text-white shadow hover:from-emerald-600 hover:to-emerald-700"
                >
                  İşi Tamamla & Kapat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
