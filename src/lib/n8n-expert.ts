const N8N_KEYWORDS = [
  'n8n',
  'workflow',
  'node',
  'webhook',
  'trigger',
  'cron',
  'queue',
  'retry',
  'postgres',
  'slack',
  'http request',
  'integration',
  'automacao',
  'automação',
];

export function isN8nEnterpriseRequest(message: string): boolean {
  const text = message.toLowerCase();
  return N8N_KEYWORDS.some((k) => text.includes(k));
}

export function n8nEnterpriseGuidelines(): string {
  return [
    'N8N Enterprise Delivery Standard:',
    '1. Architecture: event-driven design, idempotency key, explicit error branches, no hidden side effects.',
    '2. Reliability: retries with backoff, dead-letter strategy, timeout/limit guardrails, resume-safe execution.',
    '3. Security: least-privilege credentials, secret management, input validation, PII minimization, auditability.',
    '4. Observability: structured logs, trace IDs/correlation IDs, execution metrics, alert conditions and SLOs.',
    '5. Data integrity: dedup rules, transactional boundaries, schema checks, safe upsert patterns.',
    '6. Operability: environment separation (dev/stage/prod), rollout plan, rollback plan, runbook.',
    '7. Testing: happy-path + failure-path test matrix, mock strategy, load/rate test notes.',
    '8. Output quality: always provide a concrete node-by-node workflow plan and production hardening checklist.',
  ].join('\n');
}
