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

  // ── 20 new backgrounds ───────────────────────────────────────────────────────

  // Birthday: Dark (midnight navy + gold stars + confetti arcs)
  {
    filename: 'birthday_dark_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%"   stop-color="#0A0E2A"/>
      <stop offset="60%"  stop-color="#0D1235"/>
      <stop offset="100%" stop-color="#101840"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Scattered gold stars -->
  <circle cx="140"  cy="120"  r="3"   fill="#FFD700" opacity="0.70"/>
  <circle cx="380"  cy="80"   r="2"   fill="#FFD700" opacity="0.55"/>
  <circle cx="620"  cy="150"  r="2.5" fill="#FFD700" opacity="0.65"/>
  <circle cx="860"  cy="100"  r="3"   fill="#FFD700" opacity="0.60"/>
  <circle cx="980"  cy="200"  r="2"   fill="#FFD700" opacity="0.50"/>
  <circle cx="60"   cy="320"  r="2"   fill="#FFD700" opacity="0.45"/>
  <circle cx="760"  cy="220"  r="2.5" fill="#FFD700" opacity="0.60"/>
  <circle cx="200"  cy="400"  r="2"   fill="#FFD700" opacity="0.40"/>
  <circle cx="500"  cy="60"   r="2"   fill="#FFD700" opacity="0.50"/>
  <circle cx="1020" cy="350"  r="2.5" fill="#FFD700" opacity="0.55"/>
  <circle cx="300"  cy="1150" r="2"   fill="#FFD700" opacity="0.35"/>
  <circle cx="700"  cy="1200" r="2.5" fill="#FFD700" opacity="0.40"/>
  <circle cx="900"  cy="1100" r="2"   fill="#FFD700" opacity="0.35"/>
  <!-- Confetti arcs -->
  <path d="M 100 900 Q 300 820 500 900" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.12"/>
  <path d="M 580 980 Q 780 900 980 980" fill="none" stroke="#F5A623" stroke-width="1.5" opacity="0.10"/>
  <!-- Subtle glow at top -->
  <circle cx="540" cy="0" r="400" fill="#1A2060" opacity="0.60"/>
  <!-- Horizontal rule lines -->
  <line x1="80" y1="238"  x2="1000" y2="238"  stroke="#FFD700" stroke-width="1" opacity="0.18"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#FFD700" stroke-width="1" opacity="0.14"/>
</svg>`,
  },

  // Birthday: Floral (cream + abstract petal shapes)
  {
    filename: 'birthday_floral_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#FDFAF6"/>
      <stop offset="50%"  stop-color="#FAF4EE"/>
      <stop offset="100%" stop-color="#F4EAE0"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Top-left petal cluster -->
  <ellipse cx="0"    cy="0"    rx="280" ry="200" fill="#E8A0B0" opacity="0.12" transform="rotate(30 0 0)"/>
  <ellipse cx="60"   cy="60"   rx="220" ry="160" fill="#D48090" opacity="0.09" transform="rotate(-15 60 60)"/>
  <ellipse cx="0"    cy="120"  rx="200" ry="140" fill="#F0B0C0" opacity="0.10" transform="rotate(50 0 120)"/>
  <!-- Bottom-right petal cluster -->
  <ellipse cx="1080" cy="1350" rx="280" ry="200" fill="#E8A0B0" opacity="0.12" transform="rotate(-150 1080 1350)"/>
  <ellipse cx="1020" cy="1290" rx="220" ry="160" fill="#D48090" opacity="0.09" transform="rotate(165 1020 1290)"/>
  <ellipse cx="1080" cy="1230" rx="200" ry="140" fill="#F0B0C0" opacity="0.10" transform="rotate(-130 1080 1230)"/>
  <!-- Small accent circles -->
  <circle cx="540" cy="100"  r="4" fill="#C87890" opacity="0.30"/>
  <circle cx="480" cy="135"  r="3" fill="#C87890" opacity="0.22"/>
  <circle cx="600" cy="135"  r="3" fill="#C87890" opacity="0.22"/>
  <!-- Rule lines -->
  <line x1="100" y1="278" x2="980" y2="278" stroke="#B06878" stroke-width="1" opacity="0.20"/>
  <line x1="100" y1="1072" x2="980" y2="1072" stroke="#B06878" stroke-width="1" opacity="0.16"/>
</svg>`,
  },

  // Birthday: Retro (off-white + bold geometric arcs + pop circles)
  {
    filename: 'birthday_retro_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#F8F4EC"/>
      <stop offset="100%" stop-color="#EDE6D8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Bold geometric arcs -->
  <path d="M -80 540 Q 360 180 800 540"  fill="none" stroke="#D62828" stroke-width="22" opacity="0.14"/>
  <path d="M 280 1350 Q 720 990 1160 1350" fill="none" stroke="#1A1A2E" stroke-width="18" opacity="0.10"/>
  <!-- Pop-art circles -->
  <circle cx="960" cy="180" r="130" fill="#F76C2F" opacity="0.12"/>
  <circle cx="960" cy="180" r="90"  fill="#F76C2F" opacity="0.08"/>
  <circle cx="120" cy="1180" r="100" fill="#D62828" opacity="0.10"/>
  <circle cx="120" cy="1180" r="65"  fill="#D62828" opacity="0.07"/>
  <!-- Small dot accents -->
  <circle cx="540" cy="60" r="16" fill="#D62828" opacity="0.18"/>
  <circle cx="480" cy="90" r="10" fill="#F76C2F" opacity="0.15"/>
  <circle cx="600" cy="90" r="10" fill="#F76C2F" opacity="0.15"/>
  <!-- Rule lines -->
  <line x1="80" y1="238"  x2="1000" y2="238"  stroke="#D62828" stroke-width="3" opacity="0.22"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#D62828" stroke-width="3" opacity="0.18"/>
</svg>`,
  },

  // Birthday: Pastel (pink-to-lavender diagonal gradient + layered rings)
  {
    filename: 'birthday_pastel_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FFE4F0"/>
      <stop offset="50%"  stop-color="#EED8F8"/>
      <stop offset="100%" stop-color="#D8C8F8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Layered rings top-right -->
  <circle cx="980" cy="160" r="240" fill="none" stroke="#C090E0" stroke-width="1.5" opacity="0.20"/>
  <circle cx="980" cy="160" r="190" fill="none" stroke="#C090E0" stroke-width="1"   opacity="0.16"/>
  <circle cx="980" cy="160" r="140" fill="none" stroke="#C090E0" stroke-width="1"   opacity="0.12"/>
  <circle cx="980" cy="160" r="90"  fill="#E0B0F0" opacity="0.10"/>
  <!-- Layered rings bottom-left -->
  <circle cx="100" cy="1190" r="200" fill="none" stroke="#D090D0" stroke-width="1.5" opacity="0.18"/>
  <circle cx="100" cy="1190" r="150" fill="none" stroke="#D090D0" stroke-width="1"   opacity="0.14"/>
  <circle cx="100" cy="1190" r="100" fill="#F0B8E8" opacity="0.10"/>
  <!-- Subtle scatter dots -->
  <circle cx="200" cy="200" r="5" fill="#B870C8" opacity="0.18"/>
  <circle cx="350" cy="120" r="4" fill="#C080D8" opacity="0.15"/>
  <circle cx="700" cy="250" r="4" fill="#B870C8" opacity="0.15"/>
  <!-- Rule lines -->
  <line x1="80" y1="258"  x2="1000" y2="258"  stroke="#9060B0" stroke-width="1" opacity="0.22"/>
  <line x1="80" y1="1075" x2="1000" y2="1075" stroke="#9060B0" stroke-width="1" opacity="0.18"/>
</svg>`,
  },

  // Sympathy: Dove (white + radial petal silhouettes)
  {
    filename: 'sympathy_dove_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="60%"  stop-color="#F4F6F8"/>
      <stop offset="100%" stop-color="#E8ECF0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Radial petal silhouettes from centre-top -->
  <ellipse cx="540" cy="520" rx="30"  ry="160" fill="#C8D8E8" opacity="0.14" transform="rotate(0 540 520)"/>
  <ellipse cx="540" cy="520" rx="28"  ry="150" fill="#C8D8E8" opacity="0.12" transform="rotate(30 540 520)"/>
  <ellipse cx="540" cy="520" rx="26"  ry="140" fill="#C8D8E8" opacity="0.10" transform="rotate(60 540 520)"/>
  <ellipse cx="540" cy="520" rx="24"  ry="130" fill="#C8D8E8" opacity="0.10" transform="rotate(90 540 520)"/>
  <ellipse cx="540" cy="520" rx="22"  ry="120" fill="#C8D8E8" opacity="0.09" transform="rotate(120 540 520)"/>
  <ellipse cx="540" cy="520" rx="20"  ry="110" fill="#C8D8E8" opacity="0.08" transform="rotate(150 540 520)"/>
  <ellipse cx="540" cy="520" rx="18"  ry="100" fill="#C8D8E8" opacity="0.08" transform="rotate(180 540 520)"/>
  <ellipse cx="540" cy="520" rx="16"  ry="90"  fill="#C8D8E8" opacity="0.07" transform="rotate(210 540 520)"/>
  <ellipse cx="540" cy="520" rx="14"  ry="80"  fill="#C8D8E8" opacity="0.07" transform="rotate(240 540 520)"/>
  <ellipse cx="540" cy="520" rx="12"  ry="70"  fill="#C8D8E8" opacity="0.06" transform="rotate(270 540 520)"/>
  <ellipse cx="540" cy="520" rx="10"  ry="60"  fill="#C8D8E8" opacity="0.06" transform="rotate(300 540 520)"/>
  <ellipse cx="540" cy="520" rx="8"   ry="50"  fill="#C8D8E8" opacity="0.05" transform="rotate(330 540 520)"/>
  <!-- Soft centre glow -->
  <circle cx="540" cy="520" r="40" fill="#FFFFFF" opacity="0.60"/>
  <!-- Rule lines -->
  <line x1="120" y1="278"  x2="960" y2="278"  stroke="#8A9BAD" stroke-width="1" opacity="0.22"/>
  <line x1="120" y1="1072" x2="960" y2="1072" stroke="#8A9BAD" stroke-width="1" opacity="0.16"/>
</svg>`,
  },

  // Sympathy: Lavender (lavender + botanical stem line art)
  {
    filename: 'sympathy_lavender_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#F0ECF8"/>
      <stop offset="50%"  stop-color="#E8E0F4"/>
      <stop offset="100%" stop-color="#DDD4EE"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Botanical stem line art — left side -->
  <path d="M 80 1350 Q 100 1100 120 900 Q 140 700 100 500 Q 60 300 120 100" fill="none" stroke="#9A80B8" stroke-width="1.5" opacity="0.22"/>
  <!-- Small leaf branches -->
  <path d="M 100 900 Q 160 870 200 840"  fill="none" stroke="#9A80B8" stroke-width="1" opacity="0.18"/>
  <path d="M 105 700 Q 55  680 30  660"  fill="none" stroke="#9A80B8" stroke-width="1" opacity="0.16"/>
  <path d="M 110 520 Q 170 500 210 490"  fill="none" stroke="#9A80B8" stroke-width="1" opacity="0.16"/>
  <!-- Right side stem -->
  <path d="M 1000 1350 Q 980 1100 960 900 Q 940 700 980 500 Q 1020 300 960 100" fill="none" stroke="#9A80B8" stroke-width="1.5" opacity="0.18"/>
  <path d="M 975 800 Q 920  780 880 770"  fill="none" stroke="#9A80B8" stroke-width="1" opacity="0.14"/>
  <path d="M 970 600 Q 1020 580 1050 570" fill="none" stroke="#9A80B8" stroke-width="1" opacity="0.14"/>
  <!-- Soft oval glow at top -->
  <ellipse cx="540" cy="140" rx="300" ry="100" fill="#C8B8E8" opacity="0.08"/>
  <!-- Rule lines -->
  <line x1="120" y1="278"  x2="960" y2="278"  stroke="#7A60A0" stroke-width="1" opacity="0.22"/>
  <line x1="120" y1="1072" x2="960" y2="1072" stroke="#7A60A0" stroke-width="1" opacity="0.16"/>
</svg>`,
  },

  // Sympathy: Candle (deep warm brown + radial amber glow)
  {
    filename: 'sympathy_candle_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="32%" r="55%">
      <stop offset="0%"   stop-color="#F5C87A" stop-opacity="0.22"/>
      <stop offset="50%"  stop-color="#C89040" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#5A2A10" stop-opacity="0.00"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%"   stop-color="#3A1E0A"/>
      <stop offset="50%"  stop-color="#2E160A"/>
      <stop offset="100%" stop-color="#1E0E04"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect width="1080" height="1350" fill="url(#glow)"/>
  <!-- Soft radial amber rings -->
  <circle cx="540" cy="420" r="320" fill="none" stroke="#D4A040" stroke-width="1"   opacity="0.12"/>
  <circle cx="540" cy="420" r="240" fill="none" stroke="#E0B060" stroke-width="1"   opacity="0.10"/>
  <circle cx="540" cy="420" r="160" fill="none" stroke="#F0C878" stroke-width="1.5" opacity="0.12"/>
  <circle cx="540" cy="420" r="80"  fill="#F8E0A0" opacity="0.08"/>
  <!-- Rule lines -->
  <line x1="100" y1="278"  x2="980" y2="278"  stroke="#D4A040" stroke-width="1" opacity="0.25"/>
  <line x1="100" y1="1072" x2="980" y2="1072" stroke="#D4A040" stroke-width="1" opacity="0.20"/>
</svg>`,
  },

  // Sympathy: Peaceful (sage green + horizontal wave lines + horizon)
  {
    filename: 'sympathy_peaceful_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#E8F0E8"/>
      <stop offset="60%"  stop-color="#D8EAD8"/>
      <stop offset="100%" stop-color="#C8E0C8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Horizontal wave lines -->
  <path d="M 0 700 Q 270 680 540 700 Q 810 720 1080 700" fill="none" stroke="#6A9A6A" stroke-width="1"   opacity="0.18"/>
  <path d="M 0 720 Q 270 700 540 720 Q 810 740 1080 720" fill="none" stroke="#6A9A6A" stroke-width="0.5" opacity="0.12"/>
  <path d="M 0 740 Q 270 720 540 740 Q 810 760 1080 740" fill="none" stroke="#6A9A6A" stroke-width="0.5" opacity="0.10"/>
  <!-- Horizon gradient band -->
  <rect x="0" y="680" width="1080" height="80" fill="#4A7A4A" opacity="0.06"/>
  <!-- Subtle sky glow at top -->
  <rect x="0" y="0" width="1080" height="250" fill="#A0C8A0" opacity="0.07"/>
  <!-- Corner leaf shapes -->
  <ellipse cx="60"   cy="60"   rx="50" ry="30" fill="#5A8A5A" opacity="0.10" transform="rotate(30 60 60)"/>
  <ellipse cx="1020" cy="60"   rx="50" ry="30" fill="#5A8A5A" opacity="0.10" transform="rotate(-30 1020 60)"/>
  <!-- Rule lines -->
  <line x1="100" y1="278"  x2="980" y2="278"  stroke="#4A7A4A" stroke-width="1" opacity="0.22"/>
  <line x1="100" y1="1072" x2="980" y2="1072" stroke="#4A7A4A" stroke-width="1" opacity="0.18"/>
</svg>`,
  },

  // Congrats: Burst (dark slate + radiating sunburst lines)
  {
    filename: 'congrats_burst_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#1E2430"/>
      <stop offset="50%"  stop-color="#242C3A"/>
      <stop offset="100%" stop-color="#1A2028"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Radiating sunburst lines from top-right -->
  <line x1="1080" y1="0" x2="200"  y2="1350" stroke="#D4B030" stroke-width="1"   opacity="0.10"/>
  <line x1="1080" y1="0" x2="300"  y2="1350" stroke="#D4B030" stroke-width="0.8" opacity="0.08"/>
  <line x1="1080" y1="0" x2="400"  y2="1350" stroke="#D4B030" stroke-width="0.8" opacity="0.08"/>
  <line x1="1080" y1="0" x2="500"  y2="1350" stroke="#D4B030" stroke-width="0.8" opacity="0.07"/>
  <line x1="1080" y1="0" x2="600"  y2="1350" stroke="#D4B030" stroke-width="0.8" opacity="0.07"/>
  <line x1="1080" y1="0" x2="700"  y2="1350" stroke="#D4B030" stroke-width="0.6" opacity="0.06"/>
  <line x1="1080" y1="0" x2="800"  y2="1350" stroke="#D4B030" stroke-width="0.6" opacity="0.06"/>
  <line x1="1080" y1="0" x2="0"    y2="800"  stroke="#D4B030" stroke-width="1"   opacity="0.10"/>
  <line x1="1080" y1="0" x2="0"    y2="600"  stroke="#D4B030" stroke-width="0.8" opacity="0.08"/>
  <line x1="1080" y1="0" x2="0"    y2="400"  stroke="#D4B030" stroke-width="0.8" opacity="0.07"/>
  <line x1="1080" y1="0" x2="0"    y2="200"  stroke="#D4B030" stroke-width="0.6" opacity="0.06"/>
  <!-- Glow at burst origin -->
  <circle cx="1080" cy="0" r="200" fill="#D4B030" opacity="0.08"/>
  <!-- Rule lines -->
  <line x1="80" y1="248"  x2="1000" y2="248"  stroke="#D4B030" stroke-width="1.5" opacity="0.22"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#D4B030" stroke-width="1.5" opacity="0.18"/>
</svg>`,
  },

  // Congrats: Ribbon (cream + diagonal gold stripe + confetti dots)
  {
    filename: 'congrats_ribbon_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#FDFAF2"/>
      <stop offset="100%" stop-color="#F4EED8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Diagonal gold stripe pattern -->
  <line x1="-200" y1="400"  x2="600"  y2="-200" stroke="#D4AF37" stroke-width="60" opacity="0.07"/>
  <line x1="200"  y1="1000" x2="1200" y2="0"    stroke="#D4AF37" stroke-width="60" opacity="0.06"/>
  <line x1="-200" y1="900"  x2="800"  y2="-200" stroke="#D4AF37" stroke-width="30" opacity="0.05"/>
  <line x1="400"  y1="1400" x2="1400" y2="400"  stroke="#D4AF37" stroke-width="30" opacity="0.05"/>
  <!-- Confetti dots -->
  <circle cx="120"  cy="180"  r="8"  fill="#D4AF37" opacity="0.18"/>
  <circle cx="340"  cy="100"  r="6"  fill="#E8C050" opacity="0.15"/>
  <circle cx="600"  cy="200"  r="7"  fill="#D4AF37" opacity="0.16"/>
  <circle cx="820"  cy="120"  r="5"  fill="#E8C050" opacity="0.14"/>
  <circle cx="1000" cy="220"  r="8"  fill="#D4AF37" opacity="0.18"/>
  <circle cx="200"  cy="1200" r="6"  fill="#D4AF37" opacity="0.14"/>
  <circle cx="500"  cy="1280" r="5"  fill="#E8C050" opacity="0.12"/>
  <circle cx="750"  cy="1180" r="7"  fill="#D4AF37" opacity="0.14"/>
  <circle cx="950"  cy="1250" r="6"  fill="#E8C050" opacity="0.12"/>
  <!-- Rule lines -->
  <line x1="60" y1="248"  x2="1020" y2="248"  stroke="#B89A30" stroke-width="2.5" opacity="0.22"/>
  <line x1="60" y1="1082" x2="1020" y2="1082" stroke="#B89A30" stroke-width="2.5" opacity="0.18"/>
</svg>`,
  },

  // Congrats: Neon (deep purple + neon glow rings + gradient mesh)
  {
    filename: 'congrats_neon_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow1" cx="30%" cy="25%" r="50%">
      <stop offset="0%"   stop-color="#00FFCC" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#00FFCC" stop-opacity="0.00"/>
    </radialGradient>
    <radialGradient id="glow2" cx="70%" cy="75%" r="50%">
      <stop offset="0%"   stop-color="#FF80FF" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#FF80FF" stop-opacity="0.00"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0E0820"/>
      <stop offset="50%"  stop-color="#140C2A"/>
      <stop offset="100%" stop-color="#0A0618"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect width="1080" height="1350" fill="url(#glow1)"/>
  <rect width="1080" height="1350" fill="url(#glow2)"/>
  <!-- Neon glow rings -->
  <circle cx="280" cy="340"  r="200" fill="none" stroke="#00FFCC" stroke-width="1.5" opacity="0.18"/>
  <circle cx="280" cy="340"  r="160" fill="none" stroke="#00FFCC" stroke-width="1"   opacity="0.12"/>
  <circle cx="800" cy="1010" r="180" fill="none" stroke="#FF80FF" stroke-width="1.5" opacity="0.18"/>
  <circle cx="800" cy="1010" r="140" fill="none" stroke="#FF80FF" stroke-width="1"   opacity="0.12"/>
  <!-- Gradient mesh lines -->
  <line x1="0"    y1="450"  x2="1080" y2="450"  stroke="#6060FF" stroke-width="0.5" opacity="0.15"/>
  <line x1="0"    y1="900"  x2="1080" y2="900"  stroke="#6060FF" stroke-width="0.5" opacity="0.12"/>
  <line x1="360"  y1="0"    x2="360"  y2="1350" stroke="#6060FF" stroke-width="0.5" opacity="0.10"/>
  <line x1="720"  y1="0"    x2="720"  y2="1350" stroke="#6060FF" stroke-width="0.5" opacity="0.10"/>
  <!-- Rule lines -->
  <line x1="80" y1="238"  x2="1000" y2="238"  stroke="#00FFCC" stroke-width="1" opacity="0.30"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#FF80FF" stroke-width="1" opacity="0.28"/>
</svg>`,
  },

  // Congrats: Luxury (navy + repeating diamond lattice in gold)
  {
    filename: 'congrats_luxury_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#0A1428"/>
      <stop offset="50%"  stop-color="#0E1A32"/>
      <stop offset="100%" stop-color="#08101E"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Diamond lattice pattern -->
  <path d="M 0 135 L 90 0 L 180 135 L 90 270 Z"   fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.14"/>
  <path d="M 180 135 L 270 0 L 360 135 L 270 270 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.14"/>
  <path d="M 360 135 L 450 0 L 540 135 L 450 270 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.14"/>
  <path d="M 540 135 L 630 0 L 720 135 L 630 270 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.14"/>
  <path d="M 720 135 L 810 0 L 900 135 L 810 270 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.14"/>
  <path d="M 900 135 L 990 0 L 1080 135 L 990 270 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.14"/>
  <!-- Second row offset -->
  <path d="M 0 405 L 90 270 L 180 405 L 90 540 Z"   fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 180 405 L 270 270 L 360 405 L 270 540 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 360 405 L 450 270 L 540 405 L 450 540 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 540 405 L 630 270 L 720 405 L 630 540 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 720 405 L 810 270 L 900 405 L 810 540 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 900 405 L 990 270 L 1080 405 L 990 540 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <!-- Bottom lattice row -->
  <path d="M 0 1080 L 90 945 L 180 1080 L 90 1215 Z"   fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 180 1080 L 270 945 L 360 1080 L 270 1215 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 360 1080 L 450 945 L 540 1080 L 450 1215 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 540 1080 L 630 945 L 720 1080 L 630 1215 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 720 1080 L 810 945 L 900 1080 L 810 1215 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <path d="M 900 1080 L 990 945 L 1080 1080 L 990 1215 Z" fill="none" stroke="#D4AF37" stroke-width="0.6" opacity="0.10"/>
  <!-- Rule lines -->
  <line x1="80" y1="258"  x2="1000" y2="258"  stroke="#D4AF37" stroke-width="1.5" opacity="0.30"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#D4AF37" stroke-width="1.5" opacity="0.25"/>
</svg>`,
  },

  // Business: Tech (dark charcoal + dot-grid + corner bracket marks)
  {
    filename: 'business_tech_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#181C28"/>
      <stop offset="50%"  stop-color="#1E2232"/>
      <stop offset="100%" stop-color="#141820"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Dot grid -->
  <g opacity="0.12" fill="#60A0D8">
    <circle cx="108" cy="135" r="1.5"/><circle cx="216" cy="135" r="1.5"/><circle cx="324" cy="135" r="1.5"/>
    <circle cx="432" cy="135" r="1.5"/><circle cx="540" cy="135" r="1.5"/><circle cx="648" cy="135" r="1.5"/>
    <circle cx="756" cy="135" r="1.5"/><circle cx="864" cy="135" r="1.5"/><circle cx="972" cy="135" r="1.5"/>
    <circle cx="108" cy="270" r="1.5"/><circle cx="216" cy="270" r="1.5"/><circle cx="324" cy="270" r="1.5"/>
    <circle cx="432" cy="270" r="1.5"/><circle cx="540" cy="270" r="1.5"/><circle cx="648" cy="270" r="1.5"/>
    <circle cx="756" cy="270" r="1.5"/><circle cx="864" cy="270" r="1.5"/><circle cx="972" cy="270" r="1.5"/>
    <circle cx="108" cy="1080" r="1.5"/><circle cx="216" cy="1080" r="1.5"/><circle cx="324" cy="1080" r="1.5"/>
    <circle cx="432" cy="1080" r="1.5"/><circle cx="540" cy="1080" r="1.5"/><circle cx="648" cy="1080" r="1.5"/>
    <circle cx="756" cy="1080" r="1.5"/><circle cx="864" cy="1080" r="1.5"/><circle cx="972" cy="1080" r="1.5"/>
    <circle cx="108" cy="1215" r="1.5"/><circle cx="216" cy="1215" r="1.5"/><circle cx="324" cy="1215" r="1.5"/>
    <circle cx="432" cy="1215" r="1.5"/><circle cx="540" cy="1215" r="1.5"/><circle cx="648" cy="1215" r="1.5"/>
    <circle cx="756" cy="1215" r="1.5"/><circle cx="864" cy="1215" r="1.5"/><circle cx="972" cy="1215" r="1.5"/>
  </g>
  <!-- Corner bracket marks -->
  <path d="M 40 40 L 40 100 M 40 40 L 100 40" fill="none" stroke="#60A0D8" stroke-width="2.5" opacity="0.35"/>
  <path d="M 1040 40 L 1040 100 M 1040 40 L 980 40" fill="none" stroke="#60A0D8" stroke-width="2.5" opacity="0.35"/>
  <path d="M 40 1310 L 40 1250 M 40 1310 L 100 1310" fill="none" stroke="#60A0D8" stroke-width="2.5" opacity="0.35"/>
  <path d="M 1040 1310 L 1040 1250 M 1040 1310 L 980 1310" fill="none" stroke="#60A0D8" stroke-width="2.5" opacity="0.35"/>
  <!-- Rule lines -->
  <line x1="80" y1="258"  x2="1000" y2="258"  stroke="#60A0D8" stroke-width="1.5" opacity="0.30"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#60A0D8" stroke-width="1"   opacity="0.22"/>
</svg>`,
  },

  // Business: Amber (white + warm amber left-panel + rule lines)
  {
    filename: 'business_amber_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FEFCF8"/>
      <stop offset="100%" stop-color="#F8F4EC"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Amber left-panel accent -->
  <rect x="0" y="0" width="160" height="1350" fill="#F5A623" opacity="0.14"/>
  <rect x="0" y="0" width="8"   height="1350" fill="#C87820" opacity="0.50"/>
  <!-- Top and bottom rule lines -->
  <rect x="0" y="0"    width="1080" height="6" fill="#C87820" opacity="0.12"/>
  <rect x="0" y="1344" width="1080" height="6" fill="#C87820" opacity="0.12"/>
  <!-- Clean rule lines inside text area -->
  <line x1="200" y1="258"  x2="1000" y2="258"  stroke="#C87820" stroke-width="2" opacity="0.22"/>
  <line x1="200" y1="1082" x2="1000" y2="1082" stroke="#C87820" stroke-width="1.5" opacity="0.18"/>
  <!-- Amber accent bar bottom -->
  <rect x="200" y="1280" width="180" height="5" fill="#F5A623" opacity="0.40"/>
</svg>`,
  },

  // Business: Gradient (deep blue gradient + subtle curved mesh lines)
  {
    filename: 'business_gradient_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.5" y2="1">
      <stop offset="0%"   stop-color="#0A1E40"/>
      <stop offset="40%"  stop-color="#0E2855"/>
      <stop offset="100%" stop-color="#061428"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Subtle curved mesh lines -->
  <path d="M -200 700 Q 340 580 880 700 Q 1220 820 1500 700" fill="none" stroke="#4080C0" stroke-width="1"   opacity="0.14"/>
  <path d="M -200 800 Q 340 680 880 800 Q 1220 920 1500 800" fill="none" stroke="#4080C0" stroke-width="0.8" opacity="0.10"/>
  <path d="M -200 600 Q 340 480 880 600 Q 1220 720 1500 600" fill="none" stroke="#4080C0" stroke-width="0.8" opacity="0.10"/>
  <!-- Glow overlay at top -->
  <ellipse cx="540" cy="0" rx="500" ry="300" fill="#2060A0" opacity="0.18"/>
  <!-- Rule lines -->
  <line x1="80" y1="248"  x2="1000" y2="248"  stroke="#6090D0" stroke-width="1.5" opacity="0.30"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#6090D0" stroke-width="1"   opacity="0.22"/>
  <!-- Corner accent marks -->
  <path d="M 40 40 L 40 80 M 40 40 L 80 40" fill="none" stroke="#80B0E0" stroke-width="2" opacity="0.30"/>
  <path d="M 1040 40 L 1040 80 M 1040 40 L 1000 40" fill="none" stroke="#80B0E0" stroke-width="2" opacity="0.30"/>
</svg>`,
  },

  // Business: Slate (cool slate + sharp geometric accent triangles)
  {
    filename: 'business_slate_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#E8EDF4"/>
      <stop offset="50%"  stop-color="#DDE4EE"/>
      <stop offset="100%" stop-color="#D0DAE8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Sharp geometric accent triangles — top-right -->
  <polygon points="900,0 1080,0 1080,180"  fill="#5A7A9A" opacity="0.14"/>
  <polygon points="980,0 1080,0 1080,100"  fill="#4A6A8A" opacity="0.10"/>
  <!-- Bottom-left triangle -->
  <polygon points="0,1350 180,1350 0,1170" fill="#5A7A9A" opacity="0.14"/>
  <polygon points="0,1350 100,1350 0,1250" fill="#4A6A8A" opacity="0.10"/>
  <!-- Left edge bar -->
  <rect x="0" y="0" width="6" height="1350" fill="#3A5A7A" opacity="0.25"/>
  <!-- Rule lines -->
  <line x1="80" y1="248"  x2="1000" y2="248"  stroke="#3A5A7A" stroke-width="2" opacity="0.22"/>
  <line x1="80" y1="1082" x2="1000" y2="1082" stroke="#3A5A7A" stroke-width="1.5" opacity="0.18"/>
</svg>`,
  },

  // Invitation: Botanical (ivory + leafy vine border)
  {
    filename: 'invitation_botanical_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%"   stop-color="#FDFBF5"/>
      <stop offset="50%"  stop-color="#F8F4EC"/>
      <stop offset="100%" stop-color="#F0EBE0"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Leafy vine — top perimeter -->
  <path d="M 40 40 Q 200 60 400 40 Q 600 20 800 40 Q 1000 60 1040 40" fill="none" stroke="#5A8A4A" stroke-width="1.5" opacity="0.28"/>
  <!-- Top leaves -->
  <ellipse cx="160"  cy="55"  rx="28" ry="14" fill="#6A9A5A" opacity="0.18" transform="rotate(-20 160 55)"/>
  <ellipse cx="320"  cy="42"  rx="26" ry="12" fill="#5A8A4A" opacity="0.16" transform="rotate(15 320 42)"/>
  <ellipse cx="540"  cy="38"  rx="30" ry="13" fill="#6A9A5A" opacity="0.18" transform="rotate(-5 540 38)"/>
  <ellipse cx="760"  cy="42"  rx="26" ry="12" fill="#5A8A4A" opacity="0.16" transform="rotate(20 760 42)"/>
  <ellipse cx="920"  cy="50"  rx="28" ry="13" fill="#6A9A5A" opacity="0.18" transform="rotate(-15 920 50)"/>
  <!-- Left vine -->
  <path d="M 40 40 Q 55 300 40 600 Q 25 900 40 1310" fill="none" stroke="#5A8A4A" stroke-width="1.5" opacity="0.22"/>
  <ellipse cx="48"  cy="200"  rx="20" ry="10" fill="#6A9A5A" opacity="0.18" transform="rotate(80 48 200)"/>
  <ellipse cx="42"  cy="450"  rx="20" ry="10" fill="#5A8A4A" opacity="0.16" transform="rotate(-80 42 450)"/>
  <ellipse cx="48"  cy="700"  rx="20" ry="10" fill="#6A9A5A" opacity="0.18" transform="rotate(80 48 700)"/>
  <ellipse cx="42"  cy="950"  rx="20" ry="10" fill="#5A8A4A" opacity="0.16" transform="rotate(-80 42 950)"/>
  <!-- Right vine -->
  <path d="M 1040 40 Q 1025 300 1040 600 Q 1055 900 1040 1310" fill="none" stroke="#5A8A4A" stroke-width="1.5" opacity="0.20"/>
  <ellipse cx="1032" cy="250"  rx="20" ry="10" fill="#6A9A5A" opacity="0.16" transform="rotate(-80 1032 250)"/>
  <ellipse cx="1038" cy="500"  rx="20" ry="10" fill="#5A8A4A" opacity="0.14" transform="rotate(80 1038 500)"/>
  <!-- Bottom vine -->
  <path d="M 40 1310 Q 200 1290 400 1310 Q 600 1330 800 1310 Q 1000 1290 1040 1310" fill="none" stroke="#5A8A4A" stroke-width="1.5" opacity="0.22"/>
  <!-- Rule lines -->
  <line x1="100" y1="268"  x2="980" y2="268"  stroke="#4A7A3A" stroke-width="1" opacity="0.22"/>
  <line x1="100" y1="1082" x2="980" y2="1082" stroke="#4A7A3A" stroke-width="1" opacity="0.18"/>
</svg>`,
  },

  // Invitation: Art Deco (cream + fan/arch geometric top and bottom band)
  {
    filename: 'invitation_artdeco_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.1" y2="1">
      <stop offset="0%"   stop-color="#FDFAF2"/>
      <stop offset="50%"  stop-color="#F8F4E8"/>
      <stop offset="100%" stop-color="#F0EAD8"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Top band -->
  <rect x="0" y="0" width="1080" height="100" fill="#C8A840" opacity="0.10"/>
  <!-- Fan/arch repeating pattern in top band -->
  <path d="M 0   100 Q 90  20  180 100" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.30"/>
  <path d="M 180 100 Q 270 20  360 100" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.30"/>
  <path d="M 360 100 Q 450 20  540 100" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.30"/>
  <path d="M 540 100 Q 630 20  720 100" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.30"/>
  <path d="M 720 100 Q 810 20  900 100" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.30"/>
  <path d="M 900 100 Q 990 20 1080 100" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.30"/>
  <!-- Inner fan lines (radiating) -->
  <line x1="90"  y1="100" x2="90"  y2="20"  stroke="#C8A840" stroke-width="1" opacity="0.20"/>
  <line x1="270" y1="100" x2="270" y2="20"  stroke="#C8A840" stroke-width="1" opacity="0.20"/>
  <line x1="450" y1="100" x2="450" y2="20"  stroke="#C8A840" stroke-width="1" opacity="0.20"/>
  <line x1="630" y1="100" x2="630" y2="20"  stroke="#C8A840" stroke-width="1" opacity="0.20"/>
  <line x1="810" y1="100" x2="810" y2="20"  stroke="#C8A840" stroke-width="1" opacity="0.20"/>
  <line x1="990" y1="100" x2="990" y2="20"  stroke="#C8A840" stroke-width="1" opacity="0.20"/>
  <!-- Bottom band mirror -->
  <rect x="0" y="1250" width="1080" height="100" fill="#C8A840" opacity="0.10"/>
  <path d="M 0    1250 Q 90  1330  180 1250" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.28"/>
  <path d="M 180  1250 Q 270 1330  360 1250" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.28"/>
  <path d="M 360  1250 Q 450 1330  540 1250" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.28"/>
  <path d="M 540  1250 Q 630 1330  720 1250" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.28"/>
  <path d="M 720  1250 Q 810 1330  900 1250" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.28"/>
  <path d="M 900  1250 Q 990 1330 1080 1250" fill="none" stroke="#C8A840" stroke-width="1.5" opacity="0.28"/>
  <!-- Rule lines -->
  <line x1="100" y1="278"  x2="980" y2="278"  stroke="#A88820" stroke-width="1.5" opacity="0.24"/>
  <line x1="100" y1="1072" x2="980" y2="1072" stroke="#A88820" stroke-width="1.5" opacity="0.20"/>
</svg>`,
  },

  // Invitation: Garden (blush pink + scatter dot pattern + double-rule frame)
  {
    filename: 'invitation_garden_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#FEF0F4"/>
      <stop offset="50%"  stop-color="#FAE8EE"/>
      <stop offset="100%" stop-color="#F4DEE6"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Double-rule frame -->
  <rect x="40"  y="40"  width="1000" height="1270" fill="none" stroke="#C07090" stroke-width="1.5" opacity="0.24"/>
  <rect x="52"  y="52"  width="976"  height="1246" fill="none" stroke="#C07090" stroke-width="0.8" opacity="0.16"/>
  <!-- Scatter dot pattern — inside frame -->
  <circle cx="200"  cy="140"  r="4" fill="#C07090" opacity="0.15"/>
  <circle cx="400"  cy="100"  r="3" fill="#D08090" opacity="0.12"/>
  <circle cx="650"  cy="130"  r="4" fill="#C07090" opacity="0.14"/>
  <circle cx="850"  cy="110"  r="3" fill="#D08090" opacity="0.12"/>
  <circle cx="150"  cy="1230" r="4" fill="#C07090" opacity="0.14"/>
  <circle cx="380"  cy="1270" r="3" fill="#D08090" opacity="0.11"/>
  <circle cx="600"  cy="1240" r="4" fill="#C07090" opacity="0.13"/>
  <circle cx="820"  cy="1260" r="3" fill="#D08090" opacity="0.11"/>
  <circle cx="1000" cy="1230" r="4" fill="#C07090" opacity="0.13"/>
  <!-- Corner ornament circles -->
  <circle cx="80"   cy="80"   r="10" fill="#C07090" opacity="0.16"/>
  <circle cx="1000" cy="80"   r="10" fill="#C07090" opacity="0.16"/>
  <circle cx="80"   cy="1270" r="10" fill="#C07090" opacity="0.16"/>
  <circle cx="1000" cy="1270" r="10" fill="#C07090" opacity="0.16"/>
  <!-- Rule lines -->
  <line x1="100" y1="278"  x2="980" y2="278"  stroke="#A05070" stroke-width="1" opacity="0.22"/>
  <line x1="100" y1="1072" x2="980" y2="1072" stroke="#A05070" stroke-width="1" opacity="0.18"/>
  <circle cx="540" cy="278"  r="4" fill="#A05070" opacity="0.32"/>
  <circle cx="540" cy="1072" r="4" fill="#A05070" opacity="0.26"/>
</svg>`,
  },

  // Invitation: Noir (deep charcoal + silver line art ornaments)
  {
    filename: 'invitation_noir_01.png',
    svg: `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%"   stop-color="#1A1C24"/>
      <stop offset="50%"  stop-color="#20222C"/>
      <stop offset="100%" stop-color="#141618"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <!-- Outer silver border -->
  <rect x="30"  y="30"  width="1020" height="1290" fill="none" stroke="#A0A8B8" stroke-width="1"   opacity="0.25"/>
  <rect x="44"  y="44"  width="992"  height="1262" fill="none" stroke="#A0A8B8" stroke-width="0.5" opacity="0.15"/>
  <!-- Corner ornamental flourishes -->
  <path d="M 50 50 Q 90 50 90 90 M 50 50 Q 50 90 90 90"   fill="none" stroke="#C0C8D8" stroke-width="1.5" opacity="0.35"/>
  <path d="M 1030 50 Q 990 50 990 90 M 1030 50 Q 1030 90 990 90" fill="none" stroke="#C0C8D8" stroke-width="1.5" opacity="0.35"/>
  <path d="M 50 1300 Q 90 1300 90 1260 M 50 1300 Q 50 1260 90 1260" fill="none" stroke="#C0C8D8" stroke-width="1.5" opacity="0.35"/>
  <path d="M 1030 1300 Q 990 1300 990 1260 M 1030 1300 Q 1030 1260 990 1260" fill="none" stroke="#C0C8D8" stroke-width="1.5" opacity="0.35"/>
  <!-- Centre top ornament -->
  <line x1="440" y1="68" x2="540" y2="68" stroke="#A0A8B8" stroke-width="0.8" opacity="0.30"/>
  <circle cx="540" cy="68" r="4" fill="none" stroke="#A0A8B8" stroke-width="1" opacity="0.35"/>
  <line x1="540" y1="68" x2="640" y2="68" stroke="#A0A8B8" stroke-width="0.8" opacity="0.30"/>
  <!-- Rule lines -->
  <line x1="100" y1="268"  x2="980" y2="268"  stroke="#8090A8" stroke-width="1" opacity="0.30"/>
  <line x1="100" y1="1082" x2="980" y2="1082" stroke="#8090A8" stroke-width="1" opacity="0.25"/>
  <!-- Small diamond accents on rule lines -->
  <polygon points="540,260 548,268 540,276 532,268" fill="#A0A8B8" opacity="0.35"/>
  <polygon points="540,1074 548,1082 540,1090 532,1082" fill="#A0A8B8" opacity="0.30"/>
</svg>`,
  },
];

for (const { filename, svg } of backgrounds) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(`public/backgrounds/${filename}`, buf);
  console.log(`✓  public/backgrounds/${filename} created`);
}
