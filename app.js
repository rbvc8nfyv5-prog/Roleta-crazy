
(() => {
"use strict";

/* =====================================================
   ANÁLISE BETA V6.3.8
   TREINADOR GLOBAL NÚMERO
   TREINADOR GLOBAL G1 POR NÚMERO
   JANELA AUTOMÁTICA 90 + 10
===================================================== */

const VERSION = "6.3.8";
const STORAGE = "ANALISE_BETA_V638";
const BASE = 90;
const LIMIT = 10;

const W = [
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const RED = new Set([
1,3,5,7,9,12,14,16,18,
19,21,23,25,27,30,32,34,36
]);

const FAMILIES = [
"NORMAL",
"DINÂMICO",
"RAIO X",
"RAIO X DINÂMICO"
];

const RADII = [4,5,6];

const MOTOR_IDS = [];

for(const family of FAMILIES) {
for(const radius of RADII) {
MOTOR_IDS.push(
family.replaceAll(" ","_")+"_"+radius
);
}
}

const $ = id => document.getElementById(id);
const mod = n => (n%37+37)%37;
const ix = n => W.indexOf(n);
const mean = a => a.length
?a.reduce((s,x)=>s+x,0)/a.length
:0;

const clone = x => JSON.parse(JSON.stringify(x));

const valid = n =>
Number.isInteger(n)&&n>=0&&n<=36;

const percent = (a,b) =>
b?(100*a/b).toFixed(1)+"%":"—";

const esc = x => String(x??"").replace(
/[&<>"']/g,
c=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#39;"
}[c])
);

function ring(n,r) {
const p=ix(n);
return Array.from(
{length:2*r+1},
(_,i)=>W[mod(p+i-r)]
);
}

function distance(a,b) {
const d=Math.abs(ix(a)-ix(b));
return Math.min(d,37-d);
}

function newState() {
return {
history:[],
manual:[],
manualCount:0,
completed:0,

globalOn:true,
g1On:true,

selected:"AUTO",
manualMotor:null,

stats:{},
g1Stats:{},

virtual:{},
pending:[],

realPhase:"ENTRY",
realEntry:null,
realDefense:null,

records:[],
virtualRecords:[],
g1Records:[],

lastDecision:null,
lastG1Decision:null,

analysisTurn:0
};
}

let S=newState();
let busy=false;

try {
const saved=JSON.parse(
localStorage.getItem(STORAGE)||"null"
);

if(saved&&Array.isArray(saved.history)) {
S={...newState(),...saved};

S.history=S.history.filter(valid).slice(-100);
S.manual=Array.isArray(S.manual)?S.manual:[];

S.stats=S.stats||{};
S.g1Stats=S.g1Stats||{};
S.virtual=S.virtual||{};

S.pending=Array.isArray(S.pending)?S.pending:[];
S.records=Array.isArray(S.records)?S.records:[];
S.virtualRecords=Array.isArray(S.virtualRecords)
?S.virtualRecords:[];

S.g1Records=Array.isArray(S.g1Records)
?S.g1Records:[];

S.manualCount=Math.max(
0,Math.min(10,S.manualCount||0)
);
}
} catch(e) {
console.warn(e);
}

function save() {
try {
localStorage.setItem(
STORAGE,
JSON.stringify(S)
);
} catch(e) {
console.warn("Não foi possível salvar:",e);
}
}

/* =====================================================
   GEOMETRIA: 5 CENTROS DE 2 VIZINHOS
   E 1 CENTRO DE 1 VIZINHO
   TOTAL: 28 NÚMEROS SEM REPETIÇÃO
===================================================== */

const BLOCK5=W.map(center=>({
center,
radius:2,
numbers:ring(center,2)
}));

const BLOCK3=W.map(center=>({
center,
radius:1,
numbers:ring(center,1)
}));

for(const block of [...BLOCK5,...BLOCK3]) {
block.mask=block.numbers.reduce(
(a,n)=>a|(1n<<BigInt(ix(n))),
0n
);
}

function makePlay(weights) {
const score=b=>({
...b,
score:b.numbers.reduce(
(s,n)=>s+(weights[ix(n)]||0),
0
)
});

const five=BLOCK5.map(score).sort(
(a,b)=>b.score-a.score
);

const three=BLOCK3.map(score).sort(
(a,b)=>b.score-a.score
);

let best=null;

for(const small of three) {
let beam=[{
blocks:[small],
mask:small.mask,
score:small.score
}];

for(let step=0;step<5;step++) {
const next=[];

for(const item of beam) {
for(const block of five) {
if((item.mask&block.mask)!==0n)continue;

next.push({
blocks:[...item.blocks,block],
mask:item.mask|block.mask,
score:item.score+block.score
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

if(beam.length>=5)break;
}

if(!beam.length)break;
}

for(const item of beam) {
if(item.blocks.length!==6)continue;

if(!best||item.score>best.score) {
best=item;
}
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

return {
blocks,
numbers,
score:best.score
};
}

function uncovered(play) {
if(!play)return [...W];

const covered=new Set(play.numbers);
return W.filter(n=>!covered.has(n));
}

function isHit(play,n) {
return !!play?.numbers?.includes(n);
}

/* =====================================================
   APRENDIZADO POR NÚMERO
   EXEMPLO:
   QUANDO SAI 2, BUSCA 2 -> PRÓXIMO GIRO
   APENAS EM OCORRÊNCIAS JÁ CONHECIDAS
===================================================== */

function transitions(h,trigger) {
const out=[];

for(let i=0;i<h.length-1;i++) {
if(h[i]===trigger) {
out.push({
next:h[i+1],
age:h.length-1-i
});
}
}

return out;
}

function numberWeights(h,trigger,style=0) {
const weights=Array(37).fill(.03);
const pairs=transitions(h,trigger);

for(const pair of pairs) {
const decay=Math.exp(-pair.age/55);

const strength=style===0
?3.5
:style===1
?5
:7;

const p=ix(pair.next);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),
37-Math.abs(p-j)
);

if(d<=3) {
weights[j]+=
decay*strength*(4-d)/4;
}
}
}

const recent=h.slice(-35);

for(let k=0;k<recent.length;k++) {
const p=ix(recent[recent.length-1-k]);

const decay=Math.exp(
-k/(style===2?7:15)
);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),
37-Math.abs(p-j)
);

if(d<=3) {
weights[j]+=
decay*(4-d)/4*(style===0?.5:.8);
}
}
}

for(const n of ring(trigger,style===2?3:2)) {
weights[ix(n)]+=.15;
}

return weights;
}

/* =====================================================
   12 MOTORES ORIGINAIS
===================================================== */

function motorWeights(h,family,radius) {
const weights=Array(37).fill(.02);
const recent=h.slice(-60);

for(let k=0;k<recent.length;k++) {
const n=recent[recent.length-1-k];
const p=ix(n);

const decay=Math.exp(
-k/(radius*2.5)
);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),
37-Math.abs(p-j)
);

if(d<=radius) {
weights[j]+=
decay*(radius+1-d)/(radius+1);
}
}
}

