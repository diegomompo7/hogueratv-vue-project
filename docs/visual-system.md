# Sistema Visual

## Filosofía de diseño

- **Mobile-first:** diseñado para pantallas de 375px+, uso presencial en el evento
- **Paleta oscura con acento dorado:** negro `#000` + dorado `#FFD700` + fondo cyan azul
- **Tipografía dual:** Inter (cuerpo y botones) + Playfair Display (títulos de escena)
- **Touch targets:** mínimo 44px (`--touch-min`), ideal 48px (`--touch-ideal`) en todos los interactivos
- **Accesibilidad:** `prefers-reduced-motion`, `:focus-visible`, contraste WCAG AA+

---

## Design Tokens (`src/scss/tokens/_tokens.scss`)

Todos los valores se definen como CSS Custom Properties en `:root` y están disponibles globalmente.

### Colores

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#000000` | Fondo de tarjetas y botones |
| `--color-surface` | `#111111` | Superficies elevadas |
| `--color-accent` | `#FFD700` | Dorado — color de marca principal |
| `--color-accent-dim` | `rgba(255,215,0, 0.6)` | Dorado atenuado (bordes nav) |
| `--color-accent-glow` | `rgba(255,215,0, 0.30)` | Base de las sombras glow |
| `--color-text` | `#FFD700` | Texto principal |
| `--color-text-muted` | `rgba(255,215,0, 0.55)` | Texto secundario / desactivado |
| `--color-body-bg` | `#00BFFF` | Referencia del fondo cyan del body |
| `--color-error` | `#FF6B6B` | Estado de error en botones |
| `--color-error-glow` | `rgba(255,107,107, 0.30)` | Sombra glow del estado error |

### Tipografía

| Token | Valor | Rango |
|---|---|---|
| `--font-body` | `'Inter', system-ui` | Cuerpo, botones, navegación |
| `--font-display` | `'Playfair Display', Georgia` | Títulos de escena |
| `--text-xs` | `clamp(0.75rem, 1.8vw, 0.875rem)` | 12–14px |
| `--text-sm` | `clamp(0.875rem, 2.2vw, 1rem)` | 14–16px |
| `--text-base` | `clamp(1rem, 2.5vw, 1.125rem)` | 16–18px |
| `--text-lg` | `clamp(1.125rem, 3vw, 1.25rem)` | 18–20px |
| `--text-xl` | `clamp(1.25rem, 3.5vw, 1.5rem)` | 20–24px |
| `--text-2xl` | `clamp(1.5rem, 4vw, 2rem)` | 24–32px |
| `--text-3xl` | `clamp(1.875rem, 5vw, 2.5rem)` | 30–40px |

Los tamaños usan `clamp()` para ser fluidos entre móvil y desktop sin breakpoints de tipografía.

### Espaciado

| Token | Valor |
|---|---|
| `--space-xs` | `0.25rem` (4px) |
| `--space-sm` | `0.5rem` (8px) |
| `--space-md` | `1rem` (16px) |
| `--space-lg` | `1.5rem` (24px) |
| `--space-xl` | `2rem` (32px) |
| `--space-2xl` | `3rem` (48px) |
| `--space-3xl` | `4rem` (64px) |

### Touch targets

| Token | Valor | Uso |
|---|---|---|
| `--touch-min` | `44px` | Mínimo WCAG para elementos secundarios |
| `--touch-ideal` | `48px` | Ideal para el botón de audio principal |

### Efectos glow

```scss
--glow-sm:    0 0 0.4em 0.25em var(--color-accent-glow)  /* Botón en reposo */
--glow-md:    0 0 0.7em 0.45em var(--color-accent-glow)  /* Hover / focus */
--glow-lg:    0 0 1em   0.65em var(--color-accent-glow)  /* Máximo — loading pulse */
--glow-error: 0 0 0.5em 0.3em  var(--color-error-glow)   /* Estado error */
```

### Transiciones

| Token | Valor | Uso |
|---|---|---|
| `--transition-fast` | `150ms ease` | Hover/active en botones |
| `--transition-base` | `250ms ease` | Transiciones generales |
| `--transition-slow` | `400ms ease` | Cambios de slide en Swiper |

Con `prefers-reduced-motion: reduce` todos se ponen a `0.01ms linear` para respetar las preferencias del usuario sin romper la lógica que depende de las transiciones.

---

## Sistema de botones (`src/scss/components/_buttons.scss`)

### `.btn-audio` — Botón primario

Usado para "Audioguia", "Reproduir audioguia" y "Llengua de signes".

