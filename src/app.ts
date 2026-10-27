import { cartoonSvg } from './cartoons';
import { h, html, onTap, reducedMotion, wait } from './dom';
import {
  canPlay,
  cardsForObject,
  createGame,
  flipCard,
  GAME_SIZES,
  isWon,
  restoreGame,
  settle,
  type Card,
  type GameSize,
  type GameState,
} from './game';
import { ICONS } from './icons';
import { fitGrid } from './layout';
import { OBJECTS, type ObjectId } from './objects';
import { PHOTO_LIBRARY, PHOTOS, photoUrl } from './photos';
import { Sound } from './sound';
import { Store } from './storage';

/** Timings (ms). Slow and calm on purpose. */
const T = {
  splash: 2400,
  flip: 650,
  lookAtMatch: 450,
  lookAtMismatch: 1400,
  celebrate: 600,
  fly: 950,
  winButtons: 3600,
};

const CARD_ASPECT = 1.25;

export class App {
  private readonly store = new Store();
  private readonly sound = new Sound(this.store.data.settings.muted);
  private screen: HTMLElement | null = null;
  private game: GameView | null = null;
  private wantFullscreen = false;

  constructor(private readonly root: HTMLElement) {
    // Audio and fullscreen can only start from a user gesture; on iOS a
    // touch only counts once it ends.
    for (const type of ['pointerdown', 'pointerup', 'touchend']) {
      window.addEventListener(type, () => this.sound.unlock(), { capture: true });
    }
    window.addEventListener(
      'pointerup',
      () => {
        if (this.wantFullscreen) requestFullscreen();
        this.wantFullscreen = false;
      },
      { capture: true },
    );
    window.addEventListener('resize', () => this.game?.layout());
  }

  start(): void {
    this.showSplash();
  }

  private show(el: HTMLElement): void {
    const old = this.screen;
    this.screen = el;
    el.classList.add('screen', 'entering');
    this.root.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entering')));
    if (old) {
      old.classList.add('leaving');
      setTimeout(() => old.remove(), 500);
    }
  }

  private showSplash(): void {
    const orbit = (id: ObjectId, r: number, dur: number, size: number) => `
      <div class="orbit" style="--r:${r}vmin;--dur:${dur}s;--size:${size}vmin">
        <div class="orbiter">${cartoonSvg(id)}</div>
      </div>`;
    const el = html(`
      <div class="splash">
        <div class="solar">
          ${orbit('earth', 22, 7, 9)}
          ${orbit('saturn', 34, 11, 12)}
          ${orbit('moon', 13, 5, 6)}
          <div class="splash-sun">${cartoonSvg('sun')}</div>
        </div>
        <h1 class="title">Planet Pairs</h1>
      </div>`);
    this.show(el);
    const ready = Promise.all([wait(T.splash), preloadPhotos()]);
    void ready.then(() => this.showSizeMenu());
  }

  private header(back?: () => void): HTMLElement {
    const bar = h('div', { class: 'topbar' });
    if (back) {
      const b = h('button', { class: 'icon-btn', 'aria-label': 'Back' });
      b.innerHTML = ICONS.back;
      onTap(b, () => {
        this.sound.tap();
        back();
      });
      bar.append(b);
    } else {
      bar.append(h('span'));
    }
    const right = h('div', { class: 'topbar-right' });
    const mute = h('button', { class: 'icon-btn', 'aria-label': 'Sound on or off' });
    const paint = () => (mute.innerHTML = this.sound.muted ? ICONS.soundOff : ICONS.soundOn);
    paint();
    onTap(mute, () => {
      this.sound.muted = !this.sound.muted;
      this.store.setMuted(this.sound.muted);
      paint();
      this.sound.tap();
    });
    right.append(mute);
    if (!back) {
      const info = h('button', { class: 'icon-btn', 'aria-label': 'Picture credits' });
      info.innerHTML = ICONS.info;
      onTap(info, () => this.showCredits());
      right.append(info);
    }
    bar.append(right);
    return bar;
  }

