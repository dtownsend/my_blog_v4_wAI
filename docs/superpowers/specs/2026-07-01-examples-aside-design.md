# Examples Aside — Design Spec

**Date:** 2026-07-01
**Status:** Approved for planning
**Author:** David Townsend (with Claude)

## Summary

A new custom blog component, **Examples Aside**, that authors embed inside a
post body in Contentful — exactly like the existing `graphTree` and `imageGrid`
components. It presents a titled box ("topic of paragraph") holding a small
stack of **example cards**. On desktop the box floats to the side of a paragraph
and the text wraps around it; on mobile it drops the float and becomes a
full-width block stacked in normal flow.

This mirrors the repo's established parent/child embed pattern
(`imageGrid` + `imageGridItem`, `graphTree` + `graphTreeStep`).

## Goals

- Let a post author call out one or more worked examples beside a paragraph.
- Desktop: float left or right of the adjacent paragraph, text wraps around it.
- Mobile: full-width block, stacked between paragraphs (no float).
- Each example card is independently authored: optional title, rich-text body,
  author-chosen background color from a curated palette.

## Non-goals

- No changes to the article page layout (no persistent margin sidebar).
- No nested embeds inside an example card's rich text (kept to basic formatting).
- No auto-alternating float logic — the side is chosen per instance.
- I build code only. The two Contentful content types are created by David in
  the Contentful UI; this spec defines their shapes.

## Content model (Contentful)

Two new content types. **David creates these in Contentful**; the shapes below
are the contract the code depends on.

### `exampleCard` (child — one card)

| Field ID          | Type       | Required | Notes                                                                 |
|-------------------|------------|----------|-----------------------------------------------------------------------|
| `title`           | Short text | No       | Optional bold heading on the card.                                    |
| `body`            | Rich text  | Yes      | The example content. Basic formatting only (see rendering).           |
| `backgroundColor` | Short text | No       | Validation dropdown: `pink` `yellow` `blue` `green` `purple` `gray` `none`. Default `none`. |

### `examplesAside` (container — the embedded entry)

| Field ID    | Type              | Required | Notes                                              |
|-------------|-------------------|----------|----------------------------------------------------|
| `title`     | Short text        | No       | The "topic of paragraph" heading.                  |
| `side`      | Short text        | No       | Validation: `left` / `right`. Default `right`.     |
| `examples`  | References (many) | Yes      | Links to `exampleCard` entries, in display order.  |

Only `examplesAside` is ever embedded into a post body. The `exampleCard`
entries ride along via reference. `getPostBySlug` already fetches with
`include: 3`, which resolves post → aside → cards.

### Authoring flow

1. Create one `exampleCard` entry per card (title, body, color).
2. Create one `examplesAside`, set its title + `side`, reference the cards in
   `examples` (order matters).
3. Embed the `examplesAside` into the post body **immediately after** the
   paragraph it should accompany. `RichTextRenderer` pairs the two (see Layout).

## Layout approach — paragraph + aside pairing

> **Note:** the original design used a plain float with the box before the
> paragraph. Once previewed against real long-form example content, that left a
> dead gap above the desktop float (or, if placed after the paragraph, the wrong
> order on mobile). The pairing approach below replaced it so both breakpoints
> are correct. See the "considered and rejected" list.

The embedded `examplesAside` renders among the post's paragraphs inside
`RichTextRenderer`'s `<div className="prose prose-lg …">`. `RichTextRenderer`
walks the document's top-level nodes and, when a paragraph is *immediately
followed* by an `examplesAside`, renders the two inside a pairing wrapper
(`ExamplesAsidePair`). All other nodes render node-by-node exactly as before.

The pair uses `display:contents` + flex to get the right behavior on each
breakpoint from a single source position:

- **Desktop (`md:`):** the wrappers are `md:contents`, so they generate no box
  and the aside (source-ordered *before* the paragraph inside the pair) floats
  in the article flow. The paragraph and following paragraphs wrap around it.
  The aside floats via its own `side` classes (`md:float-right md:ml-6 md:w-72`
  / `md:float-left md:mr-6 md:w-72`) plus `md:mt-0` so its top is level with the
  paragraph — no dead space above the box.
- **Mobile:** the pair wrapper is `flex flex-col` and the aside wrapper is
  `order-last`, so the aside drops **after** the paragraph. The aside itself is
  `float-none w-full my-6` — a full-width stacked block.

This is why the embed is authored *after* its paragraph: that source position
gives the correct mobile order, and the pairing + `display:contents` recovers
the desktop float beside the paragraph.