```scss
.btn-audio {
  width: 100%;
  max-width: 280px;
  min-height: var(--touch-ideal, 48px);  /* 48px touch target */
  padding: 0.75rem 1.5rem;
  font-size: var(--text-lg);             /* 18–20px */
  font-weight: 600;
  background: var(--color-bg, #000);
  color: var(--color-accent, #FFD700);
  border: 2px solid var(--color-accent, #FFD700);
  border-radius: var(--radius-full, 9999px);
  box-shadow: var(--glow-sm);
}
```

**Estados visuales:**

| Estado | Visual |
|---|---|
| Reposo | Negro + borde dorado + glow sm |
| `:hover` | Fondo dorado + texto negro + glow md + sube 1px |
| `:active` | Scale 0.97 + vuelve a glow sm |
| `:focus-visible` | Outline dorado 3px, offset 4px |
| `:disabled` | Opacidad 40%, cursor `not-allowed` |
| `.is-loading` | Pulse animation 1.4s (glow sm ↔ lg) + opacidad 75%, no interactivo |
| `.is-error` | Borde/texto rojo `#FF6B6B` + glow-error, no interactivo |

### `.btn-audio--secondary` — Botón secundario

Usado para "Activar/Desactivar Subtítols". Hereda todos los estilos de `.btn-audio` con overrides:

```scss
.btn-audio--secondary {
  max-width: 240px;
  min-height: var(--touch-min, 44px);   /* 44px — touch target mínimo */
  font-size: var(--text-sm);            /* Más pequeño que el primario */
  font-weight: 400;
  border-width: 1px;                    /* Borde más fino */
  box-shadow: none;                     /* Sin glow en reposo */
  opacity: 0.82;                        /* Visualmente secundario */
}
```

### `.audio-controls` — Contenedor de botones

```scss
.audio-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg, 1.5rem);  /* 24px entre botones */
  width: 100%;
}
```

---

## Scene Card (`src/scss/components/_scenes.scss`)

```scss
.scene-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xl, 3rem);       /* 48px entre título y controles */
  padding: var(--space-xl, 2rem) var(--space-md, 1rem);
  text-align: center;
  width: 100%;
}

.scene-card__title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 6vw, 2.5rem);  /* 28–40px responsive */
  font-weight: 700;
  color: var(--color-accent, #FFD700);
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0;
}
```

**Animación de entrada del título (slide activo):**

```scss
.swiper-slide-active .scene-card__title {
  animation: titleFadeIn 0.35s ease forwards;
}

@keyframes titleFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Override en `Scenes.vue` (scoped):**

```scss
.scene-card { padding-bottom: 0; }
```

Elimina el padding inferior de la tarjeta en el carrusel. El espacio de respiración lo aportan `.scene-card > .audio-controls { padding-bottom: var(--space-md) }` y `.scene-nav` por debajo.

---

## Header (`src/scss/components/_header.scss`)

```scss
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
}

.site-header__logo    { width: 90px; }                   /* Mobile */
.site-header__sponsor { width: 45%; max-width: 200px; }  /* Mobile */

@media (min-width: 768px) {
  .site-header__logo    { width: 120px; }
  .site-header__sponsor { width: 50%; max-width: 300px; }
}
```

---

## Intro controls (scoped en `Scenes.vue`)

Layout de los controles de la pantalla de introducción:

```scss
.intro-controls {
  margin-top: var(--space-lg, 1.5rem);
  padding-bottom: calc(var(--space-md, 1rem) + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;   /* Mobile: columna */
  align-items: center;
  gap: 1rem;
}

@media (min-width: 576px) {
  .intro-controls {
    flex-direction: row;    /* Tablet/Desktop: fila */
    justify-content: space-evenly;
    align-items: flex-start;
  }
  .intro-controls__sep {
    display: block;
    width: 1px;
    height: 80px;
    background: rgba(255, 215, 0, 0.25);  /* Separador vertical dorado semitransparente */
    align-self: center;
  }
}
```

`env(safe-area-inset-bottom)` añade el espacio del home indicator en iPhones con notch.

---

## Subtítulos pill (scoped en `Scenes.vue`)

```scss
.subtitles {
  display: block;
  width: fit-content;
  max-width: 85%;
  margin: 1.5rem auto 0.75rem;
  padding: 0.5rem 1.25rem;
  background: rgba(255, 215, 0, 0.08);           /* Dorado muy suave */
  border: 1px solid rgba(255, 215, 0, 0.25);     /* Borde dorado sutil */
  border-radius: 2rem;
  font-size: var(--text-sm, 0.875rem);
  line-height: 1.5;
  text-align: center;
}
```

**Transición Vue (aparición/desaparición):**

```scss
.subtitle-fade-enter-active,
.subtitle-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.subtitle-fade-enter-from,
.subtitle-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);   /* Sube ligeramente al aparecer */
}
```

---

## Navegación del carrusel (scoped en `Scenes.vue`)

```scss
.scene-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.625rem 0 calc(0.75rem + env(safe-area-inset-bottom, 0px));
}

