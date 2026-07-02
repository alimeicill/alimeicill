'use client';

import React, { useState, useEffect } from 'react';
import { mockDocuments } from '@/lib/mock-data';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { formatDate } from '@/lib/utils';
import { Plus, Megaphone, ShieldCheck, ClipboardList, AlertCircle, Pin, Save, PlusCircle, Trash2 } from 'lucide-react';
import type { Document, DocumentType } from '@/types';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [editorContent, setEditorContent] = useState<any>(null);

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId);

  useEffect(() => {
    const saved = localStorage.getItem('site_duyurular');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDocuments(parsed);
      if (parsed.length > 0) {
        setSelectedDocId(parsed[0].id);
        setEditorContent(parsed[0].content);
      }
    } else {
      localStorage.setItem('site_duyurular', JSON.stringify(mockDocuments));
      setDocuments(mockDocuments);
      if (mockDocuments.length > 0) {
        setSelectedDocId(mockDocuments[0].id);
        setEditorContent(mockDocuments[0].content);
      }
    }
  }, []);

  const saveDocuments = (updated: Document[]) => {
    setDocuments(updated);
    localStorage.setItem('site_duyurular', JSON.stringify(updated));
    // Trigger custom event for other components (like sakin dashboard/announcements)
    window.dispatchEvent(new Event('storage'));
  };

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

  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setEditorContent(doc.content);
    }
  };

  const handleCreateDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      tenantId: 'tenant-001',
      title: 'Yeni Taslak Döküman',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Döküman içeriğini buraya yazın...' }],
          },
        ],
      },
      type: 'announcement',
      authorId: 'user-001',
      authorName: 'Hasan Korkmaz',
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDocuments([newDoc, ...documents]);
    setSelectedDocId(newDoc.id);
    setEditorContent(newDoc.content);
  };

  const handleSaveDoc = () => {
    if (!selectedDoc) return;
    
    const updated = documents.map((d) =>
      d.id === selectedDocId
        ? { ...d, content: editorContent, updatedAt: new Date().toISOString() }
        : d
    );
    saveDocuments(updated);
    alert('Döküman başarıyla kaydedildi!');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDoc) return;
    const newTitle = e.target.value;
    const updated = documents.map((d) => (d.id === selectedDocId ? { ...d, title: newTitle } : d));
    saveDocuments(updated);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedDoc) return;
    const newType = e.target.value as DocumentType;
    const updated = documents.map((d) => (d.id === selectedDocId ? { ...d, type: newType } : d));
    saveDocuments(updated);
  };

  const handlePinToggle = () => {
    if (!selectedDoc) return;
    const updated = documents.map((d) =>
      d.id === selectedDocId ? { ...d, isPinned: !d.isPinned } : d
    );
    saveDocuments(updated);
  };

  const handleDeleteDoc = () => {
    if (!selectedDocId) return;
    if (confirm('Bu dökümanı/duyuruyu silmek istediğinize emin misiniz?')) {
      const updated = documents.filter(d => d.id !== selectedDocId);
      saveDocuments(updated);
      toast.success('Döküman/Duyuru başarıyla silindi.');
      if (updated.length > 0) {
        setSelectedDocId(updated[0].id);
        setEditorContent(updated[0].content);
      } else {
        setSelectedDocId('');
        setEditorContent(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Dökümanlar & Duyurular
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Site sakinlerine duyurular, karar tutanakları ve site kuralları arşivi
          </p>
        </div>

        <button
          onClick={handleCreateDocument}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Döküman Oluştur
        </button>
      </div>

      {/* Main Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Document List (1/3 width) */}
        <div className="lg:col-span-1 glass rounded-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[700px] shadow-sm">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/20">
            <h3 className="font-bold text-[var(--text-primary)] text-sm">Döküman Listesi</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]/70">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                Henüz döküman oluşturulmamış.
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
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

        {/* Right Side: Tiptap Editor & Settings (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          {selectedDoc ? (
            <div className="glass rounded-2xl border border-[var(--border-color)] p-6 shadow-md space-y-6 flex flex-col">
              {/* Document Configuration Header */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Döküman Başlığı</label>
                  <input
                    type="text"
                    value={selectedDoc.title}
                    onChange={handleTitleChange}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2 text-sm text-[var(--text-primary)] font-bold focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Döküman Tipi</label>
                  <select
                    value={selectedDoc.type}
                    onChange={handleTypeChange}
                    className="block w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="announcement">Duyuru</option>
                    <option value="rule">Kural</option>
                    <option value="minutes">Toplantı Tutanağı</option>
                    <option value="notice">Tebligat</option>
                  </select>
                </div>
              </div>

              {/* Pin / Metadata settings row */}
              <div className="flex items-center justify-between border-t border-[var(--border-color)]/50 pt-4 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center space-x-2">
                  <span>Yazar: <strong>{selectedDoc.authorName}</strong></span>
                  <span>•</span>
                  <span>Son Güncelleme: <strong>{formatDate(selectedDoc.updatedAt)}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={handlePinToggle}
                  className={`inline-flex items-center space-x-1.5 rounded-lg px-3 py-1.5 border transition-all ${selectedDoc.isPinned ? 'bg-amber-100/50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                >
                  <Pin className="h-3.5 w-3.5" />
                  <span>{selectedDoc.isPinned ? 'Sabitlendi' : 'Sabitle'}</span>
                </button>
              </div>

              {/* Tiptap Editor Component */}
              <div className="flex-1">
                <TiptapEditor
                  content={editorContent}
                  onUpdate={setEditorContent}
                />
              </div>

              {/* Action buttons row */}
              <div className="flex justify-end pt-2 gap-3">
                <button
                  onClick={handleDeleteDoc}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/10 px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/20 transition-all duration-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Dökümanı Sil
                </button>

                <button
                  onClick={handleSaveDoc}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl border border-[var(--border-color)] p-12 text-center text-[var(--text-tertiary)]">
              Lütfen sol taraftan düzenlemek için bir döküman seçin veya yeni bir tane oluşturun.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
