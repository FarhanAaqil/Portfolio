// Water 7, the City of Water: a tiered metropolis built like one enormous
// fountain, canals instead of streets, Galley-La's Dock One on the waterfront,
// and the Sea Train steaming out from Blue Station.
import {T, range, pick, v3} from '../kit.js';
import {flow, house, sign} from '../props.js';

export const view = {dock: [14, 34], aim: 10, eye: [26, 20, 30]};

const STONE = '#e9dcc0', PALE = '#f4ead2', CANAL = '#4fa9b8';

export function build(kit) {
  const {group, box, cyl, cone, sphere, rod, lathe, torus, tube, batch} = kit, city = new T.Group();
  city.name = 'Water 7';
  const water = flow('#5ec0cf', '#f1fdf9', 1.3, 5), still = new T.MeshBasicMaterial({color: CANAL});
  const tiers = [{r: 23, y: 1}, {r: 17.5, y: 4.4}, {r: 12.5, y: 8}, {r: 8, y: 11.8}];

  cyl(0, -1, 0, 23.6, 22, 2.6, '#cfc09f', city, 56);
  tiers.forEach(({r, y}, i) => {
    const base = i ? tiers[i - 1].y : -.2, tall = y - base;
    cyl(0, base + tall / 2, 0, r, r + .5, tall, STONE, city, 56);
    cyl(0, y + .08, 0, r + .25, r + .25, .22, PALE, city, 56);
    // The canal ring that circles each tier, and the falls that spill to the tier below.
    const ring = new T.Mesh(new T.RingGeometry(r - 1.7, r - .5, 64), still); ring.rotation.x = -Math.PI / 2; ring.position.y = y + .21; city.add(ring);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2 + i * .39, fall = new T.Mesh(new T.PlaneGeometry(1.5, tall + .2), water);
      fall.position.set(Math.cos(a) * (r + .32), base + tall / 2 + .1, Math.sin(a) * (r + .32)); fall.rotation.y = Math.PI / 2 - a; city.add(fall);
      const lip = box(Math.cos(a) * (r + .1), y + .1, Math.sin(a) * (r + .1), 2, .5, .7, PALE, city); lip.rotation.y = Math.PI / 2 - a;
    }
    // Arcades along the tier wall.
    const arches = Math.round(r * 2.2);
    for (let k = 0; k < arches; k++) {
      const a = (k + .5) / arches * Math.PI * 2, arch = group(city, Math.cos(a) * (r + .27), base + tall * .45, Math.sin(a) * (r + .27), Math.PI / 2 - a);
      box(0, 0, 0, .7, tall * .62, .1, '#56737a', arch); cyl(0, tall * .31, 0, .35, .35, .1, '#56737a', arch, 10).rotation.x = Math.PI / 2;
    }
    // Townhouses packed shoulder to shoulder, facing outward over the water.
    const inner = (tiers[i + 1]?.r ?? 4.6) + 1.2, count = Math.round(r * 1.75);
    for (let k = 0; k < count; k++) {
      const a = k / count * Math.PI * 2 + i * .2, radius = range(Math.min(inner + 1, r - 3.2), r - 3);
      house(kit, city, Math.cos(a) * radius, y + .2, Math.sin(a) * radius, {w: range(1.3, 1.7), d: 1.5, floors: 2 + (k % 3 === 0 ? 1 : 0), wall: pick(['#f4e7c8', '#f8f0dc', '#ecd9b4', '#f1dfc4']), roof: pick(['#d9793f', '#c9653c', '#3f8f9c', '#d9793f']), facing: Math.PI / 2 - a, chimney: k % 2 === 0});
    }
  });

  // The great fountain that crowns the city and feeds every canal.
  const top = tiers[3].y;
  cyl(0, top + .3, 0, 5.2, 5.4, .6, PALE, city, 40);
  const pool = new T.Mesh(new T.CircleGeometry(5, 40), still); pool.rotation.x = -Math.PI / 2; pool.position.y = top + .62; city.add(pool);
  lathe([[1.6, 0], [1.2, 2.6], [1.5, 4.6], [3.9, 5.6], [4.1, 6.1], [1.2, 6.1], [1, 8.6], [2.5, 9.3], [2.6, 9.7], [.7, 9.7], [.5, 11.4], [.9, 11.8], [0, 12.6]], STONE, city, 0, top + .6, 0, 32);
  for (const [r, y, drop] of [[4, top + 6.6, 6], [2.5, top + 10.2, 3.6], [.75, top + 12.3, 2.2]]) {
    const sheet = new T.Mesh(new T.CylinderGeometry(r, r + .5, drop, 32, 1, true), water); sheet.position.y = y - drop / 2; city.add(sheet);
  }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; tube([v3(0, top + 13, 0), v3(Math.cos(a) * 1.4, top + 14.6, Math.sin(a) * 1.4), v3(Math.cos(a) * 2.6, top + 12.4, Math.sin(a) * 2.6)], .08, '#c9eef0', city, 4); }
  sphere(0, top + 13.3, 0, .5, '#e9ad32', city, 1, 1, 1, 10);

  // Bridges over the outer canal, and gondola-style yagara boats.
  for (let k = 0; k < 8; k++) {
    const a = (k + .5) / 8 * Math.PI * 2, r = tiers[0].r - 1.1, bridge = group(city, Math.cos(a) * r, tiers[0].y + .2, Math.sin(a) * r, -a);
    const span = torus(0, 0, 0, .95, .16, PALE, bridge, Math.PI, 12); span.scale.z = 3.5;
    const boat = group(city, Math.cos(a + .2) * r, tiers[0].y + .3, Math.sin(a + .2) * r, -a + Math.PI / 2);
    sphere(0, 0, 0, 1, '#b9814c', boat, .28, .16, .8, 8); sphere(0, .22, .7, .2, '#4f9a8f', boat, 1, 1.4, 1, 6);
  }

  // Galley-La Company, Dock One: the numbered gate, cranes, and a hull on the slip.
  const dock = group(city, -15.5, 0, 19.5, -.67);
  box(0, 3.6, 0, 11, 7.2, 1.4, '#d9caa6', dock); box(0, 7.5, 0, 11.8, .6, 1.8, '#8a5a36', dock);
  box(0, 2.6, .72, 4.4, 5.2, .1, '#6d4a30', dock); for (const x of [-1.1, 1.1]) box(x, 2.6, .78, .1, 5.2, .1, '#3b2a20', dock);
  sign(kit, dock, '1', 0, 5.2, .82, 3, 3, {board: '#f4ead2', ink: '#1f4f8f', font: 'bold 400px Georgia'});
  sign(kit, dock, 'GALLEY-LA COMPANY', 0, 8.3, .1, 8, .9, {board: '#1f4f8f', ink: '#f4ead2', font: 'bold 54px Georgia'});
  for (const x of [-7.5, 7.5]) {
    const crane = group(dock, x, 0, 4);
    rod(v3(0, 0, 0), v3(0, 9, 0), .28, '#7a5a3c', crane, .2); rod(v3(0, 9, 0), v3(-Math.sign(x) * 5.5, 10.4, 1.5), .16, '#7a5a3c', crane, .12); rod(v3(0, 5.5, 0), v3(-Math.sign(x) * 3.4, 9.9, .9), .1, '#7a5a3c', crane, .1);
    rod(v3(-Math.sign(x) * 5.5, 10.4, 1.5), v3(-Math.sign(x) * 5.5, 5.4, 1.5), .03, '#3b454d', crane, .03, 4); box(-Math.sign(x) * 5.5, 5, 1.5, .9, .8, .9, '#9a7748', crane);
    box(0, .4, 0, 1.6, .8, 1.6, '#b79f84', crane);
  }
  const slip = group(dock, 0, .2, 6);
  box(0, 0, 0, 5.4, .4, 9, '#b89468', slip); rod(v3(0, .7, -4), v3(0, .7, 4), .22, '#8a5a36', slip, .22);
  for (let k = 0; k < 9; k++) for (const side of [-1, 1]) tube([v3(0, .7, -3.6 + k * .9), v3(side * 1.5, 1.2, -3.6 + k * .9), v3(side * 2, 3.2 - Math.abs(k - 4) * .12, -3.6 + k * .9)], .09, '#a9804f', slip, 4);

  // Blue Station and Puffing Tom, the Sea Train, on rails across the open sea.
  const station = group(city, 20, 0, 18, .7);
  box(0, .6, 0, 9, 1.2, 3.4, PALE, station); box(0, 2.3, -.6, 6.6, 2.2, 1.8, '#f4e7c8', station); box(0, 3.7, 0, 9.4, .3, 4, '#3f8f9c', station);
  for (const x of [-4, -2, 0, 2, 4]) cyl(x, 2.3, 1.4, .13, .13, 2.4, '#f6efdc', station, 6);
  sign(kit, station, 'BLUE STATION', 0, 4.4, .6, 5.4, .8, {board: '#1f4f8f', ink: '#f4ead2'});
  const line = new T.CatmullRomCurve3([v3(24, .25, 15), v3(32, .25, 22), v3(46, .25, 26), v3(64, .25, 22), v3(84, .25, 10), v3(110, .25, -6)]);
  for (const side of [-.45, .45]) tube(line.getPoints(40).map((p, i, all) => { const next = all[Math.min(i + 1, all.length - 1)], prev = all[Math.max(i - 1, 0)], n = v3(next.z - prev.z, 0, prev.x - next.x).normalize(); return p.clone().addScaledVector(n, side); }), .07, '#5a6a72', city, 4);
  line.getPoints(60).forEach((p, i) => { if (i % 2 === 0) { const tie = box(p.x, .16, p.z, 1.5, .1, .28, '#8a6a4a', city); tie.rotation.y = Math.atan2(line.getTangent(i / 60).x, line.getTangent(i / 60).z); cyl(p.x, -.5, p.z, .1, .1, 1.3, '#6d5236', city, 5); } });
  const train = group(city);
  const loco = group(train);
  cyl(0, 1.1, .4, .7, .7, 2.6, '#2f6f7c', loco, 14).rotation.x = Math.PI / 2; box(0, 1.25, -1.5, 1.6, 1.9, 1.4, '#2f6f7c', loco); box(0, 2.3, -1.5, 1.9, .2, 1.7, '#c8322b', loco);
  cyl(0, 2.2, 1.1, .22, .3, .9, '#1f2a30', loco, 10); cone(0, .5, 2.1, .9, 1.1, '#c8322b', loco, 4).rotation.set(Math.PI / 2, 0, Math.PI / 4);
  sphere(0, 1.1, 1.72, .68, '#e9ad32', loco, 1, 1, .3, 12); for (const side of [-1, 1]) for (const z of [-1.4, -.2, .9]) cyl(side * .72, .45, z, .42, .42, .16, '#1f2a30', loco, 12).rotation.z = Math.PI / 2;
  for (let k = 0; k < 3; k++) sphere(0, 3.2 + k * .9, 1 - k * .8, .5 + k * .22, '#f4f4ee', loco, 1, .8, 1, 8);
  const cars = [1, 2].map(k => { const car = group(train); box(0, 1.25, 0, 1.6, 1.7, 3.4, k === 1 ? '#f4ead2' : '#d9793f', car); box(0, 2.2, 0, 1.8, .2, 3.6, '#3f8f9c', car); for (const side of [-1, 1]) for (let w = -1; w <= 1; w++) box(side * .81, 1.45, w * 1, .05, .6, .6, '#35626f', car); return car; });

  batch(city, {exclude: new Set([train]), ink: .85});
  [loco, ...cars].forEach(part => batch(part, {ink: .85}));
  const place = (part, t) => { const p = line.getPoint(t), d = line.getTangent(t); part.position.copy(p); part.rotation.y = Math.atan2(d.x, d.z); };
  return {group: city, tick: now => { const t = .12 + .8 * (.5 - .5 * Math.cos(now * .00012)); place(loco, t); cars.forEach((car, k) => place(car, Math.max(0, t - .045 * (k + 1)))); }};
}
