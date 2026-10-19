import { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../framework/types.ts';
import { selectedValue } from '../../framework/respond.ts';
import * as panel from '../../panels/config/index.ts';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Open the Mission Control panel to manage the whole bot.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction, { t, guildId }) {
    return interaction.reply(
      panel.render(t, { guildId, guild: interaction.guild }, null).toMessage({ ephemeral: true }),
    );
  },

  // Buttons, menus and forms of the panel. Admin-only: the router checks permissions.
  components: {
    async view(interaction, _args, { t, guildId }) {
      if (!interaction.isStringSelectMenu()) return;
      return interaction.update(
        panel
          .render(t, { guildId, guild: interaction.guild }, selectedValue(interaction) ?? null)
          .toEdit(),
      );
    },

    async act(interaction, args, { t }) {
      return panel.handle(interaction, args, t);
    },
  },
});
