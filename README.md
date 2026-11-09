# Encuesta "Ficha técnica de lote" · LotePerfecto

Encuesta web que muestra una ficha técnica de ejemplo y pide calificar cada dato con estrellas (1 a 5) y un comentario opcional. Las respuestas se guardan en la planilla de Google:

https://docs.google.com/spreadsheets/d/19HAaiLrezElHCHobvoFfvbYoQhYWZgeGqcGSwAJiifM/edit

Hay dos versiones publicadas en paralelo:

| Versión | Link | Hoja de respuestas |
|---|---|---|
| v2 (la que ya se está usando) | https://anabellabroggi.github.io/encuesta-ficha-tecnica/ | `Respuestas` y `Resumen` |
| v3 (cambios del equipo) | https://anabellabroggi.github.io/encuesta-ficha-tecnica/v3/ | `Respuestas_v3` y `Resumen_v3` |

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `logo.webp`, `img/` | Versión 2. No se modificó. |
| `v3/index.html`, `v3/logo.webp`, `v3/img/` | Versión 3, una copia independiente con sus propios archivos. HTML, CSS y JS en un solo archivo. Leaflet, SortableJS y las fuentes se cargan por CDN. |
| `apps-script/Code.gs` | Recibe las respuestas de las dos versiones con la misma URL y las escribe en la planilla. |

## Qué cambió en la v3

- Portada nueva: explica que es la ficha de un lote **para alquiler**, que se evalúan los parámetros y no el lote, y muestra el proceso en 3 pasos: ficha técnica, chat con el dueño y visita.
- No pide datos de contacto. La persona se identifica con el `recordID` de HubSpot que viene en el link.
- El mapa avisa que tiene 4 vistas para calificar por separado y guía de una a la otra.
- Al final se ordenan todos los datos por importancia, arrastrando o con las flechas ▲ ▼.
- Las dos preguntas abiertas son obligatorias. Se sacaron la valoración general y la pregunta de la entrevista.
- Módulos nuevos: Infraestructura y servicios, Comentarios del oferente.
- Módulos que se sacaron porque no están en la ficha actual: Descripción y aptitud, Anegamiento histórico satelital, Preguntas frecuentes. Suelo y calidad queda con el formato de la plataforma.

## Link personalizado desde HubSpot

Agregá el `recordID` al final del link de la v3:

```
https://anabellabroggi.github.io/encuesta-ficha-tecnica/v3/?recordID={{contact.hs_object_id}}
```

El token exacto depende de dónde se envíe. En plantillas de email y secuencias de HubSpot suele ser `{{contact.hs_object_id}}`. Para WhatsApp depende de la integración que uses: revisá cómo inserta las propiedades del contacto. Si el link llega sin `recordID`, la encuesta funciona igual y la columna queda vacía.

## Cambios en el Apps Script

Después de pegar el nuevo `Code.gs` hay que publicar una versión nueva del Web App, o no toma el cambio:

1. En el editor de Apps Script, andá a *Implementar → Administrar implementaciones*.
2. Tocá el lápiz de la implementación que ya existe.
3. En *Versión* elegí **Nueva versión** y tocá *Implementar*.

Así la URL del `ENDPOINT` sigue siendo la misma y no hay que cambiar nada en las páginas. Si en cambio creás una implementación nueva, la URL cambia y hay que pegarla en el `ENDPOINT` de las dos páginas.

## Columnas de `Respuestas_v3`

`timestamp, recordID`, luego `<id>_estrellas, <id>_comentario` para cada parámetro, luego `ranking_orden` (los ids del más al menos importante, separados por ` > `), luego `<id>_ranking` para cada parámetro (1 = más importante), y al final `falta_dato, sacaria, user_agent`.

Orden de los parámetros: `satelite, ndvi, altura, fotos, ubicacion, estado, suelo, pretension, infraestructura, comentarios, historial`.

`Resumen_v3` muestra por parámetro el promedio de estrellas, la cantidad de respuestas, el % con 4 o 5 estrellas y la posición promedio en el ranking.

## Columnas de `Respuestas` (v2)

`timestamp, nombre, perfil, empresa, zona, contacto`, luego `<id>_estrellas, <id>_comentario` para `satelite, ndvi, altura, fotos, descripcion, ubicacion, estado, suelo, pretension, historial, faq`, y al final `general_estrellas, falta_dato, sacaria, acepta_entrevista, user_agent`.
