'use client';
/**
 * SellsyIntro v3 — white stage · burgundy · black (+ ENTER gate for autoplay sound)
 * STAGE 1: Splash gate (ENTER button, unlocks Web Audio)
 * STAGE 2: Cinematic intro ("Welcome to Sellsy" + 3D curved live card ribbon)
 * STAGE 3: Smooth exit fade -> Landing page
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createSound, NOOP } from './sellsySound';

const INK = '#14090b';
const WINE = '#7b1425';
const WINE2 = '#a3243a';
const PAPER = '#faf8f5';
const MONO = '500 13px "IBM Plex Mono", monospace';
const SANS = (w, s) => `${w} ${s}px "Inter Tight", system-ui, sans-serif`;
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@1,144,800,100,1&family=Instrument+Serif:ital@1&family=IBM+Plex+Mono:wght@400;500&family=Inter+Tight:wght@400;500;600&display=swap';

/* ---------------- helpers ---------------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const span = (p, a, b) => clamp((p - a) / (b - a));

/* ---------------- card themes: light / dark / burgundy ---------------- */
const THEMES = {
  light: { bg0: '#ffffff', bg1: '#f7f1ed', fg: INK, mute: '#8a7c7c', line: 'rgba(20,9,11,.12)', track: 'rgba(20,9,11,.08)', a: WINE, b: INK, c: '#cdb4b9', onA: '#ffffff', onB: '#ffffff', glow: 'rgba(123,20,37,.08)' },
  dark: { bg0: '#1a0b0f', bg1: '#0e0708', fg: '#f6efe9', mute: '#a59696', line: 'rgba(246,239,233,.14)', track: 'rgba(246,239,233,.1)', a: WINE2, b: '#f6efe9', c: '#5a2a33', onA: '#ffffff', onB: '#1a0b0f', glow: 'rgba(163,36,58,.35)' },
  wine: { bg0: '#8c1a2d', bg1: '#5c0f1c', fg: '#fbf4ee', mute: 'rgba(251,244,238,.7)', line: 'rgba(251,244,238,.22)', track: 'rgba(251,244,238,.16)', a: '#fbf4ee', b: INK, c: '#c9707f', onA: WINE, onB: '#fbf4ee', glow: 'rgba(255,255,255,.12)' },
};
const THEME_OF = ['light', 'dark', 'light', 'wine', 'light', 'dark', 'light', 'wine'];

/* ---------------- live dashboard-card artwork (canvas) ---------------- */
const rr = (c, x, y, w, h, r) => {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
};
const txt = (c, s, x, y, font, color, align = 'left') => {
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(s, x, y);
};
const fillA = (c, color, alpha) => {
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fill();
  c.restore();
};
function frame(c, w, h, label, tag, T) {
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, T.bg0);
  g.addColorStop(1, T.bg1);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const r = c.createRadialGradient(w, 0, 0, w, 0, w * 0.8);
  r.addColorStop(0, T.glow);
  r.addColorStop(1, 'rgba(0,0,0,0)');
  c.save();
  c.fillStyle = r;
  c.fillRect(0, 0, w, h);
  c.restore();
  txt(c, label, 32, 44, MONO, T.mute);
  txt(c, tag, w - 32, 44, MONO, T.mute, 'right');
  c.fillStyle = T.line;
  c.fillRect(32, 60, w - 64, 1);
}
function series(x, y, w, h, t, phase = 0) {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const u = i / 48;
    const v = 0.5 + 0.2 * Math.sin(u * 5 + t * 0.9 + phase) + 0.13 * Math.sin(u * 11 - t * 0.6) + 0.25 * (u - 0.5);
    pts.push([x + u * w, y + h - clamp(v, 0.06, 0.94) * h]);
  }
  return pts;
}
function stroke(c, pts, a, b, color, width = 2.5, dash = 0) {
  c.save();
  c.beginPath();
  for (let i = a; i <= b; i++) (i === a ? c.moveTo(pts[i][0], pts[i][1]) : c.lineTo(pts[i][0], pts[i][1]));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  if (dash) c.setLineDash([dash, dash]);
  c.stroke();
  c.restore();
}
function area(c, pts, y1, h, color) {
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.lineTo(pts[pts.length - 1][0], y1 + h);
  c.lineTo(pts[0][0], y1 + h);
  c.closePath();
  fillA(c, color, 0.14);
}
function pill(c, s, x, y, w, T) {
  rr(c, x, y, w, 26, 13);
  c.fillStyle = T.a;
  c.fill();
  txt(c, s, x + w / 2, y + 18, MONO, T.onA, 'center');
}

