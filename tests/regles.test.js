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
  B.items = []; B.rows = opts.rows || 3; B.mpr = 13;
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

test('prises : 5 socles en 1,5 mm², 12 en 2,5 mm²', () => {
  assert.ok(has(projet([disj('prises', { n: 6, label: 'P', c: { cal: 16, sec: 1.5 } })]).P, /maximum 5/));
  assert.ok(!has(projet([disj('prises', { n: 12, label: 'P' })]).P, /socles/));
  assert.ok(has(projet([disj('prises', { n: 13, label: 'P' })]).P, /maximum 12/));
});

test('plaque et lave-linge exigent un différentiel type A', () => {
  assert.ok(has(projet([disj('plaque', { label: 'Plaque' })], { type: 'AC' }).P, /type A \(ou F\), pas AC/));
  assert.ok(!has(projet([disj('plaque', { label: 'Plaque' })], { type: 'A' }).P, /pas AC/));
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
