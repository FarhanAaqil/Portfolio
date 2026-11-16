// Renders content.json into the marked regions of index.html.
//   node build-content.mjs          rewrite index.html
//   node build-content.mjs --check  fail if index.html has drifted (what CI runs)
import fs from 'node:fs';
import {normalizeProjects} from './project-content.js';

const file = new URL('./index.html', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('./content.json', import.meta.url), 'utf8'));
const projects = normalizeProjects(data.projects);

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const pad = number => String(number).padStart(2, '0');
const external = (url, label, cls = 'project-link') =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;

let html = fs.readFileSync(file, 'utf8');
function replace(name, content) {
  const expression = new RegExp(`<!--content:${name}:start-->[\\s\\S]*?<!--content:${name}:end-->`);
  if (!expression.test(html)) throw new Error('Missing content marker: ' + name);
  html = html.replace(expression, () => `<!--content:${name}:start-->${content}<!--content:${name}:end-->`);
}

// Water 7: two skill groups per workshop stop.
const stations = ['THE SHIPYARD', 'THE BRIDGE', 'THE CANALS', 'THE WORKSHOP', 'THE SIGNAL TOWER'];
const stops = Array.from({length: Math.ceil(data.skills.length / 2)}, (_, i) => {
  const groups = data.skills.slice(i * 2, i * 2 + 2)
    .map(([heading, items]) => `<div><h3>${esc(heading)}</h3><p>${esc(items)}</p></div>`).join('');
  return `<div class="skill-stop spatial-moment" data-side="${i % 2 ? 'right' : 'left'}"><span class="eyebrow">WORKSHOP ${pad(i + 1)} / ${stations[i % stations.length]}</span>${groups}</div>`;
});
replace('skills', `<div class="skill-list">${stops.join('')}</div>`);

// Skypiea: every project that exists, grouped for the full-list dialog.
const archiveGroups = [
  {
    label: 'IN REAL-WORLD USE · BUILT DURING INTERNSHIPS',
    note: 'These four solve real problems for real teams and are in use today. Their live deployments are private, so no live links are shown.',
    items: data.archive.internship.map(item => ({...item, tag: 'In production'}))
  },
  {
    label: 'BEST OF THE VOYAGE · SHOWCASED IN SKYPIEA',
    items: projects.map((p, i) => ({title: p.title, description: p.description, technologies: p.tags, github: p.github, demo: p.demo, tag: p.badge, anchor: 'project-' + (i + 1)}))
  },
  {label: 'MORE FROM THE LOGBOOK', items: data.archive.more}
];
const projectTotal = archiveGroups.reduce((sum, group) => sum + group.items.length, 0);

const ledger = `<div class="sky-ledger spatial-moment" data-side="left"><span class="eyebrow">THE SKY LEDGER · BEFORE YOU SAIL ON</span><div class="ledger-row">`
  + `<a class="ledger-tile" href="${esc(data.stats.profile)}" target="_blank" rel="noopener noreferrer"><b>${pad(data.stats.repos)}</b><span>Public repositories</span><small>${esc(data.stats.reposNote)} ↗</small></a>`
  + `<button class="ledger-tile" id="archive-open" type="button" aria-haspopup="dialog"><b>${pad(projectTotal)}</b><span>Projects built</span><small>Open the full list ↗</small></button>`
  + `<a class="ledger-tile" href="#project-1"><b>${pad(projects.length)}</b><span>Best of the voyage</span><small>Showcased below ↓</small></a>`
  + `</div><ol class="ledger-best">${projects.map((p, i) => `<li><a href="#project-${i + 1}">${esc(p.title)}</a>${p.badge ? `<small>${esc(p.badge)}</small>` : ''}</li>`).join('')}</ol></div>`;