  private showSizeMenu(): void {
    this.game?.destroy();
    this.game = null;
    const el = h('div', { class: 'menu' }, this.header());
    el.append(h('h1', { class: 'title small' }, 'Planet Pairs'));
    const choices = h('div', { class: 'choices' });

    const saved = this.store.data.current;
    if (saved && !isWon(saved)) {
      const resume = h('button', { class: 'choice resume', 'aria-label': 'Carry on playing' });
      resume.innerHTML = `<span class="choice-icon play">${ICONS.play}</span><span class="choice-label">Carry on</span>`;
      onTap(resume, () => {
        this.sound.tap();
        this.startGame(restoreGame(saved));
      });
      choices.append(resume);
    }

    for (const size of GAME_SIZES) {
      const btn = h('button', { class: 'choice size', 'aria-label': `${size} cards` });
      const fit = fitGrid(size, 400, 300, 8, CARD_ASPECT);
      const mini = h('span', { class: 'mini-grid', style: `--cols:${fit.cols};--rows:${fit.rows}` });
      for (let i = 0; i < size; i++) mini.append(h('span', { class: 'mini-card' }));
      btn.append(mini, h('span', { class: 'choice-label big-number' }, String(size)));
      onTap(btn, () => {
        this.sound.tap();
        this.showModeMenu(size);
      });
      choices.append(btn);
    }
    el.append(choices);
    this.show(el);
  }

  private showModeMenu(size: GameSize): void {
    const el = h('div', { class: 'menu' }, this.header(() => this.showSizeMenu()));
    el.append(h('div', { class: 'menu-spacer' }));
    const choices = h('div', { class: 'choices' });

    const cartoon = h('button', { class: 'choice mode', 'aria-label': 'Cartoons' });
    cartoon.innerHTML = `<span class="mode-pic" style="background:${OBJECTS.saturn.colour}">${cartoonSvg('saturn')}</span><span class="choice-label">Cartoons</span>`;
    onTap(cartoon, () => {
      this.sound.tap();
      this.startGame(createGame(size, 'cartoon', PHOTO_LIBRARY));
    });
    choices.append(cartoon);

    const photosOk = canPlay('photo', size, PHOTO_LIBRARY);
    const photo = h('button', {
      class: `choice mode${photosOk ? '' : ' disabled'}`,
      'aria-label': 'Photos',
      'aria-disabled': !photosOk,
    });
    const sample = PHOTO_LIBRARY.saturn?.[0] ?? PHOTOS[0]?.file;
    photo.innerHTML = `<span class="mode-pic photo">${
      sample ? `<img src="${photoUrl(sample)}" alt="">` : ''
    }</span><span class="choice-label">Photos</span>`;
    onTap(photo, () => {
      if (!photosOk) return;
      this.sound.tap();
      this.startGame(createGame(size, 'photo', PHOTO_LIBRARY));
    });
    choices.append(photo);

    el.append(choices);
    this.show(el);
  }

  private showCredits(): void {
    const el = h('div', { class: 'menu credits' }, this.header(() => this.showSizeMenu()));
    const body = h('div', { class: 'credits-body' });
    body.append(
      h('h2', {}, 'Pictures'),
      h('p', {}, 'The cartoon pictures were drawn for Planet Pairs.'),
    );
    if (PHOTOS.length) {
      const list = h('ul');
      for (const p of PHOTOS) {
        const li = h('li');
        li.innerHTML = `<img src="${photoUrl(p.file)}" alt=""><span><strong>${escapeHtml(
          OBJECTS[p.object].name,
        )}</strong>: ${escapeHtml(p.title)}<br>${escapeHtml(p.artist)} · ${escapeHtml(p.license)}<br><small>${escapeHtml(p.source)}</small></span>`;
        list.append(li);
      }
      body.append(list);
    }
    el.append(body);
    this.show(el);
  }

  private startGame(game: GameState): void {
    this.store.setCurrent(game);
    this.wantFullscreen = true;
    const view = new GameView(game, this.store, this.sound, {
      home: () => this.showSizeMenu(),
      replay: () => this.startGame(createGame(game.size, game.mode, PHOTO_LIBRARY)),
    });
    this.game?.destroy();
    this.game = view;
    this.show(view.el);
    requestAnimationFrame(() => view.layout());
  }
}

interface GameActions {
  home: () => void;
  replay: () => void;
}

class GameView {
  readonly el: HTMLElement;
  private readonly board: HTMLElement;
  private readonly tray: HTMLElement;
  private readonly slots: HTMLElement[] = [];
  private readonly cardEls = new Map<string, HTMLElement>();
  private _busy = false;
  private alive = true;

  private get busy(): boolean {
    return this._busy;
  }

  private set busy(value: boolean) {
    this._busy = value;
    this.board.classList.toggle('busy', value);
  }

  constructor(
    private readonly game: GameState,
    private readonly store: Store,
    private readonly sound: Sound,
    private readonly actions: GameActions,
  ) {
    this.el = h('div', { class: `game mode-${game.mode}` });
    this.board = h('div', { class: 'board' });
    this.tray = h('div', { class: 'tray' });
    for (let i = 0; i < game.size / 2; i++) {
      const slot = h('div', { class: 'slot' });
      this.slots.push(slot);
      this.tray.append(slot);
    }
    for (const card of game.cards) {
      const el = this.cardEl(card);
      this.cardEls.set(card.id, el);
      this.board.append(el);
    }
    game.matched.forEach((id, i) => this.slots[i].append(this.stackEl(id)));
    this.el.append(this.homeButton(), h('div', { class: 'play-area' }, this.board, this.tray));
  }

