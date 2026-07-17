'use client';

import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS, Document } from '@contentful/rich-text-types';
import Image from 'next/image';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { getPlainText } from '@/lib/extract-headings';
import GraphTree from '@/components/blog/GraphTree';
import ImageGrid from '@/components/blog/ImageGrid';
import ExamplesAside from '@/components/blog/ExamplesAside';
import { GraphTreeEntry, ImageGridEntry, ExamplesAsideEntry } from '@/lib/contentful';
import { useEffect, Fragment, type ReactNode } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

interface RichTextRendererProps {
  content: Document;
  // When true, a paragraph containing only a link renders as a centered button.
  // Enabled for blog posts, not the About page.
  linkButtons?: boolean;
}

type DocNode = Document['content'][number];

// Wrap a single top-level node in a throwaway Document so it can be rendered on
// its own with the shared options — lets us group specific siblings.
function asDoc(node: DocNode): Document {
  return { nodeType: BLOCKS.DOCUMENT, data: {}, content: [node] } as Document;
}

function isExamplesAsideNode(node: DocNode): boolean {
  if (node.nodeType !== BLOCKS.EMBEDDED_ENTRY) return false;
  const target = (node.data as {
    target?: { sys?: { contentType?: { sys?: { id?: string } } } };
  }).target;
  return target?.sys?.contentType?.sys?.id === 'examplesAside';
}

// Pairs a paragraph with the ExamplesAside that follows it so the two share a
// layout context. On desktop the wrappers collapse (display:contents), leaving
// the aside floating in the article flow before the paragraph — so the text
// wraps around it with no gap. On mobile the pair becomes a flex column and the
// aside is reordered to sit after the paragraph.
function ExamplesAsidePair({
  paragraph,
  aside,
}: {
  paragraph: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="flex flex-col md:contents">
      <div className="order-last md:contents">{aside}</div>
      <div className="md:contents">{paragraph}</div>
    </div>
  );
}

// A paragraph whose only meaningful content is a single hyperlink — i.e. a link
// sitting alone on its own line. Returns the link's url and text, else null.
function standaloneLinkNode(node: DocNode): { uri: string; text: string } | null {
  if (node.nodeType !== BLOCKS.PARAGRAPH) return null;
  const content = (node as unknown as {
    content: Array<{
      nodeType: string;
      value?: string;
      data?: { uri?: string };
      content?: Array<{ value?: string }>;
    }>;
  }).content;
  const meaningful = content.filter(
    (c) => !(c.nodeType === 'text' && (c.value ?? '').trim() === '')
  );
  if (meaningful.length !== 1 || meaningful[0].nodeType !== INLINES.HYPERLINK) return null;
  const link = meaningful[0];
  const uri = link.data?.uri ?? '';
  const text = (link.content ?? []).map((c) => c.value ?? '').join('');
  return uri ? { uri, text } : null;
}

// A link rendered as a centered button, matching the site's button style.
function LinkButton({ uri, label }: { uri: string; label: string }) {
  const className =
    'inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors';
  return (
    <div className="text-center my-6">
      {uri.startsWith('http') ? (
        <a href={uri} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      ) : (
        <Link href={uri} className={className}>
          {label}
        </Link>
      )}
    </div>
  );
}

