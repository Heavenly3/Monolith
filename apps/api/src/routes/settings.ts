// Settings of a server: the same categories and validation as /config.
import {
  SETTING_CATEGORIES,
  audit,
  isSettingCategory,
  settings,
  settingsForm,
  wheel,
  work,
  type SettingField,
} from '@mythcore/core';
import { LOCALES, isLanguage } from '@mythcore/i18n';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { HttpError, indexParam } from '../http.ts';
import { scope } from './scope.ts';

function fieldValue(guildId: string, field: SettingField): unknown {
  const value = settings.get(guildId, field.key);
  return field.path ? (value as Record<string, unknown>)[field.path] : value;
}

/** Built-in job messages in the language the dashboard is shown in. */
function builtInJobs(request: FastifyRequest): string[] {
  const { lang } = request.query as { lang?: string };
  return [...LOCALES[lang && isLanguage(lang) ? lang : 'en'].work.defaultMessages];
}

function categoryOf(request: FastifyRequest) {
  const { category } = request.params as { category: string };
  if (!isSettingCategory(category)) throw new HttpError(404, 'unknown_category');
  return category;
}

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/settings', async (request) => {
    const { guild } = scope(request);
    return {
      categories: Object.entries(SETTING_CATEGORIES).map(([id, category]) => ({
        id,
        fields: (category.fields as SettingField[]).map((field) => ({
          id: field.id,
          type: field.type,
          min: field.min ?? null,
          value: fieldValue(guild.id, field),
          custom: settings.isCustom(guild.id, field.key),
        })),
      })),
    };
  });

  app.put(
    '/settings/:category',
    {
      schema: {
        body: {
          type: 'object',
          required: ['values'],
          properties: {
            values: {
              type: 'object',
              additionalProperties: { type: ['string', 'number'] },
            },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const category = categoryOf(request);
      const { values } = request.body as { values: Record<string, string | number> };
      const result = settingsForm.applyForm(guild.id, category, (id) => String(values[id] ?? ''));
      if (!result.ok) {
        throw result.reason === 'invalid'
          ? new HttpError(422, 'invalid_value', { field: result.field.id })
          : new HttpError(422, 'invalid_rule', { messageKey: result.messageKey });
      }
      audit.record(guild.id, viewer.session.userId, `settings.${category}.save`, {
        source: 'web',
        values,
      });
      return { ok: true, changed: result.changed };
    },
  );

  app.post('/settings/:category/reset', async (request) => {
    const { guild, viewer } = scope(request);
    const category = categoryOf(request);
    settingsForm.resetCategory(guild.id, category);
    audit.record(guild.id, viewer.session.userId, `settings.${category}.reset`, { source: 'web' });
    return { ok: true };
  });

  // Jobs of /work
  app.get('/work/messages', async (request) => {
    const { guild } = scope(request);
    return {
      builtIn: work.usesBuiltIn(guild.id),
      max: work.MAX_MESSAGES,
      messages: work.getMessages(guild.id, builtInJobs(request)),
    };
  });

  app.post(
    '/work/messages',
    {
      schema: {
        body: {
          type: 'object',
          required: ['message'],
          properties: { message: { type: 'string', minLength: 1, maxLength: 300 } },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const { message } = request.body as { message: string };
      if (!message.includes('{amount}')) throw new HttpError(422, 'missing_amount');
      if (work.addMessage(guild.id, message, builtInJobs(request)) === 'full') {
        throw new HttpError(409, 'full', { max: work.MAX_MESSAGES });
      }
      audit.record(guild.id, viewer.session.userId, 'work.add', { source: 'web', message });
      return { ok: true };
    },
  );

  app.delete('/work/messages/:index', async (request) => {
    const { guild, viewer } = scope(request);
    const index = indexParam(request.params, 'index');
    const removed = work.removeMessage(guild.id, index, builtInJobs(request));
    if (removed === null) throw new HttpError(404, 'unknown_message');
    audit.record(guild.id, viewer.session.userId, 'work.remove', { source: 'web', removed });
    return { ok: true };
  });

  app.post('/work/reset', async (request) => {
    const { guild, viewer } = scope(request);
    work.resetAll(guild.id);
    audit.record(guild.id, viewer.session.userId, 'work.reset', { source: 'web' });
    return { ok: true };
  });

  // Prizes of /wheel
  app.get('/wheel', async (request) => {
    const { guild } = scope(request);
    return { max: wheel.MAX_REWARDS, prizes: wheel.getRewards(guild.id) };
  });

  app.post(
    '/wheel',
    {
      schema: {
        body: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: { type: 'integer', minimum: 0, maximum: 1e12 },
            name: { type: ['string', 'null'], maxLength: 50 },
          },
        },
      },
    },
    async (request) => {
      const { guild, viewer } = scope(request);
      const { amount, name } = request.body as { amount: number; name?: string | null };
      const prize = { amount, name: name?.trim() || null };
      if (wheel.addReward(guild.id, prize) === 'full') {
        throw new HttpError(409, 'full', { max: wheel.MAX_REWARDS });
      }
      audit.record(guild.id, viewer.session.userId, 'wheel.add', { source: 'web', ...prize });
      return { ok: true };
    },
  );

  app.delete('/wheel/:index', async (request) => {
    const { guild, viewer } = scope(request);
    const index = indexParam(request.params, 'index');
    const removed = wheel.removeReward(guild.id, index);
    if (!removed) throw new HttpError(404, 'unknown_prize');
    audit.record(guild.id, viewer.session.userId, 'wheel.remove', { source: 'web', ...removed });
    return { ok: true };
  });

  app.post('/wheel/reset', async (request) => {
    const { guild, viewer } = scope(request);
    wheel.resetRewards(guild.id);
    audit.record(guild.id, viewer.session.userId, 'wheel.reset', { source: 'web' });
    return { ok: true };
  });
}
