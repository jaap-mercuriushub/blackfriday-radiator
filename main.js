import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* =========================================================
   Evolar Black Friday – scroll-driven 3D product story
   ========================================================= */

const PRODUCT_URL = 'https://www.evolarshop.nl/evolar-olieradiator-9-ribben-2000w-taupe-wifi';
const DEAL_END = new Date('2026-11-30T23:59:59+01:00');
const COLORS = ['#b3a597', '#6e5646', '#647a64', '#8e9398']; // taupe, mokka, groen, grijs
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 900;

/* ---------- CTA links with UTM ---------- */
document.querySelectorAll('[data-cta]').forEach(a => {
  const u = new URL(PRODUCT_URL);
  u.searchParams.set('utm_source', 'bf-landing');
  u.searchParams.set('utm_medium', 'landingpage');
  u.searchParams.set('utm_campaign', 'blackfriday2026');
  u.searchParams.set('utm_content', a.dataset.cta);
  a.href = u.toString();
});

/* ---------- Countdown ---------- */
const cdSmall = document.getElementById('countdown');
const cdBig = document.getElementById('timerBig');
function tick() {
  let ms = Math.max(0, DEAL_END - Date.now());
  const d = Math.floor(ms / 864e5); ms -= d * 864e5;
  const h = Math.floor(ms / 36e5); ms -= h * 36e5;
  const m = Math.floor(ms / 6e4); ms -= m * 6e4;
  const s = Math.floor(ms / 1e3);
  const pad = n => String(n).padStart(2, '0');
  cdSmall.textContent = `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  const set = (k, v) => { const el = cdBig.querySelector(`[data-u="${k}"]`); if (el) el.textContent = k === 'd' ? v : pad(v); };
  set('d', d); set('h', h); set('m', m); set('s', s);
}
tick(); setInterval(tick, 1000);

/* ---------- Energy calculator ---------- */
const hrs = document.getElementById('hrs'), kwh = document.getElementById('kwh');
const eur = v => '€' + v.toFixed(2).replace('.', ',');
function calc() {
  const t = parseFloat(String(kwh.value).replace(',', '.')) || 0;
  document.getElementById('hrsOut').textContent = hrs.value;
  document.getElementById('cHour').textContent = eur(2 * t);
  document.getElementById('cDay').textContent = eur(2 * t * hrs.value);
}
hrs.addEventListener('input', calc); kwh.addEventListener('input', calc); calc();

/* ---------- Sticky buy bar ---------- */
const buybar = document.getElementById('buybar');
const story = document.getElementById('story');
function updateBuybar() {
  const storyEnd = story.offsetTop + story.offsetHeight - window.innerHeight;
  const show = isMobile() ? window.scrollY > storyEnd : window.scrollY > window.innerHeight * 0.9;
  buybar.classList.toggle('show', show);
}
window.addEventListener('scroll', updateBuybar, { passive: true });

/* ---------- Loader ---------- */
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loaderBar');
const loaderTemp = document.getElementById('loaderTemp');
let loadPct = 0;
const loadTimer = setInterval(() => {
  loadPct = Math.min(loadPct + 4 + Math.random() * 6, 92);
  setLoad(loadPct);
}, 60);
function setLoad(p) {
  loaderBar.style.strokeDashoffset = 327 - 327 * p / 100;
  loaderTemp.textContent = Math.round(15 + 20 * p / 100);
}
function finishLoading() {
  clearInterval(loadTimer);
  setLoad(100);
  setTimeout(() => loader.classList.add('done'), 250);
}
setTimeout(finishLoading, 6000); // safety net

/* =========================================================
   Helpers
   ========================================================= */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
// keyframe track: [[p, value], ...] -> value at p with smoothstep easing
function track(keys, p) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i][0]) {
      const [p0, v0] = keys[i - 1], [p1, v1] = keys[i];
      return v0 + (v1 - v0) * smooth((p - p0) / (p1 - p0));
    }
  }
  return keys[keys.length - 1][1];
}
// fade window for panels
function windowAlpha(p, a, b, f = 0.035) {
  if (p < a - f || p > b + f) return 0;
  if (p < a) return smooth((p - (a - f)) / f);
  if (p > b) return 1 - smooth((p - b) / f);
  return 1;
}

/* =========================================================
   Timeline (all values are functions of scroll progress p)
   ========================================================= */
const TL = {
  rotY:    [[0, -0.62], [0.16, 0.2], [0.34, 1.1], [0.48, -0.1], [0.66, -0.5], [0.84, -0.62], [1, -0.62 + Math.PI * 2]],
  explode: [[0.17, 0], [0.27, 1], [0.38, 1], [0.47, 0]],
  heat:    [[0.13, 0], [0.28, 1], [0.6, 0.9], [0.73, 0.15], [0.77, 0], [0.9, 0.25], [1, 0.35]],
  zoom:    [[0.41, 0], [0.49, 1], [0.6, 1], [0.67, 0]],
  temp:    [[0.47, 15], [0.6, 35], [0.64, 22]],
  wifi:    [[0.57, 0], [0.62, 1], [0.69, 1], [0.73, 0]],
  tilt:    [[0.71, 0], [0.765, 1], [0.82, 1], [0.865, 0]],
  color:   [[0.87, 0], [0.905, 1], [0.94, 2], [0.97, 3], [0.995, 4]],
  camY:    [[0, 0], [0.2, 0.3], [0.4, -0.2], [0.7, 0], [1, 0.15]],
};
const PANELS = [[0, 0.11], [0.17, 0.35], [0.42, 0.56], [0.585, 0.695], [0.725, 0.835], [0.88, 1.2]];

/* =========================================================
   DOM refs for story overlays
   ========================================================= */
const panels = [...document.querySelectorAll('.panel')];
const railItems = [...document.querySelectorAll('.rail li')];
const phone = document.getElementById('phone');
const alertBox = document.getElementById('alert');
const tempLive = document.getElementById('tempLive');
const dialFill = document.getElementById('dialFill');
const swatches = [...document.querySelectorAll('.sw')];
const appTemp = document.getElementById('appTemp');

function updateOverlays(p, s) {
  const alphas = PANELS.map(([a, b]) => windowAlpha(p, a, b, 0.03));
  let active = 0;
  alphas.forEach((o, i) => { if (o > alphas[active]) active = i; });
  panels.forEach((el, i) => {
    const [a] = PANELS[i];
    const o = i === active ? alphas[i] : 0;
    el.style.opacity = o;
    el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
    el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    const off = (1 - o) * (p < a ? 40 : -40);
    el.style.translate = `0 ${off}px`;
  });
  railItems.forEach((li, i) => li.classList.toggle('on', i === active));

  const t = Math.round(s.temp);
  tempLive.textContent = t;
  dialFill.style.left = `${clamp((s.temp - 15) / 20) * 100}%`;

  phone.style.opacity = s.wifi;
  phone.style.transform = `translateY(${(1 - s.wifi) * 60}px) rotate(${(1 - s.wifi) * 8 - 4}deg)`;
  appTemp.textContent = 21 + Math.round(s.wifi);

  const al = clamp((s.tilt - 0.55) / 0.45);
  alertBox.style.opacity = al;
  alertBox.style.transform = `scale(${0.9 + al * 0.1})`;

  const sw = Math.round(s.color) % 4;
  swatches.forEach((el, i) => el.classList.toggle('active', i === sw));
}

/* =========================================================
   Three.js scene
   ========================================================= */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.body.classList.add('no-webgl');
  finishLoading();
}

if (renderer) initScene();

function initScene() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  /* ---- lights ---- */
  scene.add(new THREE.HemisphereLight(0x9fc4e0, 0x1a120c, 0.35));
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
  key.position.set(-6, 10, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 9; key.shadow.camera.bottom = -2;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fb0ff, 1.4);
  rim.position.set(8, 6, -6);
  scene.add(rim);
  const warm = new THREE.PointLight(0xff6a1f, 0, 14, 1.6);
  warm.position.set(0.4, 3.2, 1.8);
  scene.add(warm);

  /* ---- materials ---- */
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: COLORS[0], roughness: 0.42, metalness: 0.12, clearcoat: 0.65, clearcoatRoughness: 0.28 });
  const finMat = bodyMat.clone();
  finMat.emissive = new THREE.Color(0xff5a00);
  finMat.emissiveIntensity = 0;
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111417, roughness: 0.35, metalness: 0.2 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.7 });
  const oilMat = new THREE.MeshStandardMaterial({ color: COLORS[0], roughness: 0.4, emissive: new THREE.Color(0xff7a1a), emissiveIntensity: 0 });

  /* ---- radiator ---- */
  const rig = new THREE.Group();          // turntable + layout offset
  const tiltPivot = new THREE.Group();    // pivots on the right wheels
  const radiator = new THREE.Group();
  rig.add(tiltPivot); tiltPivot.add(radiator);
  scene.add(rig);
  const PIVOT_X = 1.55;
  tiltPivot.position.x = PIVOT_X;
  radiator.position.x = -PIVOT_X;

  // fins
  const finShape = new THREE.Shape();
  const fw = 1.05, fh = 4.7, fr = 0.42;
  finShape.moveTo(-fw / 2 + fr, 0);
  finShape.lineTo(fw / 2 - fr, 0);
  finShape.quadraticCurveTo(fw / 2, 0, fw / 2, fr);
  finShape.lineTo(fw / 2, fh - fr);
  finShape.quadraticCurveTo(fw / 2, fh, fw / 2 - fr, fh);
  finShape.lineTo(-fw / 2 + fr, fh);
  finShape.quadraticCurveTo(-fw / 2, fh, -fw / 2, fh - fr);
  finShape.lineTo(-fw / 2, fr);
  finShape.quadraticCurveTo(-fw / 2, 0, -fw / 2 + fr, 0);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 20 });
  finGeo.translate(0, 0, -0.1);
  finGeo.rotateY(Math.PI / 2);

  const FIN_SPACING = 0.33, FIN_COUNT = 9, FIN_X0 = -0.86, FIN_Y = 0.95;
  const fins = [];
  for (let i = 0; i < FIN_COUNT; i++) {
    const m = new THREE.Mesh(finGeo, finMat);
    m.position.set(FIN_X0 + i * FIN_SPACING, FIN_Y, 0);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.baseX = m.position.x;
    radiator.add(m); fins.push(m);
  }

  // oil channels (top + bottom)
  const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 16);
  pipeGeo.rotateZ(Math.PI / 2);
  const pipes = [FIN_Y + 0.3, FIN_Y + fh - 0.3].map(y => {
    const p = new THREE.Mesh(pipeGeo, oilMat);
    p.position.y = y;
    radiator.add(p);
    return p;
  });

  // control tower
  const TOWER_X = -1.55;
  const tower = new THREE.Group();
  tower.position.x = TOWER_X;
  radiator.add(tower);
  const towerBody = new THREE.Mesh(new RoundedBoxGeometry(0.95, 5.0, 1.25, 5, 0.14), bodyMat);
  towerBody.position.y = 0.8 + 2.5;
  towerBody.castShadow = true; towerBody.receiveShadow = true;
  tower.add(towerBody);
  // handle slot
  const slot = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.2, 0.05, 3, 0.08), darkMat);
  slot.position.set(0, 5.35, 0.63);
  tower.add(slot);
  // display
  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = dispCanvas.height = 256;
  const dctx = dispCanvas.getContext('2d');
  const dispTex = new THREE.CanvasTexture(dispCanvas);
  dispTex.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), new THREE.MeshBasicMaterial({ map: dispTex, toneMapped: false }));
  display.position.set(0, 4.35, 0.632);
  tower.add(display);
  const bezel = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.35, 48), darkMat);
  bezel.position.copy(display.position).z -= 0.001;
  tower.add(bezel);
  // vents
  for (let i = 0; i < 6; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.02), darkMat);
    v.position.set(0, 2.05 + i * 0.1, 0.628);
    tower.add(v);
    const v2 = v.clone(); v2.position.y = 4.95 - i * 0.07; v2.scale.x = 0.5; v2.position.x = 0; if (i < 3) tower.add(v2);
  }
  // knob
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.08, 24), darkMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, 1.35, 0.66);
  tower.add(knob);

  // feet + wheels
  const wheelGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 24);
  wheelGeo.rotateZ(Math.PI / 2);
  [-0.45, 1.25].forEach(x => {
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.12, 1.6, 3, 0.05), bodyMat);
    foot.position.set(x, 0.5, 0);
    foot.castShadow = true;
    radiator.add(foot);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), bodyMat);
    leg.position.set(x, 0.75, 0);
    radiator.add(leg);
    [-0.7, 0.7].forEach(z => {
      const w = new THREE.Mesh(wheelGeo, rubberMat);
      w.position.set(x, 0.17, z);
      w.castShadow = true;
      radiator.add(w);
      const fork = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.25, 0.12), darkMat);
      fork.position.set(x, 0.35, z);
      radiator.add(fork);
    });
  });

  // cable
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(TOWER_X, 1.0, -0.62),
    new THREE.Vector3(TOWER_X - 0.1, 0.35, -0.9),
    new THREE.Vector3(TOWER_X + 0.4, 0.04, -1.6),
    new THREE.Vector3(1.0, 0.04, -2.6),
    new THREE.Vector3(4.5, 0.04, -3.4),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.04, 8), rubberMat);
  radiator.add(cable);

  // center radiator around its own middle
  const MID_X = -0.15;
  radiator.children.forEach(c => { c.position.x -= MID_X; });
  fins.forEach(f => { f.userData.baseX = f.position.x; });
  const towerBaseX = tower.position.x;

  /* ---- floor: contact shadow + heat pool ---- */
  function radialTex(stops) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(9, 6),
    new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,0.55)'], [0.55, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
  shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.y = 0.002;
  rig.add(shadowPlane);
  const receiver = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.35 }));
  receiver.rotation.x = -Math.PI / 2; receiver.receiveShadow = true;
  rig.add(receiver);
  const heatPool = new THREE.Mesh(new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,120,40,0.9)'], [0.4, 'rgba(255,80,20,0.25)'], [1, 'rgba(255,60,0,0)']]), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  heatPool.rotation.x = -Math.PI / 2; heatPool.position.y = 0.004;
  rig.add(heatPool);

  // halo behind the radiator
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,130,50,0.85)'], [0.35, 'rgba(255,90,30,0.25)'], [1, 'rgba(255,60,0,0)']]), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.set(11, 11, 1);
  halo.position.set(0, 3.3, -1.6);
  rig.add(halo);

  /* ---- heat particles ---- */
  const N = isMobile() ? 260 : 520;
  const pPos = new Float32Array(N * 3), pSpd = new Float32Array(N), pPhase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pPos[i * 3] = -1.6 + Math.random() * 3.6;
    pPos[i * 3 + 1] = 1 + Math.random() * 6.5;
    pPos[i * 3 + 2] = -0.8 + Math.random() * 1.6;
    pSpd[i] = 0.6 + Math.random() * 1.2;
    pPhase[i] = Math.random() * 6.28;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const sparkTex = radialTex([[0, 'rgba(255,220,180,1)'], [0.3, 'rgba(255,140,60,0.8)'], [1, 'rgba(255,80,20,0)']]);
  const pMat = new THREE.PointsMaterial({ size: 0.12, map: sparkTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffa060 });
  const particles = new THREE.Points(pGeo, pMat);
  rig.add(particles);

  /* ---- wifi rings ---- */
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 64),
      new THREE.MeshBasicMaterial({ color: 0xff9f3a, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    r.position.copy(display.position); r.position.z += 0.02;
    r.userData.offset = i / 3;
    tower.add(r); rings.push(r);
  }

  /* ---- display drawing ---- */
  let lastDisp = '';
  function drawDisplay(temp, off, heat, wifi) {
    const keyStr = `${Math.round(temp)}|${off}|${heat > 0.3}|${wifi > 0.3}`;
    if (keyStr === lastDisp) return;
    lastDisp = keyStr;
    const g = dctx;
    g.clearRect(0, 0, 256, 256);
    const bg = g.createRadialGradient(110, 90, 10, 128, 128, 128);
    bg.addColorStop(0, '#1d232a'); bg.addColorStop(1, '#050607');
    g.fillStyle = bg; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (off) {
      g.fillStyle = '#ff4b2b';
      g.font = '800 78px Montserrat, Arial';
      g.shadowColor = '#ff4b2b'; g.shadowBlur = 18;
      g.fillText('OFF', 128, 130);
    } else {
      g.fillStyle = '#7fd4ff'; g.shadowColor = '#3fb6ff'; g.shadowBlur = 16;
      g.font = '800 104px Montserrat, Arial';
      g.fillText(String(Math.round(temp)), 118, 134);
      g.font = '700 30px Montserrat, Arial';
      g.fillText('°C', 196, 98);
      g.shadowBlur = 0;
      g.font = '600 18px Montserrat, Arial';
      g.fillStyle = '#6a8090';
      g.fillText('evolar', 128, 206);
      if (heat > 0.3) { g.fillStyle = '#ff8a3a'; g.font = '700 26px Arial'; g.fillText('♨', 72, 64); }
      if (wifi > 0.3) { g.fillStyle = '#7fd4ff'; g.font = '700 24px Arial'; g.fillText('◉', 184, 64); }
    }
    g.shadowBlur = 0;
    dispTex.needsUpdate = true;
  }

  /* ---- layout ---- */
  const base = { camPos: new THREE.Vector3(), target: new THREE.Vector3() };
  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (isMobile()) {
      rig.position.set(0, 0, 0);
      const dist = Math.min(32, Math.max(15, 6.2 / (0.536 * camera.aspect)));
      base.camPos.set(0, 4.2, dist);
      base.target.set(0, 3.2 - dist * 0.11, 0);
    } else {
      rig.position.set(2.6, 0, 0);
      base.camPos.set(0.6, 4.4, 18.5);
      base.target.set(0.9, 3.0, 0);
    }
  }
  layout();
  window.addEventListener('resize', layout);

  /* ---- state & render ---- */
  const tmpColor = new THREE.Color(), cA = new THREE.Color(), cB = new THREE.Color();
  const dispWorld = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();
  let target = 0, current = 0, lastTime = performance.now();
  const S = {};

  function progressFromScroll() {
    const r = story.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  if (window.gsap && window.ScrollTrigger && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({ trigger: story, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: self => { target = self.progress; } });
  } else {
    window.addEventListener('scroll', () => { target = progressFromScroll(); }, { passive: true });
  }
  target = progressFromScroll();
  current = target;

  if (reduceMotion) document.body.classList.add('static-story');

  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const time = now / 1000;
    current += (target - current) * (reduceMotion ? 1 : 0.1);
    const p = reduceMotion ? 0 : current;

    for (const k in TL) S[k] = track(TL[k], p);

    // turntable + idle float
    rig.rotation.y = S.rotY + (reduceMotion ? 0 : Math.sin(time * 0.5) * 0.04);
    radiator.position.y = Math.sin(time * 1.2) * 0.03;

    // explode fins
    const ex = S.explode;
    fins.forEach((f, i) => {
      f.position.x = f.userData.baseX + (i - (FIN_COUNT - 1) / 2) * 0.42 * ex + 0.35 * ex;
      f.rotation.y = ex * Math.sin(i * 0.7 + time * 0.8) * 0.06;
      f.position.y = FIN_Y + ex * Math.sin(i * 0.9 + time * 1.3) * 0.08;
    });
    tower.position.x = towerBaseX - 1.25 * ex;
    const firstX = fins[0].position.x, lastX = fins[FIN_COUNT - 1].position.x;
    const pipeStart = tower.position.x + 0.4, pipeEnd = lastX;
    pipes.forEach(pp => { pp.scale.x = pipeEnd - pipeStart; pp.position.x = (pipeStart + pipeEnd) / 2; });

    // colour
    const ci = S.color % 4, i0 = Math.floor(ci), i1 = (i0 + 1) % 4;
    cA.set(COLORS[i0]); cB.set(COLORS[i1]);
    tmpColor.copy(cA).lerp(cB, ci - i0);
    bodyMat.color.copy(tmpColor); finMat.color.copy(tmpColor); oilMat.color.copy(tmpColor);

    // heat
    const heat = S.heat * (1 - clamp((S.tilt - 0.3) / 0.4));
    const flicker = 0.92 + Math.sin(time * 7.3) * 0.04 + Math.sin(time * 13.1) * 0.03;
    finMat.emissiveIntensity = heat * 0.42 * flicker;
    oilMat.emissiveIntensity = heat * (0.8 + ex * 2.2) * flicker;
    warm.intensity = heat * 28 * flicker;
    halo.material.opacity = heat * 0.75;
    heatPool.material.opacity = heat * 0.55;
    pMat.opacity = heat * 0.85;
    if (heat > 0.01) {
      const arr = pGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        arr[i * 3 + 1] += pSpd[i] * dt * (0.6 + heat);
        arr[i * 3] += Math.sin(time * 1.5 + pPhase[i]) * dt * 0.15;
        if (arr[i * 3 + 1] > 8) { arr[i * 3 + 1] = 1 + Math.random() * 0.8; arr[i * 3] = -1.6 + Math.random() * 3.6; }
      }
      pGeo.attributes.position.needsUpdate = true;
    }

    // tilt (fall over to the right, with a little bounce)
    const tl = S.tilt;
    tiltPivot.rotation.z = -tl * 0.42 + (tl > 0.98 ? Math.sin(time * 9) * 0.004 : 0);

    // wifi rings
    rings.forEach(r => {
      const ph = (time * 0.55 + r.userData.offset) % 1;
      r.scale.setScalar(1 + ph * 1.9);
      r.material.opacity = S.wifi * (1 - ph) * 0.55;
    });

    // display
    const off = tl > 0.6;
    const shownTemp = S.zoom > 0.05 || S.wifi > 0.05 ? S.temp : 21;
    drawDisplay(shownTemp, off, heat, S.wifi);

    // camera: base + zoom toward the display
    display.getWorldPosition(dispWorld);
    camPos.copy(base.camPos); camTarget.copy(base.target);
    camPos.y += S.camY; camTarget.y += S.camY * 0.5;
    const z = S.zoom;
    if (z > 0) {
      const mobile = isMobile();
      const near = new THREE.Vector3(dispWorld.x + (mobile ? 0 : -0.9), dispWorld.y + (mobile ? -0.6 : 0.15), dispWorld.z + (mobile ? 9.5 : 5.8));
      const look = new THREE.Vector3(dispWorld.x - (mobile ? 0 : 1.4), dispWorld.y - (mobile ? 1.2 : 0.05), dispWorld.z);
      camPos.lerp(near, z); camTarget.lerp(look, z);
    }
    camera.position.copy(camPos);
    camera.lookAt(camTarget);

    renderer.render(scene, camera);
    updateOverlays(p, S);

    if (!firstFrameDone) { firstFrameDone = true; (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { lastDisp = ''; finishLoading(); }); }
    requestAnimationFrame(frame);
  }
  let firstFrameDone = false;
  requestAnimationFrame(frame);
}

/* =========================================================
   Reveal + tilt for the sections below the story
   ========================================================= */
window.addEventListener('load', () => {
  if (!window.gsap || reduceMotion) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.sec-title, .card, .offer-media, .offer-body > *, .spec-grid > div, .faq details, .calc-box, .final h2, .final .btn').forEach(el => {
    gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.from('.offer-media img', { scale: 0.85, rotate: -4, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.offer', start: 'top 75%' } });
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
});
