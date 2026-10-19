<script setup lang="ts">
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import SelectButton from 'primevue/selectbutton';
import { computed, reactive, ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useLoader, useNotify } from '../lib/composables.ts';
import { errorMessage } from '../lib/errors.ts';
import { formatNumber } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import type { Member } from '../lib/types.ts';

const guild = useGuild();
const notify = useNotify();
const PAGE_SIZE = 25;

interface MembersPage {
  total: number;
  page: number;
  limit: number;
  members: Member[];
}

const page = ref(0);
const { data, error, loading, reload } = useLoader(() =>
  api.get<MembersPage>(guildPath(guild.value.id, `/members?page=${page.value}&limit=${PAGE_SIZE}`)),
);

function onPage(event: DataTablePageEvent): void {
  page.value = event.page;
  void reload();
}

// Change gold dialog
const ACTIONS = ['add', 'remove', 'set', 'reset'] as const;
type Action = (typeof ACTIONS)[number];

const dialog = ref(false);
const form = reactive({
  userId: '',
  action: 'add' as Action,
  account: 'wallet' as 'wallet' | 'bank',
  amount: null as number | null,
});
const formError = ref<string | null>(null);
const saving = ref(false);

const actionOptions = computed(() =>
  ACTIONS.map((value) => ({ value, label: t(`panel.members.actions.${value}`) })),
);
const accountOptions = computed(() => [
  { value: 'wallet', label: t('common.wallet') },
  { value: 'bank', label: t('common.bank') },
]);
const validId = computed(() => /^\d{17,20}$/.test(form.userId.trim()));

function openAdjust(member?: Member): void {
  form.userId = member?.userId ?? '';
  form.action = 'add';
  form.account = 'wallet';
  form.amount = null;
  formError.value = null;
  dialog.value = true;
}

async function submit(): Promise<void> {
  saving.value = true;
  formError.value = null;
  try {
    const result = await api.post<{ after: { wallet: number; bank: number } }>(
      guildPath(guild.value.id, `/members/${form.userId.trim()}/adjust`),
      { action: form.action, account: form.account, amount: form.amount ?? 0 },
    );
    notify.success(
      t('web.members.result', {
        wallet: formatNumber(result.after.wallet),
        bank: formatNumber(result.after.bank),
      }),
    );
    dialog.value = false;
    await reload();
  } catch (failure) {
    formError.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('web.nav.members')" :subtitle="t('web.members.subtitle')">
      <Button :label="t('web.members.adjust')" icon="pi pi-pencil" @click="openAdjust()" />
    </PageHeader>

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
        <template #empty>{{ t('web.overview.noMembers') }}</template>
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
        <Column :header="t('common.wallet')" class="num" header-class="num">
          <template #body="{ data: member }">{{ formatNumber(member.wallet) }}</template>
        </Column>
        <Column :header="t('common.bank')" class="num" header-class="num">
          <template #body="{ data: member }">{{ formatNumber(member.bank) }}</template>
        </Column>
        <Column :header="t('common.netWorth')" class="num" header-class="num">
          <template #body="{ data: member }">
            <span class="gold">{{ formatNumber(member.netWorth) }}</span>
          </template>
        </Column>
        <Column style="width: 3.5rem">
          <template #body="{ data: member }">
            <Button
              v-tooltip.left="t('web.members.adjust')"
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              :aria-label="t('web.members.adjust')"
              @click="openAdjust(member)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="t('web.members.adjustTitle')"
      modal
      :style="{ width: 'min(460px, 95vw)' }"
    >
      <form class="stack" @submit.prevent="submit">
        <div class="field">
          <label for="member-id">{{ t('web.members.userId') }}</label>
          <InputText id="member-id" v-model="form.userId" inputmode="numeric" fluid />
          <small>{{ t('web.members.userIdHint') }}</small>
        </div>
        <div class="field">
          <label>{{ t('web.members.action') }}</label>
          <SelectButton
            v-model="form.action"
            :options="actionOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
          />
        </div>
        <template v-if="form.action !== 'reset'">
          <div class="field">
            <label>{{ t('web.members.account') }}</label>
            <SelectButton
              v-model="form.account"
              :options="accountOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
            />
          </div>
          <div class="field">
            <label for="member-amount">{{ t('web.members.amount') }}</label>
            <InputNumber
              v-model="form.amount"
              input-id="member-amount"
              :min="0"
              locale="en-US"
              fluid
            />
          </div>
        </template>
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
.table {
  padding: 0.5rem;
  overflow-x: auto;
}

.who {
  display: flex;
  flex-direction: column;
}

.end {
  justify-content: flex-end;
}
</style>
