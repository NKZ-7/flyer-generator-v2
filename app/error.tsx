'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-dvh bg-warm-900 flex items-center justify-center p-5">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-sm text-[#9A8A7A]">Something went wrong.</p>
        <button
          onClick={reset}
          className="px-4 py-2 text-xs font-semibold bg-amber-400 text-zinc-950 rounded hover:bg-amber-300"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
