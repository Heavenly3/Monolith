import { afterEach, describe, expect, it } from 'vitest';
import { EMOJI_NAMES, emojis, reelEmojis, registerApplicationEmojis } from '../src/ui/emojis.ts';
import { ICONS } from '../src/ui/icons.ts';

afterEach(() => registerApplicationEmojis([]));

describe('custom icons', () => {
  it('falls back to Unicode until icons are uploaded', () => {
    expect(emojis.coin).toBe('🪙');
    expect(reelEmojis.dragon).toBe('🐉');
  });

  it('uses uploaded application emojis named mc_<name>', () => {
    const count = registerApplicationEmojis([
      { id: '1', name: 'mc_coin', animated: false },
      { id: '2', name: 'mc_reel_dragon', animated: false },
      { id: '3', name: 'someone_else', animated: false },
    ]);
    expect(count).toBe(2);
    expect(emojis.coin).toBe('<:mc_coin:1>');
    expect(reelEmojis.dragon).toBe('<:mc_reel_dragon:2>');
    expect(emojis.bank).toBe('🗝️');
  });

  it('every icon in the set maps to a known emoji', () => {
    for (const key of Object.keys(ICONS)) {
      expect(key.startsWith('reel_') || (EMOJI_NAMES as string[]).includes(key), key).toBe(true);
      // Discord emoji names: 2-32 characters, letters, numbers and underscores.
      expect(`mc_${key}`).toMatch(/^\w{2,32}$/);
    }
  });
});
