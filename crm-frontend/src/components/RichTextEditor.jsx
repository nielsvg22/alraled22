import React, { useEffect } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Link2, Link2Off, Undo2, Redo2, RemoveFormatting, Table2 } from 'lucide-react';

// Oudere teksten zijn platte tekst, soms met eenvoudige markdown (## kop, - lijst, **vet**, | tabel |).
// Die zetten we om naar HTML voor de editor.
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export function toEditorHtml(value) {
  const v = value || '';
  if (/<\/?[a-z][^>]*>/i.test(v)) return v;
  const blocks = v.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines[0].startsWith('|') && lines.length > 1) {
      const cells = (l) => l.split('|').filter((c) => c.trim() !== '').map((c) => c.trim());
      const hasSep = lines[1] && /^[\s|:-]+$/.test(lines[1]);
      const head = cells(lines[0]);
      const body = (hasSep ? lines.slice(2) : lines.slice(1)).map(cells);
      out.push(`<table><tbody><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    } else if (/^#{1,2}\s/.test(lines[0])) {
      out.push(`<h2>${inline(lines[0].replace(/^#+\s*/, ''))}</h2>`);
      if (lines.length > 1) out.push(...lines.slice(1).map((l) => `<p>${inline(l)}</p>`));
    } else if (/^#{3,}\s/.test(lines[0])) {
      out.push(`<h3>${inline(lines[0].replace(/^#+\s*/, ''))}</h3>`);
      if (lines.length > 1) out.push(...lines.slice(1).map((l) => `<p>${inline(l)}</p>`));
    } else if (lines.every((l) => /^[-*]\s/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li><p>${inline(l.replace(/^[-*]\s/, ''))}</p></li>`).join('')}</ul>`);
    } else if (lines.every((l) => /^\d+[.)]\s/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li><p>${inline(l.replace(/^\d+[.)]\s/, ''))}</p></li>`).join('')}</ol>`);
    } else {
      out.push(...lines.map((l) => `<p>${inline(l)}</p>`));
    }
  }
  return out.join('');
}

const Btn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 transition-all disabled:opacity-30 ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
  >
    {children}
  </button>
);

const Sep = () => <span className="w-px h-5 bg-gray-200 mx-1" />;

export default function RichTextEditor({ value, onChange, minHeight = '14rem', tables = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
      }),
      ...(tables ? [Table.configure({ resizable: false }), TableRow, TableHeader, TableCell] : []),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class: 'rich-editor-content px-4 py-3 text-sm leading-relaxed text-gray-800 focus:outline-none',
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML()),
  });

  // Externe wijzigingen (bv. AI schrijft de omschrijving, of een ander product wordt geopend)
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value || '') !== current && toEditorHtml(value) !== current) {
      editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
    }
  }, [value, editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ed && ({
      bold: ed.isActive('bold'), italic: ed.isActive('italic'), underline: ed.isActive('underline'),
      h2: ed.isActive('heading', { level: 2 }), h3: ed.isActive('heading', { level: 3 }),
      bullet: ed.isActive('bulletList'), ordered: ed.isActive('orderedList'), link: ed.isActive('link'),
      canUndo: ed.can().undo(), canRedo: ed.can().redo(), table: ed.isActive('table'),
    }),
  }) || {};

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href || 'https://';
    const url = window.prompt('Link naar (bijv. https://alra-led.com):', previous);
    if (url === null) return;
    if (url.trim() === '' || url.trim() === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <Btn title="Ongedaan maken (Ctrl+Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></Btn>
        <Btn title="Opnieuw (Ctrl+Y)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></Btn>
        <Sep />
        <Btn title="Dikgedrukt (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></Btn>
        <Btn title="Schuin (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></Btn>
        <Btn title="Onderstreept (Ctrl+U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={15} /></Btn>
        <Sep />
        <Btn title="Grote kop" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></Btn>
        <Btn title="Kleine kop" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></Btn>
        <Sep />
        <Btn title="Opsomming" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Btn>
        <Btn title="Genummerde lijst" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
        <Sep />
        <Btn title="Link toevoegen of wijzigen" active={state.link} onClick={setLink}><Link2 size={15} /></Btn>
        <Btn title="Link verwijderen" disabled={!state.link} onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}><Link2Off size={15} /></Btn>
        {tables && (<>
          <Sep />
          <Btn title="Tabel invoegen (3 x 3)" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={15} /></Btn>
          {state.table && (<>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 h-8 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-100">+ rij</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 h-8 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-100">+ kolom</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 h-8 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-100">- rij</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 h-8 rounded-lg text-[11px] font-bold text-gray-600 hover:bg-gray-100">- kolom</button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 h-8 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50">tabel weg</button>
          </>)}
        </>)}
        <Sep />
        <Btn title="Opmaak wissen" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><RemoveFormatting size={15} /></Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
