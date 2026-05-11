# Business Logic

## Gestión de idioma y locale

### Detección inicial (`main.js`)

```js
const i18n = createI18n({
  legacy: false,                                          // Modo Composition API
  locale: document.documentElement.lang || 'ca-valencia', // <html lang="ca-valencia">
  fallbackLocale: 'ca-valencia',
  messages: { 'es': Spanish, 'ca-valencia': Valencia },
})
```

`index.html` tiene `<html lang="ca-valencia">`, así que el locale inicial es siempre `'ca-valencia'` salvo que se sobrescriba con `?lang=`.

### Sobrescritura y propagación (`App.vue`)

```js
// onMounted: aplica el parámetro ?lang si existe
onMounted(() => {
  locale.value = lang ?? 'va'   // lang viene de useQueryParams (null si no hay ?lang)
})

// watch con { immediate: true }: actualiza messages y document.lang en cada cambio
watch(locale, (newLocale) => {
  switch (newLocale) {
    case 'es':
      messages.value = Spanish
      document.documentElement.lang = 'es'
      break
    case 'va':
    default:
      messages.value = Valencia
      document.documentElement.lang = 'ca-valencia'
      break
  }
}, { immediate: true })
```

### Sistema dual de internacionalización

`App.vue` mantiene **dos sistemas en paralelo** para distintos propósitos:

| Sistema | Tipo | Qué maneja | Dónde se usa |
|---|---|---|---|
| `messages` ref manual | `ref({})` propagado como prop | Textos de la interfaz | Atributos, botones, aria-labels, títulos |
| `$t()` de vue-i18n | Composable de vue-i18n | Rutas de assets (audio, subtítulos) | `<source :src="$t('audio1')">`, fetch en useSubtitles |

> **Por qué dos sistemas:** Los textos de la UI necesitan reactividad explícita como prop. Las rutas de audio necesitan cambiar en los atributos `<source :src>` del DOM, que vue-i18n maneja con `$t()` en el template. Duplicar uno de los dos mecanismos habría complicado el código.

---

## Composable: `useQueryParams`

**Fichero:** [src/composables/useQueryParams.js](../src/composables/useQueryParams.js)

```js
// Singleton: se parsea UNA vez al importar el módulo.
// Todos los componentes que llamen a useQueryParams() reciben el MISMO ref reactivo.
const params     = new URLSearchParams(window.location.search)
const _lang      = params.get('lang')          // 'es' | 'va' | null
const initParam  = params.get('init')
const _initScene = ref(initParam !== null ? Number(initParam) - 1 : -1)

export function useQueryParams() {
  return { lang: _lang, initScene: _initScene }
}
```

**Por qué singleton:** `initScene` se muta desde `Scenes.vue` al navegar (p.ej. `initScene.value = 6` al ir a lengua de signos). Si se creara un `ref` nuevo en cada llamada a `useQueryParams()`, `Language.vue`, `App.vue` y `Scenes.vue` tendrían instancias independientes y la mutación no se propagaría.

**Conversión URL → índice interno:**

| URL | `initScene.value` | Pantalla |
|---|---|---|
| Sin `?init` | `-1` | Introducción |
| `?init=1` | `0` | Escena 1 del carrusel |
| `?init=3` | `2` | Escena 3 del carrusel |
| `?init=5` | `4` | Escena 5 del carrusel |
| (botón lengua de signos) | `6` | Vídeo lengua de signos |

---

## Composable: `useAudioControl`

**Fichero:** [src/composables/useAudioControl.js](../src/composables/useAudioControl.js)

### Slots de audio

El composable gestiona **7 slots** (índices 0–6):

| Índice | Audio |
|---|---|
| `0` | Introducción (`audioPlayerIntroduction`) |
| `1` | Escena 1 (`audioPlayer1`) |
| `2` | Escena 2 (`audioPlayer2`) |
| `3` | Escena 3 (`audioPlayer3`) |
| `4` | Escena 4 (`audioPlayer4`) |
| `5` | Escena 5 (`audioPlayer5`) |
| `6` | Reservado (no usado actualmente) |