if(family.includes("DINÂMICO")) {
for(let k=0;k<Math.min(7,h.length);k++) {
const p=ix(h[h.length-1-k]);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),
37-Math.abs(p-j)
);

if(d<=3) {
weights[j]+=
(4-d)/(k+2)*1.4;
}
}
}
}

if(family.startsWith("RAIO X")) {
const trigger=h.at(-1);

if(trigger!==undefined) {
const pairs=transitions(h,trigger);

for(const pair of pairs) {
const p=ix(pair.next);

for(let j=0;j<37;j++) {
const d=Math.min(
Math.abs(p-j),
37-Math.abs(p-j)
);

if(d<=3) {
weights[j]+=
(4-d)/4*
Math.exp(-pair.age/45)*2;
}
}
}
}
}

return weights;
}

function candidates(h) {
if(h.length<8)return [];

const result=[];

for(const family of FAMILIES) {
for(const radius of RADII) {
const play=makePlay(
motorWeights(h,family,radius)
);

if(!play)continue;

result.push({
id:family.replaceAll(" ","_")+"_"+radius,
name:family+" "+radius,
type:"MOTOR",
play
});
}
}

/*
COMBINAÇÕES ADICIONAIS GERADAS
ESPECIFICAMENTE PARA O ÚLTIMO NÚMERO.
*/

const trigger=h.at(-1);

for(let i=0;i<3;i++) {
const play=makePlay(
numberWeights(h,trigger,i)
);

if(!play)continue;

result.push({
id:"NUMERO_"+i,
name:"NÚMERO "+trigger+" • COMBINAÇÃO "+(i+1),
type:"NÚMERO",
play
});
}

return result;
}

/* =====================================================
   ESTATÍSTICAS CONDICIONADAS
===================================================== */

function emptyStat() {
return {
total:0,
hit:0,
last:[]
};
}

function statFor(store,trigger,id) {
const key=String(trigger);

store[key]??={};
store[key][id]??=emptyStat();

return store[key][id];
}

function readStat(store,trigger,id) {
return store[String(trigger)]?.[id]||emptyStat();
}

function updateStat(store,trigger,id,hit) {
const x=statFor(store,trigger,id);

x.total++;
if(hit)x.hit++;

x.last.push(hit?1:0);

if(x.last.length>18) {
x.last.shift();
}
}

function scoreStat(stat,prior=28/37) {
const recent=mean(stat.last);

const smoothed=
(stat.hit+prior*8)/(stat.total+8);

return stat.last.length
?smoothed*.72+recent*.28
:smoothed;
}

function rankCandidates(h,cs) {
const trigger=h.at(-1);

return cs.map(c=>{
const st=readStat(S.stats,trigger,c.id);

const score=scoreStat(st);

return {
...c,
trigger,
score,
observations:st.total,
hits:st.hit
};
}).sort((a,b)=>
b.score-a.score||
b.observations-a.observations||
a.id.localeCompare(b.id)
);
}

/*
SE EXISTIR APRENDIZADO ESPECÍFICO
PARA O NÚMERO, ELE É USADO.

QUANDO A AMOSTRA FOR PEQUENA,
O SISTEMA UTILIZA A TAXA SUAVIZADA.
*/

function chooseGlobal(h,cs) {
if(!cs.length)return null;

const ranked=rankCandidates(h,cs);
const winner=ranked[0];

return {
...winner,
reason:
"NÚMERO "+h.at(-1)+
" • "+winner.observations+
" TESTES ANTERIORES"
};
}

/* =====================================================
   REGIME G1
   CONTINUIDADE / DESLOCAMENTO / RUPTURA
===================================================== */