const TITLES = ['Revenue', 'Orders', 'Customers', 'Forecast', 'AI Agents', 'Inventory', 'Campaign ROI', 'Funnel'];
const DRAW = [
  // 0 revenue
  (c, w, h, t, T) => {
    frame(c, w, h, 'REVENUE', 'LAST 30 DAYS', T);
    const n = 184920 + Math.round(Math.sin(t * 1.3) * 380);
    txt(c, '$' + n.toLocaleString('en-US'), 32, 128, SANS(600, 54), T.fg);
    pill(c, '+12.4%', 32, 148, 84, T);
    const pts = series(32, 196, w - 64, 170, t);
    area(c, pts, 196, 170, T.a);
    stroke(c, pts, 0, 48, T.b, 2.8);
  },
  // 1 orders
  (c, w, h, t, T) => {
    frame(c, w, h, 'ORDERS', 'LIVE', T);
    txt(c, (1284 + (Math.floor(t * 0.7) % 9)).toLocaleString('en-US'), 32, 128, SANS(600, 54), T.fg);
    const n = 16, bw = (w - 64) / n;
    for (let i = 0; i < n; i++) {
      const v = 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(i * 0.75 + t * 1.1));
      const bh = v * 180;
      rr(c, 32 + i * bw + 3, 380 - bh, bw - 6, bh, 4);
      c.fillStyle = i === n - 1 ? T.b : i % 3 === 0 ? T.a : T.c;
      c.fill();
    }
  },
  // 2 customers
  (c, w, h, t, T) => {
    frame(c, w, h, 'CUSTOMERS', 'SEGMENTS', T);
    const cx = 170, cy = 230, R = 96, parts = [0.46, 0.3, 0.24], cols = [T.a, T.b, T.c];
    let a = -Math.PI / 2 + t * 0.35;
    parts.forEach((pt, i) => {
      c.beginPath();
      c.arc(cx, cy, R, a, a + pt * Math.PI * 2 - 0.05);
      c.strokeStyle = cols[i];
      c.lineWidth = 26;
      c.stroke();
      a += pt * Math.PI * 2;
    });
    txt(c, '8,412', cx, cy + 8, SANS(600, 30), T.fg, 'center');
    ['New', 'Returning', 'VIP'].forEach((s, i) => {
      c.fillStyle = cols[i];
      c.fillRect(330, 170 + i * 52, 14, 14);
      txt(c, s, 356, 183 + i * 52, SANS(500, 20), T.fg);
      txt(c, Math.round(parts[i] * 100) + '%', w - 32, 183 + i * 52, MONO, T.mute, 'right');
    });
  },
  // 3 forecast
  (c, w, h, t, T) => {
    frame(c, w, h, 'FORECAST', 'NEXT 30 DAYS', T);
    txt(c, '+18% growth', 32, 120, SANS(600, 44), T.fg);
    const pts = series(32, 160, w - 64, 200, t * 0.5, 1.2);
    stroke(c, pts, 0, 26, T.b, 3);
    stroke(c, pts, 26, 48, T.a, 3, 8);
    c.fillStyle = T.line;
    c.fillRect(pts[26][0], 150, 1, 230);
    txt(c, 'TODAY', pts[26][0] + 8, 166, MONO, T.mute);
  },
  // 4 agents
  (c, w, h, t, T) => {
    frame(c, w, h, 'AI AGENTS', '4 ACTIVE', T);
    ['Sales Agent', 'Inventory Agent', 'Customer Agent', 'Forecast Agent'].forEach((s, i) => {
      const y = 100 + i * 72;
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i);
      c.save();
      c.globalAlpha = 0.4 + pulse * 0.6;
      c.beginPath();
      c.arc(40, y + 10, 6, 0, 7);
      c.fillStyle = T.a;
      c.fill();
      c.restore();
      txt(c, s, 62, y + 16, SANS(500, 21), T.fg);
      const pr = 0.35 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 1.7));
      rr(c, 62, y + 32, w - 94, 8, 4);
      c.fillStyle = T.track;
      c.fill();
      rr(c, 62, y + 32, (w - 94) * pr, 8, 4);
      c.fillStyle = i % 2 ? T.a : T.b;
      c.fill();
    });
  },
  // 5 inventory
  (c, w, h, t, T) => {
    frame(c, w, h, 'INVENTORY', 'STOCK LEVEL', T);
    ['Classic Tee', 'Linen Shirt', 'Denim Jacket', 'Canvas Tote', 'Wool Scarf'].forEach((s, i) => {
      const y = 96 + i * 58;
      const lv = 0.2 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.6 + i * 1.9));
      txt(c, s, 32, y + 20, SANS(500, 19), T.fg);
      rr(c, 210, y + 6, w - 242, 14, 7);
      c.fillStyle = T.track;
      c.fill();
      rr(c, 210, y + 6, (w - 242) * lv, 14, 7);
      c.fillStyle = lv < 0.35 ? T.a : T.b;
      c.fill();
    });
  },
  // 6 campaign roi
  (c, w, h, t, T) => {
    frame(c, w, h, 'CAMPAIGN ROI', 'BY CHANNEL × WEEK', T);
    const cx = 14, cy = 6, cw = (w - 64) / cx, ch = 40;
    for (let y = 0; y < cy; y++)
      for (let x = 0; x < cx; x++) {
        const v = 0.5 + 0.5 * Math.sin(x * 0.6 + y * 0.9 + t);
        rr(c, 32 + x * cw + 2, 90 + y * (ch + 6), cw - 4, ch, 5);
        if (v > 0.72) fillA(c, T.b, 0.55 + v * 0.4);
        else fillA(c, T.a, 0.15 + v * 0.8);
      }
  },
  // 7 funnel
  (c, w, h, t, T) => {
    frame(c, w, h, 'CONVERSION FUNNEL', 'THIS WEEK', T);
    ['Visits', 'Add to cart', 'Checkout', 'Paid'].forEach((s, i) => {
      const y = 92 + i * 74;
      const bw = (w - 64) * (1 - i * 0.22) * (0.96 + 0.04 * Math.sin(t * 2 + i));
      rr(c, 32, y, bw, 52, 8);
      c.fillStyle = i % 2 ? T.b : T.a;
      c.fill();
      txt(c, s, 48, y + 33, SANS(500, 20), i % 2 ? T.onB : T.onA);
    });
  },
];

