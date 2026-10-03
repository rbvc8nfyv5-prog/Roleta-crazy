(function(){
"use strict";

/* ============================================================
   ANÁLISE ALPHA — MOTOR NORMAL / CONTAGEM PÓS-GATILHO

   - SOMENTE MOTOR NORMAL.
   - MOTOR DINÂMICO REMOVIDO.
   - RX REMOVIDO.
   - OFFSET DINÂMICO REMOVIDO.
   - AUTO ENTRE MOTORES REMOVIDO.
   - CONTAGEM DE CARTAS / PÓS-GATILHO.
   - HISTÓRICO DE ATÉ 200 GIROS.
   - A ATÉ 5 = +1.
   - 6 ATÉ 9 = 0.
   - 10 / J / Q / K = -1.
   - ZERO = NEUTRO.
   - GATILHO = CONTAGEM ACUMULADA ATUAL.
   - PROCURA OCORRÊNCIAS ANTERIORES DO MESMO GATILHO.
   - ANALISA OS 3 GIROS SEGUINTES.
   - PESOS 3 / 2 / 1.
   - 5 ALVOS.
   - 2 VIZINHOS DE CADA LADO.
   - 25 NÚMEROS ÚNICOS.
   - SEM SOBREPOSIÇÃO.
   - G1 PRESERVADO.
============================================================ */

/* ============================================================
   STORAGE
============================================================ */

const STORAGE_KEY =
"ANALISADOR_069_IDS_CORRESPONDENTES_V1";

const STORAGE_HISTORICO_COMPLETO =
"ANALISE_BETA_HISTORICO_COMPLETO_200_V1";

const STORAGE_ENGINE =
"ANALISE_ALPHA_NORMAL_CONTAGEM_V2";

const STORAGE_DUPLAS =
"ANALISE_BETA_DUPLAS_CONTAGEM_V1";

const STORAGE_FREEZE =
"ANALISE_BETA_JOGADA_CONGELADA_CONTAGEM_V1";

/* ============================================================
   CONSTANTES
============================================================ */

const MAX_HISTORICO = 20;
const MAX_HISTORICO_BACKTEST = 200;
const MAX_TIMELINE = 300;

/* ============================================================
   ROLETA EUROPEIA
============================================================ */

const track = [
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const vermelhos = new Set([
1,3,5,7,9,12,14,16,18,
19,21,23,25,27,30,32,34,36
]);

/* ============================================================
   UTILIDADES
============================================================ */

function limitar20(base){
if(!Array.isArray(base)) return [];
return base.slice(-MAX_HISTORICO);
}

function limitarBacktest(base){
if(!Array.isArray(base)) return [];
return base.slice(-MAX_HISTORICO_BACKTEST);
}

function indice(n){
return track.indexOf(n);
}

function setor(centro,qtd){
const i=indice(centro);
if(i<0) return [];

const r=[];

for(let d=-qtd;d<=qtd;d++){
r.push(
track[(i+d+37)%37]
);
}

return r;
}

function distanciaRoda(a,b){
const ia=indice(a);
const ib=indice(b);

if(ia<0 || ib<0)
return 99;

const d=Math.abs(ia-ib);
return Math.min(d,37-d);
}

function deltaRoda(centro,numero){
const a=indice(centro);
const b=indice(numero);

if(a<0 || b<0)
return 0;

let d=(b-a+37)%37;

if(d>18)
d-=37;

return d;
}

function corRoleta(n){
if(n===0)
return "#087c48";

return vermelhos.has(n)
?"#c6283d"
:"#181818";
}

/* ============================================================
   HISTÓRICO
============================================================ */

function carregarHistoricoCompleto(){

try{

const raw=
localStorage.getItem(
STORAGE_HISTORICO_COMPLETO
);

if(!raw)
return [];

const arr=
JSON.parse(raw);

if(!Array.isArray(arr))
return [];

return limitarBacktest(
arr
.map(Number)
.filter(n=>
Number.isInteger(n) &&
n>=0 &&
n<=36
)
);

}catch(e){

return [];

}

}

function carregarHistorico(){

try{

const completo=
carregarHistoricoCompleto();

if(completo.length)
return completo.slice(-MAX_HISTORICO);

const raw=
localStorage.getItem(
STORAGE_KEY
);

if(!raw)
return [];

const arr=
JSON.parse(raw);

if(!Array.isArray(arr))
return [];

return limitar20(
arr
.map(Number)
.filter(n=>
Number.isInteger(n) &&
n>=0 &&
n<=36
)
);

}catch(e){

return [];

}

}

let historicoCompleto=
carregarHistoricoCompleto();

let historico=
carregarHistorico();

if(
!historicoCompleto.length &&
historico.length
){
historicoCompleto=
historico.slice();
}

function salvarHistorico(){

historico=
limitar20(historico);

historicoCompleto=
limitarBacktest(
historicoCompleto
);

try{

localStorage.setItem(
STORAGE_KEY,
JSON.stringify(historico)
);

localStorage.setItem(
STORAGE_HISTORICO_COMPLETO,
JSON.stringify(historicoCompleto)
);

}catch(e){}

}

/* ============================================================
   ESTADO — SOMENTE NORMAL
============================================================ */

let estado={
timeline:[],
pendente:null,
freeze:null
};

function carregarEstado(){

try{

const raw=
localStorage.getItem(
STORAGE_ENGINE
);

if(!raw)
return;

const x=
JSON.parse(raw);

if(
x &&
Array.isArray(x.timeline)
)
estado.timeline=
x.timeline.slice(-MAX_TIMELINE);

if(
x &&
Object.prototype.hasOwnProperty.call(
x,
"pendente"
)
)
estado.pendente=x.pendente;

if(
x &&
Object.prototype.hasOwnProperty.call(
x,
"freeze"
)
)
estado.freeze=x.freeze;

}catch(e){}

}

function salvarEstado(){

try{

localStorage.setItem(
STORAGE_ENGINE,
JSON.stringify(estado)
);

}catch(e){}

}

carregarEstado();

/* ============================================================
   VISUAL
============================================================ */

let duplasVisual=[];

function carregarDuplasVisual(){

try{

const raw=
localStorage.getItem(
STORAGE_DUPLAS
);

if(!raw)
return;

const arr=
JSON.parse(raw);

if(Array.isArray(arr))
duplasVisual=
arr.slice(-14);

}catch(e){}

}

function salvarDuplasVisual(){

duplasVisual=
duplasVisual.slice(-14);

try{

localStorage.setItem(
STORAGE_DUPLAS,
JSON.stringify(duplasVisual)
);

}catch(e){}

}

carregarDuplasVisual();

/* ============================================================
   JOGADA CONGELADA
============================================================ */

let jogadaCongelada=null;

function salvarJogadaCongelada(){

try{

localStorage.setItem(
STORAGE_FREEZE,
JSON.stringify(jogadaCongelada)
);

}catch(e){}

}

function carregarJogadaCongelada(){

try{

const raw=
localStorage.getItem(
STORAGE_FREEZE
);

if(!raw)
return;

const x=
JSON.parse(raw);

if(
x &&
x.valido &&
x.jogada
)
jogadaCongelada=x;

}catch(e){}

}

carregarJogadaCongelada();

/* ============================================================
   CONTAGEM DE CARTAS
============================================================ */

function cartaDoNumero(numero){

if(numero===0)
return "0";

const valor=
((numero-1)%13)+1;

if(valor===1)
return "A";

if(valor>=2 && valor<=10)
return String(valor);

if(valor===11)
return "J";

if(valor===12)
return "Q";

return "K";

}

function valorContagemCarta(numero){

if(numero===0)
return 0;

const valor=
((numero-1)%13)+1;

if(valor>=1 && valor<=5)
return 1;

if(valor>=6 && valor<=9)
return 0;

return -1;

}

function contagemAcumuladaCartas(base){

let acumulada=0;

return base.map(numero=>{

acumulada+=
valorContagemCarta(numero);

return acumulada;

});

}

/* ============================================================
   VALIDA SOBREPOSIÇÃO
============================================================ */

function blocosSemSobreposicao(blocos){

const usados=
new Set();

for(const bloco of blocos){

for(const numero of bloco.numeros){

if(usados.has(numero))
return false;

usados.add(numero);

}

}

return usados.size===
blocos.length*5;

}

/* ============================================================
   MOTOR NORMAL — PÓS-GATILHO
============================================================ */

function analisarPosGatilho(base){

base=
limitarBacktest(base);

if(!base.length){

return {
valido:false,
contagemAtual:0,
ocorrencias:0,
forca:0,
ranking:[],
blocos2:[],
numeros:new Set(),
pesoTotal:0,
pesoCapturado:0
};

}

const acumuladas=
contagemAcumuladaCartas(base);

const contagemAtual=
acumuladas[
acumuladas.length-1
];

const ocorrencias=[];

const pontosResultado=
new Map();

track.forEach(n=>
pontosResultado.set(n,0)
);

let pesoTotal=0;

/* ============================================================
   LOCALIZA GATILHOS HISTÓRICOS
============================================================ */

for(
let i=0;
i<acumuladas.length-1;
i++
){

if(
acumuladas[i]!==contagemAtual
)
continue;

if(
i+3>=base.length
)
continue;

const seguintes=[
base[i+1],
base[i+2],
base[i+3]
];

const pesos=[3,2,1];

ocorrencias.push({
indice:i,
contagem:acumuladas[i],
seguintes:seguintes.slice()
});

seguintes.forEach(
(numero,pos)=>{

const peso=
pesos[pos];

pontosResultado.set(
numero,
(pontosResultado.get(numero)||0)+peso
);

pesoTotal+=peso;

});

}

if(!ocorrencias.length){

return {

valido:false,
contagemAtual,
ocorrencias:0,
forca:0,
ranking:[],
blocos2:[],
numeros:new Set(),
pesoTotal:0,
pesoCapturado:0,
acumuladas

};

}

/* ============================================================
   PONTUA OS 37 BLOCOS
============================================================ */

const ranking=
track.map(centro=>{

const numeros=
setor(
centro,
2
);

let score=0;

numeros.forEach(numero=>{

score+=
pontosResultado.get(numero)||0;

});

return {
numero:centro,
centro,
qtd:2,
numeros,
score
};

})
.sort(
(a,b)=>
b.score-a.score ||
indice(a.centro)-indice(b.centro)
);

/* ============================================================
   BUSCA DOS 5 BLOCOS SEM SOBREPOSIÇÃO

   PODA ADICIONADA PARA DEIXAR A BUSCA MAIS RÁPIDA.
   O RESULTADO CONTINUA SENDO A MELHOR COMBINAÇÃO GLOBAL.
============================================================ */

let melhor=null;

/*
   LIMITE SUPERIOR DE SCORE.

   Como o ranking está ordenado por score,
   se nem somando os melhores scores restantes
   for possível superar a melhor combinação já encontrada,
   a ramificação é encerrada.
*/

function limiteSuperior(
inicio,
faltam,
scoreAtual
){

let limite=
scoreAtual;

for(
let i=inicio;
i<ranking.length && faltam>0;
i++
){

limite+=ranking[i].score;
faltam--;

}

return limite;
}

function buscar(
inicio,
selecionados,
usados,
score
){

if(
selecionados.length===5
){

if(usados.size!==25)
return;

if(
!blocosSemSobreposicao(
selecionados
)
)
return;

if(
!melhor ||
score>melhor.score
){

melhor={
score,

blocos:
selecionados.map(b=>({
centro:b.centro,
qtd:2,
numeros:b.numeros.slice(),
score:b.score
})),

numeros:
new Set(usados)

};

}

return;

}

const faltam=
5-selecionados.length;

if(
ranking.length-inicio<
faltam
)
return;

if(
melhor &&
limiteSuperior(
inicio,
faltam,
score
)<=melhor.score
)
return;

for(
let i=inicio;
i<ranking.length;
i++
){

if(
ranking.length-i<
faltam
)
break;

const candidato=
ranking[i];

let conflito=false;

for(
const numero of candidato.numeros
){

if(usados.has(numero)){

conflito=true;
break;

}

}

if(conflito)
continue;

const novosUsados=
new Set(usados);

candidato.numeros
.forEach(n=>
novosUsados.add(n)
);

selecionados.push(
candidato
);

buscar(
i+1,
selecionados,
novosUsados,
score+candidato.score
);

selecionados.pop();

}

}

buscar(
0,
[],
new Set(),
0
);

if(
!melhor ||
melhor.blocos.length!==5 ||
melhor.numeros.size!==25
){

return {

valido:false,
contagemAtual,
ocorrencias:ocorrencias.length,
forca:0,
ranking,
blocos2:[],
numeros:new Set(),
pesoTotal,
pesoCapturado:0,
acumuladas

};

}

/* ============================================================
   FORÇA
============================================================ */

let pesoCapturado=0;

pontosResultado
.forEach((peso,numero)=>{

if(
melhor.numeros.has(numero)
)
pesoCapturado+=peso;

});

const forca=
pesoTotal
?pesoCapturado/pesoTotal*100
:0;

return {

valido:true,

contagemAtual,

ocorrencias:
ocorrencias.length,

ocorrenciasDetalhadas:
ocorrencias,

forca,

ranking,

blocos2:
melhor.blocos,

blocos1:[],

numeros:
melhor.numeros,

score:
melhor.score,

pesoTotal,

pesoCapturado,

acumuladas,

pontosResultado

};

}

/* ============================================================
   GERA JOGADA
============================================================ */

function gerarJogadaPosGatilho(
analise
){

if(
!analise ||
!analise.valido ||
analise.blocos2.length!==5 ||
analise.numeros.size!==25
){

return {
valido:false,
blocos2:[],
blocos1:[],
numeros:new Set()
};

}

if(
!blocosSemSobreposicao(
analise.blocos2
)
){

return {
valido:false,
blocos2:[],
blocos1:[],
numeros:new Set()
};

}

return {

valido:true,

blocos2:
analise.blocos2.map(b=>({
centro:b.centro,
qtd:2,
numeros:b.numeros.slice(),
score:b.score
})),

blocos1:[],

numeros:
new Set(
analise.numeros
),

score:
analise.score,

posGatilho:
analise

};

}

/* ============================================================
   CONFIGURAÇÃO NORMAL
============================================================ */

function gerarConfigNormal(base){

base=
limitarBacktest(base);

const posGatilho=
analisarPosGatilho(
base
);

if(!posGatilho.valido){

return {

valido:false,

motor:"NORMAL",

posGatilho,

contagem:
posGatilho,

convergencia:false,

similaridade:
posGatilho.forca||0

};

}

const jogada=
gerarJogadaPosGatilho(
posGatilho
);

return {

valido:
jogada.valido,

motor:"NORMAL",

posGatilho,

contagem:
posGatilho,

convergencia:
jogada.valido,

jogada,

similaridade:
posGatilho.forca

};

}

/* ============================================================
   CLASSIFICAÇÃO
============================================================ */

function classificarJogada(
numero,
jogada
){

if(
!jogada ||
!jogada.valido
){

return {
green:false,
tipo:"FORA",
lado:0
};

}

const blocos=[
...(jogada.blocos2||[]),
...(jogada.blocos1||[])
];

for(const b of blocos){

if(
b.numeros.includes(numero)
){

const d=
distanciaRoda(
numero,
b.centro
);

return {

green:true,

tipo:
d===0
?"ALVO"
:(d===1
?"V1"
:"V2"),

lado:
Math.sign(
deltaRoda(
b.centro,
numero
)
)

};

}

}

let melhor=null;

blocos.forEach(b=>{

const d=
distanciaRoda(
numero,
b.centro
);

const gap=
d-b.qtd;

if(
gap>0 &&
(
!melhor ||
gap<melhor.gap
)
){

melhor={
gap,
lado:
Math.sign(
deltaRoda(
b.centro,
numero
)
)
};

}

});

if(!melhor){

return {
green:false,
tipo:"FORA",
lado:0
};

}

return {

green:false,

tipo:
melhor.gap===1
?"FORA1"
:(melhor.gap===2
?"FORA2"
:"FORA"),

lado:
melhor.lado

};

}

/* ============================================================
   STATS
============================================================ */

function statsTimeline(lista){

if(!Array.isArray(lista))
lista=[];

function validos(arr){

return arr.filter(
x=>
!x.semJogada &&
!x.aguardandoG1
);

}

function taxa(arr,qtd){

const v=
validos(arr)
.slice(-qtd);

if(!v.length)
return 0;

return (
v.filter(
x=>x.green
).length/
v.length*
100
);

}

const todosValidos=
validos(lista);

let loss=0;

for(
let i=lista.length-1;
i>=0;
i--
){

const x=
lista[i];

if(
x.semJogada ||
x.aguardandoG1
)
continue;

if(x.green)
break;

loss++;

}

return {

total:
todosValidos.length,

totalLinha:
lista.length,

taxa5:
taxa(lista,5),

taxa10:
taxa(lista,10),

taxa20:
taxa(lista,20),

lossSeguidos:
loss,

timeline:
lista

};

}

/* ============================================================
   BACKTEST NORMAL

   CALCULADO SOMENTE UMA VEZ.
   NÃO EXISTEM MAIS 3 NORMAIS + 3 DINÂMICOS.
============================================================ */

function backtestNormal(base){

base=
limitarBacktest(base);

const timeline=[];

const inicio=
Math.min(
4,
base.length
);

for(
let i=inicio;
i<base.length;
i++
){

const passado=
base.slice(0,i);

const cfg=
gerarConfigNormal(
passado
);

if(!cfg.valido){

timeline.push({

resultado:
base[i],

semJogada:true,

green:null,

tipo:"SEM_JOGADA",

lado:0

});

continue;

}

const resultado=
base[i];

const r=
classificarJogada(
resultado,
cfg.jogada
);

timeline.push({

resultado,

semJogada:false,

green:r.green,

tipo:r.tipo,

lado:r.lado

});

}

return statsTimeline(
timeline
);

}

/* ============================================================
   ANÁLISE NORMAL ÚNICA
============================================================ */

function analisarNormal(base){

const cfg=
gerarConfigNormal(
base
);

if(!cfg.valido)
return null;

const bt=
backtestNormal(
base
);

return Object.assign(
{},
cfg,
{
backtest:bt,
live:
statsTimeline(
estado.timeline
)
}
);

}

/* ============================================================
   SNAPSHOT
============================================================ */

function assinatura(){

return (
historicoCompleto.length+
"|"+
historicoCompleto.join(",")
);

}

function snapshot(config){

if(
!config ||
!config.valido ||
!config.jogada ||
!config.jogada.valido
)
return null;

return {

assinatura:
assinatura(),

motor:"NORMAL",

centros2:
config.jogada
.blocos2
.map(x=>x.centro),

centro1:
config.jogada.blocos1[0]
?config.jogada
.blocos1[0]
.centro
:null

};

}

/* ============================================================
   SNAPSHOT -> JOGADA
============================================================ */

function jogadaDeSnapshot(p){

if(!p)
return null;

const blocos2=
(p.centros2||[])
.map(c=>({

centro:c,
qtd:2,
numeros:setor(c,2)

}));

const blocos1=
p.centro1!==null &&
p.centro1!==undefined

?[{

centro:p.centro1,
qtd:1,
numeros:setor(
p.centro1,
1
)

}]

:[];

const numeros=
new Set();

blocos2.forEach(b=>
b.numeros.forEach(
n=>numeros.add(n)
)
);

blocos1.forEach(b=>
b.numeros.forEach(
n=>numeros.add(n)
)
);

return {

valido:true,
blocos2,
blocos1,
numeros

};

}

function classificarSnapshot(
numero,
p
){

if(!p){

return {
green:false,
tipo:"FORA",
lado:0
};

}

return classificarJogada(
numero,
jogadaDeSnapshot(p)
);

}

/* ============================================================
   PENDENTE NORMAL
============================================================ */

function garantirPendente(config){

const sig=
assinatura();

if(
!estado.freeze &&
(
!estado.pendente ||
estado.pendente.assinatura!==sig
)
){

estado.pendente=
snapshot(config);

}

salvarEstado();

}

/* ============================================================
   G1
============================================================ */

function avaliarLinhaComG1(
numero,
p,
lista,
freeze,
sig
){

if(!Array.isArray(lista))
lista=[];

if(freeze){

const r=
classificarSnapshot(
numero,
freeze
);

let indicePendente=-1;

for(
let i=lista.length-1;
i>=0;
i--
){

if(
lista[i] &&
lista[i].aguardandoG1===true
){

indicePendente=i;
break;

}

}

const finalizado={

resultado:
indicePendente>=0
?lista[indicePendente].resultado
:null,

resultadoEntrada:
indicePendente>=0
?lista[indicePendente].resultado
:null,

resultadoG1:
numero,

semJogada:false,

green:r.green,

tipo:r.tipo,

lado:r.lado,

fase:
r.green
?"G1"
:"LOSS",

g1:
r.green,

aguardandoG1:false,

hora:
indicePendente>=0
?lista[indicePendente].hora
:Date.now(),

horaG1:
Date.now()

};

if(indicePendente>=0){

lista[indicePendente]=
Object.assign(
{},
lista[indicePendente],
finalizado
);

}else{

lista.push(
finalizado
);

}

return {

lista:
lista.slice(-MAX_TIMELINE),

freeze:null,

pendente:null

};

}

if(
!p ||
p.assinatura!==sig
){

lista.push({

resultado:numero,

semJogada:true,

green:null,

tipo:"SEM_JOGADA",

lado:0,

fase:"SEM",

g1:false,

aguardandoG1:false,

hora:Date.now()

});

return {

lista:
lista.slice(-MAX_TIMELINE),

freeze:null,

pendente:null

};

}

const r=
classificarSnapshot(
numero,
p
);

if(r.green){

lista.push({

resultado:numero,

semJogada:false,

green:true,

tipo:r.tipo,

lado:r.lado,

fase:"ENTRADA",

g1:false,

aguardandoG1:false,

hora:Date.now()

});

return {

lista:
lista.slice(-MAX_TIMELINE),

freeze:null,

pendente:null

};

}

lista.push({

resultado:numero,

resultadoEntrada:numero,

resultadoG1:null,

semJogada:false,

green:null,

tipo:r.tipo,

lado:r.lado,

fase:"ESPERA_G1",

g1:false,

aguardandoG1:true,

hora:Date.now()

});

return {

lista:
lista.slice(-MAX_TIMELINE),

freeze:
Object.assign({},p),

pendente:null

};

}

/* ============================================================
   AVALIA SOMENTE A LINHA NORMAL
============================================================ */

function avaliarPendente(numero){

const sig=
assinatura();

const resultado=
avaliarLinhaComG1(

numero,

estado.pendente,

estado.timeline,

estado.freeze,

sig

);

estado.timeline=
resultado.lista;

estado.freeze=
resultado.freeze;

estado.pendente=
resultado.pendente;

salvarEstado();

}

/* ============================================================
   COPIA JOGADA
============================================================ */

function copiarJogada(config){

if(
!config ||
!config.valido ||
!config.jogada ||
!config.jogada.valido
)
return null;

return {

valido:true,

motor:"NORMAL",

jogada:{

valido:true,

blocos2:
config.jogada.blocos2
.map(b=>({

centro:b.centro,
qtd:2,
numeros:b.numeros.slice()

})),

blocos1:
config.jogada.blocos1
.map(b=>({

centro:b.centro,
qtd:1,
numeros:b.numeros.slice()

}))

}

};

}

/* ============================================================
   VISUAL G1
============================================================ */

function ultimoVisualEsperaG1(){

if(!duplasVisual.length)
return false;

const ultimo=
duplasVisual[
duplasVisual.length-1
];

return (
ultimo &&
ultimo.fase==="ESPERA_G1"
);

}

/* ============================================================
   INSERIR NÚMERO
============================================================ */

function adicionarNumero(numero){

/*
   SOMENTE A JOGADA ATUAL É CALCULADA ANTES DO RESULTADO.
   NÃO EXISTE MAIS CÁLCULO DOS 6 MOTORES.
*/

const baseAntes=
historicoCompleto.slice(
-MAX_HISTORICO_BACKTEST
);

const ativaAntes=
gerarConfigNormal(
baseAntes
);

const configAntes=
jogadaCongelada ||
ativaAntes;

const eraG1=
ultimoVisualEsperaG1();

avaliarPendente(
numero
);

historicoCompleto.push(
numero
);

historicoCompleto=
historicoCompleto.slice(
-MAX_HISTORICO_BACKTEST
);

historico=
historicoCompleto.slice(
-MAX_HISTORICO
);

salvarHistorico();

if(eraG1){

const ultima=
duplasVisual[
duplasVisual.length-1
];

ultima.g1=
numero;

ultima.fase=
"FINALIZADO";

if(
jogadaCongelada &&
jogadaCongelada.jogada
){

const r=
classificarJogada(
numero,
jogadaCongelada.jogada
);

ultima.g1Green=
r.green;

ultima.green=
r.green;

}else{

ultima.g1Green=null;
ultima.green=null;

}

jogadaCongelada=null;

salvarJogadaCongelada();
salvarDuplasVisual();

}else{

let resultadoAtivo=null;

if(
configAntes &&
configAntes.valido &&
configAntes.jogada
){

resultadoAtivo=
classificarJogada(
numero,
configAntes.jogada
);

}

const entrada={

resultado:numero,

g1:null,

g1Green:null,

semJogada:
!configAntes ||
!configAntes.valido ||
!configAntes.jogada ||
!configAntes.jogada.valido,

green:
resultadoAtivo
?(
resultadoAtivo.green
?true
:null
)
:null,

fase:
resultadoAtivo &&
resultadoAtivo.green===false
?"ESPERA_G1"
:"FINALIZADO",

motor:"NORMAL"

};

duplasVisual.push(
entrada
);

duplasVisual=
duplasVisual.slice(-14);

if(
resultadoAtivo &&
resultadoAtivo.green===false
){

jogadaCongelada=
copiarJogada(
configAntes
);

}else{

jogadaCongelada=null;

}

salvarJogadaCongelada();
salvarDuplasVisual();

}

render();

}

/* ============================================================
   HISTÓRICO MANUAL
============================================================ */

function extrairNumeros(texto){

const encontrados=
texto.match(
/\b(?:[0-9]|[12][0-9]|3[0-6])\b/g
);

if(!encontrados)
return [];

return encontrados
.map(Number)
.slice(-MAX_HISTORICO_BACKTEST);

}

function resetarEstadoAnalise(){

estado={
timeline:[],
pendente:null,
freeze:null
};

duplasVisual=[];

jogadaCongelada=null;

salvarJogadaCongelada();
salvarDuplasVisual();
salvarEstado();

}

function inserirHistorico(){

const campo=
document.getElementById(
"entradaHistorico"
);

const numeros=
extrairNumeros(
campo.value
);

if(!numeros.length)
return;

historicoCompleto=
numeros.slice(
-MAX_HISTORICO_BACKTEST
);

historico=
historicoCompleto.slice(
-MAX_HISTORICO
);

resetarEstadoAnalise();

salvarHistorico();

campo.value="";

render();

}

/* ============================================================
   APAGAR
============================================================ */

function apagarUltimo(){

if(!historicoCompleto.length)
return;

historicoCompleto.pop();

historico=
historicoCompleto.slice(
-MAX_HISTORICO
);

resetarEstadoAnalise();

salvarHistorico();

render();

}

function apagarTudo(){

if(
!confirm(
"Apagar histórico?"
)
)
return;

historico=[];
historicoCompleto=[];

resetarEstadoAnalise();

salvarHistorico();

render();

}

/* ============================================================
   INTERFACE
============================================================ */

document.body.innerHTML="";

document.body.style.cssText=
"margin:0;"+
"background:#101010;"+
"color:#fff;"+
"font-family:Arial,sans-serif;";

const app=
document.createElement(
"div"
);

app.innerHTML=`

<style>

*{box-sizing:border-box}

body{background:#101010}

.app{
max-width:900px;
margin:auto;
padding:7px
}

h2{
text-align:center;
font-size:20px;
margin:5px
}

.painel{
background:#1c1c1f;
border:1px solid #414141;
border-radius:10px;
padding:8px;
margin-bottom:7px
}

.titulo{
font-size:9px;
font-weight:900;
color:#888;
margin-bottom:5px
}

textarea{
width:100%;
height:60px;
background:#111;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:7px
}

.botoes{
display:flex;
gap:5px;
flex-wrap:wrap;
margin-top:5px
}

button{
cursor:pointer;
font-family:Arial;
font-weight:900
}

.btn{
border:1px solid #555;
background:#333;
color:#fff;
border-radius:7px;
padding:7px 10px
}

.btn.verde{background:#17643b}
.btn.red{background:#762832}

.motorNormal{
margin-top:6px;
padding:8px;
background:#111;
border:1px solid #00e5ff;
border-radius:7px;
font-size:9px;
font-weight:900;
text-align:center;
color:#00e5ff
}

.contagemBox{
margin-top:6px;
padding:7px;
background:#111;
border:1px solid #555;
border-radius:7px;
font-size:8px;
font-weight:900;
text-align:center
}

.contagemBox.ativa{
border-color:#00e676;
color:#00e676
}

.contagemBox.espera{
border-color:#ffc107;
color:#ffc107
}

.resumo{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:4px;
margin-top:7px
}

.card{
background:#111;
border:1px solid #333;
border-radius:7px;
padding:7px;
text-align:center
}

.card small{
display:block;
font-size:7px;
color:#777;
font-weight:900
}

.card strong{
font-size:13px
}

.timelineSecao{
margin-top:8px;
padding-top:6px;
border-top:1px solid #333
}

.timelineTituloGrupo{
font-size:8px;
font-weight:900;
margin-bottom:4px;
color:#aaa
}

.timelineRow{
display:grid;
grid-template-columns:80px 1fr 42px;
gap:4px;
align-items:center;
margin-top:4px
}

.timeline{
display:flex;
gap:2px;
justify-content:flex-end;
overflow:hidden
}

.gl{
width:18px;
height:18px;
min-width:18px;
border-radius:4px;
font-size:7px;
display:flex;
align-items:center;
justify-content:center;
font-weight:900;
color:#fff
}

.gl.green{background:#00994d}
.gl.loss{background:#c62828}
.gl.g1{background:#ffc107;color:#111}

.gl.wait{
background:#4a3510;
border:1px solid #ffc107;
color:#ffc107
}

.gl.sem{
background:#333;
border:1px solid #555;
color:#999
}

.nomeTL,
.taxaTL{
font-size:8px;
font-weight:900
}

.taxaTL{
text-align:right
}

.duplas14{
display:grid;
grid-template-columns:repeat(7,1fr);
gap:5px;
width:100%
}

.dupla14{
min-width:0;
min-height:65px;
border-radius:7px;
display:flex;
align-items:flex-start;
justify-content:center;
background:#272727;
border:2px solid #555;
position:relative;
padding:6px 4px 26px
}

.dupla14.green{
background:rgba(0,153,77,.18);
border-color:#00b85c
}

.dupla14.loss{
background:rgba(198,40,40,.18);
border-color:#d93a3a
}

.dupla14.g1{
background:rgba(255,193,7,.16);
border-color:#ffc107
}

.dupla14.wait{
background:rgba(255,193,7,.08);
border-color:#8a6b00
}

.dupla14.sem{
background:#292929;
border-color:#666
}

.bolaDupla{
width:31px;
height:31px;
min-width:31px;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
font-size:11px;
font-weight:900;
color:#fff;
border:2px solid #aaa
}

.resultadoEntrada{
position:absolute;
left:50%;
bottom:2px;
transform:translateX(-50%);
height:19px;
min-width:26px;
padding:2px 5px;
border-radius:5px;
display:flex;
align-items:center;
justify-content:center;
gap:3px;
font-size:7px;
font-weight:900;
white-space:nowrap;
border:1px solid #777;
background:#171717
}

.resultadoEntrada.green{
background:#00994d;
border-color:#00e676
}

.resultadoEntrada.loss{
background:#c62828;
border-color:#ff5252
}

.resultadoEntrada.g1{
background:#ffc107;
border-color:#ffe082;
color:#111
}

.resultadoEntrada.wait{
background:#4a3510;
border-color:#ffc107;
color:#ffc107
}

.resultadoEntrada.sem{
background:#333;
border-color:#666;
color:#aaa
}

.jogadaStatus{
font-size:8px;
font-weight:900;
margin:3px 0 6px;
padding:4px 6px;
border-radius:5px;
display:inline-block;
background:#15323a;
color:#00e5ff;
border:1px solid #007d98
}

.jogadaStatus.congelada{
background:#4a3510;
color:#ffc107;
border-color:#ffc107
}

.jogada{
display:flex;
gap:5px;
overflow-x:auto;
margin-top:5px
}

.bloco{
min-width:135px;
background:#111;
border:1px solid #00e5ff;
border-radius:8px;
padding:7px;
text-align:center
}

.bloco small{
font-size:7px;
font-weight:900;
color:#888
}

.bloco strong{
display:block;
font-size:22px;
margin:3px
}

.numeros{
border-top:1px solid #333;
padding-top:4px;
font-size:9px;
font-weight:900
}

.teclado{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:4px
}

.numero{
height:37px;
border:1px solid #666;
border-radius:6px;
color:#fff
}

.zero{
grid-column:span 6
}

.status{
font-size:9px;
font-weight:900;
color:#00e676;
margin-top:5px
}

@media(max-width:600px){

.resumo{
grid-template-columns:repeat(2,1fr)
}

.duplas14{
grid-template-columns:repeat(4,1fr)
}

.timelineRow{
grid-template-columns:70px 1fr 36px
}

}

</style>

<div class="app">

<h2>ANÁLISE ALPHA</h2>

<div class="painel">

<textarea
id="entradaHistorico"
placeholder="Cole o histórico — até 200 giros"
></textarea>

<div class="botoes">

<button
id="inserir"
class="btn verde">
INSERIR
</button>

<button
id="apagar"
class="btn">
APAGAR ÚLTIMO
</button>

<button
id="limpar"
class="btn red">
APAGAR TUDO
</button>

</div>

<div
id="status"
class="status">
PRONTO
</div>

</div>

<div class="painel">

<div class="motorNormal">
MOTOR NORMAL • CONTAGEM DE CARTAS / PÓS-GATILHO
</div>

<div
id="contagemStatus"
class="contagemBox">
CONTAGEM DE CARTAS • AGUARDANDO
</div>

<div
id="resumo"
class="resumo">
</div>

<div class="timelineSecao">

<div class="timelineTituloGrupo">
MOTOR NORMAL
</div>

<div
id="timelineNormal"
class="timelineRow">
</div>

</div>

</div>

<div class="painel">

<div class="titulo">
ÚLTIMAS 14 • JOGADA NORMAL
</div>

<div
id="ultimos14"
class="duplas14">
</div>

</div>

<div class="painel">

<div class="titulo">
JOGADA
</div>

<div id="jogada">
</div>

</div>

<div class="painel">

<div class="titulo">
TECLADO
</div>

<div
id="teclado"
class="teclado">
</div>

</div>

</div>

`;

document.body.appendChild(
app
);

/* ============================================================
   BOTÕES
============================================================ */

document
.getElementById("inserir")
.onclick=
inserirHistorico;

document
.getElementById("apagar")
.onclick=
apagarUltimo;

document
.getElementById("limpar")
.onclick=
apagarTudo;

/* ============================================================
   TECLADO
============================================================ */

const teclado=
document.getElementById(
"teclado"
);

for(
let n=1;
n<=36;
n++
){

const b=
document.createElement(
"button"
);

b.className=
"numero";

b.textContent=n;

b.style.background=
corRoleta(n);

b.onclick=()=>
adicionarNumero(n);

teclado.appendChild(b);

}

const zero=
document.createElement(
"button"
);

zero.className=
"numero zero";

zero.textContent="0";

zero.style.background=
corRoleta(0);

zero.onclick=()=>
adicionarNumero(0);

teclado.appendChild(
zero
);

/* ============================================================
   TIMELINE VISUAL
============================================================ */

function prepararTimelineVisual(lista){

const saida=[];

(lista||[]).forEach(x=>{

if(x.semJogada){

saida.push({
tipo:"SEM",
resultado:x.resultado
});

return;

}

if(
x.aguardandoG1===true ||
x.fase==="ESPERA_G1"
){

saida.push({
tipo:"WAIT",
resultado:x.resultado
});

return;

}

if(
x.fase==="G1" &&
x.green===true
){

saida.push({
tipo:"G1",
resultado:
x.resultadoG1!==undefined &&
x.resultadoG1!==null
?x.resultadoG1
:x.resultado
});

return;

}

if(x.green===true){

saida.push({
tipo:"GREEN",
resultado:x.resultado
});

return;

}

saida.push({
tipo:"LOSS",
resultado:
x.resultadoG1!==undefined &&
x.resultadoG1!==null
?x.resultadoG1
:x.resultado
});

});

return saida;

}

function taxaTimelineVisual(
lista,
qtd=20
){

const visual=
prepararTimelineVisual(lista)
.filter(x=>
x.tipo!=="SEM" &&
x.tipo!=="WAIT"
)
.slice(-qtd);

if(!visual.length)
return 0;

const acertos=
visual.filter(x=>
x.tipo==="GREEN" ||
x.tipo==="G1"
).length;

return (
acertos/
visual.length*
100
);

}

function renderTimeline(){

const visual=
prepararTimelineVisual(
estado.timeline
)
.slice(-20);

const taxa=
taxaTimelineVisual(
estado.timeline,
20
);

document
.getElementById(
"timelineNormal"
)
.innerHTML=

'<div class="nomeTL">'+
'NORMAL'+
'</div>'+

'<div class="timeline">'+

visual.map(x=>{

if(x.tipo==="SEM")
return '<span class="gl sem">—</span>';

if(x.tipo==="WAIT")
return '<span class="gl wait">…</span>';

if(x.tipo==="GREEN")
return '<span class="gl green">G</span>';

if(x.tipo==="G1")
return '<span class="gl g1">G1</span>';

return '<span class="gl loss">L</span>';

}).join("")+

'</div>'+

'<div class="taxaTL">'+

(
visual.some(x=>
x.tipo!=="SEM" &&
x.tipo!=="WAIT"
)
?taxa.toFixed(0)+"%"
:"—"
)+

'</div>';

}

/* ============================================================
   JOGADA
============================================================ */

function htmlBlocoJogada(b){

return (

'<div class="bloco">'+

'<small>'+
'2 VIZINHOS DO'+
'</small>'+

'<strong>'+
b.centro+
'</strong>'+

'<div class="numeros">'+
b.numeros.join(" • ")+
'</div>'+

'</div>'

);

}

function renderJogada(
config,
congelada=false
){

const area=
document.getElementById(
"jogada"
);

if(
!config ||
!config.valido ||
!config.jogada ||
!config.jogada.valido
){

area.innerHTML=
'<div style="color:#777">AGUARDANDO GATILHO HISTÓRICO</div>';

return;

}

let infoPos="";

if(config.posGatilho){

const sinal=
config.posGatilho.contagemAtual>0
?"+"
:"";

infoPos=
" • CONTAGEM "+
sinal+
config.posGatilho.contagemAtual+
" • OCORRÊNCIAS "+
config.posGatilho.ocorrencias+
" • FORÇA "+
config.posGatilho.forca.toFixed(0)+
"% • COBERTURA 25/37";

}

area.innerHTML=

'<div class="jogadaStatus '+
(congelada?"congelada":"")+
'">'+

(
congelada
?"JOGADA CONGELADA • G1"
:"JOGADA ATUAL"
)+

' • PÓS-GATILHO'+
infoPos+

'</div>'+

'<div class="jogada">'+

config.jogada
.blocos2
.map(
htmlBlocoJogada
)
.join("")+

'</div>';

}

/* ============================================================
   ÚLTIMAS 14
============================================================ */

function renderUltimos14(){

const area=
document.getElementById(
"ultimos14"
);

const lista=
duplasVisual.slice(-14);

area.innerHTML=
lista.map(d=>{

let classe="loss";
let texto="L";

if(d.semJogada===true){

classe="sem";
texto="—";

}else if(
d.fase==="ESPERA_G1"
){

classe="wait";
texto="…";

}else if(
d.g1!==null &&
d.g1!==undefined
){

if(d.g1Green===true){

classe="g1";
texto="G1";

}else{

classe="loss";
texto="L";

}

}else if(d.green===true){

classe="green";
texto="G";

}

return (

'<div class="dupla14 '+
classe+
'">'+

'<div class="bolaDupla" style="background:'+
corRoleta(
d.resultado
)+
'">'+

d.resultado+

'</div>'+

'<div class="resultadoEntrada '+
classe+
'">'+

texto+

(
d.g1!==null &&
d.g1!==undefined
?' • '+d.g1
:''
)+

'</div>'+

'</div>'

);

}).join("");

}

/* ============================================================
   STATUS CONTAGEM
============================================================ */

function renderStatusContagem(
analise
){

const area=
document.getElementById(
"contagemStatus"
);

const sinal=
analise.contagemAtual>0
?"+"
:"";

if(!analise.valido){

area.className=
"contagemBox espera";

area.textContent=

"CONTAGEM ATUAL: "+
sinal+
analise.contagemAtual+
" • OCORRÊNCIAS HISTÓRICAS: "+
analise.ocorrencias+
" • AGUARDANDO PÓS-GATILHO";

return;

}

area.className=
"contagemBox ativa";

area.textContent=

"CONTAGEM ATUAL: "+
sinal+
analise.contagemAtual+
" • OCORRÊNCIAS HISTÓRICAS: "+
analise.ocorrencias+
" • FORÇA: "+
analise.forca.toFixed(0)+
"% • 5 ALVOS • 25 NÚMEROS ÚNICOS";

}

/* ============================================================
   RENDER
============================================================ */

function render(){

historicoCompleto=
historicoCompleto.slice(
-MAX_HISTORICO_BACKTEST
);

historico=
historicoCompleto.slice(
-MAX_HISTORICO
);

salvarHistorico();

const base=
historicoCompleto.slice(
-MAX_HISTORICO_BACKTEST
);

/*
   ANÁLISE PRINCIPAL EXECUTADA UMA VEZ.
*/

const analise=
analisarPosGatilho(
base
);

let config=null;

if(analise.valido){

const jogada=
gerarJogadaPosGatilho(
analise
);

config={

valido:
jogada.valido,

motor:"NORMAL",

posGatilho:
analise,

jogada,

similaridade:
analise.forca

};

}

garantirPendente(
config
);

/* ============================================================
   STATUS CONTAGEM
============================================================ */

renderStatusContagem(
analise
);

/* ============================================================
   RESUMO

   BACKTEST SÓ É CALCULADO QUANDO EXISTE JOGADA VÁLIDA.
============================================================ */

let bt=null;

if(config && config.valido){

bt=
backtestNormal(
base
);

}

const live=
statsTimeline(
estado.timeline
);

document
.getElementById(
"resumo"
)
.innerHTML=

'<div class="card">'+
'<small>BT10</small>'+
'<strong>'+
(
bt
?bt.taxa10.toFixed(0)+"%"
:"—"
)+
'</strong>'+
'</div>'+

'<div class="card">'+
'<small>BT20</small>'+
'<strong>'+
(
bt
?bt.taxa20.toFixed(0)+"%"
:"—"
)+
'</strong>'+
'</div>'+

'<div class="card">'+
'<small>REAL10</small>'+
'<strong>'+
(
live.total
?live.taxa10.toFixed(0)+"%"
:"—"
)+
'</strong>'+
'</div>'+

'<div class="card">'+
'<small>REAL20</small>'+
'<strong>'+
(
live.total
?live.taxa20.toFixed(0)+"%"
:"—"
)+
'</strong>'+
'</div>';

/* ============================================================
   TIMELINE
============================================================ */

renderTimeline();

/* ============================================================
   VISUAL
============================================================ */

renderUltimos14();

const configExibida=
jogadaCongelada ||
config;

renderJogada(
configExibida,
!!jogadaCongelada
);

/* ============================================================
   STATUS
============================================================ */

const sinal=
analise.contagemAtual>0
?"+"
:"";

document
.getElementById(
"status"
)
.textContent=

historico.length+
"/20 • HISTÓRICO "+
base.length+
"/200 • MOTOR NORMAL • CONTAGEM "+
sinal+
analise.contagemAtual+
" • OCORRÊNCIAS "+
analise.ocorrencias+
" • 5 ALVOS / 25 NÚMEROS"+

(
jogadaCongelada
?" • G1: JOGADA CONGELADA"
:""
);

}

/* ============================================================
   START
============================================================ */

render();

})();
