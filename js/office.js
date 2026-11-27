// 3D-Büro: Low-Poly-Geometrie, im Code erzeugte Pixeltexturen, feste Sitzkamera.
// Gerendert wird in reduzierter Auflösung und pixelig hochskaliert (leicht für schwache Rechner).

import * as THREE from 'three';
import { PEOPLE } from './story.js';
import { fmtInt, fmtNum, cur, toCur } from './data.js';

const PIXEL = 2; // 1 Renderpixel = 2×2 Bildschirmpixel

// ---------------------------------------------------------------- Textur-Werkzeuge
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rgb = (r, g, b) => `rgb(${Math.max(0, Math.min(255, r)) | 0},${Math.max(0, Math.min(255, g)) | 0},${Math.max(0, Math.min(255, b)) | 0})`;

function tex(w, h, draw, repX = 1, repY = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repX, repY);
  return t;
}

function noiseFill(ctx, w, h, [r, g, b], vary, seed) {
  const rnd = rng(seed);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (rnd() - 0.5) * vary;
    ctx.fillStyle = rgb(r + k, g + k, b + k);
    ctx.fillRect(x, y, 1, 1);
  }
}

const TEX = {};
function buildTextures() {
  TEX.carpet = tex(32, 32, (c, w, h) => {
    noiseFill(c, w, h, [96, 86, 70], 22, 1);
    const rnd = rng(9);
    for (let i = 0; i < 40; i++) { c.fillStyle = rnd() > 0.5 ? '#6e624f' : '#7f5f3c'; c.fillRect(rnd() * w | 0, rnd() * h | 0, 1, 1); }
  }, 14, 14);
  TEX.wood = tex(32, 16, (c, w, h) => {
    const rnd = rng(2);
    for (let y = 0; y < h; y++) {
      const band = Math.sin(y * 0.8 + rnd() * 0.6) * 9;
      for (let x = 0; x < w; x++) {
        const k = band + (rnd() - 0.5) * 8;
        c.fillStyle = rgb(136 + k, 88 + k * 0.7, 50 + k * 0.4);
        c.fillRect(x, y, 1, 1);
      }
    }
    c.fillStyle = 'rgba(70,40,20,0.35)';
    for (let i = 0; i < 6; i++) c.fillRect(rnd() * w | 0, rnd() * h | 0, 6 + rnd() * 10 | 0, 1);
  }, 2, 1);
  TEX.wall = tex(16, 16, (c, w, h) => noiseFill(c, w, h, [204, 196, 172], 7, 3), 20, 3);
  TEX.fabric = tex(16, 16, (c, w, h) => {
    const rnd = rng(4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = ((x + y) % 2 ? 7 : -7) + (rnd() - 0.5) * 8;
      c.fillStyle = rgb(170 + k, 100 + k, 50 + k * 0.5);
      c.fillRect(x, y, 1, 1);
    }
  }, 6, 4);
  TEX.ceiling = tex(32, 32, (c, w, h) => {
    noiseFill(c, w, h, [218, 214, 202], 6, 5);
    const rnd = rng(6);
    c.fillStyle = '#b9b4a6';
    for (let i = 0; i < 50; i++) c.fillRect(rnd() * w | 0, rnd() * h | 0, 1, 1);
    c.fillStyle = '#9e998c'; c.fillRect(0, 0, w, 1); c.fillRect(0, 0, 1, h);
  }, 10, 10);
  TEX.plastic = tex(8, 8, (c, w, h) => noiseFill(c, w, h, [212, 202, 176], 6, 7));
  TEX.steel = tex(8, 8, (c, w, h) => noiseFill(c, w, h, [122, 134, 118], 8, 8));
  TEX.sky = tex(160, 48, (c, w, h) => {
    for (let y = 0; y < h; y++) {
      const f = y / h;
      c.fillStyle = rgb(146 + f * 70, 176 + f * 42, 200 + f * 8);
      c.fillRect(0, y, w, 1);
    }
    const rnd = rng(11);
    let x = 0;
    while (x < w) {
      const bw = 6 + rnd() * 14 | 0, bh = 10 + rnd() * 30 | 0, shade = 110 + rnd() * 50;
      c.fillStyle = rgb(shade, shade + 4, shade + 10);
      c.fillRect(x, h - bh, bw, bh);
      for (let wy = h - bh + 2; wy < h - 1; wy += 3) for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
        c.fillStyle = rnd() > 0.7 ? rgb(shade + 50, shade + 50, shade + 40) : rgb(shade - 25, shade - 22, shade - 15);
        c.fillRect(wx, wy, 1, 1);
      }
      x += bw + (rnd() * 3 | 0);
    }
    c.fillStyle = rgb(90, 96, 84); c.fillRect(0, h - 2, w, 2);
  });
  TEX.skyWide = tex(256, 96, (c, w, h) => {
    for (let y = 0; y < h; y++) {
      const f = y / h;
      c.fillStyle = rgb(140 + f * 80, 172 + f * 48, 200 + f * 10);
      c.fillRect(0, y, w, 1);
    }
    const rnd = rng(23);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 6; i++) { const cx = rnd() * w, cy = 6 + rnd() * 20; c.fillRect(cx | 0, cy | 0, 14 + rnd() * 18 | 0, 2); c.fillRect(cx + 4 | 0, cy - 2 | 0, 8, 2); }
    // zwei Häuserreihen: hinten hell, vorne dunkler und höher
    for (const [base, minH, maxH, shade0] of [[h - 30, 8, 30, 150], [h, 20, 52, 112]]) {
      let x = 0;
      while (x < w) {
        const bw = 8 + rnd() * 18 | 0, bh = minH + rnd() * (maxH - minH) | 0, shade = shade0 + rnd() * 35;
        c.fillStyle = rgb(shade, shade + 3, shade + 9);
        c.fillRect(x, base - bh, bw, bh);
        for (let wy = base - bh + 2; wy < base - 1; wy += 3) for (let wx = x + 1; wx < x + bw - 1; wx += 2) {
          c.fillStyle = rnd() > 0.75 ? rgb(shade + 55, shade + 52, shade + 40) : rgb(shade - 28, shade - 24, shade - 16);
          c.fillRect(wx, wy, 1, 1);
        }
        x += bw + (rnd() * 4 | 0);
      }
    }
  });
  TEX.keyboard2 = tex(32, 10, (c, w, h) => {
    c.fillStyle = '#b9b6ac'; c.fillRect(0, 0, w, h);
    for (let y = 1; y < 8; y += 2) for (let x = 1; x < w - 1; x += 2) { c.fillStyle = (x > 24) ? '#6f6c64' : '#e4e1d8'; c.fillRect(x, y, 1, 1); }
    c.fillStyle = '#e4e1d8'; c.fillRect(8, 8, 12, 1);
  });
  TEX.pcfront = tex(32, 8, (c) => {
    c.fillStyle = '#d6d0bf'; c.fillRect(0, 0, 32, 8);
    c.fillStyle = '#2a2a28'; c.fillRect(3, 3, 9, 1); c.fillRect(15, 3, 9, 1);
    c.fillStyle = '#7a756a'; c.fillRect(3, 5, 4, 1); c.fillRect(15, 5, 4, 1);
    c.fillStyle = '#3d8f55'; c.fillRect(28, 5, 2, 1);
    c.fillStyle = '#1f3557'; c.fillRect(27, 1, 3, 2);
  });
  TEX.rug = tex(32, 24, (c) => {
    c.fillStyle = '#6a2f2a'; c.fillRect(0, 0, 32, 24);
    c.fillStyle = '#8a4a32'; c.fillRect(2, 2, 28, 20);
    c.fillStyle = '#6a2f2a'; c.fillRect(4, 4, 24, 16);
    c.fillStyle = '#b98a4a';
    for (let y = 6; y < 18; y += 4) for (let x = 6; x < 26; x += 4) c.fillRect(x, y, 2, 2);
  });
  TEX.flip = tex(24, 32, (c) => {
    c.fillStyle = '#f6f4ee'; c.fillRect(0, 0, 24, 32);
    c.fillStyle = '#b3302a'; c.fillRect(3, 3, 18, 2);
    c.fillStyle = '#1f3a8a';
    const pts = [[5, 10], [18, 9], [11, 16], [4, 23], [19, 24], [12, 28]];
    const edges = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [0, 1]];
    for (const [a, b] of edges) {
      const [x1, y1] = pts[a], [x2, y2] = pts[b];
      for (let k = 0; k <= 12; k++) c.fillRect(Math.round(x1 + (x2 - x1) * k / 12), Math.round(y1 + (y2 - y1) * k / 12), 1, 1);
    }
    c.fillStyle = '#b3302a';
    for (const [x, y] of pts) c.fillRect(x - 1, y - 1, 3, 3);
  });
  TEX.carpetBlue = tex(32, 32, (c, w, h) => noiseFill(c, w, h, [44, 56, 88], 14, 41), 14, 14);
  TEX.handy = tex(6, 12, (c) => {
    c.fillStyle = '#2a2c30'; c.fillRect(0, 0, 6, 12);
    c.fillStyle = '#9fc48a'; c.fillRect(1, 1, 4, 4);
    c.fillStyle = '#c9ccd2';
    for (let y = 7; y < 12; y += 2) for (let x = 1; x < 6; x += 2) c.fillRect(x, y, 1, 1);
  });
  TEX.smartphone = tex(8, 14, (c) => {
    c.fillStyle = '#0d0e10'; c.fillRect(0, 0, 8, 14);
    c.fillStyle = '#1d3d6a'; c.fillRect(1, 1, 6, 11);
    const cols = ['#e2574c', '#f2b134', '#4bb35e', '#3a8fd8', '#a865d4', '#f2f2f2'];
    let k = 0;
    for (let y = 2; y < 11; y += 2) for (let x = 1; x < 7; x += 2) { c.fillStyle = cols[k++ % cols.length]; c.fillRect(x, y, 1, 1); }
    c.fillStyle = '#444'; c.fillRect(3, 12, 2, 1);
  });
  TEX.leather = tex(8, 8, (c, w, h) => noiseFill(c, w, h, [62, 44, 36], 10, 31));
  TEX.goldcard = tex(24, 12, (c) => {
    c.fillStyle = '#d8b44e'; c.fillRect(0, 0, 24, 12);
    c.fillStyle = '#a8842a'; c.fillRect(0, 0, 3, 3);
    c.fillStyle = '#5a4612';
    const rnd = rng(77);
    for (let x = 4; x < 23; x += 1) for (let y = 2; y < 11; y += 2) if (rnd() > 0.7) c.fillRect(x, y, 1, 1);
  });
  TEX.globe = tex(32, 16, (c) => {
    c.fillStyle = '#2f6fa8'; c.fillRect(0, 0, 32, 16);
    c.fillStyle = '#5a9a4a';
    [[3, 3, 6, 4], [6, 8, 3, 5], [14, 3, 4, 3], [15, 7, 4, 6], [20, 3, 8, 5], [25, 10, 4, 3]].forEach(([x, y, w, h]) => c.fillRect(x, y, w, h));
    c.fillStyle = '#e8eef2'; c.fillRect(0, 0, 32, 1); c.fillRect(0, 15, 32, 1);
  });
  TEX.keypad = tex(8, 8, (c) => {
    c.fillStyle = '#6f6a5c'; c.fillRect(0, 0, 8, 8);
    c.fillStyle = '#efe9d8';
    for (let y = 1; y < 8; y += 2) for (let x = 1; x < 7; x += 2) c.fillRect(x, y, 1, 1);
  });
  TEX.typekeys = tex(16, 6, (c) => {
    c.fillStyle = '#2f3a48'; c.fillRect(0, 0, 16, 6);
    c.fillStyle = '#e8e2cf';
    for (let y = 0; y < 5; y += 2) for (let x = 1 + (y / 2); x < 15; x += 2) c.fillRect(x | 0, y, 1, 1);
    c.fillRect(4, 5, 8, 1);
  });
  TEX.cards = tex(16, 8, (c) => {
    c.fillStyle = '#f2eee2'; c.fillRect(0, 0, 16, 8);
    c.fillStyle = '#c9c2ae';
    for (let x = 0; x < 16; x += 2) c.fillRect(x, 0, 1, 8);
  });
  TEX.keyboard = tex(32, 10, (c, w, h) => {
    c.fillStyle = '#c9bf9f'; c.fillRect(0, 0, w, h);
    for (let y = 1; y < 8; y += 2) for (let x = 1; x < w - 1; x += 2) { c.fillStyle = (x > 26) ? '#8f7a52' : '#efe7cf'; c.fillRect(x, y, 1, 1); }
    c.fillStyle = '#efe7cf'; c.fillRect(9, 8, 13, 1);
  });
  TEX.calc = tex(12, 16, (c, w, h) => {
    c.fillStyle = '#2b2a28'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3d8f55'; c.fillRect(1, 1, 10, 3);
    for (let y = 6; y < 15; y += 2) for (let x = 1; x < 11; x += 3) { c.fillStyle = y === 6 ? '#c55a2a' : '#d8d2c0'; c.fillRect(x, y, 2, 1); }
  });
  TEX.bauhaus = tex(16, 20, (c) => {
    c.fillStyle = '#ece4cf'; c.fillRect(0, 0, 16, 20);
    c.fillStyle = '#c0392b'; c.beginPath(); c.arc(6, 7, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#284b8f'; c.fillRect(8, 9, 6, 6);
    c.fillStyle = '#e3b21f'; c.beginPath(); c.moveTo(2, 18); c.lineTo(8, 12); c.lineTo(8, 18); c.fill();
    c.fillStyle = '#1b1b1b'; c.fillRect(1, 15, 14, 1); c.fillRect(11, 2, 1, 7);
  });
  TEX.urkunde = tex(16, 12, (c) => {
    c.fillStyle = '#f2ead2'; c.fillRect(0, 0, 16, 12);
    c.fillStyle = '#b08a2e'; c.fillRect(0, 0, 16, 1); c.fillRect(0, 11, 16, 1); c.fillRect(0, 0, 1, 12); c.fillRect(15, 0, 1, 12);
    c.fillStyle = '#5a5246'; c.fillRect(4, 2, 8, 1);
    c.fillStyle = '#9b927f'; for (let y = 4; y < 9; y += 2) c.fillRect(3, y, 10, 1);
    c.fillStyle = '#a3262a'; c.fillRect(11, 8, 3, 3);
  });
  TEX.calendar = tex(12, 16, (c) => {
    c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, 12, 16);
    c.fillStyle = '#b8322a'; c.fillRect(0, 0, 12, 4);
    c.fillStyle = '#8a857a';
    for (let y = 6; y < 15; y += 2) for (let x = 1; x < 12; x += 2) c.fillRect(x, y, 1, 1);
  });
  TEX.radio = tex(16, 10, (c) => {
    c.fillStyle = '#7a2f1f'; c.fillRect(0, 0, 16, 10);
    c.fillStyle = '#3a3330';
    for (let y = 2; y < 9; y += 2) for (let x = 1; x < 9; x += 2) c.fillRect(x, y, 1, 1);
    c.fillStyle = '#e6dcc0'; c.fillRect(10, 2, 5, 2);
    c.fillStyle = '#c8c2b0'; c.fillRect(11, 6, 2, 2);
  });
  TEX.logo = tex(32, 16, (c) => {
    c.fillStyle = '#1f3557'; c.fillRect(0, 0, 32, 16);
    c.fillStyle = '#f0e6c8';
    // "KB" als Pixelbuchstaben
    const K = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 3], [2, 2], [2, 4], [3, 1], [3, 5], [4, 0], [4, 6]];
    const B = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 0], [2, 0], [3, 1], [3, 2], [1, 3], [2, 3], [3, 4], [3, 5], [1, 6], [2, 6]];
    K.forEach(([x, y]) => c.fillRect(8 + x, 4 + y, 1, 1));
    B.forEach(([x, y]) => c.fillRect(15 + x, 4 + y, 1, 1));
    c.fillStyle = '#c8692b'; c.fillRect(8, 13, 16, 1);
  });
  TEX.clock = tex(16, 16, (c) => {
    c.fillStyle = 'rgba(0,0,0,0)'; c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#2b2a28'; c.beginPath(); c.arc(8, 8, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f4f1e8'; c.beginPath(); c.arc(8, 8, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2b2a28'; c.fillRect(8, 3, 1, 5); c.fillRect(8, 8, 4, 1);
    c.fillStyle = '#b8322a'; c.fillRect(7, 8, 1, 5);
  });
}

