// The Thousand Sunny. Bow points along +z, waterline sits at y = 0.
// Layout follows the ship in the anime: lion figurehead, helm on the foredeck,
// lawn deck with the foremast and crow's nest, galley block aft with the tangerine
// grove on its roof, and the domed library tower at the stern.
import {T, mat, paint, v3} from './kit.js';

const WOOD = '#a9562c', DARKWOOD = '#6e3d22', RED = '#b8322a', CREAM = '#fff1cf', YELLOW = '#f6d684',
  GOLD = '#e9ad32', WHITE = '#fbf7ea', LAWN = '#6aa84f', GLASS = '#3f8696', INK = '#263335';

const LENGTH = 4.1;            // half length of the hull
export const DECK = 1.25;      // lawn deck height
const FORE = 1.78;             // foredeck height

// Hull lines. t runs from -1 (stern) to 1 (bow).
const beam = t => t > 0 ? 1.78 * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.8))) : 1.78 * (1 - .3 * Math.pow(-t, 3));
const sheer = t => 1.62 + .55 * t * t;
const keel = t => -.75 + .55 * Math.pow(Math.max(0, t), 3);
/** Point on the hull skin: t along the ship, s from keel (0) up to the gunwale (1). */
function skin(t, s, side) {
  const a = s * Math.PI / 2;
  return v3(side * beam(t) * Math.pow(Math.sin(a), .7), keel(t) + (sheer(t) - keel(t)) * (1 - Math.pow(Math.cos(a), 1.6)), t * LENGTH);
}

