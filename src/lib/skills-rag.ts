import { Dirent, promises as fs } from 'fs';
import path from 'path';

export type SkillMatch = {
  name: string;
  score: number;
  excerpt: string;
};

type SkillDoc = {
  name: string;
  content: string;
  searchable: string;
};

const SKILLS_ROOT = path.join(process.cwd(), 'antigravity-awesome-skills', 'skills');
const MAX_SKILLS = 4;
const EXCERPT_SIZE = 1400;

let cachedSkills: SkillDoc[] | null = null;
let loadingPromise: Promise<SkillDoc[]> | null = null;

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueTokens(input: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'do', 'for', 'from', 'how', 'i', 'in',
    'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'we', 'what', 'with', 'you'
  ]);

  return [...new Set(normalize(input).split(' ').filter((t) => t.length > 2 && !stopWords.has(t)))];
}

async function loadSkills(): Promise<SkillDoc[]> {
  if (cachedSkills) {
    return cachedSkills;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    let entries: Dirent[] = [];
    try {
      entries = await fs.readdir(SKILLS_ROOT, { withFileTypes: true });
    } catch {
      cachedSkills = [];
      return [];
    }

    const skills = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const skillName = entry.name;
          const skillFile = path.join(SKILLS_ROOT, skillName, 'SKILL.md');
          try {
            const content = await fs.readFile(skillFile, 'utf8');
            const excerpt = content.slice(0, 6000);
            return {
              name: skillName,
              content: excerpt,
              searchable: `${normalize(skillName)} ${normalize(excerpt)}`,
            } satisfies SkillDoc;
          } catch {
            return null;
          }
        })
    );

    cachedSkills = skills.filter((s): s is SkillDoc => Boolean(s));
    return cachedSkills;
  })();

  return loadingPromise;
}

function scoreSkill(searchable: string, tokens: string[], skillName: string): number {
  if (!tokens.length) {
    return 0;
  }

  let score = 0;
  const name = normalize(skillName);

  for (const token of tokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'g');
    const matches = searchable.match(re);
    if (matches) {
      score += matches.length;
    }

    if (name.includes(token)) {
      score += 3;
    }
  }

  return score;
}

export async function findRelevantSkills(query: string, limit = MAX_SKILLS): Promise<SkillMatch[]> {
  const docs = await loadSkills();
  const tokens = uniqueTokens(query);

  const ranked = docs
    .map((doc) => ({
      name: doc.name,
      score: scoreSkill(doc.searchable, tokens, doc.name),
      excerpt: doc.content.slice(0, EXCERPT_SIZE),
    }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

export function buildSkillsContext(matches: SkillMatch[]): string {
  if (!matches.length) {
    return 'No relevant local skills were matched for this request.';
  }

  return matches
    .map((match, index) => {
      return [
        `Skill ${index + 1}: ${match.name}`,
        '---',
        match.excerpt,
      ].join('\n');
    })
    .join('\n\n');
}
