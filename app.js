/* Libretto — proiezione media ponderata
 * Logica pura (testabile con Node) + interfaccia (browser).
 * I dati vivono solo in localStorage: nessun server.
 */

/* ------------------------------------------------------------------ *
 *  MODELLO DATI
 *  Esame: { id, name, cfu, type:'voto'|'idoneita',
 *           grade:Number|null, lode:Bool, passed:Bool, year, elective }
 * ------------------------------------------------------------------ */

// Piano di Ingegneria Aerospaziale (Padova) — nomi e CFU.
const PLAN = [
  ['Lingua Inglese B2', 3, 'idoneita', 1, false],
  ['Analisi Matematica 1', 12, 'voto', 1, false],
  ['Elementi di Chimica', 6, 'voto', 1, false],
  ['Fondamenti di Algebra Lineare e Geometria', 9, 'voto', 1, false],
  ['Calcolo Numerico', 9, 'voto', 1, false],
  ['Fisica 1', 12, 'voto', 1, false],
  ['Disegno Tecnico Industriale', 6, 'voto', 1, false],
  ['Fisica 2', 9, 'voto', 2, false],
  ['Fondamenti di Analisi Matematica 2', 9, 'voto', 2, false],
  ['Meccanica Razionale', 9, 'voto', 2, false],
  ['Dinamica del Volo Aerospaziale', 9, 'voto', 2, false],
  ['Meccanica Applicata', 9, 'voto', 2, false],
  ['Elettrotecnica', 6, 'voto', 2, false],
  ['Fondamenti di Astronomia e Astrofisica', 6, 'voto', 2, true],
  ['Aerodinamica 1', 9, 'voto', 3, false],
  ['Fisica Tecnica', 12, 'voto', 3, false],
  ['Economia ed Organizzazione Aziendale', 6, 'voto', 3, false],
  ['Costruzioni e Strutture Aerospaziali 1', 9, 'voto', 3, false],
  ['Impianti e Sistemi Aerospaziali', 9, 'voto', 3, false],
  ['Turbomacchine', 6, 'voto', 3, false],
  ['Esame a scelta 1', 6, 'voto', 3, true],
  ['Esame a scelta 2', 6, 'voto', 3, true],
  ['Prova Finale', 3, 'idoneita', 3, false],
];

// Voti già registrati (i tuoi). Tutto il resto resta "da sostenere".
const SEED_GRADES = {
  'Analisi Matematica 1': 25,
  'Disegno Tecnico Industriale': 28,
  'Elementi di Chimica': 22,
  'Fondamenti di Algebra Lineare e Geometria': 19,
  'Fisica 1': 22,
  'Fondamenti di Astronomia e Astrofisica': 28,
  'Calcolo Numerico': 26,
  'Fisica 2': 22,
};

function uid() {
  return 'e' + Math.random().toString(36).slice(2, 9);
}

function buildPlan(withGrades) {
  return PLAN.map(([name, cfu, type, year, elective]) => ({
    id: uid(),
    name, cfu, type, year, elective,
    grade: withGrades && SEED_GRADES[name] != null ? SEED_GRADES[name] : null,
    lode: false,
    passed: false,
  }));
}

/* ------------------------------------------------------------------ *
 *  CALCOLI (puri)
 * ------------------------------------------------------------------ */

function gradeValue(e) { return e.lode ? 30 : e.grade; }

function computeStats(exams) {
  let weighted = 0, doneCFU = 0, remCFU = 0, idoPassedCFU = 0, totalCFU = 0;
  for (const e of exams) {
    totalCFU += e.cfu;
    if (e.type === 'idoneita') { if (e.passed) idoPassedCFU += e.cfu; continue; }
    if (e.grade != null) { weighted += gradeValue(e) * e.cfu; doneCFU += e.cfu; }
    else { remCFU += e.cfu; }
  }
  const media = doneCFU > 0 ? weighted / doneCFU : null;
  return {
    weighted, doneCFU, remCFU, media, totalCFU,
    acquiredCFU: doneCFU + idoPassedCFU,
    totalGradedCFU: doneCFU + remCFU,
  };
}

// Voto medio necessario sui CFU rimasti per raggiungere `target`.
function requiredAverage(stats, target) {
  if (stats.remCFU <= 0) return null;
  return (target * (stats.doneCFU + stats.remCFU) - stats.weighted) / stats.remCFU;
}

// Media finale ipotizzando media `futureAvg` sui CFU rimasti.
function projectedFinal(stats, futureAvg) {
  const tot = stats.doneCFU + stats.remCFU;
  if (tot <= 0) return null;
  return (stats.weighted + futureAvg * stats.remCFU) / tot;
}

function base110(media) { return media == null ? null : (media / 30) * 110; }

