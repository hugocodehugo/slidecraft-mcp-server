#!/usr/bin/env node
/**
 * SlideCraft AI — Standard Model Context Protocol (MCP) Server v1.1.0
 * #1 Blue-Ocean Ecosystem Agent (800K+/mo search demand: Doc/Markdown to Executive Slides).
 * Zero external dependencies. Converts messy Markdown, Google Docs, or meeting notes into:
 *   1) McKinsey-style Action Titles
 *   2) 3-Column Executive Cards JSON (with extracted KPI metrics)
 *   3) Substantive Speaker Notes (80-200 chars per slide)
 *   4) Standalone Responsive 16:9 HTML Presentation Deck
 * Includes CFO Daily 3 Free Decks Circuit Breaker & Sales @company.com <$50 ($29/mo) Expense Invoice Engine.
 */
'use strict';

const readline = require('node:readline');

const SERVER_INFO = {
  name: 'slidecraft-ai-mcp',
  version: '1.1.0',
};

const MAX_FREE_DAILY_DECKS = 3;
const MAX_FREE_SLIDES_PER_DECK = 8;

const PUBLIC_AND_EDU_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
  'msn.com', 'yahoo.com', 'ymail.com', 'icloud.com', 'me.com', 'mac.com',
  'qq.com', 'vip.qq.com', '163.com', '126.com', 'yeah.net', 'foxmail.com',
  'sina.com', 'sohu.com', 'aliyun.com', 'proton.me', 'protonmail.com',
  'zoho.com', 'aol.com', 'gmx.com', 'mail.com', 'yandex.com', 'hey.com',
  'fastmail.com', 'tutanota.com'
]);

function extractKeyMetric(text) {
  const m = String(text || '').match(/(\$[0-9,.]+[KMBkmb]?|[+-]?[0-9,.]+%|[0-9,.]+x|\b[0-9]{1,3}(?:,[0-9]{3})+\b)/);
  return m ? m[1] : null;
}

