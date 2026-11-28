import { useEffect, useRef, useState, useMemo } from 'react';

function getAvatarHTML() {
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Low-poly 3D qahramon</title>
<style>
:root{--bg:#f1eef9;--fg:#2a2540;--card:#ffffff;--line:#cfc8e6;--btn:#F06413;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#1c1a2b;--fg:#ece9f7;--card:#2a2740;--line:#47426b;--btn:#F06413;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#1c1a2b;--fg:#ece9f7;--card:#2a2740;--line:#47426b;--btn:#F06413;color-scheme:dark}
html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--fg);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;display:flex;flex-direction:column}
#wrap{flex:1;min-height:0;position:relative;overflow:hidden;background:var(--bg)}
#stage{position:absolute;inset:0;touch-action:none;cursor:grab}
#stage canvas{display:block}
#bubble{position:absolute;top:82px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--line);border-radius:16px;padding:8px 14px;font-size:15px;opacity:0;transition:opacity .3s;pointer-events:none;max-width:52%;text-align:center;z-index:4}
.bar{position:absolute;top:12px;display:flex;flex-direction:column;gap:6px;z-index:6}
#barl{left:10px}#barr{right:10px}
.sq{position:relative;width:60px;height:48px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--fg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;padding:0;font-size:11px;font-family:inherit}
.sq span{font-size:20px;line-height:1}
.sq.on{background:var(--btn);color:#fff;border-color:var(--btn)}
#sheet{position:absolute;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);border-radius:16px 16px 0 0;padding:10px 14px 14px;max-height:min(40%,320px);overflow-y:auto;transform:translateY(105%);transition:transform .25s;z-index:5;box-sizing:border-box}
#sheet.open{transform:none}
#sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:0 66px}
#sh b{font-weight:500;font-size:16px}
.seg{background:transparent;color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font-size:14px;cursor:pointer;font-family:inherit}
.seg.on{background:var(--btn);color:#fff;border-color:var(--btn)}
.sec{display:none;flex-direction:column;gap:10px}.sec.on{display:flex}
.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.row b{width:70px;font-weight:500;font-size:14px}
.sw{width:30px;height:30px;border-radius:50%;border:2px solid var(--line);padding:0;cursor:pointer}
.sw.on{border-color:var(--fg);box-shadow:0 0 0 2px var(--card) inset}
.act{flex:1;background:var(--btn);color:#fff;border:0;border-radius:10px;padding:10px 8px;font-size:15px;cursor:pointer}
.zb{height:30px;font-size:18px;line-height:1}
#tagWrap{position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;z-index:4;max-width:58%}
#ntag{background:var(--btn);color:#fff;border:0;border-radius:999px;padding:7px 16px;font-size:15px;font-family:inherit;cursor:pointer;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ptag{background:var(--card);color:var(--fg);border:1px solid var(--line);border-radius:999px;padding:3px 12px;font-size:12px;font-family:inherit;cursor:pointer;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 6px rgba(0,0,0,.08)}
#nameIn,#profIn{flex:1;min-width:120px;padding:9px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font-size:15px;font-family:inherit}
#nameIn:disabled,#profIn:disabled{opacity:.55;cursor:not-allowed}
.seg:disabled{opacity:.45;cursor:not-allowed}
.nmsg{font-size:13px;opacity:.85;margin-top:6px;line-height:1.4}
.xp-ok{background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.4);color:#16a34a;border-radius:10px;padding:8px 10px;font-size:13px;font-weight:500}
.xp-lock{background:rgba(240,100,19,.12);border:1px solid rgba(240,100,19,.35);border-radius:10px;padding:8px 10px;font-size:13px;font-weight:500}
:root[data-theme="dark"] .xp-ok{color:#4ade80}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .xp-ok{color:#4ade80}}
.sq.lock{opacity:.55}.sq.lock::after{content:'🔒';position:absolute;top:1px;right:3px;font-size:11px}
.lnk{background:none;border:0;color:var(--fg);opacity:.6;text-decoration:underline;font-size:13px;cursor:pointer;font-family:inherit;align-self:center;padding:6px}
</style></head>
<body>
<div id="wrap">
<div id="stage"></div>
<div id="tagWrap"><button id="ntag"></button><button id="ptag"></button></div>
<div id="bubble"></div>
<div class="bar" id="barl"></div>
<div class="bar" id="barr"></div>
<div id="sheet">
<div id="sh"><b id="shT"></b><button class="seg" id="shX" aria-label="Yopish">Yopish</button></div>
<div class="sec" data-k="name">
<div id="nameBanner" style="display:none"></div>
<div id="nameForm"><div class="row"><input id="nameIn" maxlength="16" placeholder="Qahramon ismi" autocomplete="off"><button class="seg on" id="nameGo">Tasdiqlash</button></div><div class="nmsg" id="nameMsg">2 dan 16 gacha belgi.</div></div>
<div id="nameConf" style="display:none"><div id="nameAsk"></div><div class="row" style="margin-top:10px"><button class="seg on" id="nameYes">Ha, tasdiqlayman</button><button class="seg" id="nameNo">Yo\u02BBq, qaytish</button></div></div>
<div id="nameLock" style="display:none">Qahramon ismi: <b id="nameShow"></b><div class="nmsg xp-lock" id="nameLockMsg" style="margin-top:8px"></div></div>
</div>
<div class="sec" data-k="profession">
<div id="profBanner" style="display:none"></div>
<div class="row" id="profPresets"></div>
<div class="row"><input id="profIn" maxlength="24" placeholder="Boshqa kasb (2-24 belgi)" autocomplete="off"><button class="seg on" id="profGo">Tanlash</button></div>
<div class="nmsg" id="profMsg">Tayyor kasblardan birini tanlang yoki o\u02BBzingiznikini yozing.</div>
</div>
<div class="sec" data-k="gender"><div class="row"><b>Jins</b><span id="gender" class="row"></span></div></div>
<div class="sec" data-k="skin"><div class="row"><b>Teri</b><span id="skin" class="row"></span></div></div>
<div class="sec" data-k="hair"><div class="row"><b>Rangi</b><span id="hair" class="row"></span></div><div class="row"><b>Turmak</b><span id="style" class="row"></span></div></div>
<div class="sec" data-k="eye"><div class="row"><b>Rangi</b><span id="eye" class="row"></span></div></div>
<div class="sec" data-k="top"><div class="nmsg wt" style="margin:0"></div><div class="row"><b>Turi</b><span id="top" class="row"></span></div><div class="row"><b>Rangi</b><span id="shirt" class="row"></span></div></div>
<div class="sec" data-k="bottom"><div class="nmsg wt" style="margin:0"></div><div class="row"><b>Turi</b><span id="bottom" class="row"></span></div><div class="row"><b>Rangi</b><span id="pants" class="row"></span></div></div>
<div class="sec" data-k="shoes"><div class="nmsg wt" style="margin:0"></div><div class="row"><b>Turi</b><span id="shoeType" class="row"></span></div><div class="row"><b>Rangi</b><span id="shoes" class="row"></span></div></div>
<div class="sec" data-k="acc"><div class="row" id="accs"></div><div class="row"><b>Rangi</b><span id="acc" class="row"></span></div></div>
<div class="sec" data-k="act"><div class="row" id="acts"></div><div class="row"><button class="seg on" id="snd">Ovoz: yoqilgan</button></div><div id="vinfo" style="font-size:13px;opacity:.7"></div></div>
</div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const box=document.getElementById('stage'),bub=document.getElementById('bubble');
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(35,1,0.1,100);
const rend=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
rend.setClearColor(0x000000,0);
rend.setPixelRatio(Math.min(devicePixelRatio,2));
box.appendChild(rend.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0xcfc4ea,0.95));
const dl=new THREE.DirectionalLight(0xffffff,0.85);dl.position.set(4,8,7);scene.add(dl);
const rim=new THREE.DirectionalLight(0xb9a6ff,0.6);rim.position.set(-5,4,-6);scene.add(rim);const fill=new THREE.DirectionalLight(0xffffff,0.4);fill.position.set(0,2,9);scene.add(fill);
const M=c=>new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:0.8});
const B=c=>new THREE.MeshBasicMaterial({color:c});
const skin=M(0xffdcc6),hairM=M(0x6a52b8),shirtM=M(0xf4f6fb),irisM=B(0x3a9be0),shortsM=M(0x2f5fa8),shoeM=M(0xf08aa8),accM=M(0xd9606a);
const C=THREE.CylinderGeometry,I=THREE.IcosahedronGeometry,K=THREE.ConeGeometry;
const g=new THREE.Group();scene.add(g);
const U=new THREE.Group();U.position.y=2.0;g.add(U);
const H=new THREE.Group();H.position.y=1.95;U.add(H);
function add(p,geo,mat,x,y,z,o={}){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(o.s)m.scale.set(...o.s);if(o.r)m.rotation.set(...o.r);p.add(m);return m}
const grp=(p)=>{const o=new THREE.Group();p.add(o);return o};
const hy=y=>y-3.95;
const floor=add(scene,new THREE.CircleGeometry(2.3,20),new THREE.MeshBasicMaterial({color:0x7a6cc0,transparent:true,opacity:0.22}),0,0.01,0,{r:[-Math.PI/2,0,0]});
const pantsLegs=[],foot={sneaker:[],boot:[],sandal:[],bare:[],heel:[],dress:[]};
const fa=(k,...a)=>foot[k].push(add(g,...a));
[-1,1].forEach(s=>{
add(g,new C(0.3,0.24,1.7,6),skin,s*0.34,0.95,0);
pantsLegs.push(add(g,new C(0.36,0.29,1.7,6),shortsM,s*0.34,1.2,0));
const X=s*0.34,BX=THREE.BoxGeometry;
fa('sneaker',new BX(0.54,0.28,0.9),shoeM,X,0.14,0.14);
fa('sneaker',new BX(0.5,0.08,0.84),M(0xffffff),X,0.03,0.14);
fa('boot',new C(0.37,0.34,0.8,6),shoeM,X,0.5,0);
fa('boot',new BX(0.54,0.26,0.9),shoeM,X,0.13,0.14);
fa('boot',new BX(0.58,0.08,0.94),M(0x2b2b36),X,0.04,0.14);
fa('boot',new C(0.38,0.38,0.06,6),M(0x2b2b36),X,0.9,0);
fa('sandal',new BX(0.46,0.16,0.82),skin,X,0.13,0.14);
fa('sandal',new BX(0.52,0.06,0.9),shoeM,X,0.03,0.14);
fa('sandal',new BX(0.5,0.08,0.1),shoeM,X,0.18,0.0);
fa('sandal',new BX(0.5,0.08,0.1),shoeM,X,0.18,0.38);
fa('bare',new BX(0.46,0.2,0.84),skin,X,0.1,0.14);
fa('heel',new BX(0.44,0.18,0.85),shoeM,X,0.2,0.12);
fa('heel',new BX(0.46,0.06,0.5),M(0x2b2b36),X,0.03,0.3);
fa('heel',new BX(0.1,0.2,0.1),M(0x2b2b36),X,0.1,-0.22);
fa('dress',new BX(0.5,0.26,0.95),M(0x2b2b36),X,0.13,0.17);
fa('dress',new BX(0.52,0.06,0.97),M(0x15131f),X,0.03,0.17);
add(g,new C(0.27,0.3,0.22,6),M(0xffffff),s*0.34,1.75,0);
});
const shorts=add(g,new C(0.66,0.7,0.8,8),shortsM,0,2.0,0,{s:[1,1,0.72]});
const hip=add(g,new C(0.66,0.64,0.5,8),shortsM,0,2.15,0,{s:[1,1,0.72]});
const skirt=add(g,new C(0.62,1.05,0.75,10),shortsM,0,1.9,0,{s:[1,1,0.85]});
add(g,new C(0.68,0.68,0.1,8),M(0xf2c94c),0,2.38,0,{s:[1,1,0.72]});
const torso=add(U,new C(0.62,0.58,1.4,8),shirtM,0,1.05,0,{s:[1,1,0.68]});
add(U,new C(0.15,0.17,0.35,6),skin,0,1.85,0);
const hood=add(U,new THREE.TorusGeometry(0.3,0.12,5,8),shirtM,0,1.82,-0.08,{r:[Math.PI/2,0,0]});
const collar=add(U,new THREE.TorusGeometry(0.23,0.06,5,10),M(0xffffff),0,1.8,0.02,{r:[Math.PI/2,0,0]});
const tieM=M(0xc2455f),tie=grp(U);add(tie,new THREE.BoxGeometry(0.1,0.5,0.04),tieM,0,1.45,0.43);add(tie,new THREE.BoxGeometry(0.14,0.1,0.05),tieM,0,1.72,0.43);
function arm(s){
const sh=new THREE.Group();sh.position.set(s*0.84,1.6,0);U.add(sh);
const sl1=add(sh,new C(0.26,0.3,0.55,6),shirtM,0,-0.15,0),sl2=add(sh,new I(0.3,0),shirtM,0,0.02,0);const skSh=add(sh,new I(0.2,0),skin,0,0,0);
add(sh,new C(0.17,0.15,0.7,6),skin,0,-0.5,0);
const ls1=add(sh,new C(0.21,0.19,0.85,6),shirtM,0,-0.55,0);
const el=new THREE.Group();el.position.y=-0.75;sh.add(el);
add(el,new C(0.15,0.12,0.7,6),skin,0,-0.35,0);
const ls2=add(el,new C(0.18,0.16,0.62,6),shirtM,0,-0.32,0);
add(el,new I(0.18,0),skin,0,-0.78,0,{s:[1,1.2,0.8]});
return {sh,el,ls:[ls1,ls2],sl:[sl1,sl2],skSh,s}}
const AR=arm(1),AL=arm(-1);
const headMesh=add(H,new I(0.85,1),skin,0,hy(4.7),0,{s:[0.95,1.05,0.95]});
add(H,new I(0.93,1),hairM,0,hy(4.85),-0.2,{s:[1,1.02,1]});
const ahoge=add(H,new K(0.1,0.55,4),hairM,0,hy(5.8),0.05,{r:[0.2,0,-0.2]});
const fL=grp(H),fS=grp(H),spk=grp(H),clip=grp(H),bL=grp(H),bB=grp(H),pig=grp(H),pony=grp(H);
const sway=[],pinkM=M(0xf08aa8);
const swy=(m,ax,base,amp,ph)=>{sway.push([m,ax,base,amp,ph]);return m};
swy(add(bL,new K(0.78,2.0,6),hairM,0,hy(3.85),-0.55,{r:[0,0,Math.PI]}),'x',0,0.05,0);
add(bB,new K(0.85,1.2,6),hairM,0,hy(4.3),-0.5,{r:[0,0,Math.PI]});
swy(add(pony,new K(0.35,1.8,5),hairM,0,hy(4.3),-1.28,{r:[Math.PI+0.5,0,0]}),'x',Math.PI+0.5,0.1,0);
add(pony,new I(0.16,0),pinkM,0,hy(5.1),-0.85);
add(fL,new K(0.26,0.8,4),hairM,0,hy(5.3),0.64,{r:[0.2,0,Math.PI]});
add(clip,new THREE.OctahedronGeometry(0.13,0),M(0xf2c94c),0.58,hy(5.1),0.55);
[[-0.5,5.6,0.35],[0,5.72,0.45],[0.5,5.6,0.35],[-0.3,5.75,-0.1],[0.3,5.75,-0.1]].forEach(([x,y,z])=>add(spk,new K(0.3,0.75,4),hairM,x,hy(y),z,{r:[0.25,0,-x*0.4]}));
[-0.36,0.1,0.42].forEach(x=>add(fS,new K(0.2,0.5,4),hairM,x,hy(5.28),0.66,{r:[0.2,0,Math.PI]}));
const eyes=[],blush=[],brows=[],elfEars=[],glasses=grp(H);
[-1,1].forEach(s=>{
swy(add(bL,new K(0.27,1.6,4),hairM,s*0.88,hy(4.0),0.05,{r:[0,0,Math.PI]}),'z',Math.PI,0.06*s,s);
swy(add(bB,new K(0.27,0.9,4),hairM,s*0.88,hy(4.35),0.05,{r:[0,0,Math.PI]}),'z',Math.PI,0.06*s,s);
swy(add(pig,new K(0.3,1.6,5),hairM,s*1.15,hy(4.22),-0.05,{r:[0,0,Math.PI+s*0.25]}),'z',Math.PI+s*0.25,0.08,s);
add(pig,new I(0.15,0),pinkM,s*0.95,hy(5.0),-0.05);
add(fL,new K(0.25,0.75,4),hairM,s*0.55,hy(5.3),0.6,{r:[0.2,0,Math.PI+s*0.35]});
brows.push(add(H,new THREE.BoxGeometry(0.28,0.05,0.04),M(0x3a2d6b),s*0.34,hy(5.03),0.73,{r:[0,s*0.3,s*0.12]}));
blush.push(add(H,new THREE.CircleGeometry(0.12,6),new THREE.MeshBasicMaterial({color:0xff9aa8,transparent:true,opacity:0.55}),s*0.52,hy(4.35),0.6,{r:[0,s*0.7,0]}));
const e=new THREE.Group();e.position.set(s*0.31,hy(4.62),0.8);e.rotation.y=s*0.25;
const part=(r,mat,z)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(r,6),mat);m.scale.y=1.35;m.position.z=z;e.add(m)};
part(0.2,B(0xffffff),0);part(0.15,irisM,0.01);part(0.08,B(0x1d3b6b),0.02);const lash=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.07),B(0x2a2540));lash.position.set(0,0.29,0.03);e.add(lash);
const h=new THREE.Mesh(new THREE.CircleGeometry(0.05,5),B(0xffffff));h.position.set(-0.06,0.1,0.03);e.add(h);
H.add(e);eyes.push(e);
add(glasses,new THREE.TorusGeometry(0.25,0.03,4,8),M(0x2a2540),s*0.36,hy(4.62),0.82,{r:[0,s*0.25,0]});add(glasses,new THREE.BoxGeometry(0.03,0.03,0.85),M(0x2a2540),s*0.71,hy(4.66),0.4,{r:[0,-s*0.27,0]});
elfEars.push(add(H,new K(0.15,0.6,4),skin,s*0.84,hy(4.75),0,{r:[0,0,-s*1.05]}));
});
add(glasses,new THREE.BoxGeometry(0.16,0.03,0.03),M(0x2a2540),0,hy(4.66),0.85);
const smile=add(H,new THREE.TorusGeometry(0.14,0.022,4,6,Math.PI),B(0xd9606a),0,hy(4.3),0.72,{r:[0,0,Math.PI]});
const mouth=add(H,new THREE.CircleGeometry(0.09,6),B(0x8a2a3a),0,hy(4.22),0.72);mouth.visible=false;
const fhM=M(0x3b2a1e),mus=grp(H),beard=grp(H);
[-1,1].forEach(sd=>{add(mus,new I(0.1,0),fhM,sd*0.1,hy(4.42),0.7,{s:[1.7,0.5,0.6],r:[0,0,sd*0.25]});
add(beard,new I(0.22,0),fhM,sd*0.5,hy(4.2),0.4,{s:[0.8,1.5,0.7]})});
add(beard,new I(0.3,0),fhM,0,hy(3.98),0.55,{s:[1.2,0.8,0.7]});
mus.visible=false;beard.visible=false;
const cap=grp(H);
add(cap,new THREE.SphereGeometry(1.0,8,5,0,Math.PI*2,0,Math.PI/2),accM,0,hy(4.95),-0.05);
add(cap,new THREE.BoxGeometry(0.95,0.07,0.65),accM,0,hy(5.15),0.95);
const wiz=grp(H);
add(wiz,new K(0.85,1.9,6),accM,0,hy(6.2),-0.05,{r:[-0.15,0,0]});
add(wiz,new C(1.35,1.35,0.07,10),accM,0,hy(5.3),0);
let eyeKx=1,eyeKy=1,browK=1;
const S={gset:false,shoe:'sneaker',style:'long',gender:'girl',top:'tee',bottom:'shorts',cap:false,wiz:false,glasses:false,elf:false};
function apply(){
const boy=S.gender==='boy',hd=S.top==='hood',hat=S.cap||S.wiz,st=S.style;
const sk=S.bottom==='skirt';
fL.visible=!hat&&(st==='long'||st==='pig'||st==='pony'||st==='bob');
fS.visible=!hat&&(st==='spiky'||st==='neat');
spk.visible=!hat&&st==='spiky';
clip.visible=!hat&&!boy&&(st==='long'||st==='pig'||st==='pony'||st==='bob');
bL.visible=st==='long';bB.visible=st==='bob';pig.visible=st==='pig';pony.visible=st==='pony';
blush.forEach(b=>b.visible=!boy);
brows.forEach(b=>b.scale.y=browK*(boy?1.4:1));
torso.scale.set((boy?1.15:1)*(hd?1.1:1),1,0.68*(hd?1.12:1));
[AR,AL].forEach(a=>{a.sh.position.x=a.s*(0.84*(boy?1.1:1)+(hd?0.05:0));a.ls.forEach(l=>l.visible=hd||S.top==='shirt');a.sl.forEach(l=>l.visible=S.top!=='tank');a.skSh.visible=S.top==='tank'});collar.visible=S.top==='shirt';tie.visible=S.top==='shirt';
hood.visible=hd;
const pn=S.bottom==='pants';for(const k in foot)foot[k].forEach(m=>m.visible=S.shoe===k);
shorts.visible=!sk&&!pn;hip.visible=pn;skirt.visible=sk;pantsLegs.forEach(p=>p.visible=S.bottom==='pants');
cap.visible=S.cap;wiz.visible=S.wiz;glasses.visible=S.glasses;elfEars.forEach(e=>e.visible=S.elf);
ahoge.visible=!hat}
const btns={};
const pick=(arr,i)=>arr.forEach((b,j)=>b.classList.toggle('on',j===i));
function seg(id,list,fn){const el=document.getElementById(id),arr=[];list.forEach(([l,v],i)=>{const b=document.createElement('button');b.className='seg'+(i?'':' on');b.textContent=l;b.onclick=()=>{pick(arr,i);pop();fn(v);apply()};el.appendChild(b);arr.push(b)});return arr}
function sw(id,list,fn){const el=document.getElementById(id);list.forEach((c,i)=>{const b=document.createElement('button');b.className='sw'+(i?'':' on');b.style.background=c;b.setAttribute('aria-label',c);b.onclick=()=>{el.querySelectorAll('.sw').forEach(x=>x.classList.remove('on'));b.classList.add('on');pop();fn(c)};el.appendChild(b)})}
function tog(key,label){const b=document.createElement('button');b.className='seg';b.textContent=label;b.onclick=()=>{pop();S[key]=!S[key];if(S[key]&&key==='cap'){S.wiz=false;btns.wiz.classList.remove('on')}if(S[key]&&key==='wiz'){S.cap=false;btns.cap.classList.remove('on')}b.classList.toggle('on',S[key]);apply()};btns[key]=b;document.getElementById('accs').appendChild(b)}
const gBtns=seg('gender',[['Qiz','girl'],['Yigit','boy']],v=>{S.gender=v;S.gset=true;if(!S.styleSet){S.style=v==='boy'?'spiky':'long';pick(stBtns,v==='boy'?4:0)}if(wardG!==v)buildWardrobe();unlockClothes()});
gBtns.forEach(b=>b.classList.remove('on'));
const stBtns=seg('style',[['Uzun','long'],['Ikki dum','pig'],['Dum','pony'],["Bo\u02BBb",'bob'],['Qisqa','spiky'],['Silliq','neat']],v=>{S.style=v;S.styleSet=true});
sw('skin',['#ffdcc6','#f6c8a0','#d9a67a','#b57a52','#8a5a3a','#5e3b26'],c=>skin.color.set(c));
sw('hair',['#6a52b8','#2b2b36','#d9a441','#c2455f','#3fa37a','#7a4a2a'],c=>hairM.color.set(c));
sw('eye',['#3a9be0','#3fa37a','#a05cd6','#c98a3a'],c=>irisM.color.set(c));
const WARD={
girl:{title:'\u{1F457} Ayollar kiyimi',tops:[['Mayka','tee'],['Xudi','hood'],['Top','tank']],bottoms:[['Shorti','shorts'],['Shim','pants'],['Yubka','skirt']],shoes:[['Krossovka','sneaker'],['Etik','boot'],['Tufli','heel'],['Sandal','sandal'],['Yalangoyoq','bare']],shirt:['#f4f6fb','#f08aa8','#c2455f','#8b74e0','#f2c94c','#7bc67e'],pants:['#2f5fa8','#2b2b36','#c2455f','#8b74e0','#f2c94c'],shoeC:['#f08aa8','#ffffff','#2b2b36','#8b74e0','#f2c94c']},
boy:{title:'\u{1F454} Erkaklar kiyimi',tops:[['Mayka','tee'],['Xudi','hood'],["Ko\u02BBylak",'shirt']],bottoms:[['Shorti','shorts'],['Shim','pants']],shoes:[['Krossovka','sneaker'],['Etik','boot'],['Klassik','dress'],['Yalangoyoq','bare']],shirt:['#f4f6fb','#4aa3df','#2b2b36','#3f7d4f','#ef6a6a','#8b6b4a'],pants:['#2f5fa8','#2b2b36','#6b4a2f','#3f7d4f','#7a7f8a'],shoeC:['#ffffff','#2b2b36','#4aa3df','#6b4a2f','#c2455f']}};
let wardG='girl',bBtns=[];
function buildWardrobe(){const W=WARD[S.gender];wardG=S.gender;
['top','bottom','shoeType','shirt','pants','shoes'].forEach(id=>document.getElementById(id).innerHTML='');
seg('top',W.tops,v=>S.top=v);bBtns=seg('bottom',W.bottoms,v=>S.bottom=v);seg('shoeType',W.shoes,v=>S.shoe=v);
sw('shirt',W.shirt,c=>shirtM.color.set(c));sw('pants',W.pants,c=>shortsM.color.set(c));sw('shoes',W.shoeC,c=>shoeM.color.set(c));
S.top='tee';S.bottom='shorts';S.shoe='sneaker';shirtM.color.set(W.shirt[0]);shortsM.color.set(W.pants[0]);shoeM.color.set(W.shoeC[0]);
document.querySelectorAll('.wt').forEach(x=>x.textContent=W.title);apply()}
function unlockClothes(){document.querySelectorAll('.sq.lock').forEach(b=>b.classList.remove('lock'))}
buildWardrobe();
tog('cap','Kepka');tog('wiz','Sehrgar shlyapasi');tog('glasses',"Ko\u02BBzoynak");tog('elf','Elf quloqlari');
sw('acc',['#d9606a','#4aa3df','#2b2b36','#f2c94c','#7bc67e','#8b74e0'],c=>accM.color.set(c));
let customMsg=null;
let NAME=null;try{NAME=localStorage.getItem('avatarName')||null}catch(e){}
let PROFESSION=null;try{PROFESSION=localStorage.getItem('avatarProfession')||null}catch(e){}
const msg=n=>customMsg||(n==='hello'&&NAME?'Salom! Mening ismim '+NAME+". Men sizning o\u02BBquv do\u02BBstingizman!":say[n]);
let AC=null,soundOn=true;
function ac(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}return AC}
function tone(f,d,type,v,at,slide){const a=ac();if(!a||a.state!=='running')return;const o=a.createOscillator(),gn=a.createGain(),t=a.currentTime+(at||0);o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,t+d);gn.gain.setValueAtTime(v||0.12,t);gn.gain.exponentialRampToValueAtTime(0.001,t+d);o.connect(gn);gn.connect(a.destination);o.start(t);o.stop(t+d)}
function pop(){if(soundOn)tone(620,0.07,'triangle',0.07)}
function pickVoice(){if(!('speechSynthesis' in window))return null;const vs=speechSynthesis.getVoices();return vs.find(v=>/^uz/i.test(v.lang))||vs.find(v=>/^tr/i.test(v.lang))||null}
function vinfo(){const v=pickVoice(),el=document.getElementById('vinfo');el.textContent=!soundOn?'':v?(/^uz/i.test(v.lang)?"Ovoz: o\u02BBzbek tilida gapiradi.":"Qurilmada o\u02BBzbek ovozi yo\u02BBq, turk tili ovozi ishlatilmoqda."):'Qurilmada nutq ovozi topilmadi, oddiy ovoz effektlari ishlatiladi.'}
function sfx(n){ac();const v=pickVoice(),boy=S.gender==='boy';
if(v){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(msg(n).replace(/\u02BB/g,"'"));u.voice=v;u.lang=v.lang;u.pitch=boy?0.8:1.5;speechSynthesis.speak(u)}
else if(n!=='jump'){const base=boy?170:300;for(let i=0;i<10;i++)tone(base*(0.8+Math.random()*0.7),0.07,'square',0.06,i*0.2)}
if(n==='jump'){tone(220,0.35,'sine',0.18,0,3);tone(220,0.35,'sine',0.18,0.85,3)}
vinfo()}
if('speechSynthesis' in window)speechSynthesis.onvoiceschanged=vinfo;
document.getElementById('snd').onclick=e=>{soundOn=!soundOn;e.target.classList.toggle('on',soundOn);e.target.textContent='Ovoz: '+(soundOn?'yoqilgan':"o\u02BBchirilgan");if(!soundOn&&'speechSynthesis' in window)speechSynthesis.cancel();else pop();vinfo()};
const cur={aR:0.08,eR:0.1,aL:-0.08,eL:-0.1,bow:0,hz:0,hx:0,hy:0,jump:0};
const spd={eR:30,eL:30,jump:28};
let act=null,t0=0,talk=false,now=0;
const say={hello:"Salom! Men sizning o\u02BBquv do\u02BBstingizman!",bye:'Xayr, tez orada ko\u02BBrishamiz!',jump:"Yupiii! O\u02BBynaymizmi?"};
function play(n,auto,text){customMsg=text||null;act=n;t0=now;bub.textContent=msg(n);bub.style.opacity=1;if(soundOn&&!auto)sfx(n)}
[['hello','Salom'],['bye','Xayr'],['jump','Sakrash']].forEach(([n,l])=>{const b=document.createElement('button');b.className='act';b.textContent=l;b.onclick=()=>play(n);document.getElementById('acts').appendChild(b)});
let zoom=1,baseD=13,camD=13,camL=3,sheetOpen=false,openCat=null;
const sheet=document.getElementById('sheet'),shT=document.getElementById('shT');
const FOC={name:[3.0,13],profession:[3.0,13],gender:[3.0,13],skin:[4.0,9],hair:[4.9,6.5],eye:[4.7,5],top:[3.2,8],bottom:[1.7,8],shoes:[0.6,6],acc:[4.9,7],act:[3.0,13]};
const CATS={name:['\u270F\uFE0F','Ism'],profession:['\u{1F4BC}','Kasb'],gender:['\u{1F9CD}','Jins'],skin:['\u{1F3A8}','Teri'],hair:['\u{1F487}','Soch'],eye:['\u{1F441}','Ko\u02BBz'],top:['\u{1F455}','Ustki'],bottom:['\u{1F456}','Pastki'],shoes:['\u{1F45F}','Poyabzal'],acc:['\u{1F3A9}','Aksessuar'],act:['\u{1F44B}','Harakat']};
function hint(t){bub.textContent=t;bub.style.opacity=1;clearTimeout(hint.t);hint.t=setTimeout(()=>{if(!act)bub.style.opacity=0},2600)}
function setCat(k){if(!S.gset&&(k==='top'||k==='bottom'||k==='shoes')){hint('Kiyim tanlash uchun avval jinsni tanlang');if(openCat==='gender')return;k='gender'}zoom=1;openCat=openCat===k?null:k;document.querySelectorAll('.sq').forEach(b=>b.classList.toggle('on',b.dataset.k===openCat));document.querySelectorAll('.sec').forEach(x=>x.classList.toggle('on',x.dataset.k===openCat));sheetOpen=!!openCat;sheet.classList.toggle('open',sheetOpen);if(openCat)shT.textContent=CATS[openCat][1]}
[['barl',['gender','skin','hair','eye']],['barr',['top','bottom','shoes','acc','profession','act']]].forEach(([id,ks])=>{const bar=document.getElementById(id);ks.forEach(k=>{const b=document.createElement('button');b.className='sq'+(!S.gset&&['top','bottom','shoes'].includes(k)?' lock':'');b.dataset.k=k;b.innerHTML='<span>'+CATS[k][0]+'</span>'+CATS[k][1];b.onclick=()=>{pop();setCat(k)};bar.appendChild(b)})});
const nIn=document.getElementById('nameIn'),nForm=document.getElementById('nameForm'),nConf=document.getElementById('nameConf'),nLock=document.getElementById('nameLock'),ntag=document.getElementById('ntag'),ptag=document.getElementById('ptag'),nMsg=document.getElementById('nameMsg');
const nBanner=document.getElementById('nameBanner'),nLockMsg=document.getElementById('nameLockMsg');
const pBanner=document.getElementById('profBanner'),pPresets=document.getElementById('profPresets'),pIn=document.getElementById('profIn'),pGo=document.getElementById('profGo'),pMsg=document.getElementById('profMsg');
const PRESET_PROFS=['Biolog \u{1F9EC}','Shifokor \u{1FA7A}','Dasturchi \u{1F4BB}','Olim \u{1F52C}',"O\u02BBqituvchi \u{1F468}\u200D\u{1F3EB}",'Muhandis \u2699\uFE0F','Kosmonavt \u{1F680}','Tadbirkor \u{1F4BC}','Rassom \u{1F3A8}','Sportchi \u26BD'];
let META={isSaved:false,mandatory:false,name:'',profession:'',savedAtXp:0,unlockStepXp:200,userXp:0,role:'student'};
function getIdentityState(){
  const isSaved=!!META.isSaved;
  const role=META.role||'student';
  const savedAt=Number(META.savedAtXp)||0;
  const step=Number(META.unlockStepXp)||200;
  const xp=Number(META.userXp)||0;
  const needed=savedAt+step;
  const remaining=Math.max(0,needed-xp);
  const canEdit=!isSaved||role!=='student'||xp>=needed;
  const unlockedByXp=isSaved&&xp>=needed;
  return {isSaved,role,savedAt,step,xp,needed,remaining,canEdit,unlockedByXp};
}
let pendingName='';
function updateTag(){
  const st=getIdentityState();
  ntag.textContent=NAME?(NAME+(st.canEdit?'':' \u{1F512}')):"Ism qo\u02BByish \u270F\uFE0F";
  ptag.textContent=PROFESSION?PROFESSION:"Kasb tanlash \u{1F4BC}";
}
const profBtns=[];
PRESET_PROFS.forEach(label=>{
  const b=document.createElement('button');
  b.className='seg';
  b.textContent=label;
  b.onclick=()=>{
    const st=getIdentityState();
    if(!st.canEdit)return;
    pop();
    PROFESSION=label;
    try{localStorage.setItem('avatarProfession',PROFESSION)}catch(e){}
    pIn.value='';
    pMsg.textContent='Tanlangan kasb: '+PROFESSION;
    syncIdentity();
  };
  pPresets.appendChild(b);
  profBtns.push(b);
});
function syncIdentity(){
  const st=getIdentityState();
  const lockTxt="Ism va kasbni o\u02BBzgartirish uchun yana "+st.remaining+" XP to\u02BBplang ("+st.xp+"/"+st.needed+" XP) \u{1F512}";
  const okTxt="Tabriklaymiz! "+st.step+" XP to\u02BBpladingiz \u2014 ism va kasbni o\u02BBzgartirishingiz mumkin! \u{1F513}";
  if(st.canEdit){
    nForm.style.display='block';
    nConf.style.display='none';
    nLock.style.display='none';
    nIn.disabled=false;
    if(NAME&&!nIn.value)nIn.value=NAME;
    nMsg.textContent='2 dan 16 gacha belgi.';
  }else{
    nForm.style.display='none';
    nConf.style.display='none';
    nLock.style.display='block';
    document.getElementById('nameShow').textContent=NAME||'Belgilanmagan';
    nLockMsg.textContent=lockTxt;
  }
  if(st.unlockedByXp){
    nBanner.style.display='block';nBanner.className='xp-ok';nBanner.textContent=okTxt;
    pBanner.style.display='block';pBanner.className='xp-ok';pBanner.textContent=okTxt;
  }else if(!st.canEdit){
    nBanner.style.display='none';
    pBanner.style.display='block';pBanner.className='xp-lock';pBanner.textContent=lockTxt;
  }else{
    nBanner.style.display='none';
    pBanner.style.display='none';
  }
  profBtns.forEach(b=>{
    b.classList.toggle('on',b.textContent===PROFESSION);
    b.disabled=!st.canEdit;
  });
  pIn.disabled=!st.canEdit;
  pGo.disabled=!st.canEdit;
  if(PROFESSION&&!PRESET_PROFS.includes(PROFESSION)&&!pIn.value){pIn.value=PROFESSION}
  if(typeof closeBtn!=='undefined'&&closeBtn){closeBtn.style.display=META.mandatory?'none':'flex'}
  updateTag();
}
ntag.onclick=()=>{pop();if(openCat!=='name')setCat('name')};
ptag.onclick=()=>{pop();if(openCat!=='profession')setCat('profession')};
pGo.onclick=()=>{
  const st=getIdentityState();
  if(!st.canEdit)return;
  const v=pIn.value.trim().replace(/\\s+/g,' ');
  if(v.length<2||v.length>24){pMsg.textContent="Kasb nomi 2 dan 24 gacha belgi bo\u02BBlishi kerak.";return}
  pop();
  PROFESSION=v;
  try{localStorage.setItem('avatarProfession',PROFESSION)}catch(e){}
  pMsg.textContent='Tanlangan kasb: '+PROFESSION;
  syncIdentity();
};
document.getElementById('nameGo').onclick=()=>{const st=getIdentityState();if(!st.canEdit)return;const v=nIn.value.trim().replace(/\\s+/g,' ');if(!/^[\\p{L}\\p{N}\u02BB\u02BC'' -]{2,16}$/u.test(v)){nMsg.textContent="Ism 2 dan 16 gacha belgi bo\u02BBlishi kerak (harf, raqam yoki probel).";return}pendingName=v;nMsg.textContent='';nForm.style.display='none';nConf.style.display='block';document.getElementById('nameAsk').textContent='Ism \u00AB'+v+'\u00BB bo\u02BBladi. Tasdiqlaysizmi?'};
document.getElementById('nameNo').onclick=()=>{nConf.style.display='none';nForm.style.display='block';nMsg.textContent='2 dan 16 gacha belgi.'};
document.getElementById('nameYes').onclick=()=>{const st=getIdentityState();if(!st.canEdit)return;NAME=pendingName;try{localStorage.setItem('avatarName',NAME)}catch(e){}syncIdentity();pop();setCat('name');play('hello')};
syncIdentity();
document.getElementById('shX').onclick=()=>{if(openCat)setCat(openCat)};
[['\uFF0B',"Yaqinlashtirish",()=>zoom=zc(zoom*0.8)],['\uFF0D',"Uzoqlashtirish",()=>zoom=zc(zoom*1.25)],['\u27F2',"Asl holat",()=>zoom=1]].forEach(([t,l,fn])=>{const b=document.createElement('button');b.className='sq zb';b.textContent=t;b.setAttribute('aria-label',l);b.onclick=()=>{pop();fn()};document.getElementById('barl').appendChild(b)});
function target(t){
const T={aR:0.08,eR:0.1,aL:-0.08,eL:-0.1,bow:0,hz:Math.sin(t*1.2)*0.03,hx:0,hy:0,jump:0};talk=false;
if(act){const a=t-t0;
if(act==='hello'){if(a>3.2)end();else{T.aR=2.5;T.eR=Math.sin(a*11)*0.55+0.2;T.hz=0.12;T.hy=-0.12;talk=true}}
else if(act==='bye'){if(a>3.6)end();else if(a<2){T.aR=2.5;T.eR=Math.sin(a*11)*0.55+0.2;T.hz=0.1;talk=true}else{const k=Math.sin(Math.PI*Math.min(1,(a-2)/1.4));T.bow=0.6*k;T.hx=0.35*k}}
else if(act==='jump'){if(a>1.7)end();else{T.jump=Math.abs(Math.sin(a*Math.PI/0.85))*0.9;T.aR=2.4;T.aL=-2.4;T.eR=0.15;T.eL=-0.15;T.hz=0;talk=true}}}
return T}
function end(){act=null;bub.style.opacity=0}
let ry=0.4,drag=false,lx=0,idle=true,last=0;
const ptr=new Map();let pd=0;
const zc=z=>Math.max(0.45,Math.min(1.8,z));
box.addEventListener('pointerdown',e=>{ptr.set(e.pointerId,[e.clientX,e.clientY]);drag=true;lx=e.clientX;idle=false;box.setPointerCapture(e.pointerId);if(ptr.size===2){const [a,b]=[...ptr.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1])}});
box.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,[e.clientX,e.clientY]);if(ptr.size>=2){const [a,b]=[...ptr.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd&&d)zoom=zc(zoom*pd/d);pd=d}else if(drag){ry+=(e.clientX-lx)*0.012;lx=e.clientX}});
const up=e=>{ptr.delete(e.pointerId);pd=0;if(ptr.size===1){lx=[...ptr.values()][0][0]}else if(!ptr.size){drag=false;setTimeout(()=>{if(!drag&&!act)idle=true},2500)}};
box.addEventListener('pointerup',up);box.addEventListener('pointercancel',up);
box.addEventListener('wheel',e=>{e.preventDefault();zoom=zc(zoom*Math.exp(e.deltaY*0.001))},{passive:false});
function fit(){const w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;rend.setSize(w,h);cam.aspect=w/h;baseD=w/h<0.8?17:13;cam.updateProjectionMatrix()}
addEventListener('resize',fit);new ResizeObserver(fit).observe(box);fit();apply();

