<script setup lang="ts">
import Button from 'primevue/button';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import { computed, ref } from 'vue';
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

const draft = ref('');
const busy = ref(false);
const needsAmount = computed(() => draft.value.trim() !== '' && !draft.value.includes('{amount}'));

async function add(): Promise<void> {
  if (!draft.value.trim() || needsAmount.value) return;
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

/** Highlights {amount} so admins see where the reward goes. */
const parts = (message: string): string[] => message.split(/(\{amount\})/);
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
            <template v-for="(part, i) in parts(message)" :key="i">
              <strong v-if="part === '{amount}'" class="gold">{amount}</strong>
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
          v-model="draft"
          :placeholder="t('web.jobs.placeholder')"
          :invalid="needsAmount"
          :maxlength="300"
          rows="2"
          auto-resize
          fluid
        />
        <small v-if="needsAmount" class="error">{{ t('web.jobs.needsAmount') }}</small>
        <small v-else-if="data.messages.length >= data.max" class="muted">
          {{ t('web.jobs.full', { max: data.max }) }}
        </small>
        <Button
          type="submit"
          :label="t('web.common.add')"
          icon="pi pi-plus"
          :loading="busy"
          :disabled="!draft.trim() || needsAmount || data.messages.length >= data.max"
        />
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
  background: var(--mc-panel-raised);
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

.error {
  color: var(--p-red-400);
  align-self: flex-start;
}
</style>
