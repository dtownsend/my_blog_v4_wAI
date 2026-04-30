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