// Save button
const saveBtn=document.createElement('button');
saveBtn.className='sq';
saveBtn.innerHTML='<span>\u{1F4BE}</span>Saqlash';
saveBtn.style.background='#F06413';
saveBtn.style.color='#fff';
saveBtn.style.borderColor='#F06413';
function getConfig(){
  return {
    name:NAME||'',
    profession:PROFESSION||'',
    gender:S.gender,
    style:S.style,
    top:S.top,
    bottom:S.bottom,
    shoe:S.shoe,
    cap:S.cap,
    wiz:S.wiz,
    glasses:S.glasses,
    elf:S.elf,
    colors:{
      skin:'#'+skin.color.getHexString(),
      hair:'#'+hairM.color.getHexString(),
      eyes:'#'+irisM.color.getHexString(),
      shirt:'#'+shirtM.color.getHexString(),
      pants:'#'+shortsM.color.getHexString(),
      shoes:'#'+shoeM.color.getHexString(),
      acc:'#'+accM.color.getHexString()
    }
  };
}
function syncTypedIdentityInputs(){
  const st=getIdentityState();
  if(!st.canEdit)return;
  if(!NAME&&nIn&&nIn.value.trim().length>=2){
    NAME=nIn.value.trim().replace(/\\s+/g,' ').slice(0,16);
    try{localStorage.setItem('avatarName',NAME)}catch(e){}
  }
  if(!PROFESSION&&pIn&&pIn.value.trim().length>=2){
    PROFESSION=pIn.value.trim().replace(/\\s+/g,' ').slice(0,24);
    try{localStorage.setItem('avatarProfession',PROFESSION)}catch(e){}
  }
  updateTag();
}
saveBtn.onclick=()=>{
  pop();
  syncTypedIdentityInputs();
  if(!NAME||NAME.trim().length<2){
    if(openCat!=='name')setCat('name');
    hint("Saqlashdan oldin qahramoningizga ism bering! \u270F\uFE0F");
    return;
  }
  if(!PROFESSION||PROFESSION.trim().length<2){
    if(openCat!=='profession')setCat('profession');
    hint("Saqlashdan oldin qahramoningiz kasbini tanlang! \u{1F4BC}");
    return;
  }
  floor.visible=false;
  rend.render(scene,cam);
  const dataUrl=rend.domElement.toDataURL('image/png');
  floor.visible=true;
  window.parent.postMessage({type:'AVATAR_SAVE',dataUrl,config:getConfig()},'*');
};
document.getElementById('barr').appendChild(saveBtn);

