import { Request, Response } from 'express';
import { getContent, setContent } from '../db/contentRepo';

function normalizeLang(input: unknown): string | null {
  if (!input) return null;
  const first = Array.isArray(input) ? input[0] : input;
  if (typeof first !== 'string') return null;
  const code = first.split('-')[0]?.trim().toLowerCase();
  return code ? code : null;
}

function getStorageKey(baseKey: string, lang: string | null): string {
  if (!lang || lang === 'nl') return baseKey;
  if (baseKey.endsWith(`.${lang}`)) return baseKey;
  return `${baseKey}.${lang}`;
}

export const fetchContent = async (req: Request, res: Response) => {
  const key = req.params.key as string;
  const lang = normalizeLang(req.query.lang);

  const langKey = lang ? getStorageKey(key, lang) : null;
  
  let data = null;
  if (langKey) {
    data = await getContent(langKey);
  }
  
  if (!data) {
    data = await getContent(key);
  }
  
  if (!data && lang === 'nl') {
    data = await getContent(getStorageKey(key, 'nl'));
  }

  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
};

export const saveContent = async (req: Request, res: Response) => {
  const key = req.params.key as string;
  if (!key || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const lang = normalizeLang(req.query.lang);
  await setContent(getStorageKey(key, lang), req.body);
  res.json({ ok: true });
};
