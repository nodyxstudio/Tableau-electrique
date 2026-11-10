/* Tableau Malin · règles NF C 15-100 (logement)
 * Données de référence, calculs, rangement automatique et vérification.
 * Aucun accès au DOM : ce fichier est chargé par la page et testé avec Node (npm test). */
"use strict";
/* ================= Données de référence ================= */
const MOD=36, MOD_H=150, ROW_H=330, LEFT=44, TOP=84, MOD_Y=52;
const W={disj:1,id:2,para:2,cont:1,tl:1,sect:2,prise:3};
const MAXCAL={1.5:16,2.5:20,4:25,6:32,10:50,16:63};
const SECS=[1.5,2.5,4,6,10,16];
const CALS=[2,10,16,20,25,32,40,50,63];
const PTABLE=[[10,1.5,2250],[16,1.5,3500],[20,2.5,4500],[25,4,5750],[32,6,7250],[40,10,9200]];
const DIVTABLE=[[32,6],[40,10],[63,16]];
const KVA=[3,6,9,12,15,18];
const CIRC={
  eclairage:{n:'Éclairage',ic:'💡',sec:1.5,cal:16,cnt:'points lumineux',max:{1.5:8,2.5:8},p:500,ks:.7,lim:'8 points lumineux max'},
  prises:{n:'Prises 16 A',ic:'🔌',sec:2.5,cal:20,cnt:'socles',max:{1.5:5,2.5:12},p:2500,ks:.3,lim:'5 socles (1,5 mm²/16 A) · 12 socles (2,5 mm²/20 A)'},
  cuisine:{n:'Prises plan de travail',ic:'🥣',sec:2.5,cal:20,cnt:'socles',max:{2.5:6,4:6,6:6},p:3000,ks:.4,lim:'6 socles max, circuit dédié à la cuisine'},
  plaque:{n:'Plaque de cuisson',ic:'🍳',sec:6,cal:32,p:7200,ks:.6,A:true,lim:'1 appareil · différentiel type A'},
  four:{n:'Four',ic:'🥖',sec:2.5,cal:20,p:3000,ks:.6,lim:'1 appareil'},
  ll:{n:'Lave-linge',ic:'👕',sec:2.5,cal:20,p:2500,ks:.6,A:true,lim:'1 appareil · différentiel type A'},
  lv:{n:'Lave-vaisselle',ic:'🍽️',sec:2.5,cal:20,p:2300,ks:.6,lim:'1 appareil'},
  sl:{n:'Sèche-linge',ic:'🌀',sec:2.5,cal:20,p:2800,ks:.6,lim:'1 appareil'},
  congel:{n:'Congélateur',ic:'🧊',sec:2.5,cal:20,p:300,ks:1,lim:'1 appareil (conseillé)'},
  ce:{n:'Chauffe-eau',ic:'🚿',sec:2.5,cal:20,p:3000,ks:1,lim:'1 appareil · contacteur si heures creuses'},
  chauffage:{n:'Chauffage',ic:'♨️',ptab:true,sec:1.5,cal:16,p:3000,ks:1,lim:'selon la puissance (≤ 3 500 W en 1,5 mm²/16 A)'},
  clim:{n:'Climatisation',ic:'❄️',ptab:true,sec:1.5,cal:16,p:1200,ks:1,recA:true,lim:'selon la puissance électrique absorbée'},
  pac:{n:'Pompe à chaleur',ic:'🌡️',ptab:true,sec:2.5,cal:20,p:3500,ks:1,recA:true,lim:'selon la puissance électrique absorbée'},
  vmc:{n:'VMC',ic:'🌬️',sec:1.5,cal:2,p:60,ks:1,lim:'disjoncteur 2 A dédié'},
  volets:{n:'Volets roulants',ic:'🪟',sec:1.5,cal:16,p:600,ks:.3,lim:'circuit dédié conseillé'},
  irve:{n:'Borne de recharge 7,4 kW',ic:'🚗',sec:10,cal:40,p:7400,ks:1,irve:true,lim:'différentiel 30 mA type A ou F à elle seule'},
  prv:{n:'Prise renforcée VE',ic:'🔋',sec:2.5,cal:20,p:3700,ks:1,irve:true,lim:'différentiel 30 mA type A ou F à elle seule'},
  ext:{n:'Extérieur / portail',ic:'🌳',sec:2.5,cal:20,p:1000,ks:.3,lim:'prises et éclairage extérieurs'},
  com:{n:'Tableau de communication',ic:'📡',sec:1.5,cal:16,p:100,ks:1,lim:'circuit dédié (box, réseau)'},
  autre:{n:'Autre circuit',ic:'⚡',sec:2.5,cal:20,p:1000,ks:.5,lim:'à préciser'},
  div:{n:'Départ tableau divisionnaire',ic:'🗄️',sec:10,cal:40,p:0,ks:1,lim:'section selon le calibre du départ'}
};
const BR={
  generic:{name:'Générique',gD:'',gI:'',gC:'',short:'',lever:'#2d3238',stripe:null},
  schneider:{name:'Schneider Electric',gD:'Resi9 XE',gI:'Resi9 XE',gC:'Resi9',short:'Resi9',lever:'#22302a',stripe:'#3a9a5b'},
  legrand:{name:'Legrand',gD:'DX³',gI:'DX³-ID',gC:'Drivia',short:'DX³',lever:'#454c5a',stripe:'#98a1b0'}
};
const TY={eclairage:'AC',prises:'AC',cuisine:'AC',plaque:'A!',four:'AC',ll:'A!',lv:'A',sl:'A',congel:'A',ce:'AC',chauffage:'AC',clim:'A',pac:'A',vmc:'AC',volets:'AC',irve:'A!',prv:'A!',ext:'AC',com:'AC',autre:'AC',div:'-'};
const TYWHY={
  plaque:'L’électronique de l’induction peut créer des fuites à composante continue. Un type AC risque de ne pas les voir et de ne pas couper.',
  ll:'Le moteur du lave-linge est piloté par électronique : fuites à composante continue possibles.',
  irve:'La recharge crée des fuites continues. Type A si la borne détecte elle-même le courant continu 6 mA, sinon type B. Un différentiel par point de charge.',
  prv:'La recharge crée des fuites continues. Un différentiel type A (ou F) rien que pour elle.',
  clim:'Compresseur à variateur (inverter). Type A conseillé, type F si la notice le demande : il résiste mieux aux coupures intempestives.',
  pac:'Compresseur à variateur (inverter). Type A conseillé, type F si la notice le demande.',
  lv:'Pompes et moteurs souvent pilotés électroniquement. Le type AC est admis, le type A est plus sûr.',
  sl:'Les modèles récents (pompe à chaleur) ont un moteur à variateur. Le type A est plus sûr.',
  congel:'Les compresseurs récents sont souvent à variateur. Le type A est plus sûr.'};