// Close button
var closeBtn=document.createElement('button');
closeBtn.className='sq';
closeBtn.innerHTML='<span>\u2715</span>Yopish';
closeBtn.onclick=()=>{
  if(META.mandatory)return;
  window.parent.postMessage({type:'AVATAR_CLOSE'},'*');
};
document.getElementById('barl').appendChild(closeBtn);

// Notify parent we are ready
window.parent.postMessage({type:'AVATAR_READY'},'*');



const hexOk = h => typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h);
const STYLES = ['long','pig','pony','bob','spiky','neat'];

function addSw(id, hex, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelectorAll('.sw').forEach(x => x.classList.remove('on'));
  const b = document.createElement('button');
  b.className = 'sw on';
  b.style.background = hex;
  b.setAttribute('aria-label', hex);
  b.onclick = () => {
    el.querySelectorAll('.sw').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    fn(hex);
  };
  el.insertBefore(b, el.firstChild);
  fn(hex);
}

function applyFace(r) {
  const F = { round: [0.97, 1.02, 0.96], oval: [0.92, 1.08, 0.93], long: [0.88, 1.14, 0.92] };
  if (r.faceShape && F[r.faceShape]) headMesh.scale.set(...F[r.faceShape]);
  const es = { small: 0.85, normal: 1, large: 1.15 }[r.eyeSize] || 1;
  eyeKx = es;
  eyeKy = es * (r.eyeShape === 'almond' ? 0.8 : 1);
  browK = { thin: 0.7, normal: 1, thick: 1.6 }[r.brows] || 1;
  if (hexOk(r.hair)) {
    fhM.color.set(r.hair);
    brows.forEach(b => b.material.color.set(r.hair));
  }
  if (hexOk(r.lips)) smile.material.color.set(r.lips);
  const fh = r.facialHair;
  mus.visible = fh === 'mustache' || fh === 'beard';
  beard.visible = fh === 'beard';
  apply();
}

