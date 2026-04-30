'use client';

import { useState } from 'react';

interface GraphTreeStepProps {
  label: string;
  body?: string;
  isLast: boolean;
}

function ArrowConnector() {
  return (
    <div className="flex justify-center text-gray-400 text-base sm:text-lg leading-none my-1" aria-hidden>
      ↓
    </div>
  );
}

export default function GraphTreeStep({ label, body, isLast }: GraphTreeStepProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available — silently no-op
    }
  };

  if (!body) {
    return (
      <>
        <div className="rounded border border-gray-200 bg-white px-3 py-2 text-gray-800">
          {label}
        </div>
        {!isLast && <ArrowConnector />}
      </>
    );
  }

  return (
    <>
      <details className="rounded border border-gray-200 bg-white group">
        <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-3 py-2 text-gray-800">
          <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
            ▶
          </span>
          {label}
        </summary>
        <div className="relative px-3 pb-3">
          <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-gray-50 rounded p-3 sm:pr-20 overflow-x-auto text-gray-800">
            {body}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 sm:mt-0 sm:absolute sm:top-3 sm:right-3 w-full sm:w-auto text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </details>
      {!isLast && <ArrowConnector />}
    </>
  );
}