**Known float behavior (accepted):** if the box is taller than its paragraph,
following paragraphs keep wrapping alongside it until the text clears — inherent
to floats, and the desired space-filling behavior here.

Approaches considered and rejected:
- **Simple float, box before the paragraph (no pairing)** — the original plan. A
  single source position couples the two breakpoints: box-before gives a clean
  desktop float but puts the box *above* the paragraph on mobile; box-after fixes
  mobile but leaves a dead gap above the desktop float. Pairing satisfies both.
- **True margin sidebar in the article layout** — a bigger layout change that
  can't align to a specific paragraph. Doesn't match the mockup.

## Components

### `src/components/blog/ExamplesAside.tsx` (`'use client'`)

- Props: `title?: string`, `side: 'left' | 'right'`, `examples: ExampleCardEntry[]`.
- Renders `<aside>`: light-gray container (`bg-gray-50 border border-gray-200
  rounded-lg px-4 py-3`, consistent with `GraphTree`), float/width classes
  derived from `side`, optional title, and a vertical stack of cards.
- Returns `null` when `examples` is empty (same guard style as the other
  components).
- `ExampleCard` sub-component lives in the same file (same pattern as
  `GridFigure`/`Lightbox` inside `ImageGrid.tsx`).

### `ExampleCard` (sub-component)

- Renders one card: background from a **static** `Record<ExampleColor, string>`
  of full Tailwind class strings (written literally so Tailwind's content scan
  keeps them — no dynamic class construction), optional bold `title`, and a
  compact rich-text `body`.
- Color map (soft pastel bg + border, `text-gray-800`):

  | value    | classes                          |
  |----------|----------------------------------|
  | `pink`   | `bg-pink-100 border-pink-200`    |
  | `yellow` | `bg-yellow-100 border-yellow-200`|
  | `blue`   | `bg-blue-100 border-blue-200`    |
  | `green`  | `bg-green-100 border-green-200`  |
  | `purple` | `bg-purple-100 border-purple-200`|
  | `gray`   | `bg-gray-100 border-gray-200`    |
  | `none`   | `bg-white border-gray-200`       |

### Card body rich-text rendering

The card body uses a small, **local** `documentToReactComponents` options object
(defined in `ExamplesAside.tsx`) covering only:

- paragraphs (compact: smaller text, tight spacing)
- marks: bold, italic, underline, inline code
- unordered / ordered lists
- hyperlinks (internal `Link` / external `<a target="_blank">`)

It deliberately does **not** reuse `RichTextRenderer` (which is `prose-lg` +
Prism + embedded-entry dispatch). This keeps the card self-contained, compact,
and prevents nesting an `examplesAside` inside an `examplesAside`.

## Types — `src/lib/contentful.ts`

Add alongside the existing entry interfaces:

```ts
export type ExampleColor =
  | 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'gray' | 'none';

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

No fetch-function changes: `getPostBySlug` already uses `include: 3`.

## Renderer wiring — `src/components/shared/RichTextRenderer.tsx`

- Import `ExamplesAside` and `ExamplesAsideEntry`.
- Add a case to the `BLOCKS.EMBEDDED_ENTRY` switch:

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

- Replace the single `documentToReactComponents(content, options)` call with a
  top-level walk (see Layout approach). Render each node via
  `documentToReactComponents(asDoc(node), options)`; when a `PARAGRAPH` node is
  immediately followed by an `examplesAside` embed, wrap the pair in
  `ExamplesAsidePair` and skip the consumed aside. Helpers `asDoc(node)`,
  `isExamplesAsideNode(node)`, and the `ExamplesAsidePair` component live in this
  file.

## Verification

Repo has no unit-test suite; verification is typecheck + lint + build + a visual
check.

- `npx tsc --noEmit` — type check passes.
- `npm run lint` — passes.
- `npm run build` — passes (Next type-checks during build).
- **Visual:** temporarily add a throwaway dev preview route (e.g.
  `src/app/examples-preview/page.tsx`) rendering `ExamplesAside` with mock data,
  to eyeball the desktop float (both sides) and the mobile full-width stack.
  **Delete this route before finishing.**
- Live check (post-merge, David): create the two content types + a sample post,
  then view it via the running site / Contentful preview.

## Out of scope / follow-ups

- Creating the Contentful content types (David does this manually).
- Any reuse of an `exampleCard` across multiple `examplesAside` boxes is allowed
  by the model but not a required feature.
