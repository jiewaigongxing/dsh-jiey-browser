# dsh-jiey-browser

DeepSeek Harness プラグイン。MCP 経由で **Jiey Browser** をエージェントの手と目にします。

## インストール

```sh
dsh plugin --profile web add dsh-jiey-browser
# または
dsh plugin --profile web add github:jiewaigongxing/dsh-jiey-browser
```

## 前提

1. Jiey Browser を起動し、MCP（既定 `http://127.0.0.1:9100`）を有効にする
2. ヘルスチェック: `GET /system/health` が `{ "status": "ok" }` を返すこと
3. `allowCookies` の既定は `false`（既存ログインセッションを再利用しない）

## ツール

`browser_open` / `browser_navigate` / `browser_snapshot` / `browser_read` / `browser_act` / `browser_screenshot` / `browser_tabs`

## License

MIT
