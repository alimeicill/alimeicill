'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo, 
  Redo 
} from 'lucide-react';

interface TiptapEditorProps {
  content: any;
  onUpdate: (content: any) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onUpdate, placeholder = 'İçerik yazmaya başlayın...' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
  });

  // Update content if it changes externally
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
        Editör Yükleniyor...
      </div>
    );
  }

  return (
    <div className="tiptap-editor flex flex-col border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[var(--bg-tertiary)]/30 border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-[var(--border-color)] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Heading3 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-[var(--border-color)] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('codeBlock') ? 'bg-primary-500/10 text-primary-500' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
        >
          <Code className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-[var(--border-color)] mx-1 flex-1 md:flex-none" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-30"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] min-h-[300px]">
        <EditorContent editor={editor} className="h-full focus:outline-none" />
      </div>
    </div>
  );
}
