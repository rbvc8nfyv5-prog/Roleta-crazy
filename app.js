
(function () {
"use strict";

const KEY = "ANALISE_BETA_V35";
const OLD = [
  "ANALISE_BETA_VIRTUAL_V34",
  "ANALISE_BETA_VIRTUAL_V3",
  "ANALISE_BETA_DUZIAS_RX_12_V32"
];

const W = [
  32,15,19,4,21,2,25,17,34,6,
  27,13,36,11,30,8,23,10,5,24,
  16,33,1,20,14,31,9,22,18,29,
  7,28,12,35,3,26,0
];

const INDEX = new Map(W.map((n,i) => [n,i]));

const MOTORS = [
  "NORMAL",
  "DINAMICO",
  "RX_NORMAL",
  "RX_DINAMICO"
];

const RX = [4,5,6];

const PREFIX = {
  NORMAL:"N",
  DINAMICO:"D",
  RX_NORMAL:"RN",
  RX_DINAMICO:"RD"
};

const LABEL = {
  NORMAL:"NORMAL",
  DINAMICO:"DINÂMICO",
  RX_NORMAL:"RAIO-X NORMAL",
  RX_DINAMICO:"RAIO-X DINÂMICO"
};

const RED = new Set([
  1,3,5,7,9,12,14,16,18,
  19,21,23,25,27,30,32,34,36
]);

const mod = n => (n%37+37)%37;
const idx = n => INDEX.get(n) ?? -1;

function dist(a,b) {
  const d = Math.abs(idx(a)-idx(b));
  return Math.min(d,37-d);
}

function signed(a,b) {
  let d = mod(idx(b)-idx(a));
  return d>18 ? d-37 : d;
}

function neigh(n,r) {
  return Array.from(
    {length:r*2+1},
    (_,i) => W[mod(idx(n)+i-r)]
  );
}

function dozen(n) {
  return n===0 ? 0 :
    n<=12 ? 1 :
    n<=24 ? 2 : 3;
}

function color(n) {
  return n===0 ? "#087c48" :
    RED.has(n) ? "#b9233b" : "#171717";
}

const $ = id => document.getElementById(id);

function fmt(n) {
  return Number(n||0)
    .toFixed(2)
    .replace(".",",");
}

function clean(a) {
  return Array.isArray(a)
    ? a.map(Number)
        .filter(n =>
          Number.isInteger(n) &&
          n>=0 &&
          n<=36
        )
        .slice(-20)
    : [];
}

function matrix(f) {
  return Object.fromEntries(
    MOTORS.map(m => [
      m,
      Object.fromEntries(
        RX.map(r => [r,f()])
      )
    ])
  );
}

function fresh() {
  return {
    history:[],
    rank:3,
    mode:"AUTO",
    manual:"NORMAL",
    rx:4,

    lines:{
      AUTO:[],
      ...matrix(() => [])
    },

    pending:{
      AUTO:null,
      ...matrix(() => null)
    },

    frozen:{
      AUTO:null,
      ...matrix(() => null)
    },

    cards:[],
    cardFreeze:null,
    audit:null,

    openLines:false,
    openCandidates:false,
    openVirtual:true
  };
}

let s = fresh();

/* RECUPERAÇÃO DOS DADOS */

try {
  let raw = localStorage.getItem(KEY);

  if (!raw) {
    for (const k of OLD) {
      raw = localStorage.getItem(k);
      if (raw) break;
    }
  }

  if (raw) {
    const a = JSON.parse(raw);

    s.history = clean(a.history || a.historico);

    const savedRank = Number(
      a.rank ?? a.autoPosicao
    );

    s.rank = [1,2,3,4].includes(savedRank)
      ? savedRank : 3;

    s.mode = a.mode || a.modo || "AUTO";
    s.manual =
      a.manual || a.motorManual || "NORMAL";
    s.rx = Number(a.rx || a.manualRX || 4);

    s.openLines = !!(
      a.openLines ||
      a.painelTimelinesAberto ||
      a.linhasAbertas
    );

    s.openCandidates = !!(
      a.openCandidates ||
      a.painelCandidatosAberto
    );

    s.openVirtual =
      a.openVirtual ??
      a.jogadorVirtualAberto ??
      true;

    const lines = a.lines || a.timelines;
    const pending = a.pending || a.pendentes;
    const frozen = a.frozen || a.freezes;

    if (lines) {
      s.lines.AUTO = Array.isArray(lines.AUTO)
        ? lines.AUTO.slice(-20)
        : [];

      for (const m of MOTORS) {
        for (const r of RX) {
          s.lines[m][r] =
            Array.isArray(lines[m]?.[r])
              ? lines[m][r].slice(-20)
              : [];
        }
      }
    }

    if (pending) {
      s.pending.AUTO = pending.AUTO || null;

      for (const m of MOTORS) {
        for (const r of RX) {
          s.pending[m][r] =
            pending[m]?.[r] || null;
        }
      }
    }

    if (frozen) {
      s.frozen.AUTO = frozen.AUTO || null;

      for (const m of MOTORS) {
        for (const r of RX) {
          s.frozen[m][r] =
            frozen[m]?.[r] || null;
        }
      }
    }

    const cards = a.cards || a.visual;

    s.cards = Array.isArray(cards)
      ? cards.slice(-14)
      : [];

    s.cardFreeze =
      a.cardFreeze || a.visualFreeze || null;

    s.audit = a.audit || a.diagnostico || null;
  }
} catch (e) {
  console.warn(
    "Histórico anterior não pôde ser lido",
    e
  );
}

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(s)
    );
  } catch (e) {
    console.warn(e);
  }
}

