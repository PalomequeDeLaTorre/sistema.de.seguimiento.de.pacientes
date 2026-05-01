// components/SheetEditor.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PATIENT_TEMPLATE } from '@/lib/template';
import { Bold, Italic } from 'lucide-react';

interface SheetEditorProps {
  patientName: string;
  age: number | null;
  initialContent?: string;
  sheetNumber?: number;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

/** Markdown → HTML */
function parseToHTML(text: string): string {
  return text
    .split('\n')
    .map(line => {
      const parsed = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>');
      return `<div>${parsed || '<br>'}</div>`;
    })
    .join('');
}

/** HTML → markdown */
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/^\n/, '');
}

/** HTML → HTML limpio para imprimir */
function htmlForPrint(html: string): string {
  return html
    .replace(/<b>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<i\b/gi, '<em')
    .replace(/<\/i>/gi, '</em>');
}

// A4 @ 96dpi
const PAGE_W        = 794;
const PAGE_H        = 1123;
const PAD_V         = 48;
const PAD_H         = 64;
const CONTENT_H     = PAGE_H - PAD_V * 2; // 1027px usable per page
const GAP           = 20;                  // gray gap between pages
const FONT          = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function SheetEditor({
  patientName,
  age,
  initialContent = '',
  sheetNumber,
  onSave,
  readOnly = false,
}: SheetEditorProps) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const pagesRef    = useRef<HTMLDivElement[]>([]);
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overflow    = useRef(false); // guard against reentrant reflow

  const [isBold,   setIsBold]   = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [pages,    setPages]    = useState(1);

  const pink      = '#C2185B';
  const roseDust  = '#D4788A';
  const roseBorder= '#f0d0d8';
  const rosePale  = '#fdf6f8';

  // ── Page factory ──────────────────────────────────────────────────────────
  function makePageDiv(index: number): HTMLDivElement {
    const d = document.createElement('div');
    d.contentEditable = readOnly ? 'false' : 'true';
    d.dataset.page = String(index);
    stylePageDiv(d);
    d.addEventListener('input',   handleInput);
    d.addEventListener('keyup',   syncToolbar);
    d.addEventListener('mouseup', syncToolbar);
    return d;
  }

  function stylePageDiv(d: HTMLDivElement) {
    Object.assign(d.style, {
      width:       `${PAGE_W}px`,
      minHeight:   `${PAGE_H}px`,
      padding:     `${PAD_V}px ${PAD_H}px`,
      fontFamily:  FONT,
      fontSize:    '14px',
      lineHeight:  '1.9',
      outline:     'none',
      color:       '#1a1a1a',
      background:  '#fff',
      whiteSpace:  'pre-wrap',
      wordBreak:   'break-word',
      boxSizing:   'border-box',
      boxShadow:   '0 1px 4px rgba(0,0,0,.10), 0 4px 16px rgba(0,0,0,.10)',
      flexShrink:  '0',
      display:     'block',
    });
  }

  // ── Init: render first page via ref callback ───────────────────────────────
  const firstPageRef = useCallback((el: HTMLDivElement | null) => {
    if (!el || pagesRef.current[0]) return;
    pagesRef.current[0] = el;
    stylePageDiv(el);
    el.addEventListener('input',   handleInput);
    el.addEventListener('keyup',   syncToolbar);
    el.addEventListener('mouseup', syncToolbar);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p0 = pagesRef.current[0];
    if (p0) {
      p0.innerHTML = parseToHTML(initialContent || PATIENT_TEMPLATE);
      // After initial render, check if content already overflows page 1
      requestAnimationFrame(checkOverflow);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core: overflow detection (NOT full reflow) ────────────────────────────
  /**
   * Strategy: never touch innerHTML of the page the user is typing in.
   * Instead, only move EXCESS nodes from the BOTTOM of each page
   * to the TOP of the next page (or remove empty trailing pages).
   * This preserves the cursor position completely.
   */
  function checkOverflow() {
    if (overflow.current) return;
    overflow.current = true;

    let changed = true;
    let safetyLimit = 200; // prevent infinite loop

    while (changed && safetyLimit-- > 0) {
      changed = false;

      for (let i = 0; i < pagesRef.current.length; i++) {
        const page = pagesRef.current[i];
        if (!page) continue;

        // ── Case 1: page content exceeds allowed height → push last node to next page
        if (page.scrollHeight > PAGE_H) {
          const children = Array.from(page.childNodes);
          if (children.length <= 1) break; // can't split further

          // Ensure next page exists
          if (!pagesRef.current[i + 1]) {
            const next = makePageDiv(i + 1);
            next.innerHTML = '<div><br></div>';
            scrollRef.current?.appendChild(next);
            pagesRef.current.push(next);
          }

          const nextPage = pagesRef.current[i + 1];
          const nodeToMove = children[children.length - 1];

          // Move last child of current page → prepend to next page
          // Remove the placeholder <br> div from next page first if it's empty
          const nextChildren = Array.from(nextPage.childNodes);
          if (
            nextChildren.length === 1 &&
            nextPage.innerHTML.replace(/\s/g, '') === '<div><br></div>'
          ) {
            nextPage.innerHTML = '';
          }

          nextPage.insertBefore(nodeToMove.cloneNode(true), nextPage.firstChild);
          page.removeChild(nodeToMove);
          changed = true;
          break; // restart loop to re-measure
        }

        // ── Case 2: next page exists and current page has room → pull first node back
        const nextPage = pagesRef.current[i + 1];
        if (!nextPage) continue;

        const nextChildren = Array.from(nextPage.childNodes);
        if (nextChildren.length === 0) continue;

        // Only pull back if next page has content AND current page has room
        const firstOfNext = nextChildren[0];
        if (!firstOfNext) continue;

        // Measure what adding firstOfNext would cost
        const testH = page.scrollHeight;
        const ruler = document.createElement('div');
        Object.assign(ruler.style, {
          position: 'absolute', visibility: 'hidden', top: '-9999px', left: '0',
          width: `${PAGE_W - PAD_H * 2}px`,
          fontFamily: FONT, fontSize: '14px', lineHeight: '1.9',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxSizing: 'border-box',
        });
        ruler.appendChild(firstOfNext.cloneNode(true));
        document.body.appendChild(ruler);
        const nodeH = ruler.scrollHeight;
        document.body.removeChild(ruler);

        if (testH + nodeH <= CONTENT_H) {
          // Pull it back
          page.appendChild(firstOfNext.cloneNode(true));
          nextPage.removeChild(firstOfNext);
          changed = true;

          // If next page is now empty, remove it
          if (nextPage.childNodes.length === 0 || nextPage.innerHTML.replace(/\s/g,'') === '') {
            nextPage.remove();
            pagesRef.current.splice(i + 1, 1);
          }
          break;
        }
      }
    }

    // Update page count
    const count = pagesRef.current.filter(Boolean).length;
    setPages(count);
    overflow.current = false;
  }

  // ── Combined HTML (all pages in order) ────────────────────────────────────
  function getCombinedHTML(): string {
    return pagesRef.current.filter(Boolean).map(p => p.innerHTML).join('');
  }

  function getCleanPrintHTML(): string {
    return htmlForPrint(getCombinedHTML());
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  function handleInput() {
    // Schedule overflow check — but do NOT touch the active page's innerHTML
    requestAnimationFrame(checkOverflow);

    // Debounced save
    if (!onSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave(htmlToMarkdown(getCombinedHTML()));
    }, 400);
  }

  function syncToolbar() {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  }

  function handleBold() {
    document.execCommand('bold', false);
    syncToolbar();
  }

  function handleItalic() {
    document.execCommand('italic', false);
    syncToolbar();
  }

  // ── Toolbar button style ──────────────────────────────────────────────────
  const btn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 8,
    border: `1.5px solid ${active ? roseDust : roseBorder}`,
    background: active ? rosePale : '#fff',
    cursor: 'pointer', color: active ? pink : '#555',
    transition: 'all .15s',
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${roseBorder}`,
        background: rosePale, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: pink, margin: 0, fontFamily: FONT }}>
            {patientName}
          </p>
          <p style={{ fontSize: 11, color: '#aaa', margin: 0, fontFamily: FONT }}>
            {age ? `${age} años` : ''}
            {sheetNumber ? `  ·  Hoja ${sheetNumber}` : ''}
            {pages > 1 ? `  ·  ${pages} páginas` : ''}
          </p>
        </div>

        {/* Bold / Italic */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onMouseDown={e => { e.preventDefault(); handleBold(); }} title="Negrita (Ctrl+B)" style={btn(isBold)}>
            <Bold size={15} />
          </button>
          <button onMouseDown={e => { e.preventDefault(); handleItalic(); }} title="Cursiva (Ctrl+I)" style={btn(isItalic)}>
            <Italic size={15} />
          </button>
        </div>

        {/* Botón oculto de impresión — disparado desde patients/page.tsx */}
        <button
          data-get-print-html
          onClick={(e) => {
            (e.currentTarget as HTMLButtonElement).dataset.html = getCleanPrintHTML();
          }}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      {/* ── Desk (gray) + pages (white) ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#d0d0d0',
          padding: `${GAP}px 0`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: GAP,
        }}
      >
        {/* Page 0 — rendered in JSX; extra pages appended imperatively by checkOverflow */}
        <div
          ref={firstPageRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          data-page="0"
        />
      </div>

      {pages > 1 && (
        <div style={{
          textAlign: 'center', padding: '5px', fontSize: 11,
          color: '#999', background: rosePale,
          borderTop: `1px solid ${roseBorder}`, fontFamily: FONT,
        }}>
          {pages} páginas
        </div>
      )}
    </div>
  );
}