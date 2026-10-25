# Beast Machine — sitio web

Sitio estático (HTML + CSS + JS vanilla, sin build step) desplegado en Vercel sobre
`beastmachine.space`.

## Estructura

```
index.html              Home en inglés   (/)   ← idioma principal
es/index.html           Home en español  (/es)
assets/css/style.css    Sistema de diseño y layout (único CSS)
assets/js/app.js        Interacciones: logo, reveals, mockups al scroll, marquees, HUD
assets/js/beast-logo.js Logo animado del hero (gruñido + cyberpunk)
assets/img/             Capas del logo, capturas de casos, favicons, OG images
tools/                  Pipeline que descompone el logo en capas animables
design/logo-animation/  Fuente de Claude Design del logo animado (no se publica)
assets/img/source/      Archivos originales del branding (JPG con fondo blanco)
robots.txt · sitemap.xml · site.webmanifest · vercel.json
```

Las dos versiones de idioma son archivos HTML independientes (mejor para SEO que un
toggle por JavaScript). Comparten el mismo CSS y JS. Si se edita el contenido de una,
hay que replicar el cambio en la otra y revisar `sitemap.xml`.

## El diseño (v2, editorial / cinematográfico)

Rediseño portado de Claude Design (`"Beast Machine Portfolio v2"`). Un solo sistema oscuro:
fondo `#05101C`, texto `#EAF3F8`, acento cyan `#38C8F2`, tipografías **Geist** y **Geist
Mono**. No hay modo claro ni secciones de papel: todo vive sobre el fondo oscuro.

La página es una sola columna vertical:

1. **Hero** a pantalla completa: el lobo animado (`beast-logo.js`) sobre la palabra
   "BEAST MACHINE" en contorno, y una fila mono con la meta (productos / scroll / 19
   trabajos).
2. **Declaración**: una frase grande sobre a quién le construimos.
3. **Trabajo** (`#work` / `#trabajo`): cada caso es un `.stage` a pantalla, con número
   gigante en contorno, cliente, título enorme, un mockup, y abajo métrica + bajada + stack.
4. **Lab** (`#lab`): grilla de lo que no se ve en una captura (herramientas internas, IA,
   infraestructura).
5. **Marquees** de stack técnico, dos filas en sentidos opuestos.
6. **Contacto** (`#contact` / `#contacto`): el mark del lobo y un CTA gigante a WhatsApp.

## Idiomas

- EN: `/` (`lang="en"`, canonical `https://beastmachine.space/`) — idioma principal
- ES: `/es` (`lang="es"`, canonical `https://beastmachine.space/es`)
- Ambas declaran `hreflang` cruzado y `x-default` apuntando a EN.
- `/en` redirige 301 a `/` (definido en `vercel.json`).
- El selector ES/EN es un link en el nav (`EN` en la ES, `ES` en la EN).

## La sección de Trabajo y el Lab

Diecinueve trabajos en total: **trece casos** con captura en `#work`/`#trabajo` y **seis
piezas** sin pantalla propia en el `#lab`. El hero y la meta dicen "19 trabajos"; el HUD
flotante numera sólo los trece casos (`NN / 13`).

Cada caso es un `<article class="stage">` con `id` y `data-stage="NN / 13 — Título"` (lo
que muestra el HUD). Dos formas:

- **Web** (`.mock` → `.browser[data-scale]`): la captura dentro de un marco de navegador
  con la URL en la barra. El marco se inclina y escala al entrar en pantalla.
- **Celular** (`.phone-row`): la captura en un teléfono (`.phone[data-phone]`) que hace
  scroll automático (`[data-phonescroll]`) junto a la línea del problema. Para capturas
  verticales (Sagrado, Presencia).

Abajo, todo caso cierra con `.stage-foot`: una métrica grande (`.stage-metric`), la bajada
(`.stage-lede`) y las `.stack` (pills de tecnología).

El Lab son `.lab-cell` en una grilla: cliente, métrica, título y una línea.

**Todo lo que se afirma sale de los repos de cada proyecto** — las cifras (251 páginas, 158
experiencias, 314 tests, 89 documentos, 45 cuentas, 250 productos, 56 horas, 52 KB) son las
que declaran sus READMEs, no estimaciones. Las 56 horas de Aires son el ahorro que reportó
el cliente, no sale de un README. Si un proyecto cambia, el número cambia acá también, y hay
que tocarlo en las **dos** páginas.

El producto de pedidos se llama **Hacé tu pedido** ("Comanda Directa" es sólo el nombre del
repo): de cara al público va siempre el nombre comercial.

