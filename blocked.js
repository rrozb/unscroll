import { matchDomain, dayKey, send } from './shared.js';

const target = location.hash.slice(1);
let host = '';
try { host = new URL(target).hostname; } catch {}

const { sites = {} } = await chrome.storage.local.get('sites');
const domain = matchDomain(host, Object.keys(sites)) || host.replace(/^www\./, '');

document.getElementById('domain').textContent = domain || 'blocked';
document.title = `${domain} · blocked`;

if (domain) {
  // Count the attempt, but not when the user just refreshes this page.
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav?.type !== 'reload' && sites[domain]) await send({ type: 'hit', domain });

  const { log = {} } = await chrome.storage.local.get('log');
  const n = log[dayKey()]?.[domain]?.b || 0;
  if (n) document.getElementById('count').textContent = n === 1 ? '1st try today' : `${n} tries today`;

  const hatch = document.getElementById('hatch');
  hatch.hidden = !sites[domain];
  hatch.addEventListener('click', async (e) => {
    const minutes = Number(e.target.dataset?.min);
    if (!minutes) return;
    await send({ type: 'open', domain, minutes });
    location.replace(/^https?:/.test(target) ? target : `https://${domain}`);
  });
}
