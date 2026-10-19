// Minimal fakes of discord.js interactions, enough to drive the real router
// (events/interactionCreate.ts) without a Discord connection.
import { Collection, MessageFlags, PermissionsBitField } from 'discord.js';
import type { LoadedCommand } from '../src/framework/types.ts';

export interface FakeUser {
  id: string;
  username: string;
  bot: boolean;
  toString(): string;
  displayAvatarURL(): string;
}

export const makeUser = (id: string, username: string): FakeUser => ({
  id,
  username,
  bot: false,
  toString: () => `<@${id}>`,
  displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
});

export const role = {
  id: '900',
  name: 'VIP',
  toString: () => '<@&900>',
  editable: true,
  managed: false,
};

export interface Recorder {
  payloads: { label: string; text: string; json: unknown[] }[];
  errors: string[];
}

const UNTRANSLATED =
  /\b(common|features|balance|bank|pay|work|collect|wheel|rob|leaderboard|games|slots|roulette|horserace|keno|raffle|loans|shop|use|inventory|moneyAdmin|incomeAdmin|wheelAdmin|workAdmin|shopAdmin|loansAdmin|config|panel|help)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;

type Node = {
  content?: string;
  label?: string;
  placeholder?: string;
  components?: Node[];
  accessory?: Node;
  options?: Node[];
  description?: string;
};
const textOf = (node: Node): string[] => [
  node.content ?? '',
  node.label ?? '',
  node.placeholder ?? '',
  node.description ?? '',
  ...(node.components ?? []).flatMap(textOf),
  ...(node.accessory ? textOf(node.accessory) : []),
  ...(node.options ?? []).flatMap(textOf),
];
const countOf = (node: Node): number =>
  1 +
  (node.components ?? []).reduce((sum, child) => sum + countOf(child), 0) +
  (node.accessory ? 1 : 0);