/* ESTATÍSTICAS */

function stats(a) {
  const v = (a||[]).filter(x =>
    !x.wait &&
    !x.sem &&
    typeof x.hit==="boolean"
  );

  function rate(n) {
    const b = v.slice(-n);

    return b.length
      ? 100*b.filter(x=>x.hit).length/b.length
      : 0;
  }

  let losses = 0;

  for (
    let i=v.length-1;
    i>=0 && !v[i].hit;
    i--
  ) {
    losses++;
  }

  return {
    n:v.length,
    r10:rate(10),
    r20:rate(20),
    losses
  };
}

/* ANÁLISE FÍSICA */

function heat(history,r) {
  const v = new Float64Array(37);

  const decay = {
    4:0.78,
    5:0.82,
    6:0.86
  }[r];

  let weight = 1;

  for (let i=history.length-1;i>=0;i--) {
    for (let j=0;j<37;j++) {
      const d = dist(history[i],W[j]);

      if (d<=4) {
        v[j] +=
          [1,0.72,0.44,0.22,0.10][d] *
          weight;
      }
    }

    weight *= decay;
  }

  const max = Math.max(0.001,...v);

  return v.map(x=>x/max);
}

/* RAIO-X */

function rxMatch(history,r) {
  if (history.length<r*2+4) {
    return null;
  }

  const current = history.slice(-r);
  const samples = [];

  for (
    let i=0;
    i+r<history.length-r;
    i++
  ) {
    let score = 0;

    for (let k=0;k<r;k++) {
      score +=
        (
          dozen(history[i+k])===
          dozen(current[k])
            ? 0.70 : 0
        ) +
        0.30*(
          1-dist(history[i+k],current[k])/19
        );
    }

    samples.push({
      n:history[i+r],
      score:score/r
    });
  }

  samples.sort((a,b)=>b.score-a.score);

  const chosen = samples.slice(
    0,
    Math.max(
      4,
      Math.ceil(samples.length*0.30)
    )
  );

  const out = new Float64Array(37);

  for (const x of chosen) {
    for (let j=0;j<37;j++) {
      const d = dist(x.n,W[j]);

      if (d<=3) {
        out[j] +=
          [1,0.70,0.42,0.18][d] *
          (0.40+0.60*x.score);
      }
    }
  }

  const max = Math.max(0.001,...out);

  return {
    values:out.map(x=>x/max),

    similarity:
      chosen.reduce(
        (t,x)=>t+x.score,
        0
      ) /
      Math.max(1,chosen.length)*100
  };
}

/* PONTUAÇÃO DOS 12 MOTORES */

function scores(history,m,r) {
  const recent = heat(history,r);

  const rx = m.startsWith("RX")
    ? rxMatch(history,r)
    : null;

  if (m.startsWith("RX") && !rx) {
    return null;
  }

  const out = new Float64Array(37);

  for (let j=0;j<37;j++) {
    const n = W[j];
    const z = r-3;

    let near = 0;

    for (const h of history) {
      const d = dist(n,h);

      near += d<=3
        ? [1,0.72,0.40,0.15][d]
        : 0;
    }

    let score =
      (dozen(n)===z ? 0.60 : 0) +
      recent[j]*0.48 +
      near/Math.max(1,history.length)*0.60;

    if (m.startsWith("RX")) {
      score =
        score*0.72 +
        rx.values[j]*0.70;
    }

    if (m.includes("DINAMICO")) {
      const a = history.slice(-r);
      let v = 0;

      for (let i=0;i<a.length;i++) {
        const d = dist(n,a[i]);

        v +=
          (i+1)/a.length *
          (d<=5 ? (6-d)/6 : 0);
      }

      score += v*0.12;
    }

    out[j] = score;
  }

  return {
    out,
    similarity:rx?.similarity || 0
  };
}

/*
 GEOMETRIA
 Cinco blocos de 5 números.
 Um bloco de 3 números.
 Total: 28 números.
 Lacunas de zero ou pelo menos 2.
*/

