import {normalizeProjects} from './project-content.js';
import fs from 'node:fs';
const file=new URL('./index.html',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('./content.json',import.meta.url),'utf8'));
data.projects=normalizeProjects(data.projects);
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let html=fs.readFileSync(file,'utf8');
function replace(name,content){const expression=new RegExp('<!--content:'+name+':start-->[\\s\\S]*?<!--content:'+name+':end-->');if(!expression.test(html))throw new Error('Missing content marker: '+name);html=html.replace(expression,()=>`<!--content:${name}:start-->${content}<!--content:${name}:end-->`);}
const stations=['THE SHIPYARD','THE BRIDGE','THE CANALS','THE WORKSHOP','THE SIGNAL TOWER'];
replace('skills','<div class="skill-list">'+Array.from({length:Math.ceil(data.skills.length/2)},(_,i)=>'<div class="skill-stop spatial-moment" data-side="'+(i%2?'right':'left')+'"><span class="eyebrow">WORKSHOP '+String(i+1).padStart(2,'0')+' / '+stations[i%stations.length]+'</span>'+data.skills.slice(i*2,i*2+2).map(([h,p])=>'<div><h3>'+esc(h)+'</h3><p>'+esc(p)+'</p></div>').join('')+'</div>').join('')+'</div>');
replace('projects',data.projects.map((p,i)=>{
const media=p.media?.length?p.media:[{src:null,caption:'Screenshot coming soon',alt:p.title+' — screenshot placeholder'}];
const first=media[0],visual=first.src?'<img src="'+esc(first.src)+'" alt="'+esc(first.alt||p.title)+'" loading="lazy" width="'+(first.width||960)+'" height="'+(first.height||600)+'">':'<span class="placeholder-art" aria-hidden="true"><span class="artifact-cross">✧</span><span class="artifact-number">'+String(i+1).padStart(2,'0')+'</span><span class="placeholder-word">A WINDOW INTO<br><em>'+esc(p.title)+'</em></span><span class="placeholder-status">SCREENSHOT COMING SOON</span></span>';
return '<article class="project-entry discovery spatial-moment" data-side="'+(i%2?'right':'left')+'" data-composition="'+['balanced','elevated','wide'][i%3]+'" data-prominence="'+esc(p.prominence||'standard')+'" id="project-'+(i+1)+'"><div class="discovery-copy"><span class="eyebrow">DISCOVERY '+String(i+1).padStart(2,'0')+' / '+String(data.projects.length).padStart(2,'0')+' · SKYPIEA</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p>'+(p.highlights?'<ul class="highlights">'+p.highlights.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'<div class="tags">'+p.tags.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><div class="project-links">'+p.links.map(l=>'<a class="project-link" href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">'+esc(l.label)+' ↗</a>').join('')+'</div></div><figure class="project-artifact"><span class="artifact-coordinate">SKY ARCHIVE / '+String(i+1).padStart(2,'0')+'</span><button class="artifact-open" data-project="'+i+'" aria-label="Explore '+esc(p.title)+' visual'+(first.src?'':' placeholder')+'">'+visual+'<span class="artifact-cue">Explore artifact ↗</span></button><figcaption>'+esc(first.caption||'Project screenshot')+'</figcaption></figure></article>';}).join(''));
replace('certifications','<ul class="cert-list">'+data.certifications.map(c=>`<li><strong>${esc(c.issuer)}</strong><span>${esc(c.title)}</span></li>`).join('')+'</ul>');
const r=data.currentRole;replace('current-role',`<article class="log-entry spatial-moment" data-side="left"><span class="eyebrow">CURRENT EXPERIENCE / ${esc(r.dates)}</span><h3>${esc(r.title)}</h3><p class="organisation">${esc(r.company)} · ${esc(r.location)}</p><p>${esc(r.description)}</p></article>`);
const count=data.projects.length,word=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'][count]||String(count);
html=html.replace(/<b>\d+<\/b>Featured projects/, '<b>'+String(count).padStart(2,'0')+'</b>Featured projects');
html=html.replace(/Ascend through [^.]+ projects\. Each one a new discovery\./,word+' discoveries. Ascend through '+count+' projects.');
html=html.replace(/(?:Six|Eight|Nine|\d+) discoveries\. Ascend through \d+ projects\./,word+' discoveries. Ascend through '+count+' projects.');
html=html.replace(/<small>Projects(?: · \d+)? ↗<\/small>/,'<small>Projects · '+count+' ↗</small>');
fs.writeFileSync(file,html);console.log('Updated portfolio content.');

