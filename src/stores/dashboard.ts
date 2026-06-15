import { create } from 'zustand';
import type { Widget } from '@/types';

interface DashboardState {
  widgets: Widget[];
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  removeWidget: (id: string) => void;
  setWidgets: (widgets: Widget[]) => void;
  reorderWidgets: (activeId: string, overId: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  widgets: [],
  addWidget: (widget) => set((state) => ({
    widgets: [...state.widgets, { ...widget, id: crypto.randomUUID() }]
  })),
  updateWidget: (id, updates) => set((state) => ({
    widgets: state.widgets.map(w => (w.id === id ? { ...w, ...updates } : w))
  })),
  removeWidget: (id) => set((state) => ({
    widgets: state.widgets.filter(w => w.id !== id)
  })),
  setWidgets: (widgets) => set({ widgets }),
  reorderWidgets: (activeId, overId) => set((state) => {
    const oldIndex = state.widgets.findIndex(w => w.id === activeId);
    const newIndex = state.widgets.findIndex(w => w.id === overId);
    if (oldIndex === -1 || newIndex === -1) return state;
    const newWidgets = [...state.widgets];
    const [removed] = newWidgets.splice(oldIndex, 1);
    newWidgets.splice(newIndex, 0, removed);
    return { widgets: newWidgets };
  }),
}));
