// Skypiea: the White-White Sea, Angel Island's cloud town, Heaven's Gate, and
// Upper Yard, the piece of Jaya that was blown into the sky, with the ruins of
// Shandora, Giant Jack twisting upward, and the Golden Belfry at its top.
import {T, rand, range, v3} from '../kit.js';
import {terrain, hill, tree, cloud, sign} from '../props.js';

// The ship circles the island at this radius, so everything else stays inside it.
export const view = {dock: [12, 29], aim: 12, eye: [24, 24, 24]};

const CLOUD = '#fbf8ee', GOLD = '#e9b83a';

export function build(kit) {
  const {group, box, cyl, cone, sphere, tube, lathe, torus, batch} = kit, sky = new T.Group();
  sky.name = 'Skypiea';

  // The White-White Sea: a cloud ocean the Sunny can sail on.
  const sea = kit.mesh(new T.CircleGeometry(92, 80), '#f6f3e7', 0, -.35, 0, sky); sea.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 54; i++) { const a = i / 54 * Math.PI * 2, r = range(84, 96); sphere(Math.cos(a) * r, range(-3, -1.4), Math.sin(a) * r, range(8, 12), '#f6f3e7', sky, 1.5, .42, 1.2, 10); }
  for (let i = 0; i < 34; i++) { const a = rand() * Math.PI * 2, r = range(36, 80); sphere(Math.cos(a) * r, -.9, Math.sin(a) * r, range(2.2, 4.6), CLOUD, sky, 1.6, .3, 1.1, 8); }

  // Upper Yard: earth and giant jungle in a world made of cloud.
  const yard = group(sky, -2, 0, -3);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; sphere(Math.cos(a) * 14.5, .4, Math.sin(a) * 14.5, range(3, 4.4), CLOUD, yard, 1.3, .5, 1, 9); }
  const ground = terrain(yard, {
    radius: 15, segments: 56, rings: 18,
    coast: a => 1 + .1 * Math.sin(a * 4 + 1) + .06 * Math.cos(a * 9),
    height: (x, z) => 3.4 + hill(x, z, -5, -5, 6, 3.2) + hill(x, z, 6, 2, 5, 1.6),
    paintGround: (y, x, z) => y < 1.6 ? '#8a6a45' : y < 2.6 ? '#9a7a4e' : (Math.sin(x * 2.1) * Math.cos(z * 1.7) > .2 ? '#4f8f4f' : '#5c9c57')
  });
  for (let i = 0; i < 26; i++) { const x = range(-11, 11), z = range(-11, 11); if (Math.hypot(x, z) > 11.5 || Math.hypot(x - 5.5, z - 4) < 4.6 || Math.hypot(x + 5, z + 5) < 3) continue; tree(kit, yard, x, ground(x, z) - .2, z, range(.55, .9), 'giant'); }

  // Shandora, the city of gold: a stepped pyramid and fallen colonnades.
  const ruins = group(yard, 5.5, ground(5.5, 4), 4, -.4);
  for (let i = 0; i < 5; i++) box(0, .45 + i * .9, 0, 6.4 - i * 1.25, .9, 6.4 - i * 1.25, i % 2 ? '#c9bb93' : '#d6c9a1', ruins);
  box(0, 4.9, 0, 1.1, .9, 1.1, '#bfb089', ruins); for (let i = 0; i < 9; i++) box(0, .2 + i * .45, 3.3 - i * .31, 1.5, .25, .5, '#e0d4ad', ruins);
  for (const [x, z, h] of [[-4.2, 2.6, 3.2], [-4.2, .6, 2.2], [-4.2, -1.4, 3.4], [4.2, 2.8, 1.6], [4.3, -1, 3]]) { cyl(x, h / 2, z, .36, .42, h, '#d6c9a1', ruins, 10); cyl(x, h + .1, z, .52, .52, .2, '#c9bb93', ruins, 10); }
  cyl(4.6, .35, .9, .36, .36, 2.6, '#c9bb93', ruins, 10).rotation.z = Math.PI / 2;

  // Giant Jack: twin beanstalks spiralling up through the cloud layers.
  const jack = group(yard, -5, ground(-5, -5), -5);
  for (const phase of [0, Math.PI]) tube(Array.from({length: 40}, (_, i) => { const t = i / 39, a = t * 9 + phase, r = 1.5 - t * .5; return v3(Math.cos(a) * r, t * 34, Math.sin(a) * r); }), 1.1, phase ? '#4f9a58' : '#5aa862', jack, 8);
  for (let i = 0; i < 16; i++) { const t = (i + .5) / 16, a = t * 9 + (i % 2) * Math.PI, leaf = sphere(Math.cos(a) * 3.3, t * 33, Math.sin(a) * 3.3, 1.9, '#68b566', jack, 1, .12, .5, 8); leaf.rotation.y = -a; leaf.rotation.z = .3; }
  for (const [y, s] of [[14, 3], [24, 2.6]]) for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cloud(kit, jack, Math.cos(a) * 4.6, y, Math.sin(a) * 4.6, s * .6, CLOUD, 3); }
  // The Golden Belfry on the cloud at the very top.
  const belfry = group(jack, 0, 34.5, 0);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; cloud(kit, belfry, Math.cos(a) * 3.6, -.6, Math.sin(a) * 3.6, 1.5, CLOUD, 3); }
  cyl(0, .1, 0, 3.6, 3.9, .7, '#d9a92f', belfry, 20); cyl(0, .55, 0, 3.2, 3.2, .25, GOLD, belfry, 20);
  for (const [x, z] of [[-2.3, -1.6], [2.3, -1.6], [-2.3, 1.6], [2.3, 1.6]]) { cyl(x, 3, z, .28, .34, 4.8, GOLD, belfry, 10); cyl(x, 5.5, z, .46, .46, .3, '#d9a92f', belfry, 10); }
  box(0, 5.9, 0, 5.8, .5, 4.2, GOLD, belfry); cone(0, 7.1, 0, 3.8, 2, '#d9a92f', belfry, 4).rotation.y = Math.PI / 4;
  const bell = group(belfry, 0, 5.6, 0);
  lathe([[1.75, -3.5], [1.5, -3.2], [1.25, -1.8], [.95, -.7], [.5, -.25], [0, -.15]], '#f1c84a', bell, 0, 0, 0, 22); torus(0, -3.45, 0, 1.75, .14, GOLD, bell).rotation.x = Math.PI / 2;
  sphere(0, -3.3, 0, .32, '#b98a22', bell, 1, 1, 1, 8); cyl(0, -.05, 0, .12, .12, .5, '#b98a22', bell, 6);

  // Angel Island: Lovely Street's dome houses on their own bank of island cloud.
  const angel = group(sky, 17, 0, 11);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; sphere(Math.cos(a) * 5.4, .2, Math.sin(a) * 5.4, range(2.6, 3.6), CLOUD, angel, 1.3, .5, 1, 9); }
  sphere(0, .2, 0, 6.2, '#fdfbf3', angel, 1, .3, 1, 16);
  [[0, 0, 1.3, '#e98aa8'], [2.9, 1.4, 1, '#6fb8d8'], [-2.8, 1.1, 1, '#f1c84a'], [1.4, -2.9, .9, '#8fcf8a'], [-1.9, -2.6, 1.05, '#e9a15c'], [3.6, -1.4, .8, '#b79adf'], [-3.9, -.9, .8, '#6fb8d8']].forEach(([x, z, s, roof]) => {
    const home = group(angel, x, 2, z); home.scale.setScalar(s);
    cyl(0, .7, 0, 1.05, 1.15, 1.4, '#fdfbf3', home, 14); sphere(0, 1.4, 0, 1.12, roof, home, 1, .72, 1, 14); sphere(0, 2.25, 0, .16, GOLD, home, 1, 1, 1, 6);
    box(0, .5, 1.1, .46, .9, .1, '#8a6a45', home); for (const side of [-1, 1]) sphere(side * .62, .85, .86, .2, '#6fb8d8', home, 1, 1, .4, 8);
  });
  for (const [x, z] of [[1.4, 2.6], [-1.2, 2.9], [4.4, .6]]) { cyl(x, 2.7, z, .04, .04, 1.4, '#8a6a45', angel, 5); cone(x, 3.5, z, .8, .5, x > 0 ? '#e98aa8' : '#f1c84a', angel, 10); }
  // The Milky Road, a ribbon of cloud looping from the town up into Upper Yard.
  tube([v3(12, 1.6, 9), v3(8, 4, 11), v3(3, 7, 9), v3(-1, 6, 4), v3(1, 4.6, -1)], .55, CLOUD, sky, 7);

  // Heaven's Gate, standing in the cloud sea across the Sunny's course.
  const r = Math.hypot(...view.dock), a = 3.6, gate = group(sky, Math.cos(a) * r, 0, Math.sin(a) * r, -a + Math.PI);
  for (const side of [-1, 1]) { cyl(side * 5.4, 4, 0, 1, 1.25, 8.4, '#f3ecd8', gate, 12); cyl(side * 5.4, 8.5, 0, 1.4, 1.4, .5, GOLD, gate, 12); for (let i = 0; i < 5; i++) sphere(side * 5.4 + range(-1, 1), .2, range(-1.4, 1.4), 1.6, CLOUD, gate, 1.2, .5, 1, 8); }
  const arch = torus(0, 8.4, 0, 5.4, .8, '#f3ecd8', gate, Math.PI, 20); arch.scale.y = .62;
  sign(kit, gate, "HEAVEN'S GATE", 0, 12.6, 0, 7.4, 1.3, {board: '#fbf7ea', ink: '#a9781f', font: 'bold 56px Georgia'}).material.side = T.DoubleSide;

  batch(sky, {exclude: new Set([bell]), ink: .85});
  batch(bell, {ink: .85});
  return {group: sky, tick: now => { bell.rotation.z = Math.sin(now * .0014) * .16; }};
}
