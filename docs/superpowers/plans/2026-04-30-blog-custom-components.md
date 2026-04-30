# Blog Custom Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three reusable Contentful-backed blog components (collapsible TOC, GraphTree, ImageGrid) so blog posts can embed them inline via Contentful Rich Text.

**Architecture:** Three new components rendered at the Rich Text layer. The TOC is opted in per post via a new boolean field; GraphTree and ImageGrid are embedded entries dispatched from `RichTextRenderer`. A small server-side helper extracts headings from the Contentful Document tree to feed the TOC.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS 3.4, Contentful Delivery SDK, `@contentful/rich-text-react-renderer`, `next/image`.

---

## Notes for the implementer

- **The project has no test suite.** Verification is `npx tsc --noEmit` (typecheck), `npm run lint`, `npm run build`, and manual browser checks where applicable. Each task ends with these checks instead of unit tests.
- **Existing slugify helper:** `slugify` already exists in `src/lib/utils.ts` — import it, do not redefine it.
- **Type locations:** New Contentful entry types go in `src/lib/contentful.ts` (alongside existing `PostEntry`, `ArtworkEntry`, etc.), not in `src/lib/types.ts`. This matches project convention.
- **Tailwind dynamic class names** must appear *literally* somewhere in source so JIT detects them. Static class maps (shown in code below) handle this.
- **Native `<details>` elements** are used for collapsible state — no `useState` needed. They give free keyboard accessibility and toggle behavior.

---

## Task 0: Set up Contentful content models (manual, in Contentful UI)

**Files:** None (Contentful web app changes only).

This task is performed by hand in the Contentful web UI. It must be completed before authoring posts that reference these models, but the code tasks below can proceed in parallel — code does not break if the models don't exist yet, only specific embedded entries will fail to resolve.

- [ ] **Step 1: Add `showTableOfContents` field to existing `post` content type**

In Contentful → Content model → `post` (or whatever the existing post model is called) → Add field:
- Type: **Boolean**
- Name: **Show Table of Contents**
- Field ID: `showTableOfContents`
- Required: No
- Default value: `false`

Save & publish the content model.

- [ ] **Step 2: Create `graphTreeStep` content type**

Content model → Add content type:
- Name: **Graph Tree Step**
- API identifier: `graphTreeStep`
- Description: *Single step in a Graph Tree. With a body it expands; without a body it's a label-only row.*

Fields:
- `label` — Short text — **required** — name of the step
- `body` — Long text — optional — plain text prompt body, line breaks preserved

Save & publish.

- [ ] **Step 3: Create `graphTree` content type**

Content model → Add content type:
- Name: **Graph Tree**
- API identifier: `graphTree`
- Description: *Collapsible nested step component for sequential workflows (e.g. prompt iteration).*

Fields:
- `title` — Short text — optional — defaults to "Graph Tree" if blank
- `steps` — References, many — **required** — accepts only `graphTreeStep` entries

Save & publish.

- [ ] **Step 4: Create `imageGridItem` content type**

Content model → Add content type:
- Name: **Image Grid Item**
- API identifier: `imageGridItem`

Fields:
- `image` — Media, single image — **required**
- `caption` — Short text — optional
- `alt` — Short text — optional — accessibility alt text override

Save & publish.

- [ ] **Step 5: Create `imageGrid` content type**

Content model → Add content type:
- Name: **Image Grid**
- API identifier: `imageGrid`

