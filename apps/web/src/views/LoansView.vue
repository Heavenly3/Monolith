<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import PageHeader from '../components/PageHeader.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import { dateTime, formatNumber, relativeTime } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import type { Loan } from '../lib/types.ts';

const guild = useGuild();
const notify = useNotify();
const ask = useAsk();
const path = (suffix = '') => guildPath(guild.value.id, `/loans${suffix}`);

const { data, error, loading, reload } = useLoader(() => api.get<{ loans: Loan[] }>(path()));

async function cancel(loan: Loan): Promise<void> {
  if (!(await ask(t('web.loans.cancelConfirm')))) return;
  try {
    await api.delete(path(`/${loan.userId}`));
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}

async function cancelAll(): Promise<void> {
  if (!(await ask(t('web.loans.cancelAllConfirm')))) return;
  try {
    await api.delete(path());
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('web.nav.loans')" :subtitle="t('web.loans.subtitle')">
      <Button
        v-if="data?.loans.length"
        :label="t('web.loans.cancelAll')"
        icon="pi pi-times"
        severity="danger"
        outlined
        @click="cancelAll"
      />
    </PageHeader>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <div v-else class="panel table">
      <DataTable :value="data?.loans ?? []" :loading="loading" data-key="userId">
        <template #empty>{{ t('web.loans.empty') }}</template>
        <Column :header="t('web.loans.member')">
          <template #body="{ data: loan }">
            <div class="who">
              <strong>{{ loan.username ?? '—' }}</strong>
              <small class="muted">{{ loan.userId }}</small>
            </div>
          </template>
        </Column>
        <Column :header="t('web.loans.borrowed')" class="num" header-class="num">
          <template #body="{ data: loan }">
            {{ formatNumber(loan.principal) }}
            <small class="muted">+{{ loan.interestRate }}%</small>
          </template>
        </Column>
        <Column :header="t('web.loans.owed')" class="num" header-class="num">
          <template #body="{ data: loan }">
            <span class="gold">{{ formatNumber(loan.amountDue) }}</span>
          </template>
        </Column>
        <Column :header="t('web.loans.due')">
          <template #body="{ data: loan }">
            <Tag
              v-tooltip.top="dateTime(loan.dueAt)"
              :value="relativeTime(loan.dueAt)"
              :severity="loan.dueAt - Date.now() < 86_400_000 ? 'warn' : 'secondary'"
            />
          </template>
        </Column>
        <Column style="width: 3.5rem">
          <template #body="{ data: loan }">
            <Button
              v-tooltip.left="t('web.loans.cancel')"
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              :aria-label="t('web.loans.cancel')"
              @click="cancel(loan)"
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

.who {
  display: flex;
  flex-direction: column;
}
</style>
