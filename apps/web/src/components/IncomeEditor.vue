<script setup lang="ts">
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Select from 'primevue/select';
import { ref } from 'vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import { formatNumber } from '../lib/format.ts';
import { useRoles } from '../lib/roles.ts';
import RoleTag from './RoleTag.vue';

const props = defineProps<{ guildId: string }>();
const notify = useNotify();
const ask = useAsk();
const path = (suffix = '') => guildPath(props.guildId, `/role-income${suffix}`);

const { data, error, reload } = useLoader(() =>
  api.get<{ rewards: { roleId: string; amount: number }[] }>(path()),
);
const { roles, byId } = useRoles(props.guildId);

const roleId = ref<string | null>(null);
const amount = ref<number | null>(500);
const busy = ref(false);

async function save(): Promise<void> {
  if (!roleId.value || !amount.value) return;
  busy.value = true;
  try {
    await api.put(path(`/${roleId.value}`), { amount: amount.value });
    roleId.value = null;
    await reload();
  } catch (failure) {
    notify.failure(failure);
  } finally {
    busy.value = false;
  }
}

async function remove(id: string): Promise<void> {
  if (!(await ask(t('web.income.removeConfirm')))) return;
  try {
    await api.delete(path(`/${id}`));
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}
</script>

<template>
  <section class="panel stack">
    <div>
      <h2 class="divider-title">{{ t('web.income.title') }}</h2>
      <p class="muted">{{ t('web.income.subtitle') }}</p>
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <template v-else-if="data">
      <p v-if="!data.rewards.length" class="muted">{{ t('web.income.empty') }}</p>
      <ul v-else class="rewards">
        <li v-for="reward in data.rewards" :key="reward.roleId">
          <RoleTag :role="byId.get(reward.roleId)" :fallback="reward.roleId" />
          <span class="gold">{{ formatNumber(reward.amount) }} 🪙</span>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            :aria-label="t('web.common.delete')"
            @click="remove(reward.roleId)"
          />
        </li>
      </ul>

      <form class="row add" @submit.prevent="save">
        <div class="field grow">
          <label for="income-role">{{ t('web.income.role') }}</label>
          <Select
            v-model="roleId"
            input-id="income-role"
            :options="roles"
            option-label="name"
            option-value="id"
            :placeholder="t('web.income.pickRole')"
            filter
            fluid
          >
            <template #option="{ option }"><RoleTag :role="option" /></template>
          </Select>
        </div>
        <div class="field">
          <label for="income-amount">{{ t('web.income.amount') }}</label>
          <InputNumber v-model="amount" input-id="income-amount" :min="1" locale="en-US" />
        </div>
        <Button
          type="submit"
          :label="t('web.common.save')"
          icon="pi pi-check"
          :loading="busy"
          :disabled="!roleId || !amount"
        />
      </form>
    </template>
  </section>
</template>

<style scoped>
.rewards {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rewards li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.35rem 0.35rem 0.85rem;
  border-radius: 8px;
  background: var(--mc-panel-raised);
}

.rewards li > :first-child {
  flex: 1;
}

.add {
  align-items: flex-end;
}

.grow {
  flex: 1;
  min-width: 200px;
}
</style>
