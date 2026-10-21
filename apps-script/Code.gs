/**
 * LotePerfecto · Encuesta "Ficha técnica de lote"
 * Recibe las respuestas del formulario web (POST JSON) y agrega una fila por encuestado
 * en la hoja "Respuestas". Crea también una hoja "Resumen" con promedios por parámetro.
 *
 * Pegar en: Planilla → Extensiones → Apps Script.
 * Implementar como Aplicación web · Ejecutar como: yo · Acceso: cualquier persona.
 */

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

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getRespuestasSheet_(ss);

    // Se escribe según los encabezados reales de la hoja, así una hoja creada
    // con una versión anterior de la encuesta no desordena las columnas.
    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = header.map(h => {
      if (h === 'timestamp') return new Date();            // hora del servidor
      const v = data[h];
      if (v === undefined || v === null) return '';
      if (h.endsWith('_estrellas')) return Number(v) || '';
      return clean_(v);
    });
    sheet.appendRow(row);

    ensureResumen_(ss);
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

function getRespuestasSheet_(ss) {
  let sh = ss.getSheetByName(SHEET_RESPUESTAS);
  if (!sh) {
    sh = ss.insertSheet(SHEET_RESPUESTAS);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#EEF6EA');
    sh.setFrozenRows(1);
  } else {
    // Agrega al final las columnas nuevas que falten (no borra las viejas).
    const current = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const missing = HEADERS.filter(h => current.indexOf(h) === -1);
    if (missing.length) {
      sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing])
        .setFontWeight('bold').setBackground('#EEF6EA');
    }
  }
  return sh;
}

/** Crea la hoja Resumen una sola vez, con fórmulas que se actualizan solas. */
function ensureResumen_(ss) {
  if (ss.getSheetByName(SHEET_RESUMEN)) return;
  const sh = ss.insertSheet(SHEET_RESUMEN);
  const header = ss.getSheetByName(SHEET_RESPUESTAS).getRange(1, 1, 1, ss.getSheetByName(SHEET_RESPUESTAS).getLastColumn()).getValues()[0];
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
  getRespuestasSheet_(ss);
  ensureResumen_(ss);
}
