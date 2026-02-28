export type ChatMode = 'n8n' | 'coder' | 'pesquisa' | 'leitura';

export const CHAT_MODES: Array<{ value: ChatMode; label: string }> = [
  { value: 'n8n', label: 'n8n' },
  { value: 'coder', label: 'coder' },
  { value: 'pesquisa', label: 'pesquisa' },
  { value: 'leitura', label: 'leitura' },
];

const MODE_GUIDELINES: Record<ChatMode, string> = {
  n8n: [
    'Mode n8n: operate as a principal enterprise automation architect.',
    'Design production-ready workflows with explicit triggers, branching logic, idempotency, retries/backoff, DLQ strategy, and failure isolation.',
    'Always include security controls (credentials scope, input validation, PII handling), and operational controls (alerts, SLO, rollback, runbook).',
    'Prefer concrete node-level plans and implementation-ready details over generic advice.',
  ].join('\n'),
  coder: [
    'Mode coder: behave like a senior staff software engineer focused on shipping robust code.',
    'Return implementation-ready output with clear architecture decisions, constraints, tradeoffs, and safe migration/refactor paths.',
    'Include test strategy (unit/integration/e2e) and edge-case handling; avoid vague pseudo-solutions.',
  ].join('\n'),
  pesquisa: [
    'Mode pesquisa: act as a research analyst with rigorous comparison and decision quality.',
    'Separate facts from assumptions, compare alternatives with objective criteria, and end with ranked recommendation.',
    'Be explicit about uncertainty and what additional data would increase confidence.',
  ].join('\n'),
  leitura: [
    'Mode leitura: act as an expert reader/editor for dense technical material.',
    'Extract key points, terminology, dependencies, risks, and implied actions from provided context.',
    'Prefer concise structured summaries with high signal and no fluff.',
  ].join('\n'),
};

const MODE_OUTPUT_CONTRACT: Record<ChatMode, string> = {
  n8n: [
    'Output Contract (n8n):',
    '1. Objective and assumptions',
    '2. Node-by-node blueprint (ordered)',
    '3. Error handling and resiliency plan',
    '4. Security and compliance controls',
    '5. Observability and operations (alerts, metrics, runbook)',
    '6. Rollout and rollback checklist',
  ].join('\n'),
  coder: [
    'Output Contract (coder):',
    '1. Solution overview',
    '2. Concrete implementation details (code-level)',
    '3. Tradeoffs and risks',
    '4. Test plan and validation steps',
    '5. Next implementation steps',
  ].join('\n'),
  pesquisa: [
    'Output Contract (pesquisa):',
    '1. Problem framing',
    '2. Evidence and findings',
    '3. Alternatives comparison matrix',
    '4. Recommendation with rationale',
    '5. Confidence level and open questions',
  ].join('\n'),
  leitura: [
    'Output Contract (leitura):',
    '1. Executive summary',
    '2. Key points by topic',
    '3. Critical terms explained',
    '4. Risks/gaps/ambiguities',
    '5. Actionable takeaways',
  ].join('\n'),
};

const MODE_QUALITY_GATE: Record<ChatMode, string> = {
  n8n: 'Do not finish without explicit failure-path handling and operational hardening.',
  coder: 'Do not finish without concrete implementation details and test coverage guidance.',
  pesquisa: 'Do not finish without comparing alternatives and making a justified recommendation.',
  leitura: 'Do not finish without extracting key insights, risks, and actionable summary.',
};

export function parseChatMode(value: unknown): ChatMode {
  if (value === 'n8n' || value === 'coder' || value === 'pesquisa' || value === 'leitura') {
    return value;
  }
  return 'coder';
}

export function getChatModeGuidelines(mode: ChatMode): string {
  return MODE_GUIDELINES[mode];
}

export function getChatModeOutputContract(mode: ChatMode): string {
  return MODE_OUTPUT_CONTRACT[mode];
}

export function getChatModeQualityGate(mode: ChatMode): string {
  return MODE_QUALITY_GATE[mode];
}