El marco narrativo es que Beast Machine es el estudio contratado: cada caso nombra al
cliente (`.stage-client`), no a quien escribió el código. Worker aparece como cliente
(agencia de marketing) en varios casos y en casi todo el Lab.

### Sumar un trabajo nuevo

1. Elegir dónde va: **caso con captura** (`.stage` en `#work`/`#trabajo`) o **pieza de
   Lab** (`.lab-cell`, para lo que no tiene pantalla publicable). Replicar en las **dos**
   páginas (EN y ES).
2. Si es caso: decidir web (marco de navegador) o celular (teléfono con scroll), subir la
   captura a `assets/img/cases/<slug>.webp` y poner la métrica + bajada + stack.
3. Renumerar los `data-stage` y los `.stage-num` si se inserta en el medio, y ajustar el
   total del HUD y el "19 trabajos" del hero/meta si cambia la cuenta.
4. Sumar el stack nuevo a los marquees sólo si aporta (son nombres de tecnología, no de
   cliente).

### Las capturas

`assets/img/cases/*.webp`. Hoy hay trece y **todas son capturas reales del producto
corriendo**, tomadas con Playwright (19/9/2026, 10/10/2026 y 24/10/2026), no maquetas:

| Archivo | De dónde salió | Viewport |
| --- | --- | --- |
| `brain.webp` | `C:/tmp/brag-shots/overview.png`, del anonimizador del Brain | 1600×900 @2x |
| `hacetupedido.webp` | www.hace-tu-pedido.site (repo comanda-directa) | 1440×900 |
| `partymarket.webp` | www.hace-tu-pedido.site/party-market | 414×896 @2x |
| `aires.webp` | airespublicidad.com.ar | 1440×900, recortada |
| `lati.webp` | www.latitravel.com | 1440×900 |
| `museo.webp` | www.elmuseoviajero.com.ar | 1440×900 |
| `presencia.webp` | presencia-carta.vercel.app/carta | 414×896 |
| `sagrado.webp` | sagrado-sushi-carta.vercel.app | 414×896 |
| `gymcounter.webp` | `localhost:3001` (gymcounter, `npm run dev`) | 1440×900 |
| `worker.webp` | worker-2027.vercel.app | 1440×900 → 960×600 |
| `alko.webp` | preview GHL de Alko, página Marcas (la grilla de marcas, sin banda de métricas) | 1440×900 → 960×600 |
| `casas-valeria.webp` | casas-valeria.vercel.app | 1440×900 → 960×600 |
| `quinton.webp` | quinton.com.ar (chat/WhatsApp flotantes ocultos antes de capturar) | 1440×900 → 960×600 |

