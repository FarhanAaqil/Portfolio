// The voyage: renderer, sea, route and camera. The models live in scene/.
import {T, createKit, rand, inkFog} from './scene/kit.js';
import {flowClock} from './scene/props.js';
import {buildSunny} from './scene/sunny.js';
import {createStrawHats} from './scene/crew.js';
import * as foosha from './scene/islands/foosha.js';
import * as reverseMountain from './scene/islands/reverse-mountain.js';
import * as water7 from './scene/islands/water7.js';
import * as skypiea from './scene/islands/skypiea.js';
import * as egghead from './scene/islands/egghead.js';
import * as wano from './scene/islands/wano.js';

const $ = selector => document.querySelector(selector);
const host = $('#scene');
const mobile = () => matchMedia('(max-width:700px), (max-height:500px) and (pointer:coarse)').matches;
const viewSize = () => mobile() ? [host.clientWidth, host.clientHeight] : [innerWidth, innerHeight];

let renderer;
try {
  renderer = new T.WebGLRenderer({antialias: true, powerPreference: 'high-performance'});
} catch (error) {
  $('#loading').hidden = true;
  window.enableReadingView();
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.25 : 1.7));
renderer.setSize(...viewSize());
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = !mobile();
renderer.shadowMap.type = T.PCFSoftShadowMap;
host.append(renderer.domElement);
host.tabIndex = 0;

const DAY = new T.Color('#b7dedb'), DUSK = new T.Color('#efc6a2');
const scene = new T.Scene();
scene.background = DAY.clone();
scene.fog = new T.Fog(DAY.clone(), 90, 250);
const camera = new T.PerspectiveCamera(42, viewSize()[0] / viewSize()[1], .1, 520);
scene.add(new T.HemisphereLight('#ffedcf', '#448eb0', 1.15));
const sun = new T.DirectionalLight('#fff0d8', 2.1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left: -62, right: 62, top: 62, bottom: -62, near: 1, far: 220});
sun.shadow.bias = -.0006;
sun.shadow.normalBias = .06;
scene.add(sun, sun.target);

const kit = createKit(scene), {mesh, sphere, rod} = kit;
const UP = new T.Vector3(0, 1, 0);

