/* Test dei calcoli puri: node tests/calc.test.js */
const A = require('../app.js');

let pass = 0, fail = 0;
function near(a, b, eps = 0.01) { return Math.abs(a - b) <= eps; }
function check(name, cond) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}

const exams = A.buildPlan(true);
const s = A.computeStats(exams);

check('CFU con voto già dati = 69', s.doneCFU === 69);
check('CFU con voto rimasti = 105', s.remCFU === 105);
check('CFU con voto totali = 174', s.totalGradedCFU === 174);
check('CFU totali = 180', s.totalCFU === 180);
check('somma pesata = 1635', s.weighted === 1635);
check('media ponderata ~ 23.696', near(s.media, 23.696));

check('serve ~26.69 per media 25.5', near(A.requiredAverage(s, 25.5), 26.686));
check('serve ~27.51 per media 26.0', near(A.requiredAverage(s, 26.0), 27.514));

check('media finale con 27 di media futura ~25.69', near(A.projectedFinal(s, 27), 25.690));
check('voto base /110 a media 26 ~95.3', near(A.base110(26), 95.333, 0.01));

check('feasibility 26.69 = impegnativo', A.feasibility(26.69).txt === 'impegnativo');
check('feasibility 31 = non raggiungibile', A.feasibility(31).txt === 'non raggiungibile');

console.log(`\n${pass} passati, ${fail} falliti`);
process.exit(fail ? 1 : 0);
