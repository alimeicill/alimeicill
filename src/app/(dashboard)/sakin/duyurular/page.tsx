'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { mockDocuments } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { Megaphone, ShieldCheck, ClipboardList, AlertCircle, Pin, Calendar, User, Search } from 'lucide-react';
import type { Document, DocumentType } from '@/types';

// ProseMirror/TipTap JSON Renderer Component
function DocumentRenderer({ content }: { content: any }) {
  if (!content || !content.content) return null;

  const renderNode = (node: any, index: number) => {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1;
        const text = node.content?.map((c: any) => c.text).join('') || '';
        if (level === 1) return <h1 key={index} className="text-2xl font-bold text-[var(--text-primary)] mb-4">{text}</h1>;
        if (level === 2) return <h2 key={index} className="text-xl font-bold text-[var(--text-primary)] mb-3 mt-6">{text}</h2>;
        return <h3 key={index} className="text-lg font-bold text-[var(--text-primary)] mb-2 mt-4">{text}</h3>;
      }
      case 'paragraph': {
        const text = node.content?.map((c: any) => c.text).join('') || '';
        return <p key={index} className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{text}</p>;
      }
      case 'bulletList': {
        return (
          <ul key={index} className="list-disc pl-5 space-y-2 mb-4 text-sm text-[var(--text-secondary)] font-normal">
            {node.content?.map((item: any, idx: number) => renderNode(item, idx))}
          </ul>
        );
      }
      case 'orderedList': {
        return (
          <ol key={index} className="list-decimal pl-5 space-y-2 mb-4 text-sm text-[var(--text-secondary)] font-normal">
            {node.content?.map((item: any, idx: number) => renderNode(item, idx))}
          </ol>
        );
      }
      case 'listItem': {
        return (
          <li key={index}>
            {node.content?.map((child: any, idx: number) => {
              if (child.type === 'paragraph') {
                return child.content?.map((c: any) => c.text).join('') || '';
              }
              return renderNode(child, idx);
            })}
          </li>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="prose dark:prose-invert max-w-none text-sm">
      {content.content.map((node: any, index: number) => renderNode(node, index))}
    </div>
  );
}

export default function ResidentAnnouncementsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId);

  const loadData = () => {
    const saved = localStorage.getItem('site_duyurular');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDocuments(parsed);
      if (parsed.length > 0 && !selectedDocId) {
        setSelectedDocId(parsed[0].id);
      }
    } else {
      localStorage.setItem('site_duyurular', JSON.stringify(mockDocuments));
      setDocuments(mockDocuments);
      if (mockDocuments.length > 0) {
        setSelectedDocId(mockDocuments[0].id);
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const getTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      announcement: 'Duyuru',
      rule: 'Site Kuralı',
      minutes: 'Tutanak',
      notice: 'Tebligat',
    };
    return labels[type];
  };

  const getTypeColor = (type: DocumentType) => {
    const colors: Record<DocumentType, string> = {
      announcement: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400',
      rule: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      minutes: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      notice: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    };
    return colors[type];
  };

  const getDocIcon = (type: DocumentType) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      case 'rule':
        return <ShieldCheck className="h-4 w-4" />;
      case 'minutes':
        return <ClipboardList className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Duyurular & Dökümanlar
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Yönetim tarafından yayınlanan duyurular, site kuralları ve toplantı tutanakları arşivi
        </p>
      </div>

      {/* Main Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Document List (1/3 width) */}
        <div className="lg:col-span-1 glass rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[700px] shadow-sm bg-[var(--bg-secondary)]">
          <div className="p-4 border-b border-[var(--border-color)]/70 bg-[var(--bg-tertiary)]/20 space-y-3">
            <h3 className="font-bold text-[var(--text-primary)] text-sm">Arşiv Listesi</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Başlıklarda ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]/70">
            {filteredDocuments.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                Kayıt bulunamadı.
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                  }}
                  className={`w-full text-left p-4 transition-all hover:bg-[var(--bg-tertiary)]/30 flex items-start space-x-3 ${selectedDocId === doc.id ? 'bg-primary-500/5 dark:bg-primary-950/20 border-l-4 border-primary-500' : 'border-l-4 border-transparent'}`}
                >
                  <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${getTypeColor(doc.type)}`}>
                    {getDocIcon(doc.type)}
                  </span>
                  
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-semibold truncate ${selectedDocId === doc.id ? 'text-primary-600 dark:text-primary-400' : 'text-[var(--text-primary)]'}`}>
                        {doc.title}
                      </h4>
                      {doc.isPinned && (
                        <Pin className="h-3.5 w-3.5 text-amber-500 fill-current rotate-45 shrink-0 ml-1.5" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                      <span>{getTypeLabel(doc.type)}</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Read-Only Document View (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedDoc ? (
            <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md space-y-6 flex flex-col bg-[var(--bg-secondary)] min-h-[500px]">
              
              {/* Title & Badge */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)]/50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getTypeColor(selectedDoc.type)}`}>
                      {getTypeLabel(selectedDoc.type)}
                    </span>
                    {selectedDoc.isPinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">
                        <Pin className="h-3 w-3 rotate-45" /> Sabit Duyuru
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    {selectedDoc.title}
                  </h2>
                </div>
              </div>

              {/* Metadata Info */}
              <div className="flex items-center space-x-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/10 p-3 rounded-xl border border-[var(--border-color)]/30">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span>Yayınlayan: <strong>{selectedDoc.authorName}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span>Tarih: <strong>{formatDate(selectedDoc.createdAt)}</strong></span>
                </div>
              </div>

              {/* Rendered Document Content */}
              <div className="flex-1 overflow-y-auto py-2">
                <DocumentRenderer content={selectedDoc.content} />
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-[var(--border-color)] p-12 text-center text-[var(--text-tertiary)] bg-[var(--bg-secondary)] flex flex-col items-center justify-center space-y-2 min-h-[500px]">
              <Megaphone className="h-10 w-10 opacity-40 mb-2" />
              <p>Okumak için sol taraftaki arşiv listesinden bir döküman seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
