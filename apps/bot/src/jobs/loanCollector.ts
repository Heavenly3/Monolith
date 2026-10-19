import type { Client } from 'discord.js';
import { accounts, loans, logger } from '@spacebet/core';
import { translatorFor } from '../framework/context.ts';
import { Card, coins, emojis } from '../ui/index.ts';

const log = logger.child('loans');

/** Collects overdue loans and tells each member by DM, in their language. */
export async function collectLoans(client: Client<true>): Promise<void> {
  for (const loan of loans.collectOverdue()) {
    log.info(
      `Collected loan of ${loan.amountDue} from ${loan.userId} in ${loan.guildId} (shortfall ${loan.shortfall}).`,
    );

    const t = translatorFor(loan.guildId, accounts.getProfile(loan.userId)?.locale);
    const card = new Card(loan.shortfall > 0 ? 'danger' : 'loans')
      .header(`${emojis.loan} ${t('loans.collectedTitle')}`, t('loans.collectedBody'))
      .divider()
      .fields([
        { name: `${emojis.bill} ${t('loans.collectedAmount')}`, value: coins(loan.amountDue) },
        loan.shortfall > 0 && {
          name: `${emojis.warning} ${t('loans.debtLeft')}`,
          value: t('loans.debtLeftValue', { amount: coins(loan.shortfall) }),
        },
      ])
      .footer(client.guilds.cache.get(loan.guildId)?.name ?? t('features.loans'));

    try {
      const user = await client.users.fetch(loan.userId);
      await user.send(card.toChannelMessage());
    } catch {
      // DMs closed — the collection itself already happened.
    }
  }
}
