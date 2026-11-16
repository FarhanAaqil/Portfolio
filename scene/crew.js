// The Straw Hat crew in their post-timeskip outfits, hand-modelled as cel-shaded
// figures. Bodies are built from one parametric figure; faces are drawn on a canvas
// and wrapped onto the head so eyes, brows, scars and grins read like the anime.
import {T, paint, v3} from './kit.js';
import {DECK} from './sunny.js';

const INK = '#1b2229', SKIN = '#f3c29b', TAN = '#d99a6c', WHITE = '#fbf7ea';

// ---- Faces -----------------------------------------------------------------
// Canvas is 256 square; the character's left eye is on the viewer's right.
const EYE_Y = 116;
function roundEyes(c, {gap = 44, r = 15, pupil = 5, y = EYE_Y} = {}) {
  for (const side of [-1, 1]) {
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 4;
    c.beginPath(); c.arc(128 + side * gap, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(128 + side * gap, y, pupil, 0, Math.PI * 2); c.fill();
  }
}
function lashEyes(c, iris, {gap = 44, y = EYE_Y} = {}) {
  for (const side of [-1, 1]) {
    const x = 128 + side * gap;
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, 19, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = iris; c.beginPath(); c.arc(x, y + 1, 11, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(x, y + 1, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 4, y - 4, 3, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 21, y - 6); c.quadraticCurveTo(x, y - 24, x + 21, y - 6); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(x + side * 20, y - 8); c.lineTo(x + side * 29, y - 15); c.stroke();
  }
}
function brows(c, tilt = 0, {gap = 44, y = EYE_Y - 30, width = 7, len = 20, color = INK} = {}) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(128 + side * (gap - len), y + tilt); c.lineTo(128 + side * (gap + len), y - tilt); c.stroke(); }
}
function line(c, points, width = 4, color = INK) {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = c.lineJoin = 'round';
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function grin(c, w = 46, y = 176, open = 22) {
  c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 4;
  c.beginPath(); c.moveTo(128 - w, y); c.quadraticCurveTo(128, y + open * 2, 128 + w, y); c.quadraticCurveTo(128, y + 6, 128 - w, y); c.fill(); c.stroke();
  line(c, [[128 - w * .8, y + open * .42], [128 + w * .8, y + open * .42]], 2);
}
const smile = (c, w = 22, y = 178, lift = 10) => { c.strokeStyle = INK; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(128 - w, y); c.quadraticCurveTo(128, y + lift, 128 + w, y); c.stroke(); };
const nose = (c, y = 148) => line(c, [[126, y - 6], [131, y], [126, y + 3]], 3);

// ---- Figure ----------------------------------------------------------------
export function createStrawHats(ship, kit) {
  const {group, box, cyl, cone, sphere, torus, rod, lathe, batch} = kit;
  const crew = [];

  /** Head with skull, ears and a painted face; returns the head group for hair and hats. */
  function head(parent, y, skin, draw, scale = 1) {
    const h = group(parent, 0, y, 0);
    h.scale.setScalar(scale);
    sphere(0, 0, 0, 1, skin, h, .1, .112, .104, 18);
    for (const side of [1, -1]) sphere(side * .1, -.012, -.005, .022, skin, h, .6, 1.2, 1, 6);
    if (draw) {
      const geometry = new T.SphereGeometry(1.014, 18, 14, Math.PI / 2 - .95, 1.9, Math.PI / 2 - .8, 1.6);
      const face = new T.Mesh(geometry, new T.MeshBasicMaterial({map: paint(256, 256, draw), transparent: true, depthWrite: false}));
      face.scale.set(.1, .112, .104);
      h.add(face);
    }
    return h;
  }
  /** Hair shell over the top and back of the skull, tipped back to leave the face clear. */
  function scalp(h, color, tip = -.5, drop = .56, grow = 1.07) {
    const cap = kit.mesh(new T.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * drop), color, 0, .004, -.004, h);
    cap.scale.set(.1 * grow, .112 * grow, .104 * grow); cap.rotation.x = tip;
    return cap;
  }
  const tuft = (h, x, y, z, r, len, color, rx = 0, rz = 0) => { const t = cone(x, y, z, r, len, color, h, 5); t.rotation.set(rx, 0, rz); return t; };

  /**
   * A standing human. `o` carries colours, proportions and a pose:
   *   pose.L / pose.R = [swing out, swing forward, elbow bend] in radians.
   */
  function figure(name, o) {
    const root = new T.Group(); root.name = name;
    const w = o.build ?? 1, skin = o.skin ?? SKIN, arm = o.arm ?? {}, leg = o.leg ?? {};
    const hands = {};
    for (const side of [1, -1]) {
      const hip = v3(side * .06 * w, .54, 0), ankle = v3(side * (.068 * w + (o.stance ?? .015)), .06, 0), knee = hip.clone().lerp(ankle, .5).add(v3(0, 0, .012));
      rod(hip, knee, .054 * w * (leg.thick ?? 1), leg.thigh ?? '#30415c', root, .046 * w * (leg.thick ?? 1), 8);
      rod(knee, ankle, .044 * w * (leg.thick ?? 1), leg.shin ?? leg.thigh ?? '#30415c', root, .034 * w * (leg.thick ?? 1), 8);
      if (leg.cuff) torus(knee.x, knee.y - .01, knee.z, .05 * w, .016, leg.cuff, root).rotation.x = Math.PI / 2;
      sphere(ankle.x, .035, .035, .05, leg.shoe ?? '#3b2a20', root, .85 * w, .7, 1.7, 8);

      const [out, forward, bend] = (side > 0 ? o.pose?.L : o.pose?.R) ?? [.12, 0, .15];
      const shoulder = v3(side * (o.shoulders ?? .148) * w, .835, 0);
      const dir = v3(0, -1, 0).applyAxisAngle(v3(0, 0, 1), side * out).applyAxisAngle(v3(1, 0, 0), -forward);
      const elbow = shoulder.clone().addScaledVector(dir, .2 * (arm.len ?? 1));
      const dir2 = dir.clone().applyAxisAngle(v3(1, 0, 0), -bend);
      const wrist = elbow.clone().addScaledVector(dir2, .19 * (arm.len ?? 1));
      sphere(shoulder.x, shoulder.y, 0, .045 * w * (arm.thick ?? 1), arm.upper ?? skin, root, 1, 1, 1, 8);
      rod(shoulder, elbow, .04 * w * (arm.thick ?? 1), arm.upper ?? skin, root, .034 * w * (arm.thick ?? 1), 8);
      rod(elbow, wrist, .034 * w * (arm.fore ?? arm.thick ?? 1), arm.lower ?? arm.upper ?? skin, root, .028 * w * (arm.fore ?? arm.thick ?? 1), 8);
      sphere(wrist.x, wrist.y, wrist.z, .036 * (arm.hand ?? 1), arm.glove ?? skin, root, 1, 1.1, 1, 8);
      hands[side > 0 ? 'L' : 'R'] = wrist;
    }
    sphere(0, .575, 0, 1, o.hips ?? leg.thigh ?? '#30415c', root, .112 * w, .1, .082 * w, 12);
    sphere(0, .74, 0, 1, o.chest ?? skin, root, .138 * w, .14, .086 * w * (o.depth ?? 1), 14);
    if (o.jacket) {                                         // open-fronted shirt or coat over a bare chest
      const gap = o.open ?? .9;
      const shell = kit.mesh(new T.SphereGeometry(1, 16, 10, Math.PI / 2 + gap / 2, Math.PI * 2 - gap), o.jacket, 0, .74, 0, root);
      shell.scale.set(.146 * w, .148, .094 * w * (o.depth ?? 1));
    }
    if (o.sash) torus(0, .625, 0, .108 * w, .026, o.sash, root).rotation.x = Math.PI / 2;
    cyl(0, .885, 0, .03 * w, .034 * w, .06, skin, root, 8);
    const h = head(root, .985, o.headSkin ?? skin, o.face, o.headScale ?? 1);
    return {root, head: h, hands};
  }

  /** Puts a finished figure on the ship, merges it, and gives it an ink outline. */
  function board(person, x, y, z, facing = 0, scale = 1) {
    const {root} = person;
    root.position.set(x, y, z); root.rotation.y = facing; root.scale.setScalar(scale);
    ship.add(root);
    batch(root, {ink: .75});
    crew.push(root);
    return root;
  }
  const lawn = DECK + .06, fore = ship.userData.fore, roof = ship.userData.roof;

  // Monkey D. Luffy: straw hat, open red cardigan, yellow sash, blue shorts, sandals.
  const luffy = figure('Monkey D. Luffy', {
    jacket: '#c8322b', sash: '#f1c232', hips: '#3b6bb0', leg: {thigh: '#3b6bb0', shin: SKIN, cuff: WHITE, shoe: '#8a5a36'},
    arm: {upper: '#c8322b', lower: '#c8322b'}, pose: {L: [.5, .2, 1.9], R: [2.7, .15, .25]}, stance: .03,
    face(c) { roundEyes(c); brows(c, 4); nose(c); grin(c); line(c, [[152, 138], [186, 140]], 3); line(c, [[160, 132], [160, 146]], 3); line(c, [[176, 133], [176, 147]], 3); }
  });
  scalp(luffy.head, INK, -.55, .6);
  for (let i = 0; i < 9; i++) { const a = -1.3 + i * .32; tuft(luffy.head, Math.sin(a) * .085, .05, Math.cos(a) * .088, .03, .08, INK, 1.9, -Math.sin(a) * .9); }
  cyl(0, .075, -.005, .215, .215, .012, '#ecc353', luffy.head, 22); lathe([[.115, 0], [.112, .05], [.09, .085], [0, .1]], '#ecc353', luffy.head, 0, .078, -.005, 18);
  cyl(0, .098, -.005, .117, .117, .028, '#c0322b', luffy.head, 18);
  for (const [dx, dy] of [[-.03, -.03], [.03, .03], [-.03, .03], [.03, -.03]]) rod(v3(0, .78, .09), v3(dx, .78 + dy, .09), .006, '#b97a5e', luffy.root, .006, 4);   // the X scar
  board(luffy, 0, 3.0, 4.42, 0, 1.02);

  // Roronoa Zoro: long green coat, red sash, three swords, scar over the left eye.
  const zoro = figure('Roronoa Zoro', {
    skin: TAN, jacket: '#2f5d3f', open: .7, sash: '#b3312a', hips: '#2f5d3f', leg: {thigh: '#232a30', shin: '#1c2126', shoe: '#1c2126'},
    arm: {upper: '#2f5d3f', lower: '#2f5d3f', thick: 1.15}, build: 1.12, pose: {L: [.2, .5, 1.7], R: [.2, .5, 1.7]},
    face(c) { roundEyes(c, {r: 12, pupil: 4}); c.clearRect(150, 96, 50, 42); line(c, [[156, 118], [190, 116]], 5); line(c, [[172, 84], [174, 150]], 4, '#9c5b4a'); brows(c, 9, {width: 8, color: '#2e5a35'}); nose(c); line(c, [[112, 180], [146, 178]], 4); }
  });
  scalp(zoro.head, '#5c9a55', -.5, .52, 1.06);
  for (let i = 0; i < 7; i++) { const a = -1 + i * .33; tuft(zoro.head, Math.sin(a) * .07, .1, Math.cos(a) * .05 + .02, .028, .06, '#5c9a55', .5, -Math.sin(a) * .7); }
  for (let i = 0; i < 3; i++) sphere(.103, -.045 - i * .022, -.005, .009, '#e9ad32', zoro.head, 1, 2, 1, 5);
  lathe([[.125, 0], [.15, -.34], [.17, -.4]], '#2f5d3f', zoro.root, 0, .62, 0, 14);                     // coat skirt
  [['#f4f1e6', -.02], ['#b3312a', .005], ['#20252b', .03]].forEach(([color, dz], i) => {                 // Wado, Kitetsu, Shusui
    rod(v3(-.14, .66 + i * .012, .08 + dz), v3(-.21, .5 - i * .02, -.42 + dz), .013, color, zoro.root, .011, 5);
    rod(v3(-.14, .66 + i * .012, .08 + dz), v3(-.128, .69 + i * .012, .17 + dz), .014, i === 2 ? '#7a2a2a' : '#2b2f36', zoro.root, .014, 5);
    cyl(-.14, .66 + i * .012, .08 + dz, .028, .028, .008, '#e9ad32', zoro.root, 8).rotation.x = 1.4;
  });
  torus(.185, .72, 0, .045, .016, '#20252b', zoro.root).rotation.y = Math.PI / 2;                        // bandana on the arm
  board(zoro, 1.0, lawn, 1.25, -.5, 1.08);

  // Nami: long orange hair, green-striped bikini top, jeans, Clima-Tact.
  const nami = figure('Nami', {
    chest: SKIN, hips: '#3d6fa5', leg: {thigh: '#3d6fa5', shin: '#3d6fa5', shoe: '#e8842c', thick: .9}, build: .86, arm: {thick: .8},
    pose: {L: [.25, .2, .5], R: [.5, .3, 1.5]},
    face(c) { lashEyes(c, '#8a5a2b'); brows(c, -3, {width: 4, color: '#c8641e'}); nose(c); smile(c, 20, 176, 12); }
  });
  sphere(0, .775, .02, 1, '#4f9d63', nami.root, .118, .05, .082, 12); for (const x of [-.05, .05]) sphere(x, .775, .06, .052, '#eef3e2', nami.root, 1, .9, .8, 8);
  sphere(.125, .8, .0, .016, '#3d6fa5', nami.root, 1, 1, .5, 6);                                         // shoulder tattoo
  scalp(nami.head, '#f08a2c', -.45, .55, 1.08);
  lathe([[.095, .02], [.115, -.12], [.12, -.3], [.1, -.42], [.05, -.48]], '#f08a2c', nami.head, 0, 0, -.045, 12).scale.z = .55;
  for (const side of [1, -1]) { sphere(side * .085, -.07, .03, .03, '#f08a2c', nami.head, .8, 2.6, .9, 8); tuft(nami.head, side * .05, .06, .09, .03, .08, '#f08a2c', 2.4, side * .5); }
  rod(nami.hands.R.clone().add(v3(0, -.22, .0)), nami.hands.R.clone().add(v3(.02, .42, .06)), .012, '#4d8fd1', nami.root, .012, 6);
  sphere(nami.hands.R.x + .02, nami.hands.R.y + .44, nami.hands.R.z + .06, .03, '#8fd0ee', nami.root, 1, 1, 1, 8);
  board(nami, .62, fore, 2.75, .35, .98);

  // Usopp: long nose, curly ponytail, hat and goggles, suspenders, Kuro Kabuto.
  const usopp = figure('Usopp', {
    skin: TAN, chest: TAN, hips: '#d9b34a', sash: WHITE, leg: {thigh: '#d9b34a', shin: '#d9b34a', shoe: '#6a4a33', thick: 1.15}, arm: {thick: 1.05},
    pose: {L: [.2, 1.35, .25], R: [.4, .5, 1.6]},
    face(c) { roundEyes(c, {r: 14}); brows(c, 2, {width: 8}); c.fillStyle = '#b5705a'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(128, 186, 26, 12, 0, 0, Math.PI * 2); c.fill(); c.stroke(); line(c, [[104, 186], [152, 186]], 3); }
  });
  rod(v3(0, -.012, .1), v3(0, .0, .25), .02, TAN, usopp.head, .015, 6);                                  // the nose
  scalp(usopp.head, INK, -.6, .5, 1.07);
  for (let i = 0; i < 9; i++) sphere(Math.sin(i * 2.4) * .06, -.03 - i * .012, -.13 - (i % 3) * .03, .045, INK, usopp.head, 1, 1, 1, 6);
  lathe([[.108, 0], [.112, .05], [.08, .09], [0, .1]], '#e7e2cf', usopp.head, 0, .045, -.005, 14); cyl(0, .05, .03, .125, .125, .012, '#e7e2cf', usopp.head, 14);
  for (const side of [1, -1]) { torus(side * .04, .075, .1, .028, .008, '#3a3f45', usopp.head); sphere(side * .04, .075, .1, .024, '#7ec4d6', usopp.head, 1, 1, .3, 6); }
  for (const side of [1, -1]) { rod(v3(side * .07, .62, .075), v3(side * .09, .84, .04), .012, '#7a4a2c', usopp.root, .012, 4); rod(v3(side * .07, .62, -.07), v3(side * .09, .84, -.04), .012, '#7a4a2c', usopp.root, .012, 4); }
  const sling = usopp.hands.L; rod(sling.clone().add(v3(0, -.05, 0)), sling.clone().add(v3(0, .08, .02)), .012, INK, usopp.root, .012, 5);
  for (const dx of [-.05, .05]) rod(sling.clone().add(v3(0, .08, .02)), sling.clone().add(v3(dx, .19, .03)), .01, INK, usopp.root, .01, 5);
  sphere(-.13, .56, -.07, .06, '#b3312a', usopp.root, 1, 1.1, .7, 8);                                    // satchel
  board(usopp, -.62, fore, 2.95, -.25, .97);

  // Sanji: blond fringe over one eye, curled brow, black suit, cigarette.
  const sanji = figure('Sanji', {
    chest: '#22262c', hips: '#22262c', leg: {thigh: '#22262c', shin: '#22262c', shoe: '#14171b', thick: .95}, arm: {upper: '#22262c', lower: '#22262c'}, build: .95,
    pose: {L: [.15, -.1, .4], R: [.3, .55, 2.1]},
    face(c) { roundEyes(c, {r: 12, pupil: 4}); c.clearRect(60, 80, 52, 60); c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(152, 88); c.lineTo(184, 86); c.arc(188, 92, 6, -Math.PI / 2, Math.PI * 1.1); c.stroke(); nose(c); line(c, [[112, 180], [142, 176]], 4); line(c, [[118, 198], [136, 198]], 5, '#b79a52'); }
  });
  sphere(0, .77, .078, .03, '#5d8fc9', sanji.root, 1.4, 2.2, .4, 6); rod(v3(0, .84, .085), v3(0, .7, .09), .012, '#14171b', sanji.root, .008, 4);   // shirt and tie
  for (const [x, y] of [[-.035, .72], [.035, .72], [-.035, .66], [.035, .66]]) sphere(x, y, .088, .008, '#e9ad32', sanji.root, 1, 1, 1, 5);
  scalp(sanji.head, '#f1d06a', -.42, .58, 1.08);
  sphere(-.05, .03, .085, .06, '#f1d06a', sanji.head, 1, 1.5, .5, 8);                                   // fringe over his right eye
  rod(v3(.03, -.06, .1), v3(.07, -.065, .17), .006, WHITE, sanji.head, .006, 4);                         // cigarette
  board(sanji, .55, lawn, -.8, .2, 1.05);

  // Tony Tony Chopper: blue nose, antlers, the pink hat under its blue cap, backpack.
  const chopper = new T.Group(); chopper.name = 'Tony Tony Chopper';
  const fur = '#a8703f';
  sphere(0, .2, 0, 1, '#f3e7c5', chopper, .13, .15, .11, 12);                                           // striped tank top
  for (const x of [-.07, 0, .07]) box(x, .2, .0, .02, .27, .225, '#f0b63c', chopper);
  sphere(0, .1, 0, 1, '#e8842c', chopper, .125, .08, .105, 10);
  for (const side of [1, -1]) { rod(v3(side * .06, .08, 0), v3(side * .07, .015, .02), .04, fur, chopper, .04, 6); sphere(side * .07, .012, .04, .035, '#3b2a20', chopper, 1, .5, 1.5, 6); rod(v3(side * .13, .26, 0), v3(side * .2, .16, .04), .03, fur, chopper, .026, 6); sphere(side * .2, .15, .045, .03, '#3b2a20', chopper, 1, 1, 1, 6); }
  const chopperHead = head(chopper, .43, fur, c => { roundEyes(c, {gap: 50, r: 20, pupil: 8, y: 124}); smile(c, 20, 196, 12); }, 1.45);
  sphere(0, -.03, .1, .03, '#3f7ad0', chopperHead, 1.2, .9, 1, 8);
  lathe([[.125, 0], [.13, .06], [.1, .13], [0, .16]], '#3f8fd6', chopperHead, 0, .035, 0, 16); cyl(0, .035, 0, .17, .17, .016, '#ee86a8', chopperHead, 18);
  for (const tilt of [Math.PI / 4, -Math.PI / 4]) box(0, .11, .108, .08, .02, .01, WHITE, chopperHead).rotation.z = tilt;
  torus(0, .05, 0, .128, .014, '#f3e7c5', chopperHead).rotation.x = Math.PI / 2;
  for (const side of [1, -1]) { rod(v3(side * .09, .09, 0), v3(side * .2, .22, -.01), .014, '#7a5330', chopperHead, .012, 5); rod(v3(side * .15, .15, 0), v3(side * .21, .13, .04), .011, '#7a5330', chopperHead, .009, 5); rod(v3(side * .2, .22, -.01), v3(side * .17, .29, 0), .011, '#7a5330', chopperHead, .008, 5); sphere(side * .13, .0, -.02, .035, fur, chopperHead, .7, 1, 1.4, 6); }
  box(0, .2, -.13, .16, .17, .08, '#3f7ad0', chopper);
  board({root: chopper}, -.42, lawn, .28, .25, 1.15);

  // Nico Robin: long black hair swept back, sunglasses, zipped vest, pink sarong.
  const robin = figure('Nico Robin', {
    chest: '#6b4a9c', hips: '#e9a3b8', leg: {thigh: SKIN, shin: SKIN, shoe: '#c8508a', thick: .88}, build: .88, arm: {thick: .8},
    pose: {L: [.3, .5, 2.1], R: [.3, .5, 2.1]},
    face(c) { lashEyes(c, '#3f79b8'); brows(c, -2, {width: 4}); nose(c, 150); smile(c, 16, 178, 8); }
  });
  lathe([[.115, 0], [.125, -.2], [.12, -.44]], '#e9a3b8', robin.root, 0, .6, 0, 14); rod(v3(0, .86, .08), v3(0, .64, .085), .006, '#e9ad32', robin.root, .006, 4);
  scalp(robin.head, '#1d2330', -.38, .52, 1.07);
  lathe([[.1, .03], [.105, -.15], [.095, -.36], [.06, -.42]], '#1d2330', robin.head, 0, 0, -.05, 12).scale.z = .5;
  for (const side of [1, -1]) { sphere(side * .04, .075, .085, .03, '#2a3038', robin.head, 1.1, .8, .4, 8); sphere(side * .088, -.06, .02, .022, '#1d2330', robin.head, .8, 3.2, 1, 6); }
  rod(v3(-.02, .075, .095), v3(.02, .075, .095), .005, '#2a3038', robin.head, .005, 4);
  board(robin, .3, roof, -1.3, .5, 1.1);

  // Franky: blue hair, steel nose, huge forearms with stars, open aloha shirt, speedo.
  const franky = figure('Franky', {
    build: 1.55, depth: .8, shoulders: .185, jacket: '#c9372c', open: 1.5, hips: '#1c2126', leg: {thigh: SKIN, shin: SKIN, shoe: '#3b2a20', thick: .62},
    arm: {upper: '#c9372c', lower: '#5aa4dc', thick: 1.1, fore: 2.5, hand: 1.9, len: 1.05}, pose: {L: [.85, .2, 1.0], R: [.85, .2, 1.0]}, stance: .05, headScale: .92,
    face(c) { c.fillStyle = INK; c.beginPath(); c.roundRect(64, 100, 128, 30, 10); c.fill(); brows(c, 6, {y: 86, width: 8, color: '#3f8fd6'}); c.fillStyle = '#9aa4ad'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(116, 128, 24, 28, 5); c.fill(); c.stroke(); grin(c, 40, 176, 18); }
  });
  for (const side of [1, -1]) { sphere(side * .29, .86, 0, .085, '#c9372c', franky.root, 1, 1, 1, 10); const star = franky.hands[side > 0 ? 'L' : 'R']; sphere(star.x, star.y + .09, star.z + .09, .03, '#f4d24a', franky.root, 1.3, 1.3, .4, 5); }
  for (let i = 0; i < 6; i++) sphere(Math.sin(i * 1.9) * .15, .7 + Math.cos(i * 2.7) * .08, -.07, .03, '#f1c232', franky.root, 1, 1, .4, 6);   // shirt print
  scalp(franky.head, '#3f8fd6', -.5, .42, 1.05);
  sphere(0, .11, .03, .07, '#3f8fd6', franky.head, 1, .8, 1.3, 10);
  for (const side of [1, -1]) box(side * .098, -.03, .02, .015, .09, .05, '#3f8fd6', franky.head);
  for (const x of [-.045, 0, .045]) cone(x, -.12, .05, .02, .05, SKIN, franky.head, 5).rotation.x = Math.PI;
  board(franky, .35, lawn, .05, -.15, 1.32);

  // Brook: skeleton in a crowned top hat with an afro, feather boa and cane sword.
  const brook = figure('Brook', {
    skin: '#f4f1e6', chest: '#20242b', hips: '#b3312a', leg: {thigh: '#c9372c', shin: '#c9372c', shoe: '#20242b', thick: .6}, arm: {upper: '#20242b', lower: '#20242b', thick: .6}, build: .78,
    pose: {L: [.25, .1, .3], R: [.45, .6, 1.3]},
    face(c) { c.fillStyle = INK; for (const side of [-1, 1]) { c.beginPath(); c.moveTo(128 + side * 44, 132); c.bezierCurveTo(128 + side * 76, 96, 128 + side * 50, 86, 128 + side * 44, 104); c.bezierCurveTo(128 + side * 38, 86, 128 + side * 12, 96, 128 + side * 44, 132); c.fill(); } c.beginPath(); c.moveTo(128, 140); c.lineTo(120, 158); c.lineTo(136, 158); c.fill(); line(c, [[86, 184], [170, 184]], 4); for (let i = 0; i < 7; i++) line(c, [[92 + i * 12, 174], [92 + i * 12, 196]], 3); }
  });
  sphere(0, .07, -.02, .2, INK, brook.head, 1, .9, 1, 14);                                              // afro
  cyl(0, .22, -.01, .1, .1, .17, INK, brook.head, 14); cyl(0, .14, -.01, .16, .16, .014, INK, brook.head, 16);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cone(Math.sin(a) * .1, .2, -.01 + Math.cos(a) * .1, .022, .06, '#f1c232', brook.head, 4); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; sphere(Math.sin(a) * .15, .85 - Math.abs(Math.cos(a)) * .03, Math.cos(a) * .09, .04, '#f1c232', brook.root, 1, 1, 1, 6); }
  rod(brook.hands.R.clone().add(v3(0, .06, .02)), brook.hands.R.clone().add(v3(.02, -.42, .1)), .012, '#6b4a9c', brook.root, .01, 5);
  board(brook, -1.0, lawn, 1.2, .55, 1.5);

  // Jinbe: whale-shark fish-man, topknot, lightning brows, kimono and draped coat. At the helm.
  const jinbe = figure('Jinbe', {
    skin: '#6aa7c4', build: 1.6, depth: 1.35, shoulders: .17, chest: '#d9772b', hips: '#d9772b', sash: '#6b4a9c', leg: {thigh: '#d9772b', shin: '#6aa7c4', shoe: '#7a5330', thick: .8},
    arm: {upper: '#d9772b', lower: '#6aa7c4', thick: 1.25, hand: 1.5}, pose: {L: [.35, .95, .6], R: [.35, .95, .6]}, stance: .05, headScale: 1.12,
    face(c) { roundEyes(c, {r: 11, pupil: 4, gap: 40}); c.strokeStyle = '#f1c232'; c.lineWidth = 8; c.lineJoin = 'round'; for (const side of [-1, 1]) { c.beginPath(); c.moveTo(128 + side * 22, 92); c.lineTo(128 + side * 40, 82); c.lineTo(128 + side * 46, 92); c.lineTo(128 + side * 66, 78); c.stroke(); } nose(c); line(c, [[98, 182], [158, 182]], 4); c.fillStyle = '#fff'; for (const side of [-1, 1]) { c.beginPath(); c.moveTo(128 + side * 24, 184); c.lineTo(128 + side * 30, 160); c.lineTo(128 + side * 38, 184); c.fill(); } }
  });
  lathe([[.2, 0], [.24, -.3], [.25, -.42]], '#d9772b', jinbe.root, 0, .6, 0, 14);
  lathe([[.24, .02], [.27, -.3], [.27, -.62]], '#20242b', jinbe.root, 0, .84, -.03, 14).scale.z = .8;   // coat over the shoulders
  scalp(jinbe.head, INK, -.6, .45, 1.05); sphere(0, .13, -.03, .04, INK, jinbe.head, 1, 1.2, 1, 8); cone(0, .2, -.05, .03, .09, INK, jinbe.head, 6);
  for (const side of [1, -1]) sphere(side * .1, -.05, .0, .03, '#f1c232', jinbe.head, .6, 2.2, 1.2, 6);
  board(jinbe, 0, fore, 2.02, 0, 1.3);

  return crew;
}
