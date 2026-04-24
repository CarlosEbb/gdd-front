import type { RichTextLine, RichTextRun } from './types';

/**
 * Escapa los caracteres HTML conflictivos de un texto plano.
 */
export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Sanitiza el HTML proveniente del contenteditable.
 * Sólo conserva texto, saltos de línea y etiquetas <b>/<strong>.
 * Devuelve HTML normalizado (sólo <b>...</b> y \n).
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';

  // Normalizar <strong> → <b>.
  let normalized = html.replace(/<strong(\s[^>]*)?>/gi, '<b>').replace(/<\/strong>/gi, '</b>');

  // Normalizar saltos de bloque → \n antes de strip.
  normalized = normalized
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<\/(div|p|h[1-6]|li)>/gi, '\n')
    .replace(/<(div|p|h[1-6]|li)(\s[^>]*)?>/gi, '');

  // Convertir nbsp a espacio normal.
  normalized = normalized.replace(/&nbsp;/g, ' ');

  // Eliminar cualquier otra etiqueta que no sea <b>/</b>.
  normalized = normalized.replace(/<(?!\/?b(\s|>|\/))[^>]+>/gi, '');

  // Normalizar <b> sin atributos.
  normalized = normalized.replace(/<b\s[^>]*>/gi, '<b>');

  // Colapsar <b></b> vacíos y <b> consecutivos.
  normalized = normalized.replace(/<b>\s*<\/b>/gi, '');
  normalized = normalized.replace(/<\/b>\s*<b>/gi, '');

  return normalized;
};

/**
 * Convierte el HTML normalizado en una lista de líneas con sus runs.
 */
export const parseRuns = (html: string): RichTextLine[] => {
  const safe = sanitizeHtml(html || '');
  if (!safe) return [{ runs: [{ text: '', bold: false }] }];

  const lines: RichTextLine[] = [];
  let currentRuns: RichTextRun[] = [];
  let bold = false;
  let buffer = '';

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    // Decodificar entidades básicas.
    const decoded = buffer
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    currentRuns.push({ text: decoded, bold });
    buffer = '';
  };

  const flushLine = () => {
    flushBuffer();
    if (currentRuns.length === 0) {
      currentRuns.push({ text: '', bold: false });
    }
    lines.push({ runs: currentRuns });
    currentRuns = [];
  };

  const tokenRegex = /<b>|<\/b>|\n/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(safe)) !== null) {
    buffer += safe.slice(lastIndex, match.index);
    const token = match[0].toLowerCase();
    if (token === '<b>') {
      flushBuffer();
      bold = true;
    } else if (token === '</b>') {
      flushBuffer();
      bold = false;
    } else if (token === '\n') {
      flushLine();
    }
    lastIndex = match.index + match[0].length;
  }

  buffer += safe.slice(lastIndex);
  flushLine();

  return lines;
};

/**
 * Convierte el HTML a texto plano (sin etiquetas), preservando saltos de línea.
 */
export const htmlToPlain = (html: string): string =>
  parseRuns(html)
    .map((line) => line.runs.map((r) => r.text).join(''))
    .join('\n');