function geometry(weights) {
  const p5 = new Float64Array(37);
  const p3 = new Float64Array(37);

  for (let c=0;c<37;c++) {
    for (let d=-2;d<=2;d++) {
      p5[c] +=
        weights[mod(c+d)] *
        (
          d===0 ? 1.22 :
          Math.abs(d)===1 ? 1.08 : 1
        );
    }

    for (let d=-1;d<=1;d++) {
      p3[c] +=
        weights[mod(c+d)] *
        (d===0 ? 1.22 : 1);
    }
  }

  let best = null;

  for (let start=0;start<37;start++) {
    for (let short=0;short<6;short++) {
      const sizes = [5,5,5,5,5,5];
      sizes[short] = 3;

      const memo = new Map();

      function solve(k,g) {
        if (k===6) {
          return g===9
            ? {value:0,gaps:[]}
            : null;
        }

        const key = k+"|"+g;

        if (memo.has(key)) {
          return memo.get(key);
        }

        let used = 0;

        for (let i=0;i<k;i++) {
          used += sizes[i];
        }

        const center = mod(
          start+
          used+
          g+
          Math.floor(sizes[k]/2)
        );

        const val = sizes[k]===3
          ? p3[center]
          : p5[center];

        let win = null;

        for (let gap=0;gap<=9-g;gap++) {
          if (gap===1) continue;

          const next = solve(k+1,g+gap);
          if (!next) continue;

          const total = val+next.value;

          if (!win || total>win.value) {
            win = {
              value:total,
              gaps:[gap,...next.gaps]
            };
          }
        }

        memo.set(key,win);
        return win;
      }

      const result = solve(0,0);

      if (
        !result ||
        (best && result.value<=best.value)
      ) {
        continue;
      }

      let cursor = start;
      const centers5 = [];
      let center3 = null;

      for (let k=0;k<6;k++) {
        const center = W[
          mod(
            cursor+
            Math.floor(sizes[k]/2)
          )
        ];

        if (sizes[k]===3) {
          center3 = center;
        } else {
          centers5.push(center);
        }

        cursor +=
          sizes[k]+result.gaps[k];
      }

      best = {
        value:result.value,
        centers5,
        center3
      };
    }
  }

  return best
    ? makePlay(
        best.centers5,
        best.center3,
        best.value
      )
    : null;
}

/* VALIDAÇÃO DA COBERTURA */

function makePlay(
  centers5,
  center3,
  score=0
) {
  if (
    centers5.length!==5 ||
    new Set([...centers5,center3]).size!==6
  ) {
    return null;
  }

  const blocks = [
    ...centers5.map(c=>({
      center:c,
      r:2,
      nums:neigh(c,2)
    })),

    {
      center:center3,
      r:1,
      nums:neigh(center3,1)
    }
  ];

  const numbers = new Set(
    blocks.flatMap(b=>b.nums)
  );

  if (numbers.size!==28) {
    return null;
  }

  for (let i=0;i<37;i++) {
    if (
      !numbers.has(W[i]) &&
      numbers.has(W[mod(i-1)]) &&
      numbers.has(W[mod(i+1)])
    ) {
      return null;
    }
  }

  return {
    centers5:[...centers5],
    center3,
    blocks,
    numbers,
    score,
    valid:true
  };
}

/* CONGELAMENTO */

function snapshot(c) {
  if (!c?.valid) return null;

  return {
    motor:c.motor,
    rx:c.rx,
    rank:c.rank,
    score:c.autoScore,
    centers5:[...c.play.centers5],
    center3:c.play.center3,
    history:s.history.join(",")
  };
}

function snapPlay(x) {
  return x
    ? makePlay(
        x.centers5 || x.centros2 || [],
        x.center3 ?? x.centro1
      )
    : null;
}

/* IDENTIFICAÇÃO DO ERRO */

function check(n,play) {
  if (!play) {
    return {
      hit:false,
      kind:"SEM",
      gap:99
    };
  }

  for (const b of play.blocks) {
    if (b.nums.includes(n)) {
      const d = dist(n,b.center);

      return {
        hit:true,
        kind:
          d===0 ? "ALVO" :
          d===1 ? "V1" : "V2",
        gap:0,
        center:b.center
      };
    }
  }

  const closest = play.blocks
    .map(b=>({
      center:b.center,
      r:b.r,
      gap:dist(n,b.center)-b.r,
      side:Math.sign(
        signed(b.center,n)
      )
    }))
    .sort((a,b)=>a.gap-b.gap)[0];

  return {
    hit:false,
    kind:"FORA",
    ...closest
  };
}

/*
 G1 AJUSTE FINO

 1. Localiza setor próximo ao erro.
 2. Testa deslocamento de ±1 e ±2.
 3. Primeiro tenta um único setor.
 4. Também testa deslocar o conjunto.
 5. Preserva 28 números e seis setores.
 6. Congela a nova jogada antes do G1.
*/

