# Security

## Cookie and session access

`allowCookies` defaults to **false**. When false, the plugin scopes tab work so the agent does not reuse your everyday logged-in sessions.

Only enable `allowCookies: true` when you explicitly want the agent to operate inside existing authenticated tabs.

## Trust boundary

Installing this plugin runs code inside your DeepSeek Harness profile with your local permissions. Review the source before enabling cookie reuse or pointing `serverUrl` at a non-local MCP endpoint.
