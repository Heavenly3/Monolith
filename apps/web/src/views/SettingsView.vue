<script setup lang="ts">
import Button from 'primevue/button';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import { computed, reactive } from 'vue';
import IncomeEditor from '../components/IncomeEditor.vue';
import JobsEditor from '../components/JobsEditor.vue';
import LevelCurveChart from '../components/LevelCurveChart.vue';
import LevelMessagesEditor from '../components/LevelMessagesEditor.vue';
import RankCardPreview from '../components/RankCardPreview.vue';
import PageHeader from '../components/PageHeader.vue';
import SettingsForm from '../components/SettingsForm.vue';
import WheelEditor from '../components/WheelEditor.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useLoader, useNotify } from '../lib/composables.ts';
import { useGuild } from '../lib/guild.ts';
import type { SettingCategoryValues } from '../lib/types.ts';

// Settings forms of one or more categories, stacked. The first one names the
// page; `embedded` leaves the page header out (for use inside another page).
const props = defineProps<{ categories: string[]; embedded?: boolean }>();
const guild = useGuild();
const notify = useNotify();

const { data, error, reload } = useLoader(() =>
  api.get<{ categories: SettingCategoryValues[] }>(guildPath(guild.value.id, '/settings')),
);
const byId = computed(() => new Map(data.value?.categories.map((c) => [c.id, c]) ?? []));
const main = computed(() => props.categories[0]!);
const valueOf = (category: string, field: string): unknown =>
  byId.value.get(category)?.fields.find((f) => f.id === field)?.value;

// Unsaved values of each form, so previews (the curve chart) follow the edits live.
const drafts = reactive<Record<string, Record<string, unknown>>>({});
const draftOf = (category: string, field: string): unknown =>
  drafts[category]?.[field] ?? valueOf(category, field);

// Forms that only matter for some values of another form stay hidden otherwise.
const SHOWN_WHEN: Record<string, () => boolean> = {
  levelFormula: () => draftOf('levelCurve', 'curve') === 'custom',
};
const shown = computed(() =>
  props.categories
    .map((id) => byId.value.get(id))
    .filter((category): category is SettingCategoryValues => Boolean(category))
    .filter((category) => SHOWN_WHEN[category.id]?.() ?? true),
);

// A page of a module that is turned off says so and offers to turn it on.
const moduleOff = computed(() => {
  const module = byId.value.get(main.value)?.module;
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

const xpPerMessage = computed(() => {
  const min = Number(valueOf('levels', 'min') ?? 15);
  const max = Number(valueOf('levels', 'max') ?? 25);
  return (min + max) / 2;
});
const formula = computed(() => ({
  cubic: Number(draftOf('levelFormula', 'cubic') ?? 0),
  quadratic: Number(draftOf('levelFormula', 'quadratic') ?? 0),
  linear: Number(draftOf('levelFormula', 'linear') ?? 0),
  constant: Number(draftOf('levelFormula', 'constant') ?? 0),
}));
</script>

<template>
  <div :class="embedded ? 'stack' : 'page'">
    <PageHeader
      v-if="!embedded"
      :title="t(`config.categories.${main}.label`)"
      :subtitle="`${t(`config.categories.${main}.description`)} · ${t('web.settings.subtitle')}`"
    />
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <Skeleton v-else-if="!data" height="14rem" border-radius="12px" />
    <template v-else>
      <Message v-if="moduleOff && !embedded" severity="warn" :closable="false">
        <div class="row between">
          <span>{{ t('web.settings.moduleOff', { module: t(`modules.${moduleOff}`) }) }}</span>
          <Button :label="t('web.settings.enableModule')" size="small" @click="enableModule" />
        </div>
      </Message>

      <template v-for="(category, index) in shown" :key="category.id">
        <div v-if="index > 0 || embedded" class="form-heading">
          <h2 class="divider-title">{{ t(`config.categories.${category.id}.label`) }}</h2>
          <p class="muted">{{ t(`config.categories.${category.id}.description`) }}</p>
        </div>
        <SettingsForm
          :guild-id="guild.id"
          :category="category"
          @changed="reload"
          @draft="drafts[category.id] = $event"
        />
      </template>

      <LevelCurveChart
        v-if="categories.includes('levelCurve')"
        :curve="String(draftOf('levelCurve', 'curve') ?? 'standard')"
        :difficulty="Number(draftOf('levelCurve', 'difficulty') ?? 100)"
        :max-level="Number(draftOf('levelCurve', 'maxLevel') ?? 500)"
        :formula="formula"
        :rounding="Number(draftOf('levelFormula', 'rounding') ?? 1)"
        :xp-per-message="xpPerMessage"
        :cooldown="Number(valueOf('levels', 'cooldown') ?? 60)"
      />
      <LevelMessagesEditor
        v-if="main === 'levelAnnounce'"
        :guild-id="guild.id"
        :variables="
          byId.get('levelAnnounce')?.fields.find((f) => f.id === 'message')?.variables ?? []
        "
      />
      <RankCardPreview
        v-if="main === 'levelRank'"
        :style-id="String(draftOf('levelRank', 'rankStyle') ?? 'image')"
        :theme="String(draftOf('levelRank', 'rankTheme') ?? 'blueprint')"
        :accent="String(draftOf('levelRank', 'accent') ?? '#5ec8e5')"
        :background="String(draftOf('levelRank', 'background') ?? '') || null"
        :dim="Number(draftOf('levelRank', 'dim') ?? 65)"
      />
      <JobsEditor v-if="main === 'work'" :guild-id="guild.id" />
      <WheelEditor v-if="main === 'wheel'" :guild-id="guild.id" />
      <IncomeEditor v-if="main === 'collect'" :guild-id="guild.id" />
    </template>
  </div>
</template>

<style scoped>
.between {
  justify-content: space-between;
  width: 100%;
}

.form-heading {
  margin-top: 0.5rem;
}
</style>
