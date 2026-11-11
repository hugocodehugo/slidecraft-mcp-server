import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  handleJsonRpc,
  compileDocToMcKinseySlides,
  evaluateDailyDeckCircuitBreaker,
} = require('../index.js');

test('SlideCraft MCP Server responds to initialize and tools/list over JSON-RPC 2.0', () => {
  const initRes = handleJsonRpc({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assert.equal(initRes.result.serverInfo.name, 'slidecraft-ai-mcp');
  assert.equal(initRes.result.serverInfo.version, '1.1.0');

  const listRes = handleJsonRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.equal(listRes.result.tools.length, 2);
  assert.equal(listRes.result.tools[0].name, 'slidecraft_doc_to_deck');
  assert.equal(listRes.result.tools[1].name, 'slidecraft_b2b_expense_pack');
});

test('slidecraft_doc_to_deck compiles messy Markdown into McKinsey Action Titles, 3-column cards, speaker notes & HTML deck', () => {
  const sampleMd = `
# Q4 Enterprise ARR Expansion
- Closed 14 enterprise accounts generating $1.4M net-new ARR
- Reduced onboarding cycle from 14 days to 3 days (+78% velocity)
- Automated security questionnaire responses across 5 regions

# 2027 Product Roadmap
- Launch 1-click Google Slides & PowerPoint export
- Expand corporate domain auto-provisioning for Fortune 500 teams
- Maintain 89.2% net gross margin after payment processing
  `;

  const callRes = handleJsonRpc({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'slidecraft_doc_to_deck',
      arguments: {
        markdown: sampleMd,
        deckTitle: 'Q4 Board Strategy Update',
        theme: 'mckinsey-ivory',
      },
    },
  });

  const payload = JSON.parse(callRes.result.content[0].text);
  assert.equal(payload.slideCount, 2);
  assert.ok(payload.slides[0].actionTitle.includes('$1.4M'));
  assert.equal(payload.slides[0].cards.length, 3);
  assert.ok(payload.slides[0].speakerNotes.length >= 80);
  assert.ok(payload.htmlDeck.includes('<!DOCTYPE html>'));
  assert.ok(payload.htmlDeck.includes('Q4 Board Strategy Update'));
});

test('CFO Daily 3 Free Decks Circuit Breaker trips on 4th run and resets next day', () => {
  let state = { tier: 'free', lastDate: '2026-11-11', usedToday: 0 };
  for (let i = 1; i <= 3; i++) {
    const res = evaluateDailyDeckCircuitBreaker(state, '2026-11-11');
    assert.equal(res.allowed, true);
    assert.equal(res.remainingToday, 3 - i);
    state = res.nextState;
  }
  const blocked = evaluateDailyDeckCircuitBreaker(state, '2026-11-11');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'CFO_DAILY_3_DECKS_CIRCUIT_BREAKER_TRIPPED');

  const nextDay = evaluateDailyDeckCircuitBreaker(state, '2026-11-12');
  assert.equal(nextDay.allowed, true);
  assert.equal(nextDay.remainingToday, 2);
});

test('slidecraft_b2b_expense_pack detects @company.com and generates <$50 ($29/mo) invoice + Slack pitch', () => {
  const callRes = handleJsonRpc({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'slidecraft_b2b_expense_pack',
      arguments: { email: 'director.pm@figma.com' },
    },
  });
  const data = JSON.parse(callRes.result.content[0].text);
  assert.equal(data.domainInspection.isCorporate, true);
  assert.equal(data.domainInspection.domain, 'figma.com');
  assert.ok(data.managerSlackPitch.includes('$29/mo'));
  assert.ok(data.expenseInvoiceHtml.includes('$29.00'));
  assert.ok(data.expenseInvoiceHtml.includes('SlideCraft AI Inc.'));
});