function tuneG1(original,miss) {
  const base = snapPlay(original);

  if (!base) return null;

  const err = check(miss,base);

  if (err.hit) {
    return {
      ...original,
      g1:{
        type:"ORIGINAL",
        shift:0,
        reason:"Cobertura já incluía resultado"
      }
    };
  }

  const near = base.blocks
    .slice()
    .sort(
      (a,b)=>
        (dist(miss,a.center)-a.r) -
        (dist(miss,b.center)-b.r)
    );

  const candidates = [];

  function add(p,type,shift,center) {
    if (!p) return;

    const coverage =
      check(miss,p).hit ? 1 : 0;

    const moved = p.blocks.reduce(
      (sum,b,i)=>
        sum+
        dist(
          b.center,
          base.blocks[i].center
        ),
      0
    );

    candidates.push({
      p,
      type,
      shift,
      center,
      coverage,
      moved
    });
  }

  /* AJUSTAR UM SETOR */

  for (const b of near) {
    for (const shift of [-2,-1,1,2]) {
      const newCenter = W[
        mod(idx(b.center)+shift)
      ];

      const centers = base.centers5.slice();
      let short = base.center3;

      if (b.r===1) {
        short = newCenter;
      } else {
        centers[
          centers.indexOf(b.center)
        ] = newCenter;
      }

      add(
        makePlay(centers,short),
        "SETOR",
        shift,
        b.center
      );
    }
  }

  /* AJUSTAR O CONJUNTO */

  for (const shift of [-2,-1,1,2]) {
    const move = c =>
      W[mod(idx(c)+shift)];

    add(
      makePlay(
        base.centers5.map(move),
        move(base.center3)
      ),
      "CONJUNTO",
      shift,
      null
    );
  }

  /*
   Critério:
   - Cobrir região do erro.
   - Menor deslocamento.
   - Preferir setor individual.
  */

  candidates.sort(
    (a,b)=>
      b.coverage-a.coverage ||
      a.moved-b.moved ||
      (
        a.type==="SETOR" ? -1 : 1
      )
  );

  const chosen = candidates[0];

  if (!chosen) {
    return {
      ...original,
      g1:{
        type:"SEM_AJUSTE",
        shift:0,
        miss,
        reason:
          "Nenhum deslocamento válido; "+
          "cobertura original mantida"
      }
    };
  }

  return {
    ...original,
    centers5:chosen.p.centers5,
    center3:chosen.p.center3,

    g1:{
      type:chosen.type,
      shift:chosen.shift,
      center:chosen.center,
      miss,
      coveredMiss:!!chosen.coverage,
      reason:
        "Deslocamento físico limitado "+
        "a 1 ou 2 casas"
    }
  };
}

/* CÁLCULO DOS 12 MOTORES */

let cachedKey = null;
let cached = null;

function invalidate() {
  cachedKey = null;
  cached = null;
}

function calculate() {
  const key =
    s.history.join(",") +
    "|" +
    MOTORS.flatMap(m =>
      RX.map(r=>{
        const t = stats(s.lines[m][r]);

        return [
          t.n,
          t.r10,
          t.r20,
          t.losses
        ].join(":");
      })
    ).join("|");

  if (
    cachedKey===key &&
    cached
  ) {
    return cached;
  }

  const configs = matrix(()=>null);
  const ranking = [];

  for (const m of MOTORS) {
    for (const r of RX) {
      const min = m.startsWith("RX")
        ? Math.max(14,r*2+4)
        : Math.max(8,r+4);

      if (s.history.length<min) {
        continue;
      }

      const v = scores(s.history,m,r);
      if (!v) continue;

      const play = geometry(v.out);
      if (!play) continue;

      const t = stats(s.lines[m][r]);

      const autoScore =
        play.score +
        t.r10*0.02 +
        t.r20*0.01 -
        t.losses*0.30 +
        v.similarity*0.005;

      const cfg = {
        motor:m,
        rx:r,
        valid:true,
        play,
        autoScore,
        similarity:v.similarity
      };

      configs[m][r] = cfg;
      ranking.push(cfg);
    }
  }

  ranking.sort(
    (a,b)=>
      b.autoScore-a.autoScore ||
      MOTORS.indexOf(a.motor)-
        MOTORS.indexOf(b.motor) ||
      a.rx-b.rx
  );

  ranking.forEach((c,i)=>{
    c.rank = i+1;
  });

  cachedKey = key;

  cached = {
    configs,
    ranking,

    auto:
      ranking[s.rank-1] ||
      ranking[ranking.length-1] ||
      null
  };

  return cached;
}

function active(d) {
  return s.mode==="AUTO"
    ? d.auto
    : d.configs[s.manual]?.[s.rx];
}

/* PREPARAR AS JOGADAS */

function prepare(d) {
  const key = s.history.join(",");

  if (
    !s.frozen.AUTO &&
    s.pending.AUTO?.history!==key
  ) {
    s.pending.AUTO = snapshot(d.auto);
  }

  for (const m of MOTORS) {
    for (const r of RX) {
      if (
        !s.frozen[m][r] &&
        s.pending[m][r]?.history!==key
      ) {
        s.pending[m][r] =
          snapshot(d.configs[m][r]);
      }
    }
  }
}

/* RESULTADO DA ENTRADA E G1 */

