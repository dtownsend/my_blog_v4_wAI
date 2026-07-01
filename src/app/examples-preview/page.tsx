import { BLOCKS, Document } from '@contentful/rich-text-types';
import ExamplesAside from '@/components/blog/ExamplesAside';
import { ExampleCardEntry, ExampleColor } from '@/lib/contentful';

function body(text: string): Document {
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
      },
    ],
  } as Document;
}

function card(
  id: string,
  title: string,
  text: string,
  color: ExampleColor
): ExampleCardEntry {
  return {
    sys: { id, contentType: { sys: { id: 'exampleCard' } } },
    fields: { title, body: body(text), backgroundColor: color },
  };
}

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

const P_CLASS = 'mb-4 leading-relaxed text-gray-700 text-justify';

export default function ExamplesPreviewPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="prose prose-lg max-w-none">
        <p className={P_CLASS}>{LOREM}</p>
        <ExamplesAside
          title="Topic of paragraph (right)"
          side="right"
          examples={[
            card('1', 'example 1', 'A short worked example goes here.', 'pink'),
            card('2', 'example 2', 'Another example with a different color.', 'yellow'),
          ]}
        />
        <p className={P_CLASS}>{LOREM}</p>
        <p className={P_CLASS}>{LOREM}</p>
        <ExamplesAside
          title="Topic of paragraph (left)"
          side="left"
          examples={[
            card('3', 'example 1', 'This box floats to the left on desktop.', 'blue'),
            card('4', 'example 2', 'Full width when the viewport is narrow.', 'green'),
          ]}
        />
        <p className={P_CLASS}>{LOREM}</p>
        <p className={P_CLASS}>{LOREM}</p>
      </div>
    </div>
  );
}
