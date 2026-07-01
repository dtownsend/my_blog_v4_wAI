# Examples Aside Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Examples Aside" custom blog component that authors embed in a Contentful post body — a titled box of example cards that floats beside a paragraph on desktop and stacks full-width on mobile.

**Architecture:** A container Contentful entry (`examplesAside`) references child `exampleCard` entries. A new client component `ExamplesAside` renders an `<aside>` with `md:float-left/right` + fixed width (desktop) and `float-none w-full` (mobile). `RichTextRenderer` dispatches the embedded `examplesAside` entry to the component, matching the existing `graphTree`/`imageGrid` pattern.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Contentful rich-text renderer (`@contentful/rich-text-react-renderer`).

## Global Constraints

- **No unit-test suite.** Verification per task is `npx tsc --noEmit` (type check), `npm run lint`, `npm run build`, and — for the component — a temporary visual preview route.
- **Tailwind color classes must be literal full strings** in a static `Record` (no dynamic class construction like `bg-${x}-100`), so Tailwind's content scanner keeps them.
- **`@tailwindcss/typography` is NOT installed.** `prose`, `prose-lg`, and `not-prose` are no-op class names in this repo; styling comes from explicit utility classes. Do not use `not-prose`.
- **Content types are created manually in Contentful** (`exampleCard`, `examplesAside`) — not part of this code. Field shapes are fixed by `src/lib/contentful.ts`.
- Content type IDs are camelCase, matched exactly against `sys.contentType.sys.id`.
- Commit messages end with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- Work happens on the `examples-aside` branch (already created).

---

## Amendment (post-execution styling iteration)

After Tasks 1–4 were implemented and reviewed, a visual preview against real
long-form example content changed the desktop layout approach. The Task 3 code
below (a plain float via the `EMBEDDED_ENTRY` case) shipped, then was superseded:

- `RichTextRenderer` now **pairs** a paragraph with an `examplesAside` placed
  immediately after it, rendering top-level nodes one at a time and wrapping the
  pair in an `ExamplesAsidePair` component. On desktop the pair collapses via
  `display:contents` so the aside floats before the paragraph (top-aligned, text
  wraps); on mobile it is a `flex flex-col` with the aside `order-last` (after
  the paragraph). See the spec's "Layout approach — paragraph + aside pairing".
- `ExamplesAside` gained `md:mt-0` so the desktop float's top is level with the
  paragraph.
- Authoring rule changed from "embed **before** the paragraph" to "embed
  **after** the paragraph."

The task code blocks below reflect the original plan; the committed code is the
source of truth for the final pairing behavior.

---

### Task 1: Add TypeScript entry types

**Files:**
- Modify: `src/lib/contentful.ts` (insert after the `ImageGridEntry` interface, which ends at line 159, before the `// Fetch functions` comment)

**Interfaces:**
- Consumes: `Document` (already imported at `src/lib/contentful.ts:2`)
- Produces: `ExampleColor`, `ExampleCardEntry`, `ExamplesAsideEntry` — consumed by Tasks 2 and 3.

- [ ] **Step 1: Add the type definitions**

Insert this block immediately after the closing `}` of the `ImageGridEntry` interface (line 159) and before the `// Fetch functions` comment (line 161):

```ts
export type ExampleColor =
  | 'pink'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'purple'
  | 'gray'
  | 'none';

export interface ExampleCardEntry {
  sys: { id: string; contentType: { sys: { id: 'exampleCard' } } };
  fields: {
    title?: string;
    body: Document;
    backgroundColor?: ExampleColor;
  };
}

export interface ExamplesAsideEntry {
  sys: { id: string; contentType: { sys: { id: 'examplesAside' } } };
  fields: {
    title?: string;
    side?: 'left' | 'right';
    examples: ExampleCardEntry[];
  };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (the new types are unused so far — that is fine).

- [ ] **Step 3: Commit**

```bash
git add src/lib/contentful.ts
git commit -m "$(cat <<'EOF'
Add ExampleCard / ExamplesAside Contentful entry types

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Build the ExamplesAside component + temporary preview route

**Files:**
- Create: `src/components/blog/ExamplesAside.tsx`
- Create (temporary, removed in Task 4): `src/app/examples-preview/page.tsx`

**Interfaces:**
- Consumes: `ExampleColor`, `ExampleCardEntry` from `@/lib/contentful` (Task 1)
- Produces: `default export ExamplesAside({ title?: string; side: 'left' | 'right'; examples: ExampleCardEntry[] })` — consumed by Task 3.

- [ ] **Step 1: Create the component**

Create `src/components/blog/ExamplesAside.tsx` with exactly this content:

```tsx
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
      <p className="mb-2 last:mb-0 leading-snug">{children}</p>
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
      className={`float-none w-full my-6 md:w-72 md:mb-4 ${SIDE_CLASS[side]} rounded-lg border border-gray-200 bg-gray-50 px-4 py-3`}
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
```

- [ ] **Step 2: Create the temporary preview route**