/** A strip of hull between two heights. `inner` builds the inward-facing side of the bulwark. */
function hullBand(s0, s1, color, parent, inner = false) {
  const stations = 40, rows = 6, positions = [], index = [];
  for (const side of [1, -1]) {
    const base = positions.length / 3;
    for (let i = 0; i <= stations; i++) for (let j = 0; j <= rows; j++) {
      const p = skin(-1 + 2 * i / stations, s0 + (s1 - s0) * j / rows, side);
      positions.push(p.x * (inner ? .955 : 1), p.y, p.z * (inner ? .985 : 1));
    }
    for (let i = 0; i < stations; i++) for (let j = 0; j < rows; j++) {
      const a = base + i * (rows + 1) + j, b = a + rows + 1;
      if ((side > 0) !== inner) index.push(a, a + 1, b, b, a + 1, b + 1); else index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(positions.length / 3 * 2), 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  parent.add(new T.Mesh(geometry, mat(color)));
}

/** A flat deck plate that follows the hull outline between two stations. */
function deckPlate(t0, t1, y, color, parent, inset = .93) {
  const outline = [], steps = 18;
  for (let i = 0; i <= steps; i++) { const t = t0 + (t1 - t0) * i / steps; outline.push(new T.Vector2(beam(t) * inset, -t * LENGTH)); }
  for (let i = steps; i >= 0; i--) { const t = t0 + (t1 - t0) * i / steps; outline.push(new T.Vector2(-beam(t) * inset, -t * LENGTH)); }
  const geometry = new T.ShapeGeometry(new T.Shape(outline));
  geometry.rotateX(-Math.PI / 2);
  const plate = new T.Mesh(geometry, mat(color));
  plate.position.y = y;
  parent.add(plate);
}

function jollyRoger(c, cx, cy, s) {
  c.lineCap = 'round';
  for (const pass of [[INK, 34 * s], ['#fffdf2', 22 * s]]) {
    c.strokeStyle = pass[0]; c.lineWidth = pass[1];
    for (const dir of [1, -1]) { c.beginPath(); c.moveTo(cx - 118 * s, cy - 78 * s * dir); c.lineTo(cx + 118 * s, cy + 78 * s * dir); c.stroke(); }
  }
  c.fillStyle = '#fffdf2'; c.strokeStyle = INK; c.lineWidth = 7 * s;
  c.beginPath(); c.ellipse(cx, cy - 6 * s, 76 * s, 70 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.roundRect(cx - 44 * s, cy + 40 * s, 88 * s, 46 * s, 12 * s); c.fill(); c.stroke();
  c.fillStyle = INK;
  for (const dir of [-1, 1]) { c.beginPath(); c.ellipse(cx + dir * 30 * s, cy + 4 * s, 19 * s, 22 * s, 0, 0, Math.PI * 2); c.fill(); }
  c.beginPath(); c.ellipse(cx, cy + 34 * s, 7 * s, 9 * s, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = 5 * s;
  c.beginPath(); c.moveTo(cx - 40 * s, cy + 60 * s); c.lineTo(cx + 40 * s, cy + 60 * s); c.stroke();
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 15 * s, cy + 46 * s); c.lineTo(cx + i * 15 * s, cy + 80 * s); c.stroke(); }
  // The straw hat: brim, crown and the red band.
  c.lineWidth = 7 * s; c.fillStyle = '#edc04f';
  c.beginPath(); c.ellipse(cx, cy - 50 * s, 122 * s, 22 * s, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(cx, cy - 56 * s, 70 * s, 54 * s, 0, Math.PI, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#c0322b'; c.fillRect(cx - 69 * s, cy - 72 * s, 138 * s, 16 * s);
}

function sail(parent, w, h, x, y, z, draw, belly = .6) {
  const geometry = new T.PlaneGeometry(w, h, 22, 16), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, belly * Math.cos(p.getX(i) / w * Math.PI) * (1 - .22 * Math.cos(p.getY(i) / h * Math.PI)));
  geometry.computeVertexNormals();
  const texture = paint(768, 768, (c, cw, ch) => {
    c.fillStyle = '#fff3d4'; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = '#8d77512e'; c.lineWidth = 3;
    for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(i * cw / 8, 0); c.lineTo(i * cw / 8, ch); c.stroke(); }
    draw?.(c, cw, ch);
  });
  const cloth = new T.Mesh(geometry, new T.MeshStandardMaterial({map: texture, side: T.DoubleSide, roughness: 1}));
  cloth.position.set(x, y, z);
  parent.add(cloth);
  return cloth;
}

export function buildSunny(kit) {
  const {group, box, cyl, cone, sphere, torus, rod, tube, lathe, panel, batch} = kit;
  const ship = new T.Group();
  ship.name = 'Thousand Sunny';

  // Hull: timber below, a red wale, and the yellow bulwark the ship is known for.
  hullBand(0, .6, WOOD, ship); hullBand(.6, .74, RED, ship); hullBand(.74, 1, YELLOW, ship); hullBand(.7, 1, CREAM, ship, true);
  const stern = [];
  for (let j = 0; j <= 12; j++) { const p = skin(-1, j / 12, 1); stern.push(new T.Vector2(p.x, p.y)); }
  for (let j = 12; j >= 0; j--) { const p = skin(-1, j / 12, -1); stern.push(new T.Vector2(p.x, p.y)); }
  const transom = new T.Mesh(new T.ShapeGeometry(new T.Shape(stern)).rotateY(Math.PI), mat(WOOD));
  transom.position.z = -LENGTH;
  ship.add(transom);
  for (const x of [-.55, 0, .55]) { box(x, 1.25, -LENGTH - .02, .4, .5, .05, GLASS, ship); box(x, 1.25, -LENGTH - .04, .46, .05, .05, GOLD, ship); box(x, 1.25, -LENGTH - .04, .05, .56, .05, GOLD, ship); }
  for (const s of [.2, .34, .48]) for (const side of [1, -1])                // plank seams
    tube(Array.from({length: 22}, (_, i) => skin(-.98 + 1.94 * i / 21, s, side).multiplyScalar(1.004)), .014, DARKWOOD, ship, 4);
  for (const side of [1, -1]) {
    tube(Array.from({length: 26}, (_, i) => skin(-.99 + 1.97 * i / 25, 1, side)), .075, WHITE, ship, 6);   // gunwale cap
    const rail = Array.from({length: 26}, (_, i) => skin(-.99 + 1.6 * i / 25, 1, side).add(v3(0, .36, 0)));
    tube(rail, .04, WHITE, ship, 5);
    for (let i = 0; i < 26; i += 1) cyl(rail[i].x, rail[i].y - .18, rail[i].z, .028, .028, .36, WHITE, ship, 5);
  }
  box(0, -.1, -LENGTH - .08, .09, 1.5, .5, DARKWOOD, ship);                    // rudder

  // Decks.
  deckPlate(-.98, .5, DECK, '#cfa468', ship);
  deckPlate(.48, .97, FORE, '#cfa468', ship, .9);
  box(0, DECK + .03, .25, 2.5, .06, 3.1, LAWN, ship);                         // the lawn
  box(0, (DECK + FORE) / 2, .48 * LENGTH, 3.05, FORE - DECK, .08, CREAM, ship);   // foredeck bulkhead
  box(0, DECK + .22, .48 * LENGTH + .05, .5, .44, .05, RED, ship);
  for (const side of [1, -1]) for (let i = 0; i < 4; i++) box(side * 1.05, DECK + .07 + i * .13, .48 * LENGTH - .12 - (3 - i) * .13, .55, .13, .13, '#b98952', ship);

  // Soldier Dock System channels on the hull.
  [[1, .28, '1'], [1, -.12, '3'], [1, -.55, '0'], [-1, .28, '2'], [-1, -.12, '4'], [-1, -.55, '0']].forEach(([side, t, digit]) => {
    const at = skin(t, .5, side), ahead = skin(t + .02, .5, side), dock = group(ship, at.x, at.y, at.z);
    dock.rotation.y = Math.atan2(side * (ahead.z - at.z), -side * (ahead.x - at.x));   // face along the hull's outward normal
    torus(0, 0, .03, .42, .07, GOLD, dock);
    const face = panel(paint(128, 128, c => {
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill();
      c.fillStyle = RED; c.font = 'bold 84px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(digit, 64, 70);
    }), .76, .76, dock, 0, 0, .05);
    face.material.side = T.FrontSide;
  });

  // Galley block, with the tangerine grove and flower bed on its roof.
  const galley = group(ship, 0, DECK, -2.15);
  box(0, .8, 0, 2.5, 1.6, 2.2, CREAM, galley);
  box(0, 1.66, 0, 2.9, .14, 2.5, RED, galley);
  box(0, .55, 1.11, .46, 1.02, .05, RED, galley); sphere(.14, .55, 1.15, .035, GOLD, galley);
  for (const x of [-.82, .82]) { box(x, .95, 1.11, .5, .46, .05, GLASS, galley); box(x, .95, 1.13, .56, .05, .05, GOLD, galley); box(x, .95, 1.13, .05, .5, .05, GOLD, galley); }
  for (const side of [1, -1]) for (let i = -1; i <= 1; i++) { const port = torus(side * 1.26, .95, i * .62, .17, .04, GOLD, galley); port.rotation.y = Math.PI / 2; sphere(side * 1.25, .95, i * .62, .15, GLASS, galley, .15, 1, 1); }
  for (const side of [1, -1]) for (let i = 0; i < 9; i++) cyl(side * 1.38, 1.9, -1.1 + i * .29, .025, .025, .36, WHITE, galley, 5);
  for (const side of [1, -1]) box(side * 1.38, 2.09, .06, .05, .05, 2.4, WHITE, galley);
  box(0, 2.09, 1.2, 2.8, .05, .05, WHITE, galley);
  for (let i = -4; i <= 4; i++) cyl(i * .34, 1.9, 1.2, .025, .025, .36, WHITE, galley, 5);
  [[-.85, .5], [.85, .5], [0, -.1]].forEach(([x, z]) => {                    // Nami's tangerine trees
    cyl(x, 2, z, .06, .09, .6, DARKWOOD, galley, 6);
    sphere(x, 2.5, z, .42, '#3f8a4c', galley, 1, .85, 1, 10); sphere(x + .2, 2.68, z + .1, .26, '#57a258', galley, 1, 1, 1, 8);
    for (let i = 0; i < 6; i++) sphere(x + Math.sin(i * 1.9) * .36, 2.42 + Math.cos(i * 2.3) * .2, z + Math.cos(i * 1.9) * .36, .075, '#f59b26', galley, 1, 1, 1, 6);
  });
  box(.3, 1.8, -.75, 1.5, .14, .5, '#8a5a36', galley);                        // Robin's flower bed
  for (let i = 0; i < 9; i++) sphere(-.35 + i * .16, 1.93, -.75 + Math.sin(i * 2) * .12, .07, ['#e86a8f', '#f3d357', '#fbf7ea'][i % 3], galley, 1, 1, 1, 6);

  // Library and bath tower at the stern, under its red dome.
  const tower = group(ship, 0, DECK, -3.35);
  cyl(0, 1.45, 0, .92, .98, 2.9, CREAM, tower, 20);
  for (const y of [.95, 2.2]) { cyl(0, y, 0, .945, .945, .42, GLASS, tower, 20); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(Math.sin(a) * .95, y, Math.cos(a) * .95, .06, .46, .06, GOLD, tower).rotation.y = a; } }
  cyl(0, 2.95, 0, 1.08, 1.08, .12, GOLD, tower, 20);
  lathe([[1.06, 0], [1, .3], [.78, .62], [.42, .86], [0, .95]], RED, tower, 0, 3, 0, 20);
  cyl(0, 4.1, 0, .03, .03, .5, GOLD, tower, 5); sphere(0, 4.38, 0, .08, GOLD, tower, 1, 1, 1, 8);
  for (const side of [1, -1]) { rod(v3(side * .6, 2.2, -.9), v3(side * .6, 2.2, -1.15), .02, DARKWOOD, tower); sphere(side * .6, 2.1, -1.17, .1, '#ffd978', tower, 1, 1.25, 1, 8); }

  // Foremast: wide base on the lawn, the big sail, and the observation dome on top.
  const foreZ = .95, mainZ = -2.05;
  cyl(0, DECK + .3, foreZ, .42, .5, .6, CREAM, ship, 14); cyl(0, DECK + .62, foreZ, .46, .46, .08, RED, ship, 14);
  cyl(0, 5.2, foreZ, .13, .2, 7.4, DARKWOOD, ship, 10);
  rod(v3(-2.75, 7.75, foreZ + .05), v3(2.75, 7.75, foreZ + .05), .075, DARKWOOD, ship, .075);
  rod(v3(-2.5, 3.5, foreZ + .05), v3(2.5, 3.5, foreZ + .05), .055, DARKWOOD, ship, .055);
  sail(ship, 5, 4.2, 0, 5.62, foreZ + .16, (c, w, h) => jollyRoger(c, w / 2, h / 2 + 10, 1.45));
  const nest = group(ship, 0, 8.55, foreZ);
  cyl(0, 0, 0, .82, .66, .3, RED, nest, 16); cyl(0, .45, 0, .8, .8, .6, CREAM, nest, 16); cyl(0, .5, 0, .815, .815, .3, GLASS, nest, 16);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; box(Math.sin(a) * .82, .5, Math.cos(a) * .82, .05, .34, .05, GOLD, nest).rotation.y = a; }
  lathe([[.9, 0], [.84, .2], [.6, .46], [.3, .62], [0, .68]], RED, nest, 0, .75, 0, 16);
  cyl(0, 1.85, 0, .025, .025, .9, DARKWOOD, nest, 5);
  const flag = panel(paint(256, 160, (c, w, h) => { c.fillStyle = '#1d2628'; c.fillRect(0, 0, w, h); jollyRoger(c, w / 2, h / 2 + 8, .52); }), .95, .6, nest, .5, 2, 0);

  // Mainmast through the galley roof, carrying the gaff sail.
  cyl(0, 5.1, mainZ, .1, .15, 5.6, DARKWOOD, ship, 10);
  rod(v3(0, 7.2, mainZ), v3(0, 7.95, mainZ - 2.1), .05, DARKWOOD, ship, .05);
  rod(v3(0, 4.25, mainZ), v3(0, 4.35, mainZ - 2.3), .05, DARKWOOD, ship, .05);
  const cloth = (points, shade) => {
    const geometry = new T.BufferGeometry().setFromPoints(points);
    geometry.setIndex(points.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2]);
    geometry.computeVertexNormals();
    ship.add(new T.Mesh(geometry, new T.MeshStandardMaterial({color: shade, side: T.DoubleSide, roughness: 1})));
  };
  cloth([v3(0, 4.4, mainZ - .1), v3(.18, 4.5, mainZ - 2.2), v3(.1, 7.85, mainZ - 2), v3(0, 7.1, mainZ - .1)], '#fff3d4');
  for (const [z, top] of [[foreZ, 8.2], [mainZ, 7.3]]) for (const side of [1, -1]) {        // shrouds and ratlines
    const feet = [-.5, 0, .5].map(d => skin((z + d) / LENGTH, 1, side).add(v3(0, .05, 0)));
    feet.forEach(foot => rod(foot, v3(side * .12, top, z), .018, '#4f4433', ship, .018, 4));
    for (let k = 1; k < 9; k++) { const f = k / 10; rod(feet[0].clone().lerp(v3(side * .12, top, z), f), feet[2].clone().lerp(v3(side * .12, top, z), f), .012, '#4f4433', ship, .012, 4); }
  }

  // Helm on the foredeck, and the swing and bench on the lawn.
  const helm = group(ship, 0, FORE, 2.35);
  box(0, .3, 0, .16, .6, .16, DARKWOOD, helm);
  const wheel = group(helm, 0, .7, .12);
  torus(0, 0, 0, .3, .035, DARKWOOD, wheel); sphere(0, 0, 0, .07, GOLD, wheel, 1, 1, 1, 8);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; rod(v3(0, 0, 0), v3(Math.cos(a) * .4, Math.sin(a) * .4, 0), .02, DARKWOOD, wheel, .02, 4); }
  cyl(-1.05, DECK + .55, -.55, .07, .1, 1.1, DARKWOOD, ship, 6); sphere(-1.05, DECK + 1.35, -.55, .5, '#3f8a4c', ship, 1, .9, 1, 10);
  rod(v3(-1.05, DECK + 1.05, -.55), v3(-.55, DECK + 1.1, -.4), .035, DARKWOOD, ship);
  for (const dx of [-.1, .1]) rod(v3(-.6 + dx, DECK + 1.08, -.4), v3(-.6 + dx, DECK + .4, -.4), .01, '#4f4433', ship, .01, 4);
  box(-.6, DECK + .38, -.4, .3, .04, .14, '#cfa468', ship);
  box(1.1, DECK + .2, -.3, .3, .06, .9, '#cfa468', ship); for (const dz of [-.35, .35]) box(1.1, DECK + .1, -.3 + dz, .26, .2, .06, DARKWOOD, ship);

  // Lion figurehead: sun-ray mane, crossed bones behind, Gaon Cannon in the mouth.
  const lion = group(ship, 0, 2.2, LENGTH + .32);
  lion.rotation.x = -.12;
  rod(v3(0, -.75, -.75), v3(0, -.1, -.2), .5, YELLOW, lion, .42, 10);
  for (const angle of [-.62, .62]) {
    const bone = box(0, 0, -.32, 3, .2, .2, CREAM, lion); bone.rotation.z = angle;
    for (const end of [1, -1]) for (const knob of [.11, -.11]) sphere(Math.cos(angle) * end * 1.5 - Math.sin(angle) * knob, Math.sin(angle) * end * 1.5 + Math.cos(angle) * knob, -.32, .17, CREAM, lion, 1, 1, 1, 8);
  }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, petal = cone(Math.sin(a) * .98, Math.cos(a) * .98, -.08, .3, .95, i % 2 ? '#ef8f2b' : '#f4a63a', lion, 8);
    petal.rotation.z = -a; petal.scale.z = .55;
  }
  sphere(0, 0, .02, .86, '#f8c64f', lion, 1, 1, .62, 20);
  for (const side of [1, -1]) {
    sphere(side * .56, .6, .12, .22, '#f4a63a', lion, 1, 1, .6, 10); sphere(side * .56, .6, .2, .12, '#fbe3a0', lion, 1, 1, .5, 8);   // ears
    sphere(side * .3, .2, .5, .1, INK, lion, 1, 1.25, .5, 10); sphere(side * .33, .25, .55, .035, WHITE, lion, 1, 1, 1, 6);            // eyes
    sphere(side * .22, -.2, .46, .27, '#fde9ad', lion, 1, .82, .7, 12);                                                                // cheeks
    for (let w = 0; w < 3; w++) rod(v3(side * .3, -.2 + w * .06, .6), v3(side * .78, -.26 + w * .13, .48), .012, DARKWOOD, lion, .012, 4);
  }
  sphere(0, -.04, .62, .13, '#7a4a2c', lion, 1.15, .8, .7, 10);
  const mouth = torus(0, -.36, .5, .15, .04, '#7a4a2c', lion); mouth.scale.y = .75; sphere(0, -.36, .47, .13, INK, lion, 1, .75, .4, 10);
  for (const side of [1, -1]) {                                              // paw anchors
    const paw = group(ship, side * 1.5, 1.5, 3.05);
    sphere(0, 0, 0, .2, '#f4a63a', paw, 1, 1, .7, 10); for (let k = -1; k <= 1; k++) sphere(k * .12, -.16, .04, .075, '#fde9ad', paw, 1, 1, 1, 6);
    rod(v3(0, .15, 0), v3(-side * .12, .55, -.1), .025, '#4f4433', paw);
  }

  batch(ship, {exclude: new Set([wheel]), ink: 1.15});
  batch(wheel, {ink: 0});
  ship.userData = {wheel, flag, deck: DECK, fore: FORE, roof: DECK + 1.73};
  return ship;
}
