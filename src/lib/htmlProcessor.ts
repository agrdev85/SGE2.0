/**
 * Procesa HTML con enlaces y lo hace compatible con navegación interna
 * Envuelve enlaces en atributos data-* para permitir manejo en React
 */
export function processHtmlLinks(html: string): string {
  if (!html) return html;

  // Expresión regular para encontrar enlaces
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;

  let processed = html.replace(linkRegex, (match, before, href, after) => {
    // Detectar si es una URL interna (comienza con /) o interna (sin protocolo)
    const isInternal =
      href.startsWith('/') ||
      (!href.startsWith('http://') &&
        !href.startsWith('https://') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        href !== '#');

    if (isInternal) {
      // Añadir data-internal para marcar como enlace interno
      return `<a ${before}href="${href}" data-internal="true" ${after}>`;
    }

    return match;
  });

  return processed;
}

/**
 * Extrae contenido del body si es un documento HTML completo
 */
export function extractBodyContent(html: string): string {
  if (!html) return html;

  // Si es un documento completo, extraer solo el contenido del body
  const bodyRegex = /<body[^>]*>([\s\S]*)<\/body>/i;
  const match = html.match(bodyRegex);

  if (match && match[1]) {
    return match[1];
  }

  return html;
}

/**
 * Limpia HTML para remover scripts dañinos pero preservar estructura
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;

  // Crear un parser temporal
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remover scripts
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Remover atributos on*
  doc.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

/**
 * Inyecta CSS de Tailwind en el HTML para srcDoc (iframe)
 */
export function injectTailwindCSS(html: string): string {
  const tailwindCSS = `
    <link href="https://cdn.tailwindcss.com" rel="stylesheet">
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
      html { margin: 0; padding: 0; }
      * { box-sizing: border-box; }
      a[data-internal] { cursor: pointer; }
    </style>
  `;

  // Si es documento completo, inyectar en head
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<\/head>/i, tailwindCSS + '</head>');
  }

  // Si no tiene head, crear uno
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, '<html><head>' + tailwindCSS + '</head>');
  }

  // Si es fragmento, envolver
  return `<!DOCTYPE html>
<html>
<head>${tailwindCSS}</head>
<body>${html}</body>
</html>`;
}

/**
 * Procesa y sanitiza HTML para uso seguro en dangerouslySetInnerHTML
 */
export function processAndSanitizeHtml(html: string): string {
  let processed = sanitizeHtml(html);
  processed = processHtmlLinks(processed);
  processed = extractBodyContent(processed);
  return processed;
}

/**
 * Prepara HTML para srcDoc (iframe) con CSS inyectado
 */
export function prepareHtmlForIframe(html: string): string {
  let processed = sanitizeHtml(html);
  processed = processHtmlLinks(processed);
  processed = injectTailwindCSS(processed);
  return processed;
}