function evaluate(
  n,
  p,
  freeze,
  line,
  key
) {
  line = line.slice(-20);

  if (freeze) {
    const test = check(
      n,
      snapPlay(freeze)
    );

    const i = line.findLastIndex(
      x=>x.wait
    );

    if (i>=0) {
      line[i] = {
        ...line[i],
        wait:false,
        hit:test.hit,
        g1:n,
        phase:test.hit?"G1":"LOSS"
      };
    } else {
      line.push({
        n,
        hit:test.hit,
        g1:n,
        phase:test.hit?"G1":"LOSS"
      });
    }

    return {
      line:line.slice(-20),
      freeze:null,
      pending:null
    };
  }

  if (
    !p ||
    p.history!==key
  ) {
    line.push({
      n,
      sem:true,
      phase:"SEM"
    });

    return {
      line:line.slice(-20),
      freeze:null,
      pending:null
    };
  }

  const t = check(
    n,
    snapPlay(p)
  );

  if (t.hit) {
    line.push({
      n,
      hit:true,
      phase:"ENTRADA"
    });

    return {
      line:line.slice(-20),
      freeze:null,
      pending:null
    };
  }

  line.push({
    n,
    wait:true,
    phase:"ESPERA"
  });

  return {
    line:line.slice(-20),
    freeze:tuneG1(p,n),
    pending:null
  };
}

/* ATUALIZAR 13 TIMELINES */

function updateAll(n) {
  const key = s.history.join(",");

  const a = evaluate(
    n,
    s.pending.AUTO,
    s.frozen.AUTO,
    s.lines.AUTO,
    key
  );

  s.lines.AUTO = a.line;
  s.pending.AUTO = a.pending;
  s.frozen.AUTO = a.freeze;

  for (const m of MOTORS) {
    for (const r of RX) {
      const b = evaluate(
        n,
        s.pending[m][r],
        s.frozen[m][r],
        s.lines[m][r],
        key
      );

      s.lines[m][r] = b.line;
      s.pending[m][r] = b.pending;
      s.frozen[m][r] = b.freeze;
    }
  }
}

/* ADICIONAR RESULTADO */

function addNumber(n) {
  if (
    !Number.isInteger(n) ||
    n<0 ||
    n>36
  ) {
    return;
  }

  const d = calculate();

  prepare(d);

  const original = s.mode==="AUTO"
    ? s.pending.AUTO
    : s.pending[s.manual][s.rx];

  const preRank = d.ranking.map(c=>({
    motor:c.motor,
    rx:c.rx,
    rank:c.rank,
    score:c.autoScore,
    hit:check(n,c.play).hit
  }));

  const wasG1 = !!s.cardFreeze;
  const oldG1 = s.cardFreeze;

  updateAll(n);

  if (wasG1) {
    const t = check(
      n,
      snapPlay(oldG1)
    );

    const last = s.cards.at(-1);

    if (last) {
      last.g1 = n;
      last.hit = t.hit;
      last.phase = t.hit
        ? "G1"
        : "LOSS";
    }

    if (s.audit) {
      s.audit.title = t.hit
        ? "G1 ACERTOU COM AJUSTE"
        : "G1 FALHOU APÓS AJUSTE";

      s.audit.text +=
        " | G1: "+n+
        " — "+
        (t.hit?"ACERTO":"ERRO")+
        ".";
    }

    s.cardFreeze = null;

  } else {
    const t = check(
      n,
      snapPlay(original)
    );

    s.cards.push({
      n,
      hit:t.hit,
      sem:!original,
      phase:
        !original
          ? "SEM"
          : t.hit
            ? "ENTRADA"
            : "ESPERA"
    });

    const nextG1 =
      original && !t.hit
        ? tuneG1(original,n)
        : null;

    s.cardFreeze = nextG1;

    const alternative =
      preRank.filter(x=>x.hit);

    let adjustmentText =
      "Cobertura original preservada.";

    if (nextG1?.g1?.type==="SETOR") {
      adjustmentText =
        "Setor "+
        nextG1.g1.center+
        " deslocado "+
        nextG1.g1.shift+
        " posição(ões).";
    }

    if (nextG1?.g1?.type==="CONJUNTO") {
      adjustmentText =
        "Conjunto deslocado "+
        nextG1.g1.shift+
        " posição(ões).";
    }

    s.audit = {
      title:
        !original
          ? "SEM JOGADA"
          : t.hit
            ? "ACERTO NA ENTRADA"
            : "AJUSTE FINO PREPARADO PARA G1",

      text:
        !original
          ? "Histórico insuficiente."
          : t.hit
            ? "A cobertura inicial acertou o resultado "+n+"."
            : (
                "Resultado "+n+
                " fora da entrada. "+
                adjustmentText+
                " Alternativas que cobririam a primeira entrada: "+
                (
                  alternative.map(
                    x =>
                      x.rank+"º "+
                      LABEL[x.motor]+
                      " C"+x.rx
                  ).join(", ") ||
                  "nenhuma"
                )+
                ". A mudança não garante o próximo resultado."
              )
    };
  }

  s.cards = s.cards.slice(-14);

  s.history = clean([
    ...s.history,
    n
  ]);

  invalidate();
  save();
  render();
}

/* CONTROLES */

