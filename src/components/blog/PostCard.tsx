import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { PostEntry } from '@/lib/contentful';

interface PostCardProps {
  post: PostEntry;
  imagePosition?: 'left' | 'right';
}

export default function PostCard({ post, imagePosition = 'left' }: PostCardProps) {
  const { title, slug, excerpt, featuredImage, tags, publishDate } = post.fields;

  const imageUrl = featuredImage?.fields?.file?.url
    ? featuredImage.fields.file.url.startsWith('//')
      ? `https:${featuredImage.fields.file.url}`
      : featuredImage.fields.file.url
    : null;

  return (
    <article className="group">
      <Link href={`/blog/${slug}`} className="block">
        <div className={`flex flex-col md:flex-row gap-6 ${imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
          {/* Image */}
          {imageUrl && (
            <div className="relative aspect-[16/9] md:aspect-[4/3] md:w-1/3 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <time className="text-sm text-gray-500" dateTime={publishDate}>
              {formatDate(publishDate)}
            </time>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors">
              {title}
            </h2>
            <p className="text-gray-600 line-clamp-3">{excerpt}</p>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
