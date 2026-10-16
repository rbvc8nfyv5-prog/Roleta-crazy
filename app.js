(() => {
"use strict";

/*
=========================================================
                  ANÁLISE BETA V6.4.2
=========================================================

BASE: V6.4.1 / V6.4.0 / V6.3.9.

MANTIDO:
- 12 motores e geometria de 28 números.
- 7 estratégias originais.
- 12 adaptativas.
- 4 posições AUTO.
- Estratégias personalizadas.
- Treinador Global original.
- Treinador Global Números.
- Treinador Global Números 1.0 independente.
- Treinador Global G1.
- Congelada, ajuste fino e reconstrução.
- Continuidade, deslocamento e ruptura.
- Histórico, laboratório, linha do tempo e resultados.
- Janela 70 + 10 com fechamento do ciclo real.

INTEGRADO AOS CÁLCULOS:
- Triangulação e memória de pares.
- Encadeamento de trincas.
- Alternância A → B → A' → B'.
- Retornos por vizinhança.
- Dois polos móveis e seus deslocamentos.
- Interrupção, retomada e ruptura dos polos.
- Detecção de arcos físicos contíguos.
- Permanência, saída, afastamento e reentrada.
- Validação virtual por contexto espacial.
- Pesos espaciais em todos os motores.
- Contextos espaciais no Treinador Global.
- Contextos espaciais nos treinadores numéricos e G1.

REGRAS:
- O contexto é capturado antes do resultado avaliado.
- Simulações retrospectivas são identificadas como virtuais.
- Reprovadas permanecem bloqueadas por gatilho.
- A defesa congelada mantém sua geometria.
- O ciclo real não é reconstruído enquanto estiver aberto.
- Versão e armazenamento próprios: V6.4.2.

Os deslocamentos são relações entre posições dos resultados.
Não são medições do movimento real da bola.
Os índices históricos não garantem resultados futuros.
=========================================================
*/

const VERSION="6.4.2";
const KEY="ANALISE_BETA_V642";
const N10="NUMBER10";

const OLD_KEYS=[
"ANALISE_BETA_V641",
"ANALISE_BETA_V640",
"ANALISE_BETA_V639",
"ANALISE_BETA_V638",
"ANALISE_BETA_V637",
"ANALISE_BETA_V636",
"ANALISE_BETA_V635",
"ANALISE_BETA_V634",
"ANALISE_BETA_V633"
];

const WINDOW=70;
const MANUAL_LIMIT=10;

const W=[
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const RED=new Set([
1,3,5,7,9,12,14,16,18,
19,21,23,25,27,30,32,34,36
]);

const REGIONS={
TIERS:[27,13,36,11,30,8,23,10,5,24,16,33],
ORFAOS:[17,34,6,1,20,14,31,9],
VOISINS:[22,18,29,7,25,2,21,4,19],
ZERO:[28,12,35,3,26,0,32,15]
};

const FAMILIES=[
"NORMAL","DINAMICO","RX_NORMAL","RX_DINAMICO"
];

const RADII=[4,5,6];

const ORIGINALS=[
["FIXED","AUTO RANKING"],
["GEO","MELHOR GEOMETRIA"],
["BEST","MELHOR DESEMPENHO"],
["STABLE","ESTABILIDADE"],
["SWITCH","TROCA INTELIGENTE"],
["CONSENSUS","CONSENSO"],
["UNION","UNIÃO"]
];

const ADAPTATIVES=Array.from({length:12},(_,i)=>({
id:"A"+String(i+1).padStart(2,"0"),
name:"ADAPTATIVA "+String(i+1).padStart(2,"0"),
window:[10,10,10,20,20,20,30,30,20,30,20,30][i],
margin:[.05,.10,.15,.05,.10,.15,.05,.10,.08,.12,.10,.08][i],
maxRank:[12,12,12,12,12,12,12,12,12,6,4,8][i]
}));

const G1_MODES=["CONGELADA","AJUSTE FINO","RECONSTRUÇÃO"];
const BEHAVIORS=["CONTINUIDADE","DESLOCAMENTO","RUPTURA"];

const $=id=>document.getElementById(id);
const mod=n=>(n%37+37)%37;
const ix=n=>W.indexOf(n);
const avg=a=>a.length?a.reduce((s,n)=>s+n,0)/a.length:0;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
const fmt=n=>Number.isFinite(n)?n.toFixed(2).replace(".",","):"—";
const pct=(a,b)=>b?fmt(100*a/b)+"%":"—";

function esc(x) {
return String(x??"").replace(/[&<>"']/g,c=>({
"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
}

function cleanNumbers(a) {
return Array.isArray(a)
?a.filter(n=>Number.isInteger(n)&&n>=0&&n<=36):[];
}

function neighbors(n,r) {
const p=ix(n);
if(p<0)return [];
return Array.from({length:2*r+1},(_,i)=>W[mod(p+i-r)]);
}

function distance(a,b) {
const x=ix(a),y=ix(b);
if(x<0||y<0)return 18;
const d=Math.abs(x-y);
return Math.min(d,37-d);
}

function direction(a,b) {
const x=ix(a),y=ix(b);
if(x<0||y<0)return 0;
const f=mod(y-x),r=mod(x-y);
return f<=r?f:-r;
}

function region(n) {
return Object.keys(REGIONS).find(
k=>REGIONS[k].includes(n)
)||"ZERO";
}

const MIRROR=new Set();

for(const n of [11,12,13,21,22,23,31,32,33]) {
for(const x of neighbors(n,1))MIRROR.add(x);
}

function mirror(n) {
return MIRROR.has(n)?"ESPELHO":"ANTIESPELHO";
}

/* ======================================================
 ESTADO
====================================================== */

function freshN10() {
return {
books:{},
archive:[],
pending:[],
events:[],
choice:null,
sequence:0,
viewTrigger:"CURRENT",
viewAll:false
};
}

function fresh() {
return {
history:[],
sources:[],
manualCount:0,
manualLog:[],
cyclesCompleted:0,
recalcPending:false,
migrationPending:false,

strategy:"TRAINER",
rank:3,
manual:null,
adaptive:"A05",
created:[],
activeCreated:null,

g1:true,
g1Trainer:true,
galeSkip:false,
secondHouse:false,

stake:1,
multiplier:1,

phase:"ENTRY",
cycle:null,
defense:null,
previous:null,

trainerChoice:null,
trainerTurns:0,
trainerChanges:0,
trainerPending:false,
trainerHistory:[],

numberChoice:null,
numberChanges:0,
numberHistory:[],
numberCombinations:[],
numberComparisons:[],

n10:freshN10(),
virtual:{},
entryRows:[],
g1Rows:[],
g1Pending:[],
realG1:[],
decisions:[],
ledger:[],

open:{
general:true,
trainer:true,
numbertrainer:true,
numbertrainer10:true,
triangulation:true,
spatial:true,
g1ranking:true,
g1numbers:true,
motors:false,
jumps:false,
mirrors:false,
timeline:true,
lab:false
}
};
}

function read(key) {
try {
return JSON.parse(localStorage.getItem(key)||"null");
} catch {
return null;
}
}

function pack10(value) {
return JSON.parse(JSON.stringify(value,(key,item)=>{
if(key==="play"&&validPlay(item)) {
return {shape10:signature10(item),score:item.score};
}
return item;
}));
}

function unpack10(value) {
if(!value||typeof value!=="object")return freshN10();

return JSON.parse(JSON.stringify(value),(key,item)=>{
if(item&&typeof item.shape10==="string") {
const blocks=item.shape10.split("|").map(part=>{
const [radius,center]=part.split(":").map(Number);
return {center,radius,numbers:neighbors(center,radius)};
});

const play={
blocks,
numbers:blocks.flatMap(b=>b.numbers),
score:item.score
};

if(!validPlay(play)) {
throw new Error("GEOMETRIA SALVA DO TREINADOR 1.0 INVÁLIDA.");
}

return play;
}
return item;
});
}

let state=fresh();
let busy=false;
let saveError="";
let legacyData=null;

function normalizeState(data) {
const result={
...fresh(),
...data,
open:{...fresh().open,...(data.open||{})}
};

result.history=cleanNumbers(result.history).slice(-100);
result.manualCount=Math.max(0,Number(result.manualCount)||0);

for(const name of [
"manualLog","sources","created","trainerHistory",
"numberHistory","numberCombinations","numberComparisons",
"entryRows","g1Rows","g1Pending","realG1","decisions","ledger"
]) {
if(!Array.isArray(result[name]))result[name]=[];
}

if(!result.virtual||typeof result.virtual!=="object") {
result.virtual={};
}

try {
result.n10={...freshN10(),...unpack10(data.n10)};

if(!result.n10.books||typeof result.n10.books!=="object") {
result.n10.books={};
}

for(const name of ["archive","pending","events"]) {
if(!Array.isArray(result.n10[name]))result.n10[name]=[];
}

} catch(e) {
result.n10=freshN10();
saveError=String(e.message||e);
}

return result;
}

const saved=read(KEY);

if(saved&&Array.isArray(saved.history)) {
state=normalizeState(saved);

} else {
for(const key of OLD_KEYS) {
const data=read(key);
if(data?.history?.length) {
legacyData=data;
break;
}
}
}

function save() {
try {
localStorage.setItem(KEY,JSON.stringify({
...state,
n10:pack10(state.n10),
numberCombinations:state.numberCombinations.slice(-100),
numberComparisons:state.numberComparisons.slice(-300),
numberHistory:state.numberHistory.slice(-300),
entryRows:state.entryRows.slice(-4000),
g1Rows:state.g1Rows.slice(-5000),
ledger:state.ledger.slice(-300),
realG1:state.realG1.slice(-300),
decisions:state.decisions.slice(-300),
trainerHistory:state.trainerHistory.slice(-300)
}));

saveError="";
return true;

} catch(e) {
saveError=String(e.message||e);
return false;
}
}

function settings() {
return {
strategy:state.strategy,
rank:state.rank,
manual:state.manual,
adaptive:state.adaptive,
created:copy(state.created),
activeCreated:state.activeCreated,
g1:state.g1,
g1Trainer:state.g1Trainer,
galeSkip:state.galeSkip,
secondHouse:state.secondHouse,
stake:state.stake,
multiplier:state.multiplier,
open:copy(state.open)
};
}

/* ======================================================
 GEOMETRIA ORIGINAL: 5 BLOCOS DE 5 + 1 BLOCO DE 3
====================================================== */

const FIVE=W.map(n=>({
center:n,radius:2,numbers:neighbors(n,2)
}));

const THREE=W.map(n=>({
center:n,radius:1,numbers:neighbors(n,1)
}));

for(const b of [...FIVE,...THREE]) {
b.mask=b.numbers.reduce(
(s,n)=>s|(1n<<BigInt(ix(n))),0n
);
}

function geometry(weights,mandatory=[]) {
const scoreBlock=b=>({
...b,
value:b.numbers.reduce((s,n)=>s+(weights[ix(n)]||0),0)
});

const fives=FIVE.map(scoreBlock).sort(
(a,b)=>b.value-a.value
);

const threes=THREE.map(scoreBlock)
.filter(b=>mandatory.every(n=>b.numbers.includes(n)))
.sort((a,b)=>b.value-a.value);

let best=null;

for(const small of threes) {
let beam=[{
blocks:[small],
mask:small.mask,
score:small.value
}];

for(let step=0;step<5;step++) {
const next=[];

for(const item of beam) {
for(const b of fives) {
if((item.mask&b.mask)!==0n)continue;

next.push({
blocks:[...item.blocks,b],
mask:item.mask|b.mask,
score:item.score+b.value
});
}
}

next.sort((a,b)=>b.score-a.score);
beam=[];

const seen=new Set();

for(const item of next) {
const key=String(item.mask);
if(seen.has(key))continue;

seen.add(key);
beam.push(item);

if(beam.length>=6)break;
}

if(!beam.length)break;
}

for(const item of beam) {
if(item.blocks.length!==6)continue;
if(!best||item.score>best.score)best=item;
}
}

if(!best)return null;

const blocks=best.blocks.map(b=>({
center:b.center,
radius:b.radius,
numbers:[...b.numbers]
}));

const numbers=blocks.flatMap(b=>b.numbers);

if(new Set(numbers).size!==28)return null;

return {blocks,numbers,score:best.score};
}

function validPlay(play) {
return !!play&&
Array.isArray(play.numbers)&&
play.numbers.length===28&&
new Set(play.numbers).size===28&&
Array.isArray(play.blocks)&&
play.blocks.length===6&&
play.blocks.filter(b=>b.radius===2).length===5&&
play.blocks.filter(b=>b.radius===1).length===1;
}

function missing(play) {
if(!validPlay(play))return [...W];
const set=new Set(play.numbers);
return W.filter(n=>!set.has(n));
}

/* ======================================================
 TRIANGULAÇÃO
====================================================== */

const triangleCache=new Map();

function pointTriangle(n) {
const a=2*Math.PI*ix(n)/37;
return {x:Math.sin(a),y:Math.cos(a)};
}

function angleTriangle(a,b,c) {
const u={x:a.x-b.x,y:a.y-b.y};
const v={x:c.x-b.x,y:c.y-b.y};

const d=
Math.hypot(u.x,u.y)*
Math.hypot(v.x,v.y);

return d<1e-12
?null
:Math.acos(clamp(
(u.x*v.x+u.y*v.y)/d,-1,1
))*180/Math.PI;
}

function triangleFeatures(a,b,c) {
const s1=direction(a,b);
const s2=direction(b,c);
const closure=distance(a,c);

const p=pointTriangle(a);
const q=pointTriangle(b);
const r=pointTriangle(c);

const area=Math.abs(
(q.x-p.x)*(r.y-p.y)-
(q.y-p.y)*(r.x-p.x)
)/2;

let type="MUDANÇA DE SETOR";

if(a===b&&b===c)type="REPETIÇÃO";
else if(a===c)type="RETORNO EXATO";
else if(b===c)type="REPETIÇÃO FINAL";
else if(!s1)type="SAÍDA DA REPETIÇÃO";
else if(Math.sign(s1)===Math.sign(s2))type="CONTINUAÇÃO";
else if(closure<Math.abs(s1))type="RETORNO PARCIAL";
else type="INVERSÃO COM AFASTAMENTO";

return {
a,b,c,s1,s2,closure,area,type,

chords:[
Math.hypot(p.x-q.x,p.y-q.y),
Math.hypot(q.x-r.x,q.y-r.y),
Math.hypot(p.x-r.x,p.y-r.y)
],

angles:[
angleTriangle(q,p,r),
angleTriangle(p,q,r),
angleTriangle(p,r,q)
],

degenerate:area<1e-10
};
}

function triangleContext(h) {
if(h.length<3)return "SEM TRINCA";

const f=triangleFeatures(...h.slice(-3));

return f.type+"|"+
Math.sign(f.s2)+"|"+
Math.floor(Math.abs(f.s2)/4);
}

function triangleAnalysis(h) {
const key=h.join(",");
if(triangleCache.has(key))return triangleCache.get(key);

const triples=[];

for(let i=0;i+2<h.length;i++) {
triples.push({
...triangleFeatures(h[i],h[i+1],h[i+2]),
turn:i+3
});
}

const weights=Array(37).fill(1);
const counts={};
const last=triples.at(-1)||null;

for(const t of triples) {
counts[t.type]=(counts[t.type]||0)+1;
}

let matches=0;
let exactPairs=0;

if(h.length>=2) {
const a=h.at(-2),b=h.at(-1);
const jump=direction(a,b);

const candidates=W.map(
n=>triangleFeatures(a,b,n)
);

for(const t of triples) {
const signMatch=Math.sign(t.s1)===Math.sign(jump);

const hopSimilarity=
Math.exp(-Math.abs(t.s1-jump)/4)*
(signMatch?1:.2);

const physicalContext=Math.exp(
-(distance(a,t.a)+distance(b,t.b))/10
);

const recency=Math.exp(
-(h.length-t.turn)/30
);

const exact=t.a===a&&t.b===b;

if(exact)exactPairs++;
if(hopSimilarity>.3)matches++;

for(let j=0;j<37;j++) {
const f=candidates[j];

const second=Math.exp(
-Math.abs(f.s2-t.s2)/3.5
);

const close=Math.exp(
-Math.abs(f.closure-t.closure)/4
);

const area=Math.exp(
-Math.abs(f.area-t.area)*2
);

const angle=
f.angles[1]==null||t.angles[1]==null
?(f.degenerate===t.degenerate?1:.2)
:Math.exp(-Math.abs(f.angles[1]-t.angles[1])/30);

const shape=f.type===t.type?1:.15;

weights[j]+=
recency*
(hopSimilarity*.7+physicalContext*.3)*
(
second*.40+
close*.20+
area*.10+
angle*.10+
shape*.20
);

if(exact) {
weights[j]+=
recency*2*
Math.exp(-distance(W[j],t.c)/1.8);
}
}
}
}

const mean=avg(weights)||1;

const result={
triples,
last,
weights:weights.map(x=>x/mean),
counts,
matches,
exactPairs,
context:triangleContext(h),
samples:triples.length
};

triangleCache.set(key,result);

if(triangleCache.size>120) {
triangleCache.delete(triangleCache.keys().next().value);
}

return result;
}

function applyTriangle(weights,h,strength=.28) {
const a=triangleAnalysis(h);
if(!a.samples)return weights;

const scale=avg(weights.map(x=>Math.max(0,x)))||1;
const reliability=Math.min(1,a.samples/20);

for(let j=0;j<37;j++) {
weights[j]=Math.max(
.001,
weights[j]+scale*strength*reliability*
clamp(a.weights[j]-1,-.75,2)
);
}

return weights;
}

function triangleCoverage(play,h) {
if(!validPlay(play))return 0;

const w=triangleAnalysis(h).weights;

return play.numbers.reduce(
(s,n)=>s+w[ix(n)],0
)/w.reduce((s,v)=>s+v,0);
}

function triangleContextMetrics(rows,h) {
const context=triangleContext(h);
const selected=rows.filter(r=>r.triangleKey===context);
const hits=selected.filter(r=>r.result!=="LOSS").length;

return {
context,
total:selected.length,
hits,
loss:selected.length-hits,
score:(hits+(28/37)*8)/(selected.length+8)
};
}

/* ======================================================
 V6.4.2: ARCOS, POLOS E ENCADEAMENTO

Todos os rastreadores são reconstruídos cronologicamente.
O arco usado para avaliar um resultado é escolhido usando
somente o prefixo anterior a esse resultado.

Arcos:
- 8 posições físicas contíguas.
- Comparação nos últimos 20 resultados conhecidos.
- Formação com pelo menos 6 resultados disponíveis.
- Persistência com histerese para reduzir trocas por empate.

Polos:
- Formação a partir de A B A' B'.
- Fechamento inicial de até 2 casas em cada polo.
- Separação mínima de 8 casas.
- Acompanhamento dentro de até 4 casas de cada polo.
- Dois resultados consecutivos fora encerram o episódio.
====================================================== */

const spaceCache=new Map();

const nearBand=n=>
n===0?"0":
n<=2?"1-2":
n<=4?"3-4":
n<=8?"5-8":"9+";

function arcCandidates(h) {
const recent=h.slice(-20);

return W.map((_,start)=>{
const numbers=Array.from(
{length:8},
(_,j)=>W[mod(start+j)]
);

return {
start,
numbers,
count:recent.filter(n=>numbers.includes(n)).length,
total:recent.length
};

}).sort((a,b)=>
b.count-a.count||a.start-b.start
);
}

function selectArc(h,active) {
if(h.length<6)return null;

const ranked=arcCandidates(h);
const best=ranked[0];

if(best.count<Math.max(3,Math.ceil(best.total*.3))) {
return active
?ranked.find(x=>x.start===active.start)
:null;
}

if(!active)return best;

const old=ranked.find(
x=>x.start===active.start
);

return (
best.count>old.count+1||
(active.outside>=3&&best.count>old.count)
)?best:old;
}

function trackArcs(h) {
let active=null;

const events=[];
const transitions={};

function setArc(candidate,turn) {
if(!candidate)return;

if(active?.start===candidate.start) {
active.count=candidate.count;
active.total=candidate.total;
return;
}

const previous=active?.start;

active={
...candidate,
id:"ARC@"+turn+":"+candidate.start,
formedBefore:turn,
lastInside:null,
event:"NOVO ARCO",
inside:0,
outside:0,
entries:0,
exits:0,
returns:0,
lastGap:0,
maxGap:0,

drift:previous==null
?0:direction(W[previous],W[candidate.start])
};
}

for(let i=0;i<h.length;i++) {
setArc(
selectArc(h.slice(0,i),active),
i+1
);

if(!active)continue;

const number=h[i];
const inside=active.numbers.includes(number);
const priorEvent=active.event;

if(active.lastInside!=null) {
const bucket=transitions[priorEvent]||
(transitions[priorEvent]={total:0,hits:0});

bucket.total++;
if(inside)bucket.hits++;
}

if(inside) {
if(active.lastInside===false) {
active.lastGap=active.outside;
active.returns++;
active.entries++;
active.event="REENTRADA";

} else if(active.lastInside===true) {
active.event="PERMANÊNCIA";

} else {
active.event="ENTRADA";
active.entries++;
}

active.inside=active.lastInside===true
?active.inside+1:1;

active.outside=0;

} else {
if(active.lastInside===true) {
active.exits++;
active.event="SAÍDA";

} else {
active.event=active.outside>=3
?"AFASTAMENTO":"FORA";
}

active.outside++;
active.inside=0;

active.maxGap=Math.max(
active.maxGap,active.outside
);
}

active.lastInside=inside;

events.push({
turn:i+1,
number,
arcId:active.id,
start:active.start,
event:active.event,
inside,
gap:active.lastGap,
outside:active.outside
});
}

/*
A seleção após o último resultado prepara somente
o contexto do próximo giro. Não reclassifica o passado.
*/

setArc(selectArc(h,active),h.length+1);

return {
active,
events,
transitions,
ranked:arcCandidates(h)
};
}

function trackPoles(h) {
let active=null;

const events=[];
const episodes=[];

for(let i=0;i<h.length;i++) {
const n=h[i];

if(active?.active) {
const expected=1-active.lastSide;

const de=distance(
n,active.anchors[expected]
);

const ds=distance(
n,active.anchors[active.lastSide]
);

if(de<=4&&de<=ds) {
const interrupted=
active.event!=="ALTERNÂNCIA"&&
active.event!=="FORMADO";

const shift=direction(
active.anchors[expected],n
);

active.drift[expected]+=shift;
active.lastShift[expected]=shift;
active.anchors[expected]=n;
active.lastSide=expected;
active.alternations++;
active.outside=0;

active.event=interrupted
?"RETOMADA":"ALTERNÂNCIA";

} else if(ds<=4) {
const side=active.lastSide;
const shift=direction(active.anchors[side],n);

active.lastShift[side]=shift;
active.drift[side]+=shift;
active.anchors[side]=n;
active.interruptions++;
active.outside=0;
active.event="INTERRUPÇÃO";

} else {
active.outside++;

active.event=active.outside>=2
?"RUPTURA":"SAÍDA DOS POLOS";

if(active.outside>=2) {
active.active=false;
episodes.push(copy(active));
}
}

events.push({
turn:i+1,
number:n,
event:active.event,
anchors:[...active.anchors],
drift:[...active.drift]
});
}

if(!active?.active&&i>=3) {
const [a,b,c,d]=h.slice(i-3,i+1);

if(
distance(a,c)<=2&&
distance(b,d)<=2&&
Math.min(distance(a,b),distance(c,d))>=8
) {
active={
id:"POLES@"+(i+1),
active:true,
start:i-2,
anchors:[c,d],
initial:[a,b],
lastSide:1,
drift:[direction(a,c),direction(b,d)],
lastShift:[direction(a,c),direction(b,d)],
alternations:2,
interruptions:0,
outside:0,
event:"FORMADO"
};

events.push({
turn:i+1,
number:n,
event:"FORMADO",
anchors:[c,d],
drift:[...active.drift]
});
}
}
}

return {active,events,episodes};
}

function chainFeatures(h) {
if(h.length<4)return null;

const [a,b,c,d]=h.slice(-4);
const first=triangleFeatures(a,b,c);
const second=triangleFeatures(b,c,d);

return {
numbers:[a,b,c,d],

hops:[
direction(a,b),
direction(b,c),
direction(c,d)
],

first,
second,

key:
first.type+":"+nearBand(first.closure)+
">"+
second.type+":"+nearBand(second.closure)
};
}

function normalizeSpace(weights) {
const mean=avg(weights)||1;
return weights.map(v=>v/mean);
}

function spatialRead(h) {
const key=h.join(",");

if(spaceCache.has(key)) {
return spaceCache.get(key);
}

const tri=triangleAnalysis(h);
const arcs=trackArcs(h);
const poles=trackPoles(h);
const chain=chainFeatures(h);

const chainWeights=Array(37).fill(1);
const poleWeights=Array(37).fill(1);
const arcWeights=Array(37).fill(1);

let chainExamples=0;

/*
Compara o encadeamento atual com encadeamentos anteriores
que já possuíam um resultado seguinte conhecido.
O próximo salto histórico é projetado relativamente
à posição do último resultado atual.
*/

if(chain) {
for(let end=3;end<h.length-1;end++) {
const old=chainFeatures(
h.slice(end-3,end+1)
);

const diff=avg(
chain.hops.map(
(s,j)=>Math.abs(s-old.hops[j])
)
);

const shape=
(old.first.type===chain.first.type?.5:0)+
(old.second.type===chain.second.type?.5:0);

const similarity=
Math.exp(-diff/4)*
(.25+.75*shape);

const recency=Math.exp(
-(h.length-2-end)/30
);

if(similarity>.25)chainExamples++;

const projected=W[mod(
ix(h.at(-1))+
direction(h[end],h[end+1])
)];

for(let j=0;j<37;j++) {
chainWeights[j]+=
similarity*recency*
Math.exp(-distance(W[j],projected)/2);
}
}
}

/* PESOS DOS POLOS MÓVEIS */

const p=poles.active;

if(p?.active) {
const expected=1-p.lastSide;
const anchor=p.anchors[expected];

const shift=clamp(
p.lastShift[expected],-2,2
);

const projected=W[mod(ix(anchor)+shift)];

const strength=
Math.min(1,p.alternations/5)*
(
p.event==="SAÍDA DOS POLOS"?.25:
p.event==="INTERRUPÇÃO"?.45:1
);

for(let j=0;j<37;j++) {
poleWeights[j]+=
strength*(
Math.exp(-distance(W[j],anchor)/2)+
.4*Math.exp(-distance(W[j],projected)/2)
);
}
}

/* PESOS DOS ARCOS E DAS REENTRADAS */

const a=arcs.active;

if(a) {
const baseline=8/37;

const conditional=arcs.transitions[a.event]||
{hits:0,total:0};

const historical=
(conditional.hits+baseline*8)/
(conditional.total+8);

const density=
(a.count+baseline*4)/
(a.total+4);

const confidence=Math.min(1,a.total/12);

const sectorMass=clamp(
historical*.75+density*.25,
.05,.70
);

for(let j=0;j<37;j++) {
const target=a.numbers.includes(W[j])
?sectorMass*37/8
:(1-sectorMass)*37/29;

arcWeights[j]=
1+(target-1)*confidence;
}
}

const cw=normalizeSpace(chainWeights);
const pw=normalizeSpace(poleWeights);
const aw=normalizeSpace(arcWeights);

const weights=normalizeSpace(
W.map((_,j)=>
tri.weights[j]*.45+
cw[j]*.20+
pw[j]*.20+
aw[j]*.15
)
);

const keys=["T:"+tri.context];

if(chain)keys.push("C:"+chain.key);

if(p?.active) {
keys.push(
"P:"+p.event+
"|D:"+nearBand(distance(...p.anchors))+
"|F:"+
Math.sign(p.drift[0])+","+
Math.sign(p.drift[1])
);
}

if(a) {
keys.push(
"A:"+a.event+
"|F:"+Math.min(3,a.outside)+
"|I:"+Math.min(3,a.inside)
);
}

const result={
tri,
arcs,
poles,
chain,
chainExamples,
weights,
chainWeights:cw,
poleWeights:pw,
arcWeights:aw,
keys
};

spaceCache.set(key,result);

if(spaceCache.size>120) {
spaceCache.delete(spaceCache.keys().next().value);
}

return result;
}

/*
Esta função é chamada pelos cálculos dos motores,
combinações numéricas, consenso, união e defesas móveis.
Não é apenas uma informação de painel.
*/

function applySpatial(weights,h,strength=.30) {
if(h.length<3)return weights;

const reading=spatialRead(h);

const scale=avg(
weights.map(v=>Math.max(0,v))
)||1;

const reliability=Math.min(
1,(h.length-2)/20
);

for(let j=0;j<37;j++) {
weights[j]=Math.max(
.001,
weights[j]+
scale*strength*reliability*
clamp(reading.weights[j]-1,-.75,2)
);
}

return weights;
}

function spatialCoverage(play,h) {
if(!validPlay(play))return 0;

const weights=spatialRead(h).weights;

return play.numbers.reduce(
(s,n)=>s+weights[ix(n)],0
)/weights.reduce((s,v)=>s+v,0);
}

function spatialMatch(keys,current) {
if(!keys?.length)return 0;

const importance={
T:.25,C:.25,P:.25,A:.25
};

return current.reduce(
(sum,key)=>sum+(
keys.includes(key)
?importance[key[0]]||0
:0
),0
);
}

function spatialMetrics(
rows,h,hit=row=>row.result!=="LOSS"
) {
const keys=spatialRead(h).keys;

let support=0;
let weightedHits=0;
let total=0;
let hits=0;

for(const row of rows) {
const previousKeys=row.spatialKeys||
(
row.triangleKey
?["T:"+row.triangleKey]
:[]
);

const weight=spatialMatch(
previousKeys,keys
);

if(!weight)continue;

support+=weight;
total++;

if(hit(row)) {
weightedHits+=weight;
hits++;
}
}

return {
total,
hits,
loss:total-hits,
support,
score:
(weightedHits+(28/37)*8)/
(support+8)
};
}

/* ======================================================
 ANÁLISE SEQUENCIAL ORIGINAL
====================================================== */

function analyze(h) {
const transitions=[];

for(let i=Math.max(1,h.length-45);i<h.length;i++) {
const a=h[i-1],b=h[i];
const pd=direction(a,b);

transitions.push({
from:a,
to:b,
numeric:b-a,
physical:pd,
distance:Math.abs(pd),
mirrorFrom:mirror(a),
mirrorTo:mirror(b)
});
}

const last6=transitions.slice(-6);

function streak(field) {
const sign=Math.sign(
transitions.at(-1)?.[field]||0
);

let length=0;

if(sign) {
for(let i=transitions.length-1;i>=0;i--) {
if(Math.sign(transitions[i][field])!==sign)break;
length++;
}
}

return {dir:sign,length};
}

const regions={};

for(const name of Object.keys(REGIONS)) {
let absence=0;

for(let i=h.length-1;i>=0;i--) {
if(region(h[i])===name)break;
absence++;
}

regions[name]={
absence,
recent:h.slice(-12).filter(
n=>region(n)===name
).length
};
}

const last3=transitions.slice(-3);
const prev3=transitions.slice(-6,-3);

return {
transitions,
last6,
numericStreak:streak("numeric"),
physicalStreak:streak("physical"),
mean3:avg(last3.map(x=>x.distance)),
previous3:avg(prev3.map(x=>x.distance)),
acceleration:
avg(last3.map(x=>x.distance))-
avg(prev3.map(x=>x.distance)),
regions
};
}

/* ======================================================
 12 MOTORES COM INTEGRAÇÃO ESPACIAL REAL
====================================================== */

function weightsFor(h,family,radius) {
const weights=Array(37).fill(.01);
const recent=h.slice(-60);

for(let k=0;k<recent.length;k++) {
const p=ix(recent[recent.length-1-k]);
const decay=Math.exp(-k/(radius*2.3));

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),37-Math.abs(p-j)
);

if(d<=6)weights[j]+=decay*(7-d)/7;
}
}

if(family.includes("DINAMICO")) {
for(let k=0;k<Math.min(radius+2,h.length);k++) {
const p=ix(h[h.length-1-k]);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),37-Math.abs(p-j)
);

if(d<=3)weights[j]+=(4-d)/(k+2)*1.7;
}
}
}

