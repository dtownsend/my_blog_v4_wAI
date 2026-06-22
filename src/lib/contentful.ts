import { createClient, ContentfulClientApi } from 'contentful';
import { Document } from '@contentful/rich-text-types';

const space = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
const previewToken = process.env.CONTENTFUL_PREVIEW_TOKEN;

let client: ContentfulClientApi<undefined> | null = null;
let previewClient: ContentfulClientApi<undefined> | null = null;

if (space && accessToken) {
  client = createClient({
    space,
    accessToken,
  });

  if (previewToken) {
    previewClient = createClient({
      space,
      accessToken: previewToken,
      host: 'preview.contentful.com',
    });
  }
}

export const getClient = (preview = false) => {
  if (!client) {
    throw new Error('Contentful client not configured. Check your environment variables.');
  }
  if (preview && previewClient) {
    return previewClient;
  }
  return client;
};

export const isContentfulConfigured = () => !!client;

// Content Types
export interface ContentfulAsset {
  fields: {
    title: string;
    file: {
      url: string;
      details: {
        size: number;
        image?: {
          width: number;
          height: number;
        };
      };
      fileName: string;
      contentType: string;
    };
  };
}

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

export interface ArtworkEntry {
  sys: { id: string };
  fields: {
    title: string;
    image: ContentfulAsset;
    description?: string;
    medium?: string;
    createdDate: string;
    tags?: string[];
  };
}

export interface ResumeItemEntry {
  sys: { id: string };
  fields: {
    companyName: string;
    companyLogo?: ContentfulAsset;
    role: string;
    location: string;
    startDate: string;
    endDate?: string;
    descriptionBullets: string[];
    type: 'work' | 'education';
  };
}

export interface SkillEntry {
  sys: { id: string };
  fields: {
    name: string;
    category: 'Languages' | 'Frameworks' | 'Tools' | 'Software';
  };
}

export interface ProfileEntry {
  sys: { id: string };
  fields: {
    name: string;
    title?: string;
    bio?: string;
    location?: string;
    profilePicture?: ContentfulAsset;
    resumePdf?: ContentfulAsset;
  };
}

export interface AboutEntry {
  sys: { id: string };
  fields: {
    headline: string;
    introduction?: string;
    story?: Document;
    profilePicture?: ContentfulAsset;
  };
}

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

// Fetch functions
export async function getPosts(
  preview = false,
  tag?: string,
  limit = 10,
  skip = 0
): Promise<{ posts: PostEntry[]; total: number }> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'post',
    order: '-fields.publishDate',
    limit,
    skip,
    'fields.status': 'published',
  };

  if (tag) {
    query['fields.tags[in]'] = tag;
  }

  const response = await client.getEntries(query);

  return {
    posts: response.items as unknown as PostEntry[],
    total: response.total,
  };
}

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

export async function getAllPostSlugs(): Promise<string[]> {
  const client = getClient();

  const query: Record<string, unknown> = {
    content_type: 'post',
    select: ['fields.slug'],
    'fields.status': 'published',
  };

  const response = await client.getEntries(query);

  return response.items.map((item) => (item.fields as { slug: string }).slug);
}

export async function getArtworks(preview = false): Promise<ArtworkEntry[]> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'artwork',
    order: '-fields.createdDate',
  };

  const response = await client.getEntries(query);

  return response.items as unknown as ArtworkEntry[];
}

export async function getResumeItems(
  preview = false
): Promise<ResumeItemEntry[]> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'resumeItem',
    order: '-fields.startDate',
  };

  const response = await client.getEntries(query);

  return response.items as unknown as ResumeItemEntry[];
}

export async function getSkills(preview = false): Promise<SkillEntry[]> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'skill',
  };

  const response = await client.getEntries(query);

  return response.items as unknown as SkillEntry[];
}

export async function getProfile(preview = false): Promise<ProfileEntry | null> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'profile',
    limit: 1,
  };

  const response = await client.getEntries(query);

  return (response.items[0] as unknown as ProfileEntry) || null;
}

export async function getAbout(preview = false): Promise<AboutEntry | null> {
  const client = getClient(preview);

  const query: Record<string, unknown> = {
    content_type: 'about',
    limit: 1,
  };

  const response = await client.getEntries(query);

  return (response.items[0] as unknown as AboutEntry) || null;
}
