/** Thin MCP Streamable-HTTP client for Jiey Browser. */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {
  DEFAULT_DOWNLOAD_URL,
  jieyMissingMessage,
  probeJieyHealth,
  resolveJieyBaseUrl,
} from './resolve-server.ts'

export interface JieyClientOptions {
  /** Explicit base URL or bare port. Empty → auto-discover. */
  serverUrl?: string
  /** Scope header so tabs stay isolated from the user and other agents. */
  scopeId?: string
  downloadUrl?: string
  /** When false (default), never list/reuse the user's existing tabs. */
  allowCookies?: boolean
  /**
   * When true (default), open tabs without stealing focus so the Harness UI
   * stays in front. Maps to Jiey MCP `tabs` `background: true`.
   */
  openInBackground?: boolean
}

type ContentItem =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: string; [key: string]: unknown }

export interface ToolCallResult {
  text: string
  images: Array<{ data: string; mimeType: string }>
  structured: Record<string, unknown> | undefined
  raw: unknown
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return undefined
}

function extractResult(raw: unknown): ToolCallResult {
  const result = asRecord(raw) ?? {}
  const content = Array.isArray(result.content) ? (result.content as ContentItem[]) : []
  const texts: string[] = []
  const images: Array<{ data: string; mimeType: string }> = []
  for (const item of content) {
    if (item.type === 'text' && typeof item.text === 'string') texts.push(item.text)
    if (
      item.type === 'image' &&
      typeof item.data === 'string' &&
      typeof item.mimeType === 'string'
    ) {
      images.push({ data: item.data, mimeType: item.mimeType })
    }
  }
  if (result.isError === true) {
    throw new Error(texts.join('\n') || 'jiey MCP tool returned isError=true')
  }
  return {
    text: texts.join('\n'),
    images,
    structured: asRecord(result.structuredContent),
    raw,
  }
}

export class JieyMcpClient {
  private client: Client | undefined
  private baseUrl = ''
  private readonly options: Required<
    Pick<JieyClientOptions, 'scopeId' | 'downloadUrl' | 'allowCookies' | 'openInBackground'>
  > &
    Pick<JieyClientOptions, 'serverUrl'>
  /** Pages opened by this plugin instance (for session dispose). */
  readonly ownedPages = new Set<number>()

  constructor(options: JieyClientOptions = {}) {
    this.options = {
      serverUrl: options.serverUrl,
      scopeId: options.scopeId?.trim() || 'dsh-jiey-browser',
      downloadUrl: options.downloadUrl?.trim() || DEFAULT_DOWNLOAD_URL,
      allowCookies: options.allowCookies === true,
      openInBackground: options.openInBackground !== false,
    }
  }

  get allowCookies(): boolean {
    return this.options.allowCookies
  }

  get connectedBaseUrl(): string {
    return this.baseUrl
  }

  async ensureConnected(signal?: AbortSignal): Promise<Client> {
    if (this.client) return this.client
    if (signal?.aborted) throw new Error('aborted')

    const discovery = await resolveJieyBaseUrl(this.options.serverUrl)
    this.baseUrl = discovery.url
    const health = await probeJieyHealth(this.baseUrl)
    if (!health.ok) {
      throw new Error(jieyMissingMessage(this.baseUrl, this.options.downloadUrl))
    }

    const transport = new StreamableHTTPClientTransport(
      new URL(`${this.baseUrl}/mcp?structured=1`),
      {
        requestInit: {
          headers: {
            'X-BrowserOS-Scope-Id': this.options.scopeId,
          },
        },
      },
    )
    const client = new Client({ name: 'dsh-jiey-browser', version: '0.1.0' })
    await client.connect(transport)
    this.client = client
    return client
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ToolCallResult> {
    const client = await this.ensureConnected(signal)
    if (signal?.aborted) throw new Error('aborted')
    const raw = await client.callTool({ name, arguments: args })
    return extractResult(raw)
  }

  async openTab(url?: string, signal?: AbortSignal): Promise<{ page: number; text: string }> {
    const result = await this.callTool(
      'tabs',
      {
        action: 'new',
        ...(url ? { url } : {}),
        // background:true = do not steal focus from DSH / the user's current app
        background: this.options.openInBackground,
      },
      signal,
    )
    const page = Number(result.structured?.page)
    if (!Number.isInteger(page)) {
      throw new Error(`jiey tabs new did not return a page id: ${result.text}`)
    }
    this.ownedPages.add(page)
    return { page, text: result.text }
  }

  async listOwnTabs(signal?: AbortSignal): Promise<string> {
    const result = await this.callTool('tabs', { action: 'list' }, signal)
    // When cookies/login reuse is disabled, strip guidance to use user tabs.
    if (!this.options.allowCookies) {
      return [
        result.text,
        '',
        '[dsh-jiey-browser] allowCookies=false (default): only use tabs under Your tabs / this scope. Do not reuse User tabs or rely on existing login sessions.',
      ].join('\n')
    }
    return result.text
  }

  async closeOwnedPages(): Promise<void> {
    if (!this.client || this.ownedPages.size === 0) {
      this.ownedPages.clear()
      return
    }
    const pages = [...this.ownedPages]
    this.ownedPages.clear()
    for (const page of pages) {
      try {
        await this.callTool('tabs', { action: 'close', page })
      } catch {
        // best-effort cleanup
      }
    }
  }

  async close(): Promise<void> {
    await this.closeOwnedPages()
    if (this.client) {
      try {
        await this.client.close()
      } catch {
        // ignore
      }
      this.client = undefined
    }
  }
}
