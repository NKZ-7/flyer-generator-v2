'use client';

import { useState, useRef } from 'react';
import type { UserAsset, AssetRole } from '@/lib/types';

const MAX_ASSETS = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DIM = 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const ROLE_OPTIONS: { value: AssetRole; label: string }[] = [
  { value: 'main_person',       label: 'Person — main subject' },
  { value: 'additional_person', label: 'Person — additional' },
  { value: 'product_item',      label: 'Product / food / item' },
  { value: 'logo',              label: 'Logo / brand mark' },
  { value: 'background_scene',  label: 'Background / scene' },
  { value: 'other',             label: 'Other' },
];

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
      setValidationMsg(`Maximum ${MAX_ASSETS} photos. Remove one to add another.`);
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
          setValidationMsg('File too large — please use an image under 10 MB.');
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
        setValidationMsg(`Maximum ${MAX_ASSETS} photos reached.`);
      }
      onAssetsChange([...assets, ...newAssets]);
    } finally {
      setProcessing(false);
    }
  }

  function updateRole(id: string, role: AssetRole) {
    onAssetsChange(assets.map((a) => (a.id === id ? { ...a, role } : a)));
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
      e.target.value = '';
    }
  }

  const isActive = dragOver || processing;
  const atMax = assets.length >= MAX_ASSETS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      {!atMax && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '20px 16px',
            borderRadius: 10,
            border: isActive
              ? '1px dashed rgba(227,169,60,0.60)'
              : '1px dashed rgba(227,169,60,0.28)',
            background: isActive ? 'rgba(227,169,60,0.04)' : '#241C13',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.15s',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1, opacity: 0.5 }}>
            {processing ? '⏳' : '📷'}
          </span>
          <p style={{ margin: 0, fontSize: 12, color: '#8A7560', textAlign: 'center' }}>
            {processing ? 'Processing…' : 'Drag photos here or tap to browse'}
          </p>
          <p style={{ margin: 0, fontSize: 10, color: '#5A4C40', textAlign: 'center', lineHeight: 1.4 }}>
            JPG, PNG, WEBP · up to 10 MB · max {MAX_ASSETS}
          </p>
        </div>
      )}

      {atMax && (
        <p style={{ fontSize: 11, color: '#6B5742', textAlign: 'center', margin: 0 }}>
          {MAX_ASSETS} photos added — remove one to replace it
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Validation message */}
      {validationMsg && (
        <p style={{ fontSize: 11, color: '#E3A93C', margin: 0, lineHeight: 1.4 }}>{validationMsg}</p>
      )}

      {/* Thumbnail grid */}
      {assets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              style={{
                background: '#1C160F',
                border: '1px solid #33281B',
                borderRadius: 10,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Square thumbnail */}
              <img
                src={asset.previewUrl}
                alt={asset.originalFilename}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeAsset(asset.id)}
                disabled={disabled}
                aria-label="Remove photo"
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'rgba(22,17,12,0.80)',
                  color: '#E3A93C',
                  border: '1px solid rgba(227,169,60,0.30)',
                  fontSize: 9,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  padding: 0,
                  transition: 'all 0.15s',
                }}
              >
                ✕
              </button>

              {/* Role selector */}
              <div style={{ padding: '6px 6px 7px' }}>
                <select
                  value={asset.role}
                  onChange={(e) => updateRole(asset.id, e.target.value as AssetRole)}
                  disabled={disabled}
                  style={{
                    width: '100%',
                    background: '#241C13',
                    border: '1px solid #33281B',
                    borderRadius: 6,
                    color: '#A8957F',
                    fontSize: 9,
                    padding: '3px 4px',
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