function feasibility(x) {
  if (x == null) return { cls: '', txt: '' };
  if (x > 30) return { cls: 'danger', txt: 'non raggiungibile' };
  if (x > 28) return { cls: 'danger', txt: 'molto difficile' };
  if (x > 26) return { cls: 'warn', txt: 'impegnativo' };
  if (x < 18) return { cls: 'ok', txt: 'già al sicuro' };
  return { cls: 'ok', txt: 'gestibile' };
}

/* ------ esportazione per i test Node ------ */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PLAN, SEED_GRADES, buildPlan, computeStats,
    requiredAverage, projectedFinal, base110, feasibility, gradeValue,
  };
}

/* ================================================================== *
 *  INTERFACCIA (solo browser)
 * ================================================================== */
if (typeof document !== 'undefined') {
  const STORE_KEY = 'libretto.v1';
  const $ = (s) => document.querySelector(s);
  const r1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const r2 = (n) => (Math.round(n * 100) / 100).toFixed(2);

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    const seeded = { exams: buildPlan(true) };
    save(seeded);
    return seeded;
  }
  function save(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s || state)); } catch (_) {}
  }

  /* ---------- rendering ---------- */
  function render() {
    const stats = computeStats(state.exams);
    renderProjection(stats);
    renderExams(stats);
    save();
  }

  function renderProjection(stats) {
    $('#media-now').textContent = stats.media == null ? '—' : r2(stats.media);
    $('#media-meta').textContent =
      `${stats.doneCFU} CFU con voto su ${stats.totalGradedCFU} totali`;
    $('#cfu-acquired').textContent = stats.acquiredCFU;
    $('#cfu-total').innerHTML = `<span class="metric-sub">/ ${stats.totalCFU}</span>`;
    const b = base110(stats.media);
    $('#base110').textContent = b == null ? '—' : r1(b);

    // "Quanto mi serve"
    const target = parseFloat($('#target').value);
    $('#target-out').textContent = r1(target);
    $('#need-cfu').textContent = stats.remCFU;
    const need = requiredAverage(stats, target);
    const badge = $('#need-badge');
    if (need == null) {
      $('#need-num').textContent = '—';
      badge.className = 'badge';
      badge.textContent = 'nessun esame rimasto';
      $('#need-hint').textContent = 'Hai registrato un voto su tutti gli esami con valutazione.';
    } else {
      const shown = Math.max(0, need);
      $('#need-num').textContent = need > 30 ? '>30' : r2(shown);
      const f = feasibility(need);
      badge.className = 'badge ' + f.cls;
      badge.textContent = f.txt;
      $('#need-hint').textContent = need > 30
        ? 'Servirebbe più di 30 di media: con questi esami la media obiettivo non è più raggiungibile.'
        : `In pratica significa voti attorno a ${Math.round(need)}-${Math.ceil(need + 0.5)}, senza voti bassi sugli esami grossi.`;
    }

    // "Cosa ottengo"
    const fut = parseFloat($('#future').value);
    $('#future-out').textContent = r1(fut);
    const fin = projectedFinal(stats, fut);
    $('#final-num').textContent = fin == null ? '—' : r2(fin);
    $('#final-110').textContent = fin == null ? '—' : r1(base110(fin));
  }

  function chip(e) {
    if (e.type === 'idoneita') {
      return e.passed
        ? '<div class="grade-chip pass" aria-label="superata">✓</div>'
        : '<div class="grade-chip empty">–</div>';
    }
    if (e.grade == null) return '<div class="grade-chip empty">+</div>';
    if (e.lode) return '<div class="grade-chip lode">30L</div>';
    return `<div class="grade-chip">${e.grade}</div>`;
  }

  function examRow(e) {
    const tag = e.elective ? ' · a scelta' : '';
    const li = document.createElement('li');
    li.className = 'exam-item';
    li.innerHTML =
      `<div class="exam-body">
         <div class="exam-name">${escapeHtml(e.name)}</div>
         <div class="exam-sub">${e.cfu} CFU${tag} · ${e.year ? e.year + '° anno' : ''}</div>
       </div>` + chip(e);
    li.addEventListener('click', () => openModal(e.id));
    return li;
  }

  function renderExams(stats) {
    const done = state.exams.filter((e) => e.type === 'voto' && e.grade != null);
    const todo = state.exams.filter((e) => e.type === 'voto' && e.grade == null);
    const ido = state.exams.filter((e) => e.type === 'idoneita');

    fillList('#list-done', done, 'Nessun esame archiviato.');
    fillList('#list-todo', todo, 'Tutti gli esami sono stati registrati.');
    fillList('#list-ido', ido, 'Nessuna idoneità.');

    $('#count-done').textContent = done.length;
    $('#count-todo').textContent = todo.length;
    $('#count-ido').textContent = ido.length;
    $('#archive-meta').textContent = stats.media == null
      ? 'Esami accettati e registrati a libretto.'
      : `${done.length} esami · ${stats.doneCFU} CFU · media ${r2(stats.media)}`;
  }

  function fillList(sel, arr, emptyMsg) {
    const ul = $(sel);
    ul.innerHTML = '';
    if (!arr.length) {
      const li = document.createElement('li');
      li.className = 'empty-note';
      li.textContent = emptyMsg;
      ul.appendChild(li);
      return;
    }
    arr.sort((a, b) => (a.year - b.year) || a.name.localeCompare(b.name));
    arr.forEach((e) => ul.appendChild(examRow(e)));
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  /* ---------- modale esame ---------- */
  let editingId = null;

  function openModal(id) {
    editingId = id;
    const e = id ? state.exams.find((x) => x.id === id) : null;
    $('#modal-title').textContent = e ? 'Modifica esame' : 'Nuovo esame';
    $('#f-name').value = e ? e.name : '';
    $('#f-cfu').value = e ? e.cfu : '';
    const type = e ? e.type : 'voto';
    document.querySelectorAll('input[name=ftype]').forEach((r) => { r.checked = r.value === type; });
    $('#f-grade').value = e && e.grade != null ? e.grade : '';
    $('#f-lode').checked = !!(e && e.lode);
    $('#f-passed').checked = !!(e && e.passed);
    $('#modal-delete').hidden = !e;
    syncType();
    $('#modal').hidden = false;
  }
  function closeModal() { $('#modal').hidden = true; editingId = null; }

  function syncType() {
    const type = document.querySelector('input[name=ftype]:checked').value;
    $('#grade-block').hidden = type !== 'voto';
    $('#passed-block').hidden = type !== 'idoneita';
  }

  function submitExam(ev) {
    ev.preventDefault();
    const type = document.querySelector('input[name=ftype]:checked').value;
    const name = $('#f-name').value.trim() || 'Esame';
    const cfu = Math.max(1, parseInt($('#f-cfu').value, 10) || 0);
    let grade = null, lode = false, passed = false;
    if (type === 'voto') {
      const g = $('#f-grade').value.trim();
      if (g !== '') {
        grade = Math.min(30, Math.max(18, parseInt(g, 10)));
        lode = grade === 30 && $('#f-lode').checked;
      }
    } else {
      passed = $('#f-passed').checked;
    }
    if (editingId) {
      const e = state.exams.find((x) => x.id === editingId);
      Object.assign(e, { name, cfu, type, grade, lode, passed });
    } else {
      state.exams.push({ id: uid(), name, cfu, type, grade, lode, passed, year: 0, elective: false });
    }
    closeModal();
    render();
  }

  function deleteExam() {
    if (editingId && confirm('Eliminare questo esame?')) {
      state.exams = state.exams.filter((x) => x.id !== editingId);
      closeModal();
      render();
    }
  }

  /* ---------- navigazione tab ---------- */
  function goTab(name) {
    document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.dataset.tab !== name; });
    document.querySelectorAll('.tabbtn').forEach((b) => {
      const on = b.dataset.go === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    window.scrollTo(0, 0);
  }

  /* ---------- import / export / reset ---------- */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'libretto-dati.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (obj && Array.isArray(obj.exams)) { state = obj; render(); goTab('esami'); }
        else alert('File non valido.');
      } catch (_) { alert('File non leggibile.'); }
    };
    reader.readAsText(file);
  }
  function resetTo(builder, msg) {
    if (confirm(msg)) { state = { exams: builder() }; render(); goTab('esami'); }
  }

  /* ---------- collegamenti eventi ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    $('#target').addEventListener('input', () => renderProjection(computeStats(state.exams)));
    $('#future').addEventListener('input', () => renderProjection(computeStats(state.exams)));
    document.querySelectorAll('.tabbtn').forEach((b) => b.addEventListener('click', () => goTab(b.dataset.go)));
    $('#add-exam').addEventListener('click', () => openModal(null));
    $('#modal-cancel').addEventListener('click', closeModal);
    $('#modal-delete').addEventListener('click', deleteExam);
    $('#exam-form').addEventListener('submit', submitExam);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.querySelectorAll('input[name=ftype]').forEach((r) => r.addEventListener('change', syncType));
    $('#export-data').addEventListener('click', exportData);
    $('#import-data').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', (e) => { if (e.target.files[0]) importData(e.target.files[0]); });
    $('#load-template').addEventListener('click', () => resetTo(() => buildPlan(false), 'Caricare il piano Aerospaziale senza voti? I dati attuali verranno sostituiti.'));
    $('#load-seed').addEventListener('click', () => resetTo(() => buildPlan(true), 'Ricaricare i dati d\'esempio? I dati attuali verranno sostituiti.'));
    $('#clear-all').addEventListener('click', () => resetTo(() => [], 'Azzerare tutti gli esami?'));
    render();
  });

  // service worker (offline)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
