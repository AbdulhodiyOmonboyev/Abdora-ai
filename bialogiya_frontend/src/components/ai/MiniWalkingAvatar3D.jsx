import { useEffect, useMemo, useRef, useState } from 'react';

function buildMiniWalkerHTML() {
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:transparent!important}
  #stage{width:100%;height:100%;background:transparent!important}
  canvas{display:block;width:100%;height:100%;background:transparent!important}
</style>
</head><body>
<div id="stage"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" onerror="window.parent.postMessage({type:'MINI_AVATAR_ERROR'},'*')"></script>
<script>
(function(){
  if (!window.THREE) {
    window.parent.postMessage({ type: 'MINI_AVATAR_ERROR' }, '*');
    return;
  }
  const box = document.getElementById('stage');
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rend.setClearColor(0x000000, 0);
  rend.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  box.appendChild(rend.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc4ea, 0.98));
  const dl = new THREE.DirectionalLight(0xffffff, 0.88); dl.position.set(4, 8, 7); scene.add(dl);
  const rim = new THREE.DirectionalLight(0xb9a6ff, 0.55); rim.position.set(-5, 4, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.42); fill.position.set(0, 2, 9); scene.add(fill);

  const M = c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8 });
  const B = c => new THREE.MeshBasicMaterial({ color: c });
  const skin = M(0xffdcc6), hairM = M(0x6a52b8), shirtM = M(0xf4f6fb), irisM = B(0x3a9be0), shortsM = M(0x2f5fa8), shoeM = M(0xf08aa8), accM = M(0xd9606a);
  const C = THREE.CylinderGeometry, I = THREE.IcosahedronGeometry, K = THREE.ConeGeometry, BX = THREE.BoxGeometry;

  const g = new THREE.Group(); scene.add(g);
  const U = new THREE.Group(); U.position.y = 2.0; g.add(U);
  const H = new THREE.Group(); H.position.y = 1.95; U.add(H);

  function add(p, geo, mat, x, y, z, o = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (o.s) m.scale.set(...o.s);
    if (o.r) m.rotation.set(...o.r);
    p.add(m);
    return m;
  }
  const grp = (p) => { const o = new THREE.Group(); p.add(o); return o; };
  const hy = y => y - 3.95;

  // Articulated left & right legs pivoting at hip y = 1.85
  const legs = [];
  const pantsLegs = [];
  const foot = { sneaker: [], boot: [], sandal: [], bare: [], heel: [], dress: [] };

  [-1, 1].forEach(s => {
    const legPivot = new THREE.Group();
    legPivot.position.set(s * 0.34, 1.85, 0);
    g.add(legPivot);
    legs.push(legPivot);

    const fa = (k, geo, mat, x, y, z, o) => foot[k].push(add(legPivot, geo, mat, x, y - 1.85, z, o));

    add(legPivot, new C(0.3, 0.24, 1.7, 6), skin, 0, 0.95 - 1.85, 0);
    pantsLegs.push(add(legPivot, new C(0.36, 0.29, 1.7, 6), shortsM, 0, 1.2 - 1.85, 0));

    fa('sneaker', new BX(0.54, 0.28, 0.9), shoeM, 0, 0.14, 0.14);
    fa('sneaker', new BX(0.5, 0.08, 0.84), M(0xffffff), 0, 0.03, 0.14);
    fa('boot', new C(0.37, 0.34, 0.8, 6), shoeM, 0, 0.5, 0);
    fa('boot', new BX(0.54, 0.26, 0.9), shoeM, 0, 0.13, 0.14);
    fa('boot', new BX(0.58, 0.08, 0.94), M(0x2b2b36), 0, 0.04, 0.14);
    fa('boot', new C(0.38, 0.38, 0.06, 6), M(0x2b2b36), 0, 0.9, 0);
    fa('sandal', new BX(0.46, 0.16, 0.82), skin, 0, 0.13, 0.14);
    fa('sandal', new BX(0.52, 0.06, 0.9), shoeM, 0, 0.03, 0.14);
    fa('sandal', new BX(0.5, 0.08, 0.1), shoeM, 0, 0.18, 0.0);
    fa('sandal', new BX(0.5, 0.08, 0.1), shoeM, 0, 0.18, 0.38);
    fa('bare', new BX(0.46, 0.2, 0.84), skin, 0, 0.1, 0.14);
    fa('heel', new BX(0.44, 0.18, 0.85), shoeM, 0, 0.2, 0.12);
    fa('heel', new BX(0.46, 0.06, 0.5), M(0x2b2b36), 0, 0.03, 0.3);
    fa('heel', new BX(0.1, 0.2, 0.1), M(0x2b2b36), 0, 0.1, -0.22);
    fa('dress', new BX(0.5, 0.26, 0.95), M(0x2b2b36), 0, 0.13, 0.17);
    fa('dress', new BX(0.52, 0.06, 0.97), M(0x15131f), 0, 0.03, 0.17);

    add(legPivot, new C(0.27, 0.3, 0.22, 6), M(0xffffff), 0, 1.75 - 1.85, 0);
  });

  const shorts = add(g, new C(0.66, 0.7, 0.8, 8), shortsM, 0, 2.0, 0, { s: [1, 1, 0.72] });
  const hip = add(g, new C(0.66, 0.64, 0.5, 8), shortsM, 0, 2.15, 0, { s: [1, 1, 0.72] });
  const skirt = add(g, new C(0.62, 1.05, 0.75, 10), shortsM, 0, 1.9, 0, { s: [1, 1, 0.85] });
  add(g, new C(0.68, 0.68, 0.1, 8), M(0xf2c94c), 0, 2.38, 0, { s: [1, 1, 0.72] });

  const torso = add(U, new C(0.62, 0.58, 1.4, 8), shirtM, 0, 1.05, 0, { s: [1, 1, 0.68] });
  add(U, new C(0.15, 0.17, 0.35, 6), skin, 0, 1.85, 0);
  const hood = add(U, new THREE.TorusGeometry(0.3, 0.12, 5, 8), shirtM, 0, 1.82, -0.08, { r: [Math.PI / 2, 0, 0] });
  const collar = add(U, new THREE.TorusGeometry(0.23, 0.06, 5, 10), M(0xffffff), 0, 1.8, 0.02, { r: [Math.PI / 2, 0, 0] });
  const tieM = M(0xc2455f), tie = grp(U);
  add(tie, new BX(0.1, 0.5, 0.04), tieM, 0, 1.45, 0.43);
  add(tie, new BX(0.14, 0.1, 0.05), tieM, 0, 1.72, 0.43);

  function arm(s) {
    const sh = new THREE.Group(); sh.position.set(s * 0.84, 1.6, 0); U.add(sh);
    const sl1 = add(sh, new C(0.26, 0.3, 0.55, 6), shirtM, 0, -0.15, 0);
    const sl2 = add(sh, new I(0.3, 0), shirtM, 0, 0.02, 0);
    const skSh = add(sh, new I(0.2, 0), skin, 0, 0, 0);
    add(sh, new C(0.17, 0.15, 0.7, 6), skin, 0, -0.5, 0);
    const ls1 = add(sh, new C(0.21, 0.19, 0.85, 6), shirtM, 0, -0.55, 0);
    const el = new THREE.Group(); el.position.y = -0.75; sh.add(el);
    add(el, new C(0.15, 0.12, 0.7, 6), skin, 0, -0.35, 0);
    const ls2 = add(el, new C(0.18, 0.16, 0.62, 6), shirtM, 0, -0.32, 0);
    add(el, new I(0.18, 0), skin, 0, -0.78, 0, { s: [1, 1.2, 0.8] });
    return { sh, el, ls: [ls1, ls2], sl: [sl1, sl2], skSh, s };
  }
  const AR = arm(1), AL = arm(-1);

  add(H, new I(0.85, 1), skin, 0, hy(4.7), 0, { s: [0.95, 1.05, 0.95] });
  add(H, new I(0.93, 1), hairM, 0, hy(4.85), -0.2, { s: [1, 1.02, 1] });
  const ahoge = add(H, new K(0.1, 0.55, 4), hairM, 0, hy(5.8), 0.05, { r: [0.2, 0, -0.2] });
  const fL = grp(H), fS = grp(H), spk = grp(H), clip = grp(H), bL = grp(H), bB = grp(H), pig = grp(H), pony = grp(H);
  const sway = [], pinkM = M(0xf08aa8);
  const swy = (m, ax, base, amp, ph) => { sway.push([m, ax, base, amp, ph]); return m; };

  swy(add(bL, new K(0.78, 2.0, 6), hairM, 0, hy(3.85), -0.55, { r: [0, 0, Math.PI] }), 'x', 0, 0.06, 0);
  add(bB, new K(0.85, 1.2, 6), hairM, 0, hy(4.3), -0.5, { r: [0, 0, Math.PI] });
  swy(add(pony, new K(0.35, 1.8, 5), hairM, 0, hy(4.3), -1.28, { r: [Math.PI + 0.5, 0, 0] }), 'x', Math.PI + 0.5, 0.12, 0);
  add(pony, new I(0.16, 0), pinkM, 0, hy(5.1), -0.85);
  add(fL, new K(0.26, 0.8, 4), hairM, 0, hy(5.3), 0.64, { r: [0.2, 0, Math.PI] });
  add(clip, new THREE.OctahedronGeometry(0.13, 0), M(0xf2c94c), 0.58, hy(5.1), 0.55);
  [[-0.5, 5.6, 0.35], [0, 5.72, 0.45], [0.5, 5.6, 0.35], [-0.3, 5.75, -0.1], [0.3, 5.75, -0.1]].forEach(([x, y, z]) =>
    add(spk, new K(0.3, 0.75, 4), hairM, x, hy(y), z, { r: [0.25, 0, -x * 0.4] })
  );
  [-0.36, 0.1, 0.42].forEach(x => add(fS, new K(0.2, 0.5, 4), hairM, x, hy(5.28), 0.66, { r: [0.2, 0, Math.PI] }));

  const eyes = [], blush = [], brows = [], elfEars = [], glasses = grp(H);
  [-1, 1].forEach(s => {
    swy(add(bL, new K(0.27, 1.6, 4), hairM, s * 0.88, hy(4.0), 0.05, { r: [0, 0, Math.PI] }), 'z', Math.PI, 0.07 * s, s);
    swy(add(bB, new K(0.27, 0.9, 4), hairM, s * 0.88, hy(4.35), 0.05, { r: [0, 0, Math.PI] }), 'z', Math.PI, 0.07 * s, s);
    swy(add(pig, new K(0.3, 1.6, 5), hairM, s * 1.15, hy(4.22), -0.05, { r: [0, 0, Math.PI + s * 0.25] }), 'z', Math.PI + s * 0.25, 0.09, s);
    add(pig, new I(0.15, 0), pinkM, s * 0.95, hy(5.0), -0.05);
    add(fL, new K(0.25, 0.75, 4), hairM, s * 0.55, hy(5.3), 0.6, { r: [0.2, 0, Math.PI + s * 0.35] });
    brows.push(add(H, new BX(0.28, 0.05, 0.04), M(0x3a2d6b), s * 0.34, hy(5.03), 0.73, { r: [0, s * 0.3, s * 0.12] }));
    blush.push(add(H, new THREE.CircleGeometry(0.12, 6), new THREE.MeshBasicMaterial({ color: 0xff9aa8, transparent: true, opacity: 0.55 }), s * 0.52, hy(4.35), 0.6, { r: [0, s * 0.7, 0] }));
    const e = new THREE.Group(); e.position.set(s * 0.31, hy(4.62), 0.8); e.rotation.y = s * 0.25;
    const part = (r, mat, z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 6), mat); m.scale.y = 1.35; m.position.z = z; e.add(m); };
    part(0.2, B(0xffffff), 0); part(0.15, irisM, 0.01); part(0.08, B(0x1d3b6b), 0.02);
    const lash = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.07), B(0x2a2540)); lash.position.set(0, 0.29, 0.03); e.add(lash);
    const h = new THREE.Mesh(new THREE.CircleGeometry(0.05, 5), B(0xffffff)); h.position.set(-0.06, 0.1, 0.03); e.add(h);
    H.add(e); eyes.push(e);
    add(glasses, new THREE.TorusGeometry(0.25, 0.03, 4, 8), M(0x2a2540), s * 0.36, hy(4.62), 0.82, { r: [0, s * 0.25, 0] });
    add(glasses, new BX(0.03, 0.03, 0.85), M(0x2a2540), s * 0.71, hy(4.66), 0.4, { r: [0, -s * 0.27, 0] });
    elfEars.push(add(H, new K(0.15, 0.6, 4), skin, s * 0.84, hy(4.75), 0, { r: [0, 0, -s * 1.05] }));
  });
  add(glasses, new BX(0.16, 0.03, 0.03), M(0x2a2540), 0, hy(4.66), 0.85);

  const smile = add(H, new THREE.TorusGeometry(0.14, 0.022, 4, 6, Math.PI), B(0xd9606a), 0, hy(4.3), 0.72, { r: [0, 0, Math.PI] });
  const mouth = add(H, new THREE.CircleGeometry(0.09, 6), B(0x8a2a3a), 0, hy(4.22), 0.72); mouth.visible = false;

  const cap = grp(H);
  add(cap, new THREE.SphereGeometry(1.0, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), accM, 0, hy(4.95), -0.05);
  add(cap, new BX(0.95, 0.07, 0.65), accM, 0, hy(5.15), 0.95);
  const wiz = grp(H);
  add(wiz, new K(0.85, 1.9, 6), accM, 0, hy(6.2), -0.05, { r: [-0.15, 0, 0] });
  add(wiz, new C(1.35, 1.35, 0.07, 10), accM, 0, hy(5.3), 0);

  const S = { gender: 'girl', style: 'long', top: 'tee', bottom: 'shorts', shoe: 'sneaker', cap: false, wiz: false, glasses: false, elf: false };
  const hexOk = h => typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h);

  function apply() {
    const boy = S.gender === 'boy', hd = S.top === 'hood', hat = S.cap || S.wiz, st = S.style, sk = S.bottom === 'skirt', pn = S.bottom === 'pants';
    fL.visible = !hat && (st === 'long' || st === 'pig' || st === 'pony' || st === 'bob');
    fS.visible = !hat && (st === 'spiky' || st === 'neat');
    spk.visible = !hat && st === 'spiky';
    clip.visible = !hat && !boy && (st === 'long' || st === 'pig' || st === 'pony' || st === 'bob');
    bL.visible = st === 'long'; bB.visible = st === 'bob'; pig.visible = st === 'pig'; pony.visible = st === 'pony';
    blush.forEach(b => b.visible = !boy);
    brows.forEach(b => b.scale.y = boy ? 1.4 : 1);
    torso.scale.set((boy ? 1.15 : 1) * (hd ? 1.1 : 1), 1, 0.68 * (hd ? 1.12 : 1));
    [AR, AL].forEach(a => {
      a.sh.position.x = a.s * (0.84 * (boy ? 1.1 : 1) + (hd ? 0.05 : 0));
      a.ls.forEach(l => l.visible = hd || S.top === 'shirt');
      a.sl.forEach(l => l.visible = S.top !== 'tank');
      a.skSh.visible = S.top === 'tank';
    });
    collar.visible = S.top === 'shirt'; tie.visible = S.top === 'shirt'; hood.visible = hd;
    for (const k in foot) foot[k].forEach(m => m.visible = S.shoe === k);
    shorts.visible = !sk && !pn; hip.visible = pn; skirt.visible = sk;
    pantsLegs.forEach(p => p.visible = pn);
    cap.visible = !!S.cap; wiz.visible = !!S.wiz; glasses.visible = !!S.glasses;
    elfEars.forEach(e => e.visible = !!S.elf);
    ahoge.visible = !hat;
  }

  function loadCfg(c) {
    if (!c || typeof c !== 'object') return;
    const inner = c.config && typeof c.config === 'object' ? { ...c, ...c.config } : c;
    if (inner.gender) S.gender = inner.gender;
    if (inner.style) S.style = inner.style;
    if (inner.top) S.top = inner.top;
    if (inner.bottom) S.bottom = inner.bottom;
    if (inner.shoe) S.shoe = inner.shoe;
    if (typeof inner.cap === 'boolean') S.cap = inner.cap;
    if (typeof inner.wiz === 'boolean') S.wiz = inner.wiz;
    if (typeof inner.glasses === 'boolean') S.glasses = inner.glasses;
    if (typeof inner.elf === 'boolean') S.elf = inner.elf;
    if (inner.colors) {
      if (hexOk(inner.colors.skin)) skin.color.set(inner.colors.skin);
      if (hexOk(inner.colors.hair)) hairM.color.set(inner.colors.hair);
      if (hexOk(inner.colors.eyes)) irisM.color.set(inner.colors.eyes);
      if (hexOk(inner.colors.shirt)) shirtM.color.set(inner.colors.shirt);
      if (hexOk(inner.colors.pants)) shortsM.color.set(inner.colors.pants);
      if (hexOk(inner.colors.shoes)) shoeM.color.set(inner.colors.shoes);
      if (hexOk(inner.colors.acc)) accM.color.set(inner.colors.acc);
    }
    apply();
  }

  let st = { isWalking: false, walkDirX: -1, walkDirY: 0, isSpeaking: false, isListening: false, celebrateUntil: 0 };
  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'MINI_AVATAR_UPDATE') {
      if (e.data.config) loadCfg(e.data.config);
      if (typeof e.data.isWalking === 'boolean') st.isWalking = e.data.isWalking;
      if (typeof e.data.walkDirX === 'number') st.walkDirX = e.data.walkDirX;
      if (typeof e.data.walkDirY === 'number') st.walkDirY = e.data.walkDirY;
      if (typeof e.data.isSpeaking === 'boolean') st.isSpeaking = e.data.isSpeaking;
      if (typeof e.data.isListening === 'boolean') st.isListening = e.data.isListening;
      if (e.data.celebrate) st.celebrateUntil = performance.now() / 1000 + 1.8;
    }
  });

  function fit() {
    const w = box.clientWidth || 120, h = box.clientHeight || 150;
    rend.setSize(w, h, false);
    cam.aspect = w / h;
    cam.position.set(0, 3.15, 11.8);
    cam.lookAt(0, 2.95, 0);
    cam.updateProjectionMatrix();
  }
  window.addEventListener('resize', fit);
  new ResizeObserver(fit).observe(box);
  fit();
  apply();

  let last = 0, walkPhase = 0;
  const cur = { legL: 0, legR: 0, armLX: 0, armRX: 0, armLZ: -0.1, armRZ: 0.1, elLX: -0.1, elRX: -0.1, bob: 0, yaw: 0.15, lean: 0, twist: 0 };

  function loop(ms) {
    requestAnimationFrame(loop);
    const t = ms / 1000;
    const dt = Math.min(0.05, t - last);
    last = t;

    const celebrating = t < st.celebrateUntil;
    let tgLegL = 0, tgLegR = 0, tgArmLX = 0, tgArmRX = 0, tgArmLZ = -0.1, tgArmRZ = 0.1, tgElLX = -0.08, tgElRX = -0.08;
    let tgBob = 0, tgYaw = Math.sin(t * 0.8) * 0.14, tgLean = 0, tgTwist = 0;
    let talk = false;

    if (celebrating) {
      tgBob = Math.abs(Math.sin(t * 9.5)) * 0.75;
      tgArmRZ = 2.45; tgArmLZ = -2.45;
      tgYaw = Math.sin(t * 6) * 0.35;
      talk = true;
    } else if (st.isWalking) {
      walkPhase += dt * 9.6;
      const s = Math.sin(walkPhase);
      const stride = S.bottom === 'skirt' ? 0.48 : 0.68;
      tgLegL = s * stride;
      tgLegR = -s * stride;
      tgArmLX = -s * 0.58;
      tgArmRX = s * 0.58;
      tgArmLZ = -0.14;
      tgArmRZ = 0.14;
      tgElLX = -0.34 - Math.max(0, -s) * 0.22;
      tgElRX = -0.34 - Math.max(0, s) * 0.22;
      tgBob = Math.abs(Math.sin(walkPhase)) * 0.24;
      tgTwist = s * 0.14;
      tgLean = 0.09;

      const dirSign = st.walkDirX >= 0 ? 1 : -1;
      const depthAdjust = st.walkDirY < -0.35 ? 1.12 : st.walkDirY > 0.35 ? 0.58 : 0.86;
      tgYaw = dirSign * depthAdjust;
    } else if (st.isSpeaking) {
      talk = true;
      tgYaw = 0.08 + Math.sin(t * 1.8) * 0.12;
      tgArmRZ = 0.65 + Math.sin(t * 5.2) * 0.22;
      tgArmRX = -0.45;
      tgElRX = -0.65;
      tgBob = Math.abs(Math.sin(t * 3.5)) * 0.06;
    } else if (st.isListening) {
      tgYaw = -0.1;
      tgArmRZ = 1.35;
      tgElRX = -0.85;
    }

    const k = Math.min(1, dt * 10);
    cur.legL += (tgLegL - cur.legL) * k;
    cur.legR += (tgLegR - cur.legR) * k;
    cur.armLX += (tgArmLX - cur.armLX) * k;
    cur.armRX += (tgArmRX - cur.armRX) * k;
    cur.armLZ += (tgArmLZ - cur.armLZ) * k;
    cur.armRZ += (tgArmRZ - cur.armRZ) * k;
    cur.elLX += (tgElLX - cur.elLX) * k;
    cur.elRX += (tgElRX - cur.elRX) * k;
    cur.bob += (tgBob - cur.bob) * Math.min(1, dt * 14);
    cur.yaw += (tgYaw - cur.yaw) * Math.min(1, dt * 6);
    cur.lean += (tgLean - cur.lean) * k;
    cur.twist += (tgTwist - cur.twist) * k;

    legs[0].rotation.x = cur.legL;
    legs[1].rotation.x = cur.legR;
    AL.sh.rotation.set(cur.armLX, 0, cur.armLZ);
    AR.sh.rotation.set(cur.armRX, 0, cur.armRZ);
    AL.el.rotation.set(cur.elLX, 0, -0.06);
    AR.el.rotation.set(cur.elRX, 0, 0.06);

    g.position.y = cur.bob;
    g.rotation.y = cur.yaw;
    U.rotation.set(cur.lean, cur.twist, 0);
    U.scale.y = 1 + Math.sin(t * 2.2) * 0.014;

    const headTiltZ = st.isListening ? 0.16 : Math.sin(t * 1.4) * 0.035;
    const headNodX = talk ? Math.sin(t * 7) * 0.05 : Math.sin(t * 1.6) * 0.02;
    H.rotation.set(headNodX, -cur.twist * 0.5, headTiltZ);

    const bl = (t % 3.4) > 3.28 ? 0.1 : 1;
    eyes.forEach(e => { e.scale.y = bl; });
    sway.forEach(([m, ax, b, a, p]) => {
      const walkBoost = st.isWalking ? 2.1 : 1;
      m.rotation[ax] = b + a * walkBoost * Math.sin(t * (st.isWalking ? 4.8 : 1.8) + p);
    });
    ahoge.rotation.z = -0.2 + Math.sin(t * 2.5) * 0.16;

    smile.visible = !talk;
    mouth.visible = talk;
    if (talk) mouth.scale.y = 0.4 + Math.abs(Math.sin(t * 14)) * 0.95;

    rend.render(scene, cam);
  }
  requestAnimationFrame(loop);
  window.parent.postMessage({ type: 'MINI_AVATAR_READY' }, '*');
})();
</script>
</body></html>`;
}

export default function MiniWalkingAvatar3D({
  config,
  fallbackImageUrl = '',
  avatarName = 'Avatar',
  isWalking = false,
  walkDirX = -1,
  walkDirY = 0,
  isSpeaking = false,
  isListening = false,
  celebrateSignal = 0,
}) {
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const lastCelebrateRef = useRef(0);

  const blobUrl = useMemo(() => {
    const html = buildMiniWalkerHTML();
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    const onMessage = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'MINI_AVATAR_READY') {
        setReady(true);
      } else if (e.data.type === 'MINI_AVATAR_ERROR') {
        setFailed(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready || !iframeRef.current?.contentWindow) return;
    const shouldCelebrate = celebrateSignal > lastCelebrateRef.current;
    if (shouldCelebrate) lastCelebrateRef.current = celebrateSignal;

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'MINI_AVATAR_UPDATE',
        config,
        isWalking,
        walkDirX,
        walkDirY,
        isSpeaking,
        isListening,
        celebrate: shouldCelebrate,
      },
      '*'
    );
  }, [ready, config, isWalking, walkDirX, walkDirY, isSpeaking, isListening, celebrateSignal]);

  return (
    <div className="relative w-28 h-36 sm:w-32 sm:h-40 flex items-center justify-center pointer-events-none select-none">
      {!failed && blobUrl && (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          title={`${avatarName} 3D`}
          sandbox="allow-scripts allow-same-origin"
          style={{ background: 'transparent' }}
          className={`w-full h-full border-0 pointer-events-none transition-opacity duration-300 drop-shadow-[0_12px_16px_rgba(0,0,0,0.35)] ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {(!ready || failed) && fallbackImageUrl && (
        <img
          src={fallbackImageUrl}
          alt={avatarName}
          draggable={false}
          className={`absolute inset-0 w-full h-full object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.38)] ${
            isWalking ? 'animate-bounce' : ''
          }`}
        />
      )}
    </div>
  );
}
