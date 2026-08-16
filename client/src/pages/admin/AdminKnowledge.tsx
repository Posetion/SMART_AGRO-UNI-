import { useEffect, useRef, useState, type FormEvent } from 'react';
import { WordRichEditor } from '../../components/WordRichEditor';
import { useAuth } from '../../context/AuthContext';
import { ApiError, api } from '../../services/api';

type Article = {
  _id: string;
  title: string;
  category: 'Book' | 'Article' | 'Journal';
  description?: string;
  content?: string;
  fileUrl?: string;
  coverUrl?: string;
  author?: string;
  tags?: string[];
  isPublished: boolean;
  version?: number;
};

type FieldKey = 'title' | 'category' | 'fileUrl';

const DEFAULT_BOOK_COVER = '/default-book-cover.svg';

const emptyForm = {
  title: '',
  category: 'Article' as Article['category'],
  description: '',
  content: '',
  fileUrl: '',
  coverUrl: '',
  author: '',
  tags: '',
  isPublished: true,
};

export function AdminKnowledge() {
  const { accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Article[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickedCover, setPickedCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [ok, setOk] = useState('');

  const needsFileLink = form.category === 'Book' || form.category === 'Journal';
  const showCover = form.category === 'Book';

  async function load() {
    if (!accessToken) return;
    try {
      const data = await api<Article[]>('/knowledge/articles?drafts=true&limit=50', {
        token: accessToken,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  function validateForm(hasFile: boolean, fileUrl: string): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.category) next.category = 'Choose Book, Article, or Journal';
    if (needsFileLink && !hasFile && !fileUrl.trim()) {
      next.fileUrl = 'Upload a PDF/EPUB, or paste a download link';
    }
    if (fileUrl.trim() && !fileUrl.startsWith('/api/v1/files/')) {
      try {
        // eslint-disable-next-line no-new
        new URL(fileUrl);
      } catch {
        next.fileUrl = 'Download link must be a full URL starting with https://';
      }
    }
    return next;
  }

  async function uploadPickedFile(): Promise<string | null> {
    if (!pickedFile || !accessToken) return null;
    const fd = new FormData();
    fd.append('file', pickedFile);
    const data = await api<{ fileUrl: string; filename: string }>('/knowledge/upload', {
      method: 'POST',
      token: accessToken,
      formData: fd,
    });
    return data.fileUrl;
  }

  async function uploadPickedCover(): Promise<string | null> {
    if (!pickedCover || !accessToken) return null;
    const fd = new FormData();
    fd.append('image', pickedCover);
    const data = await api<{ coverUrl: string; filename: string }>('/knowledge/upload-cover', {
      method: 'POST',
      token: accessToken,
      formData: fd,
    });
    return data.coverUrl;
  }

  function clearCoverPick() {
    setPickedCover(null);
    setCoverPreview('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError('');
    setOk('');
    setFieldErrors({});

    const local = validateForm(Boolean(pickedFile), form.fileUrl);
    if (Object.keys(local).length) {
      setFieldErrors(local);
      setError(`Please fill the required fields: ${Object.values(local).join(' · ')}`);
      return;
    }

    try {
      setUploading(true);
      let fileUrl = form.fileUrl.trim();
      if (pickedFile) {
        const uploaded = await uploadPickedFile();
        if (!uploaded) {
          setFieldErrors({ fileUrl: 'File upload failed — try again or use a link' });
          setError('File upload failed. Check that the file is a PDF or EPUB under 25MB.');
          return;
        }
        fileUrl = uploaded;
        setForm((f) => ({ ...f, fileUrl: uploaded }));
      }

      let coverUrl = showCover ? form.coverUrl.trim() : '';
      if (showCover && pickedCover) {
        const uploadedCover = await uploadPickedCover();
        if (!uploadedCover) {
          setError('Cover upload failed. Use JPEG, PNG, or WebP.');
          return;
        }
        coverUrl = uploadedCover;
        setForm((f) => ({ ...f, coverUrl: uploadedCover }));
      }

      if (needsFileLink && !fileUrl) {
        setFieldErrors({ fileUrl: 'Upload a PDF/EPUB or paste a download link' });
        setError('File / download link is missing');
        return;
      }

      const body = {
        title: form.title.trim(),
        category: form.category,
        description: form.description,
        content: form.category === 'Article' ? form.content : '',
        fileUrl: fileUrl || undefined,
        coverUrl: showCover ? coverUrl || '' : '',
        author: form.author,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPublished: form.isPublished,
      };

      if (editingId) {
        await api(`/knowledge/articles/${editingId}`, {
          method: 'PUT',
          token: accessToken,
          body: { ...body, changeNote: 'Admin console update' },
        });
        setOk('Knowledge item updated.');
      } else {
        await api('/knowledge/articles', {
          method: 'POST',
          token: accessToken,
          body,
        });
        setOk(needsFileLink ? 'Resource published with file.' : 'Article published.');
      }
      setForm(emptyForm);
      setEditingId(null);
      setPickedFile(null);
      clearCoverPick();
      setFieldErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const fe = (err.details as { fieldErrors?: Record<string, string[]> } | undefined)
          ?.fieldErrors;
        if (fe) {
          const mapped: Partial<Record<FieldKey, string>> = {};
          if (fe.title?.[0]) mapped.title = fe.title[0];
          if (fe.category?.[0]) mapped.category = fe.category[0];
          if (fe.fileUrl?.[0]) mapped.fileUrl = fe.fileUrl[0];
          setFieldErrors(mapped);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setUploading(false);
    }
  }

  function startEdit(a: Article) {
    setEditingId(a._id);
    setPickedFile(null);
    clearCoverPick();
    setFieldErrors({});
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setForm({
      title: a.title,
      category: a.category,
      description: a.description || '',
      content: a.content || '',
      fileUrl: a.fileUrl || '',
      coverUrl: a.coverUrl || '',
      author: a.author || '',
      tags: (a.tags || []).join(', '),
      isPublished: a.isPublished,
    });
    document.getElementById('create-article')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setPickedFile(null);
    clearCoverPick();
    setFieldErrors({});
    setError('');
    setOk('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function remove(id: string) {
    if (!accessToken || !confirm('Delete this knowledge item?')) return;
    await api(`/knowledge/articles/${id}`, { method: 'DELETE', token: accessToken });
    await load();
  }

  const counts = {
    Book: items.filter((i) => i.category === 'Book').length,
    Article: items.filter((i) => i.category === 'Article').length,
    Journal: items.filter((i) => i.category === 'Journal').length,
    published: items.filter((i) => i.isPublished).length,
    drafts: items.filter((i) => !i.isPublished).length,
  };

  return (
    <div className="ad-page">
      <header className="ad-page-head">
        <div>
          <h1>Knowledge Center</h1>
          <p>Write and format books, articles, and journals with Word-style tools.</p>
        </div>
      </header>

      <div className="ad-know-stats" style={{ marginBottom: '1rem' }}>
        <div>
          <strong>{counts.Book}</strong>
          <span>Books</span>
        </div>
        <div>
          <strong>{counts.Article}</strong>
          <span>Articles</span>
        </div>
        <div>
          <strong>{counts.Journal}</strong>
          <span>Journals</span>
        </div>
        <div>
          <strong>{counts.published}</strong>
          <span>Published</span>
        </div>
        <div>
          <strong>{counts.drafts}</strong>
          <span>Drafts</span>
        </div>
      </div>

      <form className="ad-panel ad-publish-form" onSubmit={(e) => void onSubmit(e)} id="create-article" noValidate>
        <div className="ad-publish-meta form-grid two">
          <label className={fieldErrors.title ? 'has-error' : ''}>
            Title <span className="req">*</span>
            <input
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                setFieldErrors((f) => ({ ...f, title: undefined }));
              }}
            />
            {fieldErrors.title && <small className="field-error">{fieldErrors.title}</small>}
          </label>
          <label className={fieldErrors.category ? 'has-error' : ''}>
            Type <span className="req">*</span>
            <select
              value={form.category}
              onChange={(e) => {
                setForm({ ...form, category: e.target.value as Article['category'] });
                setFieldErrors((f) => ({ ...f, category: undefined, fileUrl: undefined }));
              }}
            >
              <option value="Article">Article</option>
              <option value="Book">Book</option>
              <option value="Journal">Journal</option>
            </select>
          </label>
          <label>
            Author
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Author name"
            />
          </label>
          <label>
            Tags
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="rice, blast, monsoon"
            />
          </label>
          <label className="ad-publish-check">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Published for farmers
          </label>
        </div>

        <div className={`ad-publish-file ${fieldErrors.fileUrl ? 'has-error' : ''}`}>
          <strong>
            File {needsFileLink ? <span className="req">*</span> : <span className="muted">(optional)</span>}
          </strong>
          <div className="ad-publish-file-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,application/pdf,application/epub+zip"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPickedFile(file);
                setFieldErrors((f) => ({ ...f, fileUrl: undefined }));
                if (file) setOk(`Selected: ${file.name}`);
              }}
            />
            <button type="button" className="secondary compact" onClick={() => fileInputRef.current?.click()}>
              Upload PDF / EPUB
            </button>
            <input
              type="text"
              inputMode="url"
              value={form.fileUrl}
              onChange={(e) => {
                setForm({ ...form, fileUrl: e.target.value });
                setFieldErrors((f) => ({ ...f, fileUrl: undefined }));
              }}
              placeholder="Or paste https:// link"
            />
            {pickedFile && (
              <button
                type="button"
                className="secondary compact"
                onClick={() => {
                  setPickedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Clear file
              </button>
            )}
          </div>
          {pickedFile && (
            <small className="muted">
              Ready: {pickedFile.name} ({Math.round(pickedFile.size / 1024)} KB)
            </small>
          )}
          {fieldErrors.fileUrl && <small className="field-error">{fieldErrors.fileUrl}</small>}
          {needsFileLink && !fieldErrors.fileUrl && (
            <small className="muted">Books and journals need a PDF/EPUB or download link.</small>
          )}
        </div>

        {showCover && (
          <div className="ad-publish-cover">
            <strong>
              Book cover <span className="muted">(optional)</span>
            </strong>
            <div className="ad-publish-cover-row">
              <div className="ad-publish-cover-preview">
                <img
                  src={coverPreview || form.coverUrl || DEFAULT_BOOK_COVER}
                  alt="Book cover preview"
                />
                {!coverPreview && !form.coverUrl && <span>Default cover</span>}
              </div>
              <div className="ad-publish-cover-actions">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPickedCover(file);
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCoverPreview(file ? URL.createObjectURL(file) : '');
                    if (file) setOk(`Cover selected: ${file.name}`);
                  }}
                />
                <button type="button" className="secondary compact" onClick={() => coverInputRef.current?.click()}>
                  Upload cover photo
                </button>
                {(pickedCover || form.coverUrl) && (
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => {
                      if (coverPreview) URL.revokeObjectURL(coverPreview);
                      clearCoverPick();
                      setForm((f) => ({ ...f, coverUrl: '' }));
                    }}
                  >
                    Use default cover
                  </button>
                )}
                <small className="muted">JPEG, PNG, or WebP. Portrait covers look best.</small>
              </div>
            </div>
          </div>
        )}

        <div className="ad-publish-editor">
          <strong>Description</strong>
          <WordRichEditor
            value={form.description}
            onChange={(html) => setForm((f) => ({ ...f, description: html }))}
            placeholder="Write a formatted description farmers will see…"
          />
        </div>

        {form.category === 'Article' && (
          <div className="ad-publish-editor">
            <strong>Article body</strong>
            <WordRichEditor
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              placeholder="Write the article farmers will read…"
            />
          </div>
        )}

        <div className="row">
          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading…' : editingId ? 'Save changes' : 'Publish'}
          </button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
        {ok && <p className="success">{ok}</p>}
        {error && (
          <div className="error ad-form-error" role="alert">
            <strong>Could not save</strong>
            <p>{error}</p>
          </div>
        )}
      </form>

      <div className="ad-panel" style={{ marginTop: '1.25rem' }}>
        <table className="data-table ad-table">
          <thead>
            <tr>
              <th>Cover</th>
              <th>Title</th>
              <th>Category</th>
              <th>File</th>
              <th>Status</th>
              <th>Ver.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id}>
                <td>
                  {a.category === 'Book' ? (
                    <img
                      className="ad-know-cover-thumb"
                      src={a.coverUrl || DEFAULT_BOOK_COVER}
                      alt=""
                    />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <strong>{a.title}</strong>
                  <div className="muted">{a.author}</div>
                </td>
                <td>{a.category}</td>
                <td>
                  {a.fileUrl ? (
                    <a href={a.fileUrl} target="_blank" rel="noreferrer">
                      {a.fileUrl.includes('/files/') ? 'Uploaded file' : 'External link'}
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <span className={`pill ${a.isPublished ? 'ok' : 'warn'}`}>
                    {a.isPublished ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>v{a.version ?? 1}</td>
                <td>
                  <div className="row">
                    <button type="button" className="secondary" onClick={() => startEdit(a)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => void remove(a._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="empty-state">Library is empty — add the first guide.</div>
        )}
      </div>
    </div>
  );
}