function resetLines() {
  const a = fresh();

  s.lines = a.lines;
  s.pending = a.pending;
  s.frozen = a.frozen;
  s.cards = [];
  s.cardFreeze = null;
  s.audit = null;

  invalidate();
}

function setRank(n) {
  s.rank = n;
  s.mode = "AUTO";

  if (!s.frozen.AUTO) {
    s.pending.AUTO = null;
  }

  invalidate();
  save();
  render();
}

function setMode(m,r) {
  s.mode =
    m==="AUTO" ? "AUTO" : "MANUAL";

  if (m!=="AUTO") {
    s.manual = m;
    s.rx = r;
  }

  save();
  render();
}

function insert() {
  const nums = (
    $("inputHistory").value.match(/\d+/g) ||
    []
  )
    .map(Number)
    .filter(n=>n>=0&&n<=36);

  if (!nums.length) return;

  s.history = clean(nums);

  resetLines();

  $("inputHistory").value = "";

  save();
  render();
}

function undo() {
  s.history.pop();
  resetLines();
  save();
  render();
}

function clear() {
  if (!confirm("Apagar todo o histórico?")) {
    return;
  }

  s.history = [];
  resetLines();
  save();
  render();
}

/* ESTILOS */

const css = `
*{box-sizing:border-box}

body{
  margin:0;
  background:#101014;
  color:#fff;
  font-family:Arial,sans-serif
}

.app{
  max-width:960px;
  margin:auto;
  padding:9px
}

h2{
  text-align:center;
  font-size:20px
}

.panel{
  background:#1c1e26;
  border:1px solid #3c414e;
  border-radius:10px;
  padding:11px;
  margin-bottom:9px
}

.head{
  width:100%;
  display:flex;
  justify-content:space-between;
  background:#292e3a;
  color:white;
  border:1px solid #4d5669;
  border-radius:7px;
  padding:11px;
  font-weight:bold
}

.hidden{
  display:none!important
}

.row{
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  margin:8px 0
}

.btn{
  padding:10px;
  border:1px solid #667083;
  border-radius:7px;
  background:#303746;
  color:white;
  font-weight:bold
}

.btn.selected{
  background:#087b99;
  border:2px solid #00d9ff
}

.rankButtons{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:6px
}

.rankButtons button{
  font-size:17px
}

.small{
  font-size:10px;
  color:#b4bfce;
  line-height:1.6
}

.accent{
  color:#00d9ff;
  font-size:12px;
  font-weight:bold;
  margin:8px 0
}

.grid6{
  display:grid;
  grid-template-columns:repeat(6,minmax(0,1fr));
  gap:5px
}

.center{
  padding:12px 0;
  border-radius:8px;
  text-align:center;
  background:#006fa7;
  border:2px solid #00cfff;
  font-size:24px;
  font-weight:bold
}

.center.short{
  background:#b98c0b;
  border-color:#ffe078;
  color:#111
}

.keys{
  display:grid;
  grid-template-columns:repeat(6,1fr);
  gap:5px
}

.key{
  height:43px;
  color:#fff;
  border:1px solid #666;
  border-radius:7px;
  font-weight:bold
}

.key.zero{
  grid-column:span 6
}

.line{
  display:grid;
  grid-template-columns:77px 1fr 36px;
  gap:4px;
  align-items:center;
  margin:8px 0;
  font-size:10px
}

.marks{
  display:flex;
  justify-content:flex-end;
  gap:2px;
  overflow:hidden
}

.mark{
  min-width:16px;
  height:19px;
  border-radius:3px;
  display:grid;
  place-items:center;
  font-size:8px;
  background:#555
}

.mark.good{background:#009d55}
.mark.bad{background:#b82b39}

.mark.g1{
  background:#ffcc22;
  color:#111
}

.mark.wait{
  background:#6c5818
}

.history{
  display:grid;
  grid-template-columns:repeat(7,1fr);
  gap:5px
}

.history span{
  padding:9px 2px;
  text-align:center;
  border-radius:6px;
  border:2px solid #555;
  font-size:12px;
  font-weight:bold
}

.audit{
  padding:11px;
  background:#101820;
  border:1px solid #36536b;
  border-radius:7px;
  font-size:12px;
  line-height:1.65
}

textarea{
  width:100%;
  height:65px;
  background:#0f121a;
  color:white;
  border:1px solid #667;
  padding:8px;
  border-radius:7px
}

.candidate{
  padding:7px;
  border-bottom:1px solid #363c48;
  font-size:11px
}

.candidate.pick{
  background:#123d4b;
  color:#00e5ff
}

.stats{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  font-size:11px;
  margin-top:8px
}

@media(max-width:600px){
  .history{
    grid-template-columns:repeat(4,1fr)
  }

  .center{
    font-size:19px
  }

  .mark{
    min-width:14px
  }
}
`;

/* ESTRUTURA VISUAL */