if(family.startsWith("RX")) {
const len=Math.min(radius,h.length-2);
const matches=[];

if(len>=2) {
for(let i=0;i+len<h.length-1;i++) {
let score=0;

for(let j=0;j<len;j++) {
score+=Math.max(
0,
6-distance(h[h.length-len+j],h[i+j])
)/6;
}

matches.push({
score:score/len,
next:h[i+len]
});
}

matches.sort((a,b)=>b.score-a.score);

for(const match of matches.slice(0,12)) {
const p=ix(match.next);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),37-Math.abs(p-j)
);

if(d<=3)weights[j]+=(4-d)*match.score*.45;
}
}
}
}

if(h.length>=3) {
const a=analyze(h);
const last=h.at(-1);

const numericBias=
a.last6.filter(x=>x.numeric>0).length-
a.last6.filter(x=>x.numeric<0).length;

const physicalBias=
a.last6.filter(x=>x.physical>0).length-
a.last6.filter(x=>x.physical<0).length;

const expected=clamp(
Math.round(avg(a.last6.map(x=>x.distance))),
1,18
);

for(const n of W) {
const pd=direction(last,n);
const d=Math.abs(pd);

let bonus=0;

if(
numericBias&&
Math.sign(n-last)===Math.sign(numericBias)
)bonus+=.10;

if(
physicalBias&&
Math.sign(pd)===Math.sign(physicalBias)
)bonus+=.12;

if(Math.abs(d-expected)<=2)bonus+=.09;

if(
a.numericStreak.length>=2&&
Math.sign(n-last)===a.numericStreak.dir
)bonus+=.07;

if(
a.physicalStreak.length>=2&&
Math.sign(pd)===a.physicalStreak.dir
)bonus+=.07;

if(a.acceleration>=3&&d>=10)bonus+=.07;
if(a.acceleration<=-3&&d<=5)bonus+=.07;

weights[ix(n)]+=bonus*radius/5;
}
}

/*
A geometria só é montada depois desta integração.
Consequentemente os centros e os 28 números podem mudar.
*/

return applySpatial(
weights,h,
.30+(radius-4)*.035+
(family.startsWith("RX")?.035:0)
);
}

function motors(h) {
if(h.length<8)return [];

const result=[];
const spatial=spatialRead(h);

for(const family of FAMILIES) {
for(const radius of RADII) {
if(
family.startsWith("RX")&&
h.length<radius*2+4
)continue;

const play=geometry(
weightsFor(h,family,radius)
);

if(!validPlay(play))continue;

result.push({
key:family+"_"+radius,
family,
radius,
score:play.score,
triangleScore:triangleCoverage(play,h),
spatialScore:spatialCoverage(play,h),
triangleKey:triangleContext(h),
spatialKeys:[...spatial.keys],
play
});
}
}

result.sort((a,b)=>b.score-a.score);
result.forEach((m,i)=>{m.rank=i+1;});

return result;
}

/* ======================================================
 TREINADOR GLOBAL NÚMEROS — BASE V6.3.9
====================================================== */

function generateNumberCombination(h) {
if(h.length<8)return null;

const trigger=h.at(-1);
const weights=Array(37).fill(.02);
const recent=h.slice(-60);

for(let k=0;k<recent.length;k++) {
const p=ix(recent[recent.length-1-k]);
const decay=Math.exp(-k/18);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),37-Math.abs(p-j)
);

if(d<=5)weights[j]+=decay*(6-d)/6;
}
}

if(h.length>=2) {
const step=direction(h.at(-2),trigger);
const expected=mod(ix(trigger)+step);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(expected-j),
37-Math.abs(expected-j)
);

if(d<=4)weights[j]+=(5-d)*.14;
}
}

for(let i=0;i<h.length-1;i++) {
if(h[i]!==trigger)continue;

const p=ix(h[i+1]);
const decay=Math.exp(-(h.length-1-i)/28);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),37-Math.abs(p-j)
);

if(d<=3)weights[j]+=decay*(4-d)/4*.9;
}
}

applySpatial(weights,h,.35);

const play=geometry(weights);
if(!validPlay(play))return null;

return {
key:"NUMERO_GERADO_"+trigger,
name:"COMBINAÇÃO DO "+trigger,
trigger,
score:play.score,
spatialScore:spatialCoverage(play,h),
play
};
}

function registerNumberCombination(h,turn) {
const generated=generateNumberCombination(h);
if(!generated)return;

state.numberCombinations.push({
id:"NC_"+turn,
turn,
origin:generated.trigger,
motor:generated.key,
play:copy(generated.play),
centers:generated.play.blocks.map(b=>b.center),
covered:[...generated.play.numbers],
triangleKey:triangleContext(h),
spatialKeys:[...spatialRead(h).keys]
});

state.numberCombinations=
state.numberCombinations.slice(-100);
}

function numberTransitions(h,trigger) {
const rows=[];

for(let i=0;i<h.length-1;i++) {
if(h[i]!==trigger)continue;

rows.push({
next:h[i+1],
age:h.length-1-i,
turn:i+2,
triggerTurn:i+1
});
}

return rows;
}

