<script setup lang="ts">
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import PageHeader from '../components/PageHeader.vue';
import { t } from '../i18n/index.ts';
import { describeAudit as describe, fromWeb } from '../lib/audit.ts';
import { api, guildPath } from '../lib/api.ts';
import { useLoader } from '../lib/composables.ts';
import { dateTime, relativeTime } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import type { AuditEntry } from '../lib/types.ts';

const guild = useGuild();
const { data, error, loading } = useLoader(() =>
  api.get<{ entries: AuditEntry[] }>(guildPath(guild.value.id, '/audit?limit=100')),
);
</script>

<template>
  <div class="page">
    <PageHeader :title="t('web.nav.history')" :subtitle="t('web.history.subtitle')" />

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <div v-else class="panel table">
      <DataTable :value="data?.entries ?? []" :loading="loading" data-key="id">
        <template #empty>{{ t('web.history.empty') }}</template>
        <Column :header="t('web.history.when')" style="width: 11rem">
          <template #body="{ data: entry }">
            <span v-tooltip.top="dateTime(entry.createdAt)">{{
              relativeTime(entry.createdAt)
            }}</span>
          </template>
        </Column>
        <Column :header="t('web.history.who')">
          <template #body="{ data: entry }">{{ entry.actorName ?? entry.actorId }}</template>
        </Column>
        <Column :header="t('web.history.what')">
          <template #body="{ data: entry }">{{ describe(entry) }}</template>
        </Column>
        <Column style="width: 8rem">
          <template #body="{ data: entry }">
            <Tag
              :value="fromWeb(entry) ? t('web.history.fromWeb') : t('web.history.fromDiscord')"
              :icon="fromWeb(entry) ? 'pi pi-globe' : 'pi pi-discord'"
              severity="secondary"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.table {
  padding: 0.5rem;
  overflow-x: auto;
}
</style>
