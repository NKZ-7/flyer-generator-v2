import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';
import { loadTemplate } from './templates/index';
import type { TemplateCopy } from './types';

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
    { name: 'Montserrat', data: readFileSync(join(nm, 'montserrat', 'files', 'montserrat-latin-400-normal.woff2')), weight: 400 as const, style: 'normal' as const },
    { name: 'Montserrat', data: readFileSync(join(nm, 'montserrat', 'files', 'montserrat-latin-700-normal.woff2')), weight: 700 as const, style: 'normal' as const },
    { name: 'Poppins',    data: readFileSync(join(nm, 'poppins',    'files', 'poppins-latin-400-normal.woff2')),    weight: 400 as const, style: 'normal' as const },
    { name: 'Poppins',    data: readFileSync(join(nm, 'poppins',    'files', 'poppins-latin-700-normal.woff2')),    weight: 700 as const, style: 'normal' as const },
    { name: 'Lora',       data: readFileSync(join(nm, 'lora',       'files', 'lora-latin-400-normal.woff2')),       weight: 400 as const, style: 'normal' as const },
    { name: 'Lora',       data: readFileSync(join(nm, 'lora',       'files', 'lora-latin-700-normal.woff2')),       weight: 700 as const, style: 'normal' as const },
    { name: 'Raleway',    data: readFileSync(join(nm, 'raleway',    'files', 'raleway-latin-400-normal.woff2')),    weight: 400 as const, style: 'normal' as const },
    { name: 'Raleway',    data: readFileSync(join(nm, 'raleway',    'files', 'raleway-latin-700-normal.woff2')),    weight: 700 as const, style: 'normal' as const },
    { name: 'Dancing Script', data: readFileSync(join(nm, 'dancing-script', 'files', 'dancing-script-latin-400-normal.woff2')), weight: 400 as const, style: 'normal' as const },
    { name: 'Dancing Script', data: readFileSync(join(nm, 'dancing-script', 'files', 'dancing-script-latin-700-normal.woff2')), weight: 700 as const, style: 'normal' as const },
  ];
  return _fonts;
}

export async function renderFlyerToBase64(
  templateId: string,
  copy: TemplateCopy,
  paletteIndex: number,
  scaleFactor = 1,
  dalleArtUrl?: string,
): Promise<string> {
  const template = loadTemplate(templateId);
  const palette = template.palettes[paletteIndex] ?? template.palettes[0];
  const W = Math.round(template.dimensions.width  * scaleFactor);
  const H = Math.round(template.dimensions.height * scaleFactor);

  // Load background PNG from disk — background_url is "/backgrounds/foo.png"
  // path.join handles the leading slash correctly as a relative segment
  const bgBuffer = readFileSync(join(process.cwd(), 'public', template.background_url));

  const composites: { input: Buffer; top: number; left: number }[] = [];

  // Composite DALL-E art zone between background and text slots
  if (dalleArtUrl && template.art_zone) {
    const zone = template.art_zone;
    const dalleBase64 = dalleArtUrl.replace(/^data:image\/\w+;base64,/, '');
    const dalleRaw = Buffer.from(dalleBase64, 'base64');
    const { data, info } = await sharp(dalleRaw)
      .resize(Math.round(zone.width * scaleFactor), Math.round(zone.height * scaleFactor), { fit: 'cover' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const opacity = zone.opacity ?? 0.55;
    for (let i = 3; i < data.length; i += 4) {
      data[i] = Math.round((data[i] as number) * opacity);
    }
    const artBuffer = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
    composites.push({ input: artBuffer, top: Math.round(zone.y * scaleFactor), left: Math.round(zone.x * scaleFactor) });
  }

  for (const slot of template.slots) {
    const rawText = copy[slot.id as keyof TemplateCopy] ?? '';
    // Enforce hard limit before rendering
    const text = rawText.slice(0, slot.hard_max_chars);

    if (!text) continue; // skip empty slots

    const color = palette[slot.color_token];

    // Auto-fit: reduce font size until text fits within max_lines (char-count heuristic)
    // REVIEW: uses char-count estimate, not true layout measurement — may under/over-fit for short words or CJK
    let fontSize = Math.round(slot.ideal_size_px * scaleFactor);
    const minFontSize = Math.round(slot.min_size_px * scaleFactor);
    for (let i = 0; i < 10; i++) {
      const charsPerLine = Math.floor((slot.zone.width * scaleFactor) / (fontSize * 0.55));
      const estimatedLines = Math.ceil(text.length / Math.max(charsPerLine, 1));
      if (estimatedLines <= slot.max_lines || fontSize <= minFontSize) break;
      fontSize -= 2;
    }

    // Build Satori JSX: full W×H canvas with text absolutely positioned at slot zone
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
              left:   Math.round(slot.zone.x      * scaleFactor),
              top:    Math.round(slot.zone.y      * scaleFactor),
              width:  Math.round(slot.zone.width  * scaleFactor),
              height: Math.round(slot.zone.height * scaleFactor),
              display: 'flex' as const,
              flexDirection: 'column' as const,
              justifyContent: 'flex-start' as const,
              overflow: 'visible' as const,
            },
            children: {
              type: 'span',
              props: {
                style: {
                  fontFamily: slot.font_family,
                  fontSize,
                  fontWeight: slot.font_weight,
                  color,
                  textAlign: slot.alignment as 'left' | 'center' | 'right',
                  lineHeight: slot.line_height,
                  wordBreak: 'break-word' as const,
                },
                children: text,
              },
            },
          },
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slotSvg = await satori(root as any, { width: W, height: H, fonts: getFonts() });
    composites.push({ input: Buffer.from(slotSvg), top: 0, left: 0 });
  }

  const pngBuffer = await sharp(bgBuffer)
    .resize(W, H, { fit: 'cover', position: 'center' })
    .composite(composites)
    .png()
    .toBuffer();

  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