function compareNumberCombination(record,trigger,h) {
const transitions=numberTransitions(h,trigger);
const covered=new Set(record.covered);

let matches=0;
let weightedMatches=0;
let totalWeight=0;

const matchedNumbers=[];
const missedNumbers=[];

for(const t of transitions) {
const weight=Math.exp(-t.age/35);
totalWeight+=weight;

if(covered.has(t.next)) {
matches++;
weightedMatches+=weight;
matchedNumbers.push(t.next);
} else {
missedNumbers.push(t.next);
}
}

const total=transitions.length;
const base=28/37;

const historical=(matches+base*3)/(total+3);
const recent=(weightedMatches+base*2)/(totalWeight+2);
const numericalScore=historical*.65+recent*.35;
const spatialScore=spatialCoverage(record.play,h);

return {
...record,
trigger,
total,
matches,
misses:total-matches,
weightedMatches,
numericalScore,
triangleScore:triangleCoverage(record.play,h),
spatialScore,
score:numericalScore*.75+spatialScore*.25,
matchedNumbers,
missedNumbers
};
}

function rankNumberCombinations(h,trigger=h.at(-1)) {
if(trigger==null)return [];

return state.numberCombinations
.filter(r=>validPlay(r.play))
.map(r=>compareNumberCombination(r,trigger,h))
.sort((a,b)=>
b.score-a.score||
b.matches-a.matches||
b.turn-a.turn
);
}

function bestNumberCombination(h) {
if(h.length<8)return null;

const trigger=h.at(-1);
const best=rankNumberCombinations(h,trigger)[0];

if(!best)return null;

return {
key:"NUM_T"+best.turn+"_N"+best.origin,
name:"COMBINAÇÃO DO "+best.origin,
rank:0,
score:best.score,
spatialScore:best.spatialScore,
sourceNumber:best.origin,
sourceTurn:best.turn,
trigger,
matches:best.matches,
tests:best.total,
play:copy(best.play),
type:"NUMBER"
};
}

function updateNumberChoice() {
const selected=bestNumberCombination(state.history);

if(!selected) {
state.numberChoice=null;
return null;
}

const old=state.numberChoice;

if(
old&&(
old.sourceTurn!==selected.sourceTurn||
old.trigger!==selected.trigger
)
)state.numberChanges++;

state.numberChoice={
trigger:selected.trigger,
sourceNumber:selected.sourceNumber,
sourceTurn:selected.sourceTurn,
motor:selected.key,
score:selected.score,
matches:selected.matches,
tests:selected.tests,
spatialScore:selected.spatialScore,
play:copy(selected.play)
};

return selected;
}

function recordNumberComparison(before,n,turn) {
const trigger=before.at(-1);
if(trigger==null)return;

const selected=bestNumberCombination(before);
if(!selected)return;

state.numberComparisons.push({
turn,
trigger,
sourceNumber:selected.sourceNumber,
sourceTurn:selected.sourceTurn,
next:n,
covered:selected.play.numbers.includes(n),
centers:selected.play.blocks.map(b=>b.center),
triangleKey:triangleContext(before),
spatialKeys:[...spatialRead(before).keys]
});

state.numberComparisons=
state.numberComparisons.slice(-300);
}

/* ======================================================
 ESTRATÉGIAS
====================================================== */

function definitions() {
return [
...ORIGINALS.map(([rule,name])=>({
id:"ORIGINAL:"+rule,name,rule,type:"ORIGINAL"
})),

...Array.from({length:4},(_,i)=>({
id:"RANK:"+(i+1),
name:"AUTO "+(i+1)+"º",
rank:i+1,
type:"RANK"
})),

...ADAPTATIVES.map(config=>({
id:"ADAPTIVE:"+config.id,
name:config.name,
config,
type:"ADAPTIVE"
})),

...state.created.map(c=>({
id:"CREATED:"+c.id,
name:c.name,
config:c.config,
type:"CREATED"
}))
];
}

function motorRate(key,limit=12) {
const available=state.ledger.filter(
r=>r.motorHits&&key in r.motorHits
);

const rows=available.slice(-limit);
if(!rows.length)return .5;

const global=
rows.filter(r=>r.motorHits[key]).length/
rows.length;

const local=spatialMetrics(
available.slice(-70),
state.history,
r=>!!r.motorHits[key]
);

const weight=
.40*local.support/(local.support+8);

return global*(1-weight)+local.score*weight;
}

function chooseMotor(def,cs,previous) {
if(!cs.length)return null;

const fixed=cs[
clamp(state.rank-1,0,cs.length-1)
];

if(def.rank) {
return cs[clamp(def.rank-1,0,cs.length-1)];
}

if(def.config) {
const config=def.config;

const ranked=cs.filter(
m=>m.rank<=config.maxRank
).map(m=>({
motor:m,
score:
motorRate(m.key,3)*.55+
motorRate(m.key,config.window)*.45
})).sort((a,b)=>
b.score-a.score||
a.motor.rank-b.motor.rank
);

const best=ranked[0];
const old=ranked.find(
x=>x.motor.key===previous
);

if(
old&&best&&
best.score<old.score+config.margin
)return old.motor;

return best?.motor||fixed;
}

if(def.rule==="GEO")return cs[0];

if(def.rule==="BEST") {
return [...cs].sort((a,b)=>
motorRate(b.key,20)-motorRate(a.key,20)
)[0];
}

if(def.rule==="STABLE") {
return cs.find(
m=>m.key===previous&&m.rank<=5
)||fixed;
}

if(def.rule==="SWITCH") {
const old=cs.find(
m=>m.key===previous
)||fixed;

const best=[...cs].sort((a,b)=>
motorRate(b.key,12)-motorRate(a.key,12)
)[0];

return motorRate(best.key,12)>
motorRate(old.key,12)+.12
?best:old;
}

if(["CONSENSUS","UNION"].includes(def.rule)) {
const weights=Array(37).fill(0);
const selected=def.rule==="UNION"?cs.slice(0,3):cs;

for(const m of selected) {
for(const n of m.play.numbers) {
weights[ix(n)]+=1/(1+m.rank*.1);
}
}

applySpatial(weights,state.history,.25);

const play=geometry(weights);

if(play)return {
key:def.rule,
rank:0,
score:play.score,
spatialScore:spatialCoverage(play,state.history),
play
};
}

return fixed;
}

/* ======================================================
 DEFESAS G1
====================================================== */

function fineG1(original,trigger,h=state.history) {
if(!validPlay(original?.play))return null;

const weights=Array(37).fill(.01);
const mandatory=neighbors(trigger,1);

for(const n of original.play.numbers) {
weights[ix(n)]+=100;
}

applySpatial(weights,h,.20);

for(const n of mandatory) {
weights[ix(n)]+=100000;
}

const play=geometry(weights,mandatory);

return play
?{
key:original.key,
rank:original.rank,
play,
spatialScore:spatialCoverage(play,h)
}
:copy(original);
}

function g1History(strategy=null,mode=null,limit=400) {
return state.g1Rows.filter(r=>
(strategy==null||r.strategy===strategy)&&
(mode==null||r.mode===mode)
).slice(-limit);
}

function uniqueGales(strategy=null,limit=100) {
const map=new Map();

for(const row of g1History(strategy,null,5000)) {
const key=row.strategy+"|"+row.eventId;
if(!map.has(key))map.set(key,row);
}

return [...map.values()].slice(-limit);
}

function numberG1Rows(strategy,trigger,mode=null,limit=200) {
return state.g1Rows.filter(r=>
r.strategy===strategy&&
r.trigger===trigger&&
(mode==null||r.mode===mode)
).slice(-limit);
}

function numberG1Metrics(strategy,trigger,mode,limit=100) {
const rows=numberG1Rows(strategy,trigger,mode,limit);
const hits=rows.filter(r=>r.hit).length;

return {
total:rows.length,
hits,
loss:rows.length-hits,
rate:rows.length?hits/rows.length:null
};
}

function numberG1Events(strategy,trigger,limit=100) {
const map=new Map();

for(const row of numberG1Rows(
strategy,trigger,null,1000
)) {
if(!map.has(row.eventId))map.set(row.eventId,row);
}

return [...map.values()].slice(-limit);
}

function behaviorReading(original,h,strategy,trigger=null) {
const rows=uniqueGales(strategy,45);
const recent=rows.slice(-12);
const last6=rows.slice(-6);

const loss12=recent.filter(r=>!r.hit).length;
const loss6=last6.filter(r=>!r.hit).length;

const uncovered=new Set(missing(original.play));

const outside6=h.slice(-6).filter(
n=>uncovered.has(n)
).length;

let streak=0;

for(let i=rows.length-1;i>=0;i--) {
if(rows[i].hit)break;
streak++;
}

const numberRows=trigger==null
?[]:numberG1Events(strategy,trigger,20);

const numberRecent=numberRows.slice(-8);
const numberLoss=numberRecent.filter(r=>!r.hit).length;

let type="CONTINUIDADE";

if(
streak>=3||
(last6.length>=5&&loss6/last6.length>=.60)||
(h.length>=6&&outside6>=4)||
(numberRecent.length>=4&&numberLoss/numberRecent.length>=.60)
) {
type="RUPTURA";

} else if(
(recent.length>=5&&loss12/recent.length>=.32)||
outside6>=2||
(numberRecent.length>=3&&numberLoss/numberRecent.length>=.34)
) {
type="DESLOCAMENTO";
}

const space=spatialRead(h);

return {
type,
streak,
outside6,
loss12,
total12:recent.length,
loss6,
total6:last6.length,
numberTotal:numberRecent.length,
numberLoss,
numberHit:numberRecent.length-numberLoss,
triangle:space.tri.last?.type||"SEM TRINCA",
poles:space.poles.active?.event||"SEM POLOS",
arc:space.arcs.active?.event||"SEM ARCO"
};
}

function reconstructG1(original,trigger,h,strategy) {
if(!validPlay(original?.play))return null;

const reading=behaviorReading(
original,h,strategy,trigger
);

const weights=Array(37).fill(.1);
const recent=h.slice(-60);
const gales=g1History(strategy,null,180);
const transitions=numberTransitions(h,trigger);

for(const n of W) {
const f60=recent.filter(x=>x===n).length;
const f24=h.slice(-24).filter(x=>x===n).length;
const f8=h.slice(-8).filter(x=>x===n).length;

const losses=gales.filter(
r=>!r.hit&&r.outcome===n
).length;

const conditional=transitions.reduce(
(s,t)=>s+(
t.next===n?Math.exp(-t.age/35):0
),0
);

let value=
f60*.30+
f24*.55+
f8*.85+
losses*.35+
conditional*2.2;

if(reading.type==="DESLOCAMENTO") {
value+=f8*.35+conditional*.35;
}

if(reading.type==="RUPTURA") {
value+=f8*.60+losses*.45+conditional*.65;
}

weights[ix(n)]+=value;
}

for(let k=0;k<recent.length;k++) {
const p=ix(recent[recent.length-1-k]);

const decay=Math.exp(
-k/(reading.type==="RUPTURA"?8:14)
);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),37-Math.abs(p-j)
);

if(d<=3)weights[j]+=decay*(4-d)/4*.65;
}
}

for(const n of neighbors(trigger,2)) {
weights[ix(n)]+=.4;
}

applySpatial(weights,h,.40);

const play=geometry(weights);
if(!validPlay(play))return null;

return {
key:"G1_INDEPENDENTE",
rank:0,
play,
behavior:reading.type,
spatialScore:spatialCoverage(play,h)
};
}

function defenses(original,trigger,h,strategy) {
if(!validPlay(original?.play))return [];

const reading=behaviorReading(
original,h,strategy,trigger
);

const recon=reconstructG1(
original,trigger,h,strategy
);

return [
{
mode:"CONGELADA",
motor:copy(original),
behavior:reading.type
},
{
mode:"AJUSTE FINO",
motor:fineG1(original,trigger,h),
behavior:reading.type
},
...(recon?[{
mode:"RECONSTRUÇÃO",
motor:recon,
behavior:reading.type
}]:[])
];
}

function defenseMetrics(strategy,mode,limit=100) {
const rows=g1History(strategy,mode,limit);
const hits=rows.filter(r=>r.hit).length;

return {
total:rows.length,
hits,
loss:rows.length-hits,
rate:rows.length?hits/rows.length:null
};
}

function rankDefenses(options,strategy,h,trigger=null) {
return options.map(option=>{
const rows=g1History(strategy,option.mode,100);
const recent=rows.slice(-12);
const hits=rows.filter(r=>r.hit).length;
const hits12=recent.filter(r=>r.hit).length;

const base=28/37;

const historical=(hits+base*12)/(rows.length+12);
const short=(hits12+base*8)/(recent.length+8);

const coverage=h.length
?h.slice(-18).filter(
n=>option.motor.play.numbers.includes(n)
).length/Math.min(18,h.length)
:base;

const byNumber=trigger==null
?{total:0,hits:0,loss:0}
:numberG1Metrics(strategy,trigger,option.mode,100);

const conditional=
(byNumber.hits+base*8)/(byNumber.total+8);

let bonus=0;

if(
option.behavior==="CONTINUIDADE"&&
option.mode==="CONGELADA"
)bonus=.012;

if(
option.behavior==="DESLOCAMENTO"&&
option.mode==="AJUSTE FINO"
)bonus=.010;

if(
option.behavior==="RUPTURA"&&
option.mode==="RECONSTRUÇÃO"
)bonus=.020;

const numberWeight=trigger==null
?0:Math.min(.48,byNumber.total/(byNumber.total+8));

const globalScore=
historical*.55+
short*.25+
coverage*.20;

const originalScore=
globalScore*(1-numberWeight)+
conditional*numberWeight+
bonus;

const spatialScore=spatialCoverage(option.motor.play,h);
const local=spatialMetrics(rows,h,r=>r.hit);
const localWeight=.20*local.support/(local.support+8);

const combined=
originalScore*.80+
spatialScore*.20;

return {
...option,
score:combined*(1-localWeight)+local.score*localWeight,
spatialScore,
contextTotal:local.total,
total:rows.length,
hits,
loss:rows.length-hits,
numberTotal:byNumber.total,
numberHits:byNumber.hits,
numberLoss:byNumber.loss,
numberScore:conditional,
uncovered:missing(option.motor.play)
};

}).sort((a,b)=>
b.score-a.score||
b.numberTotal-a.numberTotal
);
}

function chooseG1(original,trigger,h,strategy) {
const ranked=rankDefenses(
defenses(original,trigger,h,strategy),
strategy,h,trigger
);

if(!ranked.length)return null;

let chosen=ranked[0];

const frozen=ranked.find(
x=>x.mode==="CONGELADA"
);

if(
frozen&&chosen!==frozen&&
chosen.total<8&&chosen.numberTotal<4&&
chosen.score-frozen.score<.025
)chosen=frozen;

return {
motor:copy(chosen.motor),
mode:chosen.mode,
behavior:chosen.behavior,
score:chosen.score,
spatialScore:chosen.spatialScore,
triangleKey:triangleContext(h),
spatialKeys:[...spatialRead(h).keys],
numberTotal:chosen.numberTotal,
numberHits:chosen.numberHits,
numberLoss:chosen.numberLoss,
uncovered:chosen.uncovered,

alternatives:ranked.map(x=>({
mode:x.mode,
score:x.score,
spatialScore:x.spatialScore,
contextTotal:x.contextTotal,
total:x.total,
hits:x.hits,
loss:x.loss,
numberTotal:x.numberTotal,
numberHits:x.numberHits,
numberLoss:x.numberLoss
}))
};
}

/* ======================================================
 TREINADOR GLOBAL NÚMEROS 1.0
====================================================== */

function signature10(play) {
return play.blocks.map(
b=>b.radius+":"+b.center
).sort().join("|");
}

function book10(trigger) {
return state.n10.books[trigger]||
(state.n10.books[trigger]={records:{}});
}

function register10(trigger,motor,turn) {
if(!validPlay(motor?.play))return null;

const id=signature10(motor.play);
const book=book10(trigger);

return book.records[id]||(book.records[id]={
id,
trigger,
motor:copy(motor),
created:turn,
status:"TESTING",
green:0,
g1:0,
loss:0,
vg:0,
vg1:0,
vl:0,
last:0,
lastResult:null
});
}

function archive10(cs,h) {
const turn=h.length;
const origin=h.at(-1);

const seen=new Set(
state.n10.archive.map(r=>r.turn+"@"+r.id)
);

const generated=state.numberCombinations.find(
r=>r.turn===turn
);

const candidates=[
...cs,
...(generated?[{
key:generated.motor,
rank:0,
play:generated.play
}]:[])
];

for(const motor of candidates) {
if(!validPlay(motor.play))continue;

const id=signature10(motor.play);
const key=turn+"@"+id;

if(seen.has(key))continue;
seen.add(key);

state.n10.archive.push({
id,turn,origin,motor:copy(motor)
});
}

state.n10.archive=state.n10.archive.slice(-1600);
}

function scoreRecord10(record,h) {
const base=28/37;

const forward=
(record.green+record.g1+base*8)/
(record.green+record.g1+record.loss+8);

const virtual=
(record.vg+record.vg1+base*8)/
(record.vg+record.vg1+record.vl+8);

const events=state.n10.events.filter(e=>
e.kind==="FORWARD"&&
e.trigger===record.trigger&&
e.recordId===record.id
).slice(-60);

const contextual=spatialMetrics(events,h);

return forward*.45+
virtual*.15+
spatialCoverage(record.motor.play,h)*.25+
contextual.score*.15;
}

function select10(h,cs) {
if(h.length<8)return null;

const trigger=h.at(-1);
const records=Object.values(book10(trigger).records);

let selected=records
.filter(r=>r.status==="APPROVED")
.sort((a,b)=>
scoreRecord10(b,h)-scoreRecord10(a,h)||
b.last-a.last
)[0];

if(!selected) {
selected=records
.filter(r=>
r.status!=="REJECTED"&&r.vg+r.vg1>0
)
.sort((a,b)=>
scoreRecord10(b,h)-scoreRecord10(a,h)||
b.last-a.last
)[0];
}

if(!selected) {
const primary=chooseMotor(
{rule:"FIXED"},cs,null
);

const candidates=[
primary,
...cs,
...state.n10.archive.slice().reverse().map(r=>r.motor)
].filter(Boolean);

for(const motor of candidates) {
const record=register10(trigger,motor,h.length);

if(record&&record.status!=="REJECTED") {
selected=record;
break;
}
}
}

if(!selected)return null;

return {
...copy(selected.motor),
key:"N10_"+trigger+"_"+selected.id,
trigger,
recordId:selected.id,
type:N10,
status:selected.status,
lastResult:selected.lastResult,
spatialScore:spatialCoverage(selected.motor.play,h),
spatialKeys:[...spatialRead(h).keys]
};
}

