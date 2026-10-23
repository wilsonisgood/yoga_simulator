import * as THREE from 'three';
import { CatmullRomCurve3 } from 'three';
import { LIMBS } from './rig.js';

export const GROUPS = {
  rectus_abdominis: { zh: '腹直肌', en: 'Rectus abdominis', fn: '脊椎屈曲、穩定核心' },
  obliques: { zh: '腹外斜肌', en: 'External oblique', fn: '軀幹側彎與旋轉' },
  erector_spinae: { zh: '豎脊肌', en: 'Erector spinae', fn: '脊椎伸展、維持直立' },
  latissimus: { zh: '背闊肌', en: 'Latissimus dorsi', fn: '肩關節伸展、內收' },
  trapezius: { zh: '斜方肌', en: 'Trapezius', fn: '穩定與移動肩胛骨' },
  pectoralis: { zh: '胸大肌', en: 'Pectoralis major', fn: '肩關節水平內收、屈曲' },
  serratus: { zh: '前鋸肌', en: 'Serratus anterior', fn: '肩胛前伸、貼合胸廓' },
  iliopsoas: { zh: '髂腰肌', en: 'Iliopsoas', fn: '主要的髖屈肌（深層）' },
  glute_max: { zh: '臀大肌', en: 'Gluteus maximus', fn: '髖伸展、外旋' },
  glute_med: { zh: '臀中肌', en: 'Gluteus medius', fn: '髖外展、單腳站立時穩定骨盆' },
  adductors: { zh: '內收肌群', en: 'Adductors', fn: '大腿內收' },
  rectus_femoris: { zh: '股直肌', en: 'Rectus femoris', fn: '伸膝＋屈髖（跨兩關節）' },
  vasti: { zh: '股內／外側肌', en: 'Vastus medialis & lateralis', fn: '伸膝' },
  hamstrings: { zh: '膕繩肌', en: 'Hamstrings', fn: '屈膝、髖伸展' },
  gastrocnemius: { zh: '腓腸肌', en: 'Gastrocnemius', fn: '踝蹠屈（墊腳）、屈膝' },
  soleus: { zh: '比目魚肌', en: 'Soleus', fn: '踝蹠屈、站立平衡' },
  tibialis_anterior: { zh: '脛前肌', en: 'Tibialis anterior', fn: '踝背屈（勾腳）' },
  deltoid: { zh: '三角肌', en: 'Deltoid', fn: '肩關節外展、屈曲、伸展' },
  biceps: { zh: '肱二頭肌', en: 'Biceps brachii', fn: '屈肘、前臂旋後' },
  triceps: { zh: '肱三頭肌', en: 'Triceps brachii', fn: '伸肘' },
  forearm_flexors: { zh: '前臂屈肌群', en: 'Forearm flexors', fn: '屈腕、抓握' },
  forearm_extensors: { zh: '前臂伸肌群', en: 'Forearm extensors', fn: '伸腕' },
  scm: { zh: '胸鎖乳突肌', en: 'Sternocleidomastoid', fn: '轉頭、屈頸' },
};

// 標註時可用的複合名稱
export const ALIASES = {
  quadriceps: { zh: '股四頭肌', en: 'Quadriceps', groups: ['rectus_femoris', 'vasti'] },
  calves: { zh: '小腿三頭肌', en: 'Triceps surae', groups: ['gastrocnemius', 'soleus'] },
};

export function groupsOf(id) {
  return ALIASES[id] ? ALIASES[id].groups : [id];
}
export function labelOf(id) {
  return ALIASES[id] || GROUPS[id];
}

