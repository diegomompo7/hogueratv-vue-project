# Funcionalidad

## Los tres modos de pantalla

La app renderiza uno de tres bloques según el valor de `initScene` (derivado del parámetro `?init` de la URL):

| `initScene` | Cómo se llega | Pantalla |
|---|---|---|
| `-1` | `/` (sin parámetro `?init`) | **Introducción** |
| `0`–`4` | `/?init=1` → `/?init=5` | **Carrusel de escenas** |
| `6` | Botón "Llengua de signes" en la intro | **Vídeo lengua de signos** |

El cambio entre modos se hace mutando `initScene.value` desde `Scenes.vue`:
- Al pulsar "Llengua de signes" → `initScene.value = 6`
- Al cargar con `?init=N` → `initScene = N - 1` (conversión 1-indexed → 0-indexed, en `useQueryParams`)

---

## Pantalla 1 — Introducción (`initScene === -1`)

Se muestra al entrar sin `?init` en la URL. Es la pantalla de bienvenida.

**Estructura visual:**
```
[ selector idioma VA | ES ]       ← Language.vue (solo visible aquí)
[ logo ]         [ Anis Tenis ]   ← Header.vue
┌──────────────────────────────┐
│   Introducció / Introducción  │  ← h1 .scene-card__title
│                              │
│  [ Audioguia ]               │  ← botón primario .btn-audio
│  [ Activar Subtítols ]       │  ← botón secundario .btn-audio--secondary
│  ─────────────────────────   │  ← separador (solo en pantallas ≥ 576px)
│  [ Llengua de signes ]       │  ← botón primario → navega a modo 3
│                              │
│  [ (subtítulos pill) ]       │  ← aparece si showSubtitles && hay segmento activo
└──────────────────────────────┘
```

En móvil los tres botones se apilan en columna. En pantallas ≥ 576px los controles de audio pasan a fila con un separador vertical entre el bloque de audio/subtítulos y el botón de lengua de signos.

**Flujo típico del usuario:**
1. Selecciona idioma (valenciano por defecto)
2. Pulsa "Audioguia" → se reproduce el audio de introducción
3. Pulsa "Activar Subtítols" → aparecen subtítulos sincronizados con el audio
4. Pulsa "Llengua de signes" → navega al vídeo de introducción en LSE

---

## Pantalla 2 — Carrusel de escenas (`initScene` 0–4)

Se accede con `?init=1` hasta `?init=5`, o navegando con las flechas.

**Estructura visual:**
```
[ logo ]         [ Anis Tenis ]
┌──────────────────────────────┐
│    Banyà                     │  ← .scene-card__title (Playfair Display, dorado)
│                              │
│  [ Reproduir audioguia ]     │  ← .btn-audio
│  [ Activar Subtítols ]       │  ← .btn-audio--secondary
│                              │
│  [ (subtítulos pill) ]       │  ← visible solo si showSubtitles && hay segmento activo
└──────────────────────────────┘
  ‹           1 / 5          ›    ← .scene-nav (fuera del Swiper)
```

**Navegación:**
- Botones `‹` / `›` (externos al Swiper) — cambian de escena
- Swipe táctil horizontal nativo
- Carrusel con **loop** — tras la escena 5 vuelve a la 1
- Al cambiar de escena: el audio en curso se **pausa**, los subtítulos se **ocultan y resetean**

**Títulos de las 5 escenas:**

| Escena | Valenciano | Español |
|---|---|---|
| 1 | Banyà | La Noche de la Baña |
| 2 | La Nimfa de l'Aigua | La Ninfa del Agua |
| 3 | La Palmera de Focs | La Palmera de Fuegos |
| 4 | La Palometa | La Palometa |
| 5 | Les Belleses d'Alacant | Las Bellezas de Alicante |

---

## Pantalla 3 — Vídeo lengua de signos (`initScene === 6`)

Se accede desde el botón "Llengua de signes" de la pantalla de introducción.

**Contenido:**
- Título `messages.signLanguage` como `.scene-card__title`
- Vídeo `signLanguageIntroduction.mp4` con controles nativos del navegador (`controls`)
- Track de captions VTT adjunto (`/assets/captions/signLanguageIntroduction.vtt`)
- Atributo `playsinline` para evitar pantalla completa automática en iOS
- Sin `autoplay` — el usuario inicia la reproducción

---

## Feature: Reproducción de audio

Cada pantalla tiene su elemento `<audio>` con `id` único (`audioPlayerIntroduction`, `audioPlayer1`–`audioPlayer5`). El botón de audio cambia de texto y clase según el ciclo de vida:

