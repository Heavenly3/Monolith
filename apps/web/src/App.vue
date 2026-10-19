<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { sessionExpired } from './lib/api.ts';
import { me } from './lib/session.ts';

const router = useRouter();

// Any 401 from the API means the session is gone: back to the login page.
watch(sessionExpired, (expired) => {
  if (!expired) return;
  sessionExpired.value = false;
  if (!me.value) return; // Nobody was signed in: the router already shows the login page.
  me.value = null;
  void router.push({ name: 'login', query: { expired: '1' } });
});
</script>

<template>
  <Toast position="bottom-right" />
  <ConfirmDialog />
  <RouterView />
</template>
