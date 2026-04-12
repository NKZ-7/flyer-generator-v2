'use client';

import { useState, useRef } from 'react';
import type { UserAsset, AssetRole } from '@/lib/types';

const MAX_ASSETS = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DIM = 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const ROLE_OPTIONS: { value: AssetRole; label: string }[] = [
  { value: 'main_person',       label: 'Main person' },
  { value: 'additional_person', label: 'Additional person' },
  { value: 'product_item',      label: 'Product / Food / Item' },
  { value: 'logo',              label: 'Logo / Brand mark' },
  { value: 'background_scene',  label: 'Background / Scene' },
  { value: 'other',             label: 'Other' },
];

const ROLE_PLACEHOLDERS: Record<AssetRole, string> = {
  main_person:       'e.g. Place me on the right side, half body visible',
  additional_person: 'e.g. Smaller, positioned on the left',
  product_item:      'e.g. Show the product large and centered',
  logo:              'e.g. Top-left corner, keep it small',
  background_scene:  'e.g. Use as a faded background element',
  other:             'e.g. Describe how you want this used',
};

async function resizeAndEncode(
  file: File
): Promise<Pick<UserAsset, 'previewUrl' | 'imageBase64' | 'mimeType'>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          previewUrl: dataUrl,
          imageBase64: dataUrl.replace(/^data:image\/jpeg;base64,/, ''),
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface AssetUploaderProps {
  assets: UserAsset[];
  onAssetsChange: (assets: UserAsset[]) => void;
  disabled?: boolean;
}

export function AssetUploader({ assets, onAssetsChange, disabled }: AssetUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: FileList | File[]) {
    setValidationMsg(null);
    const fileArr = Array.from(files);
    const remaining = MAX_ASSETS - assets.length;

    if (remaining === 0) {
      setValidationMsg('Maximum 5 images per flyer. Remove one to add another.');
      return;
    }

    setProcessing(true);
    try {
      const toProcess = fileArr.slice(0, remaining);
      const newAssets: UserAsset[] = [];

      for (const file of toProcess) {
        if (!ACCEPTED_TYPES.has(file.type)) {
          setValidationMsg('Please upload a JPG, PNG, or WEBP image.');
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setValidationMsg('This file is too large. Please use an image under 10MB.');
          continue;
        }
        const encoded = await resizeAndEncode(file);
        newAssets.push({
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          originalFilename: file.name,
          role: 'main_person',
          placementInstructions: '',
          ...encoded,
        });
      }

      if (fileArr.length > remaining) {
        setValidationMsg('Maximum 5 images per flyer. Remove one to add another.');
      }
      onAssetsChange([...assets, ...newAssets]);
    } finally {
      setProcessing(false);
    }
  }

  function updateRole(id: string, role: AssetRole) {
    onAssetsChange(assets.map((a) => (a.id === id ? { ...a, role } : a)));
  }

  function updatePlacement(id: string, placementInstructions: string) {
    onAssetsChange(assets.map((a) => (a.id === id ? { ...a, placementInstructions } : a)));
  }

  function removeAsset(id: string) {
    setValidationMsg(null);
    onAssetsChange(assets.filter((a) => a.id !== id));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    processFiles(e.dataTransfer.files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(e.target.files);
      // Reset input so the same file can be re-added after deletion
      e.target.value = '';
    }
  }

  const isActive = dragOver || processing;

  return (
    <div>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed transition-colors cursor-pointer select-none ${
          disabled
            ? 'border-zinc-800 opacity-40 cursor-not-allowed'
            : isActive
            ? 'border-amber-400/60 bg-amber-400/5'
            : 'border-amber-400/30 hover:border-amber-400/50 hover:bg-amber-400/[0.03]'
        }`}
      >
        <span className="text-2xl leading-none text-zinc-500">
          {processing ? '⏳' : '🖼'}
        </span>
        <p className="text-xs text-zinc-500 text-center">
          {processing
            ? 'Processing…'
            : assets.length >= MAX_ASSETS
            ? 'Maximum 5 images reached'
            : 'Drag photos here or tap to browse'}
        </p>
        <p className="text-[10px] text-zinc-600 text-center leading-snug">
          For best results, use clear well-lit photos with the subject easy to see
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Validation message */}
      {validationMsg && (
        <p className="text-xs text-amber-400 mt-2 leading-snug">{validationMsg}</p>
      )}

      {/* Thumbnail grid */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="relative bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
            >
              {/* Square thumbnail */}
              <img
                src={asset.previewUrl}
                alt={asset.originalFilename}
                className="w-full aspect-square object-cover"
              />

              {/* Delete button */}
              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                disabled={disabled}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-zinc-300 text-[10px] flex items-center justify-center hover:bg-red-900/80 transition-colors disabled:opacity-40"
                aria-label="Remove image"
              >
                ✕
              </button>

              {/* Card controls */}
              <div className="px-2 pb-2">
                {/* Role dropdown */}
                <select
                  value={asset.role}
                  onChange={(e) => updateRole(asset.id, e.target.value as AssetRole)}
                  disabled={disabled}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] rounded px-1.5 py-1 mt-1 focus:outline-none focus:border-amber-400/50 disabled:opacity-40"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Placement instruction input */}
                <input
                  type="text"
                  value={asset.placementInstructions}
                  onChange={(e) => updatePlacement(asset.id, e.target.value)}
                  disabled={disabled}
                  placeholder={ROLE_PLACEHOLDERS[asset.role]}
                  className="w-full bg-transparent border-b border-zinc-700 text-zinc-300 text-[11px] py-1 mt-1 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 transition-colors disabled:opacity-40"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
