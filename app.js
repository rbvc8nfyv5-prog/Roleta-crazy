/* Vitória Radar — análises reconstruídas das telas fornecidas. */
(() => {
  'use strict';
  const WHEEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const POS = new Map(WHEEL.map((n,i) => [n,i]));
  const DEFAULT_REGIONS = [
    {name:'Zero', halves:[[12,35,3,26],[0,32,15,19,4]]},
    {name:'Direita', halves:[[21,2,25,17,34],[6,27,13,36,11]]},
    {name:'Oposto', halves:[[30,8,23,10,5],[24,16,33,1]]},
    {name:'Esquerda', halves:[[20,14,31,9,22],[18,29,7,28]]}
  ];
  const SAMPLE = [15,16,33,7,27,24,3,0,9,20];
  const valid = n => Number.isInteger(n) && n >= 0 && n <= 36;
  const color = n => n === 0 ? 'zero' : RED.has(n) ? 'red' : 'black';
  const copy = value => JSON.parse(JSON.stringify(value));

  function parse(text, newest = false) {
    const tokens = text.trim().split(/[\s,;|]+/).filter(Boolean);
    if (!tokens.length || tokens.length > 200 || tokens.some(t => !/^\d{1,2}$/.test(t) || !valid(Number(t)))) {
      throw Error('Cole de 1 a 200 números inteiros de 0 a 36.');
    }
    const result = tokens.map(Number);
    return newest ? result.reverse() : result;
  }

  function validateRegions(regions) {
    if (!Array.isArray(regions) || regions.length !== 4) throw Error('A divisão precisa ter quatro setores.');
    const numbers = [];
    regions.forEach((region,i) => {
      if (region.name !== DEFAULT_REGIONS[i].name || !Array.isArray(region.halves) || region.halves.length !== 2) {
        throw Error('Mantenha os quatro setores e os lados L/R.');
      }
      region.halves.forEach(half => {
        if (!Array.isArray(half) || !half.length || !half.every(valid)) throw Error('Cada lado precisa ter números de 0 a 36.');
        numbers.push(...half);
      });
    });
    if (numbers.length !== 37 || new Set(numbers).size !== 37) throw Error('Cada número de 0 a 36 deve aparecer exatamente uma vez.');
    return regions;
  }

  function regionFor(n, regions = DEFAULT_REGIONS) {
    for (const region of regions) {
      const side = region.halves.findIndex(half => half.includes(n));
      if (side !== -1) return {sector:region.name, subsector:region.name + (side ? ' (R)' : ' (L)')};
    }
    throw Error('Número fora da divisão de setores.');
  }

  function classify(n, regions = DEFAULT_REGIONS) {
    if (!valid(n)) throw Error('Número inválido.');
    return {
      number:n, color:color(n), range:n === 0 ? '0' : n <= 18 ? 'Baixo' : 'Alto',
      parity:n === 0 ? '0' : n % 2 ? 'Ímpar' : 'Par',
      column:n === 0 ? 'Zero' : 'C' + ((n - 1) % 3 + 1),
      dozen:n === 0 ? 'Zero' : 'D' + Math.ceil(n / 12),
      group:n === 0 ? 'Z' : 'F' + (Math.floor(n / 10) + 1) + (RED.has(n) ? 'V' : 'P'),
      ...regionFor(n,regions)
    };
  }

  function neighbors(n) {
    const i = POS.get(n);
    if (i === undefined) throw Error('Número inválido.');
    return {left:WHEEL[(i + 36) % 37], number:n, right:WHEEL[(i + 1) % 37]};
  }

  function directionRuns(signs) {
    const runs = [];
    let start = 0;
    while (start < signs.length) {
      if (!signs[start]) { start++; continue; }
      let end = start + 1;
      while (end < signs.length && signs[end] === signs[start]) end++;
      runs.push({start, length:end - start, sign:signs[start]});
      start = end;
    }
    const current = runs[0]?.start === 0 ? runs[0] : {start:0,length:0,sign:0};
    const longest = runs.reduce((best,run) => run.length > best.length ? run : best, {start:0,length:0,sign:0});
    return {runs,current,longest};
  }

  function neighborTimeline(history, limit = 15) {
    const rows = history.slice(-limit).reverse().map(neighbors);
    for (let i = 0; i < rows.length; i++) {
      rows[i].leftSign = i + 1 < rows.length ? Math.sign(rows[i].left - rows[i + 1].left) : null;
      rows[i].rightSign = i + 1 < rows.length ? Math.sign(rows[i].right - rows[i + 1].right) : null;
    }
    return {rows, left:directionRuns(rows.map(r => r.leftSign)), right:directionRuns(rows.map(r => r.rightSign))};
  }

  function distribution(history, property, regions = DEFAULT_REGIONS) {
    const counts = new Map();
    history.forEach(n => {
      const key = classify(n,regions)[property];
      counts.set(key,(counts.get(key) || 0) + 1);
    });
    return [...counts].map(([label,count]) => ({label,count,total:history.length,percent:history.length ? 100 * count / history.length : 0}))
      .sort((a,b) => b.count - a.count || a.label.localeCompare(b.label,'pt-BR'));
  }

  function isolated(history, trigger) {
    const counts = Array(37).fill(0), last = Array(37).fill(-1);
    let samples = 0;
    if (!valid(trigger)) return {trigger:null,samples,ranking:[]};
    for (let i = 1; i < history.length; i++) {
      if (history[i - 1] !== trigger) continue;
      counts[history[i]]++;
      last[history[i]] = i;
      samples++;
    }
    const ranking = Array.from({length:37},(_,number) => ({number,count:counts[number],last:last[number]}))
      .filter(row => row.count > 0)
      .sort((a,b) => b.count - a.count || b.last - a.last || a.number - b.number);
    return {trigger,samples,ranking};
  }

  function groupSequence(history) {
    if (history.length < 2) return {from:null,to:null,matches:[],ranking:[]};
    const from = classify(history.at(-2)).group, to = classify(history.at(-1)).group;
    const matches = [];
    for (let i = 2; i < history.length; i++) {
      if (classify(history[i - 2]).group === from && classify(history[i - 1]).group === to) {
        matches.push({first:history[i - 2],second:history[i - 1],next:history[i],turn:i + 1});
      }
    }
    return {from,to,matches,ranking:distribution(matches.map(row => row.next),'group')};
  }

  function analyze(history, regions = DEFAULT_REGIONS, sectorWindow = 15, trigger = history.at(-1)) {
    const recent = history.slice(-sectorWindow);
    return {
      total:history.length, last:history.at(-1), trigger,
      catalog:history.slice(-200).reverse().map(n => classify(n,regions)),
      sectors:distribution(recent,'sector',regions), subsectors:distribution(recent,'subsector',regions),
      timeline:neighborTimeline(history,15), isolated:isolated(history,trigger), sequence:groupSequence(history),
      dominance:['color','range','parity','column','dozen','sector'].map(property => ({property,ranking:distribution(history,property,regions)}))
    };
  }

  function install() {
    const id = 'vitoria-radar';
    const previous = document.getElementById(id);
    if (previous) { previous.focus(); return; }
    const host = document.createElement('div');
    host.id = id;
    host.tabIndex = -1;
    const root = host.attachShadow({mode:'open'});
    root.innerHTML = VIEW;
    document.body.appendChild(host);
    const $ = name => root.getElementById(name);
    const key = 'vitoria-radar-v1';
    let state = {seed:[],manual:[],fixed:null,window:15,regions:copy(DEFAULT_REGIONS)};
    const history = () => state.seed.concat(state.manual);
    const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const ball = n => '<span class="ball ' + color(n) + '">' + n + '</span>';
    const arrow = sign => sign === null ? '' : sign > 0 ? '↑' : sign < 0 ? '↓' : '=';
    const trend = run => !run.length ? 'Sem sequência' : run.length + (run.sign > 0 ? ' subida' : ' descida') + (run.length === 1 ? '' : 's');
    const status = text => { $('status').textContent = text; };
    const buttons = [];

    function bars(rows, numbers = false) {
      if (!rows.length) return '<p class="empty">Sem ocorrências completas.</p>';
      return rows.map(row => {
        const label = numbers ? ball(row.number) : '<span>' + escape(row.label) + '</span>';
        const value = numbers ? row.count : row.count + '/' + row.total;
        const percent = numbers ? 100 * row.count / rows[0].count : row.percent;
        return '<div class="bar-row">' + label + '<div class="bar-track"><i style="width:' + percent + '%"></i></div><b>' + value + '</b></div>';
      }).join('');
    }

    function renderTimeline(data) {
      const {rows,left,right} = data;
      $('left-current').textContent = trend(left.current);
      $('right-current').textContent = trend(right.current);
      $('left-max').textContent = 'Maior · ' + trend(left.longest);
      $('right-max').textContent = 'Maior · ' + trend(right.longest);
      const cells = ['<small class="head-left">Esq.</small><small class="head-center">Saiu</small><small class="head-right">Dir.</small>'];
      rows.forEach((row,i) => {
        const line = i + 2;
        const cls = i === 0 ? ' newest' : '';
        cells.push('<div class="neighbor-row' + cls + '" style="grid-row:' + line + '">' +
          ball(row.left) + '<span class="sign ' + (row.leftSign > 0 ? 'up' : row.leftSign < 0 ? 'down' : '') + '">' + arrow(row.leftSign) + '</span>' +
          ball(row.number) + '<span class="sign ' + (row.rightSign > 0 ? 'up' : row.rightSign < 0 ? 'down' : '') + '">' + arrow(row.rightSign) + '</span>' + ball(row.right) + '</div>');
      });
      for (const [side,stats] of [['left',left],['right',right]]) {
        stats.runs.filter(run => run.length >= 2).forEach(run => {
          cells.push('<div class="run ' + side + ' ' + (run.sign > 0 ? 'up' : 'down') + '" style="grid-row:' + (run.start + 2) + '/span ' + (run.length + 1) + '"><b>' + arrow(run.sign) + run.length + '</b></div>');
        });
      }
      $('neighbors').innerHTML = rows.length ? cells.join('') : '<p class="empty">Importe ou insira resultados.</p>';
    }

    function regionText() {
      return state.regions.flatMap(region => region.halves.map((half,i) => region.name + (i ? ' (R)' : ' (L)') + ' = ' + half.join(' '))).join('\n');
    }

    function render() {
      const h = history();
      const trigger = state.fixed === null ? h.at(-1) : state.fixed;
      const data = analyze(h,state.regions,state.window,trigger);
      $('total').textContent = h.length;
      $('last').innerHTML = h.length ? ball(h.at(-1)) : '—';
      $('trigger-value').textContent = trigger ?? '—';
      $('trigger-mode').textContent = state.fixed === null ? 'Automático' : 'Fixado';
      $('auto').setAttribute('aria-pressed',String(state.fixed === null));
      $('fix').setAttribute('aria-pressed',String(state.fixed !== null));
      $('window').value = String(state.window);
      $('sector-caption').textContent = 'Últimos ' + Math.min(h.length,state.window) + ' giros';
      $('dominance-caption').textContent = h.length + ' giros conhecidos';
      $('numbers').innerHTML = h.slice(-14).map(ball).join('');
      $('catalog').innerHTML = data.catalog.map((row,i) => '<tr><td>' + ball(row.number) + '</td><td>' + escape(row.range) + '</td><td>' + escape(row.parity) + '</td><td>' + row.column + '</td><td>' + row.dozen + '</td><td>' + row.sector + '</td><td>' + row.group + '</td></tr>').join('');
      $('catalog-caption').textContent = 'Mais recente primeiro · ' + Math.min(h.length,200) + ' visíveis';
      $('sectors').innerHTML = bars(data.sectors);
      $('subsectors').innerHTML = bars(data.subsectors);
      const labels = {color:'Cor',range:'Alto / baixo',parity:'Paridade',column:'Coluna',dozen:'Dúzia',sector:'Setor'};
      const display = {red:'Vermelho',black:'Preto',zero:'Zero'};
      $('dominance').innerHTML = data.dominance.map(({property,ranking}) => {
        const top = ranking[0];
        const winners = top ? ranking.filter(row => row.count === top.count).map(row => display[row.label] || row.label).join(' / ') : '—';
        return '<div><small>' + labels[property] + '</small><b>' + winners + '</b><span>' + (top ? Math.round(top.percent) + '%' : '') + '</span></div>';
      }).join('');
      $('group-label').textContent = data.sequence.from ? data.sequence.from + ' → ' + data.sequence.to : '—';
      $('sequence').innerHTML = data.sequence.matches.length ? data.sequence.matches.slice(-8).reverse().map(row =>
        '<div class="sequence-row">' + ball(row.first) + '<span>→</span>' + ball(row.second) + '<span>→</span>' + ball(row.next) + '</div>').join('') : '<p class="empty">Ainda não há terceiro resultado conhecido para esse par de grupos.</p>';
      $('sequence-caption').textContent = data.sequence.matches.length + ' sequências completas';
      $('group-ranking').innerHTML = data.sequence.ranking.map(row => '<span class="tag">' + row.label + ' · ' + row.count + '/' + row.total + '</span>').join('');
      $('isolated-caption').textContent = data.isolated.samples + (data.isolated.samples === 1 ? ' resultado conhecido depois de ' : ' resultados conhecidos depois de ') + (trigger ?? '—');
      $('isolated').innerHTML = bars(data.isolated.ranking.slice(0,16),true);
      $('isolated-empty').textContent = !data.isolated.samples ? 'O último gatilho ainda pode estar aguardando o resultado seguinte.' : '';
      renderTimeline(data.timeline);
      $('undo').disabled = !state.manual.length;
      buttons.forEach(button => { button.disabled = false; });
      $('regions').value = regionText();
    }

    function commit(next) {
      state = next;
      let warning = '';
      try { localStorage.setItem(key,JSON.stringify(state)); }
      catch { warning = 'A sessão está em memória. O navegador bloqueou o salvamento.'; }
      render();
      status(warning);
    }

    for (let n = 0; n <= 36; n++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = color(n);
      button.textContent = n;
      button.addEventListener('click',() => commit({...state,manual:state.manual.concat(n)}));
      buttons.push(button);
      $('keys').appendChild(button);
    }
    $('import').addEventListener('click',() => {
      try {
        const seed = parse($('input').value,$('order').value === 'newest');
        commit({...state,seed,manual:[]});
        $('input').value = '';
      } catch (error) { status(error.message); }
    });
    $('sample').addEventListener('click',() => {
      commit({...state,seed:[...SAMPLE],manual:[],fixed:null});
      status('Exemplo transcrito das fotos · 10 giros.');
    });
    $('undo').addEventListener('click',() => {
      if (state.manual.length) commit({...state,manual:state.manual.slice(0,-1)});
    });
    $('fix').addEventListener('click',() => {
      const text = $('trigger').value.trim();
      if (!/^\d{1,2}$/.test(text) || !valid(Number(text))) { status('Escolha um gatilho de 0 a 36.'); return; }
      commit({...state,fixed:Number(text)});
    });
    $('auto').addEventListener('click',() => commit({...state,fixed:null}));
    $('window').addEventListener('change',() => {
      const window = Number($('window').value);
      if ([15,30,50,200].includes(window)) commit({...state,window});
    });
    $('apply-regions').addEventListener('click',() => {
      try {
        const lines = $('regions').value.trim().split('\n').filter(line => line.trim());
        if (lines.length !== 8) throw Error('Informe os oito lados, um por linha.');
        const regions = DEFAULT_REGIONS.map(region => ({name:region.name,halves:[[],[]]}));
        const seen = new Set();
        for (const line of lines) {
          const match = line.match(/^(Zero|Direita|Oposto|Esquerda)\s*\(([LR])\)\s*=\s*(.+)$/);
          if (!match) throw Error('Use o formato Zero (L) = 12 35 3 26.');
          const index = regions.findIndex(region => region.name === match[1]);
          const side = match[2] === 'L' ? 0 : 1;
          const signature = index + '-' + side;
          if (seen.has(signature)) throw Error('Um lado foi informado duas vezes.');
          seen.add(signature);
          regions[index].halves[side] = parse(match[3]);
        }
        validateRegions(regions);
        commit({...state,regions});
      } catch (error) { status(error.message); }
    });
    $('export').addEventListener('click',async () => {
      const text = history().join(' ');
      $('input').value = text;
      $('order').value = 'oldest';
      $('input').focus();
      $('input').select();
      try { await navigator.clipboard.writeText(text); status('Histórico copiado, do mais antigo ao mais recente.'); }
      catch { status('Histórico selecionado para copiar.'); }
    });
    $('close').addEventListener('click',() => host.remove());
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved) {
        if (!Array.isArray(saved.seed) || saved.seed.length > 200 || !saved.seed.every(valid) ||
            !Array.isArray(saved.manual) || !saved.manual.every(valid) ||
            !(saved.fixed === null || valid(saved.fixed)) || ![15,30,50,200].includes(saved.window)) {
          throw Error('A sessão salva não pôde ser restaurada.');
        }
        validateRegions(saved.regions);
        state = saved;
      }
    } catch (error) { status(error.message); }
    render();
  }

  const VIEW = `
<style>
:host{display:block;position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#100d20;color:#eeeafa;font:14px/1.45 system-ui,sans-serif;color-scheme:dark}
*{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}
main{max-width:1560px;margin:auto;padding:18px}header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}
h1{margin:0;font-size:25px;letter-spacing:-.7px}h1 span{color:#9c7bff}h2{margin:0;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;font-weight:650}p{margin:8px 0}.muted,small{color:#a49bb9}small{font-size:11px}
header p{margin:3px 0 0;font-size:12px}.button,button,select,input{border:1px solid #39304e;border-radius:7px;background:#201932;color:#eeeafa;padding:8px 11px;min-height:40px}button.primary,button[aria-pressed=true]{background:#7650e7;border-color:#a88aff;color:#fff}button:hover{filter:brightness(1.16)}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #b79cff;outline-offset:2px}
.layout{display:grid;grid-template-columns:minmax(260px,.95fr) minmax(350px,1.4fr) minmax(280px,1fr);gap:15px;align-items:start}.column{display:grid;gap:15px;min-width:0}.panel{background:#181227;border:1px solid #30263f;border-radius:12px;padding:16px;min-width:0}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.panel-head small{white-space:nowrap}textarea{display:block;width:100%;border:1px solid #3f3356;border-radius:7px;background:#100c1c;color:#eeeafa;padding:10px;resize:vertical;min-height:72px}.actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:10px}.actions select{min-width:0;flex:1}#status{min-height:20px;margin:8px 0 0;color:#d5b9ff;font-size:12px}.numbers{display:flex;gap:5px;flex-wrap:wrap;min-height:32px}.ball{display:inline-flex;align-items:center;justify-content:center;width:29px;height:29px;flex:none;border-radius:50%;font-size:12px;font-weight:650;border:1px solid #6a5c80}.ball.red,.keys .red{background:#be2044;border-color:#d34665}.ball.black,.keys .black{background:#211b32;border-color:#665c7b}.ball.zero,.keys .zero{background:#007d62;border-color:#22ac8c}.keys{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px;margin:14px 0 0}.keys button{padding:3px;min-height:37px;font-weight:650}.bar-row{display:grid;grid-template-columns:100px minmax(0,1fr) 42px;gap:9px;align-items:center;min-height:31px;font-size:11px}.bar-row b{text-align:right;font-weight:500;color:#c8bfd8}.bar-track{height:7px;background:#261c3a;border-radius:2px;overflow:hidden}.bar-track i{display:block;height:100%;background:#9165ff}.bar-row:has(.ball){grid-template-columns:31px minmax(0,1fr) 28px;min-height:33px}.bar-row:has(.ball) .ball{width:25px;height:25px;font-size:11px}.table-wrap{max-height:360px;overflow:auto}table{width:100%;border-collapse:collapse;text-align:center;font-size:10px}thead{position:sticky;top:0;background:#181227;color:#a79bbd}th{font-size:9px;text-transform:uppercase;letter-spacing:.3px}th,td{padding:7px 3px;border-bottom:1px solid #2b223a}td .ball{width:24px;height:24px;font-size:11px}td:last-child{color:#b9a2ec}.stat-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.stat-row>div{padding:13px 8px;text-align:center;background:#20192f;border-radius:8px}.stat-row strong{display:block;font-size:24px;margin:5px 0;color:#fff}.stat-row small{display:block}.stat-row .ball{width:37px;height:37px;font-size:17px}#trigger-mode{font-size:10px;letter-spacing:.7px;text-transform:uppercase}.dominance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dominance>div{background:#20192f;padding:11px;border-radius:7px;min-width:0}.dominance small,.dominance b,.dominance span{display:block}.dominance b{font-size:12px;font-weight:550;margin:5px 0;overflow-wrap:anywhere}.dominance span{color:#b095ff;font-size:18px;font-weight:650}.sequence-row{display:grid;grid-template-columns:1fr 20px 1fr 20px 1fr;align-items:center;justify-items:center;padding:9px 0;border-bottom:1px solid #2d243e}.sequence-row>span:not(.ball){color:#6e5c8a}.group-label{font-size:20px;color:#c7b4ff;font-weight:600;margin:10px 0}.tags{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.tag{display:inline-block;padding:4px 7px;border-radius:5px;background:#291e3d;color:#c5afe7;font-size:11px}.trend-cards{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:15px}.trend-cards>div{text-align:center;background:#20192f;padding:9px;border-radius:7px}.trend-cards b{display:block;color:#bdabeb;font-size:13px;margin:6px 0}.trend-cards small{display:block;font-size:10px}.neighbor-grid{display:grid;grid-template-columns:37px repeat(5,minmax(0,1fr)) 37px;grid-auto-rows:41px;position:relative;align-items:center;text-align:center}.neighbor-grid>.empty{grid-column:1/-1}.head-left{grid-column:2/4}.head-center{grid-column:4}.head-right{grid-column:5/7}.neighbor-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-column:2/7;align-items:center;justify-items:center;height:41px}.neighbor-row.newest{background:#2b1f42;outline:1px solid #523c76}.sign{font-size:15px;font-weight:700}.up{color:#6ccee4}.down{color:#ffb274}.run{height:100%;display:flex;align-items:center;font-size:10px;z-index:1}.run.left{grid-column:1;border-right:2px solid currentColor;justify-content:flex-start}.run.right{grid-column:7;border-left:2px solid currentColor;justify-content:flex-end}.run b{background:#211a30;padding:2px}.empty{color:#9c90b0;font-size:12px;line-height:1.6;padding:9px 0}.trigger-input{width:75px}.note{font-size:11px;color:#9f92b5;line-height:1.6}details{margin-top:12px}summary{cursor:pointer;color:#ad9cc6;font-size:11px}#regions{font:12px/1.6 monospace;min-height:190px;margin-top:10px}#window{padding:4px;min-height:30px;max-width:100px}#isolated-empty{font-size:11px;color:#a398b4}
@media(max-width:1120px){.layout{grid-template-columns:minmax(250px,1fr) minmax(350px,1.4fr)}.right-column{grid-column:1/-1;grid-template-columns:1fr 1fr}}
@media(max-width:700px){main{padding:10px}header{align-items:flex-start}h1{font-size:22px}.layout{display:flex;flex-direction:column}.column{width:100%}.center-column{order:0}.right-column{order:1;display:grid;grid-template-columns:1fr}.left-column{order:2}.keys{grid-template-columns:repeat(7,minmax(0,1fr))}.panel{padding:13px}.table-wrap{max-height:300px}.stat-row strong{font-size:21px}header p{max-width:235px}.actions button{min-height:44px}.bar-row{grid-template-columns:95px minmax(0,1fr) 40px}}
</style>
<main>
<header><div><h1>Vitória <span>Radar</span></h1><p class="muted">Catalogação · vizinhos · sequências</p></div><button id="close" type="button">Fechar</button></header>
<div class="layout">
<div class="column left-column">
<section class="panel"><div class="panel-head"><h2>Catalogação</h2><small id="catalog-caption"></small></div><div class="table-wrap"><table><thead><tr><th>Nº</th><th>Faixa</th><th>Par</th><th>Col.</th><th>Dúz.</th><th>Setor</th><th>Grupo</th></tr></thead><tbody id="catalog"></tbody></table></div></section>
<section class="panel"><div class="panel-head"><h2>Setores mais quentes</h2><select id="window" aria-label="Janela dos setores"><option value="15">15 giros</option><option value="30">30 giros</option><option value="50">50 giros</option><option value="200">200 giros</option></select></div><small id="sector-caption"></small><div id="sectors"></div></section>
<section class="panel"><div class="panel-head"><h2>Sub-setores</h2></div><div id="subsectors"></div><details><summary>Conferir divisão dos setores</summary><p class="note">Divisão inferida das fotos. L e R representam os dois lados de cada setor. Ajuste os limites se o aplicativo original usar outra divisão.</p><textarea id="regions" aria-label="Divisão dos setores"></textarea><button id="apply-regions" type="button">Aplicar divisão</button></details></section>
</div>
<div class="column center-column">
<section class="panel"><div class="panel-head"><h2>Histórico</h2><button id="sample" type="button">Exemplo das fotos</button></div><textarea id="input" rows="3" placeholder="Cole até 200 resultados de 0 a 36" aria-label="Histórico para importar"></textarea><div class="actions"><select id="order" aria-label="Ordem do histórico"><option value="newest">Mais recente primeiro</option><option value="oldest">Mais antigo primeiro</option></select><button id="import" type="button" class="primary">Importar</button></div><div class="actions"><button id="undo" type="button">Apagar último</button><button id="export" type="button">Copiar histórico</button></div><div id="status" role="status" aria-live="polite"></div><div id="numbers" class="numbers" aria-label="Últimos 14 números em ordem cronológica"></div><div id="keys" class="keys" aria-label="Inserir resultado"></div></section>
<section class="panel"><div class="stat-row"><div><small>Último</small><strong id="last">—</strong></div><div><small>Gatilho</small><strong id="trigger-value">—</strong><small id="trigger-mode">Automático</small></div><div><small>Giros</small><strong id="total">0</strong></div></div></section>
<section class="panel"><div class="panel-head"><h2>Dominância</h2><small id="dominance-caption"></small></div><div id="dominance" class="dominance"></div></section>
<section class="panel"><div class="panel-head"><h2>Grupos / sequência</h2><small id="sequence-caption"></small></div><div id="group-label" class="group-label">—</div><div id="group-ranking" class="tags"></div><div id="sequence"></div><p class="note">F1 · 1–9 | F2 · 10–19 | F3 · 20–29 | F4 · 30–36<br>V · vermelho | P · preto | Z · zero. Regra inferida dos exemplos visíveis.</p></section>
</div>
<div class="column right-column">
<section class="panel"><div class="panel-head"><h2>Timeline de vizinhos</h2><small>15 últimos</small></div><div class="trend-cards"><div><small>Vizinho esquerdo</small><b id="left-current"></b><small id="left-max"></small></div><div><small>Vizinho direito</small><b id="right-current"></b><small id="right-max"></small></div></div><div id="neighbors" class="neighbor-grid"></div><details><summary>Como as setas são calculadas</summary><p class="note">Cada seta compara o valor numérico do vizinho atual com o vizinho do giro anterior. ↑ aumentou, ↓ diminuiu, = repetiu. As marcações agrupam duas ou mais comparações consecutivas.</p></details></section>
<section class="panel"><div class="panel-head"><h2>Análise isolada</h2><small>16 mais frequentes</small></div><div class="actions"><input id="trigger" class="trigger-input" type="number" min="0" max="36" placeholder="0–36" aria-label="Número gatilho"><button id="fix" type="button" aria-pressed="false">Fixar</button><button id="auto" type="button" aria-pressed="true">Auto</button></div><p><small id="isolated-caption"></small></p><div id="isolated"></div><p id="isolated-empty"></p><details><summary>O que este ranking conta</summary><p class="note">Ocorrências do número imediatamente depois do gatilho no histórico conhecido. Uma ocorrência sem resultado seguinte fica fora da contagem.</p></details></section>
</div>
</div>
</main>`;

  if (typeof module === 'object' && module.exports) {
    module.exports = {WHEEL,DEFAULT_REGIONS,SAMPLE,parse,validateRegions,regionFor,classify,neighbors,directionRuns,neighborTimeline,distribution,isolated,groupSequence,analyze};
  }
  if (typeof document !== 'undefined') {
    if (document.body) install();
    else document.addEventListener('DOMContentLoaded',install,{once:true});
  }
})();
