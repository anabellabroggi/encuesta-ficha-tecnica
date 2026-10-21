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

## Cómo publicarla

1. **Pegar el script.** Abrí la planilla y andá a *Extensiones → Apps Script*. Borrá lo que haya en `Código.gs`, pegá el contenido de `apps-script/Code.gs` y guardá.
   - Opcional: elegí la función `setup` y tocá *Ejecutar* para crear las hojas `Respuestas` y `Resumen` antes de la primera respuesta. Google te va a pedir permisos la primera vez.
2. **Publicar el Web App.** Tocá *Implementar → Nueva implementación*. En el engranaje elegí *Aplicación web*.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier persona**.
   - Tocá *Implementar* y copiá la URL que termina en `/exec`.
3. **Conectar la página.** Abrí `index.html` y pegá la URL en la constante que está arriba del script:
   ```js
   const ENDPOINT = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
4. **Subir la página.** Elegí una de estas opciones:
   - **Netlify Drop:** entrá a https://app.netlify.com/drop y arrastrá la carpeta `encuesta-ficha-tecnica` entera. Te da un link público al instante.
   - **GitHub Pages:** subí la carpeta a un repositorio, andá a *Settings → Pages*, elegí la rama `main` y la carpeta raíz.
5. **Probar.** Abrí el link, completá una respuesta de prueba y verificá que aparezca una fila nueva en la hoja `Respuestas`. La hoja `Resumen` se crea sola con la primera respuesta.

## Cosas a tener en cuenta

- **Si cambiás el script,** tenés que publicar una versión nueva: *Implementar → Administrar implementaciones → Editar → Versión: nueva*. Así la URL sigue siendo la misma.
- **Modo prueba:** mientras `ENDPOINT` diga `PEGAR_URL_DEL_WEB_APP`, la encuesta no envía nada. Al tocar *Enviar* muestra el JSON en la consola del navegador y un aviso en la pantalla de gracias.
- **Borrador:** lo que la persona va completando queda guardado en su navegador. Si recarga la página no pierde nada. Se borra al enviar.
- **Envío:** la página usa `mode: "no-cors"` y `text/plain` para evitar el bloqueo de CORS de Google. Por eso el navegador no puede leer la respuesta del script. Si hay un error del lado de la planilla, se ve en *Apps Script → Ejecuciones*.
- **Para resetear la encuesta en tu navegador,** abrí la consola y ejecutá `localStorage.removeItem("lp_encuesta_ficha_v2")`.
- **Si ya habías creado las hojas con la versión anterior,** el script agrega solas las columnas nuevas al final de `Respuestas`. La hoja `Resumen` no se regenera: borrala y se vuelve a crear con la próxima respuesta.

## Columnas de la hoja `Respuestas`

`timestamp, nombre, perfil, empresa, zona, contacto`, luego `<id>_estrellas, <id>_comentario` para cada parámetro en este orden: `satelite, ndvi, altura, fotos, descripcion, ubicacion, estado, suelo, pretension, historial, faq` (el bloque de anegamiento está comentado; si se reactiva, vuelve entre `historial` y `faq`), y al final `general_estrellas, falta_dato, sacaria, acepta_entrevista, user_agent`.

La hoja `Resumen` calcula, por parámetro, el promedio de estrellas, la cantidad de respuestas y el % de respuestas con 4 o 5 estrellas.
