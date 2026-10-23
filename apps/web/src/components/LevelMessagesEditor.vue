<script setup lang="ts">
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import { ref } from 'vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import type { LevelsOverview } from '../lib/types.ts';
import TemplateEditor from './TemplateEditor.vue';

// Special messages for exact levels (a milestone at 10, 50, 100...). They
// replace the usual level-up message only on that level.
const props = defineProps<{ guildId: string; variables: readonly string[] }>();
const notify = useNotify();
const ask = useAsk();

const path = (suffix = '') => guildPath(props.guildId, `/levels${suffix}`);
const { data, error, reload } = useLoader(() => api.get<LevelsOverview>(path()));

const level = ref<number | null>(10);
const draft = ref('');
const busy = ref(false);

async function save(): Promise<void> {
  if (!level.value || !draft.value.trim()) return;
  busy.value = true;
  try {
    await api.put(path('/messages'), { level: level.value, message: draft.value.trim() });
    notify.success(t('web.levelMessages.saved', { level: level.value }));
    draft.value = '';
    await reload();
  } catch (failure) {
    notify.failure(failure);
  } finally {
    busy.value = false;
  }
}

function edit(entry: { level: number; message: string }): void {
  level.value = entry.level;
  draft.value = entry.message;
}

async function remove(entryLevel: number): Promise<void> {
  if (!(await ask(t('web.levelMessages.removeConfirm', { level: entryLevel })))) return;
  try {
    await api.delete(path(`/messages/${entryLevel}`));
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}
</script>

<template>
  <section class="panel stack">
    <div>
      <h2 class="divider-title">{{ t('web.levelMessages.title') }}</h2>
      <p class="muted">{{ t('web.levelMessages.subtitle') }}</p>
    </div>
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <template v-else-if="data">
      <p v-if="!data.messages.length" class="muted">{{ t('web.levelMessages.empty') }}</p>
      <ul v-else class="entries">
        <li v-for="entry in data.messages" :key="entry.level">
          <span class="level-badge">{{ t('levels.level') }} {{ entry.level }}</span>
          <span class="text">{{ entry.message }}</span>
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            :aria-label="t('web.common.edit')"
            @click="edit(entry)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :aria-label="t('web.common.delete')"
            @click="remove(entry.level)"
          />
        </li>
      </ul>

      <form class="stack" @submit.prevent="save">
        <div class="field level">
          <label for="level-message-level">{{ t('levels.level') }}</label>
          <InputNumber
            v-model="level"
            input-id="level-message-level"
            :min="1"
            :max="1000"
            show-buttons
            button-layout="horizontal"
          >
            <template #incrementbuttonicon><span class="pi pi-plus" /></template>
            <template #decrementbuttonicon><span class="pi pi-minus" /></template>
          </InputNumber>
        </div>
        <TemplateEditor
          v-model="draft"
          input-id="level-message-text"
          :variables="variables"
          :fallback="t('web.levelMessages.placeholder')"
          :limit="500"
        />
        <div class="row actions">
          <Button
            type="submit"
            :label="t('web.common.save')"
            icon="pi pi-check"
            :loading="busy"
            :disabled="
              !level ||
              !draft.trim() ||
              (data.messages.length >= data.maxMessages &&
                !data.messages.some((m) => m.level === level))
            "
          />
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.entries {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.entries li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.35rem 0.35rem 0.85rem;
  border-radius: 8px;
  background: var(--mn-panel-raised);
}

.level-badge {
  min-width: 5.5rem;
  font-weight: 600;
  color: var(--mn-accent-soft);
}

.text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level {
  max-width: 14rem;
}

.actions {
  justify-content: flex-end;
}
</style>
