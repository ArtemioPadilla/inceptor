# Receta: gráficos decorativos que siguen el tema (máscaras CSS, CSP estricta)

Para un mapa, una ilustración o un patrón que debe verse bien en claro y en
oscuro sin duplicar archivos y sin estilos en línea. Sale del mapa de calles
del home de **Buró del Pueblo**.

## El problema

Las dos salidas habituales fallan:

- **Dos imágenes** (una por tema): el doble de peso y de mantenimiento, y un
  parpadeo al cambiar de tema.
- **SVG en línea con colores por `style`**: una CSP con `style-src 'self'` lo
  bloquea, y un SVG grande infla el HTML de cada visita.

## La técnica

1. Exporta el gráfico como **capas SVG de trazo negro**, una por color. Sin
   rellenos de color, sin `<style>`, sin referencias externas.
2. Usa cada capa como `mask-image` de un `<div>` cuyo `background` es un
   **token del tema**. La máscara solo aporta la forma; el color lo pone el
   tema.
3. Lo poco que es interactivo o animado (pines, etiquetas) va en un SVG en
   línea pequeño que comparte el `viewBox` de las capas.

```css
/* global.css — sin estilos en línea */
.mapa-lienzo {
  aspect-ratio: 1024 / 900; /* el de las capas */
}
.mapa-capa {
  position: absolute;
  inset: 0;
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
}
.mapa-calles {
  background: var(--border);
  mask-image: url('../assets/mapa/calles.svg');
}
.mapa-avenidas {
  background: var(--primary);
  mask-image: url('../assets/mapa/avenidas.svg');
}
```

```astro
<div aria-hidden="true" class="mapa-lienzo relative print:hidden">
  <div class="mapa-capa mapa-calles"></div>
  <div class="mapa-capa mapa-avenidas"></div>
  <svg viewBox="0 0 1024 900" class="absolute inset-0 h-full w-full">
    {pines.map((p) => <circle class="fill-primary" cx={p.x} cy={p.y} r="8" />)}
  </svg>
</div>
```

Vite resuelve el `url()` del CSS, le pone hash al archivo y lo sirve aparte:
se cachea y no bloquea el render.

## Por qué funciona

- **Un solo juego de archivos** para claro, oscuro y cualquier tema futuro:
  cambiar el token cambia el gráfico.
- **Cumple `style-src 'self'`**: no hay atributo `style` ni `<style>` en línea.
- **El HTML no crece**: las capas son imágenes, no marcado.

## Tropiezos

- **Presupuesto de peticiones.** Cada capa es una petición. Si Lighthouse
  limita el número de recursos, une capas del mismo color en un archivo y
  distingue clases con `stroke-opacity` (la máscara lee el alfa).
- **Misma proporción en todo.** El contenedor lleva el `aspect-ratio` de las
  capas y el SVG de encima el mismo `viewBox`. Si el contenedor recorta
  (`cover`), las capas y el SVG dejan de coincidir.
- **Retrasos de animación sin `style`.** Usa `:nth-of-type()` en el CSS en
  lugar de `animation-delay` en línea, y apaga la animación con
  `prefers-reduced-motion`.
- **Trazos dobles en una capa.** Un trazo ancho con `stroke-opacity` bajo
  debajo del trazo principal da un halo sin otra capa.
- **Impresión y colores forzados.** Una máscara con fondo no se imprime bien y
  desaparece con colores forzados. Si el gráfico es decorativo, márcalo
  `aria-hidden` y ocúltalo al imprimir; si informa, necesita un equivalente en
  texto.
- **Peso.** Redondea coordenadas a enteros, usa segmentos relativos (`l dx dy`)
  y descarta puntos más cercanos que unos pocos píxeles. Pon una prueba con un
  tope de peso para las capas.
- **Datos de terceros.** Si las capas salen de datos con licencia (por
  ejemplo OpenStreetMap, ODbL), el crédito va visible junto al gráfico. Guarda
  el script que las genera y la fecha de los datos; no versiones el export
  crudo.

## Cuándo no usarla

- El gráfico necesita **varios colores dentro de una misma forma** o
  degradados: usa una imagen.
- El gráfico **es contenido** (un diagrama que hay que leer): va como SVG en
  línea accesible o como imagen con texto alternativo.
