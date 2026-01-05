'use client';

import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS, Document } from '@contentful/rich-text-types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
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
}

export default function RichTextRenderer({ content }: RichTextRendererProps) {
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
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">{children}</h2>
      ),
      [BLOCKS.HEADING_3]: (node, children) => (
        <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">{children}</h3>
      ),
      [BLOCKS.HEADING_4]: (node, children) => (
        <h4 className="text-lg font-bold mt-6 mb-3 text-gray-900">{children}</h4>
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

  return (
    <div className="prose prose-lg max-w-none">
      {documentToReactComponents(content, options)}
    </div>
  );
}
