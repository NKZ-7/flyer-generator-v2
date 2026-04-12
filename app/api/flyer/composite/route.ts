import { NextRequest } from 'next/server';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Font cache (loaded once at cold start) ─────────────────────────────────
const FONT_CACHE: Record<string, string> = {};

function loadFont(name: string, filename: string): string {
  if (!FONT_CACHE[name]) {
    const buf = readFileSync(join(process.cwd(), 'public', 'fonts', filename));
    FONT_CACHE[name] = buf.toString('base64');
  }
  return FONT_CACHE[name];
}

// ── Types ──────────────────────────────────────────────────────────────────

type LayerType =
  | 'background'
  | 'decorative_graphic'
  | 'color_block'
  | 'text'
  | 'text_badge'
  | 'user_asset';

interface LayerSpecs {
  // shared
  position?: { x: number | string; y: number | string };
  size?: { width: number | string; height: number | string };
  // background
  fill?: string;
  gradient?: {
    type: 'linear' | 'radial';
    stops: { offset: number; color: string }[];
    angle?: number;
  };
  // text
  content?: string;
  font_family?: string;
  font_size?: number;
  font_weight?: string;
  color?: string;
  text_anchor?: string;
  line_height?: number;
  letter_spacing?: number;
  opacity?: number;
  // text_badge
  background_color?: string;
  padding?: { x: number; y: number };
  border_radius?: number;
  // decorative_graphic / color_block
  shape?: string;
  fill_opacity?: number;
  stroke?: string;
  stroke_width?: number;
  rx?: number;
  // user_asset
  blend?: string;
  fit?: string;
}

interface Layer {
  z_index: number;
  type: LayerType;
  asset_id?: string;
  specs: LayerSpecs;
}

interface AssetBundle {
  originalBase64: string;
  removedBase64?: string;
  backgroundRemovalFailed?: boolean;
}

interface CompositeRequest {
  jobId: string;
  blueprint: {
    layers: Layer[];
    canvas: { width: number; height: number };
  };
  assets: Record<string, AssetBundle>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Resolve a dimension value (number or "50%" string) to absolute pixels. */
function resolve(val: number | string | undefined, total: number, fallback = 0): number {
  if (val === undefined) return fallback;
  if (typeof val === 'number') return val;
  const s = val.trim();
  if (s.endsWith('%')) return Math.round((parseFloat(s) / 100) * total);
  return parseInt(s, 10) || fallback;
}

function resolvePosition(
  specs: LayerSpecs,
  layerW: number,
  layerH: number,
  canvasW: number,
  canvasH: number
): { top: number; left: number } {
  const rawX = specs.position?.x ?? 0;
  const rawY = specs.position?.y ?? 0;
  let left = resolve(rawX, canvasW, 0);
  let top = resolve(rawY, canvasH, 0);

  // Negative values: offset from right/bottom edge
  if (left < 0) left = canvasW + left - layerW;
  if (top < 0) top = canvasH + top - layerH;

  return { top: Math.round(top), left: Math.round(left) };
}

// ── Background removal ─────────────────────────────────────────────────────

async function removeBackground(imageBase64: string): Promise<string | null> {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_file_b64: imageBase64, size: 'auto' }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { data?: { result_b64?: string } };
    return data.data?.result_b64 ?? null;
  } catch {
    return null;
  }
}

// ── SVG generation ─────────────────────────────────────────────────────────

function makeSvgWrapper(canvasW: number, canvasH: number, content: string): string {
  const oswaldB64 = loadFont('oswald-bold', 'Oswald-Bold.ttf');
  const playfairB64 = loadFont('playfair-regular', 'PlayfairDisplay-Regular.ttf');
  return `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face { font-family: 'Oswald'; src: url('data:font/truetype;base64,${oswaldB64}'); font-weight: bold; }
      @font-face { font-family: 'Playfair Display'; src: url('data:font/truetype;base64,${playfairB64}'); font-weight: normal; }
    </style>
  </defs>
  ${content}
</svg>`;
}

