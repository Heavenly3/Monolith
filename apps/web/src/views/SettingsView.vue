<script setup lang="ts">
import Button from 'primevue/button';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import { computed, ref } from 'vue';
import IncomeEditor from '../components/IncomeEditor.vue';
import JobsEditor from '../components/JobsEditor.vue';
import LevelCurveChart from '../components/LevelCurveChart.vue';
import PageHeader from '../components/PageHeader.vue';
import SettingsForm from '../components/SettingsForm.vue';
import WheelEditor from '../components/WheelEditor.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useLoader, useNotify } from '../lib/composables.ts';
import { useGuild } from '../lib/guild.ts';
import type { SettingCategoryValues } from '../lib/types.ts';

const props = defineProps<{ category: string }>();
const guild = useGuild();
const notify = useNotify();

const { data, error, reload } = useLoader(() =>
  api.get<{ categories: SettingCategoryValues[] }>(guildPath(guild.value.id, '/settings')),
);
const byId = computed(() => new Map(data.value?.categories.map((c) => [c.id, c]) ?? []));
const current = computed(() => byId.value.get(props.category));
const valueOf = (category: string, field: string): unknown =>
  byId.value.get(category)?.fields.find((f) => f.id === field)?.value;

// A page of a module that is turned off says so and offers to turn it on.
const moduleOff = computed(() => {
  const module = current.value?.module;
  return module && valueOf('modules', module) === false ? module : null;
});
async function enableModule(): Promise<void> {
  try {
    await api.put(guildPath(guild.value.id, '/settings/modules'), {
      values: { [moduleOff.value!]: true },
    });
    notify.success(
      t('panel.modules.enabled', { module: t(`modules.${moduleOff.value}`) }).replace(/\*\*/g, ''),
    );
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}

// Unsaved values of the form, so the curve chart follows the edits live.
const draft = ref<Record<string, unknown>>({});
const xpPerMessage = computed(() => {
  const min = Number(valueOf('levels', 'min') ?? 15);
  const max = Number(valueOf('levels', 'max') ?? 25);
  return (min + max) / 2;
});
</script>

<template>
  <div class="page">
    <PageHeader
      :title="t(`config.categories.${category}.label`)"
      :subtitle="`${t(`config.categories.${category}.description`)} · ${t('web.settings.subtitle')}`"
    />
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <Skeleton v-else-if="!data" height="14rem" border-radius="12px" />
    <template v-else-if="current">
      <Message v-if="moduleOff" severity="warn" :closable="false">
        <div class="row between">
          <span>{{ t('web.settings.moduleOff', { module: t(`modules.${moduleOff}`) }) }}</span>
          <Button :label="t('web.settings.enableModule')" size="small" @click="enableModule" />
        </div>
      </Message>
      <SettingsForm
        :guild-id="guild.id"
        :category="current"
        @changed="reload"
        @draft="draft = $event"
      />
      <LevelCurveChart
        v-if="category === 'levelCurve'"
        :curve="String(draft.curve ?? 'standard')"
        :difficulty="Number(draft.difficulty ?? 100)"
        :max-level="Number(draft.maxLevel ?? 500)"
        :xp-per-message="xpPerMessage"
        :cooldown="Number(valueOf('levels', 'cooldown') ?? 60)"
      />
      <JobsEditor v-if="category === 'work'" :guild-id="guild.id" />
      <WheelEditor v-if="category === 'wheel'" :guild-id="guild.id" />
      <IncomeEditor v-if="category === 'collect'" :guild-id="guild.id" />
    </template>
  </div>
</template>

<style scoped>
.between {
  justify-content: space-between;
  width: 100%;
}
</style>
