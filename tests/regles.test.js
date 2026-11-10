// Tests des règles NF C 15-100 (logement) : npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../regles.js');

const errs = P => R.analyse(P).filter(i => i.lvl === 'err');
const has = (P, re) => R.analyse(P).some(i => re.test(i.msg));

// Petit tableau de base : 1 rangée de 13, un différentiel 40 A type A et des disjoncteurs derrière
function projet(circuits, opts = {}) {
  const P = R.generate({ ...R.DEFAULT_HOME, ...opts.home });
  const B = R.principal(P);
  B.items = []; B.rows = opts.rows || 3; B.mpr = 13; P.rooms = []; P.boards = [B];
  const id = Object.assign(R.mkItem('id', { cal: opts.cal || 40, type: opts.type || 'A' }), { row: 0, col: 0 });
  B.items.push(id);
  circuits.forEach((c, k) => { c.row = 0; c.col = 2 + k; B.items.push(c); });
  return { P, B, id };
}
const disj = (k, o = {}) => { const it = R.mkCirc(k, o); Object.assign(it.c, o.c || {}); return it; };

test('le logement exemple généré est conforme', () => {
  const P = R.generate(R.DEFAULT_HOME);
  assert.deepEqual(errs(P), []);
});

test('logements variés générés sans erreur', () => {
  for (const h of [
    { surf: 30, ch: 0, sdb: 1, ve: 'none', climN: 0 },
    { surf: 140, ch: 4, sdb: 2, chauf: 9000, ve: 'irve', climN: 3, climW: 1100, foudre: true, div: true },
    { surf: 75, ch: 2, sdb: 1, pac: true, pacW: 4000, tarif: 'base' },
  ]) {
    const P = R.generate({ ...R.DEFAULT_HOME, ...h });
    assert.deepEqual(errs(P).map(e => e.msg), [], JSON.stringify(h));
  }
});

test('un calibre trop fort pour la section est refusé', () => {
  const { P } = projet([disj('autre', { c: { cal: 20, sec: 1.5, label: 'Test' } })]);
  assert.ok(has(P, /1,5 mm² ne supporte pas 20 A/));
});

test('éclairage : 8 points lumineux maximum', () => {
  assert.ok(!has(projet([disj('eclairage', { n: 8, label: 'É' })]).P, /points lumineux/));
  assert.ok(has(projet([disj('eclairage', { n: 9, label: 'É' })]).P, /9 points lumineux/));
});

test('prises : 8 socles en 1,5 mm², 12 en 2,5 mm²', () => {
  assert.ok(!has(projet([disj('prises', { n: 8, label: 'P', c: { cal: 16, sec: 1.5 } })]).P, /socles/));
  assert.ok(has(projet([disj('prises', { n: 9, label: 'P', c: { cal: 16, sec: 1.5 } })]).P, /maximum 8/));
  assert.ok(!has(projet([disj('prises', { n: 12, label: 'P' })]).P, /socles/));
  assert.ok(has(projet([disj('prises', { n: 13, label: 'P' })]).P, /maximum 12/));
});

test('plaque et lave-linge exigent un différentiel type A', () => {
  assert.ok(has(projet([disj('plaque', { label: 'Plaque' })], { type: 'AC' }).P, /type AC : il faut un type A/));
  assert.ok(!has(projet([disj('plaque', { label: 'Plaque' })], { type: 'A' }).P, /il faut un type A/));
});

test('un disjoncteur sans différentiel 30 mA est refusé', () => {
  const { P, B } = projet([]);
  const d = disj('prises', { n: 4, label: 'P' }); d.row = 1; d.col = 0; B.items.push(d);
  assert.ok(has(P, /aucun différentiel 30 mA/));
});

test('8 circuits maximum par différentiel', () => {
  const nine = Array.from({ length: 9 }, (_, k) => disj('prises', { n: 3, label: 'P' + k, p: 100 }));
  assert.ok(has(projet(nine).P, /protège 9 circuits/));
});

test('la recharge de véhicule a son propre différentiel', () => {
  assert.ok(has(projet([disj('prv', { label: 'VE' }), disj('four', { label: 'Four' })]).P, /son propre différentiel/));
});

