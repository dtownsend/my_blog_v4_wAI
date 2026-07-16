![Playwright Tests](https://github.com/dtownsend/my_blog_v4_wAI/actions/workflows/playwright.yml/badge.svg)


# David's Personal Blog

A personal blog platform built with Next.js 14, TypeScript, Tailwind CSS, and Contentful CMS.

## Features

- **Blog** - Posts with tag filtering, pagination, and social sharing
- **Art Gallery** - Responsive grid with lightbox functionality
- **Resume** - Two-column layout with skills and experience
- **Newsletter** - Beehiiv integration for subscriber management
- **SEO** - OpenGraph, Twitter cards, and RSS feed
- **Analytics** - Google Analytics 4 integration
- **On-demand ISR** - Contentful webhook for instant updates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **CMS**: Contentful
- **Code Highlighting**: Prism.js
- **Hosting**: Vercel
- **Newsletter**: Beehiiv

## Getting Started

### 1. Clone and Install

```bash
cd /Users/davidtownsend/projects/my_blog_v4
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `CONTENTFUL_SPACE_ID` - Your Contentful space ID
- `CONTENTFUL_ACCESS_TOKEN` - Content Delivery API token
- `CONTENTFUL_PREVIEW_TOKEN` - Content Preview API token
- `NEXT_PUBLIC_SITE_URL` - Your production URL
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics ID

### 3. Set Up Contentful

Create the following content types in Contentful:

**Post**
- `title` (Short text)
- `slug` (Short text, unique)
- `body` (Rich text)
- `excerpt` (Short text)
- `featuredImage` (Media)
- `tags` (Short text, list)
- `publishDate` (Date & time)
- `status` (Short text: draft/published)

**Artwork**
- `title` (Short text)
- `image` (Media, required)
- `description` (Long text)
- `medium` (Short text)
- `createdDate` (Date & time)
- `tags` (Short text, list)

**ResumeItem**
- `companyName` (Short text)
- `companyLogo` (Media)
- `role` (Short text)
- `location` (Short text)
- `startDate` (Date & time)
- `endDate` (Date & time)
- `descriptionBullets` (Short text, list)
- `type` (Short text: work/education)

**Skill**
- `name` (Short text)
- `category` (Short text: Languages/Frameworks/Tools/Software)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Set Up Contentful Webhook (Production)

Add a webhook in Contentful pointing to:
```
https://yourdomain.com/api/revalidate
```

Add header: `x-revalidate-secret: YOUR_SECRET`

Set `CONTENTFUL_REVALIDATE_SECRET` in your environment.

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── blog/          # Blog pages
│   ├── art/           # Art gallery
│   ├── resume/        # Resume page
│   ├── about/         # About page
│   ├── subscribe/     # Newsletter signup
│   └── feed.xml/      # RSS feed
├── components/
│   ├── layout/        # Header, Footer
│   ├── blog/          # Blog components
│   ├── art/           # Gallery components
│   ├── resume/        # Resume components
│   ├── shared/        # Shared components
│   └── analytics/     # GA component
└── lib/
    ├── contentful.ts  # CMS client
    ├── constants.ts   # Site config
    ├── types.ts       # TypeScript types
    └── utils.ts       # Utilities
```

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Or connect your GitHub repo to Vercel for automatic deployments.

## License

All rights reserved.
