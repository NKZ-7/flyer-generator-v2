'use client';

import { useState, useId } from 'react';

interface FloatingFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string; // hint text shown BELOW the field when focused
  disabled?: boolean;
  type?: string;
  hasError?: boolean;
  errorMsg?: string;
}

export function FloatingField({
  label,
  required,
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
  hasError,
  errorMsg,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const floated = focused || value.length > 0;
  const filled = value.length > 0;

  return (
    <div className="space-y-0.5">
      <div
        className={`relative h-14 rounded border transition-colors bg-zinc-900 ${
          hasError
            ? 'border-red-500'
            : focused
            ? 'border-amber-400/60 ring-1 ring-amber-400/20'
            : filled
            ? 'border-zinc-600'
            : 'border-zinc-700'
        }`}
      >
        {/* Label floats up when focused or filled */}
        <label
          htmlFor={id}
          className={`absolute left-3 pointer-events-none transition-all duration-150 ${
            floated
              ? 'top-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ' +
                (hasError ? 'text-red-400' : 'text-amber-400/80')
              : 'top-1/2 -translate-y-1/2 text-sm text-zinc-500'
          }`}
        >
          {label}
          {required && <span className="text-amber-400 ml-0.5">*</span>}
        </label>

        {/* Input occupies lower portion after label floats */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className="absolute inset-0 w-full bg-transparent pt-5 pb-1 px-3 text-sm text-zinc-200 focus:outline-none disabled:opacity-40"
        />

        {/* Emerald checkmark when filled and not focused */}
        {filled && !focused && !hasError && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs">
            ✓
          </span>
        )}
      </div>

      {/* Contextual hint — only shows when focused */}
      {focused && placeholder && !hasError && (
        <p className="text-[10px] text-zinc-500 px-1">{placeholder}</p>
      )}
      {hasError && errorMsg && (
        <p className="text-[10px] text-red-400 px-1">{errorMsg}</p>
      )}
    </div>
  );
}
