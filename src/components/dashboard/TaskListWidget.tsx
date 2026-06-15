'use client';

import React from 'react';
import Link from 'next/link';
import { mockTasks } from '@/lib/mock-data';
import { getPriorityColor, getStatusColor } from '@/lib/utils';
import { 
  ChevronRight, 
  Wrench, 
  Sparkles, 
  Shield, 
  HelpCircle,
  Clock
} from 'lucide-react';

export function TaskListWidget() {
  // Take open and in_progress tasks, max 5
  const activeTasks = mockTasks
    .filter(task => task.status === 'open' || task.status === 'in_progress')
    .slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'cleaning':
        return <Sparkles className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      urgent: 'Acil',
    };
    return labels[priority] || priority;
  };

  return (
    <div className="w-full">
      <div className="space-y-3">
        {activeTasks.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--text-tertiary)]">
            Açık görev bulunmuyor.
          </div>
        ) : (
          activeTasks.map((task) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3.5 transition-all duration-200 hover:border-primary-500/30 hover:shadow-sm"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500 dark:bg-primary-950/30 dark:text-primary-400">
                  {getCategoryIcon(task.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold truncate text-[var(--text-primary)]">
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    {task.unitNumber && (
                      <span className="text-xs text-[var(--text-secondary)]">
                        Daire {task.unitNumber}
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-tertiary)]">•</span>
                    <span className="text-xs text-[var(--text-tertiary)] flex items-center">
                      <Clock className="h-3 w-3 mr-0.5" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : 'Süre Yok'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Link 
          href="/tasks" 
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          Tüm Görevleri Gör
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
