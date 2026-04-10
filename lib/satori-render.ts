/**
 * RENDER ENGINE — converts a DesignSpec into a base64 PNG.
 *
 * When `dallePrompt` is provided (hybrid mode):
 *   1. Calls OpenAI gpt-image-1 to generate the visual background image
 *   2. Renders Claude's text/shape nodes via Satori (transparent root)
 *   3. Sharp composites the text SVG over the OpenAI background
 *
 * When `dallePrompt` is absent (fallback mode):
 *   Renders the full flyer using Satori + Sharp with the design_spec background.
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

export async function renderFlyerToBase64(
  spec: DesignSpec,
  scaleFactor = 1,
  dallePrompt?: string,
): Promise<string> {
  const width = Math.round(spec.width * scaleFactor);
  const height = Math.round(spec.height * scaleFactor);
  // Sort so shape nodes always render before text nodes — shapes are background
  // elements and must not cover text regardless of Claude's output order.
  const sortedNodes = [...(spec.nodes ?? [])].sort((a, b) => {
    if (a.type === 'shape' && b.type !== 'shape') return -1;
    if (a.type !== 'shape' && b.type === 'shape') return 1;
    return 0;
  });
  const children = sortedNodes.map((node) => renderNode(node, scaleFactor));

  if (dallePrompt) {
    // ── Hybrid mode: OpenAI background + Satori text overlay ──────────────────
    const aiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1536', // portrait — no response_format param, gpt-image-1 always returns b64_json
        quality: 'low',
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`OpenAI error ${aiRes.status}: ${await aiRes.text()}`);
    }
    const aiJson = await aiRes.json();
    const b64 = aiJson.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image data');

    const imgBuffer = Buffer.from(b64, 'base64');

    // Satori: transparent root — Claude's text/shape nodes only, no background color
    const textRoot = {
      type: 'div',
      props: {
        style: {
          position: 'relative' as const,
          display: 'flex' as const,
          width,
          height,
        },
        children,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(textRoot as any, { width, height, fonts: getFonts() });

    // Sharp: resize OpenAI image to canvas dimensions, composite Satori text on top
    const pngBuffer = await sharp(imgBuffer)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  }

  // ── Fallback mode: solid/gradient Satori render ────────────────────────────
  let background: string;
  if (spec.background.type === 'gradient' && spec.background.gradient?.length === 2) {
    background = `linear-gradient(135deg, ${spec.background.gradient[0]}, ${spec.background.gradient[1]})`;
  } else {
    background = spec.background.color ?? '#1a1a2e';
  }

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

  // Outer div: absolute positioning + vertical centering via flexDirection column.
  // overflow: visible prevents text from being clipped if Claude undersizes the node height.
  // Inner span: carries all typography styles + word-break for proper wrapping in Satori.
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
        flexDirection: 'column' as const,
        justifyContent: 'center' as const,
        overflow: 'visible' as const,
      },
      children: {
        type: 'span',
        props: {
          style: {
            fontFamily: s.fontFamily ?? 'Inter',
            fontSize,
            fontWeight,
            color: s.color ?? '#ffffff',
            textAlign: (s.textAlign ?? 'left') as 'left' | 'center' | 'right',
            wordBreak: 'break-word' as const,
            opacity: s.opacity ?? 1,
            ...(letterSpacing ? { letterSpacing } : {}),
          },
          children: node.content ?? '',
        },
      },
    },
  };
}
