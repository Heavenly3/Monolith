<script setup lang="ts">
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import SelectButton from 'primevue/selectbutton';
import { computed, ref } from 'vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useNotify } from '../lib/composables.ts';
import { parseEconomyBackup } from '../lib/economyBackup.ts';
import { formatNumber } from '../lib/format.ts';
import { parseXpBackup } from '../lib/xpBackup.ts';

// Download every member's experience or credits, or load a backup back in
// (also from other bots). Texts live under web.backup.<kind>.
const props = defineProps<{ guildId: string; kind: 'levels' | 'economy' }>();
const emit = defineEmits<{ imported: [] }>();
const notify = useNotify();

const KINDS = {
  levels: {
    base: '/levels',
    parse: parseXpBackup,
    total: (records: unknown[]) => (records as { xp: number }[]).reduce((s, r) => s + r.xp, 0),
  },
  economy: {
    base: '/members',
    parse: parseEconomyBackup,
    total: (records: unknown[]) =>
      (records as { wallet: number; bank: number }[]).reduce((s, r) => s + r.wallet + r.bank, 0),
  },
} as const;
const kind = computed(() => KINDS[props.kind]);
const text = (key: string, vars?: Record<string, string | number>) =>
  t(`web.backup.${props.kind}.${key}`, vars);

const exportUrl = (format: 'json' | 'csv') =>
  guildPath(props.guildId, `${kind.value.base}/export?format=${format}`);

const picker = ref<HTMLInputElement | null>(null);
const records = ref<unknown[]>([]);
const fileName = ref('');
const unreadable = ref(false);
const dialog = ref(false);
const busy = ref(false);
const mode = ref<'highest' | 'add' | 'replace'>('highest');
const modes = computed(() =>
  (['highest', 'add', 'replace'] as const).map((value) => ({
    value,
    label: t(`web.backup.modes.${value}`),
  })),
);

async function pick(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  fileName.value = file.name;
  records.value = kind.value.parse(await file.text());
  unreadable.value = records.value.length === 0;
  mode.value = 'highest';
  dialog.value = true;
  if (picker.value) picker.value.value = '';
}

async function load(): Promise<void> {
  busy.value = true;
  try {
    const result = await api.post<{ count: number }>(
      guildPath(props.guildId, `${kind.value.base}/import`),
      { mode: mode.value, records: records.value },
    );
    notify.success(text('done', { count: formatNumber(result.count) }));
    dialog.value = false;
    emit('imported');
  } catch (failure) {
    notify.failure(failure);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="panel stack">
    <div>
      <h2 class="divider-title">{{ text('title') }}</h2>
      <p class="muted">{{ text('subtitle') }}</p>
    </div>
    <div class="row wrap">
      <Button
        as="a"
        :href="exportUrl('json')"
        download
        :label="t('web.backup.exportJson')"
        icon="pi pi-download"
        severity="secondary"
        outlined
      />
      <Button
        as="a"
        :href="exportUrl('csv')"
        download
        :label="t('web.backup.exportCsv')"
        icon="pi pi-file-excel"
        severity="secondary"
        outlined
      />
      <Button :label="text('import')" icon="pi pi-upload" @click="picker?.click()" />
      <input
        ref="picker"
        type="file"
        accept=".json,.csv,.txt,application/json,text/csv"
        hidden
        @change="pick"
      />
    </div>

    <Dialog
      v-model:visible="dialog"
      modal
      :header="text('import')"
      :style="{ width: 'min(32rem, 94vw)' }"
    >
      <div class="stack">
        <p class="muted file">{{ fileName }}</p>
        <Message v-if="unreadable" severity="error" :closable="false">
          {{ text('unreadable') }}
        </Message>
        <template v-else>
          <p>
            {{
              text('found', {
                count: formatNumber(records.length),
                total: formatNumber(kind.total(records)),
              })
            }}
          </p>
          <div class="field">
            <label>{{ t('web.backup.mode') }}</label>
            <SelectButton
              v-model="mode"
              :options="modes"
              option-label="label"
              option-value="value"
              :allow-empty="false"
            />
            <small class="muted">{{ text(`modeHints.${mode}`) }}</small>
          </div>
          <Message v-if="mode === 'replace'" severity="warn" :closable="false">
            {{ text('replaceWarning') }}
          </Message>
        </template>
      </div>
      <template #footer>
        <Button :label="t('web.common.cancel')" severity="secondary" text @click="dialog = false" />
        <Button
          :label="t('web.backup.confirm')"
          icon="pi pi-check"
          :severity="mode === 'replace' ? 'danger' : undefined"
          :loading="busy"
          :disabled="unreadable"
          @click="load"
        />
      </template>
    </Dialog>
  </section>
</template>

<style scoped>
.wrap {
  flex-wrap: wrap;
}

.file {
  margin: 0;
  font-family: var(--mn-font-mono);
  overflow-wrap: anywhere;
}
</style>
