# Agent usage sketch

1. Call `browser_open` with a URL (or open a blank tab).
2. Call `browser_snapshot` and use the returned refs with `browser_act`.
3. Prefer `browser_read` for page text; use `browser_screenshot` only when pixels matter.
4. Call `browser_tabs` with close when finished so owned tabs are disposed.