test('nombre minimum de différentiels selon la surface', () => {
  const { P } = projet([disj('four', { label: 'Four' })], { home: { surf: 120 } });
  P.surf = 120;
  assert.ok(has(P, /au moins 4 interrupteurs différentiels/));
});

test('réserve de 20 % obligatoire', () => {
  const full = Array.from({ length: 11 }, (_, k) => disj('autre', { label: 'X' + k, p: 10 }));
  assert.ok(has(projet(full, { rows: 1 }).P, /réserve/));
});

test('chauffage : le disjoncteur suit la puissance', () => {
  assert.ok(has(projet([disj('chauffage', { label: 'Ch', p: 4000, c: { cal: 16, sec: 1.5 } })]).P, /va sauter/));
  assert.deepEqual(R.recommend({ k: 'chauffage', p: 4000 }), { cal: 20, sec: 2.5 });
  assert.deepEqual(R.recommend({ k: 'clim', p: 900 }), { cal: 10, sec: 1.5 });
});

test('départ divisionnaire en direct sur l’arrivée : le divisionnaire doit avoir ses différentiels', () => {
  const P = R.generate({ ...R.DEFAULT_HOME, div: true });
  const D = P.boards.find(b => b.kind === 'div');
  const feed = R.principal(P).items.find(i => i.t === 'disj' && i.c.k === 'div');
  assert.equal(feed.feed, 'head');
  assert.equal(R.feedMap(R.principal(P))[feed.id].via, 'direct');
  assert.deepEqual(errs(P), []);
  D.items = D.items.filter(i => i.t !== 'id');
  assert.ok(has(P, /n’a aucun différentiel 30 mA/));
});

test('un départ divisionnaire déposé crée son tableau', () => {
  const P = R.generate(R.DEFAULT_HOME);
  const f = R.mkCirc('div'); R.attachDiv(P, f);
  assert.equal(P.boards.length, 2);
  assert.equal(f.c.board, P.boards[1].id);
});

test('optimiser respecte 8 circuits, type A et réserve', () => {
  const P = R.generate({ ...R.DEFAULT_HOME, surf: 160, ch: 5, sdb: 2, chauf: 12000 });
  const B = R.principal(P);
  R.optimise(P, B);
  assert.deepEqual(errs(P).map(e => e.msg), []);
});

test('abonnement conseillé cohérent', () => {
  const P = R.generate(R.DEFAULT_HOME);
  assert.ok(R.KVA.includes(R.suggestKva(P)));
  assert.ok(R.demand(P) <= R.suggestKva(P) * 1000);
});

test('tous les appareils sont dans la palette', () => {
  const inGroups = new Set(R.GROUPS.flatMap(g => g[1]));
  for (const k of Object.keys(R.CIRC)) if (k !== 'div') assert.ok(inGroups.has(k), k);
  assert.ok(R.CIRC.frigo && R.CIRC.piscine && R.CIRC.seche);
});

test('clim derrière un type AC : conseil non bloquant, avec correction en un clic', () => {
  // Diff. 1 type AC à gauche de la clim, Diff. 2 type A 63 A à droite : la clim est sur le type AC
  const { P, B } = projet([], { type: 'AC' });
  const clim = disj('clim', { label: 'Clim salon', p: 900 }); clim.row = 0; clim.col = 2; B.items.push(clim);
  const idA = Object.assign(R.mkItem('id', { cal: 63, type: 'A' }), { row: 0, col: 4 }); B.items.push(idA);
  const w = R.analyse(P).find(i => i.item === clim.id);
  assert.equal(w.lvl, 'warn');
  assert.match(w.msg, /Diff\. 1 \(type AC\)/);
  assert.equal(w.fix[0].op.to, idA.id);
  R.applyFix(P, w.fix[0].op);
  assert.ok(!R.analyse(P).some(i => i.item === clim.id));
});

