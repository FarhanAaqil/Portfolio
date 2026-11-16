// Building blocks shared by the islands: sculpted terrain, running water,
// houses, trees, rocks, clouds and painted signs.
import {T, mat, paint, rand, range, v3} from './kit.js';

/** One clock for every stream, canal and waterfall in the world. */
export const flowClock = {value: 0};

/** Water that visibly runs along the surface's v axis: canals, falls, fountains. */
export function flow(color = '#63c6d2', foam = '#e9fbf6', speed = 1, stripes = 7) {
  return new T.ShaderMaterial({
    side: T.DoubleSide,
    uniforms: {time: flowClock, a: {value: new T.Color(color)}, b: {value: new T.Color(foam)}, speed: {value: speed}, stripes: {value: stripes}},
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float time,speed,stripes;uniform vec3 a,b;varying vec2 vUv;
      void main(){float run=fract(vUv.y*stripes+time*speed+sin(vUv.x*21.)*.12);
        float streak=smoothstep(.72,.8,run)*(.55+.45*sin(vUv.x*37.));
        gl_FragColor=vec4(mix(a,b,clamp(streak,0.,1.)),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

/**
 * A sculpted island. `height(x, z)` gives the ground level and `paintGround(y, x, z)`
 * its colour; the rim always dips below the sea so there is a real shoreline.
 * Returns the mesh's ground lookup so props can sit on the surface.
 */
export function terrain(parent, {radius, height, paintGround, segments = 72, rings = 26, coast = () => 1}) {
  const positions = [], colors = [], index = [], color = new T.Color();
  const ground = (x, z) => {
    const r = Math.hypot(x, z) / (radius * coast(Math.atan2(z, x)));
    return height(x, z) * (1 - T.MathUtils.smoothstep(r, .8, 1)) - 1.4 * T.MathUtils.smoothstep(r, .86, 1);
  };
  for (let i = 0; i <= rings; i++) for (let j = 0; j <= segments; j++) {
    const a = j / segments * Math.PI * 2, r = radius * coast(a) * Math.pow(i / rings, .85), x = Math.cos(a) * r, z = Math.sin(a) * r, y = ground(x, z);
    positions.push(x, y, z);
    color.set(paintGround(y, x, z));
    colors.push(color.r, color.g, color.b);
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
    const a = i * (segments + 1) + j, b = a + segments + 1;
    index.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const land = new T.Mesh(geometry, new T.MeshToonMaterial({vertexColors: true, gradientMap: mat('#ffffff').gradientMap}));
  parent.add(land);
  return ground;
}

/** A smooth hill centred on (cx, cz), for composing height functions. */
export const hill = (x, z, cx, cz, radius, tall) => tall * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (radius * radius));

/** A plastered house with a tiled gable roof, shuttered windows and a door. */
export function house(kit, parent, x, y, z, {w = 1.6, d = 1.4, floors = 1, wall = '#f3e6c4', roof = '#c9653c', facing = 0, trim = '#7a5a3c', chimney = true} = {}) {
  const {group, box, slab} = kit, g = group(parent, x, y, z, facing), h = floors * .95 + .15;
  box(0, h / 2, 0, w, h, d, wall, g);
  slab([[-w * .6, 0], [0, w * .42], [w * .6, 0]], d * 1.14, roof, g, 0, h, 0);
  box(0, .38, d / 2 + .01, .34, .76, .05, trim, g);
  for (let f = 0; f < floors; f++) for (const side of [-1, 1]) {
    if (f === 0 && floors === 1 && w < 1.3) continue;
    box(side * w * .3, .62 + f * .95, d / 2 + .01, .3, .36, .05, '#35626f', g);
    box(side * w * .3, .42 + f * .95, d / 2 + .04, .38, .05, .1, '#f7ead0', g);
  }
  if (chimney) box(w * .28, h + w * .3, -d * .2, .22, .5, .22, '#b79f84', g);
  return g;
}

/** Trees in the shapes the islands need. */
export function tree(kit, parent, x, y, z, s = 1, kind = 'round') {
  const {cyl, cone, sphere, rod} = kit;
  if (kind === 'pine') {
    cyl(x, y + s * .4, z, .1 * s, .14 * s, s * .8, '#6d5236', parent, 5);
    for (let i = 0; i < 3; i++) cone(x, y + s * (1.1 + i * .62), z, s * (.72 - i * .17), s * 1.05, i % 2 ? '#3f7a52' : '#35694a', parent, 7);
  } else if (kind === 'palm') {
    rod(v3(x, y, z), v3(x + .35 * s, y + 2.4 * s, z), .12 * s, '#9a7a4e', parent, .08 * s, 6);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const leaf = sphere(x + .35 * s + Math.cos(a) * .75 * s, y + 2.35 * s, z + Math.sin(a) * .75 * s, .8 * s, '#4f9a58', parent, 1, .12, .32, 8); leaf.rotation.y = -a; leaf.rotation.z = -.35; }
  } else if (kind === 'sakura') {
    rod(v3(x, y, z), v3(x + .1 * s, y + 1.2 * s, z), .13 * s, '#5b4334', parent, .08 * s, 6);
    for (const [dx, dy, dz, r] of [[0, 1.6, 0, .85], [.55, 1.35, .2, .6], [-.5, 1.4, -.25, .62], [.1, 2.05, -.1, .55]]) sphere(x + dx * s, y + dy * s, z + dz * s, r * s, rand() > .5 ? '#f4b6cb' : '#f7c9d8', parent, 1, .8, 1, 8);
  } else if (kind === 'giant') {
    rod(v3(x, y, z), v3(x, y + 5.2 * s, z), .75 * s, '#6f5236', parent, .45 * s, 8);
    for (const [dx, dy, dz, r] of [[0, 6.3, 0, 2.6], [1.7, 5.4, .6, 1.8], [-1.6, 5.6, -.5, 1.9], [.3, 5.2, -1.7, 1.7], [-.4, 7.6, .4, 1.6]]) sphere(x + dx * s, y + dy * s, z + dz * s, r * s, rand() > .5 ? '#3f8450' : '#4f9a5a', parent, 1, .72, 1, 9);
  } else {
    cyl(x, y + s * .5, z, .1 * s, .16 * s, s, '#7a5c3c', parent, 6);
    sphere(x, y + s * 1.45, z, s * .78, '#4f8f5c', parent, 1, 1.05, 1, 9);
    sphere(x + .38 * s, y + s * 1.8, z + .1 * s, s * .5, '#69a862', parent, 1, 1, 1, 8);
  }
}

/** A weathered boulder. */
export function rock(kit, parent, x, y, z, s, color = '#8f8a7c') {
  const stone = kit.mesh(new T.DodecahedronGeometry(s, 0), color, x, y, z, parent);
  stone.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  stone.scale.set(1, range(.55, .9), range(.8, 1.2));
  return stone;
}

/** A bank of cumulus: a few squashed spheres, never outlined or shadowing. */
export function cloud(kit, parent, x, y, z, s = 1, color = '#fbf8ee', count = 5) {
  const g = kit.group(parent, x, y, z);
  for (let i = 0; i < count; i++) kit.sphere((i - (count - 1) / 2) * 1.5 * s + range(-.3, .3), range(-.2, .5) * s, range(-.8, .8) * s, range(1.3, 2) * s, color, g, 1.25, .62, 1, 10);
  return g;
}

/** A painted signboard. */
export function sign(kit, parent, text, x, y, z, w, h, {ink = '#3b2a20', board = '#f3e6c4', font = 'bold 60px Georgia', facing = 0} = {}) {
  const texture = paint(512, Math.round(512 * h / w), (c, cw, ch) => {
    c.fillStyle = board; c.fillRect(0, 0, cw, ch);
    c.strokeStyle = ink; c.lineWidth = 10; c.strokeRect(8, 8, cw - 16, ch - 16);
    c.fillStyle = ink; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cw / 2, ch / 2 + 4, cw - 50);
  });
  const board3d = kit.panel(texture, w, h, parent, x, y, z);
  board3d.rotation.y = facing;
  return board3d;
}

/** A sloped channel of running water from a to b, with stone kerbs. */
export function ramp(kit, parent, a, b, width, material, kerb = '#e6d9bd') {
  const d = new T.Vector3().subVectors(b, a), length = d.length(), g = kit.group(parent);
  g.position.copy(a).add(b).multiplyScalar(.5);
  g.quaternion.setFromUnitVectors(v3(0, 0, 1), d.normalize());
  const water = new T.Mesh(new T.PlaneGeometry(width, length, 1, 1).rotateX(-Math.PI / 2), material);
  water.position.y = .12;
  g.add(water);
  if (kerb) for (const side of [-1, 1]) kit.box(side * (width / 2 + .18), .05, 0, .36, .55, length, kerb, g);
  return g;
}
