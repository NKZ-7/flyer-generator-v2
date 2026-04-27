import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('public/backgrounds', { recursive: true });

const backgrounds = [
  {
    filename: 'birthday_warm_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FFF8F2"/>
      <stop offset="45%"  stop-color="#FAEDE3"/>
      <stop offset="100%" stop-color="#F0D5C0"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <circle cx="920" cy="190"  r="320" fill="#E8B89A" opacity="0.12"/>
  <circle cx="80"  cy="1200" r="260" fill="#D4956A" opacity="0.08"/>
  <line x1="80" y1="185"  x2="1000" y2="185"  stroke="#C8905A" stroke-width="2"   opacity="0.25"/>
  <line x1="80" y1="1175" x2="1000" y2="1175" stroke="#C8905A" stroke-width="1.5" opacity="0.20"/>
</svg>`,
  },
  {
    filename: 'sympathy_soft_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#F4F6F8"/>
      <stop offset="50%"  stop-color="#EBEEF2"/>
      <stop offset="100%" stop-color="#DDE2E8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <circle cx="540" cy="180"  r="380" fill="#B8C8D8" opacity="0.08"/>
  <circle cx="200" cy="900"  r="200" fill="#A8B8C8" opacity="0.06"/>
  <circle cx="880" cy="1100" r="240" fill="#B8C8D8" opacity="0.07"/>
  <line x1="120" y1="270"  x2="960" y2="270"  stroke="#8A9BAD" stroke-width="1"   opacity="0.20"/>
  <line x1="120" y1="1080" x2="960" y2="1080" stroke="#8A9BAD" stroke-width="1"   opacity="0.15"/>
</svg>`,
  },
  {
    filename: 'congrats_bold_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#F8F4E8"/>
      <stop offset="50%"  stop-color="#F2EAD0"/>
      <stop offset="100%" stop-color="#E8DDB8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <polygon points="0,0 380,0 0,380" fill="#D4AF37" opacity="0.10"/>
  <polygon points="1080,1350 700,1350 1080,970" fill="#D4AF37" opacity="0.10"/>
  <circle cx="900" cy="160"  r="180" fill="#D4AF37" opacity="0.07"/>
  <circle cx="140" cy="1200" r="160" fill="#D4AF37" opacity="0.06"/>
  <line x1="60"  y1="248"  x2="1020" y2="248"  stroke="#B89A30" stroke-width="3" opacity="0.20"/>
  <line x1="60"  y1="1102" x2="1020" y2="1102" stroke="#B89A30" stroke-width="3" opacity="0.20"/>
</svg>`,
  },
  {
    filename: 'business_clean_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#F7F9FC"/>
      <stop offset="100%" stop-color="#EDF1F7"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="1350" fill="#0F1F3D" opacity="0.80"/>
  <rect x="0" y="0" width="1080" height="6" fill="#0F1F3D" opacity="0.15"/>
  <rect x="0" y="1344" width="1080" height="6" fill="#0F1F3D" opacity="0.15"/>
  <line x1="80" y1="265"  x2="600" y2="265" stroke="#0F1F3D" stroke-width="2.5" opacity="0.20"/>
  <line x1="80" y1="1065" x2="600" y2="1065" stroke="#0F1F3D" stroke-width="1.5" opacity="0.15"/>
  <rect x="80" y="1250" width="120" height="4" fill="#1A6B8A" opacity="0.50"/>
</svg>`,
  },
  {
    filename: 'invitation_elegant_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%"   stop-color="#FDF8F4"/>
      <stop offset="50%"  stop-color="#F8F0E8"/>
      <stop offset="100%" stop-color="#F0E4D4"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="40"  y="40"  width="1000" height="1270" fill="none" stroke="#B08870" stroke-width="1.5" opacity="0.25"/>
  <rect x="55"  y="55"  width="970"  height="1240" fill="none" stroke="#B08870" stroke-width="0.5" opacity="0.15"/>
  <circle cx="100"  cy="100"  r="30" fill="#B08870" opacity="0.12"/>
  <circle cx="980"  cy="100"  r="30" fill="#B08870" opacity="0.12"/>
  <circle cx="100"  cy="1250" r="30" fill="#B08870" opacity="0.12"/>
  <circle cx="980"  cy="1250" r="30" fill="#B08870" opacity="0.12"/>
  <line x1="100" y1="278"  x2="980" y2="278"  stroke="#B08870" stroke-width="1" opacity="0.22"/>
  <line x1="100" y1="1072" x2="980" y2="1072" stroke="#B08870" stroke-width="1" opacity="0.18"/>
  <circle cx="540" cy="278"  r="5" fill="#B08870" opacity="0.35"/>
  <circle cx="540" cy="1072" r="5" fill="#B08870" opacity="0.28"/>
</svg>`,
  },
];

for (const { filename, svg } of backgrounds) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(`public/backgrounds/${filename}`, buf);
  console.log(`✓  public/backgrounds/${filename} created`);
}
