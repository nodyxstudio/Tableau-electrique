/* Chouette Tableau · règles NF C 15-100 (logement)
 * Données de référence, calculs, rangement automatique et vérification.
 * Aucun accès au DOM : ce fichier est chargé par la page et testé avec Node (npm test). */
"use strict";
/* ================= Données de référence ================= */
const MOD=36, MOD_H=150, ROW_H=330, LEFT=44, TOP=84, MOD_Y=52;
const W={disj:1,id:2,para:2,cont:1,tl:1,sect:2,prise:3};
const MAXCAL={1.5:16,2.5:20,4:25,6:32,10:50,16:63};
const SECS=[1.5,2.5,4,6,10,16];
const CALS=[2,6,10,16,20,25,32,40,50,63];
const PTABLE=[[10,1.5,2250],[16,1.5,3500],[20,2.5,4500],[25,4,5750],[32,6,7250],[40,10,9200]];
const DIVTABLE=[[32,6],[40,10],[63,16]];
const KVA=[3,6,9,12,15,18];
const ETAGES=['Sous-sol','RDC','Étage 1','Étage 2','Étage 3','Combles','Extérieur','Garage','Annexe'];
const ARRMAX={10:60,16:90,25:90}; // câble AGCP → tableau : courant maximum de réglage de l'AGCP
function arrSec(P){return P.arr&&P.arr!=='auto'?+P.arr:(P.kva>12?16:10)}
const CIRC={
  eclairage:{n:'Éclairage',ic:'💡',sec:1.5,cal:16,cnt:'points lumineux',max:{1.5:8,2.5:8},p:500,ks:.7,lim:'8 points lumineux max'},
  prises:{n:'Prises 16 A',ic:'🔌',sec:2.5,cal:20,cnt:'socles',max:{1.5:8,2.5:12},p:2500,ks:.3,lim:'8 socles (1,5 mm²/16 A) · 12 socles (2,5 mm²/20 A)'},
  cuisine:{n:'Prises plan de travail',ic:'🥣',sec:2.5,cal:20,cnt:'socles',max:{2.5:6,4:6,6:6},p:3000,ks:.4,lim:'6 socles max, circuit dédié à la cuisine'},
  plaque:{n:'Plaque de cuisson',ic:'🍳',sec:6,cal:32,p:7200,ks:.6,A:true,lim:'1 appareil · différentiel type A'},
  four:{n:'Four',ic:'🥖',sec:2.5,cal:20,p:3000,ks:.6,lim:'1 appareil'},
  ll:{n:'Lave-linge',ic:'👕',sec:2.5,cal:20,p:2500,ks:.6,A:true,lim:'1 appareil · différentiel type A'},
  lv:{n:'Lave-vaisselle',ic:'🍽️',sec:2.5,cal:20,p:2300,ks:.6,lim:'1 appareil'},
  sl:{n:'Sèche-linge',ic:'🌀',sec:2.5,cal:20,p:2800,ks:.6,lim:'1 appareil'},
  congel:{n:'Congélateur',ic:'🧊',sec:2.5,cal:20,p:300,ks:1,lim:'1 appareil (conseillé)'},
  frigo:{n:'Réfrigérateur',ic:'🥛',sec:2.5,cal:20,p:250,ks:1,lim:'circuit dédié conseillé'},
  cave:{n:'Cave à vin',ic:'🍷',sec:1.5,cal:16,p:150,ks:1,lim:'circuit dédié conseillé'},
  mo:{n:'Micro-ondes',ic:'🍿',sec:2.5,cal:20,p:1500,ks:.3,lim:'circuit dédié conseillé'},
  hotte:{n:'Hotte',ic:'🌫️',sec:1.5,cal:16,p:300,ks:.5,lim:'circuit dédié conseillé'},
  cuisiniere:{n:'Cuisinière (four + plaques)',ic:'🍲',sec:6,cal:32,p:8000,ks:.6,A:true,lim:'1 appareil · différentiel type A'},
  seche:{n:'Sèche-serviettes',ic:'🧺',ptab:true,sec:1.5,cal:16,p:1000,ks:1,lim:'selon la puissance'},
  plancher:{n:'Plancher chauffant',ic:'🔲',ptab:true,sec:2.5,cal:20,p:4000,ks:1,lim:'selon la puissance'},
  thermo:{n:'Ballon thermodynamique',ic:'💧',sec:2.5,cal:20,p:2500,ks:1,recA:true,lim:'1 appareil · contacteur si heures creuses'},
  chaudiere:{n:'Chaudière gaz',ic:'🔥',sec:1.5,cal:16,p:200,ks:1,lim:'circuit dédié 16 A conseillé, même si elle est branchée sur une prise'},
  poele:{n:'Poêle à granulés',ic:'🪵',sec:1.5,cal:16,p:400,ks:.5,lim:'circuit dédié conseillé'},
  atelier:{n:'Machines d’atelier',ic:'🛠️',sec:2.5,cal:20,p:2500,ks:.4,lim:'circuit dédié aux machines (scie, compresseur…)'},
  piscine:{n:'Piscine (filtration)',ic:'🏊',sec:2.5,cal:20,p:1500,ks:1,recA:true,lim:'circuit dédié, 30 mA obligatoire'},
  spa:{n:'Spa / jacuzzi',ic:'🛁',sec:6,cal:32,p:6000,ks:1,recA:true,lim:'circuit dédié, section selon la notice'},
  portail:{n:'Portail / porte de garage',ic:'🚪',sec:1.5,cal:16,p:400,ks:.3,lim:'circuit dédié conseillé'},
  alarme:{n:'Alarme / domotique',ic:'🔔',sec:1.5,cal:2,p:30,ks:1,lim:'disjoncteur 2 A dédié'},
  aspi:{n:'Aspiration centralisée',ic:'🧹',sec:2.5,cal:20,p:1600,ks:.3,lim:'circuit dédié'},
  relevage:{n:'Pompe (puits, relevage)',ic:'⛲',sec:2.5,cal:20,p:1000,ks:.5,recA:true,lim:'circuit dédié'},
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
const TY={eclairage:'AC',prises:'AC',cuisine:'AC',plaque:'A!',four:'AC',ll:'A!',lv:'A',sl:'A',congel:'A',ce:'AC',chauffage:'AC',clim:'A',pac:'A',vmc:'AC',volets:'AC',irve:'A!',prv:'A!',ext:'AC',com:'AC',autre:'AC',div:'-',frigo:'A',cave:'AC',mo:'AC',hotte:'AC',cuisiniere:'A!',seche:'AC',plancher:'AC',thermo:'A',chaudiere:'AC',poele:'AC',atelier:'AC',piscine:'A',spa:'A',portail:'AC',alarme:'AC',aspi:'AC',relevage:'A'};
const TYWHY={
  plaque:'L’électronique de l’induction peut créer des fuites à composante continue. Un type AC risque de ne pas les voir et de ne pas couper.',
  ll:'Le moteur du lave-linge est piloté par électronique : fuites à composante continue possibles.',
  irve:'La recharge crée des fuites continues. Type A si la borne détecte elle-même le courant continu 6 mA, sinon type B. Un différentiel par point de charge.',
  prv:'La recharge crée des fuites continues. Un différentiel type A (ou F) rien que pour elle.',
  clim:'Compresseur à variateur (inverter). Type A conseillé, type F si la notice le demande : il résiste mieux aux coupures intempestives.',
  pac:'Compresseur à variateur (inverter). Type A conseillé, type F si la notice le demande.',
  lv:'Pompes et moteurs souvent pilotés électroniquement. Le type AC est admis, le type A est plus sûr.',
  sl:'Les modèles récents (pompe à chaleur) ont un moteur à variateur. Le type A est plus sûr.',
  congel:'Les compresseurs récents sont souvent à variateur. Le type A est plus sûr.',
  frigo:'Les compresseurs récents sont souvent à variateur. Le type A est plus sûr.',
  cuisiniere:'La partie plaques (induction) crée des fuites à composante continue : type A obligatoire.',
  thermo:'Compresseur de pompe à chaleur à variateur : type A conseillé.',
  piscine:'Les pompes à vitesse variable créent des fuites que le type AC voit mal : type A conseillé.',
  spa:'Pompes et électronique de chauffe : type A conseillé, suis la notice.',
  relevage:'Moteur de pompe, souvent à variateur : type A conseillé.'};
/* Équipement minimum par pièce (NF C 15-100, logement) */
const ROOMT={
  sejour:{n:'Séjour',why:'1 socle par tranche de 4 m², 5 au minimum ; au-delà de 28 m², 7 au minimum. Un point d’éclairage au plafond.'},
  chambre:{n:'Chambre',why:'3 socles au minimum et un point d’éclairage.'},
  cuisine:{n:'Cuisine',why:'6 socles au minimum dont 4 au-dessus du plan de travail (3 si la cuisine fait 4 m² ou moins), hors circuits spécialisés. Un point d’éclairage.'},
  sdb:{n:'Salle de bain / d’eau',why:'1 socle au minimum, hors des volumes 0 à 2, et un point d’éclairage.'},
  wc:{n:'WC',why:'Pas de socle exigé, un point d’éclairage.'},
  entree:{n:'Entrée',why:'1 socle et un point d’éclairage.'},
  couloir:{n:'Couloir / dégagement',why:'Un point d’éclairage ; 1 socle si la pièce fait plus de 4 m².'},
  autre:{n:'Autre pièce (bureau, buanderie…)',why:'Un point d’éclairage ; 1 socle si la pièce fait plus de 4 m².'}
};
function roomReq(r){const s=+r.surf||0;
  const so={sejour:s>28?7:Math.max(5,Math.ceil(s/4)),chambre:3,cuisine:s>4||!s?6:3,sdb:1,wc:0,entree:1,couloir:s>4?1:0,autre:s>4?1:0}[r.type]??0;
  return{socles:so,pts:1};}
function mkRoom(type,name,surf,o={}){const r={id:uid(),type,name,surf,etage:o.etage||'',socles:0,pts:1};r.socles=o.socles??roomReq(r).socles;r.pts=o.pts??1;return r}

/* Calibre des interrupteurs différentiels (NF C 15-100)
   Règle de l'aval : 1 × calibres chauffage, eau chaude, recharge VE + 0,5 × calibres des autres circuits ≤ calibre de l'ID.
   Règle de l'amont : ou bien calibre de l'ID ≥ réglage du disjoncteur de branchement (ou du départ qui alimente le tableau). */
const FULLK=new Set(['chauffage','seche','plancher','pac','ce','thermo','irve','prv']);
function wCal(it){if(it.t!=='disj')return 0;if(it.c.k==='div')return +it.c.cal;return FULLK.has(it.c.k)?+it.c.cal:+it.c.cal*0.5}
function amontA(P,b){if(b.kind==='principal')return P.kva*5;const f=principal(P).items.find(i=>i.t==='disj'&&i.c.k==='div'&&i.c.board===b.id);return f?+f.c.cal:P.kva*5}

/* Rangement de la palette par pièce / usage */
const GROUPS=[
  ['Pièces : lumière et prises',['eclairage','prises','volets','com']],
  ['Cuisine',['cuisine','plaque','four','cuisiniere','lv','frigo','congel','cave','mo','hotte']],
  ['Buanderie',['ll','sl']],
  ['Chauffage, clim, eau chaude',['chauffage','seche','plancher','clim','pac','ce','thermo','chaudiere','poele','vmc']],
  ['Voiture et piscine',['irve','prv','piscine','spa','relevage']],
  ['Atelier, garage, extérieur',['atelier','ext','portail']],
  ['Divers',['alarme','aspi','autre']]];
const IDGUIDE=[
  ['Éclairage, prises, chauffage électrique, chauffe-eau, four, VMC, volets','AC','Courant alternatif classique. Le type AC suffit, le type A convient aussi.'],
  ['Plaque de cuisson, lave-linge','A obligatoire',TYWHY.plaque],
  ['Recharge de voiture (prise renforcée, borne)','A ou F, seul',TYWHY.irve],
  ['Climatisation, pompe à chaleur','A conseillé (F selon notice)',TYWHY.clim],
  ['Lave-vaisselle, sèche-linge, congélateur récents','A conseillé',TYWHY.lv],
  ['Appareils triphasés à variateur','B','Fuites en courant continu lisse : seul le type B les détecte.']];
const KEY='tableau-malin-v1';
const RHO=0.0225; // résistivité du cuivre en service (Ω·mm²/m)
/* Chute de tension en % (monophasé, aller-retour) */
function vdrop(L,I,sec){return L>0&&sec>0?2*RHO*L*I/sec/230*100:0}
function circI(P,it){if(it.c.k==='div'){const b=boardOf(P,it.c.board);return Math.max(1,b?boardLoad(P,b)/230:1)}return Math.max(1,(+it.c.p||0)/230)}
const SIMUL=0.7; // simultanéité globale du logement pour l'abonnement

/* ================= Outils ================= */
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>String(n).replace('.',',');
const kw=w=>(w/1000).toLocaleString('fr-FR',{maximumFractionDigits:1})+' kW';
const clone=o=>JSON.parse(JSON.stringify(o));

/* ================= Projet ================= */
function newBoard(name,kind){return{id:uid(),name,kind,rows:2,mpr:13,items:[]}}
function mkCirc(k,o={}){const sp=CIRC[k];const c={k,label:o.label??sp.n,room:o.room||'',etage:o.etage||'',n:o.n||0,p:o.p??sp.p,sec:sp.sec,cal:sp.cal};
  if(sp.ptab){Object.assign(c,recommend(c))}
  return{id:uid(),t:'disj',row:0,col:0,c,feed:null}}
function mkItem(t,o={}){const it={id:uid(),t,row:0,col:0,feed:null};if(t==='id'){it.cal=o.cal||40;it.type=o.type||'AC'}return it}

const DEFAULT_HOME={name:'Maison exemple',surf:90,ch:3,sdb:1,tarif:'hc',chauf:0,plaque:true,four:true,ll:true,lv:true,sl:false,congel:true,ce:true,climN:1,climW:900,ve:'prv',vmc:true,volets:true,ext:true,foudre:false,div:false,brand:'schneider'};

function pack(list,max){const out=[];let cur=null;for(const [room,n] of list){if(!n)continue;if(!cur||cur.n+n>max){cur={rooms:[],n:0};out.push(cur)}cur.rooms.push(room);cur.n+=n}return out}
function generate(h){
  const P={v:1,arr:'auto',name:h.name||'Mon logement',surf:+h.surf||90,tarif:h.tarif||'base',kva:9,foudre:!!h.foudre,brand:h.brand||'schneider',stock:{},boards:[],cur:null,home:clone(h)};
  const B=newBoard('Tableau principal','principal');P.boards.push(B);P.cur=B.id;
  const ch=Math.max(0,+h.ch||0), sdb=Math.max(0,+h.sdb||0), add=it=>B.items.push(it);
  const S0=+h.surf||90, sej=Math.round(Math.max(15,Math.min(60,S0*0.32))), upR=+h.niveaux===2;
  P.rooms=[mkRoom('sejour','Séjour',sej,{etage:'RDC'}),mkRoom('cuisine','Cuisine',S0>40?10:6,{etage:'RDC'}),mkRoom('entree','Entrée',5,{etage:'RDC'}),mkRoom('wc','WC',2,{etage:'RDC'}),mkRoom('couloir','Couloir',S0>60?6:4,{etage:upR?'Étage 1':'RDC'})];
  for(let i=1;i<=ch;i++)P.rooms.push(mkRoom('chambre',`Chambre ${i}`,11,{etage:upR?'Étage 1':'RDC'}));
  for(let i=1;i<=sdb;i++)P.rooms.push(mkRoom('sdb',sdb>1?`Salle de bain ${i}`:'Salle de bain',5,{etage:upR?'Étage 1':'RDC',pts:2}));
  const rs=t=>P.rooms.filter(r=>r.type===t);
  const lum=[['séjour',3],['cuisine',2],['entrée',2],['WC',1]];
  for(let i=1;i<=ch;i++)lum.push([`ch.${i}`,1]);
  for(let i=1;i<=sdb;i++)lum.push([sdb>1?`SdB ${i}`:'SdB',2]);
  if(h.ext)lum.push(['ext.',2]);
  const up=+h.niveaux===2, F=r=>r==='ext.'?'Extérieur':up&&/^(ch\.|SdB|couloir)/.test(r)?'Étage 1':'RDC';
  const byFloor=(list,max,mk)=>[...new Set(list.map(x=>F(x[0])))].forEach(f=>pack(list.filter(x=>F(x[0])===f),max).forEach(g=>{const it=mk(g);it.c.etage=f;add(it)}));
  byFloor(lum,7,g=>mkCirc('eclairage',{label:'Écl. '+g.rooms.join(', '),n:g.n,p:Math.max(300,g.n*80)}));
  const pc=[['séjour',rs('sejour')[0].socles],['entrée',1]];
  for(let i=1;i<=ch;i++)pc.push([`ch.${i}`,3]);
  for(let i=1;i<=sdb;i++)pc.push([sdb>1?`SdB ${i}`:'SdB',1]);
  if(rs('couloir')[0].socles)pc.push(['couloir',rs('couloir')[0].socles]);
  byFloor(pc,12,g=>mkCirc('prises',{label:'PC '+g.rooms.join(', '),n:g.n}));
  add(mkCirc('cuisine',{label:'PC plan de travail',n:6,room:'cuisine'}));
  [['chaudiere','Chaudière gaz'],['plaque','Plaque'],['four','Four'],['ll','Lave-linge'],['lv','Lave-vaisselle'],['sl','Sèche-linge'],['frigo','Réfrigérateur'],['congel','Congélateur'],['ce','Chauffe-eau']].forEach(([k,l])=>{if(h[k])add(mkCirc(k,{label:l}))});
  if(+h.chauf>0){const n=Math.ceil(+h.chauf/3500);for(let i=0;i<n;i++)add(mkCirc('chauffage',{label:`Chauffage ${i+1}`,p:Math.round(+h.chauf/n)}))}
  for(let i=0;i<(+h.climN||0);i++)add(mkCirc('clim',{label:`Clim ${i+1}`,p:+h.climW||1200,etage:up&&i>0?'Étage 1':'RDC'}));
  if(h.pac)add(mkCirc('pac',{label:'Pompe à chaleur',p:+h.pacW||3500}));
  if(h.ve==='irve')add(mkCirc('irve',{label:'Borne VE'}));
  if(h.ve==='prv')add(mkCirc('prv',{label:'Prise VE'}));
  if(h.vmc)add(mkCirc('vmc',{label:'VMC'}));
  if(h.volets)add(mkCirc('volets',{label:'Volets'}));
  if(h.ext)add(mkCirc('ext',{label:'Extérieur'}));
  add(mkCirc('com',{label:'Coffret com.'}));
  // circuits imposés par la norme même sans l'appareil : cuisson 32 A et 3 circuits spécialisés
  if(!h.plaque)add(mkCirc('plaque',{label:'Cuisson 32 A (en attente)',p:0}));
  const nSpe=B.items.filter(i=>i.t==='disj'&&['four','ll','lv','sl','congel','frigo','mo'].includes(i.c.k)).length;
  for(let i=nSpe;i<3;i++)add(mkCirc('autre',{label:'Circuit spécialisé en attente',p:0}));
  B.items.forEach(i=>{if(i.t==='disj'&&!i.c.etage)i.c.etage=['ext','portail','piscine','spa','irve','prv'].includes(i.c.k)?'Extérieur':'RDC'});
  if(h.ce&&P.tarif==='hc')add(mkItem('cont'));
  if(h.foudre)add(mkItem('para'));
  if(h.div){
    const D=newBoard('Garage','div');P.boards.push(D);
    D.items.push(mkItem('sect'),mkCirc('eclairage',{label:'Écl. garage',n:3,p:300}),mkCirc('prises',{label:'PC garage',n:4}),mkCirc('prises',{label:'PC atelier',n:3}));
    const f=mkCirc('div',{label:'Départ garage'});f.c.board=D.id;f.feed='head';B.items.push(f);
    optimise(P,D);Object.assign(f.c,recommend(f.c,P));
  }
  P.kva=suggestKva(P);
  P.boards.filter(x=>x.kind==='div').forEach(D=>optimise(P,D));
  optimise(P,B);
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
  if(c.k==='prises'&&(+c.n||0)<=8&&c.sec===1.5)return{cal:16,sec:1.5};
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
  const bins=[];const AM=amontA(P,b),CAPW=AM<=63?Infinity:63;const newBin=(type,cal)=>{const bn={id:mkItem('id',{type,cal}),list:[],load:0,w:0};bins.push(bn);return bn};
  const put=(bn,i)=>{bn.list.push(i);bn.load+=L(i);bn.w+=wCal(i)};
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
  const pick=(c,l,i)=>{let best=null;for(const bn of c){if(bn.list.length>=8||bn.load+l>63*230||(i&&bn.w+wCal(i)>CAPW))continue;if(!best||bn.load<best.load)best=bn}return best};
  const place=(i,pref)=>{let bn=pick(pref,L(i),i)||pick(general,L(i),i);if(!bn){bn=newBin('AC',40);ACbins.push(bn);general.push(bn)}put(bn,i)};
  recA.forEach(i=>place(i,Abins.length?Abins:general));
  const rr=(list,off)=>list.forEach((i,k)=>{const pool=ACbins.length>=2?ACbins:general;place(i,[pool[(k+off)%pool.length]])});
  const byEt=(a,c)=>String(a.c.etage||'').localeCompare(String(c.c.etage||''));
  rr(rest.filter(i=>i.c.k==='eclairage').sort(byEt),0);
  rr(rest.filter(i=>i.c.k==='prises').sort(byEt),1);
  rest.filter(i=>i.c.k!=='eclairage'&&i.c.k!=='prises').sort((a,c)=>L(c)-L(a)).forEach(i=>place(i,general));
  const order=Object.keys(CIRC);
  let finalBins=bins.filter(bn=>bn.list.length||isP);
  finalBins.forEach(bn=>{
    bn.list.sort((a,c)=>order.indexOf(a.c.k)-order.indexOf(c.c.k));
    const I=bn.load/230,aw=bn.w;bn.id.cal=bn.id.cal===25&&I<=25&&aw<=25?25:(I<=40&&aw<=40?40:63);
  });
  conts.forEach(ct=>{const bn=finalBins.find(x=>x.list.some(i=>i.c.k==='ce'));if(bn){const k=bn.list.findIndex(i=>i.c.k==='ce');bn.list.splice(k+1,0,ct)}else if(finalBins[0])finalBins[0].list.push(ct)});
  tls.forEach(t=>{const bn=finalBins.find(x=>x.list.some(i=>i.t==='disj'&&i.c.k==='eclairage'))||finalBins[0];if(bn)bn.list.push(t)});
  layout(b,[...head,...feeds],finalBins.map((bn,bi)=>({id:bn.id,list:bi===finalBins.length-1?[...bn.list,...prises]:bn.list})),finalBins.length?[]:prises);
}
/* Places utilisables par rangée : on garde 20 % de modules libres sur chaque rangée (arrondi au module supérieur) */
function rowCap(M){return M-Math.ceil(M*0.2)}
function reserveNeed(b){return Math.ceil(b.rows*b.mpr*0.2)}
function layout(b,direct,groups,extra=[]){
  const M=b.mpr,CAP=rowCap(M);let row=0,col=0;
  const at=it=>{const w=W[it.t];if(col+w>CAP){row++;col=0}it.row=row;it.col=col;col+=w};
  direct.forEach(i=>{if(i.feed!=='head')i.feed=null;at(i)});
  extra.forEach(i=>{i.feed=null;at(i)});
  groups.forEach(g=>{const grp=[g.id,...g.list];const w=grp.reduce((a,i)=>a+W[i.t],0);if(col>0&&col+w>CAP){row++;col=0}
    grp.forEach((it,k)=>{at(it);if(k>0)it.feed=it.row!==g.id.row?g.id.id:null})});
  b.items=[...new Set([...direct,...extra,...groups.flatMap(g=>[g.id,...g.list])])];
  const used=col===0&&row>0?row:row+1;let rows=Math.max(1,used);
  const um=usedMods(b);while(rows*M-um<Math.ceil(rows*M*0.2))rows++;
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
  const out=[];const add=(lvl,msg,b,it,why,fix)=>out.push({lvl,msg,b:b?.id,item:it?.id,why,fix:fix&&fix.length?fix:undefined});
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
      if(c.k!=='div'&&+c.p>0){
        const cook=['plaque','cuisiniere'].includes(c.k), I=(+c.p)*(cook?0.8:1)/230, W_=Math.round(+c.p*(cook?0.8:1)).toLocaleString('fr-FR');
        const up=x=>{const cal=CALS.find(k=>k>=x&&k>=c.cal);if(!cal||c.k==='eclairage'&&cal>16)return [];const sec=Math.max(c.sec,SECS.find(z=>MAXCAL[z]>=cal)||16);return[{label:`Passer en ${cal} A · ${fmt(sec)} mm²`,op:{k:'set',item:it.id,vals:{cal,sec}}}]};
        if(I>c.cal)add('warn',`${nm} : ${W_} W demandent ${I.toFixed(1).replace('.',',')} A, plus que le disjoncteur ${c.cal} A. Il va sauter.`,b,it,`Courant = puissance ÷ 230 V, soit ${W_} ÷ 230 = ${I.toFixed(1).replace('.',',')} A. Un disjoncteur coupe quand le courant dépasse son calibre. Le Consuel ne mesure pas la puissance de tes appareils (ce point ne bloque pas l’attestation), mais à l’usage ça disjonctera. Il faut un calibre plus fort et la section de câble qui va avec${c.k==='eclairage'?' (pour l’éclairage, 16 A maximum : partage plutôt en deux circuits)':''}.`,up(I));
        else if(I>c.cal*0.85&&!['prises','cuisine'].includes(c.k))add('warn',`${nm} : ${I.toFixed(1).replace('.',',')} A pour un disjoncteur ${c.cal} A (${Math.round(I/c.cal*100)} % de sa capacité).`,b,it,'Au-dessus de 85 %, il reste peu de marge : un démarrage de moteur ou un appareil de plus peut le faire sauter. Pas bloquant pour le Consuel.',up(I*1.18));
      }
      if(c.k==='div'){const db=boardOf(P,c.board);
        if(!db)add('err',`${nm} n’alimente aucun tableau.`,b,it,'Choisis le tableau divisionnaire alimenté dans les réglages du disjoncteur.');
        else{const I=boardLoad(P,db)/230;const r=DIVTABLE.find(x=>x[0]>=I*1.1);if(I>c.cal)add('warn',`${nm} : le tableau « ${db.name} » tire environ ${Math.round(I)} A pour un départ ${c.cal} A. Il va sauter.`,b,it,'La charge estimée du divisionnaire (ses circuits, avec leurs coefficients d’utilisation) dépasse le calibre du départ. Augmente le calibre et la section : 6 mm²/32 A, 10 mm²/40 A, 16 mm²/63 A.',r?[{label:`Passer en ${r[0]} A · ${fmt(r[1])} mm²`,op:{k:'set',item:it.id,vals:{cal:r[0],sec:r[1]}}}]:[])}}
      if(!id){
        if(c.k==='div'){const db=boardOf(P,c.board);if(db&&!db.items.some(i=>i.t==='id'))add('err',`${nm} : le tableau « ${db.name} » n’a aucun différentiel 30 mA.`,b,it,'Si le départ n’est pas derrière un 30 mA, le tableau divisionnaire doit avoir ses propres interrupteurs différentiels.')}
        else add('err',`${nm} n’est protégé par aucun différentiel 30 mA.`,b,it,'Tous les circuits d’un logement passent par un interrupteur différentiel 30 mA. Place le disjoncteur à droite d’un différentiel (peigne) ou tire un fil vers un différentiel.');
      }else{
        const PEIGNE=' Un disjoncteur est alimenté par le différentiel le plus proche à sa gauche sur la même rangée (peigne), ou par le fil que tu as tiré.';
        const fixA=(solo)=>{const f=ids.filter(d=>d.type!=='AC'&&d.id!==id.id&&!idCirc[d.id].some(x=>x.t==='disj'&&CIRC[x.c.k]&&CIRC[x.c.k].irve)&&(solo?idCirc[d.id].filter(x=>x.t==='disj'||x.t==='prise').length===0:idCirc[d.id].filter(x=>x.t==='disj'||x.t==='prise').length<8)).slice(0,2).map(d=>({label:`Brancher sur ${idName(b,d)} (type ${d.type})`,op:{k:'feed',item:it.id,to:d.id}}));
          f.push({label:`Passer ${idName(b,id)} en type A`,op:{k:'idtype',id:id.id,type:'A'}});return f};
        if(sp.A&&id.type==='AC')add('err',`${nm} est sur ${idName(b,id)}, un différentiel type AC : il faut un type A (ou F).`,b,it,(TYWHY[c.k]||'Courants de fuite que le type AC ne détecte pas toujours.')+PEIGNE,fixA(false));
        if(sp.irve){if(id.type==='AC')add('err',`${nm} est sur ${idName(b,id)} (type AC) : type A ou F obligatoire.`,b,it,'Recharge de véhicule : 30 mA type A (borne avec détection courant continu) ou F, ou type B.'+PEIGNE,fixA(true));
          if(idCirc[id.id].filter(x=>x.t==='disj'||x.t==='prise').length>1)add('err',`${nm} doit avoir son propre différentiel 30 mA.`,b,it,'Chaque point de recharge est protégé individuellement par un différentiel 30 mA.')}
        if(sp.recA&&id.type==='AC')add('warn',`${nm} est sur ${idName(b,id)} (type AC). Un type A est conseillé pour cet appareil. Pas bloquant.`,b,it,(TYWHY[c.k]||'Appareil à variateur : le type AC voit mal ses fuites.')+PEIGNE,fixA(false));
      }
      if(+c.len>0){const lim=c.k==='eclairage'?3:c.k==='div'?2:5, dv=vdrop(+c.len,circI(P,it),c.sec);
        if(dv>lim){const s2=SECS.find(x=>x>=c.sec&&vdrop(+c.len,circI(P,it),x)<=lim&&MAXCAL[x]>=c.cal);
          add('warn',`${nm} : chute de tension ${dv.toFixed(1).replace('.',',')} % sur ${c.len} m (maximum conseillé ${lim} %).`,b,it,`Plus le câble est long, plus la tension baisse au bout : les appareils marchent mal et le câble chauffe. Limites : 3 % pour l’éclairage, 5 % pour le reste${c.k==='div'?', et environ 2 % pour l’alimentation d’un divisionnaire afin de laisser de la marge à ses circuits':''}.`,s2?[{label:`Passer en ${fmt(s2)} mm²`,op:{k:'field',item:it.id,key:'sec',v:s2}}]:[])}}
      if(c.k==='ce'&&P.tarif==='hc'&&!b.items.some(i=>i.t==='cont'))add('warn',`${nm} : ajoute un contacteur heures creuses.`,b,it,'Avec un abonnement heures creuses, le chauffe-eau est commandé par un contacteur jour/nuit.');
    }
    ids.forEach(d=>{
      const cs=idCirc[d.id].filter(x=>x.t==='disj'||x.t==='prise');const nm=`${idName(b,d)} (${b.name})`;
      if(cs.length>8)add('err',`${nm} protège ${cs.length} circuits (8 maximum).`,b,d,'Un interrupteur différentiel protège au plus 8 circuits. Ajoute un différentiel.');
      if(!cs.length)add('warn',`${nm} ne protège aucun circuit.`,b,d,'Place des disjoncteurs à sa droite sur la même rangée, ou câble-les vers lui.');
      const aval=cs.reduce((a,i)=>a+wCal(i),0), am=amontA(P,b);
      if(d.cal<aval&&d.cal<am){const full=cs.filter(i=>i.t==='disj'&&(FULLK.has(i.c.k)||i.c.k==='div')).reduce((a,i)=>a+(+i.c.cal),0),half=cs.filter(i=>i.t==='disj'&&!FULLK.has(i.c.k)&&i.c.k!=='div').reduce((a,i)=>a+(+i.c.cal),0);
        const nc=[25,40,63].find(x=>x>=aval)||(63>=am?63:null);
        add('err',`${nm} : calibre ${d.cal} A trop faible (règle de l’aval : ${fmt(Math.round(aval*10)/10)} A).`,b,d,`NF C 15-100, règle de l’aval : on compte en entier les disjoncteurs du chauffage, de l’eau chaude et de la recharge de voiture (${full} A), et la moitié des autres (${half} A ÷ 2 = ${fmt(half/2)} A). Total ${fmt(Math.round(aval*10)/10)} A : le différentiel doit être au moins de ce calibre. Sinon, règle de l’amont : un différentiel au moins égal au réglage ${b.kind==='principal'?'du disjoncteur de branchement':'du départ qui alimente ce tableau'} (${am} A) convient aussi.${nc?'':' Ici, aucun calibre ne suffit : répartis des circuits sur un autre différentiel.'}`,nc?[{label:`Passer en ${nc} A`,op:{k:'idcal',id:d.id,cal:nc}}]:[{label:'Optimiser le tableau',op:{k:'optimise',board:b.id}}]);}
      if(d.cal===25&&cs.some(i=>i.t==='disj'&&(['plaque','cuisiniere','chauffage','ce','plancher','irve'].includes(i.c.k))))add('warn',`${nm} : un 25 A est réservé aux petits circuits.`,b,d,'Le différentiel 25 A sert dans les petits logements (35 m² ou moins) aux circuits légers. Pour la cuisson, le chauffage ou l’eau chaude, prends un 40 A.',[{label:'Passer en 40 A',op:{k:'idcal',id:d.id,cal:40}}]);
      const I=cs.reduce((a,i)=>a+loadOf(P,i),0)/230;
      if(I>d.cal)add('warn',`${nm} : environ ${Math.round(I)} A en charge pour un calibre ${d.cal} A.`,b,d,'Passe en 63 A ou répartis les gros appareils (plaque, chauffage, recharge) sur d’autres différentiels.');
    });
    const tot=b.rows*b.mpr, freeM=tot-usedMods(b), need=reserveNeed(b);
    if(freeM<need)add('err',`${b.name} : ${freeM} module${freeM>1?'s':''} libre${freeM>1?'s':''} sur ${tot}, il en faut au moins ${need} (réserve de 20 %).`,b,null,`NF C 15-100 : chaque tableau garde une réserve d’au moins 20 % de sa place, arrondie au module supérieur (${tot} × 20 % = ${(tot*0.2).toLocaleString('fr-FR')}, donc ${need} modules). Elle sert aux ajouts futurs sans changer de tableau. Le Consuel la vérifie.`,[{label:'Ajouter une rangée',op:{k:'addrow',board:b.id}}]);
    else{const cap=rowCap(b.mpr);const full=[];for(let r=0;r<b.rows;r++){const u=b.items.filter(i=>i.row===r).reduce((a,i)=>a+W[i.t],0);if(u>cap)full.push(r+1)}
      if(full.length)add('warn',`${b.name} : rangée${full.length>1?'s':''} ${full.join(', ')} sans réserve (plus de ${cap} modules utilisés sur ${b.mpr}).`,b,null,`La réserve de 20 % doit être répartie sur toutes les rangées : garde environ ${b.mpr-cap} modules libres par rangée de ${b.mpr}. Pas bloquant si la réserve totale est bonne, mais c’est la bonne pratique des fabricants.`,[{label:'Ranger le tableau',op:{k:'tidy',board:b.id}}])}
    if(b.kind==='div'){
      if(['Annexe','Extérieur'].includes(b.etage))add('info',`${b.name} est dans un bâtiment séparé : câble enterré.`,b,null,'Câble U1000 R2V (ou AR2V) dans une gaine TPC rouge, à 50 cm de profondeur minimum, avec un grillage avertisseur rouge 20 cm au-dessus. Pense à la terre du bâtiment et indique la longueur du câble sur le départ pour vérifier la chute de tension.');
      if(!b.items.some(i=>i.t==='sect'))add('warn',`${b.name} : ajoute un interrupteur de tête.`,b,null,'Un tableau divisionnaire a un dispositif de coupure en tête pour couper tout le tableau sur place.');
      if(!prin.items.some(i=>i.t==='disj'&&i.c.k==='div'&&i.c.board===b.id))add('err',`${b.name} n’est alimenté par aucun départ du tableau principal.`,b,null,'Ajoute un disjoncteur « Départ tableau divisionnaire » dans le tableau principal.');
    }
  }
  const allC=P.boards.flatMap(b=>b.items.filter(i=>i.t==='disj').map(i=>i.c));
  // câble d'arrivée AGCP → tableau
  const arr=arrSec(P), agcp=P.kva*5;
  if(agcp>ARRMAX[arr])add('err',`Câble d’arrivée ${arr} mm² trop fin pour l’AGCP réglé à ${agcp} A (maximum ${ARRMAX[arr]} A).`,prin,null,'Entre l’AGCP et le tableau : 10 mm² jusqu’à 60 A (12 kVA), 16 mm² au-delà.',[{label:'Passer le câble en 16 mm²',op:{k:'proj',key:'arr',v:16}},{label:`Abonnement 12 kVA (AGCP 60 A)`,op:{k:'proj',key:'kva',v:12}}]);
  // étages : conseils de répartition
  const floors={};let upper=0;
  P.boards.forEach(b=>{const fm=feedMap(b);b.items.forEach(i=>{
    if(i.t!=='disj'||!i.c.etage||i.c.k==='div')return;
    if(!['RDC','Extérieur','Garage','Annexe','Sous-sol'].includes(i.c.etage))upper++;
    if(b.kind==='div'&&b.etage&&i.c.etage!==b.etage)add('info',`« ${i.c.label||CIRC[i.c.k].n} » part du tableau « ${b.name} » (${b.etage}) vers ${i.c.etage}.`,b,i,'Ce n’est pas interdit. Vérifie la longueur du câble : au-delà d’une trentaine de mètres, la chute de tension peut imposer une section plus grosse.');
    if(i.c.k!=='eclairage'&&i.c.k!=='prises')return;
    const f=floors[i.c.etage]||(floors[i.c.etage]={e:new Set(),p:new Set(),ne:0,b});const k=b.id+':'+(fm[i.id].by||'none');
    if(i.c.k==='eclairage'){f.e.add(k);f.ne++}else f.p.add(k);})});
  Object.entries(floors).filter(([et])=>!['Annexe','Extérieur','Garage'].includes(et)).forEach(([et,f])=>{
    if(f.e.size===1&&f.p.size===1&&[...f.e][0]===[...f.p][0])add('warn',`${et} : l’éclairage et les prises sont tous sur le même différentiel.`,f.b,null,`Si ce différentiel saute, plus de lumière ni de prise à cet étage (${et}). Mets l’éclairage et les prises de l’étage sur deux différentiels différents.`);
    else if(f.ne>=2&&f.e.size===1)add('info',`${et} : tous les circuits d’éclairage sont sur le même différentiel.`,f.b,null,'Répartir l’éclairage d’un même étage sur deux différentiels évite le noir complet en cas de défaut.');
  });
  const levels=Object.keys(floors).filter(x=>!['Extérieur','Garage','Annexe'].includes(x));
  if(levels.length>=2&&upper>=6&&!P.boards.some(b=>b.kind==='div'))add('info',`${levels.length} niveaux et ${upper} circuits hors rez-de-chaussée : pense à un tableau divisionnaire à l’étage.`,prin,null,'Un tableau à l’étage raccourcit les câbles (moins de chute de tension, moins de cuivre) et simplifie les dépannages. Il est alimenté par un seul câble depuis le tableau principal.');
  // éclairage et prises : au moins deux différentiels pour tout le logement
  for(const [k,lab] of [['eclairage','l’éclairage'],['prises','les prises']]){
    const list=[],ids=new Set();P.boards.forEach(b=>{const fm=feedMap(b);b.items.forEach(i=>{if(i.t==='disj'&&i.c.k===k){list.push(i);const by=fm[i.id].by;ids.add(by?b.id+':'+by:(b.kind==='div'?'div:'+b.id:'none'))}})});
    if(list.length>=2&&ids.size<2)add('err',`Tout ${lab==='l’éclairage'?'l’éclairage est':'les prises sont'} sur le même différentiel.`.replace('Tout les','Toutes les'),prin,null,`NF C 15-100 : les circuits ${k==='eclairage'?'d’éclairage':'de prises'} du logement sont répartis sur au moins deux interrupteurs différentiels. Si l’un saute, une partie du logement garde ${k==='eclairage'?'la lumière':'du courant'}. « Optimiser tout » fait la répartition.`,[{label:'Optimiser le tableau principal',op:{k:'optimise',board:prin.id}}]);
  }
  // pièces : équipement minimum
  const rooms=P.rooms||[];
  rooms.forEach(r=>{const q=roomReq(r),t=ROOMT[r.type]||ROOMT.autre,nm=r.name||t.n;
    if((+r.socles||0)<q.socles)add('err',`${nm} : ${+r.socles||0} socle${(+r.socles||0)>1?'s':''} de prise, il en faut au moins ${q.socles}.`,prin,null,`NF C 15-100, ${t.n.toLowerCase()} : ${t.why} Une prise double compte pour 2 socles.`,[{label:`Mettre ${q.socles} socles`,op:{k:'room',id:r.id,key:'socles',v:q.socles}}]);
    if((+r.pts||0)<q.pts)add('err',`${nm} : aucun point d’éclairage.`,prin,null,`NF C 15-100, ${t.n.toLowerCase()} : ${t.why}`,[{label:'Ajouter 1 point',op:{k:'room',id:r.id,key:'pts',v:1}}]);
  });
  if(rooms.length){
    const allD=P.boards.flatMap(b=>b.items.filter(i=>i.t==='disj'));
    const needPC=rooms.filter(r=>r.type!=='cuisine').reduce((a,r)=>a+(+r.socles||0),0), havePC=allD.filter(i=>i.c.k==='prises').reduce((a,i)=>a+(+i.c.n||0),0);
    if(needPC>havePC)add('err',`Les pièces ont ${needPC} socles de prise, mais les circuits de prises n’en prévoient que ${havePC}.`,prin,null,`Chaque socle des pièces doit être sur un circuit de prises (8 maximum en 1,5 mm², 12 en 2,5 mm²). Il te faut au moins ${Math.ceil(needPC/12)} circuit(s) de prises en 2,5 mm² : ajoute des circuits ou indique le nombre de socles dans les réglages de chaque circuit.`);
    const needK=rooms.filter(r=>r.type==='cuisine').reduce((a,r)=>a+(+r.socles||0),0), haveK=allD.filter(i=>i.c.k==='cuisine').reduce((a,i)=>a+(+i.c.n||0),0);
    if(needK>haveK)add('err',`La cuisine a ${needK} socles, mais le circuit « Prises plan de travail » n’en prévoit que ${haveK}.`,prin,null,'Les prises de la cuisine sont sur un circuit dédié 20 A en 2,5 mm², 6 socles au maximum par circuit. Ajoute un circuit « Prises plan de travail » si besoin.');
    const needL=rooms.reduce((a,r)=>a+(+r.pts||0),0), haveL=allD.filter(i=>i.c.k==='eclairage').reduce((a,i)=>a+(+i.c.n||0),0);
    if(needL>haveL)add('err',`Les pièces ont ${needL} points d’éclairage, mais les circuits d’éclairage n’en prévoient que ${haveL}.`,prin,null,`Chaque point d’éclairage est sur un circuit d’éclairage (8 points maximum par circuit). Il te faut au moins ${Math.ceil(needL/8)} circuit(s) d’éclairage.`);
  }
  // nouveautés 2024 : recommandations
  if(allC.some(c=>['prises','vmc','piscine'].includes(c.k)))add('info','Détecteur d’arc (DPDA) recommandé.',prin,null,'Depuis 2024, la norme recommande un dispositif de protection contre les arcs (détecteur d’arc) sur les circuits de prises des chambres et des lieux à risque d’incendie, et sur les circuits toujours alimentés (VMC, pompe de piscine). Ce n’est pas obligatoire.');
  if(prin.items.some(i=>i.t==='para'))add('info','Parafoudre : pense aux équipements éloignés et à la ligne téléphone.',prin,null,'Depuis 2024 : un parafoudre supplémentaire est recommandé pour les équipements à plus de 10 m du tableau (avant : 30 m), et le réseau de communication cuivre doit aussi avoir son parafoudre quand le tableau en a un.');
  const s=+P.surf||0, req=s<=35?2:s<=100?3:4;
  if(allIds.length<req)add('err',`Pour ${s} m², il faut au moins ${req} interrupteurs différentiels 30 mA (tu en as ${allIds.length}).`,prin,null,'NF C 15-100 : jusqu’à 35 m² : 2 · de 35 à 100 m² : 3 · plus de 100 m² : 4, dont au moins un type A.');
  if(!allC.some(c=>(c.k==='plaque'||c.k==='cuisiniere')&&c.cal>=32))add('err','Il manque le circuit cuisson 32 A.',prin,null,'NF C 15-100 : tout logement a un circuit spécialisé 32 A en 6 mm² pour la plaque ou la cuisinière, même si tu cuisines au gaz aujourd’hui : il sert au futur occupant. Glisse « Plaque de cuisson » ou « Cuisinière » dans le tableau.');
  const spe=allC.filter(c=>['four','ll','lv','sl','congel','frigo','mo'].includes(c.k)||(c.k==='autre'&&c.cal>=16&&c.sec>=2.5)).length;
  if(spe<3)add('err',`${spe} circuit${spe>1?'s':''} spécialisé${spe>1?'s':''} pour le gros électroménager : il en faut au moins 3.`,prin,null,'NF C 15-100 : en plus du circuit cuisson, un logement a au moins 3 circuits spécialisés 2,5 mm² / 20 A, un par gros appareil (lave-linge, lave-vaisselle, four, sèche-linge, congélateur…). Même sans l’appareil aujourd’hui, le circuit doit être prévu : un « Autre circuit » 20 A en 2,5 mm² compte comme circuit en attente.');
  if(!allC.some(c=>c.k==='com'))add('err','Il manque le circuit du tableau de communication.',prin,null,'NF C 15-100 : le tableau de communication (box, réseau, TV) dans la gaine technique est alimenté par un circuit dédié. Le Consuel vérifie sa présence. Glisse « Tableau de communication » dans le tableau.');
  if(!allIds.some(d=>d.type!=='AC'))add('err','Il faut au moins un différentiel type A (ou F).',prin,null,'Le type A protège la plaque de cuisson et le lave-linge.');
  if(P.foudre&&!prin.items.some(i=>i.t==='para'))add('err','Parafoudre obligatoire dans ta zone (ou bâtiment avec paratonnerre).',prin,null,'Le parafoudre se place en tête du tableau principal, avec son dispositif de déconnexion.');
  const pf=demand(P);
  if(pf>P.kva*1000)add('warn',`Puissance estimée ${kw(pf)}, plus que l’abonnement ${P.kva} kVA.`,prin,null,`Passe à ${suggestKva(P)} kVA ou installe un délestage. Sinon, le disjoncteur de branchement (AGCP) risque de couper.`,[{label:`Passer à ${suggestKva(P)} kVA`,op:{k:'proj',key:'kva',v:suggestKva(P)}}]);
  return out;
}

