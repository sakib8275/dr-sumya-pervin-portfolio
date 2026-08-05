// Safe XSS-resistant light rich text parser for user-editable site content.
// Escapes raw HTML before converting bold (**text**), italic (*text*), lists (- item), and linebreaks.

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function plainText(text) {
  return escapeHtml(text);
}

export function renderLightRich(text) {
  if (typeof text !== 'string' || !text) return '';

  // Step 1: Escape HTML entities first to neutralize any input HTML/scripting
  const escaped = escapeHtml(text);

  // Step 2: Handle unordered lists line by line
  const lines = escaped.split('\n');
  const resultLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^-\s+(.+)$/);

    if (listMatch) {
      if (!inList) {
        resultLines.push('<ul>');
        inList = true;
      }
      resultLines.push('<li>' + formatInline(listMatch[1]) + '</li>');
    } else {
      if (inList) {
        resultLines.push('</ul>');
        inList = false;
      }
      resultLines.push(formatInline(line));
    }
  }

  if (inList) {
    resultLines.push('</ul>');
  }

  // Step 3: Join lines with <br> for non-list breaks
  let finalHtml = '';
  for (let i = 0; i < resultLines.length; i++) {
    const item = resultLines[i];
    if (item === '<ul>' || item === '</ul>' || item.startsWith('<li>')) {
      finalHtml += item;
    } else {
      if (i > 0 && resultLines[i - 1] !== '<ul>' && resultLines[i - 1] !== '</ul>' && !resultLines[i - 1].startsWith('<li>')) {
        finalHtml += '<br>';
      }
      finalHtml += item;
    }
  }

  return finalHtml;
}

function formatInline(str) {
  // Bold: **text**
  let formatted = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return formatted;
}

if (typeof window !== 'undefined') {
  window.RichText = { escapeHtml, plainText, renderLightRich };
}
