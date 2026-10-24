# Beast Machine — sitio web

Sitio estático (HTML + CSS + JS vanilla, sin build step) desplegado en Vercel sobre
`beastmachine.space`.

## Estructura

```
index.html              Home en inglés   (/)   ← idioma principal
es/index.html           Home en español  (/es)
assets/css/style.css    Sistema de diseño y layout (único CSS)
assets/js/app.js        Interacciones: scroll, reveals, contadores, menú, form
assets/img/             Capas del logo, favicons, OG images
tools/                  Pipeline que descompone el logo en capas animables
design/logo-animation/  Fuente de Claude Design del logo animado (no se publica)
assets/img/source/      Archivos originales del branding (JPG con fondo blanco)
assets/video/           Animaciones de logo del cliente; wolf-turn.mp4 se usa en Proceso
robots.txt · sitemap.xml · site.webmanifest · vercel.json
```

Las dos versiones de idioma son archivos HTML independientes (mejor para SEO que un
toggle por JavaScript). Comparten el mismo CSS y JS. Si se edita el contenido de una,
hay que replicar el cambio en la otra y revisar `sitemap.xml`.

## Idiomas

- EN: `/` (`lang="en"`, canonical `https://beastmachine.space/`) — idioma principal
- ES: `/es` (`lang="es"`, canonical `https://beastmachine.space/es`)
- Ambas declaran `hreflang` cruzado y `x-default` apuntando a EN.
- `/en` redirige 301 a `/` (definido en `vercel.json`).
- El selector ES/EN está en el nav y en el menú mobile.

## La sección de casos

`#work` (EN) / `#casos` (ES), entre Servicios y Proceso. Dieciocho casos, cada uno con la
misma estructura de tres partes: **el problema** que trajo el cliente, **lo que
construimos** y **el resultado**. Cinco fichas grandes (`.case-lg`, a dos columnas arriba
de 900 px) y trece en grilla de tres.

Todo lo que se afirma ahí sale de los repos de cada proyecto: las cifras (251 páginas,
158 experiencias, 314 tests, 89 documentos, 45 cuentas, ocho integraciones) (y en las fichas nuevas 250 productos, 158 animatrónicos e inflables, 56 horas por mes y 52 KB;
las 56 horas son el ahorro que reportó el cliente, no sale de un README) son las que
declaran sus READMEs, no estimaciones. Si un proyecto cambia, el número cambia acá
también, y hay que tocarlo en las **dos** páginas.

El producto de pedidos se llama **Hacé tu pedido** ("Comanda Directa" es sólo el
nombre del repo): de cara al público va siempre el nombre comercial.

El marco narrativo es que Beast Machine es el estudio contratado: cada ficha nombra al
cliente (`.case-client`), no a quien escribió el código. Worker aparece como cliente
(agencia de marketing) en seis de los catorce casos.

Las tarjetas reutilizan `.card`, así que heredan el spotlight que sigue al cursor sin
tocar `app.js`. La grilla va con `align-items: start`: mientras algunas fichas tengan
captura y otras no, estirarlas a la altura de la fila deja un hueco en la que no la tiene.

### Las capturas

`assets/img/cases/*.webp`, dentro de un `<figure class="case-media">` con recorte 16:10
anclado arriba, que es donde vive la identidad de cualquier pantalla. Hoy hay doce y
**todas son capturas reales del producto corriendo**, tomadas con Playwright (19/9/2026, 10/10/2026 y 24/10/2026), no maquetas:

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

Las tres de celular llevan la barra de scroll recortada (`crop=798:1792:0:0`). La de Aires está recortada a
`crop=1220:745:110:0` por la misma razón: deja afuera la banda "+15 años / +3.548
carteles". La de GymCounter está recortada a `crop=1280:800:80:0` para dejar afuera la banda de métricas
del pie ("2.000+ atletas", "4,9 de satisfacción"): son afirmaciones del propio sitio que
acá no podemos respaldar. La de Alko sale de la **página Marcas**, no del home, por la misma
razón: el home está sembrado de autoclaims ("+50.000 SKUs", "+500 marcas", "+5.500 m²",
"49 años") y recortarlos del hero obliga a cortar el logo; la grilla de marcas es identidad
real sin ningún número que no podamos respaldar. Las de Worker y Casas en Valeria son
capturas limpias del hero (sin banda de métricas), reescaladas de 1440×900 a 960×600. Si se
reemplaza una captura hay que subir el `?v=` del `<img>` en las dos páginas: `/assets/*` va
con cache inmutable.

