'use client';

import React, { useState, useMemo } from 'react';
import { mockNotifications } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { 
  Bell, 
  Receipt, 
  Wallet, 
  ListTodo, 
  Megaphone, 
  Settings, 
  CheckCheck,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'invoice':
        return <Receipt className="h-4 w-4 text-amber-500" />;
      case 'payment':
        return <Wallet className="h-4 w-4 text-emerald-500" />;
      case 'task':
        return <ListTodo className="h-4 w-4 text-blue-500" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4 text-slate-500" />;
    }
  };

  const getNotificationBg = (type: NotificationType) => {
    switch (type) {
      case 'invoice':
        return 'bg-amber-500/10';
      case 'payment':
        return 'bg-emerald-500/10';
      case 'task':
        return 'bg-blue-500/10';
      case 'announcement':
        return 'bg-purple-500/10';
      default:
        return 'bg-slate-500/10';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent trigger read mark
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.isRead;
      if (activeTab === 'read') return n.isRead;
      return true;
    });
  }, [notifications, activeTab]);

  // Count unread
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Bildirimler
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Aidat, ödemeler, duyurular ve görev atamaları ile ilgili en son bildirimleriniz
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === 'all' ? 'text-primary-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Tümü
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === 'unread' ? 'text-primary-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Okunmamış ({unreadCount})
            {activeTab === 'unread' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('read')}
            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === 'read' ? 'text-primary-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Okunmuş
            {activeTab === 'read' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm divide-y divide-[var(--border-color)]">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--text-tertiary)] flex flex-col items-center justify-center space-y-3">
            <Bell className="h-8 w-8 text-[var(--text-tertiary)] opacity-50" />
            <span>Bildirim bulunmuyor.</span>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-4 transition-all duration-150 cursor-pointer flex items-start justify-between gap-4 group ${!notif.isRead ? 'bg-primary-500/5 dark:bg-primary-950/10' : 'bg-transparent hover:bg-[var(--bg-tertiary)]/20'}`}
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                {/* Colored Icon box */}
                <span className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ${getNotificationBg(notif.type)}`}>
                  {getNotificationIcon(notif.type)}
                </span>

                {/* Text Content */}
                <div className="space-y-1 min-w-0">
                  <h4 className={`text-sm truncate text-[var(--text-primary)] ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[10px] text-[var(--text-tertiary)] pt-0.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(notif.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Status Dot / Delete Actions */}
              <div className="flex items-center space-x-3 shrink-0">
                {!notif.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                )}
                
                <button
                  onClick={(e) => handleDeleteNotification(notif.id, e)}
                  className="text-[var(--text-tertiary)] hover:text-rose-500 p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
