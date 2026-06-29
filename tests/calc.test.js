/* Test dei calcoli puri: node tests/calc.test.js */
const A = require('../app.js');

let pass = 0, fail = 0;
function near(a, b, eps = 0.01) { return Math.abs(a - b) <= eps; }
function check(name, cond) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}

// Piano vuoto: nessun voto registrato — l'app parte sempre da zero.
const empty = A.buildPlan(false);
const se = A.computeStats(empty);
check('piano vuoto: nessun CFU con voto', se.doneCFU === 0);
check('piano vuoto: media null', se.media === null);
check('piano vuoto: CFU totali = 180', se.totalCFU === 180);
check('piano vuoto: requiredAverage = null se nessun rimasto?',
      A.requiredAverage(se, 25) != null); // ci sono CFU rimasti
check('piano vuoto: projectedFinal usa media futura',
      near(A.projectedFinal(se, 27), 27));

// Piano sintetico con voti noti — verifica i calcoli.
const exams = [
  { id: 'a', name: 'A', cfu: 12, type: 'voto', grade: 27, lode: false, passed: false },
  { id: 'b', name: 'B', cfu:  9, type: 'voto', grade: 24, lode: false, passed: false },
  { id: 'c', name: 'C', cfu:  6, type: 'voto', grade: 30, lode: true,  passed: false }, // 30 e lode = 30
  { id: 'd', name: 'D', cfu:  9, type: 'voto', grade: null, lode: false, passed: false }, // da fare
  { id: 'e', name: 'E', cfu:  3, type: 'idoneita', grade: null, lode: false, passed: true },
];
const s = A.computeStats(exams);
check('doneCFU = 27', s.doneCFU === 27);
check('remCFU = 9',  s.remCFU === 9);
check('totalCFU = 39', s.totalCFU === 39);
check('weighted = 27*12 + 24*9 + 30*6 = 720', s.weighted === 720);
check('media = 720/27 ≈ 26.667', near(s.media, 26.667));
check('acquiredCFU = 27 + 3 (idoneità superata) = 30', s.acquiredCFU === 30);

// Voto medio necessario sui 9 CFU rimasti per chiudere a 27 di media
// (27 * 36 - 720) / 9 = (972 - 720) / 9 = 28
check('serve esattamente 28 per chiudere a 27', near(A.requiredAverage(s, 27), 28));

// Media finale con 28 di media sui rimasti
// (720 + 28*9) / 36 = 972 / 36 = 27
check('projectedFinal con 28 ≈ 27', near(A.projectedFinal(s, 28), 27));

// base110: 27/30 * 110 = 99
check('base110(27) = 99', near(A.base110(27), 99));

check('feasibility 28 = impegnativo', A.feasibility(28).txt === 'impegnativo');
check('feasibility 31 = non raggiungibile', A.feasibility(31).txt === 'non raggiungibile');
check('feasibility null = vuoto', A.feasibility(null).txt === '');

console.log(`\n${pass} passati, ${fail} falliti`);
process.exit(fail ? 1 : 0);