function faceTex(skin, hair, glasses) {
  return tex(8, 8, (c) => {
    c.fillStyle = rgb(...skin); c.fillRect(0, 0, 8, 8);
    c.fillStyle = '#' + hair.toString(16).padStart(6, '0'); c.fillRect(0, 0, 8, 1);
    c.fillStyle = '#2a201a'; c.fillRect(2, 3, 1, 1); c.fillRect(5, 3, 1, 1);
    if (glasses) { c.fillStyle = '#3a3a3a'; c.fillRect(1, 3, 3, 1); c.fillRect(4, 3, 3, 1); }
    c.fillStyle = rgb(skin[0] - 40, skin[1] - 50, skin[2] - 50); c.fillRect(3, 6, 2, 1);
  });
}

// ---------------------------------------------------------------- Geometrie-Werkzeuge
const matCache = new Map();
function mat(spec) {
  const key = typeof spec === 'number' ? 'c' + spec : spec.uuid;
  if (!matCache.has(key)) {
    matCache.set(key, typeof spec === 'number'
      ? new THREE.MeshLambertMaterial({ color: spec })
      : new THREE.MeshLambertMaterial({ map: spec }));
  }
  return matCache.get(key);
}
function box(w, h, d, m, x = 0, y = 0, z = 0, parent = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), Array.isArray(m) ? m : (m.isMaterial ? m : mat(m)));
  mesh.position.set(x, y, z);
  if (parent) parent.add(mesh);
  return mesh;
}
function cyl(rt, rb, h, seg, m, x = 0, y = 0, z = 0, parent = null) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m.isMaterial ? m : mat(m));
  mesh.position.set(x, y, z);
  if (parent) parent.add(mesh);
  return mesh;
}
function plane(w, h, m, x, y, z, ry = 0, parent = null) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m.isMaterial ? m : mat(m));
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  if (parent) parent.add(mesh);
  return mesh;
}
const darken = (hex, f) => {
  const c = new THREE.Color(hex); c.multiplyScalar(f); return c.getHex();
};

