'use client';

import GraphTreeStep from './GraphTreeStep';
import { GraphTreeStepEntry } from '@/lib/contentful';

interface GraphTreeProps {
  title?: string;
  steps: GraphTreeStepEntry[];
}

export default function GraphTree({ title, steps }: GraphTreeProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <details className="my-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 group/tree">
      <summary className="cursor-pointer font-semibold text-gray-900 select-none list-none flex items-center gap-2">
        <span className="inline-block transition-transform group-open/tree:rotate-90" aria-hidden>
          ▶
        </span>
        {title || 'Graph Tree'}
      </summary>
      <div className="mt-3 flex flex-col">
        {steps.map((step, index) => (
          <GraphTreeStep
            key={step.sys.id}
            label={step.fields.label}
            body={step.fields.body}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </details>
  );
}