  destroy(): void {
    this.alive = false;
  }

  /** Size cards and tray slots to fill the screen. */
  layout(): void {
    if (!this.alive) return;
    const landscape = innerWidth >= innerHeight;
    this.el.classList.toggle('landscape', landscape);
    this.el.classList.toggle('portrait', !landscape);
    const b = contentSize(this.board);
    const gap = Math.max(10, Math.min(b.width, b.height) * 0.03);
    const fit = fitGrid(this.game.size, b.width, b.height, gap, CARD_ASPECT);
    this.board.style.setProperty('--cols', String(fit.cols));
    this.board.style.setProperty('--gap', `${gap}px`);
    this.board.style.setProperty('--card-w', `${fit.width}px`);

    const t = contentSize(this.tray);
    const tGap = Math.max(6, gap * 0.6);
    // A stack is a card plus its offset twin, so leave a little room.
    const tFit = fitGrid(this.slots.length, t.width, t.height, tGap * 1.6, CARD_ASPECT);
    const slotW = Math.min(tFit.width / 1.12, fit.width * 0.8);
    this.tray.style.setProperty('--cols', String(tFit.cols));
    this.tray.style.setProperty('--gap', `${tGap}px`);
    this.tray.style.setProperty('--slot-w', `${slotW}px`);
  }

