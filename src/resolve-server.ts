/** Discover a running Jiey Browser MCP server. */

import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const DEFAULT_DOWNLOAD_URL = 'https://www.gongxingglobal.com/browser'
export const DEFAULT_DOCS_URL =
  'https://docs.browser.gongxingglobal.com/'

/** Common MCP ports used by prod / packaged / test / dev Jiey builds. */
const CANDIDATE_PORTS = [9200, 9100, 9110, 9105] as const

export interface JieyServerDiscovery {
  url: string
  serverPort?: number
  cdpPort?: number
  serverVersion?: string
  source: 'env' | 'config' | 'discovery' | 'jiey-config' | 'probe' | 'default'
}

function stripMcpSuffix(url: string): string {
  return url.replace(/\/mcp\/?$/, '').replace(/\/$/, '')
}

function expandBarePort(value: string): string {
  if (/^\d+$/.test(value)) return `http://127.0.0.1:${value}`
  return value
}

function jieyAppConfigPaths(): string[] {
  const home = homedir()
  return [
    join(home, 'Library', 'Application Support', 'Jiey', '.jiey', 'config.json'),
    join(home, 'Library', 'Application Support', 'BrowserOS', '.browseros', 'config.json'),
    join(home, '.jiey', 'config.json'),
    join(home, '.browseros', 'config.json'),
  ]
}

async function readJieyAppServerPort(): Promise<number | undefined> {
  for (const path of jieyAppConfigPaths()) {
    try {
      const raw = await readFile(path, 'utf8')
      const parsed = JSON.parse(raw) as { ports?: { server?: number; cdp?: number } }
      const port = parsed.ports?.server
      if (typeof port === 'number' && port > 0) return port
    } catch {
      // try next path
    }
  }
  return undefined
}

async function probeFirstHealthy(
  urls: string[],
): Promise<{ url: string; cdpConnected?: boolean } | undefined> {
  for (const url of urls) {
    const health = await probeJieyHealth(url)
    if (health.ok) return { url: stripMcpSuffix(url), cdpConnected: health.cdpConnected }
  }
  return undefined
}

/** Resolve Jiey MCP base URL (no trailing /mcp). */
export async function resolveJieyBaseUrl(
  explicit?: string,
): Promise<JieyServerDiscovery> {
  if (explicit?.trim()) {
    return {
      url: stripMcpSuffix(expandBarePort(explicit.trim())),
      source: 'config',
    }
  }

  const fromEnv = process.env.BROWSEROS_URL?.trim() || process.env.JIEY_URL?.trim()
  if (fromEnv) {
    return {
      url: stripMcpSuffix(expandBarePort(fromEnv)),
      source: 'env',
    }
  }

  try {
    const raw = await readFile(join(homedir(), '.browseros', 'server.json'), 'utf8')
    const parsed = JSON.parse(raw) as {
      url?: string
      server_port?: number
      cdp_port?: number
      server_version?: string
    }
    if (parsed.url?.trim()) {
      return {
        url: stripMcpSuffix(parsed.url.trim()),
        serverPort: parsed.server_port,
        cdpPort: parsed.cdp_port,
        serverVersion: parsed.server_version,
        source: 'discovery',
      }
    }
    if (typeof parsed.server_port === 'number') {
      return {
        url: `http://127.0.0.1:${parsed.server_port}`,
        serverPort: parsed.server_port,
        cdpPort: parsed.cdp_port,
        serverVersion: parsed.server_version,
        source: 'discovery',
      }
    }
  } catch {
    // fall through
  }

  const appPort = await readJieyAppServerPort()
  if (appPort !== undefined) {
    return {
      url: `http://127.0.0.1:${appPort}`,
      serverPort: appPort,
      source: 'jiey-config',
    }
  }

  const probed = await probeFirstHealthy(
    CANDIDATE_PORTS.map((port) => `http://127.0.0.1:${port}`),
  )
  if (probed) {
    const port = Number(new URL(probed.url).port || 0)
    return {
      url: probed.url,
      serverPort: port || undefined,
      source: 'probe',
    }
  }

  return {
    url: 'http://127.0.0.1:9200',
    serverPort: 9200,
    source: 'default',
  }
}

export async function probeJieyHealth(baseUrl: string): Promise<{
  ok: boolean
  cdpConnected?: boolean
  detail: string
}> {
  const healthUrl = `${stripMcpSuffix(baseUrl)}/system/health`
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(2500) })
    if (!res.ok) {
      return { ok: false, detail: `health HTTP ${res.status} from ${healthUrl}` }
    }
    const body = (await res.json()) as { status?: string; cdpConnected?: boolean }
    const ok = body.status === 'ok'
    return {
      ok,
      cdpConnected: body.cdpConnected,
      detail: ok
        ? `jiey healthy at ${healthUrl} (cdpConnected=${String(body.cdpConnected)})`
        : `unexpected health payload from ${healthUrl}`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, detail: `cannot reach ${healthUrl}: ${message}` }
  }
}

export function jieyMissingMessage(baseUrl: string, downloadUrl: string): string {
  return [
    `Jiey Browser MCP is not reachable at ${baseUrl}.`,
    'Install and open Jiey Browser, then retry.',
    `Download: ${downloadUrl}`,
    'Docs: ' + DEFAULT_DOCS_URL,
    'Once running, this plugin auto-discovers Jiey Application Support config, ~/.browseros/server.json, or BROWSEROS_URL / JIEY_URL.',
  ].join('\n')
}
