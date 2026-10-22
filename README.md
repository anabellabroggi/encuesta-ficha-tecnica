# Encuesta "Ficha técnica de lote" · LotePerfecto

Encuesta web que muestra una ficha técnica de ejemplo y pide calificar cada uno de sus 12 datos con estrellas (1 a 5) y un comentario opcional. Las respuestas se guardan en la planilla de Google:

https://docs.google.com/spreadsheets/d/19HAaiLrezElHCHobvoFfvbYoQhYWZgeGqcGSwAJiifM/edit

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La encuesta completa. HTML, CSS y JS en un solo archivo. Leaflet, Chart.js y las fuentes se cargan por CDN. |
| `logo.webp` | Logo de LotePerfecto. Tiene que estar en la misma carpeta que `index.html`. |
| `img/` | Mapa de altimetría real del lote y las 2 fotos comprimidas. La página las carga desde acá. |
| `apps-script/Code.gs` | Recibe las respuestas y las escribe en la planilla. |
| `docs/` | Documentación del anegamiento y la altimetría, y los scripts para calcularlos. No hace falta publicarla. |
| `*.kml`, `foto1.jpg` y la otra foto original | Archivos fuente del lote. La página no los usa, se pueden dejar afuera al publicar. |

El ejemplo usa el lote real de Balcarce: contorno del KML, descripción, aptitud y fotos. Los bloques NDVI, suelo, historial y anegamiento siguen teniendo datos de ejemplo.

## Columnas de la hoja `Respuestas`

`timestamp, nombre, perfil, empresa, zona, contacto`, luego `<id>_estrellas, <id>_comentario` para cada parámetro en este orden: `satelite, ndvi, altura, fotos, descripcion, ubicacion, estado, suelo, pretension, historial, faq` (el bloque de anegamiento está comentado; si se reactiva, vuelve entre `historial` y `faq`), y al final `general_estrellas, falta_dato, sacaria, acepta_entrevista, user_agent`.

La hoja `Resumen` calcula, por parámetro, el promedio de estrellas, la cantidad de respuestas y el % de respuestas con 4 o 5 estrellas.
