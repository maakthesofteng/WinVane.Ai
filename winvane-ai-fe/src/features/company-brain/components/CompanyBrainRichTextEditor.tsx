'use client';

import type { ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Type,
  Underline as UnderlineIcon,
} from 'lucide-react';

interface ICompanyBrainRichTextEditorProps {
  content: JSONContent;
  disabled: boolean;
  onChange: (content: JSONContent) => void;
}

const FONT_FAMILIES = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'] as const;

export function CompanyBrainRichTextEditor({
  content,
  disabled,
  onChange,
}: ICompanyBrainRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      FontFamily,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
  });

  if (!editor) return null;

  const addLink = () => {
    const href = window.prompt('Enter a website URL');
    if (href) {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
  };

  const toolbarButton = (label: string, active: boolean, onClick: () => void, icon: ReactNode) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`hover:bg-muted inline-flex size-8 items-center justify-center rounded-md disabled:opacity-50 ${active ? 'bg-muted text-primary' : 'text-foreground'}`}
    >
      {icon}
    </button>
  );

  return (
    <div className="border-input overflow-hidden rounded-lg border">
      <div className="border-border bg-muted/30 flex flex-wrap items-center gap-1 border-b p-2">
        {toolbarButton(
          'Bold',
          editor.isActive('bold'),
          () => editor.chain().focus().toggleBold().run(),
          <Bold className="size-4" />
        )}
        {toolbarButton(
          'Italic',
          editor.isActive('italic'),
          () => editor.chain().focus().toggleItalic().run(),
          <Italic className="size-4" />
        )}
        {toolbarButton(
          'Underline',
          editor.isActive('underline'),
          () => editor.chain().focus().toggleUnderline().run(),
          <UnderlineIcon className="size-4" />
        )}
        {toolbarButton(
          'Heading 1',
          editor.isActive('heading', { level: 1 }),
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          <Heading1 className="size-4" />
        )}
        {toolbarButton(
          'Heading 2',
          editor.isActive('heading', { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          <Heading2 className="size-4" />
        )}
        {toolbarButton(
          'Bulleted list',
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
          <List className="size-4" />
        )}
        {toolbarButton(
          'Numbered list',
          editor.isActive('orderedList'),
          () => editor.chain().focus().toggleOrderedList().run(),
          <ListOrdered className="size-4" />
        )}
        {toolbarButton('Add link', editor.isActive('link'), addLink, <Link2 className="size-4" />)}
        <label className="text-muted-foreground focus-within:border-ring flex h-8 items-center gap-1 rounded-md border border-transparent px-2 text-xs">
          <Type className="size-4" />
          <span className="sr-only">Font family</span>
          <select
            aria-label="Font family"
            className="text-foreground max-w-36 bg-transparent outline-none"
            disabled={disabled}
            defaultValue=""
            onChange={(event) => {
              const fontFamily = event.target.value;
              if (fontFamily) editor.chain().focus().setFontFamily(fontFamily).run();
              else editor.chain().focus().unsetFontFamily().run();
              event.target.value = '';
            }}
          >
            <option value="">Font family</option>
            {FONT_FAMILIES.map((fontFamily) => (
              <option key={fontFamily} value={fontFamily}>
                {fontFamily}
              </option>
            ))}
          </select>
        </label>
      </div>
      <EditorContent
        editor={editor}
        className="company-brain-editor min-h-40 px-4 py-3 text-sm focus-within:outline-none"
      />
    </div>
  );
}