/* Modèles de tableaux divisionnaires */
const DIVTPL={
  atelier:{name:'Atelier',ic:'🛠️',etage:'Annexe',cal:32,len:25,desc:'Bâtiment séparé : lumière, prises, machines.',items:[['eclairage',{label:'Écl. atelier',n:3,p:300}],['prises',{label:'PC atelier',n:6}],['atelier',{label:'Machines atelier'}],['ext',{label:'Écl. extérieur'}]]},
  garage:{name:'Garage',ic:'🚗',etage:'Garage',cal:32,len:10,desc:'Lumière, prises, porte motorisée.',items:[['eclairage',{label:'Écl. garage',n:3,p:300}],['prises',{label:'PC garage',n:4}],['portail',{label:'Porte de garage'}]]},
  etage:{name:'Étage',ic:'🏠',etage:'Étage 1',cal:40,len:15,desc:'Chambres et salle de bain à l’étage.',items:[['eclairage',{label:'Écl. chambres',n:5,p:400}],['eclairage',{label:'Écl. SdB, couloir',n:4,p:300}],['prises',{label:'PC chambres',n:9}],['prises',{label:'PC SdB, couloir',n:3}],['volets',{label:'Volets étage'}],['seche',{label:'Sèche-serviettes',p:750}]]},
  abri:{name:'Abri de jardin',ic:'🌳',etage:'Extérieur',cal:20,len:30,desc:'Petit abri : une lumière, quelques prises.',items:[['eclairage',{label:'Écl. abri',n:2,p:150}],['prises',{label:'PC abri',n:3}]]},
  piscine:{name:'Piscine',ic:'🏊',etage:'Extérieur',cal:32,len:20,desc:'Local technique : filtration, éclairage.',items:[['piscine',{label:'Filtration'}],['eclairage',{label:'Projecteurs (TBTS)',n:2,p:100}],['prises',{label:'PC local technique',n:2}]]},
  vide:{name:'Divisionnaire',ic:'🗄️',etage:'',cal:32,len:0,desc:'Tableau vide à remplir toi-même.',items:[]}
};
function addDivBoard(P,key){
  const T=DIVTPL[key]||DIVTPL.vide, n=P.boards.filter(b=>b.kind==='div'&&b.name.startsWith(T.name)).length;
  const D=newBoard(T.name+(n?' '+(n+1):''),'div');D.etage=T.etage;
  D.items.push(mkItem('sect'));T.items.forEach(([k,o])=>{const it=mkCirc(k,{...o,etage:T.etage});D.items.push(it)});
  P.boards.push(D);optimise(P,D);
  if(!D.items.some(i=>i.t==='id')){D.items.push(Object.assign(mkItem('id',{cal:40,type:'A'}),{row:0,col:2}))}
  const r=DIVTABLE.find(x=>x[0]>=T.cal)||[T.cal,T.cal<=20?2.5:6];
  const f=mkCirc('div',{label:'Départ '+D.name});f.c.board=D.id;f.feed='head';f.c.cal=r[0];f.c.sec=r[1];if(T.cal===20){f.c.cal=20;f.c.sec=2.5}f.c.len=T.len;
  const B=principal(P), w=1;let spot=null;
  for(let rr=0;rr<B.rows&&!spot;rr++)for(let c=0;c+w<=B.mpr&&!spot;c++)if(!B.items.some(i=>i.row===rr&&c<i.col+W[i.t]&&i.col<c+w))spot=[rr,c];
  if(!spot){B.rows++;spot=[B.rows-1,0]}
  f.row=spot[0];f.col=spot[1];B.items.push(f);
  const s2=SECS.find(x=>x>=f.c.sec&&vdrop(f.c.len,circI(P,f),x)<=2&&MAXCAL[x]>=f.c.cal);if(s2)f.c.sec=s2;
  return D;
}