function regime(trigger) {
const records=S.g1Records.slice(-30);

const last=records.slice(-8);

const losses=last.filter(
r=>!r.hit
).length;

const same=records.filter(
r=>r.trigger===trigger
).slice(-6);

const sameLoss=same.filter(
r=>!r.hit
).length;

let streak=0;

for(let i=records.length-1;i>=0;i--) {
if(records[i].hit)break;
streak++;
}

if(
streak>=3||
(last.length>=6&&losses/last.length>=.60)||
(same.length>=4&&sameLoss/same.length>=.60)
) {
return "RUPTURA";
}

if(
(last.length>=5&&losses/last.length>=.35)||
(same.length>=3&&sameLoss/same.length>=.35)
) {
return "DESLOCAMENTO";
}

return "CONTINUIDADE";
}

/* =====================================================
   DEFESAS G1
===================================================== */

function fineDefense(entry,trigger) {
const weights=Array(37).fill(.01);

for(const n of entry.play.numbers) {
weights[ix(n)]+=12;
}

for(const n of ring(trigger,1)) {
weights[ix(n)]+=16;
}

const play=makePlay(weights);

return play?{
id:"AJUSTE",
name:"AJUSTE FINO",
play
}:null;
}

function rebuildDefense(h,trigger,style=0) {
const weights=numberWeights(
h,trigger,style
);

const recent=h.slice(-20);

for(const n of recent) {
weights[ix(n)]+=.25;
}

const play=makePlay(weights);

return play?{
id:"RECONSTRUCAO_"+style,
name:"RECONSTRUÇÃO "+(style+1),
play
}:null;
}

function g1Candidates(entry,trigger,h) {
const out=[{
id:"CONGELADA",
name:"CONGELADA",
play:clone(entry.play)
}];

const fine=fineDefense(entry,trigger);
if(fine)out.push(fine);

for(let i=0;i<3;i++) {
const c=rebuildDefense(h,trigger,i);
if(c)out.push(c);
}

/*
OUTROS MOTORES PODEM SER
TESTADOS COMO DEFESA,
SEM ALTERAR O MOTOR ORIGINAL.
*/

const cs=candidates(h);

for(const c of cs.slice(0,12)) {
out.push({
id:"TROCA_"+c.id,
name:"TROCA PARA "+c.name,
play:clone(c.play)
});
}

return out;
}

function rankG1(entry,trigger,h) {
const options=g1Candidates(
entry,trigger,h
);

const behavior=regime(trigger);

const ranked=options.map(c=>{
const st=readStat(
S.g1Stats,trigger,c.id
);

let score=scoreStat(st);

if(
behavior==="CONTINUIDADE"&&
c.id==="CONGELADA"
)score+=.018;

if(
behavior==="DESLOCAMENTO"&&
c.id==="AJUSTE"
)score+=.018;

if(
behavior==="RUPTURA"&&
c.id.startsWith("RECONSTRUCAO")
)score+=.025;

const recent=h.slice(-16);

const coverage=recent.length
?recent.filter(n=>
isHit(c.play,n)
).length/recent.length
:28/37;

score=score*.85+coverage*.15;

return {
...c,
trigger,
behavior,
score,
tests:st.total,
hits:st.hit
};
});

ranked.sort((a,b)=>
b.score-a.score||
b.tests-a.tests||
a.id.localeCompare(b.id)
);

return ranked;
}

function chooseG1(entry,trigger,h) {
const ranked=rankG1(
entry,trigger,h
);

const winner=ranked[0];

if(!winner)return null;

return {
...winner,
alternatives:ranked.map(c=>({
id:c.id,
name:c.name,
score:c.score,
tests:c.tests,
hits:c.hits
}))
};
}

/* =====================================================
   TREINAMENTO VIRTUAL SEM ANTECIPAÇÃO
===================================================== */

function virtualFor(id) {
S.virtual[id]??={
phase:"ENTRY",
entry:null,
defense:null,
trigger:null
};

return S.virtual[id];
}

/*
A PREVISÃO DO GIRO ATUAL É
CRIADA COM O HISTÓRICO ANTERIOR.

O RESULTADO DO GIRO SÓ É USADO
DEPOIS PARA ATUALIZAR AS ESTATÍSTICAS.
*/

