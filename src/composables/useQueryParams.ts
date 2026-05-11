import { ref } from 'vue'

// Singleton: parsed once, shared across all components
const params = new URLSearchParams(window.location.search)
const _lang = params.get('lang')                   // 'es' | 'va' | null
const initParam = params.get('init')
const _initScene = ref(initParam !== null ? Number(initParam) - 1 : -1)

export function useQueryParams() {
  return { lang: _lang, initScene: _initScene }
}
