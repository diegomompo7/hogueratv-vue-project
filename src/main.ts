import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import Spanish from './lang/es.json'
import Valencia from './lang/va.json'

const i18n = createI18n({
  legacy: false,
  locale: document.documentElement.lang || 'ca-valencia',
  fallbackLocale: 'ca-valencia',
  messages: {
    es: Spanish,
    'ca-valencia': Valencia,
  },
})

createApp(App).use(i18n).mount('#app')
