import { normalizeDomain, dayKey, send } from './shared.js';

const $ = (id) => document.getElementById(id);
function build(tag, props, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
}

async function render() {
  const { sites = {}, log = {} } = await chrome.storage.local.get(['sites', 'log']);
  const now = Date.now();
  const domains = Object.keys(sites).sort();

  $('list').replaceChildren(
    ...(domains.length
      ? domains.map((d) => {
          const left = sites[d].until - now;
          const open = left > 0;
          const action = open
            ? build('button', { className: 'link', title: 'block again now', onclick: () => send({ type: 'reblock', domain: d }) }, `open · ${Math.ceil(left / 60e3)}m  ✕`)
            : build('button', { className: 'link', title: 'remove from list', onclick: () => send({ type: 'remove', domain: d }) }, 'remove');
          return build('li', { className: open ? 'open' : '' }, build('span', { className: 'dot' }), build('span', { className: 'd' }, d), action);
        })
      : [build('li', { className: 'empty' }, 'nothing blocked')])
  );

  // Totals over the last N days, per domain (including removed ones that still have history).
  const sum = (d, days) => {
    let b = 0, o = 0;
    for (let i = 0; i < days; i++) {
      const e = log[dayKey(now - i * 864e5)]?.[d];
      if (e) { b += e.b; o += e.o; }
    }
    return [b, o];
  };
  const seen = new Set(domains);
  for (const day of Object.values(log)) for (const d of Object.keys(day)) seen.add(d);
  const rows = [...seen].map((d) => [d, sum(d, 1), sum(d, 7), sum(d, 30)]).filter((r) => r[3][0] + r[3][1] > 0);
  const cell = ([b, o]) => build('td', { className: 'num' }, String(b), build('small', {}, ` · ${o}`));

  $('stats').replaceChildren(
    ...(rows.length
      ? rows.sort((a, b) => b[3][0] - a[3][0]).map(([d, ...c]) => build('tr', {}, build('td', {}, d), ...c.map(cell)))
      : [build('tr', {}, build('td', { colSpan: 4, className: 'empty' }, 'no attempts yet'))])
  );
}

$('add').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('domain');
  const domain = normalizeDomain(input.value);
  if (!domain) { input.select(); return; }
  input.value = '';
  await send({ type: 'add', domain });
});

chrome.storage.onChanged.addListener(render);
setInterval(render, 15e3);
render();
