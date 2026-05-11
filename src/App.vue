<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Header  from './components/Header.vue'
import Language from './components/Language.vue'
import Scenes  from './components/Scenes.vue'
import { useQueryParams } from './composables/useQueryParams'
import Spanish  from './lang/es.json'
import Valencia from './lang/va.json'

const { locale } = useI18n()
const { lang, initScene } = useQueryParams()

// Manual messages ref — passed as prop to Scenes (for UI text reactivity)
const messages = ref<Record<string, string>>(Valencia as Record<string, string>)

// language string for useAudioControl and Language.vue
const language = ref<string>('va')

onMounted(() => {
  language.value = lang ?? 'va'
  locale.value   = language.value === 'es' ? 'es' : 'ca-valencia'
})

watch(language, (newLang) => {
  if (newLang === 'es') {
    messages.value = Spanish  as Record<string, string>
    locale.value   = 'es'
    document.documentElement.lang = 'es'
  } else {
    messages.value = Valencia as Record<string, string>
    locale.value   = 'ca-valencia'
    document.documentElement.lang = 'ca-valencia'
  }
}, { immediate: true })

function setLanguage(lang: string) {
  language.value = lang
}
</script>

<template>
  <div class="app-shell">
    <Header :title="messages.header ?? ''">
      <!-- Language selector — only on introduction screen -->
      <Language
        v-if="initScene === -1"
        :language="language"
        @change="setLanguage"
      />
    </Header>

    <Scenes :messages="messages" :language="language" />
  </div>
</template>

<style scoped>
.app-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
