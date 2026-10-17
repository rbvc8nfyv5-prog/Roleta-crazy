(() => {
"use strict";

/*
=========================================================
                 ANÁLISE BETA V6.4.3
=========================================================

JANELA MÓVEL:
- Máximo de 70 números.
- Entrou um resultado, saiu o mais antigo.
- Sem ciclo de 10 lançamentos.
- Sem tela de recálculo.
- Sem reiniciar os treinadores a cada 10.
- Estatísticas e combinações históricas acompanham a janela.
- Jogada e defesa reais permanecem congeladas durante o ciclo.
- Resultados manuais continuam arquivados separadamente.
- Bloqueios NÃO JOGAR permanecem registrados por gatilho.

INTEGRADO AOS MOTORES:
- Triangulação.
- Memória de pares.
- Encadeamento.
- Dois polos móveis.
- Interrupção, retomada e ruptura.
- Arcos contíguos.
- Permanência, saída e reentrada.
- Soma dos saltos antes do módulo 37.
- Fechamento por contorno.
- Classificações simultâneas.
- Contextos espaciais nos treinadores e no G1.

PRESERVADO:
- 12 motores.
- Geometria de 28 números.
- 7 estratégias originais.
- 12 adaptativas.
- 4 posições AUTO.
- Personalizadas.
- Treinador Global original.
- Treinador Global Números.
- Treinador Global Números 1.0 independente.
- Três defesas G1.
- Histórico, laboratório e linha do tempo.
- Desfazer com restauração do estado anterior à entrada.

Os deslocamentos relacionam posições dos resultados.
Não representam o caminho real da bola.
Os índices históricos não garantem resultados futuros.
=========================================================
*/

const VERSION="6.4.3";
const KEY="ANALISE_BETA_V643";
const N10="NUMBER10";
const WINDOW=70;

const OLD_KEYS=[
"ANALISE_BETA_V642","ANALISE_BETA_V641",
"ANALISE_BETA_V640","ANALISE_BETA_V639",
"ANALISE_BETA_V638","ANALISE_BETA_V637",
"ANALISE_BETA_V636","ANALISE_BETA_V635",
"ANALISE_BETA_V634","ANALISE_BETA_V633"
];

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

const nearBand=n=>
n===0?"0":n<=2?"1-2":n<=4?"3-4":n<=8?"5-8":"9+";

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
 ESTADO E PERSISTÊNCIA
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
historyTurns:[],
sources:[],
totalTurns:0,
manualCount:0,
manualLog:[],
undoStack:[],

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

function signature10(play) {
return play.blocks.map(
b=>b.radius+":"+b.center
).sort().join("|");
}

function restoreShape(shape,score) {
const blocks=shape.split("|").map(part=>{
const [radius,center]=part.split(":").map(Number);
return {center,radius,numbers:neighbors(center,radius)};
});

const play={
blocks,
numbers:blocks.flatMap(b=>b.numbers),
score
};

if(!validPlay(play))throw new Error("GEOMETRIA SALVA INVÁLIDA.");
return play;
}

function read(key) {
try {
return JSON.parse(
localStorage.getItem(key)||"null",
(k,v)=>v&&typeof v.__betaPlay==="string"
?restoreShape(v.__betaPlay,v.score)
:v
);
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
return restoreShape(item.shape10,item.score);
}
return item;
});
}

let state=fresh();
let busy=false;
let saveError="";
let legacyData=null;

function normalizeState(data) {
const originalHistory=cleanNumbers(data.history);

const result={
...fresh(),
...data,
history:originalHistory.slice(-WINDOW),
open:{...fresh().open,...(data.open||{})}
};

for(const name of [
"historyTurns","sources","manualLog","undoStack","created",
"trainerHistory","numberHistory","numberCombinations",
"numberComparisons","entryRows","g1Rows","g1Pending",
"realG1","decisions","ledger"
]) {
if(!Array.isArray(result[name]))result[name]=[];
}

result.totalTurns=Math.max(
originalHistory.length,
Number(data.totalTurns)||0,
Number(result.ledger.at(-1)?.turn)||0
);

result.sources=result.sources.slice(-result.history.length);

while(result.sources.length<result.history.length) {
result.sources.unshift("HISTÓRICO");
}

if(result.historyTurns.length===originalHistory.length) {
result.historyTurns=result.historyTurns.slice(-WINDOW);
} else {
result.historyTurns=result.history.map(
(_,i)=>result.totalTurns-result.history.length+i+1
);
}

result.manualCount=Math.max(0,Number(result.manualCount)||0);
result.undoStack=result.undoStack.slice(-WINDOW);

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

for(const book of Object.values(result.n10.books)) {
if(!book.records||typeof book.records!=="object") {
book.records={};
}

for(const record of Object.values(book.records)) {
record.blocked=!!record.blocked||record.status==="REJECTED";
if(!Array.isArray(record.samples))record.samples=[];
}
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
const old=read(key);

if(old?.history?.length) {
legacyData=old;
break;
}
}
}

