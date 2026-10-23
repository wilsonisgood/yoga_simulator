// 肌肉與體式資料
//
// 座標慣例：Y 朝上、人物面向 +Z、人物的「左」= +X。
// 肌肉錨點寫的是「左側」版本（x 為外側 = 正），右側自動鏡像。
// 錨點的骨骼名稱：root(骨盆) lumbar(腰) chest(胸廓) neck head
//                ua(上臂) fa(前臂) hand thigh(大腿) shin(小腿) foot
// 每個 strand 是一條肌束：沿著錨點走一條平滑曲線，粗細隨長度變化（縮短變粗、拉長變細）。

export const MUSCLES = [
  {
    id: 'deltoid', zh: '三角肌', en: 'Deltoid',
    fn: '包覆肩關節。前束負責手臂前舉、中束側舉、後束後伸；舉手與推地時都會出力。',
    strands: [
      { r: 0.026, pts: [['chest', [0.15, 0.25, 0.06]], ['ua', [0.03, 0.03, 0.05]], ['ua', [0.02, -0.13, 0.035]]] },
      { r: 0.027, pts: [['chest', [0.2, 0.27, 0.0]], ['ua', [0.06, 0.0, 0.0]], ['ua', [0.04, -0.13, 0.0]]] },
      { r: 0.026, pts: [['chest', [0.15, 0.25, -0.07]], ['ua', [0.03, 0.03, -0.05]], ['ua', [0.02, -0.13, -0.035]]] },
    ],
  },
  {
    id: 'pecs', zh: '胸大肌', en: 'Pectoralis major',
    fn: '把手臂往身體中線帶（內收、水平內收）並內旋；平板、推地時穩定肩膀，擴胸與後彎時被拉長。',
    strands: [
      { r: 0.025, pts: [['chest', [0.04, 0.21, 0.10]], ['chest', [0.13, 0.2, 0.09]], ['ua', [0.0, -0.07, 0.035]]] },
      { r: 0.027, pts: [['chest', [0.02, 0.13, 0.115]], ['chest', [0.12, 0.15, 0.10]], ['ua', [0.0, -0.075, 0.03]]] },
      { r: 0.025, pts: [['chest', [0.04, 0.05, 0.11]], ['chest', [0.12, 0.1, 0.09]], ['ua', [-0.005, -0.065, 0.03]]] },
    ],
  },
  {
    id: 'biceps', zh: '肱二頭肌', en: 'Biceps brachii',
    fn: '彎曲手肘、讓前臂外翻（手心朝上），也協助手臂前舉。',
    strands: [{ r: 0.027, pts: [['ua', [0.005, -0.04, 0.035]], ['ua', [0.0, -0.16, 0.05]], ['fa', [0.0, -0.035, 0.02]]] }],
  },
  {
    id: 'triceps', zh: '肱三頭肌', en: 'Triceps brachii',
    fn: '伸直手肘。用手臂撐住體重（平板、下犬、眼鏡蛇）時的主要出力者。',
    strands: [{ r: 0.03, pts: [['ua', [0.0, -0.03, -0.04]], ['ua', [0.0, -0.16, -0.052]], ['ua', [0.0, -0.27, -0.04]], ['fa', [0.0, 0.0, -0.03]]] }],
  },
  {
    id: 'forearm_flex', zh: '前臂屈肌群', en: 'Wrist & finger flexors',
    fn: '屈腕與抓握。手掌壓地時穩定手腕、讓指腹抓地。',
    strands: [{ r: 0.021, pts: [['fa', [0.0, -0.02, 0.028]], ['fa', [0.0, -0.13, 0.028]], ['hand', [0.0, -0.02, 0.012]]] }],
  },
  {
    id: 'forearm_ext', zh: '前臂伸肌群', en: 'Wrist & finger extensors',
    fn: '伸腕、伸指，與屈肌群共同穩定手腕。',
    strands: [{ r: 0.019, pts: [['fa', [0.0, -0.02, -0.028]], ['fa', [0.0, -0.13, -0.028]], ['hand', [0.0, -0.02, -0.012]]] }],
  },
  {
    id: 'trapezius', zh: '斜方肌', en: 'Trapezius',
    fn: '上束聳肩、中束把肩胛往後收、下束把肩胛往下壓；舉手過頭時讓肩胛骨上旋。',
    strands: [
      { r: 0.022, pts: [['head', [0.02, 0.02, -0.08]], ['neck', [0.04, 0.04, -0.04]], ['chest', [0.15, 0.25, -0.04]]] },
      { r: 0.022, pts: [['chest', [0.0, 0.21, -0.105]], ['chest', [0.12, 0.22, -0.08]]] },
      { r: 0.02, pts: [['chest', [0.0, 0.03, -0.11]], ['chest', [0.07, 0.12, -0.105]], ['chest', [0.12, 0.2, -0.08]]] },
    ],
  },
  {
    id: 'rhomboids', zh: '菱形肌', en: 'Rhomboids',
    fn: '把肩胛骨往脊椎方向收攏，讓胸口打開；前彎抱膝時被拉開。',
    strands: [{ r: 0.017, pts: [['chest', [0.0, 0.16, -0.112]], ['chest', [0.085, 0.1, -0.105]]] }],
  },
  {
    id: 'lats', zh: '背闊肌', en: 'Latissimus dorsi',
    fn: '把手臂往下拉、往後伸。手臂高舉過頭（下犬、嬰兒式）時會被大幅拉長。',
    strands: [
      { r: 0.026, pts: [['root', [0.03, 0.06, -0.1]], ['lumbar', [0.1, 0.1, -0.08]], ['chest', [0.145, 0.08, -0.06]], ['ua', [-0.02, -0.05, 0.0]]] },
      { r: 0.024, pts: [['chest', [0.02, 0.02, -0.11]], ['chest', [0.14, 0.11, -0.07]], ['ua', [-0.02, -0.04, 0.005]]] },
    ],
  },
  {
    id: 'serratus', zh: '前鋸肌', en: 'Serratus anterior',
    fn: '把肩胛骨貼住胸廓並往前推。推地類姿勢（下犬、平板）的關鍵穩定肌。',
    strands: [{ r: 0.018, pts: [['chest', [0.125, 0.02, 0.07]], ['chest', [0.155, 0.1, 0.02]], ['chest', [0.14, 0.17, -0.05]]] }],
  },
  {
    id: 'rectus_abd', zh: '腹直肌', en: 'Rectus abdominis',
    fn: '捲曲軀幹、穩定骨盆。平板式時緊縮出力；後彎（眼鏡蛇、駱駝）時被拉長。',
    strands: [{ r: 0.024, pts: [['root', [0.035, -0.05, 0.1]], ['lumbar', [0.04, 0.06, 0.1]], ['chest', [0.045, 0.06, 0.11]]] }],
  },
  {
    id: 'obliques', zh: '腹斜肌', en: 'Obliques',
    fn: '側彎與旋轉軀幹，維持核心張力。三角式時上側被拉長、下側收縮。',
    strands: [{ r: 0.024, pts: [['root', [0.14, 0.05, 0.02]], ['lumbar', [0.12, 0.07, 0.06]], ['chest', [0.1, 0.06, 0.1]]] }],
  },
  {
    id: 'erector', zh: '豎脊肌', en: 'Erector spinae',
    fn: '沿著脊椎兩側，負責伸展脊椎、維持背部挺直。前彎時被拉長，後彎時強力收縮。',
    strands: [{ r: 0.022, pts: [['root', [0.03, -0.02, -0.1]], ['lumbar', [0.035, 0.08, -0.095]], ['chest', [0.035, 0.05, -0.11]], ['chest', [0.03, 0.22, -0.1]]] }],
  },
  {
    id: 'ql', zh: '腰方肌', en: 'Quadratus lumborum',
    fn: '深層腰肌，負責側彎腰椎、上提同側骨盆；側彎時對側被拉長。',
    strands: [{ r: 0.018, pts: [['root', [0.08, 0.08, -0.05]], ['lumbar', [0.06, 0.1, -0.06]], ['chest', [0.05, -0.01, -0.07]]] }],
  },
  {
    id: 'psoas', zh: '髂腰肌', en: 'Iliopsoas',
    fn: '最主要的髖屈肌，把大腿抬向軀幹。髖關節伸展（弓步後腳、橋式、駱駝）時被拉長。',
    strands: [{ r: 0.022, pts: [['lumbar', [0.03, 0.1, 0.0]], ['root', [0.06, 0.02, 0.06]], ['root', [0.07, -0.05, 0.09]], ['thigh', [-0.02, -0.07, 0.02]]] }],
  },
  {
    id: 'glute_max', zh: '臀大肌', en: 'Gluteus maximus',
    fn: '伸髖與外旋。從蹲姿站起、橋式抬臀的主力；前彎時被拉長。',
    strands: [
      { r: 0.033, pts: [['root', [0.05, 0.06, -0.1]], ['root', [0.13, -0.02, -0.08]], ['thigh', [0.05, -0.08, -0.03]]] },
      { r: 0.032, pts: [['root', [0.02, -0.04, -0.1]], ['root', [0.09, -0.1, -0.09]], ['thigh', [0.04, -0.12, -0.035]]] },
    ],
  },
  {
    id: 'glute_med', zh: '臀中肌', en: 'Gluteus medius',
    fn: '髖外展。單腳站立時穩定骨盆、不讓另一側下沉，是平衡姿勢的關鍵。',
    strands: [{ r: 0.028, pts: [['root', [0.15, 0.06, -0.02]], ['root', [0.16, -0.02, -0.01]], ['thigh', [0.06, -0.01, 0.0]]] }],
  },
  {
    id: 'piriformis', zh: '梨狀肌', en: 'Piriformis',
    fn: '深層髖外旋肌。樹式把膝蓋往外打開時參與出力。',
    strands: [{ r: 0.016, pts: [['root', [0.03, 0.0, -0.09]], ['thigh', [0.05, 0.0, -0.02]]] }],
  },
  {
    id: 'adductors', zh: '內收肌群', en: 'Hip adductors',
    fn: '把大腿往中線內收。雙腿打開（戰士二式、三角式）或膝蓋外開（樹式）時被拉長。',
    strands: [
      { r: 0.026, pts: [['root', [0.025, -0.09, 0.05]], ['thigh', [-0.04, -0.13, 0.01]], ['thigh', [-0.03, -0.22, 0.0]]] },
      { r: 0.028, pts: [['root', [0.04, -0.11, -0.02]], ['thigh', [-0.045, -0.2, -0.01]], ['thigh', [-0.035, -0.38, -0.01]]] },
    ],
  },
  {
    id: 'quads', zh: '股四頭肌', en: 'Quadriceps',
    fn: '伸直膝蓋（其中股直肌也屈髖）。屈膝承重（椅子式、戰士式前腳）的主力。',
    strands: [
      { r: 0.03, pts: [['root', [0.08, -0.02, 0.08]], ['thigh', [0.0, -0.08, 0.07]], ['thigh', [0.0, -0.3, 0.065]], ['shin', [0.0, -0.06, 0.045]]] },
      { r: 0.03, pts: [['thigh', [0.055, -0.06, 0.02]], ['thigh', [0.065, -0.24, 0.025]], ['thigh', [0.03, -0.4, 0.045]], ['shin', [0.005, -0.05, 0.045]]] },
      { r: 0.03, pts: [['thigh', [-0.03, -0.18, 0.04]], ['thigh', [-0.045, -0.36, 0.04]], ['shin', [-0.005, -0.05, 0.045]]] },
    ],
  },
  {
    id: 'hamstrings', zh: '膕繩肌', en: 'Hamstrings',
    fn: '屈膝、伸髖。各種前彎（下犬、坐姿前彎、三角式）最主要被拉長的肌群。',
    strands: [
      { r: 0.028, pts: [['root', [0.06, -0.11, -0.07]], ['thigh', [0.03, -0.2, -0.065]], ['thigh', [0.04, -0.37, -0.05]], ['shin', [0.035, -0.05, -0.025]]] },
      { r: 0.027, pts: [['root', [0.05, -0.12, -0.06]], ['thigh', [-0.02, -0.2, -0.065]], ['thigh', [-0.035, -0.37, -0.05]], ['shin', [-0.03, -0.06, -0.02]]] },
    ],
  },
  {
    id: 'calves', zh: '小腿三頭肌', en: 'Gastrocnemius & soleus',
    fn: '踮腳（蹠屈）。腳跟往地板壓、腳踝背屈（下犬、椅子式）時被拉長。',
    strands: [
      { r: 0.029, pts: [['thigh', [0.03, -0.41, -0.035]], ['shin', [0.03, -0.12, -0.055]], ['shin', [0.012, -0.3, -0.04]], ['foot', [0.0, -0.04, -0.05]]] },
      { r: 0.029, pts: [['thigh', [-0.03, -0.41, -0.035]], ['shin', [-0.03, -0.12, -0.055]], ['shin', [-0.012, -0.3, -0.04]], ['foot', [0.0, -0.04, -0.05]]] },
      { r: 0.025, pts: [['shin', [0.0, -0.1, -0.035]], ['shin', [0.0, -0.28, -0.045]], ['foot', [0.0, -0.035, -0.045]]] },
    ],
  },
  {
    id: 'tib_ant', zh: '脛前肌', en: 'Tibialis anterior',
    fn: '勾腳（背屈）、撐起足弓，站姿平衡時不斷微調。腳背貼地時被拉長。',
    strands: [{ r: 0.018, pts: [['shin', [0.025, -0.06, 0.035]], ['shin', [0.02, -0.3, 0.035]], ['foot', [-0.005, -0.035, 0.06]]] }],
  },
  {
    id: 'scm', zh: '胸鎖乳突肌', en: 'Sternocleidomastoid',
    fn: '轉頭與屈頸。仰頭（眼鏡蛇、駱駝）時被拉長。',
    strands: [{ r: 0.016, pts: [['chest', [0.025, 0.24, 0.08]], ['neck', [0.04, 0.05, 0.03]], ['head', [0.06, 0.03, -0.02]]] }],
  },
];

