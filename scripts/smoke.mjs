#!/usr/bin/env node
/**
 * Smoke test against a running Jiey MCP server (no DSH required).
 * Exit 0 on success; exit 2 if Jiey is offline (soft skip for CI without browser).
 */
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function main() {
  const mod = await import(pathToFileURL(join(root, 'lib/index.js')).href)
  const { JieyMcpClient, probeJieyHealth, resolveJieyBaseUrl } = mod

  const discovery = await resolveJieyBaseUrl()
  const health = await probeJieyHealth(discovery.url)
  if (!health.ok) {
    console.error('[smoke] Jiey offline — soft skip')
    console.error(health.detail)
    process.exit(2)
  }

  console.log('[smoke]', health.detail)
  const client = new JieyMcpClient({ allowCookies: false, scopeId: 'dsh-jiey-browser-smoke' })
  try {
    const opened = await client.openTab('https://example.com')
    console.log('[smoke] opened page', opened.page)
    const snap = await client.callTool('snapshot', { page: opened.page })
    console.log('[smoke] snapshot chars', snap.text.length)
    if (snap.text.length < 20) throw new Error('snapshot too short')
    await client.closeOwnedPages()
    console.log('[smoke] ok')
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error('[smoke] failed', error)
  process.exit(1)
})
