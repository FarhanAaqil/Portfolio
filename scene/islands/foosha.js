// Foosha Village: the windmill village on Dawn Island where the voyage starts.
// Rolling green hills, white houses with orange roofs, Party's Bar by the harbour,
// windmills on the ridges and the forest climbing toward Mt. Colubo behind.
import {T, rand, range, pick, v3} from '../kit.js';
import {terrain, hill, house, tree, rock, sign} from '../props.js';

export const view = {dock: [14, 30], aim: 5, eye: [22, 17, 26]};

export function build(kit) {
  const {group, box, cyl, cone, sphere, rod, batch} = kit, island = new T.Group();
  island.name = 'Foosha Village';

  const ground = terrain(island, {
    radius: 22,
    coast: a => 1 + .08 * Math.sin(a * 3 + .6) + .05 * Math.cos(a * 7) - .16 * Math.exp(-((a - 1.05) ** 2) * 9),   // the harbour bay
    height: (x, z) => 1.5 + hill(x, z, -10, -5, 5, 4.2) + hill(x, z, 8, -9, 5.5, 5.6) + hill(x, z, -2, -14, 7, 9.5) + hill(x, z, -14, 6, 4, 2.6) - hill(x, z, 7, 15, 5, 1.6),
    paintGround: (y, x, z) => y < .45 ? '#ead9a6' : y > 7 ? '#4f8a56' : (Math.sin(x * 1.7) + Math.cos(z * 1.3) > .6 ? '#7fb267' : '#8cbd6e')
  });
  const put = (x, z) => [x, ground(x, z), z];

  // The village: whitewashed houses with orange roofs facing the harbour.
  const walls = ['#f6ecd2', '#f3e6c4', '#f7f0de', '#efe0bd'], roofs = ['#d0683c', '#c85f36', '#d9774a'];
  [[-4, 6, .2], [-1.5, 3.5, -.2], [1.6, 2.2, .1], [4.6, 3.4, -.3], [-6.5, 2.5, .5], [-3.6, .2, 0], [.2, -1.2, .3], [3.8, -.4, -.4],
    [7.2, 1.2, -.6], [-8.8, 5.6, .8], [-1.2, 8.6, .1], [6.5, 6.6, -.5], [-6.2, 9.4, .5], [9.6, 4.4, -.9]].forEach(([x, z, facing], i) =>
    house(kit, island, ...put(x, z), {w: range(1.5, 2), d: range(1.3, 1.7), floors: i % 4 === 0 ? 2 : 1, wall: pick(walls), roof: pick(roofs), facing}));

  // Party's Bar, Makino's tavern, right behind the pier.
  const bar = house(kit, island, ...put(3, 9.2), {w: 3, d: 2.2, floors: 2, wall: '#f1e2bb', roof: '#b5512f', facing: .12});
  sign(kit, bar, "PARTY'S BAR", 0, 1.32, 1.16, 2.3, .5, {board: '#3f6b56', ink: '#f7ead0'});
  for (const x of [-1.1, 1.1]) { cyl(x, .28, 1.5, .2, .2, .56, '#8a5a36', bar, 10); cyl(x, .28, 1.5, .21, .21, .06, '#3b2a20', bar, 10); }
  box(0, .06, 1.5, 3.2, .12, .8, '#b89468', bar);

  // Windmills on the ridges.
  const sails = [];
  [[-10, -5, 1.25], [8, -9, 1.4], [-14, 6, 1], [1.5, -6.5, .9]].forEach(([x, z, s]) => {
    const mill = group(island, ...put(x, z), -.4 + rand());
    mill.scale.setScalar(s);
    cyl(0, 2.6, 0, 1.05, 1.6, 5.2, '#f5ecd4', mill, 14); cone(0, 5.9, 0, 1.45, 1.6, '#b5512f', mill, 14);
    box(0, .7, 1.5, .6, 1.3, .1, '#6d4a30', mill); for (const y of [2.4, 3.8]) box(0, y, 1.32 - (y - 2.4) * .14, .4, .5, .08, '#35626f', mill);
    const hub = group(mill, 0, 4.6, 1.35); sails.push(hub);
    cyl(0, 0, 0, .2, .2, .5, '#6d4a30', hub, 8).rotation.x = Math.PI / 2;
    for (let k = 0; k < 4; k++) {
      const arm = group(hub); arm.rotation.z = k * Math.PI / 2 + .3;
      box(0, 2.1, 0, .14, 4.4, .12, '#8a633d', arm); box(.52, 2.5, 0, .9, 3.2, .05, '#f1e6c6', arm);
      for (let j = 0; j < 6; j++) box(.52, 1.1 + j * .56, .03, .94, .05, .06, '#8a633d', arm);
    }
  });

  // Harbour: the pier Luffy set out from, mooring posts, crates and his little boat.
  for (let i = 0; i < 22; i++) box(9, .55, 13.5 + i * .45, 2.6, .16, .4, i % 2 ? '#a9804f' : '#b48a57', island);
  for (let z = 14; z <= 23; z += 3) for (const x of [7.8, 10.2]) cyl(x, .1, z, .13, .16, 1.7, '#6d5236', island, 6);
  for (const [x, z, s] of [[8.4, 14.2, .6], [9.2, 14.6, .5], [8.5, 15, .45]]) box(x, .63 + s / 2, z, s, s, s, '#9a7748', island);
  const dinghy = group(island, 6.4, .1, 20, .5);
  sphere(0, .1, 0, 1, '#b9814c', dinghy, .5, .32, 1.15, 10); box(0, .32, 0, .7, .05, 1.5, '#d9b27a', dinghy); cyl(0, .5, .1, .28, .3, .44, '#8a5a36', dinghy, 10);

  // Pasture fence, the road through the village, coastal rocks and trees.
  for (let i = 0; i < 16; i++) { const [x, y, z] = put(-12 + i * .62, 10.5 - i * .12); box(x, y + .32, z, .08, .64, .08, '#b69968', island); if (i < 15) box(x + .31, y + .5, z - .06, .64, .06, .06, '#b69968', island); }
  for (let i = 0; i < 26; i++) { const t = i / 25, [x, y, z] = put(8.6 - t * 15 + Math.sin(t * 6) * 1.4, 12.5 - t * 9); const stone = cyl(x, y + .03, z, .5, .5, .05, '#d9c79a', island, 7); stone.scale.z = .8; }
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + rand() * .2, r = range(19.5, 21.5); rock(kit, island, Math.cos(a) * r, -.1, Math.sin(a) * r, range(.5, 1.1), '#9aa79a'); }
  for (let i = 0; i < 70; i++) {
    const x = range(-18, 18), z = range(-18, 14), y = ground(x, z);
    if (y < 1.3 || (Math.abs(x) < 11 && z > -3 && z < 11)) continue;
    tree(kit, island, x, y, z, range(.8, 1.4), y > 5.5 || z < -11 ? 'pine' : 'round');
  }
  const surf = new T.Mesh(new T.RingGeometry(21.6, 21.95, 72), new T.MeshBasicMaterial({color: '#dff3e6', transparent: true, opacity: .55, side: T.DoubleSide}));
  surf.rotation.x = -Math.PI / 2; surf.position.y = .08; island.add(surf);

  rod(v3(3, ground(3, 9.2) + 3.2, 9.2), v3(3, ground(3, 9.2) + 4.3, 9.2), .03, '#6d4a30', island);
  batch(island, {exclude: new Set(sails), ink: .9});
  sails.forEach(hub => batch(hub, {ink: .9}));
  return {group: island, tick: now => sails.forEach((hub, i) => { hub.rotation.z = now * .00035 * (i % 2 ? 1 : -1.2); })};
}
