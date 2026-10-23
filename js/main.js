import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MUSCLES, POSES } from './data.js';

const D2R = Math.PI / 180;
const MUSCLE_BY_ID = Object.fromEntries(MUSCLES.map((m) => [m.id, m]));
const SIDE_ZH = { L: '左', R: '右' };

// ---------------------------------------------------------------------------
// 場景
// ---------------------------------------------------------------------------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const BG = 0x0c1016;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 7, 15);

const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 60);
camera.position.set(1.6, 1.3, 3.3);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 1.3;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.53;
controls.autoRotateSpeed = 0.8;
controls.target.set(0, 0.9, 0);

scene.add(new THREE.HemisphereLight(0xc6d6ff, 0x30241e, 0.85));
const key = new THREE.DirectionalLight(0xfff4ea, 1.7);
key.position.set(2.2, 5, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 12 });
key.shadow.bias = -0.0004;
key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.DirectionalLight(0x8fb0ff, 0.9);
rim.position.set(-3, 2.5, -3);
scene.add(rim);

// 地面：放射漸層圓盤 + 瑜伽墊
{
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, '#1c2430');
  grd.addColorStop(0.6, '#131a23');
  grd.addColorStop(1, '#0c1016');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
}
const mat = (() => {
  const w = 0.68, l = 1.9, r = 0.05;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -l / 2);
  s.lineTo(w / 2 - r, -l / 2); s.quadraticCurveTo(w / 2, -l / 2, w / 2, -l / 2 + r);
  s.lineTo(w / 2, l / 2 - r); s.quadraticCurveTo(w / 2, l / 2, w / 2 - r, l / 2);
  s.lineTo(-w / 2 + r, l / 2); s.quadraticCurveTo(-w / 2, l / 2, -w / 2, l / 2 - r);
  s.lineTo(-w / 2, -l / 2 + r); s.quadraticCurveTo(-w / 2, -l / 2, -w / 2 + r, -l / 2);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x35585a, roughness: 0.95 }));
  m.receiveShadow = true;
  m.position.y = 0.0005;
  const g = new THREE.Group();
  g.add(m);
  scene.add(g);
  return g;
})();

// ---------------------------------------------------------------------------
// 骨架（每根骨頭是一個 Group，人物面向 +Z，左邊 = +X）
// ---------------------------------------------------------------------------
const bones = {};
const BONE_DEFS = [
  ['root', null, [0, 1.0, 0]],
  ['lumbar', 'root', [0, 0.08, -0.01]],
  ['chest', 'lumbar', [0, 0.17, 0]],
  ['neck', 'chest', [0, 0.27, -0.005]],
  ['head', 'neck', [0, 0.09, 0.01]],
];
for (const side of ['L', 'R']) {
  const s = side === 'L' ? 1 : -1;
  BONE_DEFS.push(
    ['upperArm_' + side, 'chest', [0.2 * s, 0.23, -0.01]],
    ['forearm_' + side, 'upperArm_' + side, [0, -0.29, 0]],
    ['hand_' + side, 'forearm_' + side, [0, -0.25, 0]],
    ['thigh_' + side, 'root', [0.09 * s, -0.06, 0]],
    ['shin_' + side, 'thigh_' + side, [0, -0.43, 0]],
    ['foot_' + side, 'shin_' + side, [0, -0.42, 0]],
  );
}
const figure = new THREE.Group();
scene.add(figure);
for (const [name, parent, pos] of BONE_DEFS) {
  const b = new THREE.Group();
  b.name = name;
  b.position.set(...pos);
  (parent ? bones[parent] : figure).add(b);
  bones[name] = b;
}
const BONE_ALIAS = { ua: 'upperArm', fa: 'forearm', hand: 'hand', thigh: 'thigh', shin: 'shin', foot: 'foot' };
const boneFor = (b, side) => bones[BONE_ALIAS[b] ? `${BONE_ALIAS[b]}_${side}` : b];

