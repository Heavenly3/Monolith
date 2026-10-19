<script setup lang="ts">
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { t } from '../i18n/index.ts';
import { initials, userAvatar } from '../lib/format.ts';
import { logout, me } from '../lib/session.ts';
import LanguagePicker from './LanguagePicker.vue';

const router = useRouter();

async function signOut(): Promise<void> {
  await logout();
  await router.push({ name: 'login' });
}
</script>

<template>
  <div v-if="me" class="user-menu">
    <LanguagePicker />
    <Avatar
      :image="userAvatar(me) ?? undefined"
      :label="userAvatar(me) ? undefined : initials(me.username)"
      shape="circle"
    />
    <span class="name">{{ me.username }}</span>
    <Button
      v-tooltip.bottom="t('web.nav.logout')"
      icon="pi pi-sign-out"
      severity="secondary"
      text
      rounded
      :aria-label="t('web.nav.logout')"
      @click="signOut"
    />
  </div>
</template>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

@media (max-width: 640px) {
  .name {
    display: none;
  }
}
</style>
