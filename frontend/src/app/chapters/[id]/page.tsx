'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

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

type Chapter = {
  title: string;
  content: string; // JSON string (Slate Value)
};

export default function ChapterRead() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Controlled render value
  const [value, setValue] = useState<Value>([
    { type: 'paragraph', children: [{ text: '' }] },
  ]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      try {
        setError('');
        setLoading(true);

        const res = await api(`/api/chapters/${id}/`);
        if (!res.ok) throw new Error(`Failed to load (status ${res.status})`);

        const data = (await res.json()) as Chapter;
        if (cancelled) return;

        setChapter(data);

        let next: Value;
        try {
          if (data.content && data.content.trim() && data.content !== '[]') {
            next = JSON.parse(data.content) as TElement[];
          } else {
            next = [{ type: 'p', children: [{ text: '' }] }];
          }
        } catch {
          next = [{ type: 'p', children: [{ text: data.content ?? '' }] }];
        }

        // Normalize legacy "p" -> "paragraph" for v51
        next = next.map((n: any) =>
          n?.type === 'p' ? { ...n, type: 'paragraph' } : n
        );

        if (!cancelled) setValue(next);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error loading chapter');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Read-only editor: pass `value` into the hook and re-create when it changes
  const editor = usePlateEditor(
    {
      readOnly: true,
      value,
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
    },
    // 👇 deps array ensures the editor re-initializes when `value` changes
    [value]
  );

  const isEmpty = useMemo(() => {
    try {
      return !value?.some(
        (n: any) =>
          Array.isArray(n?.children) &&
          n.children.some(
            (c: any) => typeof c?.text === 'string' && c.text.trim().length > 0
          )
      );
    } catch {
      return false;
    }
  }, [value]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main className="mx-auto max-w-3xl py-10">
        <p>Chapter not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-semibold">{chapter.title}</h1>

      {/* No `value` prop here; the editor already has it from usePlateEditor */}
      <Plate editor={editor}>
        <PlateContent
          className="rounded-md bg-white p-6 text-black"
          placeholder={isEmpty ? 'No content yet.' : undefined}
        />
      </Plate>
    </main>
  );
}