**La del Brain lleva pie de foto y no es negociable.** Sale del anonimizador
(`scripts/ops/brag-capture.mjs` en el repo del Brain), que reemplaza clientes y equipo
por ficticios y multiplica toda cifra por 0,834: el cliente "RONDEL" que se lee en la
captura es VALKER. El `<figcaption>` dice que los datos son de demostración para que
ningún número vuelva a un reporte como si fuera un caso real. El gate del script no
atrapa apodos tipeados a mano, así que cada captura nueva del Brain se mira antes de
publicarla.

### Los seis casos sin captura

| Caso | Por qué no |
| --- | --- |
| AI Worker Generator | Entra por Google SSO restringido a `@worker.ar`. Sin login, la única pantalla es el muro. |
| Estado de Cartera (Alynk) | Los únicos datos que hay son de un comitente real, con nombre y número de cuenta. No sale a la web sin un dataset de demo. |
| El banco de trabajo con IA | No tiene interfaz: son skills y carpetas de memoria que corren en una terminal. |
| Seguridad y calidad del código | Idem: hooks y gates, sin pantalla propia. |
| Shopify y TiendaNube | Idem: herramientas MCP que se manejan conversando. |
| Presencia · After Service | Todo detrás de token (el link es la credencial, no hay login) y solo el splash es público; el subdominio todavía dependía del DNS del cliente. La única captura posible sería el splash, que no muestra el producto. |

Para los tres últimos, una captura de terminal armada a mano sería construir una imagen,
no capturar el producto. Se dejan sin media hasta tener una grabación del flujo real.

`gymcounter.vercel.app` **no es** la app de GymCounter: es una app alemana sin relación.
GymCounter no tiene deploy público documentado, por eso la captura sale de local.

## Paleta: oscuro y claro alternados

Servicios y Proceso llevan `.section-light`: fondo papel (`#EEF3F7`), tarjetas blancas y
texto tinta. La clase **redefine los tokens** (`--white`, `--text`, `--muted`, `--panel`,
`--line`, `--cyan`…), así que los componentes de adentro no tienen reglas propias para el
modo claro: si se suma una sección clara nueva, alcanza con la clase. Sobre claro el cyan
de marca baja a `#0088C2`, porque `#00AEEF` sobre blanco no llega al contraste de texto.

En las secciones oscuras el texto secundario (`--muted`) es `#A6B6C6` y las tarjetas son
un plano sólido (`--panel`), no una transparencia: con las transparencias de antes todo
quedaba azul sobre azul y las secciones no se distinguían.

## El logo animado de Proceso

`assets/video/wolf-turn.mp4` sale de `logo-reveal-vertical.mp4` (el que entregó el
cliente): recortado a la banda útil, con el blanco del fondo llevado a blanco puro,
y armado ida y vuelta (el giro y el mismo giro al revés) para que el loop no salte.
Sin audio, 540 KB. Reproduce sólo mientras está a la vista y se queda en el póster
(`wolf-turn.webp`) con reduced-motion.

El fondo blanco del video desaparece con `mix-blend-mode: multiply` sobre el papel
claro. Para que funcione, `.process-sticky` tiene que tener el mismo fondo de la
sección: el sticky crea su propio contexto de apilamiento y, transparente, el multiply
no tiene contra qué fundirse y se ve el recuadro blanco.

## Interacciones (assets/js/app.js)

| Qué | Dónde |
|---|---|
| Barra de progreso de scroll | fija arriba de todo |
| Nav con fondo al hacer scroll + link activo por sección | `IntersectionObserver` |
| Hero con parallax al scrollear | `.hero` |
| Reveals escalonados | elementos con `.reveal` y `--i` |
| Contadores animados | elementos con `data-count` / `data-suffix` |
| Proceso con etapa activa según el scroll | `.step` + riel + contador |
| Spotlight que sigue al cursor en las tarjetas | `.card` |
| Formulario que arma el mensaje de WhatsApp | `#brief-form` |
| Apagar el filtro del hero cuando sale de pantalla | `.hero.is-idle` |
| Marquees cuya velocidad y sentido siguen al scroll (Scroll Based Velocity) | `.marquee[data-direction]` |
| Texto que se descifra letra por letra (Hyper Text) | `[data-scramble]` del hero y eyebrows de sección |
| Luz que recorre el borde (Border Beam) | `.beam`: casos destacados y panel de contacto |
| Brillo periódico en los botones principales (Shimmer Button) | `.btn-primary::after` |
| Grilla titilante en canvas, sólo mientras está a la vista (Flickering Grid) | `.flicker-grid`, la crea el JS en `.contact` |
| Diagrama de conexiones animado (Animated Beam) | `.case-diagram`, en la ficha del banco de trabajo con IA |