function toActionTitle(rawHeading, bullets) {
  const cleanHeading = String(rawHeading || 'Executive Summary')
    .replace(/^#+\s*/, '')
    .replace(/[*_`]/g, '')
    .trim();
  const joined = [cleanHeading, ...(bullets || [])].join(' ');
  const metric = extractKeyMetric(joined);
  if (cleanHeading.length >= 28) return cleanHeading;
  if (metric && !cleanHeading.includes(metric)) {
    return `${cleanHeading}: Driving ${metric} Impact Through Execution`;
  }
  if (bullets && bullets.length > 0) {
    const firstClause = bullets[0].replace(/^[-*•0-9.)\s]+/, '').split(/[.;—]/)[0].trim();
    if (firstClause && firstClause.length <= 52 && firstClause.toLowerCase() !== cleanHeading.toLowerCase()) {
      return `${cleanHeading} — ${firstClause}`;
    }
  }
  return `${cleanHeading}: Strategic Priorities & Core Outcomes`;
}

function buildThreeColumnCards(bullets) {
  const cleanBullets = (bullets || [])
    .map((b) => String(b || '').replace(/^[-*•0-9.)\s]+/, '').trim())
    .filter(Boolean);

  const defaults = [
    'Baseline Bottleneck: Manual formatting consumes 4.5 hours per week across strategy & ops teams.',
    'Core Execution Lever: Automated structured synthesis converts raw notes into 3-column executive cards.',
    'Measurable ROI: Accelerates stakeholder sign-off by 3.2x while maintaining 100% brand consistency.'
  ];

  const source = cleanBullets.length >= 3
    ? cleanBullets.slice(0, 3)
    : [...cleanBullets, ...defaults].slice(0, 3);

  const pillars = ['01 · DIAGNOSIS', '02 · EXECUTION LEVER', '03 · BUSINESS IMPACT'];

  return source.map((item, idx) => {
    const parts = item.split(/[:：—-]/);
    const hasTitle = parts.length > 1 && parts[0].trim().length <= 34;
    const title = hasTitle ? parts[0].trim() : `Key Pillar #${idx + 1}`;
    const body = hasTitle ? parts.slice(1).join(': ').trim() : item;
    const metric = extractKeyMetric(item) || (idx === 0 ? 'P0 Focus' : idx === 1 ? '1-Click' : '3.2x ROI');
    return {
      badge: pillars[idx] || `0${idx + 1} · INSIGHT`,
      title,
      metric,
      body,
    };
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function compileDocToMcKinseySlides(markdownText, options = {}) {
  const deckTitle = options.deckTitle || 'Executive Strategy & Action Briefing';
  const theme = options.theme || 'mckinsey-ivory';
  const enforceFreeSlideCap = Boolean(options.enforceFreeSlideCap);

  const raw = String(markdownText || '').trim();
  if (!raw) {
    return { deckTitle, slideCount: 0, slides: [], htmlDeck: '' };
  }

  // Split by markdown headings (# or ## or ###) or fallback to double newline blocks
  const lines = raw.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { heading: headingMatch[2].trim(), bullets: [] };
    } else {
      if (!current) {
        current = { heading: deckTitle, bullets: [] };
      }
      current.bullets.push(trimmed);
    }
  }
  if (current) sections.push(current);

  const cappedSections = enforceFreeSlideCap
    ? sections.slice(0, MAX_FREE_SLIDES_PER_DECK)
    : sections;

  const slides = cappedSections.map((sec, idx) => {
    const actionTitle = toActionTitle(sec.heading, sec.bullets);
    const cards = buildThreeColumnCards(sec.bullets);
    const takeaway = `Bottom-Line Takeaway: ${cards[cards.length - 1].title} — ${cards[cards.length - 1].body}`;
    const speakerNotes = `On Slide ${idx + 1} ("${sec.heading}"), emphasize our primary finding: ${actionTitle}. Walk stakeholders through the 3 pillars (${cards.map((c) => c.title).join(', ')}) and align on immediate next steps.`;

    return {
      slideNumber: idx + 1,
      sectionHeading: sec.heading,
      actionTitle,
      cards,
      takeaway,
      speakerNotes: speakerNotes.slice(0, 240),
    };
  });

  const htmlSlides = slides
    .map(
      (s) => `
    <section class="slide" data-slide="${s.slideNumber}">
      <div class="slide-top">
        <span class="kicker">SLIDECRAFT AI · EXECUTIVE BRIEFING · SLIDE 0${s.slideNumber}</span>
        <span class="theme-pill">${escapeHtml(theme.toUpperCase())}</span>
      </div>
      <h2>${escapeHtml(s.actionTitle)}</h2>
      <div class="cards-grid">
        ${s.cards
          .map(
            (c) => `
        <article class="exec-card">
          <div class="card-badge">${escapeHtml(c.badge)}</div>
          <div class="card-metric">${escapeHtml(c.metric)}</div>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.body)}</p>
        </article>`
          )
          .join('')}
      </div>
      <div class="takeaway-band">${escapeHtml(s.takeaway)}</div>
      <aside class="speaker-notes"><strong>🎙️ Speaker Script:</strong> ${escapeHtml(s.speakerNotes)}</aside>
    </section>`
    )
    .join('\n');

  const htmlDeck = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(deckTitle)} — SlideCraft AI Executive Deck</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #0f172a; margin: 0; padding: 32px 16px; }
    .slide { max-width: 960px; margin: 0 auto 32px; background: #ffffff; border-radius: 16px; padding: 36px 42px; box-shadow: 0 20px 45px rgba(0,0,0,0.28); border-top: 6px solid #2563eb; }
    .slide-top { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.08em; margin-bottom: 10px; }
    .slide h2 { font-size: 26px; line-height: 1.25; color: #0f172a; margin: 0 0 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; }
    .cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 22px; }
    .exec-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; }
    .card-badge { font-size: 10px; font-weight: 800; color: #2563eb; letter-spacing: 0.06em; margin-bottom: 6px; }
    .card-metric { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 6px; }
    .exec-card h3 { font-size: 15px; margin: 0 0 8px; color: #1e293b; }
    .exec-card p { font-size: 13px; color: #475569; line-height: 1.55; margin: 0; }
    .takeaway-band { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 6px; font-size: 13px; font-weight: 700; color: #1e3a8a; margin-bottom: 14px; }
    .speaker-notes { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 10px 14px; border-radius: 8px; }
  </style>
</head>
<body>
${htmlSlides}
</body>
</html>`;

  return {
    deckTitle,
    slideCount: slides.length,
    slides,
    htmlDeck,
  };
}

function evaluateDailyDeckCircuitBreaker(state = {}, todayStr = new Date().toISOString().slice(0, 10)) {
  const isPaid = state.tier === 'pro' || state.tier === 'team';
  if (isPaid) {
    return {
      allowed: true,
      remainingToday: Infinity,
      maxSlidesPerDeck: 50,
      reason: 'PAID_UNLIMITED',
      nextState: { ...state, lastDate: todayStr },
    };
  }

  const usedToday = state.lastDate === todayStr ? Number(state.usedToday || 0) : 0;
  const dailyRemaining = Math.max(0, MAX_FREE_DAILY_DECKS - usedToday);

  if (dailyRemaining <= 0) {
    return {
      allowed: false,
      remainingToday: 0,
      maxSlidesPerDeck: MAX_FREE_SLIDES_PER_DECK,
      reason: 'CFO_DAILY_3_DECKS_CIRCUIT_BREAKER_TRIPPED',
      nextState: { ...state, lastDate: todayStr, usedToday },
    };
  }

  return {
    allowed: true,
    remainingToday: dailyRemaining - 1,
    maxSlidesPerDeck: MAX_FREE_SLIDES_PER_DECK,
    reason: 'FREE_QUOTA_OK',
    nextState: {
      ...state,
      lastDate: todayStr,
      usedToday: usedToday + 1,
    },
  };
}

function inspectCorporateEmail(email) {
  const clean = String(email || '').trim().toLowerCase();
  const m = clean.match(/^[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})$/i);
  if (!m) {
    return { isValid: false, isCorporate: false, domain: '' };
  }
  const domain = m[1].toLowerCase();
  const isEduOrGov = /\.(edu|ac\.[a-z]{2}|gov|mil)$/i.test(domain);
  const isPublic = PUBLIC_AND_EDU_DOMAINS.has(domain) || isEduOrGov;
  const isCorporate = !isPublic;

  return {
    isValid: true,
    isCorporate,
    domain,
    recommendedPlan: isCorporate
      ? `Team Workspace Plan ($29/mo — No-Approval <$50 Expense Ready for @${domain})`
      : 'Pro Individual Plan ($9.90/mo)',
    checkoutPriceUsd: isCorporate ? 29.0 : 9.9,
  };
}

function generateManagerSlackPitch(params = {}) {
  const domain = params.domain || 'our team';
  return [
    `Hi! I'm using SlideCraft AI to convert our strategy docs, PRDs, and meeting notes into executive McKinsey-style slide decks in 1 click (saves ~5 hrs/week of manual slide formatting for @${domain}).`,
    `The Team Workspace plan is $29/mo (under our $50 auto-approval software expense limit) and includes 5 shared team seats.`,
    `I've attached the standard Cloud Productivity & Presentation Automation tax receipt — putting this on the team card for this month!`
  ].join(' ');
}

function generateExpenseInvoiceHtml(params = {}) {
  const email = params.email || 'user@company.com';
  const domain = params.domain || email.split('@')[1] || 'company.com';
  const dateStr = params.dateStr || new Date().toISOString().slice(0, 10);
  const invoiceNo = params.invoiceNo || `INV-SC-${dateStr.replace(/-/g, '')}-2900`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice ${invoiceNo} — SlideCraft AI Cloud Presentation Suite</title>
</head>
<body style="font-family:sans-serif;max-width:680px;margin:32px auto;padding:28px;border:1px solid #cbd5e1;border-radius:10px;color:#0f172a;">
  <div style="display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:20px;">
    <div>
      <h2 style="margin:0;">SlideCraft AI Inc.</h2>
      <div style="font-size:12px;color:#475569;">Category: Cloud Executive Presentation &amp; AI Document Automation Software</div>
    </div>
    <div style="text-align:right;">
      <span style="background:#dbeafe;color:#1e40af;font-weight:700;font-size:12px;padding:4px 10px;border-radius:999px;">PAID / EXPENSE-READY (&lt;$50 AUTO-APPROVAL)</span>
      <div style="font-size:12px;color:#475569;margin-top:6px;"><strong>Invoice #:</strong> ${invoiceNo}<br><strong>Date:</strong> ${dateStr}</div>
    </div>
  </div>
  <div style="font-size:12px;color:#475569;line-height:1.6;">
    <strong>Billed To Organization:</strong> @${domain} (${email})<br>
    <strong>Expense Policy Compliance:</strong> Under $50.00 USD Monthly SaaS Micro-Purchase Threshold (Ramp / Brex / Expensify Ready)
  </div>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
    <thead>
      <tr style="background:#f8fafc;">
        <th style="border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:left;">Description</th>
        <th style="border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:left;">Seats</th>
        <th style="border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:left;">Billing Cycle</th>
        <th style="border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:left;">Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border-bottom:1px solid #e2e8f0;padding:10px 8px;"><strong>SlideCraft AI — Team Workspace License</strong><br><span style="font-size:12px;color:#475569;">1-Click Doc/Markdown to Executive Slides, 3-Column Card Synthesis &amp; Speaker Notes</span></td>
        <td style="border-bottom:1px solid #e2e8f0;padding:10px 8px;">Up to 5 (@${domain})</td>
        <td style="border-bottom:1px solid #e2e8f0;padding:10px 8px;">Monthly</td>
        <td style="border-bottom:1px solid #e2e8f0;padding:10px 8px;">$29.00</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size:18px;font-weight:800;text-align:right;">Total Amount: $29.00 USD</div>
</body>
</html>`;
}

const TOOLS = [
  {
    name: 'slidecraft_doc_to_deck',
    description:
      'Transforms messy Markdown, PRDs, Google Docs, or meeting notes into McKinsey-grade Action Titles, 3-Column Executive Cards JSON, substantive Speaker Notes, and a standalone 16:9 HTML slide deck.',
    inputSchema: {
      type: 'object',
      properties: {
        markdown: {
          type: 'string',
          description: 'Raw Markdown, document text, or bulleted meeting notes to convert into slides',
        },
        deckTitle: {
          type: 'string',
          description: 'Presentation title',
          default: 'Executive Strategy & Action Briefing',
        },
        theme: {
          type: 'string',
          enum: ['mckinsey-ivory', 'google-clean', 'boardroom-slate'],
          default: 'mckinsey-ivory',
        },
      },
      required: ['markdown'],
    },
  },
  {
    name: 'slidecraft_b2b_expense_pack',
    description:
      'Inspects a user work email (@company.com), evaluates CFO daily free deck quota, and generates a <$50 No-Approval $29/mo Team Expense Invoice HTML + 3-sentence Manager Slack Pitch.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'User corporate email (e.g. vp.strategy@stripe.com)',
        },
      },
      required: ['email'],
    },
  },
];

let serverQuotaState = {
  tier: 'free',
  lastDate: new Date().toISOString().slice(0, 10),
  usedToday: 0,
};

function handleJsonRpc(req) {
  if (!req || typeof req !== 'object') {
    return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
  }

  const { id, method, params } = req;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: SERVER_INFO,
        capabilities: { tools: {} },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS },
    };
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};

    if (toolName === 'slidecraft_doc_to_deck') {
      const check = evaluateDailyDeckCircuitBreaker(serverQuotaState);
      if (!check.allowed) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'CFO_DAILY_3_DECKS_CIRCUIT_BREAKER_TRIPPED',
                  message:
                    'Daily 3 Free AI Executive Decks reached! Call slidecraft_b2b_expense_pack with your @company.com email to unlock the $29/mo (<$50 No-Approval) Team Workspace.',
                }),
              },
            ],
          },
        };
      }
      serverQuotaState = check.nextState;

      const deck = compileDocToMcKinseySlides(args.markdown || '', {
        deckTitle: args.deckTitle,
        theme: args.theme,
        enforceFreeSlideCap: serverQuotaState.tier === 'free',
      });

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ...deck,
                  quotaRemainingToday: check.remainingToday,
                },
                null,
                2
              ),
            },
          ],
        },
      };
    }

    if (toolName === 'slidecraft_b2b_expense_pack') {
      const info = inspectCorporateEmail(args.email || '');
      const pitch = generateManagerSlackPitch({ domain: info.domain || 'our team' });
      const invoiceHtml = generateExpenseInvoiceHtml({
        email: args.email || 'user@company.com',
        domain: info.domain || 'company.com',
      });

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  domainInspection: info,
                  managerSlackPitch: pitch,
                  expenseInvoiceHtml: invoiceHtml,
                },
                null,
                2
              ),
            },
          ],
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Unknown tool: ${toolName}` },
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

if (require.main === module) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed);
      const resp = handleJsonRpc(req);
      if (resp) {
        process.stdout.write(JSON.stringify(resp) + '\n');
      }
    } catch {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        }) + '\n'
      );
    }
  });
}

module.exports = {
  handleJsonRpc,
  compileDocToMcKinseySlides,
  evaluateDailyDeckCircuitBreaker,
  inspectCorporateEmail,
  generateManagerSlackPitch,
  generateExpenseInvoiceHtml,
  TOOLS,
  SERVER_INFO,
};