// ---------------------------------------------------------------- Figuren
const SKINS = [[224, 180, 143], [198, 150, 112], [236, 196, 160], [160, 112, 80]];

function buildHead(headMats, opt, parent, y) {
  const h = new THREE.Group();
  h.position.set(0, y, 0);
  box(0.24, 0.27, 0.24, headMats, 0, 0, 0, h);
  box(0.26, 0.07, 0.26, opt.hair, 0, 0.15, 0, h);
  box(0.26, 0.22, 0.05, opt.hair, 0, 0.03, -0.12, h);
  if (opt.longHair) {
    box(0.29, 0.4, 0.08, opt.hair, 0, -0.1, -0.12, h);
    box(0.04, 0.3, 0.2, opt.hair, -0.135, -0.04, -0.02, h);
    box(0.04, 0.3, 0.2, opt.hair, 0.135, -0.04, -0.02, h);
  }
  parent.add(h);
  return h;
}

function buildPerson(opt, sitting) {
  const g = new THREE.Group();
  const skin = opt.skin || SKINS[0];
  const skinMat = mat(new THREE.Color(rgb(...skin)).getHex());
  const face = new THREE.MeshLambertMaterial({ map: faceTex(skin, opt.hair, opt.glasses) });
  const suit = opt.suit, pants = darken(opt.suit, 0.7);
  const headMats = [skinMat, skinMat, skinMat, skinMat, face, skinMat];
  const anim = { arms: [] };

  if (!sitting) {
    box(0.13, 0.82, 0.15, pants, -0.08, 0.41, 0, g);
    box(0.13, 0.82, 0.15, pants, 0.08, 0.41, 0, g);
    box(0.42, 0.62, 0.24, suit, 0, 1.13, 0, g);
    box(0.12, 0.42, 0.01, opt.shirt, 0, 1.22, 0.121, g);
    if (opt.tie) box(0.05, 0.34, 0.012, opt.tie, 0, 1.2, 0.128, g);
    const la = box(0.1, 0.6, 0.12, suit, -0.27, 1.12, 0, g);
    const ra = box(0.1, 0.6, 0.12, suit, 0.27, 1.12, 0, g);
    anim.arms.push(la, ra);
    anim.head = buildHead(headMats, opt, g, 1.6);
  } else {
    box(0.13, 0.13, 0.45, pants, -0.08, 0.5, 0.2, g);
    box(0.13, 0.13, 0.45, pants, 0.08, 0.5, 0.2, g);
    box(0.12, 0.46, 0.13, pants, -0.08, 0.23, 0.42, g);
    box(0.12, 0.46, 0.13, pants, 0.08, 0.23, 0.42, g);
    box(0.42, 0.58, 0.24, suit, 0, 0.86, 0, g);
    const la = box(0.1, 0.5, 0.12, suit, -0.27, 0.86, 0.12, g);
    const ra = box(0.1, 0.5, 0.12, suit, 0.27, 0.86, 0.12, g);
    la.rotation.x = ra.rotation.x = -1.0;
    anim.arms.push(la, ra);
    anim.head = buildHead(headMats, opt, g, 1.31);
    // Stuhl
    box(0.46, 0.06, 0.46, 0x3b3a36, 0, 0.44, 0.12, g);
    box(0.44, 0.5, 0.06, 0x7d4a2a, 0, 0.8, -0.16, g);
    cyl(0.03, 0.03, 0.4, 6, 0x2c2c2a, 0, 0.22, 0.12, g);
  }
  g.userData.anim = anim;
  return g;
}

// ---------------------------------------------------------------- Möbel
function buildDesk(parent, x, z, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  box(1.6, 0.05, 0.8, TEX.wood, 0, 0.725, 0, g);
  box(0.04, 0.7, 0.76, TEX.steel, -0.76, 0.35, 0, g);
  box(0.04, 0.7, 0.76, TEX.steel, 0.76, 0.35, 0, g);
  box(0.42, 0.66, 0.74, TEX.steel, 0.52, 0.36, 0, g); // Schubladenblock
  box(1.5, 0.42, 0.02, TEX.steel, 0, 0.45, -0.37, g);
  parent.add(g);
  return g;
}

function buildCRT(screenTex) {
  const g = new THREE.Group();
  box(0.3, 0.03, 0.26, TEX.plastic, 0, 0.015, -0.02, g);
  box(0.44, 0.36, 0.4, TEX.plastic, 0, 0.21, 0, g);
  box(0.32, 0.28, 0.2, TEX.plastic, 0, 0.2, -0.27, g);
  plane(0.37, 0.29, 0x2b2a26, 0, 0.215, 0.2005, 0, g);
  const screen = plane(0.33, 0.25, new THREE.MeshBasicMaterial({ map: screenTex }), 0, 0.215, 0.201, 0, g);
  box(0.06, 0.02, 0.01, 0x3d8f55, 0.16, 0.05, 0.201, g); // Betriebs-LED
  return { group: g, screen };
}

// ---------------------------------------------------------------- Office
export class Office {
  constructor(container) {
    this.container = container;
    this.mode = 'title';
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.clickables = [];
    this.upgradeObjs = {};
    this.animated = [];
    this.arrive = null;
    this.clock = new THREE.Clock();
    this.hover = false;
    this.screenInfo = null;
    this.onMonitorClick = () => {};
  }

