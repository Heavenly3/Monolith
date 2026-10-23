<script setup lang="ts">
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Skeleton from 'primevue/skeleton';
import { computed, ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import RoleTag from '../components/RoleTag.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useChannels } from '../lib/channels.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import { useGuild } from '../lib/guild.ts';
import { useRoles } from '../lib/roles.ts';
import type { LevelsOverview } from '../lib/types.ts';

const guild = useGuild();
const notify = useNotify();
const ask = useAsk();
const path = (suffix = '') => guildPath(guild.value.id, `/levels${suffix}`);

const { data, error, reload } = useLoader(() => api.get<LevelsOverview>(path()));
const { roles, byId: rolesById } = useRoles(guild.value.id);
const { textChannels, byId: channelsById } = useChannels(guild.value.id);

async function run(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}

// Role rewards
const rewardLevel = ref<number | null>(5);
const rewardRole = ref<string | null>(null);
const addReward = () =>
  run(async () => {
    await api.post(path('/rewards'), { level: rewardLevel.value, roleId: rewardRole.value });
    rewardRole.value = null;
  });
const removeReward = async (roleId: string) => {
  if (await ask(t('web.levels.removeRewardConfirm')))
    await run(() => api.delete(path(`/rewards/${roleId}`)));
};

// XP multipliers
const multiplierType = ref<'role' | 'channel'>('role');
const multiplierTarget = ref<string | null>(null);
const multiplierPercent = ref<number | null>(150);
const typeOptions = computed(() => [
  { value: 'role', label: t('web.levels.typeRole') },
  { value: 'channel', label: t('web.levels.typeChannel') },
]);
const targets = computed(() =>
  multiplierType.value === 'role'
    ? roles.value.map((role) => ({ id: role.id, name: role.name }))
    : textChannels.value.map((channel) => ({ id: channel.id, name: `# ${channel.name}` })),
);
const addMultiplier = () =>
  run(async () => {
    await api.put(path('/multipliers'), {
      type: multiplierType.value,
      id: multiplierTarget.value,
      percent: multiplierPercent.value,
    });
    multiplierTarget.value = null;
  });
const removeMultiplier = (type: string, id: string) =>
  run(() => api.delete(path(`/multipliers/${type}/${id}`)));

const percentLabel = (percent: number) =>
  percent === 0 ? t('web.levels.noXp') : `×${(percent / 100).toLocaleString()}`;
</script>

<template>
  <div class="page">
    <PageHeader
      :title="t('config.categories.levelRewards.label')"
      :subtitle="t('web.levels.rewardsSubtitle')"
    />
    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <Skeleton v-else-if="!data" height="14rem" border-radius="12px" />

    <template v-else>
      <section class="panel stack">
        <div>
          <h2 class="divider-title">{{ t('web.levels.rewardsTitle') }}</h2>
          <p class="muted">{{ t('web.levels.rewardsHint') }}</p>
        </div>
        <p v-if="!data.rewards.length" class="muted">{{ t('panel.levels.noRewards') }}</p>
        <ol v-else class="timeline">
          <li v-for="reward in data.rewards" :key="reward.roleId">
            <span class="level-badge">{{ t('levels.level') }} {{ reward.level }}</span>
            <RoleTag :role="rolesById.get(reward.roleId)" :fallback="reward.roleId" />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :aria-label="t('web.common.delete')"
              @click="removeReward(reward.roleId)"
            />
          </li>
        </ol>
        <form class="row add" @submit.prevent="addReward">
          <div class="field">
            <label for="reward-level">{{ t('levels.level') }}</label>
            <InputNumber v-model="rewardLevel" input-id="reward-level" :min="1" :max="1000" />
          </div>
          <div class="field grow">
            <label for="reward-role">{{ t('web.income.role') }}</label>
            <Select
              v-model="rewardRole"
              input-id="reward-role"
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
          <Button
            type="submit"
            :label="t('web.common.add')"
            icon="pi pi-plus"
            :disabled="!rewardRole || !rewardLevel || data.rewards.length >= data.maxRewards"
          />
        </form>
      </section>

      <section class="panel stack">
        <div>
          <h2 class="divider-title">{{ t('web.levels.multipliersTitle') }}</h2>
          <p class="muted">{{ t('web.levels.multipliersHint') }}</p>
        </div>
        <p v-if="!data.multipliers.length" class="muted">{{ t('web.levels.noMultipliers') }}</p>
        <ul v-else class="multipliers">
          <li v-for="m in data.multipliers" :key="`${m.type}-${m.id}`">
            <i :class="m.type === 'role' ? 'pi pi-shield' : 'pi pi-hashtag'" class="muted" />
            <RoleTag v-if="m.type === 'role'" :role="rolesById.get(m.id)" :fallback="m.id" />
            <span v-else># {{ channelsById.get(m.id)?.name ?? m.id }}</span>
            <strong class="amount">{{ percentLabel(m.percent) }}</strong>
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :aria-label="t('web.common.delete')"
              @click="removeMultiplier(m.type, m.id)"
            />
          </li>
        </ul>
        <form class="row add" @submit.prevent="addMultiplier">
          <div class="field">
            <label>{{ t('web.levels.type') }}</label>
            <SelectButton
              v-model="multiplierType"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              @change="multiplierTarget = null"
            />
          </div>
          <div class="field grow">
            <label for="multiplier-target">{{ t('web.levels.target') }}</label>
            <Select
              v-model="multiplierTarget"
              input-id="multiplier-target"
              :options="targets"
              option-label="name"
              option-value="id"
              filter
              fluid
            />
          </div>
          <div class="field">
            <label for="multiplier-percent">{{ t('web.levels.percent') }}</label>
            <InputNumber
              v-model="multiplierPercent"
              input-id="multiplier-percent"
              :min="0"
              :max="1000"
              suffix=" %"
            />
          </div>
          <Button
            type="submit"
            :label="t('web.common.save')"
            icon="pi pi-check"
            :disabled="!multiplierTarget || multiplierPercent === null"
          />
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped>
.timeline,
.multipliers {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.timeline li,
.multipliers li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.35rem 0.35rem 0.85rem;
  border-radius: 8px;
  background: var(--mn-panel-raised);
}

.timeline li > :nth-child(2),
.multipliers li > :nth-child(2) {
  flex: 1;
}

.level-badge {
  min-width: 5.5rem;
  font-weight: 600;
  color: var(--mn-accent-soft);
}

.add {
  align-items: flex-end;
}

.grow {
  flex: 1;
  min-width: 200px;
}
</style>
