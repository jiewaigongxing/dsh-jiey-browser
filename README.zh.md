# dsh-jiey-browser

DeepSeek Harness 插件：通过 MCP 把 **jiey 浏览器** 交给 Agent 当「手和眼」。

> 让 DeepSeek Harness 上网，只需一个插件。

## 安装

```sh
# npm 公开包
dsh plugin --profile web add dsh-jiey-browser
# 或
npm install dsh-jiey-browser
```

源码：https://github.com/jiewaigongxing/dsh-jiey-browser  
包地址：https://www.npmjs.com/package/dsh-jiey-browser

## 前置

1. 安装并打开 jiey 浏览器（MCP 默认 `http://127.0.0.1:9100`）
   - 下载页：https://www.gongxingglobal.com/browser  
   - macOS Intel（x64）DMG：https://cdn.gongxingglobal.com/releases/browseros/0.49.6.4/Jiey_v0.49.6.4_x64.dmg  
     （Apple Silicon / Windows / Linux 安装包：同页陆续开放）
2. 发现顺序：`serverUrl` → `BROWSEROS_URL`/`JIEY_URL` → `~/.browseros/server.json` → `9100`
3. 未检测到 jiey 时，工具会返回下载引导，**不会**回退到 Playwright

## 配置（默认安全）

```yaml
- id: jiey-browser
  config:
    allowCookies: false   # 默认关：不复用登录态 / 用户标签
    scopeId: dsh-jiey-browser
```

## 工具

`browser_open` / `browser_navigate` / `browser_snapshot` / `browser_read` / `browser_act` / `browser_screenshot` / `browser_tabs`

会话结束时 Cordis dispose 会关闭本插件打开的标签页。

## License

MIT
