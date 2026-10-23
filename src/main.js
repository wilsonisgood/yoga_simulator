import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Rig } from './rig.js';
import { MuscleSystem, GROUPS, labelOf, groupsOf } from './muscles.js';
import { POSES } from './poses.js';

// ---------- 場景 ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1218);
scene.fog = new THREE.Fog(0x0e1218, 7, 16);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
camera.position.set(2.6, 1.5, 3.6);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 0.9, 0);
controls.autoRotateSpeed = 1.2;

scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 0.55));
const key = new THREE.DirectionalLight(0xfff3e6, 2.1);
key.position.set(2.5, 4.5, 3);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2.5, bottom: -1.5, near: 0.5, far: 12 });
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fb8ff, 1.0);
rim.position.set(-3, 2.5, -3.5);
scene.add(rim);

// 地面：圓形平台 + 瑜伽墊
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 96),
  new THREE.MeshStandardMaterial({ color: 0x161c25, roughness: 0.95 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const ring = new THREE.Mesh(
  new THREE.RingGeometry(3.18, 3.2, 128),
  new THREE.MeshBasicMaterial({ color: 0x2a3340 }),
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.001;
scene.add(ring);
const mat = new THREE.Mesh(
  new THREE.BoxGeometry(0.66, 0.006, 1.9),
  new THREE.MeshStandardMaterial({ color: 0x2c4a4a, roughness: 0.9 }),
);
mat.position.y = 0.003;
mat.receiveShadow = true;
scene.add(mat);

const figure = new THREE.Group();
scene.add(figure);
const rig = new Rig(figure);
const muscles = new MuscleSystem(rig, figure);

// ---------- 狀態 ----------
const state = { pose: null, mirror: false, freq: 0.5, playing: false, playTimer: 0 };
const params = new URLSearchParams(location.search);

// 墊子方向跟著姿勢（側向站姿轉 90°）
let matYawTarget = 0;

function annotationsFor(pose, mirror) {
  return (pose.muscles || []).map((m) => ({
    ...m,
    side: m.side && mirror ? (m.side === 'L' ? 'R' : 'L') : m.side,
  }));
}

function selectPose(id, { instant = false } = {}) {
  const pose = POSES.find((p) => p.id === id) || POSES[0];
  if (!pose.asym) state.mirror = false;
  state.pose = pose;
  rig.setPose(pose, state.mirror, instant ? 0 : 1.4);
  muscles.solo = null;
  muscles.setAnnotations(annotationsFor(pose, state.mirror));
  matYawTarget = ['virabhadrasana2', 'trikonasana'].includes(pose.id) ? Math.PI / 2 : 0;
  renderList();
  renderInfo();
  document.getElementById('btnMirror').disabled = !pose.asym;
  document.getElementById('btnMirror').classList.toggle('on', state.mirror);
  history.replaceState(null, '', `?pose=${pose.id}${state.mirror ? '&mirror=1' : ''}`);
}

// ---------- UI ----------
const listEl = document.getElementById('poseList');
function renderList() {
  listEl.innerHTML = '';
  for (const p of POSES) {
    const li = document.createElement('li');
    li.className = p === state.pose ? 'active' : '';
    li.innerHTML = `<span class="pz">${p.zh}</span><span class="pcat">${p.cat}</span><span class="psa">${p.sa}</span>`;
    li.onclick = () => { stopPlay(); selectPose(p.id); };
    listEl.appendChild(li);
    if (p === state.pose) li.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

const SIDE_ZH = { L: '左', R: '右' };
const infoEl = document.getElementById('info');
function renderInfo() {
  const p = state.pose;
  const anns = annotationsFor(p, state.mirror);
  const item = (a) => {
    const lab = labelOf(a.g);
    const side = a.side ? `<small>${SIDE_ZH[a.side]}側</small>` : '';
    const bars = [1, 2, 3].map((i) => `<i class="${i <= (a.lv || 2) ? 'on' : ''}"></i>`).join('');
    return `<li class="${a.t}" data-g="${a.g}" data-side="${a.side || ''}">
      <i class="dot ${a.t} pulse"></i><span class="nm">${lab.zh}${side}</span><span class="bars">${bars}</span>
      <span class="note">${a.note || ''}</span></li>`;
  };
  const cs = anns.filter((a) => a.t === 'c');
  const ss = anns.filter((a) => a.t === 's');
  infoEl.innerHTML = `
    <p class="title">${p.zh}</p>
    <p class="sub">${p.en} · <i>${p.sa}</i>${p.asym ? ` · ${state.mirror ? '左' : '右'}腳在前` : ''}</p>
    <p class="desc">${p.desc}</p>
    <ul class="cues">${p.cues.map((c) => `<li>${c}</li>`).join('')}</ul>
    ${cs.length ? `<div class="sec"><i class="dot c"></i>收縮／發力</div><ul class="mlist">${cs.map(item).join('')}</ul>` : ''}
    ${ss.length ? `<div class="sec"><i class="dot s"></i>伸展／拉長</div><ul class="mlist">${ss.map(item).join('')}</ul>` : ''}
    <p class="disclaimer">左右以模型本身為準。肌肉作用為教學示意，實際因人而異；身體不適請諮詢專業人員。</p>`;
  infoEl.querySelectorAll('.mlist li').forEach((li) => {
    li.onmouseenter = () => { muscles.solo = { id: li.dataset.g, side: li.dataset.side || null }; };
    li.onmouseleave = () => { muscles.solo = null; };
  });
}

// 工具列
const VIEWS = {
  front: new THREE.Vector3(0, 0.25, 1),
  side: new THREE.Vector3(1, 0.25, 0),
  back: new THREE.Vector3(0, 0.25, -1),
  top: new THREE.Vector3(0.01, 1, 0.35),
};
let camTween = null;
document.querySelectorAll('[data-view]').forEach((b) => {
  b.onclick = () => {
    const dist = camera.position.distanceTo(controls.target);
    const to = controls.target.clone().addScaledVector(VIEWS[b.dataset.view].clone().normalize(), dist);
    camTween = { from: camera.position.clone(), to, t: 0 };
  };
});
const btnRotate = document.getElementById('btnRotate');
btnRotate.onclick = () => { controls.autoRotate = !controls.autoRotate; btnRotate.classList.toggle('on', controls.autoRotate); };
const btnMirror = document.getElementById('btnMirror');
btnMirror.onclick = () => { if (state.pose.asym) { state.mirror = !state.mirror; selectPose(state.pose.id); } };
const btnDim = document.getElementById('btnDim');
btnDim.onclick = () => { muscles.dimOthers = !muscles.dimOthers; btnDim.classList.toggle('on', muscles.dimOthers); };
const btnPlay = document.getElementById('btnPlay');
function stopPlay() { state.playing = false; btnPlay.classList.remove('on'); }
btnPlay.onclick = () => {
  state.playing = !state.playing;
  btnPlay.classList.toggle('on', state.playing);
  state.playTimer = 0;
};
const freqEl = document.getElementById('freq');
function setFreq(f) {
  state.freq = f;
  document.documentElement.style.setProperty('--period', `${1 / f}s`);
}
freqEl.oninput = () => setFreq(parseFloat(freqEl.value));
setFreq(state.freq);

function step(d) {
  const i = POSES.indexOf(state.pose);
  selectPose(POSES[(i + d + POSES.length) % POSES.length].id);
}
addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { stopPlay(); step(1); e.preventDefault(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { stopPlay(); step(-1); e.preventDefault(); }
  if (e.key === 'm' || e.key === 'M') btnMirror.click();
  if (e.key === ' ') { btnRotate.click(); e.preventDefault(); }
});

// 滑鼠移到肌肉上顯示資訊
const tip = document.getElementById('tip');
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoverDirty = false, lastEvt = null, hovered = null;
canvas.addEventListener('pointermove', (e) => { lastEvt = e; hoverDirty = true; });
canvas.addEventListener('pointerleave', () => { lastEvt = null; hoverDirty = true; });

function updateHover() {
  if (!hoverDirty) return;
  hoverDirty = false;
  if (hovered) { hovered = null; if (muscles.solo?.fromHover) muscles.solo = null; }
  if (!lastEvt || lastEvt.buttons) { tip.style.display = 'none'; return; }
  const r = canvas.getBoundingClientRect();
  mouse.set(((lastEvt.clientX - r.left) / r.width) * 2 - 1, -((lastEvt.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  for (const s of muscles.strands) s.geo.computeBoundingSphere();
  const hit = ray.intersectObjects(muscles.meshes, false)[0];
  if (!hit) { tip.style.display = 'none'; return; }
  const s = hit.object.userData.strand;
  hovered = s;
  const g = GROUPS[s.group];
  const side = s.side === 'C' ? null : s.side;
  const ann = annotationsFor(state.pose, state.mirror).find(
    (a) => groupsOf(a.g).includes(s.group) && (!a.side || !side || a.side === side),
  );
  const ratio = muscles.lengthRatio([s.group], side);
  const pct = Math.round((ratio - 1) * 100);
  const st = ann
    ? `<span class="st" style="color:var(--${ann.t})">${ann.t === 'c' ? '收縮／發力' : '伸展／拉長'}</span> · ${ann.note || ''}<br>`
    : '<span style="color:var(--muted)">此體式非主要作用肌</span><br>';
  tip.innerHTML = `<b>${g.zh}</b>${side ? `（${SIDE_ZH[side]}）` : ''} <span style="color:var(--muted)">${g.en}</span><br>
    ${st}<span style="color:var(--muted)">功能：${g.fn}<br>肌肉長度 ${pct >= 0 ? '+' : ''}${pct}%（相對站姿）</span>`;
  tip.style.display = 'block';
  const x = Math.min(lastEvt.clientX + 14, innerWidth - tip.offsetWidth - 8);
  const y = Math.min(lastEvt.clientY + 14, innerHeight - tip.offsetHeight - 8);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  if (!muscles.solo || muscles.solo.fromHover) muscles.solo = { id: s.group, side, fromHover: true };
}

// ---------- 迴圈 ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let time = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;

  if (state.playing) {
    state.playTimer += dt;
    if (state.playTimer > 5) { state.playTimer = 0; step(1); }
  }

  rig.update(dt);
  muscles.rebuild();
  muscles.update(dt, time, state.freq);
  mat.rotation.y += (matYawTarget - mat.rotation.y) * Math.min(1, dt * 4);

  controls.target.lerp(rig.center, Math.min(1, dt * 2.5));
  if (camTween) {
    camTween.t = Math.min(1, camTween.t + dt / 0.8);
    const e = 1 - Math.pow(1 - camTween.t, 3);
    camera.position.lerpVectors(camTween.from, camTween.to, e);
    if (camTween.t >= 1) camTween = null;
  }
  controls.update();
  updateHover();
  if (hovered) hoverDirty = true;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

state.mirror = params.get('mirror') === '1';
selectPose(params.get('pose') || 'tadasana', { instant: true });
frame();

// 除錯用：在 console 調整姿勢 → __yoga.rig.joints.thigh_R.rotation.x = ...
window.__yoga = { rig, muscles, POSES, selectPose, THREE, camera, controls };
