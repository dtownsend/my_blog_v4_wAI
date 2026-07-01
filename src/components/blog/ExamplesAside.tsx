'use client';

import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import Link from 'next/link';
import { ExampleColor, ExampleCardEntry } from '@/lib/contentful';

interface ExamplesAsideProps {
  title?: string;
  side: 'left' | 'right';
  examples: ExampleCardEntry[];
}

const COLOR_CLASS: Record<ExampleColor, string> = {
  pink: 'bg-pink-100 border-pink-200',
  yellow: 'bg-yellow-100 border-yellow-200',
  blue: 'bg-blue-100 border-blue-200',
  green: 'bg-green-100 border-green-200',
  purple: 'bg-purple-100 border-purple-200',
  gray: 'bg-gray-100 border-gray-200',
  none: 'bg-white border-gray-200',
};

const SIDE_CLASS: Record<'left' | 'right', string> = {
  right: 'md:float-right md:ml-6',
  left: 'md:float-left md:mr-6',
};

const cardBodyOptions: Options = {
  renderMark: {
    [MARKS.BOLD]: (text) => <strong className="font-semibold">{text}</strong>,
    [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
    [MARKS.UNDERLINE]: (text) => <span className="underline">{text}</span>,
    [MARKS.CODE]: (text) => (
      <code className="bg-black/5 px-1 py-0.5 rounded text-xs font-mono">{text}</code>
    ),
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => (
      <p className="mb-2 last:mb-0 leading-snug text-justify hyphens-auto">{children}</p>
    ),
    [BLOCKS.UL_LIST]: (node, children) => (
      <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (node, children) => (
      <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (node, children) => (
      <li className="[&>p]:inline [&>p]:mb-0">{children}</li>
    ),
    [INLINES.HYPERLINK]: (node, children) => {
      const url = node.data.uri;
      if (url.startsWith('http')) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={url} className="text-blue-600 underline">
          {children}
        </Link>
      );
    },
  },
};

function ExampleCard({ card }: { card: ExampleCardEntry }) {
  const color = card.fields.backgroundColor ?? 'none';
  return (
    <div className={`rounded border ${COLOR_CLASS[color]} px-3 py-2 text-sm text-gray-800`}>
      {card.fields.title && <p className="font-semibold mb-1">{card.fields.title}</p>}
      <div>{documentToReactComponents(card.fields.body, cardBodyOptions)}</div>
    </div>
  );
}

export default function ExamplesAside({ title, side, examples }: ExamplesAsideProps) {
  if (!examples || examples.length === 0) return null;

  return (
    <aside
      className={`float-none w-full my-6 md:mt-0 md:w-72 md:mb-4 ${SIDE_CLASS[side]} rounded-lg border border-gray-200 bg-gray-50 px-4 py-3`}
    >
      {title && <p className="font-semibold text-gray-900 mb-2">{title}</p>}
      <div className="flex flex-col gap-2">
        {examples.map((card) => (
          <ExampleCard key={card.sys.id} card={card} />
        ))}
      </div>
    </aside>
  );
}
