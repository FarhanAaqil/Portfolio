// The New World, seen through Wano: a plateau walled in by waterfalls,
// the Flower Capital's castle under a snow-capped peak, torii gates and
// cherry blossom. This is where the voyage ends and the next one is planned.
import {T, range} from '../kit.js';
import {terrain, hill, flow, tree, rock, house} from '../props.js';

export const view = {dock: [12, 33], aim: 13, eye: [25, 15, 30]};

const ROOF = '#3b5566', WALL = '#f6f0e0', RED = '#c8322b', WOODEN = '#5b4334';

export function build(kit) {
  const {group, box, cyl, cone, sphere, torus, batch} = kit, island = new T.Group();
  island.name = 'Wano';
  const TOP = 9;

  // The plateau and the ring of waterfalls that makes Wano so hard to reach.
  cyl(0, TOP / 2 - .6, 0, 19.4, 21, TOP + 1.2, '#74858c', island, 28);
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; rock(kit, island, Math.cos(a) * 21.2, range(.2, 1.4), Math.sin(a) * 21.2, range(1.2, 2.4), '#66777e'); }
  const falls = flow('#7fd0dc', '#ffffff', 1.5, 4);
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + .2, wide = i % 3 === 0 ? 5 : 2.6, sheet = new T.Mesh(new T.PlaneGeometry(wide, TOP + .3), falls);
    sheet.position.set(Math.cos(a) * 20.5, TOP / 2, Math.sin(a) * 20.5); sheet.rotation.y = Math.PI / 2 - a; sheet.rotation.x = 0; island.add(sheet);
    const spray = sphere(Math.cos(a) * 21.4, .2, Math.sin(a) * 21.4, wide * .5, '#f4fbf6', island, 1, .35, 1, 8); spray.rotation.y = -a;
  }
  const plateau = group(island, 0, TOP - 1.6, 0);
  const ground = terrain(plateau, {
    radius: 20.5, segments: 64, rings: 20,
    height: (x, z) => 1.9 + hill(x, z, -3, -9, 7.5, 1.8) + hill(x, z, 8, 2, 5, .8),
    paintGround: (y, x, z) => y < .8 ? '#74858c' : (Math.sin(x * 1.3) * Math.cos(z * 1.9) > .3 ? '#7fae6a' : '#8bb873')
  });

  // The mountain behind the capital, with its snow cap.
  cone(-3, 12.5, -10, 8.5, 22, '#5f7f96', plateau, 9); cone(-3, 20.6, -10, 2.9, 6, '#f6f7f4', plateau, 9);
  for (let i = 0; i < 5; i++) sphere(-3 + range(-4.5, 4.5), 13 + range(-1, 1), -10 + range(-2, 4), 2.2, '#fbf8ee', plateau, 1.6, .35, 1, 8);

  /** One storey of a castle or pagoda: white walls under a sweeping tiled roof. */
  function storey(parent, y, w, h) {
    box(0, y + h / 2, 0, w, h, w * .8, WALL, parent); box(0, y + h * .3, 0, w + .06, .12, w * .8 + .06, WOODEN, parent);
    const eave = cone(0, y + h + .45, 0, w * .98, .9, ROOF, parent, 4); eave.rotation.y = Math.PI / 4; eave.scale.z = .82;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) sphere(sx * w * .68, y + h + .12, sz * w * .56, .16, '#e9b83a', parent, 1, 1, 1, 6);
  }
  // The Flower Capital's castle on its stone base.
  const castle = group(plateau, 1.5, ground(1.5, -1), -1, -.25);
  cyl(0, 1, 0, 4.4, 5.4, 2, '#8f9aa0', castle, 4).rotation.y = Math.PI / 4;
  [[6, 1.8], [4.8, 1.6], [3.7, 1.5], [2.7, 1.4]].reduce((y, [w, h]) => { storey(castle, y, w, h); return y + h + .75; }, 2);
  for (const side of [-1, 1]) { const fin = cone(side * .7, 11.6, 0, .22, .8, '#e9b83a', castle, 5); fin.rotation.z = -side * .5; }
  // A five-storey pagoda and the town around the castle.
  const pagoda = group(plateau, -9, ground(-9, 3), 3);
  [[2.6, 1.1], [2.3, 1], [2, 1], [1.7, .9], [1.4, .9]].reduce((y, [w, h]) => { storey(pagoda, y, w, h); return y + h + .6; }, 0);
  cyl(0, 9.4, 0, .05, .05, 1.8, '#e9b83a', pagoda, 5);
  [[7.5, 5.5], [9.8, 2.2], [5.2, 8.2], [-3.5, 7.4], [-6.2, 9.6], [11.4, -2.6], [-12.2, -1.4], [2.2, 10.4], [-1, 5.2], [12.4, 6.2], [-9.4, 9]].forEach(([x, z], i) =>
    house(kit, plateau, x, ground(x, z), z, {w: range(1.6, 2.1), d: 1.5, wall: i % 2 ? '#e9dfc8' : '#d9c9a6', roof: i % 3 ? '#4a5f6e' : '#5b4334', trim: WOODEN, facing: range(-.5, .5), chimney: false}));

  /** A vermilion torii gate. */
  function torii(parent, x, y, z, s, facing = 0) {
    const g = group(parent, x, y, z, facing); g.scale.setScalar(s);
    for (const side of [-1, 1]) cyl(side * 1.5, 1.7, 0, .16, .2, 3.4, RED, g, 8);
    box(0, 3.5, 0, 4.4, .28, .36, RED, g); box(0, 3.78, 0, 4.9, .22, .46, '#2a2f36', g); box(0, 2.8, 0, 3.5, .2, .26, RED, g); box(0, 3.15, 0, .3, .5, .2, RED, g);
  }
  torii(plateau, 4, ground(4, 15), 15, 1.25, .1); torii(plateau, 3.4, ground(3.4, 9.5), 9.5, 1);
  torii(island, 9, 0, 24.5, 1.5, .1);                                                   // standing in the sea, at the foot of the falls
  // An arched red bridge, stone lanterns and cherry blossom everywhere.
  const bridge = group(plateau, -3, ground(-3, 11.5) + .1, 11.5, .5);
  const span = torus(0, -.4, 0, 2.2, .22, RED, bridge, Math.PI, 14); span.scale.z = 4; for (const x of [-1.9, 1.9]) cyl(x, .5, 0, .1, .1, 1, RED, bridge, 6);
  for (const [x, z] of [[2.2, 12.6], [5.8, 12.4], [2.6, 7.2], [5.2, 7]]) { const y = ground(x, z); cyl(x, y + .5, z, .1, .14, 1, '#9aa3a6', plateau, 6); box(x, y + 1.15, z, .42, .36, .42, '#ffe08a', plateau); cone(x, y + 1.5, z, .4, .3, '#74858c', plateau, 4).rotation.y = Math.PI / 4; }
  for (let i = 0; i < 46; i++) {
    const x = range(-17, 17), z = range(-16, 17), y = ground(x, z);
    if (Math.hypot(x, z) > 17.5 || Math.hypot(x - 1.5, z + 1) < 5.5 || Math.hypot(x + 3, z + 10) < 8 || Math.hypot(x + 9, z - 3) < 2.6) continue;
    tree(kit, plateau, x, y, z, range(.8, 1.3), i % 4 === 0 ? 'pine' : 'sakura');
  }
  // Koi climbing the great waterfall, the only way in.
  const koi = [0, 1, 2].map(i => { const fish = group(island, 6.5 + i * 1.6, 0, 20.9); sphere(0, 0, 0, .5, i % 2 ? '#f6f0e0' : '#e8742c', fish, .5, 1.5, .5, 8); cone(0, -.95, 0, .36, .6, i % 2 ? '#e8742c' : '#f6f0e0', fish, 4); return fish; });

  batch(island, {exclude: new Set(koi), ink: .85});
  koi.forEach(fish => batch(fish, {ink: .6}));
  return {group: island, tick: now => koi.forEach((fish, i) => { fish.position.y = ((now * .0011 + i * 3.1) % 9.5); })};
}
