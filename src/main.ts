import '@fontsource-variable/overpass';
import './style.css';
import { speaker } from './speech';
import {
  STOPS, ROUTE, DAYS, LEGS, SAILINGS, TIDES, RIDES, PHRASES, TRIP_START, TRIP_END,
  type Stop, type StopId, type Day,
} from './data';

// ── Service worker ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => new Date(s + 'T12:00:00');
const fmt = (s: string) => { const d = parse(s); return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`; };
const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string | null) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function today(): string {
  const p = new URLSearchParams(location.search).get('date');
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) store.set('previewDate', p);
  return store.get('previewDate') ?? iso(new Date());
}

const mapsUrl = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;

const nightsAt = (id: StopId) => DAYS.filter(d => d.stop === id && !d.home);
function stopRange(id: StopId) {
  const n = nightsAt(id);
  const first = n[0].date, last = n[n.length - 1].date;
  const out = iso(new Date(parse(last).getTime() + 86400000));
  return { first, last, out, nights: n.length };
}

// ── Icons ────────────────────────────────────────────────────────────────────
const I = {
  today: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',
  trip: '<path d="M7 3v18M17 3v18"/><path d="M12 5v2M12 11v2M12 17v2"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  ask: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 10h6M9 14h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  pin: '<path d="M12 21s-7-6.3-7-12a7 7 0 0 1 14 0c0 5.7-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  wave: '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 10c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
};
const icon = (k: keyof typeof I, size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;

// ── Signs ────────────────────────────────────────────────────────────────────
function borne(top: string, big: string, small: string): string {
  return `<div class="borne" role="img" aria-label="${esc(`${top} ${big} ${small}`)}">
    <div class="borne-cap">${esc(top)}</div>
    <div class="borne-body"><span class="borne-big">${esc(big)}</span><span class="borne-small">${esc(small)}</span></div>
  </div>`;
}

function directionSign(dest: string, km: number | null, note: string, kind: 'green' | 'blue' = 'green'): string {
  return `<div class="dir dir--${kind}">
    <div class="dir-arrow">${icon('arrow', 30)}</div>
    <div class="dir-text"><span class="dir-dest">${esc(dest)}</span><span class="dir-note">${esc(note)}</span></div>
    ${km !== null ? `<div class="dir-km">${km}<small>km</small></div>` : ''}
  </div>`;
}

function stopNumber(s: Stop): string {
  return s.num ? `<span class="snum" style="--c:${s.color}">${s.num}</span>` : `<span class="snum snum--ferry">${icon('wave', 16)}</span>`;
}

function sailingPass(i: number): string {
  const s = SAILINGS[i];
  return `<div class="pass">
    <div class="pass-head"><span>Irish Ferries · Oscar Wilde</span><span>${esc(s.label)}</span></div>
    <div class="pass-body">
      <div><div class="pass-port">${esc(s.from)}</div><div class="pass-time">${s.dep}</div><div class="pass-day">${esc(s.date)}</div></div>
      <div class="pass-mid">${icon('wave', 26)}</div>
      <div class="r"><div class="pass-port">${esc(s.to)}</div><div class="pass-time">${s.arr}</div><div class="pass-day">${esc(s.arrDay)}</div></div>
    </div>
  </div>`;
}

// ── Screens ──────────────────────────────────────────────────────────────────
function todayScreen(): string {
  const t = today();
  const isPreview = store.get('previewDate') !== null;
  const preview = `<details class="preview"${isPreview ? ' open' : ''}>
      <summary>${isPreview ? `Previewing ${esc(fmt(t))}` : 'Preview a day of the trip'}</summary>
      <div class="preview-row"><input type="date" id="preview-date" min="2026-11-01" max="2027-08-01" value="${t}" aria-label="Preview date">
      ${isPreview ? '<button class="btn btn--ghost" data-action="preview-clear">Back to real date</button>' : ''}</div>
    </details>`;

  // Before the trip
  if (t < TRIP_START) {
    const n = daysBetween(t, TRIP_START);
    return `<main class="screen today">
      <header class="today-head">
        ${borne('Dublin', String(n), n === 1 ? 'day to go' : 'days to go')}
        <div class="today-title"><h1>France 2027</h1><p>29 June to 21 July. Seven stops, 23 days, one big loop.</p></div>
      </header>
      <section class="block"><h2>First, the ferry</h2>${sailingPass(0)}</section>
      <section class="block"><h2>Where we're going</h2>
        <ol class="mini-route">${ROUTE.filter(id => STOPS[id].num).map(id => {
          const s = STOPS[id]; const r = stopRange(id);
          return `<li><a href="#/stop/${id}">${stopNumber(s)}<span class="mr-name">${esc(s.name)}</span><span class="mr-n">${r.nights} ${r.nights === 1 ? 'night' : 'nights'}</span></a></li>`;
        }).join('')}</ol>
      </section>
      ${phrasebook()}
      ${preview}
    </main>`;
  }

  // After the trip
  if (t > TRIP_END) {
    return `<main class="screen today">
      <header class="today-head">${borne('Dublin', '0', 'km to go')}
        <div class="today-title"><h1>Home again</h1><p>2,000 km of France, two ferries and seven beds. Fill in the memories page of the brochure.</p></div>
      </header>${preview}</main>`;
  }

  // During the trip
  const idx = DAYS.findIndex(d => d.date === t);
  const day = DAYS[idx];
  const prev: Day | undefined = DAYS[idx - 1];
  const s = STOPS[day.stop];
  const moving = !prev || prev.stop !== day.stop;
  const leg = moving ? LEGS[day.stop] : undefined;

  let nextHtml = '';
  if (day.home) {
    nextHtml = directionSign('Dublin', null, 'Arriving 10:45. Home!', 'blue');
  } else if (leg) {
    nextHtml = `<section class="block"><h2>On the road today</h2>${directionSign(day.stop === 'ferry-home' ? 'Cherbourg port' : s.name, leg.km, `From ${leg.from}, ${leg.time}`)}</section>`;
  } else {
    const nxt = DAYS.slice(idx + 1).find(d => d.stop !== day.stop);
    if (nxt) {
      const ns = STOPS[nxt.stop]; const nl = LEGS[nxt.stop];
      const inDays = daysBetween(t, nxt.date);
      nextHtml = `<section class="block"><h2>Next stop</h2>${directionSign(ns.name, nl?.km ?? null, `${inDays === 1 ? 'Tomorrow' : fmt(nxt.date)}${nl ? `, ${nl.time}` : ''}`)}</section>`;
    }
  }

  const ferryToday = SAILINGS.findIndex(x => (x.label === 'Outward' && t === '2027-06-29') || (x.label === 'Home' && t === '2027-07-20'));

  return `<main class="screen today">
    <header class="today-head">
      ${borne('Jour', String(idx + 1), `of ${DAYS.length}`)}
      <div class="today-title"><h1>${esc(fmt(t))}</h1><p>${esc(day.plan)}</p></div>
    </header>
    ${day.home ? '' : `<a class="tonight" href="#/stop/${s.id}" style="--c:${s.color}">
      <img src="${s.art}" alt="" class="tonight-art">
      <div class="tonight-panel"><span class="tonight-label">Tonight</span><span class="tonight-stay">${esc(s.stay)}</span><span class="tonight-place">${esc(s.name)}</span></div>
    </a>
    <a class="btn btn--primary" href="${mapsUrl(s.mapsQuery)}" target="_blank" rel="noopener">${icon('pin', 18)} Directions</a>`}
    ${ferryToday >= 0 ? `<section class="block"><h2>Sailing today</h2>${sailingPass(ferryToday)}</section>` : ''}
    ${nextHtml}
    ${tidesBlock(day.stop === 'ferry-home' ? 'granville' : day.stop, t)}
    ${phrasebook()}
    ${preview}
  </main>`;
}

function phrasebook(): string {
  return `<details class="block phrases"><summary><h2>Speak French</h2></summary>
    <dl>${PHRASES.map(p => `<div><dt lang="fr">${esc(p.fr)}</dt><dd>${esc(p.en)}</dd>
      ${speaker.supported ? `<button class="say-btn" type="button" data-say="${esc(p.fr)}" aria-label="Play “${esc(p.fr)}”" aria-pressed="false">${icon('speaker', 22)}</button>` : ''}</div>`).join('')}</dl>
  </details>`;
}

// Tide table for a stop; pass `from` to show just that day and the next (Today screen).
function tidesBlock(id: StopId, from?: string): string {
  const t = TIDES[id];
  if (!t) return '';
  const start = from ? t.days.findIndex(d => d.date === from) : 0;
  if (start < 0) return '';
  const days = from ? t.days.slice(start, start + 2) : t.days;
  return `<section class="block"><h2>${esc(t.place)} tides</h2>
    <table class="tides"><thead><tr><th scope="col"></th><th scope="col">High tide</th><th scope="col">Low tide</th></tr></thead>
    <tbody>${days.map(r => `<tr><th scope="row">${esc(r.day)}</th><td>${r.high.join(' · ')}</td><td>${r.low.join(' · ')}</td></tr>`).join('')}</tbody></table>
    <p class="note">${esc(t.note)}</p></section>`;
}

function tripScreen(): string {
  const t = today();
  return `<main class="screen trip">
    <h1 class="screen-title">The trip</h1>
    <ol class="road">${ROUTE.map(id => {
      const s = STOPS[id];
      const days = DAYS.filter(d => d.stop === id);
      const leg = LEGS[id];
      const here = days.some(d => d.date === t);
      return `<li class="road-stop${here ? ' road-stop--here' : ''}" style="--c:${s.color}">
        ${leg ? `<div class="road-leg">${leg.km} km · ${esc(leg.time)}</div>` : ''}
        <a class="road-sign" href="#/stop/${id}">
          ${stopNumber(s)}
          <span class="rs-text"><span class="rs-name">${esc(s.ferry ? s.stay : s.name)}</span><span class="rs-stay">${esc(s.ferry ? s.tagline : s.stay)}</span></span>
          ${here ? '<span class="here">Now</span>' : ''}
        </a>
        <ul class="road-days">${days.map(d => `<li class="${d.date === t ? 'is-today' : ''}${d.date < t ? ' is-past' : ''}"><span class="rd-date">${esc(fmt(d.date))}</span><span class="rd-plan">${esc(d.plan)}</span></li>`).join('')}</ul>
      </li>`;
    }).join('')}</ol>
  </main>`;
}

function stopScreen(id: StopId): string {
  const s = STOPS[id];
  if (!s) return tripScreen();
  const days = DAYS.filter(d => d.stop === id);
  const r = stopRange(id);
  const doneKey = (i: number) => `done:${id}:${i}`;

  let extra = tidesBlock(id);
  if (id === 'disney') extra += ridesBlock();
  if (id === 'ferry-out') extra = `<section class="block"><h2>Sailing</h2>${sailingPass(0)}</section>`;
  if (id === 'ferry-home') extra = `<section class="block"><h2>Sailing</h2>${sailingPass(1)}</section>
    <section class="block"><h2>The way home</h2><img class="map-img" src="/art/ferrymap.svg" alt="Map of the ferry route from Cherbourg, round Cornwall, to Dublin"></section>`;

  return `<main class="screen stop" style="--c:${s.color}">
    <div class="stop-hero"><img src="${s.art}" alt="">
      <a class="back" href="#/trip" aria-label="Back to the trip">${icon('back', 22)}</a>
    </div>
    <header class="stop-sign">
      ${stopNumber(s)}
      <div><h1>${esc(s.name)}</h1><p>${esc(s.tagline)}</p></div>
    </header>
    <section class="stay">
      <div class="stay-when">${esc(fmt(r.first))} – ${esc(fmt(r.out))} · ${r.nights} ${r.nights === 1 ? 'night' : 'nights'}</div>
      <div class="stay-name">${esc(s.stay)}</div>
      <p>${esc(s.stayNote)}</p>
      <a class="btn btn--primary" href="${mapsUrl(s.mapsQuery)}" target="_blank" rel="noopener">${icon('pin', 18)} Directions</a>
    </section>
    <p class="lede">${esc(s.intro)}</p>
    <section class="block"><h2>Day by day</h2>
      <ul class="plan">${days.map(d => `<li><span>${esc(fmt(d.date))}</span>${esc(d.plan)}</li>`).join('')}</ul></section>
    ${extra}
    <section class="block"><h2>Things to do</h2>
      <ul class="todo">${s.things.map((th, i) => {
        const done = store.get(doneKey(i)) === '1';
        return `<li><button class="todo-item${done ? ' is-done' : ''}" data-done="${doneKey(i)}" aria-pressed="${done}">
          <span class="tick">${icon('check', 16)}</span>
          <span><span class="todo-title">${esc(th.title)}</span><span class="todo-text">${esc(th.text)}</span></span></button></li>`;
      }).join('')}</ul></section>
    ${s.fact ? `<aside class="fact"><strong>${esc(s.fact.title)}</strong><p>${esc(s.fact.text)}</p></aside>` : ''}
    ${s.ferry ? '' : askBlock(id)}
  </main>`;
}

function ridesBlock(): string {
  return `<section class="block"><h2>Ride guide</h2>
    <p class="note">Thrill level, from gentle to hold on tight. Measure everyone before we go.</p>
    ${RIDES.map(p => `<h3 class="park">${esc(p.park)}</h3><ul class="rides">${p.rides.map(r => {
      const k = `ride:${r.name}`; const done = store.get(k) === '1';
      return `<li><button class="ride${done ? ' is-done' : ''}" data-done="${esc(k)}" aria-pressed="${done}">
        <span class="tick">${icon('check', 16)}</span>
        <span class="ride-main"><span class="ride-name">${esc(r.name)}</span><span class="ride-text">${esc(r.text)}</span>
          <span class="thrill" aria-label="Thrill ${r.thrill} of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= r.thrill ? 'on' : ''}"></i>`).join('')}</span></span>
        <span class="height${r.height ? '' : ' height--none'}">${r.height ?? 'Any height'}</span>
      </button></li>`;
    }).join('')}</ul>`).join('')}
  </section>`;
}

