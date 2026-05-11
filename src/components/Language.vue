<script setup lang="ts">
import { useArrowNav } from '@/composables/useArrowNav'

const props = defineProps<{
  language: string
}>()

const emit = defineEmits<{
  (e: 'change', lang: string): void
}>()

const { register } = useArrowNav()
</script>

<template>
  <div class="lang-selector" role="group" aria-label="Selector d'idioma">
    <button
      :ref="(el) => register(el as HTMLElement, 'lang-va')"
      class="lang-btn"
      :class="{ 'lang-btn--active': language === 'va' }"
      :aria-pressed="language === 'va'"
      type="button"
      @click="emit('change', 'va')"
    >
      <img src="/assets/img/valencia.svg" alt="" aria-hidden="true" class="lang-btn__flag">
      <span>Val</span>
    </button>

    <button
      :ref="(el) => register(el as HTMLElement, 'lang-es')"
      class="lang-btn"
      :class="{ 'lang-btn--active': language === 'es' }"
      :aria-pressed="language === 'es'"
      type="button"
      @click="emit('change', 'es')"
    >
      <img src="/assets/img/spain.svg" alt="" aria-hidden="true" class="lang-btn__flag">
      <span>Esp</span>
    </button>
  </div>
</template>

<style scoped>
.lang-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--color-text-muted);
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast), border-color var(--transition-fast);
}

.lang-btn--active,
.lang-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  opacity: 1;
}

.lang-btn__flag {
  width: clamp(28px, 3vw, 40px);
  height: auto;
}
</style>
