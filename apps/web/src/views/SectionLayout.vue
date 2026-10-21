<script setup lang="ts">
import { computed, provide } from 'vue';
import { t } from '../i18n/index.ts';
import { IN_SECTION } from '../lib/guild.ts';
import { SECTIONS, tabRoute, type SectionId } from '../lib/sections.ts';

const props = defineProps<{ section: SectionId }>();
const section = computed(() => SECTIONS[props.section]);
// "Manage" tabs on one row, "Settings" tabs on the next; both wrap on small screens.
const groups = computed(() =>
  (['manage', 'settings'] as const)
    .map((kind) => ({ kind, tabs: section.value.tabs.filter((tab) => tab.kind === kind) }))
    .filter((group) => group.tabs.length),
);

// Pages inside a section show their title one level below the section's.
provide(IN_SECTION, true);
</script>

<template>
  <div class="section">
    <header class="section-head">
      <span class="section-icon"><i :class="section.icon" /></span>
      <div>
        <h1>{{ t(`web.sections.${props.section}.title`) }}</h1>
        <p class="muted">{{ t(`web.sections.${props.section}.description`) }}</p>
      </div>
    </header>

    <nav class="tabs" :aria-label="t(`web.sections.${props.section}.title`)">
      <div v-for="group in groups" :key="group.kind" class="tab-group">
        <span v-if="groups.length > 1" class="tabs-label">{{
          t(`web.sections.${group.kind}`)
        }}</span>
        <RouterLink
          v-for="tab in group.tabs"
          :key="tab.id"
          :to="{ name: tabRoute(props.section, tab.id) }"
          class="tab"
          active-class="active"
        >
          <i :class="tab.icon" /> {{ t(tab.label) }}
        </RouterLink>
      </div>
    </nav>

    <RouterView v-slot="{ Component, route }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1100px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-head p {
  margin: 0.2rem 0 0;
}

.section-icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  background: rgba(201, 162, 39, 0.14);
  color: var(--mc-gold);
  font-size: 1.3rem;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--mc-border);
}

.tab-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.tabs-label {
  width: 5.5rem;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--mc-muted);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--mc-border);
  color: var(--mc-muted);
  text-decoration: none;
  white-space: nowrap;
  font-size: 0.9rem;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s;
}

.tab:hover {
  color: var(--mc-text);
  border-color: var(--mc-muted);
}

.tab.active {
  color: var(--mc-gold-soft);
  border-color: var(--mc-gold);
  background: rgba(201, 162, 39, 0.12);
}

@media (max-width: 640px) {
  .tabs-label {
    width: 100%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
}
</style>