// 透明外殼（菲涅耳邊緣光，像 X 光一樣看得到裡面的肌肉）
const shellMat = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(0xa9bfdf) }, uOpacity: { value: 1 } },
  vertexShader: `
    varying vec3 vN; varying vec3 vV;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor; uniform float uOpacity;
    varying vec3 vN; varying vec3 vV;
    void main(){
      float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
      f = pow(f, 2.4);
      gl_FragColor = vec4(uColor, (0.045 + 0.42 * f) * uOpacity);
    }`,
  transparent: true,
  depthWrite: false,
});
const shells = [];
const SPH = new THREE.SphereGeometry(1, 32, 20);
function addShell(bone, geo, pos, scale) {
  const m = new THREE.Mesh(geo, shellMat);
  m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  m.renderOrder = 2;
  bones[bone].add(m);
  shells.push(m);
  return m;
}
addShell('root', SPH, [0, 0.0, -0.005], [0.16, 0.12, 0.115]);
addShell('lumbar', SPH, [0, 0.08, 0], [0.14, 0.13, 0.1]);
addShell('chest', SPH, [0, 0.14, 0], [0.158, 0.185, 0.115]);
addShell('neck', new THREE.CapsuleGeometry(0.05, 0.08, 6, 16), [0, 0.05, 0]);
addShell('head', SPH, [0, 0.1, 0.01], [0.09, 0.115, 0.1]);
{
  const nose = addShell('head', new THREE.ConeGeometry(0.018, 0.045, 12), [0, 0.085, 0.115]);
  nose.rotation.x = Math.PI / 2;
}
for (const side of ['L', 'R']) {
  addShell('upperArm_' + side, new THREE.CapsuleGeometry(0.047, 0.22, 6, 16), [0, -0.145, 0]);
  addShell('forearm_' + side, new THREE.CapsuleGeometry(0.038, 0.19, 6, 16), [0, -0.125, 0]);
  addShell('hand_' + side, SPH, [0, -0.085, 0], [0.043, 0.09, 0.02]);
  addShell('thigh_' + side, new THREE.CapsuleGeometry(0.072, 0.3, 6, 18), [0, -0.215, 0]);
  addShell('shin_' + side, new THREE.CapsuleGeometry(0.05, 0.33, 6, 16), [0, -0.21, 0]);
  addShell('foot_' + side, SPH, [0, -0.05, 0.06], [0.045, 0.035, 0.125]);
}

// ---------------------------------------------------------------------------
// 肌束：沿錨點的平滑管狀網格，每次姿勢改變時重新計算
// ---------------------------------------------------------------------------
const SEG = 24, RAD = 10;
const COL = {
  base: new THREE.Color(0x7e5a5a),
  redBase: new THREE.Color(0xb8403c),
  blueBase: new THREE.Color(0x2f62b8),
  red: new THREE.Color(0xff2a20),
  blue: new THREE.Color(0x2f86ff),
  hover: new THREE.Color(0x4a4a4a),
};

function makeTubeGeometry() {
  const nV = (SEG + 1) * RAD + 2;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nV * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const idx = [];
  for (let i = 0; i < SEG; i++) {
    for (let j = 0; j < RAD; j++) {
      const a = i * RAD + j, b = i * RAD + ((j + 1) % RAD);
      const c = a + RAD, d = b + RAD;
      idx.push(a, b, c, b, d, c);
    }
  }
  const s = (SEG + 1) * RAD, e = s + 1;
  for (let j = 0; j < RAD; j++) {
    idx.push(s, (j + 1) % RAD, j);
    idx.push(e, SEG * RAD + j, SEG * RAD + ((j + 1) % RAD));
  }
  g.setIndex(idx);
  return g;
}

const profile = (t) => 0.22 + 0.78 * Math.pow(Math.sin(Math.PI * t), 0.75);
const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3(), _tmp = new THREE.Vector3();

