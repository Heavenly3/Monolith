import { bets, type BetResult, type GameName, type Settlement } from '@monolith/core';
import type { Translator } from '@monolith/i18n';
import * as ui from '../ui/index.ts';
import { emojis, coins } from '../ui/index.ts';

/** Turns a failed bet into the message shown to the player. */
export function betError(
  t: Translator,
  game: GameName,
  result: Exclude<BetResult, { ok: true }>,
): ui.CardMessage {
  switch (result.reason) {
    case 'cooldown':
      return ui.cooldown(
        t,
        result.remainingMs,
        t('games.action', { game: `**${t(`features.${game}`)}**` }),
      );
    case 'minWallet':
      return ui.error(
        t('games.minWallet', {
          min: coins(result.min),
          wallet: coins(result.wallet),
        }),
      );
    case 'funds':
      return ui.error(t('common.notEnoughWallet', { amount: coins(result.wallet) }));
    case 'invalid':
      return ui.error(t('games.invalidBet'));
    case 'minBet':
      return ui.error(t('games.minBet', { min: coins(result.min) }));
    case 'maxBet':
      return ui.error(t('games.maxBet', { max: coins(result.max) }));
  }
}

export const placeBet = bets.placeBet;
export const settle = bets.settle;

/** Accent colour of a finished game. */
export function outcomeColor(net: number): 'success' | 'warning' | 'danger' {
  if (net > 0) return 'success';
  return net === 0 ? 'warning' : 'danger';
}

/** Standard result block shared by every game. */
export function resultText(t: Translator, { stake, payout, net, wallet }: Settlement): string {
  const outcome =
    net > 0
      ? `${emojis.up} **${t('games.won', { amount: coins(net) })}**`
      : net === 0
        ? `${emojis.refund} **${t('games.refund')}**`
        : `${emojis.down} **${t('games.lost', { amount: coins(-net) })}**`;
  return [
    outcome,
    `${emojis.bet} ${t('games.bet')} · ${coins(stake)}`,
    `${emojis.money} ${t('games.payout')} · ${coins(payout)}`,
    `${emojis.wallet} ${t('common.wallet')} · ${coins(wallet)}`,
  ].join('\n');
}
