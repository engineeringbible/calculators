/**
 * shared/markdown.js — renders the Markdown subset of the content.md articles to HTML. DOM-free: build-manifest.js
 * embeds the result in every index.html, so the article is part of the page without JavaScript.
 *
 * Subset: "##" sections and "###" headings, paragraphs, **bold**, *italic*, `code`, [links](url), "-" and "1." lists,
 * pipe tables and indented (4 spaces) formula blocks. In the FAQ section a bold first line opens a collapsible
 * question that holds every block up to the next question. The "#" title and the "**Summary:**" paragraph are left
 * out because the page shows them already. Everything is escaped: raw HTML in content.md is shown as text.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const INDENT = /^( {4}|\t)/;
const BULLET = /^\s*[-*+] (.*)$/;
const NUMBERED = /^\s*(\d+)\. (.*)$/;
const SAFE_HREF = /^(\.{1,2}\/[\w./#-]*|https?:\/\/[^\s"<>]+)$/;

export const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Section slug from a heading: "Worked example" → "worked-example", "Assumptions and limitations" → "assumptions-and-limitations". */
export const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Inline markup of one paragraph: code spans verbatim, then links, bold and italic; all text escaped. */
export function renderInline(text) {
  return String(text)
    .split(/(`[^`]+`)/)
    .map((part, k) => {
      if (k % 2 === 1) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      return escapeHtml(part)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) => (SAFE_HREF.test(href) ? `<a href="${href}">${label}</a>` : whole))
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|\s)\*([^*\s](?:[^*]*[^*\s])?)\*(?=$|[\s.,;:!?)])/g, '$1<em>$2</em>');
    })
    .join('');
}

/** Split a pipe-table row into its cells. */
const cells = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

function renderTable(rows) {
  const head = cells(rows[0]);
  const hasRule = rows.length > 1 && /^\|?\s*:?-{3,}/.test(rows[1].trim());
  const align = hasRule ? cells(rows[1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-+:$/.test(c) ? 'right' : null)) : [];
  const attr = (k) => (align[k] ? ` style="text-align: ${align[k]}"` : '');
  const body = rows.slice(hasRule ? 2 : 1).map((row) => `<tr>${cells(row).map((c, k) => `<td${attr(k)}>${renderInline(c)}</td>`).join('')}</tr>`);
  return [
    '<div class="ec-table-wrap" role="region" tabindex="0" aria-label="Table">',
    `<table class="ec-table"><thead><tr>${head.map((c, k) => `<th scope="col"${attr(k)}>${renderInline(c)}</th>`).join('')}</tr></thead>`,
    `<tbody>\n${body.join('\n')}\n</tbody></table>`,
    '</div>',
  ].join('\n');
}

/**
 * Render a content.md article to HTML: one <section class="ec-article-section" data-section="<slug>"> per "##"
 * heading, with the h2 id "ec-article-<slug>".
 */
export function renderArticle(markdown) {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  const blank = (line) => line.trim() === '';
  const startsBlock = (line) => /^#{1,3} /.test(line) || /^\|/.test(line) || BULLET.test(line) || NUMBERED.test(line) || INDENT.test(line);
  let section = null;
  let question = false;
  const closeQuestion = () => {
    if (question) out.push('</details>');
    question = false;
  };
  const closeSection = () => {
    closeQuestion();
    if (section !== null) out.push('</section>');
  };
  let k = 0;
  while (k < lines.length) {
    const line = lines[k];
    if (blank(line) || /^# /.test(line)) {
      k += 1;
      continue;
    }
    if (/^\*\*Summary:\*\*/.test(line)) {
      while (k < lines.length && !blank(lines[k])) k += 1;
      continue;
    }
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      if (heading[1] === '##') {
        closeSection();
        section = slug(heading[2]);
        out.push(`<section class="ec-article-section" data-section="${section}">`, `<h2 id="ec-article-${section}">${renderInline(heading[2])}</h2>`);
      } else {
        closeQuestion();
        out.push(`<h3>${renderInline(heading[2])}</h3>`);
      }
      k += 1;
      continue;
    }
    if (INDENT.test(line)) {
      // an indented block runs on across blank lines while the next text line is indented too
      const block = [];
      while (k < lines.length && (INDENT.test(lines[k]) || (blank(lines[k]) && INDENT.test(lines[k + 1] || '')))) {
        block.push(lines[k].replace(INDENT, ''));
        k += 1;
      }
      out.push(`<pre class="ec-formula" tabindex="0"><code>${escapeHtml(block.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (k < lines.length && /^\|/.test(lines[k])) rows.push(lines[k++]);
      out.push(renderTable(rows));
      continue;
    }
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = NUMBERED.test(line);
      const marker = ordered ? NUMBERED : BULLET;
      const other = ordered ? BULLET : NUMBERED;
      const items = [];
      while (k < lines.length && !blank(lines[k]) && !other.test(lines[k]) && !/^#{1,3} |^\|/.test(lines[k])) {
        const item = lines[k].match(marker);
        if (item) items.push(item[item.length - 1]);
        else items[items.length - 1] += ` ${lines[k].trim()}`;
        k += 1;
      }
      const start = ordered ? Number(line.match(NUMBERED)[1]) : 1;
      const tag = ordered ? 'ol' : 'ul';
      // one item per line, so the text of the page keeps the items apart (the worked-example check reads it)
      out.push(`<${tag}${start !== 1 ? ` start="${start}"` : ''}>\n${items.map((text) => `<li>${renderInline(text)}</li>`).join('\n')}\n</${tag}>`);
      continue;
    }
    const paragraph = [];
    while (k < lines.length && !blank(lines[k]) && (paragraph.length === 0 || !startsBlock(lines[k]))) paragraph.push(lines[k++]);
    const ask = paragraph[0].trim().match(/^\*\*(.+)\*\*$/);
    if (section === 'faq' && ask) {
      closeQuestion();
      out.push(`<details class="ec-faq"><summary>${renderInline(ask[1])}</summary>`);
      question = true;
      if (paragraph.length > 1) out.push(`<p>${renderInline(paragraph.slice(1).join(' '))}</p>`);
    } else {
      out.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    }
  }
  closeSection();
  return out.join('\n');
}

/** The relative links of an article ("../<id>/index.html"), for the build-time check that every target exists. */
export function articleLinks(markdown) {
  return [...String(markdown).matchAll(/\]\((\.\.\/[^)\s]+)\)/g)].map((m) => m[1]);
}
