import type { ObjectId } from './objects';

/**
 * Original cartoon artwork for each object, drawn for this project
 * (MIT licensed with the rest of the code). Each drawing uses a 200×200
 * viewBox; `u` makes gradient/clip ids unique per copy on the page.
 */
type Drawing = (u: string) => string;

const ball = (u: string, inner: string, outer: string) => `
  <radialGradient id="g${u}" cx="38%" cy="34%" r="70%">
    <stop offset="0" stop-color="${inner}"/>
    <stop offset="1" stop-color="${outer}"/>
  </radialGradient>`;

const shine = `<ellipse cx="72" cy="66" rx="20" ry="12" fill="#fff" opacity=".35" transform="rotate(-35 72 66)"/>`;

const drawings: Record<ObjectId, Drawing> = {
  sun: (u) => `
    <defs>${ball(u, '#fff59a', '#ffb300')}</defs>
    <g class="spin" style="transform-origin:100px 100px">
      ${Array.from({ length: 12 }, (_, i) => {
        const fill = i % 2 ? '#ff9800' : '#ffc107';
        return `<path d="M100 8 L114 40 L86 40 Z" fill="${fill}" stroke="${fill}" stroke-width="6" stroke-linejoin="round" transform="rotate(${i * 30} 100 100)"/>`;
      }).join('')}
    </g>
    <circle cx="100" cy="100" r="56" fill="url(#g${u})"/>
    <circle cx="100" cy="100" r="56" fill="none" stroke="#ff9800" stroke-width="4" opacity=".6"/>
    ${shine}`,

  mercury: (u) => `
    <defs>${ball(u, '#d6ccc2', '#8d7f74')}</defs>
    <circle cx="100" cy="100" r="58" fill="url(#g${u})"/>
    <circle cx="80" cy="118" r="12" fill="#7a6d63" opacity=".55"/>
    <circle cx="124" cy="84" r="9" fill="#7a6d63" opacity=".5"/>
    <circle cx="118" cy="128" r="6" fill="#7a6d63" opacity=".5"/>
    <circle cx="90" cy="80" r="5" fill="#7a6d63" opacity=".45"/>
    <circle cx="140" cy="110" r="5" fill="#7a6d63" opacity=".45"/>
    ${shine}`,

  venus: (u) => `
    <defs>${ball(u, '#fff3c4', '#e0a84f')}
      <clipPath id="c${u}"><circle cx="100" cy="100" r="66"/></clipPath></defs>
    <circle cx="100" cy="100" r="66" fill="url(#g${u})"/>
    <g clip-path="url(#c${u})" fill="none" stroke="#fff6dc" stroke-width="9" stroke-linecap="round" opacity=".7">
      <path d="M30 78 Q70 60 100 80 T170 74"/>
      <path d="M30 112 Q66 96 104 114 T172 108"/>
      <path d="M44 144 Q80 130 112 146 T168 140"/>
    </g>
    ${shine}`,

  earth: (u) => `
    <defs>${ball(u, '#7fd3ff', '#1e6fd9')}
      <clipPath id="c${u}"><circle cx="100" cy="100" r="68"/></clipPath></defs>
    <circle cx="100" cy="100" r="68" fill="url(#g${u})"/>
    <g clip-path="url(#c${u})">
      <path d="M52 64 C66 48 92 52 96 68 C100 82 84 86 88 100 C92 116 74 128 62 116 C50 104 58 92 48 84 C40 76 44 70 52 64 Z" fill="#4caf50"/>
      <path d="M118 96 C130 84 152 90 158 104 C164 120 150 140 134 146 C120 150 116 134 122 124 C126 114 110 106 118 96 Z" fill="#43a047"/>
      <path d="M110 46 C120 40 136 44 138 54 C134 60 120 60 110 56 Z" fill="#66bb6a"/>
      <path d="M40 132 Q70 124 96 140" stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none" opacity=".85"/>
      <path d="M112 72 Q136 62 160 74" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".85"/>
      <ellipse cx="100" cy="34" rx="34" ry="8" fill="#fff" opacity=".9"/>
    </g>
    ${shine}`,

  moon: (u) => `
    <defs>${ball(u, '#f4f4f8', '#a9acbd')}</defs>
    <circle cx="100" cy="100" r="62" fill="url(#g${u})"/>
    <circle cx="78" cy="88" r="14" fill="#9a9db0" opacity=".55"/>
    <circle cx="122" cy="118" r="18" fill="#9a9db0" opacity=".5"/>
    <circle cx="126" cy="74" r="8" fill="#9a9db0" opacity=".5"/>
    <circle cx="84" cy="132" r="7" fill="#9a9db0" opacity=".5"/>
    <circle cx="100" cy="104" r="4" fill="#9a9db0" opacity=".5"/>
    ${shine}`,

  mars: (u) => `
    <defs>${ball(u, '#ff9b6b', '#c1440e')}
      <clipPath id="c${u}"><circle cx="100" cy="100" r="62"/></clipPath></defs>
    <circle cx="100" cy="100" r="62" fill="url(#g${u})"/>
    <g clip-path="url(#c${u})">
      <ellipse cx="100" cy="40" rx="30" ry="10" fill="#fff"/>
      <path d="M58 98 C76 88 96 104 116 96 C130 90 146 98 150 108 C136 116 120 108 104 116 C86 124 68 112 58 98 Z" fill="#a8380c" opacity=".7"/>
      <circle cx="80" cy="134" r="9" fill="#a8380c" opacity=".55"/>
      <circle cx="132" cy="70" r="6" fill="#a8380c" opacity=".5"/>
    </g>
    ${shine}`,

  jupiter: (u) => `
    <defs>${ball(u, '#ffe6c7', '#c98a4b')}
      <clipPath id="c${u}"><circle cx="100" cy="100" r="74"/></clipPath></defs>
    <circle cx="100" cy="100" r="74" fill="url(#g${u})"/>
    <g clip-path="url(#c${u})">
      <rect x="20" y="52" width="160" height="12" fill="#d9925a" opacity=".8"/>
      <rect x="20" y="76" width="160" height="16" fill="#f3d2a6"/>
      <rect x="20" y="98" width="160" height="12" fill="#b8703c" opacity=".8"/>
      <rect x="20" y="120" width="160" height="14" fill="#e8b27d"/>
      <rect x="20" y="142" width="160" height="10" fill="#c07a45" opacity=".8"/>
      <ellipse cx="128" cy="126" rx="18" ry="11" fill="#d8482f"/>
      <ellipse cx="128" cy="126" rx="10" ry="5" fill="#ef7a5c"/>
    </g>
    ${shine}`,

  saturn: (u) => `
    <defs>${ball(u, '#fff3c0', '#d4a44a')}</defs>
    <g transform="rotate(-18 100 100)">
      <path d="M18 100 A82 24 0 0 1 182 100" fill="none" stroke="#c9a15b" stroke-width="12"/>
      <path d="M30 100 A70 18 0 0 1 170 100" fill="none" stroke="#efd99a" stroke-width="6"/>
      <circle cx="100" cy="100" r="52" fill="url(#g${u})"/>
      <path d="M52 86 Q100 78 148 86" stroke="#e5be6f" stroke-width="8" fill="none" opacity=".7"/>
      <path d="M50 108 Q100 116 150 108" stroke="#e5be6f" stroke-width="8" fill="none" opacity=".7"/>
      <path d="M18 100 A82 24 0 0 0 182 100" fill="none" stroke="#c9a15b" stroke-width="12"/>
      <path d="M30 100 A70 18 0 0 0 170 100" fill="none" stroke="#efd99a" stroke-width="6"/>
    </g>
    ${shine}`,

  uranus: (u) => `
    <defs>${ball(u, '#d9fffb', '#4fc3c7')}</defs>
    <g transform="rotate(-8 100 100)">
      <path d="M100 16 A14 84 0 0 0 100 184" fill="none" stroke="#a7e6e2" stroke-width="6"/>
      <circle cx="100" cy="100" r="58" fill="url(#g${u})"/>
      <path d="M100 16 A14 84 0 0 1 100 184" fill="none" stroke="#a7e6e2" stroke-width="6"/>
    </g>
    ${shine}`,

  neptune: (u) => `
    <defs>${ball(u, '#8fb4ff', '#2442b8')}
      <clipPath id="c${u}"><circle cx="100" cy="100" r="60"/></clipPath></defs>
    <circle cx="100" cy="100" r="60" fill="url(#g${u})"/>
    <g clip-path="url(#c${u})">
      <path d="M50 80 Q100 70 150 80" stroke="#c7d7ff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".7"/>
      <path d="M60 124 Q100 116 140 126" stroke="#c7d7ff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6"/>
      <ellipse cx="82" cy="104" rx="14" ry="8" fill="#1a2f86"/>
      <path d="M96 98 Q110 94 120 100" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>
    </g>
    ${shine}`,
};

let counter = 0;

export function cartoonSvg(id: ObjectId): string {
  const u = `${id}${counter++}`;
  return `<svg class="cartoon" viewBox="0 0 200 200" aria-hidden="true">${drawings[id](u)}</svg>`;
}
