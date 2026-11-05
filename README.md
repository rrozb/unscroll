# unscroll

A tiny Chrome extension that blocks distracting sites completely. It has no time budgets and no accounts. You get a wall and an escape hatch.

- **Block a domain.** It blocks the domain and all its subdomains (`reddit.com` also covers `old.reddit.com`). YouTube and Reddit are blocked by default.
- **Escape hatch.** The block page lets you open the site for 5, 15 or 30 minutes and takes you to the exact URL you wanted. When the time runs out, the site blocks itself again and any open tabs on it are sent back to the block page.
- **Stats.** For each site, the popup shows how many times you hit the wall and how many times you opened it anyway, for today, the last 7 days and the last 30 days.
- **Everything stays local.** Data lives in `chrome.storage.local`, so there is no server, no sync and no analytics. History older than 90 days is pruned.

## Install

1. Go to `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Pin the extension and click it to add or remove sites.

## Build

```bash
./scripts/build.sh
```

This creates `dist/unscroll/`, a clean folder for **Load unpacked**, and `dist/unscroll-<version>.zip` for uploading to the Chrome Web Store.

## Files

| file | what |
|---|---|
| `background.js` | Turns the site list into `declarativeNetRequest` redirect rules, handles timed unblocks and counts visits |
| `blocked.html/js` | The wall and the escape hatch |
| `popup.html/js` | The site list and the stats |
| `shared.js` | Domain parsing and helpers |