Fields:
- `columns` — Integer — **required** — validation: accept only `2`, `3`, `4` (use Contentful's "Accept only specified values" validation)
- `items` — References, many — **required** — accepts only `imageGridItem` entries

Save & publish.

- [ ] **Step 6: Confirm done**

In Contentful, verify all five content types appear in the Content model list with the correct fields. No commit for this task — these are external (Contentful) configuration changes.

---

## Task 1: Add Contentful entry types

**Files:**
- Modify: `src/lib/contentful.ts` (add types alongside existing entry types)

- [ ] **Step 1: Add `showTableOfContents` to `PostEntry`**

Edit `src/lib/contentful.ts`. Find the existing `PostEntry` interface and add the optional field:

```ts
export interface PostEntry {
  sys: { id: string };
  fields: {
    title: string;
    slug: string;
    body: Document;
    excerpt: string;
    featuredImage?: ContentfulAsset;
    tags: string[];
    publishDate: string;
    status: 'draft' | 'published';
    showTableOfContents?: boolean;
  };
}
```

- [ ] **Step 2: Add the four new entry types**

In `src/lib/contentful.ts`, immediately below the existing `AboutEntry` interface (or anywhere in the "Content Types" block — pick a logical spot), add:

```ts
export interface GraphTreeStepEntry {
  sys: { id: string; contentType: { sys: { id: 'graphTreeStep' } } };
  fields: {
    label: string;
    body?: string;
  };
}

export interface GraphTreeEntry {
  sys: { id: string; contentType: { sys: { id: 'graphTree' } } };
  fields: {
    title?: string;
    steps: GraphTreeStepEntry[];
  };
}

export interface ImageGridItemEntry {
  sys: { id: string; contentType: { sys: { id: 'imageGridItem' } } };
  fields: {
    image: ContentfulAsset;
    caption?: string;
    alt?: string;
  };
}

export interface ImageGridEntry {
  sys: { id: string; contentType: { sys: { id: 'imageGrid' } } };
  fields: {
    columns: 2 | 3 | 4;
    items: ImageGridItemEntry[];
  };
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: No errors related to the new types.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contentful.ts
git commit -m "Add Contentful entry types for GraphTree and ImageGrid"
```

---

## Task 2: Bump Contentful include depth on `getPostBySlug`

**Files:**
- Modify: `src/lib/contentful.ts:166-181` (the `getPostBySlug` function)

- [ ] **Step 1: Add `include: 3` to the query**

Find the existing `getPostBySlug` function and modify the query object:

```ts
export async function getPostBySlug(
  slug: string,
  preview = false
): Promise<PostEntry | null> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'post',
    'fields.slug': slug,
    limit: 1,
    include: 3,
  };

  const response = await client.getEntries(query);

  return (response.items[0] as unknown as PostEntry) || null;
}
```

The include depth of 3 resolves: `post → graphTree → graphTreeStep` and `post → imageGrid → imageGridItem → image (asset)`.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: Build succeeds. (This task touches data fetching used at build time; verifying the build stays green is important.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/contentful.ts
git commit -m "Raise Contentful include depth to resolve nested embedded entries"
```

---

## Task 3: Create the heading extraction helper

**Files:**
- Create: `src/lib/extract-headings.ts`

- [ ] **Step 1: Implement the helper**

Create `src/lib/extract-headings.ts`:

```ts
import { Document, Node, BLOCKS } from '@contentful/rich-text-types';
import { slugify } from './utils';

export type HeadingLevel = 2 | 3 | 4;

export interface HeadingNode {
  id: string;
  text: string;
  level: HeadingLevel;
}

export interface HeadingTreeNode extends HeadingNode {
  children: HeadingTreeNode[];
}

const HEADING_BLOCK_TO_LEVEL: Record<string, HeadingLevel> = {
  [BLOCKS.HEADING_2]: 2,
  [BLOCKS.HEADING_3]: 3,
  [BLOCKS.HEADING_4]: 4,
};

export function getPlainText(node: Node): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }
  if ('content' in node && Array.isArray(node.content)) {
    return node.content.map((child) => getPlainText(child as Node)).join('');
  }
  return '';
}

export function extractHeadings(document: Document): HeadingNode[] {
  const headings: HeadingNode[] = [];
  const seenIds = new Map<string, number>();

  for (const node of document.content) {
    const level = HEADING_BLOCK_TO_LEVEL[node.nodeType];
    if (!level) continue;

    const text = getPlainText(node).trim();
    if (!text) continue;

    let id = slugify(text);
    if (seenIds.has(id)) {
      const next = (seenIds.get(id) ?? 1) + 1;
      seenIds.set(id, next);
      id = `${id}-${next}`;
    } else {
      seenIds.set(id, 1);
    }

    headings.push({ id, text, level });
  }

  return headings;
}