document.body.innerHTML = `
<style>${css}</style>

<main class="app">

  <h2>ANÁLISE BETA V3.5</h2>

  <section class="panel">

    <textarea
      id="inputHistory"
      placeholder="Cole os últimos 20 números"
    ></textarea>

    <div class="row">
      <button class="btn" id="insert">
        INSERIR
      </button>

      <button class="btn" id="undo">
        APAGAR ÚLTIMO
      </button>

      <button class="btn" id="clear">
        APAGAR TUDO
      </button>
    </div>

    <div class="small" id="status"></div>

  </section>

  <section class="panel">

    <button class="head" id="toggleCandidates">
      AUTO • 12 CANDIDATOS
      <span id="arrowCandidates">+</span>
    </button>

    <div class="row">
      <button class="btn" id="auto">
        AUTO
      </button>

      <div class="accent" id="autoLabel"></div>
    </div>

    <div class="small">
      POSIÇÃO DO AUTO (PADRÃO: 3º)
    </div>

    <div
      class="rankButtons"
      id="rankButtons"
    ></div>

    <div
      id="candidatePanel"
      class="hidden"
    >
      <div id="motorButtons"></div>
      <div id="candidates"></div>
    </div>

  </section>

  <section class="panel">

    <button class="head" id="toggleLines">
      LINHAS DO TEMPO • AUTO + 12 MOTORES
      <span id="arrowLines">+</span>
    </button>

    <div id="autoLine"></div>

    <div
      id="otherLines"
      class="hidden"
    ></div>

  </section>

  <section class="panel">

    <div class="small">
      ÚLTIMAS 14 JOGADAS
    </div>

    <div
      class="history"
      id="cards"
    ></div>

  </section>

  <section class="panel">

    <div
      class="accent"
      id="playLabel"
    >
      JOGADA ATUAL
    </div>

    <div
      class="grid6"
      id="play"
    ></div>

    <div
      class="small"
      id="g1Info"
    ></div>

  </section>

  <section class="panel">

    <div class="small">
      TECLADO
    </div>

    <div
      class="keys"
      id="keys"
    ></div>

  </section>

  <section class="panel">

    <button
      class="head"
      id="toggleVirtual"
    >
      JOGADOR VIRTUAL • AJUSTE G1
      <span id="arrowVirtual">−</span>
    </button>

    <div
      class="audit"
      id="virtual"
    ></div>

  </section>

</main>
`;

/* EVENTOS */

$("insert").onclick = insert;
$("undo").onclick = undo;
$("clear").onclick = clear;

$("auto").onclick = () =>
  setMode("AUTO");

$("toggleCandidates").onclick = () => {
  s.openCandidates = !s.openCandidates;
  save();
  render();
};

$("toggleLines").onclick = () => {
  s.openLines = !s.openLines;
  save();
  render();
};

$("toggleVirtual").onclick = () => {
  s.openVirtual = !s.openVirtual;
  save();
  render();
};

/* TECLADO */

for (let n=1;n<=36;n++) {
  const b = document.createElement("button");

  b.className = "key";
  b.textContent = n;
  b.style.background = color(n);

  b.onclick = () => addNumber(n);

  $("keys").appendChild(b);
}

const zero = document.createElement("button");

zero.className = "key zero";
zero.textContent = "0";
zero.style.background = color(0);
zero.onclick = () => addNumber(0);

$("keys").appendChild(zero);

/* BOTÕES DO RANKING */

for (let n=1;n<=4;n++) {
  const b = document.createElement("button");

  b.className = "btn";
  b.id = "rank"+n;
  b.textContent = n+"º";

  b.onclick = () => setRank(n);

  $("rankButtons").appendChild(b);
}

/* BOTÕES DOS 12 MOTORES */

for (const m of MOTORS) {
  const div = document.createElement("div");

  div.className = "row";

  div.innerHTML =
    '<strong class="small" style="width:100%">'+
    LABEL[m]+
    "</strong>";

  for (const r of RX) {
    const b = document.createElement("button");

    b.className = "btn";
    b.id = "motor"+PREFIX[m]+r;
    b.textContent = "C"+r;

    b.onclick = () => setMode(m,r);

    div.appendChild(b);
  }

  $("motorButtons").appendChild(div);
}

/* RENDERIZAÇÃO DAS TIMELINES */

function lineHtml(name,items) {
  const valid = stats(items);

  const marks = items.slice(-20)
    .map(x=>{
      const classe =
        x.sem ? "" :
        x.wait ? "wait" :
        x.phase==="G1" ? "g1" :
        x.hit ? "good" : "bad";

      const texto =
        x.sem ? "—" :
        x.wait ? "…" :
        x.phase==="G1" ? "G1" :
        x.hit ? "G" : "L";

      return (
        '<span class="mark '+classe+'">'+
        texto+
        "</span>"
      );
    })
    .join("");

  return `
    <div class="line">
      <b>${name}</b>
      <div class="marks">${marks}</div>
      <b>
        ${
          valid.n
            ? Math.round(valid.r20)+"%"
            : "—"
        }
      </b>
    </div>
  `;
}

/* RENDERIZAÇÃO PRINCIPAL */

