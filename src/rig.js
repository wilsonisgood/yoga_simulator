import * as THREE from 'three';

export const DEG = Math.PI / 180;
export const LIMBS = new Set(['upperArm', 'forearm', 'hand', 'thigh', 'shin', 'foot']);

// 座標系：Y 向上，人物面向 +Z，人物的「左」= +X。
// 四肢在靜止姿勢沿 -Y 下垂；脊椎沿 +Y。
// 旋轉慣例（預設 Euler 順序 'YXZ' = 先 Z 外展，再 X 屈伸，最後繞父層 Y 轉向）：
//   四肢 X 負值 = 向前屈（髖屈曲 / 肩屈曲）；膝蓋 X 正值 = 屈膝
//   左側 Z 正值 = 外展；右側 Z 負值 = 外展
//   脊椎 X 正值 = 前彎，負值 = 後彎；Z 正值 = 向右側彎
const JOINT_DEFS = [
  ['root', null, [0, 1, 0]],
  ['lumbar', 'root', [0, 0.08, 0]],
  ['chest', 'lumbar', [0, 0.16, 0]],
  ['neck', 'chest', [0, 0.26, 0]],
  ['head', 'neck', [0, 0.08, 0]],
  ['upperArm', 'chest', [0.19, 0.21, 0], true],
  ['forearm', 'upperArm', [0, -0.29, 0], true],
  ['hand', 'forearm', [0, -0.25, 0], true],
  ['thigh', 'root', [0.09, -0.07, 0], true],
  ['shin', 'thigh', [0, -0.44, 0], true],
  ['foot', 'shin', [0, -0.42, 0], true],
];

// 落地判定用的碰撞球（骨骼局部座標，左側；右側自動鏡像）
const GROUND_SPHERES = {
  root: [[0, -0.09, -0.06, 0.085], [0, -0.04, 0.05, 0.09], [0.1, -0.05, 0, 0.08]],
  lumbar: [[0, 0.08, 0, 0.1]],
  chest: [[0, 0.04, 0, 0.12], [0, 0.17, -0.02, 0.12], [0.11, 0.2, -0.03, 0.08]],
  neck: [[0, 0.04, 0, 0.05]],
  head: [[0, 0.1, 0.01, 0.105]],
  upperArm: [[0, 0, 0, 0.05], [0, -0.29, 0, 0.042]],
  forearm: [[0, -0.12, 0, 0.035], [0, -0.25, 0, 0.03]],
  hand: [[0, -0.06, 0, 0.022], [0, -0.16, 0, 0.014]],
  thigh: [[0, 0, 0, 0.085], [0, -0.22, 0, 0.08], [0, -0.44, 0, 0.06]],
  shin: [[0, -0.2, 0, 0.055], [0, -0.42, 0, 0.042]],
  foot: [[0, -0.04, -0.04, 0.035], [0, -0.045, 0.12, 0.03], [0, -0.055, 0.17, 0.02]],
};

function taperedCapsule(len, r1, r2, radial = 18) {
  // 沿 -Y 由 0 延伸到 -len 的錐形膠囊，points 由下往上排列（LatheGeometry 慣例）
  const pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r2 * Math.sin(a), -len + r2 * Math.cos(a)));
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 - (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.sin(a)), r1 * Math.cos(a)));
  }
  return new THREE.LatheGeometry(pts, radial);
}

const SPHERE = new THREE.SphereGeometry(1, 28, 20);

export class Rig {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.joints = {};
    this.order = [];
    this.groundSpheres = [];