/* Prix publics indicatifs TTC (France, 2025-2026), marque « milieu de gamme ».
   Ordres de grandeur pour un budget, à vérifier chez le fournisseur. */
const BRAND_K={generic:.8,schneider:1,legrand:1.1};
function unitPrice(key){
  const [t,a,b]=key.split('-');
  if(t==='coffret'){const [r,m]=a.split('x').map(Number);return Math.round(([0,28,50,75,100,130,160,190,220][r]||220)*(m===18?1.3:1))}
  if(t==='disj'){const c=+a;return c<=20?14:c<=32?17:c<=40?26:42}
  if(t==='id'){const c=+a;return({AC:c>=63?62:42,A:c>=63?105:72,F:c>=63?160:125})[b]||72}
  if(t==='peigne')return +a===18?14:10;
  if(t==='fil')return 4;
  if(t==='m')return({para:95,cont:32,tl:30,sect:26,prise:16})[a]||20;
  if(t==='cable')return({'1.5':0.9,'2.5':1.4,'4':2.2,'6':3.5,'10':6,'16':9})[a]||2;
  return 0;
}
function priceOf(P,key){const own=P.prices&&P.prices[key];if(own!==undefined&&own!=='')return +own;const k=key.startsWith('cable')?1:(BRAND_K[P.brand]||1);return Math.round(unitPrice(key)*k*100)/100}