.scene-nav__btn {
  width: 48px;
  height: 48px;
  background: transparent;
  color: var(--color-accent, #FFD700);
  border: 1px solid rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  font-size: 1.75rem;
}

.scene-nav__counter {
  color: rgba(255, 215, 0, 0.85);
  min-width: 2.5rem;
  text-align: center;
}
```

---

## Utilidades CSS personalizadas

Las clases usan **guion bajo** como separador decimal (compatible con selectores HTML sin escaping):

| Clase | CSS generado | Valor |
|---|---|---|
| `.w-5` | `width: 2rem` | ~32px — tamaño de banderas de idioma |
| `.w-5_12` | `width: 41.667%` | 5/12 del contenedor (vídeo lengua de signos) |
| `.w-5_6` | `width: 83.333%` | 5/6 del contenedor |
| `.mb-3_5` | `margin-bottom: 1.25rem` | Entre Bootstrap mb-3 y mb-4 |
| `.pb-2_5` | `padding-bottom: 0.75rem` | Entre Bootstrap pb-2 y pb-3 |
| `.me-2_25` | `margin-inline-end: 0.5rem` | Espacio entre bandera y texto |
| `.pt-4_4` | `padding-top: 1.5rem` | Equivale a Bootstrap pt-4 extendido |
| `.mt-4_6` | `margin-top: 2.5rem` | Gap grande — usado en escenas |
| `.text-yellow` | `color: var(--color-accent)` | Texto dorado |
| `.bg-black` | `background-color: #000` | Fondo negro |
| `.fs-text_sm` | `font-size: var(--text-sm)` | 14–16px |
| `.fs-text_base` | `font-size: var(--text-base)` | 16–18px |
| `.fs-text_lg` | `font-size: var(--text-lg)` | 18–20px |

---

## Fondo y estilos base (`src/style.css`)

```css
body {
  background: linear-gradient(160deg, #00CFFF 0%, #00A8E0 60%, #0090C8 100%);
  background-attachment: fixed;          /* El gradiente no se mueve al hacer scroll */
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md, 1rem);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  font-family: var(--font-body);
  font-size: var(--text-base, 1rem);
  color: var(--color-text, #FFD700);
}

#app {
  animation: appFadeIn 0.4s ease forwards;   /* Fade-in suave al cargar */
}

@media (prefers-reduced-motion: reduce) {
  #app { animation: none; }
}
```

---

## Fuentes (Google Fonts)

Cargadas en `index.html` con `preconnect` para máxima velocidad:

| Fuente | Pesos | Uso |
|---|---|---|
| Inter | 400, 600, 700 | Cuerpo, botones, navegación, subtítulos |
| Playfair Display | 700 | `.scene-card__title` (títulos de escena) |

---

## Pipeline SCSS (`src/scss/custom.scss`)

El orden de importación es crítico — Bootstrap necesita los tokens antes de sus propias variables:

```scss
// 1. Tokens (CSS Custom Properties)
@import 'tokens/tokens';

// 2. Bootstrap (solo las partes necesarias)
@import '../../node_modules/bootstrap/scss/functions';
@import '../../node_modules/bootstrap/scss/variables';
@import '../../node_modules/bootstrap/scss/variables-dark';
@import '../../node_modules/bootstrap/scss/maps';
@import '../../node_modules/bootstrap/scss/mixins';
@import '../../node_modules/bootstrap/scss/root';
@import '../../node_modules/bootstrap/scss/reboot';
@import '../../node_modules/bootstrap/scss/type';
@import '../../node_modules/bootstrap/scss/images';
@import '../../node_modules/bootstrap/scss/containers';
@import '../../node_modules/bootstrap/scss/grid';
@import '../../node_modules/bootstrap/scss/utilities';
@import '../../node_modules/bootstrap/scss/helpers';
@import '../../node_modules/bootstrap/scss/utilities/api';

// 3. Componentes del proyecto
@import 'components/buttons';
@import 'components/scenes';
@import 'components/header';

// 4. Utilidades del proyecto
@import 'utilities/widths';
@import 'utilities/heights';
@import 'utilities/marginPadding';
@import 'utilities/colors';
@import 'utilities/fontSize';

// 5. Helpers globales
.visually-hidden { /* ... */ }
```
