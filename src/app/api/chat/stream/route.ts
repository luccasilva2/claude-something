import { chatWithAI } from '@/ai/flows/chat-with-ai-flow';
import { buildSkillsContext, findRelevantSkills } from '@/lib/skills-rag';
import { maybeHandleFsCommand } from '@/lib/local-fs-agent';
import { findAutoLocalContext } from '@/lib/local-context-rag';
import { isN8nEnterpriseRequest, n8nEnterpriseGuidelines } from '@/lib/n8n-expert';
import {
  getChatModeGuidelines,
  getChatModeOutputContract,
  getChatModeQualityGate,
  parseChatMode,
} from '@/lib/chat-modes';

const encoder = new TextEncoder();

type HistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

function asHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => {
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
        return { role, content: content.trim() } satisfies HistoryItem;
      }
      return null;
    })
    .filter((item): item is HistoryItem => item !== null && item.content.length > 0)
    .slice(-12);
}

function asNdjsonLine(obj: Record<string, unknown>): Uint8Array {
  return encoder.encode(`${JSON.stringify(obj)}\n`);
}

function buildHistoryBlock(history: HistoryItem[]): string {
  if (!history.length) {
    return 'No prior conversation history.';
  }

  return history.map((item) => `${item.role.toUpperCase()}: ${item.content}`).join('\n');
}

function normalizeForMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function looksLikeLocalAccessDenial(text: string): boolean {
  const t = normalizeForMatch(text);
  const patterns = [
    'nao consigo acessar',
    'nao posso acessar',
    'nao inclui nada que me permita acessar',
    'nao me permite acessar',
    'minha capacidade de interacao e restrita',
    'sistema de arquivos local',
    'copiar e colar',
    'copy and paste',
    'cannot access',
    "can't access",
    'unable to access',
    'restricted to text',
  ];
  return patterns.some((p) => t.includes(p));
}

function buildLocalContextFallback(rootPath: string, files: string[]): string {
  const fileList = files.length ? files.map((f) => `- ${f}`).join('\n') : '- (nenhum arquivo ranqueado)';
  return [
    `Encontrei contexto local automaticamente em: ${rootPath}.`,
    'Arquivos mais relevantes detectados:',
    fileList,
    '',
    'Pode pedir a próxima ação direto (ex: explicar, gerar workflow, refatorar, comparar).',
    'Se quiser alterar arquivo local, use os comandos: /write, /append, /mkdir e aprove com /approve <id>.',
  ].join('\n');
}

function chunkText(text: string, size = 80): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = asHistory(body?.history);
    const mode = parseChatMode(body?.mode);

    if (!message) {
      return new Response(asNdjsonLine({ type: 'error', error: 'Message is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
      });
    }

    const fsCommand = await maybeHandleFsCommand(message);
    if (fsCommand.handled) {
      const fsOutput = fsCommand.output ?? 'No output.';
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(asNdjsonLine({ type: 'meta', skillsUsed: ['local-filesystem-agent'] }));
          for (const chunk of chunkText(fsOutput)) {
            controller.enqueue(asNdjsonLine({ type: 'delta', text: chunk }));
          }
          controller.enqueue(asNdjsonLine({ type: 'done' }));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        asNdjsonLine({ type: 'error', error: 'GEMINI_API_KEY is missing in server environment.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
        }
      );
    }

    const matchedSkills = await findRelevantSkills(message);
    const autoLocalContext = await findAutoLocalContext(message);
    const skillsContext = [
      buildSkillsContext(matchedSkills),
      autoLocalContext ? `Automatic local context (${autoLocalContext.source}):\n${autoLocalContext.context}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    const historyContext = buildHistoryBlock(history);
    const n8nExpertMode = mode === 'n8n' || isN8nEnterpriseRequest(message);

    const answer = await chatWithAI({
      message,
      skillsContext,
      historyContext,
      assistantMode: mode,
      assistantModeGuidelines: getChatModeGuidelines(mode),
      assistantModeOutputContract: getChatModeOutputContract(mode),
      assistantModeQualityGate: getChatModeQualityGate(mode),
      n8nExpertMode,
      n8nGuidelines: n8nExpertMode ? n8nEnterpriseGuidelines() : 'N/A',
    });
    const contextPrefix = autoLocalContext
      ? buildLocalContextFallback(
          autoLocalContext.rootPath,
          autoLocalContext.matches.map((m) => m.file)
        )
      : '';

    const finalAnswer =
      autoLocalContext && looksLikeLocalAccessDenial(answer)
        ? contextPrefix
        : autoLocalContext
          ? `${contextPrefix}\n\n${answer}`
          : answer;

    const usedSources = matchedSkills.map((s) => s.name);
    if (autoLocalContext) {
      usedSources.push(autoLocalContext.source);
    }
    if (n8nExpertMode) {
      usedSources.push('n8n-enterprise-mode');
    }
    usedSources.push(`mode:${mode}`);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(asNdjsonLine({ type: 'meta', skillsUsed: usedSources }));

        for (const chunk of chunkText(finalAnswer)) {
          controller.enqueue(asNdjsonLine({ type: 'delta', text: chunk }));
        }

        controller.enqueue(asNdjsonLine({ type: 'done' }));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return new Response(asNdjsonLine({ type: 'error', error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
    });
  }
}