### Estado reactivo

```js
const audioRefs = ref(new Array(7).fill(null))  // refs a los <audio> del DOM
const isPlayed  = ref(new Array(7).fill(false)) // true = reproduciendo ahora
const isLoading = ref(new Array(7).fill(false)) // true = en loadstart, antes de canplay
const isError   = ref(new Array(7).fill(false)) // true = error irrecuperable de carga
```

Los refs al DOM se asignan en el template con `:ref="(el) => { audioRefs[0] = el }"`.

### API pública

```js
controlAudio(index)      // Toggle play/pause: pausa todos los demás, luego play/pause el índice
pauseAll()               // Pausa todos los audios activos sin resetear currentTime
handleAudioEnded(index)  // @ended: isPlayed[index] = false
handleLoadStart(index)   // @loadstart: isLoading[index] = true, isError[index] = false
handleCanPlay(index)     // @canplay: isLoading[index] = false
handleAudioError(index)  // @error: isError[index] = true, isPlayed[index] = false
```

### Reset al cambiar idioma

```js
watch(getLanguage, () => {
  audioRefs.value.forEach((el, i) => {
    if (el) {
      el.pause()
      el.currentTime = 0
      el.load()              // Fuerza al navegador a releer el <source> con la nueva ruta
      isPlayed.value[i]  = false
      isLoading.value[i] = false
      isError.value[i]   = false
    }
  })
})
```

`el.load()` es necesario porque cambiar el locale hace que `$t('audio1')` devuelva una ruta distinta, pero el `<audio>` no recarga automáticamente. `el.load()` reinicia la carga del recurso apuntado por `<source :src>`.

### Wrapper `onAudioEnded` en `Scenes.vue`

```js
// Combina handleAudioEnded + resetSubtitles en un solo callback de @ended
const onAudioEnded = (index) => {
  handleAudioEnded(index)   // isPlayed[index] = false
  resetSubtitles()           // Oculta subtítulos + detiene polling
}
```

El template del carrusel usa `@ended="onAudioEnded(((5 + index) % 5) + 1)"`. Si se usara `handleAudioEnded` directamente, los subtítulos quedarían visibles aunque el audio ya hubiera terminado.

---

## Composable: `useSubtitles`

**Fichero:** [src/composables/useSubtitles.js](../src/composables/useSubtitles.js)

### Caché de módulo

```js
const subtitleCache = new Map()   // url → stab_segments[]
```

Se declara a nivel de módulo (fuera de la función), no dentro del composable. Persiste durante toda la sesión: si el usuario activa los subtítulos de la misma escena dos veces, el segundo fetch no se realiza.

### Mapeo de índices

`toggleSubtitles(index)` recibe el **índice de subtítulo** (distinto del índice de audioRef):

| Pantalla | `toggleSubtitles(index)` | `audioRefs[refIdx]` usada |
|---|---|---|
| Introducción | `toggleSubtitles(-1)` | `audioRefs[0]` |
| Escena 1 | `toggleSubtitles(0)` | `audioRefs[1]` |
| Escena 2 | `toggleSubtitles(1)` | `audioRefs[2]` |
| Escena N | `toggleSubtitles(N-1)` | `audioRefs[N]` |

La conversión se hace con: `const refIdx = activeIndex === -1 ? 0 : activeIndex + 1`

### URL del JSON de subtítulos

```js
const getSubtitleUrl = (index) => {
  const msgs = getMessages()
  if (index === -1) return msgs.subtitleIntroduction   // Intro
  return msgs[`subtitle${index + 1}`]                  // Escenas: subtitle1...subtitle5
}
```

Las URLs se leen del objeto `messages` pasado como getter, por lo que cambian automáticamente al cambiar de idioma.

### Flujo al activar subtítulos

