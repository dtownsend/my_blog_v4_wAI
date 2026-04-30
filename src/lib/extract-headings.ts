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
