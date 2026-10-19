import { InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { RAFFLE, accounts, formatDuration, formatNumber, raffle, settings } from '@mythcore/core';
import { defineCommand } from '../../framework/types.ts';
import * as ui from '../../ui/index.ts';
import { coins, emojis, relativeTime, ticket } from '../../ui/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('lottery')
    .setDescription('Lottery: buy a numbered ticket and win the prize.')
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName('buy')
        .setDescription('Buy a ticket with a number from 000 to 999.')
        .addIntegerOption((option) =>
          option
            .setName('number')
            .setDescription('Your lucky number (0-999)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(RAFFLE.maxNumber),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('info').setDescription('See the current pot, draw time and your tickets.'),
    ),

  async execute(interaction, { t, guildId }) {
    const { user } = interaction;
    accounts.getAccount(guildId, user);

    if (interaction.options.getSubcommand() === 'buy') {
      const number = interaction.options.getInteger('number', true);
      const result = raffle.buyTicket(guildId, user.id, number, interaction.channelId);

      if (!result.ok) {
        return interaction.reply(
          result.reason === 'duplicate'
            ? ui.error(t('raffle.duplicate', { number: ticket(number) }))
            : ui.error(t('raffle.funds', { price: coins(result.price) })),
        );
      }

      const card = new ui.Card('raffle')
        .header(
          `${emojis.ticket} ${t('raffle.boughtTitle')}`,
          t('raffle.boughtBody', { number: `**${ticket(number)}**`, price: coins(result.price) }),
        )
        .divider()
        .stats([
          { name: `${emojis.money} ${t('raffle.pot')}`, value: coins(result.round.pot) },
          {
            name: `${emojis.clock} ${t('raffle.draw')}`,
            value: result.round.drawAt ? relativeTime(result.round.drawAt) : '—',
          },
          {
            name: `${emojis.ticket} ${t('raffle.yourTickets')}`,
            value: raffle.ticketsOf(guildId, user.id).map(ticket).join(', '),
          },
        ])
        .footer(t('raffle.announce'));
      return interaction.reply(card.toMessage());
    }

    const round = raffle.getRound(guildId);
    const mine = raffle.ticketsOf(guildId, user.id);
    const card = new ui.Card('raffle')
      .header(ui.featureTitle(t, 'raffle'), t('raffle.infoSubtitle'))
      .divider()
      .stats([
        { name: `${emojis.money} ${t('raffle.pot')}`, value: coins(round.pot) },
        {
          name: `${emojis.ticket} ${t('raffle.ticketPrice')}`,
          value: coins(settings.get(guildId, 'raffle.ticketPrice')),
        },
        {
          name: `${emojis.bill} ${t('raffle.sold')}`,
          value: formatNumber(raffle.ticketCount(guildId)),
        },
        {
          name: `${emojis.clock} ${t('raffle.draw')}`,
          value: round.drawAt
            ? relativeTime(round.drawAt)
            : t('raffle.afterFirst', {
                duration: formatDuration(settings.get(guildId, 'raffle.drawDelay')),
              }),
        },
        {
          name: `${emojis.raffle} ${t('raffle.yourTickets')}`,
          value: mine.length ? mine.map(ticket).join(', ') : t('common.none'),
        },
      ])
      .footer();
    return interaction.reply(card.toMessage());
  },
});