/* Applique une correction proposée par analyse() */
function applyFix(P,op){
  const find=id=>{for(const b of P.boards){const it=b.items.find(i=>i.id===id);if(it)return it}return null};
  if(op.k==='feed'){const it=find(op.item);if(it)it.feed=op.to}
  if(op.k==='idtype'){const d=find(op.id);if(d)d.type=op.type}
  if(op.k==='proj')P[op.key]=op.v;
  if(op.k==='idcal'){const d=find(op.id);if(d)d.cal=op.cal}
  if(op.k==='room'){const r=(P.rooms||[]).find(x=>x.id===op.id);if(r)r[op.key]=op.v}
  if(op.k==='optimise'){const b=P.boards.find(x=>x.id===op.board);if(b)optimise(P,b)}
  if(op.k==='field'){const it=find(op.item);if(it&&it.c)it.c[op.key]=op.v}
  if(op.k==='set'){const it=find(op.item);if(it&&it.c)Object.assign(it.c,op.vals)}
  const bd=op.board&&P.boards.find(b=>b.id===op.board);
  if(op.k==='addrow'&&bd)bd.rows=Math.min(8,bd.rows+1);
  if(op.k==='tidy'&&bd)tidy(P,bd);
}
if(typeof module!=='undefined')module.exports={ROOMT,roomReq,mkRoom,unitPrice,priceOf,rowCap,reserveNeed,DIVTPL,addDivBoard,vdrop,ETAGES,ARRMAX,arrSec,GROUPS,applyFix,MOD,MOD_H,ROW_H,W,MAXCAL,SECS,CALS,PTABLE,DIVTABLE,KVA,CIRC,TY,IDGUIDE,BR,
  newBoard,mkCirc,mkItem,generate,DEFAULT_HOME,loadOf,boardLoad,installed,principal,demand,suggestKva,recommend,feedMap,
  sortedIds,idName,usedMods,itemName,optimise,layout,tidy,attachDiv,analyse,boardOf,fmt};