| Estado | Clase CSS | Texto del botón | Interacción |
|---|---|---|---|
| Listo para reproducir | — | `playAudio` / `audioGuide` (intro) | Clic → reproduce |
| Reproduciendo | — | `pauseAudio` | Clic → pausa |
| Cargando | `.is-loading` | `audioLoading` | Pulse animado, no interactivo |
| Error de carga | `.is-error` | `audioError` | Texto rojo, no interactivo, `disabled` |

**Reglas de reproducción:**
- Solo puede sonar **un audio a la vez** — `pauseAll()` se llama antes de reproducir cualquier nuevo audio
- Al cambiar de escena en el carrusel, el audio en curso se pausa automáticamente
- Al terminar el audio de forma natural, `isPlayed[index]` vuelve a `false` y los subtítulos se ocultan

**Al cambiar idioma:** todos los audios se pausan, vuelven a `currentTime = 0` y llaman a `el.load()` para recargar la `src` del nuevo idioma (las rutas de audio son distintas por locale).

---

## Feature: Subtítulos sincronizados

Los subtítulos son segmentos de texto con tiempos de inicio y fin, cargados desde un JSON externo.

**Activación:**
1. Usuario pulsa "Activar Subtítols"
2. Se hace un **fetch único** del JSON de subtítulos de esa escena (URL leída desde `messages.subtitleX`)
3. Los segmentos se guardan en un **caché en memoria** (`subtitleCache` Map) para no repetir el fetch
4. Se inicia un `setInterval` cada 100ms que lee `audio.currentTime`
5. El segmento activo se muestra en un pill dorado semitransparente

**Durante la reproducción:** cada 100ms se busca el segmento cuyo `start ≤ currentTime < end`. Si hay coincidencia se muestra; si no, el pill desaparece.

**Desactivación automática en tres casos:**
- Usuario pulsa "Desactivar Subtítols" → misma lógica que activar vuelve a apagar
- El audio termina de forma natural → `onAudioEnded` llama a `resetSubtitles()`
- El usuario cambia de escena → `handleSlideChange` llama a `resetSubtitles()`

**Formato del JSON de subtítulos:**
```json
{
  "stab_segments": [
    { "start": 0.0,  "end": 1.8,  "word": "Banyar" },
    { "start": 1.8,  "end": 3.2,  "word": "és sinònim de piler del foc," },
    { "start": 3.2,  "end": 5.0,  "word": "és l'humitat de l'estiu" }
  ]
}
```

> El caché no se borra al desactivar los subtítulos — se conserva durante toda la sesión. Si el mismo usuario activa subtítulos de la escena 1 dos veces, el segundo fetch no se realiza.

---

## Feature: Selector de idioma

- Visible **solo** en la pantalla de introducción (`Language.vue` usa `v-if="initScene === -1"`)
- Dos botones con banderas: valenciana (VA) y española (ES)
- Estado activo: borde dorado + opacidad 100% + `aria-pressed="true"`
- Estado inactivo: sin borde + opacidad 55% + `aria-pressed="false"`
- Por defecto: **valenciano** (`va`)
- Sobrescribible con `?lang=es` en la URL al cargar

**Cambiar idioma:**
1. Usuario pulsa una bandera → `setLanguage('va'|'es')` → cambia `locale.value` en vue-i18n
2. El `watch(locale)` en `App.vue` → actualiza `messages.value` + `document.documentElement.lang`
3. El `watch(getLanguage)` en `useAudioControl` → recarga todos los `<audio>` con las nuevas rutas
4. Los textos de la interfaz y las rutas de assets cambian simultáneamente

---

## Feature: Accesibilidad

| Función | Implementación |
|---|---|
| Skip links | Tab desde el inicio muestra "Saltar al menú" / "Saltar al contingut" (ocultos hasta el foco) |
| Teclado | Todos los botones son navegables y activables con Enter/Space |
| Estados anunciados | `aria-live="polite"` en el área de subtítulos; los lectores los leen al cambiar |
| Foco visible | `:focus-visible` con outline dorado 3px; sin outline al hacer clic con ratón |
| Movimiento reducido | `prefers-reduced-motion: reduce` desactiva animaciones CSS y transiciones en tokens |
| Zoom | Viewport con `maximum-scale=5.0` — permite hasta 5× (usuarios con baja visión) |
| Contraste | Dorado `#FFD700` sobre negro `#000` — ratio WCAG AA+ |
| Touch targets | Mínimo 44px en todos los elementos interactivos |
| Landmarks | `<header>`, `<main>`, `role="region"` con `aria-label` descriptivos |