function processSpin(n,source="HISTÓRICO") {
if(!valid(n))return;

const h=[...S.history];
const trigger=h.at(-1);

const cs=candidates(h);
const ranked=rankCandidates(h,cs);

const selected=S.globalOn
?chooseGlobal(h,cs)
:cs.find(c=>c.id===S.manualMotor)||
cs[0]||null;

/*
PRIMEIRO: RESOLVER GALES VIRTUAIS
QUE FORAM DEFINIDOS NO GIRO ANTERIOR.
*/

const settling=S.pending;

for(const pending of settling) {
const hit=isHit(pending.play,n);

updateStat(
S.g1Stats,
pending.trigger,
pending.id,
hit
);

S.g1Records.push({
turn:S.analysisTurn+1,
trigger:pending.trigger,
id:pending.id,
hit,
number:n,
behavior:pending.behavior
});
}

S.pending=[];

/*
SEGUNDO: RESOLVER A ENTRADA REAL.
*/

let realResult="AGUARDANDO";

if(S.realPhase==="GALE") {
const hit=isHit(
S.realDefense?.play,n
);

realResult=hit?"GREEN G1":"LOSS";

S.realPhase="ENTRY";
S.realEntry=null;
S.realDefense=null;
}

else if(selected) {
if(isHit(selected.play,n)) {
realResult="GREEN";
} else {
realResult="GALE";

const after=[...h,n];

const decision=S.g1On
?chooseG1(selected,n,after)
:{
id:"CONGELADA",
name:"CONGELADA",
play:clone(selected.play),
behavior:regime(n),
score:0,
tests:0,
hits:0,
alternatives:[]
};

S.realPhase="GALE";
S.realEntry=clone(selected);
S.realDefense=clone(decision);

S.lastG1Decision={
trigger:n,
entry:selected.id,
...clone(decision)
};
}
}

/*
TERCEIRO: TESTAR VIRTUALMENTE
TODAS AS COMBINAÇÕES DA ENTRADA.
*/

const pending=[];

for(const c of cs) {
const v=virtualFor(c.id);

if(v.phase==="GALE") {
const hit=isHit(v.defense?.play,n);

S.virtualRecords.push({
turn:S.analysisTurn+1,
motor:c.id,
result:hit?"GREEN G1":"LOSS",
trigger:v.trigger
});

v.phase="ENTRY";
v.entry=null;
v.defense=null;
v.trigger=null;
}

else {
const hit=isHit(c.play,n);

S.virtualRecords.push({
turn:S.analysisTurn+1,
motor:c.id,
result:hit?"GREEN":"GALE",
trigger
});

if(!hit) {
const after=[...h,n];

const options=g1Candidates(
c,n,after
);

const behavior=regime(n);

for(const option of options) {
pending.push({
trigger:n,
id:option.id,
play:clone(option.play),
behavior
});
}

const defense=chooseG1(
c,n,after
);

v.phase="GALE";
v.entry=clone(c);
v.defense=clone(defense);
v.trigger=n;
}
}
}

/*
QUARTO: ATUALIZAR APRENDIZADO
POR NÚMERO PARA TODAS AS COMBINAÇÕES.

EXEMPLO:
2 -> 17
2 -> 32
2 -> 5

CADA COMBINAÇÃO É AVALIADA
SOMENTE DEPOIS QUE O RESULTADO
SE TORNA CONHECIDO.
*/

if(trigger!==undefined) {
for(const c of cs) {
updateStat(
S.stats,
trigger,
c.id,
isHit(c.play,n)
);
}
}

/*
QUINTO: REGISTRAR RESULTADO
E AVANÇAR O HISTÓRICO.
*/

S.pending=pending;

S.records.push({
turn:S.analysisTurn+1,
number:n,
source,
trigger,
motor:selected?.id||"—",
result:realResult,
phase:S.realPhase
});

S.lastDecision=selected?{
trigger,
motor:selected.id,
name:selected.name,
score:selected.score||0,
ranked:ranked.slice(0,8).map(c=>({
id:c.id,
name:c.name,
score:c.score,
observations:c.observations,
hits:c.hits
}))
}:null;

S.history.push(n);
S.analysisTurn++;

if(S.records.length>400) {
S.records=S.records.slice(-400);
}

if(S.virtualRecords.length>3000) {
S.virtualRecords=S.virtualRecords.slice(-3000);
}

if(S.g1Records.length>3000) {
S.g1Records=S.g1Records.slice(-3000);
}
}

/* =====================================================
   RECÁLCULO AUTOMÁTICO 90 + 10
===================================================== */

function frame() {
return new Promise(resolve=>
requestAnimationFrame(resolve)
);
}

function showBusy(message) {
busy=true;

$("overlay").classList.add("show");
$("busyText").textContent=message;
}

function hideBusy() {
busy=false;
$("overlay").classList.remove("show");
}

async function rebuild(
numbers,
preserveManual=false,
completed=false
) {
if(busy)return;

const clean=numbers.filter(valid).slice(-BASE);

const old=clone(S);

const manual=preserveManual
?clone(S.manual)
:[];

const cycles=preserveManual
?S.completed+(completed?1:0)
:0;

const globalOn=S.globalOn;
const g1On=S.g1On;

const selected=S.selected;
const manualMotor=S.manualMotor;

showBusy(
"REINICIANDO O TREINADOR GLOBAL NÚMERO"
);

await frame();

try {
S=newState();

S.manual=manual;
S.completed=cycles;

S.globalOn=globalOn;
S.g1On=g1On;

S.selected=selected;
S.manualMotor=manualMotor;

for(let i=0;i<clean.length;i++) {
processSpin(
clean[i],
"HISTÓRICO"
);

if(i%5===4||i===clean.length-1) {
$("busyText").textContent=
"RECALCULANDO "+
(i+1)+"/"+clean.length+
" NÚMEROS";

await new Promise(resolve=>
setTimeout(resolve,0)
);
}
}

S.manualCount=0;

save();

} catch(e) {
S=old;
save();

alert(
"ERRO NO RECÁLCULO: "+
String(e.message||e)
);
} finally {
hideBusy();
render();
}
}

async function manualSpin(n) {
if(busy||!valid(n))return;

if(S.history.length<8) {
alert("IMPORTE O HISTÓRICO PRIMEIRO.");
return;
}

const previous=clone(S);

try {
processSpin(n,"MANUAL");

const r=S.records.at(-1);

S.manual.push({
number:n,
result:r.result,
motor:r.motor,
trigger:r.trigger,
time:Date.now()
});

S.manualCount++;

save();
render();

if(S.manualCount>=LIMIT) {
const latest90=S.history.slice(-BASE);

await rebuild(
latest90,
true,
true
);
}

} catch(e) {
S=previous;
save();

alert(
"ERRO AO INSERIR: "+
String(e.message||e)
);
}
}

