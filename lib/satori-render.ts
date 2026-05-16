import satori from 'satori';
import sharp from 'sharp';
import type { DesignBrief, FlyerCopyV2 } from './types';
import { LAYOUTS, validateSlotGaps } from './render/layouts';
import { TYPOGRAPHY_PAIRINGS, loadTypographyFonts } from './render/typography';
import { CANVAS_DIMENSIONS, DEFAULT_CANVAS_FORMAT, BASE_FONT_SIZE_PX, AUTO_FIT, LEGIBILITY_TEXT_COLOR } from './render/render-config';
import { extractAccentColor, harmonizeColors } from './render/color-sampling';

const { width: CANVAS_W, height: CANVAS_H } = CANVAS_DIMENSIONS[DEFAULT_CANVAS_FORMAT];

// Zones that contain spatially separated slots (hero_name_radial, top_heavy) can have
// different luminance per slot. Sampling each slot's zone independently prevents
// near-invisible text when one slot sits on dark decoration while another is on light cream.
// When a zone is mixed light/dark (variance > threshold) the conservative near-black
// fallback is chosen — near-black is more universally legible because most cream/light
// backgrounds dominate even when some decoration intrudes.
const AMBIGUOUS_ZONE_VARIANCE_THRESHOLD = 0.12;
const VARIANCE_SAMPLE_GRID = 8; // 8×8 = 64 sample points per slot zone

function slotRelativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

async function sampleSlotZoneColor(
  canvasBuffer: Buffer,
  zone: { x: number; y: number; width: number; height: number },
): Promise<{ color: string; luminance: number; variance: number }> {
  try {
    const GRID = VARIANCE_SAMPLE_GRID;
    const { data, info } = await sharp(canvasBuffer)
      .extract({ left: zone.x, top: zone.y, width: Math.max(zone.width, 1), height: Math.max(zone.height, 1) })
      .resize(GRID, GRID, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = info.width * info.height;
    const luminances: number[] = [];
    let rSum = 0, gSum = 0, bSum = 0;

    for (let i = 0; i < pixels; i++) {
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      rSum += r; gSum += g; bSum += b;
      luminances.push(slotRelativeLuminance(r, g, b));
    }

    const avgR = Math.round(rSum / pixels);
    const avgG = Math.round(gSum / pixels);
    const avgB = Math.round(bSum / pixels);
    const color = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
    const meanLum = luminances.reduce((s, l) => s + l, 0) / pixels;
    const variance = luminances.reduce((s, l) => s + (l - meanLum) ** 2, 0) / pixels;

    return { color, luminance: meanLum, variance };
  } catch {
    return { color: '#F5E6D0', luminance: 0.806, variance: 0 };
  }
}

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

// Name slot must visually dominate the headline — per-layout ratios enforce this.
// Uses max() so the pairing's natural name size is never reduced below its own floor.
const LAYOUT_NAME_RATIOS: Record<string, number> = {
  centered_framed:     1.8,
  vignette_center:     1.8,
  hero_name_radial:    1.8,
  top_heavy:           1.5,
  magazine_split:      1.5,
  asymmetric_diagonal: 1.4,
  banner_horizontal:   1.4,
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
  validateSlotGaps(zones, CANVAS_H, designBrief.layoutId);
  const sampleZone = layout.computeDecorationSampleZone(CANVAS_W, CANVAS_H);

  const accentColor = await extractAccentColor(canvasBuffer, sampleZone);

  console.log('[render] Layout:', designBrief.layoutId, 'Theme:', designBrief.decorative_theme, 'Typography:', designBrief.typographyId);
  console.log(`[typography] pairing=${designBrief.typographyId} name_font=${typo.name.font} headline_font=${typo.headline.font} body_font=${typo.body.font}`);

  // Per-slot zone sampling: each slot resolves its text color against its own zone background.
  // Fixes hero_name_radial (name on dark upper zone while body zone is light) and top_heavy
  // (headline near dark decoration boundary). Safe layouts are unaffected — their slots all
  // share the same visual zone, so per-slot sampling returns identical values to the old single sample.
  const textColors = {} as Record<Slot, string>;

  for (const slot of SLOTS) {
    const { color: slotZoneColor, luminance: slotLum, variance: slotVariance } =
      await sampleSlotZoneColor(canvasBuffer, zones[slot]);

    if (slotVariance > AMBIGUOUS_ZONE_VARIANCE_THRESHOLD) {
      // Mixed zone: decoration partially crosses into the slot. Neither pure-black nor pure-white
      // is fully safe, but near-black is the more universally legible choice because cream/light
      // backgrounds dominate most zones even when some decoration intrudes.
      textColors[slot] = LEGIBILITY_TEXT_COLOR;
      console.log(
        `[legibility] slot=${slot} zoneVariance=${slotVariance.toFixed(3)} dominantLum=${slotLum.toFixed(3)} ` +
        `trigger=AMBIGUOUS_ZONE_FALLBACK resolvedColor=${LEGIBILITY_TEXT_COLOR}`,
      );
    } else {
      const slotColors = harmonizeColors(slotZoneColor, accentColor);
      textColors[slot] = slotColors[slot];
    }
  }

  console.log('[render] Will render slots with these colors:');
  console.log('  headline:', textColors.headline);
  console.log('  name:    ', textColors.name);
  console.log('  body:    ', textColors.body);
  console.log('  signoff: ', textColors.signoff);

  const composites: { input: Buffer; top: number; left: number }[] = [];

  for (const slot of SLOTS) {
    const text = copyValue(copy, slot).trim();
    if (!text) continue;

    const zone   = zones[slot];
    const spec   = typo[slot];
    const maxLn  = MAX_LINES[slot];
    const align  = slot === 'name' ? 'center' : layout.text_alignment[slot];
    const color  = textColors[slot];

    console.log(`[render] About to render ${slot} slot. Text: "${text.slice(0, 40)}${text.length > 40 ? '...' : ''}" Color: ${color}`);

    // Auto-fit: char-count heuristic — reduce font size until text fits within maxLn lines
    let fontSize: number;
    if (slot === 'name') {
      const headlineBaseSize = Math.round(BASE_FONT_SIZE_PX * typo.headline.sizeRatio * scaleFactor);
      const nameRatio = LAYOUT_NAME_RATIOS[designBrief.layoutId] ?? 1.6;
      fontSize = Math.max(
        Math.round(headlineBaseSize * nameRatio),
        Math.round(BASE_FONT_SIZE_PX * spec.sizeRatio * scaleFactor),
      );
    } else {
      fontSize = Math.round(BASE_FONT_SIZE_PX * spec.sizeRatio * scaleFactor);
    }
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
              paddingTop:    slot === 'name' ? Math.round(28 * scaleFactor) : 0,
              paddingBottom: slot === 'name' ? Math.round(28 * scaleFactor) : 0,
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
    .flatten({ background: '#FAEDE3' })
    .png()
    .toBuffer();

  const { width: actualW, height: actualH } = await sharp(pngBuffer).metadata();
  if (actualW !== W || actualH !== H) {
    console.error(`[CanvasFormat] Expected ${W}x${H}, got ${actualW}x${actualH} — dimension drift detected`);
  }

  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
