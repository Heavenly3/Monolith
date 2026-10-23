<script setup lang="ts">
// A choice shown as cards: the label on top and the explanation below. Option
// texts look like "Gentle — levels come quickly".
defineProps<{ options: { value: string; text: string }[]; invalid?: boolean }>();
const model = defineModel<string>({ required: true });

const parts = (text: string) => {
  const [title, ...rest] = text.split(' — ');
  return { title, detail: rest.join(' — ') };
};
</script>

<template>
  <div class="choices" role="radiogroup" :class="{ invalid }">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="choice"
      :class="{ active: model === option.value }"
      :aria-checked="model === option.value"
      @click="model = option.value"
    >
      <i class="pi" :class="model === option.value ? 'pi-check-circle' : 'pi-circle'" />
      <span>
        <strong>{{ parts(option.text).title }}</strong>
        <small v-if="parts(option.text).detail">{{ parts(option.text).detail }}</small>
      </span>
    </button>
  </div>
</template>

<style scoped>
.choices {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.choice {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  text-align: left;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--mn-border);
  background: var(--mn-panel-raised);
  color: var(--mn-text);
  font: inherit;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    transform 0.15s;
}

.choice:hover {
  border-color: var(--mn-muted);
  transform: translateY(-1px);
}

.choice.active {
  border-color: var(--mn-accent);
  background: rgba(94, 200, 229, 0.1);
}

.choice i {
  margin-top: 0.15rem;
  color: var(--mn-muted);
}

.choice.active i {
  color: var(--mn-accent);
}

.choice span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.choice small {
  color: var(--mn-muted);
}

.invalid .choice {
  border-color: var(--p-red-400);
}
</style>