/* ---------------- shaders ---------------- */
const VS = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FS = `uniform sampler2D map;uniform float aspect,radius;varying vec2 vUv;
void main(){
  vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
  float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
  float px=fwidth(d),a=1.-smoothstep(-px,px,d);
  if(a<.01)discard;
  vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
  vec3 c=texture2D(map,uv).rgb;
  float edge=smoothstep(-.005-px,-.005,d);
  gl_FragColor=vec4(mix(c,vec3(.08,.035,.045),edge*.3),a);
}`;

const WORD = 'Sellsy'.split('');

/* ---------------- component ---------------- */
export default function SellsyIntro({
  phase = 'splash',
  onEnter: propOnEnter,
  onDone = () => {},
  duration = 4.5,
  logoTime = 3,
}) {
  const [internalPhase, setInternalPhase] = useState('splash');
  const currentPhase = propOnEnter ? phase : internalPhase;

  const [startedIntro, setStartedIntro] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [destroyed, setDestroyed] = useState(false);
  const [snd, setSnd] = useState('on'); // 'on' | 'off'

  const sndRef = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const exitRef = useRef(() => {});

  const rootRef = useRef(null), canvasRef = useRef(null), stageRef = useRef(null);
  const l1 = useRef(null), l2 = useRef(null), cap = useRef(null), glow = useRef(null),
    cross = useRef(null), hint = useRef(null), nameEl = useRef(null);

  // ENTER click handler: unlocks audio and enters intro
  const handleEnter = () => {
    const s = createSound(setSnd, logoTime, duration) || NOOP;
    sndRef.current = s;
    s.resume();
    if (propOnEnter) {
      propOnEnter();
    } else {
      setInternalPhase('intro');
    }
  };

  // Keyboard Enter on splash gate
  useEffect(() => {
    if (currentPhase !== 'splash') return;
    const k = (e) => {
      if (e.key === 'Enter') handleEnter();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [currentPhase]);

  // When phase changes to 'intro', record that intro animation is active
  useEffect(() => {
    if (currentPhase === 'intro') {
      setStartedIntro(true);
    }
  }, [currentPhase]);

  // Three.js and Intro Animation Loop
  useEffect(() => {
    if (!startedIntro) return;
    let disposed = false, raf = 0;

    const sound = sndRef.current || NOOP;
    const GEST = ['pointerdown', 'pointerup', 'mousedown', 'click', 'touchstart', 'touchend', 'keydown'];
    const gesture = (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-snd]')) return;
      sound.resume();
    };
    GEST.forEach((ev) => window.addEventListener(ev, gesture, { passive: true }));
    sound.resume();

    // Load fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);

    /* renderer */
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    const scene = new THREE.Scene();
    const FOV = 35;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    /* ribbon rail */
    let path, PATH_L = 1;
    const SAMPLES = 1200, pathP = [], pathT = [];
    const PH0 = -1.5, PH1 = Math.PI * 2 + 1.35;
    function buildPath() {
      const pts = [];
      for (let i = 0; i <= 160; i++) {
        const t = i / 160, ph = mix(PH0, PH1, t), cs = Math.cos(ph), u = 2 * t - 1;
        const depth = cs > 0 ? 7.6 + 16.4 * cs ** 0.9 : 7.6 + 2.2 * cs;
        const edge = 0.84 + 0.5 * span(0.14 - t, 0, 0.14) + 0.8 * span(t, 0.84, 1);
        pts.push(new THREE.Vector3(edge * Math.sin(ph) * depth * 0.561, 0.5 * Math.sign(u) * Math.abs(u) ** 1.4 * depth * 0.63, -depth));
      }
      path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      path.arcLengthDivisions = 1500;
      PATH_L = path.getLength();
      for (let i = 0; i <= SAMPLES; i++) {
        const u = i / SAMPLES;
        pathP.push(path.getPointAt(u));
        pathT.push(path.getTangentAt(u));
      }
    }
    const at = (s, op, ot) => {
      const f = clamp(s / PATH_L) * SAMPLES, i = Math.min(SAMPLES - 1, Math.floor(f)), k = f - i;
      op.lerpVectors(pathP[i], pathP[i + 1], k);
      ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
    };

    /* cards */
    const CARD_W = 2.1, CARD_H = 1.32, GAP = 0.03, STEP = CARD_W + GAP, NX = 28, NY = 3;
    const cards = TITLES.map((title, i) => {
      const cv = document.createElement('canvas');
      cv.width = 640; cv.height = 400;
      const ctx = cv.getContext('2d');
      const T = THEMES[THEME_OF[i]];
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.NoColorSpace;
      tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
      const mat = new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: FS, transparent: true, side: THREE.DoubleSide,
        uniforms: { map: { value: tex }, aspect: { value: CARD_W / CARD_H }, radius: { value: 0.018 } },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      DRAW[i](ctx, 640, 400, 0, T);
      tex.needsUpdate = true;
      return { i, title, T, cv, ctx, tex, geo, mat, mesh, rect: null };
    });

    /* layout */
    const GZ = 8;
    let W = 1, H = 1, asp = 1, cols = 3, rows = 2, tanH = 0.3153;
    function resize() {
      W = window.innerWidth; H = window.innerHeight; asp = W / H;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H, false);
      camera.aspect = asp;
      camera.fov = asp < 16 / 9 ? (Math.atan(0.561 / asp) * 360) / Math.PI : FOV;
      camera.updateProjectionMatrix();
      tanH = Math.tan((camera.fov * Math.PI) / 360);
      cols = asp < 0.9 ? 2 : 3; rows = asp < 0.9 ? 3 : 2;
    }
    window.addEventListener('resize', resize);
    resize();
    buildPath();

    /* poses */
    const op = new THREE.Vector3(), ot = new THREE.Vector3(), up = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3();
    function poseRibbon(c, head) {
      const pos = c.geo.attributes.position, centre = head - c.i * STEP;
      for (let iy = 0; iy <= NY; iy++)
        for (let ix = 0; ix <= NX; ix++) {
          const k = iy * (NX + 1) + ix, lu = ix / NX - 0.5, lv = 0.5 - iy / NY;
          at(centre + lu * CARD_W, op, ot);
          up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
          vp.copy(op).addScaledVector(up, lv * CARD_H);
          pos.setXYZ(k, vp.x, vp.y, vp.z);
        }
      pos.needsUpdate = true;
    }

    /* interaction */
    let mx = 0, my = 0, mxs = 0, mys = 0, pNow = 0;
    const stage = stageRef.current;
    const onMove = (e) => {
      mx = e.clientX / W - 0.5; my = e.clientY / H - 0.5;
      let hit = null;
      if (pNow > 0.86) {
        const nx = e.clientX / W - 0.5, ny = 0.5 - e.clientY / H;
        for (const c of cards) {
          const g = c.rect; if (!g) continue;
          const x = nx * g.vw, y = ny * g.vh;
          if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) hit = c;
        }
      }
      const n = nameEl.current;
      if (n) {
        n.style.opacity = hit ? 1 : 0;
        if (hit) { n.textContent = hit.title; n.style.transform = `translate(${e.clientX + 14}px,${e.clientY + 16}px)`; }
      }
    };
    if (stage) stage.addEventListener('pointermove', onMove);

    let finished = false;
    const exit = () => {
      if (finished) return;
      finished = true;
      sound.finale();
      setLeaving(true);
      if (doneRef.current) {
        doneRef.current();
      }
      setTimeout(() => {
        setDestroyed(true);
      }, 900);
    };
    exitRef.current = exit;

    const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') exit(); };
    const keyTimer = setTimeout(() => window.addEventListener('keydown', onKey), 400);

    /* render */
    const RIB_A = 0.14, RIB_B = 0.95;
    function render(pp, clock, frameNo) {
      const run = ease(span(pp, 0, 0.5)) * 95;
      if (l1.current) l1.current.style.transform = `translate3d(${run}vw,0,0)`;
      if (l2.current) l2.current.style.transform = `translate3d(${-run}vw,0,0)`;
      if (cap.current) cap.current.style.opacity = 1 - span(pp, 0, 0.1);
      const intro = 1 - span(pp, 0, 0.08);
      if (hint.current) hint.current.style.opacity = intro;
      if (cross.current) cross.current.style.opacity = intro;
      if (glow.current) glow.current.style.opacity = intro;

      const k = 1 - span(pp, 0.7, 0.86);
      mxs += (mx - mxs) * 0.06; mys += (my - mys) * 0.06;
      camera.rotation.y = -mxs * 0.07 * k;
      camera.rotation.x = -mys * 0.05 * k;

      const pr = span(pp, RIB_A, RIB_B), head = mix(0, PATH_L + cards.length * STEP, pr);
      for (const c of cards) {
        const s = head - c.i * STEP, end = PATH_L - CARD_W;
        c.rect = null;
        c.mesh.visible = pp > 0 && s > CARD_W && s < end;
        if (c.mesh.visible) poseRibbon(c, head);
        if (c.mesh.visible && frameNo % 2 === 0) {
          DRAW[c.i](c.ctx, 640, 400, clock, c.T);
          c.tex.needsUpdate = true;
        }
      }
      renderer.render(scene, camera);
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const fontsReady = async () => {
      await Promise.race([new Promise((r) => { link.onload = r; link.onerror = r; }), wait(2500)]);
      try {
        await Promise.race([
          Promise.all([
            document.fonts.load('italic 800 100px Fraunces'),
            document.fonts.load('italic 100px "Instrument Serif"'),
            document.fonts.load('500 13px "IBM Plex Mono"'),
            document.fonts.load('600 20px "Inter Tight"'),
          ]),
          wait(1500),
        ]);
      } catch (e) {}
    };

    let t0 = 0, n = 0;
    const cues = [
      ...WORD.map((_, i) => [0.55 + i * 0.09, () => sound.pluck(i)]),
      [1.3, () => sound.swash()],
      [2.4, () => sound.bell()],
      [logoTime, () => sound.slide()],
      [logoTime + 0.27 * duration, () => sound.pass()],
    ].sort((a, b) => a[0] - b[0]);

    const loop = () => {
      if (disposed) return;
      const clock = (performance.now() - t0) / 1000;
      const pp = clamp((clock - logoTime) / duration);
      pNow = pp;
      sound.resume();
      while (cues.length && clock >= cues[0][0]) cues.shift()[1]();
      sound.tick(pp, clock);
      render(pp, clock, n++);
      if (clock > logoTime + duration + 0.1) exit();
      raf = requestAnimationFrame(loop);
    };

    fontsReady().then(() => {
      if (disposed) return;
      if (rootRef.current) rootRef.current.dataset.go = '1';
      t0 = performance.now();
      loop();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(keyTimer);
      GEST.forEach((ev) => window.removeEventListener(ev, gesture));
      sound.dispose();
      sndRef.current = null;
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      if (stage) stage.removeEventListener('pointermove', onMove);
      cards.forEach((c) => { c.geo.dispose(); c.mat.dispose(); c.tex.dispose(); });
      renderer.dispose();
      link.remove();
    };
  }, [startedIntro, duration, logoTime]);

  // STAGE 1: Splash gate (first thing visible on load)
  if (currentPhase === 'splash') {
    return (
      <div className="sv-gate">
        <link rel="stylesheet" href={FONT_URL} />
        <style>{CSS}</style>
        <div className="sv-gate-logo"><b>S</b>ellsy</div>
        <button type="button" className="sv-gate-btn" onClick={handleEnter} autoFocus>
          ENTER
        </button>
      </div>
    );
  }

  // Once destroyed, intro unmounts completely
  if (destroyed || (currentPhase === 'done' && !leaving)) {
    return null;
  }

  // STAGE 2: Cinematic intro (with smooth fade/curtain exit into STAGE 3)
  return (
    <div
      ref={rootRef}
      className="sv-root"
      style={{
        clipPath: leaving ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        opacity: leaving ? 0 : 1,
        transition: 'clip-path 0.85s cubic-bezier(.77,0,.18,1), opacity 0.85s ease-out',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      <style>{CSS}</style>
      <main className="sv-stage" ref={stageRef}>
        <div className="sv-glow" ref={glow} />
        <div className="sv-cross" ref={cross}><i>+</i></div>

        <h1 className="sv-lock" aria-label="Welcome to Sellsy">
          <div className="sv-hl sv-welcome" ref={l1} aria-hidden="true">Welcome to</div>
          <div className="sv-hl" ref={l2} aria-hidden="true">
            <span className="sv-wm">
              {WORD.map((ch, i) => (
                <span className="sv-ch" key={i}>
                  <i style={{ '--d': `${0.3 + i * 0.09}s`, color: i === 0 || i === WORD.length - 1 ? WINE : INK }}>{ch}</i>
                </span>
              ))}
              <svg className="sv-swash" viewBox="0 0 1000 100" aria-hidden="true">
                <path d="M8 66 C 190 96, 430 14, 650 56 S 910 98, 992 26" pathLength="1" />
              </svg>
            </span>
          </div>
          <div className="sv-cap" ref={cap}>Your store, understood.</div>
        </h1>

        <canvas className="sv-gl" ref={canvasRef} />
        <div className="sv-hint" ref={hint}>AI COMMERCE INTELLIGENCE</div>

        <header className="sv-top">
          <div className="sv-logo"><b>S</b>ellsy</div>
          <nav className="sv-acts">
            <button type="button" data-snd onClick={() => sndRef.current && sndRef.current.toggle()} aria-label="Toggle sound">
              <span className={`sv-eq${snd !== 'off' ? ' on' : ''}`}><i /><i /><i /><i /></span>
              {snd === 'off' ? 'SOUND OFF' : 'SOUND ON'}
            </button>
            <a href="#skip" onClick={(e) => { e.preventDefault(); exitRef.current(); }}>SKIP INTRO<b /></a>
          </nav>
        </header>

        <footer className="sv-bot">
          <p>Multi-agent intelligence that turns your store data into smarter business decisions.</p>
          <div className="sv-mid">SALES<s>/</s>CUSTOMERS<s>/</s>FORECASTS<s>/</s>AGENTS</div>
        </footer>
        <div className="sv-name" ref={nameEl} />
      </main>
    </div>
  );
}

/* ---------------- styles ---------------- */
const CSS = `
.sv-root{position:fixed;inset:0;z-index:99999;background:${PAPER};color:${INK};font-family:'Inter Tight',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sv-root *{box-sizing:border-box;margin:0;padding:0}
.sv-stage{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse 70% 55% at 50% -10%,rgba(123,20,37,.10),rgba(123,20,37,0) 70%),${PAPER}}
.sv-glow{position:absolute;left:0;right:0;top:0;height:42%;background:linear-gradient(rgba(123,20,37,.05),rgba(123,20,37,0))}
.sv-cross{position:absolute;left:32px;right:32px;top:37.5%;height:1px;background:rgba(20,9,11,.12)}
.sv-cross i{position:absolute;left:50%;top:-.62em;margin-left:-.3em;font:400 13px 'IBM Plex Mono',monospace;color:#8a7c7c;background:${PAPER};padding:0 .3em;line-height:1.2;font-style:normal}
.sv-rule{position:absolute;left:3.5vw;right:3.5vw;top:50%;height:1px;background:rgba(20,9,11,.14);transform-origin:left;transform:scaleX(0)}

/* enter gate */
.sv-gate{position:fixed;inset:0;z-index:99999;background:${PAPER};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;font-family:'Inter Tight',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sv-gate *{box-sizing:border-box}
.sv-gate-logo{font:italic 800 56px/1 'Fraunces',Georgia,serif;font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 144;letter-spacing:-.02em;color:${INK}}
.sv-gate-logo b{color:${WINE};font-weight:800}
.sv-gate-btn{height:46px;padding:0 38px;border:1px solid ${INK};border-radius:99px;background:transparent;color:${INK};font:500 13px 'IBM Plex Mono',monospace;letter-spacing:.18em;cursor:pointer;transition:background .25s,color .25s}
.sv-gate-btn:hover{background:${INK};color:#fff}
.sv-gate-note{font:400 11px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:#8a7c7c}

/* logotype */
.sv-lock{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:1.4vw;pointer-events:none;font-weight:400}
.sv-hl{white-space:nowrap;text-align:center;will-change:transform}
.sv-welcome{display:flex;align-items:center;gap:1.1em;font:italic 400 clamp(22px,3.1vw,58px)/1 'Instrument Serif',Georgia,serif;letter-spacing:.01em;color:${INK};opacity:0}
.sv-welcome:before,.sv-welcome:after{content:"";width:5vw;height:1px;background:${WINE}}
.sv-wm{position:relative;display:inline-block;font-family:'Fraunces',Georgia,serif;font-weight:800;font-size:clamp(88px,17vw,330px);line-height:.92;letter-spacing:-.035em;font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 144;padding-bottom:.2em}
.sv-ch{display:inline-block;vertical-align:top;overflow:hidden;padding:.1em .06em .34em .02em;margin:-.1em -.06em -.34em -.02em}
.sv-ch i{display:inline-block;font-style:italic;transform:translateY(120%)}
.sv-swash{position:absolute;left:3%;bottom:.02em;width:76%;height:auto;overflow:visible}
.sv-swash path{fill:none;stroke:${WINE};stroke-width:7;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1}
.sv-cap{margin-top:.6vw;font-size:clamp(9px,.78vw,13px);font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#6f6264;opacity:0}
[data-go] .sv-welcome{animation:svFade .9s .05s ease forwards}
[data-go] .sv-cap{animation:svFade .9s 1.7s ease forwards}
[data-go] .sv-ch i{animation:svUp 1s var(--d) cubic-bezier(.19,.9,.22,1) forwards}
[data-go] .sv-swash path{animation:svDraw 1.15s 1.25s cubic-bezier(.6,0,.2,1) forwards}
@keyframes svUp{to{transform:translateY(0)}}
@keyframes svFade{to{opacity:1}}
@keyframes svDraw{to{stroke-dashoffset:0}}

.sv-gl{position:absolute;inset:0;width:100%;height:100%;display:block}
.sv-hint{position:absolute;left:50%;top:33px;transform:translateX(-50%);font:400 11.5px 'IBM Plex Mono',monospace;letter-spacing:.06em;padding-bottom:6px;border-bottom:1px solid rgba(20,9,11,.14)}
.sv-top{position:absolute;left:32px;right:32px;top:24px;display:flex;align-items:center;justify-content:space-between;pointer-events:none}
.sv-logo{font:italic 800 27px/1 'Fraunces',Georgia,serif;font-variation-settings:'SOFT' 100,'WONK' 1,'opsz' 144;letter-spacing:-.02em;color:${INK}}
.sv-logo b{color:${WINE};font-weight:800}
.sv-acts{pointer-events:auto;display:flex;align-items:center;gap:8px}
.sv-acts a{display:flex;align-items:center;gap:9px;height:32px;padding:0 15px;border:1px solid rgba(20,9,11,.5);border-radius:99px;color:${INK};text-decoration:none;font-size:12px;font-weight:500;letter-spacing:.06em;transition:background .2s,color .2s}
.sv-acts a:hover{background:${INK};color:#fff}
.sv-acts a b{display:block;width:13px;height:7px;border-top:1px solid currentColor;border-bottom:1px solid currentColor}
.sv-bot{position:absolute;left:32px;right:32px;bottom:26px;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;font-size:12.5px;line-height:1.35}
.sv-bot p{max-width:21em;pointer-events:none;color:#4a3d3f}
.sv-mid{font:400 11.5px 'IBM Plex Mono',monospace;letter-spacing:.06em;pointer-events:none}
.sv-mid s{text-decoration:none;color:${WINE};margin:0 .9em}
.sv-r{justify-self:end;display:flex;gap:12px;align-items:center;font:500 11.5px 'IBM Plex Mono',monospace;letter-spacing:.06em;background:none;border:0;color:${WINE};cursor:pointer}
.sv-r:after{content:"";width:22px;height:1px;background:${WINE};transition:width .25s}
.sv-r:hover:after{width:40px}
.sv-name{position:absolute;left:0;top:0;padding:6px 11px;background:${INK};color:#fff;border-radius:99px;font-size:11.5px;font-weight:600;letter-spacing:.04em;pointer-events:none;opacity:0;transition:opacity .16s;white-space:nowrap}
.sv-acts button{display:flex;align-items:center;gap:9px;height:32px;padding:0 15px;border:1px solid rgba(20,9,11,.5);border-radius:99px;background:transparent;color:${INK};font:500 12px 'Inter Tight',system-ui,sans-serif;letter-spacing:.06em;cursor:pointer;transition:background .2s,color .2s}
.sv-acts button:hover{background:${INK};color:#fff}
.sv-eq{display:flex;align-items:flex-end;gap:2px;height:11px}
.sv-eq i{display:block;width:2px;height:3px;background:currentColor;border-radius:1px}
.sv-eq.on i{animation:svEq .9s ease-in-out infinite}
.sv-eq.on i:nth-child(2){animation-delay:.2s}.sv-eq.on i:nth-child(3){animation-delay:.45s}.sv-eq.on i:nth-child(4){animation-delay:.1s}
@keyframes svEq{0%,100%{height:3px}50%{height:11px}}
@media (max-width:760px){
  .sv-top{left:18px;right:18px;top:16px}.sv-bot{left:18px;right:18px;bottom:18px;grid-template-columns:1fr auto}.sv-mid{display:none}
  .sv-hint{display:none}.sv-bot p{max-width:17em;font-size:11px}
  .sv-welcome:before,.sv-welcome:after{width:8vw}
  .sv-gate-logo{font-size:44px}
}
`;
