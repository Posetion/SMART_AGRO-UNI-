import { Knowledge } from '../models/Knowledge.js';
import { AppError } from '../utils/AppError.js';
import { getPagination } from '../utils/pagination.js';
import type { KnowledgeCategory } from '../config/constants.js';

export async function listArticles(query: {
  page?: unknown;
  limit?: unknown;
  category?: string;
  includeDrafts?: boolean;
}) {
  const { page, limit, skip } = getPagination(query);
  const filter: Record<string, unknown> = {};
  if (!query.includeDrafts) filter.isPublished = true;
  if (query.category) filter.category = query.category;

  const [items, total] = await Promise.all([
    Knowledge.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Knowledge.countDocuments(filter),
  ]);

  return { items, meta: { page, limit, total } };
}

export async function getArticle(id: string, allowDraft = false) {
  const doc = await Knowledge.findById(id);
  if (!doc) throw new AppError('Article not found', 404);
  if (!doc.isPublished && !allowDraft) throw new AppError('Article not found', 404);
  doc.views += 1;
  await doc.save();
  return doc;
}

export async function searchArticles(q: string, category?: string) {
  const term = q.trim();
  if (!term) {
    const filter: Record<string, unknown> = { isPublished: true };
    if (category) filter.category = category;
    return Knowledge.find(filter).sort({ updatedAt: -1 }).limit(100);
  }

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'i');
  const filter: Record<string, unknown> = {
    isPublished: true,
    $or: [{ title: regex }, { author: regex }, { description: regex }, { tags: regex }],
  };
  if (category) filter.category = category;
  return Knowledge.find(filter).sort({ updatedAt: -1 }).limit(100);
}

export async function getCategories() {
  return ['Book', 'Article', 'Journal'];
}

export async function createArticle(input: {
  title: string;
  category: KnowledgeCategory;
  description?: string;
  content?: string;
  fileUrl?: string;
  coverUrl?: string;
  author?: string;
  tags?: string[];
  isPublished?: boolean;
  uploadedBy: string;
}) {
  return Knowledge.create({
    ...input,
    fileUrl: input.fileUrl || '',
    coverUrl: input.coverUrl || '',
    version: 1,
    versionHistory: [],
  });
}

export async function updateArticle(
  id: string,
  updates: Partial<{
    title: string;
    category: KnowledgeCategory;
    description: string;
    content: string;
    fileUrl: string;
    coverUrl: string;
    author: string;
    tags: string[];
    isPublished: boolean;
  }>,
  updatedBy: string,
  changeNote = 'Updated'
) {
  const doc = await Knowledge.findById(id);
  if (!doc) throw new AppError('Article not found', 404);

  Object.assign(doc, updates);
  doc.version += 1;
  doc.versionHistory.push({
    version: doc.version,
    updatedBy: updatedBy as unknown as typeof doc.versionHistory[0]['updatedBy'],
    updatedAt: new Date(),
    changeNote,
  });
  await doc.save();
  return doc;
}

export async function deleteArticle(id: string) {
  const doc = await Knowledge.findByIdAndDelete(id);
  if (!doc) throw new AppError('Article not found', 404);
  return doc;
}
