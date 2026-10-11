
(function () {
"use strict";

/*
 ANÁLISE BETA V4.3

 CORREÇÃO:
 OS 6 CENTROS DA JOGADA SÃO
 ORGANIZADOS POR:
 1. TIERS
 2. ÓRFÃOS
 3. VOISINS
 4. ZERO

 5 CENTROS = 2 VIZINHOS
 1 CENTRO = 1 VIZINHO

 TOTAL COBERTO = 28 NÚMEROS

 O TECLADO PERMANECE NORMAL.

 MANTIDOS:
 - 12 motores
 - Ranking AUTO
 - Ranking GEOMETRIA
 - Desempenho por posição
 - AUTO fixo 1º a 4º
 - AUTO 2º ⇄ 3º
 - AUTO MELHORES 2
 - AUTO UNIÃO
 - G1 normal
 - GALE 2ª RODADA
 - Ajuste fino
 - Jogador Virtual
 - WIN / LOSS / percentual
 - Últimas 14 jogadas
 - Linhas do tempo
 - Persistência
*/

const KEY="ANALISE_BETA_V43";

const OLD=[
"ANALISE_BETA_V42",
"ANALISE_BETA_V41",
"ANALISE_BETA_V40_UNIAO",
"ANALISE_BETA_V37_GEOMETRIA",
"ANALISE_BETA_V36"
];

const W=[
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const INDEX=new Map(
W.map((n,i)=>[n,i])
);

const MOTORS=[
"NORMAL",
"DINAMICO",
"RX_NORMAL",
"RX_DINAMICO"
];

const RX=[4,5,6];

const LABEL={
NORMAL:"NORMAL",
DINAMICO:"DINÂMICO",
RX_NORMAL:"RAIO-X NORMAL",
RX_DINAMICO:"RAIO-X DINÂMICO",
UNION:"AUTO UNIÃO"
};

const RED=new Set([
1,3,5,7,9,12,14,16,18,
19,21,23,25,27,30,32,34,36
]);

/*
 CLASSIFICAÇÃO DOS CENTROS

 Os centros são organizados
 seguindo a ordem física de
 cada setor francês.

 ZERO = apenas número 0.
*/

const SECTORS=[
{
name:"TIERS",
numbers:[
27,13,36,11,30,8,
23,10,5,24,16,33
]
},
{
name:"ÓRFÃOS",
numbers:[
17,34,6,1,20,14,31,9
]
},
{
name:"VOISINS",
numbers:[
22,18,29,7,28,12,35,3,
26,32,15,19,4,21,2,25
]
},
{
name:"ZERO",
numbers:[0]
}
];

const $=id=>document.getElementById(id);

const mod=n=>(n%37+37)%37;

const idx=n=>INDEX.get(n)??-1;

function dist(a,b){
const x=idx(a);
const y=idx(b);

if(x<0||y<0)return 99;

const d=Math.abs(x-y);

return Math.min(d,37-d);
}

function neigh(n,r){
return Array.from(
{length:r*2+1},
(_,i)=>W[mod(idx(n)+i-r)]
);
}

function dozen(n){
return n===0?0:n<=12?1:n<=24?2:3;
}

function color(n){
return n===0?"#087c48":
RED.has(n)?"#b9233b":"#171717";
}

function fmt(n){
return Number.isFinite(n)
?n.toFixed(2).replace(".",",")
:"—";
}

function pct(n){
return Number.isFinite(n)
?n.toFixed(1).replace(".",",")+"%"
:"—";
}

function clean(a){
return Array.isArray(a)
?a.map(Number).filter(n=>
Number.isInteger(n)&&n>=0&&n<=36
).slice(-20)
:[];
}

function matrix(f){
return Object.fromEntries(
MOTORS.map(m=>[
m,
Object.fromEntries(
RX.map(r=>[r,f()])
)
])
);
}

/* ESTADO */

function fresh(){
return {
history:[],

rank:3,
alternate:false,
nextRank:3,

best2:false,
bestTurn:0,

union:false,

fineG1:false,
galeSecond:false,

mode:"AUTO",
manual:"NORMAL",
rx:4,

seen:0,

positionRecords:[],
geometryRecords:[],

lines:{
AUTO:[],
UNION:[],
...matrix(()=>[])
},

pending:{
AUTO:null,
UNION:null,
...matrix(()=>null)
},

frozen:{
AUTO:null,
UNION:null,
...matrix(()=>null)
},

cards:[],
audit:null,

openCandidates:false,
openLines:false,
openVirtual:true
};
}

let s=fresh();

/* SALVAR E CARREGAR */

function load(){
try{
let raw=localStorage.getItem(KEY);

if(!raw){
for(const k of OLD){
raw=localStorage.getItem(k);

if(raw)break;
}
}

if(!raw)return;

const a=JSON.parse(raw);

s.history=clean(a.history);

s.rank=[1,2,3,4].includes(+a.rank)
?+a.rank:3;

s.alternate=!!a.alternate;

s.nextRank=[2,3].includes(+a.nextRank)
?+a.nextRank:3;

s.best2=!!a.best2;

s.bestTurn=+a.bestTurn===1?1:0;

s.union=!!a.union;

s.fineG1=!!a.fineG1;

s.galeSecond=!!a.galeSecond;

s.mode=a.mode||"AUTO";

s.manual=a.manual||"NORMAL";

s.rx=+a.rx||4;

s.seen=+a.seen||0;

s.positionRecords=
Array.isArray(a.positionRecords)
?a.positionRecords.slice(-2400):[];

s.geometryRecords=
Array.isArray(a.geometryRecords)
?a.geometryRecords.slice(-2400):[];

s.openCandidates=!!a.openCandidates;

s.openLines=!!a.openLines;

s.openVirtual=a.openVirtual??true;

if(a.lines){
for(const name of ["AUTO","UNION"]){
s.lines[name]=
Array.isArray(a.lines[name])
?a.lines[name].slice(-20):[];
}

for(const m of MOTORS){
for(const r of RX){
s.lines[m][r]=
Array.isArray(a.lines[m]?.[r])
?a.lines[m][r].slice(-20):[];
}
}
}

if(a.pending){
for(const name of ["AUTO","UNION"]){
s.pending[name]=a.pending[name]||null;
}

for(const m of MOTORS){
for(const r of RX){
s.pending[m][r]=
a.pending[m]?.[r]||null;
}
}
}

if(a.frozen){
for(const name of ["AUTO","UNION"]){
s.frozen[name]=a.frozen[name]||null;
}

for(const m of MOTORS){
for(const r of RX){
s.frozen[m][r]=
a.frozen[m]?.[r]||null;
}
}
}

s.cards=
Array.isArray(a.cards)
?a.cards.slice(-14):[];

s.audit=a.audit||null;

}catch(e){
console.warn("Erro ao carregar:",e);
}
}

function save(){
try{
localStorage.setItem(
KEY,
JSON.stringify(s)
);
}catch(e){
console.warn("Erro ao salvar:",e);
}
}

load();

/* ESTATÍSTICAS */

function stats(items){
const v=(items||[]).filter(x=>
!x.wait&&!x.sem&&
typeof x.hit==="boolean"
);

const wins=v.filter(x=>x.hit).length;

function rate(n){
const a=v.slice(-n);

return a.length
?100*a.filter(x=>x.hit).length/a.length
:0;
}

let consecutiveLosses=0;

for(let i=v.length-1;i>=0&&!v[i].hit;i--){
consecutiveLosses++;
}

return {
n:v.length,
wins,
losses:v.length-wins,

rate:v.length
?100*wins/v.length
:null,

r10:rate(10),
r20:rate(20),

consecutiveLosses
};
}

/* MAPA DE CALOR */

function heat(history,r){
const v=new Float64Array(37);

const decay={
4:.78,
5:.82,
6:.86
}[r];

let weight=1;

for(let i=history.length-1;i>=0;i--){
for(let j=0;j<37;j++){
const d=dist(history[i],W[j]);

if(d<=4){
v[j]+=
[1,.72,.44,.22,.1][d]*weight;
}
}

weight*=decay;
}

const max=Math.max(.001,...v);

return v.map(x=>x/max);
}

/* RAIO-X */

function rxMatch(history,r){
if(history.length<r*2+4)return null;

const current=history.slice(-r);

const samples=[];

for(let i=0;i+r<history.length-r;i++){
let score=0;

for(let k=0;k<r;k++){
score+=
(dozen(history[i+k])===dozen(current[k])
?.7:0)
+.3*(
1-dist(history[i+k],current[k])/19
);
}

samples.push({
n:history[i+r],
score:score/r,
index:i
});
}

samples.sort((a,b)=>
b.score-a.score||
b.index-a.index
);

const chosen=samples.slice(
0,
Math.max(
4,
Math.ceil(samples.length*.3)
)
);

const out=new Float64Array(37);

for(const x of chosen){
for(let j=0;j<37;j++){
const d=dist(x.n,W[j]);

if(d<=3){
out[j]+=
[1,.7,.42,.18][d]*
(.4+.6*x.score);
}
}
}

const max=Math.max(.001,...out);

return {
values:out.map(x=>x/max),

similarity:
chosen.reduce(
(t,x)=>t+x.score,0
)/Math.max(1,chosen.length)*100
};
}

/* PONTUAÇÃO DOS MOTORES */

function scores(history,m,r){
const recent=heat(history,r);

const rx=m.startsWith("RX")
?rxMatch(history,r)
:null;

if(m.startsWith("RX")&&!rx){
return null;
}

const out=new Float64Array(37);

for(let j=0;j<37;j++){
const n=W[j];

const z=r-3;

let near=0;

for(const h of history){
const d=dist(n,h);

near+=d<=3
?[1,.72,.4,.15][d]
:0;
}

let score=
(dozen(n)===z?.60:0)+
recent[j]*.48+
near/Math.max(1,history.length)*.6;

if(m.startsWith("RX")){
score=
score*.72+
rx.values[j]*.7;
}

if(m.includes("DINAMICO")){
const a=history.slice(-r);

let v=0;

for(let i=0;i<a.length;i++){
const d=dist(n,a[i]);

v+=(i+1)/a.length*
(d<=5?(6-d)/6:0);
}

score+=v*.12;
}

out[j]=score;
}

return {
out,
similarity:rx?.similarity||0
};
}

/* GEOMETRIA */

function makePlay(
centers5,
center3,
score=0
){
if(
!Array.isArray(centers5)||
centers5.length!==5||
!W.includes(center3)||
centers5.some(n=>!W.includes(n))||
new Set([
...centers5,
center3
]).size!==6
){
return null;
}

const blocks=[
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

const numbers=new Set(
blocks.flatMap(b=>b.nums)
);

if(numbers.size!==28){
return null;
}

for(let i=0;i<37;i++){
if(
!numbers.has(W[i])&&
numbers.has(W[mod(i-1)])&&
numbers.has(W[mod(i+1)])
){
return null;
}
}

return {
valid:true,

centers5:[...centers5],
center3,

blocks,
numbers,
score
};
}

/* OTIMIZADOR GEOMÉTRICO */

function optimize(weights,exact=false){
const p5=new Float64Array(37);
const p3=new Float64Array(37);

for(let c=0;c<37;c++){
for(let d=-2;d<=2;d++){
const factor=exact
?1
:d===0
?1.22
:Math.abs(d)===1
?1.08
:1;

p5[c]+=
weights[mod(c+d)]*factor;
}

for(let d=-1;d<=1;d++){
const factor=exact
?1
:d===0?1.22:1;

p3[c]+=
weights[mod(c+d)]*factor;
}
}

let best=null;

for(let start=0;start<37;start++){
for(let short=0;short<6;short++){
const sizes=[5,5,5,5,5,5];

sizes[short]=3;

const memo=new Map();

function solve(k,g){
if(k===6){
return g===9
?{score:0,gaps:[]}
:null;
}

const key=k+"|"+g;

if(memo.has(key)){
return memo.get(key);
}

let used=0;

for(let i=0;i<k;i++){
used+=sizes[i];
}

const center=mod(
start+
used+
g+
Math.floor(sizes[k]/2)
);

const value=sizes[k]===3
?p3[center]
:p5[center];

let winner=null;

for(let gap=0;gap<=9-g;gap++){
if(gap===1)continue;

const next=solve(
k+1,
g+gap
);

if(!next)continue;

const score=value+next.score;

if(
!winner||
score>winner.score
){
winner={
score,
gaps:[
gap,
...next.gaps
]
};
}
}

memo.set(key,winner);

return winner;
}

const result=solve(0,0);

if(!result)continue;

let cursor=start;

const centers5=[];

let center3=null;

for(let k=0;k<6;k++){
const center=W[
mod(
cursor+
Math.floor(sizes[k]/2)
)
];

if(sizes[k]===3){
center3=center;
}else{
centers5.push(center);
}

cursor+=
sizes[k]+result.gaps[k];
}

const candidate=makePlay(
centers5,
center3,
result.score
);

if(
candidate&&
(!best||
candidate.score>best.score)
){
best=candidate;
}
}
}

return best;
}

function geometry(weights){
return optimize(weights,false);
}

/* DESEMPENHO POR POSIÇÃO */

function performance(records){
const arr=[];

for(let p=1;p<=12;p++){
const items=records.filter(x=>
x.position===p
);

if(!items.length)continue;

const wins=items.filter(x=>
x.hit
).length;

arr.push({
position:p,
total:items.length,
wins,
rate:
100*wins/items.length
});
}

return arr.sort((a,b)=>
b.rate-a.rate||
b.total-a.total||
a.position-b.position
);
}

function autoPerformance(){
return performance(
s.positionRecords
);
}

function geoPerformance(){
return performance(
s.geometryRecords
);
}

function currentRank(){
if(s.best2){
const top=
autoPerformance().slice(0,2);

return top[s.bestTurn]?.position??
top[0]?.position??
3;
}

return s.alternate
?s.nextRank
:s.rank;
}

/* 12 MOTORES */

let cacheKey=null;
let cache=null;

function invalidate(){
cacheKey=null;
cache=null;
}

function calculate(){
const key=
s.history.join(",")+"|"+
MOTORS.flatMap(m=>
RX.map(r=>{
const t=stats(
s.lines[m][r]
);

return [
t.n,
t.r10,
t.r20,
t.consecutiveLosses
].join(":");
})
).join("|");

if(cacheKey===key&&cache){
return cache;
}

const configs=matrix(()=>null);

const ranking=[];

for(const m of MOTORS){
for(const r of RX){
const minimum=m.startsWith("RX")
?Math.max(14,r*2+4)
:Math.max(8,r+4);

if(s.history.length<minimum){
continue;
}

const v=scores(
s.history,
m,
r
);

if(!v)continue;

const play=geometry(v.out);

if(!play)continue;

const t=stats(
s.lines[m][r]
);

const autoScore=
play.score+
t.r10*.02+
t.r20*.01-
t.consecutiveLosses*.30+
v.similarity*.005;

const c={
motor:m,
rx:r,
valid:true,
play,
autoScore,
similarity:v.similarity
};

configs[m][r]=c;

ranking.push(c);
}
}

ranking.sort((a,b)=>
b.autoScore-a.autoScore||
MOTORS.indexOf(a.motor)-
MOTORS.indexOf(b.motor)||
a.rx-b.rx
);

ranking.forEach((c,i)=>{
c.rank=i+1;
});

const geometryRanking=
[...ranking].sort((a,b)=>
b.play.score-a.play.score||
a.rank-b.rank
);

geometryRanking.forEach((c,i)=>{
c.geometryRank=i+1;
});

cacheKey=key;

cache={
configs,
ranking,
geometryRanking
};

return cache;
}

/* AUTO UNIÃO */

function buildUnion(d){
if(!d.ranking.length){
return null;
}

const autoTop=
autoPerformance()[0];

const geoTop=
geoPerformance()[0];

const a=d.ranking[
(autoTop?.position||1)-1
];

const b=d.geometryRanking[
(geoTop?.position||1)-1
];

if(!a||!b)return null;

const A=a.play.numbers;
const B=b.play.numbers;

const intersection=new Set(
[...A].filter(n=>B.has(n))
);

const all=new Set([
...A,
...B
]);

const weights=
new Float64Array(37);

for(let i=0;i<37;i++){
const n=W[i];

weights[i]=all.has(n)
?1000+(
intersection.has(n)?1:0
)
:0;
}

const play=optimize(
weights,
true
);

if(!play)return null;

const covered=
[...all].filter(n=>
play.numbers.has(n)
);

const missing=
[...all].filter(n=>
!play.numbers.has(n)
);

const extra=
[...play.numbers].filter(n=>
!all.has(n)
);

return {
valid:true,
motor:"UNION",
rx:0,
play,

autoPosition:
autoTop?.position||1,

geoPosition:
geoTop?.position||1,

unionSize:all.size,
covered:covered.length,

missing,
extra
};
}

/* SNAPSHOTS */

function snapshot(c){
if(!c?.valid)return null;

return {
motor:c.motor,
rx:c.rx,

rank:c.rank,
geometryRank:c.geometryRank,

centers5:[
...c.play.centers5
],

center3:c.play.center3,

history:
s.history.join(","),

unionInfo:c.motor==="UNION"
?{
covered:c.covered,
unionSize:c.unionSize,
missing:[...c.missing]
}
:null
};
}

function snapPlay(x){
return x
?makePlay(
x.centers5||[],
x.center3
)
:null;
}

function check(n,play){
if(!play){
return {hit:false};
}

for(const b of play.blocks){
if(b.nums.includes(n)){
return {
hit:true,
center:b.center
};
}
}

return {hit:false};
}

/* AJUSTE FINO */

function tuneG1(original,miss){
const base=snapPlay(original);

if(!base)return original;

const candidates=[];

function add(p,type,shift){
if(!p)return;

const moved=
p.blocks.reduce(
(sum,b,i)=>
sum+dist(
b.center,
base.blocks[i].center
),
0
);

candidates.push({
p,
type,
shift,
moved
});
}

for(const b of base.blocks){
for(const shift of [-2,-1,1,2]){
const nc=W[
mod(
idx(b.center)+shift
)
];

const centers=
base.centers5.slice();

let short=base.center3;

if(b.r===1){
short=nc;
}else{
centers[
centers.indexOf(b.center)
]=nc;
}

add(
makePlay(
centers,
short
),
"SETOR",
shift
);
}
}

for(const shift of [-2,-1,1,2]){
const move=c=>W[
mod(idx(c)+shift)
];

add(
makePlay(
base.centers5.map(move),
move(base.center3)
),
"CONJUNTO",
shift
);
}

candidates.sort((a,b)=>
a.moved-b.moved||
Math.abs(a.shift)-
Math.abs(b.shift)
);

const chosen=candidates[0];

if(!chosen){
return {
...original,
g1:{
type:"ORIGINAL",
shift:0,
miss
}
};
}

return {
...original,

centers5:
chosen.p.centers5,

center3:
chosen.p.center3,

g1:{
type:chosen.type,
shift:chosen.shift,
miss
}
};
}

/* SELEÇÃO */

function autoSelected(d){
return d.ranking[
currentRank()-1
]||
d.ranking[
d.ranking.length-1
]||
null;
}

function selected(d){
if(s.mode==="MANUAL"){
return d.configs[
s.manual
]?.[s.rx]||null;
}

return s.union
?buildUnion(d)
:autoSelected(d);
}

function activeName(){
return s.union
?"UNION"
:"AUTO";
}

function activePending(){
return s.mode==="MANUAL"
?s.pending[s.manual][s.rx]
:s.pending[activeName()];
}

function activeFrozen(){
return s.mode==="MANUAL"
?s.frozen[s.manual][s.rx]
:s.frozen[activeName()];
}

function activeLines(){
return s.mode==="MANUAL"
?s.lines[s.manual][s.rx]
:s.lines[activeName()];
}

/* PREPARAR JOGADAS */

function prepare(d){
const key=
s.history.join(",");

if(
!s.frozen.AUTO&&
s.pending.AUTO?.history!==key
){
s.pending.AUTO=snapshot(
autoSelected(d)
);
}

if(
!s.frozen.UNION&&
s.pending.UNION?.history!==key
){
s.pending.UNION=snapshot(
buildUnion(d)
);
}

for(const m of MOTORS){
for(const r of RX){
if(
!s.frozen[m][r]&&
s.pending[m][r]?.history!==key
){
s.pending[m][r]=snapshot(
d.configs[m][r]
);
}
}
}
}

/* GALE NORMAL E SEGUNDA RODADA */

function evaluate(
n,
p,
freeze,
line,
key
){
line=line.slice(-20);

if(freeze){
if(
(freeze.skipRemaining||0)>0
){
return {
line,

freeze:{
...freeze,

skipRemaining:
freeze.skipRemaining-1,

skipped:[
...(freeze.skipped||[]),
n
]
},

pending:null,
done:false,
skipped:true
};
}

const hit=check(
n,
snapPlay(freeze)
).hit;

const i=line.findLastIndex(
x=>x.wait
);

const result={
n:line[i]?.n??n,
hit,
wait:false,
gale:n,

skipped:
freeze.skipped||[],

phase:hit
?"GALE"
:"LOSS",

galeSecond:
!!freeze.galeSecond
};

if(i>=0){
line[i]=result;
}else{
line.push(result);
}

return {
line:line.slice(-20),
freeze:null,
pending:null,
done:true,
hit,
phase:result.phase
};
}

if(
!p||
p.history!==key
){
line.push({
n,
sem:true,
phase:"SEM"
});

return {
line:line.slice(-20),
freeze:null,
pending:null,
done:false
};
}

const hit=check(
n,
snapPlay(p)
).hit;

if(hit){
line.push({
n,
hit:true,
phase:"WIN"
});

return {
line:line.slice(-20),
freeze:null,
pending:null,
done:true,
hit:true,
phase:"WIN"
};
}

line.push({
n,
wait:true,
phase:"AGUARDANDO"
});

const adjusted=s.fineG1
?tuneG1(p,n)
:{
...p,
g1:{
type:"ORIGINAL",
shift:0,
miss:n
}
};

return {
line:line.slice(-20),

freeze:{
...adjusted,

skipRemaining:
s.galeSecond?1:0,

skipped:[],

galeSecond:
s.galeSecond
},

pending:null,
done:false,
phase:"AGUARDANDO"
};
}

function updateLane(n,name){
const key=
s.history.join(",");

const a=evaluate(
n,
s.pending[name],
s.frozen[name],
s.lines[name],
key
);

s.lines[name]=a.line;
s.pending[name]=a.pending;
s.frozen[name]=a.freeze;

return a;
}

function updateAll(n){
const auto=
updateLane(n,"AUTO");

const union=
updateLane(n,"UNION");

if(auto.done){
if(s.alternate){
s.nextRank=
s.nextRank===3?2:3;

s.rank=s.nextRank;
}

if(s.best2){
s.bestTurn=
1-s.bestTurn;
}
}

for(const m of MOTORS){
for(const r of RX){
const key=
s.history.join(",");

const a=evaluate(
n,
s.pending[m][r],
s.frozen[m][r],
s.lines[m][r],
key
);

s.lines[m][r]=a.line;
s.pending[m][r]=a.pending;
s.frozen[m][r]=a.freeze;
}
}

return {
auto,
union
};
}

/* INSERIR NÚMERO */

function addNumber(n){
if(
!Number.isInteger(n)||
n<0||
n>36
){
return;
}

const d=calculate();

prepare(d);

const original=
activePending();

const frozen=
activeFrozen();

const wasGale=!!frozen;

const skipped=
wasGale&&
(frozen.skipRemaining||0)>0;

const result=check(
n,
snapPlay(
wasGale?frozen:original
)
);

s.seen++;

/*
 RANKING DAS POSIÇÕES:
 APENAS ENTRADAS NOVAS,
 NÃO RODADAS DE GALE AUTO.
*/

if(!s.frozen.AUTO){
for(const c of d.ranking){
const hit=check(
n,
c.play
).hit;

s.positionRecords.push({
position:c.rank,
hit
});

s.geometryRecords.push({
position:c.geometryRank,
hit
});
}

s.positionRecords=
s.positionRecords.slice(-2400);

s.geometryRecords=
s.geometryRecords.slice(-2400);
}

updateAll(n);

if(skipped){
const last=s.cards.at(-1);

if(
last&&
last.phase==="AGUARDANDO"
){
last.skipped=[
...(last.skipped||[]),
n
];
}

s.audit={
title:"GALE 2ª RODADA",

text:
"Número "+n+
" ignorado para WIN/LOSS."+
" Jogada permanece congelada."+
" O próximo número decide."
};

}else if(wasGale){
const last=s.cards.at(-1);

if(
last&&
last.phase==="AGUARDANDO"
){
last.gale=n;
last.hit=result.hit;

last.phase=result.hit
?"GALE"
:"LOSS";
}

s.audit={
title:result.hit
?"WIN NO GALE"
:"LOSS",

text:
"Resultado "+n+
" • "+
(result.hit?"WIN":"LOSS")+
" • Jogada encerrada."
};

}else{
s.cards.push({
n,
hit:result.hit,
sem:!original,

phase:!original
?"SEM"
:result.hit
?"WIN"
:"AGUARDANDO",

skipped:[]
});

s.audit={
title:!original
?"SEM JOGADA"
:result.hit
?"WIN NA ENTRADA"
:"AGUARDANDO GALE",

text:!original
?"Não existe configuração válida."
:result.hit
?"Número "+n+
" coberto na entrada."
:"Número "+n+
" não coberto. "+
(s.galeSecond
?"Próxima rodada ignorada."
:"Próxima rodada decide.")
};
}

s.cards=s.cards.slice(-14);

s.history=clean([
...s.history,
n
]);

invalidate();
save();
render();
}

/* CONTROLES */

function resetResults(){
const a=fresh();

s.seen=0;

s.positionRecords=[];
s.geometryRecords=[];

s.lines=a.lines;
s.pending=a.pending;
s.frozen=a.frozen;

s.cards=[];
s.audit=null;

s.nextRank=3;
s.bestTurn=0;

invalidate();
}

function setRank(n){
s.rank=n;

s.alternate=false;
s.best2=false;
s.union=false;

s.mode="AUTO";

if(!s.frozen.AUTO){
s.pending.AUTO=null;
}

invalidate();
save();
render();
}

function toggleAlternate(){
s.alternate=!s.alternate;

s.best2=false;
s.union=false;

s.mode="AUTO";

if(s.alternate){
s.nextRank=3;
s.rank=3;
}

invalidate();
save();
render();
}

function toggleBest2(){
s.best2=!s.best2;

s.alternate=false;
s.union=false;

s.mode="AUTO";
s.bestTurn=0;

invalidate();
save();
render();
}

function toggleUnion(){
s.union=!s.union;

if(s.union){
s.best2=false;
s.alternate=false;
}

s.mode="AUTO";

invalidate();
save();
render();
}

function toggleFine(){
s.fineG1=!s.fineG1;

save();
render();
}

function toggleSecond(){
s.galeSecond=!s.galeSecond;

save();
render();
}

function setMode(m,r){
s.mode=m==="AUTO"
?"AUTO"
:"MANUAL";

if(m!=="AUTO"){
s.manual=m;
s.rx=r;
}

save();
render();
}

function insert(){
const nums=(
$("inputHistory").value.match(/\d+/g)||[]
)
.map(Number)
.filter(n=>n>=0&&n<=36);

if(!nums.length)return;

s.history=clean(nums);

resetResults();

$("inputHistory").value="";

save();
render();
}

function undo(){
if(!s.history.length)return;

s.history.pop();

resetResults();

save();
render();
}

function clear(){
if(
!confirm(
"Apagar histórico e estatísticas?"
)
){
return;
}

s.history=[];

resetResults();

save();
render();
}

/* ESTILO */

const css=`
*{
box-sizing:border-box
}

body{
margin:0;
background:#101014;
color:white;
font-family:Arial,sans-serif
}

.app{
max-width:980px;
margin:auto;
padding:9px
}

h2{
text-align:center;
font-size:20px;
margin:14px 0
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
font-weight:bold;
cursor:pointer
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
font-weight:bold;
cursor:pointer
}

.btn.selected{
background:#087b99;
border:2px solid #00d9ff
}

.btn.union{
background:#5a347d;
border-color:#a973e4
}

.btn.union.selected{
background:#7837a9;
border-color:#d89cff
}

.rankButtons{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:6px
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
margin:10px 0
}

/*
 SEIS CENTROS:
 QUADRO PRINCIPAL
*/

.grid6{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:5px
}

.center{
padding:12px 0;
border-radius:8px;
text-align:center;
background:#006fa7;
border:2px solid #00cfff;
font-size:23px;
font-weight:bold
}

.center.short{
background:#b98c0b;
border-color:#ffe078;
color:#111
}

/*
 SEIS CENTROS ORDENADOS
 POR SETOR FRANCÊS
*/

.centersGroup{
border:1px solid #424b5b;
border-radius:8px;
margin:9px 0;
overflow:hidden
}

.centersGroupTitle{
background:#303746;
padding:8px 10px;
display:flex;
justify-content:space-between;
font-size:11px;
font-weight:bold
}

.centersGroupNumbers{
display:flex;
gap:7px;
padding:9px;
flex-wrap:wrap;
min-height:57px;
align-items:center
}

.centerTile{
width:55px;
height:51px;
border-radius:8px;
display:flex;
align-items:center;
justify-content:center;
flex-direction:column;
font-size:21px;
font-weight:bold;
background:#006fa7;
border:2px solid #00cfff;
color:white
}

.centerTile.short{
background:#b98c0b;
border-color:#ffe078;
color:#111
}

.centerTile small{
font-size:8px;
font-weight:bold
}

.centerTile.zero{
background:#087c48
}

.centerTile.zero.short{
background:#b98c0b
}

.centerEmpty{
font-size:10px;
color:#8493a5
}

/* TECLADO */

.keys{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:5px
}

.key{
height:43px;
color:white;
border:1px solid #666;
border-radius:7px;
font-weight:bold;
cursor:pointer
}

.key.zero{
grid-column:span 6
}

/* LINHAS */

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

.mark.good{
background:#009d55
}

.mark.bad{
background:#b82b39
}

.mark.gale{
background:#ffcc22;
color:#111
}

.mark.wait{
background:#6c5818
}

/* ÚLTIMAS JOGADAS */

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

/* ESTATÍSTICAS */

.metrics{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:6px;
margin:10px 0
}

.metric{
background:#111b25;
border:1px solid #3a5368;
border-radius:8px;
padding:10px 4px;
text-align:center
}

.metric strong{
display:block;
font-size:21px;
color:#00dcff
}

.metric small{
font-size:9px;
color:#b4bfce
}

.positionBox{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:6px;
margin:10px 0
}

.positionCard{
background:#102b36;
border:1px solid #00a7c7;
border-radius:8px;
padding:9px;
text-align:center;
font-size:11px
}

.positionCard strong{
display:block;
font-size:21px;
color:#00e5ff;
margin:5px
}

.positionCard small{
font-size:9px;
color:#b4bfce
}

.audit{
padding:11px;
background:#101820;
border:1px solid #36536b;
border-radius:7px;
font-size:12px;
line-height:1.7
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

.summary{
font-size:11px;
color:#00e5ff;
margin:7px 0;
font-weight:bold
}

.switches{
display:flex;
gap:6px;
flex-wrap:wrap;
margin:8px 0
}

.switches button{
flex:1;
min-width:130px
}

.coverage{
font-size:11px;
line-height:1.8;
background:#21172c;
border:1px solid #9d64ca;
padding:9px;
border-radius:8px
}

@media(max-width:600px){
.history{
grid-template-columns:repeat(4,1fr)
}

.metrics{
grid-template-columns:repeat(2,1fr)
}

.center{
font-size:19px
}

.centerTile{
width:49px;
height:49px
}

.mark{
min-width:14px
}
}
`;

/* INTERFACE */

document.body.innerHTML=`
<style>${css}</style>

<main class="app">

<h2>ANÁLISE BETA V4.3</h2>

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
POSIÇÃO FIXA AUTO
</div>

<div class="rankButtons" id="rankButtons"></div>

<div class="switches">

<button class="btn" id="alternate">
AUTO 2º ⇄ 3º
</button>

<button class="btn" id="best2">
AUTO MELHORES 2
</button>

<button class="btn union" id="union">
AUTO UNIÃO
</button>

<button class="btn" id="fine">
G1 AJUSTE FINO
</button>

<button class="btn" id="second">
GALE 2ª RODADA
</button>

</div>

<div class="small" id="modeInfo"></div>

<div id="candidatePanel" class="hidden">

<div id="motorButtons"></div>

<div class="accent">
RANKING AUTO
</div>

<div id="candidates"></div>

<div class="accent">
RANKING GEOMETRIA
</div>

<div id="geometryRanking"></div>

</div>

</section>

<section class="panel">

<div class="accent" id="playLabel">
JOGADA ATUAL
</div>

<div class="small">
6 CENTROS DA JOGADA
</div>

<div class="grid6" id="play"></div>

<div class="small" id="g1Info"></div>

</section>

<section class="panel">

<div class="accent">
CENTROS PARA JOGAR — ORDEM CORRETA
</div>

<div class="small">
TIERS → ÓRFÃOS → VOISINS → ZERO
</div>

<div id="orderedCenters"></div>

<div class="summary" id="centersCount"></div>

</section>

<section class="panel">

<div class="accent">
RESULTADOS DA JOGADA
</div>

<div class="metrics" id="metrics"></div>

</section>

<section class="panel">

<button class="head" id="toggleLines">
LINHAS DO TEMPO
<span id="arrowLines">+</span>
</button>

<div id="autoSummary" class="summary"></div>

<div id="autoLine"></div>
<div id="unionLine"></div>

<div id="otherLines" class="hidden"></div>

</section>

<section class="panel">

<div class="accent">
ÚLTIMAS 14 JOGADAS
</div>

<div class="history" id="cards"></div>

</section>

<section class="panel">

<div class="accent">
TECLADO DE RESULTADOS
</div>

<div class="keys" id="keys"></div>

</section>

<section class="panel">

<button class="head" id="toggleVirtual">
JOGADOR VIRTUAL
<span id="arrowVirtual">−</span>
</button>

<div id="virtualContent">

<div class="accent">
2 MELHORES DESEMPENHOS AUTO
</div>

<div class="positionBox" id="autoPerformance"></div>

<div class="accent">
2 MELHORES DESEMPENHOS GEOMETRIA
</div>

<div class="positionBox" id="geoPerformance"></div>

<div class="accent">
DESEMPENHO DOS MOTORES
</div>

<div id="motorPerformance"></div>

<div class="accent">
COBERTURA AUTO UNIÃO
</div>

<div class="coverage" id="unionCoverage"></div>

<div class="accent">
AUDITORIA
</div>

<div class="audit" id="audit"></div>

</div>

</section>

</main>
`;

/* EVENTOS */

$("insert").onclick=insert;

$("undo").onclick=undo;

$("clear").onclick=clear;

$("alternate").onclick=
toggleAlternate;

$("best2").onclick=
toggleBest2;

$("union").onclick=
toggleUnion;

$("fine").onclick=
toggleFine;

$("second").onclick=
toggleSecond;

$("auto").onclick=()=>
setMode("AUTO");

$("toggleCandidates").onclick=()=>{
s.openCandidates=
!s.openCandidates;

save();
render();
};

$("toggleLines").onclick=()=>{
s.openLines=!s.openLines;

save();
render();
};

$("toggleVirtual").onclick=()=>{
s.openVirtual=
!s.openVirtual;

save();
render();
};

/* TECLADO NORMAL */

for(let n=1;n<=36;n++){
const b=document.createElement(
"button"
);

b.className="key";

b.textContent=n;

b.style.background=color(n);

b.onclick=()=>addNumber(n);

$("keys").appendChild(b);
}

const zero=document.createElement(
"button"
);

zero.className="key zero";

zero.textContent="0";

zero.style.background=color(0);

zero.onclick=()=>addNumber(0);

$("keys").appendChild(zero);

/* POSIÇÕES */

for(let n=1;n<=4;n++){
const b=document.createElement(
"button"
);

b.className="btn";

b.id="rank"+n;

b.textContent=n+"º";

b.onclick=()=>setRank(n);

$("rankButtons").appendChild(b);
}

/* MOTORES */

for(const m of MOTORS){
const div=document.createElement(
"div"
);

div.className="row";

const title=document.createElement(
"strong"
);

title.className="small";

title.style.width="100%";

title.textContent=LABEL[m];

div.appendChild(title);

for(const r of RX){
const b=document.createElement(
"button"
);

b.className="btn";

b.id="motor"+m+r;

b.textContent="C"+r;

b.onclick=()=>setMode(m,r);

div.appendChild(b);
}

$("motorButtons").appendChild(div);
}

/*
 =================================
 CORREÇÃO DOS 6 CENTROS
 =================================

 Recebe os 6 centros escolhidos
 pelo algoritmo.

 NÃO reorganiza os 28 números.

 NÃO altera os centros.

 NÃO altera a cobertura.

 Classifica somente os centros
 por Tiers, Órfãos, Voisins, Zero.

 Dentro de cada setor, segue
 a ordem física definida acima.
*/

function orderedCenterBlocks(play){
if(!play)return [];

const ordered=[];

for(const sector of SECTORS){
for(const number of sector.numbers){
const block=play.blocks.find(
b=>b.center===number
);

if(block){
ordered.push({
...block,
sector:sector.name
});
}
}
}

return ordered;
}

function renderOrderedCenters(play){
if(!play){
$("orderedCenters").innerHTML=
'<div class="small">Aguardando jogada válida.</div>';

$("centersCount").textContent=
"0 de 6 centros";

return;
}

const ordered=
orderedCenterBlocks(play);

$("orderedCenters").innerHTML=
SECTORS.map(sector=>{
const blocks=ordered.filter(
b=>b.sector===sector.name
);

const tiles=blocks.map(b=>`
<div
class="centerTile ${
b.r===1?"short":""
} ${
b.center===0?"zero":""
}"
title="${
b.center
}: ${
b.nums.join(", ")
}"
>
${b.center}

<small>
${b.r===1?"1 V":"2 V"}
</small>

</div>
`).join("");

return `
<div class="centersGroup">

<div class="centersGroupTitle">

<span>${sector.name}</span>

<span>
${blocks.length}
${blocks.length===1
?" CENTRO"
:" CENTROS"}
</span>

</div>

<div class="centersGroupNumbers">

${tiles||
'<span class="centerEmpty">SEM CENTROS NESTE SETOR</span>'}

</div>

</div>
`;
}).join("");

$("centersCount").textContent=
ordered.length+
" de 6 centros organizados • "+
"28 números de cobertura";
}

/* LINHAS DO TEMPO */

function lineHtml(name,items){
const t=stats(items);

const marks=items.slice(-20).map(x=>{
const cls=
x.sem?""
:x.wait?"wait"
:x.phase==="GALE"?"gale"
:x.hit?"good"
:"bad";

const label=
x.sem?"—"
:x.wait?"…"
:x.phase==="GALE"?"G"
:x.hit?"W"
:"L";

return `
<span class="mark ${cls}">
${label}
</span>
`;
}).join("");

return `
<div class="line">

<b>${name}</b>

<div class="marks">
${marks}
</div>

<b>
${t.n
?Math.round(t.r20)+"%"
:"—"}
</b>

</div>
`;
}

/* DESEMPENHO */

function performanceHtml(items,type){
if(!items.length){
return '<div class="small">Aguardando resultados.</div>';
}

return items.slice(0,2).map((x,i)=>`
<div class="positionCard">

<small>
${i+1}º DESEMPENHO ${type}
</small>

<strong>
${x.position}ª POSIÇÃO
</strong>

${pct(x.rate)}

<small style="display:block">
${x.wins} WIN /
${x.total} observações
</small>

</div>
`).join("");
}

/* MÉTRICAS */

function metricsHtml(t){
return `
<div class="metric">
<strong>${t.wins}</strong>
<small>WIN TOTAL</small>
</div>

<div class="metric">
<strong>${t.losses}</strong>
<small>LOSS REAL</small>
</div>

<div class="metric">
<strong>${pct(t.rate)}</strong>
<small>ASSERTIVIDADE</small>
</div>

<div class="metric">
<strong>${t.n}</strong>
<small>CONCLUÍDAS</small>
</div>
`;
}

/* JOGADOR VIRTUAL */

function motorPerformanceHtml(d){
return d.ranking.map(c=>{
const t=stats(
s.lines[c.motor][c.rx]
);

return `
<div class="candidate">

<b>${c.rank}º AUTO</b>

• ${LABEL[c.motor]} C${c.rx}

• GEOMETRIA ${c.geometryRank}º

• WIN ${t.wins}

• LOSS ${t.losses}

• ${pct(t.rate)}

</div>
`;
}).join("")||
'<div class="small">Aguardando motores.</div>';
}

/* RENDER */

function render(){
const d=calculate();

prepare(d);

const u=buildUnion(d);

const cfg=selected(d);

const freeze=activeFrozen();

const play=freeze
?snapPlay(freeze)
:cfg?.play;

const t=stats(
activeLines()
);

$("status").textContent=
s.history.length+
"/20 números • "+
d.ranking.length+
"/12 motores • "+
"28 cobertos / 9 descobertos";

$("autoLabel").textContent=
s.mode==="MANUAL"
?LABEL[s.manual]+" C"+s.rx
:s.union
?"AUTO UNIÃO • DESEMPENHO + GEOMETRIA"
:cfg
?LABEL[cfg.motor]+" C"+cfg.rx+
" • AUTO "+cfg.rank+"º"
:"AGUARDANDO MOTORES";

$("auto").classList.toggle(
"selected",
s.mode==="AUTO"
);

$("alternate").classList.toggle(
"selected",
s.alternate
);

$("best2").classList.toggle(
"selected",
s.best2
);

$("union").classList.toggle(
"selected",
s.union
);

$("fine").classList.toggle(
"selected",
s.fineG1
);

$("second").classList.toggle(
"selected",
s.galeSecond
);

for(let n=1;n<=4;n++){
$("rank"+n).classList.toggle(
"selected",

!s.union&&
!s.best2&&
!s.alternate&&
s.rank===n
);
}

for(const m of MOTORS){
for(const r of RX){
$("motor"+m+r).classList.toggle(
"selected",

s.mode==="MANUAL"&&
s.manual===m&&
s.rx===r
);
}
}

$("modeInfo").textContent=
(s.union
?"AUTO UNIÃO ATIVO"
:s.best2
?"AUTO MELHORES 2 ATIVO"
:s.alternate
?"AUTO 2º ⇄ 3º ATIVO"
:"AUTO FIXO "+s.rank+"º")+
" • "+
(s.galeSecond
?"GALE NA 2ª RODADA"
:"GALE NORMAL")+
" • "+
(s.fineG1
?"AJUSTE FINO LIGADO"
:"AJUSTE FINO DESLIGADO");

$("candidatePanel").classList.toggle(
"hidden",
!s.openCandidates
);

$("arrowCandidates").textContent=
s.openCandidates?"−":"+";

$("candidates").innerHTML=
d.ranking.map(c=>`
<div class="candidate">

<b>${c.rank}º AUTO</b>

• ${LABEL[c.motor]} C${c.rx}

• SCORE ${fmt(c.autoScore)}

</div>
`).join("");

$("geometryRanking").innerHTML=
d.geometryRanking.map(c=>`
<div class="candidate">

<b>${c.geometryRank}º GEOMETRIA</b>

• ${LABEL[c.motor]} C${c.rx}

• PESO ${fmt(c.play.score)}

• AUTO ${c.rank}º

</div>
`).join("");

$("playLabel").textContent=freeze
?"GALE CONGELADO • "+
(freeze.motor==="UNION"
?"AUTO UNIÃO"
:LABEL[freeze.motor]+" C"+freeze.rx)
:s.union&&s.mode==="AUTO"
?"JOGADA AUTO UNIÃO"
:cfg
?"JOGADA • "+LABEL[cfg.motor]+" C"+cfg.rx
:"AGUARDANDO JOGADA";

/*
 QUADRO SUPERIOR:
 TAMBÉM MOSTRA OS 6 CENTROS
 NA ORDEM CORRETA.
*/

const ordered=
orderedCenterBlocks(play);

$("play").innerHTML=
ordered.map(b=>`
<div
class="center ${
b.r===1?"short":""
}"
title="${
b.sector
} • ${
b.nums.join(", ")
}"
>
${b.center}
</div>
`).join("");

$("g1Info").textContent=freeze
?(
(freeze.skipRemaining||0)>0
?"GALE CONGELADO • PRÓXIMO RESULTADO IGNORADO"
:"GALE CONGELADO • PRÓXIMO RESULTADO DECIDE"
)
:"AZUL: 2 VIZINHOS • AMARELO: 1 VIZINHO";

/*
 QUADRO PRINCIPAL CORRIGIDO:
 APENAS OS 6 CENTROS.
*/

renderOrderedCenters(play);

/* RESULTADOS */

$("metrics").innerHTML=
metricsHtml(t);

const ta=stats(
s.lines.AUTO
);

const tu=stats(
s.lines.UNION
);

$("autoSummary").textContent=
"AUTO: "+
ta.wins+" WIN / "+
ta.losses+" LOSS • "+
pct(ta.rate)+
" | UNIÃO: "+
tu.wins+" WIN / "+
tu.losses+" LOSS • "+
pct(tu.rate)+
" | VISTOS: "+
s.seen;

$("autoLine").innerHTML=
lineHtml(
"AUTO",
s.lines.AUTO
);

$("unionLine").innerHTML=
lineHtml(
"UNIÃO",
s.lines.UNION
);

$("otherLines").classList.toggle(
"hidden",
!s.openLines
);

$("arrowLines").textContent=
s.openLines?"−":"+";

$("otherLines").innerHTML=
MOTORS.map(m=>
'<div class="small">'+
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

$("cards").innerHTML=
s.cards.map(x=>{
const border=
x.phase==="GALE"
?"#ffcc22"
:x.hit
?"#00bd68"
:x.phase==="LOSS"
?"#f04a5d"
:"#777";

const label=
x.phase==="GALE"
?"WIN G"
:x.phase==="WIN"
?"WIN"
:x.phase==="LOSS"
?"LOSS"
:x.phase==="AGUARDANDO"
?"GALE..."
:"SEM";

return `
<span style="
background:${color(x.n)};
border-color:${border}
">

${x.n}

<small style="display:block">
${label}
</small>

${x.gale!=null
?'<small style="display:block">G: '+x.gale+'</small>'
:""}

${x.skipped?.length
?'<small style="display:block">P: '+x.skipped.join(",")+'</small>'
:""}

</span>
`;
}).join("");

/* JOGADOR VIRTUAL */

$("autoPerformance").innerHTML=
performanceHtml(
autoPerformance(),
"AUTO"
);

$("geoPerformance").innerHTML=
performanceHtml(
geoPerformance(),
"GEOMETRIA"
);

$("motorPerformance").innerHTML=
motorPerformanceHtml(d);

$("unionCoverage").innerHTML=u
?`
<b>UNIÃO OTIMIZADA</b>

<div>
APROVEITADOS:
${u.covered} de ${u.unionSize}
</div>

<div>
FORA DA UNIÃO:
${u.missing.length}
</div>

<div>
CASAS ADICIONAIS:
${u.extra.length}
</div>

<div>
COBERTURA FINAL:
28 NÚMEROS
</div>
`
:"Aguardando configuração da união.";

$("audit").textContent=s.audit
?s.audit.title+
" — "+
s.audit.text
:"Aguardando resultado.";

$("virtualContent").classList.toggle(
"hidden",
!s.openVirtual
);

$("arrowVirtual").textContent=
s.openVirtual?"−":"+";

save();
}

render();

})();
