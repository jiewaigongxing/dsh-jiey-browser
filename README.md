# dsh-jiey-browser

DeepSeek Harness plugin that gives the agent **real Jiey Browser** tools over MCP.

> Let DeepSeek Harness go online — one plugin, powered by Jiey.

DSH is in developer preview; this plugin targets the Cordis / `tools` + `systemPrompt` surface and may need updates as DSH breaks APIs.

## Why Jiey (not Playwright)

| | Playwright plugins | **dsh-jiey-browser** |
|---|---|---|
| Runtime | Headless / automation profile | Real Jiey Chromium (user browser) |
| Install funnel | `npx playwright install` | Missing Jiey → download guide |
| Cookies / login | Separate profile | **Default off**; opt-in to reuse sessions |
| Cleanup | Controller close | Cordis `dispose` closes owned tabs |

## Install

Requires Node.js `^22.19 || >=24` and a DSH profile.

```sh
# from npm (public)
dsh plugin --profile web add dsh-jiey-browser
# or
npm install dsh-jiey-browser
```

From a local checkout after `npm run build`:

```sh
dsh plugin --profile web add /absolute/path/to/packages/dsh-jiey-browser
```

Source: https://github.com/jiewaigongxing/dsh-jiey-browser  
npm: https://www.npmjs.com/package/dsh-jiey-browser  
Topics: `dsh-plugin`, `deepseek-harness`, `dsh`.

## Prerequisites

Full guide: [Use with DeepSeek Harness](https://docs.browser.gongxingglobal.com/features/use-with-deepseek-harness)

1. Install and open **Jiey Browser** so its MCP server is up (default `http://127.0.0.1:9100`).
   - **Download only from the official site:** https://www.gongxingglobal.com/browser  
     (macOS / Windows / Linux installers are listed there — this repo does not ship CDN links.)
2. Discovery order: plugin `serverUrl` → `BROWSEROS_URL` / `JIEY_URL` → `~/.browseros/server.json` → `http://127.0.0.1:9100`.
3. Health check: `GET /system/health` must return `{ status: "ok" }`.

If Jiey is offline, tools fail with a link to the official download page (default `https://www.gongxingglobal.com/browser`) instead of silently falling back to another browser.

## Configure

In the profile `cordis.patch.yml` (or DSH settings UI):

```yaml
- id: jiey-browser
  config:
    serverUrl: ""              # empty = auto-discover
    scopeId: dsh-jiey-browser  # tab isolation header
    allowCookies: false        # DEFAULT: do not reuse login / user tabs
    downloadUrl: https://www.gongxingglobal.com/browser
    maxSnapshotChars: 40000
```

**Security:** `allowCookies` defaults to **false**. Turn it on only when the user explicitly wants the agent to use existing logged-in sites.

## Tools

| Tool | Maps to Jiey MCP | Role |
|---|---|---|
| `browser_open` | `tabs` new + `snapshot` | Open |
| `browser_navigate` | `navigate` | Navigate |
| `browser_snapshot` | `snapshot` | Refs for act |
| `browser_read` | `read` | Markdown / text scrape |
| `browser_act` | `act` | click / fill / press / … |
| `browser_screenshot` | `screenshot` | Inline image (no temp file) |
| `browser_tabs` | `tabs` list/close | List / dispose |

## Local smoke (no DSH)

```sh
npm install
npm run build
npm run smoke
```

With Jiey running, smoke opens `https://example.com`, snapshots, and closes the tab.

## License

MIT
