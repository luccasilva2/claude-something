import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

type LocalContextMatch = {
  file: string;
  score: number;
  excerpt: string;
};

export type LocalContextResult = {
  source: string;
  rootPath: string;
  matches: LocalContextMatch[];
  context: string;
};

type IndexedFile = {
  file: string;
  searchable: string;
  excerpt: string;
};

const MAX_FILES_PER_ROOT = 600;
const MAX_FILE_SIZE = 120_000;
const MAX_DEPTH = 5;
const MAX_MATCHES = 5;
const EXCERPT_CHARS = 2000;

const indexCache = new Map<string, IndexedFile[]>();
const indexPromiseCache = new Map<string, Promise<IndexedFile[]>>();

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s._/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(input: string): string[] {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'como', 'para', 'uma', 'com', 'dos', 'das', 'sobre',
  ]);
  return [...new Set(normalize(input).split(' ').filter((t) => t.length > 2 && !stop.has(t)))];
}

function isEnabled(): boolean {
  return process.env.ENABLE_AUTO_LOCAL_CONTEXT !== 'false';
}

function parseRoots(): string[] {
  const raw = process.env.LOCAL_CONTEXT_ROOTS;
  if (!raw || !raw.trim()) {
    return [os.homedir()];
  }

  return raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (path.isAbsolute(p) ? path.resolve(p) : path.resolve(process.cwd(), p)));
}

function parseN8nTemplateRoots(): string[] {
  const raw = process.env.N8N_TEMPLATE_ROOTS;
  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (path.isAbsolute(p) ? path.resolve(p) : path.resolve(process.cwd(), p)));
  }

  const cwd = process.cwd();
  return [
    path.join(cwd, 'n8n-workflows'),
    path.join(cwd, 'awesome-n8n-templates'),
    path.join(cwd, 'n8n-free-templates'),
  ];
}

function isN8nQuery(query: string): boolean {
  const q = normalize(query);
  return (
    q.includes('n8n') ||
    q.includes('workflow') ||
    q.includes('webhook') ||
    q.includes('trigger') ||
    q.includes('cron') ||
    q.includes('node')
  );
}

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [
    '.json', '.md', '.txt', '.yaml', '.yml', '.js', '.ts', '.tsx', '.jsx', '.sql', '.sh', '.env', '.py', '.go', '.java', '.rb',
  ].includes(ext);
}

async function walk(dir: string, depth = 0, out: string[] = []): Promise<string[]> {
  if (depth > MAX_DEPTH || out.length >= MAX_FILES_PER_ROOT) {
    return out;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (out.length >= MAX_FILES_PER_ROOT) {
      break;
    }

    if (
      entry.name.startsWith('.git') ||
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === 'dist' ||
      entry.name === 'build'
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, depth + 1, out);
      continue;
    }

    if (entry.isFile() && isTextFile(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
}

async function buildIndex(rootPath: string): Promise<IndexedFile[]> {
  const files = await walk(rootPath);
  const indexed: IndexedFile[] = [];

  for (const fullPath of files) {
    try {
      const stat = await fs.stat(fullPath);
      if (stat.size > MAX_FILE_SIZE) {
        continue;
      }

      const raw = await fs.readFile(fullPath, 'utf8');
      const excerpt = raw.slice(0, EXCERPT_CHARS);
      const rel = path.relative(rootPath, fullPath);

      indexed.push({
        file: rel,
        excerpt,
        searchable: `${normalize(rel)} ${normalize(excerpt)}`,
      });
    } catch {
      // ignore unreadable file
    }
  }

  return indexed;
}

async function getIndex(rootPath: string): Promise<IndexedFile[]> {
  const cached = indexCache.get(rootPath);
  if (cached) {
    return cached;
  }

  const pending = indexPromiseCache.get(rootPath);
  if (pending) {
    return pending;
  }

  const promise = buildIndex(rootPath).then((result) => {
    indexCache.set(rootPath, result);
    indexPromiseCache.delete(rootPath);
    return result;
  });

  indexPromiseCache.set(rootPath, promise);
  return promise;
}

function score(searchable: string, file: string, tokens: string[]): number {
  let total = 0;
  const normFile = normalize(file);

  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'g');
    const count = searchable.match(re)?.length ?? 0;
    total += count;

    if (normFile.includes(token)) {
      total += 5;
    }
  }

  return total;
}

function buildContext(source: string, rootPath: string, matches: LocalContextMatch[]): string {
  if (!matches.length) {
    return `No relevant files found in ${source} path (${rootPath}).`;
  }

  return matches
    .map((m, idx) => [`${source} Match ${idx + 1}: ${m.file}`, '---', m.excerpt].join('\n'))
    .join('\n\n');
}

export async function findAutoLocalContext(query: string): Promise<LocalContextResult | null> {
  if (!isEnabled()) {
    return null;
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return null;
  }

  const roots = (() => {
    const base = parseRoots();
    if (!isN8nQuery(query)) {
      return base;
    }
    const prioritized = [...parseN8nTemplateRoots(), ...base];
    return [...new Set(prioritized)];
  })();
  let best: LocalContextResult | null = null;

  for (const rootPath of roots) {
    try {
      const stat = await fs.stat(rootPath);
      if (!stat.isDirectory()) {
        continue;
      }

      const indexed = await getIndex(rootPath);
      const matches = indexed
        .map((f) => ({
          file: f.file,
          score: score(f.searchable, f.file, tokens),
          excerpt: f.excerpt,
        }))
        .filter((m) => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_MATCHES);

      if (!matches.length) {
        continue;
      }

      const candidate: LocalContextResult = {
        source: 'local-auto-context',
        rootPath,
        matches,
        context: buildContext('local-auto-context', rootPath, matches),
      };

      const bestScore = best?.matches[0]?.score ?? -1;
      const candidateScore = matches[0]?.score ?? -1;
      if (candidateScore > bestScore) {
        best = candidate;
      }
    } catch {
      // ignore invalid root
    }
  }

  return best;
}
