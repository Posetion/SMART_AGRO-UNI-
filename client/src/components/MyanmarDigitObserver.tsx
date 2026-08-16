import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { fromMyanmarDigits, toMyanmarDigits } from '../utils/myanmarDigits';

const SKIP_TAGS = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'OPTION',
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'NOSCRIPT',
]);

const ATTRS = ['title', 'aria-label', 'aria-valuetext', 'placeholder', 'alt'] as const;

function shouldSkip(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  if (el.closest('[data-latin-digits]')) return true;
  if (el.closest('input, textarea, select, code, pre')) return true;
  return false;
}

function convertText(text: string, toMyanmar: boolean): string {
  return toMyanmar ? toMyanmarDigits(text) : fromMyanmarDigits(text);
}

function convertNode(node: Node, toMyanmar: boolean): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const current = node.textContent ?? '';
    if (!current) return;
    const next = convertText(current, toMyanmar);
    if (next !== current) node.textContent = next;
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (shouldSkip(el)) return;

  for (const attr of ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const current = el.getAttribute(attr) ?? '';
    const next = convertText(current, toMyanmar);
    if (next !== current) el.setAttribute(attr, next);
  }

  for (const child of Array.from(node.childNodes)) {
    convertNode(child, toMyanmar);
  }
}

/** When language is Myanmar, show Myanmar numerals across the UI. */
export function MyanmarDigitObserver() {
  const { lang } = useLanguage();

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    const toMyanmar = lang === 'my';
    convertNode(root, toMyanmar);

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData' && m.target.parentElement) {
          if (!shouldSkip(m.target.parentElement)) {
            convertNode(m.target, toMyanmar);
          }
        }
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => convertNode(n, toMyanmar));
        }
        if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
          const el = m.target as Element;
          if (shouldSkip(el)) continue;
          if (m.attributeName && (ATTRS as readonly string[]).includes(m.attributeName)) {
            const current = el.getAttribute(m.attributeName) ?? '';
            const next = convertText(current, toMyanmar);
            if (next !== current) el.setAttribute(m.attributeName, next);
          }
        }
      }
    });

    obs.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });

    return () => obs.disconnect();
  }, [lang]);

  return null;
}
