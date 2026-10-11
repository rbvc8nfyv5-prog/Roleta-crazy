
(function(){
"use strict";

/*
 ANÁLISE BETA V4.0 — AUTO UNIÃO

 MANTÉM:
 12 motores
 AUTO fixo 1º–4º
 AUTO 2º ⇄ 3º
 AUTO MELHORES 2
 Ranking de desempenho AUTO
 Ranking de desempenho GEOMETRIA
 Ranking por peso geométrico
 G1 congelado
 Ajuste fino G1
 Histórico, teclado e linhas do tempo

 NOVO:
 AUTO UNIÃO
 - pega a jogada da melhor posição por
   desempenho AUTO
 - pega a jogada da melhor posição por
   desempenho GEOMETRIA
 - constrói uma TERCEIRA jogada
 - maximiza a cobertura da união
 - prioriza números comuns às duas
 - mantém exatamente 28 números únicos
 - mostra aproveitamento e exclusões
 - possui G1 e resultados próprios

 Observação: nenhuma configuração de
 28 números garante resultados futuros.
*/

const KEY="ANALISE_BETA_V40_UNIAO";

const OLD=[
"ANALISE_BETA_V38_GEOMETRIA_DESEMPENHO",
"ANALISE_BETA_V37_GEOMETRIA",
"ANALISE_BETA_V36"
];

const W=[
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const INDEX=new Map(W.map((n,i)=>[n,i]));

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
RX_DINAMICO:"RAIO-X DINÂMICO"
};

const RED=new Set([
1,3,5,7,9,12,14,16,18,
19,21,23,25,27,30,32,34,36
]);

const $=id=>document.getElementById(id);
const mod=n=>(n%37+37)%37;
const idx=n=>INDEX.get(n)??-1;

function dist(a,b){
const d=Math.abs(idx(a)-idx(b));
return Math.min(d,37-d);
}

function neigh(n,r){
return Array.from(
{length:2*r+1},
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

mode:"AUTO",
manual:"NORMAL",
rx:4,

seen:0,
autoWins:0,
autoLosses:0,

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
s.bestTurn=a.bestTurn===1?1:0;
s.union=!!a.union;
s.fineG1=!!a.fineG1;

s.mode=a.mode||"AUTO";
s.manual=a.manual||"NORMAL";
s.rx=+a.rx||4;

s.seen=+a.seen||0;
s.autoWins=+a.autoWins||0;
s.autoLosses=+a.autoLosses||0;

s.positionRecords=Array.isArray(a.positionRecords)
?a.positionRecords.slice(-1200):[];

s.geometryRecords=Array.isArray(a.geometryRecords)
?a.geometryRecords.slice(-1200):[];

s.openCandidates=!!a.openCandidates;
s.openLines=!!a.openLines;
s.openVirtual=a.openVirtual??true;

if(a.lines){
for(const k of ["AUTO","UNION"]){
s.lines[k]=Array.isArray(a.lines[k])
?a.lines[k].slice(-20):[];
}

for(const m of MOTORS){
for(const r of RX){
s.lines[m][r]=Array.isArray(a.lines[m]?.[r])
?a.lines[m][r].slice(-20):[];
}
}
}

if(a.pending){
s.pending.AUTO=a.pending.AUTO||null;
s.pending.UNION=a.pending.UNION||null;

for(const m of MOTORS){
for(const r of RX){
s.pending[m][r]=a.pending[m]?.[r]||null;
}
}
}

if(a.frozen){
s.frozen.AUTO=a.frozen.AUTO||null;
s.frozen.UNION=a.frozen.UNION||null;

for(const m of MOTORS){
for(const r of RX){
s.frozen[m][r]=a.frozen[m]?.[r]||null;
}
}
}

s.cards=Array.isArray(a.cards)
?a.cards.slice(-14):[];

s.audit=a.audit||null;

}catch(e){
console.warn("Erro ao carregar:",e);
}
}

function save(){
try{
localStorage.setItem(KEY,JSON.stringify(s));
}catch(e){
console.warn(e);
}
}

load();

/* ESTATÍSTICAS */

function stats(a){
const v=(a||[]).filter(x=>
!x.wait&&!x.sem&&
typeof x.hit==="boolean"
);

function rate(n){
const b=v.slice(-n);

return b.length
?100*b.filter(x=>x.hit).length/b.length
:0;
}

let losses=0;

for(let i=v.length-1;i>=0&&!v[i].hit;i--){
losses++;
}

return {
n:v.length,
wins:v.filter(x=>x.hit).length,
r10:rate(10),
r20:rate(20),
losses
};
}

/* MAPA DE CALOR */

function heat(history,r){
const v=new Float64Array(37);
const decay={4:.78,5:.82,6:.86}[r];

let weight=1;

for(let i=history.length-1;i>=0;i--){
for(let j=0;j<37;j++){
const d=dist(history[i],W[j]);

if(d<=4){
v[j]+=[1,.72,.44,.22,.1][d]*weight;
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
+.3*(1-dist(history[i+k],current[k])/19);
}

samples.push({
n:history[i+r],
score:score/r
});
}

samples.sort((a,b)=>b.score-a.score);

const chosen=samples.slice(
0,
Math.max(4,Math.ceil(samples.length*.3))
);

const out=new Float64Array(37);

for(const x of chosen){
for(let j=0;j<37;j++){
const d=dist(x.n,W[j]);

if(d<=3){
out[j]+=[1,.7,.42,.18][d]*
(.4+.6*x.score);
}
}
}

const max=Math.max(.001,...out);

return {
values:out.map(x=>x/max),
similarity:
chosen.reduce((t,x)=>t+x.score,0)/
Math.max(1,chosen.length)*100
};
}

/* PONTUAÇÃO DOS MOTORES */

function scores(history,m,r){
const recent=heat(history,r);

const rx=m.startsWith("RX")
?rxMatch(history,r):null;

if(m.startsWith("RX")&&!rx)return null;

const out=new Float64Array(37);

for(let j=0;j<37;j++){
const n=W[j];
const z=r-3;

let near=0;

for(const h of history){
const d=dist(n,h);
near+=d<=3?[1,.72,.4,.15][d]:0;
}

let score=
(dozen(n)===z?.60:0)+
recent[j]*.48+
near/Math.max(1,history.length)*.6;

if(m.startsWith("RX")){
score=score*.72+rx.values[j]*.7;
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

/*
 VALIDAÇÃO DA JOGADA

 5 setores de 5 números
 1 setor de 3 números

 28 números únicos.

 As lacunas descobertas não podem
 ser isoladas entre dois setores.
*/

function makePlay(centers5,center3,score=0){
if(
!Array.isArray(centers5)||
centers5.length!==5||
!W.includes(center3)||
centers5.some(n=>!W.includes(n))||
new Set([...centers5,center3]).size!==6
)return null;

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

if(numbers.size!==28)return null;

for(let i=0;i<37;i++){
if(
!numbers.has(W[i])&&
numbers.has(W[mod(i-1)])&&
numbers.has(W[mod(i+1)])
)return null;
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

/*
 OTIMIZADOR FÍSICO GENÉRICO

 Recebe 37 pesos, um para cada casa.

 Testa:
 - 37 posições iniciais
 - 6 possibilidades de setor curto
 - distribuições de 9 lacunas

 A programação dinâmica busca o melhor
 conjunto de 28 números respeitando
 os setores e a não sobreposição.

 Esse otimizador serve tanto para
 geometria original quanto para UNIÃO.
*/

function optimize(weights){
const p5=new Float64Array(37);
const p3=new Float64Array(37);

for(let c=0;c<37;c++){
for(let d=-2;d<=2;d++){
p5[c]+=weights[mod(c+d)]*
(d===0?1.22:Math.abs(d)===1?1.08:1);
}

for(let d=-1;d<=1;d++){
p3[c]+=weights[mod(c+d)]*
(d===0?1.22:1);
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
?{value:0,gaps:[]}
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
start+used+g+Math.floor(sizes[k]/2)
);

const val=sizes[k]===3
?p3[center]:p5[center];

let win=null;

for(let gap=0;gap<=9-g;gap++){
if(gap===1)continue;

const next=solve(k+1,g+gap);
if(!next)continue;

const total=val+next.value;

if(!win||total>win.value){
win={
value:total,
gaps:[gap,...next.gaps]
};
}
}

memo.set(key,win);
return win;
}

const result=solve(0,0);

if(
!result||
(best&&result.value<=best.value)
)continue;

let cursor=start;
const centers5=[];
let center3=null;

for(let k=0;k<6;k++){
const center=W[
mod(cursor+Math.floor(sizes[k]/2))
];

if(sizes[k]===3){
center3=center;
}else{
centers5.push(center);
}

cursor+=sizes[k]+result.gaps[k];
}

best={
value:result.value,
centers5,
center3
};
}
}

return best
?makePlay(best.centers5,best.center3,best.value)
:null;
}

/* GEOMETRIA ORIGINAL */

function geometry(weights){
return optimize(weights);
}

/*
 RANKING DE DESEMPENHO

 São posições, não motores fixos.

 Exemplo:
 A posição geométrica 8 pode ser
 1ª em desempenho histórico.
*/

function performance(records){
const arr=[];

for(let p=1;p<=12;p++){
const items=records.filter(x=>
x.position===p
);

if(!items.length)continue;

const wins=items.filter(x=>x.hit).length;

arr.push({
position:p,
total:items.length,
wins,
rate:100*wins/items.length
});
}

return arr.sort((a,b)=>
b.rate-a.rate||
b.total-a.total||
a.position-b.position
);
}

function autoPerformance(){
return performance(s.positionRecords);
}

function geoPerformance(){
return performance(s.geometryRecords);
}

function currentRank(){
if(s.best2){
const top=autoPerformance().slice(0,2);

return top[s.bestTurn]?.position??
top[0]?.position??3;
}

return s.alternate?s.nextRank:s.rank;
}

/* RANKING DOS 12 MOTORES */

let cacheKey=null;
let cache=null;

function invalidate(){
cacheKey=null;
cache=null;
}

function calculate(){
const key=s.history.join(",")+"|"+
MOTORS.flatMap(m=>RX.map(r=>{
const t=stats(s.lines[m][r]);

return [
t.n,t.r10,t.r20,t.losses
].join(":");
})).join("|");

if(cacheKey===key&&cache)return cache;

const configs=matrix(()=>null);
const ranking=[];

for(const m of MOTORS){
for(const r of RX){
const minimum=m.startsWith("RX")
?Math.max(14,r*2+4)
:Math.max(8,r+4);

if(s.history.length<minimum)continue;

const v=scores(s.history,m,r);
if(!v)continue;

const play=geometry(v.out);
if(!play)continue;

const t=stats(s.lines[m][r]);

const autoScore=
play.score+
t.r10*.02+
t.r20*.01-
t.losses*.30+
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

const geometryRanking=[...ranking].sort(
(a,b)=>
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

/*
 AUTO UNIÃO REAL

 Fonte A:
 configuração da posição com melhor
 desempenho histórico AUTO.

 Fonte B:
 configuração da posição com melhor
 desempenho histórico GEOMÉTRICO.

 Caso ainda não haja amostras, usa
 provisoriamente a 1ª posição de
 cada ranking.

 Não utiliza média para escolher
 um motor único.

 Gera uma terceira configuração.
*/

function buildUnion(d){
if(!d.ranking.length)return null;

const autoTop=autoPerformance()[0];
const geoTop=geoPerformance()[0];

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

const totalUnion=new Set([...A,...B]);

/*
 Peso 1000:
 número presente nas duas jogadas.

 Peso 100:
 número presente em uma das duas.

 Peso 0:
 número que nenhuma das duas cobria.

 O objetivo principal é maximizar
 quantos números da união entram.

 O peso adicional prioriza
 coincidências físicas.
*/

const weights=new Float64Array(37);

for(let i=0;i<37;i++){
const n=W[i];

weights[i]=
intersection.has(n)?1000:
totalUnion.has(n)?100:
0;
}

/*
 O otimizador original usa pesos
 maiores no centro dos setores.

 Para a UNIÃO, removemos essa
 preferência usando um otimizador
 de cobertura exata logo abaixo.
*/

const play=optimizeUnion(weights);

if(!play)return null;

const coveredUnion=[...totalUnion].filter(
n=>play.numbers.has(n)
);

const missing=[...totalUnion].filter(
n=>!play.numbers.has(n)
);

const commonCovered=[...intersection].filter(
n=>play.numbers.has(n)
);

const extra=[...play.numbers].filter(
n=>!totalUnion.has(n)
);

return {
valid:true,
motor:"UNION",
rx:0,
play,

sourceA:a,
sourceB:b,

autoPosition:autoTop?.position||1,
geoPosition:geoTop?.position||1,

autoRate:autoTop?.rate??null,
geoRate:geoTop?.rate??null,

autoSamples:autoTop?.total||0,
geoSamples:geoTop?.total||0,

unionSize:totalUnion.size,
intersectionSize:intersection.size,

covered:coveredUnion.length,
commonCovered:commonCovered.length,

missing,
extra,

score:play.score
};
}

/*
 OTIMIZADOR DE UNIÃO COM COBERTURA EXATA

 Diferentemente do peso geométrico
 original, cada número coberto vale
 exatamente seu peso, independentemente
 de ser centro ou vizinho.

 Portanto:
 - primeiro preserva coincidências
 - depois maximiza os exclusivos
 - por último preenche casas restantes

 Não usa deslocamentos aleatórios.
*/

function optimizeUnion(weights){
const p5=new Float64Array(37);
const p3=new Float64Array(37);

for(let c=0;c<37;c++){
for(let d=-2;d<=2;d++){
p5[c]+=weights[mod(c+d)];
}

for(let d=-1;d<=1;d++){
p3[c]+=weights[mod(c+d)];
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
start+used+g+Math.floor(sizes[k]/2)
);

const value=sizes[k]===3
?p3[center]:p5[center];

let winner=null;

for(let gap=0;gap<=9-g;gap++){
if(gap===1)continue;

const next=solve(k+1,g+gap);
if(!next)continue;

const score=value+next.score;

if(!winner||score>winner.score){
winner={
score,
gaps:[gap,...next.gaps]
};
}
}

memo.set(key,winner);
return winner;
}

const result=solve(0,0);

if(
!result||
(best&&result.score<=best.score)
)continue;

let cursor=start;
const centers5=[];
let center3=null;

for(let k=0;k<6;k++){
const center=W[
mod(cursor+Math.floor(sizes[k]/2))
];

if(sizes[k]===3){
center3=center;
}else{
centers5.push(center);
}

cursor+=sizes[k]+result.gaps[k];
}

best={
score:result.score,
centers5,
center3
};
}
}

return best
?makePlay(
best.centers5,
best.center3,
best.score
)
:null;
}

/* SNAPSHOTS */

function snapshot(c){
if(!c?.valid)return null;

return {
motor:c.motor,
rx:c.rx,
rank:c.rank,
geometryRank:c.geometryRank,

centers5:[...c.play.centers5],
center3:c.play.center3,

history:s.history.join(","),

unionInfo:c.motor==="UNION"
?{
autoPosition:c.autoPosition,
geoPosition:c.geoPosition,
covered:c.covered,
unionSize:c.unionSize,
missing:[...c.missing]
}
:null
};
}

function snapPlay(x){
if(!x)return null;

return makePlay(
x.centers5||[],
x.center3
);
}

function check(n,play){
if(!play)return {hit:false};

for(const b of play.blocks){
if(b.nums.includes(n)){
return {
hit:true,
center:b.center,
distance:dist(n,b.center)
};
}
}

return {hit:false};
}

/* G1 AJUSTE FINO */

function tuneG1(original,miss){
const base=snapPlay(original);
if(!base)return original;

const candidates=[];

function add(p,type,shift){
if(!p)return;

const coverage=check(miss,p).hit?1:0;

const moved=p.blocks.reduce(
(sum,b,i)=>
sum+dist(
b.center,
base.blocks[i].center
),0
);

candidates.push({
p,type,shift,coverage,moved
});
}

for(const b of base.blocks){
for(const shift of [-2,-1,1,2]){
const nc=W[mod(idx(b.center)+shift)];

const centers=base.centers5.slice();
let short=base.center3;

if(b.r===1){
short=nc;
}else{
centers[centers.indexOf(b.center)]=nc;
}

add(
makePlay(centers,short),
"SETOR",
shift
);
}
}

for(const shift of [-2,-1,1,2]){
const move=c=>W[mod(idx(c)+shift)];

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
b.coverage-a.coverage||
a.moved-b.moved
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
centers5:chosen.p.centers5,
center3:chosen.p.center3,
g1:{
type:chosen.type,
shift:chosen.shift,
miss
}
};
}

/* SELEÇÃO ATIVA */

function selected(d){
if(s.mode==="MANUAL"){
return d.configs[s.manual]?.[s.rx]||null;
}

if(s.union){
return buildUnion(d);
}

return d.ranking[currentRank()-1]||
d.ranking[d.ranking.length-1]||
null;
}

/* PREPARAÇÃO DAS JOGADAS */

function prepare(d){
const key=s.history.join(",");

if(
!s.frozen.AUTO&&
s.pending.AUTO?.history!==key
){
const c=d.ranking[currentRank()-1]||
d.ranking[d.ranking.length-1];

s.pending.AUTO=snapshot(c);
}

if(
!s.frozen.UNION&&
s.pending.UNION?.history!==key
){
s.pending.UNION=snapshot(buildUnion(d));
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

/* AVALIAÇÃO */

function evaluate(n,p,freeze,line,key){
line=line.slice(-20);

if(freeze){
const hit=check(n,snapPlay(freeze)).hit;

const i=line.findLastIndex(x=>x.wait);

if(i>=0){
line[i]={
...line[i],
wait:false,
hit,
g1:n,
phase:hit?"G1":"LOSS"
};
}else{
line.push({
n,
hit,
g1:n,
phase:hit?"G1":"LOSS"
});
}

return {
line:line.slice(-20),
freeze:null,
pending:null,
done:true,
hit
};
}

if(!p||p.history!==key){
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

const hit=check(n,snapPlay(p)).hit;

if(hit){
line.push({
n,
hit:true,
phase:"ENTRADA"
});

return {
line:line.slice(-20),
freeze:null,
pending:null,
done:true,
hit:true
};
}

line.push({
n,
wait:true,
phase:"ESPERA"
});

return {
line:line.slice(-20),
freeze:s.fineG1
?tuneG1(p,n)
:{
...p,
g1:{
type:"ORIGINAL",
shift:0,
miss:n
}
},
pending:null,
done:false
};
}

function updateLane(n,name){
const key=s.history.join(",");

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
const auto=updateLane(n,"AUTO");
const union=updateLane(n,"UNION");

const chosen=s.union?union:auto;

if(chosen.done){
if(chosen.hit){
s.autoWins++;
}else{
s.autoLosses++;
}
}

if(auto.done){
if(s.alternate){
s.nextRank=s.nextRank===3?2:3;
s.rank=s.nextRank;
}

if(s.best2){
s.bestTurn=1-s.bestTurn;
}
}

for(const m of MOTORS){
for(const r of RX){
const key=s.history.join(",");

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
}

/* ADICIONAR NÚMERO */

function addNumber(n){
if(!Number.isInteger(n)||n<0||n>36)return;

const d=calculate();
prepare(d);

const lane=s.union?"UNION":"AUTO";

const frozen=s.mode==="MANUAL"
?s.frozen[s.manual][s.rx]
:s.frozen[lane];

const original=s.mode==="MANUAL"
?s.pending[s.manual][s.rx]
:s.pending[lane];

const wasG1=!!frozen;

s.seen++;

/*
 Registra desempenho das posições
 com a geometria que existia ANTES
 de conhecer o número sorteado.
*/

for(const c of d.ranking){
const hit=check(n,c.play).hit;

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
s.positionRecords.slice(-1200);

s.geometryRecords=
s.geometryRecords.slice(-1200);

const result=check(
n,
snapPlay(wasG1?frozen:original)
);

updateAll(n);

if(wasG1){
const last=s.cards.at(-1);

if(last){
last.g1=n;
last.hit=result.hit;
last.phase=result.hit?"G1":"LOSS";
}

s.audit={
title:result.hit
?"G1 ACERTOU"
:"G1 FALHOU",
text:
"Resultado "+n+
" • "+(result.hit?"ACERTO":"ERRO")
};

}else{
s.cards.push({
n,
hit:result.hit,
sem:!original,
phase:!original
?"SEM"
:result.hit?"ENTRADA":"ESPERA"
});

s.audit={
title:!original
?"SEM JOGADA"
:result.hit
?"ACERTO NA ENTRADA"
:"ENTRADA FORA DA COBERTURA",

text:
"Resultado "+n+
" • "+(
!original
?"Sem configuração disponível."
:result.hit
?"Número coberto."
:"G1 preparado e congelado."
)
};
}

s.cards=s.cards.slice(-14);
s.history=clean([...s.history,n]);

invalidate();
save();
render();
}

/* CONTROLES */

function resetResults(){
const a=fresh();

s.seen=0;
s.autoWins=0;
s.autoLosses=0;

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

function setMode(m,r){
s.mode=m==="AUTO"?"AUTO":"MANUAL";

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
).map(Number).filter(n=>n>=0&&n<=36);

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
if(!confirm("Apagar histórico e estatísticas?")){
return;
}

s.history=[];
resetResults();

save();
render();
}

/* INTERFACE */

const css=`
*{box-sizing:border-box}
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
font-weight:bold;
cursor:pointer
}
.hidden{display:none!important}
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
.key.zero{grid-column:span 6}
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
.mark.wait{background:#6c5818}
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
.candidate.pick{
background:#123d4b;
color:#00e5ff
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
.summaryAuto{
font-size:11px;
color:#00e5ff;
margin:7px 0;
font-weight:bold
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
.unionInfo{
background:#21172c;
border:1px solid #9d64ca;
padding:11px;
border-radius:8px;
font-size:12px;
line-height:1.8
}
@media(max-width:600px){
.history{
grid-template-columns:repeat(4,1fr)
}
.center{font-size:19px}
.mark{min-width:14px}
}
`;

document.body.innerHTML=`
<style>${css}</style>

<main class="app">

<h2>ANÁLISE BETA V4.0</h2>

<section class="panel">

<textarea
id="inputHistory"
placeholder="Cole os últimos 20 números"
></textarea>

<div class="row">
<button class="btn" id="insert">INSERIR</button>
<button class="btn" id="undo">APAGAR ÚLTIMO</button>
<button class="btn" id="clear">APAGAR TUDO</button>
</div>

<div class="small" id="status"></div>

</section>

<section class="panel">

<button class="head" id="toggleCandidates">
AUTO • 12 CANDIDATOS
<span id="arrowCandidates">+</span>
</button>

<div class="row">
<button class="btn" id="auto">AUTO</button>
<div class="accent" id="autoLabel"></div>
</div>

<div class="small">POSIÇÃO FIXA DO AUTO</div>

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

</div>

<div class="small" id="modeInfo"></div>

<div id="candidatePanel" class="hidden">

<div id="motorButtons"></div>

<div class="accent">RANKING AUTO</div>
<div id="candidates"></div>

<div class="accent">RANKING GEOMETRIA</div>
<div id="geometryRanking"></div>

</div>

</section>

<section class="panel">

<button class="head" id="toggleLines">
LINHAS DO TEMPO
<span id="arrowLines">+</span>
</button>

<div id="autoSummary" class="summaryAuto"></div>

<div id="autoLine"></div>
<div id="unionLine"></div>

<div id="otherLines" class="hidden"></div>

</section>

<section class="panel">

<div class="small">ÚLTIMAS 14 JOGADAS</div>

<div class="history" id="cards"></div>

</section>

<section class="panel">

<div class="accent" id="playLabel">
JOGADA ATUAL
</div>

<div class="grid6" id="play"></div>

<div class="small" id="g1Info"></div>

</section>

<section class="panel">

<div class="small">TECLADO</div>

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
AUTO UNIÃO — COBERTURA
</div>

<div class="unionInfo" id="unionInfo"></div>

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

$("alternate").onclick=toggleAlternate;
$("best2").onclick=toggleBest2;
$("union").onclick=toggleUnion;
$("fine").onclick=toggleFine;

$("auto").onclick=()=>setMode("AUTO");

$("toggleCandidates").onclick=()=>{
s.openCandidates=!s.openCandidates;
save();
render();
};

$("toggleLines").onclick=()=>{
s.openLines=!s.openLines;
save();
render();
};

$("toggleVirtual").onclick=()=>{
s.openVirtual=!s.openVirtual;
save();
render();
};

/* TECLADO */

for(let n=1;n<=36;n++){
const b=document.createElement("button");

b.className="key";
b.textContent=n;
b.style.background=color(n);
b.onclick=()=>addNumber(n);

$("keys").appendChild(b);
}

const zero=document.createElement("button");

zero.className="key zero";
zero.textContent="0";
zero.style.background=color(0);
zero.onclick=()=>addNumber(0);

$("keys").appendChild(zero);

/* BOTÕES DAS POSIÇÕES */

for(let n=1;n<=4;n++){
const b=document.createElement("button");

b.className="btn";
b.id="rank"+n;
b.textContent=n+"º";
b.onclick=()=>setRank(n);

$("rankButtons").appendChild(b);
}

/* MOTORES */

for(const m of MOTORS){
const div=document.createElement("div");

div.className="row";

const title=document.createElement("strong");
title.className="small";
title.style.width="100%";
title.textContent=LABEL[m];

div.appendChild(title);

for(const r of RX){
const b=document.createElement("button");

b.className="btn";
b.id="motor"+m+r;
b.textContent="C"+r;

b.onclick=()=>setMode(m,r);

div.appendChild(b);
}

$("motorButtons").appendChild(div);
}

/* LINHAS DO TEMPO */

function lineHtml(name,items){
const t=stats(items);

const marks=items.slice(-20).map(x=>{
const cls=
x.sem?""
:x.wait?"wait"
:x.phase==="G1"?"g1"
:x.hit?"good":"bad";

const label=
x.sem?"—"
:x.wait?"…"
:x.phase==="G1"?"G1"
:x.hit?"G":"L";

return '<span class="mark '+cls+'">'+
label+"</span>";
}).join("");

return `
<div class="line">
<b>${name}</b>
<div class="marks">${marks}</div>
<b>${t.n?Math.round(t.r20)+"%":"—"}</b>
</div>
`;
}

/* CARTÕES DE DESEMPENHO */

function performanceHtml(items,type){
if(!items.length){
return '<div class="small">Aguardando resultados.</div>';
}

return items.slice(0,2).map((x,i)=>`
<div class="positionCard">

<small>${i+1}º DESEMPENHO ${type}</small>

<strong>${x.position}ª POSIÇÃO</strong>

${x.rate.toFixed(1)}%

<small style="display:block">
${x.wins} acertos /
${x.total} entradas
</small>

</div>
`).join("");
}

/* RENDERIZAÇÃO */

function render(){
const d=calculate();
prepare(d);

const u=buildUnion(d);
const cfg=selected(d);

const lane=s.union?"UNION":"AUTO";

const freeze=s.mode==="MANUAL"
?s.frozen[s.manual][s.rx]
:s.frozen[lane];

const play=freeze
?snapPlay(freeze)
:cfg?.play;

$("status").textContent=
s.history.length+"/20 números • "+
d.ranking.length+"/12 motores • "+
"28 cobertos • 9 descobertos";

$("autoLabel").textContent=s.union
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

for(let n=1;n<=4;n++){
$("rank"+n).classList.toggle(
"selected",
!s.union&&!s.best2&&
!s.alternate&&s.rank===n
);
}

for(const m of MOTORS){
for(const r of RX){
$("motor"+m+r).classList.toggle(
"selected",
s.mode==="MANUAL"&&
s.manual===m&&s.rx===r
);
}
}

$("modeInfo").textContent=
s.union
?"UNIÃO ATIVA • TERCEIRA JOGADA INDEPENDENTE"
:s.best2
?"ALTERNANDO OS DOIS MELHORES DESEMPENHOS AUTO"
:s.alternate
?"ALTERNÂNCIA 2º ⇄ 3º ATIVA"
:"AUTO FIXO "+s.rank+"º";

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

const ta=stats(s.lines.AUTO);
const tu=stats(s.lines.UNION);

$("autoSummary").textContent=
"AUTO: "+ta.wins+"/"+ta.n+
" • UNIÃO: "+tu.wins+"/"+tu.n+
" • NÚMEROS VISTOS: "+s.seen;

$("autoLine").innerHTML=
lineHtml("AUTO",s.lines.AUTO);

$("unionLine").innerHTML=
lineHtml("UNIÃO",s.lines.UNION);

$("otherLines").classList.toggle(
"hidden",
!s.openLines
);

$("arrowLines").textContent=
s.openLines?"−":"+";

$("otherLines").innerHTML=
MOTORS.map(m=>
'<div class="small">'+LABEL[m]+"</div>"+
RX.map(r=>
lineHtml("C"+r,s.lines[m][r])
).join("")
).join("");

$("cards").innerHTML=s.cards.map(x=>{
const border=
x.phase==="G1"?"#ffcc22"
:x.hit?"#00bd68"
:x.phase==="LOSS"?"#f04a5d"
:"#777";

return `
<span style="
background:${color(x.n)};
border-color:${border}
">
${x.n}
<small style="display:block">
${x.phase}
${x.g1!=null?" / "+x.g1:""}
</small>
</span>
`;
}).join("");

$("playLabel").textContent=freeze
?"G1 CONGELADO • "+
(freeze.motor==="UNION"
?"AUTO UNIÃO"
:LABEL[freeze.motor]+" C"+freeze.rx)
:s.union
?"JOGADA AUTO UNIÃO • 28 NÚMEROS"
:cfg
?"JOGADA • "+LABEL[cfg.motor]+" C"+cfg.rx
:"AGUARDANDO JOGADA";

$("play").innerHTML=
(play?.blocks||[])
.slice()
.sort((a,b)=>idx(a.center)-idx(b.center))
.map(b=>`
<div
class="center ${b.r===1?"short":""}"
title="${b.nums.join(", ")}"
>
${b.center}
</div>
`).join("");

$("g1Info").textContent=freeze
?"G1 CONGELADO • 28 NÚMEROS"
:"AZUL: 2 VIZINHOS • AMARELO: 1 VIZINHO";

$("autoPerformance").innerHTML=
performanceHtml(autoPerformance(),"AUTO");

$("geoPerformance").innerHTML=
performanceHtml(geoPerformance(),"GEOMETRIA");

/* DETALHES DA UNIÃO */

if(u){
$("unionInfo").innerHTML=`
<b>FONTE A — DESEMPENHO AUTO</b>
<div>
${u.autoPosition}ª posição •
${LABEL[u.sourceA.motor]} C${u.sourceA.rx}
</div>

<b>FONTE B — DESEMPENHO GEOMETRIA</b>
<div>
${u.geoPosition}ª posição •
${LABEL[u.sourceB.motor]} C${u.sourceB.rx}
</div>

<hr>

<div>
NÚMEROS NA UNIÃO DAS FONTES:
<b>${u.unionSize}</b>
</div>

<div>
NÚMEROS APROVEITADOS:
<b>${u.covered} de ${u.unionSize}</b>
</div>

<div>
COINCIDÊNCIAS APROVEITADAS:
<b>${u.commonCovered} de
${u.intersectionSize}</b>
</div>

<div>
NÚMEROS QUE FICARAM DE FORA:
<b>${u.missing.length}</b>
</div>

<div>
${u.missing.length
?u.missing.join(" • ")
:"NENHUM"}
</div>

<div>
CASAS ADICIONAIS PARA COMPLETAR 28:
<b>${u.extra.length}</b>
</div>

<div>
${u.extra.length
?u.extra.join(" • ")
:"NENHUMA"}
</div>

<hr>

<div>
CENTROS 2 VIZINHOS:
<b>${u.play.centers5.join(" • ")}</b>
</div>

<div>
CENTRO 1 VIZINHO:
<b>${u.play.center3}</b>
</div>

<div class="small">
${u.autoSamples===0||u.geoSamples===0
?"Seleção provisória: ainda faltam dados de desempenho em uma ou ambas as fontes."
:"Seleção baseada nos desempenhos registrados."}
</div>
`;
}else{
$("unionInfo").textContent=
"Aguardando configurações válidas.";
}

$("audit").textContent=s.audit
?s.audit.title+" — "+s.audit.text
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
