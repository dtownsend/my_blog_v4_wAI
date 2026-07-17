export const SITE_CONFIG = {
  name: 'Inside DTs Brain',
  title: 'Inside DTs Brain - Thoughts, Stories, and Art',
  description: 'A personal blog sharing thoughts, stories, ideas, projects, and artwork.',
  // Canonical host is www (the apex 307-redirects to it). Strip any trailing
  // slash so `${url}/blog/...` can't produce a double slash.
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.insidedtsbrain.com').replace(/\/+$/, ''),
  author: 'David',
  social: {
    twitter: '', // TODO: add when available
    linkedin: 'https://www.linkedin.com/in/dt90/',
    bluesky: '', // TODO: add when available
    email: 'dtownsend90@gmail.com',
  },
};

export const NAV_ITEMS = [
  { label: 'Blog', href: '/blog' },
  { label: 'Art', href: '/art' },
  { label: 'Resume', href: '/resume' },
  { label: 'About', href: '/about' },
  { label: 'Subscribe', href: '/subscribe' },
];

export const BLOG_TAGS = ['thoughts', 'stories', 'ideas', 'projects', 'tech'] as const;

export const POSTS_PER_PAGE = 10;

export const SKILL_COLORS: Record<string, string> = {
  Languages: 'bg-blue-100 text-blue-800',
  Frameworks: 'bg-green-100 text-green-800',
  Tools: 'bg-purple-100 text-purple-800',
  Software: 'bg-orange-100 text-orange-800',
};