export function buildHeadingTree(headings: HeadingNode[]): HeadingTreeNode[] {
  const root: HeadingTreeNode[] = [];
  const stack: HeadingTreeNode[] = [];

  for (const heading of headings) {
    const node: HeadingTreeNode = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return root;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/extract-headings.ts
git commit -m "Add heading extraction helper for Contentful Rich Text"
```

---

## Task 4: Add heading id attributes in `RichTextRenderer`

**Files:**
- Modify: `src/components/shared/RichTextRenderer.tsx` (heading renderers, lines ~44-61)

- [ ] **Step 1: Add the slug-from-node import and heading id wiring**

At the top of the file, add the imports for `slugify` and `getPlainText`:

```ts
import { slugify } from '@/lib/utils';
import { getPlainText } from '@/lib/extract-headings';
```

Then update the heading renderers in the `options.renderNode` block. Replace the existing `BLOCKS.HEADING_2` / `BLOCKS.HEADING_3` / `BLOCKS.HEADING_4` entries with these:

```ts
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
```

The `scroll-mt-20` class adds 5rem of scroll padding so anchor jumps land below any future sticky header without sitting flush against the top edge.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Manual browser check**

Run the dev server:

```bash
npm run dev
```

Open any existing blog post that has H2/H3 headings. View source / inspect — verify each `<h2>` / `<h3>` / `<h4>` has an `id` attribute matching the slugified heading text. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/RichTextRenderer.tsx
git commit -m "Add heading id attributes for in-page anchor links"
```

---

## Task 5: Create `<TableOfContents>` component

**Files:**
- Create: `src/components/blog/TableOfContents.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/blog/TableOfContents.tsx`:

```tsx
'use client';

import { HeadingNode, HeadingTreeNode, buildHeadingTree } from '@/lib/extract-headings';

interface TableOfContentsProps {
  headings: HeadingNode[];
}

function renderTree(nodes: HeadingTreeNode[]): React.ReactNode {
  if (nodes.length === 0) return null;
  return (
    <ul className="list-disc pl-6 sm:pl-4 space-y-1 text-gray-700">
      {nodes.map((node) => (
        <li key={node.id} className="leading-relaxed">
          <a href={`#${node.id}`} className="text-blue-600 hover:text-blue-800 underline">
            {node.text}
          </a>
          {node.children.length > 0 && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  if (headings.length === 0) return null;

  const tree = buildHeadingTree(headings);

  return (
    <details className="mb-8 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 group">
      <summary className="cursor-pointer font-semibold text-gray-900 select-none list-none flex items-center gap-2">
        <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
          ▶
        </span>
        Table of Contents
      </summary>
      <div className="mt-3">{renderTree(tree)}</div>
    </details>
  );
}
```

The `group-open:rotate-90` class rotates the ▶ to point down (▼-like) when the `<details>` opens, providing the visual toggle without JS.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/blog/TableOfContents.tsx
git commit -m "Add TableOfContents component"
```

---

## Task 6: Wire TOC into the blog post page

**Files:**
- Modify: `src/app/(main)/blog/[slug]/page.tsx`

- [ ] **Step 1: Import and render the TOC**

At the top of `src/app/(main)/blog/[slug]/page.tsx`, add the imports:

```ts
import TableOfContents from '@/components/blog/TableOfContents';
import { extractHeadings } from '@/lib/extract-headings';
```

Inside the `PostPage` function, after destructuring fields from `post.fields`, add:

```ts
const { title, body, featuredImage, tags, publishDate, showTableOfContents } = post.fields;
const headings = showTableOfContents ? extractHeadings(body) : [];
```

(Note the addition of `showTableOfContents` to the destructure.)

Then, in the JSX, between the `</header>` tag and the featured image block, render the TOC:

```tsx
        <ShareButtons title={title} slug={slug} />
      </header>

      {showTableOfContents && headings.length > 0 && (
        <TableOfContents headings={headings} />
      )}

      {/* Featured Image */}
      {imageUrl && (
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Manual browser check**

In Contentful, pick an existing blog post that has at least 3 headings (or temporarily edit one), set `showTableOfContents = true`, and publish.

```bash
npm run dev
```

Open `/blog/<slug>`. Verify:
- TOC renders above the featured image
- Starts collapsed (▶)
- Opens on click (rotates to ▼-style)
- Items render with proper indent (H2 top level, H3 nested, H4 deeper)
- Clicking an item scrolls to the heading
- Resize the browser to ~375px wide → TOC still readable, no horizontal scroll

Set `showTableOfContents = false` on the post in Contentful → reload → TOC should disappear.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(main\)/blog/\[slug\]/page.tsx
git commit -m "Render TableOfContents on opted-in blog posts"
```

---

## Task 7: Create `<ImageGrid>` component

**Files:**
- Create: `src/components/blog/ImageGrid.tsx`

- [ ] **Step 1: Implement the component**

Create `src/components/blog/ImageGrid.tsx`:

```tsx
import Image from 'next/image';
import { ImageGridItemEntry } from '@/lib/contentful';

interface ImageGridProps {
  columns: 2 | 3 | 4;
  items: ImageGridItemEntry[];
}

const COLUMN_CLASS: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

function getImageUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}

function altFor(item: ImageGridItemEntry): string {
  return item.fields.alt || item.fields.caption || item.fields.image.fields.title || '';
}

function GridFigure({
  item,
  sizes,
}: {
  item: ImageGridItemEntry;
  sizes: string;
}) {
  const file = item.fields.image.fields.file;
  const dims = file.details.image;
  const url = getImageUrl(file.url);

  return (
    <figure className="m-0">
      <Image
        src={url}
        alt={altFor(item)}
        width={dims?.width || 800}
        height={dims?.height || 600}
        sizes={sizes}
        className="rounded-lg w-full h-auto"
      />
      {item.fields.caption && (
        <figcaption className="text-sm text-gray-500 text-center mt-2">
          {item.fields.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function ImageGrid({ columns, items }: ImageGridProps) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="my-6 max-w-2xl mx-auto">
        <GridFigure item={items[0]} sizes="(max-width: 768px) 100vw, 768px" />
      </div>
    );
  }

  const effectiveColumns = Math.min(columns, items.length) as 2 | 3 | 4;
  const sizes = `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.floor(100 / effectiveColumns)}vw`;

  return (
    <div className={`my-6 grid gap-4 md:gap-6 ${COLUMN_CLASS[effectiveColumns]}`}>
      {items.map((item) => (
        <GridFigure key={item.sys.id} item={item} sizes={sizes} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: Build succeeds. (Catches Tailwind class resolution issues — every grid-cols class is in a static map so JIT detects them.)

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/ImageGrid.tsx
git commit -m "Add ImageGrid component with adaptive column behavior"
```

---

## Task 8: Create `<GraphTreeStep>` component

**Files:**
- Create: `src/components/blog/GraphTreeStep.tsx`

- [ ] **Step 1: Implement the step**

Create `src/components/blog/GraphTreeStep.tsx`:

```tsx
'use client';

import { useState } from 'react';

interface GraphTreeStepProps {
  label: string;
  body?: string;
  isLast: boolean;
}

function ArrowConnector() {
  return (
    <div className="flex justify-center text-gray-400 text-base sm:text-lg leading-none my-1" aria-hidden>
      ↓
    </div>
  );
}

export default function GraphTreeStep({ label, body, isLast }: GraphTreeStepProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — silently no-op
    }
  };

  if (!body) {
    return (
      <>
        <div className="rounded border border-gray-200 bg-white px-3 py-2 text-gray-800">
          {label}
        </div>
        {!isLast && <ArrowConnector />}
      </>
    );
  }

  return (
    <>
      <details className="rounded border border-gray-200 bg-white group">
        <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-3 py-2 text-gray-800">
          <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
            ▶
          </span>
          {label}
        </summary>
        <div className="relative px-3 pb-3">
          <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-gray-50 rounded p-3 sm:pr-20 overflow-x-auto text-gray-800">
            {body}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 sm:mt-0 sm:absolute sm:top-3 sm:right-3 w-full sm:w-auto text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </details>
      {!isLast && <ArrowConnector />}
    </>
  );
}
```

The Copy button is positioned absolute on `sm+` (top-right of the body box, with `pr-20` on the `<pre>` to keep text from running under it), and falls back to a full-width button below the body on mobile.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/blog/GraphTreeStep.tsx
git commit -m "Add GraphTreeStep component"
```

---

## Task 9: Create `<GraphTree>` component

**Files:**
- Create: `src/components/blog/GraphTree.tsx`

- [ ] **Step 1: Implement the wrapper**

Create `src/components/blog/GraphTree.tsx`:

```tsx
'use client';

import GraphTreeStep from './GraphTreeStep';
import { GraphTreeStepEntry } from '@/lib/contentful';

interface GraphTreeProps {
  title?: string;
  steps: GraphTreeStepEntry[];
}

export default function GraphTree({ title, steps }: GraphTreeProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <details className="my-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 group">
      <summary className="cursor-pointer font-semibold text-gray-900 select-none list-none flex items-center gap-2">
        <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
          ▶
        </span>
        {title || 'Graph Tree'}
      </summary>
      <div className="mt-3 flex flex-col">
        {steps.map((step, index) => (
          <GraphTreeStep
            key={step.sys.id}
            label={step.fields.label}
            body={step.fields.body}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </details>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/blog/GraphTree.tsx
git commit -m "Add GraphTree component"
```

---

## Task 10: Wire embedded entry dispatch into `RichTextRenderer`

**Files:**
- Modify: `src/components/shared/RichTextRenderer.tsx` (add new imports + EMBEDDED_ENTRY handler)

- [ ] **Step 1: Add imports**

At the top of `src/components/shared/RichTextRenderer.tsx`, add:

```ts
import GraphTree from '@/components/blog/GraphTree';
import ImageGrid from '@/components/blog/ImageGrid';
import { GraphTreeEntry, ImageGridEntry } from '@/lib/contentful';
```

- [ ] **Step 2: Add the `BLOCKS.EMBEDDED_ENTRY` handler**

Inside the `options.renderNode` object, alongside the existing `BLOCKS.EMBEDDED_ASSET` handler, add the new handler:

```ts
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
    default:
      return null;
  }
},
```

The defensive guard (`entry?.sys?.contentType?.sys?.id`) handles the case where Contentful returns an unresolved reference stub — the dispatch returns `null` rather than throwing.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/RichTextRenderer.tsx
git commit -m "Dispatch embedded entries to GraphTree and ImageGrid"
```

---

## Task 11: End-to-end manual verification

**Files:** None (manual browser checks).

This task has no commits — it's purely verification before declaring the work done.

- [ ] **Step 1: Author a test post in Contentful**

In Contentful, create a draft post (or edit a draft) that:
- Has `showTableOfContents = true`
- Contains at least 3 headings (mix of H2/H3/H4)
- Has at least one embedded `graphTree` entry with 4+ steps, where some have a `body` and some don't
- Has at least one embedded `imageGrid` entry — try once with `columns=3` and 3 items, once with `columns=3` and only 2 items (to verify the cap), and once with 1 item

Publish the post.

- [ ] **Step 2: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 3: TableOfContents verification**

Open the test post:

- [ ] TOC renders above the featured image
- [ ] Starts collapsed; ▶ rotates on open
- [ ] H2/H3/H4 indent correctly
- [ ] Each link scrolls to the right section (`scroll-mt-20` keeps target visible)
- [ ] On a separate post with `showTableOfContents = false` → TOC absent
- [ ] At ~375px viewport → list wraps; no horizontal page scroll

- [ ] **Step 4: GraphTree verification**

Same post:

- [ ] Outer wrapper collapsed by default; ▶ → rotates on open
- [ ] Step with body → ▶ visible, expands to show monospace prompt block
- [ ] Step without body → label only, no ▶, no click affordance
- [ ] Arrows (`↓`) render between steps, suppressed after final step
- [ ] Copy button copies prompt body; shows transient "Copied!" feedback
- [ ] At ~375px viewport → long prompts wrap; copy button moves below prompt

- [ ] **Step 5: ImageGrid verification**

Same post:

- [ ] 1-image grid → centered, max-width constrained (not stretched full width)
- [ ] 2 images with `columns=3` → renders as 2 across (cap behavior)
- [ ] 3 images with `columns=3` → 3 across desktop, 2 across at ~768px tablet, 1 column at ~375px mobile
- [ ] Captions render below images when present
- [ ] Image with no caption → no figcaption rendered

- [ ] **Step 6: Build pass**

Stop the dev server.

```bash
npm run build
```

Expected: Build succeeds. No type errors. No Tailwind class warnings.

- [ ] **Step 7: Done**

All three components are wired up, render correctly across breakpoints, and the build is green. No commit — verification is the deliverable.

---
