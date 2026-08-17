# Prerequisites

- Node.js `^22.19.0 || >=24.0.0`
- DeepSeek Harness profile (`web` or equivalent) that can load Cordis plugins
- Jiey Browser running with MCP enabled (default `http://127.0.0.1:9100`)

Health check:

```sh
curl -sS http://127.0.0.1:9100/system/health
```

Expect JSON with `"status":"ok"`.