```
Usuario pulsa "Activar Subtítols" con índice idx
  → toggleSubtitles(idx)
  → Si mismo índice ya activo → apagar (showSubtitles=false, stopPolling, activeIndex=null)
  → Si nuevo índice:
      activeIndex = idx
      await loadSegments(idx)   ← fetch o caché hit
      showSubtitles.value = true
      startPolling()            ← setInterval(100ms)

Cada 100ms:
  → el = audioRefs.value[activeIndex === -1 ? 0 : activeIndex + 1]
  → t = el.currentTime
  → seg = segments.find(s => t >= s.start && t < s.end) ?? null
  → currentSubtitle.value = seg
```

### `resetSubtitles` (reset completo)

```js
const resetSubtitles = () => {
  showSubtitles.value   = false
  currentSubtitle.value = null
  stopPolling()
  activeIndex = null
  segments    = []
}
```

Llamado desde: cambio de escena (`handleSlideChange`), fin de audio (`onAudioEnded`). **No borra el caché** — solo limpia el estado local del composable.

### Cleanup al desmontar

```js
onUnmounted(stopPolling)   // Evita memory leak si el componente se destruye con polling activo
```

---

## Ficheros de traducción (`es.json` / `va.json`)

Cada fichero contiene **dos tipos de claves** en el mismo objeto JSON:

### 1. Textos de la interfaz (usados en `messages.*`)

```json
{
  "header":            "Capçalera de la Foguera Sant Blai de Dalt",
  "introduction":      "Introducció",
  "audioGuide":        "Audioguia",
  "playAudio":         "Reproduir audioguia",
  "pauseAudio":        "Pausar audioguia",
  "audioLoading":      "Carregant…",
  "audioError":        "Error en carregar l'àudio",
  "enableSubtitle":    "Activar Subtítols",
  "disableSubtitle":   "Desactivar Subtítols",
  "signLanguageButton":"Llengua de signes",
  "scene1":            "Banyà",
  "scene2":            "La Nimfa de l'Aigua",
  "nextScene":         "Escena següent",
  "previousScene":     "Escena anterior"
}
```

### 2. Rutas de assets multimedia (usadas con `$t('...')`)

```json
{
  "audioIntroduction":    "/assets/audio/Valencia/SceneIntroduction.mp3",
  "audio1":               "/assets/audio/Valencia/Scene12025.mp3",
  "audio2":               "/assets/audio/Valencia/Scene22025.mp3",
  "subtitleIntroduction": "/assets/audio/Valencia/SceneIntroduction.json",
  "subtitle1":            "/assets/audio/Valencia/Scene1.json"
}
```

> **Patrón clave:** cambiar el idioma cambia simultáneamente los textos de la UI **y** las rutas de los ficheros de audio y subtítulos. El mismo `<source :src="$t('audio1')">` apunta a un MP3 distinto según el locale activo.

---

## Gestión del carrusel

### Índice circular de escenas

Los slides se renderizan con `v-for="(_, index) in 5"` (índices 0–4). El mapeo a las claves de traducción usa aritmética modular para soportar el loop de Swiper:

```js
const sceneKey = ((5 + index) % 5) + 1
// index=0 → sceneKey=1
// index=1 → sceneKey=2
// index=4 → sceneKey=5
```

La fórmula `(5 + index) % 5` protege contra índices negativos que pueden aparecer cuando Swiper clona slides en modo loop.

### Cambio de escena

```js
// @slideChangeTransitionStart de Swiper
const handleSlideChange = (swiper) => {
  currentSlide.value = swiper.realIndex   // Actualiza el contador "1/5"
  pauseAll()                               // Detiene el audio de la escena anterior
  resetSubtitles()                         // Oculta y limpia los subtítulos
}
```

### Navegación externa

Los botones `‹` / `›` están **fuera del `<swiper>`** (en `.scene-nav`) para que Swiper no los desplace al renderizar slides clonados en modo loop:

```js
const navigateNext = () => swiperInstance.value?.slideNext()
const navigatePrev = () => swiperInstance.value?.slidePrev()
```
