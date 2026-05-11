# Arquitectura

## Estructura de carpetas

```
hoguera-vue-project/
│
├── index.html                        # Entrada HTML: Google Fonts, meta, mount point #app
├── vite.config.js                    # Build: alias @, code splitting, drop console en prod
├── package.json
│
├── docs/                             # Esta documentación
│
└── src/
    ├── main.js                       # Bootstrap: createApp + vue-i18n + mount
    ├── App.vue                       # Raíz: gestiona locale y prop messages
    ├── style.css                     # Estilos base: gradiente fondo, fade-in app, tipografía
    │
    ├── components/
    │   ├── SkipLink.vue              # Skip links para navegación por teclado
    │   ├── Language.vue              # Selector de idioma (banderas VA/ES) — solo en intro
    │   ├── Header.vue                # Cabecera: logo + imagen patrocinador Anis Tenis
    │   └── Scenes.vue                # Componente principal: 3 modos + audio + subtítulos
    │
    ├── composables/
    │   ├── useQueryParams.js         # Singleton: parsea ?lang y ?init de la URL una sola vez
    │   ├── useAudioControl.js        # Estado y control de reproducción de 7 slots de audio
    │   └── useSubtitles.js           # Fetch + polling de subtítulos sincronizados
    │
    ├── lang/
    │   ├── es.json                   # Textos ES + rutas de assets en español
    │   └── va.json                   # Textos VA + rutas de assets en valenciano
    │
    ├── assets/
    │   ├── audio/
    │   │   ├── Spanish/              # SceneIntroduction.mp3, Scene1–5.mp3 + JSON subtítulos
    │   │   └── Valencia/             # SceneIntroduction.mp3, Scene1–52025.mp3 + JSON subtítulos
    │   ├── img/                      # logo.png, anis_tenis.png, valencia.svg, spain.svg
    │   └── video/
    │       └── signLanguageIntroduction.mp4
    │
    └── scss/
        ├── custom.scss               # Fichero principal (importa todo el sistema)
        ├── custom.css                # Compilado de custom.scss — NO editar manualmente
        ├── tokens/
        │   └── _tokens.scss          # CSS Custom Properties: colores, tipografía, espaciado, glow
        ├── components/
        │   ├── _buttons.scss         # .btn-audio y .btn-audio--secondary
        │   ├── _scenes.scss          # .scene-card y animación titleFadeIn
        │   └── _header.scss          # .site-header BEM
        └── utilities/
            ├── _widths.scss          # .w-* (fijos y porcentuales fraccionales)
            ├── _heights.scss         # Reservado para futuras utilidades de altura
            ├── _marginPadding.scss   # .mt-*, .mb-*, .pt-*, .pb-* fraccionales
            ├── _colors.scss          # .text-yellow, .bg-black
            └── _fontSize.scss        # .fs-text_sm, .fs-text_base, .fs-text_lg
```

---

## Diagrama de componentes

```
index.html
    └── #app
         └── App.vue           ← gestiona locale + messages ref
              ├── SkipLink.vue  ← skip links de teclado ("Saltar al menú", "Saltar al contingut")
              ├── Language.vue  ← selector idioma VA/ES (v-if="initScene === -1")
              ├── Header.vue    ← logo + patrocinador
              └── Scenes.vue    ← lógica principal (recibe :messages y :language como props)
                   ├── useQueryParams   (URL → initScene singleton)
                   ├── useAudioControl  (7 slots de audio)
                   ├── useSubtitles     (fetch + polling cada 100ms)
                   ├── [Swiper intro]   initScene === -1
                   ├── [Swiper signos]  initScene === 6
                   └── [Swiper carrusel] initScene 0–4
```

---

## Flujo de arranque

```
1. index.html carga
   ├── Google Fonts (Inter + Playfair Display) — con preconnect
   ├── src/scss/custom.css — tokens + Bootstrap + botones + escenas + header
   └── src/main.js

2. main.js ejecuta
   ├── Importa es.json y va.json
   ├── Crea instancia vue-i18n
   │    ├── legacy: false  (modo Composition API)
   │    ├── locale: document.documentElement.lang  ('ca-valencia' en index.html)
   │    ├── fallbackLocale: 'ca-valencia'
   │    └── messages: { 'es': Spanish, 'ca-valencia': Valencia }
   └── createApp(App).use(i18n).mount('#app')

3. App.vue se monta
   ├── onMounted: locale.value = lang ?? 'va'  (lang viene de useQueryParams, puede ser null)
   └── watch(locale, { immediate: true })
        ├── 'es'  → messages.value = Spanish  + document.lang = 'es'
        └── 'va'  → messages.value = Valencia + document.lang = 'ca-valencia'

4. Scenes.vue se monta
   ├── useQueryParams() → initScene (ref singleton compartido)
   ├── useAudioControl(() => props.language) → 7 slots de audio + estado
   └── useSubtitles(audioRefs, () => props.messages) → subtítulos sincronizados
```

---

## Configuración Vite

```js
// vite.config.js
{
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }   // import '@/composables/...'
  },
  esbuild: {
    drop: ['console']   // Elimina console.log/warn/error en producción
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue:    ['vue', 'vue-i18n'],  // Bundle separado — cacheado por el navegador
          swiper: ['swiper'],            // Bundle separado — cacheado por el navegador
        }
      }
    }
  }
}
```

> **Por qué code splitting:** Si solo cambia la lógica de la app, el navegador solo descarga el bundle principal. Los vendors `vue` y `swiper` se sirven desde caché en visitas posteriores.

---

## CSS: dos pipelines paralelos

| Pipeline | Ficheros fuente | Compilado por | Cargado en |
|---|---|---|---|
| SCSS global | `custom.scss` → `custom.css` | `npx sass` (manual) | `<link>` en `index.html` |
| CSS de componentes | `<style scoped>` en `.vue` | Vite (automático en build) | Bundle JS |

> **Importante:** Vite **no** vigila `src/scss/custom.scss` ni sus parciales durante `npm run dev`. Si los editas, ejecuta `npx sass` manualmente para regenerar `custom.css`.

Los estilos `<style scoped>` en `Scenes.vue` tienen precedencia sobre las clases globales de `custom.css` gracias al atributo de scope que Vite inyecta. Esto permite sobreescribir `.scene-card { padding-bottom: 0 }` sin afectar a otros componentes.

---

## Accesibilidad en la arquitectura

| Mecanismo | Implementación |
|---|---|
| Skip links | `SkipLink.vue` → `#languages` y `#main-content`; ocultos hasta recibir foco |
| Landmarks ARIA | `<header>`, `<main>`, `role="region"` en los tres bloques de Scenes.vue |
| Un solo `<h1>` | Título de la escena activa en `Scenes.vue`; `Header.vue` usa `<span class="visually-hidden">` |
| Estados de botón | `aria-pressed` (idioma), `aria-controls` (audio), `aria-label` dinámico según estado |
| Subtítulos en vivo | `role="status" aria-live="polite"` — lectores de pantalla los anuncian al cambiar |
| Touch targets | Mínimo 44px (`--touch-min`) en todos los elementos interactivos |
| Teclado | `:focus-visible` con outline dorado 3px; sin outline al hacer clic |
| Movimiento reducido | `prefers-reduced-motion` desactiva animaciones en tokens y CSS scoped |
| Vídeo accesible | Sin `autoplay`; `<track kind="captions">` con fichero VTT |
| Imágenes decorativas | `alt=""` + `role="none"` (logo) |
| Zoom | `maximum-scale=5.0` en viewport — permite hasta 5× de zoom |