// 肌束定義（左側；c:true 表示位於中線、左右各一條但屬同一肌群）
// p: [骨骼, x, y, z]（骨骼局部座標），w: 半寬，d: 半厚
const B = (b, x, y, z) => [b, x, y, z];
const STRANDS = [
  { g: 'rectus_abdominis', c: true, w: 0.03, d: 0.013, p: [B('root', 0.025, -0.08, 0.08), B('root', 0.035, 0.03, 0.095), B('lumbar', 0.04, 0.08, 0.09), B('chest', 0.045, 0.0, 0.095), B('chest', 0.05, 0.08, 0.1)] },
  { g: 'obliques', w: 0.03, d: 0.012, p: [B('chest', 0.11, 0.06, 0.075), B('lumbar', 0.095, 0.07, 0.065), B('root', 0.085, 0.02, 0.08)] },
  { g: 'obliques', w: 0.03, d: 0.013, p: [B('chest', 0.135, 0.08, 0.0), B('lumbar', 0.105, 0.08, 0.015), B('root', 0.13, 0.04, 0.0)] },
  { g: 'erector_spinae', w: 0.022, d: 0.018, p: [B('root', 0.035, -0.05, -0.085), B('root', 0.04, 0.05, -0.085), B('lumbar', 0.04, 0.08, -0.08), B('chest', 0.04, 0.04, -0.095), B('chest', 0.035, 0.18, -0.095), B('chest', 0.025, 0.27, -0.065)] },
  { g: 'latissimus', w: 0.04, d: 0.01, p: [B('root', 0.03, 0.04, -0.095), B('lumbar', 0.08, 0.1, -0.075), B('chest', 0.125, 0.08, -0.065), B('chest', 0.145, 0.16, -0.035), B('upperArm', -0.03, -0.07, 0.01)] },
  { g: 'latissimus', w: 0.04, d: 0.01, p: [B('chest', 0.03, 0.1, -0.1), B('chest', 0.115, 0.13, -0.075), B('chest', 0.155, 0.18, -0.03), B('upperArm', -0.03, -0.06, 0.012)] },
  { g: 'trapezius', w: 0.032, d: 0.011, p: [B('head', 0.02, 0.02, -0.07), B('neck', 0.035, 0.03, -0.04), B('chest', 0.12, 0.25, -0.035), B('chest', 0.175, 0.24, -0.01)] },
  { g: 'trapezius', w: 0.035, d: 0.01, p: [B('chest', 0.01, 0.22, -0.09), B('chest', 0.1, 0.21, -0.075), B('chest', 0.165, 0.23, -0.035)] },
  { g: 'trapezius', w: 0.035, d: 0.01, p: [B('chest', 0.01, 0.07, -0.095), B('chest', 0.07, 0.14, -0.09), B('chest', 0.13, 0.21, -0.065)] },
  { g: 'pectoralis', w: 0.04, d: 0.012, p: [B('chest', 0.04, 0.24, 0.08), B('chest', 0.12, 0.22, 0.068), B('upperArm', 0.01, -0.06, 0.034)] },
  { g: 'pectoralis', w: 0.045, d: 0.013, p: [B('chest', 0.02, 0.12, 0.105), B('chest', 0.1, 0.15, 0.095), B('chest', 0.165, 0.17, 0.05), B('upperArm', 0.01, -0.08, 0.034)] },
  { g: 'serratus', w: 0.025, d: 0.008, p: [B('chest', 0.105, 0.04, 0.07), B('chest', 0.14, 0.08, 0.03), B('chest', 0.135, 0.14, -0.04)] },
  { g: 'iliopsoas', w: 0.022, d: 0.016, p: [B('lumbar', 0.035, 0.1, 0.025), B('root', 0.06, 0.0, 0.065), B('root', 0.08, -0.08, 0.08), B('thigh', -0.03, -0.06, 0.03)] },
  { g: 'glute_max', w: 0.05, d: 0.03, p: [B('root', 0.03, 0.03, -0.1), B('root', 0.105, -0.03, -0.095), B('thigh', 0.055, -0.08, -0.025)] },
  { g: 'glute_max', w: 0.05, d: 0.03, p: [B('root', 0.02, -0.07, -0.095), B('root', 0.09, -0.12, -0.085), B('thigh', 0.04, -0.13, -0.035)] },
  { g: 'glute_med', w: 0.035, d: 0.016, p: [B('root', 0.13, 0.05, -0.02), B('root', 0.15, -0.01, -0.01), B('thigh', 0.06, -0.015, 0.0)] },
  { g: 'adductors', w: 0.03, d: 0.022, p: [B('root', 0.03, -0.1, 0.045), B('thigh', -0.045, -0.14, 0.01), B('thigh', -0.04, -0.3, 0.0)] },
  { g: 'adductors', w: 0.03, d: 0.022, p: [B('root', 0.04, -0.12, 0.015), B('thigh', -0.05, -0.2, -0.015), B('thigh', -0.04, -0.38, -0.01)] },
  { g: 'rectus_femoris', w: 0.028, d: 0.022, p: [B('root', 0.1, -0.03, 0.08), B('thigh', 0.005, -0.1, 0.06), B('thigh', 0.0, -0.3, 0.06), B('thigh', 0.0, -0.42, 0.05), B('shin', 0.0, -0.02, 0.042), B('shin', 0.0, -0.07, 0.036)] },
  { g: 'vasti', w: 0.03, d: 0.022, p: [B('thigh', 0.05, -0.05, 0.02), B('thigh', 0.06, -0.22, 0.025), B('thigh', 0.042, -0.38, 0.04), B('shin', 0.025, -0.02, 0.04)] },
  { g: 'vasti', w: 0.028, d: 0.022, p: [B('thigh', -0.02, -0.18, 0.04), B('thigh', -0.045, -0.34, 0.035), B('thigh', -0.03, -0.41, 0.042), B('shin', -0.015, -0.03, 0.04)] },
  { g: 'hamstrings', w: 0.026, d: 0.022, p: [B('root', 0.06, -0.12, -0.055), B('thigh', 0.03, -0.15, -0.055), B('thigh', 0.042, -0.33, -0.045), B('shin', 0.04, -0.03, -0.028), B('shin', 0.042, -0.07, -0.012)] },
  { g: 'hamstrings', w: 0.026, d: 0.022, p: [B('root', 0.05, -0.12, -0.045), B('thigh', -0.01, -0.17, -0.055), B('thigh', -0.03, -0.34, -0.045), B('shin', -0.035, -0.03, -0.028), B('shin', -0.03, -0.08, 0.0)] },
  { g: 'gastrocnemius', w: 0.024, d: 0.022, p: [B('thigh', 0.028, -0.41, -0.028), B('shin', 0.028, -0.04, -0.042), B('shin', 0.026, -0.16, -0.055), B('shin', 0.008, -0.3, -0.035), B('foot', 0, -0.035, -0.055)] },
  { g: 'gastrocnemius', w: 0.024, d: 0.022, p: [B('thigh', -0.028, -0.41, -0.028), B('shin', -0.028, -0.04, -0.042), B('shin', -0.024, -0.15, -0.058), B('shin', -0.006, -0.3, -0.035), B('foot', 0, -0.035, -0.055)] },
  { g: 'soleus', w: 0.036, d: 0.014, p: [B('shin', 0.0, -0.08, -0.028), B('shin', 0.0, -0.22, -0.042), B('shin', 0.0, -0.34, -0.032), B('foot', 0, -0.035, -0.052)] },
  { g: 'tibialis_anterior', w: 0.017, d: 0.016, p: [B('shin', 0.022, -0.05, 0.03), B('shin', 0.026, -0.2, 0.03), B('shin', 0.01, -0.37, 0.032), B('foot', -0.015, -0.03, 0.06)] },
  { g: 'deltoid', w: 0.03, d: 0.02, p: [B('chest', 0.13, 0.235, 0.055), B('upperArm', 0.02, 0.02, 0.045), B('upperArm', 0.022, -0.12, 0.022)] },
  { g: 'deltoid', w: 0.03, d: 0.02, p: [B('chest', 0.175, 0.245, 0.0), B('upperArm', 0.05, 0.0, 0.0), B('upperArm', 0.035, -0.12, 0.0)] },
  { g: 'deltoid', w: 0.03, d: 0.02, p: [B('chest', 0.14, 0.235, -0.055), B('upperArm', 0.02, 0.02, -0.045), B('upperArm', 0.022, -0.12, -0.02)] },
  { g: 'biceps', w: 0.022, d: 0.02, p: [B('upperArm', 0.0, -0.02, 0.036), B('upperArm', 0.0, -0.15, 0.04), B('upperArm', 0.0, -0.26, 0.026), B('forearm', 0.0, -0.04, 0.018)] },
  { g: 'triceps', w: 0.026, d: 0.02, p: [B('upperArm', 0.0, 0.0, -0.036), B('upperArm', 0.005, -0.14, -0.045), B('upperArm', 0.0, -0.26, -0.03), B('forearm', 0.0, 0.02, -0.026)] },
  { g: 'forearm_flexors', w: 0.02, d: 0.014, p: [B('upperArm', -0.03, -0.28, 0.005), B('forearm', -0.018, -0.06, 0.022), B('forearm', -0.005, -0.18, 0.017), B('hand', 0, -0.02, 0.01)] },
  { g: 'forearm_extensors', w: 0.02, d: 0.014, p: [B('upperArm', 0.034, -0.27, 0.0), B('forearm', 0.022, -0.06, -0.014), B('forearm', 0.01, -0.18, -0.017), B('hand', 0, -0.02, -0.01)] },
  { g: 'scm', w: 0.013, d: 0.01, p: [B('chest', 0.025, 0.245, 0.075), B('neck', 0.03, 0.04, 0.03), B('head', 0.058, 0.03, -0.03)] },
];

