<script setup lang="ts">
import Button from 'primevue/button';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import { computed, nextTick, ref } from 'vue';
import { lang, t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';

const props = defineProps<{ guildId: string }>();
const notify = useNotify();
const ask = useAsk();

interface Jobs {
  builtIn: boolean;
  max: number;
  messages: string[];
}

// Built-in jobs are shown (and copied when customising) in the dashboard language.
const path = (suffix = '') =>
  guildPath(props.guildId, `/work/messages${suffix}?lang=${lang.value}`);
const { data, error, reload } = useLoader(() => api.get<Jobs>(path()));

const REWARD = '{amount}';
const draft = ref('');
const busy = ref(false);
const editor = ref<{ $el: HTMLTextAreaElement } | null>(null);

/** Puts the reward where the cursor is (it goes at the end when left out). */
async function insertReward(): Promise<void> {
  const textarea = editor.value?.$el;
  const start = textarea?.selectionStart ?? draft.value.length;
  const end = textarea?.selectionEnd ?? draft.value.length;
  draft.value = `${draft.value.slice(0, start)}${REWARD}${draft.value.slice(end)}`;
  await nextTick();
  textarea?.focus();
  textarea?.setSelectionRange(start + REWARD.length, start + REWARD.length);
}

/**
 * How a job reads in Discord, split around the reward so it can be shown as
 * a badge. Jobs without the reward get it appended, like the bot does.
 */
function preview(message: string): string[] {
  const text = message.includes(REWARD)
    ? message
    : t('work.fallback', { message: message.trim(), amount: REWARD });
  return text.split(/(\{amount\})/);
}

const draftPreview = computed(() => (draft.value.trim() ? preview(draft.value) : null));

async function add(): Promise<void> {
  if (!draft.value.trim()) return;
  busy.value = true;
  try {
    await api.post(path(), { message: draft.value.trim() });
    draft.value = '';
    await reload();
  } catch (failure) {
    notify.failure(failure);
  } finally {
    busy.value = false;
  }
}

async function remove(index: number): Promise<void> {
  if (!(await ask(t('web.jobs.removeConfirm')))) return;
  try {
    await api.delete(path(`/${index}`));
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}

async function useBuiltIn(): Promise<void> {
  if (!(await ask(t('web.jobs.resetConfirm')))) return;
  try {
    await api.post(guildPath(props.guildId, '/work/reset'));
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}
</script>

<template>
  <section class="panel stack">
    <div class="page-header">
      <div>
        <h2 class="divider-title">{{ t('web.jobs.title') }}</h2>
        <p class="muted">{{ t('web.jobs.subtitle') }}</p>
      </div>
      <Button
        v-if="data && !data.builtIn"
        :label="t('web.jobs.reset')"
        icon="pi pi-undo"
        severity="secondary"
        outlined
        size="small"
        @click="useBuiltIn"
      />
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <template v-else-if="data">
      <Message v-if="data.builtIn" severity="secondary" :closable="false">{{
        t('web.jobs.builtIn')
      }}</Message>

      <ol class="jobs">
        <li v-for="(message, index) in data.messages" :key="`${index}-${message}`">
          <span class="text">
            <template v-for="(part, i) in preview(message)" :key="i">
              <span v-if="part === REWARD" class="reward">🪙 {{ t('web.jobs.reward') }}</span>
              <template v-else>{{ part }}</template>
            </template>
          </span>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :aria-label="t('web.common.delete')"
            @click="remove(index)"
          />
        </li>
      </ol>

      <form class="add" @submit.prevent="add">
        <Textarea
          ref="editor"
          v-model="draft"
          :placeholder="t('web.jobs.placeholder')"
          :maxlength="300"
          rows="2"
          auto-resize
          fluid
        />
        <p v-if="draftPreview" class="preview">
          <span class="muted">{{ t('web.jobs.preview') }}</span>
          <template v-for="(part, i) in draftPreview" :key="i">
            <span v-if="part === REWARD" class="reward">🪙 {{ t('web.jobs.reward') }}</span>
            <template v-else>{{ part }}</template>
          </template>
        </p>
        <small v-if="data.messages.length >= data.max" class="muted">
          {{ t('web.jobs.full', { max: data.max }) }}
        </small>
        <div class="row">
          <Button
            type="button"
            :label="t('web.jobs.insertReward')"
            icon="pi pi-plus-circle"
            severity="secondary"
            outlined
            @click="insertReward"
          />
          <Button
            type="submit"
            :label="t('web.common.add')"
            icon="pi pi-plus"
            :loading="busy"
            :disabled="!draft.trim() || data.messages.length >= data.max"
          />
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.jobs {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.jobs li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.35rem 0.35rem 0.85rem;
  border-radius: 8px;
  background: var(--mn-panel-raised);
}

.text {
  flex: 1;
}

.add {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.reward {
  display: inline-block;
  padding: 0 0.45rem;
  margin: 0 0.1rem;
  border-radius: 999px;
  background: rgba(201, 162, 39, 0.16);
  color: var(--mn-gold-soft);
  font-weight: 600;
  font-size: 0.9em;
}

.preview {
  align-self: stretch;
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-left: 3px solid var(--mn-gold);
  border-radius: 6px;
  background: var(--mn-panel-raised);
}

.preview .muted {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.15rem;
}
</style>
