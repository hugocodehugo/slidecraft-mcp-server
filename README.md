# SlideCraft AI — 1-Click Doc / Markdown to McKinsey Executive Slides (MCP Server)

[![Website](https://img.shields.io/badge/Live_Sandbox-aurashot.justfancynow.com%2Fslidecraft-2563eb)](https://aurashot.justfancynow.com/slidecraft)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-10b981)](https://github.com/hugocodehugo/slidecraft-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate.svg)](https://opensource.org/licenses/MIT)

**SlideCraft AI** (`@slidecraft/mcp-server`) is a zero-dependency **Model Context Protocol (MCP) Server** for **Claude Desktop, Cursor, Windsurf, and Google Docs/Slides workflows**. It converts messy Markdown notes, PRDs, and meeting transcripts into **McKinsey-style Action Titles, 3-Column Executive Cards JSON, substantive Speaker Scripts, and standalone 16:9 HTML Presentations** in 1 click.

- 🌐 **Try Live Interactive Web Sandbox**: [https://aurashot.justfancynow.com/slidecraft](https://aurashot.justfancynow.com/slidecraft)
- 🔒 **Privacy Policy**: [https://aurashot.justfancynow.com/sheetpulse/privacy](https://aurashot.justfancynow.com/sheetpulse/privacy)

---

## ✨ Key Capabilities

1. **`slidecraft_doc_to_deck` — 1-Click McKinsey Action-Title Deck Compiler**:
   - Extracts quantitative KPI metrics (`$1.2M`, `+38%`, `3.2x`) automatically from prose.
   - Rewrites passive headings into executive **Action Titles** (*"Q4 Revenue Growth — Driving +38% YoY ARR Expansion"*).
   - Synthesizes messy bullets into **3-Column Executive Cards (`01 Diagnosis` · `02 Execution Lever` · `03 Business Impact`)** + **Bottom-Line Takeaway Band** + **Speaker Notes**.
   - Outputs both structured JSON and a standalone **16:9 HTML Presentation Deck**.
2. **`slidecraft_b2b_expense_pack` — Corporate `<$50` Auto-Approval Expense Engine**:
   - Detects `@company.com` corporate domains and generates a compliant **$29.00/mo (`<$50` No-Approval) Tax Invoice HTML** (Ramp / Brex / Expensify ready) + **3-Sentence Manager Slack Reimbursement Pitch**.

---

## 🚀 10-Second Setup (Claude Desktop / Cursor)

Add to your `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "slidecraft-ai": {
      "command": "npx",
      "args": ["-y", "@slidecraft/mcp-server"]
    }
  }
}
```
