<script setup lang="ts">
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import { computed } from 'vue';
import IncomeEditor from '../components/IncomeEditor.vue';
import JobsEditor from '../components/JobsEditor.vue';
import PageHeader from '../components/PageHeader.vue';
import SettingsForm from '../components/SettingsForm.vue';
import WheelEditor from '../components/WheelEditor.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useLoader } from '../lib/composables.ts';
import { useGuild } from '../lib/guild.ts';
import type { SettingCategoryValues } from '../lib/types.ts';

const props = defineProps<{ category: string }>();
const guild = useGuild();

const { data, error, reload } = useLoader(() =>
  api.get<{ categories: SettingCategoryValues[] }>(guildPath(guild.value.id, '/settings')),
);
const current = computed(() => data.value?.categories.find((c) => c.id === props.category));
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
      <SettingsForm :guild-id="guild.id" :category="current" @changed="reload" />
      <JobsEditor v-if="category === 'work'" :guild-id="guild.id" />
      <WheelEditor v-if="category === 'wheel'" :guild-id="guild.id" />
      <IncomeEditor v-if="category === 'collect'" :guild-id="guild.id" />
    </template>
  </div>
</template>
