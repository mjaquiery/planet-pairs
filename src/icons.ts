const svg = (body: string) =>
  `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  home: svg('<path d="M8 22 24 8l16 14"/><path d="M13 19v20h22V19"/><path d="M21 39V28h6v11"/>'),
  back: svg('<path d="M30 10 16 24l14 14"/>'),
  replay: svg('<path d="M38 24a14 14 0 1 1-4.1-9.9"/><path d="M36 6v9h-9"/>'),
  play: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 10v28l22-14z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>',
  soundOn: svg('<path d="M8 18h7l10-8v28l-10-8H8z"/><path d="M32 17a9 9 0 0 1 0 14"/><path d="M37 11a17 17 0 0 1 0 26"/>'),
  soundOff: svg('<path d="M8 18h7l10-8v28l-10-8H8z"/><path d="m32 19 10 10M42 19 32 29"/>'),
  info: svg('<circle cx="24" cy="24" r="18"/><path d="M24 22v11"/><path d="M24 15h.01"/>'),
  star: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4l5.9 12.6 13.6 1.7-10 9.4 2.6 13.5L24 34.6 11.9 41.2l2.6-13.5-10-9.4 13.6-1.7z" fill="currentColor"/></svg>',
};