Create `src/app/examples-preview/page.tsx` with exactly this content. It reproduces the real rendering context (the same wrapper and paragraph classes `RichTextRenderer` uses) with mock data, so the float + stack behavior can be eyeballed before Contentful content exists:

```tsx
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
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Visual check**

Run: `npm run dev`, then open `http://localhost:3000/examples-preview`.
Expected:
- **Desktop width:** the first box floats to the **right** with paragraph text wrapping to its left; the second box floats to the **left** with text wrapping to its right. Each box shows a gray container, a bold title, and colored cards (pink/yellow, blue/green).
- **Narrow width** (resize to ~375px, or DevTools device mode): both boxes are **full-width** and stacked in normal flow, no float.
Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/ExamplesAside.tsx src/app/examples-preview/page.tsx
git commit -m "$(cat <<'EOF'
Add ExamplesAside component with temporary preview route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire ExamplesAside into RichTextRenderer

**Files:**
- Modify: `src/components/shared/RichTextRenderer.tsx` (imports near lines 9-11; `EMBEDDED_ENTRY` switch, add case after the `imageGrid` case that ends at line 119, before `default:` at line 120)

**Interfaces:**
- Consumes: `ExamplesAside` (Task 2), `ExamplesAsideEntry` (Task 1)
- Produces: rendered `examplesAside` embeds in post bodies.

- [ ] **Step 1: Add the component import**

After line 10 (`import ImageGrid from '@/components/blog/ImageGrid';`), add:

```ts
import ExamplesAside from '@/components/blog/ExamplesAside';
```

- [ ] **Step 2: Extend the contentful type import**

Change line 11 from:

```ts
import { GraphTreeEntry, ImageGridEntry } from '@/lib/contentful';
```

to:

```ts
import { GraphTreeEntry, ImageGridEntry, ExamplesAsideEntry } from '@/lib/contentful';
```

- [ ] **Step 3: Add the switch case**

In the `BLOCKS.EMBEDDED_ENTRY` renderer, immediately after the `case 'imageGrid': { … }` block (ends line 119) and before `default:` (line 120), add:

```ts
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
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/RichTextRenderer.tsx
git commit -m "$(cat <<'EOF'
Dispatch examplesAside embeds to ExamplesAside in RichTextRenderer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Remove preview route and run the full build

**Files:**
- Delete: `src/app/examples-preview/page.tsx`

- [ ] **Step 1: Delete the temporary preview route**

Run: `git rm src/app/examples-preview/page.tsx`
(The `examples-preview` directory becomes empty and is removed.)

- [ ] **Step 2: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all pass; the build completes with no type or lint errors and no reference to `examples-preview`.

- [ ] **Step 3: Commit**

```bash
# Step 1's `git rm` already staged the deletion. Stage ONLY that file —
# do NOT use `git add -A`, which would sweep unrelated working-tree changes
# (e.g. someone else's in-progress work) into this feature commit.
git add src/app/examples-preview/page.tsx
git commit -m "$(cat <<'EOF'
Remove temporary ExamplesAside preview route

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Post-implementation (David, manual — outside this plan)

To use the component with live content, create the two content types in Contentful:

1. **`exampleCard`** — `title` (Short text, optional), `body` (Rich text, required), `backgroundColor` (Short text, validation dropdown: `pink` `yellow` `blue` `green` `purple` `gray` `none`, default `none`).
2. **`examplesAside`** — `title` (Short text, optional), `side` (Short text, validation `left`/`right`, default `right`), `examples` (References, many → `exampleCard`).

Then create `exampleCard` entries + one `examplesAside` referencing them, and embed the `examplesAside` into a post body just before the target paragraph.

## Self-Review

**Spec coverage:**
- Data model (`exampleCard`, `examplesAside`, `ExampleColor`) → Task 1. ✓
- CSS-float layout (desktop float L/R, mobile full-width) → Task 2 (`SIDE_CLASS`, `float-none w-full md:w-72`). ✓
- Curated color palette as static literal map → Task 2 (`COLOR_CLASS`). ✓
- Optional title + rich-text body per card, compact renderer, no nested embeds → Task 2 (`ExampleCard`, `cardBodyOptions`). ✓
- Per-instance `side` with `right` default → Task 3 (`side ?? 'right'`) + Task 2 prop. ✓
- Renderer dispatch via `EMBEDDED_ENTRY` → Task 3. ✓
- No fetch changes (uses existing `include: 3`) → confirmed, no task needed. ✓
- Verification typecheck/lint/build + throwaway preview route created then deleted → Tasks 2 & 4. ✓
- Content types created manually by David → documented in Post-implementation, out of code scope. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows complete code. ✓

**Type consistency:** `ExampleColor`, `ExampleCardEntry`, `ExamplesAsideEntry` defined in Task 1 and used verbatim in Tasks 2-3. `ExamplesAside` props (`title?`, `side`, `examples`) match between Task 2 definition and Task 3 call site. `side ?? 'right'` guarantees the non-optional `side` prop. ✓
