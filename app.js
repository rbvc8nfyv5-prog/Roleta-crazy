/* Vitória V11 — Pula Dez e Horizontal. */
(() => {
  'use strict';

  const wheel = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const valid = n => Number.isInteger(n) && n >= 0 && n <= 36;
  const territories = Array.from({length:10}, (_, digit) => new Set(
    wheel.flatMap((n, i) => n % 10 === digit
      ? [wheel[(i + 36) % 37], n, wheel[(i + 1) % 37]]
      : [])
  ));
  const trios = [];
  for (let a = 0; a < 8; a++) {
    for (let b = a + 1; b < 9; b++) {
      for (let c = b + 1; c < 10; c++) {
        const digits = [a,b,c];
        trios.push({
          digits,
          numbers: wheel.filter(n => digits.some(d => territories[d].has(n)))
        });
      }
    }
  }

  function parse(text, newest = false) {
    const tokens = text.trim().split(/[\s,;|]+/).filter(Boolean);
    if (tokens.length < 10 || tokens.length > 200 ||
        tokens.some(t => !/^\d{1,2}$/.test(t) || !valid(Number(t)))) {
      throw Error('Cole de 10 a 200 números de 0 a 36.');
    }
    const numbers = tokens.map(Number);
    return newest ? numbers.reverse() : numbers;
  }

  function predict(history, distance = 10) {
    if (history.length < distance) return null;
    const trigger = history.at(-distance);
    const targets = [];
    for (let i = distance; i < history.length; i++) {
      if (history[i - distance] % 10 === trigger % 10) targets.push(history[i]);
    }
    if (!targets.length) return null;
    const scored = trios.map(trio => {
      const hits = targets.map(n => trio.numbers.includes(n));
      return {
        ...trio,
        hits: hits.filter(Boolean).length,
        recent: hits.slice(-5).filter(Boolean).length,
        recency: hits.reduce((sum, hit, i) => sum + (hit ? i + 1 : 0), 0)
      };
    });
    scored.sort((a,b) => b.hits - a.hits ||
      a.numbers.length - b.numbers.length ||
      b.recent - a.recent || b.recency - a.recency ||
      a.digits[0] - b.digits[0] || a.digits[1] - b.digits[1] ||
      a.digits[2] - b.digits[2]);
    const chosen = scored[0];
    function strength(digit) {
      const hits = targets.map(n => territories[digit].has(n));
      return {
        digit,
        hits: hits.filter(Boolean).length,
        recent: hits.slice(-5).filter(Boolean).length,
        recency: hits.reduce((sum, hit, i) => sum + (hit ? i + 1 : 0), 0)
      };
    }
    const ranking = chosen.digits.map(strength).sort((a,b) =>
      b.hits - a.hits || b.recent - a.recent ||
      b.recency - a.recency || a.digit - b.digit);
    return {
      trigger, terminal: trigger % 10, samples: targets.length,
      digits: ranking.map(row => row.digit),
      numbers: [...chosen.numbers], hits: chosen.hits,
      ties: scored.filter(row => row.hits === chosen.hits).length
    };
  }

  function settle(number, prediction) {
    return {
      number,
      prediction: prediction ? {
        ...prediction,
        digits: [...prediction.digits],
        numbers: [...prediction.numbers]
      } : null,
      hit: prediction ? prediction.numbers.includes(number) : null
    };
  }

  function validate(saved) {
    if (!saved || !Array.isArray(saved.seed) || saved.seed.length < 10 ||
        saved.seed.length > 200 || !saved.seed.every(valid) ||
        !Array.isArray(saved.rows)) throw Error('Sessão salva inválida.');
    for (const row of saved.rows.flatMap(entry =>
      entry && Object.hasOwn(entry, 'horizontal') ? [entry, entry.horizontal] : [entry])) {
      if (!row || !valid(row.number)) throw Error('Sessão salva inválida.');
      if (row.prediction === null && row.hit === null) continue;
      const p = row.prediction;
      if (!p || !Array.isArray(p.digits) || p.digits.length !== 3 ||
          new Set(p.digits).size !== 3 ||
          !p.digits.every(n => Number.isInteger(n) && n >= 0 && n <= 9) ||
          !Array.isArray(p.numbers) || !p.numbers.every(valid) ||
          row.hit !== p.numbers.includes(row.number)) {
        throw Error('Sessão salva inválida.');
      }
      const expected = wheel.filter(n => p.digits.some(d => territories[d].has(n)));
      if (expected.length !== p.numbers.length ||
          expected.some(n => !p.numbers.includes(n))) throw Error('Sessão salva inválida.');
    }
    return {...saved, mode:saved.mode === 'horizontal' ? 'horizontal' : 'pula'};
  }

  function install() {
    const id = 'vitoria-v11';
    if (document.getElementById(id)) return;
    const host = document.createElement('div');
    host.id = id;
    const root = host.attachShadow({mode:'open'});
    root.innerHTML = `
<style>
:host{display:block;position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#101418;color:#eef5f3;font:16px/1.4 system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}
main{max-width:700px;margin:auto;padding:14px}
header,.actions{display:flex;align-items:center;justify-content:space-between;gap:8px}
h1{font-size:24px;margin:0}p{margin:8px 0}
textarea,button,select{font:inherit;color:inherit;background:#182329;border:1px solid #405057;border-radius:7px}
textarea{width:100%;padding:9px;margin-top:14px;resize:vertical}
button,select{padding:8px;min-height:44px}
button[aria-pressed="true"]{background:#28513c;border-color:#8ff0b8}
.actions{justify-content:flex-start;flex-wrap:wrap;margin:8px 0 14px}
.timeline{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px;margin:10px 0}
.chip{text-align:center;min-width:0;border:1px solid #405057;border-radius:4px;padding:4px 0;font-size:clamp(10px,3vw,17px)}
.red{background:#702a36}.black{background:#172127}.zero{background:#26543f}
.terminals{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
.terminal{text-align:center;font-size:42px;font-weight:700;padding:8px;background:#1b282b;color:#8ff0b8;border-radius:8px}
.results{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px}
.result{text-align:center;font-size:11px;line-height:24px;min-height:24px;border-radius:3px;background:#455159}
.green{background:#36ba78}.loss{background:#e96370}
.keys{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:14px}
#status{font-size:14px;color:#bdc9cb;min-height:20px}
#score{color:#bdc9cb;font-size:14px}
</style>
<main>
<header><h1>Vitória V11</h1><button id="close" type="button">Fechar</button></header>
<textarea id="seed" rows="2" aria-label="Histórico" placeholder="Cole de 10 a 200 números"></textarea>
<div class="actions"><select id="order" aria-label="Ordem do histórico"><option value="oldest">Mais antigo primeiro</option><option value="newest">Mais recente primeiro</option></select><button id="import" type="button">Importar</button></div>
<div class="actions"><button id="pula" type="button" aria-pressed="true">Vitória Pula Dez</button><button id="horizontal" type="button" aria-pressed="false">Vitória Horizontal</button></div>
<div id="timeline" class="timeline" aria-label="Últimos 14 números"></div>
<div id="terminals" class="terminals" aria-label="Três terminais em ordem de força"></div>
<div id="results" class="results" aria-label="Últimos 14 resultados registrados"></div>
<p id="score"></p><div id="status" role="status" aria-live="polite"></div>
<div id="keys" class="keys" aria-label="Inserir resultado"></div>
<div class="actions"><button id="undo" type="button">Apagar último</button></div>
</main>`;
    document.body.appendChild(host);
    const $ = name => root.getElementById(name);
    const red = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const color = n => n === 0 ? 'zero' : red.has(n) ? 'red' : 'black';
    const storageKey = 'vitoria-v11';
    let state = {seed:[], rows:[], mode:'pula'};
    let published = null;
    const keys = [];
    const history = () => state.seed.concat(state.rows.map(row => row.number));

    function reading(numbers) {
      return {pula:predict(numbers), horizontal:predict(numbers, 1)};
    }

    function modeRow(row) {
      return state.mode === 'horizontal'
        ? row.horizontal || {number:row.number, prediction:null, hit:null}
        : row;
    }

    function render() {
      const play = published?.[state.mode];
      for (const mode of ['pula','horizontal']) {
        $(mode).setAttribute('aria-pressed', String(state.mode === mode));
      }
      $('timeline').innerHTML = history().slice(-14).map(n =>
        '<span class="chip ' + color(n) + '">' + n + '</span>').join('');
      $('terminals').innerHTML = (play?.digits || ['—','—','—']).map(n =>
        '<div class="terminal">' + n + '</div>').join('');
      $('results').innerHTML = state.rows.slice(-14).map(modeRow).map(row => {
        const label = row.hit === null ? 'SEM INDICAÇÃO' : row.hit ? 'GREEN' : 'LOSS';
        const style = row.hit === null ? '' : row.hit ? 'green' : 'loss';
        return '<span class="result ' + style + '" role="img" aria-label="' +
          row.number + ' · ' + label + '" title="' + row.number + ' · ' + label + '">' + (row.hit === null ? '—' : row.hit ? 'G' : 'L') + '</span>';
      }).join('');
      const scored = state.rows.map(modeRow).filter(row => row.hit !== null);
      const greens = scored.filter(row => row.hit).length;
      $('score').textContent = scored.length
        ? 'GREEN ' + greens + ' · LOSS ' + (scored.length - greens) : '';
      $('undo').disabled = !state.rows.length;
      keys.forEach(button => { button.disabled = !state.seed.length; });
    }

    function commit(next) {
      const nextHistory = next.seed.concat(next.rows.map(row => row.number));
      const nextPublished = reading(nextHistory);
      let warning = '';
      try { if (next.seed.length) localStorage.setItem(storageKey, JSON.stringify(next)); }
      catch { warning = 'O navegador não conseguiu salvar a sessão.'; }
      state = next;
      published = nextPublished;
      render();
      $('status').textContent = warning || (state.seed.length && !published[state.mode]
        ? 'Aguardando ocorrências completas desse final.' : '');
    }

    for (let n = 0; n <= 36; n++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = n;
      button.className = color(n);
      button.addEventListener('click', () => {
        if (!state.seed.length) return;
        const row = {...settle(n, published.pula),
          horizontal:settle(n, published.horizontal)};
        commit({...state, rows:state.rows.concat(row)});
      });
      keys.push(button);
      $('keys').appendChild(button);
    }

    $('import').addEventListener('click', () => {
      try {
        const seed = parse($('seed').value, $('order').value === 'newest');
        commit({seed, rows:[], mode:state.mode});
        $('seed').value = '';
      } catch (error) { $('status').textContent = error.message; }
    });
    $('undo').addEventListener('click', () => {
      if (state.rows.length) commit({...state, rows:state.rows.slice(0,-1)});
    });
    for (const mode of ['pula','horizontal']) {
      $(mode).addEventListener('click', () => commit({...state, mode}));
    }
    $('close').addEventListener('click', () => host.remove());
    render();
    try {
      const saved = localStorage.getItem(storageKey) ?? localStorage.getItem('vitoria-v10');
      if (saved) {
        state = validate(JSON.parse(saved));
        published = reading(history());
        render();
      }
    } catch (error) { $('status').textContent = error.message; }
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = {parse, predict, settle, validate, trios, wheel};
  }
  if (typeof document !== 'undefined') {
    if (document.body) install();
    else document.addEventListener('DOMContentLoaded', install, {once:true});
  }
})();
