'use client';

interface ActionsPanelProps {
  onRegenerate: () => void;
  onEditInputs: () => void;
}

export function ActionsPanel({ onRegenerate, onEditInputs }: ActionsPanelProps) {
  return (
    <div className="h-full flex flex-col bg-[#0d0d0f]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-800 shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          What next?
        </span>
      </div>

      {/* Actions */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-3">
        <button
          onClick={onRegenerate}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all text-left"
        >
          <span className="text-base leading-none shrink-0">↺</span>
          <span>
            <span className="block text-sm font-medium text-zinc-200">Regenerate</span>
            <span className="block text-[11px] text-zinc-500 mt-0.5">
              Create a new variant with the same inputs
            </span>
          </span>
        </button>

        <button
          onClick={onEditInputs}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all text-left"
        >
          <span className="text-base leading-none shrink-0">✎</span>
          <span>
            <span className="block text-sm font-medium text-zinc-200">Edit inputs</span>
            <span className="block text-[11px] text-zinc-500 mt-0.5">
              Go back and adjust your details
            </span>
          </span>
        </button>

        <p className="text-[10px] text-zinc-600 text-center pt-1 leading-relaxed">
          Want precise tweaks? Smart edit is coming soon —<br />
          for now, regenerate or edit inputs.
        </p>
      </div>
    </div>
  );
}