export default function RichTextRenderer({ content, linkButtons = false }: RichTextRendererProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const options: Options = {
    renderMark: {
      [MARKS.BOLD]: (text) => <strong className="font-bold">{text}</strong>,
      [MARKS.ITALIC]: (text) => <em className="italic">{text}</em>,
      [MARKS.UNDERLINE]: (text) => <span className="underline">{text}</span>,
      [MARKS.CODE]: (text) => (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">
          {text}
        </code>
      ),
    },
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => (
        <p className="mb-4 leading-relaxed text-gray-700 text-justify">{children}</p>
      ),
      [BLOCKS.HEADING_1]: (node, children) => (
        <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{children}</h1>
      ),
      [BLOCKS.HEADING_2]: (node, children) => (
        <h2
          id={slugify(getPlainText(node))}
          className="text-2xl font-bold mt-8 mb-4 text-gray-900 scroll-mt-20"
        >
          {children}
        </h2>
      ),
      [BLOCKS.HEADING_3]: (node, children) => (
        <h3
          id={slugify(getPlainText(node))}
          className="text-xl font-bold mt-6 mb-3 text-gray-900 scroll-mt-20"
        >
          {children}
        </h3>
      ),
      [BLOCKS.HEADING_4]: (node, children) => (
        <h4
          id={slugify(getPlainText(node))}
          className="text-lg font-bold mt-6 mb-3 text-gray-900 scroll-mt-20"
        >
          {children}
        </h4>
      ),
      [BLOCKS.HEADING_5]: (node, children) => (
        <h5 className="text-base font-bold mt-4 mb-2 text-gray-900">{children}</h5>
      ),
      [BLOCKS.HEADING_6]: (node, children) => (
        <h6 className="text-sm font-bold mt-4 mb-2 text-gray-900">{children}</h6>
      ),
      [BLOCKS.UL_LIST]: (node, children) => (
        <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">{children}</ul>
      ),
      [BLOCKS.OL_LIST]: (node, children) => (
        <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700">{children}</ol>
      ),
      [BLOCKS.LIST_ITEM]: (node, children) => (
        <li className="leading-relaxed [&>p]:inline [&>p]:mb-0">{children}</li>
      ),
      [BLOCKS.QUOTE]: (node, children) => (
        <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
          {children}
        </blockquote>
      ),
      [BLOCKS.HR]: () => <hr className="my-8 border-gray-200" />,
      [BLOCKS.EMBEDDED_ENTRY]: (node) => {
        const entry = node.data.target as { sys?: { contentType?: { sys?: { id?: string } } }; fields?: unknown };
        const contentTypeId = entry?.sys?.contentType?.sys?.id;

        switch (contentTypeId) {
          case 'graphTree': {
            const graphTree = entry as unknown as GraphTreeEntry;
            return (
              <GraphTree
                title={graphTree.fields.title}
                steps={graphTree.fields.steps}
              />
            );
          }
          case 'imageGrid': {
            const imageGrid = entry as unknown as ImageGridEntry;
            return (
              <ImageGrid
                columns={imageGrid.fields.columns}
                items={imageGrid.fields.items}
              />
            );
          }
          case 'examplesAside': {
            const aside = entry as unknown as ExamplesAsideEntry;
            return (
              <ExamplesAside
                title={aside.fields.title}
                side={aside.fields.side ?? 'right'}
                examples={aside.fields.examples}
              />
            );
          }
          default:
            return null;
        }
      },
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const { file, title } = node.data.target.fields;
        const { url, details } = file;
        const imageUrl = url.startsWith('//') ? `https:${url}` : url;
        
        return (
          <figure className="my-6">
            <Image
              src={imageUrl}
              alt={title || ''}
              width={details.image?.width || 800}
              height={details.image?.height || 600}
              className="rounded-lg w-full h-auto"
            />
            {title && (
              <figcaption className="text-center text-sm text-gray-500 mt-2">
                {title}
              </figcaption>
            )}
          </figure>
        );
      },
      [INLINES.HYPERLINK]: (node, children) => {
        const url = node.data.uri;
        const isExternal = url.startsWith('http');
        
        if (isExternal) {
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          );
        }
        
        return (
          <Link href={url} className="text-blue-600 hover:text-blue-800 underline">
            {children}
          </Link>
        );
      },
    },
  };

  const nodes = content.content;
  const rendered: ReactNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const next = nodes[i + 1];
    // An ExamplesAside placed right after a paragraph pairs with that paragraph.
    if (node.nodeType === BLOCKS.PARAGRAPH && next && isExamplesAsideNode(next)) {
      rendered.push(
        <ExamplesAsidePair
          key={i}
          paragraph={documentToReactComponents(asDoc(node), options)}
          aside={documentToReactComponents(asDoc(next), options)}
        />
      );
      i++; // skip the aside — it was consumed by the pair
      continue;
    }

    // A link alone on its own line renders as a centered button.
    const link = linkButtons ? standaloneLinkNode(node) : null;
    if (link) {
      rendered.push(<LinkButton key={i} uri={link.uri} label={link.text} />);
      continue;
    }

    rendered.push(
      <Fragment key={i}>{documentToReactComponents(asDoc(node), options)}</Fragment>
    );
  }

  return <div className="prose prose-lg max-w-none">{rendered}</div>;
}
