import { useState } from 'react';
import { noop as _noop } from '@/lib/utils';

export default function HelloReact() {
  const [count, setCount] = useState(0);

  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-4 text-sm">
      <p className="font-medium text-blue-300">React island (hydrated)</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCount(c => c - 1)}
          className="rounded-md border border-gray-700 px-3 py-1 text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          aria-label="decrement"
        >
          −
        </button>
        <span className="w-8 text-center font-mono text-white">{count}</span>
        <button
          onClick={() => setCount(c => c + 1)}
          className="rounded-md border border-gray-700 px-3 py-1 text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          aria-label="increment"
        >
          +
        </button>
      </div>
    </div>
  );
}
