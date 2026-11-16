// Reverse Mountain: the Red Line, with the canals of the four Blues running up
// the mountain into the clouds and one canal pouring down into the Grand Line.
// At its foot are the Twin Capes, Crocus's lighthouse, and Laboon waiting.
import {T, paint, rand, range, v3} from '../kit.js';
import {flow, ramp, rock, cloud, tree} from '../props.js';

export const view = {dock: [13, 40], aim: 19, eye: [30, 20, 44]};

export function build(kit) {
  const {group, box, cyl, cone, sphere, rod, lathe, torus, panel, batch} = kit, land = new T.Group();
  land.name = 'Reverse Mountain';
  const reds = ['#9b4f3a', '#8a4533', '#a65a41', '#934a38'];

  // The Red Line: a continental wall of red rock running out of sight to either side.
  for (let i = -11; i <= 11; i++) for (let row = 0; row < 2; row++) {
    const tall = range(20, 30) + (Math.abs(i) < 3 ? 12 : 0) - row * 6, r = range(5.5, 7.5);
    const crag = cyl(i * 7.2 + range(-1.5, 1.5), tall / 2 - 1, -10 + row * 7 + range(-1.5, 1.5), r * .62, r, tall, reds[(i + 11 + row) % 4], land, 6);
    crag.rotation.y = rand() * 2;
  }
  // The mountain itself, its summit lost in cloud.
  cyl(0, 20, -9, 7, 17, 42, '#8a4533', land, 7); cyl(0, 47, -9, 3.2, 7, 12, '#9b4f3a', land, 7); cone(0, 58, -9, 3.2, 10, '#a65a41', land, 7);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; cloud(kit, land, Math.cos(a) * 9, 46 + range(-1.5, 1.5), -9 + Math.sin(a) * 7, 2.4, '#fbf8ee', 4); }
  for (let i = 0; i < 14; i++) rock(kit, land, range(-30, 30), range(0, .6), range(-2, 4), range(1.2, 2.6), reds[i % 4]);

  // Canals. Three climb the slopes from the Blues; the fourth runs down to the Grand Line.
  const river = flow('#5fc3d4', '#eefcf7', 1.6, 12), summit = v3(0, 43, -6);
  ramp(kit, land, summit, v3(0, .4, 17), 3.4, river);                                   // down, toward the ship
  ramp(kit, land, v3(-44, .5, 3), v3(-3, 43, -6), 2.6, river);                          // up from one Blue
  ramp(kit, land, v3(44, .5, 3), v3(3, 43, -6), 2.6, river);                            // up from another
  for (const [y, z] of [[34, -1.3], [22, 5], [9, 12.3]]) {                              // stone gates over the main canal
    const gate = group(land, 0, y, z); gate.rotation.x = .25;
    for (const side of [-1, 1]) box(side * 2.6, 1.6, 0, .9, 4.2, 1.2, '#e6d9bd', gate);
    box(0, 4, 0, 6.6, .9, 1.4, '#d9caa8', gate); box(0, 4.7, 0, 7.4, .4, 1.7, '#b5512f', gate);
  }
  const mouth = torus(0, .2, 18.4, 2.6, .5, '#f4fbf6', land); mouth.rotation.x = Math.PI / 2; mouth.scale.z = .6;

  // The Twin Capes.
  for (const side of [-1, 1]) {
    const cape = group(land, side * 16, 0, 19);
    sphere(0, -.6, 0, 7, '#8f8a7c', cape, 1.25, .42, 1, 14); sphere(0, 1.2, 0, 5.4, '#84b068', cape, 1.2, .22, .95, 12);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; rock(kit, cape, Math.cos(a) * 7.6, .2, Math.sin(a) * 6, range(.8, 1.5)); }
    for (let i = 0; i < 4; i++) tree(kit, cape, range(-4, 4), 2.1, range(-3, 0), range(.8, 1.1), side > 0 ? 'round' : 'pine');
  }
  // Crocus's lighthouse on the eastern cape.
  const light = group(land, 17, 2.2, 20);
  lathe([[1.7, 0], [1.35, 4], [1.15, 8.2]], '#f6efdc', light, 0, 0, 0, 16);
  for (const y of [2.2, 5.6]) cyl(0, y, 0, 1.62 - y * .062, 1.7 - y * .062, 1.1, '#c8322b', light, 16);
  cyl(0, 8.3, 0, 1.75, 1.75, .25, '#3b454d', light, 16); cyl(0, 9.1, 0, .95, .95, 1.4, '#ffe08a', light, 12); cone(0, 10.5, 0, 1.35, 1.4, '#c8322b', light, 12);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; cyl(Math.cos(a) * 1.65, 8.8, Math.sin(a) * 1.65, .04, .04, .8, '#3b454d', light, 4); }
  box(0, .9, 1.7, .7, 1.5, .12, '#6d4a30', light);
  box(-3.4, .8, .6, 2.4, 1.6, 2, '#efe2c2', light); cone(-3.4, 2.3, .6, 2, 1.4, '#b5512f', light, 4).rotation.y = Math.PI / 4;

  // Laboon, the island whale, upright in the water with the crew's mark on his scarred brow.
  const whale = group(land, -6, 0, 27);
  whale.rotation.x = -.1;
  lathe([[3.9, -4], [4.4, 1], [4.3, 5.5], [3.6, 8.6], [2.2, 10.6], [0, 11.4]], '#34466b', whale, 0, 0, 0, 22);
  sphere(0, 3, 2.3, 3.3, '#f1ead6', whale, .9, 1.9, .55, 14);                         // pale belly
  for (const side of [-1, 1]) { sphere(side * 3.5, 6.2, 2.2, .34, '#fbf7ea', whale, 1, 1, .5, 8); sphere(side * 3.55, 6.2, 2.4, .17, '#1b2229', whale, 1, 1, .5, 6); sphere(side * 4.6, 2.5, 0, 2.2, '#34466b', whale, .3, 1, .6, 10); }
  for (let i = 0; i < 7; i++) rod(v3(range(-2.2, 2.2), range(8.2, 10.4), 3.2 - range(0, 1.2)), v3(range(-2.2, 2.2), range(8.2, 10.4), 3.2 - range(0, 1.2)), .06, '#c9c2b4', whale, .06, 4);
  const mark = panel(paint(256, 256, c => {
    c.strokeStyle = '#f6efdc'; c.fillStyle = '#f6efdc'; c.lineWidth = 16; c.lineCap = 'round';
    for (const d of [1, -1]) { c.beginPath(); c.moveTo(48, 128 - 70 * d); c.lineTo(208, 128 + 70 * d); c.stroke(); }
    c.beginPath(); c.arc(128, 132, 52, 0, Math.PI * 2); c.fill(); c.fillRect(100, 170, 56, 34);
    c.fillStyle = '#34466b'; for (const d of [-1, 1]) { c.beginPath(); c.arc(128 + d * 20, 134, 12, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#ecc353'; c.beginPath(); c.ellipse(128, 96, 84, 16, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(128, 92, 46, 34, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = '#c0322b'; c.fillRect(82, 80, 92, 12);
  }), 3.6, 3.6, whale, 0, 7.6, 3.9);
  mark.rotation.x = -.38;
  const foam = torus(0, .25, 0, 4.9, .5, '#f4fbf6', whale); foam.rotation.x = Math.PI / 2;
  const spout = new T.Mesh(new T.CylinderGeometry(.9, .25, 4.5, 10, 1, true), flow('#bfe9ee', '#ffffff', 2.4, 3));
  spout.position.set(0, 13.4, -.6); whale.add(spout);

  batch(land, {exclude: new Set([whale]), ink: .9});
  batch(whale, {ink: .9});
  return {group: land, tick: now => { whale.position.y = Math.sin(now * .0009) * .35; spout.scale.y = 1 + Math.sin(now * .004) * .12; }};
}
