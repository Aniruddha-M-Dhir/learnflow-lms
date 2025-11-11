'use client';

import * as React from 'react';
import type { Value, TElement } from 'platejs';
import { Plate, PlateContent, usePlateEditor, ParagraphPlugin } from 'platejs/react';

import {
  // Blocks
  H1Plugin,
  H2Plugin,
  H3Plugin,
  BlockquotePlugin,
  HorizontalRulePlugin,
  // Marks
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
} from '@platejs/basic-nodes/react';

import { LinkPlugin } from '@platejs/link/react';
import { ListPlugin } from '@platejs/list/react';
import { IndentPlugin } from '@platejs/indent/react';

// Slate (only for inserting <hr/> with a tiny type assertion)
import { Transforms, Editor as SlateEditor, Element as SlateElement } from 'slate';

// Icons (optional)
import {
  Heading1,
  Heading2,
  Heading3,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Code as CodeIcon,
  Quote,
  Minus,
} from 'lucide-react';

// Minimal button used in the toolbar
function ToolbarButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      type="button"
      {...props}
      className={
        'rounded border px-2 py-1 text-sm hover:bg-gray-50 ' +
        (props.className ?? '')
      }
    />
  );
}

type EditorProps = {
  /** Slate value as JSON string (Value = TElement[]) */
  initialValue?: string;
  /** Called with the raw Value on change */
  onChange?: (value: Value) => void;
};

export default function Editor({ initialValue, onChange }: EditorProps) {
  const value: Value = React.useMemo(() => {
    try {
      if (initialValue && initialValue.trim() && initialValue !== '[]') {
        return JSON.parse(initialValue) as TElement[];
      }
    } catch {
      // fall through to default
    }
    return [{ type: 'p', children: [{ text: '' }] }];
  }, [initialValue]);

  const editor = usePlateEditor({
    plugins: [
      // Marks
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,

      // Blocks
      ParagraphPlugin,
      H1Plugin,
      H2Plugin,
      H3Plugin,
      BlockquotePlugin,
      HorizontalRulePlugin,

      // Lists / indent / links
      IndentPlugin,
      ListPlugin,
      LinkPlugin,
    ],
    value,
  });

  return (
    <Plate editor={editor} onChange={({ value }) => onChange?.(value)}>
      {/* Simple toolbar */}
      <div className="mb-2 flex flex-wrap gap-2">
        {/* Headings */}
        <ToolbarButton onClick={() => editor.tf.h1.toggle()} title="Heading 1">
          <Heading1 className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h2.toggle()} title="Heading 2">
          <Heading2 className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h3.toggle()} title="Heading 3">
          <Heading3 className="inline-block h-4 w-4" />
        </ToolbarButton>

        <span className="mx-2 inline-block w-px self-stretch bg-gray-200" />

        {/* Marks */}
        <ToolbarButton onClick={() => editor.tf.toggleMark('bold')} title="Bold">
          <BoldIcon className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleMark('italic')} title="Italic">
          <ItalicIcon className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleMark('underline')} title="Underline">
          <UnderlineIcon className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleMark('strikethrough')} title="Strikethrough">
          <StrikethroughIcon className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleMark('code')} title="Code">
          <CodeIcon className="inline-block h-4 w-4" />
        </ToolbarButton>

        <span className="mx-2 inline-block w-px self-stretch bg-gray-200" />

        {/* Blockquote + Horizontal Rule */}
        <ToolbarButton onClick={() => editor.tf.blockquote.toggle()} title="Blockquote">
          <Quote className="inline-block h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            // Cast for Slate Transforms typing
            const s = editor as unknown as SlateEditor;
            const hrNode = { type: 'hr', children: [{ text: '' }] } as unknown as SlateElement;
            Transforms.insertNodes(s, hrNode);
          }}
          title="Horizontal Rule"
        >
          <Minus className="inline-block h-4 w-4" />
        </ToolbarButton>
      </div>

      <PlateContent
        className="min-h-[400px] w-full rounded-md border border-input bg-white p-4 text-sm shadow-sm"
        placeholder="Type your content here..."
      />
    </Plate>
  );
}
