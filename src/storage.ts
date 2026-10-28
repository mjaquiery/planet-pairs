import type { DeckMode, GameSize, GameState } from './game';
import type { ObjectId } from './objects';

const KEY = 'planet-pairs:v1';
const MAX_HISTORY = 200;

export interface RunRecord {
  size: GameSize;
  mode: DeckMode;
  objects: ObjectId[];
  flips: number;
  startedAt: number;
  finishedAt: number;
}

export interface SavedData {
  version: 1;
  settings: { muted: boolean };
  /** A game in progress, kept so play can resume after a reload. */
  current: GameState | null;
  history: RunRecord[];
}

export function emptyData(): SavedData {
  return { version: 1, settings: { muted: false }, current: null, history: [] };
}

function isSavedData(value: unknown): value is SavedData {
  const v = value as SavedData;
  return (
    !!v &&
    v.version === 1 &&
    typeof v.settings === 'object' &&
    Array.isArray(v.history) &&
    (v.current === null || Array.isArray(v.current?.cards))
  );
}

export class Store {
  data: SavedData;

  constructor(private readonly storage: Storage | null = safeLocalStorage()) {
    this.data = this.load();
  }

  private load(): SavedData {
    try {
      const raw = this.storage?.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isSavedData(parsed)) return parsed;
      }
    } catch {
      // Unreadable or blocked storage: start fresh.
    }
    return emptyData();
  }

  save(): void {
    try {
      this.storage?.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // Storage full or unavailable; the game still works without it.
    }
  }

  setCurrent(game: GameState | null): void {
    this.data.current = game;
    this.save();
  }

  recordWin(game: GameState, now: number = Date.now()): void {
    this.data.history.push({
      size: game.size,
      mode: game.mode,
      objects: [...game.matched],
      flips: game.flips,
      startedAt: game.startedAt,
      finishedAt: now,
    });
    if (this.data.history.length > MAX_HISTORY) {
      this.data.history.splice(0, this.data.history.length - MAX_HISTORY);
    }
    this.data.current = null;
    this.save();
  }

  setMuted(muted: boolean): void {
    this.data.settings.muted = muted;
    this.save();
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