Las dos de celular (`presencia`, `sagrado`) van completas en el teléfono con scroll
automático. La de Aires está recortada a `crop=1220:745:110:0` para dejar afuera la banda
"+15 años / +3.548 carteles". La de GymCounter a `crop=1280:800:80:0` para dejar afuera la
banda de métricas del pie ("2.000+ atletas", "4,9 de satisfacción"): son afirmaciones del
propio sitio que acá no podemos respaldar. La de Alko sale de la **página Marcas**, no del
home, por la misma razón: el home está sembrado de autoclaims ("+50.000 SKUs", "+500
marcas") y recortarlos obliga a cortar el logo; la grilla de marcas es identidad real sin
ningún número que no podamos respaldar. Las de Worker y Casas en Valeria son capturas
limpias del hero reescaladas. Si se reemplaza una captura hay que subir el `?v=` del `<img>`
en las dos páginas: `/assets/*` va con cache inmutable.

**La del Brain lleva pie de foto implícito y no es negociable.** Sale del anonimizador
(`scripts/ops/brag-capture.mjs` en el repo del Brain), que reemplaza clientes y equipo por
ficticios y multiplica toda cifra por 0,834: el cliente "RONDEL" que se lee en la captura es
VALKER. El gate del script no atrapa apodos tipeados a mano, así que cada captura nueva del
Brain se mira antes de publicarla.

### Las piezas sin captura (el Lab, y lo que queda afuera)

Lo que no tiene pantalla publicable vive en el `#lab` (un club por invitación, el banco de
trabajo con IA, los gates de código, Shopify/TiendaNube por MCP, los creativos, el estado
de cartera de Alynk). No llevan captura porque:

| Pieza | Por qué no |
| --- | --- |
| Estado de Cartera (Alynk) | Los únicos datos que hay son de un comitente real, con nombre y número de cuenta. No sale a la web sin un dataset de demo. |
| El banco de trabajo con IA | No tiene interfaz: son skills y carpetas de memoria que corren en una terminal. |
| Gates para código escrito con IA | Idem: hooks y gates, sin pantalla propia. |
| Shopify y TiendaNube | Idem: herramientas MCP que se manejan conversando. |
| Creativos a velocidad de campaña | Suite de producción sin una sola pantalla representativa. |
| Presencia · club | Todo detrás de token (el link es la credencial, no hay login); solo el splash es público y no muestra el producto. |

`gymcounter.vercel.app` **no es** la app de GymCounter: es una app alemana sin relación.
GymCounter no tiene deploy público documentado, por eso la captura sale de local.

## El logo animado del hero

`assets/js/beast-logo.js` es el port a JS vanilla de **"Logo v2 · gruñido + cyberpunk"**,
una animación hecha en Claude Design. La fuente original está en
`design/logo-animation/Logo Animation v2.dc.html` (`design/` no se publica, ver
`.vercelignore`). Mismos tiempos, mismas capas y los valores por defecto de sus controles:
velocidad 1, tráfico 1, glitch 1, gruñido automático cada 9 s, sonido apagado, parallax
prendido. Si se rediseña en Claude Design, se vuelve a portar desde ese archivo.

Vive dentro de `.wolf[data-wolf]` en el hero: `app.js` sólo lo desvanece y lo aleja al
scrollear (el parallax con el mouse lo maneja el propio `beast-logo.js`).

| Momento | Qué pasa |
|---|---|
| Intro | la base aparece desenfocada, los circuitos se dibujan desde la costura hacia afuera, se encienden los nodos y los ojos titilan al prender |
| Reposo | pulsos de luz viajan por las trazas (algunos en magenta), los ojos laten y parpadean (a veces doble), scanlines y un glitch RGB breve cada tanto |
| Gruñido | el hocico se arruga, baja la mandíbula con colmillos, la cabeza tiembla, ojos y circuitos pasan a magenta y salen tres anillos. Se dispara con clic, con el mouse encima 0,7 s o solo cada 9 s |

Las capas son las de siempre (`logo-front-base.png`, `logo-front-eyes.png`,
`logo-front-mark.png` y `logo-front-circuits.svg`). El SVG de circuitos todavía trae su
animación CSS del logo anterior; el script la descarta al insertarlo porque, si no, las
animaciones CSS le ganan a los estilos que escribe el JS.

Sin JavaScript se ve `.beast-mark`, el logo completo y quieto. Con reduced-motion se muestra
el estado final sin movimiento. El loop se pausa cuando el hero sale de pantalla.

Si el cliente cambia el logo: reemplazar `assets/img/logo-front-mark.png`, revisar las cajas
`EYE_BOXES` del script y correr `python tools/build-logo-layers.py`. Ojo: la boca, la
mandíbula, el hocico y los párpados están en porcentajes sobre ESTE dibujo
(`.beast-mouth`, `.beast-jaw`, `.beast-snout`, `.beast-lid-*` en el CSS); un logo nuevo
obliga a reubicarlos.

## Interacciones (assets/js/app.js)

Todo corre en un solo `requestAnimationFrame` y se apaga con `prefers-reduced-motion`.

| Qué | Dónde |
|---|---|
| Animación del logo (WAAPI) + ojos del mark de contacto + palabras del hero | `startLogo()` |
| Reveals al entrar en pantalla | elementos con `[data-reveal]`, vía `IntersectionObserver` |
| El lobo se desvanece y se aleja al scrollear | `.wolf[data-wolf]` |
| Parallax del glow del hero con el mouse | `[data-glow]` |
| Marco de navegador que se inclina y escala al entrar | `.browser[data-scale]` |
| Teléfono que se endereza al entrar + captura con scroll automático | `[data-phone]`, `[data-phonescroll]` |
| Marquees de stack en sentidos opuestos | `[data-marquee]` (velocidad con signo) |
| HUD flotante con el caso que se está mirando | `[data-hud]` ← lee `data-stage` |

## Desarrollo

No hay dependencias ni build. Para previsualizar:

```bash
python -m http.server 4173
# http://127.0.0.1:4173/  (EN)  y  http://127.0.0.1:4173/es/  (ES)
```

El deploy se hace al pushear a `main` (Vercel toma la raíz del repo como output).
`vercel.json` define `cleanUrls`, el redirect `/en → /`, cache largo para `/assets/*`
y headers de seguridad.

**Importante**: `/assets/*` va con cache inmutable de un año. Si se edita un archivo de
`/assets` sin cambiarle el nombre (`style.css`, `app.js`, `beast-logo.js`, el SVG de
circuitos), hay que subir el número de `?v=` donde se referencia en las dos páginas, si no
los visitantes que ya entraron siguen viendo la versión vieja.