  private homeButton(): HTMLElement {
    // Press and hold so stray toddler taps don't leave the game.
    const btn = h('button', { class: 'hold-home', 'aria-label': 'Hold to go home' });
    btn.innerHTML = `${ICONS.home}<svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg>`;
    let timer = 0;
    const cancel = () => {
      clearTimeout(timer);
      btn.classList.remove('holding');
    };
    btn.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary) return;
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('holding');
      timer = window.setTimeout(() => {
        cancel();
        this.sound.tap();
        this.actions.home();
      }, 1000);
    });
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointercancel', cancel);
    btn.addEventListener('click', (e) => {
      if (e.detail === 0) this.actions.home();
    });
    return btn;
  }

  private faceEl(card: Pick<Card, 'objectId' | 'image'>): HTMLElement {
    const obj = OBJECTS[card.objectId];
    const face = h('div', { class: 'face front' });
    if (this.game.mode === 'photo') {
      face.classList.add('photo');
      face.append(h('img', { src: photoUrl(card.image), alt: obj.name, draggable: 'false' }));
    } else {
      face.style.background = obj.colour;
      face.innerHTML = cartoonSvg(card.objectId);
    }
    face.append(h('span', { class: 'label' }, obj.name));
    return face;
  }

  private cardEl(card: Card): HTMLElement {
    const el = h('button', {
      class: `card ${card.state}`,
      'data-id': card.id,
      'data-object': card.objectId,
      'aria-label': 'Card',
    });
    const back = h('div', { class: 'face back' });
    back.innerHTML = `<span class="back-star">${ICONS.star}</span>`;
    el.append(h('div', { class: 'card-inner' }, back, this.faceEl(card)));
    onTap(el, () => void this.tapCard(card.id));
    return el;
  }

  private stackEl(objectId: ObjectId): HTMLElement {
    const stack = h('div', { class: 'stack', 'data-object': objectId });
    for (const card of cardsForObject(this.game, objectId)) {
      stack.append(h('div', { class: 'stack-card' }, this.faceEl(card)));
    }
    return stack;
  }

  private setState(card: Card): void {
    const el = this.cardEls.get(card.id)!;
    el.classList.remove('down', 'up', 'matched');
    el.classList.add(card.state);
    el.setAttribute('aria-label', card.state === 'down' ? 'Card' : OBJECTS[card.objectId].name);
  }

  private async tapCard(id: string): Promise<void> {
    if (this.busy || !this.alive) return;
    const result = flipCard(this.game, id);
    if (result === 'ignored') return;
    const card = this.game.cards.find((c) => c.id === id)!;
    this.setState(card);
    this.sound.flip();
    this.store.setCurrent(this.game);
    if (result === 'first') return;

    this.busy = true;
    const pair = this.game.flipped.map((fid) => this.game.cards.find((c) => c.id === fid)!);
    if (result === 'match') {
      await wait(T.flip + T.lookAtMatch);
      if (!this.alive) return;
      this.sound.match();
      pair.forEach((c) => this.cardEls.get(c.id)!.classList.add('celebrate'));
      await wait(T.celebrate);
      if (!this.alive) return;
      const objectId = settle(this.game)!;
      pair.forEach((c) => this.setState(c));
      this.sound.say(OBJECTS[objectId].name);
      this.store.setCurrent(this.game);
      await this.flyToTray(pair, objectId);
      if (!this.alive) return;
      if (isWon(this.game)) {
        this.store.recordWin(this.game);
        await this.celebrateWin();
      }
    } else {
      await wait(T.flip + T.lookAtMismatch);
      if (!this.alive) return;
      this.sound.mismatch();
      settle(this.game);
      pair.forEach((c) => this.setState(c));
      this.store.setCurrent(this.game);
      await wait(T.flip);
    }
    this.busy = false;
  }

  private async flyToTray(pair: Card[], objectId: ObjectId): Promise<void> {
    const slot = this.slots[this.game.matched.length - 1];
    const stack = this.stackEl(objectId);
    stack.style.visibility = 'hidden';
    slot.append(stack);
    const targets = [...stack.children].map((c) => c.getBoundingClientRect());

    const flights = pair.map((card, i) => {
      const el = this.cardEls.get(card.id)!;
      const from = el.getBoundingClientRect();
      const to = targets[i];
      const ghost = this.faceEl(card);
      ghost.classList.add('flying');
      Object.assign(ghost.style, {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
      });
      ghost.style.setProperty('--card-w', `${from.width}px`);
      document.body.append(ghost);
      el.classList.remove('celebrate');
      el.classList.add('gone');
      const dx = to.left - from.left;
      const dy = to.top - from.top;
      const s = to.width / from.width;
      const anim = ghost.animate(
        [
          { transform: 'translate(0,0) scale(1) rotate(0deg)' },
          {
            transform: `translate(${dx * 0.45}px, ${dy * 0.45 - from.height * 0.35}px) scale(${(1 + s) / 2 + 0.15}) rotate(${i ? 8 : -8}deg)`,
            offset: 0.45,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(${i ? 4 : -3}deg)` },
        ],
        {
          duration: reducedMotion() ? 1 : T.fly,
          delay: i * 120,
          easing: 'cubic-bezier(.45,.05,.35,1)',
          fill: 'forwards',
        },
      );
      return anim.finished.finally(() => ghost.remove());
    });
    await Promise.all(flights);
    stack.style.visibility = '';
    stack.classList.add('landed');
  }

  private async celebrateWin(): Promise<void> {
    await wait(500);
    if (!this.alive) return;
    this.sound.win();
    this.sound.say('Well done!');
    const overlay = h('div', { class: 'win' });
    const stars = h('div', { class: 'stars' });
    for (let i = 0; i < 28; i++) {
      const s = h('span', {
        class: 'falling-star',
        style: `--x:${Math.random() * 100}vw;--d:${2.5 + Math.random() * 2.5}s;--delay:${Math.random() * 2}s;--hue:${Math.floor(Math.random() * 360)}`,
      });
      s.innerHTML = ICONS.star;
      stars.append(s);
    }
    const dancers = h('div', { class: 'dancers' });
    this.game.matched.forEach((id, i) => {
      const d = h('div', { class: 'dancer', style: `--i:${i}` }, this.stackEl(id));
      dancers.append(d);
    });
    const buttons = h('div', { class: 'win-buttons' });
    const again = h('button', { class: 'big-btn again', 'aria-label': 'Play again' });
    again.innerHTML = ICONS.replay;
    const home = h('button', { class: 'big-btn home', 'aria-label': 'Main menu' });
    home.innerHTML = ICONS.home;
    onTap(again, () => {
      this.sound.tap();
      this.actions.replay();
    });
    onTap(home, () => {
      this.sound.tap();
      this.actions.home();
    });
    buttons.append(again, home);
    overlay.append(stars, dancers, buttons);
    this.el.append(overlay);
    this.tray.classList.add('emptied');
    await wait(T.winButtons);
    if (this.alive) buttons.classList.add('shown');
  }
}

function preloadPhotos(): Promise<unknown> {
  const loads = PHOTOS.map(
    (p) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = photoUrl(p.file);
      }),
  );
  // Don't hold the splash forever on a slow first load.
  return Promise.race([Promise.all(loads), wait(6000)]);
}

function requestFullscreen(): void {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) {
    return;
  }
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  try {
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  } catch {
    // Not supported; play in the browser window.
  }
}

function contentSize(el: HTMLElement): { width: number; height: number } {
  const cs = getComputedStyle(el);
  const px = (v: string) => parseFloat(v) || 0;
  return {
    width: el.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight),
    height: el.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