function prepare10(h,cs=motors(h)) {
if(h.length<8) {
state.n10.choice=null;
return null;
}

archive10(cs,h);
state.n10.choice=select10(h,cs);

return state.n10.choice;
}

function choice10() {
const selected=state.n10.choice;

if(
!selected||
selected.trigger!==state.history.at(-1)
)return null;

const record=book10(selected.trigger)
.records[selected.recordId];

return record?.status==="REJECTED"
?null:copy(selected);
}

function config10() {
return {
g1:state.g1,
g1Trainer:state.g1Trainer,
galeSkip:state.galeSkip,
secondHouse:state.secondHouse
};
}

function defense10(motor,n,h,config,cutoff=null) {
const rows=state.g1Rows;

if(cutoff!=null) {
state.g1Rows=rows.filter(r=>r.turn<cutoff);
}

try {
return config.g1Trainer
?chooseG1(motor,n,h,N10)
:{
motor:config.g1?fineG1(motor,n,h):copy(motor),
mode:config.g1?"AJUSTE FINO":"CONGELADA",
behavior:behaviorReading(motor,h,N10,n).type,
triangleKey:triangleContext(h),
spatialKeys:[...spatialRead(h).keys]
};

} finally {
state.g1Rows=rows;
}
}

function options10(motor,n,h,cutoff) {
const rows=state.g1Rows;
state.g1Rows=rows.filter(r=>r.turn<cutoff);

try {
return defenses(motor,n,h,N10);

} finally {
state.g1Rows=rows;
}
}

function begin10(before,turn,source,cs) {
const selected=prepare10(before,cs);
if(!selected)return;

state.n10.pending.push({
id:"N10@"+(++state.n10.sequence),
turn,
trigger:before.at(-1),
recordId:selected.recordId,
entry:copy(selected),
history:[...before],
triangleKey:triangleContext(before),
spatialKeys:[...spatialRead(before).keys],
config:config10(),
phase:state.secondHouse?"SECOND_SKIP":"ENTRY",
initialSkip:!!state.secondHouse,
results:[],

actual:
source==="TEMPO REAL"&&
state.strategy===N10&&
!state.manual&&
state.phase==="ENTRY",

source,
defense:null,
options:null
});
}

function transition10(test,n,turn) {
test.results.push(n);
const h=[...test.history,...test.results];

if(test.phase==="SECOND_SKIP") {
if(test.initialSkip) {
test.initialSkip=false;
return null;
}

test.phase="SECOND_ENTRY";
return null;
}

if(test.phase==="GALE_SKIP") {
test.phase="GALE";
return null;
}

if(test.phase==="GALE") {
return test.defense.play.numbers.includes(n)
?"GREEN G1":"LOSS";
}

if(test.entry.play.numbers.includes(n))return "GREEN";

test.failureTurn=turn;
test.failureTrigger=n;
test.options=options10(test.entry,n,h,turn);

const decision=defense10(
test.entry,n,h,test.config,turn
);

test.defense=copy(decision?.motor||test.entry);
test.decision=copy(decision);
test.phase=test.config.galeSkip?"GALE_SKIP":"GALE";

return null;
}

function simulate10(test,motor) {
const simulated={
...copy(test),
entry:copy(motor),
results:[],
phase:test.config.secondHouse?"SECOND_SKIP":"ENTRY",
initialSkip:!!test.config.secondHouse,
defense:null,
options:null
};

let result=null;

for(let i=0;i<test.results.length;i++) {
result=transition10(
simulated,test.results[i],test.turn+i
);

if(result)break;
}

return result;
}

function alternatives10(test,turn) {
const seen=new Set([test.recordId]);
let tested=0,green=0,g1=0,loss=0;

for(const item of state.n10.archive) {
if(item.turn>=test.turn||seen.has(item.id))continue;

seen.add(item.id);

const record=register10(
test.trigger,item.motor,item.turn
);

if(!record||record.status==="REJECTED")continue;

const outcome=simulate10(test,item.motor);
if(!outcome)continue;

tested++;

if(outcome==="GREEN") {
record.vg++;
green++;

} else if(outcome==="GREEN G1") {
record.vg1++;
g1++;

} else {
record.vl++;
loss++;
record.status="REJECTED";
record.rejectedTurn=turn;
record.virtualRejected=true;
}

record.lastVirtual=outcome;
record.lastVirtualTurn=turn;
}

state.n10.events.push({
turn,
trigger:test.trigger,
kind:"RETROSPECTIVE",
virtual:true,
triangleKey:test.triangleKey,
spatialKeys:copy(test.spatialKeys||[]),
tested,green,g1,loss,
reference:test.id
});
}

function finish10(test,result,turn) {
const record=book10(test.trigger)
.records[test.recordId];

if(!record)return;

record.last=turn;
record.lastResult=result;

if(result==="LOSS") {
record.loss++;
record.status="REJECTED";
record.rejectedTurn=turn;

} else {
if(result==="GREEN")record.green++;
else record.g1++;

if(record.status!=="REJECTED") {
record.status="APPROVED";
}
}

state.n10.events.push({
turn,
trigger:test.trigger,
recordId:test.recordId,
kind:"FORWARD",
virtual:!test.actual,
source:test.source,
result,
profit:profit(result),
triangleKey:test.triangleKey,
spatialKeys:copy(test.spatialKeys||[]),
defense:test.decision?.mode||null,
id:test.id
});

if(result==="LOSS")alternatives10(test,turn);
}

function settle10(n,turn) {
const remaining=[];

for(const test of state.n10.pending) {
const outcome=transition10(test,n,turn);

if(!outcome) {
remaining.push(test);
continue;
}

if(test.phase==="GALE"&&test.options) {
for(const option of test.options) {
state.g1Rows.push({
turn,
eventId:test.id,
strategy:N10,
mode:option.mode,
behavior:option.behavior,
trigger:test.failureTrigger,
outcome:n,
hit:option.motor.play.numbers.includes(n),
uncovered:missing(option.motor.play),
entryMotor:test.entry.key,
triangleKey:test.decision?.triangleKey||test.triangleKey,
spatialKeys:copy(
test.decision?.spatialKeys||test.spatialKeys||[]
)
});
}
}

finish10(test,outcome,turn);
}

state.n10.pending=remaining;
state.n10.events=state.n10.events.slice(-1200);
state.g1Rows=state.g1Rows.slice(-5000);
}

function recordStatus10(record) {
if(record.status==="REJECTED")return "REPROVADA";
if(record.status==="APPROVED")return "APROVADA";

return record.vg+record.vg1>0
?"EM TESTE • ALTERNATIVA VIRTUAL"
:"EM TESTE";
}

/* ======================================================
 TREINADOR GLOBAL ORIGINAL
====================================================== */

function virtualCycle(id) {
return state.virtual[id]||
(state.virtual[id]={
phase:"ENTRY",
previous:null,
defense:null,
entry:null,
trigger:null,
entryTrigger:null,
triangleKey:null,
spatialKeys:[]
});
}

function trainerRanking() {
return definitions().map(def=>{
const all=state.entryRows.filter(
r=>r.strategy===def.id&&r.closed
);

const rows=all.slice(-30);
const recent=rows.slice(-12);

const hits=rows.filter(
r=>r.result!=="LOSS"
).length;

const losses=recent.filter(
r=>r.result==="LOSS"
).length;

const originalScore=
(hits+8*(28/37))/(rows.length+8)-
losses*.008;

const context=spatialMetrics(
all.slice(-120),state.history
);

const weight=
.40*context.support/(context.support+8);

return {
...def,
score:
originalScore*(1-weight)+
context.score*weight,

originalScore,
contextScore:context.score,
contextTotal:context.total,
contextSupport:context.support,
contextHits:context.hits,
contextLoss:context.loss,
total:rows.length,
hits,
loss:rows.length-hits
};

}).sort((a,b)=>
b.score-a.score||
a.id.localeCompare(b.id)
);
}

function activeDefinition() {
const defs=definitions();

if(state.strategy===N10)return {
id:N10,
name:"TREINADOR GLOBAL NÚMEROS 1.0",
type:N10
};

if(state.strategy==="NUMBER")return {
id:"NUMBER",
name:"TREINADOR GLOBAL NÚMEROS",
type:"NUMBER"
};

if(state.strategy==="TRAINER") {
return defs.find(
d=>d.id===state.trainerChoice
)||defs[0];
}

if(state.strategy==="ADAPTIVE") {
return defs.find(
d=>d.id==="ADAPTIVE:"+state.adaptive
)||defs[0];
}

if(state.strategy==="CREATED") {
return defs.find(
d=>d.id===state.activeCreated
)||defs[0];
}

return defs.find(
d=>d.id==="ORIGINAL:"+state.strategy
)||defs[0];
}

function updateTrainer() {
if(state.phase!=="ENTRY"||state.manual)return;

const ranked=trainerRanking();
const current=ranked.find(r=>r.id===state.trainerChoice);
const best=ranked[0];

if(!best)return;

const shouldChange=
!current||
state.trainerTurns>=3||
state.trainerPending||
(
best.id!==current.id&&
best.score>current.score+.035
);

if(!shouldChange)return;

const selected=current
?ranked.find(r=>r.id!==current.id)||best
:best;

if(current&&current.id!==selected.id) {
state.trainerChanges++;
}

state.trainerChoice=selected.id;
state.trainerTurns=0;
state.trainerPending=false;

state.trainerHistory.push({
turn:state.history.length,
from:current?.id||"INICIAL",
to:selected.id,
score:selected.score,
triangleKey:triangleContext(state.history),
spatialKeys:[...spatialRead(state.history).keys],
contextTotal:selected.contextTotal
});
}

function activeMotor(cs) {
if(state.manual) {
return cs.find(
m=>m.key===state.manual
)||cs[0]||null;
}

if(state.strategy===N10)return choice10();

if(state.strategy==="NUMBER") {
return bestNumberCombination(state.history);
}

return chooseMotor(
activeDefinition(),cs,state.previous
);
}

function profit(result) {
const unit=Number(state.stake)||1;
const multiplier=Number(state.multiplier)||1;

if(result==="GREEN")return 8*unit;
if(result==="GREEN G1")return (8*multiplier-28)*unit;
if(result==="LOSS")return -28*(1+multiplier)*unit;

return 0;
}

/* ======================================================
 PROCESSAMENTO CRONOLÓGICO
====================================================== */

function settlePending(n) {
for(const p of state.g1Pending) {
state.g1Rows.push({
turn:state.history.length+1,
eventId:p.eventId,
strategy:p.strategy,
mode:p.mode,
behavior:p.behavior,
trigger:p.trigger,
outcome:n,
hit:p.numbers.includes(n),
uncovered:p.uncovered,
entryMotor:p.entryMotor||null,
triangleKey:p.triangleKey||"SEM TRINCA",
spatialKeys:copy(p.spatialKeys||[])
});
}

state.g1Pending=[];
state.g1Rows=state.g1Rows.slice(-5000);
}

function standardDecision(motor,n,h,strategy) {
return state.g1Trainer
?chooseG1(motor,n,h,strategy)
:{
motor:state.g1?fineG1(motor,n,h):copy(motor),
mode:state.g1?"AJUSTE FINO":"CONGELADA",
behavior:behaviorReading(motor,h,strategy,n).type,
triangleKey:triangleContext(h),
spatialKeys:[...spatialRead(h).keys]
};
}

function openRealGale(motor,n,after,turn) {
const strategy=state.cycle.strategy;
state.cycle.trigger=n;

const decision=standardDecision(
motor,n,after,strategy
);

state.cycle.decision=decision;
state.defense=copy(decision?.motor||motor);
state.phase=state.galeSkip?"GALE_SKIP":"GALE";

state.decisions.push({
turn,
strategy,
mode:decision?.mode||"CONGELADA",
behavior:decision?.behavior||"CONTINUIDADE",
trigger:n,
numberTests:decision?.numberTotal||0,
triangleKey:decision?.triangleKey,
spatialKeys:copy(decision?.spatialKeys||[])
});
}

function spin(n,source="HISTÓRICO") {
if(!Number.isInteger(n)||n<0||n>36) {
throw new Error("NÚMERO INVÁLIDO");
}

const before=[...state.history];
const triggerBefore=before.at(-1);
const cs=motors(before);
const defs=definitions();
const turn=before.length+1;
const phaseBefore=state.phase;
const cycleBefore=copy(state.cycle);
const numberBefore=bestNumberCombination(before);

const space=spatialRead(before);
const triangleKey=triangleContext(before);
const spatialKeys=[...space.keys];

const after=[...before,n];

let result="AGUARDANDO";
let played=null;

/* Previsões e contextos formados antes de consumir N. */

begin10(before,turn,source,cs);

if(state.phase==="ENTRY")updateTrainer();

/* CICLO REAL */

if(state.phase==="ENTRY") {
const motor=activeMotor(cs);

if(motor) {
played=copy(motor);
state.previous=motor.key;

state.cycle={
strategy:activeDefinition().id,
original:copy(motor),
trigger:null,
decision:null,
entryTrigger:triggerBefore,
triangleKey,
spatialKeys:copy(spatialKeys)
};

if(state.secondHouse) {
state.defense=copy(motor);
state.phase="SECOND_SKIP";
result="2ª CASA";

} else if(motor.play.numbers.includes(n)) {
result="GREEN";
state.cycle=null;

} else {
result="GALE";
openRealGale(motor,n,after,turn);
}
}

} else if(state.phase==="SECOND_SKIP") {
played=copy(state.defense);
result="CASA PULADA";
state.phase="SECOND_ENTRY";

} else if(state.phase==="SECOND_ENTRY") {
played=copy(state.defense);

if(played?.play.numbers.includes(n)) {
result="GREEN";
state.phase="ENTRY";
state.cycle=null;
state.defense=null;

} else {
result="GALE";
openRealGale(played,n,after,turn);
}

} else if(state.phase==="GALE_SKIP") {
played=copy(state.defense);
result="GALE PULADO";
state.phase="GALE";

} else if(state.phase==="GALE") {
played=copy(state.defense);

result=played?.play.numbers.includes(n)
?"GREEN G1":"LOSS";

state.realG1.push({
turn,
strategy:state.cycle?.strategy,
mode:state.cycle?.decision?.mode,
behavior:state.cycle?.decision?.behavior,
trigger:state.cycle?.trigger,
outcome:n,
result,
triangleKey:state.cycle?.triangleKey,
spatialKeys:copy(state.cycle?.spatialKeys||[])
});

state.phase="ENTRY";
state.cycle=null;
state.defense=null;
}

/* GALES E CICLOS VIRTUAIS ORIGINAIS */

settlePending(n);

const pending=[];

const virtualDefs=[
...defs,
{
id:"NUMBER",
name:"TREINADOR GLOBAL NÚMEROS",
type:"NUMBER"
}
];

for(const def of virtualDefs) {
const v=virtualCycle(def.id);

if(v.phase==="ENTRY") {
let motor=def.type==="NUMBER"
?numberBefore
:chooseMotor(def,cs,v.previous);

if(!motor)continue;

motor=copy(motor);
v.previous=motor.key;
v.entryTrigger=triggerBefore;
v.triangleKey=triangleKey;
v.spatialKeys=copy(spatialKeys);

if(motor.play.numbers.includes(n)) {
state.entryRows.push({
turn,
strategy:def.id,
trigger:v.entryTrigger,
motor:motor.key,
result:"GREEN",
closed:true,
profit:profit("GREEN"),
triangleKey:v.triangleKey,
spatialKeys:copy(v.spatialKeys)
});

v.entryTrigger=null;
v.triangleKey=null;
v.spatialKeys=[];

} else {
v.phase="GALE";
v.entry=copy(motor);
v.trigger=n;

const options=defenses(
motor,n,after,def.id
);

const eventId=def.id+"@"+turn;
const defenseSpace=spatialRead(after);

for(const option of options) {
pending.push({
eventId,
strategy:def.id,
mode:option.mode,
behavior:option.behavior,
trigger:n,
entryMotor:motor.key,
numbers:[...option.motor.play.numbers],
uncovered:missing(option.motor.play),
triangleKey:triangleContext(after),
spatialKeys:[...defenseSpace.keys]
});
}

const decision=chooseG1(
motor,n,after,def.id
);

v.defense=
decision?.motor||
fineG1(motor,n,after)||
copy(motor);
}

} else {
const motor=copy(v.defense);

const virtualResult=
motor?.play.numbers.includes(n)
?"GREEN G1":"LOSS";

state.entryRows.push({
turn,
strategy:def.id,
trigger:v.entryTrigger,
motor:v.entry?.key||null,
result:virtualResult,
closed:true,
profit:profit(virtualResult),
triangleKey:v.triangleKey,
spatialKeys:copy(v.spatialKeys||[])
});

v.phase="ENTRY";
v.defense=null;
v.entry=null;
v.trigger=null;
v.entryTrigger=null;
v.triangleKey=null;
v.spatialKeys=[];
}
}

state.g1Pending=pending;

/* TREINADORES NUMÉRICOS INDEPENDENTES */

recordNumberComparison(before,n,turn);
settle10(n,turn);

/* REGISTRO DO RESULTADO E DOS MOTORES */

const motorHits={};

for(const motor of cs) {
motorHits[motor.key]=motor.play.numbers.includes(n);
}

state.ledger.push({
turn,
number:n,
source,
trigger:triggerBefore,
strategy:cycleBefore?.strategy||activeDefinition().id,
motor:played?.key||"—",
phase:phaseBefore,
result,
profit:profit(result),
play:played?.play||null,
numberCandidate:numberBefore?.sourceNumber??null,
numberCandidateTurn:numberBefore?.sourceTurn??null,
triangleKey,
triangleType:space.tri.last?.type||"SEM TRINCA",
spatialKeys:copy(spatialKeys),
cycleTriangleKey:cycleBefore?.triangleKey||triangleKey,
cycleSpatialKeys:copy(
cycleBefore?.spatialKeys||spatialKeys
),
motorHits
});

/* N passa a integrar o histórico somente neste ponto. */

state.history.push(n);
state.sources.push(source);

registerNumberCombination(state.history,turn);
updateNumberChoice();
prepare10(state.history);

state.entryRows=state.entryRows.slice(-4000);
state.ledger=state.ledger.slice(-300);

state.trainerTurns++;

if(state.phase!=="ENTRY"&&state.trainerTurns>=3) {
state.trainerPending=true;
}
}

/* ======================================================
 RECÁLCULO 70 + 10
====================================================== */

function waitFrame() {
return new Promise(resolve=>
requestAnimationFrame(()=>resolve())
);
}

