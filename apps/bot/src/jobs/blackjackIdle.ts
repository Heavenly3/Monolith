import { blackjack, logger } from '@monolith/core';

const log = logger.child('blackjack');

/** Stands blackjack hands left without a move, so no stake stays locked. */
export function standIdleHands(): void {
  const finished = blackjack.expire();
  if (finished.length) log.info(`Stood ${finished.length} idle blackjack hand(s).`);
}
