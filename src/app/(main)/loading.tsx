import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 flex justify-center">
      <Loader2 size={32} className="animate-spin text-gray-400" />
    </div>
  );
}