// The sea: a displaced surface with moving glints, fading into the horizon haze.
const waterMat = new T.ShaderMaterial({
  uniforms: {time: {value: 0}, sea: {value: new T.Color('#278d92')}, haze: {value: new T.Color('#a9d4d0')}},
  vertexShader: `uniform float time;varying vec3 wp;varying float wave;
    void main(){vec3 p=position;float w=sin(p.x*.32+time*.8)*.19+cos(p.y*.23+time*.6)*.16;p.z+=w;wave=w;
      vec4 world=modelMatrix*vec4(p,1.);wp=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader: `uniform float time;uniform vec3 sea;uniform vec3 haze;varying vec3 wp;varying float wave;
    void main(){float lines=sin(wp.x*.8+wp.z*.44+time)*sin(wp.z*.63-time*.5);float sparkle=pow(max(0.,lines),28.);
      vec3 col=mix(sea,vec3(.48,.81,.75),wave*.65+.35)+sparkle*.15;
      gl_FragColor=vec4(mix(col,haze,smoothstep(90.,250.,length(cameraPosition-wp))),1.);}`
});
const water = mesh(new T.PlaneGeometry(3600, 3600, mobile() ? 120 : 200, mobile() ? 120 : 200), waterMat, 0, -.1, -600);
water.rotation.x = -Math.PI / 2;

// The six stops. `turn` spins an island so its harbour side faces the route, which
// keeps the Sunny sailing past each island instead of through it.
const SKY = 46;
const stops = [
  {id: 'foosha', label: 'FOOSHA VILLAGE', note: '01 / THE BEGINNING', centre: [0, 0], island: foosha},
  {id: 'about', label: 'REVERSE MOUNTAIN', note: '02 / A NEW PERSPECTIVE', centre: [150, -150], island: reverseMountain, turn: -1},
  {id: 'water7', label: 'WATER 7', note: '03 / THE WORKSHOP', centre: [-140, -360], island: water7, turn: 1},
  {id: 'projects', label: 'SKYPIEA', note: '04 / THE BEST FIVE', centre: [170, -650], island: skypiea, turn: -1, altitude: SKY},
  {id: 'egghead', label: 'EGGHEAD', note: '05 / KNOWLEDGE & MILESTONES', centre: [-240, -900], island: egghead, turn: 1},
  {id: 'contact', label: 'THE NEW WORLD', note: '06 / THE NEXT ADVENTURE', centre: [90, -1230], island: wano, turn: -1}
];
const animated = [];
for (const stop of stops) {
  const {view, build} = stop.island, angle = (stop.turn ?? 0) * Math.PI / 2, mirror = stop.turn > 0 ? -1 : 1;
  const built = build(kit);
  built.group.position.set(stop.centre[0], stop.altitude ?? 0, stop.centre[1]);
  built.group.rotation.y = angle;
  scene.add(built.group);
  if (built.tick) animated.push(built.tick);
  const spin = (x, y, z) => new T.Vector3(x * mirror, y, z).applyAxisAngle(UP, angle);
  stop.at = new T.Vector3(stop.centre[0], view.aim, stop.centre[1]);
  stop.boat = spin(view.dock[0], .3, view.dock[1]).add(new T.Vector3(stop.centre[0], 0, stop.centre[1]));
  stop.eye = spin(...view.eye);
  stop.chapter = document.getElementById(stop.id);
}
const skyCentre = new T.Vector3(stops[3].centre[0], 0, stops[3].centre[1]);
const route = new T.CatmullRomCurve3(stops.map(stop => stop.boat));
const trail = new T.Line(new T.BufferGeometry().setFromPoints(route.getPoints(220)), new T.LineDashedMaterial({color: '#dcebc9', dashSize: .7, gapSize: .7, transparent: true, opacity: .35}));
trail.computeLineDistances();
scene.add(trail);

// The ship and her crew.
const SHIP_SCALE = 1.55;
const ship = buildSunny(kit);
ship.scale.setScalar(SHIP_SCALE);
scene.add(ship);
const crew = createStrawHats(ship, kit);
const crewSelect = $('#crew-select');
crew.forEach((person, i) => crewSelect.append(new Option(person.name, i)));

// The Knock-Up Stream lifts the Sunny to the cloud sea; a balloon octopus lowers her back down.
const stream = new T.Group();
const streamColumn = new T.Mesh(new T.CylinderGeometry(3.6, 5.6, 1, 24, 1, true), new T.MeshBasicMaterial({color: '#8fd6d8', transparent: true, opacity: .78, side: T.DoubleSide}));
const streamFoam = new T.Mesh(new T.TorusGeometry(6.4, 1, 8, 32), new T.MeshBasicMaterial({color: '#eefaf2'}));
streamFoam.rotation.x = Math.PI / 2;
streamFoam.position.y = .2;
stream.add(streamColumn, streamFoam);
scene.add(stream);
const balloon = new T.Group();
ship.add(balloon);
sphere(0, 13.6, 0, 3.3, '#e8813f', balloon, 1.3, .82, 1.3);
sphere(0, 11.2, 0, 1.5, '#d9713a', balloon, 1.2, .7, 1.2);
for (let i = 0; i < 8; i++) {
  const a = i / 8 * Math.PI * 2;
  rod(new T.Vector3(Math.cos(a) * 3.4, 12, Math.sin(a) * 3.4), new T.Vector3(Math.cos(a) * 1.6, 2.4, Math.sin(a) * 3), .07, '#d9713a', balloon);
}
stream.visible = balloon.visible = false;

// Wake behind the hull, and cumulus that drifts along with the camera.
const wake = new T.Group();
for (let i = 0; i < 3; i++) {
  const ring = new T.Mesh(new T.RingGeometry(1 + i * .6, 1.055 + i * .6, 36, 1, 0, Math.PI), new T.MeshBasicMaterial({color: '#e1eed3', transparent: true, opacity: .28 - i * .06, side: T.DoubleSide, depthWrite: false}));
  ring.rotation.x = -Math.PI / 2;
  ring.position.z = -3.4 - i * 1.1;
  ring.scale.set(1, 2, 1);
  wake.add(ring);
}
scene.add(wake);
const clouds = [];
for (let i = 0; i < 18; i++) {
  const bank = new T.Group();
  bank.position.set(-65 + rand() * 205, 34 + rand() * 18, -110 + rand() * 85);
  for (let j = 0; j < 4; j++) sphere(j * 2.5, rand(), 0, 2.7, '#f2f0dc', bank, 1.5, .65, 1);
  bank.userData.origin = bank.position.clone();
  bank.userData.sky = true;
  clouds.push(bank);
  scene.add(bank);
}

scene.traverse(object => {
  if (!object.isMesh || object === water || object.userData.ink || !object.material.isMeshToonMaterial && !object.material.isMeshStandardMaterial) return;
  object.castShadow = !object.parent?.userData.sky;
  object.receiveShadow = true;
});

// ---- Voyage state ------------------------------------------------------------
const projectCount = document.querySelectorAll('.discovery').length;
const discoveries = [...document.querySelectorAll('.discovery')];
const landmark = $('#landmark'), landmarkName = $('#landmark-name'), landmarkNote = $('#landmark-note');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let targetProgress = 0, exploring = false, inspectShip = false, crewFocus = -1, yaw = 0, pitch = 0, drag = null;
let frame = 0, last = 0, moving = !reducedMotion.matches, shipYaw = null, previousScroll = scrollY, scrollEnergy = 0, previousStop = '';
const tmp = new T.Vector3(), lookAt = new T.Vector3(), camPos = new T.Vector3(), projected = new T.Vector3();
const tangent = new T.Vector3(), eyeOffset = new T.Vector3(), aimOffset = new T.Vector3();
const {smoothstep, clamp, damp} = T.MathUtils;

function paint(now) {
  frame = 0;
  if (document.hidden || document.body.classList.contains('reading-view') || document.body.classList.contains('artifact-opened')) return;
  const dt = Math.min((now - last) / 1000, .05) || .016;
  last = now;
  const sy = scrollY;
  scrollEnergy = moving ? damp(scrollEnergy, Math.min(1, Math.abs(sy - previousScroll) / 80), 18, dt) : 0;
  previousScroll = sy;

  // Which chapter is on screen, and how far the ship has left it for the next one.
  let index = 0;
  for (let i = 0; i < stops.length; i++) if (sy + (mobile() ? host.getBoundingClientRect().bottom + 28 : 0) >= stops[i].chapter.offsetTop - 2) index = i;
  const current = stops[index], next = stops[Math.min(index + 1, stops.length - 1)], top = current.chapter.offsetTop, length = current.chapter.offsetHeight;
  const local = clamp((sy - top) / length, 0, 1);
  const departure = Math.max(innerHeight * .7, length - innerHeight * .8);
  const blend = index === stops.length - 1 ? 0 : smoothstep(sy - top, departure, length);
  const routeT = (index + blend) / (stops.length - 1), pos = route.getPoint(routeT);
  tangent.copy(route.getTangent(Math.min(.9999, routeT)));

  // At Skypiea the Sunny stays on the cloud sea and circles the island once while the projects scroll past.
  const lap = index === 3 ? clamp((sy - top - innerHeight * .35) / Math.max(1, departure - innerHeight * .35), 0, 1) : 0;
  const turn = lap * Math.PI * 2, circling = lap > 0 && lap < 1;
  if (circling) {
    pos.sub(skyCentre).applyAxisAngle(UP, turn);
    tangent.set(pos.z, 0, -pos.x).normalize();
    pos.add(skyCentre);
  }
  const alt = SKY * (index === 2 ? smoothstep(blend, .5, .9) : index === 3 ? 1 - smoothstep(blend, .12, .6) : 0);
  const airborne = alt > .05 && alt < SKY - .05;

  ship.position.copy(pos);
  ship.position.y += alt + (moving ? Math.sin(now * .0018) * .1 : 0);
  const heading = Math.atan2(tangent.x, tangent.z);
  if (shipYaw === null || !moving) shipYaw = heading;
  else shipYaw += Math.atan2(Math.sin(heading - shipYaw), Math.cos(heading - shipYaw)) * (1 - Math.exp(-7 * dt));
  ship.rotation.y = shipYaw;
  ship.rotation.z = moving ? Math.sin(now * .0015) * .025 + Math.sin(blend * Math.PI) * .045 : 0;

  // Camera: each stop has its own vantage point, blended while sailing between them.
  eyeOffset.copy(current.eye).lerp(next.eye, blend);
  aimOffset.copy(current.at).sub(current.boat).lerp(tmp.copy(next.at).sub(next.boat), blend);
  if (circling) {
    eyeOffset.applyAxisAngle(UP, turn);
    aimOffset.applyAxisAngle(UP, turn);
  }
  lookAt.copy(pos).add(aimOffset);
  camPos.copy(pos).add(eyeOffset);
  camPos.y += alt;
  lookAt.y += alt;
  if (moving && !exploring) {
    const orbit = camPos.clone().sub(lookAt).applyAxisAngle(UP, Math.sin(local * Math.PI) * (index === 1 ? .3 : index === 2 ? .36 : .13));
    camPos.copy(lookAt).add(orbit);
  }
  if (mobile()) {
    camPos.y += 6;
    camPos.add(tmp.copy(eyeOffset).setY(0).normalize().multiplyScalar(8));
    lookAt.lerp(tmp.copy(ship.position).add(new T.Vector3(0, 5, 0)), .2);
  }
  if (inspectShip) {
    lookAt.copy(ship.position).add(new T.Vector3(0, 5, 0));
    camPos.copy(ship.position).add(new T.Vector3(mobile() ? 23 : 20, 14, mobile() ? 33 : 26).applyAxisAngle(UP, ship.rotation.y));
  }
  if (exploring) {
    const offset = camPos.clone().sub(lookAt), spherical = new T.Spherical().setFromVector3(offset);
    spherical.theta += yaw;
    spherical.phi = clamp(spherical.phi + pitch, .2, 1.45);
    camPos.copy(lookAt).add(offset.setFromSpherical(spherical));
  }
  if (crewFocus >= 0) {
    const person = crew[crewFocus];
    ship.updateWorldMatrix(true, true);
    person.getWorldPosition(lookAt);
    const size = person.scale.y * SHIP_SCALE;
    lookAt.y += .82 * size;
    // Stand just outboard of them, looking back in over the rail.
    const bearing = person.userData.bearing + yaw;
    camPos.copy(lookAt).add(new T.Vector3(Math.sin(bearing) * 1.3 * size, (.12 + pitch * 2) * size, Math.cos(bearing) * 1.3 * size).applyAxisAngle(UP, ship.rotation.y));
  }

  const [vw, vh] = viewSize();
  if (renderer.domElement.clientHeight !== vh || Math.abs(camera.aspect - vw / vh) > .001) {
    renderer.setSize(vw, vh);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
  }
  if (exploring || mobile()) camera.clearViewOffset();
  else camera.setViewOffset(vw, vh, -vw * .23 * (window.voyageComposition ?? 1), 0, vw, vh);
  camera.position.copy(camPos);
  camera.lookAt(lookAt);
  camera.updateMatrixWorld();
  sun.target.position.copy(lookAt);
  sun.position.copy(lookAt).add(new T.Vector3(-45, 80, 45));

  // Sky warms toward sunset on the way into the New World.
  const sunset = index === 5 ? 1 : index === 4 ? blend : 0;
  scene.background.copy(DAY).lerp(DUSK, sunset);
  scene.fog.color.copy(scene.background);
  inkFog.color.value.copy(scene.background);
  waterMat.uniforms.haze.value.copy(scene.background).multiplyScalar(.94);

  if (moving) {
    waterMat.uniforms.time.value = now * .00085;
    flowClock.value = now * .001;
    animated.forEach(tick => tick(now));
  }
  ship.userData.flag.rotation.y = Math.sin(now * .003) * .25;
  clouds.forEach((bank, i) => {
    bank.position.copy(bank.userData.origin);
    bank.position.x += lookAt.x + (moving ? Math.sin(now * .00009 + i) * 7 : 0);
    bank.position.y += alt;
    bank.position.z += lookAt.z - 25;
  });
  trail.visible = alt < 1;
  stream.visible = index === 2 && airborne;
  if (stream.visible) {
    stream.position.set(pos.x, 0, pos.z);
    streamColumn.scale.y = alt + .6;
    streamColumn.position.y = (alt + .6) / 2;
    streamFoam.rotation.z = now * .002;
  }
  balloon.visible = index === 3 && airborne;
  wake.position.copy(ship.position);
  wake.position.y = alt + .1;
  wake.rotation.y = ship.rotation.y;
  wake.visible = !exploring && !airborne;
  wake.scale.setScalar(SHIP_SCALE / 1.12 * (1 + scrollEnergy * .35));

  // Floating island label, footer route marker and navigation state.
  projected.copy(current.at).add(new T.Vector3(0, 14 + (current.altitude ?? 0), 0)).project(camera);
  landmark.style.left = clamp((projected.x * .5 + .5) * innerWidth, innerWidth * .15, innerWidth * .86) + 'px';
  landmark.style.top = clamp((-projected.y * .5 + .5) * innerHeight, 110, innerHeight * .46) + 'px';
  landmark.style.opacity = String(index === 2 && alt > 0 ? 0 : 1 - Math.sin(blend * Math.PI));
  if (previousStop !== current.id) {
    previousStop = current.id;
    landmarkName.textContent = current.label;
    landmarkNote.textContent = current.note;
    document.body.dataset.destination = current.id;
    $('#destination').value = current.id;
    document.querySelectorAll('[data-sail]').forEach(button => {
      const here = button.dataset.sail === current.id;
      button.classList.toggle('active', here);
      if (here) button.setAttribute('aria-current', 'location'); else button.removeAttribute('aria-current');
    });
  }
  if (index === 3 && discoveries.length) {
    let active = -1;
    discoveries.forEach((entry, i) => { if (entry.getBoundingClientRect().top < innerHeight * .7) active = i; });
    landmarkNote.textContent = active < 0 ? current.note : `DISCOVERY ${String(active + 1).padStart(2, '0')} / ${String(projectCount).padStart(2, '0')} · ${discoveries[active].querySelector('h3').textContent}`;
  }
  document.body.style.setProperty('--speed', String(scrollEnergy * Math.sin(blend * Math.PI) * .65));
  $('#route-ship').style.left = targetProgress * 100 + '%';
  $('#position').textContent = blend > .03 ? 'SAILING TO ' + next.label : current.label;

  renderer.render(scene, camera);
  if (moving) requestFrame();
}
function requestFrame() {
  if (!frame) frame = requestAnimationFrame(paint);
}
function readScroll() {
  if (exploring) setExplore(false);
  targetProgress = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1);
  requestFrame();
}

// ---- Look around, inspect the ship, meet the crew ------------------------------
function setExplore(value) {
  exploring = value;
  document.body.classList.toggle('exploring', value);
  $('main').inert = value;
  $('#look').setAttribute('aria-pressed', String(value));
  $('#look').textContent = value ? 'Return to voyage ×' : 'Look around ⊹';
  $('#explore-help').hidden = !value;
  if (value) host.focus({preventScroll: true});
  else {
    yaw = pitch = 0;
    inspectShip = false;
    crewFocus = -1;
    $('#crew-panel').hidden = true;
  }
  $('#inspect-sunny').setAttribute('aria-pressed', String(inspectShip));
  requestFrame();
}
function showCrew(i) {
  crewFocus = Number(i);
  inspectShip = false;
  setExplore(true);
  $('#crew-panel').hidden = false;
  crewSelect.value = String(crewFocus);
  $('#crew-title').textContent = crew[crewFocus].name;
  yaw = pitch = 0;
  requestFrame();
}
$('#crew-open').addEventListener('click', () => showCrew(0));
crewSelect.addEventListener('change', event => showCrew(event.target.value));
$('#crew-next').addEventListener('click', () => showCrew((crewFocus + 1) % crew.length));
$('#crew-prev').addEventListener('click', () => showCrew((crewFocus + crew.length - 1) % crew.length));
$('#crew-close').addEventListener('click', () => setExplore(false));
$('#inspect-sunny').addEventListener('click', () => {
  crewFocus = -1;
  $('#crew-panel').hidden = true;
  inspectShip = !inspectShip;
  yaw = pitch = 0;
  setExplore(inspectShip);
});
$('#look').addEventListener('click', () => setExplore(!exploring));
$('#reset').addEventListener('click', () => {
  yaw = pitch = 0;
  requestFrame();
});
host.addEventListener('pointerdown', event => {
  if (!exploring) return;
  drag = {x: event.clientX, y: event.clientY};
  host.setPointerCapture(event.pointerId);
});
host.addEventListener('pointermove', event => {
  if (!drag) return;
  yaw -= (event.clientX - drag.x) * .006;
  pitch = clamp(pitch - (event.clientY - drag.y) * .004, -.6, .6);
  drag = {x: event.clientX, y: event.clientY};
  requestFrame();
});
host.addEventListener('pointerup', () => { drag = null; });
host.addEventListener('pointercancel', () => { drag = null; });
addEventListener('keydown', event => {
  if (event.key === 'Escape') setExplore(false);
  if (!(event.target instanceof Element) || event.target.matches('select,input,textarea,button') || !exploring) return;
  const step = {ArrowLeft: [.1, 0], ArrowRight: [-.1, 0], ArrowUp: [0, -.06], ArrowDown: [0, .06]}[event.key];
  if (!step) return;
  event.preventDefault();
  yaw += step[0];
  pitch += step[1];
  requestFrame();
});

// ---- Motion preference, resize and lifecycle -----------------------------------
function setMotion(value) {
  moving = value;
  document.documentElement.classList.toggle('still', !value);
  $('#motion').setAttribute('aria-pressed', String(value));
  $('#motion').textContent = value ? 'Motion on' : 'Motion off';
  requestFrame();
}
$('#motion').addEventListener('click', () => setMotion(!moving));
reducedMotion.addEventListener('change', () => setMotion(!reducedMotion.matches));
addEventListener('scroll', readScroll, {passive: true});
addEventListener('resize', () => {
  const [vw, vh] = viewSize();
  camera.aspect = vw / vh;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.25 : 1.7));
  renderer.shadowMap.enabled = !mobile();
  renderer.setSize(vw, vh);
  readScroll();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestFrame(); });
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  moving = false;
  window.enableReadingView();
});
window.addEventListener('voyage-navigate', () => setExplore(false));
window.addEventListener('voyage-resume', () => {
  last = 0;
  readScroll();
});

setMotion(moving);
readScroll();
$('#loading').hidden = true;
document.body.dataset.render = 'ready';

// Console helpers for checking the scene: voyageDiagnostics() reports render cost,
// voyageOrbit(yaw, pitch) turns the look-around camera.
window.voyageDiagnostics = () => ({
  destination: document.body.dataset.destination, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
  geometries: renderer.info.memory.geometries, crew: crew.map(person => person.name), crewFocus, exploring, inspectShip, moving, cameraHeight: camera.position.y
});
window.voyageOrbit = (y = 0, p = 0) => {
  yaw = y;
  pitch = p;
  requestFrame();
};
