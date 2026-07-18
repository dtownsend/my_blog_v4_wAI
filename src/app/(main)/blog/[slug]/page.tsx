import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getPostBySlug, getAllPostSlugs } from '@/lib/contentful';
import RichTextRenderer from '@/components/shared/RichTextRenderer';
import ShareButtons from '@/components/blog/ShareButtons';
import NewsletterForm from '@/components/shared/NewsletterForm';
import TableOfContents from '@/components/blog/TableOfContents';
import { extractHeadings } from '@/lib/extract-headings';
import { formatDate } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/constants';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const post = await getPostBySlug(slug);
    if (!post) return { title: 'Post Not Found' };

    const imageUrl = post.fields.featuredImage?.fields?.file?.url
      ? `https:${post.fields.featuredImage.fields.file.url}`
      : undefined;

    // Relative path — Next resolves it against metadataBase (SITE_CONFIG.url),
    // i.e. the canonical www host.
    const canonicalPath = `/blog/${slug}`;

    return {
      title: post.fields.title,
      description: post.fields.excerpt,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: post.fields.title,
        description: post.fields.excerpt,
        url: canonicalPath,
        type: 'article',
        publishedTime: post.fields.publishDate,
        authors: [SITE_CONFIG.author],
        images: imageUrl ? [{ url: imageUrl }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.fields.title,
        description: post.fields.excerpt,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Post Not Found' };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  let post;
  try {
    post = await getPostBySlug(slug);
  } catch (error) {
    console.error('Failed to fetch post:', error);
    notFound();
  }

  if (!post) {
    notFound();
  }

  const { title, body, featuredImage, tags, publishDate, showTableOfContents } = post.fields;
  const headings = showTableOfContents ? extractHeadings(body) : [];

  const imageUrl = featuredImage?.fields?.file?.url
    ? featuredImage.fields.file.url.startsWith('//')
      ? `https:${featuredImage.fields.file.url}`
      : featuredImage.fields.file.url
    : null;

  
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <header className="mb-8">
        <time className="text-sm text-gray-500" dateTime={publishDate}>
          {formatDate(publishDate)}
        </time>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
          {title}
        </h1>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <ShareButtons title={title} slug={slug} />
      </header>

      {showTableOfContents && headings.length > 0 && (
        <TableOfContents headings={headings} />
      )}

      {/* Featured Image */}
      {imageUrl && (
        <div className="relative aspect-[16/9] mb-8 overflow-hidden rounded-xl">
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <RichTextRenderer content={body} linkButtons />
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="bg-gray-50 rounded-xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Enjoyed this post?
          </h3>
          <p className="text-gray-600 mb-4">
            Subscribe to get notified when I publish new content.
          </p>
          <NewsletterForm />
        </div>
      </footer>
    </article>
  );
}