function applyScan(r) {
  if (hexOk(r.skin)) addSw('skin', r.skin, c => skin.color.set(c));
  if (hexOk(r.hair)) addSw('hair', r.hair, c => hairM.color.set(c));
  if (hexOk(r.eyes)) addSw('eye', r.eyes, c => irisM.color.set(c));
  const i = STYLES.indexOf(r.hairStyle);
  if (i >= 0 && stBtns[i]) stBtns[i].click();
  if (typeof r.glasses === 'boolean' && S.glasses !== r.glasses && btns.glasses) btns.glasses.click();
  if (r.hat === 'cap' && !S.cap && btns.cap) btns.cap.click();
  applyFace(r);
  play('jump', true, 'Yuzingizga moslashtirildi!');
}


// Listen for commands from parent
window.addEventListener('message', function(e) {
  if (!e.data || typeof e.data !== 'object') return;

  if (e.data.type === 'AVATAR_LOAD_CONFIG') {
    const c = e.data.config;
    if (c) {
      if (c.gender && (!S.gset || S.gender !== c.gender)) {
        const gi = c.gender === 'boy' ? 1 : 0;
        if (gBtns[gi]) gBtns[gi].click();
      }
      if (c.style) {
        const si = STYLES.indexOf(c.style);
        if (si >= 0 && stBtns[si]) stBtns[si].click();
      }
      if (c.cap && !S.cap && btns.cap) btns.cap.click();
      if (c.wiz && !S.wiz && btns.wiz) btns.wiz.click();
      if (c.glasses && !S.glasses && btns.glasses) btns.glasses.click();
      if (c.elf && !S.elf && btns.elf) btns.elf.click();
      if (c.colors) {
        if (c.colors.skin && hexOk(c.colors.skin)) skin.color.set(c.colors.skin);
        if (c.colors.hair && hexOk(c.colors.hair)) hairM.color.set(c.colors.hair);
        if (c.colors.eyes && hexOk(c.colors.eyes)) irisM.color.set(c.colors.eyes);
        if (c.colors.shirt && hexOk(c.colors.shirt)) shirtM.color.set(c.colors.shirt);
        if (c.colors.pants && hexOk(c.colors.pants)) shortsM.color.set(c.colors.pants);
        if (c.colors.shoes && hexOk(c.colors.shoes)) shoeM.color.set(c.colors.shoes);
        if (c.colors.acc && hexOk(c.colors.acc)) accM.color.set(c.colors.acc);
      }
      if (c.name && !NAME) NAME = c.name;
      if (c.profession && !PROFESSION) PROFESSION = c.profession;
    }
    if (e.data.avatarMeta && typeof e.data.avatarMeta === 'object') {
      META = Object.assign({}, META, e.data.avatarMeta);
      if (META.name) {
        NAME = META.name;
        try{localStorage.setItem('avatarName',NAME)}catch(err){}
      }
      if (META.profession) {
        PROFESSION = META.profession;
        try{localStorage.setItem('avatarProfession',PROFESSION)}catch(err){}
      }
    }
    syncIdentity();
  }

  if (e.data.type === 'AVATAR_APPLY_SCAN' && e.data.data) {
    applyScan(e.data.data);
  }

  if (e.data.type === 'AVATAR_TRIGGER_ACTION' && e.data.action) {
    play(e.data.action);
  }

  if (e.data.type === 'AVATAR_REQUEST_EXPORT') {
    syncTypedIdentityInputs();
    floor.visible = false;
    rend.render(scene, cam);
    const dataUrl = rend.domElement.toDataURL('image/png');
    floor.visible = true;
    window.parent.postMessage({ type: 'AVATAR_EXPORT_READY', dataUrl, config: getConfig() }, '*');
  }
});