// ---------------------------------------------------------------------------
// 體式
//
// angles：解剖學角度（度），左右會自動換算成對應的旋轉方向。
//   root      pitch(+ 頭往前倒) roll(+ 往左側傾) yaw
//   lumbar / chest / neck   flex(+ 前彎 / − 後彎) side(+ 往左側彎) twist(+ 往左轉)
//   shoulder  flex(+ 前舉) abd(+ 側舉) rot(+ 外旋)
//   elbow     flex pron(+ 前臂旋前)
//   wrist     ext(+ 手背往後折)
//   hip       flex(+ 抬腿) abd(+ 外展) rot(+ 外旋)
//   knee      flex
//   ankle     dorsi(+ 勾腳 / − 繃腳) roll
// contract / stretch：肌肉 id（或 id.L / id.R 只指定一側）→ 強度 1 次要、2 主要
// ---------------------------------------------------------------------------
const B = (o) => ({ L: o, R: o });

export const POSES = [
  {
    id: 'mountain', zh: '山式', sa: 'Tadasana', en: 'Mountain Pose', tag: '站姿 · 基準',
    desc: '所有站姿的起點。雙腳踩穩、脊椎往上延伸，全身肌肉只用輕度張力維持直立。',
    cues: ['雙腳平均承重，大腿前側微微上提', '尾骨朝下、肚臍輕收', '頭頂往上延伸，肩膀放鬆下沉'],
    mat: 'z', cam: { az: 28, el: 6, dist: 3.7 },
    angles: { shoulder: B({ abd: 10 }), elbow: B({ flex: 6, pron: 70 }) },
    contract: { quads: 1, glute_max: 1, glute_med: 1, rectus_abd: 1, erector: 1, tib_ant: 1 },
    stretch: {},
  },
  {
    id: 'tree', zh: '樹式', sa: 'Vrksasana', en: 'Tree Pose', tag: '站姿 · 平衡',
    desc: '單腳站立的平衡體式。支撐腳的臀中肌要把骨盆穩住，抬起那側的膝蓋往外打開。',
    cues: ['右腳四個角平均踩地', '左腳掌壓大腿內側、大腿回推腳掌', '骨盆保持水平，雙手往上延伸'],
    mat: 'z', cam: { az: 12, el: 6, dist: 3.9 },
    angles: {
      hip: { L: { flex: 40, abd: 50, rot: 70 }, R: { abd: 2 } },
      knee: { L: { flex: 145 } },
      ankle: { L: { dorsi: -35 } },
      shoulder: B({ flex: 172, abd: -6 }),
      elbow: B({ flex: 12, pron: 90 }),
    },
    contract: { 'glute_med.R': 2, 'quads.R': 2, 'calves.R': 1, 'tib_ant.R': 1, rectus_abd: 1, obliques: 1, deltoid: 1, trapezius: 1, 'glute_max.L': 1, 'piriformis.L': 1 },
    stretch: { 'adductors.L': 2, lats: 1 },
  },
  {
    id: 'chair', zh: '椅子式', sa: 'Utkatasana', en: 'Chair Pose', tag: '站姿 · 力量',
    desc: '像坐在一張看不見的椅子上。大腿前側與臀部承受大部分體重，背部要撐住不駝。',
    cues: ['臀部往後坐，膝蓋不超過腳尖太多', '重心放在腳跟', '手臂與軀幹成一直線往上延伸'],
    mat: 'z', cam: { az: 65, el: 8, dist: 3.8 },
    angles: {
      root: { pitch: 32 }, lumbar: { flex: -6 }, chest: { flex: -4 }, neck: { flex: -8 },
      hip: B({ flex: 100 }), knee: B({ flex: 92 }), ankle: B({ dorsi: 28 }),
      shoulder: B({ flex: 165, abd: 6 }), elbow: B({ pron: 90 }),
    },
    contract: { quads: 2, glute_max: 2, erector: 2, deltoid: 1, trapezius: 1, tib_ant: 1, rectus_abd: 1, adductors: 1 },
    stretch: { calves: 2, lats: 1 },
  },
  {
    id: 'warrior2', zh: '戰士二式', sa: 'Virabhadrasana II', en: 'Warrior II', tag: '站姿 · 力量',
    desc: '雙腿大開、前膝彎曲、雙手往兩側延伸。前腳股四頭肌出力，雙腿內側與後腳髖前側被拉長。',
    cues: ['前膝對準第二根腳趾，膝蓋在腳踝正上方', '後腳外側壓地，大腿往後拉', '肩膀下沉，視線越過前手中指'],
    mat: 'x', cam: { az: 0, el: 10, dist: 4.4 },
    angles: {
      hip: { L: { flex: 8, abd: 78, rot: 85 }, R: { abd: 52 } },
      knee: { L: { flex: 88 } },
      ankle: { R: { roll: -52 } },
      shoulder: B({ abd: 88 }), elbow: B({ pron: 90 }),
      neck: { twist: 75 },
    },
    contract: { 'quads.L': 2, 'glute_max.L': 1, glute_med: 1, deltoid: 2, trapezius: 1, rectus_abd: 1, obliques: 1, 'quads.R': 1, 'tib_ant.L': 1 },
    stretch: { adductors: 2, 'psoas.R': 2, pecs: 1, 'calves.R': 1 },
  },
  {
    id: 'triangle', zh: '三角式', sa: 'Trikonasana', en: 'Triangle Pose', tag: '站姿 · 側伸展',
    desc: '雙腿伸直打開，軀幹往前腳方向側傾。前腳膕繩肌與上側腰側被拉長，下側腹斜肌收縮撐住軀幹。',
    cues: ['從髖關節折，而不是從腰側彎', '前腳大腿肌肉上提，膝蓋不鎖死', '上方手臂往天花板延伸，胸口打開'],
    mat: 'x', cam: { az: 0, el: 8, dist: 4.4 },
    angles: {
      root: { roll: 58 }, lumbar: { side: 10 }, chest: { side: 12, twist: -10 },
      hip: { L: { abd: 92, rot: 20 }, R: { abd: -24 } },
      ankle: { L: { roll: -35 }, R: { roll: -35 } },
      shoulder: B({ abd: 90 }), elbow: B({ pron: 90 }),
      neck: { twist: -50 },
    },
    contract: { quads: 2, 'obliques.L': 1, 'ql.L': 1, 'glute_med.R': 1, glute_max: 1, deltoid: 1, trapezius: 1, erector: 1 },
    stretch: { 'hamstrings.L': 2, 'adductors.L': 1, 'adductors.R': 1, 'obliques.R': 2, 'ql.R': 2, 'lats.R': 1, pecs: 1 },
  },
  {
    id: 'downdog', zh: '下犬式', sa: 'Adho Mukha Svanasana', en: 'Downward-Facing Dog', tag: '倒轉 · 全身伸展',
    desc: '身體成倒 V 字。手臂與肩膀推地，把臀部送向天花板，整個身體背側從小腿到背闊肌都被拉長。',
    cues: ['手指張開，食指根部壓地', '肩胛骨貼住背、遠離耳朵', '坐骨往上提，腳跟往地板方向沉'],
    mat: 'z', cam: { az: 88, el: 6, dist: 4.2 },
    angles: {
      root: { pitch: 140 },
      hip: B({ flex: 100, abd: 4 }), ankle: B({ dorsi: 30 }),
      shoulder: B({ flex: 178, abd: 12 }), elbow: B({ pron: 180 }), wrist: B({ ext: 50 }),
    },
    contract: { deltoid: 2, triceps: 2, serratus: 2, trapezius: 1, quads: 2, rectus_abd: 1, forearm_flex: 1, erector: 1 },
    stretch: { hamstrings: 2, calves: 2, lats: 2, glute_max: 1, pecs: 1 },
  },
  {
    id: 'plank', zh: '平板式', sa: 'Phalakasana', en: 'Plank Pose', tag: '支撐 · 核心',
    desc: '從頭到腳跟成一直線的支撐姿勢。整條核心肌群都在等長收縮，手臂與肩膀撐住上半身。',
    cues: ['手腕在肩膀正下方', '肚臍往脊椎收，臀部不塌也不翹', '腳跟往後推，頭頂往前延伸'],
    mat: 'z', cam: { az: 78, el: 12, dist: 4.0 },
    angles: {
      root: { pitch: 78 }, neck: { flex: -8 },
      shoulder: B({ flex: 78, abd: 6 }), elbow: B({ pron: 180 }), wrist: B({ ext: 90 }),
      ankle: B({ dorsi: 5 }),
    },
    contract: { rectus_abd: 2, obliques: 2, serratus: 2, deltoid: 2, triceps: 2, pecs: 1, quads: 2, glute_max: 1, erector: 1 },
    stretch: { forearm_flex: 1, calves: 1 },
  },
  {
    id: 'cobra', zh: '眼鏡蛇式', sa: 'Bhujangasana', en: 'Cobra Pose', tag: '俯臥 · 後彎',
    desc: '俯臥抬起上半身的溫和後彎。背部肌群收縮把胸口抬起，身體前側的腹肌與髖屈肌被拉長。',
    cues: ['恥骨與腳背貼地', '用背部力量抬胸，手只是輔助', '肩膀遠離耳朵，後頸保持延長'],
    mat: 'z', cam: { az: 85, el: 10, dist: 3.8 },
    angles: {
      root: { pitch: 90 }, lumbar: { flex: -32 }, chest: { flex: -22 }, neck: { flex: -12 },
      shoulder: B({ flex: 20, abd: 12 }), elbow: B({ flex: 25, pron: 180 }), wrist: B({ ext: 80 }),
      ankle: B({ dorsi: -65 }),
    },
    contract: { erector: 2, glute_max: 1, hamstrings: 1, triceps: 1, rhomboids: 1, trapezius: 1 },
    stretch: { rectus_abd: 2, psoas: 2, pecs: 1, obliques: 1, quads: 1, scm: 1, tib_ant: 1 },
  },
  {
    id: 'child', zh: '嬰兒式', sa: 'Balasana', en: "Child's Pose", tag: '跪姿 · 休息',
    desc: '休息體式：幾乎沒有肌肉需要出力，背部、背闊肌與臀部在重力下被動伸展。',
    cues: ['臀部坐向腳跟', '額頭放在墊子上，手臂往前延伸', '把呼吸送到下背，讓背部隨吸氣擴張'],
    mat: 'z', cam: { az: 80, el: 14, dist: 3.6 },
    angles: {
      root: { pitch: 72 }, lumbar: { flex: 22 }, chest: { flex: 15 }, neck: { flex: 5 },
      hip: B({ flex: 135, abd: 12 }), knee: B({ flex: 155 }), ankle: B({ dorsi: -55 }),
      shoulder: B({ flex: 165, abd: 10 }), elbow: B({ pron: 180 }), wrist: B({ ext: 10 }),
    },
    contract: {},
    stretch: { erector: 2, lats: 2, glute_max: 1, quads: 1, tib_ant: 1, trapezius: 1, rhomboids: 1 },
  },
  {
    id: 'forward', zh: '坐姿前彎', sa: 'Paschimottanasana', en: 'Seated Forward Bend', tag: '坐姿 · 前彎',
    desc: '坐姿雙腿伸直往前折。身體整個背側——膕繩肌、小腿、豎脊肌——都被拉長。',
    cues: ['先坐高，再從髖關節往前折', '腳掌回勾，膝蓋可微彎', '用吐氣慢慢加深，不要硬拉'],
    mat: 'z', cam: { az: 82, el: 12, dist: 3.8 },
    angles: {
      root: { pitch: 55 }, lumbar: { flex: 22 }, chest: { flex: 15 }, neck: { flex: 15 },
      hip: B({ flex: 145 }), ankle: B({ dorsi: 8 }),
      shoulder: B({ flex: 160, abd: 5 }), elbow: B({ flex: 10, pron: 90 }),
    },
    contract: { psoas: 1, quads: 1, rectus_abd: 1, biceps: 1 },
    stretch: { hamstrings: 2, calves: 2, erector: 2, glute_max: 1, lats: 1, rhomboids: 1 },
  },
  {
    id: 'bridge', zh: '橋式', sa: 'Setu Bandha Sarvangasana', en: 'Bridge Pose', tag: '仰臥 · 後彎',
    desc: '仰躺把臀部抬起。臀大肌與膕繩肌把骨盆往上推，髖屈肌與胸口被打開。',
    cues: ['雙腳與髖同寬，腳跟在膝蓋下方', '用臀部推起，而不是用腰', '雙臂壓地，肩膀往下收'],
    mat: 'z', cam: { az: 75, el: 14, dist: 3.8 },
    angles: {
      root: { pitch: -120 }, neck: { flex: 30 },
      hip: B({ abd: 6 }), knee: B({ flex: 120 }),
      shoulder: B({ flex: -36, abd: 8 }), elbow: B({ pron: 180 }),
    },
    contract: { glute_max: 2, hamstrings: 2, erector: 1, quads: 1, adductors: 1, triceps: 1 },
    stretch: { psoas: 2, rectus_abd: 1, pecs: 1 },
  },
  {
    id: 'camel', zh: '駱駝式', sa: 'Ustrasana', en: 'Camel Pose', tag: '跪姿 · 深後彎',
    desc: '跪姿深後彎。身體整個前側——腹肌、髖屈肌、大腿前側、胸口——全部被拉開，背部與臀部收縮撐住。',
    cues: ['髖部保持在膝蓋正上方', '先把胸口往上提，再往後彎', '手找腳跟，頸部依舒適程度後仰'],
    mat: 'z', cam: { az: 72, el: 8, dist: 3.8 },
    angles: {
      root: { pitch: -12 }, lumbar: { flex: -30 }, chest: { flex: -28 }, neck: { flex: -30 },
      hip: B({ flex: -12, abd: 6 }), knee: B({ flex: 90 }), ankle: B({ dorsi: -40 }),
      shoulder: B({ flex: -55, abd: 15 }),
    },
    contract: { glute_max: 2, erector: 2, hamstrings: 1, rhomboids: 1, triceps: 1, trapezius: 1 },
    stretch: { rectus_abd: 2, psoas: 2, quads: 2, pecs: 2, deltoid: 1, scm: 1, biceps: 1, obliques: 1 },
  },
];
