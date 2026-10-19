import { categoryLines, editButton, resetButton } from '../shared.ts';
import type { Section } from '../types.ts';

export const games: Section = {
  icon: 'slots',
  color: 'slots',

  render: (t, { guildId }) => ({
    blocks: [categoryLines(guildId, 'games', t)],
    rows: [[editButton(t, 'games'), resetButton(t, 'games')]],
  }),
};
