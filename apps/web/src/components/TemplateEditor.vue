<script setup lang="ts">
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import { computed, nextTick, ref } from 'vue';
import { t } from '../i18n/index.ts';

// Message editor for admins who should never type {placeholders}: variables
// are inserted with buttons and the preview shows them as filled-in badges.
const props = defineProps<{
  variables: readonly string[];
  /** Built-in text used when the message is left empty. */
  fallback: string;
  limit: number;
  invalid?: boolean;
  inputId?: string;
}>();
const model = defineModel<string>({ required: true });

const editor = ref<{ $el: HTMLTextAreaElement } | null>(null);

async function insert(variable: string): Promise<void> {
  const token = `{${variable}}`;
  const textarea = editor.value?.$el;
  const start = textarea?.selectionStart ?? model.value.length;
  const end = textarea?.selectionEnd ?? model.value.length;
  model.value = `${model.value.slice(0, start)}${token}${model.value.slice(end)}`;
  await nextTick();
  textarea?.focus();
  textarea?.setSelectionRange(start + token.length, start + token.length);
}

const sample = (variable: string): string => t(`web.template.samples.${variable}`);

interface PreviewPart {
  text: string;
  variable: boolean;
  bold: boolean;
  italic: boolean;
}

/**
 * The message as members will read it: variables become badges and
 * **bold** / *italic* are applied like Discord does.
 */
const preview = computed<PreviewPart[]>(() => {
  const text = model.value.trim() || props.fallback;
  const parts: PreviewPart[] = [];
  let bold = false;
  let italic = false;
  for (const token of text.split(/(\*\*|\*|\{\w+\})/)) {
    if (token === '**') bold = !bold;
    else if (token === '*') italic = !italic;
    else if (token) {
      const name = token.match(/^\{(\w+)\}$/)?.[1];
      const variable = Boolean(name && props.variables.includes(name));
      parts.push({ text: variable ? sample(name!) : token, variable, bold, italic });
    }
  }
  return parts;
});
</script>

<template>
  <div class="template">
    <div class="chips">
      <span class="muted chips-label">{{ t('web.template.insert') }}</span>
      <Button
        v-for="variable in variables"
        :key="variable"
        :label="t(`web.template.variables.${variable}`)"
        size="small"
        severity="secondary"
        outlined
        rounded
        type="button"
        @click="insert(variable)"
      />
    </div>
    <Textarea
      :id="inputId"
      ref="editor"
      v-model="model"
      :placeholder="fallback"
      :maxlength="limit"
      :invalid="invalid"
      rows="3"
      auto-resize
      fluid
    />
    <div class="row between">
      <small class="muted">{{ model.length }} / {{ limit }}</small>
      <Button
        v-if="model"
        :label="t('web.template.useBuiltIn')"
        icon="pi pi-undo"
        size="small"
        text
        type="button"
        @click="model = ''"
      />
    </div>
    <div class="preview">
      <span class="muted preview-label">{{ t('web.template.preview') }}</span>
      <p>
        <span
          v-for="(part, i) in preview"
          :key="i"
          :class="{ badge: part.variable, bold: part.bold, italic: part.italic }"
          >{{ part.text }}</span
        >
      </p>
    </div>
  </div>
</template>

<style scoped>
.template {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.chips-label {
  font-size: 0.85rem;
  margin-right: 0.25rem;
}

.between {
  justify-content: space-between;
}

.preview {
  padding: 0.65rem 0.9rem;
  border-left: 3px solid var(--mn-accent);
  border-radius: 6px;
  background: var(--mn-panel-raised);
}

.preview p {
  margin: 0.15rem 0 0;
  white-space: pre-wrap;
}

.preview-label {
  font-size: 0.8rem;
}

.bold {
  font-weight: 700;
}

.italic {
  font-style: italic;
}

.badge {
  display: inline-block;
  padding: 0 0.45rem;
  border-radius: 4px;
  background: rgba(88, 101, 242, 0.25);
  color: #c9cdfb;
  font-weight: 600;
}
</style>
