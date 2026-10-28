import { beforeEach, describe, expect, it } from 'vitest';
import { createGame, flipCard } from '../src/game';
import { Store } from '../src/storage';

describe('Store', () => {
  beforeEach(() => localStorage.clear());

  it('saves and reloads a game in progress', () => {
    const store = new Store(localStorage);
    const game = createGame(8, 'cartoon', {});
    flipCard(game, game.cards[0].id);
    store.setCurrent(game);
    const reloaded = new Store(localStorage);
    expect(reloaded.data.current?.cards).toEqual(game.cards);
  });

  it('records wins and clears the current game', () => {
    const store = new Store(localStorage);
    const game = createGame(4, 'cartoon', {});
    store.setCurrent(game);
    store.recordWin(game, 123);
    const reloaded = new Store(localStorage);
    expect(reloaded.data.current).toBeNull();
    expect(reloaded.data.history).toHaveLength(1);
    expect(reloaded.data.history[0]).toMatchObject({ size: 4, mode: 'cartoon', finishedAt: 123 });
  });

  it('ignores corrupt data', () => {
    localStorage.setItem('planet-pairs:v1', '{not json');
    expect(new Store(localStorage).data.history).toEqual([]);
  });

  it('remembers the mute setting', () => {
    new Store(localStorage).setMuted(true);
    expect(new Store(localStorage).data.settings.muted).toBe(true);
  });
});