function save() {
try {
localStorage.setItem(
KEY,
JSON.stringify(state,(key,value)=>{
if(validPlay(value)) {
return {
__betaPlay:signature10(value),
score:value.score
};
}
return value;
})
);

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

function cycleIsFree() {
return state.phase==="ENTRY"&&state.cycle===null;
}

/* ======================================================
 GEOMETRIA ORIGINAL DE 28 NÚMEROS
====================================================== */

const FIVE=W.map(n=>({
center:n,radius:2,numbers:neighbors(n,2)
}));

const THREE=W.map(n=>({
center:n,radius:1,numbers:neighbors(n,1)
}));

for(const block of [...FIVE,...THREE]) {
block.mask=block.numbers.reduce(
(s,n)=>s|(1n<<BigInt(ix(n))),0n
);
}

function geometry(weights,mandatory=[]) {
const scoreBlock=block=>({
...block,
value:block.numbers.reduce(
(s,n)=>s+(weights[ix(n)]||0),0
)
});

const fives=FIVE.map(scoreBlock).sort(
(a,b)=>b.value-a.value
);

const threes=THREE.map(scoreBlock)
.filter(block=>mandatory.every(
n=>block.numbers.includes(n)
))
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
for(const block of fives) {
if((item.mask&block.mask)!==0n)continue;

next.push({
blocks:[...item.blocks,block],
mask:item.mask|block.mask,
score:item.score+block.value
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

const blocks=best.blocks.map(block=>({
center:block.center,
radius:block.radius,
numbers:[...block.numbers]
}));

const numbers=blocks.flatMap(block=>block.numbers);

if(new Set(numbers).size!==28)return null;

return {blocks,numbers,score:best.score};
}

function validPlay(play) {
return !!play&&
typeof play==="object"&&
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
 SOMA SEM MÓDULO / CONTORNO / RÓTULOS SIMULTÂNEOS
====================================================== */

function routeFeatures(numbers) {
const steps=numbers.slice(1).map(
(n,i)=>direction(numbers[i],n)
);

const net=steps.reduce((s,n)=>s+n,0);

const length=steps.reduce(
(s,n)=>s+Math.abs(n),0
);

const signs=new Set(
steps.filter(Boolean).map(Math.sign)
);

const sameDirection=signs.size===1;

const closure=numbers.length
?distance(numbers[0],numbers.at(-1))
:0;

const contour=
sameDirection&&
Math.abs(net)>=31&&
closure<=6;

const completedTurns=Math.floor(Math.abs(net)/37);
const nearestTurns=Math.round(net/37);
const residual=net-nearestTurns*37;

const labels=[];

if(closure===0)labels.push("FECHAMENTO EXATO");
else if(closure<=2)labels.push("FECHAMENTO A 1-2 CASAS");
else if(closure<=6)labels.push("FECHAMENTO A 3-6 CASAS");

if(contour)labels.push("FECHAMENTO POR CONTORNO");

if(completedTurns) {
labels.push("VOLTA ACUMULADA "+completedTurns);
}

return {
numbers:[...numbers],
steps,
net,
length,
sameDirection,
closure,
contour,
completedTurns,
nearestTurns,
residual,
labels
};
}

function normalizeSpace(weights) {
const mean=avg(weights)||1;
return weights.map(value=>value/mean);
}

function routeRead(h) {
const current=[];

for(let size=3;size<=Math.min(8,h.length);size++) {
current.push(routeFeatures(h.slice(-size)));
}

const weights=Array(37).fill(1);
let examples=0;

for(const route of current) {
const size=route.numbers.length;

for(let end=size-1;end<h.length-1;end++) {
const old=routeFeatures(
h.slice(end-size+1,end+1)
);

const similarity=
Math.exp(
-Math.abs(old.net-route.net)/10-
Math.abs(old.closure-route.closure)/4
)*
(old.contour===route.contour?1:.35)*
(old.sameDirection===route.sameDirection?1:.5);

const recency=Math.exp(
-(h.length-2-end)/30
);

const projected=W[mod(
ix(h.at(-1))+
direction(h[end],h[end+1])
)];

if(similarity>.35)examples++;

for(let j=0;j<37;j++) {
weights[j]+=
similarity*recency*
Math.exp(-distance(W[j],projected)/2)/
Math.sqrt(size);
}
}
}

const triangle=current.find(
r=>r.numbers.length===3
);

const chain=current.find(
r=>r.numbers.length===4
);

const key=triangle
?"R:C"+Number(triangle.contour)+
"|F"+nearBand(triangle.closure)+
"|D"+Math.sign(triangle.net)+
"|V"+Math.min(2,chain?.completedTurns||0)
:"R:SEM PERCURSO";

return {
current,
examples,
weights:normalizeSpace(weights),
key,
triangle:triangle||null,
chain:chain||null
};
}

/* ======================================================
 TRIANGULAÇÃO
====================================================== */

const triangleCache=new Map();

function pointTriangle(n) {
const angle=2*Math.PI*ix(n)/37;
return {x:Math.sin(angle),y:Math.cos(angle)};
}

function angleTriangle(a,b,c) {
const u={x:a.x-b.x,y:a.y-b.y};
const v={x:c.x-b.x,y:c.y-b.y};

const denominator=
Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);

return denominator<1e-12
?null
:Math.acos(clamp(
(u.x*v.x+u.y*v.y)/denominator,-1,1
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

const route=routeFeatures([a,b,c]);

return {
a,b,c,s1,s2,closure,area,type,route,
contour:route.contour,
labels:[type,...route.labels],

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

return f.type+
"|F:"+nearBand(f.closure)+
"|C:"+Number(f.contour)+
"|S:"+Math.sign(f.route.net);
}

function triangleAnalysis(h) {
const key=h.join(",");
if(triangleCache.has(key))return triangleCache.get(key);

const triples=[];

for(let i=0;i+2<h.length;i++) {
triples.push({
...triangleFeatures(h[i],h[i+1],h[i+2]),
position:i+3
});
}

const weights=Array(37).fill(1);
const counts={};

for(const triple of triples) {
for(const label of triple.labels) {
counts[label]=(counts[label]||0)+1;
}
}

let matches=0;
let exactPairs=0;

if(h.length>=2) {
const a=h.at(-2),b=h.at(-1);
const jump=direction(a,b);

const candidates=W.map(
n=>triangleFeatures(a,b,n)
);

for(const triple of triples) {
const signMatch=
Math.sign(triple.s1)===Math.sign(jump);

const hopSimilarity=
Math.exp(-Math.abs(triple.s1-jump)/4)*
(signMatch?1:.2);

const physicalContext=Math.exp(
-(distance(a,triple.a)+distance(b,triple.b))/10
);

const recency=Math.exp(
-(h.length-triple.position)/30
);

const exact=triple.a===a&&triple.b===b;

if(exact)exactPairs++;
if(hopSimilarity>.3)matches++;

for(let j=0;j<37;j++) {
const f=candidates[j];

const second=Math.exp(
-Math.abs(f.s2-triple.s2)/3.5
);

const close=Math.exp(
-Math.abs(f.closure-triple.closure)/4
);

const area=Math.exp(
-Math.abs(f.area-triple.area)*2
);

const angle=
f.angles[1]==null||triple.angles[1]==null
?(f.degenerate===triple.degenerate?1:.2)
:Math.exp(
-Math.abs(f.angles[1]-triple.angles[1])/30
);

const shape=
(f.type===triple.type?1:.15)*.65+
(f.contour===triple.contour?1:.15)*.35;

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
Math.exp(-distance(W[j],triple.c)/1.8);
}
}
}
}

const result={
triples,
last:triples.at(-1)||null,
weights:normalizeSpace(weights),
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
const weights=triangleAnalysis(h).weights;

return play.numbers.reduce(
(s,n)=>s+weights[ix(n)],0
)/weights.reduce((s,n)=>s+n,0);
}

/* ======================================================
 ARCOS CONTÍGUOS E REENTRADAS
====================================================== */

function arcCandidates(h) {
const recent=h.slice(-20);

return W.map((_,start)=>{
const numbers=Array.from(
{length:8},(_,j)=>W[mod(start+j)]
);

return {
start,numbers,
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

function setArc(candidate,position) {
if(!candidate)return;

if(active?.start===candidate.start) {
active.count=candidate.count;
active.total=candidate.total;
return;
}

const previous=active?.start;

active={
...candidate,
id:"ARC@"+position+":"+candidate.start,
formedBefore:position,
lastInside:null,
seenInside:false,
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
setArc(selectArc(h.slice(0,i),active),i+1);

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
active.entries++;

if(active.seenInside) {
active.returns++;
active.event="REENTRADA";
} else {
active.event="ENTRADA";
}

} else if(active.lastInside===true) {
active.event="PERMANÊNCIA";

} else {
active.entries++;
active.event="ENTRADA";
}

active.inside=active.lastInside===true
?active.inside+1:1;

active.outside=0;
active.seenInside=true;

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
active.maxGap=Math.max(active.maxGap,active.outside);
}

active.lastInside=inside;

events.push({
position:i+1,
number,
arcId:active.id,
start:active.start,
event:active.event,
inside,
gap:active.lastGap,
outside:active.outside
});
}

setArc(selectArc(h,active),h.length+1);

return {
active,
events,
transitions,
ranked:arcCandidates(h)
};
}

/* ======================================================
 DOIS POLOS MÓVEIS
====================================================== */

function trackPoles(h) {
let active=null;

const events=[];
const episodes=[];

for(let i=0;i<h.length;i++) {
const n=h[i];

if(active?.active) {
const expected=1-active.lastSide;
const de=distance(n,active.anchors[expected]);
const ds=distance(n,active.anchors[active.lastSide]);

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
position:i+1,
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
position:i+1,
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

/* ======================================================
 ENCADEAMENTO E LEITURA ESPACIAL
====================================================== */

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
route:routeFeatures([a,b,c,d]),

key:
first.type+":"+nearBand(first.closure)+
">"+
second.type+":"+nearBand(second.closure)
};
}

const spaceCache=new Map();

function spatialRead(h) {
const key=h.join(",");
if(spaceCache.has(key))return spaceCache.get(key);

const route=routeRead(h);
const tri=triangleAnalysis(h);
const arcs=trackArcs(h);
const poles=trackPoles(h);
const chain=chainFeatures(h);

const chainWeights=Array(37).fill(1);
const poleWeights=Array(37).fill(1);
const arcWeights=Array(37).fill(1);

let chainExamples=0;

if(chain) {
for(let end=3;end<h.length-1;end++) {
const old=chainFeatures(
h.slice(end-3,end+1)
);

const diff=avg(
chain.hops.map(
(step,j)=>Math.abs(step-old.hops[j])
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

const p=poles.active;

if(p?.active) {
const expected=1-p.lastSide;
const anchor=p.anchors[expected];
const shift=clamp(p.lastShift[expected],-2,2);
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

const a=arcs.active;

if(a) {
const baseline=8/37;
const conditional=arcs.transitions[a.event]||
{hits:0,total:0};

const historical=
(conditional.hits+baseline*8)/
(conditional.total+8);

const density=
(a.count+baseline*4)/(a.total+4);

const confidence=Math.min(1,a.total/12);

const sectorMass=clamp(
historical*.75+density*.25,.05,.70
);

for(let j=0;j<37;j++) {
const target=a.numbers.includes(W[j])
?sectorMass*37/8
:(1-sectorMass)*37/29;

arcWeights[j]=1+(target-1)*confidence;
}
}

const cw=normalizeSpace(chainWeights);
const pw=normalizeSpace(poleWeights);
const aw=normalizeSpace(arcWeights);

const weights=normalizeSpace(
W.map((_,j)=>
tri.weights[j]*.35+
cw[j]*.20+
pw[j]*.15+
aw[j]*.15+
route.weights[j]*.15
)
);

const keys=["T:"+tri.context];

if(route.triangle)keys.push(route.key);
if(chain)keys.push("C:"+chain.key);

if(p?.active) {
keys.push(
"P:"+p.event+
"|D:"+nearBand(distance(...p.anchors))+
"|F:"+Math.sign(p.drift[0])+","+
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
tri,arcs,poles,chain,route,
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

function applySpatial(weights,h,strength=.30) {
if(h.length<3)return weights;

const reading=spatialRead(h);
const scale=avg(weights.map(v=>Math.max(0,v)))||1;
const reliability=Math.min(1,(h.length-2)/20);

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
)/weights.reduce((s,n)=>s+n,0);
}

function spatialMatch(keys,current) {
if(!keys?.length)return 0;

const importance={T:.20,C:.20,P:.20,A:.20,R:.20};

return current.reduce(
(sum,key)=>sum+(
keys.includes(key)?importance[key[0]]||0:0
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
const previous=row.spatialKeys||
(row.triangleKey?["T:"+row.triangleKey]:[]);

const weight=spatialMatch(previous,keys);

if(!weight)continue;

support+=weight;
total++;

if(hit(row)) {
weightedHits+=weight;
hits++;
}
}

return {
total,hits,
loss:total-hits,
support,
score:
(weightedHits+(28/37)*8)/(support+8)
};
}

/* ======================================================
 ANÁLISE SEQUENCIAL ORIGINAL
====================================================== */

function analyze(h) {
const transitions=[];

for(let i=Math.max(1,h.length-45);i<h.length;i++) {
const a=h[i-1],b=h[i];
const physical=direction(a,b);

transitions.push({
from:a,to:b,
numeric:b-a,
physical,
distance:Math.abs(physical),
mirrorFrom:mirror(a),
mirrorTo:mirror(b)
});
}

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
const previous3=transitions.slice(-6,-3);

return {
transitions,
last6:transitions.slice(-6),
numericStreak:streak("numeric"),
physicalStreak:streak("physical"),
mean3:avg(last3.map(x=>x.distance)),
previous3:avg(previous3.map(x=>x.distance)),
acceleration:
avg(last3.map(x=>x.distance))-
avg(previous3.map(x=>x.distance)),
regions
};
}

/* ======================================================
 12 MOTORES
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
const length=Math.min(radius,h.length-2);
const matches=[];

if(length>=2) {
for(let i=0;i+length<h.length-1;i++) {
let score=0;

for(let j=0;j<length;j++) {
score+=Math.max(
0,
6-distance(h[h.length-length+j],h[i+j])
)/6;
}

matches.push({
score:score/length,
next:h[i+length]
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

const play=geometry(weightsFor(h,family,radius));
if(!validPlay(play))continue;

result.push({
key:family+"_"+radius,
family,radius,
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
result.forEach((motor,i)=>{motor.rank=i+1;});

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
const expected=mod(
ix(trigger)+direction(h.at(-2),trigger)
);

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
}

function numberTransitions(h,trigger) {
const rows=[];

for(let i=0;i<h.length-1;i++) {
if(h[i]!==trigger)continue;

rows.push({
next:h[i+1],
age:h.length-1-i,
position:i+2,
triggerPosition:i+1
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
trigger,total,matches,
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
.filter(record=>validPlay(record.play))
.map(record=>
compareNumberCombination(record,trigger,h)
)
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
}

/* ======================================================
 ESTRATÉGIAS ORIGINAIS / ADAPTATIVAS / PERSONALIZADAS
====================================================== */

function definitions() {
return [
...ORIGINALS.map(([rule,name])=>({
id:"ORIGINAL:"+rule,
name,rule,type:"ORIGINAL"
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

...state.created.map(custom=>({
id:"CREATED:"+custom.id,
name:custom.name,
config:custom.config,
type:"CREATED"
}))
];
}

function motorRate(key,limit=12) {
const available=state.ledger.filter(
row=>row.motorHits&&key in row.motorHits
);

const rows=available.slice(-limit);
if(!rows.length)return .5;

const global=
rows.filter(row=>row.motorHits[key]).length/
rows.length;

const local=spatialMetrics(
available,state.history,
row=>!!row.motorHits[key]
);

const weight=.40*local.support/(local.support+8);

return global*(1-weight)+local.score*weight;
}

function chooseMotor(def,cs,previous) {
if(!cs.length)return null;

const fixed=cs[clamp(state.rank-1,0,cs.length-1)];

if(def.rank) {
return cs[clamp(def.rank-1,0,cs.length-1)];
}

if(def.config) {
const config=def.config;

const ranked=cs.filter(
motor=>motor.rank<=config.maxRank
).map(motor=>({
motor,
score:
motorRate(motor.key,3)*.55+
motorRate(motor.key,config.window)*.45
})).sort((a,b)=>
b.score-a.score||
a.motor.rank-b.motor.rank
);

const best=ranked[0];
const old=ranked.find(
item=>item.motor.key===previous
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
motor=>motor.key===previous&&motor.rank<=5
)||fixed;
}

if(def.rule==="SWITCH") {
const old=cs.find(
motor=>motor.key===previous
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

for(const motor of selected) {
for(const n of motor.play.numbers) {
weights[ix(n)]+=1/(1+motor.rank*.1);
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
 G1
====================================================== */

function fineG1(original,trigger,h=state.history) {
if(!validPlay(original?.play))return null;

const weights=Array(37).fill(.01);
const mandatory=neighbors(trigger,1);

for(const n of original.play.numbers)weights[ix(n)]+=100;

applySpatial(weights,h,.20);

for(const n of mandatory)weights[ix(n)]+=100000;

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
return state.g1Rows.filter(row=>
(strategy==null||row.strategy===strategy)&&
(mode==null||row.mode===mode)
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
return state.g1Rows.filter(row=>
row.strategy===strategy&&
row.trigger===trigger&&
(mode==null||row.mode===mode)
).slice(-limit);
}

function numberG1Metrics(strategy,trigger,mode,limit=100) {
const rows=numberG1Rows(strategy,trigger,mode,limit);
const hits=rows.filter(row=>row.hit).length;

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

const loss12=recent.filter(row=>!row.hit).length;
const loss6=last6.filter(row=>!row.hit).length;
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
const numberLoss=numberRecent.filter(row=>!row.hit).length;

let type="CONTINUIDADE";

if(
streak>=3||
(last6.length>=5&&loss6/last6.length>=.60)||
(h.length>=6&&outside6>=4)||
(numberRecent.length>=4&&numberLoss/numberRecent.length>=.60)
)type="RUPTURA";

else if(
(recent.length>=5&&loss12/recent.length>=.32)||
outside6>=2||
(numberRecent.length>=3&&numberLoss/numberRecent.length>=.34)
)type="DESLOCAMENTO";

const spatial=spatialRead(h);

return {
type,streak,outside6,
loss12,total12:recent.length,
loss6,total6:last6.length,
numberTotal:numberRecent.length,
numberLoss,
numberHit:numberRecent.length-numberLoss,
triangle:spatial.tri.last?.labels.join(" + ")||"SEM TRINCA",
poles:spatial.poles.active?.event||"SEM POLOS",
arc:spatial.arcs.active?.event||"SEM ARCO"
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
row=>!row.hit&&row.outcome===n
).length;

const conditional=transitions.reduce(
(sum,t)=>sum+(
t.next===n?Math.exp(-t.age/35):0
),0
);

let value=
f60*.30+f24*.55+f8*.85+
losses*.35+conditional*2.2;

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

for(const n of neighbors(trigger,2))weights[ix(n)]+=.4;

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

const reconstruction=reconstructG1(
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
...(reconstruction?[{
mode:"RECONSTRUÇÃO",
motor:reconstruction,
behavior:reading.type
}]:[])
];
}

function defenseMetrics(strategy,mode,limit=100) {
const rows=g1History(strategy,mode,limit);
const hits=rows.filter(row=>row.hit).length;

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

const hits=rows.filter(row=>row.hit).length;
const hits12=recent.filter(row=>row.hit).length;
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
historical*.55+short*.25+coverage*.20;

const originalScore=
globalScore*(1-numberWeight)+
conditional*numberWeight+bonus;

const spatialScore=spatialCoverage(option.motor.play,h);
const local=spatialMetrics(rows,h,row=>row.hit);
const localWeight=.20*local.support/(local.support+8);

const combined=originalScore*.80+spatialScore*.20;

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
const frozen=ranked.find(x=>x.mode==="CONGELADA");

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

alternatives:ranked.map(option=>({
mode:option.mode,
score:option.score,
spatialScore:option.spatialScore,
contextTotal:option.contextTotal,
total:option.total,
hits:option.hits,
loss:option.loss,
numberTotal:option.numberTotal,
numberHits:option.numberHits,
numberLoss:option.numberLoss
}))
};
}

/* ======================================================
 TREINADOR GLOBAL NÚMEROS 1.0
====================================================== */

function book10(trigger) {
return state.n10.books[trigger]||
(state.n10.books[trigger]={records:{}});
}

function register10(trigger,motor,turn) {
if(!validPlay(motor?.play))return null;

const id=signature10(motor.play);
const book=book10(trigger);

return book.records[id]||(book.records[id]={
id,trigger,
motor:copy(motor),
created:turn,
status:"TESTING",
blocked:false,
samples:[],
green:0,g1:0,loss:0,
vg:0,vg1:0,vl:0,
last:0,
lastResult:null,
lastVirtual:null,
lastVirtualTurn:0
});
}

function archive10(cs,h) {
const turn=state.totalTurns;
const origin=h.at(-1);

const seen=new Set(
state.n10.archive.map(row=>row.turn+"@"+row.id)
);

const generated=state.numberCombinations.find(
row=>row.turn===turn
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
}

function scoreRecord10(record,h) {
const base=28/37;

const forward=
(record.green+record.g1+base*8)/
(record.green+record.g1+record.loss+8);

const virtual=
(record.vg+record.vg1+base*8)/
(record.vg+record.vg1+record.vl+8);

const events=state.n10.events.filter(event=>
event.kind==="FORWARD"&&
event.trigger===record.trigger&&
event.recordId===record.id
);

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
.filter(record=>record.status==="APPROVED"&&!record.blocked)
.sort((a,b)=>
scoreRecord10(b,h)-scoreRecord10(a,h)||
b.last-a.last
)[0];

if(!selected) {
selected=records
.filter(record=>
!record.blocked&&
record.status!=="REJECTED"&&
record.vg+record.vg1>0
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
primary,...cs,
...state.n10.archive.slice().reverse().map(row=>row.motor)
].filter(Boolean);

for(const motor of candidates) {
const record=register10(
trigger,motor,state.totalTurns
);

if(record&&!record.blocked&&record.status!=="REJECTED") {
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

return !record||record.blocked||record.status==="REJECTED"
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
state.g1Rows=rows.filter(row=>row.turn<cutoff);
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
state.g1Rows=rows.filter(row=>row.turn<cutoff);

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

/* Fotografia imutável do contexto da entrada. */
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

if(!record||record.blocked||record.status==="REJECTED")continue;

const outcome=simulate10(test,item.motor);
if(!outcome)continue;

tested++;

record.samples.push([turn,"V",outcome]);

if(outcome==="GREEN") {
record.vg++;
green++;

} else if(outcome==="GREEN G1") {
record.vg1++;
g1++;

} else {
record.vl++;
loss++;
record.blocked=true;
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

record.samples.push([turn,"F",result]);
record.last=turn;
record.lastResult=result;

if(result==="LOSS") {
record.loss++;
record.blocked=true;
record.status="REJECTED";
record.rejectedTurn=turn;

} else {
if(result==="GREEN")record.green++;
else record.g1++;

if(!record.blocked&&record.status!=="REJECTED") {
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
}

function recordStatus10(record) {
if(record.blocked||record.status==="REJECTED")return "REPROVADA";
if(record.status==="APPROVED")return "APROVADA";

return record.vg+record.vg1>0
?"EM TESTE • ALTERNATIVA VIRTUAL"
:"EM TESTE";
}

/* ======================================================
 JANELA MÓVEL E EXPIRAÇÃO DOS RESULTADOS
====================================================== */

function refreshRecords10(cutoff) {
for(const [trigger,book] of Object.entries(state.n10.books)) {
for(const [id,record] of Object.entries(book.records)) {
record.blocked=
!!record.blocked||record.status==="REJECTED";

record.samples=(record.samples||[])
.filter(sample=>sample[0]>=cutoff);

record.green=0;
record.g1=0;
record.loss=0;
record.vg=0;
record.vg1=0;
record.vl=0;
record.last=0;
record.lastResult=null;
record.lastVirtual=null;
record.lastVirtualTurn=0;

for(const [turn,kind,result] of record.samples) {
if(kind==="F") {
if(result==="GREEN")record.green++;
else if(result==="GREEN G1")record.g1++;
else record.loss++;

record.last=turn;
record.lastResult=result;

} else {
if(result==="GREEN")record.vg++;
else if(result==="GREEN G1")record.vg1++;
else record.vl++;

record.lastVirtual=result;
record.lastVirtualTurn=turn;
}
}

record.status=record.blocked
?"REJECTED"
:record.green+record.g1>0
?"APPROVED":"TESTING";

const inUse=state.n10.pending.some(test=>
test.trigger===Number(trigger)&&test.recordId===id
);

if(
!record.blocked&&
!record.samples.length&&
record.created<cutoff&&
!inUse
)delete book.records[id];
}
}
}

function pruneRolling() {
while(state.history.length>WINDOW) {
state.history.shift();
state.sources.shift();
state.historyTurns.shift();
}

const cutoff=
state.historyTurns[0]||state.totalTurns+1;

for(const field of [
"ledger","entryRows","g1Rows","numberCombinations",
"numberComparisons","numberHistory","realG1",
"decisions","trainerHistory"
]) {
state[field]=state[field].filter(row=>
Number.isFinite(row.turn)&&row.turn>=cutoff
);
}

state.n10.archive=state.n10.archive.filter(
row=>row.turn>=cutoff
);

state.n10.events=state.n10.events.filter(
row=>row.turn>=cutoff
);

refreshRecords10(cutoff);

/*
Não altera:
- state.cycle
- state.defense
- ciclos virtuais abertos
- testes G1 pendentes
- manualLog
- registros de bloqueio NÃO JOGAR
*/
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
row=>row.strategy===def.id&&row.closed
);

const rows=all.slice(-30);
const recent=rows.slice(-12);

const hits=rows.filter(
row=>row.result!=="LOSS"
).length;

const losses=recent.filter(
row=>row.result==="LOSS"
).length;

const originalScore=
(hits+8*(28/37))/(rows.length+8)-
losses*.008;

const context=spatialMetrics(all,state.history);
const weight=.40*context.support/(context.support+8);

return {
...def,
score:originalScore*(1-weight)+context.score*weight,
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
def=>def.id===state.trainerChoice
)||defs[0];
}

if(state.strategy==="ADAPTIVE") {
return defs.find(
def=>def.id==="ADAPTIVE:"+state.adaptive
)||defs[0];
}

if(state.strategy==="CREATED") {
return defs.find(
def=>def.id===state.activeCreated
)||defs[0];
}

return defs.find(
def=>def.id==="ORIGINAL:"+state.strategy
)||defs[0];
}

function updateTrainer() {
if(state.phase!=="ENTRY"||state.manual)return;

const ranked=trainerRanking();
const current=ranked.find(row=>row.id===state.trainerChoice);
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
?ranked.find(row=>row.id!==current.id)||best
:best;

if(current&&current.id!==selected.id) {
state.trainerChanges++;
}

state.trainerChoice=selected.id;
state.trainerTurns=0;
state.trainerPending=false;

state.trainerHistory.push({
turn:state.totalTurns,
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
motor=>motor.key===state.manual
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
 PROCESSAMENTO DE UM ÚNICO RESULTADO
====================================================== */

function settlePending(n,turn) {
for(const pending of state.g1Pending) {
state.g1Rows.push({
turn,
eventId:pending.eventId,
strategy:pending.strategy,
mode:pending.mode,
behavior:pending.behavior,
trigger:pending.trigger,
outcome:n,
hit:pending.numbers.includes(n),
uncovered:pending.uncovered,
entryMotor:pending.entryMotor||null,
triangleKey:pending.triangleKey||"SEM TRINCA",
spatialKeys:copy(pending.spatialKeys||[])
});
}

state.g1Pending=[];
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
const turn=state.totalTurns+1;

const cs=motors(before);
const defs=definitions();
const phaseBefore=state.phase;
const cycleBefore=copy(state.cycle);
const numberBefore=bestNumberCombination(before);

const spatial=spatialRead(before);
const triangleKey=triangleContext(before);
const spatialKeys=[...spatial.keys];
const after=[...before,n];

let result="AGUARDANDO";
let played=null;

/* Previsões formadas antes de consumir N. */

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
entryTurn:turn,
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

/* TREINAMENTO VIRTUAL ORIGINAL */

settlePending(n,turn);

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

const options=defenses(motor,n,after,def.id);
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

/* TREINADORES NUMÉRICOS */

recordNumberComparison(before,n,turn);
settle10(n,turn);

/* REGISTRO DO RESULTADO */

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
triangleType:spatial.tri.last?.labels.join(" + ")||"SEM TRINCA",
spatialKeys:copy(spatialKeys),
cycleTriangleKey:cycleBefore?.triangleKey||triangleKey,
cycleSpatialKeys:copy(
cycleBefore?.spatialKeys||spatialKeys
),
motorHits
});

/*
Entra um resultado e sai o mais antigo.
Nenhum replay dos 70 é disparado aqui.
*/

state.totalTurns=turn;
state.history.push(n);
state.historyTurns.push(turn);
state.sources.push(source);

pruneRolling();

registerNumberCombination(state.history,turn);
updateNumberChoice();
prepare10(state.history);

state.trainerTurns++;

if(state.phase!=="ENTRY"&&state.trainerTurns>=3) {
state.trainerPending=true;
}
}

/* ======================================================
 DESFAZER EXATO SEM REPROCESSAR A JANELA
====================================================== */

function undoSnapshot() {
const {undoStack,...data}=state;
return copy(data);
}

function inverseChanges(before,after,path=[],ops=[]) {
if(JSON.stringify(before)===JSON.stringify(after)) {
return ops;
}

if(Array.isArray(before)&&Array.isArray(after)) {
const a=before.map(value=>JSON.stringify(value));
const b=after.map(value=>JSON.stringify(value));

let drop=-1;

for(let d=0;d<=a.length;d++) {
const count=a.length-d;

if(count>b.length)continue;
if(count&&a[d]!==b[0])continue;

let equal=true;

for(let j=0;j<count;j++) {
if(a[d+j]!==b[j]) {
equal=false;
break;
}
}

if(equal) {
drop=d;
break;
}
}

const shared=a.length-drop;

ops.push({
kind:"slide",
path:[...path],
removeTail:after.length-shared,
restoreHead:copy(before.slice(0,drop))
});

return ops;
}

if(
before&&after&&
typeof before==="object"&&
typeof after==="object"&&
!Array.isArray(before)&&
!Array.isArray(after)
) {
for(const key of new Set([
...Object.keys(before),
...Object.keys(after)
])) {
if(!(key in before)) {
ops.push({
kind:"delete",
path:[...path,key]
});

} else if(!(key in after)) {
ops.push({
kind:"set",
path:[...path,key],
value:copy(before[key])
});

} else {
inverseChanges(
before[key],after[key],
[...path,key],ops
);
}
}

return ops;
}

ops.push({
kind:"set",
path:[...path],
value:copy(before)
});

return ops;
}

function applyInverse(ops) {
for(const op of ops) {
let parent=state;

for(const key of op.path.slice(0,-1)) {
parent=parent[key];
}

const key=op.path.at(-1);

if(op.kind==="slide") {
const array=parent[key];

if(op.removeTail) {
array.splice(
array.length-op.removeTail,
op.removeTail
);
}

array.unshift(...copy(op.restoreHead));

} else if(op.kind==="delete") {
delete parent[key];

} else {
parent[key]=copy(op.value);
}
}
}

function undo() {
if(busy)return;

if(!state.undoStack.length) {
alert("NÃO HÁ LANÇAMENTO MANUAL DISPONÍVEL PARA DESFAZER.");
return;
}

const transaction=state.undoStack.pop();

applyInverse(transaction.ops);

triangleCache.clear();
spaceCache.clear();

save();
render();
}

/* ======================================================
 IMPORTAÇÃO / ENTRADA MANUAL
====================================================== */

function waitFrame() {
return new Promise(resolve=>
requestAnimationFrame(()=>resolve())
);
}

function setBusy(value,message="") {
busy=value;

if(message&&$("status")) {
$("status").textContent=message;
}

for(const button of document.querySelectorAll(
".key,#import,#undo,#clear,#restore"
))button.disabled=value;
}

async function loadHistory(numbers,{
customSettings=null,
customManualLog=null
}={}) {
if(busy)return;

const previous=state;
const clean=cleanNumbers(numbers).slice(-WINDOW);
const opts=customSettings||settings();

setBusy(true,"IMPORTANDO HISTÓRICO");
await waitFrame();

try {
state={
...fresh(),
...opts,
manualLog:copy(customManualLog||[])
};

triangleCache.clear();
spaceCache.clear();

for(let i=0;i<clean.length;i++) {
spin(clean[i],"HISTÓRICO");

if(i%5===4) {
$("status").textContent=
"IMPORTANDO "+(i+1)+"/"+clean.length;

await new Promise(resolve=>setTimeout(resolve,0));
}
}

save();

} catch(e) {
state=previous;
alert("ERRO NA IMPORTAÇÃO: "+String(e.message||e));

} finally {
setBusy(false);
render();
}
}

async function addManual(n) {
if(busy)return;

if(state.history.length<8) {
alert("IMPORTE UM HISTÓRICO PRIMEIRO.");
return;
}

busy=true;

const before=undoSnapshot();

try {
spin(n,"TEMPO REAL");

const row=state.ledger.at(-1);

state.manualLog.push({
id:Date.now()+"_"+state.totalTurns,
turn:state.totalTurns,
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

const after=undoSnapshot();

state.undoStack.push({
turn:state.totalTurns,
number:n,
ops:inverseChanges(before,after)
});

state.undoStack=state.undoStack.slice(-WINDOW);

save();

} catch(e) {
const stack=state.undoStack;

state={
...before,
undoStack:stack
};

alert("ERRO AO INSERIR NÚMERO: "+String(e.message||e));

} finally {
busy=false;
render();
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
"IMPORTAR "+Math.min(WINDOW,clean.length)+
" NÚMEROS?\n\n"+
"SERÃO USADOS OS 70 MAIS RECENTES.\n"+
"OS REGISTROS MANUAIS ANTERIORES DESTA VERSÃO SERÃO APAGADOS."
))return;

$("paste").value="";
await loadHistory(clean);
}

function clearAll() {
if(busy)return;

if(!confirm(
"ZERAR HISTÓRICO, TREINADORES, "+
"BLOQUEIOS E REGISTROS MANUAIS?"
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
const element=document.createElement("button");

element.className="btn "+extra;
element.textContent=label;
element.onclick=action;

parent.appendChild(element);
return element;
}

function sortedBlocks(play) {
return validPlay(play)
?[...play.blocks].sort((a,b)=>
Object.keys(REGIONS).indexOf(region(a.center))-
Object.keys(REGIONS).indexOf(region(b.center))
):[];
}

function centersHTML(play) {
return sortedBlocks(play).map(block=>`
<div class="center ${block.radius===1?"short":""}">
<strong>${block.center}</strong>
<small>${region(block.center)}</small>
<small>
${block.radius} ${block.radius===1?"VIZINHO":"VIZINHOS"}
</small>
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
${headers.map(header=>`<th>${esc(header)}</th>`).join("")}
</tr></thead>
<tbody>
${rows.map(row=>`
<tr>
${row.map(cell=>`<td>${cell??"—"}</td>`).join("")}
</tr>
`).join("")}
</tbody>
</table>
</div>`;
}

function metrics(rows) {
const closed=rows.filter(row=>
["GREEN","GREEN G1","LOSS"].includes(row.result)
);

const green=closed.filter(row=>row.result==="GREEN").length;
const g1=closed.filter(row=>row.result==="GREEN G1").length;
const loss=closed.filter(row=>row.result==="LOSS").length;
const net=closed.reduce((sum,row)=>sum+(row.profit||0),0);

return {total:closed.length,green,g1,loss,net};
}

function metricsHTML(rows) {
const value=metrics(rows);

return `<div class="metrics">
${[
["CICLOS",value.total],
["GREEN",value.green],
["GREEN G1",value.g1],
["LOSS",value.loss],
["ACERTOS",pct(value.green+value.g1,value.total)],
["LÍQUIDO",fmt(value.net)]
].map(([label,number])=>`
<div class="metric">
<small>${label}</small><b>${number}</b>
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

for(const row of g1History(strategy,mode,5000)) {
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
Object.entries(breakdown(strategy)).map(([name,value])=>[
name,
value.total,
`<span class="good">${value.hits}</span>`,
`<span class="bad">${value.total-value.hits}</span>`,
pct(value.hits,value.total)
])
);
}

function contextHTML(keys) {
return (keys||[]).map(key=>`
<div class="muted">${esc(key)}</div>
`).join("");
}

/* ======================================================
 TRIANGULAÇÃO E PERCURSO VISUAIS
====================================================== */

function triangleSVG(features) {
if(!features)return "";

const position=n=>{
const point=pointTriangle(n);

return {
x:250+point.x*190,
y:250-point.y*190
};
};

const a=position(features.a);
const b=position(features.b);
const c=position(features.c);

const marked=new Set([
features.a,features.b,features.c
]);

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

${features.a!==features.c?`
<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}"
stroke="#a7bdd4" stroke-width="2" stroke-dasharray="7 5"/>
`:""}

${features.a!==features.b?`
<path d="M ${a.x} ${a.y}
Q ${(a.x+b.x)/2+7} ${(a.y+b.y)/2+7} ${b.x} ${b.y}"
fill="none" stroke="#57e4ff" stroke-width="4"
marker-end="url(#triA)"/>
`:""}

${features.b!==features.c?`
<path d="M ${b.x} ${b.y}
Q ${(b.x+c.x)/2-7} ${(b.y+c.y)/2-7} ${c.x} ${c.y}"
fill="none" stroke="#ffd36a" stroke-width="4"
marker-end="url(#triB)"/>
`:""}

${W.map(n=>{
const point=position(n);

return `
<circle cx="${point.x}" cy="${point.y}" r="14"
fill="${n===0?"#087b50":RED.has(n)?"#a92b43":"#253a50"}"
stroke="${marked.has(n)?"#ffe078":"#526d85"}"
stroke-width="${marked.has(n)?3:1}"/>

<text x="${point.x}" y="${point.y+4}"
fill="white" text-anchor="middle"
font-size="11" font-weight="bold">${n}</text>`;
}).join("")}

<text x="250" y="241" fill="#bdd0e2"
text-anchor="middle" font-size="14">
${features.a} → ${features.b} → ${features.c}
</text>

<text x="250" y="265" fill="#57e4ff"
text-anchor="middle" font-size="11">
${esc(features.type)}
</text>
</svg>`;
}

function triangulationHTML() {
const h=state.history;
const analysis=triangleAnalysis(h);
const features=analysis.last;

if(!features) {
return `<div class="box">AGUARDANDO TRÊS RESULTADOS.</div>`;
}

const pair=h.slice(-2);
const following=[];

for(let i=0;i+2<h.length;i++) {
if(h[i]===pair[0]&&h[i+1]===pair[1]) {
following.push(h[i+2]);
}
}

return `
<div class="box">
<b>TRIANGULAÇÃO E FECHAMENTO POR CONTORNO</b>

<p>TRINCA: ${features.a} → ${features.b} → ${features.c}</p>

<p>
RÓTULOS:
<strong>${esc(features.labels.join(" + "))}</strong>
</p>

<p>SALTOS: ${features.s1} / ${features.s2}</p>

<p>
SOMA ANTES DO MÓDULO:
<strong>${features.route.net} CASAS</strong>
</p>

<p>PERCURSO EM VALORES ABSOLUTOS: ${features.route.length}</p>
<p>FECHAMENTO A → C: ${features.closure} CASAS</p>

<p>
REFERÊNCIA DE 37 CASAS MAIS PRÓXIMA:
${features.route.nearestTurns*37}
</p>

<p>RESÍDUO ASSINADO: ${features.route.residual}</p>

<p>CORDAS: ${features.chords.map(fmt).join(" / ")}</p>

<p>
ÂNGULOS:
${features.angles.map(
angle=>angle==null?"INDEFINIDO":fmt(angle)+"°"
).join(" / ")}
</p>

<p>ÁREA: ${fmt(features.area)}</p>
<p>${features.degenerate?"TRINCA DEGENERADA":"TRÊS PONTOS DISTINTOS"}</p>
</div>

<div class="triangleDrawing">
${triangleSVG(features)}
</div>

<div class="muted">
CIANO: A → B. AMARELO: B → C. TRACEJADO: A → C.
A SOMA DOS MENORES SALTOS NÃO MEDE UMA VOLTA REAL DA BOLA.
</div>

<div class="box">
<p>PAR ATUAL: ${pair.join(" → ")}</p>
<p>OCORRÊNCIAS COMPLETAS: ${analysis.exactPairs}</p>
<p>SALTOS INICIAIS SEMELHANTES: ${analysis.matches}</p>
<p>TRINCAS CONHECIDAS: ${analysis.samples}</p>
</div>

<div class="title">RESULTADOS DEPOIS DO PAR</div>
${following.length
?cloud(following)
:`<div class="muted">SEM OCORRÊNCIA EXATA COMPLETA.</div>`}

<div class="title">CLASSIFICAÇÕES DA JANELA</div>
${Object.entries(analysis.counts).map(([name,count])=>`
<div class="listrow">${esc(name)} • ${count}</div>
`).join("")}

<div class="title">ÚLTIMAS TRINCAS</div>

${tableHTML(
["POSIÇÃO","TRINCA","RÓTULOS","AB","BC","SOMA","FECHAMENTO"],
analysis.triples.slice(-25).reverse().map(triple=>[
triple.position,
`${triple.a} → ${triple.b} → ${triple.c}`,
esc(triple.labels.join(" + ")),
triple.s1,
triple.s2,
triple.route.net,
triple.closure
])
)}
`;
}

/* ======================================================
 PAINEL ESPACIAL
====================================================== */

function spatialHTML() {
const h=state.history;

if(h.length<4) {
return `<div class="box">AGUARDANDO QUATRO RESULTADOS.</div>`;
}

const spatial=spatialRead(h);
const poles=spatial.poles.active;
const arc=spatial.arcs.active;
const chain=spatial.chain;

const leaders=W.map(n=>({
n,
total:spatial.weights[ix(n)],
triangle:spatial.tri.weights[ix(n)],
chain:spatial.chainWeights[ix(n)],
pole:spatial.poleWeights[ix(n)],
arc:spatial.arcWeights[ix(n)],
route:spatial.route.weights[ix(n)]
})).sort((a,b)=>b.total-a.total);

return `
<div class="box">
<b>CÁLCULOS ESPACIAIS DOS MOTORES</b>

<p>
TRINCAS, ENCADEAMENTO, POLOS, ARCOS E PERCURSO
PARTICIPAM DOS PESOS ANTES DA GEOMETRIA.
</p>

<p>
A JANELA É MÓVEL. CADA RESULTADO NOVO RETIRA O MAIS ANTIGO.
OS CICLOS ABERTOS MANTÊM AS COMBINAÇÕES COMPROMETIDAS.
</p>

${contextHTML(spatial.keys)}
</div>

<div class="title">PERCURSOS ACUMULADOS</div>

${tableHTML(
["RESULTADOS","SALTOS","SOMA","ABSOLUTO","37 COMPLETAS","FECHAMENTO","RÓTULOS"],
spatial.route.current.map(route=>[
route.numbers.join(" → "),
route.steps.join(" / "),
route.net,
route.length,
route.completedTurns,
route.closure,
esc(route.labels.join(" + ")||"PERCURSO ABERTO")
])
)}

<div class="muted">
“37 COMPLETAS” REFERE-SE À SOMA GEOMÉTRICA DOS MENORES SALTOS.
NÃO É CONTAGEM DE VOLTAS REAIS DA BOLA.
</div>

<div class="box">
<b>ENCADEAMENTO</b>

<p>${chain?chain.numbers.join(" → "):"AGUARDANDO"}</p>
<p>SALTOS: ${chain?chain.hops.join(" / "):"—"}</p>

<p>
FORMAS:
${chain
?esc(chain.first.labels.join(" + "))+
" → "+esc(chain.second.labels.join(" + "))
:"—"}
</p>

<p>EXEMPLOS SEMELHANTES: ${spatial.chainExamples}</p>
<p>EXEMPLOS DE PERCURSO: ${spatial.route.examples}</p>
</div>

<div class="box">
<b>DOIS POLOS MÓVEIS</b>

${poles?`
<p>STATUS: ${poles.active?"ATIVO":"ENCERRADO"}</p>
<p>EVENTO: <strong>${esc(poles.event)}</strong></p>
<p>POLOS INICIAIS: ${poles.initial.join(" / ")}</p>
<p>POLOS ATUAIS: ${poles.anchors.join(" / ")}</p>
<p>DESLOCAMENTOS ACUMULADOS: ${poles.drift.join(" / ")}</p>
<p>ÚLTIMOS DESLOCAMENTOS: ${poles.lastShift.join(" / ")}</p>
<p>ALTERNÂNCIAS: ${poles.alternations}</p>
<p>INTERRUPÇÕES: ${poles.interruptions}</p>
<p>CONSECUTIVOS FORA: ${poles.outside}</p>

<p>
LADO SEGUINTE DO PADRÃO:
${poles.active
?poles.anchors[1-poles.lastSide]
:"SEM POLO ATIVO"}
</p>
`:`<p>SEM EPISÓDIO A → B → A' → B' FORMADO.</p>`}

<div class="muted">
FORMAÇÃO: RETORNOS ATÉ 2 CASAS E SEPARAÇÃO MÍNIMA DE 8.
ACOMPANHAMENTO: ATÉ 4 CASAS DO POLO.
DOIS RESULTADOS SEGUIDOS FORA ENCERRAM O EPISÓDIO.
</div>
</div>

${tableHTML(
["POSIÇÃO","NÚMERO","EVENTO","POLOS","DESLOCAMENTOS"],
spatial.poles.events.slice(-30).reverse().map(event=>[
event.position,event.number,esc(event.event),
event.anchors.join(" / "),event.drift.join(" / ")
])
)}

<div class="box">
<b>ARCO ACOMPANHADO</b>

${arc?`
<p>${arc.numbers.join(" • ")}</p>
<p>EVENTO: <strong>${esc(arc.event)}</strong></p>
<p>FORMAÇÃO ANTES DA POSIÇÃO: ${arc.formedBefore}</p>
<p>VISITAS NOS ÚLTIMOS ${arc.total}: ${arc.count}</p>
<p>CONSECUTIVOS DENTRO: ${arc.inside}</p>
<p>CONSECUTIVOS FORA: ${arc.outside}</p>
<p>ENTRADAS: ${arc.entries} • SAÍDAS: ${arc.exits}</p>
<p>REENTRADAS: ${arc.returns}</p>
<p>ÚLTIMO INTERVALO FORA: ${arc.lastGap}</p>
<p>MAIOR INTERVALO FORA: ${arc.maxGap}</p>
<p>DESLOCAMENTO NA TROCA DE ARCO: ${arc.drift}</p>
`:`<p>SEM ARCO FORMADO.</p>`}

<div class="muted">
O ARCO AVALIADO EM CADA POSIÇÃO USA O PREFIXO ANTERIOR.
A LIDERANÇA ATUAL PODE DIFERIR DO ARCO ACOMPANHADO
POR CAUSA DA REGRA DE PERSISTÊNCIA.
</div>
</div>

<div class="title">ARCOS MAIS VISITADOS AGORA</div>

${tableHTML(
["#","ARCO DE 8 POSIÇÕES","VISITAS","AMOSTRA"],
spatial.arcs.ranked.slice(0,10).map((row,i)=>[
i+1,row.numbers.join(" • "),row.count,row.total
])
)}

<div class="title">ENTRADAS, SAÍDAS E REENTRADAS</div>

${tableHTML(
["POSIÇÃO","NÚMERO","EVENTO","ARCO","FORA","INTERVALO"],
spatial.arcs.events.slice(-30).reverse().map(event=>[
event.position,event.number,esc(event.event),
esc(event.arcId),event.outside,event.gap
])
)}

<div class="title">TRANSIÇÕES CONHECIDAS DOS ARCOS</div>

${tableHTML(
["EVENTO ANTERIOR","PRÓXIMOS TESTADOS","PRÓXIMOS DENTRO"],
Object.entries(spatial.arcs.transitions).map(([event,value])=>[
esc(event),value.total,value.hits
])
)}

<div class="title">PESOS EFETIVOS DOS MOTORES</div>

${tableHTML(
["NÚMERO","TRINCA","CADEIA","POLOS","ARCO","PERCURSO","TOTAL"],
leaders.map(value=>[
value.n,
fmt(value.triangle),
fmt(value.chain),
fmt(value.pole),
fmt(value.arc),
fmt(value.route),
fmt(value.total)
])
)}

<div class="title">VALIDAÇÃO NO CONTEXTO ATUAL</div>

${tableHTML(
["ESTRATÉGIA","CICLOS COMPATÍVEIS","SUPORTE","ACERTOS","LOSS","ÍNDICE"],
trainerRanking().map(row=>[
esc(row.name),
row.contextTotal,
fmt(row.contextSupport),
row.contextHits,
row.contextLoss,
pct(row.score,1)
])
)}

<div class="muted">
PESOS E ÍNDICES SÃO COMPARATIVOS, NÃO PROBABILIDADES GARANTIDAS.
</div>
`;
}

/* ======================================================
 PAINÉIS DOS TREINADORES
====================================================== */

function card10(record) {
const rejected=record.blocked||record.status==="REJECTED";
const approved=record.status==="APPROVED"&&!rejected;

const pending=state.n10.pending.filter(test=>
test.trigger===record.trigger&&test.recordId===record.id
);

return `
<div class="g1card ${approved?"selected":""}">

<b class="${rejected?"bad":approved?"good":""}">
GATILHO ${record.trigger} • ${recordStatus10(record)}
</b>

<div class="muted">
ORIGEM: ${esc(record.motor.key)} • GIRO ${record.created}
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
PROSPECTIVOS NA JANELA:
GREEN ${record.green} • GREEN G1 ${record.g1} • LOSS ${record.loss}
</div>

<div class="muted">
RETROSPECTIVOS VIRTUAIS NA JANELA:
GREEN ${record.vg} • GREEN G1 ${record.vg1} • LOSS ${record.vl}
</div>

<div class="muted">
COBERTURA DOS PESOS:
${pct(spatialCoverage(record.motor.play,state.history),1)}
</div>

${record.lastResult?`
<div class="muted">
ÚLTIMO CICLO NA JANELA:
${esc(record.lastResult)} • GIRO ${record.last}
</div>
`:""}

${record.lastVirtual?`
<div class="muted">
ÚLTIMO RETROSPECTIVO:
${esc(record.lastVirtual)} • GIRO ${record.lastVirtualTurn}
</div>
`:""}

${rejected&&!record.samples.length?`
<div class="muted">
BLOQUEIO PRESERVADO.
O RESULTADO QUE ORIGINOU O BLOQUEIO JÁ SAIU DO PLACAR DE 70.
</div>
`:""}

${pending.length?`
<div class="muted">
TESTES ABERTOS:
${pending.map(test=>
`${test.actual?"REAL":"VIRTUAL"} ${esc(test.phase)} • GIRO ${test.turn}`
).join(" / ")}
</div>
`:""}

${record.lastResult==="GREEN G1"?`
<div class="muted">
APROVAÇÃO DO CICLO COM DEFESA.
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
event=>event.kind==="FORWARD"
);

const events=state.n10.events.filter(
event=>event.trigger===trigger
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
AS ESTATÍSTICAS USAM A JANELA MÓVEL.
OS BLOQUEIOS NÃO JOGAR CONTINUAM PRESERVADOS.
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

<div class="title">CICLOS REAIS NA JANELA</div>
${metricsHTML(forward.filter(event=>!event.virtual))}

<div class="title">PROSPECTIVOS VIRTUAIS • LÍQUIDO SIMULADO</div>
${metricsHTML(forward.filter(event=>event.virtual))}

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
• APROVADAS ${records.filter(row=>row.status==="APPROVED").length}
• EM TESTE ${records.filter(row=>row.status==="TESTING").length}
• BLOQUEADAS ${records.filter(row=>row.blocked).length}
</div>

${tableHTML(
["GATILHO","APROVADAS","EM TESTE","BLOQUEADAS","ABERTOS"],
Array.from({length:37},(_,n)=>{
const rows=Object.values(state.n10.books[n]?.records||{});

return [
`<button class="btn" data-trigger10="${n}">${n}</button>`,
rows.filter(row=>row.status==="APPROVED").length,
rows.filter(row=>row.status==="TESTING").length,
rows.filter(row=>row.blocked).length,
state.n10.pending.filter(test=>test.trigger===n).length
];
})
)}

<div class="title">
COMBINAÇÕES DO GATILHO ${trigger}
• ${visible.length}/${records.length}
</div>

${visible.map(card10).join("")||
`<div class="box">SEM COMBINAÇÕES PARA ESTE GATILHO.</div>`}

<div class="title">EVENTOS DA JANELA</div>

${events.map(event=>event.kind==="RETROSPECTIVE"?`
<div class="listrow">
<b>RETROSPECTIVO VIRTUAL • GIRO ${event.turn}</b>
<div class="muted">
ALTERNATIVAS ${event.tested}
• GREEN ${event.green}
• GREEN G1 ${event.g1}
• LOSS ${event.loss}
• SEM APOSTA REAL
</div>
</div>
`:`
<div class="listrow">
<b>${event.virtual?"PROSPECTIVO VIRTUAL":"CICLO REAL"}
• GIRO ${event.turn}</b>

• <strong class="${event.result==="LOSS"?"bad":"good"}">
${esc(event.result)}
</strong>

<div class="muted">
${event.defense?"DEFESA "+esc(event.defense):"ENTRADA"}
• ${esc(event.source)}
</div>

${contextHTML(event.spatialKeys)}
</div>
`).join("")}
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
${state.strategy==="NUMBER"
?"CONTROLANDO A JOGADA":"ANÁLISE VIRTUAL"}
</strong>
</p>

<p>NÚMERO ATUAL: ${trigger}</p>
<p>COMBINAÇÕES NA JANELA: ${generated.length}</p>
<p>ORIGENS DIFERENTES: ${new Set(generated.map(row=>row.origin)).size}</p>
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
COMPARAÇÃO NUMÉRICA E COBERTURA DOS PESOS ESPACIAIS.
SEM GREEN/LOSS COMO CRITÉRIO DE SELEÇÃO.
</p>
</div>

${tableHTML(
["#","ORIGEM","GIRO","TRANSIÇÕES","COBERTAS","FORA","ESPACIAL","ÍNDICE"],
ranked.map((row,i)=>[
i+1,row.origin,row.turn,row.total,row.matches,row.misses,
pct(row.spatialScore,1),pct(row.score,1)
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
${cloud(pairs.map(row=>row.next))}

<div class="title">COMBINAÇÕES DA JANELA</div>

${tableHTML(
["GIRO","ORIGEM","6 CENTROS"],
generated.slice().reverse().map(row=>[
row.turn,row.origin,row.centers.join(" • ")
])
)}

<div class="title">ÚLTIMAS COMPARAÇÕES VIRTUAIS</div>

${state.numberComparisons.slice(-20).reverse().map(row=>`
<div class="listrow">
GATILHO ${row.trigger}
• COMBINAÇÃO DO ${row.sourceNumber}
• GIRO ${row.sourceTurn}
• RESULTADO ${row.next}
• <strong class="${row.covered?"good":"bad"}">
${row.covered?"COBERTO":"FORA"}
</strong>
</div>
`).join("")}
`;
}

function trainerHTML() {
const ranked=trainerRanking();
const active=ranked.find(row=>row.id===state.trainerChoice);

const real=state.realG1.length;
const hits=state.realG1.filter(
row=>row.result==="GREEN G1"
).length;

return `
<div class="box">
<b>TREINADOR GLOBAL ORIGINAL</b>

<p>
STATUS:
<strong class="${state.strategy==="TRAINER"?"good":"bad"}">
${state.strategy==="TRAINER"
?"CONTROLANDO A JOGADA":"ANÁLISE VIRTUAL"}
</strong>
</p>

<p>ESTRATÉGIAS: ${ranked.length}</p>
<p>ATIVA: ${esc(active?.name||"AGUARDANDO")}</p>
<p>GIROS DESDE A TROCA: ${state.trainerTurns}</p>
<p>TROCAS: ${state.trainerChanges}</p>

<p>
${state.trainerPending
?"TROCA PENDENTE — FECHAR GALE"
:"AVALIAÇÃO A CADA RESULTADO"}
</p>

<p>
RESULTADOS VIRTUAIS E SUPORTE CONTEXTUAL
ACOMPANHAM A JANELA MÓVEL.
</p>

${contextHTML(spatialRead(state.history).keys)}

<p>
OS TREINADORES NUMÉRICOS CONTINUAM INDEPENDENTES.
</p>
</div>

<div class="box">
<b>TREINADOR GLOBAL G1</b>
<p>STATUS: ${state.g1Trainer?"ATIVADO":"DESATIVADO"}</p>
<p>GALES REAIS NA JANELA: ${real}</p>
<p>GREEN G1: ${hits}</p>
<p>LOSS: ${real-hits}</p>
<p>APROVEITAMENTO: ${pct(hits,real)}</p>
<p>EVENTOS VIRTUAIS: ${uniqueGales(null,5000).length}</p>
<p>RUPTURAS: ${breakdown().RUPTURA.total}</p>
</div>

<div class="title">RANKING DAS ESTRATÉGIAS</div>

${tableHTML(
["#","ESTRATÉGIA","CICLOS","ACERTOS","LOSS","CONTEXTO","SUPORTE","ÍNDICE"],
ranked.map((row,i)=>[
i+1,esc(row.name),row.total,row.hits,row.loss,
row.contextTotal,fmt(row.contextSupport),pct(row.score,1)
])
)}

<div class="title">ÚLTIMAS TROCAS NA JANELA</div>

${state.trainerHistory.slice(-12).reverse().map(row=>`
<div class="listrow">
GIRO ${row.turn}
• ${esc(row.from)} → ${esc(row.to)}
${contextHTML(row.spatialKeys)}
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
mode,...defenseMetrics(def.id,mode,5000)
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
<b>RANKING EXCLUSIVO G1</b>
<p>SOMENTE EVENTOS QUE CHEGARAM AO GALE NA JANELA.</p>
<p>AS TRÊS DEFESAS SÃO TESTADAS NO MESMO RESULTADO.</p>
<p>CADA EVENTO É CONTADO UMA VEZ NO TOTAL DE GALES.</p>
</div>

${tableHTML(
["#","ESTRATÉGIA","GALES","MELHOR DEFESA","GREEN G1","LOSS","ACERTO"],
ranked.map((row,i)=>[
i+1,esc(row.name),uniqueGales(row.id,5000).length,
esc(row.best.mode),row.best.hits,row.best.loss,
pct(row.best.hits,row.best.total)
])
)}

<div class="title">CONTINUIDADE / DESLOCAMENTO / RUPTURA</div>
${breakdownHTML()}

<div class="title">COMPARAÇÃO DAS TRÊS DEFESAS</div>

${ranked.map(row=>`
<div class="box">
<b>${esc(row.name)}</b>
${tableHTML(
["DEFESA","GALES","GREEN G1","LOSS","ACERTO"],
row.modes.map(mode=>[
esc(mode.mode),mode.total,mode.hits,mode.loss,
pct(mode.hits,mode.total)
])
)}
</div>
`).join("")}
`;
}

function g1NumbersHTML() {
const cs=motors(state.history);
const original=state.cycle?.original||activeMotor(cs);

if(!validPlay(original?.play)) {
return `<div class="box">AGUARDANDO HISTÓRICO.</div>`;
}

const strategy=state.cycle?.strategy||activeDefinition().id;
const trigger=state.cycle?.trigger??state.history.at(-1);

if(trigger==null)return "";

const reading=behaviorReading(
original,state.history,strategy,trigger
);

const options=defenses(
original,trigger,state.history,strategy
);

const decision=state.cycle?.decision||
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
${numberG1Events(strategy,trigger,5000).length}
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
const value=numberG1Metrics(
strategy,trigger,mode,5000
);

return [
esc(mode),value.total,value.hits,value.loss,
pct(value.hits,value.total)
];
})
)}

<div class="title">9 DESCOBERTOS DA ENTRADA</div>
${cloud(missing(original.play))}

${options.map(option=>{
const global=defenseMetrics(
strategy,option.mode,5000
);

const conditional=numberG1Metrics(
strategy,trigger,option.mode,5000
);

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
GALES ${global.total}
• GREEN G1 ${global.hits}
• LOSS ${global.loss}
• ACERTO ${pct(global.hits,global.total)}
</div>

<div class="muted">
GATILHO ${trigger}:
GALES ${conditional.total}
• GREEN G1 ${conditional.hits}
• LOSS ${conditional.loss}
• ACERTO ${pct(conditional.hits,conditional.total)}
</div>

<div class="muted">
COBERTURA ESPACIAL:
${pct(spatialCoverage(option.motor.play,state.history),1)}
</div>
</div>`;
}).join("")}

<div class="title">CONTINUIDADE / DESLOCAMENTO / RUPTURA</div>
${breakdownHTML(strategy)}

<div class="title">ÚLTIMOS GALES REAIS DA JANELA</div>

${state.realG1.slice(-12).reverse().map(row=>`
<div class="listrow">
GIRO ${row.turn}
• NÚMERO ${row.trigger}
• ${esc(row.mode)}
• <b>${esc(row.result)}</b>
• ${esc(row.behavior)}
${contextHTML(row.spatialKeys)}
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

${Object.entries(a.regions).map(([name,value])=>`
<div class="listrow">
${name}
• AUSÊNCIA ${value.absence}
• ÚLTIMOS 12: ${value.recent}
</div>
`).join("")}

<div class="title">ÚLTIMAS TRANSIÇÕES</div>

${a.transitions.slice(-12).reverse().map(value=>`
<div class="listrow">
${value.from} → ${value.to}
• ${value.distance} CASAS
• ${value.physical>0?"HORÁRIO":
value.physical<0?"ANTI-HORÁRIO":"PARADO"}
</div>
`).join("")}

<div class="muted">
DIREÇÃO DO MENOR SALTO NA ORDEM W.
NÃO É MEDIÇÃO DO MOVIMENTO REAL DA BOLA.
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
return state.ledger.slice().reverse().map(row=>`
<div class="listrow">
<b>GIRO ${row.turn}</b>
• ${row.number}
• ${esc(row.result)}

<div class="muted">
GATILHO ${row.trigger??"—"}
• ${esc(row.strategy)}
• ${esc(row.motor)}
• ${region(row.number)}
• ${mirror(row.number)}
</div>

<div class="muted">CONTEXTO ANTES DO RESULTADO:</div>
${contextHTML(row.spatialKeys)}

${row.numberCandidate!=null?`
<div class="muted">
TREINADOR NÚMEROS:
COMBINAÇÃO DO ${row.numberCandidate}
• ORIGEM NO GIRO ${row.numberCandidateTurn}
</div>
`:""}
</div>
`).join("");
}

/* ======================================================
 CSS — SEM MODAL OU TELA DE RECÁLCULO
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
.windowBox{
background:#102b2c;border:1px solid #32bba2;
border-radius:9px;padding:12px;margin:10px 0
}
.windowBox strong{font-size:27px;color:#54f0c3}
.bar{
height:10px;background:#34475a;border-radius:20px;
overflow:hidden;margin:10px 0
}
.barfill{height:100%;background:#31dca9}
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
@media(max-width:600px){
.center{min-height:79px}
.center strong{font-size:clamp(25px,7vw,37px)}
.center small{font-size:8px}
.btn{font-size:10px;padding:9px}
}
`;

/* ======================================================
 ESTRUTURA DA TELA
====================================================== */

document.body.innerHTML=`
<style>${css}</style>

<main class="app">

<h1>ANÁLISE BETA V${VERSION}</h1>

<div class="sub">
JANELA MÓVEL DE 70 • ENTROU UM, SAIU UM
<br>
12 MOTORES • 28 NÚMEROS • CONTEXTO ESPACIAL INTEGRADO
<br>
TRINCAS • ENCADEAMENTO • POLOS • ARCOS • CONTORNO
<br>
TREINADOR GLOBAL • DOIS TREINADORES NUMÉRICOS • G1
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

<div class="windowBox">
<div class="muted">JANELA MÓVEL</div>
<strong id="counter">0 / 70</strong>

<div class="bar">
<div class="barfill" id="barfill"></div>
</div>

<div class="muted" id="windowInfo"></div>
<div class="muted" id="cycleInfo"></div>
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
["triangulation","TRIANGULAÇÃO / CONTORNO"],
["spatial","ENCADEAMENTO / POLOS / ARCOS / PERCURSO"],
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
A JANELA MANTÉM OS 70 RESULTADOS MAIS RECENTES.
CADA NOVO RESULTADO RETIRA O MAIS ANTIGO.

A JANELA CONTINUA ANDANDO DURANTE O G1,
MAS A JOGADA E A DEFESA DO CICLO REAL NÃO SÃO TROCADAS.

REGISTROS MANUAIS FICAM ARQUIVADOS.
BLOQUEIOS NÃO JOGAR PERMANECEM PRESERVADOS.
</div>

</main>
`;

/* ======================================================
 BOTÕES E AÇÕES
====================================================== */

function changeStrategy(
strategy,adaptive=null,created=null
) {
if(busy)return;

if(!cycleIsFree()) {
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
ADAPTATIVES.map(config=>({
label:config.name,
id:config.id,
action:()=>changeStrategy("ADAPTIVE",config.id)
}))
]
];

for(const [label,items] of groups) {
const group=document.createElement("div");
group.innerHTML=`<div class="title">${label}</div>`;

const row=document.createElement("div");
row.className="row";

for(const item of items) {
const element=button(
item.label,item.action,row,
item.id==="TRAINER"?"trainer":
item.id==="NUMBER"?"number":
item.id===N10?"number10":""
);

element.dataset.choice=item.id;
}

group.appendChild(row);
root.appendChild(group);
}

const rankRow=document.createElement("div");
rankRow.className="row";

for(let i=1;i<=4;i++) {
const element=button("AUTO "+i+"º",()=>{
if(busy)return;

if(!cycleIsFree()) {
alert("AGUARDE ENCERRAR O CICLO.");
return;
}

state.rank=i;
changeStrategy("FIXED");
},rankRow);

element.dataset.rank=i;
}

root.appendChild(rankRow);

if(state.created.length) {
const group=document.createElement("div");

group.innerHTML=`
<div class="title">ESTRATÉGIAS PERSONALIZADAS</div>
`;

const row=document.createElement("div");
row.className="row";

for(const custom of state.created) {
const element=button(
custom.name,
()=>changeStrategy(
"CREATED",null,"CREATED:"+custom.id
),
row
);

element.dataset.created=custom.id;
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
const element=button(label,()=>{
if(busy)return;

if(!cycleIsFree()) {
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

element.dataset.option=field;
}

for(let n=0;n<=36;n++) {
const element=document.createElement("button");

element.className="key"+(n===0?" zero":"");
element.textContent=n;

element.style.background=
n===0?"#087b50":
RED.has(n)?"#ac293f":"#12151b";

element.onclick=()=>addManual(n);
$("keys").appendChild(element);
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
state.stake=Math.max(.01,Number($("stake").value)||1);
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
const element=event.target.closest("[data-panel]");
if(!element)return;

const id=element.dataset.panel;
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
const spatial=spatialRead(state.history);

$("status").textContent=
state.history.length+" NÚMEROS NA JANELA • "+
cs.length+"/12 MOTORES • "+
state.phase+
" • GIRO "+state.totalTurns+
(saveError?" • FALHA AO SALVAR: "+saveError:"");

$("counter").textContent=
state.history.length+" / "+WINDOW;

$("barfill").style.width=
100*state.history.length/WINDOW+"%";

$("windowInfo").textContent=
state.history.length===WINDOW
?"JANELA COMPLETA: ENTROU UM, SAIU O MAIS ANTIGO."
:"FALTAM "+(WINDOW-state.history.length)+
" RESULTADOS PARA COMPLETAR A JANELA.";

$("cycleInfo").textContent=
cycleIsFree()
?"CICLO LIVRE • GIROS "+
(state.historyTurns[0]??"—")+
" A "+state.totalTurns
:"CICLO "+state.phase+
" • JANELA MÓVEL ATIVA • "+
"JOGADA DO CICLO PRESERVADA";

for(const element of document.querySelectorAll("[data-choice]")) {
const choice=element.dataset.choice;

const active=
state.strategy==="TRAINER"?choice==="TRAINER":
state.strategy==="NUMBER"?choice==="NUMBER":
state.strategy===N10?choice===N10:
state.strategy==="ADAPTIVE"?choice===state.adaptive:
choice===state.strategy;

element.classList.toggle("active",active);
}

for(const element of document.querySelectorAll("[data-rank]")) {
element.classList.toggle(
"active",
state.strategy==="FIXED"&&
state.rank===Number(element.dataset.rank)
);
}

for(const element of document.querySelectorAll("[data-option]")) {
const active=!!state[element.dataset.option];

element.classList.toggle("active",active);

element.classList.toggle(
"on",
active&&element.dataset.option==="g1Trainer"
);
}

for(const element of document.querySelectorAll("[data-created]")) {
element.classList.toggle(
"active",
state.strategy==="CREATED"&&
state.activeCreated===
"CREATED:"+element.dataset.created
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
?" • "+(
record10
?recordStatus10(record10)
:"SEM GEOMETRIA ELEGÍVEL"
)
:""
)+
" • POLOS "+(spatial.poles.active?.event||"SEM EPISÓDIO")+
" • ARCO "+(spatial.arcs.active?.event||"SEM ARCO");

$("centers").innerHTML=
centersHTML(play)+
(
record10?.blocked
?`
<div class="reject10">
NÃO JOGAR
<small>
REPROVADA PARA O GATILHO ${record10.trigger}
${state.cycle?" • CICLO ATUAL MANTIDO ATÉ ENCERRAR":""}
</small>
</div>
`
:""
);

$("coverage").textContent=play
?"28 COBERTOS • 9 DESCOBERTOS: "+missing(play).join(" • ")
:state.history.length<8
?"IMPORTE PELO MENOS 8 NÚMEROS."
:state.strategy===N10
?"SEM GEOMETRIA ELEGÍVEL. REPROVADAS NÃO SERÃO REUTILIZADAS."
:"AGUARDANDO COMBINAÇÃO.";

const start=Math.max(0,state.history.length-14);

$("last").innerHTML=state.history
.slice(start)
.map((n,i)=>{
const turn=state.historyTurns[start+i];
const row=state.ledger.find(value=>value.turn===turn);
const result=row?.result||"HISTÓRICO";

const cls=result==="LOSS"?"loss":
result.startsWith("GREEN")?"green":
result==="GALE"?"gale":"";

return `
<div class="chip ${cls}" style="background:${
n===0?"#087b50":RED.has(n)?"#a72740":"#14181f"
}">
<b>${n}</b>
<small>${esc(result)}</small>
</div>`;
}).reverse().join("");

if(state.open.general) {
$("general").innerHTML=`
<div class="title">RESULTADOS DA JANELA ATUAL</div>
${metricsHTML(state.ledger)}

<div class="title">IMPORTADOS NA JANELA</div>
${metricsHTML(
state.ledger.filter(row=>row.source==="HISTÓRICO")
)}

<div class="title">MANUAIS NA JANELA</div>
${metricsHTML(
state.ledger.filter(row=>row.source==="TEMPO REAL")
)}

<div class="title">MANUAIS ARQUIVADOS • TOTAL</div>
${metricsHTML(state.manualLog)}

<div class="box">
<p>REGISTROS MANUAIS ARQUIVADOS: ${state.manualLog.length}</p>
<p>DESFAZER DISPONÍVEIS: ${state.undoStack.length}</p>

<p>
OS RESULTADOS VENCIDOS SAEM DO PLACAR E DO TREINAMENTO DA JANELA.
O ARQUIVO MANUAL PERMANECE SEPARADO.
</p>
</div>

<div class="title">ÚLTIMOS RESULTADOS MANUAIS ARQUIVADOS</div>

${state.manualLog.slice(-25).reverse().map(row=>`
<div class="listrow">
<b>${row.number}</b>
• <strong class="${row.result==="LOSS"?"bad":"good"}">
${esc(row.result)}
</strong>
• ${esc(row.motor)}
• ${fmt(row.profit)}
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

for(const element of document.querySelectorAll("[data-trigger10]")) {
element.onclick=()=>{
if(busy)return;
state.n10.viewTrigger=element.dataset.trigger10;
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
${cs.map(candidate=>`
<button class="btn" data-manual="${candidate.key}">
${esc(candidate.key)}
</button>
`).join("")}
</div>

${cs.map(candidate=>`
<div class="listrow">
<b>${candidate.rank}º ${esc(candidate.key)}</b>
• ${fmt(candidate.score)}

<div class="muted">
CENTROS:
${sortedBlocks(candidate.play).map(
block=>block.center
).join(" • ")}
</div>

<div class="muted">
TESTES NA JANELA:
${state.ledger.filter(
row=>row.motorHits&&candidate.key in row.motorHits
).length}
• ÍNDICE ${pct(motorRate(candidate.key,70),1)}
</div>

<div class="muted">
COBERTURA ESPACIAL: ${pct(candidate.spatialScore,1)}
• TRIANGULAÇÃO: ${pct(candidate.triangleScore,1)}
</div>

${contextHTML(candidate.spatialKeys)}
</div>
`).join("")}
`;

for(const element of document.querySelectorAll("[data-manual]")) {
element.classList.toggle(
"active",
state.manual===element.dataset.manual
);

element.onclick=()=>{
if(busy)return;

if(!cycleIsFree()) {
alert("AGUARDE ENCERRAR O CICLO.");
return;
}

state.manual=element.dataset.manual;
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
POLOS MÓVEIS, INTERRUPÇÃO, RETOMADA,
RUPTURA, ARCOS, REENTRADAS E CONTORNO.
</div>

<div class="box">
CONTORNO:
SOMA DOS SALTOS ANTES DO MÓDULO 37,
FECHAMENTO PRÓXIMO DA ORIGEM
E RÓTULOS SIMULTÂNEOS.

EXEMPLO:
26 → 23 → 35
PODE SER CONTINUAÇÃO E FECHAMENTO POR CONTORNO.
</div>

<div class="box">
CONSENSO E UNIÃO RECEBEM OS PESOS ANTES DA GEOMETRIA.
ADAPTATIVAS E PERSONALIZADAS USAM OS MOTORES INTEGRADOS
E O DESEMPENHO CONTEXTUAL.
</div>

<div class="box">
TREINADOR GLOBAL:
HISTÓRICO VIRTUAL E CONTEXTOS T / C / P / A / R.

T: TRIANGULAÇÃO.
C: ENCADEAMENTO.
P: POLOS.
A: ARCOS.
R: PERCURSO E CONTORNO.

O CONTEXTO É CAPTURADO ANTES DO RESULTADO.
</div>

<div class="box">
TREINADOR GLOBAL NÚMEROS:
TRANSIÇÕES DO GATILHO,
COMBINAÇÕES HISTÓRICAS
E COBERTURA ESPACIAL.
SEM GREEN/LOSS COMO CRITÉRIO.
</div>

<div class="box">
TREINADOR GLOBAL NÚMEROS 1.0:
APROVAÇÃO POR GATILHO,
BLOQUEIO NÃO JOGAR,
ALTERNATIVAS VIRTUAIS IMEDIATAS
E CLASSIFICAÇÃO ESPACIAL.

AS CONTAGENS ACOMPANHAM OS 70 RESULTADOS.
BLOQUEIOS NÃO SÃO LIBERADOS AUTOMATICAMENTE.
</div>

<div class="box">
G1:
CONGELADA, AJUSTE FINO E RECONSTRUÇÃO.
O CICLO REAL MANTÉM A JOGADA E A DEFESA
ENQUANTO A JANELA CONTINUA ANDANDO.
</div>

<div class="box">
JANELA MÓVEL DE 70:
ENTROU UM, SAIU O MAIS ANTIGO.
SEM REINÍCIO EM LOTES DE 10.
</div>

<button class="btn trainer" id="create">
CRIAR CÓPIA DA MELHOR ADAPTATIVA
</button>
`;

$("create").onclick=()=>{
if(busy)return;

const best=trainerRanking().find(
row=>row.type==="ADAPTIVE"
);

if(!best)return;

state.created.push({
id:"CUSTOM_"+Date.now(),
name:"ESTRATÉGIA VIRTUAL "+(state.created.length+1),
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
 MIGRAÇÃO
====================================================== */

async function migrateLegacy() {
if(!legacyData)return;

const old=legacyData;
legacyData=null;

/*
Ciclo aberto: adota o estado sem reconstruir sua jogada.
O funcionamento móvel começa a partir desse estado.
*/

if((old.phase||"ENTRY")!=="ENTRY"||old.cycle) {
state=normalizeState(old);
state.undoStack=[];

pruneRolling();
updateNumberChoice();
prepare10(state.history);

save();
render();
return;
}

/*
Ciclo livre: importa uma única vez os últimos 70
para inicializar os novos cálculos desta versão.
Não existe repetição desse processo a cada 10.
*/

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

await loadHistory(
cleanNumbers(old.history),
{
customSettings:opts,
customManualLog:old.manualLog||[]
}
);
}

/* ======================================================
 INICIALIZAÇÃO
====================================================== */

pruneRolling();

if(state.history.length>=8) {
updateNumberChoice();
prepare10(state.history);
}

render();

if(legacyData) {
setTimeout(()=>{migrateLegacy();},0);
}

})();
