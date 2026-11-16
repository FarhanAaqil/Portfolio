// Shared modelling kit for the voyage: cel-shaded materials, primitive helpers,
// canvas textures, and a batcher that merges a model and wraps it in an ink outline.
import * as T from '../vendor/three.module.js';
import {mergeGeometries, mergeVertices} from '../vendor/BufferGeometryUtils.js';

export {T};

// Three flat tones, like anime cel paint.
const bands = new T.DataTexture(new Uint8Array([70, 150, 215, 255]), 4, 1, T.RedFormat);
bands.minFilter = bands.magFilter = T.NearestFilter;
bands.needsUpdate = true;

const toon = new Map();
/** Cached cel-shaded material for a colour. */
export function mat(color) {
  if (!toon.has(color)) {
    const material = new T.MeshToonMaterial({color, gradientMap: bands});
    material.userData.toon = true;
    toon.set(color, material);
  }
  return toon.get(color);
}

// Ink outlines are an inverted hull pushed out along smoothed normals. The push
// scales with distance so the line keeps a steady width on screen, and it fades
// into the same fog as everything else.
export const inkFog = {color: {value: new T.Color('#b7dedb')}, near: {value: 90}, far: {value: 240}};
const inks = new Map();
function inkMaterial(width) {
  if (!inks.has(width)) {
    inks.set(width, new T.ShaderMaterial({
      side: T.BackSide,
      uniforms: {w: {value: width}, fogColor: inkFog.color, fogNear: inkFog.near, fogFar: inkFog.far},
      vertexShader: `uniform float w;varying float depth;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.);depth=-mv.z;
          mv.xyz+=normalize(normalMatrix*normal)*w*clamp(depth,3.,90.)*.0025;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;varying float depth;
        void main(){gl_FragColor=vec4(mix(vec3(.09,.12,.15),fogColor,smoothstep(fogNear,fogFar,depth)),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    }));
  }
  return inks.get(width);
}

let seed = 42;
/** Deterministic random, so the world is identical on every visit. */
export function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
export const range = (a, b) => a + rand() * (b - a);
export const pick = list => list[Math.floor(rand() * list.length)];
export const v3 = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);

const UP = v3(0, 1, 0);

/** Paints a canvas and returns it as an sRGB texture (signs, sails, faces). */
export function paint(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Builds the helper set around a default parent (the scene). */
export function createKit(scene) {
  function mesh(geometry, color, x = 0, y = 0, z = 0, parent = scene) {
    const object = new T.Mesh(geometry, typeof color === 'string' ? mat(color) : color);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  const group = (parent = scene, x = 0, y = 0, z = 0, ry = 0) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    parent.add(g);
    return g;
  };
  const box = (x, y, z, w, h, d, c, p) => mesh(new T.BoxGeometry(w, h, d), c, x, y, z, p);
  const cyl = (x, y, z, r1, r2, h, c, p, n = 12) => mesh(new T.CylinderGeometry(r1, r2, h, n), c, x, y, z, p);
  const cone = (x, y, z, r, h, c, p, n = 12) => mesh(new T.ConeGeometry(r, h, n), c, x, y, z, p);
  const sphere = (x, y, z, r, c, p, sx = 1, sy = 1, sz = 1, detail = 16) => {
    const object = mesh(new T.SphereGeometry(r, detail, Math.max(6, Math.round(detail * .65))), c, x, y, z, p);
    object.scale.set(sx, sy, sz);
    return object;
  };
  const torus = (x, y, z, radius, tube, c, p, arc = Math.PI * 2, segments = 24) =>
    mesh(new T.TorusGeometry(radius, tube, 6, segments, arc), c, x, y, z, p);
  /** A tapered limb between two points. */
  function rod(a, b, r, color, parent, r2 = r, sides = 6) {
    const d = new T.Vector3().subVectors(b, a);
    const object = mesh(new T.CylinderGeometry(r2, r, d.length(), sides), color, 0, 0, 0, parent);
    object.position.copy(a).add(b).multiplyScalar(.5);
    object.quaternion.setFromUnitVectors(UP, d.normalize());
    return object;
  }
  /** A smooth pipe through points. */
  const tube = (points, r, color, parent, sides = 6, closed = false) =>
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points, closed), Math.max(8, points.length * 6), r, sides, closed), color, 0, 0, 0, parent);
  /** A turned profile: [[radius, height], ...]. Listed in either direction; it is always built facing outwards. */
  function lathe(profile, color, parent, x = 0, y = 0, z = 0, segments = 24) {
    const ordered = profile[0][1] > profile[profile.length - 1][1] ? [...profile].reverse() : profile;
    return mesh(new T.LatheGeometry(ordered.map(([r, h]) => new T.Vector2(r, h)), segments), color, x, y, z, parent);
  }
  /** A flat outline [[x, y], ...] extruded along z and centred on it. */
  function slab(outline, depth, color, parent, x = 0, y = 0, z = 0) {
    const shape = new T.Shape(outline.map(([px, py]) => new T.Vector2(px, py)));
    const geometry = new T.ExtrudeGeometry(shape, {depth, bevelEnabled: false});
    geometry.translate(0, 0, -depth / 2);
    return mesh(geometry, color, x, y, z, parent);
  }
  /** A textured, unlit-by-toon panel for signs and decals. */
  function panel(texture, w, h, parent, x = 0, y = 0, z = 0, options = {}) {
    const material = new T.MeshBasicMaterial({map: texture, transparent: true, side: T.DoubleSide, ...options});
    return mesh(new T.PlaneGeometry(w, h), material, x, y, z, parent);
  }

  /**
   * Merges every cel-shaded mesh under `root` into one mesh per colour, in the
   * root's own space, then adds a single ink hull around the lot. Anything inside
   * an `exclude`d object, and anything textured or transparent, is left alone so
   * it can still animate.
   */
  function batch(root, {exclude = new Set(), ink = 1} = {}) {
    root.updateWorldMatrix(true, true);
    const inverse = new T.Matrix4().copy(root.matrixWorld).invert();
    const byMaterial = new Map();
    root.traverse(object => {
      if (!object.isMesh || !object.material.userData?.toon) return;
      for (let node = object; node && node !== root; node = node.parent) if (exclude.has(node)) return;
      if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
      byMaterial.get(object.material).push(object);
    });
    const hull = [];
    for (const [material, items] of byMaterial) {
      const parts = items.map(object => {
        const part = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        for (const name of Object.keys(part.attributes)) if (!['position', 'normal', 'uv'].includes(name)) part.deleteAttribute(name);
        return part.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      });
      const merged = mergeGeometries(parts);
      parts.forEach(part => part.dispose());
      if (!merged) continue;
      items.forEach(object => {
        object.removeFromParent();
        object.geometry.dispose();
      });
      root.add(new T.Mesh(merged, material));
      if (ink) hull.push(new T.BufferGeometry().setAttribute('position', merged.getAttribute('position').clone()));
    }
    if (hull.length) {
      const welded = mergeVertices(mergeGeometries(hull), .002);
      welded.computeVertexNormals();
      const outline = new T.Mesh(welded, inkMaterial(ink));
      outline.userData.ink = true;
      root.add(outline);
      hull.forEach(part => part.dispose());
    }
    return root;
  }

  return {mesh, group, box, cyl, cone, sphere, torus, rod, tube, lathe, slab, panel, batch};
}
