const baseUrl = process.env.CHAT_API_URL || 'http://localhost:9002/api/chat';
const message = process.env.CHAT_MESSAGE || 'Build a debugging plan for a failing Next.js API route.';

const res = await fetch(baseUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message,
    history: [
      { role: 'user', content: 'I am getting random 500 errors in production.' },
      { role: 'assistant', content: 'Let us inspect logs and isolate a reproducible path.' },
    ],
  }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Smoke test failed:', res.status, data);
  process.exit(1);
}

console.log('Smoke test ok');
console.log('Skills used:', (data.skillsUsed || []).join(', ') || 'none');
console.log('Answer preview:', (data.answer || '').slice(0, 300));