function layerToSvgContent(layer: Layer, canvasW: number, canvasH: number): string {
  const { specs } = layer;

  switch (layer.type) {
    case 'background': {
      if (specs.gradient) {
        const g = specs.gradient;
        const gradId = `grad_${layer.z_index}`;
        if (g.type === 'linear') {
          const angle = g.angle ?? 180;
          const rad = ((angle - 90) * Math.PI) / 180;
          const x2 = 50 + 50 * Math.cos(rad);
          const y2 = 50 + 50 * Math.sin(rad);
          const stops = g.stops
            .map((s) => `<stop offset="${s.offset * 100}%" stop-color="${escapeXml(s.color)}"/>`)
            .join('\n      ');
          return `<defs>
    <linearGradient id="${gradId}" x1="50%" y1="0%" x2="${x2}%" y2="${y2}%">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="${canvasW}" height="${canvasH}" fill="url(#${gradId})"/>`;
        } else {
          const stops = g.stops
            .map((s) => `<stop offset="${s.offset * 100}%" stop-color="${escapeXml(s.color)}"/>`)
            .join('\n      ');
          return `<defs>
    <radialGradient id="${gradId}">
      ${stops}
    </radialGradient>
  </defs>
  <rect width="${canvasW}" height="${canvasH}" fill="url(#${gradId})"/>`;
        }
      }
      return `<rect width="${canvasW}" height="${canvasH}" fill="${escapeXml(specs.fill ?? '#000000')}"/>`;
    }

    case 'color_block': {
      const x = resolve(specs.position?.x, canvasW, 0);
      const y = resolve(specs.position?.y, canvasH, 0);
      const w = resolve(specs.size?.width, canvasW, canvasW);
      const h = resolve(specs.size?.height, canvasH, 60);
      const attrs = [
        `x="${x}" y="${y}" width="${w}" height="${h}"`,
        `fill="${escapeXml(specs.fill ?? '#000000')}"`,
        specs.fill_opacity !== undefined ? `fill-opacity="${specs.fill_opacity}"` : '',
        specs.rx !== undefined ? `rx="${specs.rx}"` : '',
        specs.stroke ? `stroke="${escapeXml(specs.stroke)}" stroke-width="${specs.stroke_width ?? 1}"` : '',
      ].filter(Boolean).join(' ');
      return `<rect ${attrs}/>`;
    }

    case 'decorative_graphic': {
      const x = resolve(specs.position?.x, canvasW, 0);
      const y = resolve(specs.position?.y, canvasH, 0);
      const w = resolve(specs.size?.width, canvasW, 100);
      const h = resolve(specs.size?.height, canvasH, 100);
      const fill = escapeXml(specs.fill ?? 'none');
      const fillOpacity = specs.fill_opacity !== undefined ? `fill-opacity="${specs.fill_opacity}"` : '';
      const strokeAttr = specs.stroke
        ? `stroke="${escapeXml(specs.stroke)}" stroke-width="${specs.stroke_width ?? 1}"`
        : '';

      if (specs.shape === 'circle') {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${fillOpacity} ${strokeAttr}/>`;
      }
      // Default: rect
      const rx = specs.rx !== undefined ? `rx="${specs.rx}"` : '';
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${fillOpacity} ${rx} ${strokeAttr}/>`;
    }

    case 'text': {
      const x = resolve(specs.position?.x, canvasW, canvasW / 2);
      const y = resolve(specs.position?.y, canvasH, canvasH / 2);
      const fontSize = specs.font_size ?? 24;
      const fontFamily = escapeXml(specs.font_family ?? 'Oswald');
      const fontWeight = specs.font_weight ?? 'bold';
      const fill = escapeXml(specs.color ?? '#ffffff');
      const anchor = specs.text_anchor ?? 'middle';
      const opacity = specs.opacity !== undefined ? `opacity="${specs.opacity}"` : '';
      const letterSpacing = specs.letter_spacing !== undefined
        ? `letter-spacing="${specs.letter_spacing}"`
        : '';
      const content = escapeXml(specs.content ?? '');

      // Multi-line support: split on \n and render multiple <tspan>
      const lines = content.split('\\n');
      const lineH = specs.line_height ?? fontSize * 1.2;
      if (lines.length > 1) {
        const tspans = lines
          .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${line}</tspan>`)
          .join('');
        return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${anchor}" ${letterSpacing} ${opacity}>${tspans}</text>`;
      }
      return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${anchor}" ${letterSpacing} ${opacity}>${content}</text>`;
    }

    case 'text_badge': {
      const cx = resolve(specs.position?.x, canvasW, canvasW / 2);
      const cy = resolve(specs.position?.y, canvasH, canvasH / 2);
      const fontSize = specs.font_size ?? 16;
      const fontFamily = escapeXml(specs.font_family ?? 'Oswald');
      const fontWeight = specs.font_weight ?? 'bold';
      const textColor = escapeXml(specs.color ?? '#ffffff');
      const bgColor = escapeXml(specs.background_color ?? '#000000');
      const padX = specs.padding?.x ?? 16;
      const padY = specs.padding?.y ?? 8;
      const rx = specs.border_radius ?? 4;
      const text = escapeXml(specs.content ?? '');
      // Estimate text width (~0.6 × fontSize per char)
      const estW = Math.max(text.length * fontSize * 0.6 + padX * 2, 60);
      const estH = fontSize + padY * 2;
      const rectX = cx - estW / 2;
      const rectY = cy - estH / 2;
      const textY = cy + fontSize * 0.35;
      return `<rect x="${rectX}" y="${rectY}" width="${estW}" height="${estH}" fill="${bgColor}" rx="${rx}"/>
  <text x="${cx}" y="${textY}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}" text-anchor="middle">${text}</text>`;
    }

    default:
      return '';
  }
}

// ── Main compositing function ──────────────────────────────────────────────

async function compositeAll(
  blueprint: CompositeRequest['blueprint'],
  assetBundles: Record<string, AssetBundle>
): Promise<Buffer> {
  const { width: W, height: H } = blueprint.canvas;
  const layers = [...blueprint.layers].sort((a, b) => a.z_index - b.z_index);

  // Start with a fully transparent canvas
  let base = sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png();

  const compositeInputs: sharp.OverlayOptions[] = [];

  for (const layer of layers) {
    try {
      if (layer.type === 'user_asset') {
        const bundle = assetBundles[layer.asset_id ?? ''];
        if (!bundle) continue;

        const src =
          bundle.removedBase64 && !bundle.backgroundRemovalFailed
            ? bundle.removedBase64
            : bundle.originalBase64;

        const buf = Buffer.from(src, 'base64');
        const layerW = resolve(layer.specs.size?.width, W, Math.round(W * 0.5));
        const layerH = resolve(layer.specs.size?.height, H, Math.round(H * 0.5));

        const resized = await sharp(buf)
          .resize(layerW, layerH, { fit: 'inside', withoutEnlargement: false })
          .png()
          .toBuffer();

        const { top, left } = resolvePosition(layer.specs, layerW, layerH, W, H);
        compositeInputs.push({ input: resized, top, left, blend: 'over' });
      } else {
        const svgContent = layerToSvgContent(layer, W, H);
        if (!svgContent.trim()) continue;

        const svgStr = makeSvgWrapper(W, H, svgContent);
        const svgBuf = Buffer.from(svgStr, 'utf-8');
        const pngBuf = await sharp(svgBuf).png().toBuffer();
        compositeInputs.push({ input: pngBuf, top: 0, left: 0, blend: 'over' });
      }
    } catch (err) {
      // Log and skip bad layers rather than crashing the whole composite
      console.error(`[composite] Layer z_index=${layer.z_index} type=${layer.type} failed:`, err);
    }
  }

  const finalBuf = await base.composite(compositeInputs).png().toBuffer();
  return finalBuf;
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: CompositeRequest;
  try {
    body = (await request.json()) as CompositeRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { jobId, blueprint, assets } = body;

  if (!jobId || !blueprint?.layers || !blueprint?.canvas) {
    return Response.json({ error: 'jobId, blueprint.layers, and blueprint.canvas are required' }, { status: 400 });
  }

  // Background removal — run concurrently for all non-background_scene user_asset layers
  const enrichedAssets: Record<string, AssetBundle> = { ...assets };

  const userAssetLayers = blueprint.layers.filter(
    (l) => l.type === 'user_asset' && l.asset_id
  );

  await Promise.all(
    userAssetLayers.map(async (layer) => {
      const id = layer.asset_id!;
      const bundle = enrichedAssets[id];
      if (!bundle) return;

      // Skip background_scene assets — keep original, no removal needed
      const role = (bundle as AssetBundle & { role?: string }).role;
      if (role === 'background_scene') return;

      // Already has a removed version (pre-processed)
      if (bundle.removedBase64) return;

      const removed = await removeBackground(bundle.originalBase64);
      if (removed) {
        enrichedAssets[id] = { ...bundle, removedBase64: removed };
      } else {
        enrichedAssets[id] = { ...bundle, backgroundRemovalFailed: true };
      }
    })
  );

  let finalBuf: Buffer;
  try {
    finalBuf = await compositeAll(blueprint, enrichedAssets);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[composite] compositeAll failed:', err);
    return Response.json({ error: `Compositing failed: ${msg}` }, { status: 500 });
  }

  const imageBase64 = finalBuf.toString('base64');
  return Response.json({ jobId, imageBase64 });
}