function render() {
  const d = calculate();

  prepare(d);

  $("status").textContent =
    s.history.length+
    "/20 números • "+
    d.ranking.length+
    "/12 motores válidos • "+
    "28 cobertos • 9 descobertos";

  $("autoLabel").textContent =
    d.auto
      ? (
          "AUTO "+s.rank+"º: "+
          LABEL[d.auto.motor]+
          " C"+d.auto.rx+
          " • "+fmt(d.auto.autoScore)
        )
      : "AGUARDANDO MOTORES";

  $("auto").classList.toggle(
    "selected",
    s.mode==="AUTO"
  );

  for (let n=1;n<=4;n++) {
    $("rank"+n).classList.toggle(
      "selected",
      s.rank===n
    );
  }

  for (const m of MOTORS) {
    for (const r of RX) {
      $("motor"+PREFIX[m]+r)
        .classList.toggle(
          "selected",
          s.mode==="MANUAL" &&
          s.manual===m &&
          s.rx===r
        );
    }
  }

  /* CANDIDATOS */

  $("candidatePanel").classList.toggle(
    "hidden",
    !s.openCandidates
  );

  $("arrowCandidates").textContent =
    s.openCandidates ? "−" : "+";

  $("candidates").innerHTML =
    d.ranking.map(c=>`
      <div class="candidate ${
        d.auto===c ? "pick" : ""
      }">
        ${c.rank}º •
        ${LABEL[c.motor]}
        C${c.rx} •
        ${fmt(c.autoScore)}
        ${d.auto===c?" • AUTO":""}
      </div>
    `).join("");

  /* LINHA DO TEMPO AUTO */

  $("autoLine").innerHTML =
    lineHtml(
      "AUTO",
      s.lines.AUTO
    );

  /* OUTRAS 12 LINHAS */

  $("otherLines").classList.toggle(
    "hidden",
    !s.openLines
  );

  $("arrowLines").textContent =
    s.openLines ? "−" : "+";

  $("otherLines").innerHTML =
    MOTORS.map(m=>
      '<div class="small" style="margin-top:10px">'+
      LABEL[m]+
      "</div>"+
      RX.map(r=>
        lineHtml(
          "C"+r,
          s.lines[m][r]
        )
      ).join("")
    ).join("");

  /* ÚLTIMAS 14 JOGADAS */

  $("cards").innerHTML =
    s.cards.map(x=>{
      const border =
        x.phase==="G1" ? "#ffcc22" :
        x.hit ? "#00bd68" :
        x.phase==="LOSS" ? "#f04a5d" :
        "#777";

      const status =
        x.phase==="G1" ? "G1" :
        x.phase==="ESPERA" ? "…" :
        x.hit ? "G" :
        x.phase==="LOSS" ? "L" :
        "—";

      return `
        <span
          style="
            background:${color(x.n)};
            border-color:${border}
          "
        >
          ${x.n}

          <small style="display:block">
            ${status}
            ${
              x.g1!=null
                ? " / "+x.g1
                : ""
            }
          </small>
        </span>
      `;
    }).join("");

  /* JOGADA ATUAL OU G1 CONGELADO */

  const freeze =
    s.mode==="AUTO"
      ? s.frozen.AUTO
      : s.frozen[s.manual][s.rx];

  const cfg = active(d);

  const play = freeze
    ? snapPlay(freeze)
    : cfg?.play;

  $("playLabel").textContent =
    freeze
      ? (
          "G1 • AJUSTE FINO CONGELADO • "+
          LABEL[freeze.motor]+
          " C"+freeze.rx
        )
      : cfg
        ? (
            "JOGADA INICIAL • "+
            LABEL[cfg.motor]+
            " C"+cfg.rx
          )
        : "AGUARDANDO JOGADA";

  const blocks = play?.blocks
    .slice()
    .sort(
      (a,b)=>
        idx(a.center)-idx(b.center)
    ) || [];

  $("play").innerHTML =
    blocks.map(b=>`
      <div
        class="center ${
          b.r===1 ? "short" : ""
        }"
        title="${b.nums.join(", ")}"
      >
        ${b.center}
      </div>
    `).join("");

  const g = freeze?.g1;

  $("g1Info").textContent =
    g
      ? (
          "G1: "+g.type+
          " • DESLOCAMENTO "+g.shift+
          " • ERRO ANTERIOR "+g.miss+
          " • 28 NÚMEROS SEM SOBREPOSIÇÃO"
        )
      : (
          "AZUL: 2 VIZINHOS • "+
          "AMARELO: 1 VIZINHO • "+
          "28 NÚMEROS"
        );

  /* JOGADOR VIRTUAL */

  $("virtual").classList.toggle(
    "hidden",
    !s.openVirtual
  );

  $("arrowVirtual").textContent =
    s.openVirtual ? "−" : "+";

  $("virtual").textContent =
    s.audit
      ? (
          s.audit.title+
          " — "+
          s.audit.text
        )
      : (
          "Aguardando resultado "+
          "para avaliar o G1."
        );

  save();
}

/* INICIAR */

render();

})();
