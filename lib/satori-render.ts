/**
 * RENDER ENGINE — converts a DesignSpec into a base64 PNG using Satori + Sharp.
 *
 * The v2 DesignSpec uses a flat, absolutely-positioned node list:
 *   { width, height, background, nodes: [{ id, type, x, y, width, height, content, style }] }
 *
 * Pass scaleFactor > 1 for print-resolution rendering (used by render-hires route).
 */

import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { DesignSpec, DesignNode } from './types';

// Cache font buffers in module scope — only read once per process
let _fonts: Awaited<Parameters<typeof satori>[1]>['fonts'] | null = null;

function getFonts() {
  if (_fonts) return _fonts;
  const nm = join(process.cwd(), 'node_modules', '@fontsource');
  _fonts = [
    {
      name: 'Inter',
      data: readFileSync(join(nm, 'inter', 'files', 'inter-latin-400-normal.woff')),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Inter',
      data: readFileSync(join(nm, 'inter', 'files', 'inter-latin-700-normal.woff')),
      weight: 700 as const,
      style: 'normal' as const,
    },
    {
      name: 'Oswald',
      data: readFileSync(join(nm, 'oswald', 'files', 'oswald-latin-700-normal.woff')),
      weight: 700 as const,
      style: 'normal' as const,
    },
    {
      name: 'Playfair Display',
      data: readFileSync(
        join(nm, 'playfair-display', 'files', 'playfair-display-latin-400-normal.woff'),
      ),
      weight: 400 as const,
      style: 'normal' as const,
    },
    {
      name: 'Playfair Display',
      data: readFileSync(
        join(nm, 'playfair-display', 'files', 'playfair-display-latin-700-normal.woff'),
      ),
      weight: 700 as const,
      style: 'normal' as const,
    },
  ];
  return _fonts;
}

export async function renderFlyerToBase64(spec: DesignSpec, scaleFactor = 1): Promise<string> {
  const width = Math.round(spec.width * scaleFactor);
  const height = Math.round(spec.height * scaleFactor);

  // Build background value
  let background: string;
  if (spec.background.type === 'gradient' && spec.background.gradient?.length === 2) {
    background = `linear-gradient(135deg, ${spec.background.gradient[0]}, ${spec.background.gradient[1]})`;
  } else {
    background = spec.background.color ?? '#1a1a2e';
  }

  const children = (spec.nodes ?? []).map((node) => renderNode(node, scaleFactor));

  const root = {
    type: 'div',
    props: {
      style: {
        position: 'relative' as const,
        display: 'flex' as const,
        width,
        height,
        background,
        overflow: 'hidden',
      },
      children,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(root as any, { width, height, fonts: getFonts() });
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}

function renderNode(node: DesignNode, scale = 1) {
  const s = node.style ?? {};
  const x = Math.round(node.x * scale);
  const y = Math.round(node.y * scale);
  const w = Math.round(node.width * scale);
  const h = Math.round(node.height * scale);

  if (node.type === 'shape') {
    return {
      type: 'div',
      props: {
        style: {
          position: 'absolute' as const,
          left: x,
          top: y,
          width: w,
          height: h,
          backgroundColor: s.backgroundColor ?? s.color ?? 'rgba(255,255,255,0.15)',
          borderRadius: s.borderRadius ? Math.round(s.borderRadius * scale) : 0,
          opacity: s.opacity ?? 1,
        },
        children: '',
      },
    };
  }

  // text node (default)
  const fontSize = s.fontSize ? Math.round(s.fontSize * scale) : Math.round(16 * scale);
  const fontWeight = s.fontWeight === 'bold' ? 700 : 400;
  const letterSpacing =
    s.letterSpacing != null ? `${Math.round(s.letterSpacing * scale)}px` : undefined;

  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute' as const,
        left: x,
        top: y,
        width: w,
        height: h,
        display: 'flex' as const,
        alignItems: 'center' as const,
        fontFamily: s.fontFamily ?? 'Inter',
        fontSize,
        fontWeight,
        color: s.color ?? '#ffffff',
        textAlign: (s.textAlign ?? 'left') as 'left' | 'center' | 'right',
        flexWrap: 'wrap' as const,
        overflow: 'hidden' as const,
        opacity: s.opacity ?? 1,
        ...(letterSpacing ? { letterSpacing } : {}),
      },
      children: node.content ?? '',
    },
  };
}
