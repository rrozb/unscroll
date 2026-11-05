// Helpers shared by the popup, the blocked page and the service worker.

export const DEFAULT_SITES = ['youtube.com', 'reddit.com'];

// "https://www.YouTube.com/watch?v=x" -> "youtube.com"; returns null if it doesn't look like a domain.
export function normalizeDomain(input) {
  let s = String(input || '').trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, '').split(/[/?#:]/)[0].replace(/^www\./, '');
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/.test(s) ? s : null;
}

export function matchDomain(host, domains) {
  host = String(host || '').toLowerCase();
  return domains.find((d) => host === d || host.endsWith('.' + d)) || null;
}

export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function send(msg) {
  return chrome.runtime.sendMessage(msg);
}
