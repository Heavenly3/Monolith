<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import SelectButton from 'primevue/selectbutton';
import { computed, reactive, ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import StatCard from '../components/StatCard.vue';
import BackupPanel from '../components/BackupPanel.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import { errorMessage } from '../lib/errors.ts';
import { formatDuration, formatNumber } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import type { LevelMember, LevelsOverview } from '../lib/types.ts';
import SettingsView from './SettingsView.vue';

const guild = useGuild();
const notify = useNotify();
const ask = useAsk();
const PAGE_SIZE = 25;
const path = (suffix = '') => guildPath(guild.value.id, `/levels${suffix}`);

const page = ref(0);
const overview = useLoader(() => api.get<LevelsOverview>(path()));
const { data, error, loading, reload } = useLoader(() =>
  api.get<{ total: number; members: LevelMember[] }>(
    path(`/members?page=${page.value}&limit=${PAGE_SIZE}`),
  ),
);
const refresh = async () => Promise.all([reload(), overview.reload()]);

function onPage(event: DataTablePageEvent): void {
  page.value = event.page;
  void reload();
}

// Change XP dialog
const ACTIONS = ['add', 'remove', 'setXp', 'setLevel', 'reset'] as const;
const dialog = ref(false);
const form = reactive({
  userId: '',
  action: 'add' as (typeof ACTIONS)[number],
  amount: null as number | null,
});
const formError = ref<string | null>(null);
const saving = ref(false);
const actionOptions = computed(() =>
  ACTIONS.map((value) => ({ value, label: t(`panel.levels.actions.${value}`) })),
);
const validId = computed(() => /^\d{17,20}$/.test(form.userId.trim()));

function openAdjust(member?: LevelMember): void {
  Object.assign(form, { userId: member?.userId ?? '', action: 'add', amount: null });
  formError.value = null;
  dialog.value = true;
}

async function submit(): Promise<void> {
  saving.value = true;
  formError.value = null;
  try {
    const result = await api.post<{ level: number; xp: number }>(
      path(`/members/${form.userId.trim()}/adjust`),
      { action: form.action, amount: form.amount ?? 0 },
    );
    notify.success(t('web.levels.adjusted', { level: result.level, xp: formatNumber(result.xp) }));
    dialog.value = false;
    await refresh();
  } catch (failure) {
    formError.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}

// Address of the public ranking page, to share once it is turned on.
const publicUrl = computed(() => `${window.location.origin}/leaderboard/${guild.value.id}`);
async function copyPublicUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(publicUrl.value);
    notify.success(t('web.public.copied'));
  } catch (failure) {
    notify.failure(failure);
  }
}

async function resetAll(): Promise<void> {
  if (!(await ask(t('panel.levels.confirmResetAll')))) return;
  try {
    await api.post(path('/reset'));
    await refresh();
  } catch (failure) {
    notify.failure(failure);
  }
}
</script>

