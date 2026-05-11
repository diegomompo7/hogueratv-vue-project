# Foguera Sant Blai de Dalt — Documentación

## ¿Qué es este proyecto?

Guía multimedia interactiva para la **Foguera Sant Blai de Dalt** de Alacant (Festes de Sant Joan). Diseñada para uso **móvil en el evento presencial**: los visitantes escanean un QR, escuchan la audioguía de cada escena con subtítulos sincronizados en tiempo real y pueden acceder a una introducción en lengua de signos.

**Audiencia:** visitantes del evento, con soporte completo de accesibilidad (lectores de pantalla, teclado, `prefers-reduced-motion`, touch targets 44px+).

**Idiomas:** valenciano (`va`) por defecto · español (`es`) opcional.

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Vue 3 | 3.4.37 | Framework UI — Composition API + `<script setup>` |
| Vite | 5.4.2 | Build tool y dev server |
| Swiper | 11.1.10 | Carrusel táctil con loop |
| vue-i18n | 9.14.0 | Internacionalización (textos + rutas de assets) |
| Bootstrap | 5.3.3 | Utilidades CSS (grid, helpers, visually-hidden) |
| Sass | 1.99.0 | Preprocesador CSS con design tokens |

---

## Quickstart

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (hot reload)
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Compilar SCSS manualmente (si editas custom.scss o cualquier _partial.scss)
npx sass src/scss/custom.scss src/scss/custom.css --style=compressed --no-source-map
```

---

## Parámetros de URL

| Parámetro | Valores | Efecto |
|---|---|---|
| `?lang=` | `es` / `va` | Fuerza el idioma al cargar |
| `?init=` | `1`–`5` | Abre directamente una escena del carrusel |

**Ejemplos:**
- `/` → pantalla de introducción en valenciano
- `/?lang=es` → introducción en español
- `/?lang=va&init=3` → valenciano, directamente en la escena 3

> `?init=` acepta valores 1–5 (1-indexed). Internamente se convierte a 0–4.

---

## Documentación disponible

| Fichero | Contenido |
|---|---|
| [architecture.md](./architecture.md) | Estructura de carpetas, diagrama de componentes, flujo de arranque, configuración Vite, pipeline CSS |
| [functionality.md](./functionality.md) | Tres modos de pantalla, flujos de usuario, audio, subtítulos, idioma y accesibilidad |
| [business-logic.md](./business-logic.md) | Composables, i18n, gestión de estado, formato de datos, índices del carrusel |
| [visual-system.md](./visual-system.md) | Design tokens, sistema de botones, SCSS, tipografía, utilidades CSS |