function parseNumbers(text) {
return (String(text).match(/\d+/g)||[])
.map(Number)
.filter(valid);
}

async function importHistory() {
if(busy)return;

const numbers=parseNumbers(
$("paste").value
);

if(!numbers.length) {
alert("COLE NÚMEROS DE 0 A 36.");
return;
}

if(!confirm(
"IMPORTAR "+numbers.length+
" NÚMEROS?\n\n"+
"SERÃO UTILIZADOS OS ÚLTIMOS "+
Math.min(90,numbers.length)+
".\n\n"+
"OS REGISTROS MANUAIS ANTERIORES "+
"SERÃO APAGADOS."
))return;

$("paste").value="";

await rebuild(
numbers,
false,
false
);
}

function clearAll() {
if(busy)return;

if(!confirm(
"ZERAR TUDO, INCLUINDO "+
"OS GREEN E LOSS MANUAIS?"
))return;

S=newState();
save();
render();
}

/* =====================================================
   INTERFACE
===================================================== */

const style=`
*{box-sizing:border-box}

body{
margin:0;
background:#101721;
color:#f3f7fb;
font-family:Arial,sans-serif;
font-size:13px
}

main{
max-width:1080px;
margin:auto;
padding:12px
}

h1{
text-align:center;
color:#4de4fa;
font-size:25px;
margin:16px 0 5px
}

.subtitle{
text-align:center;
color:#b5c9da;
font-size:11px;
line-height:1.8;
margin-bottom:15px
}

.panel{
background:#1c2939;
border:1px solid #405a73;
border-radius:11px;
padding:13px;
margin:10px 0
}

.title{
font-size:12px;
font-weight:bold;
color:#4ce0f5;
margin:12px 0
}

.row{
display:flex;
flex-wrap:wrap;
gap:7px;
margin:10px 0
}

button{
cursor:pointer;
font-weight:bold
}

.btn{
background:#30455d;
border:1px solid #718ca6;
border-radius:8px;
padding:11px;
color:white;
font-size:11px
}

.btn.on{
background:#087d54;
border:2px solid #48ffb1;
box-shadow:0 0 15px #22e59b66
}

.btn.active{
background:#086b99;
border:2px solid #55e9ff;
box-shadow:0 0 12px #42ddff55
}

.btn:disabled{
opacity:.35;
cursor:not-allowed
}

textarea{
width:100%;
height:90px;
background:#101c2a;
color:white;
border:1px solid #67849d;
border-radius:8px;
padding:10px
}

.counter{
font-size:28px;
color:#4fe9c3;
font-weight:bold
}

.bar{
height:12px;
background:#32465b;
border-radius:20px;
overflow:hidden;
margin:10px 0
}

.fill{
height:100%;
background:#38dfa3;
transition:width .2s
}

.centers{
display:grid;
grid-template-columns:repeat(6,minmax(0,1fr));
gap:5px;
margin:12px 0
}

.center{
min-width:0;
min-height:85px;
background:#086b91;
border:2px solid #3be0ff;
border-radius:9px;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
gap:6px;
padding:5px
}

.center.short{
background:#c7a12d;
border-color:#ffe48a;
color:#171717
}

.center b{
font-size:clamp(26px,5vw,42px)
}

.center small{
font-size:9px;
text-align:center
}

.cloud{
display:flex;
flex-wrap:wrap;
gap:5px;
margin:10px 0
}

.cloud span{
min-width:36px;
height:36px;
display:flex;
align-items:center;
justify-content:center;
background:#31455d;
border:1px solid #6886a3;
border-radius:7px;
font-weight:bold
}

.keys{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:5px
}

.key{
height:45px;
border:1px solid #7a8da4;
border-radius:7px;
color:white;
font-size:17px
}

.key.zero{
grid-column:span 6
}

.box{
background:#132338;
border:1px solid #496782;
border-radius:9px;
padding:12px;
margin:9px 0;
line-height:1.7
}

.metrics{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:6px
}

.metric{
background:#2b4055;
border-radius:8px;
padding:12px 5px;
text-align:center
}

.metric small{
display:block;
font-size:10px;
color:#b9cddd
}

.metric b{
font-size:24px;
display:block;
margin-top:5px
}

.tablewrap{
overflow:auto
}

table{
width:100%;
min-width:590px;
border-collapse:collapse;
font-size:11px
}

td,th{
padding:9px;
text-align:left;
border-bottom:1px solid #40566d
}

th{color:#50e0f4}

.good{color:#49e6a1}
.bad{color:#ff738a}

.line{
padding:9px 0;
border-bottom:1px solid #354b62;
line-height:1.7
}

.muted{
font-size:11px;
color:#b5c8d8;
line-height:1.7
}

.pill{
display:inline-block;
padding:5px 8px;
background:#30475e;
border-radius:7px;
margin:3px
}

.pill.green{
border:2px solid #3be5a1
}

.pill.loss{
border:2px solid #ff617f
}

.pill.gale{
border:2px solid #f7d648
}

.highlight{
border:2px solid #43e9aa;
background:#123d32
}

#overlay{
display:none;
position:fixed;
inset:0;
z-index:999999;
background:rgba(5,12,20,.97);
align-items:center;
justify-content:center;
padding:20px
}

#overlay.show{
display:flex
}

.overlayBox{
width:min(440px,100%);
padding:28px 18px;
border:2px solid #42e9b3;
border-radius:15px;
background:#1a3042;
text-align:center
}

.spinner{
width:60px;
height:60px;
border:6px solid #35546b;
border-top-color:#43eeb8;
border-radius:50%;
margin:20px auto;
animation:spin .8s linear infinite
}

@keyframes spin{
to{transform:rotate(360deg)}
}

@media(max-width:600px){
.center{min-height:75px}
.center b{font-size:29px}
.center small{font-size:8px}
}
`;

