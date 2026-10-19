<script setup lang="ts">
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import { computed, reactive, ref } from 'vue';
import PageHeader from '../components/PageHeader.vue';
import RoleTag from '../components/RoleTag.vue';
import { t } from '../i18n/index.ts';
import { api, guildPath } from '../lib/api.ts';
import { useAsk, useLoader, useNotify } from '../lib/composables.ts';
import { errorMessage } from '../lib/errors.ts';
import { formatNumber } from '../lib/format.ts';
import { useGuild } from '../lib/guild.ts';
import { useRoles } from '../lib/roles.ts';
import type { ShopItem } from '../lib/types.ts';

const guild = useGuild();
const notify = useNotify();
const ask = useAsk();
const path = (suffix = '') => guildPath(guild.value.id, `/shop${suffix}`);

const { data, error, reload } = useLoader(() => api.get<{ items: ShopItem[] }>(path()));
const { roles, byId } = useRoles(guild.value.id);

const dialog = ref(false);
const form = reactive({
  name: '',
  price: 1000 as number | null,
  description: '',
  consumable: false,
  roleId: null as string | null,
});
const formError = ref<string | null>(null);
const saving = ref(false);

const typeOptions = computed(() => [
  { value: false, label: t('shop.permanent') },
  { value: true, label: t('shop.consumable') },
]);
const roleOptions = computed(() => [{ id: null, name: t('web.shop.noRole') }, ...roles.value]);

function openCreate(): void {
  Object.assign(form, { name: '', price: 1000, description: '', consumable: false, roleId: null });
  formError.value = null;
  dialog.value = true;
}

async function create(): Promise<void> {
  saving.value = true;
  formError.value = null;
  try {
    await api.post(path(), {
      name: form.name.trim(),
      price: form.price ?? 0,
      description: form.description.trim() || null,
      consumable: form.consumable,
      roleId: form.roleId,
    });
    dialog.value = false;
    notify.success(t('shopAdmin.addedBody', { item: form.name.trim() }).replace(/\*\*/g, ''));
    await reload();
  } catch (failure) {
    formError.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}

async function remove(item: ShopItem): Promise<void> {
  if (!(await ask(t('web.shop.removeConfirm', { name: item.name })))) return;
  try {
    await api.delete(path(`/${item.id}`));
    await reload();
  } catch (failure) {
    notify.failure(failure);
  }
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('web.nav.shop')" :subtitle="t('web.shop.subtitle')">
      <Button :label="t('web.shop.add')" icon="pi pi-plus" @click="openCreate" />
    </PageHeader>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
    <p v-else-if="data && !data.items.length" class="panel muted">{{ t('web.shop.empty') }}</p>
    <div v-else-if="data" class="grid items">
      <article v-for="item in data.items" :key="item.id" class="panel item">
        <div class="row between">
          <h3>{{ item.name }}</h3>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            :aria-label="t('web.common.delete')"
            @click="remove(item)"
          />
        </div>
        <p v-if="item.description" class="muted description">{{ item.description }}</p>
        <div class="row">
          <Tag
            :value="item.consumable ? t('shop.consumable') : t('shop.permanent')"
            :severity="item.consumable ? 'info' : 'secondary'"
          />
          <RoleTag v-if="item.roleId" :role="byId.get(item.roleId)" :fallback="item.roleId" />
        </div>
        <strong class="gold price">{{ formatNumber(item.price) }} 🪙</strong>
      </article>
    </div>

    <Dialog
      v-model:visible="dialog"
      :header="t('web.shop.add')"
      modal
      :style="{ width: 'min(480px, 95vw)' }"
    >
      <form class="stack" @submit.prevent="create">
        <div class="field">
          <label for="item-name">{{ t('web.shop.name') }}</label>
          <InputText id="item-name" v-model="form.name" :maxlength="50" fluid />
        </div>
        <div class="field">
          <label for="item-price">{{ t('web.shop.price') }}</label>
          <InputNumber v-model="form.price" input-id="item-price" :min="0" locale="en-US" fluid />
        </div>
        <div class="field">
          <label for="item-description">
            {{ t('web.shop.description') }}
            <span class="muted">({{ t('web.common.optional') }})</span>
          </label>
          <Textarea
            id="item-description"
            v-model="form.description"
            :maxlength="200"
            rows="2"
            fluid
          />
        </div>
        <div class="field">
          <label>{{ t('web.shop.type') }}</label>
          <SelectButton
            v-model="form.consumable"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
          />
        </div>
        <div class="field">
          <label for="item-role">{{ t('web.shop.role') }}</label>
          <Select
            v-model="form.roleId"
            input-id="item-role"
            :options="roleOptions"
            option-label="name"
            option-value="id"
            filter
            fluid
          />
          <small>{{ t('web.shop.roleHint') }}</small>
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
            :label="t('web.common.add')"
            :loading="saving"
            :disabled="!form.name.trim() || form.price === null"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.items {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.item {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.between {
  justify-content: space-between;
  flex-wrap: nowrap;
}

.description {
  margin: 0;
}

.price {
  margin-top: auto;
  font-size: 1.15rem;
}

.end {
  justify-content: flex-end;
}
</style>
