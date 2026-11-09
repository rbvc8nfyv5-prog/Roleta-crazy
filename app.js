/* Vitória Master V5 · JavaScript completo · quatro leituras e uma cobertura de 33 casas. */
(() => {
"use strict";
function analysisBackground() {
    const localStorage = {
      getItem() {
        return null;
      },
      setItem() {},
    };
    /*
ANÁLISE BETA V6.6.36 — BASE V6.4.5 + VARIAÇÕES V6.4.9.

- Pós-loss atravessa a pausa MASTER; PÓS-3 LOSS independente, todas as estratégias e prioridade máxima.
- Sequências de LOSS finais sobrevivem ao descarte da janela; checkpoint sem fila ilimitada.
- Busca geométrica validada preservada; seleção parcial exata e metadados de geometria reutilizados; salvamento compactado em segundo plano.
- Número aparece imediatamente; indicação atualiza uma única vez, sem tela provisória vazia.
- Estado completo salvo após cada número, com retomada da fila ao reabrir.
- Reutilização de caches de análises puras; critérios e cálculos mantidos.
- MASTER decide entre as estratégias, incluindo o Treinador Global independente.
- Após encerrar entrada/G1, MASTER observa dois resultados completos antes do próximo sinal.
- Linha MASTER registra os ciclos executados; sem resultados fictícios durante a pausa.
- Ajuste visual: quadro expande sob a própria linha, sem rolagem programada; textos e números compactos.
- Pós-loss exclusivamente das 12 adaptativas; pode intervir sobre qualquer seleção quando ligado.
- Nome da linha do tempo abre quadro de jogo; indicação pós-loss destacada; placares separados.
- Botão 3º automático por proprietário; PÓS-LOSS automático entre perdas finais recentes.
- Pós-loss sem validação mínima: LOSS final já habilita a estratégia. Histórico apenas ordena as candidatas.
- Treinador Global e Pós-loss podem ficar ligados juntos: sem LOSS novo segue o Global; com LOSS usa o Pós-loss.
- Estratégia BASE selecionável, além de V1–V8 em cada grupo.
- Ranking das oito variações: posição, acerto direto e melhor ao lado do nome.
- Linhas por ciclo: W verde, G1 amarelo; o mesmo quadrinho vira R vermelho se perder a defesa.
- Grupos de treinadores, originais e variações recolhíveis.
- Somente Treinador Global e Treinador Global Números.
- Oito variações por original e Treinador Números.
- Cada variação conserva NORMAL, DINAMICO, RX_NORMAL e RX_DINAMICO, C4/C5/C6.
- Cada conjunto tem 12 coberturas distintas de 33 e cobre a roda inteira, 37/37.
- Janela importada de 8 a 70; entram 10 novos, saem 10 antigos.
- Análises e próxima jogada atualizadas a cada número; descarte de dez a cada dez.
- Jogada e defesa comprometidas preservadas, inclusive na virada do bloco.
- Melhor variação virtual no lugar do líquido; avaliação somente com resultados passados.
- Processamento em segundo plano quando disponível; número recebido aparece imediatamente.
- Análises de triangulação, amplitude, percurso, encadeamento, polos e arcos mantidas.

Cobertura conjunta não transforma uma jogada de 33 em cobertura individual de 37.
*/
    const VERSION = "6.6.50",
      KEY = "ANALISE_BETA_V664",
      WINDOW = 70;
    const OLD_KEYS=[];
    const W = [
      32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
      16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26, 0,
    ];

    const W_INDEX = Array(37);

    W.forEach((n, i) => {
      W_INDEX[n] = i;
    });

    const RED = new Set([
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ]);

    const REGIONS = {
      TIERS: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
      ORFAOS: [17, 34, 6, 1, 20, 14, 31, 9],
      VOISINS: [22, 18, 29, 7, 25, 2, 21, 4, 19],
      ZERO: [28, 12, 35, 3, 26, 0, 32, 15],
    };

    const FAMILIES = ["NORMAL", "DINAMICO", "RX_NORMAL", "RX_DINAMICO"],
      RADII = [4, 5, 6];

    const ORIGINALS = [
      ["FIXED", "AUTO RANKING"],
      ["GEO", "MELHOR GEOMETRIA"],
      ["BEST", "MELHOR DESEMPENHO"],
      ["STABLE", "ESTABILIDADE"],
      ["SWITCH", "TROCA INTELIGENTE"],
      ["CONSENSUS", "CONSENSO"],
      ["UNION", "UNIÃO"],
    ];

    const ADAPTATIVES = Array.from({ length: 12 }, (_, i) => ({
      id: "A" + String(i + 1).padStart(2, "0"),
      name: "ADAPTATIVA " + String(i + 1).padStart(2, "0"),
      window: [10, 10, 10, 20, 20, 20, 30, 30, 20, 30, 20, 30][i],
      margin: [
        0.05, 0.1, 0.15, 0.05, 0.1, 0.15, 0.05, 0.1, 0.08, 0.12, 0.1, 0.08,
      ][i],
      maxRank: [12, 12, 12, 12, 12, 12, 12, 12, 12, 6, 4, 8][i],
    }));

    const G1_MODES = ["CONGELADA", "AJUSTE FINO", "RECONSTRUÇÃO"],
      BEHAVIORS = ["CONTINUIDADE", "DESLOCAMENTO", "RUPTURA"];

    const $ = (id) => document.getElementById(id),
      mod = (n) => ((n % 37) + 37) % 37,
      ix = (n) => (Number.isInteger(n) && n >= 0 && n <= 36 ? W_INDEX[n] : -1),
      avg = (a) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0),
      clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      copy = (x) => (x == null ? x : JSON.parse(JSON.stringify(x))),
      fmt = (n) => (Number.isFinite(n) ? n.toFixed(2).replace(".", ",") : "—"),
      pct = (a, b) => (b ? fmt((100 * a) / b) + "%" : "—");

    const nearBand = (n) =>
      n === 0 ? "0" : n <= 2 ? "1-2" : n <= 4 ? "3-4" : n <= 8 ? "5-8" : "9+";

    function esc(x) {
      return String(x ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    }

    function cleanNumbers(a) {
      return Array.isArray(a)
        ? a.filter((n) => Number.isInteger(n) && n >= 0 && n <= 36)
        : [];
    }

    function neighbors(n, r) {
      const p = ix(n);
      return p < 0
        ? []
        : Array.from({ length: 2 * r + 1 }, (_, i) => W[mod(p + i - r)]);
    }

    function distance(a, b) {
      const x = ix(a),
        y = ix(b);
      if (x < 0 || y < 0) return 18;
      const d = Math.abs(x - y);
      return Math.min(d, 37 - d);
    }

    function direction(a, b) {
      const x = ix(a),
        y = ix(b);
      if (x < 0 || y < 0) return 0;
      const f = mod(y - x),
        r = mod(x - y);
      return f <= r ? f : -r;
    }

    function region(n) {
      return Object.keys(REGIONS).find((k) => REGIONS[k].includes(n)) || "ZERO";
    }

    const MIRROR = new Set();

    for (const n of [11, 12, 13, 21, 22, 23, 31, 32, 33])
      for (const x of neighbors(n, 1)) MIRROR.add(x);

    function mirror(n) {
      return MIRROR.has(n) ? "ESPELHO" : "ANTIESPELHO";
    }

    function signaturePlay(play) {
      return play.blocks
        .map((b) => b.radius + ":" + b.center)
        .sort()
        .join("|");
    }

    function validLegacyPlay(p) {
      return (
        !!p &&
        typeof p === "object" &&
        Array.isArray(p.numbers) &&
        p.numbers.length === 28 &&
        p.numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 36) &&
        new Set(p.numbers).size === 28 &&
        Array.isArray(p.blocks) &&
        p.blocks.length === 6 &&
        p.blocks.filter((b) => b.radius === 2).length === 5 &&
        p.blocks.filter((b) => b.radius === 1).length === 1 &&
        p.blocks.every(
          (b) =>
            Number.isInteger(b.center) &&
            ix(b.center) >= 0 &&
            Array.isArray(b.numbers) &&
            b.numbers.join(",") === neighbors(b.center, b.radius).join(","),
        ) &&
        p.blocks.flatMap((b) => b.numbers).every((n) => p.numbers.includes(n))
      );
    }

    function validLegacy31Play(p) {
      return (
        !!p &&
        typeof p === "object" &&
        Array.isArray(p.numbers) &&
        p.numbers.length === 31 &&
        p.numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 36) &&
        new Set(p.numbers).size === 31 &&
        Array.isArray(p.blocks) &&
        p.blocks.length === 7 &&
      new Set(p.blocks.flatMap(block => block.numbers)).size === 31 &&
        p.blocks.filter((b) => b.radius === 2).length === 5 &&
        p.blocks.filter((b) => b.radius === 1).length === 2 &&
        p.blocks.every(
          (b) =>
            Number.isInteger(b.center) &&
            ix(b.center) >= 0 &&
            Array.isArray(b.numbers) &&
            b.numbers.join(",") === neighbors(b.center, b.radius).join(","),
        ) &&
        p.blocks.flatMap((b) => b.numbers).every((n) => p.numbers.includes(n))
      );
    }

    function normalizeTerminalTrio(digits) {
    return Array.isArray(digits)&&digits.length===3&&new Set(digits).size===3&&
      digits.every(digit=>Number.isInteger(digit)&&digit>=0&&digit<=9)
      ? [...digits].sort((a,b)=>a-b) : null;
  }

  // Compara com a última entrada de terminais, nunca com a defesa G1.
  function previousTerminalTrio(mode) {
    if(state.fixedTerminalTrio || state.strategy!==mode)return null;
    const row=state.ledger.findLast(row=>row.phase==="ENTRY" &&
      (row.controller==="TERMINALS" || row.controller==="TERMINAL_SUGGESTION") &&
      terminalPlay(row.play));
    const base=row?.play?.kind==="ROTATED33"?row.play.base:row?.play;
    return normalizeTerminalTrio(base?.terminalDigits);
  }

  function allowedTerminal(digit,selected,previous) {
    return !previous?.includes(digit) || !selected.some(value=>previous.includes(value));
  }

  function fixedTerminalOrder(h, trio) {
    if(!trio)return null;
    const history=h.slice(-14), ranked=[];
    let remaining=history.map((_,i)=>i);
    const groups=trio.map(digit=>terminalGroup(digit));
    while(ranked.length<3){
      const candidates=groups.filter(group=>!ranked.includes(group.digit)).map(group=>({
        digit:group.digit, hits:remaining.filter(i=>group.numbers.includes(history[i]))
      })).sort((a,b)=>b.hits.length-a.hits.length||
        b.hits.filter(i=>i>=history.length-5).length-a.hits.filter(i=>i>=history.length-5).length||
        (b.hits.at(-1)??-1)-(a.hits.at(-1)??-1)||a.digit-b.digit);
      const first=candidates[0],covered=new Set(first.hits);
      ranked.push(first.digit);
      remaining=remaining.filter(i=>!covered.has(i));
    }
    return ranked;
  }

  function fixedTerminalMotor(h, trio, preferred, profile, order=fixedTerminalOrder(h,trio)) {
    const motor=buildTerminalMotor(h,order,preferred,profile);
    return motor&&trio?{...motor,fixedTerminalTrio:[...trio]}:motor;
  }

  function terminalTrioKey(){return state.fixedTerminalTrio?.join(',')||"";}

  function terminalSuggestionDefinition() {
      return {id:"TERMINAL_SUGGESTION", name:"SUGESTÃO • TRÊS TERMINAIS", type:"TERMINALS"};
    }

    // Os exemplos acabam antes do giro seguinte. As analogias deslocam o salto
    // observado para o ponto atual da roda; ocorrências exatas usam o número real.
    let terminalSearchCache=null;
    function terminalNextSearch(h) {
      const history=h.slice(-70), key=history.join(",");
      if(terminalSearchCache?.key===key)return terminalSearchCache;
      const recent=Array(37).fill(.2), exact=Array(37).fill(0), analog=Array(37).fill(0);
      history.slice(-14).reverse().forEach((n,i)=>recent[ix(n)]+=Math.exp(-i/9));
      let exactMass=0, analogMass=0, matches=0;
      const last=history.at(-1), penultimate=history.at(-2);
      const now=direction(penultimate,last);
      for(let i=1;i<history.length-1;i++){
        const age=Math.exp(-(history.length-2-i)/24);
        const next=history[i+1];
        if(history[i]===last){
          const w=age*(history[i-1]===penultimate?3:1);
          exact[ix(next)]+=w; exactMass+=w; matches++;
        }else{
          const jump=direction(history[i-1],history[i]);
          if(Math.sign(jump)!==Math.sign(now)||Math.abs(jump-now)>2)continue;
          const w=age*Math.exp(-Math.abs(jump-now));
          analog[mod(ix(last)+direction(history[i],next))]+=w; analogMass+=w;
        }
      }
      const exactShare=.42*exactMass/(exactMass+2);
      const analogShare=.23*analogMass/(analogMass+3);
      const recentMass=recent.reduce((sum,value)=>sum+value,0);
      const weights=recent.map((value,i)=>(1-exactShare-analogShare)*value/recentMass+
        (exactMass?exactShare*exact[i]/exactMass:0)+(analogMass?analogShare*analog[i]/analogMass:0));
      return terminalSearchCache={key,weights,matches};
    }

    let terminalSets=null;
    function terminalTrioSets() {
      if(terminalSets)return terminalSets;
      const groups=Array.from({length:10},(_,d)=>terminalGroup(d));
      const rows=[];
      for(let a=0;a<8;a++)for(let b=a+1;b<9;b++)for(let c=b+1;c<10;c++){
        const digits=[a,b,c],ending=new Set(digits);
        const targets=W.flatMap((n,i)=>ending.has(n%10)?[i]:[]);
        const core=new Set(digits.flatMap(d=>groups[d].numbers));
        rows.push({digits,targets,near:W.flatMap((n,i)=>core.has(n)&&!ending.has(n%10)?[i]:[])});
      }
      return terminalSets=rows;
    }

    function terminalSearchWeights(search,support,share) {
      const mass=support.reduce((sum,value)=>sum+Math.max(0,value),0);
      return search.weights.map((value,i)=>mass?(1-share)*value+share*Math.max(0,support[i])/mass:value);
    }

    function bestNextTerminalTrio(weights,previous) {
      let best=null, score=-Infinity;
      for(const row of terminalTrioSets()){
        if(previous&&row.digits.filter(d=>previous.includes(d)).length>1)continue;
        let total=0;
        for(const i of row.targets)total+=weights[i];
        for(const i of row.near)total+=.5*weights[i];
        if(total>score+1e-12){best=row;score=total;}
      }
      // A ordem do quadro mostra a contribuição de cada terminal, sem duplicar vizinhos.
      const pending=[...best.digits], digits=[], covered=new Set();
      while(pending.length){
        const value=d=>terminalGroup(d).numbers.reduce((sum,n)=>sum+
          (n%10===d?1:covered.has(n)?0:.5)*weights[ix(n)],0);
        pending.sort((a,b)=>value(b)-value(a)||a-b);
        const digit=pending.shift();
        digits.push(digit);
        for(const n of terminalGroup(digit).numbers)covered.add(n);
      }
      return {digits,score};
    }

    function projectTerminalSuggestion(source,template,identity,fixedOrder,previous,projections,search) {
      if(!validPlay(source?.play)||!template)return null;
      const key=coverageCode(source.play)+"|"+source.play.blocks.map(block=>block.center).join(",");
      let projection=projections.get(key);
      if(!projection){
        const support=W.map(number=>Number(source.play.numbers.includes(number))+
          source.play.blocks.reduce((sum,block)=>sum+1/(1+distance(number,block.center)),0)/source.play.blocks.length);
        const weights=terminalSearchWeights(search,support,.25);
        const selected=fixedOrder?null:bestNextTerminalTrio(weights,previous);
        const digits=fixedOrder?[...fixedOrder]:selected.digits;
        const play=packTerminalTrio(digits,weights);
        projection={play,digits,score:selected?.score??0};
        projections.set(key,projection);
      }
      const {play,digits,score}=projection;
      if(!validTerminalPlay(play))throw Error("SUGESTÃO DE TERMINAIS INVÁLIDA");
      return {...copy(template),key:"TERMINAL_SUGGESTION::"+identity.id,play,
        terminalDigits:digits,terminalSelection:null,
        ...(fixedOrder?{fixedTerminalTrio:normalizeTerminalTrio(fixedOrder)}:{}),
        terminalProfile:{family:FAMILIES.includes(source.family)?source.family:template.terminalProfile.family,
          radius:RADII.includes(source.radius)?source.radius:template.terminalProfile.radius},
        terminalSuggestionTarget:{id:identity.id,name:identity.name},terminalSourceKey:source.key,
        terminalReading:{method:"TRANSIÇÕES E TRIOS",through:state.totalTurns,samples:search.matches,included:[]},score};
    }

    const TERMINAL_SUGGESTION_RULE="TRIOS_INDEPENDENTES_PROXIMO_V1";
    function terminalSuggestionRule(){return TERMINAL_SUGGESTION_RULE+"_"+BALANCED_WEIGHT_RULE;}
    let terminalSuggestionCache=null;
    function terminalSuggestionCandidates(block=currentBlock(),nativeForecasts=null) {
      if(!block||state.history.length<8)return [];
      const previous=previousTerminalTrio("TERMINAL_SUGGESTION");
      const signature=JSON.stringify([state.totalTurns,state.history,state.block.decisionTurn,terminalTrioKey(),
        previous,currentTerminalCoverage(),state.trainerChoice,state.globalStrategyPrevious]);
      if(terminalSuggestionCache?.state===state&&terminalSuggestionCache.signature===signature)
        return terminalSuggestionCache.rows;
      const native=nativeForecasts||snapshotTimelineForecastsBase(block);
      const names=new Map(timelineDefinitions().map(def=>[def.id,def.name]));
      const template=terminalBank()[0], search=terminalNextSearch(state.history);
      const fixedOrder=fixedTerminalOrder(state.history,state.fixedTerminalTrio);
      const candidates=native.filter(row=>!["TERMINALS","TERMINAL_SUGGESTION","POSTLOSS","MASTER","FOLLOW_MASTER"].includes(row.id));
      const seen=new Set(),rows=[],projections=new Map();
      for(const candidate of candidates){
        if(seen.has(candidate.id))continue;
        seen.add(candidate.id);
        const motor=projectTerminalSuggestion(candidate.motor,template,
          {id:candidate.id,name:names.get(candidate.id)||candidate.id},fixedOrder,previous,projections,search);
        if(motor){
          const weighted=applyBalancedWeight(motor,state.history,{changeTrio:true,previous});
          rows.push({id:candidate.id,name:motor.terminalSuggestionTarget.name,motor:weighted});
        }
      }
      terminalSuggestionCache={state,signature,rows};
      return rows;
    }

    function terminalSuggestionRanking(block=currentBlock(),nativeForecasts=null) {
      const blue=currentTerminalCoverage()==="BLUE";
      return terminalSuggestionCandidates(block,nativeForecasts).map(candidate=>{
        const observations=terminalEvidence(candidate.id,blue);
        const prior=blue?coverageNumbers(candidate.motor.play,"BLUE").length/37:33/37;
        function rate(limit,decay){
          const sample=observations.slice(-limit);let mass=0,hits=0;
          for(let i=0;i<sample.length;i++){const w=Math.exp(-(sample.length-1-i)/decay);mass+=w;if(sample[i])hits+=w;}
          return (hits+prior*4)/(mass+4);
        }
        return {...candidate,tests:observations.length,
          score:rate(5,3)*.65+rate(14,8)*.25+rate(30,18)*.10};
      }).sort((a,b)=>b.score-a.score||b.motor.score-a.motor.score||a.id.localeCompare(b.id));
    }

    function terminalSuggestionMotor(block=currentBlock(),nativeForecasts=null) {
      const chosen=terminalSuggestionRanking(block,nativeForecasts)[0];
      return chosen?{...copy(chosen.motor),terminalSuggestionScore:chosen.score,terminalSuggestionTests:chosen.tests}:null;
    }

  const terminalCoverageCache=new WeakMap();
  function terminalPlay(play){return (play?.kind==="ROTATED33"?play.base:play)?.kind==="TERMINALS33";}
  function currentTerminalCoverage(){return state.permanenceEnabled?"BLUE":"ALL";}
  function coverageNumbers(play,mode="ALL"){
    if(!play)return [];
    if(mode!=="BLUE"||!terminalPlay(play))return play.numbers||[];
    if(!terminalCoverageCache.has(play))terminalCoverageCache.set(play,[...new Set(rotationDisplayBlocks(play).filter(b=>isBlueTarget(play,b)).flatMap(b=>b.numbers))]);
    return terminalCoverageCache.get(play);
  }
  function coverageHit(play,n,mode="ALL"){return coverageNumbers(play,mode).includes(n);}
  function coverageMotor(motor){return motor&&terminalPlay(motor.play)?{...motor,terminalCoverage:currentTerminalCoverage()}:motor;}
  function motorHit(motor,n){return coverageHit(motor?.play,n,motor?.terminalCoverage||"ALL");}
  function terminalEvidence(id,blue){
    const field=blue?"terminalSuggestionBlueHits":"terminalSuggestionHits",seed=blue?state.permanence.blueSeed:null;
    const rows=seed?[...seed.rows,...state.ledger.filter(r=>r.turn>seed.throughTurn)]:state.ledger;
    return rows.filter(r=>(r.terminalTrioKey||"")===terminalTrioKey()&&r.terminalRule===TERMINAL_LAYOUT_RULE&&r.terminalSuggestionRule===terminalSuggestionRule()&&r[field]&&id in r[field]).slice(-30).map(r=>r[field][id]);
  }
  function sealPermanenceSession(){
    if(!state.permanenceEnabled)return;
    const ranking=permanenceRanking(),best=ranking[0];
    state.permanence.session={context:permanenceContext(),coverage:currentTerminalCoverage(),period:best?.period||1,
      tests:best?.tests||0,trainedAt:state.totalTurns,ranking:copy(ranking)};
    clearPermanencePending();
  }
  function g1CoverageBook(key){
    const books=state.permanence.g1Books||(state.permanence.g1Books={});
    if(!books[key])books[key]={options:{FROZEN:[],RECALCULATE:[],OTHER:[]},strategies:{},used:state.totalTurns};
    const book=books[key];book.used=state.totalTurns;
    for(const stale of Object.keys(books).sort((a,b)=>books[b].used-books[a].used).slice(8))delete books[stale];
    return book;
  }
  function g1CoverageRate(rows,motor,coverage){
    const recent=rows.filter(r=>r.turn>=Math.max(1,state.totalTurns-70)).slice(-30);
    const prior=coverageNumbers(motor.play,coverage).length/37;
    function rate(limit,decay){const sample=recent.slice(-limit);let mass=0,hits=0;
      for(let i=0;i<sample.length;i++){const w=Math.exp(-(sample.length-1-i)/decay);mass+=w;if(sample[i].hit)hits+=w;}
      return (hits+prior*6)/(mass+6);
    }
    return .7*rate(5,3)+.3*rate(20,12);
  }
  let g1CandidateCache=null;
  function g1Candidates(h){
    const signature=state.totalTurns+"|"+h.join(',')+"|"+terminalTrioKey();
    if(g1CandidateCache?.state===state&&g1CandidateCache.signature===signature)return g1CandidateCache.rows;
    const saved=state.history;let rows=[];
    try{state.history=[...h];rows=terminalSuggestionCandidates(currentBlock()).map(row=>({id:row.id,motor:applyRotation(row.motor)}));}
    finally{state.history=saved;}
    g1CandidateCache={state,signature,rows};return rows;
  }
  function sessionG1Decision(original,n,h,turn,record=false){
    if(!state.permanenceEnabled||!terminalPlay(original?.play)||(record&&state.playLock))return null;
    const coverage=original.terminalCoverage||currentTerminalCoverage(),key=permanenceContext();
    const book=g1CoverageBook(key),candidates=g1Candidates(h),source=original.terminalSuggestionTarget?.id;
    const same=candidates.find(row=>row.id===source)?.motor||applyRotation(applyBalancedWeight(fixedTerminalMotor(h,original.fixedTerminalTrio||null,[],original.terminalProfile),h,{stage:"RECONSTRUÇÃO"}))||original;
    const other=candidates.filter(row=>row.id!==source).map(row=>({...row,score:g1CoverageRate(book.strategies[row.id]||[],row.motor,coverage)}))
      .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))[0]?.motor||same;
    const choices=[{id:"FROZEN",label:"MANTER COBERTURA",motor:original},{id:"RECALCULATE",label:"RECALCULAR TERMINAIS",motor:same},{id:"OTHER",label:"OUTRA ESTRATÉGIA",motor:other}];
    const chosen=choices.map((option,index)=>({...option,index,score:g1CoverageRate(book.options[option.id],option.motor,coverage)}))
      .sort((a,b)=>b.score-a.score||a.index-b.index)[0];
    return {motor:{...copy(chosen.motor),terminalCoverage:record?"ALL":coverage},mode:chosen.label,behavior:"DEFESA INDEPENDENTE",
      triangleKey:triangleContext(h),spatialKeys:[...spatialRead(h).keys],
      permanenceG1:record?{key,coverage,selected:chosen.id,failureTurn:turn,
        options:choices.map(option=>[option.id,[...coverageNumbers(option.motor.play,coverage)]]),
        candidates:candidates.map(row=>[row.id,[...coverageNumbers(row.motor.play,coverage)]])}:null};
  }
  function settleSessionG1(cycle,n,turn){
    const audit=cycle?.decision?.permanenceG1;if(!audit||audit.failureTurn>=turn)return;
    const book=g1CoverageBook(audit.key);
    for(const [id,numbers] of audit.options){const rows=book.options[id];rows.push({turn,hit:numbers.includes(n)});book.options[id]=rows.slice(-30);}
    for(const [id,numbers] of audit.candidates){const rows=book.strategies[id]||(book.strategies[id]=[]);rows.push({turn,hit:numbers.includes(n)});book.strategies[id]=rows.slice(-30);}
  }

    function permanenceContext() {
      return JSON.stringify([state.strategy,state.rank,state.manual,state.adaptive,state.activeCreated,
        state.variantSelections,state.terminalManual,state.g1,state.g1Trainer,state.galeSkip,state.secondHouse,
        state.rotationEnabled,state.reorganizeTenEnabled,state.postLossEnabled,state.postThreeEnabled,
        state.postOneAllEnabled,state.postTwoAllEnabled,"BLUE_STUDY",
      ...(state.fixedTerminalTrio?[terminalTrioKey()]:[]),
      ...(["TERMINALS","TERMINAL_SUGGESTION"].includes(state.strategy)?[TERMINAL_LAYOUT_RULE]:[])]);
    }
    function permanenceBook() {
      const key=permanenceContext(),books=state.permanence.books;
      if(!books[key]){
        let hash=2166136261;for(const c of key)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
        books[key]={key,hash:String(hash),used:state.totalTurns,modes:[1,2,3,4,5].map(period=>({period,held:null,remaining:0}))};
      }
      const book=books[key];book.used=state.totalTurns;
      if(state.permanence.activeContext!==key){
        for(const mode of book.modes){mode.held=null;mode.remaining=0;}
        state.permanence.activeContext=key;
      }
      const keys=Object.keys(books).sort((a,b)=>books[b].used-books[a].used);
      for(const expired of keys.slice(8)){
        for(const mode of books[expired].modes){const id=permanenceId(books[expired],mode.period);delete state.strategyTimeline[id];delete state.timelineCycles[id];delete state.strategyStreaks[id];}
        delete books[expired];
      }
      return book;
    }
    function permanenceId(book,period){return "PERMANENCE:"+book.hash+":"+period;}
    function permanenceRanking(book=permanenceBook()) {
      return book.modes.map(mode=>{
        const id=permanenceId(book,mode.period),rows=timelineSamples(id).filter(row=>row.turn<=state.totalTurns).slice(-30);
        const closed=row=>row.closed&&row.closedTurn<=state.totalTurns;
        const reward=row=>!closed(row)?-.05:row.result==="GREEN"?1:row.result==="GREEN G1"?.45:-1;
        function index(limit,decay){const sample=rows.slice(-limit);let mass=0,gain=0;
          for(let i=0;i<sample.length;i++){const w=Math.exp(-(sample.length-1-i)/decay);mass+=w;gain+=w*reward(sample[i]);}
          return (gain+.5*4)/(mass+4);
        }
        const finished=rows.filter(closed);
        return {period:mode.period,id,tests:finished.length,direct:finished.filter(row=>row.result==="GREEN").length,
          g1:finished.filter(row=>row.result==="GREEN G1").length,loss:finished.filter(row=>row.result==="LOSS").length,
          pending:rows.length-finished.length,score:index(5,3)*.60+index(15,10)*.25+index(30,20)*.15};
      }).sort((a,b)=>b.score-a.score||a.period-b.period);
    }
    function permanenceMotor(source) {
      if(!state.permanenceEnabled)return source;
      const key=permanenceContext(),applied=state.permanence.applied;
      if(applied?.context===key&&applied.remaining>0&&validPlay(applied.motor?.play))return copy(applied.motor);
      if(!validPlay(source?.play))return source;
      const period=state.permanence.session?.period||(state.importTrainingActive?permanenceRanking()[0]?.period:1)||1;
      return {...copy(source),permanenceTarget:{context:key,period,decisionTurn:state.totalTurns}};
    }
    function commitPermanence(motor,turn) {
      if(!state.permanenceEnabled||state.playLock||!motor?.permanenceTarget)return;
      const target=motor.permanenceTarget,old=state.permanence.applied;
      if(old?.context===target.context&&old.remaining>0)return;
      state.permanence.applied={context:target.context,period:target.period,remaining:target.period,
        startTurn:turn,motor:copy(motor)};
    }
    function preparePermanenceForecasts(block) {
      if(!state.permanenceEnabled||!block||state.permanence.session)return [];
      const book=permanenceBook(),source=coverageMotor(applyRotation(unifiedMotor(activeMotorBase(block.global),block))),forecasts=[];
      for(const mode of book.modes){
        const id=permanenceId(book,mode.period);
        if(!state.timelineCycles[id]&&(mode.period===1||mode.remaining<=0||!validPlay(mode.held?.play))){
          mode.held=validPlay(source?.play)?copy(source):null;mode.remaining=mode.period;
        }
        if(validPlay(mode.held?.play))forecasts.push({id,motor:copy(mode.held),defenseStrategy:id,permanencePeriod:mode.period});
      }
      return forecasts;
    }
    function advancePermanenceClock() {
      if(!state.permanenceEnabled)return;
      const book=permanenceBook();
      for(const mode of book.modes)mode.remaining=Math.max(0,mode.remaining-1);
      const applied=state.permanence.applied;
      if(!state.playLock&&applied?.context===book.key)applied.remaining=Math.max(0,applied.remaining-1);
    }
    function clearPermanencePending() {
      state.permanence.applied=null;
      for(const book of Object.values(state.permanence.books))for(const mode of book.modes){
        const id=permanenceId(book,mode.period);mode.held=null;mode.remaining=0;
        delete state.timelineCycles[id];
        if(state.strategyTimeline[id])state.strategyTimeline[id]=state.strategyTimeline[id].filter(row=>row.closed);
      }
    }

    const TERMINAL_LAYOUT_RULE = "TRIO_6X5_1X3_V1";
  const terminalLayoutsByTrio = new Map();
  let terminalLayouts = null;

  function standardTerminalLayouts() {
    if(terminalLayouts)return terminalLayouts;
    const layouts=[];
    // Start with the unique three-pocket block. Four uncovered pockets
    // can go into any of the seven gaps; this enumerates every exact layout.
    function distribute(gaps,left){
      if(gaps.length<6){
        for(let gap=0;gap<=left;gap++)distribute([...gaps,gap],left-gap);
        return;
      }
      const spaces=[...gaps,left],centers=[],outside=[];
      let cursor=0;
      for(let i=0;i<7;i++){
        const radius=i===0?1:2;
        centers.push(cursor+radius);
        cursor+=2*radius+1;
        for(let gap=0;gap<spaces[i];gap++)outside.push(cursor++);
      }
      for(let start=0;start<37;start++)layouts.push({
        centers:centers.map(pos=>mod(start+pos)),
        outside:outside.map(pos=>mod(start+pos)),
        excludedDigits:outside.reduce((mask,pos)=>mask|(1<<(W[mod(start+pos)]%10)),0),
        short:[start,mod(start+1),mod(start+2)]
      });
    }
    distribute([],4);
    return terminalLayouts=layouts;
  }

  function layoutsForTerminalTrio(digits) {
    const key=[...digits].sort((a,b)=>a-b).join(',');
    if(terminalLayoutsByTrio.has(key))return terminalLayoutsByTrio.get(key);
    const terminalMask=digits.reduce((mask,digit)=>mask|(1<<digit),0);
    const endings=W.map(number=>Boolean(terminalMask&(1<<(number%10))));
    const core=new Set(digits.flatMap(digit=>terminalGroup(digit).numbers));
    const corePositions=W.map(number=>core.has(number));
    let smallestLoss=Infinity,options=[];
    for(const layout of standardTerminalLayouts()){
      // Terminal pockets always stay in play, even if an exact tiling
      // requires sacrificing a neighbour (only the 2/3/4 trio needs this).
      if(layout.excludedDigits&terminalMask)continue;
      const [a,b,c,d]=layout.outside;
      const missing=Number(corePositions[a])+Number(corePositions[b])+Number(corePositions[c])+Number(corePositions[d]);
      if(missing>smallestLoss)continue;
      if(missing<smallestLoss){smallestLoss=missing;options=[];}
      options.push({...layout,terminalCenters:layout.centers.reduce((sum,pos)=>sum+Number(endings[pos]),0)});
    }
    const result={core,options};
    terminalLayoutsByTrio.set(key,result);
    return result;
  }

  function packTerminalTrio(digits,weights,preferred=[],score=null) {
    const {core,options}=layoutsForTerminalTrio(digits);
    const blue=currentTerminalCoverage()==="BLUE";
    const favored=new Set(preferred);
    let best=null,bestPreference=Infinity,bestCost=Infinity;
    for(const option of options){
      let cost=0,missedPreferred=0;
      for(const pos of option.outside){cost+=weights[pos]||0;if(favored.has(W[pos]))missedPreferred++;}
      if(blue)for(const pos of option.short)cost+=weights[pos]||0;
      if(!best||missedPreferred<bestPreference||
          (missedPreferred===bestPreference&&(cost<bestCost-1e-9||
            (Math.abs(cost-bestCost)<=1e-9&&option.terminalCenters>best.terminalCenters)))){
        best=option;bestPreference=missedPreferred;bestCost=cost;
      }
    }
    if(!best)throw Error("NÃO FOI POSSÍVEL ENCAIXAR O TRIO EM SETE ALVOS.");
    const blocks=best.centers.map((pos,i)=>{
      const center=W[pos],radius=i===0?1:2;
      return {center,radius,numbers:neighbors(center,radius)};
    });
    const outside=new Set(best.outside);
    const numbers=W.filter((_,pos)=>!outside.has(pos));
    return {kind:"TERMINALS33",terminalLayout:"6X5_1X3",terminalDigits:[...digits],
      completion:numbers.filter(number=>!core.has(number)),blocks,numbers,
      omittedTerminalNeighbours:best.outside.map(pos=>W[pos]).filter(number=>core.has(number)),
      score:score??avg(numbers.map(number=>weights[ix(number)]||0))};
  }

  const BALANCED_WEIGHT_RULE="FAIXAS_CORES_V1";
  const HIGH_NUMBER_START=19;

  // 0 verde, baixo preto, baixo vermelho, alto preto e alto vermelho.
  const spinGroup=n=>n===0?0:1+2*Number(n>=HIGH_NUMBER_START)+Number(RED.has(n));
  const wheelGroups=W.map(spinGroup);
  const groupSizes=wheelGroups.reduce((sizes,group)=>(sizes[group]++,sizes),[0,0,0,0,0]);
  const groupPrior=groupSizes.map(size=>size/37);
  const groupSignals=new Map();

  function groupSignal(history){
    const groups=history.slice(-40).map(spinGroup),key=groups.join("");
    const known=groupSignals.get(key);
    if(known)return known;

    const counts=groupPrior.map(()=>0);
    const byRange=Array.from({length:3},()=>groupPrior.map(()=>0));
    const byColor=Array.from({length:3},()=>groupPrior.map(()=>0));
    const range=g=>g===0?0:g<3?1:2;
    const color=g=>g===0?0:g%2?1:2;
    const quality=[0,0,0];
    const distribution=(row,priorMass)=>{
      const total=row.reduce((a,b)=>a+b,0)+priorMass;
      return row.map((v,i)=>(v+priorMass*groupPrior[i])/total);
    };
    const predictions=previous=>[
      distribution(counts,12),
      distribution(byRange[range(previous)],16),
      distribution(byColor[color(previous)],16)
    ];
    let previous=0;
    for(const group of groups){
      const forecasts=predictions(previous);
      for(let i=0;i<forecasts.length;i++){
        // Cada modelo ganha peso só pelo resultado previsto antes da atualização.
        quality[i]=.92*quality[i]+Math.log(forecasts[i][group]/groupPrior[group]);
      }
      counts.forEach((v,i)=>{counts[i]=.92*v;});
      counts[group]++;
      byRange[range(previous)][group]++;
      byColor[color(previous)][group]++;
      previous=group;
    }
    const trust=quality.map(value=>Math.exp(clamp(value,-3,3)));
    const mass=2+trust.reduce((a,b)=>a+b,0);
    const forecasts=predictions(previous);
    const probabilities=groupPrior.map((p,g)=>
      (2*p+forecasts.reduce((sum,row,i)=>sum+trust[i]*row[g],0))/mass);
    groupSignals.set(key,probabilities);
    if(groupSignals.size>256)groupSignals.delete(groupSignals.keys().next().value);
    return probabilities;
  }

  function balanceNumberWeights(weights,history){
    const groupMass=[0,0,0,0,0];
    for(let i=0;i<W.length;i++)groupMass[wheelGroups[i]]+=weights[i];
    const total=groupMass.reduce((a,b)=>a+b,0)||1;
    const probabilities=groupSignal(history);
    return weights.map((value,i)=>{
      const group=wheelGroups[i];
      const within=groupMass[group]?value/groupMass[group]:1/groupSizes[group];
      return total*(.35*value/total+.65*probabilities[group]*within);
    });
  }

  function excludesOnlyOneRange(outside,offset=0){
    const [a,b,c,d]=outside;
    const low=W[mod(a+offset)]<HIGH_NUMBER_START;
    return low===(W[mod(b+offset)]<HIGH_NUMBER_START)&&
      low===(W[mod(c+offset)]<HIGH_NUMBER_START)&&low===(W[mod(d+offset)]<HIGH_NUMBER_START);
  }
  let lowNumberTrioOptions=null;
  const lowNumberWeightCache=new Map();

  function availableLowNumberTrios(){
    if(lowNumberTrioOptions)return lowNumberTrioOptions;
    return lowNumberTrioOptions=terminalTrioSets().map(row=>({...row,...layoutsForTerminalTrio(row.digits)}));
  }

  function lowNumberTerminalPlan(weights,trio,previous,preferred,offset) {
    const blue=currentTerminalCoverage()==="BLUE";
    const favored=new Set(preferred.map(ix));
    const rows=trio?[{digits:trio,...layoutsForTerminalTrio(trio)}]:availableLowNumberTrios();
    let best=null,bestCost=Infinity,bestMiss=Infinity,bestExact=-Infinity,bestSkew=Infinity;
    for(const row of rows){
      if(!trio&&previous&&row.digits.filter(d=>previous.includes(d)).length>1)continue;
      let exact=0;
      if(row.targets)for(const i of row.targets)exact+=weights[i];
      for(const layout of row.options){
        const [a,b,c,d]=layout.outside;
        const miss=favored.size?Number(favored.has(a))+Number(favored.has(b))+Number(favored.has(c))+Number(favored.has(d)):0;
        if(miss>bestMiss)continue;
        const [x,y,z]=layout.short;
        const cost=weights[a]+weights[b]+weights[c]+weights[d]+(blue?weights[x]+weights[y]+weights[z]:0);
        const skew=Number(excludesOnlyOneRange(layout.outside,offset));
        if(miss<bestMiss||skew<bestSkew||(skew===bestSkew&&
            (cost<bestCost-1e-12||(Math.abs(cost-bestCost)<=1e-12&&exact>bestExact+1e-12)))){
          best={row,layout};bestCost=cost;bestMiss=miss;bestExact=exact;bestSkew=skew;
        }
      }
    }
    if(!best)return null;
    const {row,layout}=best;
    const blocks=layout.centers.map((pos,i)=>({center:W[pos],radius:i?2:1,numbers:neighbors(W[pos],i?2:1)}));
    const excluded=new Set(layout.outside);
    const numbers=W.filter((_,i)=>!excluded.has(i));
    return {kind:"TERMINALS33",terminalLayout:"6X5_1X3",terminalDigits:[...row.digits],blocks,numbers,
      completion:numbers.filter(n=>!row.core.has(n)),
      omittedTerminalNeighbours:layout.outside.map(i=>W[i]).filter(n=>row.core.has(n)),
      score:1-bestCost};
  }

  // A entrada por giro usa a leitura automática. Permanência e segunda
  // casa seguem o ciclo do modo escolhido e usam os pesos dos mesmos motores.
  function isolatedEntryActive(){
    return !state.permanenceEnabled&&!state.secondHouse&&
      ["FOLLOW_MASTER","TERMINAL_SUGGESTION"].includes(state.strategy);
  }

  function isolatedEntryMotor(block=currentBlock()){
    if(!isolatedEntryActive()||!block)return null;
    if(state.playLock?.motor)return copy(state.playLock.motor);
    const original=activeMotor(block.global,false);
    const changeTrio=state.strategy==="TERMINAL_SUGGESTION";
    return applyBalancedWeight(original,state.history,{isolated:true,changeTrio,
      previous:state.isolatedLastTrios[state.strategy]||null});
  }

  function settleIsolatedEntry(row,motor){
    if(!validPlay(motor?.play))return;
    const id=state.strategy,play=motor.play,base=play.kind==="ROTATED33"?play.base:play;
    const green=play.numbers.includes(row.number);
    const stats=state.colorRangeScores[id]||(state.colorRangeScores[id]={total:0,green:0,exact:0});
    stats.total++;
    if(green)stats.green++;
    if(green&&base.terminalDigits?.includes(row.number%10)&&!play.offset)stats.exact++;
    if(base.terminalDigits)state.isolatedLastTrios[id]=[...base.terminalDigits];
    row.isolatedEntry={id,profile:BALANCED_WEIGHT_RULE,result:green?"GREEN":"LOSS",beforeTurn:row.turn-1,
      excluded:missing(play),trio:copy(base.terminalDigits||null),numberClass:recordedNumberClass(play,row.number),
      motor:motor.key,source:motor.terminalSuggestionTarget?.id||motor.followTarget?.id||null};
  }

  const exactLayoutsByOffset=new Map();
  function exactIsolatedLayout(weights,offset){
    const rotation=mod(offset);
    if(!exactLayoutsByOffset.has(rotation)){
      const seen=new Set();
      const layouts=standardTerminalLayouts().filter(layout=>{
        if(excludesOnlyOneRange(layout.outside,rotation))return false;
        const key=[...layout.outside].sort((a,b)=>a-b).join(",");
        if(seen.has(key))return false;
        seen.add(key);
        return true;
      });
      exactLayoutsByOffset.set(rotation,layouts);
    }
    let best=null,cost=Infinity;
    for(const layout of exactLayoutsByOffset.get(rotation)){
      const [a,b,c,d]=layout.outside, score=weights[a]+weights[b]+weights[c]+weights[d];
      if(score<cost-1e-12){best=layout;cost=score;}
    }
    if(!best)return null;
    const blocks=best.centers.map((pos,i)=>({center:W[pos],radius:i?2:1,numbers:neighbors(W[pos],i?2:1)}));
    const excluded=new Set(best.outside);
    return {blocks,numbers:W.filter((_,i)=>!excluded.has(i)),score:1-cost};
  }

  function applyBalancedWeight(motor,history=state.history,options={}) {
    if(!validPlay(motor?.play))return motor;
    const {changeTrio=false,previous=null,mandatory=[],stage="ENTRADA",isolated=false}=options;
    if(!isolated&&motor.lowNumberWeight?.rule===BALANCED_WEIGHT_RULE&&stage==="ENTRADA")return motor;
    const reading=terminalNextSearch(history);
    const rotated=motor.play.kind==="ROTATED33",offset=rotated?motor.play.offset:0;
    const base=rotated?motor.play.base:motor.play,terminal=terminalPlay(base);
    const preferred=offset?mandatory.map(n=>W[mod(ix(n)-offset)]):mandatory;
    const allowTrioChange=terminal&&changeTrio&&!motor.fixedTerminalTrio;
    // Uma exclusão repetida perde força a cada giro. A proteção usa somente
    // coberturas registradas antes da entrada e pertence à leitura atual.
    const exclusions=isolated?state.ledger.slice(-4).map(row=>row.isolatedEntry)
      .filter(row=>row?.id===state.strategy&&row.profile===BALANCED_WEIGHT_RULE)
      .map(row=>row.excluded):[];
    const key=[reading.key,coverageCode(motor.play),offset,terminal?base.terminalDigits.join():"",allowTrioChange?previous?.join()??"*":"",
      preferred.join(),terminal?currentTerminalCoverage():"",isolated,exclusions.map(out=>out.join()).join(";")].join("|");
    let play=lowNumberWeightCache.get(key);
    if(!play){
      const included=new Set(motor.play.numbers);
      const raw=W.map((n,i)=>{
        const repeat=exclusions.reduce((count,out)=>count+Number(out.includes(n)),0);
        return .55*reading.weights[i]+(included.has(n)?.45/33:0)+.006*Math.max(0,repeat-1);
      });
      const balanced=balanceNumberWeights(raw,history);
      const w=offset?W.map((_,i)=>balanced[mod(i+offset)]):balanced;
      play=terminal?lowNumberTerminalPlan(w,allowTrioChange?null:base.terminalDigits,previous,preferred,offset)
        :preferred.length?rawGeometry(w,preferred):exactIsolatedLayout(w,offset);
      if(!validPlay(play))return motor;
      lowNumberWeightCache.set(key,play);
      if(lowNumberWeightCache.size>1024)lowNumberWeightCache.delete(lowNumberWeightCache.keys().next().value);
    }
    const evidence={rule:BALANCED_WEIGHT_RULE,stage,beforeTurn:state.totalTurns+(stage==="ENTRADA"?0:1),
      baseOutside:missing(motor.play)};
    let adjusted={...motor,play,lowNumberWeight:evidence};
    if(terminal)adjusted={...adjusted,terminalDigits:[...play.terminalDigits],
      terminalSelection:allowTrioChange?null:motor.terminalSelection};
    if(offset)adjusted=rotateMotorAt(adjusted,offset);
    return adjusted;
  }

  function standardTerminalPlay(play) {
    return terminalPlay(play)&&(play.kind==="ROTATED33"?play.base:play).terminalLayout==="6X5_1X3";
  }

  function isBlueTarget(play,block) {
    return standardTerminalPlay(play)?block.radius===2:block.radius>0;
  }

  function terminalDefinition() {
      return {id:"TERMINALS", name:"TERMINAIS • TRÊS COM VIZINHOS", type:"TERMINALS"};
    }

    const terminalGroups = [];
  function terminalGroup(digit) {
    if(terminalGroups[digit])return terminalGroups[digit];
      const centers = W.filter(number => number % 10 === digit);
      const covered = new Set(centers.flatMap(number => neighbors(number, 1)));
      return terminalGroups[digit]={digit, centers, numbers:W.filter(number => covered.has(number))};
    }

    function validTerminalPlay(play) {
      if (!play || play.kind !== "TERMINALS33" || !Array.isArray(play.terminalDigits) ||
          play.terminalDigits.length !== 3 || new Set(play.terminalDigits).size !== 3 ||
          !play.terminalDigits.every(d => Number.isInteger(d) && d >= 0 && d <= 9) ||
          !Array.isArray(play.completion) || !Array.isArray(play.blocks) ||
          !Array.isArray(play.numbers) || play.numbers.length !== 33 ||
          new Set(play.numbers).size !== 33 ||
          !play.numbers.every(n => Number.isInteger(n) && n >= 0 && n <= 36)) return false;
      if(play.terminalLayout==="6X5_1X3"){
      return validStandard33(play)&&W.every(number=>!play.terminalDigits.includes(number%10)||play.numbers.includes(number));
    }
    const centers = W.filter(number => play.terminalDigits.includes(number % 10));
      const core = new Set(centers.flatMap(number => neighbors(number, 1)));
      if (play.completion.length !== 33 - core.size ||
          new Set(play.completion).size !== play.completion.length ||
          !play.completion.every(n => Number.isInteger(n) && n >= 0 && n <= 36 && !core.has(n))) return false;
      const expected = [...centers.map(center => ({center,radius:1})),
        ...play.completion.map(center => ({center,radius:0}))];
      if (play.blocks.length !== expected.length) return false;
      for (let index = 0; index < expected.length; index++) {
        const block = play.blocks[index], wanted = expected[index];
        if (!block || block.center !== wanted.center || block.radius !== wanted.radius ||
            !Array.isArray(block.numbers) ||
            block.numbers.join(',') !== neighbors(wanted.center,wanted.radius).join(',')) return false;
      }
      const union = new Set(play.blocks.flatMap(block => block.numbers));
      return union.size === 33 && play.numbers.every(number => union.has(number));
    }

    let terminalAnalysisCache=null;
  function terminalAnalysis(h, previous=null) {
    const history=h.slice(-14);
    const key=history.join(",")+"|"+(previous?.join(",")||"");
    if(terminalAnalysisCache?.key===key)return terminalAnalysisCache.analysis;
      const groups=Array.from({length:10},(_,digit)=>{
        const group=terminalGroup(digit);
        const hit=number=>group.numbers.includes(number);
        return {...group,hits:history.filter(hit).length,
          recentHits:history.slice(-5).filter(hit).length,
          lastHit:history.findLastIndex(hit)};
      });
      const ranking=[...groups].sort((a,b)=>b.hits-a.hits || b.recentHits-a.recentHits ||
        b.lastHit-a.lastHit || a.digit-b.digit);
      const used=new Set(), selectedDigits=[], steps=[];
      // Track occurrence positions, not distinct values. Repeated results count as
      // separate spins, but an occurrence can be credited to only one terminal.
      let remaining=history.map((_,index)=>index);
      for(let step=0;step<3;step++){
        const candidates=groups.filter(group=>!used.has(group.digit)&&allowedTerminal(group.digit,selectedDigits,previous)).map(group=>{
          const hitIndices=remaining.filter(index=>group.numbers.includes(history[index]));
          return {digit:group.digit,hitIndices,addedHits:hitIndices.length,
            recentAdded:hitIndices.filter(index=>index>=history.length-5).length,
            lastAdded:hitIndices.length?hitIndices[hitIndices.length-1]:-1};
        }).sort((a,b)=>b.addedHits-a.addedHits || b.recentAdded-a.recentAdded ||
          b.lastAdded-a.lastAdded || a.digit-b.digit);
        const chosen=candidates[0],covered=new Set(chosen.hitIndices);
        const before=[...remaining];
        remaining=remaining.filter(index=>!covered.has(index));
        used.add(chosen.digit);selectedDigits.push(chosen.digit);
        steps.push({step:step+1,digit:chosen.digit,addedHits:chosen.addedHits,
          beforeIndices:before,hitIndices:[...chosen.hitIndices],remainingIndices:[...remaining],
          candidates:candidates.map(candidate=>({digit:candidate.digit,addedHits:candidate.addedHits,
            recentAdded:candidate.recentAdded,lastAdded:candidate.lastAdded}))});
      }
      // Kept for complete coverage construction and an explicitly frozen G1 triplet.
      // This catalogue never overrides the three sequential selections above.
      const combinations=[];
      for(let a=0;a<8;a++)for(let b=a+1;b<9;b++)for(let c=b+1;c<10;c++){
        const digits=[a,b,c],union=new Set(digits.flatMap(digit=>groups[digit].numbers));
        const numbers=W.filter(number=>union.has(number));
        const hits=history.filter(number=>union.has(number)).length;
        combinations.push({digits,numbers,hits,score:history.length?hits/history.length:0});
      }
      const analysis={groups,ranking,selectedDigits,steps,remainingIndices:remaining,combinations,
      samples:history.length,history:[...history],rule:TERMINAL_LAYOUT_RULE};
    terminalAnalysisCache={key,analysis};
    return analysis;
    }

    function buildTerminalMotor(h, forcedDigits = null, preferred = [], profile = {family:"NORMAL", radius:5}, previous = null, search = null) {
      const history=h.slice(-14);
      if(history.length<8)return null;
      const analysis=terminalAnalysis(history,forcedDigits?null:previous);
      const reading=state.readingSide==="INVERTIDO"?[...history].reverse():history;
    const motorWeights=weightsFor(reading,profile.family,profile.radius);
    const weights=search?terminalSearchWeights(search,motorWeights,.25):motorWeights;
    const digits=forcedDigits?[...forcedDigits]:search?bestNextTerminalTrio(weights,previous).digits:[...analysis.selectedDigits];
      const sorted=[...digits].sort((a,b)=>a-b).join(',');
      const choice=analysis.combinations.find(row=>row.digits.join(',')===sorted);
      if(!choice)return null;
      // Each motor keeps its own reading for the extra pockets. Terminal selection
      // itself always follows the visible chronological last-14 observations.
      const play=packTerminalTrio(digits,weights,preferred,choice.score);
      if(!validTerminalPlay(play))throw Error("GEOMETRIA DOS TERMINAIS INVÁLIDA.");
      const first=analysis.groups[digits[0]],second=analysis.groups[digits[1]],third=analysis.groups[digits[2]];
      const firstCovered=new Set(first.numbers),two=new Set([...first.numbers,...second.numbers]);
      const positions=history.map((_,index)=>index);
      const firstIndices=positions.filter(index=>firstCovered.has(history[index]));
      const secondIndices=positions.filter(index=>!firstCovered.has(history[index])&&second.numbers.includes(history[index]));
      const thirdIndices=positions.filter(index=>!two.has(history[index])&&third.numbers.includes(history[index]));
      const coveredResults=firstIndices.length+secondIndices.length+thirdIndices.length;
      const selection={rule:analysis.rule,window:14,samples:history.length,numbers:[...history],
        first:{digit:first.digit,hits:firstIndices.length,hitIndices:firstIndices},
        second:{digit:second.digit,hits:secondIndices.length,addedHits:secondIndices.length,
          totalHits:second.hits,hitIndices:secondIndices},
        third:{digit:third.digit,hits:thirdIndices.length,addedHits:thirdIndices.length,
          totalHits:third.hits,hitIndices:thirdIndices},
        remainingAfterFirst:history.length-firstIndices.length,
        firstTwoMisses:history.length-firstIndices.length-secondIndices.length,
        remainingAfterThird:history.length-coveredResults,coveredResults,
        ranking:analysis.ranking.map(group=>({digit:group.digit,hits:group.hits,recentHits:group.recentHits})),
        forced:!!forcedDigits};
      return {key:"TERMINAIS::"+profile.family+"_"+profile.radius,type:"TERMINALS",rank:0,
        terminalRule:analysis.rule,terminalProfile:copy(profile),terminalDigits:digits,
        terminalSelection:selection,samples:history.length,testedCombinations:120,
      ...(search?{terminalReading:{method:"TRANSIÇÕES E TRIOS",through:state.totalTurns,samples:search.matches,included:[]}}:{}),
        observedHits:choice.hits,score:choice.score,play,
        spatialScore:spatialCoverage(play,reading),spatialKeys:[...spatialRead(reading).keys]};
    }

    function terminalBank() {
      if(state.history.length<8)return [];
      const recent=state.history.slice(-14);
      const previous=previousTerminalTrio("TERMINALS");
    const search=state.strategy==="TERMINALS"&&!state.fixedTerminalTrio?terminalNextSearch(state.history):null;
    const key=state.readingSide+"|"+recent.join(',')+"|"+terminalTrioKey()+"|"+(previous?.join(',')||"")+"|"+currentTerminalCoverage()+"|"+(search?.key||"");
      if(state.block.terminalMomentKey!==key || !Array.isArray(state.block.terminalBank) ||
          state.block.terminalBank.length!==12 || !state.block.terminalBank.every(motor=>
            motor.terminalRule===TERMINAL_LAYOUT_RULE && validTerminalPlay(motor.play))){
        state.block.terminalBank=buildTerminalBank(recent,previous,search);
        state.block.terminalMomentKey=key;
      }
      return state.block.terminalBank;
    }

    function buildTerminalBank(h,previous=null,search=null) {
    const trio=state.fixedTerminalTrio,order=fixedTerminalOrder(h,trio);
    return FAMILIES.flatMap(family=>RADII.map(radius=>trio
      ? fixedTerminalMotor(h,trio,[],{family,radius},order)
      : buildTerminalMotor(h,null,[],{family,radius},previous,search)));
    }

    function terminalRanking() {
      return terminalBank().map(motor=>{
        const rows=state.ledger.filter(row=>(row.terminalTrioKey||"")===terminalTrioKey() && row.terminalRule===TERMINAL_LAYOUT_RULE && row.terminalHits && motor.key in row.terminalHits).slice(-14);
        const recent=rows.slice(-5), prior=33/37;
        const hits=rows.filter(row=>row.terminalHits[motor.key]).length;
        const shortHits=recent.filter(row=>row.terminalHits[motor.key]).length;
        const performance=(hits+prior*8)/(rows.length+8)*.35+
          (shortHits+prior*3)/(recent.length+3)*.65;
        return {motor,tests:rows.length,hits,score:performance+motor.score*.05};
      }).sort((a,b)=>b.score-a.score || a.motor.key.localeCompare(b.motor.key));
    }

    function terminalMotor() {
      const ranked=terminalRanking();
      const selected=ranked.find(row=>row.motor.key===state.terminalManual)||ranked[0];
      return selected?copy(selected.motor):null;
    }

    function terminalTargetBlocksOriginal22(play) {
      if (!validTerminalPlay(play)) return [];
      const covered=new Set(play.numbers);
      // Cut at an uncovered pocket so no selected neighbour block crosses the cut.
      const cut=W.findIndex(number=>!covered.has(number));
      const ordered=Array.from({length:37},(_,index)=>W[mod(cut+1+index)]);
      const blocks=[];
      for (let start=0;start<ordered.length;) {
        if (!covered.has(ordered[start])) {start++;continue;}
        let end=start;
        while (end<ordered.length && covered.has(ordered[end])) end++;
        const run=ordered.slice(start,end), best=Array(run.length+1).fill(0);
        const widths=Array(run.length).fill(1);
        // Maximise original terminal targets with one neighbour, without duplicates.
        // Any pocket not assigned to such a target is displayed as a yellow single.
        for (let index=run.length-1;index>=0;index--) {
          best[index]=best[index+1];
          if (index+2<run.length && play.terminalDigits.includes(run[index+1]%10)) {
            const candidate=1+best[index+3];
            if (candidate>=best[index]) {best[index]=candidate;widths[index]=3;}
          }
        }
        for (let index=0;index<run.length;) {
          const width=widths[index], radius=width===3?1:0;
          const center=run[index+radius];
          blocks.push({center,radius,numbers:neighbors(center,radius)});
          index+=width;
        }
        start=end;
      }
      return blocks.sort((a,b)=>Object.keys(REGIONS).indexOf(region(a.center))-
        Object.keys(REGIONS).indexOf(region(b.center)) || ix(a.center)-ix(b.center));
    }

    function terminalTargetBlocks(play) {
    if(play?.terminalLayout==="6X5_1X3")return [...play.blocks].sort((a,b)=>
      Object.keys(REGIONS).indexOf(region(a.center))-Object.keys(REGIONS).indexOf(region(b.center))||ix(a.center)-ix(b.center));
      // Keep every original blue target from 6.6.22 in exactly the same place.
      const original=terminalTargetBlocksOriginal22(play);
      const preserved=original.filter(block=>block.radius===1);
      const yellow=new Set(original.filter(block=>block.radius===0).map(block=>block.center));
      if (!yellow.size) return original;
      const cut=W.findIndex(number=>!yellow.has(number));
      const ordered=Array.from({length:37},(_,index)=>W[mod(cut+1+index)]);
      const remainder=[];
      for (let index=0;index<ordered.length;) {
        if (!yellow.has(ordered[index])) {index++;continue;}
        if (index+2<ordered.length && yellow.has(ordered[index+1]) && yellow.has(ordered[index+2])) {
          const center=ordered[index+1];
          remainder.push({center,radius:1,numbers:neighbors(center,1)});
          index+=3;
        } else {
          const center=ordered[index];
          remainder.push({center,radius:0,numbers:[center]});
          index++;
        }
      }
      // Only old yellow singles can become new blue targets. Never unpack a blue target.
      return [...preserved,...remainder].sort((a,b)=>
        Object.keys(REGIONS).indexOf(region(a.center))-Object.keys(REGIONS).indexOf(region(b.center)) ||
        ix(a.center)-ix(b.center));
    }

    function validRotatedPlay(play) {
      if (!play || play.kind!=="ROTATED33" || !Number.isInteger(play.offset) ||
          Math.abs(play.offset)>2 || !play.base || play.base.kind==="ROTATED33" ||
          !validPlay(play.base) || !Array.isArray(play.blocks) ||
          play.blocks.length!==play.base.blocks.length || !Array.isArray(play.numbers) ||
          play.numbers.length!==33 || new Set(play.numbers).size!==33) return false;
      const shift=number=>W[mod(ix(number)+play.offset)];
      const expectedNumbers=new Set(play.base.numbers.map(shift));
      if(!play.numbers.every(number=>expectedNumbers.has(number)))return false;
      const expectedBlocks=new Set(play.base.blocks.map(block=>block.radius+":"+shift(block.center)));
      if(new Set(play.blocks.map(block=>block?.radius+":"+block?.center)).size!==expectedBlocks.size)return false;
      return play.blocks.every(block=>{
        return block && expectedBlocks.has(block.radius+":"+block.center) &&
          Array.isArray(block.numbers) && block.numbers.join(',')===neighbors(block.center,block.radius).join(',');
      });
    }

    function rotationDisplayBlocks(play) {
      if(!validPlay(play))return [];
      if(play.kind==="ROTATED33" && play.base.kind==="TERMINALS33")
        return terminalTargetBlocks(play.base).map(block=>{
          const center=W[mod(ix(block.center)+play.offset)];
          return {center,radius:block.radius,numbers:neighbors(center,block.radius)};
        });
      return play.kind==="TERMINALS33"?terminalTargetBlocks(play):play.blocks;
    }

    function inferRotation(play, outcome, previousOffset = 0) {
      const candidates=rotationDisplayBlocks(play).map(block=>({
        center:block.center,offset:direction(block.center,outcome)
      })).filter(candidate=>Math.abs(candidate.offset)<=2);
      candidates.sort((a,b)=>Math.abs(a.offset)-Math.abs(b.offset) ||
        Number(Math.sign(b.offset)===Math.sign(previousOffset))-
          Number(Math.sign(a.offset)===Math.sign(previousOffset)) || ix(a.center)-ix(b.center));
      const chosen=candidates[0];
      return chosen?{offset:chosen.offset,center:chosen.center,distance:Math.abs(chosen.offset),
        status:chosen.offset===0?"NO ALVO":"DESLOCAMENTO"}
        :{offset:0,center:null,distance:null,status:"SEM ALVO ATÉ 2 CASAS"};
    }

    function learnRotation(motor, outcome, turn, phase, result) {
      if(!state.rotationEnabled || motor?.fixedTerminalTrio || !validPlay(motor?.play) ||
          !["ENTRY","SECOND_ENTRY","GALE"].includes(phase) ||
          !["GREEN","GALE","GREEN G1","LOSS"].includes(result))return;
      state.rotation={...inferRotation(motor.play,outcome,state.rotation?.offset||0),
        outcome,turn};
    }

    function rotateMotorAt(motor, offset) {
      if(!motor || !validPlay(motor.play))return motor;
      const base=motor.play.kind==="ROTATED33"?motor.play.base:motor.play;
      const result=copy(motor);
      delete result.rotationTarget;
      if(!offset){result.play=copy(base);return result;}
      const shift=number=>W[mod(ix(number)+offset)];
      const blocks=base.blocks.map(block=>{
        const center=shift(block.center);
        return {center,radius:block.radius,numbers:neighbors(center,block.radius)};
      });
      result.play={kind:"ROTATED33",offset,base:copy(base),blocks,
        numbers:base.numbers.map(shift),score:base.score};
      if(!validRotatedPlay(result.play))throw Error("ROTAÇÃO INVÁLIDA.");
      result.rotationTarget={offset,turn:state.rotation?.turn??null,
        referenceCenter:state.rotation?.center??null,outcome:state.rotation?.outcome??null};
      return result;
    }

    function applyRotation(motor) {
      if(!motor || !state.rotationEnabled || motor.fixedTerminalTrio)return motor;
      const offset=state.rotation?.offset||0;
      if(motor.play?.kind==="ROTATED33" && motor.play.offset===offset)return motor;
      return offset||motor.play?.kind==="ROTATED33"?rotateMotorAt(motor,offset):motor;
    }

    function validPlay(p) {
      if(p?.kind==="ROTATED33")return validRotatedPlay(p);
      if(p?.kind==="TERMINALS33")return validTerminalPlay(p);
      return validStandard33(p);
    }

    function validStandard33(p) {
      return (
        !!p &&
        typeof p === "object" &&
        Array.isArray(p.numbers) &&
        p.numbers.length === 33 &&
        p.numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 36) &&
        new Set(p.numbers).size === 33 &&
        Array.isArray(p.blocks) &&
        p.blocks.length === 7 &&
      new Set(p.blocks.flatMap(block => block.numbers)).size === 33 &&
        p.blocks.filter((b) => b.radius === 2).length === 6 &&
        p.blocks.filter((b) => b.radius === 1).length === 1 &&
        p.blocks.every(
          (b) =>
            Number.isInteger(b.center) &&
            ix(b.center) >= 0 &&
            Array.isArray(b.numbers) &&
            b.numbers.join(",") === neighbors(b.center, b.radius).join(","),
        ) &&
        p.blocks.flatMap((b) => b.numbers).every((n) => p.numbers.includes(n))
      );
    }

    function restoreShape(shape, score) {
      const blocks = shape.split("|").map((part) => {
        const [radius, center] = part.split(":").map(Number);
        return { center, radius, numbers: neighbors(center, radius) };
      });
      const play = { blocks, numbers: blocks.flatMap((b) => b.numbers), score };
      if (!validPlay(play) && !validLegacyPlay(play) && !validLegacy31Play(play)) throw Error("GEOMETRIA SALVA INVÁLIDA.");
      return play;
    }

    function cycleIsFree() {
      return state.phase === "ENTRY" && state.cycle === null;
    }

    const FIVE = W.map((n) => ({
        center: n,
        radius: 2,
        numbers: neighbors(n, 2),
      })),
      THREE = W.map((n) => ({
        center: n,
        radius: 1,
        numbers: neighbors(n, 1),
      }));

    for (const b of [...FIVE, ...THREE])
      b.mask = b.numbers.reduce((s, n) => s | (1n << BigInt(ix(n))), 0n);

    function missing(play) {
      return validPlay(play)
        ? W.filter((n) => !play.numbers.includes(n))
        : [...W];
    }

    function hopTrend(a, b) {
      const x = Math.abs(a),
        y = Math.abs(b);
      return !x && !y
        ? "PARADO"
        : !x
          ? "SAÍDA"
          : !y
            ? "PARADA"
            : y < x
              ? "CONTRAÇÃO"
              : y > x
                ? "EXPANSÃO"
                : "MANUTENÇÃO";
    }

    function lengthBand(n) {
      return n === 0
        ? "0"
        : n <= 6
          ? "1-6"
          : n <= 18
            ? "7-18"
            : n <= 36
              ? "19-36"
              : n <= 72
                ? "37-72"
                : "73+";
    }

    function routeFeatures(numbers) {
      const steps = numbers.slice(1).map((n, i) => direction(numbers[i], n)),
        net = steps.reduce((s, n) => s + n, 0),
        length = steps.reduce((s, n) => s + Math.abs(n), 0),
        signs = new Set(steps.filter(Boolean).map(Math.sign)),
        sameDirection = signs.size === 1,
        closure = numbers.length ? distance(numbers[0], numbers.at(-1)) : 0,
        contour = sameDirection && Math.abs(net) >= 31 && closure <= 6,
        completedTurns = Math.floor(Math.abs(net) / 37),
        nearestTurns = Math.round(net / 37),
        residual = net - nearestTurns * 37,
        trends = steps.slice(1).map((n, i) => hopTrend(steps[i], n)),
        labels = [];
      if (closure === 0) labels.push("FECHAMENTO EXATO");
      else if (closure <= 2) labels.push("FECHAMENTO A 1-2 CASAS");
      else if (closure <= 6) labels.push("FECHAMENTO A 3-6 CASAS");
      if (contour) labels.push("FECHAMENTO POR CONTORNO");
      if (completedTurns) labels.push("VOLTA ACUMULADA " + completedTurns);
      if (trends.length) labels.push(trends.at(-1));
      return {
        numbers: [...numbers],
        steps,
        net,
        length,
        sameDirection,
        closure,
        contour,
        completedTurns,
        nearestTurns,
        residual,
        trends,
        amplitude: Math.max(0, ...steps.map(Math.abs)),
        efficiency: length ? Math.abs(net) / length : 0,
        labels,
      };
    }

    function normalizeSpace(w) {
      const mean = avg(w) || 1;
      return w.map((v) => v / mean);
    }

    function routeSimilarity(a, b) {
      if (a.steps.length !== b.steps.length) return 0;
      const order = avg(a.steps.map((v, i) => Math.abs(v - b.steps[i]))),
        trend = avg(a.trends.map((v, i) => (v === b.trends[i] ? 1 : 0)));
      return (
        Math.exp(
          -Math.abs(a.net - b.net) / 10 -
            Math.abs(a.closure - b.closure) / 4 -
            Math.abs(a.length - b.length) / 12 -
            order / 6,
        ) *
        (a.contour === b.contour ? 1 : 0.35) *
        (a.sameDirection === b.sameDirection ? 1 : 0.5) *
        (0.5 + 0.5 * (a.trends.length ? trend : 1))
      );
    }

    function routeRead(h) {
      const current = [];
      for (let size = 3; size <= Math.min(8, h.length); size++)
        current.push(routeFeatures(h.slice(-size)));
      const weights = Array(37).fill(1),
        matched = new Set();
      let examples = 0;
      for (const r of current) {
        const size = r.numbers.length;
        for (let end = size - 1; end < h.length - 1; end++) {
          const old = routeFeatures(h.slice(end - size + 1, end + 1)),
            similarity = routeSimilarity(old, r),
            recency = Math.exp(-(h.length - 2 - end) / 30),
            projected = W[mod(ix(h.at(-1)) + direction(h[end], h[end + 1]))];
          if (similarity > 0.35) {
            examples++;
            matched.add(end + 1);
          }
          for (let j = 0; j < 37; j++)
            weights[j] +=
              (similarity *
                recency *
                Math.exp(-distance(W[j], projected) / 2)) /
              Math.sqrt(size);
        }
      }
      const triangle = current.find((r) => r.numbers.length === 3),
        chain = current.find((r) => r.numbers.length === 4),
        key = triangle
          ? "R:C" +
            Number(triangle.contour) +
            "|F" +
            nearBand(triangle.closure) +
            "|D" +
            Math.sign(triangle.net) +
            "|V" +
            Math.min(2, chain?.completedTurns || 0) +
            "|L" +
            lengthBand(triangle.length) +
            "|H" +
            triangle.trends.join(",")
          : "R:SEM PERCURSO";
      return {
        current,
        examples,
        uniqueExamples: matched.size,
        weights: normalizeSpace(weights),
        key,
        triangle: triangle || null,
        chain: chain || null,
      };
    }

    const triangleCache = new Map();

    function pointTriangle(n) {
      const a = (2 * Math.PI * ix(n)) / 37;
      return { x: Math.sin(a), y: Math.cos(a) };
    }

    function angleTriangle(a, b, c) {
      const u = { x: a.x - b.x, y: a.y - b.y },
        v = { x: c.x - b.x, y: c.y - b.y },
        d = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y);
      return d < 1e-12
        ? null
        : (Math.acos(clamp((u.x * v.x + u.y * v.y) / d, -1, 1)) * 180) /
            Math.PI;
    }

    function triangleFeatures(a, b, c) {
      const s1 = direction(a, b),
        s2 = direction(b, c),
        closure = distance(a, c),
        p = pointTriangle(a),
        q = pointTriangle(b),
        r = pointTriangle(c),
        area =
          Math.abs((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)) / 2;
      let type = "MUDANÇA DE SETOR";
      if (a === b && b === c) type = "REPETIÇÃO";
      else if (a === c) type = "RETORNO EXATO";
      else if (b === c) type = "REPETIÇÃO FINAL";
      else if (!s1) type = "SAÍDA DA REPETIÇÃO";
      else if (Math.sign(s1) === Math.sign(s2)) type = "CONTINUAÇÃO";
      else if (closure < Math.abs(s1)) type = "RETORNO PARCIAL";
      else type = "INVERSÃO COM AFASTAMENTO";
      const route = routeFeatures([a, b, c]);
      return {
        a,
        b,
        c,
        s1,
        s2,
        closure,
        area,
        type,
        route,
        trend: hopTrend(s1, s2),
        ratio: Math.abs(s1) ? Math.abs(s2) / Math.abs(s1) : null,
        contour: route.contour,
        labels: [type, ...route.labels],
        chords: [
          Math.hypot(p.x - q.x, p.y - q.y),
          Math.hypot(q.x - r.x, q.y - r.y),
          Math.hypot(p.x - r.x, p.y - r.y),
        ],
        angles: [
          angleTriangle(q, p, r),
          angleTriangle(p, q, r),
          angleTriangle(p, r, q),
        ],
        degenerate: area < 1e-10,
      };
    }

    function triangleContext(h) {
      if (h.length < 3) return "SEM TRINCA";
      const f = triangleFeatures(...h.slice(-3));
      return (
        f.type +
        "|F:" +
        nearBand(f.closure) +
        "|C:" +
        Number(f.contour) +
        "|S:" +
        Math.sign(f.route.net) +
        "|H:" +
        f.trend +
        "|L:" +
        lengthBand(f.route.length)
      );
    }

/* Memória causal do quarto resultado. Geometria simulada não é observação.
   O atlas enumera formas possíveis; distribuições usam SOMENTE sucessores vistos.
   Cada canal conta uma ocorrência uma vez. Canais não somam suas amostras.
   Sem suporte e avaliação cronológica favorável, a influência é exatamente zero. */
function createTriangleMemory666(wheel){
  const N=37, index=Array(N), names=[
    'TRINCA EXATA → QUARTO', 'FORMA GIRADA', 'FORMA REFLETIDA',
    'AMPLITUDE E PROPORÇÃO', 'ENCADEAMENTO 4–8', 'FECHAMENTO E CONTORNO',
    'ARCO → PRÓXIMO RESULTADO', 'POLOS → PRÓXIMO RESULTADO'
  ];
  wheel.forEach((n,i)=>{index[n]=i;});
  const mod=n=>(n%N+N)%N;
  const jump=(a,b)=>{const d=mod(b-a);return d<=18?d:d-N;};
  const dist=(a,b)=>Math.abs(jump(a,b));
  const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
  const cache=new Map(), forecasts=new Map();
  const keep=(map,key,value)=>{map.set(key,value);if(map.size>384)map.delete(map.keys().next().value);return value;};
  const points=Array.from({length:N},(_,i)=>[Math.sin(i*2*Math.PI/N),Math.cos(i*2*Math.PI/N)]);
  const chord=(a,b)=>Math.hypot(points[a][0]-points[b][0],points[a][1]-points[b][1]);
  const angle=(a,b,c)=>{
    const x=points[a][0]-points[b][0],y=points[a][1]-points[b][1];
    const u=points[c][0]-points[b][0],v=points[c][1]-points[b][1];
    const length=Math.hypot(x,y)*Math.hypot(u,v);
    return length<1e-12?null:Math.acos(Math.max(-1,Math.min(1,(x*u+y*v)/length)))*180/Math.PI;
  };
  // Fixar A na posição 0 elimina apenas rotações: 37² formas, todas as repetições inclusas.
  const atlas=Array.from({length:N*N},(_,id)=>{
    const b=Math.floor(id/N),c=id%N,s1=jump(0,b),s2=jump(b,c);
    const closure=dist(0,c),net=s1+s2;
    const area=Math.abs((points[b][0]-points[0][0])*(points[c][1]-points[0][1])-(points[b][1]-points[0][1])*(points[c][0]-points[0][0]))/2;
    const type=b===0&&c===0?'TRIPLA':c===0?'RETORNO':b===0?'REPETIÇÃO INICIAL':b===c?'REPETIÇÃO FINAL':Math.sign(s1)===Math.sign(s2)?'CONTINUIDADE':'INVERSÃO';
    return Object.freeze({s1,s2,closure,net,length:Math.abs(s1)+Math.abs(s2),
      trend:Math.sign(Math.abs(s2)-Math.abs(s1)),type,area,degenerate:area<1e-10,
      ratio:s1?Math.abs(s2/s1):null,
      contour:Math.sign(s1)===Math.sign(s2)&&s1!==0&&Math.abs(net)>=31&&closure<=6,
      chords:[chord(0,b),chord(b,c),chord(0,c)],angles:[angle(b,0,c),angle(0,b,c),angle(0,c,b)]});
  });
  const feature=(a,b,c)=>atlas[mod(b-a)*N+mod(c-a)];
  const kernels=Array.from({length:N},(_,center)=>{
    const values=Array.from({length:N},(_,j)=>Math.exp(-dist(center,j)/1.25));
    const total=values.reduce((s,v)=>s+v,0);return values.map(v=>v/total);
  });
  function arc(p,end){
    const start=Math.max(0,end-5);let best=null;
    for(let sector=0;sector<N;sector++){
      let count=0;for(let i=start;i<=end;i++)if(mod(p[i]-sector)<8)count++;
      if(!best||count>best.count)best={start:sector,count};
    }
    if(!best||best.count<3)return null;
    const inside=mod(p[end]-best.start)<8;
    return {...best,inside,total:end-start+1,offset:mod(p[end]-best.start)};
  }
  function poles(p,end){
    if(end<3)return null;
    const a=p[end-3],b=p[end-2],c=p[end-1],d=p[end];
    if(dist(a,b)<8||dist(a,c)>2||dist(b,d)>2)return null;
    const initial=dist(a,b),separation=dist(c,d);
    return {a,b,c,d,separation,movement:Math.sign(separation-initial)};
  }
  function raw(history){
    const h=history.slice(-70),key=h.join(',');if(cache.has(key))return cache.get(key);
    const p=h.map(n=>index[n]),end=p.length-1;
    const modes=names.map(name=>({name,support:0,occurrences:0,weights:Array(N).fill(6)}));
    if(end<2)return keep(cache,key,modes.map(m=>({...m,weights:Array(N).fill(1)})));
    const current=feature(p[end-2],p[end-1],p[end]);
    const currentArc=arc(p,end),currentPoles=poles(p,end);
    function add(k,weight,center,exact=false){
      if(weight<0.025)return;
      const mode=modes[k];mode.support+=weight;mode.occurrences++;
      if(exact)mode.weights[mod(center)]+=weight*N;
      else for(let j=0;j<N;j++)mode.weights[j]+=weight*N*kernels[mod(center)][j];
    }
    for(let old=2;old<end;old++){
      // old+1 is an observed successor and is never the unknown next spin.
      const f=feature(p[old-2],p[old-1],p[old]),next=p[old+1];
      const recency=Math.exp(-(end-old-1)/28),delta=jump(p[old],next);
      if(h[old-2]===h[end-2]&&h[old-1]===h[end-1]&&h[old]===h[end])add(0,recency,next,true);
      const shape=(f.type===current.type?1:0.2)*(f.trend===current.trend?1:0.4);
      const sameDiff=Math.abs(f.s1-current.s1)+Math.abs(f.s2-current.s2);
      if(sameDiff<=4)add(1,recency*Math.exp(-sameDiff/2)*shape,p[end]+delta);
      const reflectedDiff=Math.abs(f.s1+current.s1)+Math.abs(f.s2+current.s2);
      if(reflectedDiff<=4)add(2,recency*Math.exp(-reflectedDiff/2)*shape,p[end]-delta);
      const amplitudeDiff=Math.abs(Math.abs(f.s1)-Math.abs(current.s1))+Math.abs(Math.abs(f.s2)-Math.abs(current.s2));
      if(amplitudeDiff<=5&&f.trend===current.trend&&Math.abs(f.closure-current.closure)<=3){
        const sign=Math.sign(current.s2)*Math.sign(f.s2)||1;
        const ratio=f.ratio==null||current.ratio==null?1:Math.exp(-Math.abs(Math.log((f.ratio+0.1)/(current.ratio+0.1))));
        add(3,recency*Math.exp(-amplitudeDiff/3)*ratio,p[end]+delta*sign);
      }
      // One historical endpoint contributes once: choose its longest supported chain.
      let chain=null;
      for(let length=Math.min(8,old+1,end+1);length>=4;length--){
        let error=0,opposite=0;
        for(let k=0;k<length-1;k++){
          const a=jump(p[end-k-1],p[end-k]),b=jump(p[old-k-1],p[old-k]);
          error+=Math.abs(a-b);if(Math.sign(a)!==Math.sign(b))opposite++;
        }
        if(error/(length-1)<=2&&opposite<=1){chain={error:error/(length-1),length};break;}
      }
      if(chain)add(4,recency*Math.exp(-chain.error/2)*(chain.length-2)/6,p[end]+delta);
      if(current.closure<=6&&f.closure<=6&&current.contour===f.contour&&f.type===current.type&&f.trend===current.trend){
        const similarity=Math.exp(-Math.abs(current.closure-f.closure)/2-Math.abs(current.length-f.length)/8-Math.abs(current.area-f.area));
        add(5,recency*similarity,p[end-2]+jump(p[old-2],next));
      }
      const oldArc=currentArc?arc(p,old):null;
      if(oldArc&&oldArc.inside===currentArc.inside&&Math.abs(oldArc.count-currentArc.count)<=1&&Math.abs(oldArc.total-currentArc.total)<=1){
        const relative=dist(oldArc.offset,currentArc.offset);
        if(relative<=4)add(6,recency*Math.exp(-relative/2),currentArc.start+mod(next-oldArc.start));
      }
      const oldPoles=currentPoles?poles(p,old):null;
      if(oldPoles&&oldPoles.movement===currentPoles.movement&&Math.abs(oldPoles.separation-currentPoles.separation)<=3){
        add(7,recency*Math.exp(-Math.abs(oldPoles.separation-currentPoles.separation)/2),currentPoles.c+jump(oldPoles.c,next));
      }
    }
    for(const mode of modes){const average=mean(mode.weights);mode.weights=mode.weights.map(v=>v/average);}
    return keep(cache,key,modes);
  }
  function analyze(history,baseline){
    const h=history.slice(-70),key=h.join(',');if(forecasts.has(key))return forecasts.get(key);
    const current=raw(h),base=baseline(h),logs=names.map(()=>[]);
    // Rolling chronological validation. No actual result enters its own forecast.
    for(let t=Math.max(8,h.length-24);t<h.length;t++){
      const before=h.slice(0,t),past=raw(before),previous=baseline(before),outcome=index[h[t]];
      for(let k=0;k<names.length;k++){
        if(past[k].support<2||past[k].occurrences<3)continue;
        const comparison=previous[outcome],trial=0.85*comparison+0.15*past[k].weights[outcome];
        logs[k].push(Math.log(Math.max(1e-9,trial)/Math.max(1e-9,comparison)));
      }
    }
    const modes=current.map((model,k)=>{
      const values=logs[k],gain=mean(values),count=values.length;
      const variance=count>1?values.reduce((s,x)=>s+(x-gain)**2,0)/(count-1):0;
      const stderr=count?Math.sqrt(variance/count):0;
      const recentGain=mean(values.slice(-4));
      const active=count>=8&&model.occurrences>=3&&model.support>=2&&gain>stderr&&recentGain>0;
      const mass=active?Math.min(0.2,(gain-stderr)*5)*count/(count+16)*Math.min(1,model.support/8):0;
      return {...model,evaluations:count,meanLogGain:gain,stderr,recentGain,active,mass};
    });
    const totalMass=modes.reduce((s,m)=>s+m.mass,0),influence=Math.min(0.2,totalMass);
    const weights=totalMass?base.map((v,j)=>v*(1-influence)+influence*modes.reduce((s,m)=>s+m.weights[j]*m.mass,0)/totalMass):[...base];
    return keep(forecasts,key,{weights,modes,influence,observedSuccessors:Math.max(0,h.length-3),
      status:influence?'ATIVA EM TESTE CRONOLÓGICO':'SEM SUPORTE FAVORÁVEL — BASE PRESERVADA'});
  }
  return {raw,analyze,feature,atlas,names,clear(){cache.clear();forecasts.clear();}};
}


    /* Leitura estrutural ativa. Enumera os 37 próximos resultados e seus estados.
   Uma alternativa possível não é uma previsão confirmada. Somente sucessores
   já observados atribuem peso. Leitura e escolha permanecem separadas. */
function createMotorReadings667(wheel, atlas) {
  const size = 37;
  const positions = Array(size);
  wheel.forEach((number, index) => { positions[number] = index; });
  const mod = value => (value % size + size) % size;
  const jump = (from, to) => {
    const forward = mod(to - from);
    return forward <= 18 ? forward : forward - size;
  };
  const distance = (from, to) => Math.abs(jump(from, to));
  const average = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const band = value => value === 0 ? '0' : value <= 2 ? '1–2' : value <= 6 ? '3–6' : value <= 12 ? '7–12' : '13+';
  const amplitudeBand = value => value <= 3 ? 'CURTO' : value <= 9 ? 'MÉDIO' : 'LONGO';
  const normalize = values => {
    const mean = average(values) || 1;
    return values.map(value => value / mean);
  };
  const cache = new Map();
  const groups = ['TRIANGULAÇÃO', 'AMPLITUDE', 'ENCADEAMENTO', 'FECHAMENTO/PERCURSO', 'POLOS', 'ARCOS'];
  const profiles = [
    [1, 1, 1, 1, 1, 1],
    [1.2, 1.8, 1.5, 1, .6, .6],
    [.8, .7, .8, 1.3, 1.1, 1.7],
    [.8, 1.1, 2, 2, .6, .6],
    [2.3, 1.2, 1.6, 1.8, .5, .5],
    [.6, .6, .7, .8, 2.4, 2.1],
    [1.4, .8, .9, 2, 1.7, .6],
    [.8, 2.2, 1.4, 1.5, .6, 1.3]
  ];

  /* Atlas completo: nenhum corte por ranking, frequência ou classe.
     ID = posição relativa de B * 37 + posição relativa de C, com A = 0.
     Cada registro guarda atributos exatos; somente o passado fornece sucessores. */
  const relativeForms = Array.from({ length: 1369 }, (_, id) => {
    const b = Math.floor(id / 37), c = id % 37;
    const shape = atlas.feature(0, b, c);
    return Object.freeze({ ...shape, id, positions: Object.freeze([0, b, c]),
      amplitudes: Object.freeze([Math.abs(shape.s1), Math.abs(shape.s2)]),
      amplitudeId: Math.abs(shape.s1) * 19 + Math.abs(shape.s2),
      amplitudeChange: Math.abs(shape.s2) - Math.abs(shape.s1),
      perimeter: shape.chords.reduce((sum, value) => sum + value, 0),
      partialReturn: c !== 0 && shape.s1 * shape.s2 < 0 && shape.closure < Math.abs(shape.s1),
      signedResidual: shape.net - Math.round(shape.net / 37) * 37,
      algebraicTurns: shape.net / 37,
      chords: Object.freeze([...shape.chords]), angles: Object.freeze([...shape.angles])
    });
  });
  const amplitudeForms = Array.from({ length: 361 }, (_, id) => {
    const first = Math.floor(id / 19), second = id % 19;
    return Object.freeze({ id, first, second, difference: second - first,
      ratio: first === 0 ? null : second / first,
      trend: second < first ? 'CONTRAÇÃO' : second > first ? 'EXPANSÃO' : 'MANUTENÇÃO' });
  });
  const formId = (a, b, c) => mod(b - a) * 37 + mod(c - a);
  const kernelCache = new Map();

  function fullKernels(currentId) {
    if (kernelCache.has(currentId)) return kernelCache.get(currentId);
    const current = relativeForms[currentId];
    const geometry = new Float64Array(1369);
    const closure = new Float64Array(1369);
    const amplitude = new Float64Array(361);
    for (const old of relativeForms) {
      // Todos os 1.369 registros são avaliados, sem faixas arredondadas.
      const steps = (Math.abs(current.s1 - old.s1) + Math.abs(current.s2 - old.s2)) / 12;
      const chords = current.chords.reduce((sum, value, i) => sum + Math.abs(value - old.chords[i]), 0) / 3;
      const angles = current.angles.reduce((sum, value, i) => {
        const other = old.angles[i];
        return sum + (value == null || other == null ? Number(value !== other) : Math.abs(value - other) / 180);
      }, 0) / 3;
      const area = Math.abs(current.area - old.area);
      const ratio = current.ratio == null || old.ratio == null
        ? Number(current.ratio !== old.ratio)
        : Math.abs(Math.atan(current.ratio) - Math.atan(old.ratio));
      const attributes = Math.abs(current.closure - old.closure) / 18 +
        Math.abs(current.amplitudeChange - old.amplitudeChange) / 36 + ratio +
        Number(current.partialReturn !== old.partialReturn) + Number(current.degenerate !== old.degenerate);
      geometry[old.id] = Math.exp(-steps - chords - angles - area - attributes) + (old.id === currentId ? 4 : 0);
      closure[old.id] = Math.exp(-Math.abs(current.closure - old.closure) / 4 -
        Math.abs(current.net - old.net) / 12 - Math.abs(current.length - old.length) / 12 -
        Number(current.contour !== old.contour));
    }
    for (const old of amplitudeForms) {
      amplitude[old.id] = Math.exp(-(Math.abs(current.amplitudes[0] - old.first) +
        Math.abs(current.amplitudes[1] - old.second)) / 5 -
        Math.abs(current.amplitudeChange - old.difference) / 8) +
        (old.id === current.amplitudeId ? 3 : 0);
    }
    const result = { geometry, closure, amplitude };
    kernelCache.set(currentId, result);
    if (kernelCache.size > 32) kernelCache.delete(kernelCache.keys().next().value);
    return result;
  }

  function exhaustiveRead(prefix) {
    const formCounts = new Uint16Array(1369);
    const amplitudeCounts = new Uint16Array(361);
    const observed = new Map();
    // A trinca corrente ainda não tem sucessor e não pode treiná-lo.
    for (let end = 2; end < prefix.length - 1; end++) {
      const id = formId(prefix[end - 2], prefix[end - 1], prefix[end]);
      const shape = relativeForms[id];
      const nextStep = jump(prefix[end], prefix[end + 1]);
      const mass = Math.exp(-(prefix.length - 2 - end) / 28);
      formCounts[id]++;
      amplitudeCounts[shape.amplitudeId]++;
      let record = observed.get(id);
      if (!record) {
        record = { id, count: 0, mass: 0, successors: new Map() };
        observed.set(id, record);
      }
      record.count++;
      record.mass += mass;
      const next = record.successors.get(nextStep) || { step: nextStep, count: 0, mass: 0 };
      next.count++;
      next.mass += mass;
      record.successors.set(nextStep, next);
    }
    const currentId = prefix.length >= 3 ? formId(...prefix.slice(-3)) : null;
    const groups = [0, 1, 3].map(group => ({ name: ['TRIANGULAÇÃO', 'AMPLITUDE', '', 'FECHAMENTO/PERCURSO'][group],
      group, support: 0, modes: group === 1 ? 361 : 1369, weights: Array(37).fill(8) }));
    if (currentId != null) {
      const kernels = fullKernels(currentId);
      const anchor = prefix.at(-1);
      // Percorre explicitamente o atlas inteiro. Sem ocorrência, contribuição
      // observada é zero; o registro continua disponível, sem inventar evidência.
      for (let id = 0; id < 1369; id++) {
        const shape = relativeForms[id], record = observed.get(id);
        if (!record) continue;
        const coefficients = [kernels.geometry[id], kernels.amplitude[shape.amplitudeId], kernels.closure[id]];
        groups.forEach((group, index) => {
          const coefficient = coefficients[index];
          group.support += coefficient * record.mass;
          for (const successor of record.successors.values()) {
            const target = mod(anchor + successor.step);
            const contribution = coefficient * successor.mass * 37;
            group.weights[target] += contribution * .7;
            group.weights[mod(target - 1)] += contribution * .15;
            group.weights[mod(target + 1)] += contribution * .15;
          }
        });
      }
    }
    groups.forEach(group => { group.weights = normalize(group.weights); });
    return { currentId, formsEvaluated: currentId == null ? 0 : 1369,
      amplitudesEvaluated: currentId == null ? 0 : 361,
      representedForms: 1369, representedAmplitudes: 361,
      numericTriples: 50653, formCounts, amplitudeCounts,
      observedForms: observed.size, successorSamples: Math.max(0, prefix.length - 3),
      observed: [...observed.values()].map(record => ({ ...record, successors: [...record.successors.values()] })), groups };
  }

  function catalogue(history, id = null) {
    const reading = read(history), data = reading.exhaustive;
    const describe = form => ({ ...form, occurrences: data.formCounts[form.id],
      successors: data.observed.find(record => record.id === form.id)?.successors || [],
      status: data.formCounts[form.id] ? 'OBSERVADA COM SUCESSOR' : 'REPRESENTADA SEM SUCESSOR OBSERVADO' });
    if (id != null) return Number.isInteger(id) && id >= 0 && id < 1369 ? describe(relativeForms[id]) : null;
    return relativeForms.map(describe);
  }

  // Capacidade finita explícita: qualquer sequência de até 70 resultados pode
  // ser descrita. Apenas sequências anteriores com sucessor treinam os pesos.
  const polePairs = Object.freeze(Array.from({length:1369},(_,id)=>{
    const a=Math.floor(id/37),b=id%37;
    return Object.freeze({id,positionA:a,positionB:b,numberA:wheel[a],numberB:wheel[b],
      separation:distance(a,b),direction:jump(a,b)});
  }));

  function polePairReading(prefix,next,a,b,tolerance){
    if(![a,b,next,tolerance].every(Number.isInteger)||a<0||a>36||b<0||b>36||next<0||next>36||tolerance<0||tolerance>18)return null;
    const da=distance(a,next),db=distance(b,next),insideA=da<=tolerance,insideB=db<=tolerance;
    const last=prefix.at(-1),previous=prefix.length>1?prefix.at(-2):null;
    const side=n=>n==null?-1:distance(a,n)>tolerance&&distance(b,n)>tolerance?-1:distance(a,n)<distance(b,n)?0:distance(a,n)>distance(b,n)?1:2;
    const currentSide=side(next),lastSide=side(last),priorSide=side(previous);
    let event=currentSide<0?'FORA DOS POLOS':currentSide===2?'SOBREPOSIÇÃO DOS POLOS':lastSide<0?'RETOMADA':lastSide===currentSide?'PERMANÊNCIA':'ALTERNÂNCIA';
    if(currentSide<0&&lastSide>=0)event='SAÍDA DOS POLOS';
    if(currentSide<0&&lastSide<0&&priorSide>=0)event='RUPTURA';
    if(a===b&&currentSide>=0)event='POLO ÚNICO / CONCENTRAÇÃO';
    const oldSeparation=distance(a,b);
    const newSeparation=currentSide===0?distance(next,b):currentSide===1?distance(a,next):oldSeparation;
    const movement=Math.sign(newSeparation-oldSeparation);
    if(currentSide>=0&&currentSide<2&&oldSeparation>0&&newSeparation===0)event='FUSÃO';
    else if(event==='ALTERNÂNCIA'&&movement<0)event='CONVERGÊNCIA';
    else if(event==='ALTERNÂNCIA'&&movement>0)event='DIVERGÊNCIA';
    return {tolerance,positionA:a,positionB:b,numberA:wheel[a],numberB:wheel[b],
      separation:oldSeparation,nextSeparation:newSeparation,movement,distanceA:da,distanceB:db,
      insideA,insideB,overlap:insideA&&insideB,side:currentSide,event,
      shiftA:currentSide===0?jump(a,next):0,shiftB:currentSide===1?jump(b,next):0};
  }

  function poleWindowWeights(prefix){
    const weights=Array(37).fill(8),tolerances=Array.from({length:19},(_,t)=>({tolerance:t,support:0}));
    if(prefix.length<4)return {name:'POLOS',weights:normalize(weights),support:0,tolerances,pairPositions:1369,separations:19};
    const current=prefix.slice(-4),[a,b,c,d]=current;
    const features=q=>({initial:distance(q[0],q[1]),final:distance(q[2],q[3]),
      shiftA:jump(q[0],q[2]),shiftB:jump(q[1],q[3]),span:jump(q[0],q[1])});
    const now=features(current);let support=0,samples=0;
    for(let end=3;end<prefix.length-1;end++){
      const q=prefix.slice(end-3,end+1),old=features(q);
      const geometry=Math.exp(-Math.abs(now.initial-old.initial)/6-Math.abs(now.final-old.final)/6-
        Math.abs(now.shiftA-old.shiftA)/8-Math.abs(now.shiftB-old.shiftB)/8-Math.abs(now.span-old.span)/10);
      let coefficient=0;
      for(let t=0;t<=18;t++){
        const activeNow=Math.abs(now.shiftA)<=t&&Math.abs(now.shiftB)<=t;
        const activeOld=Math.abs(old.shiftA)<=t&&Math.abs(old.shiftB)<=t;
        // 0..18 são examinados; sobreposição é explícita e não são 19 ensaios independentes.
        const overlapNow=now.final<=2*t,overlapOld=old.final<=2*t;
        const similarity=geometry*(activeNow===activeOld?1:.25)*(overlapNow===overlapOld?1:.5);
        tolerances[t].support+=similarity;
        coefficient+=similarity/19;
      }
      const mass=coefficient*Math.exp(-(prefix.length-2-end)/28);
      const next=mod(c+jump(q[2],prefix[end+1]));
      weights[next]+=mass*37*.7;weights[mod(next-1)]+=mass*37*.15;weights[mod(next+1)]+=mass*37*.15;
      support+=mass;samples++;
    }
    return {name:'POLOS',weights:normalize(weights),support,tolerances,pairPositions:1369,separations:19,samples,
      current:{...now,numbers:current.map(p=>wheel[p]),movement:Math.sign(now.final-now.initial)}};
  }

  // Todas as janelas 1..N, todos os 37 inícios, larguras 1..36.
  // Largura 37 também é representada, mas é neutra: contém a roda inteira.
  function arcWindowWeights(prefix){
    const length=prefix.length,weights=Array(37).fill(8),tables=[];
    const windows=Array.from({length},(_,i)=>i+1);
    if(!length)return {name:'ARCOS',weights,support:0,windows,sectorCases:1369,uniqueCovers:1333};
    const eventTables=[],runTables=[];
    const previousFlags=new Uint8Array(1369),runs=new Uint8Array(1369),seen=new Uint8Array(1369);
    for(let end=0;end<length;end++){
      const table=new Uint8Array((end+1)*1369),frequency=new Uint8Array(37);
      for(let window=1;window<=end+1;window++){
        frequency[prefix[end-window+1]]++;
        const offset=(window-1)*1369;
        for(let start=0;start<37;start++){
          let count=0;
          for(let width=1;width<=37;width++){
            count+=frequency[mod(start+width-1)];
            table[offset+(width-1)*37+start]=count;
          }
        }
      }
      tables.push(table);
      const events=new Uint8Array(1369),runSnapshot=new Uint8Array(1369);
      for(let width=1;width<=37;width++)for(let start=0;start<37;start++){
        const id=(width-1)*37+start,inside=Number(mod(prefix[end]-start)<width);
        // 0=fora,1=entrada,2=permanência,3=saída,4=reentrada.
        events[id]=inside?(end&&previousFlags[id]?2:seen[id]?4:1):(end&&previousFlags[id]?3:0);
        runs[id]=end&&previousFlags[id]===inside?runs[id]+1:1;
        runSnapshot[id]=runs[id];previousFlags[id]=inside;if(inside)seen[id]=1;
      }
      eventTables.push(events);runTables.push(runSnapshot);
    }
    const current=tables.at(-1),currentEvents=eventTables.at(-1),currentRuns=runTables.at(-1);
    let support=0,comparisons=0;
    for(let end=0;end<length-1;end++){
      let coefficient=0,windowCount=end+1;
      for(let window=1;window<=windowCount;window++){
        let sum=0;const offset=(window-1)*1369;
        // Cada leitura espacial participa uma vez; sem somar como acertos.
        for(let id=0;id<1332;id++){
          const delta=Math.abs(current[offset+id]-tables[end][offset+id]);
          const density=1/(1+delta/window);
          const transition=currentEvents[id]===eventTables[end][id]?1:.35;
          const duration=1/(1+Math.abs(currentRuns[id]-runTables[end][id])/window);
          sum+=density*transition*duration;
        }
        coefficient+=sum/1332;comparisons+=1332;
      }
      const mass=coefficient/windowCount*Math.exp(-(length-2-end)/28);
      const next=prefix[end+1];
      weights[next]+=mass*37*.7;weights[mod(next-1)]+=mass*37*.15;weights[mod(next+1)]+=mass*37*.15;
      support+=mass;
    }
    return {name:'ARCOS',weights:normalize(weights),support,windows,sectorCases:1369,
      uniqueCovers:1333,comparisons,representedWindowSectorCases:length*1369};
  }

  function poleStep(previous, prefix, next, tolerance) {
    const state = previous ? {
      ...previous,
      anchors: previous.anchors ? [...previous.anchors] : null,
      drift: previous.drift ? [...previous.drift] : [0, 0]
    } : { active: false, anchors: null, drift: [0, 0], outside: 0, age: 0, event: 'SEM FORMAÇÃO' };
    state.age++;
    state.inactiveAge = state.active || state.concentration != null ? 0 : (state.inactiveAge || 0) + 1;
    if (state.anchors && (state.active || (state.event === 'RUPTURA' && state.outside <= 3))) {
      const oldDistance = distance(...state.anchors);
      const expected = 1 - state.lastSide;
      const de = distance(next, state.anchors[expected]);
      const ds = distance(next, state.anchors[state.lastSide]);
      if (de <= tolerance && de <= ds) {
        const resumed = !state.active || state.outside > 0 || state.event === 'INTERRUPÇÃO';
        state.drift[expected] += jump(state.anchors[expected], next);
        state.anchors[expected] = next;
        state.lastSide = expected;
        state.outside = 0;
        state.active = true;
        state.event = resumed ? 'RETOMADA' : 'ALTERNÂNCIA';
      } else if (state.active && ds <= tolerance) {
        state.drift[state.lastSide] += jump(state.anchors[state.lastSide], next);
        state.anchors[state.lastSide] = next;
        state.outside = 0;
        state.event = 'INTERRUPÇÃO';
      } else {
        state.outside++;
        state.event = state.outside >= 2 ? 'RUPTURA' : 'SAÍDA';
        if (state.outside >= 2) state.active = false;
      }
      state.separation = distance(...state.anchors);
      state.movement = Math.sign(state.separation - oldDistance);
      if (state.active && state.separation <= Math.max(2, tolerance)) {
        state.active = false;
        state.event = 'FUSÃO';
        state.concentration = next;
        state.fromFusion = true;
        state.concentrationOutside = 0;
      } else if (state.active && state.event === 'ALTERNÂNCIA') {
        if (state.movement < 0) state.event = 'CONVERGÊNCIA';
        if (state.movement > 0) state.event = 'DIVERGÊNCIA';
        if (!state.movement) state.event = 'MANUTENÇÃO';
      }
    } else if (state.concentration != null) {
      if (distance(next, state.concentration) <= Math.max(2, tolerance)) {
        state.concentration = next;
        state.fromFusion = true;
        state.concentrationOutside = 0;
        state.event = 'CONCENTRAÇÃO APÓS FUSÃO';
      } else {
        state.concentrationOutside++;
        state.event = state.concentrationOutside >= 2 ? 'DISPERSÃO APÓS FUSÃO' : 'SAÍDA APÓS FUSÃO';
        if (state.concentrationOutside >= 2) state.concentration = null;
      }
    }
    if (!state.active && prefix.length >= 3 && state.event !== 'FUSÃO') {
      const [a, b, c] = prefix.slice(-3);
      if (distance(a, b) >= (tolerance<=8?Math.max(8,2*tolerance+2):0) &&
          distance(a, c) <= tolerance && distance(b, next) <= tolerance) {
        const split = state.concentration != null || state.fromFusion;
        state.anchors = [c, next];
        state.drift = [jump(a, c), jump(b, next)];
        state.lastSide = 1;
        state.separation = distance(c, next);
        state.movement = Math.sign(state.separation - distance(a, b));
        state.outside = 0;
        state.active = true;
        state.concentration = null;
        state.event = tolerance>8&&distance(c,next)<=2*tolerance?'SOBREPOSIÇÃO DOS POLOS':split ? 'NOVOS POLOS APÓS FUSÃO' : 'FORMAÇÃO';
      }
    }
    if(state.active)state.inactiveAge=0;
    if(!state.active&&state.concentration==null&&state.inactiveAge>3){state.anchors=null;state.event='ENCERRADO';}
    return state;
  }

  function chooseArc(previous, prefix, width) {
    if (prefix.length < 4 || width === 37) return { width, start: null, event: 'SEM CONCENTRAÇÃO', outside: 0, inside: 0 };
    const sample = prefix.slice(-8);
    const counts = Array(size).fill(0);
    for (const position of sample) counts[position]++;
    let total = 0;
    for (let j = 0; j < width; j++) total += counts[j];
    let best = { start: 0, count: total };
    for (let start = 1; start < size; start++) {
      total += counts[mod(start + width - 1)] - counts[start - 1];
      if (total > best.count) best = { start, count: total };
    }
    const minimum = Math.max(2, Math.ceil(sample.length * width / size + 1));
    const state = previous ? { ...previous } : { width, start: null, outside: 0, inside: 0, weak: 0 };
    if (state.start != null) {
      const count = sample.filter(position => mod(position - state.start) < width).length;
      state.weak = count < minimum ? (state.weak || 0) + 1 : 0;
      if (best.count >= minimum && best.start !== state.start && best.count >= count + 2) {
        state.start = best.start;
        state.event = 'SUBSTITUIÇÃO';
        state.outside = 0;
        state.inside = 0;
        state.lastInside = null;
      } else if (state.weak >= 2 || (state.outside >= 8 && count < minimum)) {
        state.start = null;
        state.event = 'ENCERRAMENTO';
      } else if (!state.weak && previous?.weak) state.event = 'RETOMADA DO ARCO';
      else if (state.weak) state.event = 'ENFRAQUECIMENTO';
    } else if (best.count >= minimum) {
      state.start = best.start;
      state.event = 'FORMAÇÃO';
      state.outside = 0;
      state.inside = 0;
      state.lastInside = null;
      state.weak = 0;
    } else state.event = state.event === 'ENCERRAMENTO' ? 'ENCERRAMENTO' : 'SEM CONCENTRAÇÃO';
    state.width = width;
    state.count = state.start == null ? 0 : sample.filter(position => mod(position - state.start) < width).length;
    return state;
  }

  function consumeArc(prepared, next) {
    const state = { ...prepared };
    if (state.start == null) return state;
    const inside = mod(next - state.start) < state.width;
    const transition = inside ? state.lastInside === true ? 'PERMANÊNCIA' : state.outside > 0 ? 'REENTRADA' : 'ENTRADA'
                             : state.lastInside === true ? 'SAÍDA' : 'AFASTAMENTO';
    state.transition = transition;
    if (!['SUBSTITUIÇÃO', 'FORMAÇÃO', 'ENFRAQUECIMENTO', 'RETOMADA DO ARCO'].includes(state.event)) state.event = transition;
    state.inside = inside ? state.inside + 1 : 0;
    state.outside = inside ? 0 : state.outside + 1;
    state.lastInside = inside;
    return state;
  }


  // Todos os setores fixos são lidos, inclusive quando não são o arco eleito.
  // Chaves compactas evitam armazenar 1.369 objetos em cada prefixo histórico.
  function fixedArcKeys(prefix) {
    const keys = new Uint16Array(37 * 37);
    const recent = prefix.slice(-8);
    for (let width = 1; width <= 37; width++) {
      for (let start = 0; start < 37; start++) {
        const flags = recent.map(position => mod(position - start) < width);
        const count = flags.filter(Boolean).length;
        let run = 0;
        const inside = flags.at(-1) || false;
        for (let k = flags.length - 1; k >= 0 && flags[k] === inside && run < 4; k--) run++;
        keys[(width - 1) * 37 + start] = count * 10 + Number(inside) * 5 + run;
      }
    }
    return keys;
  }

  function arcAlternative(history, number, start, width, window=8) {
    if (!Number.isInteger(start) || start < 0 || start > 36 || !Number.isInteger(width) || width < 1 || width > 37) return null;
    const prefix = history.slice(-70).map(number => positions[number]);
    const priorInside = prefix.length ? mod(prefix.at(-1) - start) < width : null;
    const inside = mod(positions[number] - start) < width;
    const visited = prefix.some(position => mod(position - start) < width);
    const event = inside ? priorInside === true ? 'PERMANÊNCIA' : visited ? 'REENTRADA' : 'ENTRADA'
                         : priorInside === true ? 'SAÍDA' : 'AFASTAMENTO';
    const sample = prefix.slice(-Math.max(1,Math.min(70,Math.trunc(window)||8)));
    const visits = sample.filter(position => mod(position - start) < width).length;
    return { start, startNumber: wheel[start], width, number, inside, event, visits, sample: sample.length };
  }

  function makeFrame(prefix, poles, arcs, captureModes = true) {
    const end = prefix.length - 1;
    if (end < 2) return { modes: [], poles, arcs, triangle: null, chains: [] };
    const a = prefix[end - 2], b = prefix[end - 1], c = prefix[end];
    const shape = atlas.feature(a, b, c);
    const f = { ...shape,
      partialReturn: a!==c && shape.s1*shape.s2<0 && shape.closure<Math.abs(shape.s1),
      perimeter: shape.chords.reduce((sum,value)=>sum+value,0),
      amplitudeChange: Math.abs(shape.s2)-Math.abs(shape.s1),
      abruptAmplitude: Math.abs(Math.abs(shape.s2)-Math.abs(shape.s1))>=10,
      amplitudeAlternation: (Math.abs(shape.s1)<=3&&Math.abs(shape.s2)>=10)||(Math.abs(shape.s2)<=3&&Math.abs(shape.s1)>=10),
      signedResidual: shape.net-Math.round(shape.net/37)*37,
      algebraicTurns: shape.net/37
    };
    const modes = [];
    function mode(id, group, key, anchor = c, orientation = 1) {
      if(captureModes)modes.push({ id, group, key, anchor, orientation });
    }
    const chains = [];
    for (let length = 4; length <= Math.min(70, prefix.length); length++) {
      const chain = prefix.slice(-length);
      const steps = chain.slice(1).map((position, i) => jump(chain[i], position));
      const net = steps.reduce((sum, value) => sum + value, 0);
      const absolute = steps.reduce((sum, value) => sum + Math.abs(value), 0);
      const closure = distance(chain[0], c);
      const trends = steps.slice(1).map((value, i) => Math.sign(Math.abs(value) - Math.abs(steps[i])));
      mode('CADEIA NUMÉRICA '+length,2,chain.join(','),null);
      mode('CADEIA EXATA ' + length, 2, steps.join(','));
      const reflected=steps.map(value=>-value).join(',');
      const ordered=steps.join(',');
      mode('CADEIA REFLETIDA '+length,2,ordered<reflected?ordered:reflected,c,ordered<reflected?1:-1);
      mode('CADEIA AMPLITUDES '+length,2,steps.map(Math.abs).join(','));
      mode('CADEIA DIREÇÃO/AMPLITUDE ' + length, 2, steps.map(value => Math.sign(value) + ':' + amplitudeBand(Math.abs(value))).join(','));
      mode('PERCURSO/RETORNO ' + length, 3, [Math.sign(net), Math.floor(Math.abs(net) / 6), Math.floor(absolute / 10), band(closure), trends.join(',')].join('|'), chain[0]);
      chains.push({ length, steps, net, absolute, closure, turns: net / 37, residual: mod(net), trends,
        interruption: steps.length>=3&&Math.sign(steps.at(-2))===Math.sign(steps.at(-3))&&Math.sign(steps.at(-1))!==Math.sign(steps.at(-2)),
        resumption: steps.length>=3&&steps.at(-1)===steps.at(-3)&&steps.at(-1)!==steps.at(-2),
        directionChanges: steps.slice(1).filter((value,index)=>Math.sign(value)!==Math.sign(steps[index])).length
      });
    }
    for (let tolerance = 0; tolerance <= 18; tolerance++) {
      const state = poles[tolerance];
      const relevant = state.anchors && (state.active || state.outside <= 3 || state.concentration != null);
      const key = relevant ? [state.event, band(state.separation || 0), state.movement || 0, Math.min(3, state.outside), state.drift.map(Math.sign).join(',')].join('|') : null;
      const anchor = state.concentration != null ? state.concentration : state.anchors ? state.anchors[1 - state.lastSide] : c;
      mode('POLOS TOLERÂNCIA ' + tolerance, 4, key, anchor);
    }
    for (let width = 1; width <= 37; width++) {
      const state = arcs[width - 1];
      const key = state.start == null ? null : [state.event, state.transition, state.count, Math.min(4, state.outside), Math.min(4, state.inside)].join('|');
      mode('ARCO ' + width, 5, key, state.start == null ? c : state.start);
    }
    if(captureModes)for(let width=1;width<=37;width++){
      mode('ARCO TODOS OS SETORES '+width,5,width===37?null:'TODOS OS SETORES');
      modes.at(-1).fixedWidth=width;
    }
    return { modes, poles, arcs, triangle: f, chains, fixedKeys: captureModes ? fixedArcKeys(prefix) : null };
  }

  function read(history) {
    const h = history.slice(-70);
    const key = h.join(',');
    if (cache.has(key)) return cache.get(key);
    const prefix = [];
    let poles = Array.from({ length: 19 }, () => null);
    let arcs = Array.from({ length: 37 }, () => null);
    const frames = [];
    for (const number of h) {
      const next = positions[number];
      const prepared = arcs.map((state, index) => chooseArc(state, prefix, index + 1));
      poles = poles.map((state, tolerance) => poleStep(state, prefix, next, tolerance));
      arcs = prepared.map(state => consumeArc(state, next));
      prefix.push(next);
      frames.push(makeFrame(prefix, poles, arcs));
    }
    const current = frames.at(-1) || { modes: [], poles, arcs, triangle: null, chains: [] };
    const modes = current.modes.map(mode => ({ ...mode, support: 0, occurrences: 0, weights: Array(size).fill(16), outcomes: Array(size).fill(0), outcomeIndices: Array.from({length:size},()=>[]) }));
    for (let end = 2; end < h.length - 1; end++) {
      const previous = frames[end];
      const next = positions[h[end + 1]];
      const mass = Math.exp(-(h.length - 2 - end) / 28);
      const previousModes = new Map(previous.modes.map(mode => [mode.id, mode]));
      for (const mode of modes) {
        const old = previousModes.get(mode.id);
        if (mode.fixedWidth || mode.key == null || !old || old.key !== mode.key) continue;
        mode.support += mass;
        mode.occurrences++;
        const center = mode.anchor == null ? next : mod(mode.anchor + jump(old.anchor, next) * mode.orientation * old.orientation);
        mode.outcomes[center]++;
        mode.outcomeIndices[center].push(end);
        mode.weights[center] += mass * size * .7;
        mode.weights[mod(center - 1)] += mass * size * .15;
        mode.weights[mod(center + 1)] += mass * size * .15;
      }
    }
    for(const mode of modes.filter(mode=>mode.fixedWidth&&mode.fixedWidth<37)){
      const indices=new Set();
      for(let start=0;start<37;start++){
        const index=(mode.fixedWidth-1)*37+start;
        for(let end=2;end<h.length-1;end++){
          if(frames[end].fixedKeys[index]!==current.fixedKeys[index])continue;
          const mass=Math.exp(-(h.length-2-end)/33)/37;
          const center=positions[h[end+1]];
          mode.support+=mass;indices.add(end);
          mode.outcomeIndices[center].push(end);mode.outcomes[center]++;
          mode.weights[center]+=mass*37*.7;
          mode.weights[mod(center-1)]+=mass*37*.15;
          mode.weights[mod(center+1)]+=mass*37*.15;
        }
      }
      mode.occurrences=indices.size;
    }
    for (const mode of modes) mode.weights = normalize(mode.weights);
    const exhaustive = exhaustiveRead(prefix);
    const summaries = groups.map((name, group) => {
      const members = modes.filter(mode => mode.group === group && mode.support > 0);
      const support = Math.max(0, ...members.map(mode => mode.support));
      const weights = members.length ? normalize(Array.from({ length: size }, (_, j) => average(members.map(mode => mode.weights[j])))) : Array(size).fill(1);
      return { name, support, modes: members.length, weights };
    });
    for(const complete of exhaustive.groups){
      if(complete.group===3){
        const legacy=summaries[3];
        summaries[3]={...complete,weights:normalize(complete.weights.map((value,j)=>(value+legacy.weights[j])/2)),support:Math.max(complete.support,legacy.support)};
      }else summaries[complete.group]=complete;
    }
    const completePoles=poleWindowWeights(prefix),completeArcs=arcWindowWeights(prefix);
    for(const [group,complete] of [[4,completePoles],[5,completeArcs]]){
      const previous=summaries[group];
      summaries[group]={name:previous.name,support:Math.max(previous.support,complete.support),modes:previous.modes,
        weights:normalize(previous.weights.map((value,j)=>(value+complete.weights[j])/2))};
    }
    const preparedArcs = arcs.map((state, index) => chooseArc(state, prefix, index + 1));
    const candidateCache=new Map();
    function describeCandidate(number){
      if(candidateCache.has(number))return candidateCache.get(number);
      const position=positions[number];if(position==null)return null;
      const futurePoles = poles.map((state, tolerance) => poleStep(state, prefix, position, tolerance));
      const futureArcs = preparedArcs.map(state => consumeArc(state, position));
      const future = makeFrame([...prefix, position], futurePoles, futureArcs, false);
      const last = current.triangle;
      const description = { number, position, triangle: future.triangle,
        triangleTransition: last && future.triangle ? { areaChange: Math.sign(future.triangle.area - last.area), closureChange: Math.sign(future.triangle.closure - last.closure), turn: Math.sign(future.triangle.s2), ratio: future.triangle.ratio } : null,
        chains: future.chains,
        poleEvents: futurePoles.map((state, tolerance) => ({ tolerance, event: state.event, movement: state.movement || 0, separation: state.separation == null ? null : state.separation, anchors: state.anchors ? state.anchors.map(p => wheel[p]) : [] })),
        arcEvents: futureArcs.map(state => ({ width: state.width, event: state.event, transition: state.transition || null, start: state.start, outside: state.outside, inside: state.inside })),
        allArcStartsRead: true, arcSectorCases: 1369,
        historicalSupport: new Set(modes.flatMap(mode => mode.outcomeIndices[position])).size,
        supportingChannels: modes.filter(mode => mode.outcomes[position] > 0).length
      };
      candidateCache.set(number,description);return description;
    }
    const result = { version: '6.6.36', prefix: h, get candidates(){return wheel.map(describeCandidate);},candidate:describeCandidate,modes, groups: summaries, exhaustive, completePoles,completeArcs,
      candidateCount:37, channelCount: modes.length, arcSectorCases:1369,chainLengths:Array.from({length:Math.max(0,h.length-3)},(_,i)=>i+4),
      interpretationCount:37 * modes.length,
      status: 'LEITURA ATIVA — HIPÓTESES NÃO SÃO ACERTOS' };
    result.profileCache = new Map();
    cache.set(key, result);
    if (cache.size > 4) cache.delete(cache.keys().next().value);
    return result;
  }

  function weights(history, profile = {}) {
    const reading = read(history);
    const cacheKey = [profile.family || '', profile.radius || '', profile.variation || ''].join('|');
    if (reading.profileCache.has(cacheKey)) return reading.profileCache.get(cacheKey);
    const shares = [...(profiles[profile.variation - 1] || profiles[0])];
    if ((profile.family || '').startsWith('RX')) { shares[0] *= 1.35; shares[2] *= 1.3; }
    if ((profile.family || '').includes('DINAMICO')) { shares[1] *= 1.35; shares[3] *= 1.25; }
    if (profile.radius) { shares[4] *= .8 + (profile.radius - 4) * .2; shares[5] *= .8 + (profile.radius - 4) * .25; }
    const total = shares.reduce((sum, value) => sum + value, 0);
    const result = normalize(Array.from({ length: size }, (_, j) => reading.groups.reduce((sum, group, k) => {
      const confidence = group.support / (group.support + 12);
      return sum + shares[k] / total * (1 + confidence * (group.weights[j] - 1));
    }, 0)));
    reading.profileCache.set(cacheKey, result);
    return result;
  }

  function merge(original, history, profile = {}, strength = .18) {
    if (history.length < 3) return original;
    const reading = read(history);
    if (!reading.groups.some(group => group.support > 0)) return original;
    const contribution = weights(history, profile);
    const mean = average(original) || 1;
    return original.map((value, j) => Math.max(.001, value * (1 - strength) + mean * contribution[j] * strength));
  }

  function summary(history) {
    const reading = read(history);
    return { version: reading.version, candidateCount: reading.candidateCount,
      channelCount: reading.channelCount, interpretationCount: reading.interpretationCount,
      relativeForms:1369, amplitudeForms:361, numericTriples:50653,
      formsEvaluated:reading.exhaustive.formsEvaluated, amplitudesEvaluated:reading.exhaustive.amplitudesEvaluated,
      successorSamples:reading.exhaustive.successorSamples,
      chainLengths:reading.chainLengths,poleTolerances:19,polePairPositions:1369,poleSeparations:19,
      arcWindows:reading.completeArcs.windows,arcWindowSectorCases:reading.completeArcs.representedWindowSectorCases||0,
      groups: reading.groups.map(({ name, support, modes }) => ({ name, support, modes })) };
  }

  return { read, candidate(history,number){return read(history).candidate(number);},weights, merge, summary, catalogue, relativeForms, amplitudeForms, fullKernels, polePairs,polePairReading,poleWindowWeights,arcWindowWeights,poleStep, chooseArc, consumeArc, arcAlternative,
    clear() { cache.clear(); kernelCache.clear(); } };
}

const triangleMemory666 = createTriangleMemory666(W);
  const motorReadings667=createMotorReadings667(W,triangleMemory666);
  function triangleAnalysis(h) {
    const original=legacyTriangleAnalysis(h);
    if(!state.structuralMemoryEnabled)return original;
    const successor=triangleMemory666.analyze(h,past=>legacyTriangleAnalysis(past).weights);
    return {...original,weights:successor.weights,successorMemory:successor};
  }

    function legacyTriangleAnalysis(h) {
      const key = h.join(",");
      if (triangleCache.has(key)) return triangleCache.get(key);
      const triples = [];
      for (let i = 0; i + 2 < h.length; i++)
        triples.push({
          ...triangleFeatures(h[i], h[i + 1], h[i + 2]),
          position: i + 3,
        });
      const weights = Array(37).fill(1),
        counts = {};
      for (const t of triples)
        for (const label of t.labels) counts[label] = (counts[label] || 0) + 1;
      let matches = 0,
        exactPairs = 0;
      if (h.length >= 2) {
        const a = h.at(-2),
          b = h.at(-1),
          jump = direction(a, b),
          candidates = W.map((n) => triangleFeatures(a, b, n));
        for (const t of triples) {
          const hop =
              Math.exp(-Math.abs(t.s1 - jump) / 4) *
              (Math.sign(t.s1) === Math.sign(jump) ? 1 : 0.2),
            physical = Math.exp(-(distance(a, t.a) + distance(b, t.b)) / 10),
            recency = Math.exp(-(h.length - t.position) / 30),
            exact = t.a === a && t.b === b;
          if (exact) exactPairs++;
          if (hop > 0.3) matches++;
          for (let j = 0; j < 37; j++) {
            const f = candidates[j],
              second = Math.exp(-Math.abs(f.s2 - t.s2) / 3.5),
              close = Math.exp(-Math.abs(f.closure - t.closure) / 4),
              area = Math.exp(-Math.abs(f.area - t.area) * 2),
              angle =
                f.angles[1] == null || t.angles[1] == null
                  ? f.degenerate === t.degenerate
                    ? 1
                    : 0.2
                  : Math.exp(-Math.abs(f.angles[1] - t.angles[1]) / 30),
              shape =
                (f.type === t.type ? 1 : 0.15) * 0.45 +
                (f.contour === t.contour ? 1 : 0.15) * 0.25 +
                (f.trend === t.trend ? 1 : 0.15) * 0.3,
              amplitude = Math.exp(
                -Math.abs(f.route.length - t.route.length) / 10,
              );
            weights[j] +=
              recency *
              (hop * 0.7 + physical * 0.3) *
              (second * 0.3 +
                close * 0.15 +
                area * 0.1 +
                angle * 0.1 +
                shape * 0.2 +
                amplitude * 0.15);
            if (exact)
              weights[j] += recency * 2 * Math.exp(-distance(W[j], t.c) / 1.8);
          }
        }
      }
      const r = {
        triples,
        last: triples.at(-1) || null,
        weights: normalizeSpace(weights),
        counts,
        matches,
        exactPairs,
        context: triangleContext(h),
        samples: triples.length,
      };
      triangleCache.set(key, r);
      if (triangleCache.size > 64)
        triangleCache.delete(triangleCache.keys().next().value);
      return r;
    }

    function applyTriangle(weights, h, strength = 0.28) {
      const a = triangleAnalysis(h);
      if (!a.samples) return weights;
      const scale = avg(weights.map((x) => Math.max(0, x))) || 1,
        reliability = Math.min(1, a.samples / 20);
      for (let j = 0; j < 37; j++)
        weights[j] = Math.max(
          0.001,
          weights[j] +
            scale * strength * reliability * clamp(a.weights[j] - 1, -0.75, 2),
        );
      return weights;
    }

    function triangleCoverage(play, h) {
      if (!validPlay(play)) return 0;
      const w = triangleAnalysis(h).weights;
      return (
        play.numbers.reduce((s, n) => s + w[ix(n)], 0) /
        w.reduce((s, n) => s + n, 0)
      );
    }

    function arcCandidates(h) {
      const recent = h.slice(-20);
      return W.map((_, start) => {
        const numbers = Array.from({ length: 8 }, (_, j) => W[mod(start + j)]);
        return {
          start,
          numbers,
          count: recent.filter((n) => numbers.includes(n)).length,
          total: recent.length,
        };
      }).sort((a, b) => b.count - a.count || a.start - b.start);
    }

    function arcMinimum(a) {
      return Math.max(3, Math.ceil(a.total * 0.3));
    }

    function selectArc(h, active) {
      if (h.length < 6) return null;
      const ranked = arcCandidates(h),
        best = ranked[0],
        old = active ? ranked.find((a) => a.start === active.start) : null,
        qualified = best.count >= arcMinimum(best);
      if (!active || active.active === false) return qualified ? best : null;
      if (old.count < arcMinimum(old)) {
        if (qualified && best.start !== old.start) return best;
        return active.weak >= 1 || active.outside >= 12 ? null : old;
      }
      return qualified &&
        (best.count > old.count + 1 ||
          (active.outside >= 3 && best.count > old.count))
        ? best
        : old;
    }

    function arcContext(a, event = a.event) {
      return (
        "S" +
        a.start +
        "|E" +
        event +
        "|Q" +
        (a.count >= arcMinimum(a) ? "FORTE" : "FRACO") +
        "|D" +
        Math.min(3, a.outside) +
        "|I" +
        Math.min(3, a.inside)
      );
    }

    function trackArcs(h) {
      let active = null,
        last = null;
      const events = [],
        episodes = [],
        transitions = {},
        contextTransitions = {};
      function setArc(candidate, position) {
        if (!candidate) {
          if (active) {
            active.active = false;
            active.strength = 0;
            active.event = "ENCERRADO";
            episodes.push(copy(active));
            events.push({
              position,
              number: null,
              arcId: active.id,
              start: active.start,
              event: "ENCERRADO",
              inside: false,
              gap: active.lastGap,
              outside: active.outside,
            });
            last = active;
            active = null;
          }
          return;
        }
        if (active?.start === candidate.start) {
          active.count = candidate.count;
          active.total = candidate.total;
          active.weak =
            candidate.count < arcMinimum(candidate) ? active.weak + 1 : 0;
          active.health = active.weak ? "ENFRAQUECIDO" : "FORTE";
          active.strength = active.weak ? 0.25 : 1;
          return;
        }
        if (active) {
          active.active = false;
          active.event = "SUBSTITUÍDO";
          episodes.push(copy(active));
          last = active;
        }
        active = {
          ...candidate,
          id: "ARC@" + position + ":" + candidate.start,
          formedBefore: position,
          active: true,
          health: "FORTE",
          strength: 1,
          weak: 0,
          lastInside: null,
          seenInside: false,
          event: "NOVO ARCO",
          inside: 0,
          outside: 0,
          entries: 0,
          exits: 0,
          returns: 0,
          lastGap: 0,
          maxGap: 0,
          drift: last ? direction(W[last.start], W[candidate.start]) : 0,
        };
      }
      for (let i = 0; i < h.length; i++) {
        setArc(selectArc(h.slice(0, i), active), i + 1);
        if (!active) continue;
        const number = h[i],
          inside = active.numbers.includes(number),
          priorEvent = active.event;
        if (active.lastInside != null) {
          for (const [map, key] of [
            [transitions, priorEvent],
            [contextTransitions, arcContext(active, priorEvent)],
          ]) {
            const b = map[key] || (map[key] = { total: 0, hits: 0 });
            b.total++;
            if (inside) b.hits++;
          }
        }
        if (inside) {
          if (active.lastInside === false) {
            active.lastGap = active.outside;
            active.entries++;
            if (active.seenInside) {
              active.returns++;
              active.event = "REENTRADA";
            } else active.event = "ENTRADA";
          } else if (active.lastInside === true) active.event = "PERMANÊNCIA";
          else {
            active.entries++;
            active.event = "ENTRADA";
          }
          active.inside = active.lastInside === true ? active.inside + 1 : 1;
          active.outside = 0;
          active.seenInside = true;
        } else {
          if (active.lastInside === true) {
            active.exits++;
            active.event = "SAÍDA";
          } else active.event = active.outside >= 3 ? "AFASTAMENTO" : "FORA";
          active.outside++;
          active.inside = 0;
          active.maxGap = Math.max(active.maxGap, active.outside);
        }
        active.lastInside = inside;
        events.push({
          position: i + 1,
          number,
          arcId: active.id,
          start: active.start,
          event: active.event,
          health: active.health,
          inside,
          gap: active.lastGap,
          outside: active.outside,
        });
      }
      setArc(selectArc(h, active), h.length + 1);
      return {
        active,
        last,
        events,
        episodes,
        transitions,
        contextTransitions,
        ranked: arcCandidates(h),
      };
    }

    function trackPoles(h) {
      let active = null,
        concentration = null;
      const events = [],
        episodes = [];
      for (let i = 0; i < h.length; i++) {
        const n = h[i];
        if (concentration?.active) {
          if (distance(n, concentration.center) <= 4) {
            concentration.center = n;
            concentration.visits++;
            concentration.outside = 0;
          } else if (++concentration.outside >= 2) concentration.active = false;
        }
        if (active?.active) {
          const previous = distance(...active.anchors),
            expected = 1 - active.lastSide,
            de = distance(n, active.anchors[expected]),
            ds = distance(n, active.anchors[active.lastSide]);
          if (de <= 4 && de <= ds) {
            const interrupted = ![
                "ALTERNÂNCIA",
                "FORMADO",
                "CONVERGÊNCIA",
                "DIVERGÊNCIA",
              ].includes(active.event),
              shift = direction(active.anchors[expected], n);
            active.drift[expected] += shift;
            active.lastShift[expected] = shift;
            active.anchors[expected] = n;
            active.lastSide = expected;
            active.alternations++;
            active.outside = 0;
            active.event = interrupted ? "RETOMADA" : "ALTERNÂNCIA";
          } else if (ds <= 4) {
            const side = active.lastSide,
              shift = direction(active.anchors[side], n);
            active.lastShift[side] = shift;
            active.drift[side] += shift;
            active.anchors[side] = n;
            active.interruptions++;
            active.outside = 0;
            active.event = "INTERRUPÇÃO";
          } else {
            active.outside++;
            active.event = active.outside >= 2 ? "RUPTURA" : "SAÍDA DOS POLOS";
            if (active.outside >= 2) active.active = false;
          }
          active.separation = distance(...active.anchors);
          active.movement =
            active.separation < previous
              ? "CONVERGÊNCIA"
              : active.separation > previous
                ? "DIVERGÊNCIA"
                : "MANUTENÇÃO";
          if (active.active && active.separation <= 4) {
            active.active = false;
            active.event = "FUSÃO";
            concentration = {
              active: true,
              center: n,
              formed: i + 1,
              visits: 1,
              outside: 0,
              origins: [...active.anchors],
            };
          } else if (
            active.active &&
            active.outside === 0 &&
            active.separation <= 6 &&
            active.movement === "CONVERGÊNCIA"
          )
            active.event = "CONVERGÊNCIA";
          if (!active.active) episodes.push(copy(active));
          events.push({
            position: i + 1,
            number: n,
            event: active.event,
            movement: active.movement,
            separation: active.separation,
            anchors: [...active.anchors],
            drift: [...active.drift],
          });
        }
        if (!active?.active && i >= 3) {
          const [a, b, c, d] = h.slice(i - 3, i + 1);
          if (
            distance(a, c) <= 2 &&
            distance(b, d) <= 2 &&
            Math.min(distance(a, b), distance(c, d)) >= 8
          ) {
            active = {
              id: "POLES@" + (i + 1),
              active: true,
              start: i - 2,
              anchors: [c, d],
              initial: [a, b],
              lastSide: 1,
              drift: [direction(a, c), direction(b, d)],
              lastShift: [direction(a, c), direction(b, d)],
              alternations: 2,
              interruptions: 0,
              outside: 0,
              event: "FORMADO",
              movement: "MANUTENÇÃO",
              separation: distance(c, d),
            };
            concentration = null;
            events.push({
              position: i + 1,
              number: n,
              event: "FORMADO",
              movement: active.movement,
              separation: active.separation,
              anchors: [c, d],
              drift: [...active.drift],
            });
          }
        }
      }
      return { active, events, episodes, concentration };
    }

    function chainFeatures(h) {
      if (h.length < 4) return null;
      const [a, b, c, d] = h.slice(-4),
        first = triangleFeatures(a, b, c),
        second = triangleFeatures(b, c, d),
        hops = [direction(a, b), direction(b, c), direction(c, d)],
        route = routeFeatures([a, b, c, d]);
      return {
        numbers: [a, b, c, d],
        hops,
        first,
        second,
        route,
        key:
          first.type +
          ":" +
          nearBand(first.closure) +
          ":" +
          first.trend +
          ">" +
          second.type +
          ":" +
          nearBand(second.closure) +
          ":" +
          second.trend +
          "|L" +
          lengthBand(route.length) +
          "|S" +
          hops.map(Math.sign).join(","),
      };
    }

    const spaceCache = new Map(),
      rawSpaceCache = new Map();

    const COMPONENTS = ["triangle", "chain", "pole", "arc", "route"],
      BASE_SHARES = [0.35, 0.2, 0.15, 0.15, 0.15];

    function rawSpatial(h) {
      const key = h.join(",");
      if (rawSpaceCache.has(key)) return rawSpaceCache.get(key);
      const route = routeRead(h),
        tri = triangleAnalysis(h),
        arcs = trackArcs(h),
        poles = trackPoles(h),
        chain = chainFeatures(h),
        cw = Array(37).fill(1),
        pw = Array(37).fill(1),
        aw = Array(37).fill(1);
      let chainExamples = 0;
      if (chain)
        for (let end = 3; end < h.length - 1; end++) {
          const old = chainFeatures(h.slice(end - 3, end + 1)),
            diff = avg(chain.hops.map((s, j) => Math.abs(s - old.hops[j]))),
            shape =
              (old.first.type === chain.first.type ? 0.5 : 0) +
              (old.second.type === chain.second.type ? 0.5 : 0),
            similarity =
              Math.exp(-diff / 4) *
              (0.25 + 0.75 * shape) *
              (0.5 +
                0.5 *
                  Number(
                    old.route.trends.join(",") === chain.route.trends.join(","),
                  )),
            recency = Math.exp(-(h.length - 2 - end) / 30),
            projected = W[mod(ix(h.at(-1)) + direction(h[end], h[end + 1]))];
          if (similarity > 0.25) chainExamples++;
          for (let j = 0; j < 37; j++)
            cw[j] +=
              similarity * recency * Math.exp(-distance(W[j], projected) / 2);
        }
      const p = poles.active;
      if (p?.active) {
        const expected = 1 - p.lastSide,
          anchor = p.anchors[expected],
          shift = clamp(p.lastShift[expected], -2, 2),
          projected = W[mod(ix(anchor) + shift)],
          strength =
            Math.min(1, p.alternations / 5) *
            (p.event === "SAÍDA DOS POLOS"
              ? 0.25
              : p.event === "INTERRUPÇÃO"
                ? 0.45
                : p.event === "CONVERGÊNCIA"
                  ? 0.6
                  : 1);
        for (let j = 0; j < 37; j++)
          pw[j] +=
            strength *
            (Math.exp(-distance(W[j], anchor) / 2) +
              0.4 * Math.exp(-distance(W[j], projected) / 2));
      }
      const concentration = poles.concentration;
      if (!p?.active && concentration?.active) {
        const strength =
          Math.min(0.7, concentration.visits / 8) / (1 + concentration.outside);
        for (let j = 0; j < 37; j++)
          pw[j] +=
            strength * Math.exp(-distance(W[j], concentration.center) / 2);
      }
      const a = arcs.active;
      let arcEvidence = { hits: 0, total: 0, score: 8 / 37 };
      if (a) {
        const base = 8 / 37,
          b = arcs.contextTransitions[arcContext(a)] || { hits: 0, total: 0 },
          historical = (b.hits + base * 10) / (b.total + 10),
          density = (a.count + base * 8) / (a.total + 8),
          confidence = Math.min(1, a.total / 16) * a.strength,
          sectorMass = clamp(historical * 0.75 + density * 0.25, 0.05, 0.7);
        arcEvidence = { ...b, score: historical };
        for (let j = 0; j < 37; j++) {
          const target = a.numbers.includes(W[j])
            ? (sectorMass * 37) / 8
            : ((1 - sectorMass) * 37) / 29;
          aw[j] = 1 + (target - 1) * confidence;
        }
      }
      const chainWeights = normalizeSpace(cw),
        poleWeights = normalizeSpace(pw),
        arcWeights = normalizeSpace(aw),
        keys = ["T:" + tri.context];
      if (route.triangle) keys.push(route.key);
      if (chain) keys.push("C:" + chain.key);
      if (p?.active)
        keys.push(
          "P:" +
            p.event +
            "|D:" +
            nearBand(p.separation) +
            "|M:" +
            p.movement +
            "|F:" +
            Math.sign(p.drift[0]) +
            "," +
            Math.sign(p.drift[1]),
        );
      else if (concentration?.active)
        keys.push(
          "P:FUSÃO|S:" +
            ix(concentration.center) +
            "|F:" +
            Math.min(2, concentration.outside),
        );
      if (a) keys.push("A:" + arcContext(a));
      else keys.push("A:SEM ARCO ATIVO");
      const r = {
        tri,
        arcs,
        poles,
        chain,
        route,
        chainExamples,
        chainWeights,
        poleWeights,
        arcWeights,
        arcEvidence,
        keys,
        components: [
          tri.weights,
          chainWeights,
          poleWeights,
          arcWeights,
          route.weights,
        ],
      };
      rawSpaceCache.set(key, r);
      if (rawSpaceCache.size > 80)
        rawSpaceCache.delete(rawSpaceCache.keys().next().value);
      return r;
    }

    function adaptiveSpatial(h) {
      const sums = Array(5).fill(0),
        details = [];
      let samples = 0;
      for (let end = Math.max(8, h.length - 24); end < h.length; end++) {
        const r = rawSpatial(h.slice(0, end)),
          n = ix(h[end]);
        for (let k = 0; k < 5; k++)
          sums[k] += clamp(Math.log(Math.max(0.01, r.components[k][n])), -2, 2);
        samples++;
      }
      const confidence = samples / (samples + 16),
        gains = sums.map((s) =>
          Math.exp(
            clamp((samples ? s / samples : 0) * 4 * confidence, -0.5, 0.5),
          ),
        ),
        unnormalized = BASE_SHARES.map((b, k) => b * gains[k]),
        total = unnormalized.reduce((s, n) => s + n, 0),
        shares = unnormalized.map((n) => n / total);
      for (let k = 0; k < 5; k++)
        details.push({
          component: COMPONENTS[k],
          base: BASE_SHARES[k],
          share: shares[k],
          samples,
          meanLogGain: samples ? sums[k] / samples : 0,
        });
      return { shares, details, samples, confidence };
    }

    function spatialRead(h, forceHistorical = false) {
    if(!forceHistorical&&!readingFollowLive&&momentIsFixed())h=state.block.anchor;
      h = h.slice(-WINDOW);
      const key = h.join(",");
      if (spaceCache.has(key)) return spaceCache.get(key);
      const raw = rawSpatial(h),
        adaptive = adaptiveSpatial(h),
        weights = normalizeSpace(
          W.map((_, j) =>
            raw.components.reduce(
              (s, w, k) => s + w[j] * adaptive.shares[k],
              0,
            ),
          ),
        ),
        r = { ...raw, adaptive, weights: motorReadings667.merge(weights,h), readingVersion:"6.6.36" };
      spaceCache.set(key, r);
      if (spaceCache.size > 40)
        spaceCache.delete(spaceCache.keys().next().value);
      return r;
    }

    function applySpatial(weights, h, strength = 0.3) {
      if (h.length < 3) return weights;
      const r = spatialRead(h),
        scale = avg(weights.map((v) => Math.max(0, v))) || 1,
        reliability = Math.min(1, (h.length - 2) / 20);
      for (let j = 0; j < 37; j++)
        weights[j] = Math.max(
          0.001,
          weights[j] +
            scale * strength * reliability * clamp(r.weights[j] - 1, -0.75, 2),
        );
      return weights;
    }

    function spatialCoverage(play, h) {
      if (!validPlay(play)) return 0;
      const w = spatialRead(h).weights;
      return (
        play.numbers.reduce((s, n) => s + w[ix(n)], 0) /
        w.reduce((s, n) => s + n, 0)
      );
    }

    function spatialMatch(keys, current) {
      if (!keys?.length) return 0;
      const importance = { T: 0.2, C: 0.2, P: 0.2, A: 0.2, R: 0.2 };
      return current.reduce(
        (s, k) => s + (keys.includes(k) ? importance[k[0]] || 0 : 0),
        0,
      );
    }

    function spatialMetrics(rows, h, hit = (r) => r.result !== "LOSS") {
      const keys = spatialRead(h).keys;
      let support = 0,
        weightedHits = 0,
        total = 0,
        hits = 0;
      for (const row of rows) {
        const w = spatialMatch(
          row.spatialKeys || (row.triangleKey ? ["T:" + row.triangleKey] : []),
          keys,
        );
        if (!w) continue;
        support += w;
        total++;
        if (hit(row)) {
          weightedHits += w;
          hits++;
        }
      }
      return {
        total,
        hits,
        loss: total - hits,
        support,
        score: (weightedHits + (33 / 37) * 8) / (support + 8),
      };
    }

    function analyze(h) {
      const transitions = [];
      for (let i = Math.max(1, h.length - 45); i < h.length; i++) {
        const a = h[i - 1],
          b = h[i],
          physical = direction(a, b);
        transitions.push({
          from: a,
          to: b,
          numeric: b - a,
          physical,
          distance: Math.abs(physical),
          mirrorFrom: mirror(a),
          mirrorTo: mirror(b),
        });
      }
      function streak(field) {
        const sign = Math.sign(transitions.at(-1)?.[field] || 0);
        let length = 0;
        if (sign)
          for (let i = transitions.length - 1; i >= 0; i--) {
            if (Math.sign(transitions[i][field]) !== sign) break;
            length++;
          }
        return { dir: sign, length };
      }
      const regions = {};
      for (const name of Object.keys(REGIONS)) {
        let absence = 0;
        for (let i = h.length - 1; i >= 0; i--) {
          if (region(h[i]) === name) break;
          absence++;
        }
        regions[name] = {
          absence,
          recent: h.slice(-12).filter((n) => region(n) === name).length,
        };
      }
      const last3 = transitions.slice(-3),
        previous3 = transitions.slice(-6, -3);
      return {
        transitions,
        last6: transitions.slice(-6),
        numericStreak: streak("numeric"),
        physicalStreak: streak("physical"),
        mean3: avg(last3.map((x) => x.distance)),
        previous3: avg(previous3.map((x) => x.distance)),
        acceleration:
          avg(last3.map((x) => x.distance)) -
          avg(previous3.map((x) => x.distance)),
        regions,
      };
    }

    function weightsFor(h, family, radius) {
      const weights = Array(37).fill(0.01),
        recent = h.slice(-60);
      for (let k = 0; k < recent.length; k++) {
        const p = ix(recent[recent.length - 1 - k]),
          decay = Math.exp(-k / (radius * 2.3));
        for (let j = 0; j < 37; j++) {
          const d = Math.min(Math.abs(p - j), 37 - Math.abs(p - j));
          if (d <= 6) weights[j] += (decay * (7 - d)) / 7;
        }
      }
      if (family.includes("DINAMICO"))
        for (let k = 0; k < Math.min(radius + 2, h.length); k++) {
          const p = ix(h[h.length - 1 - k]);
          for (let j = 0; j < 37; j++) {
            const d = Math.min(Math.abs(p - j), 37 - Math.abs(p - j));
            if (d <= 3) weights[j] += ((4 - d) / (k + 2)) * 1.7;
          }
        }
      if (family.startsWith("RX")) {
        const length = Math.min(radius, h.length - 2),
          matches = [];
        if (length >= 2) {
          for (let i = 0; i + length < h.length - 1; i++) {
            let score = 0;
            for (let j = 0; j < length; j++)
              score +=
                Math.max(0, 6 - distance(h[h.length - length + j], h[i + j])) /
                6;
            matches.push({ score: score / length, next: h[i + length] });
          }
          matches.sort((a, b) => b.score - a.score);
          for (const m of matches.slice(0, 12)) {
            const p = ix(m.next);
            for (let j = 0; j < 37; j++) {
              const d = Math.min(Math.abs(p - j), 37 - Math.abs(p - j));
              if (d <= 3) weights[j] += (4 - d) * m.score * 0.45;
            }
          }
        }
      }
      if (h.length >= 3) {
        const a = analyze(h),
          last = h.at(-1),
          nb =
            a.last6.filter((x) => x.numeric > 0).length -
            a.last6.filter((x) => x.numeric < 0).length,
          pb =
            a.last6.filter((x) => x.physical > 0).length -
            a.last6.filter((x) => x.physical < 0).length,
          expected = clamp(
            Math.round(avg(a.last6.map((x) => x.distance))),
            1,
            18,
          );
        for (const n of W) {
          const pd = direction(last, n),
            d = Math.abs(pd);
          let b = 0;
          if (nb && Math.sign(n - last) === Math.sign(nb)) b += 0.1;
          if (pb && Math.sign(pd) === Math.sign(pb)) b += 0.12;
          if (Math.abs(d - expected) <= 2) b += 0.09;
          if (
            a.numericStreak.length >= 2 &&
            Math.sign(n - last) === a.numericStreak.dir
          )
            b += 0.07;
          if (
            a.physicalStreak.length >= 2 &&
            Math.sign(pd) === a.physicalStreak.dir
          )
            b += 0.07;
          if (a.acceleration >= 3 && d >= 10) b += 0.07;
          if (a.acceleration <= -3 && d <= 5) b += 0.07;
          weights[ix(n)] += (b * radius) / 5;
        }
      }
      return balanceNumberWeights(applyReanalysisMemory(motorReadings667.merge(applySpatial(weights,h,
      0.3+(radius-4)*0.035+(family.startsWith("RX")?0.035:0)),h,{family,radius},.12),h),h);
    }

    const motorDiversityCache = new Map();

    let diversityPool = null;

    let diversitySafety = null;

    const MAX_MOTOR_OVERLAP = 31;

    function coverageCode(play) {
      return [...play.numbers].sort((a, b) => a - b).join(",");
    }

    function population32(n) {
      n = n - ((n >>> 1) & 0x55555555);
      n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
      return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }

    function sharedCoverage(a, b) {
      return 29 + population32(a.low & b.low) + population32(a.high & b.high);
    }

    function gapGeometry(gaps, start) {
      let position = start;
      const blocks = [];
      for (let k = 0; k < 7; k++) {
        const radius = k === 0 ? 1 : 2;
        const center = W[mod(position + radius)];
        blocks.push({center, radius, numbers:neighbors(center, radius)});
        position += radius * 2 + 1 + gaps[k];
      }
      return {blocks, numbers:blocks.flatMap(block => block.numbers), score:0};
    }

    function motorCoverageAudit(motors) {
      const counts = Array(37).fill(0);
      const candidates = motors.map((m) => diversityCandidate(m.play));
      let maxOverlap = 0;
      for (let i = 0; i < candidates.length; i++) {
        for (const n of candidates[i].play.numbers) counts[n]++;
        for (let j = 0; j < i; j++)
          maxOverlap = Math.max(
            maxOverlap,
            sharedCoverage(candidates[i], candidates[j]),
          );
      }
      return {
        counts,
        covered: counts.filter(Boolean).length,
        distinct: new Set(candidates.map((c) => c.code)).size,
        maxOverlap,
        minCoverage: Math.min(...counts),
        maxCoverage: Math.max(...counts),
      };
    }

    function validMotorEnsemble(motors) {
      if (motors.length !== 12 || !motors.every((m) => validPlay(m.play)))
        return false;
      const a = motorCoverageAudit(motors);
      return (
        a.covered === 37 &&
        a.distinct === 12 &&
        a.maxOverlap <= MAX_MOTOR_OVERLAP
      );
    }

    function diversityCandidates() {
      if (diversityPool) return diversityPool;
      const patterns = [
        [4, 0, 0, 0, 0, 0, 0],
        [3, 1, 0, 0, 0, 0, 0],
        [2, 2, 0, 0, 0, 0, 0],
        [2, 1, 1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0, 0, 0],
        [2, 0, 1, 0, 1, 0, 0],
        [1, 0, 1, 0, 1, 0, 1],
        [3, 0, 0, 1, 0, 0, 0],
      ];
      const shapes = new Map(),
        pool = new Map();
      for (const pattern of patterns)
        for (let rotation = 0; rotation < 7; rotation++) {
          const gaps = pattern.map((_, i) => pattern[(i + rotation) % 7]);
          shapes.set(gaps.join(","), gaps);
          shapes.set([...gaps].reverse().join(","), [...gaps].reverse());
        }
      for (const gaps of shapes.values())
        for (let start = 0; start < 37; start++) {
          const play = gapGeometry(gaps, start);
          if (!validPlay(play)) throw Error("GEOMETRIA DE VARIAÇÃO INVÁLIDA.");
          const candidate = diversityCandidate(play);
          if (!pool.has(candidate.code)) pool.set(candidate.code, candidate);
        }
      diversityPool = [...pool.values()];

      /* Reserva verificada para o caso de a busca por qualidade não concluir.
   Também é escolhida por pesos e rotação comum, antes do resultado. */
      const selected = [],
        counts = Array(37).fill(0);
      for (let k = 0; k < 12; k++) {
        let best = null,
          bestValue = -Infinity;
        for (const candidate of diversityPool) {
          if (
            selected.some(
              (old) => sharedCoverage(old, candidate) > MAX_MOTOR_OVERLAP,
            )
          )
            continue;
          let value = 0;
          for (const n of candidate.play.numbers) value += 1 / (1 + counts[n]);
          if (value > bestValue + 1e-12) {
            best = candidate;
            bestValue = value;
          }
        }
        if (!best)
          throw Error("NÃO FOI POSSÍVEL FORMAR A RESERVA DE VARIAÇÕES.");
        selected.push(best);
        for (const n of best.play.numbers) counts[n]++;
      }
      diversitySafety = selected;
      if (!validMotorEnsemble(selected.map((c) => ({ play: c.play })))) {
        throw Error("RESERVA SEM COBERTURA INTEGRAL DA RODA.");
      }
      return diversityPool;
    }

    function rotatedDiversity(play, shift) {
      const blocks = play.blocks.map((b) => {
        const center = W[mod(ix(b.center) + shift)];
        return {
          center,
          radius: b.radius,
          numbers: neighbors(center, b.radius),
        };
      });
      return { blocks, numbers: blocks.flatMap((b) => b.numbers), score: 0 };
    }

    function diversifyMotors(proposals) {
      const pool = [...diversityCandidates()];
      const seen = new Set(pool.map((c) => c.code));
      for (const m of proposals) {
        const c = diversityCandidate(m.play);
        if (!seen.has(c.code)) {
          pool.push(c);
          seen.add(c.code);
        }
      }
      const normalized = proposals.map((m) => {
        const total = m.weights.reduce((s, v) => s + v, 0) || 1;
        return m.weights.map((v) => v / total);
      });
      const values = normalized.map((weights) =>
        pool.map((c) => c.play.numbers.reduce((s, n) => s + weights[ix(n)], 0)),
      );
      let chosen = null,
        chosenValue = -Infinity;

      /* Ordens diferentes evitam que um único motor defina todas as lacunas. */
      for (const step of [1, 5, 7]) {
        const selected = Array(12).fill(null),
          counts = Array(37).fill(0);
        let failed = false;
        for (let k = 0; k < 12; k++) {
          const index = (k * step) % 12;
          let best = -1,
            bestValue = -Infinity;
          for (let j = 0; j < pool.length; j++) {
            const candidate = pool[j];
            if (
              selected.some(
                (old) =>
                  old && sharedCoverage(old, candidate) > MAX_MOTOR_OVERLAP,
              )
            )
              continue;
            let complementary = 0;
            for (const n of candidate.play.numbers)
              complementary += 1 / (1 + counts[n]);
            const value = values[index][j] + (0.045 * complementary) / 33;
            if (value > bestValue + 1e-12) {
              best = j;
              bestValue = value;
            }
          }
          if (best < 0) {
            failed = true;
            break;
          }
          selected[index] = pool[best];
          for (const n of pool[best].play.numbers) counts[n]++;
        }
        if (failed || counts.some((c) => c === 0)) continue;
        const value = selected.reduce(
          (sum, c, i) =>
            sum + c.play.numbers.reduce((s, n) => s + normalized[i][ix(n)], 0),
          0,
        );
        if (value > chosenValue) {
          chosenValue = value;
          chosen = selected;
        }
      }

      if (!chosen) {
        for (let shift = 0; shift < 37; shift++)
          for (const step of [1, 5, 7]) {
            const selected = proposals.map((_, i) =>
              diversityCandidate(
                rotatedDiversity(diversitySafety[(i * step) % 12].play, shift),
              ),
            );
            const value = selected.reduce(
              (sum, c, i) =>
                sum +
                c.play.numbers.reduce((s, n) => s + normalized[i][ix(n)], 0),
              0,
            );
            if (value > chosenValue) {
              chosenValue = value;
              chosen = selected;
            }
          }
      }

      const result = proposals.map((m, i) => {
        const { weights, ...motor } = m;
        const play = copy(chosen[i].play);
        play.score = play.numbers.reduce((sum, n) => sum + weights[ix(n)], 0);
        return {
          ...motor,
          play,
          score: play.score,
          baseScore: m.score,
          diversity: {
            changed: coverageCode(m.play) !== coverageCode(play),
            maxOverlap: MAX_MOTOR_OVERLAP,
          },
        };
      });
      if (!validMotorEnsemble(result))
        throw Error("FALHA NA VERIFICAÇÃO DOS 12 MOTORES.");
      return result;
    }

    function motors(h) {
      if (h.length < 8) return [];
      h = h.slice(-WINDOW);
      const cacheKey = h.join(",");
      if (motorDiversityCache.has(cacheKey))
        return copy(motorDiversityCache.get(cacheKey));
      const proposals = [],
        s = spatialRead(h);
      for (const family of FAMILIES)
        for (const radius of RADII) {
          const weights = weightsFor(h, family, radius);
          const play = geometry(weights);
          if (!validPlay(play))
            throw Error("MOTOR SEM GEOMETRIA VÁLIDA: " + family + "_" + radius);
          proposals.push({
            key: family + "_" + radius,
            family,
            radius,
            weights,
            score: play.score,
            play,
            triangleKey: triangleContext(h),
            spatialKeys: [...s.keys],
            spatialVersion: VERSION,
          readingVersion:"6.6.36",readingCandidates:37,
            componentShares: [...s.adaptive.shares],
            adaptiveSamples: s.adaptive.samples,
          });
        }
      const result = diversifyMotors(proposals);
      for (const m of result) {
        m.triangleScore = triangleCoverage(m.play, h);
        m.spatialScore = spatialCoverage(m.play, h);
      }
      result.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
      result.forEach((m, i) => {
        m.rank = i + 1;
      });
      motorDiversityCache.set(cacheKey, copy(result));
      if (motorDiversityCache.size > 24)
        motorDiversityCache.delete(motorDiversityCache.keys().next().value);
      return result;
    }

    function generateNumberCombination(h) {
      if (h.length < 8) return null;
      const trigger = h.at(-1),
        weights = Array(37).fill(0.02),
        recent = h.slice(-60);
      for (let k = 0; k < recent.length; k++) {
        const p = ix(recent[recent.length - 1 - k]),
          decay = Math.exp(-k / 18);
        for (let j = 0; j < 37; j++) {
          const d = Math.min(Math.abs(p - j), 37 - Math.abs(p - j));
          if (d <= 5) weights[j] += (decay * (6 - d)) / 6;
        }
      }
      if (h.length >= 2) {
        const expected = mod(ix(trigger) + direction(h.at(-2), trigger));
        for (let j = 0; j < 37; j++) {
          const d = Math.min(
            Math.abs(expected - j),
            37 - Math.abs(expected - j),
          );
          if (d <= 4) weights[j] += (5 - d) * 0.14;
        }
      }
      for (let i = 0; i < h.length - 1; i++) {
        if (h[i] !== trigger) continue;
        const p = ix(h[i + 1]),
          decay = Math.exp(-(h.length - 1 - i) / 28);
        for (let j = 0; j < 37; j++) {
          const d = Math.min(Math.abs(p - j), 37 - Math.abs(p - j));
          if (d <= 3) weights[j] += ((decay * (4 - d)) / 4) * 0.9;
        }
      }
      applySpatial(weights, h, 0.35);
      const play = geometry(weights);
      return validPlay(play)
        ? {
            key: "NUMERO_GERADO_" + trigger,
            name: "COMBINAÇÃO DO " + trigger,
            trigger,
            score: play.score,
            spatialScore: spatialCoverage(play, h),
            play,
          }
        : null;
    }

    function registerNumberCombination(h, turn) {
      const g = generateNumberCombination(h);
      if (g)
        state.numberCombinations.push({
          id: "NC_" + turn,
          turn,
          origin: g.trigger,
          motor: g.key,
          play: copy(g.play),
          centers: g.play.blocks.map((b) => b.center),
          covered: [...g.play.numbers],
          triangleKey: triangleContext(h),
          spatialKeys: [...spatialRead(h).keys],
        });
    }

    function numberTransitions(h, trigger) {
      const rows = [];
      for (let i = 0; i < h.length - 1; i++)
        if (h[i] === trigger)
          rows.push({
            next: h[i + 1],
            age: h.length - 1 - i,
            position: i + 2,
            triggerPosition: i + 1,
          });
      return rows;
    }

    function compareNumberCombination(record, trigger, h) {
      const transitions = numberTransitions(h, trigger),
        covered = new Set(record.covered),
        matchedNumbers = [],
        missedNumbers = [];
      let matches = 0,
        weightedMatches = 0,
        totalWeight = 0;
      for (const t of transitions) {
        const w = Math.exp(-t.age / 35);
        totalWeight += w;
        if (covered.has(t.next)) {
          matches++;
          weightedMatches += w;
          matchedNumbers.push(t.next);
        } else missedNumbers.push(t.next);
      }
      const total = transitions.length,
        base = 33 / 37,
        historical = (matches + base * 3) / (total + 3),
        recent = (weightedMatches + base * 2) / (totalWeight + 2),
        numericalScore = historical * 0.65 + recent * 0.35,
        spatialScore = spatialCoverage(record.play, h);
      return {
        ...record,
        trigger,
        total,
        matches,
        misses: total - matches,
        weightedMatches,
        numericalScore,
        triangleScore: triangleCoverage(record.play, h),
        spatialScore,
        score: numericalScore * 0.75 + spatialScore * 0.25,
        matchedNumbers,
        missedNumbers,
      };
    }

    function rankNumberCombinations(h, trigger = h.at(-1)) {
      return trigger == null
        ? []
        : state.numberCombinations
            .filter((r) => validPlay(r.play))
            .map((r) => compareNumberCombination(r, trigger, h))
            .sort(
              (a, b) =>
                b.score - a.score || b.matches - a.matches || b.turn - a.turn,
            );
    }

    function bestNumberCombination(h) {
    if(momentIsFixed())return fixedMomentMotor("NUMBER");
      if (h.length < 8) return null;
      const trigger = h.at(-1),
        best = rankNumberCombinations(h, trigger)[0];
      return best
        ? {
            key: "NUM_T" + best.turn + "_N" + best.origin,
            name: "COMBINAÇÃO DO " + best.origin,
            rank: 0,
            score: best.score,
            spatialScore: best.spatialScore,
            sourceNumber: best.origin,
            sourceTurn: best.turn,
            trigger,
            matches: best.matches,
            tests: best.total,
            play: copy(best.play),
            type: "NUMBER",
          }
        : null;
    }

    function updateNumberChoice() {
      const s = bestNumberCombination(state.history);
      if (!s) {
        state.numberChoice = null;
        return null;
      }
      const old = state.numberChoice;
      if (old && (old.sourceTurn !== s.sourceTurn || old.trigger !== s.trigger))
        state.numberChanges++;
      state.numberChoice = {
        trigger: s.trigger,
        sourceNumber: s.sourceNumber,
        sourceTurn: s.sourceTurn,
        motor: s.key,
        score: s.score,
        matches: s.matches,
        tests: s.tests,
        spatialScore: s.spatialScore,
        play: copy(s.play),
      };
      return s;
    }

    function recordNumberComparison(before, n, turn) {
      const trigger = before.at(-1),
        s = bestNumberCombination(before);
      if (trigger == null || !s) return;
      state.numberComparisons.push({
        turn,
        trigger,
        sourceNumber: s.sourceNumber,
        sourceTurn: s.sourceTurn,
        next: n,
        covered: s.play.numbers.includes(n),
        centers: s.play.blocks.map((b) => b.center),
        triangleKey: triangleContext(before),
        spatialKeys: [...spatialRead(before).keys],
      });
    }

    function definitions() {
      return [
        ...ORIGINALS.map(([rule, name]) => ({
          id: "ORIGINAL:" + rule,
          name,
          rule,
          type: "ORIGINAL",
        })),
        ...Array.from({ length: 4 }, (_, i) => ({
          id: "RANK:" + (i + 1),
          name: "AUTO " + (i + 1) + "º",
          rank: i + 1,
          type: "RANK",
        })),
        ...ADAPTATIVES.map((config) => ({
          id: "ADAPTIVE:" + config.id,
          name: config.name,
          config,
          type: "ADAPTIVE",
        })),
        ...state.created.map((c) => ({
          id: "CREATED:" + c.id,
          name: c.name,
          config: c.config,
          type: "CREATED",
        })),
      ];
    }

    function motorRate(key, limit = 12) {
      if (key.includes("::")) return variantMotorRate(key, limit);
      const available = state.ledger.filter(
          (r) => r.motorHits && key in r.motorHits,
        ),
        rows = available.slice(-limit);
      if (!rows.length) return 0.5;
      const global = rows.filter((r) => r.motorHits[key]).length / rows.length,
        local = spatialMetrics(
          available,
          state.history,
          (r) => !!r.motorHits[key],
        ),
        w = (0.4 * local.support) / (local.support + 8);
      return global * (1 - w) + local.score * w;
    }

    function chooseMotor(def, cs, previous) {
      if (!cs.length) return null;
      if(momentIsFixed()&&!variantEvaluationContext){
        const id=def.id||(def.rule?'ORIGINAL:'+def.rule:def.rank?'RANK:'+def.rank:null);
        if(id)return fixedMomentMotor(id);
      }
      const fixed = cs[clamp(state.rank - 1, 0, cs.length - 1)];
      if (def.rank) return cs[clamp(def.rank - 1, 0, cs.length - 1)];
      if (def.rule === "FIXED") return chooseAutoMotor(cs);
      if (def.config) {
        const c = def.config,
          ranked = cs
            .filter((m) => m.rank <= c.maxRank)
            .map((m) => ({
              motor: m,
              score:
                motorRate(m.key, 3) * 0.55 + motorRate(m.key, c.window) * 0.45,
            }))
            .sort((a, b) => b.score - a.score || a.motor.rank - b.motor.rank),
          best = ranked[0],
          old = ranked.find((x) => x.motor.key === previous);
        if (old && best && best.score < old.score + c.margin) return old.motor;
        return best?.motor || fixed;
      }
      if (def.rule === "GEO") return cs[0];
      if (def.rule === "BEST")
        return [...cs].sort(
          (a, b) => motorRate(b.key, 20) - motorRate(a.key, 20),
        )[0];
      if (def.rule === "STABLE")
        return cs.find((m) => m.key === previous && m.rank <= 5) || fixed;
      if (def.rule === "SWITCH") {
        const old = cs.find((m) => m.key === previous) || fixed,
          best = [...cs].sort(
            (a, b) => motorRate(b.key, 12) - motorRate(a.key, 12),
          )[0];
        return motorRate(best.key, 12) > motorRate(old.key, 12) + 0.12
          ? best
          : old;
      }
      if (["CONSENSUS", "UNION"].includes(def.rule)) {
        const w = Array(37).fill(0),
          selected = def.rule === "UNION" ? cs.slice(0, 3) : cs;
        for (const m of selected)
          for (const n of m.play.numbers) w[ix(n)] += 1 / (1 + m.rank * 0.1);
        applySpatial(w, state.history, 0.25);
        const play = geometry(w);
        if (play)
          return {
            key: def.rule,
            rank: 0,
            score: play.score,
            spatialScore: spatialCoverage(play, state.history),
            spatialKeys: [...spatialRead(state.history).keys],
            play,
          };
      }
      return fixed;
    }

    function fineG1(original, trigger, h = state.history) {
      return applyBalancedWeight(baseFineG1(original,trigger,h),h,{stage:"AJUSTE FINO",mandatory:neighbors(trigger,1)});
    }
    function baseFineG1(original, trigger, h = state.history) {
    if(original?.play?.kind==="ROTATED33"){
      const offset=original.play.offset,back=number=>W[mod(ix(number)-offset)];
      const base={...copy(original),play:copy(original.play.base)};
      delete base.rotationTarget;
      return rotateMotorAt(baseFineG1(base,back(trigger),h),offset);
    }
    if (original?.play?.kind === "TERMINALS33") return fixedTerminalMotor(h, original.fixedTerminalTrio||null, neighbors(trigger,1), original.terminalProfile, original.play.terminalDigits) || copy(original);
      if (!validPlay(original?.play)) return null;
      const w = Array(37).fill(0.01),
        mandatory = neighbors(trigger, 1);
      for (const n of original.play.numbers) w[ix(n)] += 100;
      applySpatial(w, h, 0.2);
      for (const n of mandatory) w[ix(n)] += 100000;
      const play = geometry(w, mandatory);
      return play
        ? {
            key: original.key,
            rank: original.rank,
            play,
            spatialScore: spatialCoverage(play, h),
          }
        : copy(original);
    }

    function g1History(strategy = null, mode = null, limit = 400) {
      return state.g1Rows
        .filter(
          (r) =>
            (strategy == null || r.strategy === strategy) &&
            (mode == null || r.mode === mode),
        )
        .slice(-limit);
    }

    function uniqueGales(strategy = null, limit = 100) {
      const map = new Map();
      for (const r of g1History(strategy, null, 5000)) {
        const k = r.strategy + "|" + r.eventId;
        if (!map.has(k)) map.set(k, r);
      }
      return [...map.values()].slice(-limit);
    }

    function numberG1Rows(strategy, trigger, mode = null, limit = 200) {
      return state.g1Rows
        .filter(
          (r) =>
            r.strategy === strategy &&
            r.trigger === trigger &&
            (mode == null || r.mode === mode),
        )
        .slice(-limit);
    }

    function numberG1Metrics(strategy, trigger, mode, limit = 100) {
      const rows = numberG1Rows(strategy, trigger, mode, limit),
        hits = rows.filter((r) => r.hit).length;
      return {
        total: rows.length,
        hits,
        loss: rows.length - hits,
        rate: rows.length ? hits / rows.length : null,
      };
    }

    function numberG1Events(strategy, trigger, limit = 100) {
      const map = new Map();
      for (const r of numberG1Rows(strategy, trigger, null, 1000))
        if (!map.has(r.eventId)) map.set(r.eventId, r);
      return [...map.values()].slice(-limit);
    }

    function behaviorReading(original, h, strategy, trigger = null) {
      const rows = uniqueGales(strategy, 45),
        recent = rows.slice(-12),
        last6 = rows.slice(-6),
        loss12 = recent.filter((r) => !r.hit).length,
        loss6 = last6.filter((r) => !r.hit).length,
        uncovered = new Set(missing(original.play)),
        outside6 = h.slice(-6).filter((n) => uncovered.has(n)).length;
      let streak = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].hit) break;
        streak++;
      }
      const nr = trigger == null ? [] : numberG1Events(strategy, trigger, 20),
        recentN = nr.slice(-8),
        numberLoss = recentN.filter((r) => !r.hit).length;
      let type = "CONTINUIDADE";
      if (
        streak >= 3 ||
        (last6.length >= 5 && loss6 / last6.length >= 0.6) ||
        (h.length >= 6 && outside6 >= 4) ||
        (recentN.length >= 4 && numberLoss / recentN.length >= 0.6)
      )
        type = "RUPTURA";
      else if (
        (recent.length >= 5 && loss12 / recent.length >= 0.32) ||
        outside6 >= 2 ||
        (recentN.length >= 3 && numberLoss / recentN.length >= 0.34)
      )
        type = "DESLOCAMENTO";
      const s = spatialRead(h);
      return {
        type,
        streak,
        outside6,
        loss12,
        total12: recent.length,
        loss6,
        total6: last6.length,
        numberTotal: recentN.length,
        numberLoss,
        numberHit: recentN.length - numberLoss,
        triangle: s.tri.last?.labels.join(" + ") || "SEM TRINCA",
        poles: s.poles.active?.event || "SEM POLOS",
        arc: s.arcs.active
          ? s.arcs.active.health + " / " + s.arcs.active.event
          : s.arcs.last?.event || "SEM ARCO",
      };
    }

    function reconstructG1(original, trigger, h, strategy) {
      return applyBalancedWeight(baseReconstructG1(original,trigger,h,strategy),h,{stage:"RECONSTRUÇÃO"});
    }
    function baseReconstructG1(original, trigger, h, strategy) {
    if(original?.play?.kind==="ROTATED33"){
      const offset=original.play.offset,back=number=>W[mod(ix(number)-offset)];
      const base={...copy(original),play:copy(original.play.base)};
      delete base.rotationTarget;
      return rotateMotorAt(baseReconstructG1(base,back(trigger),h,strategy),offset);
    }
    if (original?.play?.kind === "TERMINALS33") return fixedTerminalMotor(h,original.fixedTerminalTrio||null,[],original.terminalProfile);
      if (!validPlay(original?.play)) return null;
      const r = behaviorReading(original, h, strategy, trigger),
        w = Array(37).fill(0.1),
        recent = h.slice(-60),
        gales = g1History(strategy, null, 180),
        transitions = numberTransitions(h, trigger);
      for (const n of W) {
        const f60 = recent.filter((x) => x === n).length,
          f24 = h.slice(-24).filter((x) => x === n).length,
          f8 = h.slice(-8).filter((x) => x === n).length,
          losses = gales.filter((row) => !row.hit && row.outcome === n).length,
          conditional = transitions.reduce(
            (s, t) => s + (t.next === n ? Math.exp(-t.age / 35) : 0),
            0,
          );
        let v =
          f60 * 0.3 +
          f24 * 0.55 +
          f8 * 0.85 +
          losses * 0.35 +
          conditional * 2.2;
        if (r.type === "DESLOCAMENTO") v += f8 * 0.35 + conditional * 0.35;
        if (r.type === "RUPTURA")
          v += f8 * 0.6 + losses * 0.45 + conditional * 0.65;
        w[ix(n)] += v;
      }
      for (let k = 0; k < recent.length; k++) {
        const p = ix(recent[recent.length - 1 - k]),
          decay = Math.exp(-k / (r.type === "RUPTURA" ? 8 : 14));
        for (let j = 0; j < 37; j++) {
          const d = Math.min(Math.abs(p - j), 37 - Math.abs(p - j));
          if (d <= 3) w[j] += ((decay * (4 - d)) / 4) * 0.65;
        }
      }
      for (const n of neighbors(trigger, 2)) w[ix(n)] += 0.4;
      applySpatial(w, h, 0.4);
      const play = geometry(w);
      return validPlay(play)
        ? {
            key: "G1_INDEPENDENTE",
            rank: 0,
            play,
            behavior: r.type,
            spatialScore: spatialCoverage(play, h),
          }
        : null;
    }

    function defenses(original, trigger, h, strategy) {
      if (!validPlay(original?.play)) return [];
      const r = behaviorReading(original, h, strategy, trigger),
        recon = reconstructG1(original, trigger, h, strategy);
      return [
        { mode: "CONGELADA", motor: copy(original), behavior: r.type },
        {
          mode: "AJUSTE FINO",
          motor: fineG1(original, trigger, h),
          behavior: r.type,
        },
        ...(recon
          ? [{ mode: "RECONSTRUÇÃO", motor: recon, behavior: r.type }]
          : []),
      ];
    }

    function defenseMetrics(strategy, mode, limit = 100) {
      const rows = g1History(strategy, mode, limit),
        hits = rows.filter((r) => r.hit).length;
      return {
        total: rows.length,
        hits,
        loss: rows.length - hits,
        rate: rows.length ? hits / rows.length : null,
      };
    }

    function rankDefenses(options, strategy, h, trigger = null) {
      return options
        .map((o) => {
          const rows = g1History(strategy, o.mode, 100),
            recent = rows.slice(-12),
            hits = rows.filter((r) => r.hit).length,
            hits12 = recent.filter((r) => r.hit).length,
            base = 33 / 37,
            historical = (hits + base * 12) / (rows.length + 12),
            short = (hits12 + base * 8) / (recent.length + 8),
            coverage = h.length
              ? h.slice(-18).filter((n) => o.motor.play.numbers.includes(n))
                  .length / Math.min(18, h.length)
              : base,
            byNumber =
              trigger == null
                ? { total: 0, hits: 0, loss: 0 }
                : numberG1Metrics(strategy, trigger, o.mode, 100),
            conditional = (byNumber.hits + base * 8) / (byNumber.total + 8);
          let bonus = 0;
          if (o.behavior === "CONTINUIDADE" && o.mode === "CONGELADA")
            bonus = 0.012;
          if (o.behavior === "DESLOCAMENTO" && o.mode === "AJUSTE FINO")
            bonus = 0.01;
          if (o.behavior === "RUPTURA" && o.mode === "RECONSTRUÇÃO")
            bonus = 0.02;
          const nw =
              trigger == null
                ? 0
                : Math.min(0.48, byNumber.total / (byNumber.total + 8)),
            global = historical * 0.55 + short * 0.25 + coverage * 0.2,
            original = global * (1 - nw) + conditional * nw + bonus,
            spatialScore = spatialCoverage(o.motor.play, h),
            local = spatialMetrics(rows, h, (r) => r.hit),
            lw = (0.2 * local.support) / (local.support + 8),
            combined = original * 0.8 + spatialScore * 0.2;
          return {
            ...o,
            score: combined * (1 - lw) + local.score * lw,
            spatialScore,
            contextTotal: local.total,
            total: rows.length,
            hits,
            loss: rows.length - hits,
            numberTotal: byNumber.total,
            numberHits: byNumber.hits,
            numberLoss: byNumber.loss,
            numberScore: conditional,
            uncovered: missing(o.motor.play),
          };
        })
        .sort((a, b) => b.score - a.score || b.numberTotal - a.numberTotal);
    }

    function chooseG1(original, trigger, h, strategy, followContextual=false) {
      let ranked = rankDefenses(
        defenses(original, trigger, h, strategy),
        strategy,
        h,
        trigger,
      );
      if (!ranked.length) return null;
      if (followContextual) ranked=adjustFollowG1(ranked,h);
      let c = ranked[0];
      const frozen = ranked.find((x) => x.mode === "CONGELADA");
      if (
        frozen &&
        c !== frozen &&
        c.total < 8 &&
        c.numberTotal < 4 &&
        c.score - frozen.score < 0.025 && !c.reconstructionBonus &&
        !(followContextual && state.readingSide==="INVERTIDO")
      )
        c = frozen;
      return {
        motor: copy(c.motor),
        mode: c.mode,
        behavior: c.behavior,
        score: c.score,
        spatialScore: c.spatialScore,
        triangleKey: triangleContext(h),
        spatialKeys: [...spatialRead(h).keys],
        numberTotal: c.numberTotal,
        numberHits: c.numberHits,
        numberLoss: c.numberLoss,
        uncovered: c.uncovered,
        reconstructionBonus: c.reconstructionBonus||0,
        alternatives: ranked.map((o) => ({
          mode: o.mode,
          reconstructionBonus: o.reconstructionBonus||0,
          liveCoverageGain: o.liveCoverageGain||0,
          score: o.score,
          spatialScore: o.spatialScore,
          contextTotal: o.contextTotal,
          total: o.total,
          hits: o.hits,
          loss: o.loss,
          numberTotal: o.numberTotal,
          numberHits: o.numberHits,
          numberLoss: o.numberLoss,
        })),
      };
    }

    function virtualCycle(id) {
      return (
        state.virtual[id] ||
        (state.virtual[id] = {
          phase: "ENTRY",
          previous: null,
          defense: null,
          entry: null,
          trigger: null,
          entryTrigger: null,
          triangleKey: null,
          spatialKeys: [],
        })
      );
    }

    function profit(result) {
      const unit = Number(state.stake) || 1;
      const multiplier = Number(state.multiplier) || 1;
      return result === "GREEN" ? 3 * unit
        : result === "GREEN G1" ? (3 * multiplier - 33) * unit
        : result === "LOSS" ? -33 * (1 + multiplier) * unit : 0;
    }

    function settlePending(n, turn) {
      for (const p of state.g1Pending)
        state.g1Rows.push({
          turn,
          eventId: p.eventId,
          strategy: p.strategy,
          mode: p.mode,
          behavior: p.behavior,
          trigger: p.trigger,
          outcome: n,
          hit: p.numbers.includes(n),
          uncovered: p.uncovered,
          entryMotor: p.entryMotor || null,
          triangleKey: p.triangleKey || "SEM TRINCA",
          spatialKeys: copy(p.spatialKeys || []),
        });
      state.g1Pending = [];
    }

    function standardDecision(motor, n, h, strategy, followContextual=false) {
      return state.g1Trainer
        ? chooseG1(motor, n, h, strategy, followContextual)
        : {
            motor: state.g1 ? fineG1(motor, n, h) : copy(motor),
            mode: state.g1 ? "AJUSTE FINO" : "CONGELADA",
            behavior: behaviorReading(motor, h, strategy, n).type,
            triangleKey: triangleContext(h),
            spatialKeys: [...spatialRead(h).keys],
          };
    }

    function openRealGale(motor, n, after, turn) {
      const strategy = state.cycle.strategy;
      state.cycle.trigger = n;
      const independent=sessionG1Decision(motor,n,after,turn,true);
    const d = independent || ((state.playLock?.motor || (motor?.permanenceTarget?.period>1 ? motor : null))
      ? {motor:copy(state.playLock?.motor||motor),mode:"CONGELADA",behavior:"CONTINUIDADE",spatialKeys:[...spatialRead(after).keys]}
      : standardDecision(motor, n, after, strategy,
        !state.importTrainingActive));
      state.cycle.decision = d;
      state.defense = copy(d?.motor || motor);
    if(terminalPlay(state.defense?.play))state.defense.terminalCoverage=motor.terminalCoverage||"ALL";
      state.phase = state.galeSkip ? "GALE_SKIP" : "GALE";
      state.decisions.push({
        turn,
        strategy,
        mode: d?.mode || "CONGELADA",
        behavior: d?.behavior || "CONTINUIDADE",
        trigger: n,
        numberTests: d?.numberTotal || 0,
        triangleKey: d?.triangleKey,
        spatialKeys: copy(d?.spatialKeys || []),
      });
    }

    function undoSnapshot() {
      const { undoStack, ...data } = state;
      return copy(data);
    }

    function inverseChanges(before, after, path = [], ops = []) {
      if (JSON.stringify(before) === JSON.stringify(after)) return ops;
      if (Array.isArray(before) && Array.isArray(after)) {
        const a = before.map((v) => JSON.stringify(v)),
          b = after.map((v) => JSON.stringify(v));
        let drop = -1;
        for (let d = 0; d <= a.length; d++) {
          const count = a.length - d;
          if (count > b.length) continue;
          if (count && a[d] !== b[0]) continue;
          let equal = true;
          for (let j = 0; j < count; j++)
            if (a[d + j] !== b[j]) {
              equal = false;
              break;
            }
          if (equal) {
            drop = d;
            break;
          }
        }
        const shared = a.length - drop;
        ops.push({
          kind: "slide",
          path: [...path],
          removeTail: after.length - shared,
          restoreHead: copy(before.slice(0, drop)),
        });
        return ops;
      }
      if (
        before &&
        after &&
        typeof before === "object" &&
        typeof after === "object" &&
        !Array.isArray(before) &&
        !Array.isArray(after)
      ) {
        for (const k of new Set([
          ...Object.keys(before),
          ...Object.keys(after),
        ])) {
          if (!(k in before)) ops.push({ kind: "delete", path: [...path, k] });
          else if (!(k in after))
            ops.push({
              kind: "set",
              path: [...path, k],
              value: copy(before[k]),
            });
          else inverseChanges(before[k], after[k], [...path, k], ops);
        }
        return ops;
      }
      ops.push({ kind: "set", path: [...path], value: copy(before) });
      return ops;
    }

    function applyInverse(ops) {
      for (const op of ops) {
        let parent = state;
        for (const k of op.path.slice(0, -1)) parent = parent[k];
        const key = op.path.at(-1);
        if (op.kind === "slide") {
          const a = parent[key];
          if (op.removeTail) a.splice(a.length - op.removeTail, op.removeTail);
          a.unshift(...copy(op.restoreHead));
        } else if (op.kind === "delete") delete parent[key];
        else parent[key] = copy(op.value);
      }
    }

    function waitFrame() {
      return new Promise((r) => requestAnimationFrame(() => r()));
    }

    function parseInput(text) {
      return (String(text).match(/\d+/g) || [])
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 36);
    }

    const VARIANT_OWNERS = [
      ...ORIGINALS.map(([id, name]) => ({ id, name })),
      { id: "NUMBER", name: "TREINADOR GLOBAL NÚMEROS" },
    ];

    const VARIANT_PROFILES = [
      { name: "EQUILÍBRIO", decay: 18, space: [1, 1, 1, 1, 1], recent: 0.18 },
      {
        name: "RECENTE",
        decay: 5,
        space: [1.4, 1.2, 0.6, 0.6, 1.2],
        recent: 0.95,
      },
      {
        name: "ESTABILIDADE",
        decay: 36,
        space: [0.8, 0.8, 1.1, 1.5, 0.8],
        recent: 0.12,
      },
      {
        name: "PERCURSO",
        decay: 12,
        space: [0.9, 1.5, 0.6, 0.6, 2.2],
        recent: 0.35,
      },
      {
        name: "TRIANGULAÇÃO",
        decay: 16,
        space: [2.3, 1.6, 0.5, 0.5, 1],
        recent: 0.25,
      },
      {
        name: "POLOS E ARCOS",
        decay: 24,
        space: [0.6, 0.7, 2.4, 2.1, 0.6],
        recent: 0.25,
      },
      {
        name: "RETORNO",
        decay: 10,
        space: [1.5, 0.8, 1.5, 0.6, 1.3],
        recent: 0.45,
      },
      {
        name: "AMPLITUDE",
        decay: 8,
        space: [1, 1.4, 0.6, 1.1, 2],
        recent: 0.65,
      },
    ];

    const variantForecastCache = new Map();

    let variantEvaluationContext = null;

    let strategyButtonsSignature = null;

    function variantBookId(owner, variation) {
      return owner + "@V" + variation;
    }

    function variantBook(owner, variation) {
      const id = variantBookId(owner, variation);
      return (
        state.variantBooks[id] ||
        (state.variantBooks[id] = {
          rows: [],
          previous: null,
          autoRank: 1,
          combinations: [],
          cycle: null,
        })
      );
    }

    function variantAnalyticalWeights(
      h,
      family,
      radius,
      owner,
      variation,
      base,
      spatial,
      shared,
    ) {
      const profile = VARIANT_PROFILES[variation - 1];
      const ownerIndex = VARIANT_OWNERS.findIndex((o) => o.id === owner);
      const normalized = normalizeSpace(base);
      const additiveKey = owner + "@" + variation + ":" + radius;
      const coefficient = 0.78 + 0.035 * ownerIndex;
      if (shared?.additive.has(additiveKey)) {
        const item = shared.additive.get(additiveKey);
        const raw = normalized.map((v, j) => v * coefficient + item.weights[j]);
        const mean = avg(raw) || 1;
        return {
          weights: raw.map((v) => v / mean),
          poolScores: item.scores.map(
            (v, j) =>
              (v + coefficient * shared.base.get(family + "_" + radius)[j]) /
              mean,
          ),
        };
      }
      const shares = profile.space.map(
        (v, k) => v * spatial.adaptive.shares[k],
      );
      const shareTotal = shares.reduce((s, v) => s + v, 0);
      const recent = Array(37).fill(0.01);
      const decay = profile.decay * (0.85 + ownerIndex * 0.065);
      for (let age = 0; age < h.length; age++) {
        const center = h[h.length - 1 - age],
          mass = Math.exp(-age / decay);
        for (let j = 0; j < 37; j++) {
          const d = distance(center, W[j]);
          if (d <= radius)
            recent[j] += (mass * (radius + 1 - d)) / (radius + 1);
        }
      }
      const recency = normalizeSpace(recent);
    const completeWeights667=motorReadings667.weights(h,{variation,radius});
      const last = h.at(-1),
        prior = h.at(-2);
      const jump = prior == null ? 0 : direction(prior, last);
      const returnCenter = prior == null ? last : prior;
      const projected = W[mod(ix(last) + jump)];
      const amplitude = clamp(
        Math.round(spatial.route.triangle?.amplitude || Math.abs(jump)),
        1,
        18,
      );
      // Hipóteses espaciais distintas, definidas antes do resultado. Não são o
      // trajeto físico da bola nem uma rotação posterior de uma jogada já pronta.
      const offsets = [0, -3, 3, -6, 6, -10, 10, 18];
      const hypothesis = W[mod(ix(projected) + offsets[variation - 1])];
      const additive = W.map((n, j) => {
        const mixed = spatial.components.reduce(
          (sum, w, k) => sum + (w[j] * shares[k]) / shareTotal,
          0,
        );
        let value = mixed * 0.65 + recency[j] * profile.recent;
      value+=.18*(completeWeights667[j]-1);
        value +=
          1.8 * Math.exp(-distance(n, hypothesis) / (1.6 + (radius - 4) * 0.4));
        if (variation === 4)
          value += 0.5 * Math.exp(-distance(n, projected) / 2);
        if (variation === 7)
          value += 0.8 * Math.exp(-distance(n, returnCenter) / 2);
        if (variation === 8)
          value +=
            0.65 * Math.exp(-Math.abs(distance(last, n) - amplitude) / 2);
        if (owner === "NUMBER") {
          for (let i = 0; i < h.length - 1; i++)
            if (h[i] === last) {
              value +=
                Math.exp(-(h.length - 2 - i) / (decay + 8)) *
                Math.exp(-distance(n, h[i + 1]) / (1.5 + (variation % 3))) *
                2;
            }
        }
        return value;
      });
      const raw = normalized.map((v, j) =>
        Math.max(0.001, v * coefficient + additive[j]),
      );
      if (!shared) return normalizeSpace(raw);
      const scores = diversityCandidates().map((c) =>
        candidateFit(c, additive),
      );
      shared.additive.set(additiveKey, { weights: additive, scores });
      const mean = avg(raw) || 1;
      return {
        weights: raw.map((v) => v / mean),
        poolScores: scores.map(
          (v, j) =>
            (v + coefficient * shared.base.get(family + "_" + radius)[j]) /
            mean,
        ),
      };
    }

    function candidateFit(candidate, weights) {
      let sum = 0;
      const indices =
        candidate.indices ||
        (candidate.indices = candidate.play.numbers.map(ix));
      for (let k = 0; k < indices.length; k++) sum += weights[indices[k]];
      return sum;
    }

    function variantMotorRate(key, limit = 12) {
      const id = key.split("::")[0];
      const motorKey = key.split("::")[1];
      const available = state.variantBooks[id]?.rows || [];
      const rows = available.slice(-limit);
      if (!rows.length) return 0.5;
      const global =
        rows.filter((r) => r.motorHits[motorKey]).length / rows.length;
      const local = spatialMetrics(
        available,
        state.history,
        (r) => !!r.motorHits[motorKey],
      );
      const weight = (0.4 * local.support) / (local.support + 8);
      return global * (1 - weight) + local.score * weight;
    }

    function variantAutoChoice(cs) {
      const book = variantEvaluationContext;
      const ranked = cs
        .slice(0, 4)
        .map((motor, i) => {
          const rows = book.rows.slice(-30),
            recent = rows.slice(-5),
            rank = i + 1;
          const direct =
            (rows.filter((r) => r.rankHits[rank]).length + (4 * 33) / 37) /
            (rows.length + 4);
          const short =
            (recent.filter((r) => r.rankHits[rank]).length + (2 * 33) / 37) /
            (recent.length + 2);
          return { motor, rank, score: direct * 0.55 + short * 0.45 };
        })
        .sort((a, b) => b.score - a.score || a.rank - b.rank);
      const current = ranked.find((r) => r.rank === book.autoRank);
      const best =
        current && ranked[0].score - current.score < 0.012
          ? current
          : ranked[0];
      return { ...best.motor, autoRank: best.rank };
    }

    function chooseVariant(owner, variation, cs, h) {
      const id = variantBookId(owner, variation);
      const book = state.variantBooks[id] || {
        rows: [],
        previous: null,
        autoRank: 1,
        combinations: [],
      };
      if (owner === "NUMBER") {
        const trigger = h.at(-1);
        const choices = [
          ...cs.map((m) => ({ motor: m, record: null })),
          ...book.combinations
            .filter((r) => validPlay(r.play))
            .map((record) => ({
              motor: {
                key: id + "::NUM@" + record.turn,
                rank: 0,
                play: record.play,
                score: record.play.score,
              },
              record,
            })),
        ];
        const ranked = choices
          .map((item) => {
            const record = item.record || {
              play: item.motor.play,
              covered: item.motor.play.numbers,
              turn: state.totalTurns,
              origin: trigger,
            };
            const comparison = compareNumberCombination(record, trigger, h);
            return { ...item, score: comparison.score };
          })
          .sort((a, b) => b.score - a.score || b.motor.score - a.motor.score);
        return {
          ...copy(ranked[0].motor),
          bankId: id,
          owner,
          variation,
          type: "NUMBER",
          trigger,
          sourceNumber: ranked[0].record?.origin ?? trigger,
          sourceTurn: ranked[0].record?.turn ?? state.totalTurns,
        };
      }
      variantEvaluationContext = book;
      try {
        const motor = chooseMotor({ rule: owner }, cs, book.previous);
        return { ...copy(motor), bankId: id, owner, variation };
      } finally {
        variantEvaluationContext = null;
      }
    }

    function activeVariationOwner() {
      return VARIANT_OWNERS.some((o) => o.id === state.strategy)
        ? state.strategy
        : null;
    }

    function settleVariantForecasts(forecasts, n, turn, before, block=currentBlock()) {
      for (const f of forecasts) {
        const book = variantBook(f.owner, f.variation),
          motorHits = {},
          rankHits = {};
        for (const m of f.motors) {
          const motorKey = m.family + "_" + m.radius;
          motorHits[motorKey] = unifiedMotor(m,block,f.bankId+":"+motorKey).play.numbers.includes(n);
          if (m.rank <= 4) rankHits[m.rank] = motorHits[motorKey];
        }
        book.rows.push({
          turn,
          motorHits,
          rankHits,
          entryHit: unifiedMotor(f.choice,block,f.bankId).play.numbers.includes(n),
          selectedKey: f.choice.key,
          spatialKeys: [...spatialRead(before).keys],
        });
        book.rows = book.rows.slice(-WINDOW);
        book.previous = f.choice.key;
        book.autoRank = f.choice.autoRank || book.autoRank;
        if (f.owner === "NUMBER") {
          const generated = f.motors[0];
          book.combinations.push({
            turn: turn - 1,
            origin: before.at(-1),
            play: copy(generated.play),
            covered: [...generated.play.numbers],
          });
          book.combinations = book.combinations.slice(-WINDOW);
        }
      }
    }

    function breakdown(strategy = null, mode = "CONGELADA") {
      const out = {
        CONTINUIDADE: { total: 0, hits: 0 },
        DESLOCAMENTO: { total: 0, hits: 0 },
        RUPTURA: { total: 0, hits: 0 },
      };
      for (const r of g1History(strategy, mode, 5000)) {
        const v = out[r.behavior];
        if (!v) continue;
        v.total++;
        if (r.hit) v.hits++;
      }
      return out;
    }
    /* ANÁLISES A CADA RESULTADO; RETIRADA DO HISTÓRICO EM BLOCOS DE DEZ. A entrada e o G1 comprometidos permanecem
   congelados. A avaliação de cada resultado usa somente a previsão anterior. */
    let blockRuntimeKey = null;
    let blockRuntimeData = null;
    let workerClient = null;
    let workerDisabled = false;
    let clientSequence = 0;
    let clientRequests = new Map();
    let inputQueue = [];
    let inputRunning = false;
    let saveTimer = null;
    let lastInputMs = 0;
    let durableTurn = 0;
    const geometryMemo = new Map();

    function geometry(weights, mandatory = []) {
      const key = weights.join(",") + "|" + mandatory.join(",");
      if (geometryMemo.has(key)) return copy(geometryMemo.get(key));
      const play = rawGeometry(weights, mandatory);
      geometryMemo.set(key, copy(play));
      if (geometryMemo.size > 160)
        geometryMemo.delete(geometryMemo.keys().next().value);
      return play;
    }

    function fresh() {
      return {
      structuralMemoryVersion: "6.6.15",
      coverageSize: 33,
      rotationEnabled:false,
      playLock:null,
      permanenceEnabled:false,
      permanenceSeed:[],
      permanence:{books:{},applied:null},
      rotation:{offset:0,center:null,distance:null,outcome:null,turn:null,status:"AGUARDANDO"},
      readingSide: typeof side !== "undefined" && side === "INVERTIDO" ? "INVERTIDO" : "NORMAL",
      analysisSourceOrder: "CHRONOLOGICAL",
      structuralMemoryEnabled: false,
      
      isolatedScores:{},isolatedLastTrios:{},balancedScores:{},colorRangeScores:{},
      complementScores:{},complementLastTrios:{},
      calibratedScores:{},calibratedLastTrios:{},
      followLiveScores:{green:0,total:0},
        forecastVersion: VERSION,
        history: [],
        historyTurns: [],
        sources: [],
        totalTurns: 0,
        manualCount: 0,
        manualLog: [],
        undoStack: [],
        strategy: "MASTER",importAudit:null,
      terminalManual:null,
      fixedTerminalTrio:null,
        masterChoice: null,
        masterHistory: [], masterLessons:[],masterReviews:[],importReanalyses:[],reanalysisPolicies:[],
        followEntryMemory: [], terminalEntryMemory: [], strategyEntryMemory: {}, followPreview: null,
        masterResumeTurn: 0,
        globalStrategyPrevious: null,
      followPreviousSelection: null,
      reorganizeTenEnabled: false,
      reorganizeTenDirection: typeof side !== "undefined" && side === "INVERTIDO" ? -1 : 1,
        postLossEnabled: false,
        postThreeEnabled: false,
      postOneAllEnabled: false,
      postTwoAllEnabled: false,
      recoveryUsed: {},
        postThreeUsed: {},
        strategyStreaks: {},
        focusTimelineId: null,
        rank: 3,
        manual: null,
        adaptive: "A05",
        created: [],
        activeCreated: null,
        g1: true,
        g1Trainer: true,
        galeSkip: false,
        secondHouse: false,
        stake: 1,
        multiplier: 1,
        phase: "ENTRY",
        cycle: null,
        defense: null,
        previous: null,
        trainerChoice: null,
        trainerTurns: 0,
        trainerChanges: 0,
        trainerPending: false,
        trainerHistory: [],
        numberChoice: null,
        numberChanges: 0,
        numberHistory: [],
        numberCombinations: [],
        numberComparisons: [],
        virtual: {},
        entryRows: [],
        g1Rows: [],
        g1Pending: [],
        realG1: [],
        decisions: [],
        ledger: [],
        variantBooks: {},
        variantSelections: {},
        strategyTimeline: {},
        timelineCycles: {},
        timelineFormat: 2,
        autoRows: [],
        autoRank: 1,
        groupsOpen: { trainers: true, originals: false },
        open: { general: true, timeline: true },
        block: {
          size: 0,
          pending: 0,
          revision: 0,
          anchor: [],
          decisionTurn: 0,
          data: null,
          best: null,
        },
      };
    }

    function normalizeState(data) {
      const r = fresh();
      for (const key of Object.keys(r))
        if (data?.[key] !== undefined) r[key] = data[key];
      r.history = cleanNumbers(r.history);
      for (const field of ["followEntryMemory","terminalEntryMemory"]) {
        r[field] = Array.isArray(r[field]) ? r[field].filter(row=>
          Number.isInteger(row?.turn) && Array.isArray(row.shape) && row.shape.length===3 &&
          row.shape.every(x=>Number.isInteger(x)&&Math.abs(x)<=18) &&
          Number.isInteger(row.next) && Math.abs(row.next)<=18).slice(-120) : [];
      }
      const rawEntryMemory=r.strategyEntryMemory;
      r.strategyEntryMemory={};
      if(rawEntryMemory && typeof rawEntryMemory==="object"){
        for(const [id,rows] of Object.entries(rawEntryMemory).filter(([id,rows])=>id!=="__proto__" && Array.isArray(rows)).slice(-48)){
          r.strategyEntryMemory[id]=rows.filter(row=>Number.isInteger(row?.turn) && Array.isArray(row.shape) &&
            row.shape.length===3 && row.shape.every(x=>Number.isInteger(x)&&Math.abs(x)<=18) &&
            Number.isInteger(row.next)&&Math.abs(row.next)<=18).slice(-120);
        }
      }
      if (!validPlay(r.followPreview?.play)) r.followPreview=null;
    r.fixedTerminalTrio=normalizeTerminalTrio(r.fixedTerminalTrio);
    const live=r.followLiveScores;
    if(!Number.isSafeInteger(live?.total)||!Number.isSafeInteger(live?.green)||live.green<0||live.total<live.green)
      r.followLiveScores={green:0,total:0};
    r.calibratedScores=Object.fromEntries(["FOLLOW_MASTER","TERMINAL_SUGGESTION"].flatMap(id=>{
      const v=r.calibratedScores?.[id];
      return v&&Number.isSafeInteger(v.total)&&v.total>=0&&Number.isSafeInteger(v.green)&&v.green>=0&&v.green<=v.total
        ?[[id,{total:v.total,green:v.green,exact:Number(v.exact)||0}]]:[];
    }));
    r.calibratedLastTrios=Object.fromEntries(["FOLLOW_MASTER","TERMINAL_SUGGESTION"].flatMap(id=>{
      const trio=normalizeTerminalTrio(r.calibratedLastTrios?.[id]);
      return trio?[[id,trio]]:[];
    }));
    r.complementScores=Object.fromEntries(["FOLLOW_MASTER","TERMINAL_SUGGESTION"].flatMap(id=>{
      const v=r.complementScores?.[id];
      return v&&Number.isSafeInteger(v.total)&&v.total>=0&&Number.isSafeInteger(v.green)&&v.green>=0&&v.green<=v.total
        ?[[id,{total:v.total,green:v.green,recovered:Number(v.recovered)||0,lost:Number(v.lost)||0}]]:[];
    }));
    r.complementLastTrios=Object.fromEntries(["FOLLOW_MASTER","TERMINAL_SUGGESTION"].flatMap(id=>{
      const trio=normalizeTerminalTrio(r.complementLastTrios?.[id]);
      return trio?[[id,trio]]:[];
    }));
    r.isolatedScores=Object.fromEntries(["FOLLOW_MASTER","TERMINAL_SUGGESTION"].flatMap(id=>{
      const v=r.isolatedScores?.[id];
      return v&&Number.isSafeInteger(v.total)&&v.total>=0&&Number.isSafeInteger(v.green)&&v.green>=0&&v.green<=v.total
        ?[[id,{total:v.total,green:v.green,exact:Number(v.exact)||0}]]:[];
    }));
    r.isolatedLastTrios=Object.fromEntries(["FOLLOW_MASTER","TERMINAL_SUGGESTION"].flatMap(id=>{
      const trio=normalizeTerminalTrio(r.isolatedLastTrios?.[id]);
      return trio?[[id,trio]]:[];
    }));
    r.permanenceEnabled=!!r.permanenceEnabled;
    r.permanenceSeed=cleanNumbers(r.permanenceSeed).slice(-70);
    if(!r.permanence||typeof r.permanence!=="object")r.permanence={books:{},applied:null};
    if(!r.permanence.books||typeof r.permanence.books!=="object")r.permanence.books={};
    if(r.permanence.applied&&!validPlay(r.permanence.applied.motor?.play))r.permanence.applied=null;
    if(r.permanence.session&&(![1,2,3,4,5].includes(r.permanence.session.period)||r.permanence.session.coverage!=="BLUE"))r.permanence.session=null;
    if(r.playLock&&!validPlay(r.playLock.motor?.play))r.playLock=null;
      if (r.history.length > 79) r.history = r.history.slice(-70);
      for (const field of [
        "historyTurns",
        "sources",
        "manualLog",
        "undoStack",
        "created",
        "trainerHistory",
        "numberHistory",
        "numberCombinations",
        "numberComparisons",
        "entryRows",
        "g1Rows",
        "g1Pending",
        "realG1",
        "decisions",
        "ledger",
        "autoRows",
        "masterHistory",
      "masterLessons","masterReviews","importReanalyses","reanalysisPolicies",])
        if (!Array.isArray(r[field])) r[field] = [];
      r.totalTurns = Math.max(
        Number(r.totalTurns) || 0,
        r.history.length,
        Number(r.ledger.at(-1)?.turn) || 0,
      );
      if (r.historyTurns.length !== r.history.length)
        r.historyTurns = r.history.map(
          (_, i) => r.totalTurns - r.history.length + i + 1,
        );
      if (r.sources.length !== r.history.length)
        r.sources = r.history.map(() => "HISTÓRICO");
      for (const field of [
        "variantBooks",
        "variantSelections",
        "strategyTimeline",
        "timelineCycles",
        "virtual",
        "groupsOpen",
        "postThreeUsed",
      "recoveryUsed",
        "strategyStreaks",
      ]) {
        if (!r[field] || typeof r[field] !== "object") r[field] = {};
      }
      if (data?.timelineFormat !== 2) {
        r.strategyTimeline = {};
        r.timelineCycles = {};
        r.timelineFormat = 2;
      }
      if (data?.postLossEnabled === undefined && r.strategy === "POSTLOSS")
        r.postLossEnabled = true;
      r.readingSide = r.readingSide === "INVERTIDO" ? "INVERTIDO" : "NORMAL";
    r.analysisSourceOrder = data.analysisSourceOrder ||
      (r.readingSide === "INVERTIDO" && data.coverageSize !== 33 ? "LEGACY_REVERSED_IMPORT" : "CHRONOLOGICAL");
    r.reorganizeTenEnabled = !!r.reorganizeTenEnabled;
    r.reorganizeTenDirection = r.reorganizeTenDirection === -1 ? -1 : 1;
    r.postLossEnabled = !!r.postLossEnabled;
      r.postThreeEnabled = !!r.postThreeEnabled;
    r.postOneAllEnabled = !!r.postOneAllEnabled;
    r.postTwoAllEnabled = !!r.postTwoAllEnabled;
      if (
        data?.forecastVersion !== VERSION &&
        data?.strategy === "TRAINER" &&
        !Object.prototype.hasOwnProperty.call(data, "masterResumeTurn")
      )
        r.strategy = "MASTER";
      r.masterResumeTurn = Math.max(0, Number(r.masterResumeTurn) || 0);
      if (r.cycle && !r.cycle.controller) r.cycle.controller = r.strategy;
      r.open = {
        general: r.open?.general !== false,
        timeline: r.open?.timeline !== false,
      };
      if (
        !r.block ||
        !Array.isArray(r.block.anchor) ||
        !Number.isInteger(r.block.size)
      ) {
        r.block = {
          size: Math.min(70, r.history.length),
          pending: 0,
          revision: 0,
          anchor: [...r.history],
          decisionTurn: r.totalTurns,
          data: null,
          best: null,
        };
      }
      r.block.size = clamp(r.block.size || r.history.length, 0, 70);
      r.block.pending = clamp(Number(r.block.pending) || 0, 0, 9);
    if (r.forecastVersion !== VERSION) {
      r.block.data = null;
      r.block.fixedForecasts = null;
      r.block.policyForecasts = null;
      r.block.best = null;
      r.followPreview = null;
    }
    r.forecastVersion = VERSION;
    r.rotationEnabled=!!r.rotationEnabled;
    r.rotation={...fresh().rotation,...(data.rotation||{})};
    if(!Number.isInteger(r.rotation.offset)||Math.abs(r.rotation.offset)>2)r.rotation.offset=0;
      if (data.coverageSize !== 33) {
      r.block.data = null;
      r.block.fixedForecasts = null;
      r.block.policyForecasts = null;
      r.block.best = null;
      r.undoStack = []; // Old geometry deltas cannot restore a 31-number bank.
    }
    r.coverageSize = 33;
    r.undoStack = r.undoStack.slice(-70);
      if (
        !VARIANT_OWNERS.some((o) => o.id === r.strategy) &&
        ![
          "MASTER",
          "FOLLOW_MASTER",
          "TERMINALS",
        "TERMINAL_SUGGESTION",
          "TRAINER",
          "POSTLOSS",
          "AUTO",
          "ADAPTIVE",
          "CREATED",
        ].includes(r.strategy)
      ) {
        r.strategy = "TRAINER";
        r.manual = null;
      }
    if(data.structuralMemoryVersion!=="6.6.15"){
      r.structuralMemoryVersion="6.6.15";
      r.block={...r.block,data:null};
    }

      return r;
    }

    function settings() {
      return Object.fromEntries(
        [
          "permanenceEnabled","rotationEnabled","terminalManual","fixedTerminalTrio","structuralMemoryEnabled","strategy","followPreviousSelection","reorganizeTenEnabled","reorganizeTenDirection","readingSide","analysisSourceOrder",
          "postLossEnabled",
          "postThreeEnabled",
        "postOneAllEnabled",
        "postTwoAllEnabled",
          "rank",
          "manual",
          "adaptive",
          "created",
          "activeCreated",
          "g1",
          "g1Trainer",
          "galeSkip",
          "secondHouse",
          "stake",
          "multiplier",
          "groupsOpen",
          "variantSelections",
        ].map((k) => [k, copy(state[k])]),
      );
    }

    function clearSpatialCaches() {
    motorReadings667.clear();
    triangleMemory666.clear();
      triangleCache.clear();
      spaceCache.clear();
      rawSpaceCache.clear();
      motorDiversityCache.clear();
      variantForecastCache.clear();
      blockRuntimeKey = null;
      blockRuntimeData = null;
    }

    function compactMotor(m) {
    if (["TERMINALS33","ROTATED33"].includes(m?.play?.kind)) return copy(m);
      const result = { readingVersion:"6.6.36", readingCandidates:37,};
      for (const field of [
        "key",
        "rank",
        "family",
        "radius",
        "score",
        "bankId",
        "owner",
        "variation",
        "autoRank",
        "type",
        "trigger",
        "sourceNumber",
        "sourceTurn",
      ])
        if (m[field] != null) result[field] = m[field];
      result.shape = signaturePlay(m.play);
      return result;
    }

    function expandMotor(m) {
    if (["TERMINALS33","ROTATED33"].includes(m?.play?.kind)) return copy(m);
      const { shape, ...motor } = m;
      return { ...motor, play: restoreShape(shape, m.score) };
    }

    

      // Só o Master/ranking acompanha os resultados no intervalo. Os centros de
  // cada candidata permanecem os mesmos até completar os dez lançamentos.
  function momentIsFixed(){
    return !state.importTrainingActive&&!!state.block.data&&Array.isArray(state.block.fixedForecasts);
  }
  function fixedMomentMotor(id){
    const item=state.block.fixedForecasts?.find(row=>row.id===id);
    return item?copy(item.motor):null;
  }
  function fixedSelectionId(){
    if(state.strategy==='TERMINALS')return 'TERMINALS';
    if(state.strategy==='AUTO')return 'RANK:'+state.rank;
    if(state.strategy==='ADAPTIVE')return 'ADAPTIVE:'+state.adaptive;
    if(state.strategy==='CREATED')return state.activeCreated;
    if(['TRAINER','NUMBER'].includes(state.strategy))return state.strategy;
    const owner=activeVariationOwner();
    if(owner){const variation=chosenVariation(owner);
      return state.variantSelections[owner]===-3?owner+'@THIRD':variation?variantBookId(owner,variation):'ORIGINAL:'+owner;
    }
    return 'ORIGINAL:'+state.strategy;
  }
  function freezeMomentForecasts(){
    // Esta função é chamada uma vez na importação e após cada dez números.
    // Não reproduz giros antigos e não altera o resultado de nenhuma entrada.
    state.block.fixedForecasts=null;
    const block=currentBlock();
    const forecasts=snapshotTimelineForecastsBase(block).filter(row=>!['MASTER','POSTLOSS','TRAINER','TERMINALS'].includes(row.id));
    state.block.policyForecasts=state.reanalysisPolicies.map(policy=>({
      id:policy.id,play:geometry(reanalysisWeights(state.block.anchor,policy.group,policy.level))
    }));
    state.block.fixedForecasts=forecasts;
    state.block.calibrations=(Number(state.block.calibrations)||0)+1;
    state.block.calibration={turn:state.totalTurns,startTurn:state.historyTurns[0]||1,
      size:state.block.anchor.length,interval:10,mode:'FIXED_TEN',replayed:false};
  }

  function reorganizedMotorReading(numbers, reorganize=state.reorganizeTenEnabled, sources=state.sources) {
    let received = [...numbers];
    if (state.readingSide === "INVERTIDO" && state.analysisSourceOrder === "LEGACY_REVERSED_IMPORT") {
      let imported = 0;
      while (imported < received.length && sources[imported] !== "TEMPO REAL") imported++;
      received = [...received.slice(0, imported).reverse(), ...received.slice(imported)];
    }
    if (!reorganize)
      return state.readingSide === "INVERTIDO" ? received.reverse() : received;
    const organized = [];
    const direction = state.readingSide === "INVERTIDO" ? -1 : 1;
    for (let start = 0; start < received.length; start += 10) {
      const block = received.slice(start, start + 10);
      block.sort((a, b) => direction * (a - b));
      organized.push(...block);
    }
    return organized;
  }

  function prepareBlock() {
    if (state.history.length < 8) return null;
    if (state.block.data && (!state.importTrainingActive || state.block.decisionTurn === state.totalTurns))
      return currentBlock();
    const received = state.history;
    // This is the same existing calibration, using a different order of known data.
    // Runs on import / the tenth new result. There is no extra backtest or engine.
    state.history = reorganizedMotorReading(received);
    try {
      const block = buildMomentBlock();
      state.block.reorganizedActive = !!state.reorganizeTenEnabled;
      state.block.reorganizedDirection = state.reorganizeTenDirection;
      return block;
    } finally {
      state.history = received;
      terminalBank();
    }
  }

  function buildMomentBlock() {
      if (state.history.length < 8) return null;
      if (state.block.data && (!state.importTrainingActive || state.block.decisionTurn === state.totalTurns))
        return currentBlock();
      state.block.fixedForecasts=null;
    state.block.policyForecasts=null;
    state.block.anchor = [...state.history].slice(-70);
    state.block.terminalMomentKey=null;
      state.block.decisionTurn = state.totalTurns;
      variantForecastCache.clear();
      const variants = allVariantForecasts(state.block.anchor),
        global = motors(state.block.anchor);
      state.block.data = {
        global: global.map(compactMotor),
        variants: variants.map((f) => ({
          bankId: f.bankId,
          owner: f.owner,
          name: f.name,
          variation: f.variation,
          motors: f.motors.map(compactMotor),
          choice: compactMotor(f.choice),
        })),
      };
      state.block.best = rankBestVariation();
      registerNumberCombination(state.block.anchor, state.totalTurns);
      updateNumberChoice();
      updateTrainer();
      blockRuntimeKey = null;
      freezeMomentForecasts();
      updateMaster(currentBlock());
      return currentBlock();
    }

    function currentBlock() {
      if (!state.block.data) return null;
      const key = state.block.revision + "|" + state.block.decisionTurn;
      if (blockRuntimeKey === key && blockRuntimeData) return blockRuntimeData;
      const data = state.block.data;
      blockRuntimeData = {
        global: data.global.map(expandMotor),
        variants: data.variants.map((f) => ({
          ...f,
          motors: f.motors.map(expandMotor),
          choice: expandMotor(f.choice),
        })),
      };
      blockRuntimeKey = key;
      return blockRuntimeData;
    }

    function selectedVariantForecast() {
      const owner = activeVariationOwner();
      if (!owner || chosenVariation(owner) === 0) return null;
      return (
        currentBlock()?.variants.find(
          (f) => f.owner === owner && f.variation === chosenVariation(owner),
        ) || null
      );
    }

    function chooseAutoMotor(cs, h = state.history) {
      if (variantEvaluationContext) return variantAutoChoice(cs);
      const ranked = cs
        .slice(0, 4)
        .map((motor, i) => {
          const rank = i + 1,
            rows = state.autoRows.slice(-30),
            recent = rows.slice(-5);
          const score =
            ((rows.filter((r) => r.hits[rank]).length + (4 * 33) / 37) /
              (rows.length + 4)) *
              0.6 +
            ((recent.filter((r) => r.hits[rank]).length + (2 * 33) / 37) /
              (recent.length + 2)) *
              0.4;
          return { motor, rank, score };
        })
        .sort((a, b) => b.score - a.score || a.rank - b.rank);
      if (!ranked.length) return null;
      const current = ranked.find((r) => r.rank === state.autoRank);
      const choice =
        current && ranked[0].score - current.score < 0.012
          ? current
          : ranked[0];
      return { ...choice.motor, autoRank: choice.rank };
    }

  // A memória guarda previsões e resultados observados, nunca o resultado
  // do giro que está sendo preparado. Cada lado tem seu próprio estado.
  let readingFollowLive = false;

  function followContext(h) {
    if (h.length < 3) return null;
    const [a,b,c] = h.slice(-3);
    return [direction(a,b),direction(b,c),distance(a,c)];
  }

  function recordFollowEntry(before, played, n, turn, result, controller) {
    if (!["GREEN","GALE"].includes(result) || !validPlay(played?.play)) return;
    const terminal=controller==="TERMINAL_SUGGESTION" &&
      !!played.terminalSuggestionTarget && terminalPlay(played.play);
    const follow=controller==="FOLLOW_MASTER" && !!played.followTarget;
    const shape=followContext(before);
    if (!shape) return;
    let entries=terminal?state.terminalEntryMemory:follow?state.followEntryMemory:null;
    if(!entries){
      const key=unifiedEntryKey(played);
      entries=state.strategyEntryMemory[key]||[];
      delete state.strategyEntryMemory[key];
      state.strategyEntryMemory[key]=entries;
      for(const old of Object.keys(state.strategyEntryMemory).slice(0,-48))delete state.strategyEntryMemory[old];
    }
    entries.push({turn,shape,next:direction(before.at(-1),n),
      hit:result==="GREEN",excluded:missing(played.play)});
    if (entries.length>120) entries.shift();
  }

  function followContextWeights(weights,before,basePlay,memory=state.followEntryMemory) {
    const shape=followContext(before);
    if (!shape) return {samples:0,protected:[]};
    const mass=Array(37).fill(0),hits=Array(37).fill(0),misses=Array(37).fill(0);
    let samples=0,total=0;
    for (const r of memory) {
      if (r.turn>state.totalTurns) continue;
      const [a,b,close]=r.shape;
      const d=Math.abs(a-shape[0])+Math.abs(b-shape[1])+Math.abs(close-shape[2]);
      if (Math.sign(a)!==Math.sign(shape[0]) || Math.sign(b)!==Math.sign(shape[1]) ||
          Math.abs(a-shape[0])>3 || Math.abs(b-shape[1])>3 || Math.abs(close-shape[2])>4) continue;
      const pos=mod(ix(before.at(-1))+r.next);
      const w=Math.exp(-d/6)*Math.exp(-(state.totalTurns-r.turn)/70);
      mass[pos]+=w; total+=w; samples++;
      (r.hit?hits:misses)[pos]++;
    }
    const protectedNumbers=[];
    if (samples>=3 && total>0) {
      const scale=avg(weights)||1;
      for (const n of missing(basePlay)) {
        const pos=ix(n);
        // Um caso isolado não entra. Inclui também os acertos na evidência
        // e exige pelo menos uma exclusão errada observada nesse salto.
        if (hits[pos]+misses[pos]<2 || !misses[pos]) continue;
        const share=mass[pos]/total;
        if (share<.25) continue;
        weights[pos]+=scale*.18*(samples/(samples+4))*Math.min(1,share/.5);
        protectedNumbers.push(n);
      }
    }
    return {samples,protected:protectedNumbers};
  }

  function followLiveWeights(m,h) {
    const parts=m.key?.match(/(RX_DINAMICO|RX_NORMAL|DINAMICO|NORMAL)_([456])$/);
    const family=m.family||parts?.[1], radius=m.radius||Number(parts?.[2]);
    if (!FAMILIES.includes(family)||!RADII.includes(radius)) return null;
    const base=weightsFor(h,family,radius);
    return m.owner && m.variation>=1 && m.variation<=8 && VARIANT_OWNERS.some(o=>o.id===m.owner)
      ? variantAnalyticalWeights(h,family,radius,m.owner,m.variation,base,spatialRead(h)) : base;
  }

  // Leitura comum da Indicação Master, aplicada à previsão de cada motor.
  // O motor continua escolhendo a família, a variação e os alvos do seu modo.
  let unifiedCacheState=null, unifiedCacheKey="", unifiedPlays=new Map(), unifiedPrefix=null;
  function unifiedEntryKey(m,id=null){
    if(m?.postLossTarget)return "PÓS:"+m.postLossTarget.kind+":"+m.postLossTarget.id;
    if(m?.masterTarget)return "MASTER:"+m.masterTarget.id;
    if(m?.globalStrategyTarget)return "TRAINER:"+m.globalStrategyTarget.id;
    if(id)return id;
    if(state.manual)return "MANUAL:"+state.manual;
    return fixedSelectionId();
  }
  function canRefreshUnified(block) {
    return state.readingSide==="INVERTIDO" && !state.importTrainingActive && !!block &&
      !state.playLock && !state.rotationEnabled && !state.permanenceEnabled && !state.secondHouse;
  }
  function syncUnifiedMoment(){
    const signature=JSON.stringify([state.totalTurns,state.block.decisionTurn,
      state.block.revision,state.block.reorganizedActive,state.analysisSourceOrder,state.structuralMemoryEnabled]);
    if(unifiedCacheState!==state || unifiedCacheKey!==signature){
      unifiedCacheState=state;unifiedCacheKey=signature;unifiedPlays=new Map();
      const before=state.history.slice(-WINDOW);
      unifiedPrefix={before,h:reorganizedMotorReading(before,state.block.reorganizedActive,state.sources.slice(-WINDOW)),weights:new Map()};
    }
  }
  function deriveUnifiedPlay(m,block,memory,terminal=false) {
    syncUnifiedMoment();
    const {before,h,weights:weightCache}=unifiedPrefix;
    let weights, method="PESOS DO MOTOR";
    const oldReading=readingFollowLive;
    readingFollowLive=true;
    try {
      const bankKey=m.bankId||"GLOBAL";
      const shapeKey=m.family && m.radius?"":coverageCode(m.play);
      const key=[m.key,bankKey,m.owner,m.variation,shapeKey].join("|");
      const stored=weightCache.get(key);
      if(stored){
        weights=stored.weights.slice();method=stored.method;
      }else{
        weights=followLiveWeights(m,h);
        if(!weights && ["UNION","CONSENSUS"].includes(m.key)){
          method="PESOS DA COMPOSIÇÃO";
          const bank=block.variants.find(f=>f.bankId===m.bankId)?.motors||block.global;
          const members=m.key==="UNION"?bank.slice(0,3):bank;
          weights=Array(37).fill(0);
          for(const member of members){
            const w=followLiveWeights(member,h),p=w?geometry(w):member.play;
            for(const n of p.numbers)weights[ix(n)]+=1/(1+member.rank*.1);
          }
          applySpatial(weights,h,.25);
        }
        if(!weights){
          method="COMBINAÇÃO HISTÓRICA + LEITURA ATUAL";
          weights=W.map(n=>m.play.numbers.includes(n)?1:.65);
          applySpatial(weights,h,.30);
        }
        weightCache.set(key,{weights:weights.slice(),method});
      }
      const pack=w=>terminal?packTerminalTrio(m.play.terminalDigits,w):geometry(w);
      const base=pack(weights);
      if(!validPlay(base))return null;
      const context=followContextWeights(weights,before,base,memory);
      const play=context.protected.length?pack(weights):base;
      if(!validPlay(play))return null;
      context.included=context.protected.filter(n=>play.numbers.includes(n));
      return {play,audit:{through:state.totalTurns,windowSize:before.length,method,
        previousExcluded:missing(m.play),excluded:missing(play),...context}};
    } finally {readingFollowLive=oldReading;}
  }

  function unifiedMotor(m,block=currentBlock(),id=null) {
    return applyBalancedWeight(unweightedUnifiedMotor(m,block,id));
  }
  function unweightedUnifiedMotor(m,block=currentBlock(),id=null) {
    if(!canRefreshUnified(block)||!validPlay(m?.play)||m.followReading||m.terminalReading)return m;
    const terminal=terminalPlay(m.play),route=unifiedEntryKey(m,id);
    const memory=m.followTarget?state.followEntryMemory:(state.strategyEntryMemory[route]||[]);
    const key=JSON.stringify([route,m.key,m.bankId,m.owner,m.variation,coverageCode(m.play),m.play.terminalDigits]);
    syncUnifiedMoment();
    const live=unifiedPlays.get(key);
    if(live)return {...m,play:live.play,score:live.play.score,unifiedReading:live.audit};
    const next=deriveUnifiedPlay(m,block,memory,terminal);
    if(!next)return m;
    unifiedPlays.set(key,next);
    return {...m,play:next.play,score:next.play.score,unifiedReading:next.audit};
  }

  function followPreviewKey(m) {
    return JSON.stringify([VERSION,state.totalTurns,state.block.revision,state.block.decisionTurn,
      state.block.reorganizedActive,state.analysisSourceOrder,state.structuralMemoryEnabled,
      m.followTarget.id,m.key,coverageCode(m.play)]);
  }

  function prepareFollowPreview(block=currentBlock()) {
    if (state.readingSide!=="INVERTIDO" || state.strategy!=="FOLLOW_MASTER" || state.importTrainingActive || !block) return;
    const m=followIndicationMotor(block,false);
    if (!m || terminalPlay(m.play)) {state.followPreview=null; return;}
    const key=followPreviewKey(m);
    if (state.followPreview?.key===key) return;
    const next=deriveUnifiedPlay(m,block,state.followEntryMemory);
    state.followPreview=next?{key,...next}:null;
  }

  function followPreviewMotor(m) {
    if (state.readingSide!=="INVERTIDO" || state.importTrainingActive ||
        state.playLock || state.rotationEnabled || state.permanenceEnabled ||
        state.secondHouse || terminalPlay(m.play)) return m;
    const p=state.followPreview;
    return p?.key===followPreviewKey(m) && validPlay(p.play)
      ? {...m,play:copy(p.play),score:p.play.score,followReading:copy(p.audit)} : m;
  }

  function adjustFollowG1(ranked,h) {
    if (ranked.length<2 || h.length<3) return ranked;
    const recon=ranked.find(o=>o.mode==="RECONSTRUÇÃO");
    const frozen=ranked.find(o=>o.mode==="CONGELADA");
    if (!recon || !frozen || coverageCode(recon.motor.play)===coverageCode(frozen.motor.play)) return ranked;
    const latest=spatialRead(h,true).weights, total=latest.reduce((a,b)=>a+b,0);
    const cover=o=>o.motor.play.numbers.reduce((s,n)=>s+latest[ix(n)],0)/total;
    const gain=cover(recon)-Math.max(...ranked.filter(o=>o!==recon).map(cover));
    const shifted=recon.behavior!=="CONTINUIDADE" || distance(h.at(-2),h.at(-1))>=10;
    if (!shifted || gain<=.002) return ranked;
    const bonus=Math.min(.04,2*gain);
    return ranked.map(o=>o===recon?{...o,score:o.score+bonus,reconstructionBonus:bonus,liveCoverageGain:gain}:o)
      .sort((a,b)=>b.score-a.score || b.numberTotal-a.numberTotal);
  }

    function followIndicationMotor(block = currentBlock(), usePreview = true) {
      if (!block) return null;
      const indication = state.block.best || masterRanking(block)[0];
      if (!indication) return null;
      const motor = masterCandidateMotor(indication, block);
      if (!validPlay(motor?.play)) return null;
      const indicated = {
        ...copy(motor),
        followTarget: {
          id: indication.id,
          name: indication.name,
          defenseStrategy: indication.resolvedId || motor.thirdTarget?.id || indication.id,
          decisionTurn: state.totalTurns,
          calibrationTurn: state.block.decisionTurn
        }
      };
      return usePreview ? followPreviewMotor(indicated) : indicated;
    }

    function followIndicationDefinition() {
      const target = state.cycle?.original?.followTarget || followIndicationMotor()?.followTarget;
      return {
        id: target?.defenseStrategy || "FOLLOW_MASTER",
        name: target ? "SEGUINDO INDICAÇÃO MASTER • " + target.name : "SEGUIR INDICAÇÃO MASTER • AGUARDANDO HISTÓRICO",
        type: "FOLLOW_MASTER"
      };
    }

    function activeDefinition() {
    if(state.playLock?.definition)return copy(state.playLock.definition);
    if (state.strategy === "TERMINAL_SUGGESTION") return terminalSuggestionDefinition();
    if (state.strategy === "TERMINALS") return terminalDefinition();
      if (
        state.strategy === "MASTER" &&
        !state.cycle &&
        masterRestRemaining() > 0 &&
        !priorityRecoveryChoice()
      )
        return {
          id: "MASTER",
          name: "MASTER • PAUSA • FALTAM " + masterRestRemaining() + " GIRO(S)",
          type: "MASTER",
        };
      const target = state.cycle
        ? state.cycle.original?.postLossTarget
        : priorityRecoveryChoice()?.motor?.postLossTarget;
      if (target)
        return {
          id: target.defenseStrategy || target.id,
          name:
            "JOGADA " + recoveryLabel(target) + " • " + target.name,
          type: "POSTLOSS",
        };
      if (
        state.cycle?.controller === "TRAINER" &&
        state.cycle.original?.globalStrategyTarget
      )
        return {
          id: "TRAINER",
          name:
            "TREINADOR GLOBAL • " +
            state.cycle.original.globalStrategyTarget.name,
          type: "GLOBAL_STRATEGY",
        };
      if (state.cycle?.controller === "FOLLOW_MASTER" || (!state.cycle && state.strategy === "FOLLOW_MASTER"))
        return followIndicationDefinition();
      if (state.cycle?.original?.masterTarget)
        return {
          id: state.cycle.strategy,
          name: "MASTER • " + state.cycle.original.masterTarget.name,
          type: "MASTER",
        };
      if (state.cycle)
        return (
          [...definitions(), ...trainerRanking()].find(
            (d) => d.id === state.cycle.strategy,
          ) || baseActiveDefinition()
        );
      return baseActiveDefinition();
    }

    function trainerRanking() {
      const candidates = [
        ...definitions(),
        ...(state.block.data?.variants || []).map(variant => ({
          id:variant.bankId, name:variant.name + " • V" + variant.variation,
          type:"VARIANT", owner:variant.owner, variation:variant.variation
        }))
      ];
      return candidates.map(definition => {
        const stats = masterCandidateStats(definition.id);
        return {...definition, total:stats.closedTotal, entries:stats.total,
          hits:stats.hits, loss:stats.loss, pending:stats.pending,
          recentDirect:stats.recentDirect, recentLoss:stats.recentLoss,
          lossStreak:stats.lossStreak, score:stats.score};
      }).sort((a,b) => Number(b.entries > 0)-Number(a.entries > 0) ||
        b.score-a.score || a.lossStreak-b.lossStreak || a.id.localeCompare(b.id));
    }

    function updateTrainer() {
      const ranked = trainerRanking();
      const best = ranked[0];
      if (!best) return;
      const current = ranked.find(candidate => candidate.id === state.trainerChoice);
      const margin = current && (current.recentLoss > 0 || current.pending > 0) ? .005 : .015;
      const selected = current && best.score-current.score < margin ? current : best;
      if (state.trainerChoice !== selected.id) {
        if (state.trainerChoice) state.trainerChanges++;
        state.trainerHistory.push({turn:state.totalTurns, from:state.trainerChoice || "INICIAL",
          to:selected.id, score:selected.score});
        state.trainerHistory = state.trainerHistory.slice(-70);
        state.trainerChoice = selected.id;
        state.trainerTurns = 0;
      }
    }

    function activeMotor(cs = currentBlock()?.global || [], balance=true) {
    if(state.playLock?.motor)return copy(state.playLock.motor);
    const motor=unweightedUnifiedMotor(activeMotorBase(cs));
    return permanenceMotor(applyRotation(balance?applyBalancedWeight(motor):motor));
  }

  function activeMotorBase(cs = currentBlock()?.global || []) {
    if (state.strategy === "TERMINAL_SUGGESTION") return terminalSuggestionMotor();
    if (state.strategy === "TERMINALS") return terminalMotor();
      const recovery = priorityRecoveryChoice();
      if (recovery) return copy(recovery.motor);
      if (
        state.strategy === "MASTER" &&
        !state.cycle &&
        masterRestRemaining() > 0
      )
        return null;
      if (state.manual)
        return cs.find((m) => m.key === state.manual) || cs[0] || null;
      if (state.postLossEnabled || state.strategy === "POSTLOSS") {
        const selected = postLossChoice();
        if (selected) return copy(selected.motor);
      }
      if (state.strategy === "POSTLOSS") return null;
      if (state.strategy === "MASTER")
        return copy(masterSelection()?.motor || null);
      if (state.strategy === "FOLLOW_MASTER") return followIndicationMotor();
    if (state.strategy === "TRAINER") return copy(independentGlobalMotor());
    if(momentIsFixed())return fixedMomentMotor(fixedSelectionId());
      if (state.variantSelections[activeVariationOwner()] === -3)
        return thirdVariationMotor(activeVariationOwner());
      const direct = selectedVariantForecast();
      if (direct) return copy(direct.choice);
      return motorForDefinition(baseActiveDefinition(), cs, state.previous);
    }

    function pruneRolling() {
      const cutoff = state.historyTurns[0] || 1;
      for (const field of [
        "ledger",
        "entryRows",
        "g1Rows",
        "numberCombinations",
        "numberComparisons",
        "numberHistory",
        "realG1",
        "decisions",
        "trainerHistory",
        "autoRows",
      ]) {
        state[field] = state[field].filter(
          (r) => Number.isFinite(r.turn) && r.turn >= cutoff,
        );
      }
      for (const b of Object.values(state.variantBooks)) {
        b.rows = b.rows.filter((r) => r.turn >= cutoff);
        b.combinations = b.combinations.filter((r) => r.turn >= cutoff - 1);
      }
    }

    function settleNativeStrategies(
      cs,
      numberBefore,
      n,
      turn,
      after,
      trigger,
      spatial,
    ) {
      settlePending(n, turn);
      const pending = [];
      for (const def of [...definitions(), { id: "NUMBER", type: "NUMBER" }]) {
        const v = virtualCycle(def.id);
        if (v.phase === "ENTRY") {
          const m = unifiedMotor(def.type === "NUMBER" ? numberBefore : chooseMotor(def, cs, v.previous),currentBlock(),def.id);
          if (!m) continue;
          v.previous = m.key;
          v.entryTrigger = trigger;
          v.spatialKeys = [...spatial.keys];
          if (m.play.numbers.includes(n)) {
            state.entryRows.push({
              turn,
              strategy: def.id,
              result: "GREEN",
              closed: true,
              motor: m.key,
              spatialKeys: [...spatial.keys],
              profit: profit("GREEN"),
            });
          } else {
            v.phase = "GALE";
            v.entry = copy(m);
            v.trigger = n;
            const options = defenses(m, n, after, def.id);
            for (const o of options)
              pending.push({
                eventId: def.id + "@" + turn,
                strategy: def.id,
                mode: o.mode,
                behavior: o.behavior,
                trigger: n,
                entryMotor: m.key,
                numbers: [...o.motor.play.numbers],
                uncovered: missing(o.motor.play),
                spatialKeys: [...spatialRead(after).keys],
              });
            const decision = chooseG1(m, n, after, def.id, !state.importTrainingActive);
            v.defense = decision?.motor || fineG1(m, n, after) || copy(m);
          }
        } else {
          const result = v.defense?.play.numbers.includes(n)
            ? "GREEN G1"
            : "LOSS";
          state.entryRows.push({
            turn,
            strategy: def.id,
            result,
            closed: true,
            motor: v.entry?.key,
            spatialKeys: copy(v.spatialKeys || []),
            profit: profit(result),
          });
          v.phase = "ENTRY";
          v.entry = null;
          v.defense = null;
          v.trigger = null;
        }
      }
      state.g1Pending = pending;
    }

    function recordedNumberClass(play, number) {
      if (!validPlay(play)) return "terminalNumberUncovered";
      const targets = rotationDisplayBlocks(play);
      if (targets.some(block => isBlueTarget(play,block) && block.numbers.includes(number)))
        return "terminalNumberNeighbour";
      if (targets.some(block => !isBlueTarget(play,block) && block.numbers.includes(number)))
        return "terminalNumberSingle";
      return "terminalNumberUncovered";
    }


    function spin(n, source = "HISTÓRICO") {
      if (!Number.isInteger(n) || n < 0 || n > 36)
        throw Error("NÚMERO INVÁLIDO");
      const before = [...state.history],
        turn = state.totalTurns + 1,
        trigger = before.at(-1);
      const block =
        before.length >= 8 ? currentBlock() || prepareBlock() : null;
    const isolated=source==="TEMPO REAL"?isolatedEntryMotor(block):null;
      const cs = block?.global || [],
        forecasts = block?.variants || [];
      const timelineForecasts = [...snapshotTimelineForecasts(block),...preparePermanenceForecasts(block)];
    const terminalSuggestionDraft=terminalSuggestionCandidates(block);
      const phaseBefore = state.phase,
        oldCycle = copy(state.cycle),
        definitionBefore = activeDefinition();
      const controller = oldCycle?.controller || state.strategy;
      const masterPaused =
        !state.playLock?.motor && state.strategy === "MASTER" &&
        state.phase === "ENTRY" &&
        masterRestRemaining() > 0 &&
        !priorityRecoveryChoice(block);
      const spatial = spatialRead(before.slice(-70)),
        after = [...before, n].slice(-70);
      let result = "AGUARDANDO",
        played = null;
    const masterReviewDraft=controller==='MASTER'&&phaseBefore==='ENTRY'&&!masterPaused&&block
      ?prepareMasterReview(timelineForecasts.filter(forecast=>!["TERMINALS","TERMINAL_SUGGESTION"].includes(forecast.id)),block):null;
      if (masterPaused) {
        result = "PAUSA MASTER";
      } else if (state.phase === "ENTRY") {
        const motor = activeMotor(cs);
        if (motor) {
          played = copy(motor);
        commitPermanence(motor,turn);
          state.previous = motor.key;
          if (motor.postLossTarget?.kind === "POST3")
            state.postThreeUsed[motor.postLossTarget.id] =
              motor.postLossTarget.lossTurn;
        if (["POST1ALL", "POST2ALL"].includes(motor.postLossTarget?.kind))
          state.recoveryUsed[motor.postLossTarget.kind + ":" + motor.postLossTarget.id] = motor.postLossTarget.lossTurn;
          state.cycle = {
            controller: state.strategy,
            strategy: definitionBefore.id,
            original: copy(motor),
            entryTurn: turn,
            entryTrigger: trigger,
            trigger: null,
            decision: null,
            triangleKey: triangleContext(before),
            spatialKeys: [...spatial.keys],
          };
          if (state.secondHouse) {
            state.defense = copy(motor);
            state.phase = "SECOND_SKIP";
            result = "2ª CASA";
          } else if (motorHit(motor,n)) {
            result = "GREEN";
            state.cycle = null;
          } else {
            result = "GALE";
            openRealGale(motor, n, after, turn);
          }
        }
      } else if (state.phase === "SECOND_SKIP") {
        played = copy(state.playLock?.motor||state.defense);
        result = "CASA PULADA";
        state.phase = "SECOND_ENTRY";
      } else if (state.phase === "SECOND_ENTRY") {
        played = copy(state.playLock?.motor||state.defense);
        if (motorHit(played,n)) {
          result = "GREEN";
          state.phase = "ENTRY";
          state.cycle = null;
          state.defense = null;
        } else {
          result = "GALE";
          openRealGale(played, n, after, turn);
        }
      } else if (state.phase === "GALE_SKIP") {
        played = copy(state.playLock?.motor||state.defense);
        result = "GALE PULADO";
        state.phase = "GALE";
      } else if (state.phase === "GALE") {
        played = copy(state.playLock?.motor||state.defense);
        result = motorHit(played,n) ? "GREEN G1" : "LOSS";
      settleSessionG1(oldCycle,n,turn);
        state.realG1.push({
          turn,
          strategy: state.cycle?.strategy,
          mode: state.cycle?.decision?.mode,
          behavior: state.cycle?.decision?.behavior,
          trigger: state.cycle?.trigger,
          outcome: n,
          result,
        });
        state.phase = "ENTRY";
        state.cycle = null;
        state.defense = null;
      }
      recordMasterCycle(controller, oldCycle, played, result, turn);
      settleTimelineForecasts(timelineForecasts, n, turn, before);
    advanceMasterReviews(masterReviewDraft,played,controller,oldCycle,result,n,turn,before);
      updateStrategyStreaks(turn);
      settleNativeStrategies(
        cs,
        block?.variants.find((f) => f.owner === "NUMBER")?.choice,
        n,
        turn,
        after,
        trigger,
        spatial,
      );
      settleVariantForecasts(forecasts, n, turn, before.slice(-70),block);
      const terminalHits=Object.fromEntries(terminalBank().map(motor=>[motor.key,unifiedMotor(motor,block,"TERMINALS:"+motor.key).play.numbers.includes(n)]));
    const motorHits = {};
      for (const m of cs) motorHits[m.key] = unifiedMotor(m,block,"MANUAL:"+m.key).play.numbers.includes(n);
      const hits = {};
      for (const m of cs.slice(0, 4)) hits[m.rank] = motorHits[m.key];
      if (cs.length) state.autoRows.push({ turn, hits });
      const postLossTarget = copy(
        oldCycle?.original?.postLossTarget || played?.postLossTarget || null,
      );
      const playRoute = played
        ? postLossTarget
          ? postLossTarget.kind === "POST3" ? "POST3LOSS"
          : ["POST1ALL", "POST2ALL"].includes(postLossTarget.kind) ? postLossTarget.kind : "POSTLOSS"
          : "NORMAL"
        : null;
      const modelHistory=state.block.data?state.block.anchor:before;
      const modelTurn=state.block.data?state.block.decisionTurn:turn-1;
      state.ledger.push({
      readingAudit: {
        version: VERSION, ordering: state.block.reorganizedActive
          ? (state.block.reorganizedDirection === -1 ? "DESCENDING_TEN" : "ASCENDING_TEN") : (state.readingSide === "INVERTIDO" ? "INVERSE_CHRONOLOGY" : "RECEIVED"),
        readingSide: state.readingSide, prefix: [...modelHistory].slice(-70), beforeTurn: modelTurn, evaluationBeforeTurn:turn-1,
        candidateCount: 37, chainMaximum:modelHistory.length, poleTolerances:19, polePairPositions:1369, arcWindowCount:modelHistory.length, relativeForms:1369, amplitudeForms:361, formsEvaluated:motorReadings667.summary(modelHistory).formsEvaluated, channelCount: motorReadings667.summary(modelHistory).channelCount,
        supportedGroups: motorReadings667.summary(modelHistory).groups.filter(group=>group.support>0).map(group=>group.name),
        coveredByMotors: Object.keys(motorHits).filter(key=>motorHits[key]),
        selectedBank: oldCycle?.original?.bankId||played?.bankId||"GLOBAL",
        bankAlternatives: [{bankId:"GLOBAL",coveredBy:cs.filter(motor=>motorHits[motor.key]).map(motor=>motor.key)},
          ...forecasts.map(forecast=>({bankId:forecast.bankId,coveredBy:forecast.motors.filter(motor=>unifiedMotor(motor,block,forecast.bankId+":"+motor.family+"_"+motor.radius).play.numbers.includes(n)).map(motor=>motor.key)}))],
        readingSupport: motorReadings667.candidate(modelHistory,n)?.historicalSupport||0,
        chosenCovered: played?.play ? motorHit(played,n) : null,
        followReading: copy(played?.followReading||null),
        unifiedReading: copy(played?.unifiedReading||null),
        lowNumberWeight:copy(played?.lowNumberWeight||null),
        note: "HIPÓTESES ENUMERADAS NÃO SÃO ACERTOS VIRTUAIS"
      },
        controller,
        followTarget: copy(oldCycle?.original?.followTarget || played?.followTarget || null),
        masterTarget: copy(
          oldCycle?.original?.masterTarget || played?.masterTarget || null,
        ),
        playRoute,
        postLossTarget,
        turn,
        number: n,
        source,
        trigger,
        strategy: oldCycle?.strategy || definitionBefore.id,
        motor: played?.key || "—",
        phase: phaseBefore,
        result,
        profit: profit(result),
        play: played?.play || null,
        spatialKeys: [...spatial.keys],
        terminalNumberClass: recordedNumberClass(played?.play, n),
        terminalSuggestionTarget: copy(played?.terminalSuggestionTarget||null),
        terminalReading: copy(played?.terminalReading||null),
      terminalCoverage:played?.terminalCoverage||"ALL",
      ...(state.fixedTerminalTrio?{terminalTrioKey:terminalTrioKey()}:{}),
      ...(currentTerminalCoverage()==="BLUE"?{terminalSuggestionBlueHits:Object.fromEntries(terminalSuggestionDraft.map(candidate=>[candidate.id,coverageHit(applyRotation(candidate.motor).play,n,"BLUE")]))}:{}),

        terminalSuggestionRule:terminalSuggestionRule(),
        terminalSuggestionHits:Object.fromEntries(terminalSuggestionDraft.map(candidate=>[candidate.id,applyRotation(candidate.motor).play.numbers.includes(n)])),
      motorHits,terminalHits,terminalRule:TERMINAL_LAYOUT_RULE,
        autoRank: played?.autoRank || null,
      });
      advancePermanenceClock();
    learnRotation(played,n,turn,phaseBefore,result);
    state.ledger[state.ledger.length-1].rotationApplied=copy(played?.rotationTarget||null);
    state.ledger[state.ledger.length-1].rotationNext=state.rotationEnabled?copy(state.rotation):null;
    if(before.length>=8)validateReanalysisPolicies(before,n,turn);
    if (["ENTRY","SECOND_ENTRY"].includes(phaseBefore))
      recordFollowEntry(before,played,n,turn,result,controller);
    state.totalTurns = turn;
      state.history.push(n);
      state.historyTurns.push(turn);
      state.sources.push(source);
      state.trainerTurns++;
      if (before.length >= 8) {
        state.block.pending++;
        if (state.block.pending === 10) {
          if (state.block.size) {
            state.history.splice(0, 10);
            state.historyTurns.splice(0, 10);
            state.sources.splice(0, 10);
          }
          state.block.pending = 0;
          state.block.revision++;
          state.block.anchor = [...state.history];
          state.block.decisionTurn = turn;
          state.block.data = null;
          blockRuntimeKey = null;
          blockRuntimeData = null;
          variantForecastCache.clear();
          pruneRolling();
          clearSpatialCaches();
          state.block.fixedForecasts=null;state.block.policyForecasts=null;
        }
      }

      // Durante o bloco as jogadas são fixas. O Master pode mudar de candidata.
    if(source==='HISTÓRICO'){
      state.block.data=null;
      state.block.fixedForecasts=null;
      blockRuntimeKey=null;blockRuntimeData=null;variantForecastCache.clear();
      state.block.best=null;
    }else if(state.block.data){
      updateTrainer();
      updateMaster(currentBlock());
    }
    terminalBank();
    if(isolated)settleIsolatedEntry(state.ledger.at(-1),isolated);
    return state.ledger.at(-1);
    }

    
function importFingerprint(value){
 const text=JSON.stringify(value);let hash=2166136261;
 for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
 return hash.toString(16).padStart(8,'0').toUpperCase();
}
function describeImport(numbers,opts){
 const config={};
 for(const key of ['rotationEnabled','structuralMemoryEnabled','readingSide','reorganizeTenEnabled','reorganizeTenDirection','strategy','postLossEnabled','postThreeEnabled','postOneAllEnabled','postTwoAllEnabled','rank','manual','adaptive',
 'created','activeCreated','g1','g1Trainer','galeSkip','secondHouse'])config[key]=copy(opts[key]);
 if(opts.fixedTerminalTrio)config.fixedTerminalTrio=copy(opts.fixedTerminalTrio);
 return {version:VERSION,count:numbers.length,oldest:numbers[0],newest:numbers.at(-1),
 historyId:importFingerprint(numbers),settingsId:importFingerprint(config),config};
}

function importNumbersCore(numbers, opts, manualLog = []) {
      state = { ...fresh(), ...opts, manualLog: copy(manualLog) };
      clearSpatialCaches();
      const clean = cleanNumbers(numbers).slice(-70);
state.importAudit=describeImport(clean,opts);
    state.permanenceSeed=[...clean];
      // A importação cresce até o tamanho escolhido; não descarta seu próprio histórico.
      state.block.size = 0;
      state.importTrainingActive=true;
    try{for (const n of clean) spin(n, "HISTÓRICO");}
    finally{state.importTrainingActive=false;}
    sealPermanenceSession();
      state.block = {
        size: clean.length,
        pending: 0,
        revision: state.block.revision + 1,
        anchor: [...state.history],
        decisionTurn: state.totalTurns,
        data: null,
        best: null,
      };
      clearSpatialCaches();
      prepareBlock();
    }

    function chosenVariation(owner) {
      const value = state.variantSelections[owner];
      if (value === -3) {
        if(momentIsFixed())return fixedMomentMotor(owner+'@THIRD')?.thirdTarget?.variation||0;
        const ranked = variationPerformance(owner);
        return ranked.some((r) => r.total) ? ranked[2].variation : 0;
      }
      return Number.isInteger(value) && value >= 0 && value <= 8 ? value : 1;
    }

    function motorForDefinition(def, cs, previous) {
      if (!def) return null;
      if (def.type === "VARIANT")
        return copy(
          currentBlock()?.variants.find((f) => f.bankId === def.id)?.choice ||
            null,
        );
      if (def.type === "NUMBER") return bestNumberCombination(state.history);
      return chooseMotor(def, cs, previous);
    }

    function variationPerformance(owner){
    return Array.from({length:8},(_,index)=>{
      const variation=index+1,stats=masterCandidateStats(variantBookId(owner,variation));
      return {...stats,variation,hits:stats.direct,rate:stats.total?stats.direct/stats.total:0};
    }).sort((a,b)=>Number(b.total>0)-Number(a.total>0)||b.score-a.score||a.lossStreak-b.lossStreak||a.variation-b.variation)
      .map((row,index)=>({...row,position:index+1}));
  }


    function timelineDefinitions() {
      return [
        { id: "MASTER", name: "TREINADOR GLOBAL MASTER" },
        { id: "TRAINER", name: "TREINADOR GLOBAL • ESTRATÉGIA" },
        { id: "POSTLOSS", name: "PÓS-LOSS" },
      terminalDefinition(),
      terminalSuggestionDefinition(),
        ...VARIANT_OWNERS.flatMap((o) => [
          {
            id: o.id === "NUMBER" ? "NUMBER" : "ORIGINAL:" + o.id,
            name: o.name + " • BASE",
          },
          { id: o.id + "@THIRD", name: o.name + " • 3º AUTOMÁTICO" },
          ...Array.from({ length: 8 }, (_, i) => ({
            id: variantBookId(o.id, i + 1),
            name: o.name + " • V" + (i + 1),
          })),
        ]),
        ...definitions()
          .filter((d) => d.type !== "ORIGINAL")
          .map((d) => ({ id: d.id, name: d.name })),
      ];
    }

    function updateVariantButtons() {
      const original = state.cycle?.original;
      const owner = original?.owner || activeVariationOwner();
      const variation = original?.variation ?? chosenVariation(owner);
      for (const b of document.querySelectorAll("[data-variant-owner]")) {
        b.classList.toggle(
          "active",
          b.dataset.variantOwner === owner &&
            Number(b.dataset.variant) === variation,
        );
      }
    }

    function timelineSamples(id) {
      const cutoff = state.historyTurns[0] || 1;
      return (state.strategyTimeline[id] || []).filter((r) => r.turn >= cutoff);
    }

    function snapshotTimelineForecasts(block) {
    const native=snapshotTimelineForecastsBase(block);
    const suggestion=terminalSuggestionMotor(block,native);
    if(suggestion)native.push({id:"TERMINAL_SUGGESTION",motor:suggestion,defenseStrategy:"TERMINAL_SUGGESTION"});
    return native.map(row=>({...row,motor:applyRotation(unifiedMotor(row.motor,block,row.id))}));
  }

  function snapshotTimelineForecastsBase(block) {
    if(momentIsFixed()){
      const fixed=copy(state.block.fixedForecasts).filter(row=>!['TRAINER','TERMINALS'].includes(row.id)), recovery=postLossChoice(block)?.motor;
      const trainer=independentGlobalMotor(block);
      const terminal=terminalMotor();
      if(validPlay(terminal?.play))fixed.push({id:'TERMINALS',motor:terminal,defenseStrategy:'TERMINALS'});
      if(validPlay(trainer?.play))fixed.push({id:'TRAINER',motor:copy(trainer),defenseStrategy:trainer.globalStrategyTarget?.id||'TRAINER'});
      if(validPlay(recovery?.play))fixed.push({id:'POSTLOSS',motor:copy(recovery),defenseStrategy:recovery.postLossTarget?.defenseStrategy||'POSTLOSS'});
      return fixed;
    }
      if (!block) return [];
      const forecasts = [];
      const append = (id, motor) => {
        if (validPlay(motor?.play))
          forecasts.push({
            id,
            motor: copy(motor),
            defenseStrategy:
              motor.postLossTarget?.defenseStrategy ||
              motor.thirdTarget?.id ||
              id,
          });
      };
      for (const def of definitions())
        append(
          def.id,
          chooseMotor(def, block.global, state.virtual[def.id]?.previous),
        );
      append("TERMINALS", terminalMotor());
    append("NUMBER", bestNumberCombination(state.history));
      for (const f of block.variants) append(f.bankId, f.choice);
      const trainer =
        trainerRanking().find((d) => d.id === state.trainerChoice) ||
        trainerRanking()[0];
      append("TRAINER", independentGlobalMotor(block));
      for (const owner of VARIANT_OWNERS)
        append(owner.id + "@THIRD", thirdVariationMotor(owner.id, block));
      append("POSTLOSS", postLossChoice(block)?.motor);
      return forecasts;
    }

    function settleTimelineForecasts(forecasts, n, turn, before) {
      const cutoff = state.historyTurns[0] || 1;
      const all = new Map(forecasts.map((f) => [f.id, f]));
      for (const id of Object.keys(state.timelineCycles))
        if (!all.has(id)) all.set(id, { id });
      for (const f of all.values()) {
        if (f.id === "MASTER") continue;
        const rows =
          state.strategyTimeline[f.id] || (state.strategyTimeline[f.id] = []);
        let cycle = state.timelineCycles[f.id];
        if (!cycle) {
          if (!validPlay(f.motor?.play)) continue;
          if (f.id === "TRAINER") state.globalStrategyPrevious = f.motor.key;
          cycle = {
            entry: copy(f.motor),
          permanencePeriod:f.permanencePeriod||0,
            defenseStrategy: f.defenseStrategy || f.id,
            config: {
              g1: state.g1,
              g1Trainer: state.g1Trainer,
              galeSkip: state.galeSkip,
              secondHouse: state.secondHouse,
            },
            phase: state.secondHouse ? "SECOND_SKIP" : "ENTRY",
            initialSkip: !!state.secondHouse,
          };
          state.timelineCycles[f.id] = cycle;
        }
        if (cycle.phase === "SECOND_SKIP") {
          if (cycle.initialSkip) cycle.initialSkip = false;
          else cycle.phase = "ENTRY";
          continue;
        }
        if (cycle.phase === "GALE_SKIP") {
          cycle.phase = "GALE";
          continue;
        }
        if (cycle.phase === "GALE") {
          const row = rows.find((r) => r.turn === cycle.turn);
          if (row) {
            row.result = motorHit(cycle.defense,n)
              ? "GREEN G1"
              : "LOSS";
            row.closed = true;
            row.closedTurn = turn;
          }
          if(cycle.permanenceOptions)for(const option of cycle.permanenceOptions)state.g1Rows.push({
            turn,eventId:f.id+"@"+cycle.turn,strategy:f.id,mode:option.mode,behavior:option.behavior,
            trigger:cycle.failureTrigger,outcome:n,hit:option.motor.play.numbers.includes(n),
            spatialKeys:[...spatialRead(before).keys]});
          delete state.timelineCycles[f.id];
        } else if (motorHit(cycle.entry,n)) {
          rows.push({ turn, result: "GREEN", closed: true, closedTurn: turn });
          delete state.timelineCycles[f.id];
        } else {
          rows.push({ turn, result: "GREEN G1", closed: false });
          cycle.turn = turn;
          const h = [...before, n].slice(-70),
            config = cycle.config;
          const independent=cycle.permanencePeriod?sessionG1Decision(cycle.entry,n,h,turn):null;
        const decision = independent || (cycle.permanencePeriod>1
          ? {motor:copy(cycle.entry),mode:"CONGELADA"}
          : config.g1Trainer
            ? chooseG1(cycle.entry, n, h, cycle.defenseStrategy || f.id, !state.importTrainingActive)
            : {
                motor: config.g1
                  ? fineG1(cycle.entry, n, h)
                  : copy(cycle.entry),
              });
          if(cycle.permanencePeriod&&!independent){
          cycle.failureTrigger=n;
          cycle.permanenceOptions=cycle.permanencePeriod>1
            ? [{mode:"CONGELADA",behavior:"CONTINUIDADE",motor:copy(cycle.entry)}]
            : defenses(cycle.entry,n,h,f.id);
        }
        cycle.defense = copy(decision?.motor || cycle.entry);
        if(terminalPlay(cycle.defense?.play))cycle.defense.terminalCoverage=cycle.entry.terminalCoverage||"ALL";
          cycle.phase = config.galeSkip ? "GALE_SKIP" : "GALE";
        }
        state.strategyTimeline[f.id] = rows
          .filter((r) => r.turn >= cutoff)
          .slice(-79);
      }
    }
    /* O terceiro é uma posição acompanhada dentro do proprietário, não uma V fixa. */
    function thirdVariationMotor(owner, block = currentBlock()) {
    if(momentIsFixed())return fixedMomentMotor(owner+"@THIRD");
      const ranked = variationPerformance(owner);
      if (!ranked.some((r) => r.total)) return null;
      const variation = ranked[2].variation;
      const forecast = block?.variants.find(
        (f) => f.owner === owner && f.variation === variation,
      );
      return forecast
        ? {
            ...copy(forecast.choice),
            thirdTarget: { owner, variation, id: forecast.bankId },
          }
        : null;
    }

    function timelineMotor(id, block = currentBlock()) {
    return applyRotation(timelineMotorBase(id,block));
  }

  function timelineMotorBase(id, block = currentBlock()) {
    if(id === "TERMINAL_SUGGESTION") return terminalSuggestionMotor(block);
    if(id === "TERMINALS") return terminalMotor();
    if(momentIsFixed()&&!["MASTER","POSTLOSS","TRAINER"].includes(id))return fixedMomentMotor(id);
      if (!block) return null;
      if (id.endsWith("@THIRD"))
        return thirdVariationMotor(id.slice(0, -6), block);
      if (id === "MASTER") return masterSelection(block)?.motor || null;
      if (id === "TRAINER") return independentGlobalMotor(block);
      if (id === "NUMBER") return bestNumberCombination(state.history);
      const variant = block.variants.find((f) => f.bankId === id);
      if (variant) return copy(variant.choice);
      const definition = definitions().find((d) => d.id === id);
      return definition
        ? chooseMotor(definition, block.global, state.virtual[id]?.previous)
        : null;
    }

    /* Só ciclos encerrados antes da decisão entram na comparação.
   O próximo ciclo depois de cada LOSS fornece uma observação pós-loss. */
    function postLossStats(id) {
      const rows = timelineSamples(id)
        .filter((r) => r.closed && r.closedTurn <= state.totalTurns)
        .sort((a, b) => a.turn - b.turn);
      const following = [];
      for (let i = 1; i < rows.length; i++)
        if (
          rows[i - 1].result === "LOSS" &&
          rows[i].turn > rows[i - 1].closedTurn
        ) {
          following.push(rows[i]);
        }
      const recoveries = following.filter((r) => r.result !== "LOSS").length;
      const repeatLoss = following.length - recoveries;
      const direct = following.filter((r) => r.result === "GREEN").length;
      const recent = following.slice(-5),
        recentHits = recent.filter((r) => r.result !== "LOSS").length;
      const base = 33 / 37;
      const recovery = (recoveries + 4 * base) / (following.length + 4);
      const short = (recentHits + 3 * base) / (recent.length + 3);
      const first = (direct + 3 * base) / (following.length + 3);
      let streak = 0;
      for (let i = rows.length - 1; i >= 0 && rows[i].result === "LOSS"; i--)
        streak++;
      return {
        samples: following.length,
        recoveries,
        repeatLoss,
        direct,
        streak,
        score:
          recovery * 0.55 +
          short * 0.3 +
          first * 0.15 -
          (0.25 * repeatLoss) / (following.length + 4) -
          0.025 * Math.max(0, streak - 1),
        last: rows.at(-1) || null,
      };
    }

    function postLossRanking(block = currentBlock()) {
      if (!block) return [];
      return definitions()
        .filter((d) => d.type === "ADAPTIVE")
        .map((def) => {
          const stats = postLossStats(def.id);
          const justLost =
            stats.last?.result === "LOSS" &&
            stats.last.closedTurn === state.totalTurns;
          const eligible = justLost; // Sem mínimo de ciclos ou validação para entrar.
          return { ...def, ...stats, justLost, eligible };
        })
        .filter((r) => r.justLost)
        .sort(
          (a, b) =>
            Number(b.eligible) - Number(a.eligible) ||
            b.score - a.score ||
            b.samples - a.samples ||
            a.id.localeCompare(b.id),
        );
    }

    function postLossChoice(block = currentBlock()) {
      for (const candidate of postLossRanking(block)) {
        if (!candidate.eligible) continue;
        const motor = timelineMotor(candidate.id, block);
        if (validPlay(motor?.play))
          return {
            ...candidate,
            motor: {
              ...copy(motor),
              postLossTarget: {
                id: candidate.id,
                name: candidate.name,
                lossTurn: candidate.last.closedTurn,
                samples: candidate.samples,
                recoveries: candidate.recoveries,
                repeatLoss: candidate.repeatLoss,
                score: candidate.score,
                defenseStrategy: motor.thirdTarget?.id || candidate.id,
              },
            },
          };
      }
      return null;
    }

    function trainerBaseDefinition() {
      return (
        trainerRanking().find((d) => d.id === state.trainerChoice) ||
        trainerRanking()[0] ||
        definitions()[0]
      );
    }

    function baseActiveDefinition() {
    if (state.strategy === "TERMINAL_SUGGESTION") return terminalSuggestionDefinition();
    if (state.strategy === "TERMINALS") return terminalDefinition();
      const owner = activeVariationOwner(),
        defs = definitions();
      if (state.strategy === "FOLLOW_MASTER") return followIndicationDefinition();
      if (state.strategy === "POSTLOSS")
        return {
          id: "POSTLOSS",
          name: "PÓS-LOSS • AGUARDANDO LOSS DAS ADAPTATIVAS",
          type: "POSTLOSS",
        };
      if (owner && !state.manual) {
        const variation = chosenVariation(owner),
          name = VARIANT_OWNERS.find((o) => o.id === owner).name;
        if (variation === 0)
          return owner === "NUMBER"
            ? { id: "NUMBER", name, type: "NUMBER" }
            : { ...defs.find((d) => d.id === "ORIGINAL:" + owner), name };
        return {
          id: variantBookId(owner, variation),
          name:
            name +
            (state.variantSelections[owner] === -3 ? " • 3º AUTOMÁTICO" : "") +
            " • V" +
            variation,
          type: "VARIANT",
          owner,
          variation,
        };
      }
      if (state.strategy === "MASTER") {
        const chosen = masterSelection();
        return chosen
          ? {
              id: chosen.motor.masterTarget.defenseStrategy,
              name: "MASTER • " + chosen.name,
              type: "MASTER",
            }
          : {
              id: "MASTER",
              name: "MASTER • AGUARDANDO HISTÓRICO",
              type: "MASTER",
            };
      }
      if (state.strategy === "TRAINER")
        return {
          id: "TRAINER",
          name: "TREINADOR GLOBAL • " + trainerBaseDefinition().name,
          type: "GLOBAL_STRATEGY",
        };
      if (state.strategy === "AUTO")
        return defs.find((d) => d.id === "RANK:" + state.rank) || defs[0];
      if (state.strategy === "ADAPTIVE")
        return (
          defs.find((d) => d.id === "ADAPTIVE:" + state.adaptive) || defs[0]
        );
      if (state.strategy === "CREATED")
        return defs.find((d) => d.id === state.activeCreated) || defs[0];
      return defs[0];
    }

    function resultGroups(rows) {
      return {
        normal: rows.filter(r => r.playRoute === "NORMAL"),
        postLoss: rows.filter(r => r.playRoute === "POSTLOSS"),
        postOneAll: rows.filter(r => r.playRoute === "POST1ALL"),
        postTwoAll: rows.filter(r => r.playRoute === "POST2ALL"),
        postThree: rows.filter(r => r.playRoute === "POST3LOSS"),
        combined: rows,
        legacy: rows.filter(r => !["NORMAL","POSTLOSS","POST1ALL","POST2ALL","POST3LOSS"].includes(r.playRoute))
      };
    }

    function masterRestRemaining() {
      return Math.max(
        0,
        (Number(state.masterResumeTurn) || 0) - (state.totalTurns + 1),
      );
    }
  /* Cada lado mantém seu próprio ranking, avaliações e memória de decisões.
     Revisões usam somente jogadas registradas ANTES dos resultados. */
  function bestMasterVariation(owner, block=currentBlock()) {
    if(!block)return null;
    for(const position of variationPerformance(owner)){
      const forecast=block.variants.find(f=>f.owner===owner&&f.variation===position.variation);
      if(validPlay(forecast?.choice?.play))return {id:forecast.bankId,
        name:(VARIANT_OWNERS.find(o=>o.id===owner)?.name||owner)+' • V'+position.variation,
        owner,variation:position.variation,performancePosition:position.position,
        performanceScore:position.score};
    }
    return null;
  }

  function masterCandidateMotor(definition,block=currentBlock()){
    const id=definition.resolvedId||definition.id;
    return timelineMotor(id,block);
  }

  /* Reanálise supervisionada da importação. Hipóteses são definidas pelo
     prefixo; o resultado conhecido apenas avalia as tentativas depois.
     O ajuste retrospectivo nunca conta como validação prospectiva. */
  const REANALYSIS_COMPONENTS = ['triangle','chain','pole','arc','route','recent'];
  const REANALYSIS_LEVELS = [.35,.55,.75,.90];
  function reanalysisWeights(prefix, group, level) {
    const h=prefix.slice(-70), reading=spatialRead(h,true);
    const recent=Array(37).fill(.1);
    for(let age=0;age<h.length;age++){
      const mass=Math.exp(-age/12);
      for(let j=0;j<37;j++)recent[j]+=mass*Math.exp(-distance(W[j],h[h.length-1-age])/2);
    }
    const components=[...reading.components,normalizeSpace(recent)];
    const selected=components[group], strength=REANALYSIS_LEVELS[level];
    const reference=normalizeSpace(reading.weights);
    return normalizeSpace(reference.map((v,j)=>Math.max(.001,v*(1-strength)+selected[j]*strength)));
  }
  function reanalysisKey(group,level){return 'REVIEW:'+group+':'+level;}
  function validateReanalysisPolicies(prefix,number,turn){
    for(const policy of state.reanalysisPolicies){
      if(policy.createdTurn>=turn)continue;
      const play=momentIsFixed()?state.block.policyForecasts?.find(row=>row.id===policy.id)?.play
        :geometry(reanalysisWeights(prefix,policy.group,policy.level));
      if(!validPlay(play))continue;
      const hit=play.numbers.includes(number);
      policy.evaluations++;
      if(hit)policy.hits++;
      policy.lastEvaluation={beforeTurn:turn-1,turn,number,hit};
    }
  }
  function applyReanalysisMemory(weights,h){
    if(!state.reanalysisPolicies?.length)return weights;
    const base=33/37, mean=avg(weights)||1;
    for(const policy of state.reanalysisPolicies){
      // Só resultados POSTERIORES à descoberta autorizam influência.
      if(policy.evaluations<4)continue;
      const estimate=(policy.hits+base*8)/(policy.evaluations+8);
      const strength=Math.min(.12,Math.max(0,estimate-base)*policy.evaluations/(policy.evaluations+8));
      if(!strength)continue;
      const proposal=reanalysisWeights(h,policy.group,policy.level);
      for(let j=0;j<37;j++)weights[j]=Math.max(.001,weights[j]+mean*strength*(proposal[j]-1));
    }
    return weights;
  }
  function reviseImportedMasterLoss(review,turn){
    if(!review.imported || review.actualResult!=='LOSS')return null;
    const results=review.observations||[];
    const entryIndex=results.findIndex(row=>row.phase==='ENTRY');
    if(entryIndex<0)return null;
    const entryOutcome=results[entryIndex];
    const prefix=results[entryIndex].prefix;
    const attempts=[];let solution=null;
    // 6 leituras x 4 intensidades. Sem deslocamento escolhido pelo resultado,
    // sem adicionar o número revelado aos pesos ou como número obrigatório.
    for(let level=0;level<4&&!solution;level++){
      for(let group=0;group<6&&!solution;group++){
        const weights=reanalysisWeights(prefix,group,level);
        const play=geometry(weights);
        if(!validPlay(play))continue;
        let simulated=play.numbers.includes(entryOutcome.number)?'GREEN':null;
        let defense=null;
        if(!simulated){
          const gale=results.slice(entryIndex+1).find(row=>row.phase==='GALE');
          if(gale){
            const failureHistory=[...prefix,entryOutcome.number].slice(-70);
            const original={key:reanalysisKey(group,level),play};
            // Reconstrói a defesa somente com informação até a falha da entrada.
            const savedRows=state.g1Rows;
            state.g1Rows=savedRows.filter(row=>row.turn<entryOutcome.turn);
            try{
              const config=review.config;
              const decision=config.g1Trainer?chooseG1(original,entryOutcome.number,failureHistory,'MASTER')
                :{motor:config.g1?fineG1(original,entryOutcome.number,failureHistory):original};
              defense=decision?.motor?.play||play;
              simulated=defense.numbers.includes(gale.number)?'GREEN G1':'LOSS';
            }finally{state.g1Rows=savedRows;}
          }else simulated='LOSS';
        }
        const attempt={id:reanalysisKey(group,level),component:REANALYSIS_COMPONENTS[group],
          group,level,strength:REANALYSIS_LEVELS[level],result:simulated,
          entryShape:signaturePlay(play),defenseShape:defense?signaturePlay(defense):null};
        attempts.push(attempt);
        if(simulated!=='LOSS')solution=attempt;
      }
    }
    const record={id:'REANALYSIS@'+review.turn,turn:review.turn,closedTurn:turn,
      beforeTurn:review.beforeTurn,originalResult:'LOSS',selectedId:review.selectedId,
      prefix:[...prefix],observedAfter:results.map(row=>({turn:row.turn,number:row.number,phase:row.phase})),
      status:solution?'REVISED':'UNSOLVED',result:solution?.result||'LOSS',attempts,
      solution:solution?{...solution}:null,retrospective:true,validated:false,
      meaning:'TREINAMENTO REVISADO DEPOIS DO RESULTADO; NÃO É PREVISÃO COMPROVADA'};
    state.importReanalyses.push(record);
    state.importReanalyses=state.importReanalyses.slice(-120);
    if(solution&&!state.reanalysisPolicies.some(policy=>policy.id===solution.id)){
      state.reanalysisPolicies.push({id:solution.id,group:solution.group,level:solution.level,
        createdTurn:turn,evaluations:0,hits:0,lastEvaluation:null});
    }
    return record;
  }

  function masterLessonStats(id){
    const keys=spatialRead(state.history.slice(-70)).keys;
    let support=0,reward=0,count=0,direct=0,g1=0,loss=0;
    for(const lesson of state.masterLessons){
      if(lesson.closedTurn>state.totalTurns||!Object.prototype.hasOwnProperty.call(lesson.outcomes,id))continue;
      const value=lesson.outcomes[id];
      const similarity=.25+.75*spatialMatch(lesson.spatialKeys,keys);
      const recency=Math.exp(-Math.max(0,state.totalTurns-lesson.closedTurn)/70);
      const weight=similarity*recency;
      support+=weight;reward+=weight*(value===2?1:value===1?.55:0);count++;
      if(value===2)direct++;else if(value===1)g1++;else loss++;
    }
    const prior=33/37;
    return {count,support,direct,g1,loss,score:(reward+prior*8)/(support+8)};
  }

  function prepareMasterReview(forecasts,block){
    const definitions=masterDefinitions(block);
    const alternatives=forecasts.filter(f=>f.id!=='POSTLOSS'&&validPlay(f.motor?.play)).map(f=>{
      const definition=definitions.find(d=>d.id===f.id);
      const motor=f.motor;
      return {id:f.id,entry:copy(motor),defenseStrategy:definition?.resolvedId||f.defenseStrategy||f.id,
        phase:state.secondHouse?'SECOND_SKIP':'ENTRY',initialSkip:!!state.secondHouse,result:null};
    });
    return {version:'6.6.36',turn:state.totalTurns+1,beforeTurn:state.totalTurns,
      imported:!!state.importTrainingActive,observations:[],
      prefix:[...state.history].slice(-70),spatialKeys:[...spatialRead(state.history.slice(-70)).keys],
      config:{g1:state.g1,g1Trainer:state.g1Trainer,galeSkip:state.galeSkip,secondHouse:state.secondHouse},
      forecastFingerprint:importFingerprint(alternatives.map(a=>[a.id,signaturePlay(a.entry.play)])),
      alternatives,actualResult:null,selectedId:null};
  }

  function stepMasterAlternative(alternative,review,n,turn,before){
    if(alternative.result)return;
    if(alternative.phase==='SECOND_SKIP'){
      if(alternative.initialSkip)alternative.initialSkip=false;
      else alternative.phase='ENTRY';
      return;
    }
    if(alternative.phase==='GALE_SKIP'){alternative.phase='GALE';return;}
    if(alternative.phase==='GALE'){
      alternative.result=alternative.defense.play.numbers.includes(n)?'GREEN G1':'LOSS';
      alternative.closedTurn=turn;return;
    }
    if(alternative.entry.play.numbers.includes(n)){
      alternative.result='GREEN';alternative.closedTurn=turn;return;
    }
    const history=[...before,n].slice(-70),config=review.config;
    const existing=state.timelineCycles[alternative.id];
    const reusable=existing?.turn===turn&&validPlay(existing.defense?.play)&&
      ['g1','g1Trainer','galeSkip','secondHouse'].every(key=>existing.config?.[key]===config[key])&&
      (existing.defenseStrategy||alternative.id)===alternative.defenseStrategy&&
      signaturePlay(existing.entry.play)===signaturePlay(alternative.entry.play);
    const decision=reusable?{motor:existing.defense}:config.g1Trainer
      ?chooseG1(alternative.entry,n,history,alternative.defenseStrategy,!state.importTrainingActive)
      :{motor:config.g1?fineG1(alternative.entry,n,history):copy(alternative.entry)};
    alternative.defense=copy(decision?.motor||alternative.entry);
    alternative.phase=config.galeSkip?'GALE_SKIP':'GALE';
  }

  function advanceMasterReviews(draft,played,controller,oldCycle,result,n,turn,before){
    if(draft&&played){
      draft.selectedId=played.postLossTarget?.id||played.masterTarget?.id||null;
      state.masterReviews.push(draft);
    }
    const actualStart=oldCycle?.entryTurn||turn;
    for(const review of state.masterReviews){
      if(review.imported){
        const first=review.alternatives.find(a=>a.id===review.selectedId)||review.alternatives[0];
        review.observations.push({turn,number:n,prefix:[...before].slice(-70),
          phase:first?.phase==='GALE'?'GALE':['ENTRY','SECOND_ENTRY'].includes(first?.phase)?'ENTRY':first?.phase});
      }
      for(const alternative of review.alternatives)stepMasterAlternative(alternative,review,n,turn,before);
      if(controller==='MASTER'&&review.turn===actualStart&&['GREEN','GREEN G1','LOSS'].includes(result)){
        review.actualResult=result;review.actualClosedTurn=turn;
      }
    }
    const remaining=[];
    for(const review of state.masterReviews){
      if(!review.actualResult||review.alternatives.some(a=>!a.result)){remaining.push(review);continue;}
      reviseImportedMasterLoss(review,turn);
      const outcomes={};
      for(const a of review.alternatives)outcomes[a.id]=a.result==='GREEN'?2:a.result==='GREEN G1'?1:0;
      state.masterLessons.push({version:review.version,turn:review.turn,beforeTurn:review.beforeTurn,
        closedTurn:turn,actualClosedTurn:review.actualClosedTurn,actualResult:review.actualResult,
        selectedId:review.selectedId,spatialKeys:review.spatialKeys,forecastFingerprint:review.forecastFingerprint,
        outcomes,entryWinners:Object.keys(outcomes).filter(id=>outcomes[id]===2),
        defenseWinners:Object.keys(outcomes).filter(id=>outcomes[id]===1)});
    }
    state.masterReviews=remaining;
    // Memória separada da janela: o descarte de dez não apaga as lições.
    state.masterLessons=state.masterLessons.slice(-120);
  }

  function masterVariationScore(id,baseScore){
    const lesson=masterLessonStats(id),weight=.20*lesson.support/(lesson.support+8);
    return baseScore*(1-weight)+lesson.score*weight;
  }

    /* Nota comparativa, não probabilidade do próximo giro.
     GREEN=1; G1 confirmado=.45; G1 pendente=.15; LOSS final=-1.
     Últimas 5/15/30 entradas pesam 60%/25%/15%, respectivamente.
     Dentro de cada janela, resultados recentes recebem maior peso.
     Uma perda pendente nunca é contada como LOSS final. */
  function masterCandidateStats(id){
    const rows=timelineSamples(id).filter(row=>Number.isFinite(row.turn)&&row.turn<=state.totalTurns)
      .slice().sort((a,b)=>a.turn-b.turn).slice(-30);
    const closed=row=>row.closed&&Number(row.closedTurn??(row.result==='GREEN'?row.turn:Infinity))<=state.totalTurns;
    const reward=row=>row.result==='GREEN'&&closed(row)?1:closed(row)&&row.result==='GREEN G1'?.45:closed(row)&&row.result==='LOSS'?-1:.15;
    function windowScore(limit,decay){
      const sample=rows.slice(-limit);let mass=0,value=0;
      for(let index=0;index<sample.length;index++){
        const weight=Math.exp(-(sample.length-1-index)/decay);
        mass+=weight;value+=weight*reward(sample[index]);
      }
      return (value+.5*1.5)/(mass+1.5);
    }
    const finished=rows.filter(closed),recent=rows.slice(-5);
    const direct=finished.filter(row=>row.result==='GREEN').length;
    const g1=finished.filter(row=>row.result==='GREEN G1').length;
    const loss=finished.filter(row=>row.result==='LOSS').length;
    let lossStreak=0;
    for(let i=finished.length-1;i>=0&&finished[i].result==='LOSS';i--)lossStreak++;
    const baseScore=.60*windowScore(5,3)+.25*windowScore(15,10)+.15*windowScore(30,20)-.08*Math.min(3,lossStreak);
    const lesson=masterLessonStats(id);
    const feedback=.10*(lesson.score-33/37)*lesson.support/(lesson.support+8);
    return {total:rows.length,closedTotal:finished.length,direct,g1,loss,hits:direct+g1,
      pending:rows.length-finished.length,firstMiss:rows.length-direct,lossStreak,
      recentDirect:recent.filter(row=>closed(row)&&row.result==='GREEN').length,
      recentG1:recent.filter(row=>closed(row)&&row.result==='GREEN G1').length,
      recentLoss:recent.filter(row=>closed(row)&&row.result==='LOSS').length,
      recentPending:recent.filter(row=>!closed(row)).length,
      score:baseScore+feedback,baseScore,feedback,lesson,
      weights:{recent5:.60,recent15:.25,last30:.15},
      rewards:{GREEN:1,GREEN_G1:.45,PENDING_G1:.15,LOSS:-1}};
  }

  function masterDefinitions(block=currentBlock()){
    // O controlador MASTER não se compara consigo mesmo. Pós-loss continua
    // como prioridade independente sobre a escolha normal, quando ativado.
    return timelineDefinitions().filter(def=>!['MASTER','POSTLOSS','TERMINAL_SUGGESTION'].includes(def.id));
  }

  function masterRanking(block=currentBlock()){
    if(!block)return [];
    return masterDefinitions(block).map(def=>{
      const motor=timelineMotor(def.id,block);
      return {...def,...masterCandidateStats(def.id),eligible:validPlay(motor?.play)};
    }).filter(def=>def.eligible).sort((a,b)=>
      Number(b.total>0)-Number(a.total>0)||b.score-a.score||
      a.lossStreak-b.lossStreak||b.recentDirect-a.recentDirect||b.closedTotal-a.closedTotal||a.id.localeCompare(b.id));
  }

  function rankBestVariation(){
    const block=currentBlock();
    if(block)return masterRanking(block)[0]||null;
    // Durante o processamento não usa uma cobertura do giro anterior.
    return null;
  }

  function displayedMasterChoice(){
    const cycle=state.cycle;
    if(['MASTER','FOLLOW_MASTER'].includes(cycle?.controller)){
      const target=cycle.original?.postLossTarget||cycle.original?.followTarget||cycle.original?.masterTarget;
      if(target)return {...target,...masterCandidateStats(target.id),committed:true};
    }
    if(['MASTER','FOLLOW_MASTER'].includes(state.strategy)&&state.phase==='ENTRY'){
      const priority=priorityRecoveryChoice(currentBlock());
      if(priority?.motor?.postLossTarget){
        const target=priority.motor.postLossTarget;
        return {...target,...masterCandidateStats(target.id),priority:true};
      }
    }
    return state.block.best;
  }


    function updateMaster(block = currentBlock()) {
      const best = masterRanking(block)[0];
      if (!best) return;
    state.block.best=copy(best);
      if (state.masterChoice !== best.id) {
        state.masterHistory.push({
          turn: state.totalTurns,
          from: state.masterChoice || "INICIAL",
          to: best.id,
          name: best.name,
          score: best.score,
          total: best.total,
        });
        state.masterHistory = state.masterHistory.slice(-70);
      }
      state.masterChoice = best.id;
    }

    function independentGlobalMotor(block = currentBlock()) {
      const definition = trainerBaseDefinition();
      const motor = block
        ? motorForDefinition(
            definition,
            block.global,
            state.globalStrategyPrevious,
          )
        : null;
      return validPlay(motor?.play)
        ? {
            ...copy(motor),
            globalStrategyTarget: { id: definition.id, name: definition.name },
          }
        : null;
    }

    function masterSelection(block = currentBlock()) {
      if (!block) return null;
      const definition = masterRanking(block)[0];
      if (!definition) return null;
      const motor = masterCandidateMotor(definition, block);
      return validPlay(motor?.play)
        ? {
            ...definition,
            motor: {
              ...copy(motor),
              masterTarget: {
                id: definition.id,
                name: definition.name,
                defenseStrategy: definition.resolvedId||motor.thirdTarget?.id||definition.id,
              owner:definition.owner||motor.owner||null,variation:definition.variation||motor.variation||null,
              performancePosition:definition.performancePosition||null,
              },
            },
          }
        : null;
    }

    function recordMasterCycle(controller, oldCycle, played, result, turn) {
      if (controller !== "MASTER") return;
      if (!["GREEN", "GALE", "GREEN G1", "LOSS"].includes(result)) return;
      const rows =
        state.strategyTimeline.MASTER || (state.strategyTimeline.MASTER = []);
      const start = oldCycle?.entryTurn || turn;
      let row = rows.find((r) => r.turn === start);
      const target =
        oldCycle?.original?.postLossTarget ||
        oldCycle?.original?.masterTarget ||
        played?.postLossTarget ||
        played?.masterTarget;
      if (!row) {
        row = {
          turn: start,
          result: "GREEN G1",
          closed: false,
          targetId: target?.id || null,
          targetName: target?.name || null,
        };
        rows.push(row);
      }
      row.result = result === "GALE" ? "GREEN G1" : result;
      row.closed = result !== "GALE";
      if (row.closed) {
        row.closedTurn = turn;
        state.masterResumeTurn = turn + 3;
      }
      const cutoff = state.historyTurns[0] || 1;
      state.strategyTimeline.MASTER = rows
        .filter((r) => r.turn >= cutoff)
        .slice(-79);
    }

    /* Caches dependentes do estado são renovados; análises puras por histórico
   exato continuam disponíveis para reutilização, sem alterar os cálculos. */
    function clearRuntimeCaches() {
    motorDiversityCache.clear();variantForecastCache.clear();
    const key=state.block.revision+'|'+state.block.decisionTurn;
    if(!state.block.data||blockRuntimeKey!==key){blockRuntimeKey=null;blockRuntimeData=null;}
  }


    /* Checkpoints completos. LZW síncrono reduz o espaço ocupado sem cortar histórico,
   treinamento, ciclos ou desfazer. A fila possui seu próprio diário causal. */
    function packSession(text) {
      const bytes = unescape(encodeURIComponent(text)),
        dictionary = new Map();
      let next = 257,
        phrase = "",
        chunk = "",
        chunks = [];
      const emit = (code) => {
        chunk += String.fromCharCode(code);
        if (chunk.length >= 8192) {
          chunks.push(chunk);
          chunk = "";
        }
      };
      for (let i = 0; i < bytes.length; i++) {
        const char = bytes[i],
          joined = phrase + char;
        if (!phrase || dictionary.has(joined)) {
          phrase = joined;
          continue;
        }
        emit(
          phrase.length === 1 ? phrase.charCodeAt(0) : dictionary.get(phrase),
        );
        if (next < 65535) dictionary.set(joined, next++);
        else {
          emit(256);
          dictionary.clear();
          next = 257;
        }
        phrase = char;
      }
      if (phrase)
        emit(
          phrase.length === 1 ? phrase.charCodeAt(0) : dictionary.get(phrase),
        );
      chunks.push(chunk);
      return "BETA_LZW1:" + chunks.join("");
    }
    function unpackSession(text) {
      if (!text.startsWith("BETA_LZW1:")) return text;
      const dictionary = [],
        parts = [];
      let next = 257,
        previous = "";
      for (let i = 10; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code === 256) {
          dictionary.length = 0;
          next = 257;
          previous = "";
          continue;
        }
        const value =
          code < 256
            ? String.fromCharCode(code)
            : dictionary[code] ||
              (code === next ? previous + previous[0] : null);
        if (value == null) throw Error("Checkpoint inválido.");
        parts.push(value);
        if (previous && next < 65535) dictionary[next++] = previous + value[0];
        previous = value;
      }
      return decodeURIComponent(escape(parts.join("")));
    }
    function read(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) return null;
        return JSON.parse(unpackSession(raw), (k, v) =>
          v && typeof v.__betaPlay === "string"
            ? restoreShape(v.__betaPlay, v.score)
            : v,
        );
      } catch (error) {
        saveError =
          "Não foi possível recuperar o estado salvo: " +
          String(error.message || error);
        return null;
      }
    }
    function save() {
      try {
        if (typeof checkpointSerial !== "undefined") checkpointSerial++;
        if (typeof checkpointEpoch !== "undefined") checkpointEpoch++;
        const raw = JSON.stringify(state, (k, v) =>
          (!["TERMINALS33","ROTATED33"].includes(v?.kind) && (validPlay(v) || validLegacyPlay(v) || validLegacy31Play(v))) ? { __betaPlay: signaturePlay(v), score: v.score } : v,
        );
        localStorage.setItem(KEY, packSession(raw));
        pruneSavedVersions();
        durableTurn = state.totalTurns;
        saveError = "";
        return true;
      } catch (error) {
        saveError = "SALVAMENTO FALHOU: " + String(error.message || error);
        return false;
      }
    }

    /* Busca geométrica original validada: seis blocos de cinco e um de três,
   sem reaproveitar combinações intermediárias da busca otimizada. */
    function rawGeometry(weights, mandatory = []) {
      // Six non-overlapping sectors of five plus one of three: 33, four gaps.
      const prefix = new Float64Array(75);
      for (let p = 0; p < 74; p++) prefix[p + 1] = prefix[p] + (weights[p % 37] || 0);
      const scoreAt = (start, length) => prefix[start + length] - prefix[start];
      let best = null;
      for (let start = 0; start < 37; start++) {
        const firstCenter = W[mod(start + 1)];
        if (!mandatory.every(number => neighbors(firstCenter, 1).includes(number))) continue;
        const values = new Float64Array(35);
        values.fill(-Infinity);
        const parent = new Int16Array(35);
        parent.fill(-1);
        const widths = new Int8Array(35);
        values[0] = scoreAt(start, 3);
        for (let five = 0; five <= 6; five++) {
          for (let gaps = 0; gaps <= 4; gaps++) {
            const index = five * 5 + gaps;
            const value = values[index];
            if (!Number.isFinite(value)) continue;
            const position = 3 + five * 5 + gaps;
            if (gaps < 4 && value > values[index + 1] + 1e-12) {
              values[index + 1] = value;
              parent[index + 1] = index;
              widths[index + 1] = 0;
            }
            if (five < 6 && position + 5 <= 37) {
              const score = value + scoreAt(start + position, 5);
              if (score > values[index + 5] + 1e-12) {
                values[index + 5] = score;
                parent[index + 5] = index;
                widths[index + 5] = 5;
              }
            }
          }
        }
        for (let gaps = 0; gaps <= 4; gaps++) {
          const last = 30 + gaps;
          if (!Number.isFinite(values[last]) || (best && values[last] <= best.score + 1e-12)) continue;
          const placed = [];
          for (let index = last; parent[index] >= 0; index = parent[index]) {
            if (!widths[index]) continue;
            const previous = parent[index];
            const five = Math.floor(previous / 5);
            const usedGaps = previous % 5;
            const position = 3 + five * 5 + usedGaps;
            const center = W[mod(start + position + 2)];
            placed.push({center, radius:2, numbers:neighbors(center, 2)});
          }
          const blocks = [{center:firstCenter, radius:1, numbers:neighbors(firstCenter, 1)}, ...placed.reverse()];
          const play = {blocks, numbers:blocks.flatMap(block => block.numbers), score:values[last]};
          if (validPlay(play)) best = play;
        }
      }
      return best;
    }

    /* Seleção parcial exata: somente os 96 melhores são ordenados e materializados.
   Mesma pontuação, mesma ordem de desempate pelo índice de origem. */
    function topPoolCandidates(scores, limit = 96) {
      const pool = diversityCandidates(),
        heap = [];
      const worse = (a, b) =>
        scores[a] < scores[b] || (scores[a] === scores[b] && a > b);
      for (let index = 0; index < scores.length; index++) {
        if (heap.length < limit) {
          heap.push(index);
          let child = heap.length - 1;
          while (child) {
            const parent = (child - 1) >> 1;
            if (!worse(heap[child], heap[parent])) break;
            [heap[child], heap[parent]] = [heap[parent], heap[child]];
            child = parent;
          }
        } else if (worse(heap[0], index)) {
          heap[0] = index;
          let parent = 0;
          while (true) {
            let child = parent * 2 + 1;
            if (child >= heap.length) break;
            if (child + 1 < heap.length && worse(heap[child + 1], heap[child]))
              child++;
            if (!worse(heap[child], heap[parent])) break;
            [heap[child], heap[parent]] = [heap[parent], heap[child]];
            parent = child;
          }
        }
      }
      return heap
        .sort((a, b) => scores[b] - scores[a] || a - b)
        .map((index) => ({
          candidate: pool[index],
          score: scores[index],
          index,
        }));
    }

    function fastIndependentMotors(proposals) {
      const pool = diversityCandidates();
      const candidates = proposals.map((m) => topPoolCandidates(m.poolScores));
      let chosen = null,
        chosenScore = -Infinity;
      for (const step of [1, 5, 7]) {
        const selected = Array(12).fill(null),
          counts = Array(37).fill(0);
        for (let k = 0; k < 12; k++) {
          const i = (k * step) % 12;
          let best = null,
            value = -Infinity;
          for (const item of candidates[i]) {
            if (
              selected.some((c) => c && sharedCoverage(c, item.candidate) > MAX_MOTOR_OVERLAP)
            )
              continue;
            let newNumbers = 0;
            for (const n of item.candidate.play.numbers)
              if (!counts[n]) newNumbers++;
            const score = item.score + 0.08 * newNumbers;
            if (score > value) {
              value = score;
              best = item.candidate;
            }
          }
          if (!best) break;
          selected[i] = best;
          for (const n of best.play.numbers) counts[n]++;
        }
        if (selected.some((c) => !c) || counts.some((n) => !n)) continue;
        const score = selected.reduce(
          (sum, c, i) => sum + candidateFit(c, proposals[i].weights),
          0,
        );
        if (score > chosenScore) {
          chosenScore = score;
          chosen = selected;
        }
      }
      if (!chosen) {
        for (let shift = 0; shift < 37; shift++) {
          const selected = diversitySafety.map((c) =>
            diversityCandidate(rotatedDiversity(c.play, shift)),
          );
          const score = selected.reduce(
            (sum, c, i) => sum + candidateFit(c, proposals[i].weights),
            0,
          );
          if (score > chosenScore) {
            chosenScore = score;
            chosen = selected;
          }
        }
      }
      const result = proposals.map((m, i) => {
        const { weights, poolScores, ...motor } = m;
        const play = copy(chosen[i].play);
        play.score = candidateFit(chosen[i], weights);
        return { ...motor, score: play.score, play };
      });
      if (!validMotorEnsemble(result))
        throw Error("CONJUNTO INCOMPLETO: " + proposals[0].bankId);
      result.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
      result.forEach((m, i) => (m.rank = i + 1));
      return result;
    }

    function coordinateOwnerVariations(forecasts) {
      for (const owner of VARIANT_OWNERS) {
        const group = forecasts.filter((f) => f.owner === owner.id);
        if (!group.length) continue;
        const alternatives = group.map((f) => {
          if (owner.id === "CONSENSUS" || owner.id === "UNION") {
            const weights = Array(37).fill(0);
            const members =
              owner.id === "UNION" ? f.motors.slice(0, 3) : f.motors;
            for (const m of members)
              for (const n of m.play.numbers)
                weights[ix(n)] += 1 / (1 + m.rank * 0.1);
            applySpatial(weights, state.history, 0.25);
            const ranked = topPoolCandidates(
              diversityCandidates().map((candidate) =>
                candidateFit(candidate, weights),
              ),
            );
            return [
              f.choice,
              ...ranked.slice(0, 96).map((r) => ({
                key: owner.id,
                rank: 0,
                play: { ...copy(r.candidate.play), score: r.score },
                score: r.score,
                spatialKeys: [...spatialRead(state.history).keys],
              })),
            ];
          }
          let motors =
            owner.id === "FIXED" ? f.motors.slice(0, 4) : [...f.motors];
          if (owner.id === "BEST" || owner.id === "SWITCH")
            motors.sort(
              (a, b) =>
                variantMotorRate(b.key, owner.id === "BEST" ? 20 : 12) -
                  variantMotorRate(a.key, owner.id === "BEST" ? 20 : 12) ||
                a.rank - b.rank,
            );
          if (owner.id === "NUMBER")
            motors.sort((a, b) => {
              const score = (m) =>
                compareNumberCombination(
                  { play: m.play, covered: m.play.numbers },
                  state.history.at(-1),
                  state.history,
                ).score;
              return score(b) - score(a) || a.rank - b.rank;
            });
          return [f.choice, ...motors];
        });
        const prepared = alternatives.map((items) => {
          const seen = new Set();
          return items
            .filter((m) => {
              const code = coverageCode(m.play);
              if (seen.has(code)) return false;
              seen.add(code);
              return true;
            })
            .map((motor) => ({
              motor,
              candidate: diversityCandidate(motor.play),
            }));
        });
        let final = null;
        for (const order of [0, 1, 2, 3, 4, 5, 6, 7]) {
          const selected = Array(8).fill(null),
            counts = Array(37).fill(0);
          let failed = false;
          for (let k = 0; k < 8; k++) {
            const index = (k + order) % 8,
              f = group[index];
            const choices = prepared[index];
            let best = null,
              bestScore = -Infinity;
            for (let i = 0; i < choices.length; i++) {
              const { motor, candidate } = choices[i];
              if (
                selected.some(
                  (m) =>
                    m &&
                    sharedCoverage(diversityCandidate(m.play), candidate) > 32,
                )
              )
                continue;
              let additional = 0;
              for (const n of motor.play.numbers) if (!counts[n]) additional++;
              const score = (i === 0 ? 0.25 : 0) + 1 / (1 + i) + additional * 2;
              if (score > bestScore) {
                best = motor;
                bestScore = score;
              }
            }
            if (!best) {
              failed = true;
              break;
            }
            selected[index] = {
              ...copy(best),
              bankId: f.bankId,
              owner: f.owner,
              variation: f.variation,
            };
            if (owner.id === "FIXED")
              selected[index].autoRank = best.autoRank || best.rank;
            if (owner.id === "NUMBER")
              Object.assign(selected[index], {
                type: "NUMBER",
                trigger: state.history.at(-1),
                sourceNumber: best.sourceNumber ?? state.history.at(-1),
                sourceTurn: best.sourceTurn ?? state.totalTurns,
              });
            for (const n of best.play.numbers) counts[n]++;
          }
          if (!failed && counts.every(Boolean)) {
            final = selected;
            break;
          }
        }
        if (!final) {
          // Reserva de conjuntos inteiros: conserva a regra da original, inclusive
          // AUTO exclusivamente 1–4, sem transformar CONSENSO em um motor isolado.
          const options = group.map((f) => {
            const weights = new Map(f._weights.map((m) => [m.key, m.weights]));
            return Array.from({ length: 37 }, (_, shift) => {
              const motors = f.motors
                .map((m, i) => {
                  const play = rotatedDiversity(diversitySafety[i].play, shift);
                  play.score = play.numbers.reduce(
                    (sum, n) => sum + weights.get(m.key)[ix(n)],
                    0,
                  );
                  return { ...m, play, score: play.score };
                })
                .sort(
                  (a, b) => b.score - a.score || a.key.localeCompare(b.key),
                );
              motors.forEach((m, i) => (m.rank = i + 1));
              return {
                motors,
                choice: chooseVariant(
                  f.owner,
                  f.variation,
                  motors,
                  state.history,
                ),
              };
            });
          });
          for (let order = 0; order < 8 && !final; order++) {
            const selected = Array(8).fill(null),
              banks = Array(8).fill(null),
              counts = Array(37).fill(0);
            for (let k = 0; k < 8; k++) {
              const index = (k + order) % 8;
              let best = null,
                bestValue = -Infinity;
              for (const option of options[index]) {
                const candidate = diversityCandidate(option.choice.play);
                if (
                  selected.some(
                    (m) =>
                      m &&
                      sharedCoverage(diversityCandidate(m.play), candidate) > 32,
                  )
                )
                  continue;
                const gain = option.choice.play.numbers.filter(
                  (n) => !counts[n],
                ).length;
                const value = gain * 2 + option.choice.score / 100;
                if (value > bestValue) {
                  best = option;
                  bestValue = value;
                }
              }
              if (!best) break;
              selected[index] = best.choice;
              banks[index] = best.motors;
              for (const n of best.choice.play.numbers) counts[n]++;
            }
            if (selected.every(Boolean) && counts.every(Boolean)) {
              final = selected;
              for (let i = 0; i < 8; i++) group[i].motors = banks[i];
            }
          }
        }
        if (!final)
          throw Error(
            "NÃO FOI POSSÍVEL DIVERSIFICAR AS OITO VARIAÇÕES: " + owner.id,
          );
        for (let i = 0; i < 8; i++) group[i].choice = final[i];
      }
    }

    const coverageCandidateMemo = new WeakMap();
    function diversityCandidate(play) {
      if (coverageCandidateMemo.has(play))
        return coverageCandidateMemo.get(play);
      const covered = new Set(play.numbers);
      let low = 0,
        high = 0;
      for (let n = 0; n < 37; n++)
        if (!covered.has(n)) {
          if (n < 32) low |= 1 << n;
          else high |= 1 << (n - 32);
        }
      const candidate = { play, low, high, code: coverageCode(play) };
      coverageCandidateMemo.set(play, candidate);
      return candidate;
    }

    function allVariantForecasts(h, onlyOwner = null) {
      if (h.length < 8) return [];
      const key =
        h.join(",") +
        "|" +
        state.totalTurns +
        (onlyOwner ? "|OWNER:" + onlyOwner : "");
      if (variantForecastCache.has(key)) return variantForecastCache.get(key);
      const spatial = spatialRead(h),
        baseWeights = new Map(),
        shared = { base: new Map(), additive: new Map() };
      for (const family of FAMILIES)
        for (const radius of RADII) {
          const base = weightsFor(h, family, radius),
            key = family + "_" + radius;
          baseWeights.set(key, base);
          const normalized = normalizeSpace(base);
          shared.base.set(
            key,
            diversityCandidates().map((c) => candidateFit(c, normalized)),
          );
        }
      const forecasts = [];
      for (const owner of VARIANT_OWNERS.filter(
        (o) =>
          !onlyOwner ||
          (Array.isArray(onlyOwner)
            ? onlyOwner.includes(o.id)
            : o.id === onlyOwner),
      ))
        for (let variation = 1; variation <= 8; variation++) {
          const bankId = variantBookId(owner.id, variation),
            proposals = [];
          for (const family of FAMILIES)
            for (const radius of RADII) {
              const analysis = variantAnalyticalWeights(
                h,
                family,
                radius,
                owner.id,
                variation,
                baseWeights.get(family + "_" + radius),
                spatial,
                shared,
              );
              proposals.push({
                key: bankId + "::" + family + "_" + radius,
                bankId,
                owner: owner.id,
                variation,
                family,
                radius,
                weights: analysis.weights,
                poolScores: analysis.poolScores,
                spatialKeys: [...spatial.keys],
                componentShares: [...spatial.adaptive.shares],
                adaptiveSamples: spatial.adaptive.samples,
                spatialVersion: VERSION,
          readingVersion:"6.6.36",readingCandidates:37,
              });
            }
          const cs = fastIndependentMotors(proposals);
          forecasts.push({
            bankId,
            owner: owner.id,
            name: owner.name,
            variation,
            motors: cs,
            _weights: proposals,
            choice: chooseVariant(owner.id, variation, cs, h),
          });
        }
      coordinateOwnerVariations(forecasts);
      for (const f of forecasts) delete f._weights;
      variantForecastCache.set(key, forecasts);
      if (variantForecastCache.size > 4)
        variantForecastCache.delete(variantForecastCache.keys().next().value);
      return forecasts;
    }

  
    async function prepareBlockParallel() {
    // Um único calculador por leitura; todos os 65 bancos continuam ativos.
    // prepareBlock conserva a mesma busca, pesos, ordenação e regras.
    return prepareBlock();
  }


    /* Os contadores de sequência não são apagados pelo descarte da janela. */
    function updateStrategyStreaks(turn = state.totalTurns) {
      for (const [id, rows] of Object.entries(state.strategyTimeline)) {
        const closed = rows
          .filter((r) => r.closed && r.closedTurn <= turn)
          .sort((a, b) => a.closedTurn - b.closedTurn);
        let counter = state.strategyStreaks[id];
        if (!counter) {
          let loss = 0;
          for (
            let i = closed.length - 1;
            i >= 0 && closed[i].result === "LOSS";
            i--
          )
            loss++;
          const last = closed.at(-1);
          if (last)
            state.strategyStreaks[id] = {
              loss,
              closedTurn: last.closedTurn,
              result: last.result,
            };
          continue;
        }
        for (const row of closed)
          if (row.closedTurn > counter.closedTurn) {
            counter = {
              loss: row.result === "LOSS" ? counter.loss + 1 : 0,
              closedTurn: row.closedTurn,
              result: row.result,
            };
          }
        state.strategyStreaks[id] = counter;
      }
    }
    function postThreeChoice(block = currentBlock()) {
      if (!block) return null;
      const candidates = timelineDefinitions()
        .filter((d) => !["POSTLOSS", "POST3LOSS", "TERMINAL_SUGGESTION"].includes(d.id))
        .map((def) => {
          const stats = postLossStats(def.id),
            counter = state.strategyStreaks[def.id];
          const streak = counter?.loss ?? stats.streak,
            lossTurn = counter?.closedTurn ?? stats.last?.closedTurn;
          return { ...def, ...stats, streak, lossTurn };
        })
        .filter(
          (candidate) =>
            candidate.streak >= 3 &&
            candidate.lossTurn > (state.postThreeUsed[candidate.id] || 0),
        )
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.samples - a.samples ||
            b.lossTurn - a.lossTurn ||
            a.id.localeCompare(b.id),
        );
      for (const candidate of candidates) {
        const motor = timelineMotor(candidate.id, block);
        if (!validPlay(motor?.play)) continue;
        return {
          ...candidate,
          motor: {
            ...copy(motor),
            postLossTarget: {
              kind: "POST3",
              id: candidate.id,
              name: candidate.name,
              lossTurn: candidate.lossTurn,
              streak: candidate.streak,
              samples: candidate.samples,
              recoveries: candidate.recoveries,
              repeatLoss: candidate.repeatLoss,
              score: candidate.score,
              defenseStrategy:
                motor.thirdTarget?.id ||
                motor.globalStrategyTarget?.id ||
                motor.masterTarget?.defenseStrategy ||
                candidate.id,
            },
          },
        };
      }
      return null;
    }
    function recoveryLabel(target) {
      if (target?.kind === "POST3") return "PÓS-3 LOSS • TODAS";
      if (target?.kind === "POST2ALL") return "PÓS-2 LOSS • TODAS";
      if (target?.kind === "POST1ALL") return "PÓS-1 LOSS • TODAS";
      return "PÓS-LOSS • ADAPTATIVAS";
    }

    function postLossAllChoice(required, block = currentBlock()) {
      if (!block) return null;
      const kind = required === 2 ? "POST2ALL" : "POST1ALL";
      const candidates = timelineDefinitions()
        .filter(def => !["POSTLOSS", "POST3LOSS", "POST1ALL", "POST2ALL", "TERMINAL_SUGGESTION"].includes(def.id))
        .map(def => {
          const stats = postLossStats(def.id);
          const counter = state.strategyStreaks[def.id];
          return {...def, ...stats,
            streak: counter?.loss ?? stats.streak,
            lossTurn: counter?.closedTurn ?? stats.last?.closedTurn};
        })
        .filter(candidate => candidate.last?.result === "LOSS" &&
          candidate.streak >= required && candidate.lossTurn === state.totalTurns &&
          candidate.lossTurn > (state.recoveryUsed[kind + ":" + candidate.id] || 0))
        .sort((a,b) => b.score-a.score || b.samples-a.samples || a.id.localeCompare(b.id));
      for (const candidate of candidates) {
        const motor = timelineMotor(candidate.id, block);
        if (!validPlay(motor?.play)) continue;
        return {...candidate, motor: {...copy(motor), postLossTarget: {
          kind, id:candidate.id, name:candidate.name, lossTurn:candidate.lossTurn,
          streak:candidate.streak, samples:candidate.samples,
          recoveries:candidate.recoveries, repeatLoss:candidate.repeatLoss,
          score:candidate.score,
          defenseStrategy:motor.thirdTarget?.id || motor.globalStrategyTarget?.id ||
            motor.masterTarget?.defenseStrategy || candidate.id
        }}};
      }
      return null;
    }

    function priorityRecoveryChoice(block = currentBlock()) {
      // Consecutive losses belong to the same strategy. Pending G1 is never LOSS.
      // Existing committed cycles remain frozen; recovery bypasses only Master rest.
      if (state.postThreeEnabled) {
        const choice = postThreeChoice(block);
        if (choice) return choice;
      }
      if (state.postTwoAllEnabled) {
        const choice = postLossAllChoice(2, block);
        if (choice) return choice;
      }
      if (state.postLossEnabled || state.strategy === "POSTLOSS") {
        const choice = postLossChoice(block);
        if (choice) return choice;
      }
      return state.postOneAllEnabled ? postLossAllChoice(1, block) : null;
    }

    /* Só remove cópias de versões anteriores depois de gravar a sessão completa
   na chave atual; a sessão em uso e seus registros permanecem intactos. */
    function pruneSavedVersions() {
      if (!localStorage.getItem(KEY)) return;
      for (const oldKey of OLD_KEYS) {
      if (oldKey.startsWith("ANALISE_BETA_V664_DUAL_") || oldKey.startsWith("ANALISE_BETA_31_DUAL_")) continue;
        try {
          localStorage.removeItem?.(oldKey);
          localStorage.removeItem?.(oldKey + "_QUEUE");
        } catch (error) {}
      }
    }

    let state = fresh();
    let busy = false;
    let saveError = "";

    function preview(){
      const play=isolatedEntryMotor()?.play;
      if(!validPlay(play))throw Error("A leitura não formou uma cobertura válida.");
      const outside=missing(play);
      if(outside.length!==4||new Set(outside).size!==4)throw Error("Cobertura fora do limite de 33 casas.");
      return {outside,groups:play.blocks.map(({center,radius})=>({center,radius})),wheel:W};
    }

    self.onmessage = async ({data})=>{
      try{
        if(data.action==="IMPORT"){
          importNumbersCore(data.numbers,{readingSide:data.readingSide,strategy:data.strategy,analysisSourceOrder:"CHRONOLOGICAL"});
          prepareFollowPreview();
        }else if(data.action==="SPIN"){
          if(state.phase==="ENTRY"&&state.strategy==="FOLLOW_MASTER")prepareFollowPreview();
          const displayed=preview();
          const row=spin(data.number,"TEMPO REAL");
          if(!row.isolatedEntry||row.isolatedEntry.excluded.some(n=>!displayed.outside.includes(n))){
            throw Error("A cobertura registrada divergiu da exibida.");
          }
          if(!state.block.data&&state.history.length>=8)await prepareBlockParallel();
          prepareFollowPreview();
        }else throw Error("Comando desconhecido.");
        self.postMessage({result:preview()});
      }catch(error){self.postMessage({error:String(error.message||error)});}
    };
  }
const CANDIDATES=[
  ['NORMAL','FOLLOW_MASTER','Master Normal'],
  ['INVERTIDO','FOLLOW_MASTER','Master Inverso'],
  ['NORMAL','TERMINAL_SUGGESTION','Sugestão Normal'],
  ['INVERTIDO','TERMINAL_SUGGESTION','Sugestão Inversa'],
];
const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const valid=n=>Number.isInteger(n)&&n>=0&&n<=36;

const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const mod=i=>(i+37)%37;
const SECTORS=[
  ['Zero',[12,35,3,26,0,32,15]],
  ['Voisins',[19,4,21,2,25,22,18,29,7,28]],
  ['Tiers',[27,13,36,11,30,8,23,10,5,24,16,33]],
  ['Orphelins',[17,34,6,1,20,14,31,9]],
];
const SECTOR_BY_NUMBER=[];
SECTORS.forEach(([,numbers],i)=>numbers.forEach(n=>{SECTOR_BY_NUMBER[n]=i;}));

function layouts(){
  const result=[],seen=new Set();
  function place(gaps,left){
    if(gaps.length<6){
      for(let gap=0;gap<=left;gap++) place([...gaps,gap],left-gap);
      return;
    }
    const spaces=[...gaps,left];
    for(let start=0;start<37;start++){
      const centers=[],outside=[];
      let cursor=start;
      for(let block=0;block<7;block++){
        const radius=block===0?1:2;
        centers.push(mod(cursor+radius));
        cursor+=2*radius+1;
        for(let i=0;i<spaces[block];i++) outside.push(mod(cursor++));
      }
      const omitted=outside.map(i=>WHEEL[i]);
      if(new Set(omitted.map(n=>SECTOR_BY_NUMBER[n])).size!==4)continue;
      const key=[...omitted].sort((a,b)=>a-b).join(',');
      if(seen.has(key))continue;
      seen.add(key);
      result.push({
        outside:omitted.sort((a,b)=>SECTOR_BY_NUMBER[a]-SECTOR_BY_NUMBER[b]),
        groups:centers.map((i,j)=>({center:WHEEL[i],radius:j?2:1})),
      });
    }
  }
  place([],4);
  return result;
}
const REGIONAL_LAYOUTS=layouts();

function selectRegionalCoverage(candidates,history,rows=[]){
  const last=history.slice(-40),weights=Array(37).fill(0);
  for(let i=0;i<last.length;i++)weights[last[i]]+=Math.exp((i-last.length+1)/18);

  const previous=rows.slice(-4);
  if(previous.length>=2){
    for(const n of previous.at(-1).outside){
      let run=1;
      while(run<previous.length&&previous[previous.length-1-run].outside.includes(n))run++;
      weights[n]+=.24*Math.max(0,run-1);
    }
  }

  const overlap=Array(37).fill(0),used=new Set(),recent=rows.slice(-16);
  const proposals=candidates.map((candidate,index)=>{
    const omitted=new Set(candidate.outside);
    const costByNumber=weights.map((weight,n)=>weight+(omitted.has(n)?0:.65));
    let best=null,bestCost=Infinity;
    for(const layout of REGIONAL_LAYOUTS){
      if(used.has(layout)||layout.outside.some(n=>overlap[n]>=2))continue;
      let cost=0;
      for(const n of layout.outside)cost+=costByNumber[n];
      if(cost<bestCost-1e-12){best=layout;bestCost=cost;}
    }
    if(!best)throw Error("Nenhum conjunto regional sob o limite de exclusões.");
    used.add(best);
    for(const n of best.outside)overlap[n]++;
    // Os quatro placares virtuais usam a proposta que cada motor publicou
    // antes do giro, mesmo quando ela não foi a escolhida para a jogada.
    let weightedLosses=1,mass=8,losses=0;
    for(let i=0;i<recent.length;i++){
      const age=Math.exp((i-recent.length+1)/8);
      const loss=Number(recent[i].virtual[index]);
      weightedLosses+=age*loss;mass+=age;losses+=loss;
    }
    return {...best,index,label:CANDIDATES[index][2],wheel:WHEEL,
      score:bestCost+weightedLosses/mass,losses,samples:recent.length};
  });
  const chosen=proposals.reduce((best,p)=>p.score<best.score-1e-12?p:best);
  return {...chosen,proposals};
}

function settleRegionalCoverage(number,prediction){
  return {number,hit:!prediction.outside.includes(number),label:prediction.label,
    outside:prediction.outside,virtual:prediction.proposals.map(p=>p.outside.includes(number))};
}

function parseHistory(text,order){
  const tokens=text.trim().split(/[\s,;|]+/).filter(Boolean);
  if(tokens.length<8||tokens.length>70||tokens.some(t=>!/^\d{1,2}$/.test(t)||!valid(Number(t)))){
    throw new Error('Cole de 8 a 70 números inteiros de 0 a 36.');
  }
  const values=tokens.map(Number);
  return order==='newest'?values.reverse():values;
}

function createChannel(source){
  const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  let worker;
  try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}
  let request=null,failed=null;
  worker.onmessage=({data})=>{
    const pending=request;
    request=null;
    if(!pending)return;
    if(data.error)pending.reject(new Error(data.error));
    else pending.resolve(data.result);
  };
  worker.onerror=event=>{
    failed=new Error(event.message||'Um motor deixou de responder.');
    request?.reject(failed);
    request=null;
  };
  return {
    send(data){
      if(failed)return Promise.reject(failed);
      if(request)return Promise.reject(new Error('O motor ainda está ocupado.'));
      return new Promise((resolve,reject)=>{
        request={resolve,reject};
        try{worker.postMessage(data);}
        catch(error){request=null;reject(error);}
      });
    },
    close(){
      worker.terminate();
      failed=new Error('Sessão fechada.');
      request?.reject(failed);
      request=null;
    }
  };
}

const VIEW=`
<style>
:host{color-scheme:dark;display:block;position:fixed;inset:0;z-index:2147483647;overflow:auto;background:#101418;color:#eef5f3;font:16px/1.45 system-ui,sans-serif;--accent:#8ff0b8;--border:#34424b;--muted:#bdc9cb}
*{box-sizing:border-box}main{max-width:760px;margin:auto;padding:16px 10px 32px}h1,h2,p{margin:0 0 8px}h1{font-size:1.75rem}h2{font-size:1.12rem}section{background:#1b2229;border:1px solid var(--border);border-radius:10px;margin:10px 0;padding:10px}label{display:block}textarea,button,select{font:inherit;color:inherit;border:1px solid var(--border);border-radius:6px;background:#111a20;padding:7px}textarea{width:100%;display:block;resize:vertical;margin:5px 0}button{min-height:42px;cursor:pointer}button:disabled{opacity:.55;cursor:default}button.primary{background:var(--accent);color:#10231a;font-weight:700}button:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:1px}#close{float:right}.row,.groups,.wheel{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:7px 0}.groups span{background:#111a20;border-radius:5px;padding:3px 6px}.groups strong{color:var(--accent);font-size:1.16em}.groups small,.muted{color:var(--muted)}.timeline{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:3px;margin:5px 0 10px}.chip{display:flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:4px;min-width:0;font-weight:650;font-variant-numeric:tabular-nums}.timeline .chip{min-height:26px;font-size:clamp(10px,3.3vw,17px);white-space:nowrap}.wheel .chip{width:27px;min-height:24px;font-size:14px}.wheel .outside{outline:2px solid #ffc897;outline-offset:-2px}.red{background:#702a36}.black{background:#10151b}.zero{background:#26543f}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:9px 0}.stats strong{display:block;font-size:1.22rem}.stats small{color:var(--muted)}.keys{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px}.keys button{padding:2px}.good{color:var(--accent)}.bad{color:#ffc897}#status,#latest{min-height:1.4em}@media(max-width:480px){.keys{grid-template-columns:repeat(7,minmax(0,1fr))}.timeline{gap:2px}}
</style>
<main>
<header><button id="close" type="button">Fechar</button><h1>Vitória Master V5</h1><p class="muted">33 casas · 1 de fora por setor · máximo de 2 exclusões por número</p></header>
<section><h2>Importar histórico</h2>
<label for="seed">Cole os números</label><textarea id="seed" rows="2" placeholder="26 20 27 4 32"></textarea>
<div class="row"><select id="order" aria-label="Ordem do histórico"><option value="oldest">Mais antigo primeiro</option><option value="newest">Mais recente primeiro</option></select><button class="primary" type="button" id="import">Importar</button></div>
<div id="status" role="status" aria-live="polite"></div></section>
<section><h2>Cobertura do próximo giro</h2>
<p id="timeline-label" class="muted">Histórico importado · 14 últimos</p>
<div class="timeline" id="timeline" aria-label="14 últimos números, do mais antigo ao mais recente"></div>
<p id="mode" class="muted"></p><div id="groups" class="groups"></div>
<details id="comparison"><summary>Conferir as 4 propostas</summary><ul id="proposal-list" class="muted"></ul></details>
<p id="outside" class="muted"></p><div id="wheel" class="wheel" aria-label="Cobertura na ordem da roda"></div>
<div class="stats"><div><strong id="hits">0</strong><small>Acertos</small></div><div><strong id="misses">0</strong><small>LOSS</small></div><div><strong id="total">0</strong><small>Giros lançados</small></div></div>
<div id="latest" role="status" aria-live="polite"></div></section>
<section><h2>Lançar resultado</h2><div id="keys" class="keys"></div><div class="row"><button id="undo" type="button">Desfazer último giro</button></div></section>
</main>`;

function install(){
  const id='vitoria-master-v5-host';
  const existing=document.getElementById(id);
  if(existing){existing.focus();return;}
  const host=document.createElement('div');
  host.id=id;host.tabIndex=-1;
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=VIEW;
  document.body.appendChild(host);
  const $=id=>root.getElementById(id);
  const storageKey='vitoria-master-v5';
  const source='('+analysisBackground.toString()+')();';
  let seed=[],manual=[],rows=[],channels=[],previews=[],busy=false,closed=false;
  const color=n=>n===0?'zero':RED.has(n)?'red':'black';
  const status=text=>{$('status').textContent=text;};
  const buttons=[];
  function save(){
    try{localStorage.setItem(storageKey,JSON.stringify({seed,manual}));}
    catch{status('O navegador bloqueou o salvamento da sessão.');}
  }
  function current(){
    if(previews.length!==CANDIDATES.length)return null;
    return selectRegionalCoverage(previews,seed.concat(manual),rows);
  }
  function render(){
    const play=current(),latest=rows.at(-1);
    $('timeline-label').textContent=manual.length?'Últimos 14 números':'Histórico importado · 14 últimos';
    $('timeline').innerHTML=seed.concat(manual).slice(-14).map(n=>'<span class="chip '+color(n)+'">'+n+'</span>').join('');
    $('mode').textContent=play?play.label:'Aguardando histórico';
    $('comparison').hidden=!play;
    $('proposal-list').innerHTML=play?play.proposals.map(p=>
      '<li>'+p.label+(p.index===play.index?' · escolhida':'')+' · fora '+p.outside.join(' / ')+
      ' · '+p.losses+' LOSS virtuais em '+p.samples+'</li>').join(''):'';
    $('groups').innerHTML=play?play.groups.map(({center,radius})=>'<span><strong>'+center+'</strong> <small>± '+radius+'</small></span>').join(''):'';
    $('outside').textContent=play?play.outside.map((n,i)=>SECTORS[i][0]+' '+n).join(' · '):'';
    $('wheel').innerHTML=play?play.wheel.map(n=>'<span class="chip '+color(n)+(play.outside.includes(n)?' outside':'')+'">'+n+'</span>').join(''):'';
    const hits=rows.reduce((sum,row)=>sum+Number(row.hit),0);
    $('hits').textContent=hits;$('misses').textContent=rows.length-hits;$('total').textContent=rows.length;
    $('latest').textContent=latest?latest.number+' · '+(latest.hit?'ACERTO':'LOSS')+' · '+latest.label:'';
    $('latest').className=latest?(latest.hit?'good':'bad'):'';
    $('import').disabled=busy;$('undo').disabled=busy||!manual.length;
    buttons.forEach(button=>{button.disabled=busy||!seed.length;});
  }
  function release(pool){pool.forEach(channel=>channel.close());}
  async function rebuild(nextSeed,nextManual){
    // Quatro sessões independentes avançam com os mesmos resultados conhecidos.
    release(channels);channels=[];previews=[];
    const opened=[];
    try{
      for(const candidate of CANDIDATES)opened.push(createChannel(source));
      channels=opened;
      let views=await Promise.all(opened.map((channel,i)=>channel.send({
        action:'IMPORT',numbers:nextSeed,readingSide:CANDIDATES[i][0],strategy:CANDIDATES[i][1]
      })));
      const replay=[],known=[...nextSeed];
      for(let i=0;i<nextManual.length;i++){
        const number=nextManual[i];
        const prior=selectRegionalCoverage(views,known,replay);
        replay.push(settleRegionalCoverage(number,prior));
        views=await Promise.all(opened.map(channel=>channel.send({action:'SPIN',number})));
        known.push(number);
      }
      if(closed){release(opened);return;}
      seed=nextSeed;manual=nextManual;rows=replay;previews=views;
    }catch(error){
      release(opened);channels=[];previews=[];
      throw error;
    }
  }
  async function exclusive(text,job){
    if(busy||closed)return;
    busy=true;status(text);render();
    try{await job();}
    catch(error){if(!closed)status(error.message);}
    finally{busy=false;if(!closed)render();}
  }
  function append(number){
    return exclusive('Calculando o próximo giro…',async()=>{
      if(!previews.length)await rebuild(seed,manual);
      const prediction=current();
      try{
        const views=await Promise.all(channels.map(channel=>channel.send({action:'SPIN',number})));
        if(closed)return;
        previews=views;manual.push(number);rows.push(settleRegionalCoverage(number,prediction));
        status('');save();
      }catch(error){
        release(channels);channels=[];previews=[];
        throw error;
      }
    });
  }
  for(let n=0;n<=36;n++){
    const b=document.createElement('button');
    b.type='button';b.textContent=n;b.className=color(n);
    b.addEventListener('click',()=>append(n));buttons.push(b);$('keys').appendChild(b);
  }
  $('import').addEventListener('click',()=>{
    let numbers;
    try{numbers=parseHistory($('seed').value,$('order').value);}
    catch(error){status(error.message);return;}
    return exclusive('Importando histórico nos quatro motores…',async()=>{
      await rebuild(numbers,[]);
      if(closed)return;
      $('seed').value='';status('Histórico importado · '+seed.length+' números.');save();
    });
  });
  $('undo').addEventListener('click',()=>exclusive('Reconstruindo a sessão…',async()=>{
    await rebuild(seed,manual.slice(0,-1));
    if(!closed){status('Último giro desfeito.');save();}
  }));
  $('close').addEventListener('click',()=>{
    closed=true;release(channels);host.remove();
  });
  render();
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved&&Array.isArray(saved.seed)&&saved.seed.length>=8&&saved.seed.length<=70&&saved.seed.every(valid)&&
      Array.isArray(saved.manual)&&saved.manual.every(valid)){
      exclusive('Restaurando histórico…',async()=>{
        await rebuild(saved.seed,saved.manual);
        if(!closed)status('Histórico importado · '+seed.length+' números.');
      });
    }
  }catch{}
}

if(typeof module==='object'&&module.exports)module.exports={selectRegionalCoverage,settleRegionalCoverage,parseHistory,analysisBackground,CANDIDATES,SECTORS,WHEEL,REGIONAL_LAYOUTS};
if(typeof document!=='undefined'){
  if(document.body)install();
  else document.addEventListener('DOMContentLoaded',install,{once:true});
}

})();