export function createHarness(commands: Map<string, LoadedCommand>, guildId: string) {
  const recorder: Recorder = { payloads: [], errors: [] };
  const roles = new Collection<string, typeof role>([[role.id, role]]);
  const memberRoles = new Collection<string, typeof role>([[role.id, role]]);
  const guild = { id: guildId, roles: { cache: roles }, preferredLocale: 'en-US' };
  const client = { commands, user: { ...makeUser('bot', 'bot'), setActivity: () => {} } };
  let label = '';

  function record(payload: {
    components?: { toJSON?: () => unknown }[];
    flags?: number;
    content?: string;
  }) {
    if (
      payload.flags !== undefined &&
      payload.flags & MessageFlags.IsComponentsV2 &&
      payload.content
    ) {
      recorder.errors.push(`${label}: Components V2 message with content`);
    }
    const json = (payload.components ?? []).map((c) => (c.toJSON ? c.toJSON() : c)) as Node[];
    const text = json.flatMap(textOf).join('\n');
    for (const node of json) {
      if (countOf(node) > 40) recorder.errors.push(`${label}: more than 40 components`);
    }
    if (/Reference: `|Referencia: `/.test(text)) recorder.errors.push(`${label}: handler error`);
    const key = text.match(UNTRANSLATED);
    if (key) recorder.errors.push(`${label}: untranslated key ${key[0]}`);
    // Placeholders left unfilled ({amount} is legit: job message templates show it to admins).
    const placeholder = text.match(/\{(?!amount\})[a-zA-Z]+\}/);
    if (placeholder) recorder.errors.push(`${label}: unfilled placeholder ${placeholder[0]}`);
    recorder.payloads.push({ label, text, json });
  }

  function base(user: FakeUser, locale: string, admin: boolean) {
    const state = { replied: false };
    return {
      user,
      member: {
        id: user.id,
        user,
        guild,
        roles: { cache: memberRoles, add: async (r: typeof role) => memberRoles.set(r.id, r) },
      },
      guild,
      guildId,
      channelId: 'channel-1',
      client,
      locale,
      memberPermissions: new PermissionsBitField(
        admin ? PermissionsBitField.Flags.Administrator : 0n,
      ),
      get replied() {
        return state.replied;
      },
      deferred: false,
      responded: false,
      inCachedGuild: () => true,
      isRepliable: () => true,
      isAutocomplete: () => false,
      isChatInputCommand: () => false,
      isMessageComponent: () => false,
      isModalSubmit: () => false,
      isButton: () => false,
      isStringSelectMenu: () => false,
      isAnySelectMenu: () => false,
      isFromMessage: () => true,
      reply: async (payload: never) => {
        state.replied = true;
        record(payload);
      },
      editReply: async (payload: never) => record(payload),
      followUp: async (payload: never) => record(payload),
      update: async (payload: never) => record(payload),
      showModal: async (modal: { toJSON(): unknown }) => {
        modal.toJSON();
        recorder.payloads.push({ label, text: '', json: [] });
      },
      respond: async (choices: { name: string }[]) => {
        if (choices.length > 25) recorder.errors.push(`${label}: more than 25 choices`);
        if (choices.some((c) => c.name.length > 100))
          recorder.errors.push(`${label}: choice too long`);
      },
    };
  }

  type Options = Record<string, unknown>;
  const optionsOf = (sub: string | undefined, opts: Options, focused = '') => {
    const get = (name: string, required?: boolean) => {
      if (name in opts) return opts[name];
      if (required) throw new Error(`Missing required option ${name}`);
      return null;
    };
    return {
      getSubcommand: () => sub,
      getString: get,
      getInteger: get,
      getUser: get,
      getRole: get,
      getBoolean: get,
      getFocused: () => focused,
    };
  };

  return {
    recorder,
    memberRoles,
    async command(
      router: (i: unknown) => Promise<unknown>,
      name: string,
      {
        sub,
        opts = {},
        user,
        locale = 'en-US',
        admin = true,
      }: { sub?: string; opts?: Options; user: FakeUser; locale?: string; admin?: boolean },
    ) {
      label = `[${locale}] /${name} ${sub ?? ''}`.trim();
      await router({
        ...base(user, locale, admin),
        commandName: name,
        isChatInputCommand: () => true,
        options: optionsOf(sub, opts),
      });
    },
    async autocomplete(
      router: (i: unknown) => Promise<unknown>,
      name: string,
      {
        user,
        focused = '',
        locale = 'en-US',
      }: { user: FakeUser; focused?: string; locale?: string },
    ) {
      label = `[${locale}] autocomplete /${name}`;
      await router({
        ...base(user, locale, true),
        commandName: name,
        isAutocomplete: () => true,
        options: optionsOf(undefined, {}, focused),
      });
    },
    async component(
      router: (i: unknown) => Promise<unknown>,
      customId: string,
      {
        user,
        values,
        fields,
        locale = 'en-US',
        admin = true,
      }: {
        user: FakeUser;
        values?: string[];
        fields?: Record<string, unknown>;
        locale?: string;
        admin?: boolean;
      },
    ) {
      label = `[${locale}] ${customId}`;
      const isModal = Boolean(fields);
      const interaction = {
        ...base(user, locale, admin),
        customId,
        values,
        isMessageComponent: () => !isModal,
        isModalSubmit: () => isModal,
        isButton: () => !isModal && !values,
        isStringSelectMenu: () => Boolean(values),
        isAnySelectMenu: () => Boolean(values),
        fields: fields && {
          getTextInputValue: (id: string) => (fields[id] as string | undefined) ?? '',
          getStringSelectValues: (id: string) => (fields[id] as string[] | undefined) ?? [],
          getSelectedUsers: (id: string) =>
            fields[id] ? new Collection((fields[id] as FakeUser[]).map((u) => [u.id, u])) : null,
          getSelectedRoles: (id: string) =>
            fields[id]
              ? new Collection((fields[id] as (typeof role)[]).map((r) => [r.id, r]))
              : null,
        },
      };
      await router(interaction);
    },
  };
}
