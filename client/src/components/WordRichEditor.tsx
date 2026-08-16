import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const FONTS = [
  'Calibri',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Tahoma',
  'Courier New',
];

const SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '36'];

const COLORS = [
  '#000000',
  '#c00000',
  '#ff0000',
  '#ffc000',
  '#ffff00',
  '#92d050',
  '#00b050',
  '#00b0f0',
  '#0070c0',
  '#002060',
  '#7030a0',
  '#ffffff',
];

const HIGHLIGHTS = ['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff', '#ff0000', '#000000', 'transparent'];

function run(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function toEditorHtml(value: string) {
  if (!value) return '';
  if (looksLikeHtml(value)) return value;
  return value
    .split(/\n+/)
    .map((line) => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '<br>'}</p>`)
    .join('');
}

export function WordRichEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState('Calibri');
  const [size, setSize] = useState('12');
  const [showMarks, setShowMarks] = useState(false);
  const syncing = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || syncing.current) return;
    const next = toEditorHtml(value);
    if (el.innerHTML !== next) {
      el.innerHTML = next || '';
    }
  }, [value]);

  function emit() {
    const el = editorRef.current;
    if (!el) return;
    syncing.current = true;
    onChange(el.innerHTML);
    queueMicrotask(() => {
      syncing.current = false;
    });
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function apply(cmd: string, arg?: string) {
    focusEditor();
    run(cmd, arg);
    emit();
  }

  function setFontFamily(name: string) {
    setFont(name);
    apply('fontName', name);
  }

  function setFontSize(px: string) {
    setSize(px);
    focusEditor();
    // execCommand fontSize only accepts 1-7; use CSS via surround
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      apply('fontSize', '3');
      return;
    }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${px}pt`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    sel.removeAllRanges();
    const after = document.createRange();
    after.selectNodeContents(span);
    after.collapse(false);
    sel.addRange(after);
    emit();
  }

  function bumpSize(delta: number) {
    const idx = SIZES.indexOf(size);
    const next = SIZES[Math.max(0, Math.min(SIZES.length - 1, (idx < 0 ? 2 : idx) + delta))];
    setFontSize(next);
  }

  function cycleCase() {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString();
    if (!text) return;
    let next = text;
    if (text === text.toUpperCase()) next = text.toLowerCase();
    else if (text === text.toLowerCase()) {
      next = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    } else next = text.toUpperCase();
    run('insertText', next);
    emit();
  }

  function setLineHeight(value: string) {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && /^(P|DIV|LI|H[1-6])$/i.test(node.tagName)) {
        node.style.lineHeight = value;
        emit();
        return;
      }
      node = node.parentNode;
    }
  }

  function setBlockShading(color: string) {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && /^(P|DIV|LI|H[1-6])$/i.test(node.tagName)) {
        node.style.backgroundColor = color === 'transparent' ? '' : color;
        emit();
        return;
      }
      node = node.parentNode;
    }
  }

  function toggleBorder() {
    focusEditor();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node: Node | null = sel.anchorNode;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && /^(P|DIV|LI|H[1-6])$/i.test(node.tagName)) {
        const on = node.style.borderWidth && node.style.borderWidth !== '0px';
        node.style.border = on ? '' : '1px solid #605e5c';
        node.style.padding = on ? '' : '0.35rem 0.5rem';
        emit();
        return;
      }
      node = node.parentNode;
    }
  }

  return (
    <div className={`word-editor ${showMarks ? 'show-marks' : ''}`}>
      <div className="word-ribbon" role="toolbar" aria-label="Formatting">
        <div className="word-group">
          <span className="word-group-label">Font</span>
          <div className="word-row">
            <select
              className="word-select font"
              value={font}
              onChange={(e) => setFontFamily(e.target.value)}
              aria-label="Font"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              className="word-select size"
              value={size}
              onChange={(e) => setFontSize(e.target.value)}
              aria-label="Font size"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" className="word-btn" title="Increase font size" onClick={() => bumpSize(1)}>
              A⌃
            </button>
            <button type="button" className="word-btn" title="Decrease font size" onClick={() => bumpSize(-1)}>
              A⌄
            </button>
            <button type="button" className="word-btn" title="Change case" onClick={cycleCase}>
              Aa
            </button>
            <button
              type="button"
              className="word-btn"
              title="Clear formatting"
              onClick={() => apply('removeFormat')}
            >
              ✎
            </button>
            <span className="word-sep" />
            <button type="button" className="word-btn bold" title="Bold" onClick={() => apply('bold')}>
              B
            </button>
            <button type="button" className="word-btn italic" title="Italic" onClick={() => apply('italic')}>
              I
            </button>
            <button type="button" className="word-btn under" title="Underline" onClick={() => apply('underline')}>
              U
            </button>
            <button
              type="button"
              className="word-btn"
              title="Strikethrough"
              onClick={() => apply('strikeThrough')}
            >
              abc
            </button>
            <button type="button" className="word-btn" title="Subscript" onClick={() => apply('subscript')}>
              x₂
            </button>
            <button type="button" className="word-btn" title="Superscript" onClick={() => apply('superscript')}>
              x²
            </button>
            <span className="word-sep" />
            <label className="word-color" title="Text highlight">
              <span className="word-color-ico hi">🖊</span>
              <input
                type="color"
                defaultValue="#ffff00"
                onChange={(e) => apply('hiliteColor', e.target.value)}
              />
            </label>
            <label className="word-color" title="Font color">
              <span className="word-color-ico fg">A</span>
              <input type="color" defaultValue="#c00000" onChange={(e) => apply('foreColor', e.target.value)} />
            </label>
            <select
              className="word-select tiny"
              aria-label="Highlight presets"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                apply('hiliteColor', e.target.value === 'transparent' ? '#ffffff' : e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Highlight</option>
              {HIGHLIGHTS.map((c) => (
                <option key={c} value={c}>
                  {c === 'transparent' ? 'None' : c}
                </option>
              ))}
            </select>
            <select
              className="word-select tiny"
              aria-label="Font color presets"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                apply('foreColor', e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Color</option>
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="word-group">
          <span className="word-group-label">Paragraph</span>
          <div className="word-row">
            <button type="button" className="word-btn" title="Bullets" onClick={() => apply('insertUnorderedList')}>
              •≡
            </button>
            <button type="button" className="word-btn" title="Numbering" onClick={() => apply('insertOrderedList')}>
              1.≡
            </button>
            <button type="button" className="word-btn" title="Decrease indent" onClick={() => apply('outdent')}>
              ⇤
            </button>
            <button type="button" className="word-btn" title="Increase indent" onClick={() => apply('indent')}>
              ⇥
            </button>
            <button
              type="button"
              className={`word-btn ${showMarks ? 'is-on' : ''}`}
              title="Show formatting marks"
              onClick={() => setShowMarks((v) => !v)}
            >
              ¶
            </button>
            <span className="word-sep" />
            <button type="button" className="word-btn align" title="Align left" onClick={() => apply('justifyLeft')}>
              L
            </button>
            <button type="button" className="word-btn align" title="Center" onClick={() => apply('justifyCenter')}>
              C
            </button>
            <button type="button" className="word-btn align" title="Align right" onClick={() => apply('justifyRight')}>
              R
            </button>
            <button type="button" className="word-btn align" title="Justify" onClick={() => apply('justifyFull')}>
              J
            </button>
            <select
              className="word-select tiny"
              aria-label="Line spacing"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                setLineHeight(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Spacing</option>
              <option value="1">1.0</option>
              <option value="1.15">1.15</option>
              <option value="1.5">1.5</option>
              <option value="2">2.0</option>
            </select>
            <select
              className="word-select tiny"
              aria-label="Shading"
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                setBlockShading(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Shading</option>
              <option value="transparent">None</option>
              <option value="#fff2cc">Yellow</option>
              <option value="#d9ead3">Green</option>
              <option value="#cfe2f3">Blue</option>
              <option value="#f4cccc">Red</option>
              <option value="#e8e8e8">Gray</option>
            </select>
            <button type="button" className="word-btn" title="Borders" onClick={toggleBorder}>
              ▦
            </button>
          </div>
        </div>
      </div>

      <div
        ref={editorRef}
        className="word-surface"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder || 'Start typing…'}
        onInput={emit}
        onBlur={emit}
        suppressContentEditableWarning
      />
    </div>
  );
}