    for (const [name, parentName, off, sided] of JOINT_DEFS) {
      const sides = sided ? ['L', 'R'] : [null];
      for (const s of sides) {
        const full = s ? `${name}_${s}` : name;
        const pFull = parentName && LIMBS.has(parentName) ? `${parentName}_${s}` : parentName;
        const j = new THREE.Object3D();
        j.name = full;
        j.userData.base = name;
        j.userData.side = s;
        j.position.set(s === 'R' ? -off[0] : off[0], off[1], off[2]);
        (pFull ? this.joints[pFull] : this.group).add(j);
        this.joints[full] = j;
        this.order.push(full);
        for (const g of GROUND_SPHERES[name] || []) {
          const mx = s === 'R' ? -1 : 1;
          this.groundSpheres.push({ joint: j, p: new THREE.Vector3(g[0] * mx, g[1], g[2]), r: g[3] });
          if (!s && g[0] !== 0) {
            this.groundSpheres.push({ joint: j, p: new THREE.Vector3(-g[0], g[1], g[2]), r: g[3] });
          }
        }
      }
    }

    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x4d5562, roughness: 0.62, metalness: 0.05 });
    this.headMat = new THREE.MeshStandardMaterial({ color: 0x9aa2ad, roughness: 0.5, metalness: 0.02 });
    this.bodyMeshes = [];
    this._buildBody();

    this.from = {};
    this.target = {};
    this.t = 1;
    this.duration = 1.4;
    this.rootXZ = new THREE.Vector2();
    this.fromRootXZ = new THREE.Vector2();
    this.targetRootXZ = new THREE.Vector2();
    for (const n of this.order) this.target[n] = { q: new THREE.Quaternion() };

    this._tmpQ = new THREE.Quaternion();
    this._tmpQ2 = new THREE.Quaternion();
    this._tmpV = new THREE.Vector3();
    this.center = new THREE.Vector3(0, 0.9, 0);
    this.update(0);
  }

  _add(jointName, geo, mat, pos, scale, quat) {
    const m = new THREE.Mesh(geo, mat);
    if (pos) m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    if (quat) m.quaternion.copy(quat);
    m.castShadow = true;
    m.receiveShadow = true;
    this.joints[jointName].add(m);
    this.bodyMeshes.push(m);
    return m;
  }

  _ellipsoid(j, c, r, mat = this.bodyMat) {
    return this._add(j, SPHERE, mat, c, r);
  }

  _segment(j, a, b, r, mat = this.bodyMat) {
    // 兩點之間的膠囊（骨骼局部座標）
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    const geo = taperedCapsule(len, r, r, 14);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    return this._add(j, geo, mat, a, null, q);
  }

  _buildBody() {
    const M = (s, x) => (s === 'R' ? -x : x);
    this._ellipsoid('root', [0, -0.03, 0], [0.135, 0.085, 0.09]);
    this._segment('lumbar', [0, -0.02, 0], [0, 0.17, 0], 0.065);
    this._ellipsoid('chest', [0, 0.13, 0], [0.13, 0.155, 0.09]);
    this._segment('neck', [0, -0.01, -0.005], [0, 0.1, 0], 0.04);
    this._ellipsoid('head', [0, 0.1, 0.01], [0.078, 0.102, 0.092], this.headMat);
    this._ellipsoid('head', [0, 0.035, 0.045], [0.058, 0.04, 0.055], this.headMat);
    this._ellipsoid('head', [0, 0.085, 0.1], [0.012, 0.02, 0.014], this.headMat);

    for (const s of ['L', 'R']) {
      this._segment('chest', [M(s, 0.02), 0.245, 0.06], [M(s, 0.17), 0.235, 0.0], 0.016);
      this._ellipsoid(`upperArm_${s}`, [0, 0, 0], [0.042, 0.042, 0.042]);
      this._add(`upperArm_${s}`, taperedCapsule(0.29, 0.032, 0.026), this.bodyMat);
      this._add(`forearm_${s}`, taperedCapsule(0.25, 0.026, 0.019), this.bodyMat);
      this._ellipsoid(`hand_${s}`, [0, -0.055, 0], [0.04, 0.058, 0.016]);
      this._ellipsoid(`hand_${s}`, [0, -0.13, 0.002], [0.036, 0.05, 0.011]);
      this._ellipsoid(`hand_${s}`, [M(s, -0.04), -0.06, 0.012], [0.011, 0.035, 0.011]);
      this._ellipsoid(`thigh_${s}`, [0, 0, 0], [0.05, 0.05, 0.05]);
      this._add(`thigh_${s}`, taperedCapsule(0.44, 0.05, 0.038), this.bodyMat);
      this._add(`shin_${s}`, taperedCapsule(0.42, 0.038, 0.026), this.bodyMat);
      this._ellipsoid(`shin_${s}`, [0, 0.0, 0.035], [0.028, 0.03, 0.02]);
      this._ellipsoid(`foot_${s}`, [0, -0.045, 0.065], [0.044, 0.03, 0.115]);
      this._ellipsoid(`foot_${s}`, [0, -0.04, -0.035], [0.032, 0.035, 0.035]);
    }
  }

  // ---- 姿勢 ----
  static specToQuat(spec, mirror) {
    let [x = 0, y = 0, z = 0, order = 'YXZ', tw = 0] = spec || [];
    if (mirror) { y = -y; z = -z; tw = -tw; }
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x * DEG, y * DEG, z * DEG, order));
    if (tw) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), tw * DEG));
    return q;
  }

  static mirrorName(n) {
    if (n.endsWith('_L')) return n.slice(0, -2) + '_R';
    if (n.endsWith('_R')) return n.slice(0, -2) + '_L';
    return n;
  }

  setPose(pose, mirror = false, duration = this.duration) {
    for (const n of this.order) this.from[n] = this.joints[n].quaternion.clone();
    this.fromRootXZ.copy(this.rootXZ);
    const joints = pose.joints || {};
    const world = pose.world || {};
    for (const n of this.order) {
      const src = mirror ? Rig.mirrorName(n) : n;
      if (world[src]) this.target[n] = { world: Rig.specToQuat(world[src], mirror) };
      else this.target[n] = { q: Rig.specToQuat(joints[src], mirror) };
    }
    const rp = pose.rootXZ || [0, 0];
    this.targetRootXZ.set(mirror ? -rp[0] : rp[0], rp[1]);
    this.duration = duration;
    this.t = duration > 0 ? 0 : 1;
  }

  get transitioning() { return this.t < 1; }

  update(dt) {
    if (this.t < 1) this.t = Math.min(1, this.t + dt / this.duration);
    const t = this.t;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.rootXZ.lerpVectors(this.fromRootXZ, this.targetRootXZ, e);
    const root = this.joints.root;
    root.position.set(this.rootXZ.x, 1, this.rootXZ.y);
    this.group.updateMatrixWorld(false);

    for (const n of this.order) {
      const j = this.joints[n];
      const tgt = this.target[n];
      let q = tgt.q;
      if (tgt.world) {
        this._tmpQ.setFromRotationMatrix(j.parent.matrixWorld).invert();
        q = this._tmpQ2.copy(this._tmpQ).multiply(tgt.world);
      }
      if (this.from[n]) j.quaternion.slerpQuaternions(this.from[n], q, e);
      else j.quaternion.copy(q);
      j.updateMatrix();
      j.matrixWorld.multiplyMatrices(j.parent.matrixWorld, j.matrix);
    }

    // 落地：讓最低的碰撞球剛好接觸地面
    let minY = Infinity;
    for (const g of this.groundSpheres) {
      const y = this._tmpV.copy(g.p).applyMatrix4(g.joint.matrixWorld).y - g.r;
      if (y < minY) minY = y;
    }
    root.position.y = 1 - minY;
    root.updateMatrixWorld(true);

    // 身體中心（相機跟隨用）
    const box = new THREE.Box3();
    for (const n of ['root', 'chest', 'head', 'hand_L', 'hand_R', 'foot_L', 'foot_R', 'shin_L', 'shin_R']) {
      box.expandByPoint(this._tmpV.setFromMatrixPosition(this.joints[n].matrixWorld));
    }
    box.getCenter(this.center);
  }
}
