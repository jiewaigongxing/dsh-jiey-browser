# Agent notes for this repository

- Plugin id: `jiey-browser`
- Cordis inject: `tools`, `systemPrompt`
- Keep `allowCookies` default false
- Prefer snapshot refs + `browser_act` over brittle CSS selectors
- Do not fall back to Playwright when Jiey is offline; return the download URL instead