const IDGUIDE=[
  ['Éclairage, prises, chauffage électrique, chauffe-eau, four, VMC, volets','AC','Courant alternatif classique. Le type AC suffit, le type A convient aussi.'],
  ['Plaque de cuisson, lave-linge','A obligatoire',TYWHY.plaque],
  ['Recharge de voiture (prise renforcée, borne)','A ou F, seul',TYWHY.irve],
  ['Climatisation, pompe à chaleur','A conseillé (F selon notice)',TYWHY.clim],
  ['Lave-vaisselle, sèche-linge, congélateur récents','A conseillé',TYWHY.lv],
  ['Appareils triphasés à variateur','B','Fuites en courant continu lisse : seul le type B les détecte.']];
const KEY='tableau-malin-v1';
const SIMUL=0.7; // simultanéité globale du logement pour l'abonnement

/* ================= Outils ================= */
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>String(n).replace('.',',');
const kw=w=>(w/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' kW';
const clone=o=>JSON.parse(JSON.stringify(o));

/* ================= Projet ================= */
function newBoard(name,kind){return{id:uid(),name,kind,rows:2,mpr:13,items:[]}}
function mkCirc(k,o={}){const sp=CIRC[k];const c={k,label:o.label??sp.n,room:o.room||'',n:o.n||0,p:o.p??sp.p,sec:sp.sec,cal:sp.cal};
  if(sp.ptab){Object.assign(c,recommend(c))}
  return{id:uid(),t:'disj',row:0,col:0,c,feed:null}}
function mkItem(t,o={}){const it={id:uid(),t,row:0,col:0,feed:null};if(t==='id'){it.cal=o.cal||40;it.type=o.type||'AC'}return it}

const DEFAULT_HOME={name:'Maison exemple',surf:90,ch:3,sdb:1,tarif:'hc',chauf:0,plaque:true,four:true,ll:true,lv:true,sl:false,congel:true,ce:true,climN:1,climW:900,ve:'prv',vmc:true,volets:true,ext:true,foudre:false,div:false,brand:'schneider'};

function pack(list,max){const out=[];let cur=null;for(const [room,n] of list){if(!n)continue;if(!cur||cur.n+n>max){cur={rooms:[],n:0};out.push(cur)}cur.rooms.push(room);cur.n+=n}return out}
function generate(h){
  const P={v:1,name:h.name||'Mon logement',surf:+h.surf||90,tarif:h.tarif||'base',kva:9,foudre:!!h.foudre,brand:h.brand||'schneider',stock:{},boards:[],cur:null,home:clone(h)};
  const B=newBoard('Tableau principal','principal');P.boards.push(B);P.cur=B.id;
  const ch=Math.max(0,+h.ch||0), sdb=Math.max(0,+h.sdb||0), add=it=>B.items.push(it);
  const lum=[['séjour',3],['cuisine',2],['entrée',2],['WC',1]];
  for(let i=1;i<=ch;i++)lum.push([`ch.${i}`,1]);
  for(let i=1;i<=sdb;i++)lum.push([sdb>1?`SdB ${i}`:'SdB',2]);
  if(h.ext)lum.push(['ext.',2]);
  pack(lum,7).forEach(g=>add(mkCirc('eclairage',{label:'Écl. '+g.rooms.join(', '),n:g.n,p:Math.max(300,g.n*80)})));
  const pc=[['séjour',5+Math.floor((+h.surf||90)/40)],['entrée',1]];
  for(let i=1;i<=ch;i++)pc.push([`ch.${i}`,3]);
  for(let i=1;i<=sdb;i++)pc.push([sdb>1?`SdB ${i}`:'SdB',1]);
  pc.push(['couloir',1]);
  pack(pc,10).forEach(g=>add(mkCirc('prises',{label:'PC '+g.rooms.join(', '),n:g.n})));
  add(mkCirc('cuisine',{label:'PC plan de travail',n:6,room:'cuisine'}));
  [['plaque','Plaque'],['four','Four'],['ll','Lave-linge'],['lv','Lave-vaisselle'],['sl','Sèche-linge'],['congel','Congélateur'],['ce','Chauffe-eau']].forEach(([k,l])=>{if(h[k])add(mkCirc(k,{label:l}))});
  if(+h.chauf>0){const n=Math.ceil(+h.chauf/3500);for(let i=0;i<n;i++)add(mkCirc('chauffage',{label:`Chauffage ${i+1}`,p:Math.round(+h.chauf/n)}))}
  for(let i=0;i<(+h.climN||0);i++)add(mkCirc('clim',{label:`Clim ${i+1}`,p:+h.climW||1200}));
  if(h.pac)add(mkCirc('pac',{label:'Pompe à chaleur',p:+h.pacW||3500}));
  if(h.ve==='irve')add(mkCirc('irve',{label:'Borne VE'}));
  if(h.ve==='prv')add(mkCirc('prv',{label:'Prise VE'}));
  if(h.vmc)add(mkCirc('vmc',{label:'VMC'}));
  if(h.volets)add(mkCirc('volets',{label:'Volets'}));
  if(h.ext)add(mkCirc('ext',{label:'Extérieur'}));
  add(mkCirc('com',{label:'Coffret com.'}));
  if(h.ce&&P.tarif==='hc')add(mkItem('cont'));
  if(h.foudre)add(mkItem('para'));
  if(h.div){
    const D=newBoard('Garage','div');P.boards.push(D);
    D.items.push(mkItem('sect'),mkCirc('eclairage',{label:'Écl. garage',n:3,p:300}),mkCirc('prises',{label:'PC garage',n:4}),mkCirc('prises',{label:'PC atelier',n:3}));
    const f=mkCirc('div',{label:'Départ garage'});f.c.board=D.id;f.feed='head';B.items.push(f);
    optimise(P,D);Object.assign(f.c,recommend(f.c,P));
  }
  optimise(P,B);
  P.kva=suggestKva(P);
  return P;
}

/* ================= Calculs ================= */
function boardOf(P,id){return P.boards.find(b=>b.id===id)}
function loadOf(P,it,seen){
  if(it.t!=='disj')return 0;
  if(it.c.k==='div'){const b=boardOf(P,it.c.board);return b?boardLoad(P,b,seen):0}
  return (+it.c.p||0)*(CIRC[it.c.k]||CIRC.autre).ks;
}
function boardLoad(P,b,seen=new Set()){if(seen.has(b.id))return 0;seen.add(b.id);return b.items.reduce((a,i)=>a+loadOf(P,i,seen),0)}
function installed(P){let s=0;P.boards.forEach(b=>b.items.forEach(i=>{if(i.t==='disj'&&i.c.k!=='div')s+=+i.c.p||0}));return s}
function principal(P){return P.boards.find(b=>b.kind==='principal')||P.boards[0]}
const HCK=new Set(['ce','irve','prv']);
/* Puissance appelée : en heures creuses, chauffe-eau et recharge tournent la nuit, pas en même temps que la cuisine */
function demand(P){
  let day=0,night=0;
  P.boards.forEach(b=>b.items.forEach(i=>{if(i.t!=='disj'||i.c.k==='div')return;const l=loadOf(P,i);if(P.tarif==='hc'&&HCK.has(i.c.k))night+=l;else day+=l}));
  return P.tarif==='hc'?Math.max(day*SIMUL,night+day*0.3):day*SIMUL;
}
function suggestKva(P){const w=demand(P);return KVA.find(k=>k*1000>=w)||18}
function recommend(c,P){
  const sp=CIRC[c.k];
  if(sp.ptab){const r=PTABLE.find(r=>r[2]>=(+c.p||0))||PTABLE[PTABLE.length-1];return{cal:r[0],sec:r[1]}}
  if(c.k==='div'){const b=P&&boardOf(P,c.board);const I=b?boardLoad(P,b)/230:0;const r=DIVTABLE.find(r=>r[0]>=I*1.1)||DIVTABLE[2];return{cal:r[0],sec:r[1]}}
  if(c.k==='prises'&&(+c.n||0)<=5&&c.sec===1.5)return{cal:16,sec:1.5};
  if(c.k==='eclairage')return{cal:c.cal===10?10:16,sec:1.5};
  return{cal:sp.cal,sec:sp.sec};
}
function feedMap(b){
  const m={},ids=b.items.filter(i=>i.t==='id');
  for(const it of b.items){
    if(it.t==='id'||it.t==='sect'||it.t==='para'){m[it.id]={by:null,via:'head'};continue}
    if(it.feed==='head'){m[it.id]={by:null,via:'direct'};continue}
    if(it.feed&&ids.some(d=>d.id===it.feed)){m[it.id]={by:it.feed,via:'fil'};continue}
    let best=null;for(const d of ids)if(d.row===it.row&&d.col<it.col&&(!best||d.col>best.col))best=d;
    m[it.id]=best?{by:best.id,via:'peigne'}:{by:null,via:'direct'};
  }
  return m;
}
function sortedIds(b){return b.items.filter(i=>i.t==='id').sort((a,c)=>a.row-c.row||a.col-c.col)}
function idName(b,d){return 'Diff. '+(sortedIds(b).indexOf(d)+1)}
function usedMods(b){return b.items.reduce((a,i)=>a+W[i.t],0)}
function itemName(it){
  if(it.t==='disj')return it.c.label||CIRC[it.c.k].n;
  return{id:'Interrupteur différentiel',para:'Parafoudre',cont:'Contacteur heures creuses',tl:'Télérupteur',sect:'Interrupteur de tête',prise:'Prise modulaire'}[it.t];
}

/* ================= Rangement automatique ================= */
function optimise(P,b){
  const isP=b.kind==='principal';
  const disj=b.items.filter(i=>i.t==='disj');
  const feeds=disj.filter(i=>i.c.k==='div'), circ=disj.filter(i=>i.c.k!=='div');
  const conts=b.items.filter(i=>i.t==='cont'), tls=b.items.filter(i=>i.t==='tl'), prises=b.items.filter(i=>i.t==='prise');
  const head=[...b.items.filter(i=>i.t==='sect'),...b.items.filter(i=>i.t==='para')];
  const L=i=>loadOf(P,i), sp=i=>CIRC[i.c.k];
  const bins=[];const newBin=(type,cal)=>{const bn={id:mkItem('id',{type,cal}),list:[],load:0};bins.push(bn);return bn};
  const put=(bn,i)=>{bn.list.push(i);bn.load+=L(i)};
  const irve=circ.filter(i=>sp(i).irve), needA=circ.filter(i=>sp(i).A), recA=circ.filter(i=>sp(i).recA);
  const rest=circ.filter(i=>!sp(i).irve&&!sp(i).A&&!sp(i).recA);
  irve.forEach(i=>put(newBin('A',40),i));
  const nA=isP?Math.max(1,Math.ceil(needA.length/8)):Math.ceil(needA.length/8);
  const Abins=Array.from({length:nA},()=>newBin('A',40));
  needA.forEach((i,k)=>put(Abins[k%nA],i));
  const s=+P.surf||90;
  const nAC=isP?(s<=35?1:s<=100?2:3):(rest.length||recA.length&&!nA?Math.max(1,Math.ceil(rest.length/8)):0);
  const ACbins=Array.from({length:nAC},()=>newBin('AC',isP&&s<=35?25:40));
  const general=[...Abins,...ACbins];
  const pick=(c,l)=>{let best=null;for(const bn of c){if(bn.list.length>=8||bn.load+l>63*230)continue;if(!best||bn.load<best.load)best=bn}return best};
  const place=(i,pref)=>{let bn=pick(pref,L(i))||pick(general,L(i));if(!bn){bn=newBin('AC',40);ACbins.push(bn);general.push(bn)}put(bn,i)};
  recA.forEach(i=>place(i,Abins.length?Abins:general));
  const rr=(list,off)=>list.forEach((i,k)=>{const pool=ACbins.length?ACbins:general;place(i,[pool[(k+off)%pool.length]])});
  rr(rest.filter(i=>i.c.k==='eclairage'),0);
  rr(rest.filter(i=>i.c.k==='prises'),1);
  rest.filter(i=>i.c.k!=='eclairage'&&i.c.k!=='prises').sort((a,c)=>L(c)-L(a)).forEach(i=>place(i,general));
  const order=Object.keys(CIRC);
  let finalBins=bins.filter(bn=>bn.list.length||isP);
  finalBins.forEach(bn=>{
    bn.list.sort((a,c)=>order.indexOf(a.c.k)-order.indexOf(c.c.k));
    const I=bn.load/230;bn.id.cal=bn.id.cal===25&&I<=25?25:I<=40?40:63;
  });
  conts.forEach(ct=>{const bn=finalBins.find(x=>x.list.some(i=>i.c.k==='ce'));if(bn){const k=bn.list.findIndex(i=>i.c.k==='ce');bn.list.splice(k+1,0,ct)}else if(finalBins[0])finalBins[0].list.push(ct)});
  tls.forEach(t=>{const bn=finalBins.find(x=>x.list.some(i=>i.t==='disj'&&i.c.k==='eclairage'))||finalBins[0];if(bn)bn.list.push(t)});
  layout(b,[...head,...feeds],finalBins.map((bn,bi)=>({id:bn.id,list:bi===finalBins.length-1?[...bn.list,...prises]:bn.list})),finalBins.length?[]:prises);
}
function layout(b,direct,groups,extra=[]){
  const M=b.mpr;let row=0,col=0;
  const at=it=>{const w=W[it.t];if(col+w>M){row++;col=0}it.row=row;it.col=col;col+=w};
  direct.forEach(i=>{if(i.feed!=='head')i.feed=null;at(i)});
  extra.forEach(i=>{i.feed=null;at(i)});
  groups.forEach(g=>{const grp=[g.id,...g.list];const w=grp.reduce((a,i)=>a+W[i.t],0);if(col>0&&col+w>M){row++;col=0}
    grp.forEach((it,k)=>{at(it);if(k>0)it.feed=it.row!==g.id.row?g.id.id:null})});
  b.items=[...new Set([...direct,...extra,...groups.flatMap(g=>[g.id,...g.list])])];
  const used=col===0&&row>0?row:row+1;let rows=Math.max(1,used);
  const um=usedMods(b);while((rows*M-um)/(rows*M)<0.2)rows++;
  b.rows=Math.min(rows,8);
}
/* Ranger sans changer les choix : chaque différentiel garde ses circuits */
function tidy(P,b){
  const fm=feedMap(b), byPos=(a,c)=>a.row-c.row||a.col-c.col;
  const direct=b.items.filter(i=>i.t!=='id'&&!fm[i.id].by).sort((a,c)=>(a.t==='sect'?0:a.t==='para'?1:2)-(c.t==='sect'?0:c.t==='para'?1:2)||byPos(a,c));
  const groups=sortedIds(b).map(d=>({id:d,list:b.items.filter(i=>fm[i.id].by===d.id).sort(byPos)}));
  layout(b,direct,groups);
}
function attachDiv(P,it){
  if(!(it.t==='disj'&&it.c.k==='div')||it.c.board)return;
  const n=P.boards.filter(b=>b.kind==='div').length+1, D=newBoard('Divisionnaire '+n,'div');
  D.rows=1;D.items.push(Object.assign(mkItem('sect'),{row:0,col:0}),Object.assign(mkItem('id',{cal:40,type:'A'}),{row:0,col:2}));
  P.boards.push(D);it.c.board=D.id;it.c.label='Départ '+D.name;
}

/* ================= Vérification NF C 15-100 ================= */
function analyse(P){
  const out=[];const add=(lvl,msg,b,it,why)=>out.push({lvl,msg,b:b?.id,item:it?.id,why});
  const prin=principal(P);let allIds=[];
  for(const b of P.boards){
    const fm=feedMap(b), ids=b.items.filter(i=>i.t==='id');allIds=allIds.concat(ids);
    const idCirc={};ids.forEach(d=>idCirc[d.id]=[]);
    b.items.forEach(it=>{const f=fm[it.id];if(f&&f.by)idCirc[f.by].push(it)});
    for(const it of b.items.filter(i=>i.t==='disj')){
      const c=it.c, sp=CIRC[c.k]||CIRC.autre, f=fm[it.id], id=f.by?ids.find(d=>d.id===f.by):null;
      const nm=`« ${c.label||sp.n} »`;
      if(!String(c.label||'').trim())add('warn',`Un disjoncteur ${c.cal} A n’a pas de repère.`,b,it,'Chaque circuit doit être repéré dans le tableau (étiquette). Le Consuel le vérifie.');
      const mx=MAXCAL[c.sec];
      if(c.cal>mx)add('err',`${nm} : un câble de ${fmt(c.sec)} mm² ne supporte pas ${c.cal} A (maximum ${mx} A).`,b,it,'Le disjoncteur protège le câble. Si son calibre dépasse ce que le câble supporte, le câble chauffe avant que le disjoncteur coupe.');
      if(!sp.ptab&&c.k!=='div'&&c.k!=='autre'){
        if(c.sec<sp.sec)add('err',`${nm} : section minimale ${fmt(sp.sec)} mm² pour ce circuit (tu as ${fmt(c.sec)} mm²).`,b,it,`Circuit ${sp.n} : ${fmt(sp.sec)} mm² protégé en ${sp.cal} A.`);
        if(c.k==='eclairage'&&c.cal>16)add('err',`${nm} : l’éclairage se protège en 16 A maximum.`,b,it,'Circuit éclairage : 1,5 mm², disjoncteur 10 ou 16 A.');
        else if(c.k==='vmc'&&c.cal>2)add('warn',`${nm} : disjoncteur 2 A attendu pour la VMC.`,b,it,'La VMC a son propre circuit, protégé par un disjoncteur 2 A.');
        else if(c.cal<sp.cal&&!['eclairage','prises','vmc'].includes(c.k))add('warn',`${nm} : ${sp.cal} A prévu pour ce circuit (tu as ${c.cal} A), risque de coupures.`,b,it,'Un calibre trop faible fait déclencher le disjoncteur en fonctionnement normal.');
      }
      if(sp.max){const keys=Object.keys(sp.max).map(Number);const mxn=sp.max[c.sec]??sp.max[Math.max(...keys.filter(k=>k<=c.sec),keys[0])];
        if((+c.n||0)>mxn)add('err',`${nm} : ${c.n} ${sp.cnt}, c’est trop (maximum ${mxn} en ${fmt(c.sec)} mm²).`,b,it,`Limite NF C 15-100 : ${sp.lim}. Crée un circuit de plus.`);}
      if(sp.ptab){const I=(+c.p||0)/230;if(c.cal<I)add('err',`${nm} : ${c.p} W demandent ${I.toFixed(1)} A, le disjoncteur ${c.cal} A va sauter.`,b,it,'Prends le calibre au-dessus et la section qui va avec (bouton « Régler tout seul »).')}
      if(c.k==='div'){const db=boardOf(P,c.board);
        if(!db)add('err',`${nm} n’alimente aucun tableau.`,b,it,'Choisis le tableau divisionnaire alimenté dans les réglages du disjoncteur.');
        else{const I=boardLoad(P,db)/230;if(I>c.cal)add('warn',`${nm} : le tableau « ${db.name} » tire environ ${Math.round(I)} A pour un départ ${c.cal} A.`,b,it,'Augmente le calibre du départ et la section du câble (6 mm²/32 A, 10 mm²/40 A, 16 mm²/63 A).')}}
      if(!id){
        if(c.k==='div'){const db=boardOf(P,c.board);if(db&&!db.items.some(i=>i.t==='id'))add('err',`${nm} : le tableau « ${db.name} » n’a aucun différentiel 30 mA.`,b,it,'Si le départ n’est pas derrière un 30 mA, le tableau divisionnaire doit avoir ses propres interrupteurs différentiels.')}
        else add('err',`${nm} n’est protégé par aucun différentiel 30 mA.`,b,it,'Tous les circuits d’un logement passent par un interrupteur différentiel 30 mA. Place le disjoncteur à droite d’un différentiel (peigne) ou tire un fil vers un différentiel.');
      }else{
        if(sp.A&&id.type==='AC')add('err',`${nm} doit être derrière un différentiel type A (ou F), pas AC.`,b,it,'Plaques et lave-linge produisent des courants de fuite que le type AC ne détecte pas toujours.');
        if(sp.irve){if(id.type==='AC')add('err',`${nm} : différentiel type A ou F obligatoire.`,b,it,'Recharge de véhicule : 30 mA type A (borne avec détection courant continu) ou F, ou type B.');
          if(idCirc[id.id].filter(x=>x.t==='disj'||x.t==='prise').length>1)add('err',`${nm} doit avoir son propre différentiel 30 mA.`,b,it,'Chaque point de recharge est protégé individuellement par un différentiel 30 mA.')}
        if(sp.recA&&id.type==='AC')add('warn',`${nm} : différentiel type A conseillé (onduleur). Vérifie la notice.`,b,it,'Les climatiseurs et pompes à chaleur à variateur génèrent des fuites que le type AC voit mal. La plupart des fabricants demandent un type A.');
      }
      if(c.k==='ce'&&P.tarif==='hc'&&!b.items.some(i=>i.t==='cont'))add('warn',`${nm} : ajoute un contacteur heures creuses.`,b,it,'Avec un abonnement heures creuses, le chauffe-eau est commandé par un contacteur jour/nuit.');
    }
    ids.forEach(d=>{
      const cs=idCirc[d.id].filter(x=>x.t==='disj'||x.t==='prise');const nm=`${idName(b,d)} (${b.name})`;
      if(cs.length>8)add('err',`${nm} protège ${cs.length} circuits (8 maximum).`,b,d,'Un interrupteur différentiel protège au plus 8 circuits. Ajoute un différentiel.');
      if(!cs.length)add('warn',`${nm} ne protège aucun circuit.`,b,d,'Place des disjoncteurs à sa droite sur la même rangée, ou câble-les vers lui.');
      const I=cs.reduce((a,i)=>a+loadOf(P,i),0)/230;
      if(I>d.cal)add(I>d.cal*1.25?'err':'warn',`${nm} : environ ${Math.round(I)} A en charge pour un calibre ${d.cal} A.`,b,d,'Passe en 63 A ou répartis les gros appareils (plaque, chauffage, recharge) sur d’autres différentiels.');
    });
    const ecl=b.items.filter(i=>i.t==='disj'&&i.c.k==='eclairage');
    const eIds=new Set(ecl.map(i=>fm[i.id].by).filter(Boolean));
    if(ecl.length>=2&&eIds.size<2)add('warn',`${b.name} : tout l’éclairage est sur le même différentiel.`,b,null,'Répartis l’éclairage sur au moins deux différentiels. Si l’un saute, une partie du logement reste éclairée.');
    const tot=b.rows*b.mpr, free=(tot-usedMods(b))/tot;
    if(free<0.2)add('err',`${b.name} : réserve de ${Math.round(free*100)} % (20 % minimum).`,b,null,'Le tableau garde au moins 20 % de place libre pour les ajouts futurs. Ajoute une rangée.');
    if(b.kind==='div'){
      if(!b.items.some(i=>i.t==='sect'))add('warn',`${b.name} : ajoute un interrupteur de tête.`,b,null,'Un tableau divisionnaire a un dispositif de coupure en tête pour couper tout le tableau sur place.');
      if(!prin.items.some(i=>i.t==='disj'&&i.c.k==='div'&&i.c.board===b.id))add('err',`${b.name} n’est alimenté par aucun départ du tableau principal.`,b,null,'Ajoute un disjoncteur « Départ tableau divisionnaire » dans le tableau principal.');
    }
  }
  const s=+P.surf||0, req=s<=35?2:s<=100?3:4;
  if(allIds.length<req)add('err',`Pour ${s} m², il faut au moins ${req} interrupteurs différentiels 30 mA (tu en as ${allIds.length}).`,prin,null,'NF C 15-100 : jusqu’à 35 m² : 2 · de 35 à 100 m² : 3 · plus de 100 m² : 4, dont au moins un type A.');
  if(!allIds.some(d=>d.type!=='AC'))add('err','Il faut au moins un différentiel type A (ou F).',prin,null,'Le type A protège la plaque de cuisson et le lave-linge.');
  if(P.foudre&&!prin.items.some(i=>i.t==='para'))add('err','Parafoudre obligatoire dans ta zone (ou bâtiment avec paratonnerre).',prin,null,'Le parafoudre se place en tête du tableau principal, avec son dispositif de déconnexion.');
  const pf=demand(P);
  if(pf>P.kva*1000)add('warn',`Puissance estimée ${kw(pf)}, plus que l’abonnement ${P.kva} kVA.`,prin,null,`Passe à ${suggestKva(P)} kVA ou délestage. Le disjoncteur de branchement (AGCP) risque de couper.`);
  return out;
}

if(typeof module!=='undefined')module.exports={MOD,MOD_H,ROW_H,W,MAXCAL,SECS,CALS,PTABLE,DIVTABLE,KVA,CIRC,TY,IDGUIDE,BR,
  newBoard,mkCirc,mkItem,generate,DEFAULT_HOME,loadOf,boardLoad,installed,principal,demand,suggestKva,recommend,feedMap,
  sortedIds,idName,usedMods,itemName,optimise,layout,tidy,attachDiv,analyse,boardOf,fmt};
