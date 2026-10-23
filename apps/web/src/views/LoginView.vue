<script setup lang="ts">
import BrandLogo from '../components/BrandLogo.vue';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import LanguagePicker from '../components/LanguagePicker.vue';
import { t } from '../i18n/index.ts';

const route = useRoute();
const notice = computed(() => {
  if (route.query.login === 'failed') return t('web.login.failed');
  if (route.query.expired) return t('web.common.sessionExpired');
  return null;
});
</script>

<template>
  <main class="login">
    <section class="panel card">
      <BrandLogo :size="52" :name="false" />
      <h1>{{ t('web.login.title') }}</h1>
      <p class="muted">{{ t('web.login.subtitle') }}</p>
      <Message v-if="notice" severity="warn" :closable="false">{{ notice }}</Message>
      <Button
        as="a"
        href="/auth/login"
        :label="t('web.login.button')"
        icon="pi pi-discord"
        size="large"
        fluid
      />
      <small class="muted">{{ t('web.login.note') }}</small>
      <LanguagePicker />
    </section>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.card {
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2.5rem 2rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.crest {
  font-size: 2.75rem;
  line-height: 1;
}

.card p {
  margin: 0;
}
</style>