document.body.innerHTML=`
<style>${style}</style>

<div id="overlay">
<div class="overlayBox">
<h2>ANÁLISE BETA V${VERSION}</h2>

<div class="spinner"></div>

<h2>RECALCULANDO ANÁLISES</h2>

<p id="busyText">
REINICIANDO OS TREINADORES
</p>

<div class="muted">
TREINADOR GLOBAL NÚMERO<br>
TREINADOR GLOBAL G1<br>
12 MOTORES E SEIS CENTRAIS
</div>
</div>
</div>

<main>

<h1>ANÁLISE BETA V${VERSION}</h1>

<div class="subtitle">
TREINADOR GLOBAL NÚMERO<br>
TREINADOR GLOBAL G1 POR NÚMERO<br>
12 MOTORES • 6 CENTRAIS • 28 NÚMEROS<br>
JANELA AUTOMÁTICA 90 + 10
</div>

<section class="panel">
<div class="title">IMPORTAR HISTÓRICO</div>

<textarea id="paste"
placeholder="Cole os números do mais antigo ao mais recente"></textarea>

<div class="row">
<button class="btn" id="import">
IMPORTAR
</button>

<button class="btn" id="clear">
ZERAR TUDO
</button>
</div>

<div class="title">
LANÇAMENTOS MANUAIS
</div>

<div class="counter" id="counter">
0 / 10
</div>

<div class="bar">
<div class="fill" id="fill"></div>
</div>

<div class="muted" id="window"></div>
</section>

<section class="panel">

<div class="title">
TREINADORES
</div>

<div class="row">

<button class="btn" id="globalButton">
TREINADOR GLOBAL NÚMERO
</button>

<button class="btn" id="g1Button">
TREINADOR GLOBAL G1
</button>

</div>

<div class="title">
ESCOLHA MANUAL DOS 12 MOTORES
</div>

<div class="row" id="motorButtons"></div>

<div id="activeInfo"></div>

<div class="centers" id="centers"></div>

<div class="title">
9 NÚMEROS DESCOBERTOS
</div>

<div class="cloud" id="uncovered"></div>

</section>

<section class="panel">
<div class="title">
INSERIR NÚMERO MANUALMENTE
</div>

<div class="keys" id="keys"></div>
</section>

<section class="panel">
<div class="title">
ÚLTIMOS 14 NÚMEROS
</div>

<div class="cloud" id="lastNumbers"></div>
</section>

<section class="panel">
<div class="title">
TREINADOR GLOBAL NÚMERO
</div>

<div id="numberTrainer"></div>
</section>

<section class="panel">
<div class="title">
TREINADOR GLOBAL G1
</div>

<div id="g1Trainer"></div>
</section>

<section class="panel">
<div class="title">
RANKING DOS 12 MOTORES
</div>

<div id="motorRanking"></div>
</section>

<section class="panel">
<div class="title">
RESULTADOS MANUAIS ARQUIVADOS
</div>

<div id="manualResults"></div>
</section>

<section class="panel">
<div class="title">
LINHA DO TEMPO DA JANELA ATUAL
</div>

<div id="timeline"></div>
</section>

</main>
`;

/* =====================================================
   ELEMENTOS VISUAIS
===================================================== */

function centerHTML(play) {
if(!play)return "";

return play.blocks.map(b=>`
<div class="center ${
b.radius===1?"short":""
}">
<b>${b.center}</b>
<small>
${b.radius===1?"1 VIZINHO":"2 VIZINHOS"}
</small>
</div>
`).join("");
}

function cloudHTML(numbers) {
return numbers.map(n=>`
<span>${n}</span>
`).join("");
}

function table(headers,rows) {
return `
<div class="tablewrap">
<table>
<thead>
<tr>
${headers.map(h=>`
<th>${esc(h)}</th>
`).join("")}
</tr>
</thead>
<tbody>
${rows.map(row=>`
<tr>
${row.map(v=>`
<td>${v}</td>
`).join("")}
</tr>
`).join("")}
</tbody>
</table>
</div>
`;
}

function resultsHTML(rows) {
const green=rows.filter(
r=>r.result==="GREEN"
).length;

const g1=rows.filter(
r=>r.result==="GREEN G1"
).length;

const loss=rows.filter(
r=>r.result==="LOSS"
).length;

const total=green+g1+loss;

return `
<div class="metrics">
<div class="metric">
<small>GREEN</small>
<b class="good">${green}</b>
</div>

<div class="metric">
<small>GREEN G1</small>
<b class="good">${g1}</b>
</div>

<div class="metric">
<small>LOSS</small>
<b class="bad">${loss}</b>
</div>

<div class="metric">
<small>CICLOS FECHADOS</small>
<b>${total}</b>
</div>

<div class="metric">
<small>ACERTOS</small>
<b>${green+g1}</b>
</div>

<div class="metric">
<small>APROVEITAMENTO</small>
<b>${percent(green+g1,total)}</b>
</div>
</div>
`;
}