function setBusy(value,message="") {
busy=value;

$("overlay")?.classList.toggle("show",value);

if($("overlayMessage")) {
$("overlayMessage").textContent=message;
}

for(const b of document.querySelectorAll(
".key,#import,#undo,#clear,#restore"
))b.disabled=value;
}

async function rebuild70(numbers,{
preserveManual=false,
incrementCycle=false,
customSettings=null,
customManualLog=null,
customCycles=null
}={}) {
if(busy)return;

const previous=state;
const clean=cleanNumbers(numbers).slice(-WINDOW);
const opts=customSettings||settings();

const manualLog=customManualLog!=null
?copy(customManualLog)
:preserveManual?copy(state.manualLog):[];

const cycles=customCycles!=null
?customCycles
:preserveManual
?state.cyclesCompleted+(incrementCycle?1:0)
:0;

setBusy(true,"RECALCULANDO JANELA DE 70 NÚMEROS");
await waitFrame();

try {
state={
...fresh(),
...opts,
history:[],
sources:[],
manualLog,
manualCount:0,
cyclesCompleted:cycles,
recalcPending:false,
migrationPending:false
};

triangleCache.clear();
spaceCache.clear();

for(let i=0;i<clean.length;i++) {
spin(clean[i],"HISTÓRICO");

if(i%5===4||i===clean.length-1) {
const message=
"RECALCULANDO: "+(i+1)+"/"+
clean.length+" NÚMEROS";

if($("overlayMessage")) {
$("overlayMessage").textContent=message;
}

if($("status"))$("status").textContent=message;

await new Promise(resolve=>setTimeout(resolve,0));
}
}

save();

} catch(e) {
state=previous;
save();
alert("ERRO NO RECÁLCULO: "+String(e.message||e));

} finally {
setBusy(false);
render();
}
}

function canRecalculate() {
return state.phase==="ENTRY"&&state.cycle===null;
}

async function checkRecalculation() {
if(busy)return;

if(
state.manualCount<MANUAL_LIMIT&&
!state.migrationPending
) {
state.recalcPending=false;
save();
return;
}

if(!canRecalculate()) {
state.recalcPending=true;
save();
render();
return;
}

const increment=state.manualCount>=MANUAL_LIMIT;
state.recalcPending=false;

await rebuild70(
state.history.slice(-WINDOW),
{
preserveManual:true,
incrementCycle:increment
}
);
}

async function addManual(n) {
if(busy)return;

if(state.history.length<8) {
alert("IMPORTE UM HISTÓRICO PRIMEIRO.");
return;
}

try {
spin(n,"TEMPO REAL");

const row=state.ledger.at(-1);

state.manualLog.push({
id:Date.now()+"_"+state.manualLog.length,
number:n,
result:row.result,
profit:row.profit,
strategy:row.strategy,
motor:row.motor,
phase:row.phase,
numberCandidate:row.numberCandidate,
triangleKey:row.triangleKey,
spatialKeys:copy(row.spatialKeys),
timestamp:Date.now()
});

state.manualCount++;

if(state.manualCount>=MANUAL_LIMIT) {
state.recalcPending=true;
}

save();
render();

await checkRecalculation();

} catch(e) {
alert("ERRO AO INSERIR NÚMERO: "+String(e.message||e));
}
}

function parseInput(text) {
return (String(text).match(/\d+/g)||[])
.map(Number)
.filter(n=>Number.isInteger(n)&&n>=0&&n<=36);
}

async function importHistory(numbers) {
if(busy)return;

const clean=cleanNumbers(numbers);

if(!clean.length) {
alert("INFORME NÚMEROS DE 0 A 36.");
return;
}

if(!confirm(
"IMPORTAR "+clean.length+" NÚMEROS?\n\n"+
"O SISTEMA USARÁ OS ÚLTIMOS "+
Math.min(WINDOW,clean.length)+
" E APAGARÁ OS REGISTROS MANUAIS ANTERIORES."
))return;

$("paste").value="";

await rebuild70(clean,{preserveManual:false});
}

async function undo() {
if(busy)return;

if(state.manualCount<=0) {
alert(
"NÃO EXISTE LANÇAMENTO MANUAL "+
"NESTE CICLO PARA APAGAR."
);
return;
}

const previous=state;
const numbers=state.history.slice(0,-1);
const sources=state.sources.slice(0,-1);
const manualLog=state.manualLog.slice(0,-1);
const manualCount=state.manualCount-1;
const cycles=state.cyclesCompleted;
const migrationPending=state.migrationPending;
const opts=settings();

setBusy(true,"REFAZENDO ANÁLISES");
await waitFrame();

try {
state={
...fresh(),
...opts,
manualLog,
manualCount,
cyclesCompleted:cycles,
migrationPending,
recalcPending:
manualCount>=MANUAL_LIMIT||migrationPending
};

triangleCache.clear();
spaceCache.clear();

for(let i=0;i<numbers.length;i++) {
spin(numbers[i],sources[i]||"HISTÓRICO");

if(i%8===7) {
$("overlayMessage").textContent=
"REPROCESSANDO "+(i+1)+"/"+numbers.length;

await new Promise(resolve=>setTimeout(resolve,0));
}
}

save();

} catch(e) {
state=previous;
alert(String(e.message||e));

} finally {
setBusy(false);
render();
}
}

function clearAll() {
if(busy)return;

if(!confirm(
"ZERAR TUDO?\n\n"+
"ISSO APAGARÁ HISTÓRICO, TREINAMENTO, "+
"GREEN, GREEN G1 E LOSS MANUAIS."
))return;

state=fresh();
triangleCache.clear();
spaceCache.clear();
save();
render();
}

/* ======================================================
 COMPONENTES VISUAIS
====================================================== */

function button(label,action,parent,extra="") {
const b=document.createElement("button");

b.className="btn "+extra;
b.textContent=label;
b.onclick=action;

parent.appendChild(b);
return b;
}

function sortedBlocks(play) {
return validPlay(play)
?[...play.blocks].sort((a,b)=>
Object.keys(REGIONS).indexOf(region(a.center))-
Object.keys(REGIONS).indexOf(region(b.center))
):[];
}

function centersHTML(play) {
return sortedBlocks(play).map(b=>`
<div class="center ${b.radius===1?"short":""}">
<strong>${b.center}</strong>
<small>${region(b.center)}</small>
<small>${b.radius} ${b.radius===1?"VIZINHO":"VIZINHOS"}</small>
</div>
`).join("");
}

function cloud(numbers,highlight=[]) {
const marked=new Set(highlight);

return `<div class="cloud">
${numbers.map(n=>`
<span class="${marked.has(n)?"danger":""}">${n}</span>
`).join("")}
</div>`;
}

function tableHTML(headers,rows) {
return `
<div class="tablewrap">
<table>
<thead><tr>
${headers.map(x=>`<th>${esc(x)}</th>`).join("")}
</tr></thead>
<tbody>
${rows.map(row=>`
<tr>${row.map(x=>`<td>${x??"—"}</td>`).join("")}</tr>
`).join("")}
</tbody>
</table>
</div>`;
}

function metrics(rows) {
const closed=rows.filter(
r=>["GREEN","GREEN G1","LOSS"].includes(r.result)
);

const green=closed.filter(r=>r.result==="GREEN").length;
const g1=closed.filter(r=>r.result==="GREEN G1").length;
const loss=closed.filter(r=>r.result==="LOSS").length;
const net=closed.reduce((s,r)=>s+(r.profit||0),0);

return {total:closed.length,green,g1,loss,net};
}

function metricsHTML(rows) {
const m=metrics(rows);

return `<div class="metrics">
${[
["CICLOS",m.total],
["GREEN",m.green],
["GREEN G1",m.g1],
["LOSS",m.loss],
["ACERTOS",pct(m.green+m.g1,m.total)],
["LÍQUIDO",fmt(m.net)]
].map(([label,value])=>`
<div class="metric">
<small>${label}</small><b>${value}</b>
</div>
`).join("")}
</div>`;
}

function breakdown(strategy=null,mode="CONGELADA") {
const out={
CONTINUIDADE:{total:0,hits:0},
DESLOCAMENTO:{total:0,hits:0},
RUPTURA:{total:0,hits:0}
};

for(const row of g1History(strategy,mode,500)) {
const item=out[row.behavior];
if(!item)continue;

item.total++;
if(row.hit)item.hits++;
}

return out;
}

function breakdownHTML(strategy=null) {
return tableHTML(
["COMPORTAMENTO","OCORRÊNCIAS","GREEN G1","LOSS","ACERTO"],
Object.entries(breakdown(strategy)).map(([name,x])=>[
name,
x.total,
`<span class="good">${x.hits}</span>`,
`<span class="bad">${x.total-x.hits}</span>`,
pct(x.hits,x.total)
])
);
}

function contextHTML(keys) {
return (keys||[]).map(
key=>`<div class="muted">${esc(key)}</div>`
).join("");
}

/* ======================================================
 TRIANGULAÇÃO VISUAL
====================================================== */

function triangleSVG(f) {
if(!f)return "";

const pos=n=>{
const p=pointTriangle(n);
return {x:250+p.x*190,y:250-p.y*190};
};

const a=pos(f.a),b=pos(f.b),c=pos(f.c);
const marked=new Set([f.a,f.b,f.c]);

return `
<svg viewBox="0 0 500 500" role="img"
aria-label="Triangulação dos últimos resultados">

<defs>
<marker id="triA" markerWidth="8" markerHeight="8"
refX="6" refY="3" orient="auto">
<path d="M0 0 L6 3 L0 6 Z" fill="#57e4ff"/>
</marker>

<marker id="triB" markerWidth="8" markerHeight="8"
refX="6" refY="3" orient="auto">
<path d="M0 0 L6 3 L0 6 Z" fill="#ffd36a"/>
</marker>
</defs>

<circle cx="250" cy="250" r="190"
fill="#101e2d" stroke="#58718a" stroke-width="2"/>

${f.a!==f.c?`
<line x1="${a.x}" y1="${a.y}"
x2="${c.x}" y2="${c.y}"
stroke="#a7bdd4" stroke-width="2"
stroke-dasharray="7 5"/>
`:""}

${f.a!==f.b?`
<path d="M ${a.x} ${a.y}
Q ${(a.x+b.x)/2+7} ${(a.y+b.y)/2+7}
${b.x} ${b.y}"
fill="none" stroke="#57e4ff" stroke-width="4"
marker-end="url(#triA)"/>
`:""}

${f.b!==f.c?`
<path d="M ${b.x} ${b.y}
Q ${(b.x+c.x)/2-7} ${(b.y+c.y)/2-7}
${c.x} ${c.y}"
fill="none" stroke="#ffd36a" stroke-width="4"
marker-end="url(#triB)"/>
`:""}

${W.map(n=>{
const p=pos(n);

return `
<circle cx="${p.x}" cy="${p.y}" r="14"
fill="${n===0?"#087b50":RED.has(n)?"#a92b43":"#253a50"}"
stroke="${marked.has(n)?"#ffe078":"#526d85"}"
stroke-width="${marked.has(n)?3:1}"/>

<text x="${p.x}" y="${p.y+4}"
fill="white" text-anchor="middle"
font-size="11" font-weight="bold">${n}</text>`;
}).join("")}

<text x="250" y="241" fill="#bdd0e2"
text-anchor="middle" font-size="14">
${f.a} → ${f.b} → ${f.c}
</text>

<text x="250" y="265" fill="#57e4ff"
text-anchor="middle" font-size="11">
${esc(f.type)}
</text>
</svg>`;
}

function triangulationHTML() {
const h=state.history;
const a=triangleAnalysis(h);
const f=a.last;

if(!f) {
return `<div class="box">AGUARDANDO TRÊS RESULTADOS.</div>`;
}

const pair=h.slice(-2);
const next=[];

for(let i=0;i+2<h.length;i++) {
if(h[i]===pair[0]&&h[i+1]===pair[1]) {
next.push(h[i+2]);
}
}

return `
<div class="box">
<b>TRIANGULAÇÃO</b>
<p>TRINCA: ${f.a} → ${f.b} → ${f.c}</p>
<p>FORMA: <strong>${esc(f.type)}</strong></p>
<p>SALTOS: ${f.s1} / ${f.s2}</p>
<p>FECHAMENTO A → C: ${f.closure} CASAS</p>
<p>CORDAS AB / BC / AC: ${f.chords.map(fmt).join(" / ")}</p>
<p>ÂNGULOS A / B / C:
${f.angles.map(x=>x==null?"INDEFINIDO":fmt(x)+"°").join(" / ")}
</p>
<p>ÁREA: ${fmt(f.area)}</p>
<p>${f.degenerate?"TRINCA DEGENERADA":"TRIÂNGULO COM TRÊS PONTOS DISTINTOS"}</p>
</div>

<div class="triangleDrawing">${triangleSVG(f)}</div>

<div class="muted">
CIANO: A → B. AMARELO: B → C. TRACEJADO: A → C.
AS LINHAS NÃO REPRESENTAM O CAMINHO REAL DA BOLA.
</div>

<div class="box">
<p>MEMÓRIA DO PAR: ${pair.join(" → ")}</p>
<p>OCORRÊNCIAS EXATAS COMPLETAS: ${a.exactPairs}</p>
<p>TRINCAS COM SALTO INICIAL SEMELHANTE: ${a.matches}</p>
<p>TRINCAS CONHECIDAS: ${a.samples}</p>
</div>

<div class="title">RESULTADOS DEPOIS DO PAR</div>
${next.length?cloud(next):`<div class="muted">SEM OCORRÊNCIA EXATA COMPLETA.</div>`}

<div class="title">FORMAS DA JANELA</div>
${Object.entries(a.counts).map(([name,count])=>`
<div class="listrow">${esc(name)} • ${count}</div>
`).join("")}

<div class="title">ÚLTIMAS TRINCAS</div>

${tableHTML(
["GIRO","TRINCA","FORMA","AB","BC","AC","ÁREA"],
a.triples.slice(-25).reverse().map(t=>[
t.turn,
`${t.a} → ${t.b} → ${t.c}`,
esc(t.type),
t.s1,t.s2,t.closure,fmt(t.area)
])
)}

<div class="title">PESOS RELATIVOS DA TRIANGULAÇÃO</div>

${tableHTML(
["NÚMERO","PESO"],
W.map(n=>({n,w:a.weights[ix(n)]}))
.sort((x,y)=>y.w-x.w)
.map(x=>[x.n,fmt(x.w)])
)}
`;
}

/* ======================================================
 PAINEL DOS NOVOS CÁLCULOS ESPACIAIS
====================================================== */

function spatialHTML() {
const h=state.history;

if(h.length<4) {
return `<div class="box">AGUARDANDO QUATRO RESULTADOS.</div>`;
}

const s=spatialRead(h);
const p=s.poles.active;
const a=s.arcs.active;
const c=s.chain;

const leaders=W.map(n=>({
n,
total:s.weights[ix(n)],
triangle:s.tri.weights[ix(n)],
chain:s.chainWeights[ix(n)],
pole:s.poleWeights[ix(n)],
arc:s.arcWeights[ix(n)]
})).sort((x,y)=>y.total-x.total);

return `
<div class="box">
<b>INTEGRAÇÃO DOS MOTORES V6.4.2</b>

<p>
ESTES PESOS ENTRAM NOS CÁLCULOS ANTES DA GEOMETRIA.
AS ESTRATÉGIAS UTILIZAM OS MOTORES RESULTANTES.
</p>

<p>
O TREINADOR GLOBAL AVALIA CICLOS FECHADOS
COM CONTEXTOS CAPTURADOS ANTES DO RESULTADO.
</p>

${contextHTML(s.keys)}
</div>

<div class="box">
<b>ENCADEAMENTO</b>

<p>${c?c.numbers.join(" → "):"AGUARDANDO"}</p>
<p>SALTOS: ${c?c.hops.join(" / "):"—"}</p>

<p>
FORMAS ENCADEADAS:
${c?esc(c.first.type)+" → "+esc(c.second.type):"—"}
</p>

<p>
FECHAMENTOS:
${c?c.first.closure+" / "+c.second.closure:"—"} CASAS
</p>

<p>EXEMPLOS HISTÓRICOS SEMELHANTES: ${s.chainExamples}</p>
</div>

<div class="box">
<b>DOIS POLOS MÓVEIS</b>

${p?`
<p>STATUS: ${p.active?"ATIVO":"ENCERRADO"}</p>
<p>EVENTO: <strong>${esc(p.event)}</strong></p>
<p>POLOS INICIAIS: ${p.initial.join(" / ")}</p>
<p>POLOS ATUAIS: <strong>${p.anchors.join(" / ")}</strong></p>
<p>DESLOCAMENTOS ACUMULADOS: ${p.drift.join(" / ")} CASAS</p>
<p>ÚLTIMOS DESLOCAMENTOS: ${p.lastShift.join(" / ")} CASAS</p>
<p>ALTERNÂNCIAS: ${p.alternations}</p>
<p>INTERRUPÇÕES: ${p.interruptions}</p>
<p>CONSECUTIVOS FORA DOS POLOS: ${p.outside}</p>
<p>
PRÓXIMO LADO DO PADRÃO:
${p.active?p.anchors[1-p.lastSide]:"SEM POLO ATIVO"}
</p>
`:`<p>AINDA NÃO FOI FORMADO UM EPISÓDIO A → B → A' → B'.</p>`}

<div class="muted">
FORMAÇÃO: RETORNOS DE ATÉ 2 CASAS, SEPARAÇÃO MÍNIMA DE 8.
ACOMPANHAMENTO: ATÉ 4 CASAS DO POLO.
DOIS RESULTADOS SEGUIDOS FORA ENCERRAM O EPISÓDIO.
</div>
</div>

<div class="title">EVENTOS DOS POLOS</div>

${tableHTML(
["GIRO","NÚMERO","EVENTO","POLOS","DESLOCAMENTOS"],
s.poles.events.slice(-30).reverse().map(e=>[
e.turn,e.number,esc(e.event),
e.anchors.join(" / "),e.drift.join(" / ")
])
)}

<div class="box">
<b>ARCO FÍSICO ACOMPANHADO</b>

${a?`
<p>${a.numbers.join(" • ")}</p>
<p>EVENTO: <strong>${esc(a.event)}</strong></p>
<p>FORMAÇÃO ANTES DO GIRO: ${a.formedBefore}</p>
<p>VISITAS NOS ÚLTIMOS ${a.total}: ${a.count}</p>
<p>CONSECUTIVOS DENTRO: ${a.inside}</p>
<p>CONSECUTIVOS FORA: ${a.outside}</p>
<p>ENTRADAS: ${a.entries} • SAÍDAS: ${a.exits}</p>
<p>REENTRADAS: ${a.returns}</p>
<p>ÚLTIMO INTERVALO FORA: ${a.lastGap}</p>
<p>MAIOR INTERVALO FORA: ${a.maxGap}</p>
<p>DESLOCAMENTO NA TROCA DO ARCO: ${a.drift} CASAS</p>
`:`<p>AGUARDANDO EVIDÊNCIA PARA FORMAR UM ARCO.</p>`}

<div class="muted">
O ARCO DO RESULTADO É DEFINIDO PELO HISTÓRICO ANTERIOR.
A LIDERANÇA DESCRITIVA ATUAL PODE DIFERIR DO ARCO
ACOMPANHADO POR CAUSA DA REGRA DE PERSISTÊNCIA.
</div>
</div>

<div class="title">ARCOS MAIS VISITADOS AGORA</div>

${tableHTML(
["#","ARCO DE 8 POSIÇÕES","VISITAS","AMOSTRA"],
s.arcs.ranked.slice(0,10).map((r,i)=>[
i+1,r.numbers.join(" • "),r.count,r.total
])
)}

<div class="title">ENTRADAS, SAÍDAS E REENTRADAS</div>

${tableHTML(
["GIRO","NÚMERO","EVENTO","ARCO","FORA","ÚLTIMO INTERVALO"],
s.arcs.events.slice(-30).reverse().map(e=>[
e.turn,e.number,esc(e.event),
esc(e.arcId),e.outside,e.gap
])
)}

<div class="title">TRANSIÇÕES ESPACIAIS JÁ CONHECIDAS</div>

${tableHTML(
["CONTEXTO ANTERIOR","PRÓXIMOS TESTADOS","PRÓXIMOS DENTRO"],
Object.entries(s.arcs.transitions).map(([event,x])=>[
esc(event),x.total,x.hits
])
)}

<div class="title">PESOS EFETIVOS DOS MOTORES</div>

${tableHTML(
["NÚMERO","TRINCA","ENCADEAMENTO","POLOS","ARCO","COMBINADO"],
leaders.map(x=>[
x.n,fmt(x.triangle),fmt(x.chain),
fmt(x.pole),fmt(x.arc),fmt(x.total)
])
)}

<div class="title">VALIDAÇÃO VIRTUAL NO CONTEXTO ATUAL</div>

${tableHTML(
["ESTRATÉGIA","CICLOS COMPATÍVEIS","SUPORTE","ACERTOS","LOSS","ÍNDICE"],
trainerRanking().map(r=>[
esc(r.name),r.contextTotal,fmt(r.contextSupport),
r.contextHits,r.contextLoss,pct(r.score,1)
])
)}

<div class="muted">
PESOS RELATIVOS E ÍNDICES COMPARATIVOS NÃO SÃO
PROBABILIDADES GARANTIDAS.
O CONTEXTO TEM QUATRO CAMADAS:
TRINCA, ENCADEAMENTO, POLOS E ARCO.
</div>
`;
}

