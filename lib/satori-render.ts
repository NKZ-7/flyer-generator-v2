import satori from 'satori';
import sharp from 'sharp';
import type { DesignBrief, FlyerCopyV2 } from './types';
import { LAYOUTS } from './render/layouts';
import { TYPOGRAPHY_PAIRINGS, loadTypographyFonts } from './render/typography';
import { CANVAS_DIMENSIONS, DEFAULT_CANVAS_FORMAT, BASE_FONT_SIZE_PX, AUTO_FIT } from './render/render-config';
import { extractZoneColor, extractAccentColor, harmonizeColors } from './render/color-sampling';

const { width: CANVAS_W, height: CANVAS_H } = CANVAS_DIMENSIONS[DEFAULT_CANVAS_FORMAT];

// Slot keys in order of compositing — bottom to top visually
const SLOTS = ['headline', 'name', 'body', 'signoff'] as const;
type Slot = typeof SLOTS[number];

// Max lines heuristic per slot
const MAX_LINES: Record<Slot, number> = {
  headline: 2,
  name:     2,
  body:     6,
  signoff:  2,
};

function copyValue(copy: FlyerCopyV2, slot: Slot): string {
  if (slot === 'name') return copy.recipient_name;
  return copy[slot];
}

export async function renderFlyerToBase64(
  designBrief: DesignBrief,
  copy: FlyerCopyV2,
  gptCanvasBase64: string,
  scaleFactor = 1,
  debugZones = false,
): Promise<string> {
  const W = Math.round(CANVAS_W * scaleFactor);
  const H = Math.round(CANVAS_H * scaleFactor);

  // Decode canvas
  const rawBase64 = gptCanvasBase64.replace(/^data:image\/\w+;base64,/, '');
  const canvasBuffer = Buffer.from(rawBase64, 'base64');

  const layout = LAYOUTS[designBrief.layoutId];
  const typo   = TYPOGRAPHY_PAIRINGS[designBrief.typographyId];
  const fonts  = loadTypographyFonts(designBrief.typographyId);

  // Compute zones at the base canvas dimensions for color sampling and coordinate reference.
  // The scaleFactor is applied per-zone when building composites.
  const zones      = layout.computeZones(CANVAS_W, CANVAS_H);
  const sampleZone = layout.computeDecorationSampleZone(CANVAS_W, CANVAS_H);

  const zoneColor   = await extractZoneColor(canvasBuffer, zones.body);
  const accentColor = await extractAccentColor(canvasBuffer, sampleZone);
  const colors      = harmonizeColors(zoneColor, accentColor);

  const textColors: Record<Slot, string> = {
    headline: colors.headline,
    name:     colors.name,
    body:     colors.body,
    signoff:  colors.signoff,
  };

  const composites: { input: Buffer; top: number; left: number }[] = [];

  for (const slot of SLOTS) {
    const text = copyValue(copy, slot).trim();
    if (!text) continue;

    const zone   = zones[slot];
    const spec   = typo[slot];
    const maxLn  = MAX_LINES[slot];
    const align  = layout.text_alignment[slot];
    const color  = textColors[slot];

    // Auto-fit: char-count heuristic — reduce font size until text fits within maxLn lines
    let fontSize = Math.round(BASE_FONT_SIZE_PX * spec.sizeRatio * scaleFactor);
    const minFontSize = Math.round(fontSize * AUTO_FIT.min_size_ratio);
    for (let i = 0; i < AUTO_FIT.max_iterations; i++) {
      const charsPerLine = Math.floor((zone.width * scaleFactor) / (fontSize * 0.55));
      const estimatedLines = Math.ceil(text.length / Math.max(charsPerLine, 1));
      if (estimatedLines <= maxLn || fontSize <= minFontSize) break;
      fontSize -= AUTO_FIT.size_step_px;
    }

    const zoneW = Math.round(zone.width  * scaleFactor);
    const zoneH = Math.round(zone.height * scaleFactor);
    const zoneX = Math.round(zone.x      * scaleFactor);
    const zoneY = Math.round(zone.y      * scaleFactor);

    // Build full-canvas Satori element (same pattern as legacy satori-render)
    const root = {
      type: 'div',
      props: {
        style: {
          position: 'relative' as const,
          display: 'flex' as const,
          width: W,
          height: H,
        },
        children: {
          type: 'div',
          props: {
            style: {
              position: 'absolute' as const,
              left: zoneX,
              top:  zoneY,
              width: zoneW,
              height: zoneH,
              display: 'flex' as const,
              flexDirection: 'column' as const,
              justifyContent: 'flex-start' as const,
              overflow: 'hidden' as const,
            },
            children: {
              type: 'span',
              props: {
                style: {
                  fontFamily: spec.font,
                  fontSize,
                  fontWeight: spec.weight,
                  color,
                  textAlign: align,
                  lineHeight: slot === 'body' ? 1.5 : 1.2,
                  wordBreak: 'break-word' as const,
                  width: '100%',
                },
                children: text,
              },
            },
          },
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = await satori(root as any, { width: W, height: H, fonts });
    composites.push({ input: Buffer.from(svg), top: 0, left: 0 });
  }

  // Debug zone outlines — activated via debugZones param OR DEBUG_ZONES=true env var
  if (debugZones || process.env.DEBUG_ZONES === 'true') {
    const debugColors: Record<Slot, string> = {
      headline: 'rgba(255,0,0,0.35)',
      name:     'rgba(0,200,0,0.35)',
      body:     'rgba(0,80,255,0.35)',
      signoff:  'rgba(255,140,0,0.35)',
    };
    for (const slot of SLOTS) {
      const zone = zones[slot];
      const zoneW = Math.round(zone.width  * scaleFactor);
      const zoneH = Math.round(zone.height * scaleFactor);
      const zoneX = Math.round(zone.x      * scaleFactor);
      const zoneY = Math.round(zone.y      * scaleFactor);
      const dbgRoot = {
        type: 'div',
        props: {
          style: { position: 'relative' as const, display: 'flex' as const, width: W, height: H },
          children: {
            type: 'div',
            props: {
              style: {
                position: 'absolute' as const,
                left: zoneX, top: zoneY,
                width: zoneW, height: zoneH,
                backgroundColor: debugColors[slot],
              },
            },
          },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbgSvg = await satori(dbgRoot as any, { width: W, height: H, fonts });
      composites.push({ input: Buffer.from(dbgSvg), top: 0, left: 0 });
    }
  }

  // Optional grain overlay — gracefully skipped if Sharp noise API unavailable
  try {
    const grainRaw = await sharp({
      create: { width: 200, height: 200, channels: 3 as const, background: { r: 128, g: 128, b: 128 }, noise: { type: 'gaussian' as const, mean: 128, sigma: 25 } },
    }).png().toBuffer();
    const grainFull = await sharp(grainRaw).resize(W, H, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const grainData = grainFull.data;
    // Set alpha to 4% (≈ 10 of 255)
    for (let i = 3; i < grainData.length; i += 4) grainData[i] = 10;
    const grainBuffer = await sharp(grainData, {
      raw: { width: grainFull.info.width, height: grainFull.info.height, channels: 4 },
    }).png().toBuffer();
    composites.push({ input: grainBuffer, top: 0, left: 0 });
  } catch { /* skip grain silently */ }

  const pngBuffer = await sharp(canvasBuffer)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .composite(composites)
    .png()
    .toBuffer();

  const { width: actualW, height: actualH } = await sharp(pngBuffer).metadata();
  if (actualW !== W || actualH !== H) {
    console.error(`[CanvasFormat] Expected ${W}x${H}, got ${actualW}x${actualH} — dimension drift detected`);
  }

  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