/* =====================================================
   RENDERIZAÇÃO
===================================================== */

function render() {
const h=S.history;

const cs=candidates(h);
const ranked=rankCandidates(h,cs);

const active=S.realPhase==="GALE"
?S.realDefense
:S.globalOn
?chooseGlobal(h,cs)
:cs.find(c=>c.id===S.manualMotor)||cs[0];

$("counter").textContent=
S.manualCount+" / "+LIMIT;

$("fill").style.width=
(100*S.manualCount/LIMIT)+"%";

$("window").textContent=
"JANELA ATUAL: "+h.length+
" NÚMEROS • "+
"RESTANTES: "+(LIMIT-S.manualCount)+
" • RECÁLCULOS: "+S.completed;

$("globalButton").classList.toggle(
"on",S.globalOn
);

$("g1Button").classList.toggle(
"on",S.g1On
);

$("globalButton").textContent=
S.globalOn
?"● TREINADOR GLOBAL NÚMERO ATIVO"
:"○ TREINADOR GLOBAL NÚMERO DESLIGADO";

$("g1Button").textContent=
S.g1On
?"● TREINADOR GLOBAL G1 ATIVO"
:"○ TREINADOR GLOBAL G1 DESLIGADO";

$("motorButtons").innerHTML=
cs.filter(c=>c.type==="MOTOR").map(c=>`
<button class="btn ${
!S.globalOn&&S.manualMotor===c.id
?"active":""
}" data-motor="${esc(c.id)}">
${esc(c.name)}
</button>
`).join("");

for(const b of document.querySelectorAll(
"[data-motor]"
)) {
b.onclick=()=>{
if(busy)return;

S.globalOn=false;
S.manualMotor=b.dataset.motor;

save();
render();
};
}

$("activeInfo").innerHTML=`
<div class="box">
<b>ESTADO:</b>
${S.realPhase}

<p>
<b>COMBINAÇÃO:</b>
${esc(active?.name||"AGUARDANDO")}
</p>

<p>
<b>ÚLTIMO NÚMERO:</b>
${h.at(-1)??"—"}
</p>

<p>
<b>COMPORTAMENTO G1:</b>
${h.length?regime(h.at(-1)):"—"}
</p>
</div>
`;

$("centers").innerHTML=
centerHTML(active?.play);

$("uncovered").innerHTML=
cloudHTML(uncovered(active?.play));

$("lastNumbers").innerHTML=
h.slice(-14).reverse().map(n=>`
<span style="
background:${
n===0?"#087f57":
RED.has(n)?"#a82941":"#121820"
}">
${n}
</span>
`).join("");

renderNumberTrainer(h,ranked);
renderG1Trainer(h);
renderMotors(h,cs);
renderManual();
renderTimeline();
}

function renderNumberTrainer(h,ranked) {
if(!h.length) {
$("numberTrainer").innerHTML=
'<div class="box">AGUARDANDO HISTÓRICO.</div>';
return;
}

const trigger=h.at(-1);

const pairs=transitions(h,trigger);

const winner=ranked[0];

$("numberTrainer").innerHTML=`
<div class="box">
<b>NÚMERO GATILHO: ${trigger}</b>

<p>
OCORRÊNCIAS ANTERIORES COM
RESULTADO SEGUINTE:
${pairs.length}
</p>

<p>
MELHOR COMBINAÇÃO:
${esc(winner?.name||"—")}
</p>

<p>
TESTES VIRTUAIS ESPECÍFICOS:
${winner?.observations||0}
</p>

<p>
ACERTOS VIRTUAIS:
${winner?.hits||0}
</p>

<p>
APROVEITAMENTO:
${percent(
winner?.hits||0,
winner?.observations||0
)}
</p>
</div>

<div class="title">
MELHORES COMBINAÇÕES PARA
O NÚMERO ${trigger}
</div>

${table(
[
"#",
"COMBINAÇÃO",
"TESTES",
"GREEN",
"ACERTO",
"ÍNDICE"
],
ranked.map((c,i)=>[
i+1,
esc(c.name),
c.observations,
c.hits,
percent(c.hits,c.observations),
(c.score*100).toFixed(1)
])
)}

<div class="title">
CENTRAIS DA MELHOR COMBINAÇÃO
</div>

<div class="centers">
${centerHTML(winner?.play)}
</div>

<div class="title">
RESULTADOS ANTERIORES APÓS ${trigger}
</div>

<div class="cloud">
${cloudHTML(
pairs.map(x=>x.next).slice(-25)
)}
</div>

<div class="muted">
O treinador compara as combinações
utilizando apenas os resultados
anteriores ao próximo lançamento.
Quando existem poucos testes, o
índice é suavizado para evitar
confiança excessiva.
</div>
`;
}

