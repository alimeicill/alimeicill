'use client';

import React from 'react';
import Link from 'next/link';
import { mockDocuments } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { ChevronRight, Megaphone, Pin } from 'lucide-react';

export function AnnouncementsWidget() {
  // Filter announcements and sort: pinned first, then by date
  const announcements = mockDocuments
    .filter((doc) => doc.type === 'announcement')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  return (
    <div className="w-full">
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="py-6 text-center text-sm text-[var(--text-tertiary)]">
            Duyuru bulunmuyor.
          </div>
        ) : (
          announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className="group relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition-all duration-200 hover:border-primary-500/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-400">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-primary-500 transition-colors duration-150">
                    {announcement.title}
                  </h4>
                </div>
                {announcement.isPinned && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
                    <Pin className="h-3 w-3 fill-current rotate-45" />
                  </span>
                )}
              </div>
              
              <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2">
                {typeof announcement.content === 'string' 
                  ? announcement.content 
                  : (announcement.content?.content?.[0]?.content?.[0]?.text || 'İçerik detayı için tıklayın.')}
              </p>

              <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>{announcement.authorName}</span>
                <span>{formatDate(announcement.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Link 
          href="/yonetici/duyurular" 
          className="inline-flex items-center text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
        >
          Tüm Duyuruları Gör
          <ChevronRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
