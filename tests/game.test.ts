import { describe, expect, it } from 'vitest';
import {
  canPlay,
  createGame,
  flipCard,
  isWon,
  playableObjects,
  restoreGame,
  settle,
  type GameState,
  type PhotoLibrary,
} from '../src/game';
import { OBJECT_IDS } from '../src/objects';

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const photos: PhotoLibrary = Object.fromEntries(
  OBJECT_IDS.map((id) => [id, [`${id}-a.jpg`, `${id}-b.jpg`, `${id}-c.jpg`]]),
);

function pairOf(game: GameState, cardId: string) {
  const card = game.cards.find((c) => c.id === cardId)!;
  return game.cards.find((c) => c.objectId === card.objectId && c.id !== cardId)!;
}

describe('createGame', () => {
  it.each([4, 8, 12] as const)('deals %i cards as pairs of distinct objects', (size) => {
    const game = createGame(size, 'cartoon', {}, seeded());
    expect(game.cards).toHaveLength(size);
    const counts = new Map<string, number>();
    for (const c of game.cards) counts.set(c.objectId, (counts.get(c.objectId) ?? 0) + 1);
    expect(counts.size).toBe(size / 2);
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    expect(new Set(game.cards.map((c) => c.id)).size).toBe(size);
    expect(game.cards.every((c) => c.state === 'down')).toBe(true);
  });

  it('uses two different photos of the same object in photo mode', () => {
    const game = createGame(12, 'photo', photos, seeded(7));
    for (const card of game.cards) {
      const twin = pairOf(game, card.id);
      expect(twin.image).not.toBe(card.image);
      expect(card.image.startsWith(card.objectId)).toBe(true);
    }
  });

  it('only uses objects with at least two photos', () => {
    const sparse: PhotoLibrary = { sun: ['a', 'b'], moon: ['c', 'd'], mars: ['e'] };
    expect(playableObjects('photo', sparse)).toEqual(['sun', 'moon']);
    expect(canPlay('photo', 4, sparse)).toBe(true);
    expect(canPlay('photo', 8, sparse)).toBe(false);
    expect(() => createGame(8, 'photo', sparse)).toThrow();
  });

  it('shuffles differently with different seeds', () => {
    const a = createGame(12, 'cartoon', {}, seeded(1)).cards.map((c) => c.id);
    const b = createGame(12, 'cartoon', {}, seeded(99)).cards.map((c) => c.id);
    expect(a).not.toEqual(b);
  });
});

describe('turns', () => {
  it('keeps a matching pair', () => {
    const game = createGame(4, 'cartoon', {}, seeded());
    const first = game.cards[0];
    expect(flipCard(game, first.id)).toBe('first');
    expect(flipCard(game, pairOf(game, first.id).id)).toBe('match');
    expect(settle(game)).toBe(first.objectId);
    expect(game.matched).toEqual([first.objectId]);
    expect(game.cards.filter((c) => c.state === 'matched')).toHaveLength(2);
  });

  it('turns a mismatch back face down', () => {
    const game = createGame(4, 'cartoon', {}, seeded());
    const first = game.cards[0];
    const other = game.cards.find((c) => c.objectId !== first.objectId)!;
    flipCard(game, first.id);
    expect(flipCard(game, other.id)).toBe('mismatch');
    expect(settle(game)).toBeNull();
    expect(game.cards.every((c) => c.state === 'down')).toBe(true);
    expect(game.flips).toBe(2);
  });

  it('ignores taps on face-up cards and a third card', () => {
    const game = createGame(8, 'cartoon', {}, seeded());
    const [a, b, c] = game.cards;
    flipCard(game, a.id);
    expect(flipCard(game, a.id)).toBe('ignored');
    flipCard(game, b.id);
    expect(flipCard(game, c.id)).toBe('ignored');
    expect(game.flips).toBe(2);
  });

  it('is won once every pair is matched', () => {
    const game = createGame(8, 'cartoon', {}, seeded());
    while (!isWon(game)) {
      const card = game.cards.find((c) => c.state === 'down')!;
      flipCard(game, card.id);
      flipCard(game, pairOf(game, card.id).id);
      settle(game);
    }
    expect(game.matched).toHaveLength(4);
  });
});

describe('restoreGame', () => {
  it('settles a half-finished turn so play can resume', () => {
    const game = createGame(4, 'cartoon', {}, seeded());
    const first = game.cards[0];
    flipCard(game, first.id);
    flipCard(game, pairOf(game, first.id).id);
    const restored = restoreGame(JSON.parse(JSON.stringify(game)));
    expect(restored.flipped).toEqual([]);
    expect(restored.matched).toEqual([first.objectId]);

    const single = createGame(4, 'cartoon', {}, seeded());
    flipCard(single, single.cards[0].id);
    expect(restoreGame(single).cards.every((c) => c.state === 'down')).toBe(true);
  });
});