class Strand {
  constructor(muscle, side, def, material) {
    this.muscle = muscle;
    this.side = side;
    this.r = def.r;
    this.anchors = def.pts.map(([b, p]) => ({
      bone: boneFor(b, side),
      p: new THREE.Vector3(side === 'R' ? -p[0] : p[0], p[1], p[2]),
    }));
    this.curve = new THREE.CatmullRomCurve3(this.anchors.map(() => new THREE.Vector3()), false, 'centripetal');
    this.samples = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
    this.geo = makeTubeGeometry();
    this.mesh = new THREE.Mesh(this.geo, material);
    this.mesh.castShadow = true;
    this.mesh.renderOrder = 1;
    this.mesh.frustumCulled = false;
    this.mesh.userData.strand = this;
    this.rest = 0;
    this.len = 0;
  }
  update() {
    const P = this.curve.points;
    for (let i = 0; i < this.anchors.length; i++) {
      P[i].copy(this.anchors[i].p).applyMatrix4(this.anchors[i].bone.matrixWorld);
    }
    const S = this.samples;
    let len = 0;
    for (let i = 0; i <= SEG; i++) {
      this.curve.getPoint(i / SEG, S[i]);
      if (i) len += S[i].distanceTo(S[i - 1]);
    }
    this.len = len;
    // 縮短 → 變粗、拉長 → 變細（大致維持體積）
    const k = this.rest ? THREE.MathUtils.clamp(Math.sqrt(this.rest / len), 0.72, 1.45) : 1;
    const pos = this.geo.attributes.position.array;
    for (let i = 0; i <= SEG; i++) {
      _T.subVectors(S[Math.min(i + 1, SEG)], S[Math.max(i - 1, 0)]).normalize();
      if (i === 0) {
        _tmp.set(Math.abs(_T.x) < 0.9 ? 1 : 0, Math.abs(_T.x) < 0.9 ? 0 : 1, 0);
        _N.crossVectors(_T, _tmp).normalize();
      } else {
        _N.addScaledVector(_T, -_N.dot(_T)).normalize();
      }
      _B.crossVectors(_T, _N);
      const r = this.r * k * profile(i / SEG);
      for (let j = 0; j < RAD; j++) {
        const a = (j / RAD) * Math.PI * 2, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        const o = (i * RAD + j) * 3;
        pos[o] = S[i].x + _N.x * ca + _B.x * sa;
        pos[o + 1] = S[i].y + _N.y * ca + _B.y * sa;
        pos[o + 2] = S[i].z + _N.z * ca + _B.z * sa;
      }
      if (i === 0 || i === SEG) {
        const o = ((SEG + 1) * RAD + (i === 0 ? 0 : 1)) * 3;
        const d = (i === 0 ? -1 : 1) * r * 0.7;
        pos[o] = S[i].x + _T.x * d;
        pos[o + 1] = S[i].y + _T.y * d;
        pos[o + 2] = S[i].z + _T.z * d;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
  }
}

// 每塊肌肉 × 每一側 = 一個 unit（共用一個材質，控制閃爍）
const units = {}; // key: `${id}.${side}`
const strands = [];
const muscleLayer = new THREE.Group();
scene.add(muscleLayer);
for (const m of MUSCLES) {
  for (const side of ['L', 'R']) {
    const material = new THREE.MeshStandardMaterial({
      color: COL.base.clone(), roughness: 0.55, metalness: 0.0, transparent: true, opacity: 1,
    });
    const unit = {
      key: `${m.id}.${side}`, muscle: m, side, material, strands: [],
      wC: 0, wS: 0, tC: 0, tS: 0, op: 1, hl: 0,
    };
    for (const def of m.strands) {
      const s = new Strand(m, side, def, material);
      s.unit = unit;
      unit.strands.push(s);
      strands.push(s);
      muscleLayer.add(s.mesh);
    }
    units[unit.key] = unit;
  }
}
const muscleMeshes = strands.map((s) => s.mesh);

// ---------------------------------------------------------------------------
// 姿勢 → 關節旋轉
// ---------------------------------------------------------------------------
const JOINTS = Object.keys(bones);
function poseQuats(pose) {
  const A = pose.angles || {};
  const g = (o, k) => (o && o[k]) || 0;
  const q = {};
  const set = (bone, x, y, z, order) => {
    q[bone] = new THREE.Quaternion().setFromEuler(new THREE.Euler(x * D2R, y * D2R, z * D2R, order));
  };
  for (const j of JOINTS) q[j] = new THREE.Quaternion();
  const r = A.root;
  set('root', g(r, 'pitch'), g(r, 'yaw'), -g(r, 'roll'), 'YXZ');
  for (const sp of ['lumbar', 'chest', 'neck', 'head']) {
    const o = A[sp];
    set(sp, g(o, 'flex'), g(o, 'twist'), -g(o, 'side'), 'YXZ');
  }
  for (const side of ['L', 'R']) {
    const s = side === 'L' ? 1 : -1;
    const pick = (k) => (A[k] && A[k][side]) || null;
    const sh = pick('shoulder'), el = pick('elbow'), wr = pick('wrist');
    const hp = pick('hip'), kn = pick('knee'), an = pick('ankle');
    set('upperArm_' + side, -g(sh, 'flex'), s * g(sh, 'rot'), s * g(sh, 'abd'), 'ZXY');
    set('forearm_' + side, -g(el, 'flex'), -s * g(el, 'pron'), 0, 'ZXY');
    set('hand_' + side, g(wr, 'ext'), 0, s * g(wr, 'dev'), 'ZXY');
    set('thigh_' + side, -g(hp, 'flex'), s * g(hp, 'rot'), s * g(hp, 'abd'), 'ZXY');
    set('shin_' + side, g(kn, 'flex'), 0, 0, 'ZXY');
    set('foot_' + side, -g(an, 'dorsi'), 0, s * g(an, 'roll'), 'ZXY');
  }
  return q;
}

function applyQuats(q) {
  for (const j of JOINTS) bones[j].quaternion.copy(q[j]);
}

// 把最低點放到地面、水平置中
const _box = new THREE.Box3();
function solveGround() {
  const root = bones.root;
  root.position.set(0, 1, 0);
  figure.updateMatrixWorld(true);
  _box.makeEmpty();
  for (const m of shells) _box.expandByObject(m, true);
  root.position.x -= (_box.min.x + _box.max.x) / 2;
  root.position.z -= (_box.min.z + _box.max.z) / 2;
  root.position.y -= _box.min.y;
  figure.updateMatrixWorld(true);
}
function measure() {
  figure.updateMatrixWorld(true);
  const b = new THREE.Box3();
  for (const m of shells) b.expandByObject(m, true);
  return b;
}
function updateMuscles() {
  for (const s of strands) s.update();
}

// 靜止站姿 → 記錄每條肌束的「原始長度」
applyQuats(poseQuats({ angles: {} }));
solveGround();
updateMuscles();
for (const s of strands) s.rest = s.len;

// ---------------------------------------------------------------------------
// 姿勢切換動畫
// ---------------------------------------------------------------------------
let current = null;
let tween = null; // { from, to, t0, dur }
let camTween = null;
let needsGeo = true;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function snapshot() {
  const q = {};
  for (const j of JOINTS) q[j] = bones[j].quaternion.clone();
  return q;
}

function rolesFor(pose) {
  const out = {};
  const add = (map, type) => {
    for (const [k, level] of Object.entries(map || {})) {
      const [id, side] = k.split('.');
      for (const sd of side ? [side] : ['L', 'R']) out[`${id}.${sd}`] = { type, level };
    }
  };
  add(pose.contract, 'c');
  add(pose.stretch, 's');
  return out;
}

function selectPose(id, { instant = false } = {}) {
  const pose = POSES.find((p) => p.id === id);
  if (!pose) return;
  current = pose;
  const to = poseQuats(pose);

  // 先算出目標姿勢的外框，讓鏡頭可以預先移動
  const keep = snapshot();
  applyQuats(to);
  solveGround();
  const box = measure();
  applyQuats(keep);
  solveGround();

  const center = box.getCenter(new THREE.Vector3());
  const c = pose.cam;
  const dir = new THREE.Vector3(
    Math.sin(c.az * D2R) * Math.cos(c.el * D2R),
    Math.sin(c.el * D2R),
    Math.cos(c.az * D2R) * Math.cos(c.el * D2R),
  );
  const toTarget = new THREE.Vector3(0, Math.max(0.45, center.y * 0.92), 0);
  const toPos = toTarget.clone().addScaledVector(dir, c.dist);

  if (instant) {
    applyQuats(to);
    tween = null;
    camera.position.copy(toPos);
    controls.target.copy(toTarget);
    mat.rotation.y = pose.mat === 'x' ? Math.PI / 2 : 0;
    needsGeo = true;
  } else {
    tween = { from: snapshot(), to, t0: performance.now(), dur: 1600 };
    camTween = {
      fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
      toPos, toTarget, t0: performance.now(), dur: 1700,
    };
  }
  matTarget = pose.mat === 'x' ? Math.PI / 2 : 0;

  const roles = rolesFor(pose);
  for (const u of Object.values(units)) {
    const r = roles[u.key];
    u.tC = r && r.type === 'c' ? r.level / 2 : 0;
    u.tS = r && r.type === 's' ? r.level / 2 : 0;
    u.role = r || null;
  }
  renderPoseUI(pose);
  if (selected) renderMuscleCard();
}
let matTarget = 0;

// ---------------------------------------------------------------------------
// 後製：輕微 bloom 讓發光肌肉有光暈
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.75, 0.55, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  // 窄螢幕時拉遠一點，避免人物被裁切
  camera.fov = w / h < 0.8 ? 48 : 34;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------------------
// 互動：滑過顯示名稱、點擊選取
// ---------------------------------------------------------------------------
const tip = document.getElementById('tip');
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null; // unit
let selected = null; // { id, side|null }
let downAt = null;

function pick(ev) {
  const rect = canvas.getBoundingClientRect();
  ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const vis = muscleMeshes.filter((m) => m.material.opacity > 0.5);
  const hit = raycaster.intersectObjects(vis, false)[0];
  return hit ? hit.object.userData.strand.unit : null;
}
canvas.addEventListener('pointermove', (ev) => {
  if (ev.pointerType !== 'mouse') return;
  const u = pick(ev);
  hovered = u;
  canvas.style.cursor = u ? 'pointer' : '';
  if (u) {
    tip.innerHTML = `<b>${u.muscle.zh}</b>（${SIDE_ZH[u.side]}）${roleBadge(u.role, true)}`;
    tip.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY + 14}px)`;
    tip.classList.add('on');
  } else tip.classList.remove('on');
});
canvas.addEventListener('pointerleave', () => { hovered = null; tip.classList.remove('on'); });
canvas.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
canvas.addEventListener('pointerup', (ev) => {
  if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 6) return;
  const u = pick(ev);
  if (u) selectMuscle(u.muscle.id, u.side);
  else if (selected) selectMuscle(null);
});
controls.addEventListener('start', () => { camTween = null; });

function selectMuscle(id, side = null) {
  selected = id ? { id, side } : null;
  renderMuscleCard();
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const $ = (s) => document.querySelector(s);
const poseList = $('#poseList');
POSES.forEach((p, i) => {
  const b = document.createElement('button');
  b.className = 'pose';
  b.dataset.id = p.id;
  b.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span>
    <span class="txt"><span class="zh">${p.zh}</span><span class="sa">${p.sa}</span></span>
    <span class="tag">${p.tag}</span>`;
  b.addEventListener('click', () => { stopAuto(); selectPose(p.id); });
  poseList.appendChild(b);
});

function roleBadge(role, compact) {
  if (!role) return compact ? '' : '<span class="badge none">此體式未特別參與</span>';
  const t = role.type === 'c' ? '收縮' : '伸展';
  const lv = role.level >= 2 ? '主要' : '次要';
  return `<span class="badge ${role.type === 'c' ? 'red' : 'blue'}">${t} · ${lv}</span>`;
}

function chipList(map) {
  const entries = Object.entries(map || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return '<p class="empty">此體式幾乎不需要主動出力。</p>';
  return entries.map(([k, lv]) => {
    const [id, side] = k.split('.');
    const m = MUSCLE_BY_ID[id];
    return `<button class="chip lv${lv}" data-id="${id}" data-side="${side || ''}">${m.zh}${side ? `<small>${SIDE_ZH[side]}</small>` : ''}</button>`;
  }).join('');
}

function renderPoseUI(pose) {
  document.querySelectorAll('.pose').forEach((b) => b.classList.toggle('active', b.dataset.id === pose.id));
  $('#poseTitle').textContent = pose.zh;
  $('#poseSub').textContent = `${pose.sa} · ${pose.en}`;
  $('#poseDesc').textContent = pose.desc;
  $('#contractList').innerHTML = chipList(pose.contract);
  $('#stretchList').innerHTML = chipList(pose.stretch);
  $('#cueList').innerHTML = pose.cues.map((c) => `<li>${c}</li>`).join('');
  const act = document.querySelector('.pose.active');
  if (act) act.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}
$('#detail').addEventListener('click', (ev) => {
  const chip = ev.target.closest('.chip');
  if (chip) selectMuscle(chip.dataset.id, chip.dataset.side || null);
  if (ev.target.closest('#mcClose')) selectMuscle(null);
});

function pct(u) {
  const len = u.strands.reduce((a, s) => a + s.len, 0);
  const rest = u.strands.reduce((a, s) => a + s.rest, 0);
  const v = Math.round((len / rest - 1) * 100);
  return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v) + '%';
}

function renderMuscleCard() {
  const card = $('#muscleCard');
  if (!selected) { card.hidden = true; return; }
  const m = MUSCLE_BY_ID[selected.id];
  const sides = selected.side ? [selected.side] : ['L', 'R'];
  const us = sides.map((sd) => units[`${m.id}.${sd}`]);
  const same = us.length === 2 && JSON.stringify(us[0].role) === JSON.stringify(us[1].role);
  const roleHtml = same || us.length === 1
    ? roleBadge(us[0].role)
    : us.map((u) => `<span class="side">${SIDE_ZH[u.side]}</span>${roleBadge(u.role)}`).join(' ');
  card.innerHTML = `
    <div class="mc-head">
      <div><div class="mc-zh">${m.zh}${selected.side ? `<small>（${SIDE_ZH[selected.side]}）</small>` : ''}</div>
      <div class="mc-en">${m.en}</div></div>
      <button id="mcClose" aria-label="關閉">×</button>
    </div>
    <p class="mc-fn">${m.fn}</p>
    <div class="mc-row"><span class="lbl">在「${current.zh}」</span>${roleHtml}</div>
    <div class="mc-row"><span class="lbl">肌肉長度 vs 站姿</span>
      <span class="len" id="mcLen">${us.map((u) => `${us.length > 1 ? SIDE_ZH[u.side] + ' ' : ''}${pct(u)}`).join('　')}</span></div>`;
  card.hidden = false;
}

// 開關
const opts = { focus: false, shell: true, speed: 0.5 };
$('#optFocus').addEventListener('change', (e) => { opts.focus = e.target.checked; });
$('#optShell').addEventListener('change', (e) => { opts.shell = e.target.checked; });
$('#optRotate').addEventListener('change', (e) => { controls.autoRotate = e.target.checked; });
$('#optSpeed').addEventListener('input', (e) => {
  opts.speed = parseFloat(e.target.value);
  $('#speedVal').textContent = opts.speed.toFixed(1) + ' Hz';
});

// 自動播放
let autoTimer = null;
const autoBtn = $('#autoBtn');
function stopAuto() {
  clearInterval(autoTimer);
  autoTimer = null;
  autoBtn.classList.remove('on');
  autoBtn.textContent = '▶ 自動播放';
}
autoBtn.addEventListener('click', () => {
  if (autoTimer) return stopAuto();
  autoBtn.classList.add('on');
  autoBtn.textContent = '❚❚ 暫停';
  const next = () => {
    const i = POSES.indexOf(current);
    selectPose(POSES[(i + 1) % POSES.length].id);
  };
  next();
  autoTimer = setInterval(next, 6500);
});

addEventListener('keydown', (ev) => {
  if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp' && ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
  if (ev.target.closest && ev.target.closest('input')) return;
  const d = ev.key === 'ArrowDown' || ev.key === 'ArrowRight' ? 1 : -1;
  const i = POSES.indexOf(current);
  stopAuto();
  selectPose(POSES[(i + d + POSES.length) % POSES.length].id);
  ev.preventDefault();
});

// ---------------------------------------------------------------------------
// 主迴圈
// ---------------------------------------------------------------------------
const tmpQ = new THREE.Quaternion();
let last = performance.now();
let lenTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (tween) {
    const t = Math.min(1, (now - tween.t0) / tween.dur);
    const e = ease(t);
    for (const j of JOINTS) bones[j].quaternion.copy(tmpQ.copy(tween.from[j]).slerp(tween.to[j], e));
    if (t >= 1) tween = null;
    needsGeo = true;
  }
  if (needsGeo) {
    solveGround();
    updateMuscles();
    needsGeo = !!tween;
    if (selected && (lenTick++ % 4 === 0 || !tween)) {
      const el = document.getElementById('mcLen');
      if (el) renderMuscleCard();
    }
  }
  if (camTween) {
    const t = Math.min(1, (now - camTween.t0) / camTween.dur);
    const e = ease(t);
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
    if (t >= 1) camTween = null;
  }
  mat.rotation.y += (matTarget - mat.rotation.y) * Math.min(1, dt * 4);

