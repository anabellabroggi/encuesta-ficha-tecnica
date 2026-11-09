/**
 * LotePerfecto · Encuesta "Ficha técnica de lote"
 * Recibe las respuestas del formulario web (POST JSON) y agrega una fila por encuestado.
 *
 * Atiende las dos versiones de la encuesta con la misma URL:
 *   - v3 (carpeta /v3/): el payload trae "ranking_orden" → hoja "Respuestas_v3" + "Resumen_v3".
 *   - v2 (página raíz):  cualquier otro payload        → hoja "Respuestas"    + "Resumen" (sin cambios).
 *
 * Pegar en: Planilla → Extensiones → Apps Script.
 * Implementar como Aplicación web · Ejecutar como: yo · Acceso: cualquier persona.
 * Después de cambiar este código: Implementar → Administrar implementaciones → Editar → Versión: nueva.
 */

/* ======================= v2 (no tocar: la usa la página raíz) ======================= */
const SHEET_RESPUESTAS = 'Respuestas';
const SHEET_RESUMEN = 'Resumen';

const PARAMS = [
  ['satelite', 'Mapa – Satélite'],
  ['ndvi', 'Mapa – NDVI'],
  ['altura', 'Mapa – Altura (altimetría)'],
  ['fotos', 'Mapa – Fotos'],
  ['descripcion', 'Descripción y aptitud'],
  ['ubicacion', 'Ubicación'],
  ['estado', 'Estado actual'],
  ['suelo', 'Suelo y calidad'],
  ['pretension', 'Pretensión'],
  ['historial', 'Historial agronómico'],
  // ['anegamiento', 'Anegamiento histórico'],  // bloque comentado en la encuesta
  ['faq', 'Preguntas frecuentes del lote']
];

const HEADERS = [].concat(
  ['timestamp', 'nombre', 'perfil', 'empresa', 'zona', 'contacto'],
  ...PARAMS.map(p => [p[0] + '_estrellas', p[0] + '_comentario']),
  ['general_estrellas', 'falta_dato', 'sacaria', 'acepta_entrevista', 'user_agent']
);

/* ======================= v3 ======================= */
const SHEET_V3 = 'Respuestas_v3';
const RESUMEN_V3 = 'Resumen_v3';

const PARAMS_V3 = [
  ['satelite', 'Mapa – Satélite'],
  ['ndvi', 'Mapa – NDVI'],
  ['altura', 'Mapa – Altura (altimetría)'],
  ['fotos', 'Mapa – Fotos'],
  ['ubicacion', 'Ubicación'],
  ['estado', 'Estado actual'],
  ['suelo', 'Suelo y calidad'],
  ['pretension', 'Pretensión'],
  ['infraestructura', 'Infraestructura y servicios'],
  ['comentarios', 'Comentarios del oferente'],
  ['historial', 'Historial agronómico']
];