function renderG1Trainer(h) {
if(!h.length) {
$("g1Trainer").innerHTML=
'<div class="box">AGUARDANDO HISTÓRICO.</div>';
return;
}

const trigger=S.realPhase==="GALE"
?S.lastG1Decision?.trigger
:h.at(-1);

const entry=S.realPhase==="GALE"
?S.realEntry
:chooseGlobal(h,candidates(h));

const ranked=entry&&trigger!==undefined
?rankG1(entry,trigger,h)
:[];

const active=S.realPhase==="GALE"
?S.realDefense
:ranked[0];

const behavior=regime(trigger);

const same=S.g1Records.filter(
r=>r.trigger===trigger
);

const hit=same.filter(r=>r.hit).length;

const counts={
CONTINUIDADE:0,
DESLOCAMENTO:0,
RUPTURA:0
};

for(const r of S.g1Records) {
if(r.behavior in counts) {
counts[r.behavior]++;
}
}

$("g1Trainer").innerHTML=`
<div class="box">
<b>GATILHO G1: ${trigger}</b>

<p>
COMPORTAMENTO:
<strong>${behavior}</strong>
</p>

<p>
DEFESA ESCOLHIDA:
<strong>${esc(active?.name||"—")}</strong>
</p>

<p>
TESTES G1 ASSOCIADOS AO NÚMERO:
${same.length}
</p>

<p>
GREEN G1 VIRTUAIS:
${hit}
</p>

<p>
APROVEITAMENTO:
${percent(hit,same.length)}
</p>
</div>

<div class="title">
COMPARAÇÃO DAS DEFESAS
PARA O NÚMERO ${trigger}
</div>

${table(
[
"#",
"DEFESA",
"TESTES",
"GREEN G1",
"LOSS",
"ACERTO",
"ÍNDICE"
],
ranked.map((c,i)=>[
i+1,
esc(c.name),
c.tests,
c.hits,
c.tests-c.hits,
percent(c.hits,c.tests),
(c.score*100).toFixed(1)
])
)}

<div class="title">
CENTRAIS DA DEFESA ESCOLHIDA
</div>

<div class="centers">
${centerHTML(active?.play)}
</div>

<div class="title">
9 DESCOBERTOS DA DEFESA
</div>

<div class="cloud">
${cloudHTML(uncovered(active?.play))}
</div>

<div class="title">
COMPORTAMENTOS IDENTIFICADOS
</div>

<div class="metrics">
${Object.entries(counts).map(([name,count])=>`
<div class="metric">
<small>${name}</small>
<b>${count}</b>
</div>
`).join("")}
</div>

<div class="muted">
Se a combinação original apresentar
falhas, o G1 compara CONGELADA,
AJUSTE FINO, RECONSTRUÇÃO e
TROCAS DE MOTOR.

A defesa é definida antes do
resultado do próximo giro.
</div>
`;
}

function renderMotors(h,cs) {
if(!cs.length) {
$("motorRanking").innerHTML=
'<div class="box">AGUARDANDO HISTÓRICO.</div>';
return;
}

const trigger=h.at(-1);

const motors=cs.filter(
c=>c.type==="MOTOR"
);

const rows=motors.map(c=>{
const st=readStat(
S.stats,trigger,c.id
);

return {
...c,
tests:st.total,
hits:st.hit,
score:scoreStat(st)
};
}).sort((a,b)=>b.score-a.score);

$("motorRanking").innerHTML=table(
[
"#",
"MOTOR",
"TESTES",
"GREEN",
"ACERTO",
"ÍNDICE"
],
rows.map((c,i)=>[
i+1,
esc(c.name),
c.tests,
c.hits,
percent(c.hits,c.tests),
(c.score*100).toFixed(1)
])
);
}

function renderManual() {
$("manualResults").innerHTML=`
${resultsHTML(S.manual)}

<div class="box">
REGISTROS MANUAIS ARQUIVADOS:
<b>${S.manual.length}</b>

<p>
ESSES REGISTROS NÃO SÃO
REUTILIZADOS NO TREINAMENTO
DA PRÓXIMA JANELA.
</p>
</div>

${S.manual.slice(-25).reverse().map(r=>`
<div class="line">
<b>${r.number}</b>
•
<span class="${
r.result==="LOSS"?"bad":"good"
}">
${esc(r.result)}
</span>
•
${esc(r.motor)}
</div>
`).join("")}
`;
}

function renderTimeline() {
$("timeline").innerHTML=
S.records.slice(-35).reverse().map(r=>`
<div class="line">
<b>GIRO ${r.turn}</b>
•
NÚMERO ${r.number}
•
<span class="${
r.result==="LOSS"?"bad":
r.result.startsWith("GREEN")?"good":""
}">
${esc(r.result)}
</span>

<div class="muted">
GATILHO: ${r.trigger??"—"}
•
MOTOR: ${esc(r.motor)}
•
${esc(r.source)}
</div>
</div>
`).join("");
}

/* =====================================================
   EVENTOS
===================================================== */

$("import").onclick=importHistory;
$("clear").onclick=clearAll;

$("globalButton").onclick=()=>{
if(busy)return;

S.globalOn=!S.globalOn;

save();
render();
};

$("g1Button").onclick=()=>{
if(busy)return;

S.g1On=!S.g1On;

save();
render();
};

for(let n=0;n<=36;n++) {
const b=document.createElement("button");

b.className="key"+(n===0?" zero":"");

b.textContent=n;

b.style.background=
n===0?"#087e53":
RED.has(n)?"#ac2b43":"#11151c";

b.onclick=()=>manualSpin(n);

$("keys").appendChild(b);
}

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

render();

if(S.manualCount>=LIMIT) {
setTimeout(()=>{
rebuild(
S.history.slice(-BASE),
true,
true
);
},0);
}

})();