function mapScreen(): string {
  return `<main class="screen mapscreen">
    <h1 class="screen-title">The route</h1>
    <div class="map-frame"><img class="map-img" src="/art/map.svg" alt="Map of France showing the route: Cherbourg, Paris, Disneyland, Beauval, Loire Valley, Lacanau, La Rochelle, Granville"></div>
    <ol class="legs">${ROUTE.map(id => {
      const s = STOPS[id]; const leg = LEGS[id];
      return `<li><a href="#/stop/${id}" style="--c:${s.color}">${stopNumber(s)}<span class="lg-name">${esc(id === 'ferry-out' ? 'Ferry to Cherbourg' : id === 'ferry-home' ? 'Ferry home from Cherbourg' : s.name)}</span>
        <span class="lg-leg">${leg ? `${leg.km} km<small>${esc(leg.time)}</small>` : '<small>Ferry</small>'}</span></a></li>`;
    }).join('')}</ol>
    <p class="note">Rough driving times, without stops. About 1,850 km in total.</p>
  </main>`;
}

const ASK_TYPES: [string, string][] = [
  ['Food', 'family-friendly places to eat'],
  ['Things to do', 'things to do'],
  ['Rainy day', 'indoor things to do on a rainy day'],
  ['Teen picks', 'things a 13-year-old would think are cool'],
];
const ASK_DIST: [string, string][] = [['Walk', 'walking distance'], ['15 min drive', 'a 15-minute drive'], ['Day trip', 'an hour’s drive']];