/* ======================================================
 PAINÉIS DOS TREINADORES
====================================================== */

function card10(record) {
const rejected=record.status==="REJECTED";
const approved=record.status==="APPROVED";

const pending=state.n10.pending.filter(p=>
p.trigger===record.trigger&&p.recordId===record.id
);

return `
<div class="g1card ${approved?"selected":""}">
<b class="${rejected?"bad":approved?"good":""}">
GATILHO ${record.trigger} • ${recordStatus10(record)}
</b>

<div class="muted">
ORIGEM: ${esc(record.motor.key)}
• GIRO ${record.created}
</div>

<div class="play10">
<div class="centers">${centersHTML(record.motor.play)}</div>

${rejected?`
<div class="reject10">
NÃO JOGAR
<small>REPROVADA PARA O GATILHO ${record.trigger}</small>
</div>
`:""}
</div>

<div class="muted">
28 COBERTOS: ${record.motor.play.numbers.join(" • ")}
</div>

<div class="muted">
9 DESCOBERTOS: ${missing(record.motor.play).join(" • ")}
</div>

<div class="muted">
PROSPECTIVOS:
GREEN ${record.green} • GREEN G1 ${record.g1} • LOSS ${record.loss}
</div>

<div class="muted">
RETROSPECTIVOS VIRTUAIS:
GREEN ${record.vg} • GREEN G1 ${record.vg1} • LOSS ${record.vl}
</div>

<div class="muted">
COBERTURA DOS PESOS ESPACIAIS:
${pct(spatialCoverage(record.motor.play,state.history),1)}
</div>

${record.lastResult?`
<div class="muted">
ÚLTIMO CICLO: ${esc(record.lastResult)} • GIRO ${record.last}
</div>
`:""}

${record.lastVirtual?`
<div class="muted">
ÚLTIMO RETROSPECTIVO VIRTUAL:
${esc(record.lastVirtual)} • GIRO ${record.lastVirtualTurn}
</div>
`:""}

${pending.length?`
<div class="muted">
ABERTOS:
${pending.map(p=>
`${p.actual?"REAL":"VIRTUAL"} ${esc(p.phase)} • ${p.turn}`
).join(" / ")}
</div>
`:""}

${record.lastResult==="GREEN G1"?`
<div class="muted">
APROVAÇÃO DO CICLO COM DEFESA G1.
A ENTRADA ORIGINAL NÃO COBRIU O PRIMEIRO RESULTADO.
</div>
`:""}
</div>`;
}

function numberTrainer10HTML() {
const current=state.history.at(-1);

if(current==null||state.history.length<8) {
return `<div class="box">AGUARDANDO HISTÓRICO.</div>`;
}

const trigger=state.n10.viewTrigger==="CURRENT"
?current:Number(state.n10.viewTrigger);

const records=Object.values(book10(trigger).records);

const order={APPROVED:0,TESTING:1,REJECTED:2};

const ranked=[...records].sort((a,b)=>
order[a.status]-order[b.status]||
scoreRecord10(b,state.history)-scoreRecord10(a,state.history)||
b.last-a.last
);

const visible=state.n10.viewAll?ranked:ranked.slice(0,60);

const selected=state.n10.choice;

const selectedRecord=selected
?book10(selected.trigger).records[selected.recordId]
:null;

const forward=state.n10.events.filter(
e=>e.kind==="FORWARD"
);

const events=state.n10.events.filter(
e=>e.trigger===trigger
).slice(-35).reverse();

return `
<div class="box">
<b>TREINADOR GLOBAL NÚMEROS 1.0</b>

<p>
STATUS:
<strong class="${state.strategy===N10&&!state.manual?"good":"bad"}">
${state.strategy===N10&&!state.manual
?"CONTROLANDO A JOGADA":"TREINAMENTO VIRTUAL"}
</strong>
</p>

<p>GATILHO ATUAL: ${current}</p>

<p>
PRÓXIMA COMBINAÇÃO:
${selectedRecord?recordStatus10(selectedRecord):"SEM GEOMETRIA ELEGÍVEL"}
</p>

<p>
APROVAÇÃO, BLOQUEIO E CONTEXTO ESPACIAL
PARTICIPAM DA SELEÇÃO.
</p>

<p>
ALTERNATIVAS RETROSPECTIVAS CONTINUAM EM TESTE
ATÉ VALIDAÇÃO PROSPECTIVA.
</p>
</div>

<div class="title">COMBINAÇÃO ATUAL</div>

${selectedRecord?card10(selectedRecord):`
<div class="box bad">
SEM COMBINAÇÃO ELEGÍVEL.
AGUARDANDO NOVA GEOMETRIA NORMAL.
REPROVADAS NÃO SERÃO REUTILIZADAS.
</div>
`}

<div class="title">CICLOS REAIS DO NOVO TREINADOR</div>
${metricsHTML(forward.filter(e=>!e.virtual))}

<div class="title">PROSPECTIVOS VIRTUAIS • LÍQUIDO SIMULADO</div>
${metricsHTML(forward.filter(e=>e.virtual))}

<div class="row">
<select id="trigger10">
<option value="CURRENT"
${state.n10.viewTrigger==="CURRENT"?"selected":""}>
ACOMPANHAR NÚMERO ATUAL
</option>

${Array.from({length:37},(_,n)=>`
<option value="${n}"
${String(state.n10.viewTrigger)===String(n)?"selected":""}>
GATILHO ${n}
</option>
`).join("")}
</select>

<button class="btn" id="all10">
${state.n10.viewAll?"MOSTRAR 60 PRIMEIRAS":"MOSTRAR TODAS"}
</button>
</div>

<div class="box">
GATILHO ${trigger}
• APROVADAS ${records.filter(r=>r.status==="APPROVED").length}
• EM TESTE ${records.filter(r=>r.status==="TESTING").length}
• REPROVADAS ${records.filter(r=>r.status==="REJECTED").length}
</div>

${tableHTML(
["GATILHO","APROVADAS","EM TESTE","REPROVADAS","ABERTOS"],
Array.from({length:37},(_,n)=>{
const rows=Object.values(state.n10.books[n]?.records||{});

return [
`<button class="btn" data-trigger10="${n}">${n}</button>`,
rows.filter(r=>r.status==="APPROVED").length,
rows.filter(r=>r.status==="TESTING").length,
rows.filter(r=>r.status==="REJECTED").length,
state.n10.pending.filter(p=>p.trigger===n).length
];
})
)}

<div class="title">
COMBINAÇÕES DO GATILHO ${trigger}
• ${visible.length}/${records.length}
</div>

${visible.map(card10).join("")||
`<div class="box">SEM COMBINAÇÕES PARA ESTE GATILHO.</div>`}

<div class="title">EVENTOS</div>

${events.map(e=>e.kind==="RETROSPECTIVE"?`
<div class="listrow">
<b>RETROSPECTIVO VIRTUAL • GIRO ${e.turn}</b>
<div class="muted">
ALTERNATIVAS ${e.tested}
• GREEN ${e.green}
• GREEN G1 ${e.g1}
• LOSS ${e.loss}
• SEM APOSTA REAL
</div>
</div>
`:`
<div class="listrow">
<b>${e.virtual?"PROSPECTIVO VIRTUAL":"CICLO REAL"} • GIRO ${e.turn}</b>

• <strong class="${e.result==="LOSS"?"bad":"good"}">
${esc(e.result)}
</strong>

<div class="muted">
${e.defense?"DEFESA "+esc(e.defense):"ENTRADA"}
• ${esc(e.source)}
</div>

${contextHTML(e.spatialKeys)}
</div>
`).join("")}

<div class="muted">
O BLOQUEIO É POR GATILHO E GEOMETRIA COMPLETA.
TROCAR O NOME DO MOTOR NÃO LIBERA UMA GEOMETRIA REPROVADA.
</div>
`;
}

function numberTrainerHTML() {
const h=state.history;

if(h.length<8) {
return `<div class="box">AGUARDANDO HISTÓRICO.</div>`;
}

const trigger=h.at(-1);
const ranked=rankNumberCombinations(h,trigger);
const selected=ranked[0];
const pairs=numberTransitions(h,trigger);
const generated=state.numberCombinations;

return `
<div class="box">
<b>TREINADOR GLOBAL NÚMEROS • BASE V6.3.9</b>

<p>
STATUS:
<strong class="${state.strategy==="NUMBER"?"good":"bad"}">
${state.strategy==="NUMBER"?"CONTROLANDO A JOGADA":"ANÁLISE VIRTUAL"}
</strong>
</p>

<p>NÚMERO ATUAL: ${trigger}</p>
<p>COMBINAÇÕES NA JANELA: ${generated.length}</p>
<p>ORIGENS DIFERENTES: ${new Set(generated.map(r=>r.origin)).size}</p>
<p>COMBINAÇÕES COMPARADAS: ${ranked.length}</p>
<p>TRANSIÇÕES DO GATILHO: ${pairs.length}</p>

<p>
MELHOR COMBINAÇÃO:
${selected?"GERADA PELO "+selected.origin:"AGUARDANDO"}
</p>

<p>GIRO DE ORIGEM: ${selected?.turn??"—"}</p>
<p>COBERTURA: ${selected?selected.matches+"/"+selected.total:"—"}</p>
<p>ÍNDICE: ${selected?pct(selected.score,1):"—"}</p>
<p>TROCAS: ${state.numberChanges}</p>

<p>
MANTÉM A COMPARAÇÃO NUMÉRICA E ACRESCENTA
A COBERTURA DOS PESOS ESPACIAIS.
NÃO USA GREEN/LOSS COMO CRITÉRIO DE SELEÇÃO.
</p>
</div>

${tableHTML(
["#","ORIGEM","GIRO","TRANSIÇÕES","COBERTAS","FORA","ESPACIAL","ÍNDICE"],
ranked.map((r,i)=>[
i+1,r.origin,r.turn,r.total,r.matches,r.misses,
pct(r.spatialScore,1),pct(r.score,1)
])
)}

<div class="title">
JOGADA ESCOLHIDA • ORIGEM ${selected?.origin??"—"}
</div>

<div class="centers">${centersHTML(selected?.play)}</div>

<div class="title">28 COBERTOS</div>
${cloud(selected?.covered||[])}

<div class="title">9 DESCOBERTOS</div>
${cloud(missing(selected?.play))}

<div class="title">RESULTADOS DEPOIS DO ${trigger}</div>
${cloud(pairs.map(r=>r.next))}

<div class="title">COMBINAÇÕES GERADAS CRONOLOGICAMENTE</div>

${tableHTML(
["GIRO","ORIGEM","6 CENTROS"],
generated.slice().reverse().map(r=>[
r.turn,r.origin,r.centers.join(" • ")
])
)}

<div class="title">ÚLTIMAS COMPARAÇÕES VIRTUAIS</div>

${state.numberComparisons.slice(-20).reverse().map(r=>`
<div class="listrow">
GATILHO ${r.trigger}
• COMBINAÇÃO DO ${r.sourceNumber}
• GIRO ${r.sourceTurn}
• RESULTADO ${r.next}
• <strong class="${r.covered?"good":"bad"}">
${r.covered?"COBERTO":"FORA"}
</strong>
</div>
`).join("")}
`;
}

function trainerHTML() {
const ranked=trainerRanking();
const active=ranked.find(r=>r.id===state.trainerChoice);

const real=state.realG1.length;
const hits=state.realG1.filter(
r=>r.result==="GREEN G1"
).length;

return `
<div class="box">
<b>TREINADOR GLOBAL ORIGINAL</b>

<p>
STATUS:
<strong class="${state.strategy==="TRAINER"?"good":"bad"}">
${state.strategy==="TRAINER"?"CONTROLANDO A JOGADA":"ANÁLISE VIRTUAL"}
</strong>
</p>

<p>ESTRATÉGIAS: ${ranked.length}</p>
<p>ATIVA: ${esc(active?.name||"AGUARDANDO")}</p>
<p>GIROS DESDE A TROCA: ${state.trainerTurns}</p>
<p>TROCAS: ${state.trainerChanges}</p>

<p>
${state.trainerPending
?"TROCA PENDENTE — FECHAR GALE"
:"AVALIAÇÃO A CADA GIRO"}
</p>

<p>
CICLOS COMPATÍVEIS DA ATIVA:
${active?.contextTotal||0}
</p>

<p>
RECONHECE TRINCAS, ENCADEAMENTO,
POLOS E ARCOS POR MEIO DOS CONTEXTOS ABAIXO.
O SUPORTE REDUZ A INFLUÊNCIA DE AMOSTRAS PEQUENAS.
</p>

${contextHTML(spatialRead(state.history).keys)}

<p>
AS APROVAÇÕES DOS TREINADORES NUMÉRICOS
CONTINUAM INDEPENDENTES DESTE RANKING.
</p>
</div>

<div class="box">
<b>TREINADOR GLOBAL G1</b>

<p>STATUS: ${state.g1Trainer?"ATIVADO":"DESATIVADO"}</p>
<p>GALES REAIS: ${real}</p>
<p>GREEN G1: ${hits}</p>
<p>LOSS: ${real-hits}</p>
<p>APROVEITAMENTO: ${pct(hits,real)}</p>
<p>EVENTOS VIRTUAIS: ${uniqueGales(null,5000).length}</p>
<p>RUPTURAS: ${breakdown().RUPTURA.total}</p>
</div>

<div class="title">RANKING DAS ESTRATÉGIAS</div>

${tableHTML(
["#","ESTRATÉGIA","CICLOS","ACERTOS","LOSS","CONTEXTO","SUPORTE","ÍNDICE"],
ranked.map((r,i)=>[
i+1,esc(r.name),r.total,r.hits,r.loss,
r.contextTotal,fmt(r.contextSupport),pct(r.score,1)
])
)}

<div class="title">ÚLTIMAS TROCAS</div>

${state.trainerHistory.slice(-12).reverse().map(r=>`
<div class="listrow">
GIRO ${r.turn}
• ${esc(r.from)} → ${esc(r.to)}
${contextHTML(r.spatialKeys)}
</div>
`).join("")}
`;
}

/* ======================================================
 PAINÉIS G1
====================================================== */

function g1RankingHTML() {
const ranked=[
...definitions(),
{id:"NUMBER",name:"TREINADOR GLOBAL NÚMEROS"},
{id:N10,name:"TREINADOR GLOBAL NÚMEROS 1.0"}
].map(def=>{
const modes=G1_MODES.map(mode=>({
mode,...defenseMetrics(def.id,mode,300)
}));

const best=[...modes].sort((a,b)=>
(b.hits+(28/37)*12)/(b.total+12)-
(a.hits+(28/37)*12)/(a.total+12)
)[0];

return {...def,modes,best};

}).sort((a,b)=>
(b.best.hits+(28/37)*12)/(b.best.total+12)-
(a.best.hits+(28/37)*12)/(a.best.total+12)
);

return `
<div class="box">
<b>RANKING EXCLUSIVO DE G1</b>
<p>APENAS ENTRADAS QUE CHEGARAM AO GALE.</p>
<p>AS TRÊS DEFESAS SÃO TESTADAS NO MESMO RESULTADO.</p>
<p>CADA GALE É CONTADO UMA VEZ NO TOTAL DE EVENTOS.</p>
</div>

${tableHTML(
["#","ESTRATÉGIA","GALES","MELHOR DEFESA","GREEN G1","LOSS","ACERTO"],
ranked.map((r,i)=>[
i+1,esc(r.name),uniqueGales(r.id,500).length,
esc(r.best.mode),r.best.hits,r.best.loss,
pct(r.best.hits,r.best.total)
])
)}

<div class="title">CONTINUIDADE / DESLOCAMENTO / RUPTURA</div>
${breakdownHTML()}

<div class="title">COMPARAÇÃO DAS TRÊS DEFESAS</div>

${ranked.map(r=>`
<div class="box">
<b>${esc(r.name)}</b>

${tableHTML(
["DEFESA","GALES","GREEN G1","LOSS","ACERTO"],
r.modes.map(m=>[
esc(m.mode),m.total,m.hits,m.loss,pct(m.hits,m.total)
])
)}
</div>
`).join("")}
`;
}

