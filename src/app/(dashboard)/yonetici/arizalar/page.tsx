'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { mockTasks, mockUsers } from '@/lib/mock-data';
import { getPriorityColor, formatDate } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Wrench, 
  Sparkles, 
  Shield, 
  HelpCircle,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Clock
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // New task form states
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<TaskCategory>('maintenance');
  const [newAssigneeId, setNewAssigneeId] = useState('');

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
    // Trigger storage event for other components/tabs
    window.dispatchEvent(new Event('storage'));
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="h-3.5 w-3.5" />;
      case 'cleaning':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'security':
        return <Shield className="h-3.5 w-3.5" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5" />;
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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingTaskId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (!draggingTaskId) return;
    updateTaskStatus(draggingTaskId, status);
    setDraggingTaskId(null);
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasks(updated);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

      return matchesSearch && matchesPriority && matchesCategory;
    });
  }, [tasks, searchTerm, priorityFilter, categoryFilter]);

  // Columns data
  const columns: { id: TaskStatus; title: string; colorClass: string; bgClass: string }[] = [
    { 
      id: 'open', 
      title: 'Açık', 
      colorClass: 'text-blue-500 border-blue-500', 
      bgClass: 'bg-blue-50/50 dark:bg-blue-950/10' 
    },
    { 
      id: 'in_progress', 
      title: 'Devam Ediyor', 
      colorClass: 'text-amber-500 border-amber-500', 
      bgClass: 'bg-amber-50/50 dark:bg-amber-950/10' 
    },
    { 
      id: 'done', 
      title: 'Tamamlandı', 
      colorClass: 'text-emerald-500 border-emerald-500', 
      bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/10' 
    },
  ];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Support Murat Usta user too if selected
    let assigneeName = undefined;
    if (newAssigneeId === 'user-personel-1') {
      assigneeName = 'Murat Usta';
    } else {
      const assignee = mockUsers.find((u) => u.id === newAssigneeId);
      if (assignee) assigneeName = assignee.name;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      tenantId: 'tenant-001',
      title: newTitle,
      description: newDesc,
      status: 'open',
      priority: newPriority,
      category: newCategory,
      assigneeId: newAssigneeId || undefined,
      assigneeName: assigneeName,
      reporterId: 'user-001',
      reporterName: 'Hasan Korkmaz',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    saveTasks([newTask, ...tasks]);
    setIsNewTaskOpen(false);
    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewCategory('maintenance');
    setNewAssigneeId('');
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm('Bu görevi silmek istediğinize emin misiniz?')) {
      const updated = tasks.filter((t) => t.id !== taskId);
      saveTasks(updated);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Görev Yönetimi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site bakım, temizlik, güvenlik ve diğer operasyonel işlerin Kanban takibi
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Görev Ekle
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass rounded-xl border border-[var(--border-color)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-tertiary)]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Görev adı veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] py-2 pl-9 pr-4 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="maintenance">Bakım/Onarım</option>
            <option value="cleaning">Temizlik</option>
            <option value="security">Güvenlik</option>
            <option value="other">Diğer</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className={`rounded-2xl border border-[var(--border-color)] p-4 flex flex-col min-h-[500px] ${col.bgClass}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)] mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full bg-current ${col.id === 'open' ? 'text-blue-500' : col.id === 'in_progress' ? 'text-amber-500' : 'text-emerald-500'}`} />
                  <h3 className="font-bold text-[var(--text-primary)]">{col.title}</h3>
                </div>
                <span className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-1">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-color)] rounded-xl">
                    Sürükleyip Bırakın
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="glass rounded-xl border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 group relative"
                    >
                      {/* Delete Task Button */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* Header row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <div className="flex items-center space-x-1 text-[10px] text-[var(--text-tertiary)]">
                          {getCategoryIcon(task.category)}
                          <span>{getCategoryLabel(task.category)}</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="mt-2 text-sm font-bold text-[var(--text-primary)] line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Footer Info */}
                      <div className="mt-4 pt-3 border-t border-[var(--border-color)]/50 flex items-center justify-between">
                        {/* Assignee */}
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/10 text-[9px] font-bold text-indigo-500">
                            {task.assigneeName ? task.assigneeName.split(' ').map(n=>n[0]).join('') : <User className="h-3 w-3" />}
                          </div>
                          <span className="text-[10px] text-[var(--text-secondary)] truncate">
                            {task.assigneeName || 'Atanmamış'}
                          </span>
                        </div>

                        {/* Due date */}
                        {task.dueDate && (
                          <span className="text-[10px] text-[var(--text-tertiary)] flex items-center shrink-0">
                            <Clock className="h-3 w-3 mr-0.5" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      {/* Column Changer (Quick buttons for mobile/tablet) */}
                      <div className="mt-3 flex items-center justify-end space-x-2 border-t border-[var(--border-color)]/30 pt-2 lg:hidden">
                        {col.id !== 'open' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, col.id === 'done' ? 'in_progress' : 'open')}
                            className="p-1 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {col.id !== 'done' && (
                          <button
                            onClick={() => updateTaskStatus(task.id, col.id === 'open' ? 'in_progress' : 'done')}
                            className="p-1 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Dialog / Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-[var(--border-color)] p-6 shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Yeni Görev Ekle</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Görev Başlığı</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="örn: A Blok asansör arızası"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Açıklama</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Arıza detayları ve yapılacaklar..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Öncelik</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="maintenance">Bakım/Onarım</option>
                    <option value="cleaning">Temizlik</option>
                    <option value="security">Güvenlik</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Sorumlu Personel</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Atama Yapma</option>
                  <option value="user-personel-1">Murat Usta (Teknik Personel)</option>
                  {mockUsers.map((user) => {
                    let roleLabel = 'Sakin';
                    if (user.role === 'site_manager') roleLabel = 'Yönetici';
                    else if (user.role === 'accountant') roleLabel = 'Muhasebeci';
                    else if (user.role === 'block_rep') roleLabel = 'Blok Temsilcisi';
                    
                    return (
                      <option key={user.id} value={user.id}>
                        {user.name} ({roleLabel})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
