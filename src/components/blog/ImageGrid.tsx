'use client';

import { useEffect, useState } from 'react';
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
  onClick,
}: {
  item: ImageGridItemEntry;
  sizes: string;
  onClick: () => void;
}) {
  const file = item.fields.image.fields.file;
  const dims = file.details.image;
  const url = getImageUrl(file.url);

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={`View larger: ${altFor(item) || 'image'}`}
        className="block w-full p-0 m-0 border-0 bg-transparent cursor-zoom-in"
      >
        <Image
          src={url}
          alt={altFor(item)}
          width={dims?.width || 800}
          height={dims?.height || 600}
          sizes={sizes}
          className="rounded-lg w-full h-auto"
        />
      </button>
      {item.fields.caption && (
        <figcaption className="text-sm text-gray-500 text-center mt-2">
          {item.fields.caption}
        </figcaption>
      )}
    </figure>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: ImageGridItemEntry;
  onClose: () => void;
}) {
  const file = item.fields.image.fields.file;
  const dims = file.details.image;
  const url = getImageUrl(file.url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
      >
        ×
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-[95vw] max-h-[90vh] flex flex-col items-center"
      >
        <Image
          src={url}
          alt={altFor(item)}
          width={dims?.width || 1600}
          height={dims?.height || 1200}
          sizes="95vw"
          className="rounded-lg max-h-[85vh] w-auto h-auto object-contain"
        />
        {item.fields.caption && (
          <p className="text-sm text-gray-300 text-center mt-2">{item.fields.caption}</p>
        )}
      </div>
    </div>
  );
}

export default function ImageGrid({ columns, items }: ImageGridProps) {
  const [activeItem, setActiveItem] = useState<ImageGridItemEntry | null>(null);

  if (items.length === 0) return null;

  const lightbox = activeItem ? (
    <Lightbox item={activeItem} onClose={() => setActiveItem(null)} />
  ) : null;

  if (items.length === 1) {
    return (
      <>
        <div className="my-6 max-w-2xl mx-auto">
          <GridFigure
            item={items[0]}
            sizes="(max-width: 768px) 100vw, 768px"
            onClick={() => setActiveItem(items[0])}
          />
        </div>
        {lightbox}
      </>
    );
  }

  const effectiveColumns = Math.min(columns, items.length) as 2 | 3 | 4;
  const sizes = `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.floor(100 / effectiveColumns)}vw`;

  return (
    <>
      <div className={`my-6 grid gap-4 md:gap-6 ${COLUMN_CLASS[effectiveColumns]}`}>
        {items.map((item) => (
          <GridFigure
            key={item.sys.id}
            item={item}
            sizes={sizes}
            onClick={() => setActiveItem(item)}
          />
        ))}
      </div>
      {lightbox}
    </>
  );
}
