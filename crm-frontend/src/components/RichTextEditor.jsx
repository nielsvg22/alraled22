import React, { useEffect } from 'react';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Link2, Link2Off, Undo2, Redo2, RemoveFormatting } from 'lucide-react';

// Oudere omschrijvingen zijn platte tekst (met eventueel **vet**): omzetten naar HTML voor de editor.
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function toEditorHtml(value) {
  const v = value || '';
  if (/<\/?[a-z][^>]*>/i.test(v)) return v;
  return v
    .split(/\n+/)
    .filter((l) => l.trim())
    .map((l) => `<p>${escapeHtml(l).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
    .join('');
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

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
      }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        class: 'rich-editor-content min-h-[14rem] px-4 py-3 text-sm leading-relaxed text-gray-800 focus:outline-none',
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
      canUndo: ed.can().undo(), canRedo: ed.can().redo(),
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
        <Sep />
        <Btn title="Opmaak wissen" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><RemoveFormatting size={15} /></Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
