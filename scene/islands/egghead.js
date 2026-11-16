// Egghead, the Island of the Future: a winter island kept warm by science.
// The Fabriophase city sits on the ground, and above it on a bank of island
// cloud rides the Labophase: Vegapunk's laboratory inside a giant cracked egg.
import {T, range, pick, v3} from '../kit.js';
import {terrain, hill, cloud, sign} from '../props.js';

export const view = {dock: [13, 33], aim: 15, eye: [26, 16, 31]};

const SHELL = '#f6f2e6', PINK = '#ef7fa8', CYAN = '#59c6d8', SUN = '#f4c84a';

export function build(kit) {
  const {group, box, cyl, cone, sphere, lathe, torus, tube, batch} = kit, island = new T.Group();
  island.name = 'Egghead';

  const ground = terrain(island, {
    radius: 22,
    coast: a => 1 + .07 * Math.sin(a * 5) + .05 * Math.cos(a * 3 + 1),
    height: (x, z) => 1.8 + hill(x, z, 0, -2, 9, 1.6),
    paintGround: y => y < .5 ? '#eef4f6' : y < 1.5 ? '#dfe9ee' : '#cfd6e4'
  });
  // Ice floes: outside the island's warmth the sea is frozen.
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2 + range(-.1, .1), r = range(23.5, 29), floe = cyl(Math.cos(a) * r, .08, Math.sin(a) * r, range(1, 2.4), range(1.2, 2.6), .35, '#f4fafc', island, 6); floe.rotation.y = a * 3; }
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + .4; cone(Math.cos(a) * 27, 1.6, Math.sin(a) * 27, 1.6, 3.6, '#e4f1f6', island, 5); }

  // Fabriophase: capsule towers, domes, and the transport tubes between them.
  const towers = [];
  for (let i = 0; i < 15; i++) {
    const a = i / 15 * Math.PI * 2 + .2, r = range(11, 17), x = Math.cos(a) * r, z = Math.sin(a) * r, y = ground(x, z), tall = range(3, 7.5), wide = range(1, 1.6), tint = pick([PINK, CYAN, SUN, '#b79adf']);
    if (i % 3 === 2) {
      sphere(x, y, z, wide * 1.7, SHELL, island, 1, .62, 1, 14); torus(x, y + wide * .5, z, wide * 1.75, .09, tint, island).rotation.x = Math.PI / 2;
      cyl(x, y + wide * 1.4, z, .05, .05, 1.6, '#8f9aa8', island, 4); sphere(x, y + wide * 1.4 + .9, z, .18, tint, island, 1, 1, 1, 6);
    } else {
      cyl(x, y + tall / 2, z, wide, wide, tall, SHELL, island, 14); sphere(x, y + tall, z, wide, SHELL, island, 1, 1, 1, 14);
      for (const k of [.3, .62]) cyl(x, y + tall * k, z, wide + .03, wide + .03, .36, tint, island, 14);
      for (let w = 0; w < 5; w++) { const wa = a + Math.PI + (w - 2) * .35; sphere(x + Math.cos(wa) * wide, y + tall * .82, z + Math.sin(wa) * wide, .2, '#35626f', island, 1, 1, 1, 6); }
      towers.push(v3(x, y + tall * .55, z));
    }
  }
  const glass = new T.MeshBasicMaterial({color: '#bfeef2', transparent: true, opacity: .45});
  for (let i = 0; i < towers.length; i++) { const a = towers[i], b = towers[(i + 1) % towers.length], mid = a.clone().lerp(b, .5).add(v3(0, 1.6, 0)); island.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([a, mid, b]), 16, .28, 8), glass)); }
  sign(kit, island, 'EGGHEAD', 9, ground(9, 19) + 2.2, 19, 6, 1.5, {board: '#f6f2e6', ink: '#d9477a', font: 'bold 84px Georgia', facing: .3});
  for (const x of [6.4, 11.6]) cyl(x, ground(9, 19) + .7, 19 - (x - 9) * .3, .1, .1, 1.6, '#8f9aa8', island, 5);

  // The island cloud that holds the Labophase aloft.
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; cloud(kit, island, Math.cos(a) * 9.5, 13.2 + range(-.5, .5), -2 + Math.sin(a) * 9.5, 2.3, '#fbf8ee', 4); }
  sphere(0, 13, -2, 10.5, '#fdfbf3', island, 1, .22, 1, 18);
  const lab = group(island, 0, 14.2, -2);
  cyl(0, .3, 0, 8.6, 9, .8, '#dfe6ee', lab, 32); cyl(0, .8, 0, 8.2, 8.2, .25, CYAN, lab, 32);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .5; sphere(Math.cos(a) * 6.8, 1.2, Math.sin(a) * 6.8, 1.3, SHELL, lab, 1, .7, 1, 12); torus(Math.cos(a) * 6.8, 1.5, Math.sin(a) * 6.8, 1.34, .07, pick([PINK, SUN]), lab).rotation.x = Math.PI / 2; }

  // The egg: lower shell, a jagged crack, and the top of the shell lifted clear.
  const egg = r => [[0, 0], [2.6, .5], [4.6, 2], [5.6, 4.5], [5.9, 7], [5.6, 9.2]].map(([x, y]) => [x * r, y * r]);
  lathe(egg(1), SHELL, lab, 0, .9, 0, 30);
  const teeth = 14;
  for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2, spike = cone(Math.cos(a) * 5.45, 10.9, Math.sin(a) * 5.45, 1.25, 2.2, SHELL, lab, 4); spike.rotation.y = -a; spike.scale.z = .25; }
  const cap = group(lab, .5, 13.4, 0); cap.rotation.z = -.14;
  lathe([[5.2, 0], [4.6, 2.2], [3.3, 4], [1.6, 5], [0, 5.3]], SHELL, cap, 0, 0, 0, 30);
  for (let i = 0; i < teeth; i++) { const a = (i + .5) / teeth * Math.PI * 2, spike = cone(Math.cos(a) * 5.05, -.9, Math.sin(a) * 5.05, 1.2, 2, SHELL, cap, 4); spike.rotation.set(Math.PI, -a, 0); spike.scale.z = .25; }
  // Punk Records glowing through the crack, and the rings of the Frontier Dome.
  const brain = new T.Mesh(new T.SphereGeometry(3.6, 20, 14), new T.MeshBasicMaterial({color: '#ffd9a6'})); brain.position.set(0, 11.6, 0); brain.scale.y = .7; lab.add(brain);
  const rings = [[9.6, .09, PINK, .5, .2], [10.8, .07, CYAN, -.35, .9], [8.6, .06, SUN, 1.2, -.3]].map(([r, t, color, rx, rz]) => { const ring = torus(0, 8.5, 0, r, t * 2.2, color, lab, Math.PI * 2, 64); ring.rotation.set(Math.PI / 2 + rx, 0, rz); return ring; });
  const dome = new T.Mesh(new T.IcosahedronGeometry(26, 2), new T.MeshBasicMaterial({color: '#8fe3ee', wireframe: true, transparent: true, opacity: .16}));
  dome.position.y = 4; island.add(dome);
  for (const [x, z] of [[-6.5, 5.5], [6.8, 4.6]]) { tube([v3(x, 1, z), v3(x * 1.25, 6, z * 1.3), v3(x * 1.05, 12.6, z * 1.1 - 2)], .22, '#8f9aa8', island, 6); box(x * 1.25, 6, z * 1.3, .9, 1.4, .9, CYAN, island); }

  batch(island, {exclude: new Set([...rings, cap]), ink: .85});
  batch(cap, {ink: .85});
  return {group: island, tick: now => { rings.forEach((ring, i) => { ring.rotation.z += .0006 * (i + 1) * (i % 2 ? -1 : 1); }); cap.position.y = 13.4 + Math.sin(now * .0008) * .25; brain.scale.setScalar(1 + Math.sin(now * .002) * .03); brain.scale.y *= .7; }};
}