test('la correction ne branche jamais sur le différentiel de la voiture', () => {
  const P = R.generate(R.DEFAULT_HOME);
  const B = R.principal(P);
  const clim = B.items.find(i => i.t === 'disj' && i.c.k === 'clim');
  clim.feed = R.sortedIds(B).find(d => d.type === 'AC').id;
  const w = R.analyse(P).find(i => i.item === clim.id);
  R.applyFix(P, w.fix[0].op);
  assert.deepEqual(R.analyse(P).filter(i => i.lvl === 'err').map(e => e.msg), []);
});

test('câble d’arrivée : 10 mm² jusqu’à 12 kVA, au-delà il faut 16 mm²', () => {
  const P = R.generate(R.DEFAULT_HOME);
  P.kva = 12; P.arr = 10;
  assert.ok(!has(P, /Câble d’arrivée/));
  P.kva = 18;
  const e = R.analyse(P).find(i => /Câble d’arrivée 10 mm²/.test(i.msg));
  assert.equal(e.lvl, 'err');
  R.applyFix(P, e.fix[0].op);
  assert.equal(R.arrSec(P), 16);
  assert.ok(!has(P, /Câble d’arrivée/));
});

test('maison à étage : circuits rangés par étage et bien répartis', () => {
  const P = R.generate({ ...R.DEFAULT_HOME, niveaux: 2 });
  const B = R.principal(P);
  const et = new Set(B.items.filter(i => i.t === 'disj' && i.c.k === 'eclairage').map(i => i.c.etage));
  assert.ok(et.has('RDC') && et.has('Étage 1'));
  assert.deepEqual(errs(P).map(e => e.msg), []);
  assert.ok(!has(P, /l’éclairage et les prises sont tous sur le même différentiel/));
});

test('conseil si éclairage et prises d’un étage sont sur le même différentiel', () => {
  const e = disj('eclairage', { label: 'É', n: 3, etage: 'Étage 1' });
  const pc = disj('prises', { label: 'P', n: 4, etage: 'Étage 1' });
  assert.ok(has(projet([e, pc]).P, /Étage 1 : l’éclairage et les prises/));
});

test('modèles de divisionnaire : atelier extérieur conforme et branché sur l’arrivée', () => {
  for (const k of Object.keys(R.DIVTPL)) {
    const P = R.generate(R.DEFAULT_HOME);
    const D = R.addDivBoard(P, k);
    const f = R.principal(P).items.find(i => i.t === 'disj' && i.c.k === 'div' && i.c.board === D.id);
    assert.equal(f.feed, 'head', k);
    assert.deepEqual(errs(P).map(e => e.msg), [], k);
  }
});

test('chute de tension : un long câble trop fin est signalé, avec la bonne section', () => {
  assert.ok(Math.abs(R.vdrop(30, 16, 2.5) - 3.76) < 0.05);
  const d = disj('prises', { label: 'PC fond du jardin', n: 4, p: 3000 }); d.c.len = 60;
  const { P } = projet([d]);
  const w = R.analyse(P).find(i => /chute de tension/.test(i.msg));
  assert.equal(w.lvl, 'warn');
  R.applyFix(P, w.fix[0].op);
  assert.ok(!has(P, /chute de tension/));
});

test('chaudière gaz : circuit 16 A dédié', () => {
  assert.equal(R.CIRC.chaudiere.n, 'Chaudière gaz');
  assert.equal(R.CIRC.chaudiere.cal, 16);
});

test('un four de 3 500 W sur un disjoncteur 10 A va sauter, avec correction', () => {
  const d = disj('four', { label: 'Four', p: 3500 }); d.c.cal = 10;
  const { P } = projet([d]);
  const e = R.analyse(P).find(i => i.item === d.id && /va sauter/.test(i.msg));
  assert.equal(e.lvl, 'warn'); // la charge ne bloque pas le Consuel
  R.applyFix(P, e.fix[0].op);
  assert.equal(d.c.cal, 16); assert.equal(d.c.sec, 2.5);
  assert.ok(!R.analyse(P).some(i => i.item === d.id && i.lvl === 'err'));
});

