<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <header class="site-header" role="banner">
    <div class="site-header__brand">
      <img
        src="/assets/img/logo.png"
        :alt="title"
        class="site-header__logo"
        role="none"
      >
      <span class="site-header__title" aria-hidden="true">{{ title }}</span>
    </div>
    <div class="site-header__slot">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(2rem, 4vw, 4rem);
  height: clamp(70px, 8vh, 100px);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
  flex-shrink: 0;
}

.site-header__brand {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.5rem);
}

.site-header__logo {
  height: clamp(40px, 5vh, 64px);
  width: auto;
}

.site-header__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.site-header__slot {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