function g1NumbersHTML() {
const cs=motors(state.history);

const original=
state.cycle?.original||activeMotor(cs);

if(!validPlay(original?.play)) {
return `<div class="box">AGUARDANDO HISTÓRICO.</div>`;
}

const strategy=
state.cycle?.strategy||activeDefinition().id;

const trigger=
state.cycle?.trigger??state.history.at(-1);

if(trigger==null)return "";

const reading=behaviorReading(
original,state.history,strategy,trigger
);

const options=defenses(
original,trigger,state.history,strategy
);

const decision=
state.cycle?.decision||
chooseG1(original,trigger,state.history,strategy);

return `
<div class="box">
<b>TREINADOR GLOBAL G1 POR NÚMERO</b>

<p>STATUS: ${state.g1Trainer?"ATIVO":"DESLIGADO"}</p>
<p>ESTRATÉGIA: ${esc(strategy)}</p>
<p>MOTOR: ${esc(original.key)}</p>
<p>GATILHO: ${trigger}</p>
<p>COMPORTAMENTO: ${reading.type}</p>
<p>TRINCA: ${esc(reading.triangle)}</p>
<p>POLOS: ${esc(reading.poles)}</p>
<p>ARCO: ${esc(reading.arc)}</p>

<p>
GALES DESTE NÚMERO:
${numberG1Events(strategy,trigger,100).length}
</p>

<p>GREEN G1 DO NÚMERO: ${reading.numberHit}</p>
<p>LOSS DO NÚMERO: ${reading.numberLoss}</p>
<p>LOSS ÚLTIMOS 12: ${reading.loss12}/${reading.total12}</p>
<p>LOSS ÚLTIMOS 6: ${reading.loss6}/${reading.total6}</p>
<p>FORA DA COBERTURA, ÚLTIMOS 6: ${reading.outside6}</p>
<p>SEQUÊNCIA DE LOSS: ${reading.streak}</p>
<p>DEFESA: <strong>${esc(decision?.mode||"—")}</strong></p>
</div>

${tableHTML(
["DEFESA","TESTES Nº","GREEN G1","LOSS","ACERTO"],
G1_MODES.map(mode=>{
const m=numberG1Metrics(strategy,trigger,mode,100);
return [
esc(mode),m.total,m.hits,m.loss,pct(m.hits,m.total)
];
})
)}

<div class="title">9 DESCOBERTOS DA ENTRADA</div>
${cloud(missing(original.play))}

${options.map(option=>{
const m=defenseMetrics(strategy,option.mode,100);
const n=numberG1Metrics(strategy,trigger,option.mode,100);

return `
<div class="g1card ${decision?.mode===option.mode?"selected":""}">
<b>${esc(option.mode)}</b>

<div class="centers">
${centersHTML(option.motor.play)}
</div>

<div class="muted">28 COBERTOS • 9 DESCOBERTOS</div>
${cloud(missing(option.motor.play))}

<div class="muted">
GLOBAL:
GALES ${m.total} • GREEN G1 ${m.hits}
• LOSS ${m.loss} • ACERTO ${pct(m.hits,m.total)}
</div>

<div class="muted">
GATILHO ${trigger}:
GALES ${n.total} • GREEN G1 ${n.hits}
• LOSS ${n.loss} • ACERTO ${pct(n.hits,n.total)}
</div>

<div class="muted">
COBERTURA ESPACIAL:
${pct(spatialCoverage(option.motor.play,state.history),1)}
</div>
</div>`;
}).join("")}

<div class="title">CONTINUIDADE / DESLOCAMENTO / RUPTURA</div>
${breakdownHTML(strategy)}

<div class="title">ÚLTIMOS GALES REAIS</div>

${state.realG1.slice(-12).reverse().map(r=>`
<div class="listrow">
GIRO ${r.turn}
• NÚMERO ${r.trigger}
• ${esc(r.mode)}
• <b>${esc(r.result)}</b>
• ${esc(r.behavior)}
${contextHTML(r.spatialKeys)}
</div>
`).join("")}
`;
}

/* ======================================================
 SALTOS / ESPELHO / LINHA DO TEMPO
====================================================== */

function jumpsHTML() {
const a=analyze(state.history);

return `
<div class="box">
<b>SALTOS E DIREÇÃO</b>

<p>
NUMÉRICO:
${a.numericStreak.dir>0?"CRESCENTE":
a.numericStreak.dir<0?"DECRESCENTE":"MISTO"}
• ${a.numericStreak.length} PASSOS
</p>

<p>
FÍSICO:
${a.physicalStreak.dir>0?"HORÁRIO":
a.physicalStreak.dir<0?"ANTI-HORÁRIO":"MISTO"}
• ${a.physicalStreak.length} PASSOS
</p>

<p>MÉDIA ÚLTIMOS 3: ${fmt(a.mean3)}</p>
<p>MÉDIA ANTERIOR: ${fmt(a.previous3)}</p>
<p>VARIAÇÃO: ${fmt(a.acceleration)}</p>
</div>

<div class="title">AUSÊNCIA POR REGIÃO FIXA</div>

${Object.entries(a.regions).map(([name,x])=>`
<div class="listrow">
${name}
• AUSÊNCIA ${x.absence}
• ÚLTIMOS 12: ${x.recent}
</div>
`).join("")}

<div class="title">ÚLTIMAS TRANSIÇÕES</div>

${a.transitions.slice(-12).reverse().map(x=>`
<div class="listrow">
${x.from} → ${x.to}
• ${x.distance} CASAS
• ${x.physical>0?"HORÁRIO":
x.physical<0?"ANTI-HORÁRIO":"PARADO"}
</div>
`).join("")}

<div class="muted">
DIREÇÃO DO MENOR SALTO NO VETOR W.
NÃO É MEDIÇÃO DA DIREÇÃO REAL DA BOLA.
</div>
`;
}

function mirrorsHTML() {
const recent=state.history.slice(-20);
const last=state.history.at(-1);

const near=last==null?[]:W.filter(
n=>MIRROR.has(n)&&distance(last,n)<=4
);

const far=last==null?[]:W.filter(
n=>MIRROR.has(n)&&distance(last,n)>=10
);

return `
<div class="box">
<b>ESPELHO / ANTIESPELHO</b>
<p>ESPELHO ÚLTIMOS 20:
${recent.filter(n=>MIRROR.has(n)).length}</p>
<p>ANTIESPELHO ÚLTIMOS 20:
${recent.filter(n=>!MIRROR.has(n)).length}</p>
</div>

<div class="title">ESPELHOS PRÓXIMOS</div>
${cloud(near)}

<div class="title">ESPELHOS DISTANTES</div>
${cloud(far)}

<div class="title">TODOS OS ESPELHOS</div>
${cloud(W.filter(n=>MIRROR.has(n)))}

<div class="title">ANTIESPELHOS</div>
${cloud(W.filter(n=>!MIRROR.has(n)))}
`;
}

function timelineHTML() {
return state.ledger.slice(-60).reverse().map(r=>`
<div class="listrow">
<b>GIRO ${r.turn}</b>
• ${r.number}
• ${esc(r.result)}

<div class="muted">
GATILHO ${r.trigger??"—"}
• ${esc(r.strategy)}
• ${esc(r.motor)}
• ${region(r.number)}
• ${mirror(r.number)}
</div>

<div class="muted">CONTEXTO ANTES DO RESULTADO:</div>
${contextHTML(r.spatialKeys)}

${r.numberCandidate!=null?`
<div class="muted">
TREINADOR NÚMEROS:
COMBINAÇÃO DO ${r.numberCandidate}
• GIRO DE ORIGEM ${r.numberCandidateTurn}
</div>
`:""}
</div>
`).join("");
}

/* ======================================================
 CSS
====================================================== */

const css=`
*{box-sizing:border-box}
body{
margin:0;background:#101720;color:#f4f7fb;
font-family:Arial,sans-serif;font-size:13px
}
.app{max-width:1100px;margin:auto;padding:12px}
h1{
font-size:24px;text-align:center;color:#59e5ff;
margin:15px 0 5px
}
.sub{
text-align:center;font-size:11px;color:#b3c7d9;
line-height:1.7;margin-bottom:15px
}
.panel{
background:#1d2938;border:1px solid #405a73;
border-radius:11px;padding:12px;margin:10px 0
}
.title{
color:#47e1f8;font-size:12px;font-weight:bold;margin:13px 0
}
.row{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}
.btn{
background:#304359;border:1px solid #708aa6;
border-radius:7px;color:white;padding:10px;
font-size:11px;font-weight:bold;cursor:pointer
}
.btn.active{background:#087e9c;border-color:#4eeaff}
.btn.trainer{background:#263f4c;border-color:#4d8191}
.btn.trainer.active,.btn.trainer.on{
background:#086c4d;border:2px solid #42ffb0;
box-shadow:0 0 13px #27e99a77,inset 0 0 8px #27e99a33
}
.btn.number.active{
background:#705200;border:2px solid #ffdf60;
box-shadow:0 0 16px #ffce3677,inset 0 0 8px #ffce3633
}
.btn.number10.active{
background:#512884;border:2px solid #d6a3ff;
box-shadow:0 0 16px #ae67ff77
}
.btn:disabled,.key:disabled{opacity:.35;cursor:not-allowed}
textarea{
width:100%;height:88px;padding:10px;border-radius:8px;
background:#0c1623;border:1px solid #62758b;color:white
}
.status{
font-size:12px;color:#b5d7e8;padding:9px 0;
overflow-wrap:anywhere
}
.progress{
background:#101e2c;border:1px solid #476581;
border-radius:9px;padding:12px;margin:10px 0
}
.progress strong{font-size:25px;color:#59e5ff}
.progress.waiting{border:2px solid #ffd15c;background:#42351b}
.progress.waiting strong{color:#ffd15c}
.bar{
height:12px;background:#34475a;border-radius:20px;
overflow:hidden;margin:10px 0
}
.barfill{height:100%;background:#31dca9;transition:width .2s}
.barfill.waiting{background:#ffd15c}
.centers{
display:grid;grid-template-columns:repeat(6,minmax(0,1fr));
gap:5px;margin:12px 0
}
.center{
min-height:86px;min-width:0;padding:8px 2px;
border:2px solid #20d7f4;border-radius:9px;background:#086c91;
display:flex;flex-direction:column;align-items:center;
justify-content:center;gap:5px;text-align:center
}
.center.short{background:#d2a62b;border-color:#ffe28a;color:#111}
.center strong{
font-size:clamp(27px,5vw,43px);line-height:1;font-weight:900
}
.center small{font-size:9px;font-weight:bold}
.keys{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
.key{
height:44px;border:1px solid #71849b;border-radius:7px;
color:white;font-size:16px;font-weight:bold;cursor:pointer
}
.key.zero{grid-column:span 6}
.history{display:flex;flex-wrap:wrap;gap:5px}
.chip{
min-width:47px;padding:8px;border:2px solid #667f99;
border-radius:7px;text-align:center
}
.chip b{display:block;font-size:18px}
.chip small{font-size:9px}
.chip.green{border:3px solid #29e99a}
.chip.loss{border:3px solid #ff416e}
.chip.gale{border:3px solid #ffe045}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.metric{
background:#293c51;border-radius:8px;
padding:11px 5px;text-align:center
}
.metric small{display:block;font-size:9px;color:#bbd0e2}
.metric b{display:block;font-size:22px;margin-top:5px}
.good{color:#4ee4a4}
.bad{color:#ff778c}
.box{
background:#132235;border:1px solid #46617d;
border-radius:9px;padding:12px;margin:9px 0;
line-height:1.7;overflow-wrap:anywhere
}
.g1card{
background:#142438;border:1px solid #55728f;
border-radius:9px;padding:12px;margin:9px 0
}
.g1card.selected{border:2px solid #38e6aa;background:#10382e}
.cloud{display:flex;flex-wrap:wrap;gap:5px;margin:9px 0}
.cloud span{
display:inline-flex;min-width:36px;height:36px;
align-items:center;justify-content:center;
background:#2b4058;border:1px solid #64829f;
border-radius:7px;font-weight:bold
}
.cloud span.danger{background:#69283e;border-color:#ff6989}
.tablewrap{overflow:auto}
table{
width:100%;min-width:610px;border-collapse:collapse;font-size:11px
}
td,th{padding:9px;text-align:left;border-bottom:1px solid #41556e}
th{color:#57def4}
tr.toprow{background:#184a3d}
.listrow{
border-bottom:1px solid #35485d;padding:9px 2px;
font-size:11px;line-height:1.7;overflow-wrap:anywhere
}
.muted{
color:#b1c7d9;font-size:11px;
line-height:1.7;overflow-wrap:anywhere
}
.head{
width:100%;background:#2c4056;color:white;
border:1px solid #66829f;border-radius:8px;
padding:12px;font-weight:bold;text-align:left;
cursor:pointer;display:flex;justify-content:space-between;gap:8px
}
.hide{display:none}
input[type=number]{
width:110px;padding:9px;background:#101b2a;color:white;
border:1px solid #637b95;border-radius:7px
}
select{
padding:10px;background:#101b2a;color:white;
border:1px solid #8d6eb0;border-radius:7px;max-width:100%
}
.play10{position:relative;min-height:86px}
#centers{position:relative}
.reject10{
position:absolute;left:0;right:0;top:50%;
transform:translateY(-50%);z-index:3;
background:#d20b2b;color:white;border:2px solid #ff8c9c;
text-align:center;font-size:clamp(19px,5vw,31px);
font-weight:900;padding:8px 4px;
box-shadow:0 3px 18px #000b;pointer-events:none
}
.reject10 small{
display:block;font-size:10px;line-height:1.4;margin-top:3px
}
.triangleDrawing{max-width:540px;margin:10px auto}
.triangleDrawing svg{display:block;width:100%;height:auto}
#overlay{
display:none;position:fixed;inset:0;
background:rgba(5,12,20,.96);z-index:999999;
align-items:center;justify-content:center;padding:20px
}
#overlay.show{display:flex}
.overlayBox{
width:min(440px,100%);background:#1d3143;
border:2px solid #3ce6bc;border-radius:16px;
padding:30px 20px;text-align:center;
box-shadow:0 0 35px #18a57b55
}
.spinner{
width:60px;height:60px;margin:20px auto;
border:6px solid #36536b;border-top-color:#3ce6bc;
border-radius:50%;animation:spin .8s linear infinite
}
@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:600px){
.center{min-height:79px}
.center strong{font-size:clamp(25px,7vw,37px)}
.center small{font-size:8px}
.btn{font-size:10px;padding:9px}
}
`;

/* ======================================================
 TELA
====================================================== */

document.body.innerHTML=`
<style>${css}</style>

<div id="overlay">
<div class="overlayBox">
<h2>ANÁLISE BETA V${VERSION}</h2>
<div class="spinner"></div>
<h2>RECALCULANDO ANÁLISES</h2>
<p id="overlayMessage">PREPARANDO JANELA DE 70 NÚMEROS</p>

<div class="muted">
REPROCESSANDO MOTORES, TRINCAS, ENCADEAMENTO,
POLOS, ARCOS, TREINADORES E DEFESAS.
</div>

<div class="muted">
REGISTROS MANUAIS PERMANECEM ARQUIVADOS.
</div>
</div>
</div>

<main class="app">

<h1>ANÁLISE BETA V${VERSION}</h1>

<div class="sub">
12 MOTORES • 28 NÚMEROS • GEOMETRIA INTEGRADA
<br>
TRINCAS • ENCADEAMENTO • POLOS MÓVEIS • ARCOS E REENTRADAS
<br>
7 ORIGINAIS • 12 ADAPTATIVAS • 4 AUTO • PERSONALIZADAS
<br>
TREINADOR GLOBAL • DOIS TREINADORES NUMÉRICOS • G1
<br>
JANELA 70 + 10 • RECÁLCULO APÓS FECHAR O CICLO REAL
</div>

<section class="panel">
<div class="title">IMPORTAR HISTÓRICO</div>

<textarea id="paste"
placeholder="Cole os números do mais antigo ao mais recente"></textarea>

<div class="row">
<button class="btn" id="import">IMPORTAR</button>
<button class="btn" id="restore">RECUPERAR HISTÓRICO</button>
<button class="btn" id="undo">APAGAR ÚLTIMO MANUAL</button>
<button class="btn" id="clear">ZERAR TUDO</button>
</div>

<div class="status" id="status"></div>

<div class="progress" id="progressPanel">
<div class="muted">LANÇAMENTOS MANUAIS DO CICLO</div>
<strong id="counter">0 / 10</strong>

<div class="bar">
<div class="barfill" id="barfill"></div>
</div>

<div class="muted" id="windowInfo"></div>
<div class="muted" id="recalcStatus"></div>
</div>
</section>

<section class="panel">
<div class="title">ESTRATÉGIA ATIVA</div>
<div id="strategies"></div>
<div class="row" id="options"></div>
<div class="muted" id="selected"></div>
<div class="centers" id="centers"></div>
<div class="muted" id="coverage"></div>
</section>

<section class="panel">
<div class="title">TECLADO 0–36</div>
<div class="keys" id="keys"></div>
</section>

<section class="panel">
<div class="title">ÚLTIMOS 14 NÚMEROS</div>
<div class="history" id="last"></div>
</section>

${[
["general","RESULTADO GERAL"],
["trainer","TREINADOR GLOBAL"],
["numbertrainer","TREINADOR GLOBAL NÚMEROS"],
["numbertrainer10","TREINADOR GLOBAL NÚMEROS 1.0"],
["triangulation","TRIANGULAÇÃO / TRINCAS"],
["spatial","ENCADEAMENTO / POLOS / ARCOS / REENTRADAS"],
["g1ranking","RANKING EXCLUSIVO G1 / RUPTURA"],
["g1numbers","TREINADOR GLOBAL G1 POR NÚMERO / DEFESAS"],
["motors","12 MOTORES"],
["jumps","SALTOS E DIREÇÃO"],
["mirrors","ESPELHO / ANTIESPELHO"],
["timeline","LINHA DO TEMPO"],
["lab","LABORATÓRIO"]
].map(([id,title])=>`
<section class="panel">
<button class="head" data-panel="${id}">
${title}<span>−</span>
</button>
<div id="${id}"></div>
</section>
`).join("")}

<section class="panel">
<div class="title">FICHAS</div>

<div class="row">
<label>
VALOR DA FICHA
<input id="stake" type="number" min=".01" step=".01">
</label>

<label>
MULTIPLICADOR G1
<input id="multiplier" type="number" min=".01" step=".01">
</label>
</div>
</section>

<div class="box">
A CADA 10 LANÇAMENTOS MANUAIS,
O SISTEMA REPROCESSA OS 70 MAIS RECENTES.

SE EXISTIR CICLO REAL ABERTO,
ESPERA GREEN, GREEN G1 OU LOSS ENCERRÁ-LO.

O APRENDIZADO DA JANELA É REINICIADO.
OS REGISTROS MANUAIS ANTERIORES PERMANECEM ARQUIVADOS.

PESOS E ÍNDICES SÃO COMPARATIVOS HISTÓRICOS.
</div>

</main>
`;

