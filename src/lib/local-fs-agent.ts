import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const MAX_READ_CHARS = 20000;
const MAX_LIST_ENTRIES = 300;

export type FsAgentResult = {
  handled: boolean;
  output?: string;
};

type PendingAction = {
  id: string;
  kind: 'write' | 'append' | 'mkdir';
  targetPath: string;
  content?: string;
  createdAt: number;
};

const pendingActions = new Map<string, PendingAction>();
let actionCounter = 0;

function isEnabled(): boolean {
  return process.env.ENABLE_LOCAL_FS_AGENT === 'true';
}

function autoApproveWrites(): boolean {
  return process.env.AUTO_APPROVE_FS_WRITES === 'true';
}

function nextActionId(): string {
  actionCounter += 1;
  return `fs-${Date.now()}-${actionCounter}`;
}

function resolveUserPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    throw new Error('Path is required.');
  }

  if (trimmed.startsWith('~')) {
    return path.resolve(trimmed.replace(/^~/, os.homedir()));
  }

  if (path.isAbsolute(trimmed)) {
    return path.resolve(trimmed);
  }

  return path.resolve(process.cwd(), trimmed);
}

function formatList(items: string[]): string {
  if (!items.length) {
    return '(empty directory)';
  }

  return items.join('\n');
}

async function cmdLs(targetPath: string): Promise<string> {
  const resolved = resolveUserPath(targetPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const lines = entries
    .slice(0, MAX_LIST_ENTRIES)
    .map((entry) => `${entry.isDirectory() ? 'dir ' : 'file'} ${entry.name}`);

  return `Path: ${resolved}\n${formatList(lines)}${entries.length > MAX_LIST_ENTRIES ? '\n...truncated' : ''}`;
}

async function cmdRead(targetPath: string): Promise<string> {
  const resolved = resolveUserPath(targetPath);
  const content = await fs.readFile(resolved, 'utf8');
  const sliced = content.slice(0, MAX_READ_CHARS);
  const truncated = content.length > MAX_READ_CHARS ? '\n\n...truncated' : '';

  return `Path: ${resolved}\n\n${sliced}${truncated}`;
}

async function cmdWrite(targetPath: string, content: string, append = false): Promise<string> {
  const resolved = resolveUserPath(targetPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });

  if (append) {
    await fs.appendFile(resolved, content, 'utf8');
    return `Appended to: ${resolved} (${content.length} chars)`;
  }

  await fs.writeFile(resolved, content, 'utf8');
  return `Wrote file: ${resolved} (${content.length} chars)`;
}

async function cmdMkdir(targetPath: string): Promise<string> {
  const resolved = resolveUserPath(targetPath);
  await fs.mkdir(resolved, { recursive: true });
  return `Directory ensured: ${resolved}`;
}

async function cmdStat(targetPath: string): Promise<string> {
  const resolved = resolveUserPath(targetPath);
  const stats = await fs.stat(resolved);
  return [
    `Path: ${resolved}`,
    `Type: ${stats.isDirectory() ? 'directory' : 'file'}`,
    `Size: ${stats.size} bytes`,
    `Modified: ${stats.mtime.toISOString()}`,
  ].join('\n');
}

function describePending(action: PendingAction): string {
  const preview = action.content ? `\nPreview: ${action.content.slice(0, 180)}` : '';
  return [
    `Pending action id: ${action.id}`,
    `Action: ${action.kind}`,
    `Target: ${action.targetPath}`,
    preview,
    `Approve with: /fs approve ${action.id}`,
    `Reject with: /fs reject ${action.id}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function queueOrRunWrite(kind: 'write' | 'append' | 'mkdir', targetPath: string, content?: string): Promise<string> {
  if (autoApproveWrites()) {
    if (kind === 'mkdir') {
      return cmdMkdir(targetPath);
    }
    return cmdWrite(targetPath, content ?? '', kind === 'append');
  }

  const action: PendingAction = {
    id: nextActionId(),
    kind,
    targetPath,
    content,
    createdAt: Date.now(),
  };
  pendingActions.set(action.id, action);
  return `Authorization required before filesystem change.\n${describePending(action)}`;
}

async function approveAction(actionId: string): Promise<string> {
  const action = pendingActions.get(actionId);
  if (!action) {
    return `No pending action found for id: ${actionId}`;
  }

  pendingActions.delete(actionId);

  if (action.kind === 'mkdir') {
    return cmdMkdir(action.targetPath);
  }

  return cmdWrite(action.targetPath, action.content ?? '', action.kind === 'append');
}

function rejectAction(actionId: string): string {
  const action = pendingActions.get(actionId);
  if (!action) {
    return `No pending action found for id: ${actionId}`;
  }

  pendingActions.delete(actionId);
  return `Rejected action ${actionId}.`;
}

function listPending(): string {
  if (!pendingActions.size) {
    return 'No pending actions.';
  }

  return [...pendingActions.values()]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((action) => `${action.id} | ${action.kind} | ${action.targetPath}`)
    .join('\n');
}

export async function maybeHandleFsCommand(message: string): Promise<FsAgentResult> {
  const trimmed = message.trim();
  if (!trimmed.startsWith('/')) {
    return { handled: false };
  }

  if (!isEnabled()) {
    return {
      handled: true,
      output:
        'Local filesystem agent is disabled. Set ENABLE_LOCAL_FS_AGENT=true in .env.local and restart the server.',
    };
  }

  const [firstLine, ...restLines] = trimmed.split('\n');
  const parts = firstLine.split(/\s+/);

  // Supports both legacy `/fs <command> ...` and simplified `/<command> ...`
  const isLegacyFsPrefix = parts[0] === '/fs';
  const command = (isLegacyFsPrefix ? parts[1] : parts[0].slice(1)) ?? '';
  const targetPath = (isLegacyFsPrefix ? parts.slice(2) : parts.slice(1)).join(' ').trim();
  const payload = restLines.join('\n');

  try {
    switch (command) {
      case 'ls':
        return { handled: true, output: await cmdLs(targetPath || '.') };
      case 'read':
        return { handled: true, output: await cmdRead(targetPath) };
      case 'write':
        return { handled: true, output: await queueOrRunWrite('write', targetPath, payload) };
      case 'append':
        return { handled: true, output: await queueOrRunWrite('append', targetPath, payload) };
      case 'mkdir':
        return { handled: true, output: await queueOrRunWrite('mkdir', targetPath) };
      case 'stat':
        return { handled: true, output: await cmdStat(targetPath) };
      case 'approve':
        return { handled: true, output: await approveAction(parts[2] ?? '') };
      case 'reject':
        return { handled: true, output: rejectAction(parts[2] ?? '') };
      case 'pending':
        return { handled: true, output: listPending() };
      case 'help':
      case 'helpfs':
      default:
        return {
          handled: true,
          output: [
            'Filesystem commands:',
            '/ls <path>',
            '/read <path>',
            '/stat <path>',
            '/mkdir <path> (asks for authorization)',
            '/write <path> then content on next lines (asks for authorization)',
            '/append <path> then content on next lines (asks for authorization)',
            '/pending',
            '/approve <action-id>',
            '/reject <action-id>',
            '/helpfs',
            '',
            'Legacy format still works: /fs <command> ...',
          ].join('\n'),
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Filesystem command failed.';
    return { handled: true, output: `Filesystem error: ${errorMessage}` };
  }
}
