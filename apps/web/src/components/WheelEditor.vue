<script setup lang="ts">
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import { ref } from 'vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import { formatNumber } from '../lib/format.ts';
import type { WheelPrize } from '../lib/types.ts';

const props = defineProps<{ guildId: string }>();
const notify = useNotify();
const ask = useAsk();
const path = (suffix = '') => guildPath(props.guildId, `/wheel${suffix}`);

const { data, error, reload } = useLoader(() =>
  api.get<{ max: number; prizes: WheelPrize[] }>(path()),
);

const amount = ref<number | null>(1000);
const name = ref('');
const busy = ref(false);

async function run(action: () => Promise<unknown>): Promise<void> {
  busy.value = true;
  try {
    await action();
    await reload();
  } catch (failure) {
    notify.failure(failure);
  } finally {
    busy.value = false;
  }
}

const add = () =>
  run(async () => {
    await api.post(path(), { amount: amount.value ?? 0, name: name.value.trim() || null });
    name.value = '';
  });

async function remove(index: number): Promise<void> {
  await run(() => api.delete(path(`/${index}`)));
}

async function restore(): Promise<void> {
  if (await ask(t('web.wheel.resetConfirm'))) await run(() => api.post(path('/reset')));
}

const prizeLabel = (prize: WheelPrize): string => {
  if (prize.name)
    return prize.amount ? `${prize.name} · ${formatNumber(prize.amount)} 🪙` : prize.name;
  return prize.amount ? `${formatNumber(prize.amount)} 🪙` : t('web.wheel.empty');
};
</script>

<template>
  <section class="panel stack">
    <div class="page-header">
      <div>
        <h2 class="divider-title">{{ t('web.wheel.title') }}</h2>
        <p class="muted">{{ t('web.wheel.subtitle') }}</p>
      </div>
      <Button
        :label="t('panel.wheel.resetPrizes')"
        icon="pi pi-undo"
        severity="secondary"
        outlined
        size="small"
        @click="restore"
      />
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <template v-else-if="data">
      <div class="prizes">
        <div
          v-for="(prize, index) in data.prizes"
          :key="`${index}-${prize.amount}-${prize.name}`"
          class="prize"
          :class="{ empty: !prize.amount && !prize.name }"
        >
          <span>{{ prizeLabel(prize) }}</span>
          <Button
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            size="small"
            :aria-label="t('web.common.delete')"
            @click="remove(index)"
          />
        </div>
      </div>

      <form class="row add" @submit.prevent="add">
        <div class="field">
          <label for="prize-amount">{{ t('web.wheel.amount') }}</label>
          <InputNumber v-model="amount" input-id="prize-amount" :min="0" locale="en-US" />
        </div>
        <div class="field grow">
          <label for="prize-name">
            {{ t('web.wheel.name') }} <span class="muted">({{ t('web.common.optional') }})</span>
          </label>
          <InputText
            id="prize-name"
            v-model="name"
            :maxlength="50"
            :placeholder="t('web.wheel.namePlaceholder')"
            fluid
          />
        </div>
        <Button
          type="submit"
          :label="t('web.common.add')"
          icon="pi pi-plus"
          :loading="busy"
          :disabled="data.prizes.length >= data.max"
        />
      </form>
      <small v-if="data.prizes.length >= data.max" class="muted">
        {{ t('web.wheel.full', { max: data.max }) }}
      </small>
    </template>
  </section>
</template>

<style scoped>
.prizes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.prize {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.2rem 0.2rem 0.8rem;
  border-radius: 999px;
  background: rgba(201, 162, 39, 0.12);
  border: 1px solid rgba(201, 162, 39, 0.35);
  color: var(--mn-gold-soft);
}

.prize.empty {
  background: var(--mn-panel-raised);
  border-color: var(--mn-border);
  color: var(--mn-muted);
}

.add {
  align-items: flex-end;
}

.grow {
  flex: 1;
  min-width: 200px;
}
</style>
