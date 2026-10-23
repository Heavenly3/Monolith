import { afterEach, describe, expect, it } from 'vitest';
import { EMOJI_NAMES, emojis, reelEmojis, registerApplicationEmojis } from '../src/ui/emojis.ts';
import { ICONS } from '../src/ui/icons.ts';

afterEach(() => registerApplicationEmojis([]));

describe('custom icons', () => {
  it('falls back to Unicode until icons are uploaded', () => {
    expect(emojis.coin).toBe('💠');
    expect(reelEmojis.monolith).toBe('⬛');
  });

  it('uses uploaded application emojis named mn_<name>', () => {
    const count = registerApplicationEmojis([
      { id: '1', name: 'mn_coin', animated: false },
      { id: '2', name: 'mn_reel_monolith', animated: false },
      { id: '3', name: 'someone_else', animated: false },
    ]);
    expect(count).toBe(2);
    expect(emojis.coin).toBe('<:mn_coin:1>');
    expect(reelEmojis.monolith).toBe('<:mn_reel_monolith:2>');
    expect(emojis.bank).toBe('🏦');
  });

  it('every icon in the set maps to a known emoji', () => {
    for (const key of Object.keys(ICONS)) {
      expect(key.startsWith('reel_') || (EMOJI_NAMES as string[]).includes(key), key).toBe(true);
      // Discord emoji names: 2-32 characters, letters, numbers and underscores.
      expect(`mn_${key}`).toMatch(/^\w{2,32}$/);
    }
  });
});