setTimeout(()=>play('hello',true),700);
function loop(ms){requestAnimationFrame(loop);const t=ms/1000,dt=Math.min(0.05,t-last);last=t;now=t;
const T=target(t);
for(const k in cur)cur[k]+=(T[k]-cur[k])*Math.min(1,dt*(spd[k]||8));
AR.sh.rotation.z=cur.aR;AL.sh.rotation.z=cur.aL;AR.el.rotation.z=cur.eR;AL.el.rotation.z=cur.eL;
U.rotation.x=cur.bow;U.scale.y=1+Math.sin(t*2)*0.012;
H.rotation.set(cur.hx+Math.sin(t*1.5)*0.02,cur.hy,cur.hz);
g.position.y=cur.jump;floor.scale.setScalar(1-cur.jump*0.2);g.scale.y=1-Math.abs(cur.jump)*0.02;
const bl=(t%3.6)>3.48?0.1:1;eyes.forEach(e=>{e.scale.y=bl*eyeKy;e.scale.x=eyeKx;e.scale.z=eyeKx});
sway.forEach(([m,ax,b,a,p])=>m.rotation[ax]=b+a*Math.sin(t*1.7+p));ahoge.rotation.z=-0.2+Math.sin(t*2.2)*0.15;
smile.visible=!talk;mouth.visible=talk;if(talk)mouth.scale.y=0.4+Math.abs(Math.sin(t*14))*0.9;
if((act||openCat)&&idle){const tg=Math.round(ry/6.2832)*6.2832+0.1;ry+=(tg-ry)*Math.min(1,dt*4)}else if(idle)ry+=0.004;
g.rotation.y=ry;
const f=openCat?FOC[openCat]:[3.0,13],D=f[1]*baseD/13*zoom,L=openCat?f[0]-0.126*D:f[0],k=Math.min(1,dt*5);camD+=(D-camD)*k;camL+=(L-camL)*k;
cam.position.set(0,camL+0.04*camD,camD);cam.lookAt(0,camL,0);
rend.render(scene,cam)}
requestAnimationFrame(loop);
</script>
</body></html>`;
}

export default function AvatarCreator({
  isOpen = true,
  onClose,
  onSave,
  onReady,
  onExportReady,
  avatarMeta = null,
  inline = false,
  className = '',
  iframeRef: externalIframeRef,
}) {
  const iframeRef = useRef(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);

  // Load saved config from localStorage (computed once)
  const savedConfig = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('abdoraAvatarConfig') || 'null');
    } catch {
      return null;
    }
  }, []);

  // Create blob URL once on mount
  useEffect(() => {
    const html = getAvatarHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'AVATAR_READY') {
        setIframeReady(true);
        onReady?.(iframeRef.current);
        // Send saved config & avatarMeta
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'AVATAR_LOAD_CONFIG', config: savedConfig || null, avatarMeta: avatarMeta || null },
            '*'
          );
        }
      }

      if (e.data.type === 'AVATAR_EXPORT_READY') {
        onExportReady?.(e.data.dataUrl, e.data.config);
      }

      if (e.data.type === 'AVATAR_SAVE') {
        try {
          localStorage.setItem('abdoraAvatarConfig', JSON.stringify(e.data.config));
        } catch {
          // ignore storage errors
        }
        onSave?.(e.data.dataUrl, e.data.config);
        onClose?.();
      }

      if (e.data.type === 'AVATAR_CLOSE') {
        onClose?.();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSave, onClose, onReady, onExportReady, savedConfig, avatarMeta]);

  // Sync avatarMeta updates to iframe once ready
  useEffect(() => {
    if (iframeReady && avatarMeta && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'AVATAR_LOAD_CONFIG', config: null, avatarMeta },
        '*'
      );
    }
  }, [iframeReady, avatarMeta]);

  // Reset ready state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIframeReady(false);
    }
  }, [isOpen]);

  if (!inline && !isOpen) return null;

  const innerContent = (
    <div
      className={
        inline
          ? `relative w-full h-[620px] sm:h-[700px] rounded-2xl overflow-hidden shadow-sm border border-[var(--border)] bg-[var(--card)] ${className}`
          : "relative w-full h-full sm:w-[500px] sm:h-[720px] sm:max-h-[90vh] sm:rounded-2xl overflow-hidden shadow-2xl bg-[var(--card)]"
      }
    >
      {/* Loading spinner */}
      {!iframeReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--card)] z-10 gap-3">
          <div
            className="animate-spin rounded-full h-10 w-10 border-4 border-transparent"
            style={{ borderTopColor: '#F06413', borderRightColor: '#F06413' }}
          />
          <p className="text-sm font-medium opacity-70" style={{ color: 'var(--text-primary, var(--fg, #2a2540))' }}>
            3D Avatar yuklanmoqda…
          </p>
        </div>
      )}

      {/* iframe */}
      {blobUrl && (
        <iframe
          ref={(el) => {
            iframeRef.current = el;
            if (externalIframeRef) {
              if (typeof externalIframeRef === 'function') externalIframeRef(el);
              else externalIframeRef.current = el;
            }
          }}
          src={blobUrl}
          className="w-full h-full border-0"
          title="Avatar Creator"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => {
            setTimeout(() => setIframeReady(true), 500);
          }}
        />
      )}
    </div>
  );

  if (inline) {
    return innerContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {innerContent}
    </div>
  );
}
