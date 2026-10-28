import { OBJECT_IDS, type ObjectId } from './objects';

export type DeckMode = 'cartoon' | 'photo';
export type GameSize = 4 | 8 | 12;
export const GAME_SIZES: readonly GameSize[] = [4, 8, 12];

export type CardState = 'down' | 'up' | 'matched';

export interface Card {
  id: string;
  objectId: ObjectId;
  /** Which picture to show: a cartoon id or a photo file name. */
  image: string;
  state: CardState;
}

export interface GameState {
  size: GameSize;
  mode: DeckMode;
  cards: Card[];
  /** Ids of face-up cards that have not been resolved yet (0–2). */
  flipped: string[];
  /** Objects in the order they were matched. */
  matched: ObjectId[];
  flips: number;
  startedAt: number;
}

export type Rng = () => number;

/** Pictures available per object for photo mode. */
export type PhotoLibrary = Partial<Record<ObjectId, string[]>>;

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Objects that can be used for the given mode. */
export function playableObjects(mode: DeckMode, photos: PhotoLibrary): ObjectId[] {
  if (mode === 'cartoon') return [...OBJECT_IDS];
  return OBJECT_IDS.filter((id) => (photos[id]?.length ?? 0) >= 2);
}

export function canPlay(mode: DeckMode, size: GameSize, photos: PhotoLibrary): boolean {
  return playableObjects(mode, photos).length >= size / 2;
}

export function createGame(
  size: GameSize,
  mode: DeckMode,
  photos: PhotoLibrary,
  rng: Rng = Math.random,
  now: number = Date.now(),
): GameState {
  const pool = playableObjects(mode, photos);
  const pairs = size / 2;
  if (pool.length < pairs) {
    throw new Error(`Not enough ${mode} pictures for ${size} cards`);
  }
  const chosen = shuffle(pool, rng).slice(0, pairs);
  const cards: Card[] = [];
  for (const objectId of chosen) {
    // Photo pairs use two different pictures of the same object.
    const images =
      mode === 'photo' ? shuffle(photos[objectId]!, rng).slice(0, 2) : [objectId, objectId];
    images.forEach((image, i) => {
      cards.push({ id: `${objectId}-${i}`, objectId, image, state: 'down' });
    });
  }
  return {
    size,
    mode,
    cards: shuffle(cards, rng),
    flipped: [],
    matched: [],
    flips: 0,
    startedAt: now,
  };
}

export type FlipResult = 'ignored' | 'first' | 'match' | 'mismatch';

/**
 * Turn a card face up. Returns the outcome without resolving a pair;
 * call `settle` once the player has had time to see both cards.
 */
export function flipCard(game: GameState, cardId: string): FlipResult {
  if (game.flipped.length >= 2) return 'ignored';
  const card = game.cards.find((c) => c.id === cardId);
  if (!card || card.state !== 'down') return 'ignored';
  card.state = 'up';
  game.flipped.push(card.id);
  game.flips++;
  if (game.flipped.length === 1) return 'first';
  const [a, b] = game.flipped.map((id) => game.cards.find((c) => c.id === id)!);
  return a.objectId === b.objectId ? 'match' : 'mismatch';
}

/** Resolve the two face-up cards: keep a match, turn a mismatch back down. */
export function settle(game: GameState): ObjectId | null {
  if (game.flipped.length < 2) return null;
  const pair = game.flipped.map((id) => game.cards.find((c) => c.id === id)!);
  game.flipped = [];
  if (pair[0].objectId === pair[1].objectId) {
    pair.forEach((c) => (c.state = 'matched'));
    game.matched.push(pair[0].objectId);
    return pair[0].objectId;
  }
  pair.forEach((c) => (c.state = 'down'));
  return null;
}

export function isWon(game: GameState): boolean {
  return game.cards.every((c) => c.state === 'matched');
}

/** Make a saved game safe to continue: settle anything left mid-turn. */
export function restoreGame(game: GameState): GameState {
  if (game.flipped.length === 2) settle(game);
  for (const c of game.cards) if (c.state === 'up') c.state = 'down';
  game.flipped = [];
  return game;
}

export function cardsForObject(game: GameState, objectId: ObjectId): Card[] {
  return game.cards.filter((c) => c.objectId === objectId);
}
