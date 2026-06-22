import type React from 'react';

export const COLOR_SCHEME_THEMES: Record<string, {
  bg: string; ink: string; sub: string; accent: string; frame: string; stripLabel: string;
}> = {
  dark:     { bg:'linear-gradient(155deg,#1b1b2b,#0d0d1a)', ink:'#ffffff', sub:'rgba(255,255,255,.62)', accent:'#ef6a6a', frame:'rgba(255,255,255,.18)', stripLabel:'Cosmic Dark' },
  vibrant:  { bg:'linear-gradient(150deg,#7c3aed,#ec4899)', ink:'#ffffff', sub:'rgba(255,255,255,.78)', accent:'#fde047', frame:'rgba(255,255,255,.32)', stripLabel:'Vibrant' },
  warm:     { bg:'linear-gradient(155deg,#b45309,#7c2d12)', ink:'#fff7ed', sub:'rgba(255,247,237,.72)', accent:'#fde68a', frame:'rgba(254,243,199,.3)', stripLabel:'Warm Amber' },
  cool:     { bg:'linear-gradient(155deg,#2563eb,#1e3a8a)', ink:'#ffffff', sub:'rgba(224,242,254,.82)', accent:'#bae6fd', frame:'rgba(255,255,255,.26)', stripLabel:'Cool Blue' },
  minimal:  { bg:'linear-gradient(155deg,#ffffff,#eef0f2)', ink:'#111827', sub:'rgba(17,24,39,.55)', accent:'#a16207', frame:'rgba(17,24,39,.14)', stripLabel:'Minimal' },
  gold:     { bg:'linear-gradient(155deg,#1f1803,#0f0c00)', ink:'#fef3c7', sub:'rgba(254,243,199,.62)', accent:'#f0b840', frame:'rgba(240,184,64,.34)', stripLabel:'Gold Night' },
};

export const FONT_STYLE_MAP: Record<string, { label: string; className: string; style: React.CSSProperties }> = {
  modern:          { label:'Modern',        className:'font-oswald',       style:{ textTransform:'uppercase', fontWeight:700 } },
  classic:         { label:'Classic',       className:'font-playfair',     style:{ fontStyle:'italic' } },
  clean:           { label:'Clean',         className:'font-sans',         style:{} },
  highContrast:    { label:'High Contrast', className:'font-oswald',       style:{ textTransform:'uppercase', fontWeight:700, letterSpacing:'0.06em' } },
  vintage:         { label:'Vintage',       className:'font-playfair',     style:{ fontWeight:700 } },
  minimalType:     { label:'Minimal Type',  className:'font-sans',         style:{ fontWeight:300, letterSpacing:'0.04em' } },
  script_romance:  { label:'Script',        className:'font-great-vibes',  style:{ fontSize:'1.4em' } },
  editorial_serif: { label:'Editorial',     className:'font-cormorant',    style:{ fontStyle:'italic', fontWeight:600 } },
  playful_display: { label:'Playful',       className:'font-dancing',      style:{} },
  bold_geometric:  { label:'Bold Geo',      className:'font-raleway',      style:{ textTransform:'uppercase', fontWeight:700, letterSpacing:'0.08em' } },
  warm_personal:   { label:'Warm',          className:'font-caveat',       style:{ fontSize:'1.1em' } },
  urban_modern:    { label:'Urban',         className:'font-bebas',        style:{ letterSpacing:'0.1em' } },
};

export const SHOWCASE = [
  { label:'Birthday',   title:'Happy Birthday',    tagline:'Wishing you a wonderful year ahead', detail:'With love, always' },
  { label:'Invitation', title:"You're Invited",    tagline:'An evening to remember',             detail:'Saturday · 7:00 PM' },
  { label:'Congrats',   title:'Congratulations',   tagline:'We always knew you would',           detail:'So proud of you' },
  { label:'Business',   title:'Grand Opening',     tagline:'Unbeatable deals, every day',        detail:'All branches · This week' },
  { label:'Thank You',  title:'Thank You',         tagline:'For everything you do',              detail:'From all of us' },
  { label:'Wedding',    title:'Save the Date',     tagline:'Two hearts, one journey',            detail:'June 14 · Accra' },
];
