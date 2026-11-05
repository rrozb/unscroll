import { DEFAULT_SITES, matchDomain, dayKey } from './shared.js';

// Storage (chrome.storage.local, never leaves the browser):
//   sites: { "youtube.com": { until: 0 } }      until > now means temporarily opened
//   log:   { "2026-11-05": { "youtube.com": { b: 3, o: 1 } } }   b = blocked visits, o = opens
const KEEP_DAYS = 90;
const BLOCKED_PAGE = chrome.runtime.getURL('blocked.html');

async function load() {
  const { sites = {}, log = {} } = await chrome.storage.local.get(['sites', 'log']);
  return { sites, log };
}

// Rebuild every redirect rule from storage, so rules can never drift from state.
async function apply() {
  const { sites } = await load();
  const now = Date.now();
  const blocked = Object.keys(sites).filter((d) => !(sites[d].until > now));

  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: old.map((r) => r.id),
    addRules: blocked.map((d, i) => ({
      id: i + 1,
      priority: 1,
      action: { type: 'redirect', redirect: { regexSubstitution: `${BLOCKED_PAGE}#\\0` } },
      condition: { regexFilter: '^.*$', requestDomains: [d], resourceTypes: ['main_frame'] },
    })),
  });

  // Kick out tabs that are already sitting on a blocked site.
  for (const tab of await chrome.tabs.query({})) {
    try {
      if (tab.url && matchDomain(new URL(tab.url).hostname, blocked)) {
        chrome.tabs.update(tab.id, { url: `${BLOCKED_PAGE}#${tab.url}` });
      }
    } catch {}
  }

  // Wake up when the next temporary unblock runs out.
  const next = Math.min(...Object.values(sites).map((s) => s.until).filter((u) => u > now));
  await chrome.alarms.clear('reblock');
  if (Number.isFinite(next)) chrome.alarms.create('reblock', { when: next + 500 });
}

// Serialize all state changes so concurrent messages can't interleave.
let queue = Promise.resolve();
const run = (fn) => (queue = queue.then(fn, fn));

async function bump(domain, field) {
  const { log } = await load();
  const day = dayKey();
  log[day] ??= {};
  log[day][domain] ??= { b: 0, o: 0 };
  log[day][domain][field]++;
  const cutoff = dayKey(Date.now() - KEEP_DAYS * 864e5);
  for (const k of Object.keys(log)) if (k < cutoff) delete log[k];
  await chrome.storage.local.set({ log });
}

async function setSites(fn) {
  const { sites } = await load();
  fn(sites);
  await chrome.storage.local.set({ sites });
  await apply();
}

const handlers = {
  add: ({ domain }) => setSites((s) => (s[domain] = { until: 0 })),
  remove: ({ domain }) => setSites((s) => delete s[domain]),
  reblock: ({ domain }) => setSites((s) => s[domain] && (s[domain].until = 0)),
  open: async ({ domain, minutes }) => {
    await setSites((s) => s[domain] && (s[domain].until = Date.now() + minutes * 60e3));
    await bump(domain, 'o');
  },
  hit: ({ domain }) => bump(domain, 'b'),
};

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  const h = handlers[msg?.type];
  if (!h) return;
  run(() => h(msg)).then(() => reply({ ok: true }), (e) => reply({ ok: false, error: String(e) }));
  return true;
});

chrome.runtime.onInstalled.addListener(() =>
  run(async () => {
    const { sites } = await chrome.storage.local.get('sites');
    if (!sites) {
      await chrome.storage.local.set({ sites: Object.fromEntries(DEFAULT_SITES.map((d) => [d, { until: 0 }])) });
    }
    await apply();
  })
);
chrome.runtime.onStartup.addListener(() => run(apply));
chrome.alarms.onAlarm.addListener(() => run(apply));