const HEADERS_V3 = [].concat(
  ['timestamp', 'recordID'],
  ...PARAMS_V3.map(p => [p[0] + '_estrellas', p[0] + '_comentario']),
  ['ranking_orden'],
  PARAMS_V3.map(p => p[0] + '_ranking'),
  ['falta_dato', 'sacaria', 'user_agent']
);

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (Object.prototype.hasOwnProperty.call(data, 'ranking_orden')) {
      writeV3_(ss, data);
    } else {
      writeV2_(ss, data);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/** Para probar en el navegador que la URL del Web App responde. */
function doGet() {
  return json_({ ok: true, info: 'Endpoint de la encuesta LotePerfecto activo. Usá POST.' });
}

/* ---------- v3 ---------- */
function writeV3_(ss, data) {
  const sheet = ensureSheet_(ss, SHEET_V3, HEADERS_V3);

  // Si llega una clave que todavía no tiene columna, se agrega al final.
  let header = headerOf_(sheet);
  const extra = Object.keys(data).filter(k => header.indexOf(k) === -1);
  if (extra.length) {
    sheet.getRange(1, header.length + 1, 1, extra.length).setValues([extra])
      .setFontWeight('bold').setBackground('#EEF6EA');
    header = header.concat(extra);
  }

  // Se escribe mapeando por nombre de encabezado, no por posición.
  const row = header.map(h => {
    if (h === 'timestamp') return new Date();             // hora del servidor
    const v = data[h];
    if (v === undefined || v === null) return '';
    if (/_(estrellas|ranking)$/.test(h)) return Number(v) || '';
    return clean_(v);
  });
  sheet.appendRow(row);
  ensureResumenV3_(ss);
}

/** Crea Resumen_v3 una sola vez, con fórmulas que se actualizan solas. */
function ensureResumenV3_(ss) {
  if (ss.getSheetByName(RESUMEN_V3)) return;
  const header = headerOf_(ss.getSheetByName(SHEET_V3));
  const sh = ss.insertSheet(RESUMEN_V3);
  const rows = [['Parámetro', 'id', 'Promedio de estrellas', 'Cantidad de respuestas', '% con 4–5 estrellas', 'Posición promedio en el ranking (menor = más importante)']];
  PARAMS_V3.forEach(p => {
    const cs = colLetter_(header.indexOf(p[0] + '_estrellas') + 1);
    const cr = colLetter_(header.indexOf(p[0] + '_ranking') + 1);
    const s = `${SHEET_V3}!${cs}2:${cs}`, r = `${SHEET_V3}!${cr}2:${cr}`;
    rows.push([
      p[1],
      p[0],
      `=IFERROR(ROUND(AVERAGE(${s}),2),"")`,
      `=COUNT(${s})`,
      `=IFERROR(COUNTIF(${s},">=4")/COUNT(${s}),"")`,
      `=IFERROR(ROUND(AVERAGE(${r}),2),"")`
    ]);
  });
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold').setBackground('#FFF8DC');
  sh.getRange(2, 5, rows.length - 1, 1).setNumberFormat('0%');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, rows[0].length);
}

/* ---------- v2 (mismo comportamiento que antes) ---------- */
function writeV2_(ss, data) {
  const sheet = ensureSheet_(ss, SHEET_RESPUESTAS, HEADERS);
  const header = headerOf_(sheet);
  const row = header.map(h => {
    if (h === 'timestamp') return new Date();
    const v = data[h];
    if (v === undefined || v === null) return '';
    if (h.endsWith('_estrellas')) return Number(v) || '';
    return clean_(v);
  });
  sheet.appendRow(row);
  ensureResumen_(ss);
}

/** Crea la hoja Resumen (v2) una sola vez. */
function ensureResumen_(ss) {
  if (ss.getSheetByName(SHEET_RESUMEN)) return;
  const header = headerOf_(ss.getSheetByName(SHEET_RESPUESTAS));
  const sh = ss.insertSheet(SHEET_RESUMEN);
  const rows = [['Parámetro', 'id', 'Promedio de estrellas', 'Cantidad de respuestas', '% con 4–5 estrellas']];
  const items = PARAMS.concat([['general', 'Valoración general']]);
  items.forEach(p => {
    const col = colLetter_(header.indexOf(p[0] + '_estrellas') + 1);
    const rng = `${SHEET_RESPUESTAS}!${col}2:${col}`;
    rows.push([
      p[1],
      p[0],
      `=IFERROR(ROUND(AVERAGE(${rng}),2),"")`,
      `=COUNT(${rng})`,
      `=IFERROR(COUNTIF(${rng},">=4")/COUNT(${rng}),"")`
    ]);
  });
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold').setBackground('#FFF8DC');
  sh.getRange(2, 5, rows.length - 1, 1).setNumberFormat('0%');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, rows[0].length);
}

/* ---------- Utilidades compartidas ---------- */

/** Crea la hoja con encabezados si no existe y agrega al final las columnas que falten. */
function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#EEF6EA');
    sh.setFrozenRows(1);
  } else {
    const current = headerOf_(sh);
    const missing = headers.filter(h => current.indexOf(h) === -1);
    if (missing.length) {
      sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing])
        .setFontWeight('bold').setBackground('#EEF6EA');
    }
  }
  return sh;
}

function headerOf_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
}

function colLetter_(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Evita que un texto que empieza con =, +, - o @ se interprete como fórmula. */
function clean_(v) {
  const s = String(v).slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Opcional: ejecutalo una vez desde el editor para crear las hojas antes de la primera respuesta. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, SHEET_RESPUESTAS, HEADERS);
  ensureResumen_(ss);
  ensureSheet_(ss, SHEET_V3, HEADERS_V3);
  ensureResumenV3_(ss);
}