  // 肌肉顏色：低頻呼吸式閃爍
  const pulse = 0.5 - 0.5 * Math.cos(now / 1000 * Math.PI * 2 * opts.speed);
  const k = Math.min(1, dt * 3.5);
  for (const u of Object.values(units)) {
    u.wC += (u.tC - u.wC) * k;
    u.wS += (u.tS - u.wS) * k;
    const isSel = selected && selected.id === u.muscle.id && (!selected.side || selected.side === u.side);
    const isHov = hovered === u;
    u.hl += ((isSel ? 1 : isHov ? 0.6 : 0) - u.hl) * Math.min(1, dt * 10);

    const m = u.material;
    m.color.copy(COL.base).lerp(COL.redBase, Math.min(1, u.wC * 1.4)).lerp(COL.blueBase, Math.min(1, u.wS * 1.4));
    const amp = 0.18 + 2.2 * pulse;
    m.emissive.setRGB(0, 0, 0)
      .addScaledColor(COL.red, u.wC * amp)
      .addScaledColor(COL.blue, u.wS * amp)
      .addScaledColor(COL.hover, u.hl);

    const involved = u.wC + u.wS > 0.05 || isSel;
    const targetOp = opts.focus && !involved ? 0.1 : selected && !isSel && !involved ? 0.55 : 1;
    u.op += (targetOp - u.op) * Math.min(1, dt * 6);
    m.opacity = u.op;
    m.depthWrite = u.op > 0.9;
  }
  shellMat.uniforms.uOpacity.value += ((opts.shell ? 1 : 0) - shellMat.uniforms.uOpacity.value) * Math.min(1, dt * 6);

  controls.update();
  composer.render();
  requestAnimationFrame(frame);
}

const startId = (location.hash || '').slice(1);
selectPose(POSES.some((p) => p.id === startId) ? startId : 'mountain', { instant: true });
requestAnimationFrame(frame);

// 除錯用
window.__app = { bones, units, strands, selectPose, poseQuats, applyQuats, solveGround, measure, POSES, camera, controls };