Los cinco últimos son efectos de [Magic UI](https://magicui.design/docs/components)
reescritos en CSS y JS vanilla: la librería es React + Tailwind y este sitio no tiene
build. Todos se apagan con `prefers-reduced-motion`, y los que corren en loop (marquees,
grilla) se pausan fuera de pantalla con `IntersectionObserver`.

## El logo animado del hero

`assets/js/beast-logo.js` es el port a JS vanilla de **"Logo v2 · gruñido + cyberpunk"**,
una animación hecha en Claude Design. La fuente original está en
`design/logo-animation/Logo Animation v2.dc.html` (`design/` no se publica, ver
`.vercelignore`). Mismos tiempos, mismas capas y los valores por defecto de sus controles:
velocidad 1, tráfico 1, glitch 1, gruñido automático cada 9 s, sonido apagado, parallax
prendido. Si se rediseña en Claude Design, se vuelve a portar desde ese archivo.

Qué hace:

| Momento | Qué pasa |
|---|---|
| Intro | la base aparece desenfocada, los circuitos se dibujan desde la costura hacia afuera, se encienden los nodos y los ojos titilan al prender |
| Reposo | pulsos de luz viajan por las trazas (algunos en magenta), los ojos laten y parpadean (a veces doble), scanlines y un glitch RGB breve cada tanto |
| Gruñido | el hocico se arruga, baja la mandíbula con colmillos, la cabeza tiembla, ojos y circuitos pasan a magenta y salen tres anillos. Se dispara con clic, con el mouse encima 0,7 s o solo cada 9 s |

Las capas son las mismas de siempre (`logo-front-base.png`, `logo-front-eyes.png`,
`logo-front-mark.png` y `logo-front-circuits.svg`): el export de Claude Design trae copias
idénticas píxel a píxel, sólo con metadatos agregados. El SVG de circuitos todavía trae
su animación CSS del logo anterior; el script la descarta al insertarlo (`<style>` fuera)
porque, si no, las animaciones CSS le ganan a los estilos que escribe el JS.

Sin JavaScript se ve `.beast-mark`, el logo completo y quieto. Con reduced-motion se
muestra el estado final sin movimiento. El loop se pausa cuando el hero sale de pantalla.

Si el cliente cambia el logo: reemplazar `assets/img/logo-front-mark.png`, revisar las
cajas `EYE_BOXES` del script y correr `python tools/build-logo-layers.py`. Ojo: la boca,
la mandíbula, el hocico y los párpados están ubicados en porcentajes sobre ESTE dibujo
(`.beast-mouth`, `.beast-jaw`, `.beast-snout`, `.beast-lid-*` en el CSS); un logo nuevo
obliga a reubicarlos.

## Contenido editable

- Teléfono de WhatsApp: atributo `data-phone` del formulario y los links `wa.me/...`.
- Plantilla del mensaje: atributo `data-template` del formulario.
- Métricas de la sección "Nosotros": `data-count` + `data-suffix` en cada `.stat`.
- Casos: cada `<article class="card case">`. El orden es el del HTML; para sumar uno
  nuevo hay que replicarlo en las dos páginas y respetar la terna problema / lo que
  construimos / resultado.

## Desarrollo

No hay dependencias ni build. Para previsualizar:

```bash
python -m http.server 4173
# http://127.0.0.1:4173/  (EN)  y  http://127.0.0.1:4173/es/  (ES)
```

El deploy se hace al pushear a `main` (Vercel toma la raíz del repo como output).
`vercel.json` define `cleanUrls`, el redirect `/en → /`, cache largo para `/assets/*`
y headers de seguridad.

**Importante**: `/assets/*` va con cache inmutable de un año. Si se edita un archivo
de `/assets` sin cambiarle el nombre (`style.css`, `app.js`, el SVG de circuitos), hay
que subir el número de `?v=` donde se referencia en las dos páginas, si no los
visitantes que ya entraron siguen viendo la versión vieja.