<template>
  <div class="page">
    <PageHeader
      :title="t('config.categories.levelMembers.label')"
      :subtitle="t('levels.boardSubtitle')"
    >
      <Button
        :label="t('panel.levels.resetAll')"
        icon="pi pi-refresh"
        severity="danger"
        outlined
        @click="resetAll"
      />
      <Button :label="t('panel.levels.adjust')" icon="pi pi-pencil" @click="openAdjust()" />
    </PageHeader>

    <div v-if="overview.data.value" class="grid stats">
      <StatCard
        icon="pi pi-users"
        :label="t('web.levels.members')"
        :value="overview.data.value.stats.members"
      />
      <StatCard
        icon="pi pi-star"
        :label="t('web.levels.totalXp')"
        :value="overview.data.value.stats.totalXp"
      />
      <StatCard
        icon="pi pi-angle-double-up"
        :label="t('web.levels.topLevel')"
        :value="overview.data.value.stats.topLevel"
      />
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <div v-else class="panel table">
      <DataTable
        :value="data?.members ?? []"
        :loading="loading"
        :total-records="data?.total ?? 0"
        :rows="PAGE_SIZE"
        :first="page * PAGE_SIZE"
        lazy
        paginator
        data-key="userId"
        @page="onPage"
      >
        <template #empty>{{ t('levels.boardEmpty') }}</template>
        <Column :header="t('web.members.rank')" style="width: 4rem">
          <template #body="{ index }">#{{ page * PAGE_SIZE + index + 1 }}</template>
        </Column>
        <Column :header="t('web.members.member')">
          <template #body="{ data: member }">
            <div class="who">
              <strong>{{ member.username ?? '—' }}</strong>
              <small class="muted">{{ member.userId }}</small>
            </div>
          </template>
        </Column>
        <Column :header="t('levels.level')" style="min-width: 12rem">
          <template #body="{ data: member }">
            <div class="level">
              <span class="level-number">{{ member.level }}</span>
              <div class="level-progress">
                <ProgressBar
                  :value="Math.floor(member.progress.ratio * 100)"
                  :show-value="false"
                  style="height: 6px"
                />
                <small class="muted">
                  {{ formatNumber(member.progress.current) }} /
                  {{ formatNumber(member.progress.needed) }}
                </small>
              </div>
            </div>
          </template>
        </Column>
        <Column :header="t('levels.xp')" class="num" header-class="num">
          <template #body="{ data: member }">
            <span class="amount">{{ formatNumber(member.xp) }}</span>
          </template>
        </Column>
        <Column :header="t('levels.messages')" class="num" header-class="num">
          <template #body="{ data: member }">{{ formatNumber(member.messages) }}</template>
        </Column>
        <Column :header="t('levels.voice')" class="num" header-class="num">
          <template #body="{ data: member }">
            {{ member.voiceMinutes ? formatDuration(member.voiceMinutes * 60) : '—' }}
          </template>
        </Column>
        <Column style="width: 3.5rem">
          <template #body="{ data: member }">
            <Button
              v-tooltip.left="t('panel.levels.adjust')"
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              :aria-label="t('panel.levels.adjust')"
              @click="openAdjust(member)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <BackupPanel :guild-id="guild.id" kind="levels" @imported="refresh" />
    <SettingsView :categories="['levelLeaderboard']" embedded />
    <div class="panel row public-link">
      <i class="pi pi-link muted" />
      <code class="grow">{{ publicUrl }}</code>
      <Button
        :label="t('web.public.copy')"
        icon="pi pi-copy"
        severity="secondary"
        outlined
        size="small"
        @click="copyPublicUrl"
      />
      <Button
        as="a"
        :href="publicUrl"
        target="_blank"
        rel="noopener"
        :label="t('web.public.open')"
        icon="pi pi-external-link"
        size="small"
      />
      <small class="muted hint">{{ t('web.public.hint') }}</small>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="t('panel.levels.adjustTitle')"
      modal
      :style="{ width: 'min(480px, 95vw)' }"
    >
      <form class="stack" @submit.prevent="submit">
        <div class="field">
          <label for="xp-member">{{ t('web.members.userId') }}</label>
          <InputText id="xp-member" v-model="form.userId" inputmode="numeric" fluid />
          <small>{{ t('web.members.userIdHint') }}</small>
        </div>
        <div class="field">
          <label>{{ t('panel.levels.action') }}</label>
          <SelectButton
            v-model="form.action"
            :options="actionOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            class="wrap"
          />
        </div>
        <div v-if="form.action !== 'reset'" class="field">
          <label for="xp-amount">
            {{ form.action === 'setLevel' ? t('levels.level') : t('levels.xp') }}
          </label>
          <InputNumber v-model="form.amount" input-id="xp-amount" :min="0" locale="en-US" fluid />
        </div>
        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
        <div class="row end">
          <Button
            type="button"
            :label="t('web.common.cancel')"
            severity="secondary"
            text
            @click="dialog = false"
          />
          <Button
            type="submit"
            :label="t('web.common.confirm')"
            :loading="saving"
            :disabled="!validId || (form.action !== 'reset' && form.amount === null)"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.public-link {
  flex-wrap: wrap;
  align-items: center;
}

.public-link code {
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(--mn-font-mono);
  color: var(--mn-accent-soft);
}

.public-link .grow {
  flex: 1;
}

.public-link .hint {
  flex-basis: 100%;
}

.table {
  padding: 0.5rem;
  overflow-x: auto;
}

.who {
  display: flex;
  flex-direction: column;
}

.level {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.level-number {
  min-width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: var(--mn-bg);
  font-family: var(--mn-font-mono);
  background: var(--mn-accent);
  border-radius: 4px;
}

.level-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.end {
  justify-content: flex-end;
}

.wrap {
  flex-wrap: wrap;
}
</style>
