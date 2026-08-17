# Contributing

## Develop

```sh
npm install
npm run build
npm run typecheck
npm run smoke
```

`npm run smoke` needs Jiey Browser running with MCP on `http://127.0.0.1:9100` (or set `JIEY_URL` / `BROWSEROS_URL`).

## Release

1. Bump `package.json` version.
2. `npm run build`
3. `npm publish --access public`
4. Tag the release on GitHub.

## Scope

Keep changes focused on the Cordis plugin surface (`tools` + `systemPrompt`) and the Jiey MCP client. Do not bundle a browser binary in this package.