const NL = 24, NR = 12;

function fiberTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 64);
  for (let y = 0; y < 64; y += 2) {
    const v = 215 + Math.random() * 40;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(0, y, 256, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const HALO_VS = `
uniform float uThick;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 p = position + normal * uThick;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const HALO_FS = `
uniform vec3 uColor; uniform float uI;
varying vec3 vN; varying vec3 vV;
void main(){
  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
  float a = uI * (0.12 + 0.88 * pow(f, 1.5));
  gl_FragColor = vec4(uColor * a, a);
}`;

export const COLORS = {
  base: new THREE.Color(0xc9a89c),
  dim: new THREE.Color(0x7a6b66),
  c: new THREE.Color(0xff3b30),
  s: new THREE.Color(0x2f8bff),
};

class Strand {
  constructor(def, side, mirrorX, rig, tex) {
    this.group = def.g;
    this.side = side; // 'L' | 'R' | 'C'
    this.def = def;
    this.pts = def.p.map(([bone, x, y, z]) => {
      const name = LIMBS.has(bone) ? `${bone}_${side}` : bone;
      const lx = mirrorX ? -x : x;
      const n = new THREE.Vector3(lx, 0, z);
      if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
      n.normalize();
      return { joint: rig.joints[name], local: new THREE.Vector3(lx, y, z), nLocal: n };
    });
    this.P = this.pts.map(() => new THREE.Vector3());
    this.N = this.pts.map(() => new THREE.Vector3());
    this.curve = new CatmullRomCurve3(this.P, false, 'centripetal');

    const vcount = (NL + 1) * (NR + 1);
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(vcount * 3);
    this.nor = new Float32Array(vcount * 3);
    const uv = new Float32Array(vcount * 2);
    const idx = [];
    for (let i = 0; i <= NL; i++) {
      for (let j = 0; j <= NR; j++) {
        const k = i * (NR + 1) + j;
        uv[k * 2] = i / NL;
        uv[k * 2 + 1] = j / NR;
        if (i < NL && j < NR) {
          const a = k, b = k + NR + 1, c = k + 1, d = k + NR + 2;
          idx.push(a, b, c, c, b, d);
        }
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.geo = geo;

    this.mat = new THREE.MeshStandardMaterial({
      color: COLORS.base.clone(), roughness: 0.55, metalness: 0.0, map: tex,
      emissive: new THREE.Color(0), emissiveIntensity: 1,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.userData.strand = this;

    this.haloMat = new THREE.ShaderMaterial({
      vertexShader: HALO_VS, fragmentShader: HALO_FS,
      uniforms: { uThick: { value: 0.007 }, uColor: { value: new THREE.Color() }, uI: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.halo = new THREE.Mesh(geo, this.haloMat);
    this.halo.frustumCulled = false;
    this.halo.visible = false;
    this.halo.renderOrder = 2;

    this.restLen = 0;
    this.len = 0;
    // 動畫狀態
    this.cur = { type: null, level: 0, w: 0 };
    this.want = { type: null, level: 0 };
  }

  rebuild() {
    for (let i = 0; i < this.pts.length; i++) {
      const p = this.pts[i];
      this.P[i].copy(p.local).applyMatrix4(p.joint.matrixWorld);
      this.N[i].copy(p.nLocal).transformDirection(p.joint.matrixWorld);
    }
    const n = this.pts.length;
    const C = [];
    let len = 0;
    for (let i = 0; i <= NL; i++) {
      C.push(this.curve.getPoint(i / NL, _v[i] || (_v[i] = new THREE.Vector3())));
      if (i) len += C[i].distanceTo(C[i - 1]);
    }
    this.len = len;
    const bulge = this.restLen ? THREE.MathUtils.clamp(Math.sqrt(this.restLen / len), 0.78, 1.35) : 1;
    const w = this.def.w * 1.25, d = this.def.d * 1.25;
    for (let i = 0; i <= NL; i++) {
      const s = i / NL;
      const c = C[i];
      _T.subVectors(C[Math.min(NL, i + 1)], C[Math.max(0, i - 1)]).normalize();
      const f = s * (n - 1);
      const k = Math.min(n - 2, Math.floor(f));
      _N.lerpVectors(this.N[k], this.N[k + 1], f - k);
      _N.addScaledVector(_T, -_N.dot(_T)).normalize();
      _B.crossVectors(_T, _N);
      const prof = Math.pow(Math.sin(Math.PI * s), 0.55) * bulge;
      const ww = Math.max(1e-4, w * prof), dd = Math.max(1e-4, d * prof);
      _c.copy(c).addScaledVector(_N, dd * 0.5);
      for (let j = 0; j <= NR; j++) {
        const a = (j / NR) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const k3 = (i * (NR + 1) + j) * 3;
        this.pos[k3] = _c.x + _N.x * dd * ca + _B.x * ww * sa;
        this.pos[k3 + 1] = _c.y + _N.y * dd * ca + _B.y * ww * sa;
        this.pos[k3 + 2] = _c.z + _N.z * dd * ca + _B.z * ww * sa;
        _n.copy(_N).multiplyScalar(ca / dd).addScaledVector(_B, sa / ww).normalize();
        this.nor[k3] = _n.x; this.nor[k3 + 1] = _n.y; this.nor[k3 + 2] = _n.z;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.normal.needsUpdate = true;
  }
}
const _v = [], _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3();
const _c = new THREE.Vector3(), _n = new THREE.Vector3();

export class MuscleSystem {
  constructor(rig, parent) {
    this.rig = rig;
    this.strands = [];
    const tex = fiberTexture();
    this.root = new THREE.Group();
    parent.add(this.root);
    for (const def of STRANDS) {
      const variants = def.c ? [['C', false], ['C', true]] : [['L', false], ['R', true]];
      for (const [side, mx] of variants) {
        const s = new Strand(def, side, mx, rig, tex);
        this.strands.push(s);
        this.root.add(s.mesh, s.halo);
      }
    }
    this.rebuild();
    for (const s of this.strands) s.restLen = s.len;
    this.dimOthers = true;
    this.solo = null; // { id, side }
    this.anyActive = false;
  }

  get meshes() { return this.strands.map((s) => s.mesh); }

  rebuild() { for (const s of this.strands) s.rebuild(); }

  static matches(strand, groupIds, side) {
    if (!groupIds.includes(strand.group)) return false;
    if (!side || strand.side === 'C') return true;
    return strand.side === side;
  }

  // annotations: [{ g, t:'c'|'s', lv, side }]（已處理過鏡像）
  setAnnotations(list) {
    for (const s of this.strands) s.want = { type: null, level: 0 };
    for (const a of list) {
      const ids = groupsOf(a.g);
      for (const s of this.strands) {
        if (MuscleSystem.matches(s, ids, a.side)) s.want = { type: a.t, level: a.lv || 2 };
      }
    }
    this.anyActive = list.length > 0;
  }

  lengthRatio(groupIds, side) {
    let r = 0, n = 0;
    for (const s of this.strands) {
      if (MuscleSystem.matches(s, groupIds, side)) { r += s.len / s.restLen; n++; }
    }
    return n ? r / n : 1;
  }

  update(dt, time, freq) {
    // 低頻、平滑的正弦脈動（遠低於 3 Hz 光敏安全上限）
    const pulse = 0.5 - 0.5 * Math.cos(2 * Math.PI * freq * time);
    const solo = this.solo;
    for (const s of this.strands) {
      const cur = s.cur, want = s.want;
      if (cur.type !== want.type) {
        cur.w -= dt * 2.5;
        if (cur.w <= 0) { cur.w = 0; cur.type = want.type; cur.level = want.level; }
      } else {
        cur.level = want.level;
        if (cur.type) cur.w = Math.min(1, cur.w + dt * 1.2);
      }
      const inSolo = solo && MuscleSystem.matches(s, groupsOf(solo.id), solo.side);
      const soloFactor = solo ? (inSolo ? 1.25 : 0.25) : 1;

      const m = s.mat;
      if (cur.type && cur.w > 0) {
        const col = COLORS[cur.type];
        const lvl = 0.45 + 0.275 * (cur.level - 1); // 1..3 → 0.45..1
        const k = cur.w * lvl * soloFactor;
        m.color.copy(COLORS.base).lerp(col, 0.45 * cur.w);
        m.emissive.copy(col).multiplyScalar((0.08 + 0.75 * pulse) * k);
        s.halo.visible = true;
        s.haloMat.uniforms.uColor.value.copy(col);
        s.haloMat.uniforms.uI.value = (0.1 + 0.9 * pulse) * k * 0.9;
      } else {
        const dim = (this.dimOthers && this.anyActive) || (solo && !inSolo);
        m.color.copy(dim ? COLORS.dim : COLORS.base);
        if (solo && inSolo) m.color.copy(COLORS.base).multiplyScalar(1.15);
        m.emissive.setRGB(0, 0, 0);
        s.halo.visible = false;
      }
    }
  }
}