test('réserve : 20 % arrondi au module supérieur, et répartie sur les rangées', () => {
  assert.equal(R.rowCap(13), 10); assert.equal(R.rowCap(18), 14);
  const P = R.generate(R.DEFAULT_HOME);
  for (const b of P.boards) for (let r = 0; r < b.rows; r++)
    assert.ok(b.items.filter(i => i.row === r).reduce((a, i) => a + R.W[i.t], 0) <= R.rowCap(b.mpr));
  const full = Array.from({ length: 10 }, (_, k) => disj('autre', { label: 'X' + k, p: 10 }));
  const { P: P2, B } = projet(full, { rows: 1 });
  const e = R.analyse(P2).find(i => /réserve de 20 %/.test(i.msg));
  assert.match(e.msg, /il en faut au moins 3/);
  R.applyFix(P2, e.fix[0].op);
  assert.equal(B.rows, 2);
});

test('exemples générés : aucun conseil inutile', () => {
  for (const h of [{}, { niveaux: 2 }, { div: true, ve: 'irve' }]) {
    const P = R.generate({ ...R.DEFAULT_HOME, ...h });
    assert.deepEqual(R.analyse(P).filter(i => i.lvl !== 'info').map(i => i.msg), [], JSON.stringify(h));
  }
});

test('circuits obligatoires : cuisson 32 A, 3 spécialisés, communication', () => {
  const P = R.generate(R.DEFAULT_HOME);
  const B = R.principal(P);
  const drop = k => { B.items = B.items.filter(i => !(i.t === 'disj' && k.includes(i.c.k))); };
  drop(['plaque']);
  assert.ok(R.analyse(P).some(i => i.lvl === 'err' && /circuit cuisson 32 A/.test(i.msg)));
  drop(['four', 'lv', 'congel']);
  assert.ok(R.analyse(P).some(i => i.lvl === 'err' && /il en faut au moins 3/.test(i.msg)));
  drop(['com']);
  assert.ok(R.analyse(P).some(i => i.lvl === 'err' && /tableau de communication/.test(i.msg)));
});

test('pièces : équipement minimum NF C 15-100', () => {
  assert.equal(R.roomReq({ type: 'sejour', surf: 20 }).socles, 5);
  assert.equal(R.roomReq({ type: 'sejour', surf: 26 }).socles, 7);
  assert.equal(R.roomReq({ type: 'sejour', surf: 40 }).socles, 7);
  assert.equal(R.roomReq({ type: 'chambre', surf: 9 }).socles, 3);
  assert.equal(R.roomReq({ type: 'cuisine', surf: 8 }).socles, 6);
  assert.equal(R.roomReq({ type: 'cuisine', surf: 4 }).socles, 3);
  assert.equal(R.roomReq({ type: 'wc', surf: 2 }).socles, 0);
  const P = R.generate(R.DEFAULT_HOME);
  const ch = P.rooms.find(r => r.type === 'chambre'); ch.socles = 2;
  const e = R.analyse(P).find(i => /il en faut au moins 3/.test(i.msg));
  assert.equal(e.lvl, 'err');
  R.applyFix(P, e.fix[0].op);
  assert.equal(ch.socles, 3);
});

test('pièces et circuits : assez de circuits pour toutes les prises et lumières', () => {
  const P = R.generate(R.DEFAULT_HOME);
  P.rooms.push(R.mkRoom('chambre', 'Chambre 9', 12, { socles: 40 }));
  assert.ok(R.analyse(P).some(i => i.lvl === 'err' && /circuits de prises n’en prévoient que/.test(i.msg)));
});

test('différentiel : plus de 8 kVA de chauffage impose un 63 A', () => {
  const ch = [1, 2, 3].map(k => { const d = disj('chauffage', { label: 'Ch' + k, p: 3000 }); return d; });
  const { P, id } = projet(ch, { type: 'AC', cal: 40 });
  const e = R.analyse(P).find(i => /il faut un 63 A/.test(i.msg));
  assert.equal(e.lvl, 'err');
  R.applyFix(P, e.fix[0].op);
  assert.equal(id.cal, 63);
});

test('éclairage sur un seul différentiel : bloquant pour tout le logement', () => {
  const { P } = projet([disj('eclairage', { label: 'É1', n: 3 }), disj('eclairage', { label: 'É2', n: 3 })]);
  assert.ok(R.analyse(P).some(i => i.lvl === 'err' && /l’éclairage est sur le même différentiel/.test(i.msg)));
});