const discoveries = projects.map((p, i) => {
  const first = p.media[0];
  const visual = first.src
    ? `<img src="${esc(first.src)}" alt="${esc(first.alt || p.title)}" loading="lazy" width="${first.width || 960}" height="${first.height || 600}">`
    : `<span class="placeholder-art" aria-hidden="true"><span class="artifact-cross">✧</span><span class="artifact-number">${pad(i + 1)}</span><span class="placeholder-word">A WINDOW INTO<br><em>${esc(p.title)}</em></span><span class="placeholder-status">SCREENSHOT COMING SOON</span></span>`;
  const cue = first.src ? (p.media.length > 1 ? `View ${p.media.length} screens ↗` : 'Explore artifact ↗') : 'Read the story ↗';
  return `<article class="project-entry discovery spatial-moment" data-side="${i % 2 ? 'right' : 'left'}" data-composition="${['balanced', 'elevated', 'wide'][i % 3]}" id="project-${i + 1}">`
    + `<div class="discovery-copy"><span class="eyebrow">DISCOVERY ${pad(i + 1)} / ${pad(projects.length)} · SKYPIEA</span>`
    + (p.badge ? `<span class="project-badge">${esc(p.badge)}</span>` : '')
    + `<h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>`
    + `<ul class="highlights">${(p.highlights || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
    + `<div class="tags">${p.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>`
    + `<div class="project-links">${p.links.map(link => external(link.url, link.label)).join('')}</div></div>`
    + `<figure class="project-artifact"><span class="artifact-coordinate">SKY ARCHIVE / ${pad(i + 1)}</span>`
    + `<button class="artifact-open" data-project="${i}" aria-label="Explore ${esc(p.title)} visual${first.src ? '' : ' placeholder'}">${visual}<span class="artifact-cue">${cue}</span></button>`
    + `<figcaption>${esc(first.caption || 'Project screenshot')}</figcaption></figure></article>`;
});

replace('projects-intro', `<p>${pad(data.stats.repos)} repositories, ${projectTotal} projects, and the five I would stake the ship on.</p>`);
replace('projects', ledger + discoveries.join(''));

replace('archive', archiveGroups.map(group =>
  `<section class="archive-group"><h3 class="eyebrow">${esc(group.label)} · ${pad(group.items.length)}</h3>`
  + (group.note ? `<p class="archive-note">${esc(group.note)}</p>` : '')
  + `<ul class="archive-grid">${group.items.map(item => {
    const links = [
      item.anchor ? `<a class="project-link" href="#${item.anchor}" data-archive-jump>See it in Skypiea ↓</a>` : '',
      item.github ? external(item.github, 'GitHub') : '',
      item.demo ? external(item.demo, 'Live') : ''
    ].join('');
    return `<li class="archive-card">`
      + (item.thumb ? `<img src="${esc(item.thumb.src)}" alt="${esc(item.thumb.alt)}" loading="lazy" width="${item.thumb.width}">` : '')
      + (item.tag ? `<span class="project-badge">${esc(item.tag)}</span>` : '')
      + `<h4>${esc(item.title)}</h4><p>${esc(item.description)}</p>`
      + `<div class="tags">${(item.technologies || []).map(tag => `<span>${esc(tag)}</span>`).join('')}</div>`
      + (links ? `<div class="project-links">${links}</div>` : '') + `</li>`;
  }).join('')}</ul></section>`).join(''));

// Egghead: certifications and the current role.
replace('certifications', `<ul class="cert-list">${data.certifications.map(c => `<li><strong>${esc(c.issuer)}</strong><span>${esc(c.title)}</span></li>`).join('')}</ul>`);
const role = data.currentRole;
replace('current-role', `<article class="log-entry spatial-moment" data-side="left"><span class="eyebrow">CURRENT EXPERIENCE / ${esc(role.dates)}</span><h3>${esc(role.title)}</h3><p class="organisation">${esc(role.company)} · ${esc(role.location)}</p><p>${esc(role.description)}</p></article>`);

// Counts that appear outside the marked regions.
html = html.replace(/<b>\d+<\/b>Featured projects/, `<b>${pad(projectTotal)}</b>Projects built`);
html = html.replace(/<b>\d+<\/b>Projects built/, `<b>${pad(projectTotal)}</b>Projects built`);
html = html.replace(/<small>Projects(?: · \d+)? ↗<\/small>/, `<small>Projects · ${projectTotal} ↗</small>`);

if (process.argv.includes('--check')) {
  if (html !== fs.readFileSync(file, 'utf8')) {
    console.error('index.html is out of date with content.json. Run: npm run build:content');
    process.exit(1);
  }
  console.log('index.html matches content.json.');
} else {
  fs.writeFileSync(file, html);
  console.log('Updated portfolio content.');
}