/* ======================================================
 BOTÕES
====================================================== */

function changeStrategy(
strategy,adaptive=null,created=null
) {
if(busy)return;

if(!canRecalculate()) {
alert(
"AGUARDE ENCERRAR O CICLO ATUAL "+
"ANTES DE TROCAR A ESTRATÉGIA."
);
return;
}

state.strategy=strategy;
state.adaptive=adaptive||state.adaptive;
state.activeCreated=created;
state.manual=null;

if(
strategy==="TRAINER"&&
!state.trainerChoice
)updateTrainer();

if(strategy==="NUMBER")updateNumberChoice();
if(strategy===N10)prepare10(state.history);

save();
render();
}

function buildStrategies() {
const root=$("strategies");
root.innerHTML="";

const groups=[
[
"TREINADORES INDEPENDENTES",
[
{
label:"TREINADOR GLOBAL",
id:"TRAINER",
action:()=>changeStrategy("TRAINER")
},
{
label:"TREINADOR GLOBAL NÚMEROS",
id:"NUMBER",
action:()=>changeStrategy("NUMBER")
},
{
label:"TREINADOR GLOBAL NÚMEROS 1.0",
id:N10,
action:()=>changeStrategy(N10)
}
]
],
[
"ORIGINAIS",
ORIGINALS.map(([id,name])=>({
label:name,id,
action:()=>changeStrategy(id)
}))
],
[
"12 ADAPTATIVAS",
ADAPTATIVES.map(c=>({
label:c.name,id:c.id,
action:()=>changeStrategy("ADAPTIVE",c.id)
}))
]
];

for(const [label,items] of groups) {
const group=document.createElement("div");
group.innerHTML=`<div class="title">${label}</div>`;

const row=document.createElement("div");
row.className="row";

for(const item of items) {
const b=button(
item.label,
item.action,
row,
item.id==="TRAINER"?"trainer":
item.id==="NUMBER"?"number":
item.id===N10?"number10":""
);

b.dataset.choice=item.id;
}

group.appendChild(row);
root.appendChild(group);
}

const ranks=document.createElement("div");
ranks.className="row";

for(let i=1;i<=4;i++) {
const b=button("AUTO "+i+"º",()=>{
if(busy)return;

if(!canRecalculate()) {
alert("AGUARDE ENCERRAR O CICLO.");
return;
}

state.rank=i;
changeStrategy("FIXED");
},ranks);

b.dataset.rank=i;
}

root.appendChild(ranks);

if(state.created.length) {
const group=document.createElement("div");
group.innerHTML=`
<div class="title">ESTRATÉGIAS PERSONALIZADAS</div>
`;

const row=document.createElement("div");
row.className="row";

for(const c of state.created) {
const b=button(
c.name,
()=>changeStrategy(
"CREATED",null,"CREATED:"+c.id
),
row
);

b.dataset.created=c.id;
}

group.appendChild(row);
root.appendChild(group);
}
}

const OPTIONS=[
["g1Trainer","TREINADOR GLOBAL G1"],
["g1","G1 AJUSTE FINO"],
["galeSkip","GALE 2ª RODADA"],
["secondHouse","2ª CASA"]
];

for(const [field,label] of OPTIONS) {
const b=button(label,()=>{
if(busy)return;

if(!canRecalculate()) {
alert(
"AGUARDE ENCERRAR O CICLO "+
"ANTES DE ALTERAR O G1."
);
return;
}

state[field]=!state[field];
save();
render();

},$("options"),field==="g1Trainer"?"trainer":"");

b.dataset.option=field;
}

for(let n=0;n<=36;n++) {
const b=document.createElement("button");

b.className="key"+(n===0?" zero":"");
b.textContent=n;

b.style.background=
n===0?"#087b50":
RED.has(n)?"#ac293f":"#12151b";

b.onclick=()=>addManual(n);
$("keys").appendChild(b);
}

$("import").onclick=()=>{
importHistory(parseInput($("paste").value));
};

$("restore").onclick=async()=>{
if(busy)return;

let found=null;

for(const key of [KEY,...OLD_KEYS]) {
const data=read(key);

if(data?.history?.length) {
found=data;
break;
}
}

if(!found) {
alert("NENHUM HISTÓRICO ANTERIOR ENCONTRADO.");
return;
}

await importHistory(cleanNumbers(found.history));
};

$("undo").onclick=undo;
$("clear").onclick=clearAll;

$("stake").onchange=()=>{
state.stake=Math.max(
.01,Number($("stake").value)||1
);

save();
render();
};

$("multiplier").onchange=()=>{
state.multiplier=Math.max(
.01,Number($("multiplier").value)||1
);

save();
render();
};

document.addEventListener("click",event=>{
const b=event.target.closest("[data-panel]");
if(!b)return;

const id=b.dataset.panel;
state.open[id]=!state.open[id];

save();
render();
});

/* ======================================================
 RENDERIZAÇÃO
====================================================== */

function render() {
try {
performRender();

} catch(e) {
console.error("ANÁLISE BETA:",e);

if($("status")) {
$("status").textContent=
"ERRO: "+String(e.message||e);
}
}
}

function performRender() {
buildStrategies();

const cs=motors(state.history);
const definition=activeDefinition();
const motor=state.defense||activeMotor(cs);
const play=motor?.play||null;
const space=spatialRead(state.history);

const waiting=(
state.manualCount>=MANUAL_LIMIT||
state.migrationPending
)&&!canRecalculate();

$("status").textContent=
state.history.length+
" NÚMEROS NA JANELA • "+
cs.length+"/12 MOTORES • "+
state.phase+
" • CÁLCULO ESPACIAL ATIVO"+
(saveError?" • FALHA AO SALVAR: "+saveError:"");

$("counter").textContent=
state.manualCount+" / "+MANUAL_LIMIT;

$("barfill").style.width=
Math.min(
100,100*state.manualCount/MANUAL_LIMIT
)+"%";

$("progressPanel").classList.toggle("waiting",waiting);
$("barfill").classList.toggle("waiting",waiting);

$("windowInfo").textContent=
"JANELA BASE: 70 • MANUAIS RESTANTES: "+
Math.max(0,MANUAL_LIMIT-state.manualCount)+
" • RECÁLCULOS CONCLUÍDOS: "+
state.cyclesCompleted;

$("recalcStatus").textContent=
state.migrationPending
?"ATUALIZAÇÃO PENDENTE — FECHAR CICLO REAL"
:waiting
?"RECÁLCULO PENDENTE — AGUARDANDO "+state.phase
:state.manualCount>=MANUAL_LIMIT
?"RECÁLCULO PRONTO"
:"RECÁLCULO AO COMPLETAR "+
MANUAL_LIMIT+" MANUAIS E FECHAR O CICLO";

for(const b of document.querySelectorAll("[data-choice]")) {
const choice=b.dataset.choice;

const active=
state.strategy==="TRAINER"?choice==="TRAINER":
state.strategy==="NUMBER"?choice==="NUMBER":
state.strategy===N10?choice===N10:
state.strategy==="ADAPTIVE"?choice===state.adaptive:
choice===state.strategy;

b.classList.toggle("active",active);
}

for(const b of document.querySelectorAll("[data-rank]")) {
b.classList.toggle(
"active",
state.strategy==="FIXED"&&
state.rank===Number(b.dataset.rank)
);
}

for(const b of document.querySelectorAll("[data-option]")) {
const active=!!state[b.dataset.option];

b.classList.toggle("active",active);

b.classList.toggle(
"on",
active&&b.dataset.option==="g1Trainer"
);
}

for(const b of document.querySelectorAll("[data-created]")) {
b.classList.toggle(
"active",
state.strategy==="CREATED"&&
state.activeCreated==="CREATED:"+b.dataset.created
);
}

const original=state.cycle?.original||motor;

const record10=
original?.type===N10&&original.recordId
?state.n10.books[original.trigger]
?.records[original.recordId]
:null;

$("selected").textContent=
(state.cycle?.strategy||definition.name)+
" • MOTOR "+(motor?.key||"AGUARDANDO")+
" • "+state.phase+
(
state.cycle?.decision
?" • G1 "+state.cycle.decision.mode+
" • "+state.cycle.decision.behavior
:""
)+
(
state.strategy===N10
?" • "+(record10?recordStatus10(record10):"SEM GEOMETRIA ELEGÍVEL")
:""
)+
" • POLOS "+(space.poles.active?.event||"SEM EPISÓDIO")+
" • ARCO "+(space.arcs.active?.event||"SEM ARCO");

$("centers").innerHTML=
centersHTML(play)+
(
record10?.status==="REJECTED"
?`
<div class="reject10">
NÃO JOGAR
<small>
REPROVADA PARA O GATILHO ${record10.trigger}
${state.cycle
?" • CICLO ATUAL MANTIDO ATÉ ENCERRAR"
:""}
</small>
</div>
`
:""
);

$("coverage").textContent=play
?"28 COBERTOS • 9 DESCOBERTOS: "+
missing(play).join(" • ")
:state.history.length<8
?"IMPORTE PELO MENOS 8 NÚMEROS."
:state.strategy===N10
?"SEM GEOMETRIA ELEGÍVEL. REPROVADAS NÃO SERÃO REUTILIZADAS."
:"AGUARDANDO COMBINAÇÃO.";

const last=state.history.slice(-14);
const start=state.history.length-last.length;

$("last").innerHTML=last.map((n,i)=>{
const row=state.ledger.find(
r=>r.turn===start+i+1
);

const result=row?.result||"HISTÓRICO";

const cls=result==="LOSS"?"loss":
result.startsWith("GREEN")?"green":
result==="GALE"?"gale":"";

return `
<div class="chip ${cls}" style="background:${
n===0?"#087b50":RED.has(n)?"#a72740":"#14181f"
}">
<b>${n}</b><small>${esc(result)}</small>
</div>`;
}).reverse().join("");

if(state.open.general) {
$("general").innerHTML=`
<div class="title">RESULTADOS DO HISTÓRICO ATUAL</div>

${metricsHTML(
state.ledger.filter(r=>r.source==="HISTÓRICO")
)}

<div class="title">RESULTADOS MANUAIS ARQUIVADOS</div>
${metricsHTML(state.manualLog)}

<div class="box">
<b>REGISTROS MANUAIS:</b> ${state.manualLog.length}

<p>
GREEN, GREEN G1 E LOSS PERMANECEM ARQUIVADOS.
NÃO TREINAM A NOVA JANELA APÓS O RECÁLCULO.
</p>
</div>

<div class="title">ÚLTIMOS RESULTADOS MANUAIS</div>

${state.manualLog.slice(-25).reverse().map(r=>`
<div class="listrow">
<b>${r.number}</b>
• <strong class="${r.result==="LOSS"?"bad":"good"}">
${esc(r.result)}
</strong>
• ${esc(r.motor)}
• ${fmt(r.profit)}
</div>
`).join("")}
`;
}

if(state.open.trainer) {
$("trainer").innerHTML=trainerHTML();
}

if(state.open.numbertrainer) {
$("numbertrainer").innerHTML=numberTrainerHTML();
}

if(state.open.numbertrainer10) {
$("numbertrainer10").innerHTML=numberTrainer10HTML();

if($("trigger10")) {
$("trigger10").onchange=()=>{
if(busy)return;
state.n10.viewTrigger=$("trigger10").value;
save();
render();
};
}

if($("all10")) {
$("all10").onclick=()=>{
if(busy)return;
state.n10.viewAll=!state.n10.viewAll;
save();
render();
};
}

for(const b of document.querySelectorAll("[data-trigger10]")) {
b.onclick=()=>{
if(busy)return;
state.n10.viewTrigger=b.dataset.trigger10;
save();
render();
};
}
}

if(state.open.triangulation) {
$("triangulation").innerHTML=triangulationHTML();
}

if(state.open.spatial) {
$("spatial").innerHTML=spatialHTML();
}

if(state.open.g1ranking) {
$("g1ranking").innerHTML=g1RankingHTML();
}

if(state.open.g1numbers) {
$("g1numbers").innerHTML=g1NumbersHTML();
}

if(state.open.motors) {
$("motors").innerHTML=`
<div class="row">
${cs.map(c=>`
<button class="btn" data-manual="${c.key}">
${esc(c.key)}
</button>
`).join("")}
</div>

${cs.map(c=>`
<div class="listrow">
<b>${c.rank}º ${esc(c.key)}</b>
• ${fmt(c.score)}

<div class="muted">
CENTROS:
${sortedBlocks(c.play).map(b=>b.center).join(" • ")}
</div>

<div class="muted">
HISTÓRICO VIRTUAL:
${state.ledger.filter(
r=>r.motorHits&&c.key in r.motorHits
).length}
TESTES
• ÍNDICE ${pct(motorRate(c.key,70),1)}
</div>

<div class="muted">
COBERTURA ESPACIAL: ${pct(c.spatialScore,1)}
• TRIANGULAÇÃO: ${pct(c.triangleScore,1)}
</div>

${contextHTML(c.spatialKeys)}
</div>
`).join("")}
`;

for(const b of document.querySelectorAll("[data-manual]")) {
b.classList.toggle(
"active",
state.manual===b.dataset.manual
);

b.onclick=()=>{
if(busy)return;

if(!canRecalculate()) {
alert("AGUARDE ENCERRAR O CICLO.");
return;
}

state.manual=b.dataset.manual;
save();
render();
};
}
}

if(state.open.jumps)$("jumps").innerHTML=jumpsHTML();
if(state.open.mirrors)$("mirrors").innerHTML=mirrorsHTML();
if(state.open.timeline)$("timeline").innerHTML=timelineHTML();

if(state.open.lab) {
$("lab").innerHTML=`
<div class="box">
7 ORIGINAIS • 12 ADAPTATIVAS • 4 AUTO • PERSONALIZADAS
</div>

<div class="box">
OS 12 MOTORES INTEGRAM:
TRINCAS, MEMÓRIA DE PARES, ENCADEAMENTO,
POLOS MÓVEIS, DESLOCAMENTOS, INTERRUPÇÃO,
RETOMADA, RUPTURA, ARCOS E REENTRADAS.
</div>

<div class="box">
CONSENSO E UNIÃO RECEBEM A CAMADA ESPACIAL
ANTES DE MONTAR A GEOMETRIA.

ADAPTATIVAS E PERSONALIZADAS UTILIZAM
OS MOTORES INTEGRADOS E O DESEMPENHO CONTEXTUAL.
</div>

<div class="box">
TREINADOR GLOBAL:
HISTÓRICO VIRTUAL ORIGINAL +
COMPATIBILIDADE DE CONTEXTO ESPACIAL.

O CONTEXTO É GRAVADO ANTES DO RESULTADO
E AVALIADO SOMENTE DEPOIS DO FECHAMENTO.
</div>

<div class="box">
TREINADOR GLOBAL NÚMEROS:
COMBINAÇÕES HISTÓRICAS,
TRANSIÇÕES DO GATILHO E COBERTURA ESPACIAL.
SEM GREEN/LOSS COMO CRITÉRIO.
</div>

<div class="box">
TREINADOR GLOBAL NÚMEROS 1.0:
APROVAÇÃO POR GATILHO,
BLOQUEIO POR LOSS, TARJA NÃO JOGAR,
ALTERNATIVAS VIRTUAIS IMEDIATAS
E CLASSIFICAÇÃO ESPACIAL DAS ELEGÍVEIS.
</div>

<div class="box">
DEFESAS:
CONGELADA, AJUSTE FINO E RECONSTRUÇÃO.

A CONGELADA MANTÉM A COMBINAÇÃO DA ENTRADA.
AS OUTRAS INCORPORAM OS PESOS ESPACIAIS.
A SELEÇÃO G1 TAMBÉM USA CONTEXTOS.
</div>

<div class="box">
JANELA 70 + 10.
RECÁLCULO SOMENTE APÓS FECHAR O CICLO REAL.
</div>

<button class="btn trainer" id="create">
CRIAR CÓPIA DA MELHOR ADAPTATIVA
</button>
`;

$("create").onclick=()=>{
if(busy)return;

const best=trainerRanking().find(
r=>r.type==="ADAPTIVE"
);

if(!best)return;

state.created.push({
id:"CUSTOM_"+Date.now(),
name:
"ESTRATÉGIA VIRTUAL "+
(state.created.length+1),
config:copy(best.config)
});

save();
render();
};
}

for(const [id,open] of Object.entries(state.open)) {
const element=$(id);
if(element)element.classList.toggle("hide",!open);

const header=document.querySelector(
'[data-panel="'+id+'"]'
);

const span=header?.querySelector("span");
if(span)span.textContent=open?"−":"+";
}

$("stake").value=state.stake;
$("multiplier").value=state.multiplier;
}

/* ======================================================
 MIGRAÇÃO COM PRESERVAÇÃO DO CICLO REAL ABERTO
====================================================== */

async function migrateLegacy() {
if(!legacyData)return;

const old=legacyData;
legacyData=null;

if((old.phase||"ENTRY")!=="ENTRY"||old.cycle) {
state=normalizeState(old);
state.migrationPending=true;
state.recalcPending=true;

if(
state.history.length>=8&&
!state.n10.choice
)prepare10(state.history);

save();
render();
return;
}

const opts={
...settings(),
strategy:old.strategy||"TRAINER",
rank:old.rank||3,
manual:old.manual||null,
adaptive:old.adaptive||"A05",
created:copy(old.created||[]),
activeCreated:old.activeCreated||null,
g1:old.g1!==false,
g1Trainer:old.g1Trainer!==false,
galeSkip:!!old.galeSkip,
secondHouse:!!old.secondHouse,
stake:Number(old.stake)||1,
multiplier:Number(old.multiplier)||1,
open:{...fresh().open,...(old.open||{})}
};

await rebuild70(
cleanNumbers(old.history),
{
preserveManual:true,
customSettings:opts,
customManualLog:old.manualLog||[],
customCycles:Number(old.cyclesCompleted)||0
}
);
}

/* ======================================================
 INICIALIZAÇÃO
====================================================== */

if(
state.history.length>=8&&
!state.n10.choice
)prepare10(state.history);

render();

if(legacyData) {
setTimeout(()=>{migrateLegacy();},0);

} else if(
state.manualCount>=MANUAL_LIMIT||
state.recalcPending||
state.migrationPending
) {
setTimeout(()=>{checkRecalculation();},0);
}

})();