function askBlock(id: StopId, withPicker = false): string {
  const t = today();
  const cur = DAYS.find(d => d.date === t)?.stop;
  const sel = withPicker ? (cur && !STOPS[cur].ferry ? cur : 'paris') : id;
  return `<section class="block ask" data-ask>
    <h2>${withPicker ? 'Where are we?' : 'Ask Claude'}</h2>
    ${withPicker ? `<div class="chips" data-group="stop">${ROUTE.filter(x => !STOPS[x].ferry).map(x =>
      `<button class="chip${x === sel ? ' on' : ''}" data-val="${x}" aria-pressed="${x === sel}">${esc(STOPS[x].name)}</button>`).join('')}</div>
      <h2>What do we want?</h2>` : `<input type="hidden" data-stop value="${id}">`}
    <div class="chips" data-group="type">${ASK_TYPES.map(([l, v], i) => `<button class="chip${i === 0 ? ' on' : ''}" data-val="${esc(v)}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <div class="chips" data-group="dist">${ASK_DIST.map(([l, v], i) => `<button class="chip${i === 0 ? ' on' : ''}" data-val="${esc(v)}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <button class="btn btn--primary btn--wide" data-action="ask">Get ideas</button>
    <div class="answer" aria-live="polite" hidden></div>
  </section>`;
}

function askScreen(): string {
  return `<main class="screen askscreen"><h1 class="screen-title">Ask Claude</h1>
    <p class="lede">Ideas for food and things to do near wherever we are, picked for the whole family.</p>
    ${askBlock('paris', true)}</main>`;
}

// ── Answer rendering ─────────────────────────────────────────────────────────
function renderAnswer(md: string): string {
  const lines = esc(md).split('\n').map(l => l.trim()).filter(Boolean);
  const inline = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  let html = '', inList = false;
  for (const l of lines) {
    const m = l.match(/^\d+[.)]\s+(.*)$/);
    if (m) { if (!inList) { html += '<ol>'; inList = true; } html += `<li>${inline(m[1])}</li>`; }
    else { if (inList) { html += '</ol>'; inList = false; } html += `<p>${inline(l)}</p>`; }
  }
  return html + (inList ? '</ol>' : '');
}

async function ask(block: HTMLElement): Promise<void> {
  const pick = (g: string) => block.querySelector<HTMLButtonElement>(`[data-group="${g}"] .chip.on`)?.dataset.val;
  const stop = pick('stop') ?? block.querySelector<HTMLInputElement>('[data-stop]')!.value;
  const type = pick('type')!, distance = pick('dist')!;
  const out = block.querySelector<HTMLElement>('.answer')!;
  const btn = block.querySelector<HTMLButtonElement>('[data-action="ask"]')!;
  out.hidden = false; out.classList.add('is-loading'); out.innerHTML = '<p>Asking Claude…</p>';
  btn.disabled = true;
  try {
    const res = await fetch('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stop, type, distance }) });
    if (!res.ok || !res.body) throw new Error(String(res.status));
    const reader = res.body.getReader(); const dec = new TextDecoder(); let text = '';
    out.classList.remove('is-loading');
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      out.innerHTML = renderAnswer(text);
    }
    if (!text.trim()) throw new Error('empty answer');
  } catch {
    out.classList.remove('is-loading');
    out.innerHTML = '<p class="err">Couldn’t reach Claude. Check you have signal and try again.</p>';
  } finally { btn.disabled = false; }
}

// ── Router ───────────────────────────────────────────────────────────────────
type Tab = 'today' | 'trip' | 'map' | 'ask';

function route(): void {
  const h = location.hash.replace(/^#\/?/, '') || 'today';
  const [page, arg] = h.split('/');
  let html: string; let tab: Tab;
  if (page === 'stop' && arg && arg in STOPS) { html = stopScreen(arg as StopId); tab = 'trip'; }
  else if (page === 'trip') { html = tripScreen(); tab = 'trip'; }
  else if (page === 'map') { html = mapScreen(); tab = 'map'; }
  else if (page === 'ask') { html = askScreen(); tab = 'ask'; }
  else { html = todayScreen(); tab = 'today'; }

  const tabs: [Tab, string, keyof typeof I][] = [['today', 'Today', 'today'], ['trip', 'Trip', 'trip'], ['map', 'Map', 'map'], ['ask', 'Ask', 'ask']];
  document.getElementById('app')!.innerHTML = `${html}
    <nav class="tabbar" aria-label="Sections">${tabs.map(([k, l, ic]) =>
      `<a href="#/${k}" class="tab${k === tab ? ' on' : ''}"${k === tab ? ' aria-current="page"' : ''}>${icon(ic, 22)}<span>${l}</span></a>`).join('')}</nav>`;
  window.scrollTo(0, 0);
  if (page === 'trip') document.querySelector('.road-stop--here')?.scrollIntoView({ block: 'center' });
}

document.addEventListener('click', e => {
  const el = e.target as HTMLElement;
  const chip = el.closest<HTMLButtonElement>('.chip');
  if (chip) {
    chip.parentElement!.querySelectorAll('.chip').forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
    chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true'); return;
  }
  const done = el.closest<HTMLButtonElement>('[data-done]');
  if (done) {
    const on = !done.classList.contains('is-done');
    done.classList.toggle('is-done', on); done.setAttribute('aria-pressed', String(on));
    store.set(done.dataset.done!, on ? '1' : null); return;
  }
  const say = el.closest<HTMLButtonElement>('[data-say]');
  if (say) { speaker.toggle(say.dataset.say!); return; }
  const act = el.closest<HTMLElement>('[data-action]');
  if (act?.dataset.action === 'ask') void ask(act.closest<HTMLElement>('[data-ask]')!);
  if (act?.dataset.action === 'preview-clear') { store.set('previewDate', null); history.replaceState(null, '', location.pathname + location.hash); route(); }
});

document.addEventListener('change', e => {
  const el = e.target as HTMLInputElement;
  if (el.id === 'preview-date' && el.value) { store.set('previewDate', el.value); route(); }
});

speaker.onChange(playing => {
  document.querySelectorAll<HTMLButtonElement>('[data-say]').forEach(b => {
    const on = b.dataset.say === playing;
    b.classList.toggle('is-playing', on); b.setAttribute('aria-pressed', String(on));
  });
});

window.addEventListener('hashchange', route);
today();
route();
