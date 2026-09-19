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
assets/img/source/      Archivos originales del branding (JPG con fondo blanco)
assets/video/           Animaciones de logo entregadas por el cliente (sin usar hoy)
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

`#work` (EN) / `#casos` (ES), entre Servicios y Proceso. Doce casos, cada uno con la
misma estructura de tres partes: **el problema** que trajo el cliente, **lo que
construimos** y **el resultado**. Tres fichas grandes (`.case-lg`, a dos columnas arriba
de 900 px) y nueve en grilla de tres.

Todo lo que se afirma ahí sale de los repos de cada proyecto: las cifras (251 páginas,
158 experiencias, 314 tests, 89 documentos, 45 cuentas, ocho integraciones) son las que
declaran sus READMEs, no estimaciones. Si un proyecto cambia, el número cambia acá
también, y hay que tocarlo en las **dos** páginas.

El marco narrativo es que Beast Machine es el estudio contratado: cada ficha nombra al
cliente (`.case-client`), no a quien escribió el código. Worker aparece como cliente
(agencia de marketing) en seis de los doce casos.

Las tarjetas reutilizan `.card`, así que heredan el spotlight que sigue al cursor sin
tocar `app.js`. La grilla va con `align-items: start`: mientras algunas fichas tengan
captura y otras no, estirarlas a la altura de la fila deja un hueco en la que no la tiene.

### Las capturas

`assets/img/cases/*.webp`, dentro de un `<figure class="case-media">` con recorte 16:10
anclado arriba, que es donde vive la identidad de cualquier pantalla. Hoy hay cuatro y
**todas son capturas reales del sitio vivo del cliente**, tomadas con Playwright el
19/9/2026, no maquetas:

| Archivo | De dónde salió | Viewport |
| --- | --- | --- |
| `lati.webp` | www.latitravel.com | 1440×900 |
| `museo.webp` | www.elmuseoviajero.com.ar | 1440×900 |
| `presencia.webp` | presencia-carta.vercel.app/carta | 414×896 |
| `sagrado.webp` | sagrado-sushi-carta.vercel.app | 414×896 |

Las dos de celular llevan la barra de scroll recortada (`crop=798:1792:0:0`). Si se
reemplaza una captura hay que subir el `?v=` del `<img>` en las dos páginas: `/assets/*`
va con cache inmutable.

Los otros ocho casos no tienen captura todavía. `gymcounter.vercel.app` **no es** la app
de GymCounter (es una app alemana sin relación); GymCounter, Comanda Directa y AI Worker
Generator hay que levantarlos en local para capturarlos, y el panel del Brain solo se
captura con el anonimizador (`scripts/ops/brag-capture.mjs` en el repo del Brain), que
reemplaza clientes y equipo por ficticios y multiplica toda cifra por 0,834.

## Interacciones (assets/js/app.js)

| Qué | Dónde |
|---|---|
| Barra de progreso de scroll | fija arriba de todo |
| Nav con fondo al hacer scroll + link activo por sección | `IntersectionObserver` |
| Hero con parallax al scrollear y deriva del logo con el mouse | `.hero` |
| Reveals escalonados | elementos con `.reveal` y `--i` |
| Contadores animados | elementos con `data-count` / `data-suffix` |
| Proceso con etapa activa según el scroll | `.step` + riel + contador |
| Spotlight que sigue al cursor en las tarjetas | `.card` |
| Formulario que arma el mensaje de WhatsApp | `#brief-form` |
| Apagar el filtro del hero cuando sale de pantalla | `.hero.is-idle` |

## El logo animado del hero

El cliente entregó el logo como imagen plana. Para poder animarlo, un script
(`tools/build-logo-layers.py`) lo descompone en tres capas:

| Capa | Qué es | Qué hace |
|---|---|---|
| `logo-front-base.png` | la ilustración sin ojos ni circuitos | el pelaje se mueve |
| `logo-front-eyes.png` | solo los ojos | parpadean |
| `logo-front-circuits.svg` | los circuitos, vectorizados | se dibujan, laten y fluyen |

**Los circuitos son vector de verdad.** El script aísla la capa cyan por color, la
adelgaza a un pixel (Zhang-Suen), recorre el esqueleto como un grafo y lo convierte
en paths. `tools/circuit_geometry.py` hace la limpieza que necesita un circuito para
no verse tembloroso: une los tramos que siguen derecho a través de una unión, tira
los pelitos del adelgazado, alinea cada segmento al múltiplo de 45° más cercano,
funde los segmentos ya colineales, reconoce los nodos circulares (ajuste de círculo
por mínimos cuadrados) y mide el ancho real de cada traza. Salen 180 trazas con 5
anchos distintos y 11 nodos circulares, en 49 KB (7 KB con gzip).

**El pelaje** se mueve con un filtro SVG (`feTurbulence` + `feDisplacementMap`) sobre
la base, con la turbulencia y la amplitud animadas por SMIL. Encima, un
`beast-breathe` en CSS le da una respiración de 7 s al conjunto.

**El parpadeo** es un `scaleY` sobre la capa de ojos, con el origen en la línea de
los ojos. Como la base tiene los ojos borrados y el hueco relleno con el color de
alrededor, al cerrarse se ve la cuenca, no un agujero.

Dos detalles que costaron y conviene no volver a romper:

- **Los circuitos van fuera del grupo filtrado.** `feDisplacementMap` rasteriza todo
  lo que filtra: cuando los circuitos estaban adentro se veían pixelados.
- **La base no lleva los circuitos dibujados.** Si estuvieran en las dos capas, al
  moverse el pelaje se verían dobles. El halo de luz sí se queda en la base.

El filtro de pelaje es lo más caro de la página: se apaga solo cuando el hero sale de
pantalla (`.hero.is-idle`) y en pantallas de menos de 700 px. Medido en Chrome: 61 fps
con todo corriendo.

Si el cliente cambia el logo: reemplazar `assets/img/logo-front-mark.png`, revisar las
cajas `EYE_BOXES` del script y correr `python tools/build-logo-layers.py`.

Todo respeta `prefers-reduced-motion`. Sin JavaScript el sitio se ve completo
(hay un `<noscript>` que fuerza la visibilidad de los bloques animados).

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
