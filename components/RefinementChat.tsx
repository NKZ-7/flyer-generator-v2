'use client';

interface ActionsPanelProps {
  onRegenerate: () => void;
  onEditInputs: () => void;
}

export function ActionsPanel({ onRegenerate, onEditInputs }: ActionsPanelProps) {
  return (
    <div className="h-full flex flex-col" style={{ background: '#1C160F' }}>
      {/* Header */}
      <div className="px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid #2A2014' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8A7560' }}>
          What next?
        </span>
      </div>

      {/* Actions */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-3">
        <button
          onClick={onRegenerate}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
          style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 10 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E3A93C'; e.currentTarget.style.background = 'rgba(227,169,60,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#33281B'; e.currentTarget.style.background = '#241C13'; }}
        >
          <span className="text-base leading-none shrink-0" style={{ color: '#E3A93C' }}>↺</span>
          <span>
            <span className="block text-sm font-medium" style={{ color: '#D8C9B4' }}>Regenerate</span>
            <span className="block mt-0.5" style={{ fontSize: 11, color: '#73604D' }}>
              Create a new variant with the same inputs
            </span>
          </span>
        </button>

        <button
          onClick={onEditInputs}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
          style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 10 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#5A4C40'; e.currentTarget.style.background = '#2E2417'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#33281B'; e.currentTarget.style.background = '#241C13'; }}
        >
          <span className="text-base leading-none shrink-0" style={{ color: '#C4B49E' }}>✎</span>
          <span>
            <span className="block text-sm font-medium" style={{ color: '#D8C9B4' }}>Edit inputs</span>
            <span className="block mt-0.5" style={{ fontSize: 11, color: '#73604D' }}>
              Go back and adjust your details
            </span>
          </span>
        </button>

        <p className="text-center pt-1 leading-relaxed" style={{ fontSize: 10, color: '#6B5742' }}>
          Want precise tweaks? Smart edit is coming soon —<br />
          for now, regenerate or edit inputs.
        </p>
      </div>
    </div>
  );
}