  init() {
    buildTextures();
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
    r.setPixelRatio(1);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.className = 'scene-canvas';
    this.container.appendChild(r.domElement);

    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfc8b6);
    scene.fog = new THREE.Fog(0xcfc8b6, 7, 15);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.03, 40);
    this.deskPos = new THREE.Vector3(0, 1.2, 0.64);

    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x6a5e4c, 2.2));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
    sun.position.set(-3, 5, -8);
    scene.add(sun);

    this.buildRoom();
    this.buildPlayerDesk();
    this.buildColleagues();

    this.camera.position.set(0.9, 1.6, 1.8);
    this.camera.lookAt(0, 0.9, -0.3);

    window.addEventListener('resize', () => this.resize());
    this.resize();

    const el = r.domElement;
    window.addEventListener('mousemove', (e) => {
      if (this.touching) return; // von Touch erzeugte Mausereignisse ignorieren
      this.look.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.look.ty = (e.clientY / window.innerHeight) * 2 - 1;
      this.updateHover(e);
    });
    // Touch: Wischen zum Umsehen, Tippen auf den Monitor öffnet den PC (normaler click)
    let drag = null;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      drag = { x: t.clientX, y: t.clientY, lx: this.look.tx, ly: this.look.ty };
      this.touching = true;
    }, { passive: true });
    el.addEventListener('touchmove', (e) => {
      if (!drag) return;
      const t = e.touches[0];
      this.look.tx = clamp(drag.lx - ((t.clientX - drag.x) / window.innerWidth) * 2.5);
      this.look.ty = clamp(drag.ly - ((t.clientY - drag.y) / window.innerHeight) * 2.5);
    }, { passive: true });
    el.addEventListener('touchend', () => { drag = null; setTimeout(() => { this.touching = false; }, 400); });
    el.addEventListener('click', (e) => {
      if (this.mode !== 'desk') return;
      if (this.pickMonitor(e)) this.onMonitorClick();
    });
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(Math.ceil(w / PIXEL), Math.ceil(h / PIXEL), false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // -------------------------------------------------- Raum
  buildRoom() {
    const s = this.scene;
    const floor = this.floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat(TEX.carpet));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -2.5);
    s.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat(TEX.ceiling));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 2.9, -2.5);
    s.add(ceil);

    // Rückwand mit Fensterband
    box(10, 0.9, 0.1, TEX.wall, 0, 0.45, -7.5, s);
    box(10, 0.5, 0.1, TEX.wall, 0, 2.65, -7.5, s);
    plane(10, 1.5, new THREE.MeshBasicMaterial({ map: TEX.sky, fog: false }), 0, 1.65, -7.6, 0, s);
    for (let x = -5; x <= 5; x += 1.25) box(0.08, 1.5, 0.14, 0xd8d4c8, x, 1.65, -7.5, s);
    box(10, 0.06, 0.3, 0xd8d4c8, 0, 0.92, -7.4, s);
    // Seitenwände
    this.leftWall = [box(0.1, 2.9, 10, TEX.wall, -5, 1.45, -2.5, s)];
    box(0.1, 2.9, 10, TEX.wall, 5, 1.45, -2.5, s);
    box(10, 2.9, 0.1, TEX.wall, 0, 1.45, 2.5, s);
    this.leftWall.push(box(0.06, 0.12, 10, 0x6b5a45, -4.94, 0.06, -2.5, s)); // Fußleisten
    box(0.06, 0.12, 10, 0x6b5a45, 4.94, 0.06, -2.5, s);
    // Logo, Uhr, Tür
    plane(1.2, 0.6, TEX.logo, 4.94, 1.9, -2.8, -Math.PI / 2, s);
    const clockMat = new THREE.MeshLambertMaterial({ map: TEX.clock, transparent: true });
    this.leftWall.push(plane(0.4, 0.4, clockMat, -4.94, 2.1, -1.6, Math.PI / 2, s));
    box(0.06, 2.1, 1.0, 0x8a5a34, 4.95, 1.05, -0.8, s);
    box(0.08, 0.05, 0.12, 0xc8b273, 4.9, 1.0, -0.45, s);
    // Leuchtstoffröhren
    const glow = new THREE.MeshBasicMaterial({ color: 0xfffbea });
    for (let x = -3; x <= 3; x += 2) for (let z = -6; z <= 1; z += 1.8) box(1.2, 0.03, 0.26, glow, x, 2.88, z, s);
    // Pflanze und Aktenschränke in der Ferne
    this.leftWall.push(box(0.9, 1.3, 0.45, TEX.steel, -4.4, 0.65, -6.6, s));
    this.leftWall.push(box(0.9, 1.3, 0.45, TEX.steel, -3.4, 0.65, -6.6, s));
    box(0.9, 1.3, 0.45, TEX.steel, 4.2, 0.65, -6.6, s);
  }

  // -------------------------------------------------- Eigener Platz
  buildPlayerDesk() {
    const s = this.scene;
    buildDesk(s, 0, -0.15);

    // Stellwände (Großraumbüro)
    this.frontPartition = [
      box(1.92, 1.05, 0.04, TEX.fabric, 0, 0.525, -0.66, s),
      box(1.94, 0.03, 0.06, 0x8f8a7c, 0, 1.06, -0.66, s),
    ];
    this.leftPartition = [
      box(0.04, 1.45, 1.05, TEX.fabric, -0.97, 0.725, -0.14, s),
      box(0.06, 0.03, 1.07, 0x8f8a7c, -0.97, 1.46, -0.14, s),
    ];
    this.frontPartition.push(plane(0.16, 0.21, TEX.calendar, -0.62, 0.9, -0.637, 0, s));

    // Bildschirm 1
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 160; this.screenCanvas.height = 120;
    this.screenTex = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTex.magFilter = this.screenTex.minFilter = THREE.NearestFilter;
    this.screenTex.generateMipmaps = false;
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    const m1 = buildCRT(this.screenTex);
    m1.group.position.set(0, 0.75, -0.27);
    s.add(m1.group);
    this.monitor1 = m1;
    this.clickables.push(...m1.group.children);

    // Bildschirm 2 (Upgrade)
    this.screen2Canvas = document.createElement('canvas');
    this.screen2Canvas.width = 160; this.screen2Canvas.height = 120;
    this.screen2Tex = new THREE.CanvasTexture(this.screen2Canvas);
    this.screen2Tex.magFilter = this.screen2Tex.minFilter = THREE.NearestFilter;
    this.screen2Tex.generateMipmaps = false;
    this.screen2Tex.colorSpace = THREE.SRGBColorSpace;
    const m2 = buildCRT(this.screen2Tex);
    m2.group.position.set(0.56, 0.75, -0.2);
    m2.group.rotation.y = -0.5;
    m2.group.scale.setScalar(0.9);
    s.add(m2.group);
    this.monitor2 = m2;
    this.upgradeObjs.monitor2 = m2.group;

    // Tastatur
    const kb = this.keyboard = box(0.46, 0.03, 0.17, [mat(TEX.plastic), mat(TEX.plastic), mat(TEX.keyboard), mat(TEX.plastic), mat(TEX.plastic), mat(TEX.plastic)], 0, 0.765, 0.12, s);
    kb.rotation.x = 0.06;
    // Telefon mit Wählscheibe
    const phone = new THREE.Group();
    phone.position.set(-0.6, 0.75, 0.02);
    phone.rotation.y = 0.35;
    const rotary = new THREE.Group();
    box(0.2, 0.08, 0.22, 0xd0662a, 0, 0.04, 0, rotary);
    const dial = cyl(0.055, 0.055, 0.012, 10, 0xece4cf, 0, 0.085, 0.05, rotary);
    dial.rotation.x = -0.5;
    const push = new THREE.Group();
    box(0.2, 0.07, 0.22, 0xd9d3c0, 0, 0.035, 0, push);
    const pad = box(0.1, 0.01, 0.1, [mat(0x8a8576), mat(0x8a8576), mat(TEX.keypad), mat(0x8a8576), mat(0x8a8576), mat(0x8a8576)], 0, 0.072, 0.05, push);
    pad.rotation.x = -0.25;
    phone.add(rotary, push);
    this.handset = box(0.24, 0.05, 0.07, 0xc05a22, 0, 0.11, -0.04, phone);
    this.phoneParts = { rotary, push, phone };
    s.add(phone);
    this.phone = phone;
    // Papierstapel und Becher
    this.paperStack = new THREE.Group();
    for (let i = 0; i < 5; i++) box(0.21, 0.008, 0.29, i % 2 ? 0xf2efe4 : 0xe8e3d2, -0.36 + (i % 2) * 0.01, 0.754 + i * 0.008, 0.2 + (i % 3) * 0.006, this.paperStack);
    s.add(this.paperStack);
    cyl(0.035, 0.032, 0.09, 7, 0xf4f1e8, 0.3, 0.795, -0.0, s);
    cyl(0.03, 0.03, 0.005, 7, 0x3a2416, 0.3, 0.838, 0.0, s);

    // Upgrades
    const U = this.upgradeObjs;

    const calc = new THREE.Group();
    calc.position.set(0.42, 0.757, 0.16);
    calc.rotation.y = -0.25;
    box(0.09, 0.014, 0.13, [mat(0x2b2a28), mat(0x2b2a28), mat(TEX.calc), mat(0x2b2a28), mat(0x2b2a28), mat(0x2b2a28)], 0, 0, 0, calc);
    s.add(calc); U.calc = calc;

    const lamp = new THREE.Group();
    lamp.position.set(-0.68, 0.75, -0.32);
    cyl(0.07, 0.08, 0.025, 8, 0x2f5a3c, 0, 0.012, 0, lamp);
    const arm1 = box(0.02, 0.36, 0.02, 0x2f5a3c, 0, 0.19, 0.03, lamp); arm1.rotation.x = 0.25;
    const arm2 = box(0.02, 0.3, 0.02, 0x2f5a3c, 0.06, 0.38, 0.14, lamp); arm2.rotation.z = -1.0; arm2.rotation.y = 0.6;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 7, 1, true), new THREE.MeshLambertMaterial({ color: 0x2f5a3c, side: THREE.DoubleSide }));
    shade.position.set(0.17, 0.4, 0.2); shade.rotation.z = 0.5;
    lamp.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }));
    bulb.position.set(0.19, 0.36, 0.2); lamp.add(bulb);
    const lampLight = new THREE.PointLight(0xffc77a, 1.4, 1.6, 1.5);
    lampLight.position.set(0.2, 0.32, 0.22);
    lamp.add(lampLight);
    s.add(lamp); U.lamp = lamp;

    const radio = new THREE.Group();
    radio.position.set(-0.42, 0.75, -0.44);
    radio.rotation.y = 0.15;
    box(0.27, 0.15, 0.08, [mat(0x7a2f1f), mat(0x7a2f1f), mat(0x7a2f1f), mat(0x7a2f1f), mat(TEX.radio), mat(0x7a2f1f)], 0, 0.075, 0, radio);
    box(0.2, 0.015, 0.015, 0x2c2c2a, 0, 0.18, 0, radio);
    box(0.015, 0.03, 0.015, 0x2c2c2a, -0.09, 0.163, 0, radio);
    box(0.015, 0.03, 0.015, 0x2c2c2a, 0.09, 0.163, 0, radio);
    s.add(radio); U.radio = radio;

    const plant = new THREE.Group();
    plant.position.set(1.08, 0, -0.5);
    cyl(0.15, 0.11, 0.3, 8, 0xa5552e, 0, 0.15, 0, plant);
    cyl(0.14, 0.14, 0.02, 8, 0x3b2a1c, 0, 0.3, 0, plant);
    cyl(0.015, 0.02, 0.9, 5, 0x4b3a22, 0, 0.75, 0, plant);
    const leafMat = mat(0x2f6b34), leafMat2 = mat(0x3f8a42);
    for (let i = 0; i < 9; i++) {
      const leaf = box(0.09, 0.02, 0.22, i % 2 ? leafMat : leafMat2, 0, 0, 0, plant);
      const a = i * 2.4;
      leaf.position.set(Math.cos(a) * 0.1, 0.55 + i * 0.07, Math.sin(a) * 0.1);
      leaf.rotation.y = -a + Math.PI / 2;
      leaf.rotation.x = 0.5;
    }
    s.add(plant); U.plant = plant;

    // Beistellschrank mit Kaffeemaschine
    box(0.5, 0.72, 0.5, TEX.steel, 1.12, 0.36, 0.05, s);
    const coffee = new THREE.Group();
    coffee.position.set(1.12, 0.72, 0.05);
    coffee.rotation.y = -0.6;
    box(0.2, 0.04, 0.2, 0x2b2a28, 0, 0.02, 0, coffee);
    box(0.2, 0.3, 0.07, 0xd0662a, 0, 0.17, -0.07, coffee);
    box(0.2, 0.06, 0.2, 0xd0662a, 0, 0.33, 0, coffee);
    cyl(0.06, 0.055, 0.12, 8, 0x4a2c18, 0, 0.1, 0.03, coffee);
    s.add(coffee); U.coffee = coffee;

    const picture = new THREE.Group();
    picture.position.set(-0.945, 1.08, -0.35);
    picture.rotation.y = Math.PI / 2;
    box(0.32, 0.4, 0.015, 0x2b2a28, 0, 0, -0.006, picture);
    plane(0.28, 0.36, TEX.bauhaus, 0, 0, 0.003, 0, picture);
    s.add(picture); U.picture = picture;

    const urk = new THREE.Group();
    urk.position.set(-0.945, 1.1, 0.06);
    urk.rotation.y = Math.PI / 2;
    box(0.3, 0.23, 0.015, 0xb08a2e, 0, 0, -0.006, urk);
    plane(0.27, 0.2, TEX.urkunde, 0, 0, 0.003, 0, urk);
    s.add(urk); U.urkunde = urk;

    // ---------- ab Sachbearbeiter
    const tw = new THREE.Group();
    tw.position.set(-0.36, 0.75, 0.17);
    tw.rotation.y = 0.22;
    box(0.36, 0.08, 0.28, 0x4b5d73, 0, 0.04, 0, tw);
    box(0.3, 0.02, 0.12, [mat(0x4b5d73), mat(0x4b5d73), mat(TEX.typekeys), mat(0x4b5d73), mat(0x4b5d73), mat(0x4b5d73)], 0, 0.085, 0.06, tw);
    const roller = cyl(0.025, 0.025, 0.34, 8, 0x1f1f1f, 0, 0.11, -0.08, tw);
    roller.rotation.z = Math.PI / 2;
    const sheet = plane(0.21, 0.16, 0xf6f3ea, 0, 0.19, -0.1, 0, tw);
    sheet.rotation.x = -0.25;
    s.add(tw); U.schreibmaschine = tw;

    const rdx = new THREE.Group();
    rdx.position.set(0.66, 0.75, 0.08);
    rdx.rotation.y = -0.4;
    box(0.16, 0.02, 0.1, 0x2b2a28, 0, 0.01, 0, rdx);
    box(0.012, 0.1, 0.012, 0x8a8576, -0.07, 0.06, 0, rdx);
    box(0.012, 0.1, 0.012, 0x8a8576, 0.07, 0.06, 0, rdx);
    const cards = cyl(0.05, 0.05, 0.12, 10, TEX.cards, 0, 0.1, 0, rdx);
    cards.rotation.z = Math.PI / 2;
    s.add(rdx); U.rolodex = rdx;

    // rechte Stellwand: ab dem Fensterplatz hängen Bild und Urkunde hier
    this.rightPartition = new THREE.Group();
    box(0.04, 1.45, 1.0, TEX.fabric, 1.42, 0.725, -0.12, this.rightPartition);
    box(0.06, 0.03, 1.02, 0x8f8a7c, 1.42, 1.46, -0.12, this.rightPartition);
    s.add(this.rightPartition);
    this.wallSpots = {
      left: { picture: [-0.945, 1.08, -0.35, Math.PI / 2], urkunde: [-0.945, 1.1, 0.06, Math.PI / 2] },
      right: { picture: [1.395, 1.12, -0.42, -Math.PI / 2], urkunde: [1.395, 1.14, 0.1, -Math.PI / 2] },
    };

    // Fensterfront links (Platz am Fenster)
    const win = new THREE.Group();
    box(0.1, 0.95, 10, TEX.wall, -1.1, 0.475, -2.5, win);
    box(0.1, 0.35, 10, TEX.wall, -1.1, 2.725, -2.5, win);
    box(0.24, 0.035, 10, 0xd8d4c8, -1.0, 0.965, -2.5, win);
    for (let z = 2.5; z >= -7.5; z -= 1.25) box(0.12, 1.6, 0.07, 0xd8d4c8, -1.1, 1.75, z, win);
    box(0.06, 0.08, 10, 0xd8d4c8, -1.1, 2.52, -2.5, win);
    box(0.08, 0.42, 1.1, 0xe6e1d2, -1.0, 0.45, -0.15, win); // Heizkörper
    for (let z = -0.65; z <= 0.35; z += 0.08) box(0.09, 0.4, 0.015, 0xd2ccbc, -0.995, 0.45, z, win);
    const outside = plane(14, 4.2, new THREE.MeshBasicMaterial({ map: TEX.skyWide, fog: false }), -4.9, 1.2, -2.5, Math.PI / 2, win);
    outside.renderOrder = -1;
    win.visible = false;
    s.add(win);
    this.windowWall = win;

    const kaktus = new THREE.Group();
    kaktus.position.set(-1.0, 0.985, -0.48);
    cyl(0.045, 0.035, 0.07, 7, 0xa5552e, 0, 0.035, 0, kaktus);
    cyl(0.028, 0.03, 0.14, 6, 0x4a7a3a, 0, 0.14, 0, kaktus);
    const arm = cyl(0.014, 0.014, 0.06, 5, 0x4a7a3a, 0.035, 0.15, 0, kaktus);
    arm.rotation.z = 0.9;
    s.add(kaktus); U.kaktus = kaktus;

    const pokal = new THREE.Group();
    pokal.position.set(-1.0, 0.985, -0.08);
    box(0.08, 0.04, 0.08, 0x2b2a28, 0, 0.02, 0, pokal);
    cyl(0.012, 0.012, 0.07, 6, 0xc9a646, 0, 0.075, 0, pokal);
    cyl(0.05, 0.02, 0.08, 8, 0xd8b44e, 0, 0.15, 0, pokal);
    s.add(pokal); U.pokal = pokal;

    // Belohnungen aus Nebenzielen auf dem Beistellschrank
    const card = new THREE.Group();
    card.position.set(1.27, 0.72, -0.12);
    card.rotation.y = -0.9;
    box(0.2, 0.14, 0.015, 0x2b2a28, 0, 0.09, 0, card);
    plane(0.17, 0.11, TEX.goldcard, 0, 0.09, 0.009, 0, card);
    box(0.02, 0.1, 0.06, 0x2b2a28, 0, 0.05, -0.03, card);
    s.add(card); U.lochkarte = card;
    const hc = new THREE.Group();
    hc.position.set(0.98, 0.72, 0.24);
    hc.rotation.y = -0.5;
    box(0.16, 0.03, 0.09, 0xd8cfb4, 0, 0.015, 0, hc);
    box(0.13, 0.008, 0.05, [mat(0xd8cfb4), mat(0xd8cfb4), mat(TEX.keyboard), mat(0xd8cfb4), mat(0xd8cfb4), mat(0xd8cfb4)], 0, 0.034, 0.015, hc);
    box(0.08, 0.06, 0.06, 0xd8cfb4, 0, 0.06, -0.03, hc);
    plane(0.06, 0.04, 0x2a4a3a, 0, 0.06, 0.0005, 0, hc);
    s.add(hc); U.hc1modell = hc;
    const globe = new THREE.Group();
    globe.position.set(1.3, 0.72, 0.26);
    cyl(0.05, 0.06, 0.02, 8, 0x5a3a22, 0, 0.01, 0, globe);
    box(0.012, 0.12, 0.012, 0xb08a2e, 0, 0.07, 0, globe);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat(TEX.globe));
    ball.position.set(0, 0.15, 0);
    ball.rotation.z = 0.4;
    globe.add(ball);
    s.add(globe); U.globus = globe;

    Object.values(U).forEach((o) => { o.visible = false; });

    // Besucher-Anker hinter der vorderen Stellwand
    this.visitorAnchor = new THREE.Vector3(-0.32, 0, -1.0);
    this.visitor = null;
  }

  buildColleagues() {
    this.floorGroup = new THREE.Group();
    this.scene.add(this.floorGroup);
    const s = this.floorGroup;
    const people = [
      { suit: 0x6b6f4a, shirt: 0xe4ddc8, hair: 0x3a2a1a, tie: 0x7a4a1f },
      { suit: 0x8a5a7a, shirt: 0xe4ddc8, hair: 0x9a6a3a, longHair: true, skin: SKINS[2] },
      { suit: 0x4a5a7a, shirt: 0xd9e0e6, hair: 0x1f1a16, tie: 0x2a3a5a, skin: SKINS[1] },
      { suit: 0x7a6a4a, shirt: 0xe8e2cf, hair: 0xb8b4aa, tie: 0x5a2a1a },
      { suit: 0x3f5a4a, shirt: 0xe4ddc8, hair: 0x2b1d14, longHair: true, skin: SKINS[3] },
    ];
    const spots = [[-1.9, -2.3], [0, -2.3], [1.9, -2.3], [-1.9, -4.2], [1.9, -4.2], [0, -4.2], [0, -6.2], [1.9, -6.2]];
    this.leftSpots = [];
    this.staticPeople = [];
    spots.forEach(([x, z], i) => {
      const s = new THREE.Group();
      this.floorGroup.add(s);
      if (x < 0 && z > -5) this.leftSpots.push(s);
      buildDesk(s, x, z);
      const tx = new THREE.CanvasTexture(document.createElement('canvas'));
      const crt = buildCRT(tx);
      crt.group.position.set(x, 0.75, z - 0.1);
      crt.group.rotation.y = Math.PI; // Bildschirm zeigt zum Kollegen
      s.add(crt.group);
      box(1.92, 1.05, 0.04, TEX.fabric, x, 0.525, z - 0.5, s);
      if (i < people.length) {
        const p = buildPerson(people[i], true);
        p.position.set(x, 0, z + 0.25);
        p.rotation.y = Math.PI; // Rücken zu uns
        s.add(p);
        this.animated.push({ obj: p, phase: i * 1.7 });
        this.staticPeople.push(p);
      }
    });
    // Petra am Seitentisch, im Profil sichtbar
    buildDesk(s, 3.5, -1.2, Math.PI / 2);
    const pc = buildCRT(new THREE.CanvasTexture(document.createElement('canvas')));
    pc.group.position.set(3.6, 0.75, -1.2);
    pc.group.rotation.y = -Math.PI / 2;
    s.add(pc.group);
    const petra = buildPerson({ ...PEOPLE.petra }, true);
    petra.position.set(2.95, 0, -1.2);
    petra.rotation.y = Math.PI / 2; // schaut zu ihrem Tisch (+x)
    s.add(petra);
    this.animated.push({ obj: petra, phase: 0.4 });
    this.staticPeople.push(petra);
    // Sitzplätze für das eigene Team ab Kapitel 3
    this.teamSeats = [
      { x: 0, z: -2.05, ry: Math.PI }, { x: 1.9, z: -2.05, ry: Math.PI },
      { x: 0, z: -3.95, ry: Math.PI }, { x: 1.9, z: -3.95, ry: Math.PI },
      { x: 2.95, z: -1.2, ry: Math.PI / 2, petra: true },
      { x: 0, z: -5.95, ry: Math.PI }, { x: 1.9, z: -5.95, ry: Math.PI },
      { x: 2.95, z: -3.2, ry: Math.PI / 2 },
    ];
    buildDesk(this.floorGroup, 3.5, -3.2, Math.PI / 2);
    const pc3 = buildCRT(new THREE.CanvasTexture(document.createElement('canvas')));
    pc3.group.position.set(3.6, 0.75, -3.2);
    pc3.group.rotation.y = -Math.PI / 2;
    this.floorGroup.add(pc3.group);
    this.buildEra3();
    this.buildEra2();
    this.buildOffice();
    this.buildLounge();
    this.teamPeople = [];
    this.buildGlassWall();
  }

  // Glaswand des Eckabteils (ab Teamleiter); links bleibt eine Türöffnung für Besucher
  buildGlassWall() {
    const g = new THREE.Group();
    const glass = new THREE.MeshLambertMaterial({ color: 0xbcd8e0, transparent: true, opacity: 0.22, depthWrite: false });
    const frame = 0x6f6b60;
    plane(1.25, 1.3, glass, 0.825, 1.72, -0.655, 0, g);
    box(0.05, 2.3, 0.06, frame, 0.2, 1.15, -0.66, g);
    box(0.05, 2.3, 0.06, frame, 1.45, 1.15, -0.66, g);
    box(2.55, 0.06, 0.06, frame, 0.2, 2.37, -0.66, g);
    box(1.25, 0.04, 0.06, frame, 0.825, 1.07, -0.66, g);
    const sign = tex(72, 12, (c) => {
      c.fillStyle = '#1f3557'; c.fillRect(0, 0, 72, 12);
      c.fillStyle = '#f0e6c8'; c.font = '8px monospace'; c.textBaseline = 'middle'; c.textAlign = 'center';
      c.fillText('HEIMCOMPUTER', 36, 6.5);
    });
    plane(0.48, 0.08, sign, 0.825, 2.28, -0.625, 0, g);
    g.visible = false;
    this.scene.add(g);
    this.glassWall = g;
  }

  // Epoche 1987: PC-Gehäuse unter dem Monitor, graue Tastatur, Fax
  buildEra2() {
    const s = this.scene;
    const unit = new THREE.Group();
    unit.position.set(0, 0.75, -0.27);
    box(0.48, 0.11, 0.42, [mat(TEX.plastic), mat(TEX.plastic), mat(TEX.plastic), mat(TEX.plastic), mat(TEX.pcfront), mat(TEX.plastic)], 0, 0.055, 0, unit);
    s.add(unit);
    const fax = new THREE.Group();
    fax.position.set(-1.0, 0.985, 0.32);
    fax.rotation.y = Math.PI / 2;
    box(0.3, 0.09, 0.22, 0xd9d4c4, 0, 0.045, 0, fax);
    box(0.12, 0.012, 0.08, [mat(0x8a8576), mat(0x8a8576), mat(TEX.keypad), mat(0x8a8576), mat(0x8a8576), mat(0x8a8576)], 0.07, 0.095, 0.04, fax);
    const paper = plane(0.16, 0.1, 0xf6f3ea, -0.05, 0.13, -0.08, 0, fax);
    paper.rotation.x = -0.4;
    s.add(fax);
    this.era2Objs = [unit, fax];
    this.era2Objs.forEach((o) => { o.visible = false; });
    this.era = 1;
  }

  activeMonitors() { return this.era >= 3 ? [this.flat1, this.flat2] : [this.monitor1, this.monitor2]; }
  applyMonitors() {
    const flat = this.era >= 3;
    this.monitor1.group.visible = !flat;
    this.monitor2.group.visible = !flat && this.hasMonitor2;
    this.flat1.group.visible = flat;
    this.flat2.group.visible = flat && this.hasMonitor2;
    const [m1, m2] = this.activeMonitors();
    this.clickables = [...m1.group.children, ...(this.hasMonitor2 ? m2.group.children : [])];
  }

  // Epoche 2000: Flachbildschirme, Handy, Rechner unter dem Tisch
  buildEra3() {
    const flat = (texture) => {
      const g = new THREE.Group();
      box(0.2, 0.015, 0.16, 0x2a2c30, 0, 0.008, 0, g);
      box(0.04, 0.2, 0.03, 0x2a2c30, 0, 0.11, -0.03, g);
      box(0.5, 0.36, 0.035, 0x30333a, 0, 0.36, 0, g);
      const screen = plane(0.45, 0.31, new THREE.MeshBasicMaterial({ map: texture }), 0, 0.36, 0.0185, 0, g);
      box(0.05, 0.012, 0.005, 0x3d8fd5, 0.19, 0.195, 0.019, g);
      return { group: g, screen };
    };
    this.flat1 = flat(this.screenTex);
    this.flat1.group.position.set(0, 0.75, -0.25);
    this.flat2 = flat(this.screen2Tex);
    this.flat2.group.position.set(0.58, 0.75, -0.2);
    this.flat2.group.rotation.y = -0.45;
    this.scene.add(this.flat1.group, this.flat2.group);
    this.flat1.group.visible = this.flat2.group.visible = false;
    const handy = new THREE.Group();
    handy.position.set(0.32, 0.752, 0.24);
    handy.rotation.y = -0.4;
    box(0.05, 0.02, 0.11, [mat(0x2a2c30), mat(0x2a2c30), mat(TEX.handy), mat(0x2a2c30), mat(0x2a2c30), mat(0x2a2c30)], 0, 0.01, 0, handy);
    box(0.008, 0.03, 0.008, 0x2a2c30, 0.015, 0.03, -0.05, handy);
    this.scene.add(handy);
    this.era3Objs = [handy];
    handy.visible = false;
    const phone = new THREE.Group();
    phone.position.set(0.34, 0.752, 0.22);
    phone.rotation.y = -0.3;
    box(0.065, 0.01, 0.125, [mat(0x0d0e10), mat(0x0d0e10), mat(TEX.smartphone), mat(0x0d0e10), mat(0x0d0e10), mat(0x0d0e10)], 0, 0.005, 0, phone);
    phone.visible = false;
    this.scene.add(phone);
    this.era4Objs = [phone];
    // Vorstandsetage: Vorzimmer mit Sekretärin statt Großraum
    const vz = new THREE.Group();
    buildDesk(vz, 0.4, -2.7, Math.PI);
    const vf = flat(new THREE.CanvasTexture(document.createElement('canvas')));
    vf.group.position.set(0.4, 0.75, -2.55);
    vf.group.rotation.y = Math.PI;
    vz.add(vf.group);
    const sommer = buildPerson({ suit: 0x4a3a5a, shirt: 0xe8e0d0, hair: 0x6a4a2a, longHair: true, skin: SKINS[2] }, true);
    sommer.position.set(0.4, 0, -2.95);
    vz.add(sommer);
    this.animated.push({ obj: sommer, phase: 2.2 });
    const plantPot = (x, z) => {
      cyl(0.2, 0.15, 0.45, 8, 0xd8d4c8, x, 0.225, z, vz);
      for (let i = 0; i < 7; i++) { const leaf = box(0.12, 0.02, 0.35, mat(i % 2 ? 0x2f6b34 : 0x3f8a42), x, 0.7 + i * 0.09, z, vz); leaf.rotation.y = i * 2.2; leaf.rotation.x = 0.6; }
    };
    plantPot(-0.6, -3.2);
    plantPot(2.2, -4.5);
    vz.visible = false;
    this.scene.add(vz);
    this.vorzimmer = vz;
  }

  setEra(era) {
    this.era = era;
    const two = era >= 2;
    this.era2Objs.forEach((o) => { o.visible = two && era < 3 || o === this.era2Objs[1] && two; });
    this.era3Objs.forEach((o) => { o.visible = era === 3; });
    this.era4Objs.forEach((o) => { o.visible = era >= 4; });
    const wide = era >= 4 ? 1.25 : 1;
    this.flat1.group.scale.set(wide, 1, 1);
    this.flat2.group.scale.set(wide, 1, 1);
    this.flat2.group.position.x = era >= 4 ? 0.66 : 0.58;
    this.applyMonitors();
    this.monitor1.group.position.y = two ? 0.86 : 0.75;
    const mats = this.keyboard.material;
    mats[2] = mat(two ? TEX.keyboard2 : TEX.keyboard);
    [0, 1, 3, 4, 5].forEach((k) => { mats[k] = mat(two ? 0xb9b6ac : TEX.plastic); });
  }

  // eigenes Büro (ab Abteilungsleiter): Glasfront mit Tür, Teppich
  buildOffice() {
    const g = new THREE.Group();
    const glass = new THREE.MeshLambertMaterial({ color: 0xbcd8e0, transparent: true, opacity: 0.22, depthWrite: false });
    const frame = 0x6f6b60, wood = 0x7a4a2a;
    box(1.25, 0.9, 0.05, wood, 0.825, 0.45, -0.66, g);
    box(0.45, 0.9, 0.05, wood, -0.825, 0.45, -0.66, g);
    plane(1.25, 1.47, glass, 0.825, 1.635, -0.655, 0, g);
    plane(0.45, 1.47, glass, -0.825, 1.635, -0.655, 0, g);
    for (const x of [-1.05, -0.6, 0.2, 1.45]) box(0.05, 2.4, 0.07, frame, x, 1.2, -0.66, g);
    box(2.55, 0.06, 0.07, frame, 0.2, 2.37, -0.66, g);
    box(0.8, 0.22, 0.07, frame, -0.2, 2.26, -0.66, g);
    const hinge = new THREE.Group();
    hinge.position.set(-0.575, 0, -0.66);
    // Glastür mit Holzrahmen, damit das Team sichtbar bleibt
    box(0.06, 2.1, 0.045, wood, 0.03, 1.05, 0, hinge);
    box(0.06, 2.1, 0.045, wood, 0.72, 1.05, 0, hinge);
    box(0.75, 0.08, 0.045, wood, 0.375, 2.06, 0, hinge);
    box(0.75, 0.5, 0.045, wood, 0.375, 0.25, 0, hinge);
    plane(0.63, 1.48, glass, 0.375, 1.26, 0.002, 0, hinge);
    box(0.03, 0.03, 0.08, 0xc8b273, 0.66, 1.0, 0, hinge);
    g.add(hinge);
    this.door = hinge;
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), mat(TEX.rug));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.1, 0.004, -0.05);
    g.add(rug);
    g.visible = false;
    this.scene.add(g);
    this.officeFront = g;
  }

  // größeres Büro ab Bereichsleiter: Glasfront bis x=3, Seitenwand, Sitzecke, Flipchart
  buildLounge() {
    const g = new THREE.Group();
    const glass = new THREE.MeshLambertMaterial({ color: 0xbcd8e0, transparent: true, opacity: 0.22, depthWrite: false });
    const frame = 0x6f6b60, wood = 0x7a4a2a;
    box(1.55, 0.9, 0.05, wood, 2.225, 0.45, -0.66, g);
    plane(1.55, 1.47, glass, 2.225, 1.635, -0.655, 0, g);
    box(0.05, 2.4, 0.07, frame, 3.0, 1.2, -0.66, g);
    box(1.6, 0.06, 0.07, frame, 2.22, 2.37, -0.66, g);
    this.loungeWall = box(0.08, 2.9, 3.2, TEX.wall, 3.04, 1.45, 0.92, g);
    // Eckbüro des CEO: Fenster mit Blick auf die Skyline
    const corner = new THREE.Group();
    box(0.08, 2.9, 2.2, TEX.wall, 3.04, 1.45, 1.42, corner);
    box(0.08, 0.9, 1.0, TEX.wall, 3.04, 0.45, -0.18, corner);
    box(0.08, 0.35, 1.0, TEX.wall, 3.04, 2.73, -0.18, corner);
    for (const z of [-0.66, -0.18, 0.3]) box(0.1, 1.65, 0.06, 0xd8d4c8, 3.04, 1.73, z, corner);
    plane(9, 5, new THREE.MeshBasicMaterial({ map: TEX.skyWide, fog: false }), 7.5, 1.6, -0.5, -Math.PI / 2, corner);
    corner.visible = false;
    g.add(corner);
    this.cornerWindow = corner;
    // Sofa
    const sofa = new THREE.Group();
    sofa.position.set(2.62, 0, 0.15);
    box(0.7, 0.36, 1.5, TEX.leather, 0, 0.24, 0, sofa);
    box(0.18, 0.5, 1.5, TEX.leather, 0.26, 0.62, 0, sofa);
    box(0.7, 0.55, 0.16, TEX.leather, 0, 0.36, -0.75, sofa);
    box(0.7, 0.55, 0.16, TEX.leather, 0, 0.36, 0.75, sofa);
    g.add(sofa);
    // Couchtisch mit Glasplatte
    box(0.5, 0.02, 0.9, new THREE.MeshLambertMaterial({ color: 0x9fc4cc, transparent: true, opacity: 0.55 }), 1.95, 0.42, 0.15, g);
    for (const [dx, dz] of [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.4], [0.2, 0.4]]) box(0.03, 0.41, 0.03, 0x2b2a28, 1.95 + dx, 0.205, 0.15 + dz, g);
    cyl(0.04, 0.035, 0.08, 7, 0xf4f1e8, 1.9, 0.47, 0.0, g);
    // Flipchart
    const flip = new THREE.Group();
    flip.position.set(2.45, 0, -0.42);
    flip.rotation.y = -0.6;
    box(0.03, 1.7, 0.03, 0x8a8576, -0.3, 0.85, 0.05, flip);
    box(0.03, 1.7, 0.03, 0x8a8576, 0.3, 0.85, 0.05, flip);
    box(0.66, 0.86, 0.02, 0xd9d6cc, 0, 1.25, 0.06, flip);
    plane(0.6, 0.8, TEX.flip, 0, 1.25, 0.072, 0, flip);
    g.add(flip);
    g.visible = false;
    this.scene.add(g);
    this.lounge = g;
    this.wallSpots.lounge = { picture: [3.0, 1.55, 0.55, -Math.PI / 2], urkunde: [3.0, 1.55, 1.05, -Math.PI / 2] };
  }

  setTeam(stage, members) {
    const own = stage >= 2;
    const board = stage >= 5;
    this.staticPeople.forEach((p) => { p.visible = !own; });
    this.teamPeople.forEach((p) => this.scene.remove(p));
    this.animated = this.animated.filter((a) => !a.obj.userData.team);
    this.teamPeople = [];
    // Vorstandsetage: kein Großraum mehr vor der Tür
    this.floorGroup.visible = !board;
    this.vorzimmer.visible = board;
    this.floor.material = mat(board ? TEX.carpetBlue : TEX.carpet);
    if (!own || board) return;
    const seats = this.teamSeats.map((x) => ({ ...x, used: false }));
    const ordered = [...members].sort((a, b) => (b.name === 'Petra Lang') - (a.name === 'Petra Lang'));
    ordered.forEach((m, i) => {
      const seat = (m.name === 'Petra Lang' && seats.find((x) => x.petra && !x.used)) || seats.find((x) => !x.used && !x.petra) || seats.find((x) => !x.used);
      if (!seat) return;
      seat.used = true;
      const look = m.look || {};
      const p = buildPerson({ suit: look.suit ?? 0x6b6f4a, shirt: look.shirt ?? 0xe4ddc8, hair: look.hair ?? 0x3a2a1a, longHair: !!look.longHair, skin: SKINS[look.skin || 0] }, true);
      p.position.set(seat.x, 0, seat.z);
      p.rotation.y = seat.ry;
      p.userData.team = true;
      this.scene.add(p);
      this.teamPeople.push(p);
      this.animated.push({ obj: p, phase: i * 1.3 + 0.2 });
    });
  }

  // -------------------------------------------------- Besucher
  showVisitor(who) {
    this.hideVisitor();
    const opt = PEOPLE[who];
    if (!opt) return;
    const p = buildPerson({ ...opt, glasses: opt.glasses || who === 'kessler' }, false);
    p.position.copy(this.visitorAnchor);
    p.position.x -= 1.6;
    p.userData.walk = 0;
    this.scene.add(p);
    this.visitor = p;
  }
  ring(seconds) { this.ringUntil = this.clock.elapsedTime + seconds; }

  hideVisitor() {
    if (this.visitor) { this.scene.remove(this.visitor); this.visitor = null; }
  }

  // -------------------------------------------------- Zustand übernehmen
  setUpgrades(upgrades) {
    for (const [id, obj] of Object.entries(this.upgradeObjs)) obj.visible = !!upgrades[id];
    this.hasMonitor2 = !!upgrades.monitor2;
    this.applyMonitors();
    // Schreibmaschine verdrängt den Papierstapel, Tastentelefon ersetzt die Wählscheibe
    this.paperStack.visible = !upgrades.schreibmaschine;
    this.phoneParts.rotary.visible = !upgrades.tastentelefon;
    this.phoneParts.push.visible = !!upgrades.tastentelefon;
    this.handset.material = mat(upgrades.tastentelefon ? 0xc9c3b0 : 0xc05a22);
  }

  // Arbeitsplatz je Karrierestufe: ab Stufe 1 am Fenster
  setStage(stage) {
    const atWindow = stage >= 1;
    this.stage = stage;
    this.glassWall.visible = stage === 2;
    this.officeFront.visible = stage >= 3;
    this.frontPartition.forEach((m) => { m.visible = stage < 3; });
    this.windowWall.visible = atWindow;
    this.leftPartition.forEach((m) => { m.visible = !atWindow; });
    this.rightPartition.visible = atWindow && stage < 4;
    this.lounge.visible = stage >= 4;
    this.loungeWall.visible = stage < 6;
    this.cornerWindow.visible = stage >= 6;
    this.leftWall.forEach((m) => { m.visible = !atWindow; });
    this.leftSpots.forEach((g) => { g.visible = !atWindow; });
    const spots = this.wallSpots[stage >= 4 ? 'lounge' : atWindow ? 'right' : 'left'];
    for (const id of ['picture', 'urkunde']) {
      const [x, y, z, ry] = spots[id];
      this.upgradeObjs[id].position.set(x, y, z);
      this.upgradeObjs[id].rotation.y = ry;
    }
  }

  setScreenInfo(info) { this.screenInfo = info; }

  drawScreens(t) {
    const info = this.screenInfo;
    const blink = Math.floor(t * 2) % 2 === 0;
    const two = this.era >= 2;
    const fg = two ? '#1a1a1a' : '#4dff7c';
    const draw = (canvas, lines) => {
      const c = canvas.getContext('2d');
      c.fillStyle = two ? '#dcd9d0' : '#041007'; c.fillRect(0, 0, 160, 120);
      if (two) { c.fillStyle = '#1f3a8a'; c.fillRect(0, 0, 160, 12); }
      c.fillStyle = two ? 'rgba(0,0,0,0.04)' : 'rgba(60,255,120,0.06)';
      for (let y = 0; y < 120; y += 2) c.fillRect(0, y, 160, 1);
      c.font = '10px monospace';
      c.textBaseline = 'top';
      lines.forEach((l, i) => {
        if (l == null) return;
        if (typeof l === 'object') {
          c.fillStyle = two ? '#a9a59a' : '#1d5c2e'; c.fillRect(8, 10 + i * 12, 144, 6);
          c.fillStyle = two ? '#1f3a8a' : '#4dff7c'; c.fillRect(8, 10 + i * 12, 144 * Math.min(1, l.bar), 6);
          return;
        }
        c.fillStyle = two && i === 0 ? '#ffffff' : fg;
        c.fillText(l, 8, (two && i === 0 ? 2 : 8) + i * 12);
      });
    };
    if (!info) {
      draw(this.screenCanvas, ['KB-TERMINAL 3270', '', 'VERBINDUNG ...', blink ? '_' : '']);
    } else {
      draw(this.screenCanvas, [
        this.era >= 4 ? 'KB OS 2008' : this.era >= 3 ? 'KB-WINDOWS 2000' : two ? 'KB PC  KB-WINDOWS' : 'KB-TERMINAL 3270', info.date, '', `POST ${info.unread ? info.unread + ' NEU' : 'LEER'}`,
        `LST ${fmtInt(info.perf)}/${fmtInt(info.target)}`, { bar: info.perf / info.target },
        `KONTO ${fmtInt(toCur(info.cash))} ${cur() === '€' ? 'EUR' : 'DM'}`, blink ? '>_' : '>',
      ]);
    }
    this.screenTex.needsUpdate = true;
    if (this.hasMonitor2 && info) {
      draw(this.screen2Canvas, ['DEPOT', `KB-AKTIE ${fmtNum(toCur(info.price))}`, `BESTAND ${info.owned}`, '', '', '', '', '']);
      const c = this.screen2Canvas.getContext('2d');
      const h = info.history.slice(-40);
      const lo = Math.min(...h), hi = Math.max(...h);
      c.fillStyle = fg;
      h.forEach((v, i) => {
        const y = 108 - ((v - lo) / (hi - lo || 1)) * 50;
        c.fillRect(8 + i * 3.6, y, 3, 2);
      });
      this.screen2Tex.needsUpdate = true;
    }
  }

  // -------------------------------------------------- Kamera
  setMode(mode, onArrive = null) {
    this.mode = mode;
    this.arrive = onArrive;
  }

  screenTarget() {
    // Mittelpunkt vor dem Bildschirm (bzw. zwischen beiden)
    const [m1, m2] = this.activeMonitors();
    const p = new THREE.Vector3();
    m1.screen.getWorldPosition(p);
    if (this.hasMonitor2) {
      const p2 = new THREE.Vector3();
      m2.screen.getWorldPosition(p2);
      const mid = p.clone().lerp(p2, 0.5);
      return { pos: mid.clone().add(new THREE.Vector3(-0.02, 0.02, 0.62)), look: mid };
    }
    return { pos: p.clone().add(new THREE.Vector3(0, 0, 0.36)), look: p };
  }

  targetPose(t) {
    const pos = new THREE.Vector3(), q = new THREE.Quaternion();
    // Kamera-Ausrichtung (−z zeigt zum Ziel), anders als Object3D.lookAt
    const aim = (target) => q.setFromRotationMatrix(new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0)));
    if (this.mode === 'title') {
      pos.set(0.85 + Math.sin(t * 0.15) * 0.12, 1.5, 1.45);
      aim(new THREE.Vector3(-0.2, 0.95, -0.6));
    } else if (this.mode === 'pc') {
      const st = this.screenTarget();
      pos.copy(st.pos);
      aim(st.look);
    } else if (this.mode === 'phone') {
      pos.copy(this.deskPos);
      aim(new THREE.Vector3(-1.6, 1.25, -0.9)); // beim Telefonieren aus dem Fenster schauen
    } else if (this.mode === 'dialog') {
      pos.copy(this.deskPos);
      aim(new THREE.Vector3(this.visitorAnchor.x + 0.05, 1.42, this.visitorAnchor.z));
    } else {
      pos.copy(this.deskPos);
      const e = new THREE.Euler(-0.24 - this.look.y * 0.2, -this.look.x * 0.62, 0, 'YXZ');
      q.setFromEuler(e);
    }
    return { pos, q };
  }

  pickMonitor(e) {
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, this.camera);
    return ray.intersectObjects(this.clickables, false).length > 0;
  }

  updateHover(e) {
    if (this.mode !== 'desk') { this.setHover(false); return; }
    this.setHover(this.pickMonitor(e));
  }
  setHover(v) {
    if (v === this.hover) return;
    this.hover = v;
    this.renderer.domElement.style.cursor = v ? 'pointer' : 'default';
  }

  // -------------------------------------------------- Frame
  update() {
    const dt = Math.min(0.1, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    const L = this.look;
    L.x += (L.tx - L.x) * Math.min(1, dt * 4);
    L.y += (L.ty - L.y) * Math.min(1, dt * 4);

    const { pos, q } = this.targetPose(t);
    const k = 1 - Math.exp(-dt * (this.mode === 'pc' ? 7 : 5));
    this.camera.position.lerp(pos, k);
    this.camera.quaternion.slerp(q, k);
    if (this.arrive && this.camera.position.distanceTo(pos) < 0.012) {
      const fn = this.arrive; this.arrive = null; fn();
    }

    // Kollegen tippen und bewegen den Kopf
    for (const a of this.animated) {
      const an = a.obj.userData.anim;
      const s = Math.sin(t * 7 + a.phase);
      an.arms[0].rotation.x = -1.0 + s * 0.06;
      an.arms[1].rotation.x = -1.0 - s * 0.06;
      if (an.head) an.head.rotation.y = Math.sin(t * 0.4 + a.phase) * 0.25;
    }
    // Telefon: klingeln und Hörer abnehmen
    const lift = this.mode === 'phone' ? 1 : 0;
    this.lift = (this.lift || 0) + (lift - (this.lift || 0)) * Math.min(1, dt * 6);
    this.handset.position.set(0, 0.11 + this.lift * 0.2, -0.04 + this.lift * 0.1);
    this.handset.rotation.x = this.lift * 0.6;
    this.handset.visible = this.lift < 0.45; // danach hält man ihn am Ohr
    this.phone.rotation.z = t < (this.ringUntil || 0) ? Math.sin(t * 70) * 0.05 : 0;

    // Bürotür öffnet sich für Besucher
    if (this.door) {
      const open = this.visitor && this.stage >= 3 ? 1.5 : 0;
      this.door.rotation.y += (open - this.door.rotation.y) * Math.min(1, dt * 4);
    }

    // Besucher läuft herein
    if (this.visitor && this.visitor.userData.walk < 1) {
      const v = this.visitor;
      v.userData.walk = Math.min(1, v.userData.walk + dt * 1.4);
      const e = 1 - Math.pow(1 - v.userData.walk, 3);
      v.position.x = this.visitorAnchor.x - 1.6 * (1 - e);
      v.position.y = Math.abs(Math.sin(v.userData.walk * Math.PI * 4)) * 0.03 * (1 - e);
    }

    if (Math.floor(t * 4) !== this._lastScreen) { this._lastScreen = Math.floor(t * 4); this.drawScreens(t); }
    this.renderer.render(this.scene, this.camera);
  }
}
