import { readFileSync } from 'fs';
import { join } from 'path';
import type { Template } from './schema';

const _cache = new Map<string, Template>();

export function loadTemplate(templateId: string): Template {
  if (_cache.has(templateId)) return _cache.get(templateId)!;
  const path = resolveTemplatePath(templateId);
  const template = JSON.parse(readFileSync(path, 'utf-8')) as Template;
  _cache.set(templateId, template);
  return template;
}

function resolveTemplatePath(id: string): string {
  const categoryMap: Record<string, string> = {
    birthday:   'birthday',
    sympathy:   'sympathy',
    congrats:   'congrats',
    business:   'business',
    invitation: 'invitation',
  };
  const prefix = id.split('_')[0];
  const category = categoryMap[prefix] ?? prefix;
  return join(process.cwd(), 'templates', category, `${id}.json`);
}

export function templateExists(templateId: string): boolean {
  try { loadTemplate(templateId); return true; } catch { return false; }
}
