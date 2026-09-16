(function () {
"use strict";

/* =========================================================
   ANALISADOR 0 • 6 • 9
   MOTOR ADAPTATIVO — BASE PRESERVADA

   AJUSTES DESTA VERSÃO:
   - NÃO troca o motor original
   - RX4 / RX5 / RX6 continuam independentes
   - AUTO continua adaptativo
   - backtest continua walk-forward
   - alto/baixo continua auxiliar e independente
   - vermelho/preto continua auxiliar
   - regiões continuam auxiliares
   - famílias 0/6/9 continuam
   - concentração física continua
   - terminais T0–T9 adicionados
   - vizinhança de terminal adicionada
   - transição de terminal adicionada
   - offset entra como possibilidade testada
   - offset NÃO fica travado
   - previsão continua congelada
   - timeline continua fiel
   - layout preservado
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const STORAGE_KEY =
"ANALISADOR_069_IDS_CORRESPONDENTES_V1";

const STORAGE_ENGINE =
"ANALISADOR_069_ENGINE_ADAPTATIVO_V5";

const MAX_HISTORICO = 5000;

const JANELA_VISUAL = 14;
const JANELA_ESTADO = 20;

const MAX_TIMELINE = 300;

const BACKTEST_MAX = 60;
const BACKTEST_MIN = 12;

const PESO_RECENTE_MIN = 0.35;
const PESO_RECENTE_MAX = 1.00;

const PERCENTUAL_REPLICAS_RX = 0.10;
const MIN_REPLICAS_RX = 12;
const MAX_REPLICAS_RX = 40;

const QTD_2V = 5;
const QTD_1V = 1;
const TOTAL_COBERTURA = 28;

const RX_DISPONIVEIS = [4,5,6];

const JANELAS_ESTADO_TESTADAS = [
  8,
  10,
  14,
  20
];


/*
  OFFSET NÃO É FIXO.

  É apenas mais uma possibilidade
  disponível para o motor.
*/
const OFFSETS_TESTADOS = [
  -2,
  -1,
  0,
  1,
  2
];


/*
  Perfis originais preservados.

  Terminal entra depois como
  informação auxiliar e não
  substitui estes perfis.
*/
const PERFIS = [

  {
    id:"RX",
    rx:1.00,
    roda:0.15,
    altoBaixo:0.00,
    cor:0.00,
    regiao:0.00,
    familia:0.10,
    terminal:0.00
  },

  {
    id:"MOMENTO",
    rx:0.80,
    roda:0.35,
    altoBaixo:0.15,
    cor:0.10,
    regiao:0.15,
    familia:0.20,
    terminal:0.08
  },

  {
    id:"RODA",
    rx:0.70,
    roda:0.55,
    altoBaixo:0.05,
    cor:0.05,
    regiao:0.10,
    familia:0.15,
    terminal:0.06
  },

  {
    id:"CONFLUENCIA",
    rx:0.75,
    roda:0.35,
    altoBaixo:0.20,
    cor:0.15,
    regiao:0.20,
    familia:0.25,
    terminal:0.10
  }

];


/* =========================================================
   CORES
========================================================= */

const COR_T0 = "#00c853";
const COR_T6 = "#ffc107";
const COR_T9 = "#2196f3";


/* =========================================================
   ROLETA EUROPEIA
========================================================= */

const track = [
  32,15,19,4,21,2,25,17,34,6,
  27,13,36,11,30,8,23,10,5,24,
  16,33,1,20,14,31,9,22,18,29,
  7,28,12,35,3,26,0
];


const numerosVermelhos = new Set([
  1,3,5,7,9,
  12,14,16,18,
  19,21,23,25,27,
  30,32,34,36
]);


/* =========================================================
   REGIÕES FIXAS
========================================================= */

const regioesRoleta = {

  ZERO:new Set([
    0,32,15,26,3,35,12
  ]),

  VOISINS:new Set([
    19,4,21,2,25,
    28,7,29,18,22
  ]),

  ORPHELINS:new Set([
    9,31,14,20,1,17,6,34
  ]),

  TIERS:new Set([
    27,13,36,11,30,8,
    23,10,5,24,16,33
  ])

};


const coresRegioes = {
  ZERO:"#9bea2c",
  VOISINS:"#8a20d4",
  ORPHELINS:"#176436",
  TIERS:"#29499b"
};


/* =========================================================
   IDS 0 / 6 / 9
========================================================= */

const BASES_069 = [
  0,10,20,30,
  6,16,26,36,
  9,19,29
];


const TODOS_IDS_RX = [
  0,10,20,30,
  6,16,26,36,
  9,19,29,39
];


const IDS_ESPECIAIS = {
  25:[39],
  17:[9],
  2:[9]
};


/* =========================================================
   ESTADO
========================================================= */

let historico =
carregarHistorico();


let estado = {

  modo:"AUTO",

  manualRX:6,

  pendenteAuto:null,

  pendentesRX:{
    4:null,
    5:null,
    6:null
  },

  timelineRX:{
    4:[],
    5:[],
    6:[]
  },

  timelineAuto:[],

  ultimaConfiguracao:null

};


carregarEstado();


/* =========================================================
   STORAGE
========================================================= */

function carregarHistorico(){

  try{

    const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

    if(!raw){
      return [];
    }

    const dados =
    JSON.parse(raw);

    if(!Array.isArray(dados)){
      return [];
    }

    return dados
    .map(Number)
    .filter(n =>
      Number.isInteger(n) &&
      n >= 0 &&
      n <= 36
    )
    .slice(-MAX_HISTORICO);

  }catch(e){

    return [];

  }

}


function salvarHistorico(){

  try{

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(historico)
    );

  }catch(e){}

}


function carregarEstado(){

  try{

    const raw =
    localStorage.getItem(
      STORAGE_ENGINE
    );

    if(!raw){
      return;
    }

    const salvo =
    JSON.parse(raw);


    if(
      salvo.modo === "AUTO" ||
      salvo.modo === "MANUAL"
    ){
      estado.modo =
      salvo.modo;
    }


    if(
      RX_DISPONIVEIS.includes(
        salvo.manualRX
      )
    ){
      estado.manualRX =
      salvo.manualRX;
    }


    if(salvo.pendenteAuto){
      estado.pendenteAuto =
      salvo.pendenteAuto;
    }


    if(salvo.pendentesRX){

      RX_DISPONIVEIS.forEach(rx => {

        if(salvo.pendentesRX[rx]){
          estado.pendentesRX[rx] =
          salvo.pendentesRX[rx];
        }

      });

    }


    if(salvo.timelineRX){

      RX_DISPONIVEIS.forEach(rx => {

        if(
          Array.isArray(
            salvo.timelineRX[rx]
          )
        ){

          estado.timelineRX[rx] =
          salvo.timelineRX[rx]
          .slice(-MAX_TIMELINE);

        }

      });

    }


    if(
      Array.isArray(
        salvo.timelineAuto
      )
    ){

      estado.timelineAuto =
      salvo.timelineAuto
      .slice(-MAX_TIMELINE);

    }


    if(salvo.ultimaConfiguracao){

      estado.ultimaConfiguracao =
      salvo.ultimaConfiguracao;

    }

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


/* =========================================================
   HELPERS DA RODA
========================================================= */

function indiceRoda(numero){

  return track.indexOf(numero);

}


function setorVizinhosOrdenado(
  centro,
  quantidade
){

  const indice =
  indiceRoda(centro);

  if(indice < 0){
    return [];
  }

  const numeros = [];

  for(
    let d=-quantidade;
    d<=quantidade;
    d++
  ){

    numeros.push(

      track[
        (
          indice +
          d +
          track.length
        )
        %
        track.length
      ]

    );

  }

  return numeros;

}


function vizinhos(
  numero,
  quantidade=1
){

  const indice =
  indiceRoda(numero);

  if(indice < 0){
    return [];
  }

  const resultado =
  [numero];

  for(
    let d=1;
    d<=quantidade;
    d++
  ){

    resultado.push(

      track[
        (
          indice -
          d +
          track.length
        )
        %
        track.length
      ]

    );


    resultado.push(

      track[
        (
          indice +
          d
        )
        %
        track.length
      ]

    );

  }

  return resultado;

}


function distanciaRoda(a,b){

  const ia =
  indiceRoda(a);

  const ib =
  indiceRoda(b);

  if(
    ia < 0 ||
    ib < 0
  ){
    return 99;
  }

  const direta =
  Math.abs(
    ia-ib
  );

  return Math.min(
    direta,
    track.length-direta
  );

}


/* =========================================================
   OFFSET
========================================================= */

function deslocarNumero(
  numero,
  offset
){

  const indice =
  indiceRoda(numero);

  if(indice < 0){
    return numero;
  }

  return track[
    (
      indice +
      offset +
      track.length
    )
    %
    track.length
  ];

}


function aplicarOffsetJogada(
  jogada,
  offset
){

  if(
    !jogada ||
    !jogada.valido ||
    offset === 0
  ){

    return jogada;

  }


  const blocos2 =
  jogada.blocos2
  .map(bloco => {

    const centro =
    deslocarNumero(
      bloco.centro,
      offset
    );

    return {
      ...bloco,
      centro,
      numeros:
      setorVizinhosOrdenado(
        centro,
        2
      )
    };

  });


  const blocos1 =
  jogada.blocos1
  .map(bloco => {

    const centro =
    deslocarNumero(
      bloco.centro,
      offset
    );

    return {
      ...bloco,
      centro,
      numeros:
      setorVizinhosOrdenado(
        centro,
        1
      )
    };

  });


  const numerosUsados =
  new Set();


  blocos2.forEach(bloco => {

    bloco.numeros
    .forEach(n =>
      numerosUsados.add(n)
    );

  });


  blocos1.forEach(bloco => {

    bloco.numeros
    .forEach(n =>
      numerosUsados.add(n)
    );

  });


  return {

    ...jogada,

    blocos2,
    blocos1,

    numerosUsados,

    valido:
    numerosUsados.size ===
    TOTAL_COBERTURA

  };

}


/* =========================================================
   TERMINAIS
========================================================= */

function terminalDoNumero(numero){

  return numero % 10;

}


function terminalAnterior(t){

  return (
    t + 9
  ) % 10;

}


function terminalSeguinte(t){

  return (
    t + 1
  ) % 10;

}


function criarContagemTerminais(){

  return [
    0,0,0,0,0,
    0,0,0,0,0
  ];

}


function analisarTerminais(janela){

  const contagem =
  criarContagemTerminais();

  const vizinhanca =
  criarContagemTerminais();

  const transicoes =
  Array.from(
    {length:10},
    () =>
      Array(10).fill(0)
  );


  janela.forEach(numero => {

    contagem[
      terminalDoNumero(numero)
    ]++;

  });


  for(
    let t=0;
    t<10;
    t++
  ){

    vizinhanca[t] =

    contagem[
      terminalAnterior(t)
    ]

    +

    contagem[t]

    +

    contagem[
      terminalSeguinte(t)
    ];

  }


  for(
    let i=0;
    i<janela.length-1;
    i++
  ){

    const origem =
    terminalDoNumero(
      janela[i]
    );

    const destino =
    terminalDoNumero(
      janela[i+1]
    );

    transicoes[
      origem
    ][
      destino
    ]++;

  }


  return {
    contagem,
    vizinhanca,
    transicoes
  };

}


/* =========================================================
   CORES / REGIÕES / FAMÍLIAS
========================================================= */

function corNumeroRoleta(numero){

  if(numero === 0){
    return "#087c48";
  }

  if(
    numerosVermelhos.has(numero)
  ){
    return "#c6283d";
  }

  return "#181818";

}


function classeCor(numero){

  if(numero === 0){
    return "ZERO";
  }

  return numerosVermelhos.has(numero)
  ?
  "VERMELHO"
  :
  "PRETO";

}


function classeAltura(numero){

  if(numero === 0){
    return "ZERO";
  }

  return numero <= 18
  ?
  "BAIXO"
  :
  "ALTO";

}


function regiaoDoNumero(numero){

  if(
    regioesRoleta.ZERO.has(numero)
  ){
    return "ZERO";
  }

  if(
    regioesRoleta.VOISINS.has(numero)
  ){
    return "VOISINS";
  }

  if(
    regioesRoleta.ORPHELINS.has(numero)
  ){
    return "ORPHELINS";
  }

  if(
    regioesRoleta.TIERS.has(numero)
  ){
    return "TIERS";
  }

  return null;

}


function familiaDoId(id){

  if(
    id === 0 ||
    id === 10 ||
    id === 20 ||
    id === 30
  ){
    return 0;
  }

  if(
    id === 6 ||
    id === 16 ||
    id === 26 ||
    id === 36
  ){
    return 6;
  }

  if(
    id === 9 ||
    id === 19 ||
    id === 29 ||
    id === 39
  ){
    return 9;
  }

  return null;

}


function corDoId(id){

  const f =
  familiaDoId(id);

  if(f === 0){
    return COR_T0;
  }

  if(f === 6){
    return COR_T6;
  }

  if(f === 9){
    return COR_T9;
  }

  return "#555";

}


/* =========================================================
   COBERTURA DOS IDS
========================================================= */

const coberturaDasBases = {};


BASES_069.forEach(base => {

  coberturaDasBases[base] =
  new Set(
    vizinhos(base,1)
  );

});


function idsQueBatem(numero){

  const ids = [];


  BASES_069.forEach(base => {

    if(
      coberturaDasBases[base]
      .has(numero)
    ){

      ids.push(base);

    }

  });


  if(
    Object.prototype
    .hasOwnProperty
    .call(
      IDS_ESPECIAIS,
      numero
    )
  ){

    IDS_ESPECIAIS[numero]
    .forEach(id => {

      if(
        !ids.includes(id)
      ){
        ids.push(id);
      }

    });

  }

  return ids;

}


function familiasQueBatem(numero){

  return new Set(

    idsQueBatem(numero)
    .map(familiaDoId)
    .filter(f =>
      f !== null
    )

  );

}


/* =========================================================
   TRAJETÓRIA 0 / 6 / 9
========================================================= */

function gerarTrajetoria(janela){

  let t0=0;
  let t6=0;
  let t9=0;

  const pontos=[];
  const eventos=[];


  janela.forEach(
  (numero,index) => {

    const familias =
    familiasQueBatem(numero);

    const b0 =
    familias.has(0) ? 1 : 0;

    const b6 =
    familias.has(6) ? 1 : 0;

    const b9 =
    familias.has(9) ? 1 : 0;


    t0 += b0;
    t6 += b6;
    t9 += b9;


    eventos.push({
      t0:b0,
      t6:b6,
      t9:b9
    });


    pontos.push({
      posicao:index+1,
      numero,
      t0,
      t6,
      t9
    });

  });


  return {
    pontos,
    eventos,
    total0:t0,
    total6:t6,
    total9:t9
  };

}


function chaveEvento(evento){

  let chave="";

  if(evento.t0){
    chave+="0";
  }

  if(evento.t6){
    chave+="6";
  }

  if(evento.t9){
    chave+="9";
  }

  return chave || "-";

}


function calcularSimilaridade(
  janelaAtual,
  janelaAntiga
){

  const tamanho =
  janelaAtual.length;


  if(
    tamanho === 0 ||
    janelaAntiga.length !== tamanho
  ){
    return 0;
  }


  const atual =
  gerarTrajetoria(
    janelaAtual
  );


  const antiga =
  gerarTrajetoria(
    janelaAntiga
  );


  let iguais=0;


  for(
    let i=0;
    i<tamanho;
    i++
  ){

    if(
      chaveEvento(
        atual.eventos[i]
      )
      ===
      chaveEvento(
        antiga.eventos[i]
      )
    ){

      iguais++;

    }

  }


  const scoreEventos =
  iguais /
  tamanho *
  100;


  let erro=0;


  for(
    let i=0;
    i<tamanho;
    i++
  ){

    erro +=
    Math.abs(
      atual.pontos[i].t0 -
      antiga.pontos[i].t0
    );

    erro +=
    Math.abs(
      atual.pontos[i].t6 -
      antiga.pontos[i].t6
    );

    erro +=
    Math.abs(
      atual.pontos[i].t9 -
      antiga.pontos[i].t9
    );

  }


  const maxErro =
  tamanho *
  tamanho *
  3;


  let scoreForma =
  1 -
  erro/maxErro;


  scoreForma =
  Math.max(
    0,
    Math.min(
      1,
      scoreForma
    )
  )
  *
  100;


  return (
    scoreEventos *
    0.80
    +
    scoreForma *
    0.20
  );

}


/* =========================================================
   DESCRITOR DO ESTADO
========================================================= */

function descreverEstado(
  base,
  tamanho
){

  const janela =
  base.slice(-tamanho);


  const terminais =
  analisarTerminais(
    janela
  );


  const desc = {

    tamanho:
    janela.length,

    alto:0,
    baixo:0,

    vermelho:0,
    preto:0,

    zero:0,

    regioes:{
      ZERO:0,
      VOISINS:0,
      ORPHELINS:0,
      TIERS:0
    },

    familias:{
      0:0,
      6:0,
      9:0
    },

    terminais:
    terminais.contagem,

    vizinhancaTerminais:
    terminais.vizinhanca,

    transicoesTerminais:
    terminais.transicoes,

    ultimoTerminal:
    janela.length
    ?
    terminalDoNumero(
      janela[janela.length-1]
    )
    :
    null,

    frequenciaRoda:
    new Map()

  };


  track.forEach(n => {

    desc.frequenciaRoda.set(
      n,
      0
    );

  });


  janela.forEach(numero => {

    if(numero === 0){

      desc.zero++;

    }

    else if(numero <= 18){

      desc.baixo++;

    }

    else{

      desc.alto++;

    }


    if(
      numerosVermelhos.has(numero)
    ){

      desc.vermelho++;

    }

    else if(numero !== 0){

      desc.preto++;

    }


    const regiao =
    regiaoDoNumero(numero);


    if(regiao){

      desc.regioes[regiao]++;

    }


    familiasQueBatem(numero)
    .forEach(f => {

      desc.familias[f]++;

    });


    track.forEach(alvo => {

      const distancia =
      distanciaRoda(
        numero,
        alvo
      );


      let incremento=0;


      if(distancia === 0){
        incremento=1;
      }

      else if(distancia === 1){
        incremento=0.55;
      }

      else if(distancia === 2){
        incremento=0.25;
      }


      if(incremento){

        desc.frequenciaRoda.set(

          alvo,

          desc.frequenciaRoda.get(
            alvo
          )
          +
          incremento

        );

      }

    });

  });


  return desc;

}


/* =========================================================
   SIMILARIDADE DO ESTADO
========================================================= */

function similaridadeEstado(
  atual,
  antigo
){

  if(
    !atual.tamanho ||
    !antigo.tamanho
  ){
    return 0;
  }


  function proporcao(
    valor,
    total
  ){

    return total
    ?
    valor/total
    :
    0;

  }


  let erro=0;
  let componentes=0;


  const campos = [

    [
      proporcao(
        atual.alto,
        atual.tamanho
      ),

      proporcao(
        antigo.alto,
        antigo.tamanho
      )
    ],

    [
      proporcao(
        atual.baixo,
        atual.tamanho
      ),

      proporcao(
        antigo.baixo,
        antigo.tamanho
      )
    ],

    [
      proporcao(
        atual.vermelho,
        atual.tamanho
      ),

      proporcao(
        antigo.vermelho,
        antigo.tamanho
      )
    ],

    [
      proporcao(
        atual.preto,
        atual.tamanho
      ),

      proporcao(
        antigo.preto,
        antigo.tamanho
      )
    ]

  ];


  campos.forEach(par => {

    erro +=
    Math.abs(
      par[0]-par[1]
    );

    componentes++;

  });


  [
    "ZERO",
    "VOISINS",
    "ORPHELINS",
    "TIERS"
  ]
  .forEach(regiao => {

    erro +=
    Math.abs(

      atual.regioes[regiao] /
      atual.tamanho

      -

      antigo.regioes[regiao] /
      antigo.tamanho

    );

    componentes++;

  });


  [0,6,9]
  .forEach(familia => {

    erro +=
    Math.abs(

      atual.familias[familia] /
      atual.tamanho

      -

      antigo.familias[familia] /
      antigo.tamanho

    );

    componentes++;

  });


  let erroRoda=0;


  track.forEach(numero => {

    const a =
    atual.frequenciaRoda.get(numero)
    /
    Math.max(
      1,
      atual.tamanho
    );


    const b =
    antigo.frequenciaRoda.get(numero)
    /
    Math.max(
      1,
      antigo.tamanho
    );


    erroRoda +=
    Math.abs(
      a-b
    );

  });


  erroRoda /=
  track.length;


  const erroMedio =
  erro /
  Math.max(
    1,
    componentes
  );


  let score =

  100
  -
  (
    erroMedio *
    70
    +
    erroRoda *
    30
  )
  *
  100;


  return Math.max(
    0,
    Math.min(
      100,
      score
    )
  );

}


/* =========================================================
   SIMILARIDADE AUXILIAR DE TERMINAIS

   NÃO substitui o RX.
   NÃO substitui estado.
   É apenas auxílio.
========================================================= */

function similaridadeTerminais(
  atual,
  antigo
){

  if(
    !atual.tamanho ||
    !antigo.tamanho
  ){
    return 0;
  }


  let erro=0;


  for(
    let t=0;
    t<10;
    t++
  ){

    const a =
    atual.terminais[t] /
    atual.tamanho;

    const b =
    antigo.terminais[t] /
    antigo.tamanho;


    erro +=
    Math.abs(a-b);


    const av =
    atual.vizinhancaTerminais[t] /
    Math.max(
      1,
      atual.tamanho*3
    );

    const bv =
    antigo.vizinhancaTerminais[t] /
    Math.max(
      1,
      antigo.tamanho*3
    );


    erro +=
    Math.abs(av-bv) *
    0.50;

  }


  erro /=
  15;


  return Math.max(
    0,
    Math.min(
      100,
      100-error*100
    )
  );

}


/* =========================================================
   BUSCAR RÉPLICAS
========================================================= */

function selecionarReplicas(
  base,
  rx,
  janelaEstado,
  perfil
){

  const total =
  base.length;


  if(
    total <
    Math.max(
      rx*2+2,
      janelaEstado*2+2
    )
  ){

    return {
      estado:"AGUARDANDO",
      replicas:[],
      similaridade:0
    };

  }


  const inicioAtual =
  total-rx;


  const janelaRXAtual =
  base.slice(
    inicioAtual,
    total
  );


  const estadoAtual =
  descreverEstado(
    base,
    janelaEstado
  );


  const candidatos=[];


  for(
    let inicio=
      Math.max(
        janelaEstado,
        rx
      );
    inicio+rx<inicioAtual;
    inicio++
  ){

    const janelaAntiga =
    base.slice(
      inicio,
      inicio+rx
    );


    const proximo =
    base[
      inicio+rx
    ];


    if(
      proximo === undefined
    ){
      continue;
    }


    const baseEstadoAntigo =
    base.slice(
      0,
      inicio+rx
    );


    const estadoAntigo =
    descreverEstado(
      baseEstadoAntigo,
      janelaEstado
    );


    const simRX =
    calcularSimilaridade(
      janelaRXAtual,
      janelaAntiga
    );


    const simEstado =
    similaridadeEstado(
      estadoAtual,
      estadoAntigo
    );


    const simTerminal =
    similaridadeTerminais(
      estadoAtual,
      estadoAntigo
    );


    /*
      LÓGICA BASE PRESERVADA.

      Terminal entra SOMENTE como
      componente auxiliar pequeno.
    */

    const pesoRX =
    perfil.rx;


    const pesoEstado =
    (
      perfil.roda +
      perfil.altoBaixo +
      perfil.cor +
      perfil.regiao +
      perfil.familia
    );


    const pesoTerminal =
    perfil.terminal || 0;


    const divisor =
    Math.max(
      0.0001,
      pesoRX +
      pesoEstado +
      pesoTerminal
    );


    const similaridade =
    (
      simRX*pesoRX
      +
      simEstado*pesoEstado
      +
      simTerminal*pesoTerminal
    )
    /
    divisor;


    candidatos.push({

      inicio,

      proximo,

      simRX,

      simEstado,

      simTerminal,

      similaridade,

      distancia:
      inicioAtual -
      (
        inicio+rx
      )

    });

  }


  candidatos.sort(
  (a,b) => {

    if(
      Math.abs(
        b.similaridade -
        a.similaridade
      )
      >
      0.0001
    ){

      return (
        b.similaridade -
        a.similaridade
      );

    }

    return (
      a.distancia -
      b.distancia
    );

  });


  if(!candidatos.length){

    return {
      estado:"SEM DADOS",
      replicas:[],
      similaridade:0
    };

  }


  let quantidade =
  Math.ceil(
    candidatos.length *
    PERCENTUAL_REPLICAS_RX
  );


  quantidade =
  Math.max(
    MIN_REPLICAS_RX,
    quantidade
  );


  quantidade =
  Math.min(
    MAX_REPLICAS_RX,
    candidatos.length,
    quantidade
  );


  const replicas =
  candidatos.slice(
    0,
    quantidade
  );


  const similaridade =
  replicas.reduce(
    (s,x) =>
      s+x.similaridade,
    0
  )
  /
  replicas.length;


  return {
    estado:"OK",
    replicas,
    similaridade,
    estadoAtual
  };

}


/* =========================================================
   FREQUÊNCIA DOS PRÓXIMOS
========================================================= */

function gerarFrequenciaReplicas(
  replicas
){

  const mapa =
  new Map();


  track.forEach(numero => {

    mapa.set(
      numero,
      0
    );

  });


  replicas.forEach(item => {

    mapa.set(

      item.proximo,

      (
        mapa.get(
          item.proximo
        )
        ||
        0
      )
      +
      1

    );

  });


  return mapa;

}


/* =========================================================
   SCORE AUXILIAR DE TERMINAL
========================================================= */

function scoreTerminalNumero(
  numero,
  estadoAtual
){

  const t =
  terminalDoNumero(numero);


  const tamanho =
  Math.max(
    1,
    estadoAtual.tamanho
  );


  const direto =
  estadoAtual.terminais[t] /
  tamanho;


  const viz =
  estadoAtual
  .vizinhancaTerminais[t]
  /
  Math.max(
    1,
    tamanho*3
  );


  let transicao=0;


  if(
    estadoAtual.ultimoTerminal !==
    null
  ){

    const linha =
    estadoAtual
    .transicoesTerminais[
      estadoAtual.ultimoTerminal
    ];


    const total =
    linha.reduce(
      (a,b) => a+b,
      0
    );


    if(total){

      transicao =
      linha[t] /
      total;

    }

  }


  return (
    direto*0.35 +
    viz*0.35 +
    transicao*0.30
  );

}


/* =========================================================
   PONTUAÇÃO DO SETOR
========================================================= */

function avaliarSetor(
  centro,
  quantidade,
  frequencia,
  estadoAtual,
  perfil
){

  const numeros =
  setorVizinhosOrdenado(
    centro,
    quantidade
  );


  if(!numeros.length){
    return null;
  }


  let suporte=0;
  let scoreRX=0;

  let altos=0;
  let baixos=0;

  let vermelhos=0;
  let pretos=0;

  let scoreTerminal=0;


  const regioes = {
    ZERO:0,
    VOISINS:0,
    ORPHELINS:0,
    TIERS:0
  };


  const familias = {
    0:0,
    6:0,
    9:0
  };


  numeros.forEach(
  (numero,index) => {

    const freq =
    frequencia.get(numero)
    ||
    0;


    suporte += freq;


    const distancia =
    Math.abs(
      index-quantidade
    );


    let multiplicador=1;


    if(quantidade === 2){

      if(distancia === 0){
        multiplicador=1.35;
      }

      else if(distancia === 1){
        multiplicador=1.15;
      }

    }

    else{

      if(distancia === 0){
        multiplicador=1.25;
      }

    }


    scoreRX +=
    freq *
    multiplicador;


    if(numero >= 19){
      altos++;
    }

    else if(numero >= 1){
      baixos++;
    }


    if(
      numerosVermelhos.has(numero)
    ){
      vermelhos++;
    }

    else if(numero !== 0){
      pretos++;
    }


    const regiao =
    regiaoDoNumero(numero);


    if(regiao){
      regioes[regiao]++;
    }


    familiasQueBatem(numero)
    .forEach(f => {

      familias[f]++;

    });


    scoreTerminal +=
    scoreTerminalNumero(
      numero,
      estadoAtual
    );

  });


  const tamanhoSetor =
  numeros.length;


  scoreTerminal /=
  Math.max(
    1,
    tamanhoSetor
  );


  const tamanhoEstado =
  Math.max(
    1,
    estadoAtual.tamanho
  );


  /* ALTO / BAIXO */

  const pAltoEstado =
  estadoAtual.alto /
  tamanhoEstado;


  const pBaixoEstado =
  estadoAtual.baixo /
  tamanhoEstado;


  const pAltoSetor =
  altos /
  tamanhoSetor;


  const pBaixoSetor =
  baixos /
  tamanhoSetor;


  const scoreAltoBaixo =
  1
  -
  (
    Math.abs(
      pAltoEstado-pAltoSetor
    )
    +
    Math.abs(
      pBaixoEstado-pBaixoSetor
    )
  )
  /
  2;


  /* COR */

  const pVermelhoEstado =
  estadoAtual.vermelho /
  tamanhoEstado;


  const pPretoEstado =
  estadoAtual.preto /
  tamanhoEstado;


  const pVermelhoSetor =
  vermelhos /
  tamanhoSetor;


  const pPretoSetor =
  pretos /
  tamanhoSetor;


  const scoreCor =
  1
  -
  (
    Math.abs(
      pVermelhoEstado -
      pVermelhoSetor
    )
    +
    Math.abs(
      pPretoEstado -
      pPretoSetor
    )
  )
  /
  2;


  /* REGIÃO */

  let scoreRegiao=0;


  [
    "ZERO",
    "VOISINS",
    "ORPHELINS",
    "TIERS"
  ]
  .forEach(regiao => {

    const pEstado =
    estadoAtual.regioes[regiao]
    /
    tamanhoEstado;


    const pSetor =
    regioes[regiao]
    /
    tamanhoSetor;


    scoreRegiao +=
    1 -
    Math.abs(
      pEstado-pSetor
    );

  });


  scoreRegiao /= 4;


  /* FAMÍLIAS */

  let scoreFamilia=0;


  [0,6,9]
  .forEach(familia => {

    const pEstado =
    estadoAtual.familias[familia]
    /
    tamanhoEstado;


    const pSetor =
    familias[familia]
    /
    tamanhoSetor;


    scoreFamilia +=
    1 -
    Math.abs(
      pEstado-pSetor
    );

  });


  scoreFamilia /= 3;


  /* CONCENTRAÇÃO FÍSICA */

  let scoreRoda=0;


  numeros.forEach(numero => {

    scoreRoda +=
    estadoAtual.frequenciaRoda
    .get(numero)
    ||
    0;

  });


  scoreRoda /=
  Math.max(
    1,
    tamanhoSetor
  );


  /*
    SCORE ORIGINAL +
    TERMINAL AUXILIAR.
  */

  const score =

  scoreRX *
  perfil.rx

  +

  suporte *
  scoreRoda *
  perfil.roda *
  0.20

  +

  suporte *
  scoreAltoBaixo *
  perfil.altoBaixo

  +

  suporte *
  scoreCor *
  perfil.cor

  +

  suporte *
  scoreRegiao *
  perfil.regiao

  +

  suporte *
  scoreFamilia *
  perfil.familia

  +

  suporte *
  scoreTerminal *
  (
    perfil.terminal || 0
  );


  return {

    centro,
    quantidade,
    numeros,

    suporte,
    score,

    scoreAltoBaixo,
    scoreCor,
    scoreRegiao,
    scoreFamilia,
    scoreRoda,
    scoreTerminal

  };

}


/* =========================================================
   MONTAR JOGADA
========================================================= */

function montarJogada(
  replicas,
  estadoAtual,
  perfil
){

  const frequencia =
  gerarFrequenciaReplicas(
    replicas
  );


  const candidatos2 =
  track
  .map(centro =>

    avaliarSetor(
      centro,
      2,
      frequencia,
      estadoAtual,
      perfil
    )

  )
  .sort(
    (a,b) =>
      b.score-a.score
  );


  const candidatos1 =
  track
  .map(centro =>

    avaliarSetor(
      centro,
      1,
      frequencia,
      estadoAtual,
      perfil
    )

  )
  .sort(
    (a,b) =>
      b.score-a.score
  );


  let melhor=null;


  candidatos1.forEach(
  bloco1 => {

    const usados =
    new Set(
      bloco1.numeros
    );


    const blocos2=[];

    let scoreTotal =
    bloco1.score;


    for(
      const bloco2
      of candidatos2
    ){

      const conflito =
      bloco2.numeros
      .some(numero =>
        usados.has(numero)
      );


      if(conflito){
        continue;
      }


      blocos2.push(
        bloco2
      );


      scoreTotal +=
      bloco2.score;


      bloco2.numeros
      .forEach(numero => {

        usados.add(numero);

      });


      if(
        blocos2.length ===
        QTD_2V
      ){
        break;
      }

    }


    if(
      blocos2.length !==
      QTD_2V
    ){
      return;
    }


    if(
      usados.size !==
      TOTAL_COBERTURA
    ){
      return;
    }


    if(
      !melhor ||
      scoreTotal >
      melhor.scoreTotal
    ){

      melhor = {

        blocos2,

        blocos1:[
          bloco1
        ],

        numerosUsados:
        usados,

        scoreTotal

      };

    }

  });


  if(!melhor){

    return {
      valido:false,
      blocos2:[],
      blocos1:[],
      numerosUsados:
      new Set(),
      scoreTotal:0
    };

  }


  melhor.blocos2.sort(
    (a,b) =>
      b.score-a.score
  );


  melhor.valido=true;


  return melhor;

}


/* =========================================================
   GERAR CONFIGURAÇÃO BASE

   OFFSET 0 = comportamento original.
========================================================= */

function gerarConfiguracaoBase(
  base,
  rx,
  janelaEstado,
  perfil
){

  const selecao =
  selecionarReplicas(
    base,
    rx,
    janelaEstado,
    perfil
  );


  if(
    selecao.estado !== "OK"
  ){

    return {
      valido:false,
      rx,
      janelaEstado,
      perfil,
      offset:0
    };

  }


  const jogada =
  montarJogada(
    selecao.replicas,
    selecao.estadoAtual,
    perfil
  );


  return {

    valido:
    jogada.valido
    &&
    jogada.numerosUsados.size ===
    TOTAL_COBERTURA,

    rx,

    janelaEstado,

    perfil,

    offset:0,

    replicas:
    selecao.replicas,

    similaridade:
    selecao.similaridade,

    estadoAtual:
    selecao.estadoAtual,

    jogada

  };

}


/* =========================================================
   GERAR CONFIGURAÇÃO COM OFFSET
========================================================= */

function gerarConfiguracao(
  base,
  rx,
  janelaEstado,
  perfil,
  offset=0
){

  const config =
  gerarConfiguracaoBase(
    base,
    rx,
    janelaEstado,
    perfil
  );


  if(!config.valido){
    return config;
  }


  const jogada =
  aplicarOffsetJogada(
    config.jogada,
    offset
  );


  return {

    ...config,

    offset,

    jogada,

    valido:
    jogada.valido
    &&
    jogada.numerosUsados.size ===
    TOTAL_COBERTURA

  };

}


/* =========================================================
   TODAS AS CONFIGURAÇÕES
========================================================= */

function gerarCandidatas(
  base
){

  const candidatas=[];


  RX_DISPONIVEIS
  .forEach(rx => {

    JANELAS_ESTADO_TESTADAS
    .forEach(janelaEstado => {

      PERFIS
      .forEach(perfil => {

        OFFSETS_TESTADOS
        .forEach(offset => {

          const config =
          gerarConfiguracao(
            base,
            rx,
            janelaEstado,
            perfil,
            offset
          );


          if(config.valido){

            candidatas.push(
              config
            );

          }

        });

      });

    });

  });


  return candidatas;

}


/* =========================================================
   IDENTIDADE
========================================================= */

function chaveConfiguracao(config){

  return [
    config.rx,
    config.janelaEstado,
    config.perfil.id,
    config.offset || 0
  ]
  .join("|");

}


/* =========================================================
   BACKTEST WALK-FORWARD
========================================================= */

function backtestConfiguracao(
  base,
  template
){

  const minimo =
  Math.max(
    35,
    template.janelaEstado*2,
    template.rx*4
  );


  if(
    base.length <=
    minimo
  ){

    return {
      testes:0,
      acertos:0,
      taxa:0,
      taxa5:0,
      taxa10:0,
      taxa20:0,
      taxaAnterior10:0,
      deterioracao:0,
      taxaPonderada:0,
      lossSeguidos:0,
      score:0,
      timeline:[]
    };

  }


  const inicio =
  Math.max(
    minimo,
    base.length -
    BACKTEST_MAX
  );


  const timeline=[];

  let pesoTotal=0;
  let pesoAcertos=0;


  for(
    let indice=inicio;
    indice<base.length;
    indice++
  ){

    const passado =
    base.slice(
      0,
      indice
    );


    const previsao =
    gerarConfiguracao(

      passado,

      template.rx,

      template.janelaEstado,

      template.perfil,

      template.offset || 0

    );


    if(
      !previsao.valido
    ){
      continue;
    }


    const real =
    base[indice];


    const green =
    previsao.jogada
    .numerosUsados
    .has(real);


    const progresso =
    (
      indice-inicio+1
    )
    /
    Math.max(
      1,
      base.length-inicio
    );


    const peso =
    PESO_RECENTE_MIN
    +
    progresso *
    (
      PESO_RECENTE_MAX -
      PESO_RECENTE_MIN
    );


    pesoTotal += peso;


    if(green){

      pesoAcertos += peso;

    }


    timeline.push({
      resultado:real,
      green
    });

  }


  const testes =
  timeline.length;


  const acertos =
  timeline.filter(
    x => x.green
  ).length;


  function taxa(lista){

    if(!lista.length){
      return 0;
    }

    return (
      lista.filter(
        x => x.green
      ).length
      /
      lista.length
      *
      100
    );

  }


  const taxaGeral =
  testes
  ?
  acertos/testes*100
  :
  0;


  const taxaPonderada =
  pesoTotal
  ?
  pesoAcertos/pesoTotal*100
  :
  0;


  const taxa5 =
  taxa(
    timeline.slice(-5)
  );


  const taxa10 =
  taxa(
    timeline.slice(-10)
  );


  const taxa20 =
  taxa(
    timeline.slice(-20)
  );


  /*
    Mede queda recente.

    Exemplo:
    10 anteriores = 100%
    últimos 10 = 80%

    deterioração = 20 pontos.
  */

  const anteriores10 =
  timeline.length > 10
  ?
  timeline.slice(-20,-10)
  :
  [];


  const taxaAnterior10 =
  taxa(
    anteriores10
  );


  const deterioracao =
  anteriores10.length
  ?
  taxaAnterior10 -
  taxa10
  :
  0;


  let lossSeguidos=0;


  for(
    let i=timeline.length-1;
    i>=0;
    i--
  ){

    if(
      timeline[i].green
    ){
      break;
    }

    lossSeguidos++;

  }


  /*
    BASE ORIGINAL:
    recente manda.

    Agora taxa5 e deterioração
    ajudam a perceber queda antes.
  */

  let score =

  taxa5 *
  0.18

  +

  taxa10 *
  0.32

  +

  taxa20 *
  0.25

  +

  taxaPonderada *
  0.17

  +

  taxaGeral *
  0.08;


  /*
    Penalidade de deterioração.

    Só pune queda real.
  */

  if(
    deterioracao > 0
  ){

    score -=
    deterioracao *
    0.18;

  }


  if(lossSeguidos === 1){

    score -= 4;

  }

  else if(lossSeguidos === 2){

    score -= 14;

  }

  else if(lossSeguidos >= 3){

    score -=
    28
    +
    (
      lossSeguidos-3
    )
    *
    9;

  }


  /*
    A faixa de 90% é operacional.

    Não força resultado.
    Apenas ajuda o motor a
    abandonar configurações
    deterioradas.
  */

  if(
    testes >= BACKTEST_MIN
  ){

    if(
      taxa10 >= 90 &&
      taxa20 >= 90
    ){

      score += 5;

    }

    else if(
      taxa10 < 85
    ){

      score -= 7;

    }

  }


  return {

    testes,
    acertos,

    taxa:
    taxaGeral,

    taxaPonderada,

    taxa5,
    taxa10,
    taxa20,

    taxaAnterior10,
    deterioracao,

    lossSeguidos,

    score,

    timeline

  };

}


/* =========================================================
   SCORE DE ESTABILIDADE

   Evita escolher simplesmente
   um 100% com 2 testes.
========================================================= */

function scoreEstabilidade(
  bt
){

  if(!bt.testes){
    return -9999;
  }


  const confianca =
  Math.min(
    1,
    bt.testes /
    BACKTEST_MIN
  );


  let score =
  bt.score *
  confianca;


  if(
    bt.testes >= 10
  ){

    score +=
    bt.taxa10 *
    0.08;

  }


  if(
    bt.testes >= 20
  ){

    score +=
    bt.taxa20 *
    0.06;

  }


  score -=
  bt.lossSeguidos *
  4;


  return score;

}


/* =========================================================
   OTIMIZADOR PRINCIPAL
========================================================= */

function otimizarProximaJogada(
  base
){

  const candidatas =
  gerarCandidatas(
    base
  );


  if(!candidatas.length){

    return {
      escolhido:null,
      ranking:[]
    };

  }


  const avaliadas=[];


  candidatas.forEach(
  config => {

    const bt =
    backtestConfiguracao(
      base,
      config
    );


    const confiancaAmostra =
    Math.min(
      1,
      bt.testes /
      BACKTEST_MIN
    );


    const estabilidade =
    scoreEstabilidade(
      bt
    );


    /*
      BACKTEST continua sendo
      o comandante.

      Similaridade atual serve
      como complemento.
    */

    const scoreFinal =

    estabilidade

    +

    config.similaridade *
    0.08 *
    Math.max(
      0.40,
      confiancaAmostra
    );


    avaliadas.push({

      ...config,

      backtest:bt,

      scoreFinal

    });

  });


  avaliadas.sort(
  (a,b) => {

    /*
      Não escolher só pela taxa10.

      Usa score adaptativo completo.
    */

    if(
      Math.abs(
        b.scoreFinal -
        a.scoreFinal
      )
      >
      0.001
    ){

      return (
        b.scoreFinal -
        a.scoreFinal
      );

    }


    if(
      Math.abs(
        b.backtest.taxa10 -
        a.backtest.taxa10
      )
      >
      0.001
    ){

      return (
        b.backtest.taxa10 -
        a.backtest.taxa10
      );

    }


    if(
      Math.abs(
        b.backtest.taxa20 -
        a.backtest.taxa20
      )
      >
      0.001
    ){

      return (
        b.backtest.taxa20 -
        a.backtest.taxa20
      );

    }


    if(
      a.backtest.lossSeguidos !==
      b.backtest.lossSeguidos
    ){

      return (
        a.backtest.lossSeguidos -
        b.backtest.lossSeguidos
      );

    }


    return (
      b.similaridade -
      a.similaridade
    );

  });


  return {

    escolhido:
    avaliadas[0],

    ranking:
    avaliadas

  };

}


/* =========================================================
   MELHOR CONFIGURAÇÃO DE CADA RX

   IMPORTANTE:
   RX4 / RX5 / RX6 fazem seus
   próprios backtests.

   Não é mais escolhido apenas
   pela similaridade.
========================================================= */

function melhorConfiguracaoDoRX(
  base,
  rx
){

  const candidatas=[];


  JANELAS_ESTADO_TESTADAS
  .forEach(janelaEstado => {

    PERFIS
    .forEach(perfil => {

      OFFSETS_TESTADOS
      .forEach(offset => {

        const config =
        gerarConfiguracao(
          base,
          rx,
          janelaEstado,
          perfil,
          offset
        );


        if(config.valido){

          const bt =
          backtestConfiguracao(
            base,
            config
          );


          const scoreFinal =

          scoreEstabilidade(bt)

          +

          config.similaridade *
          0.08;


          candidatas.push({

            ...config,

            backtest:bt,

            scoreFinal

          });

        }

      });

    });

  });


  if(!candidatas.length){
    return null;
  }


  candidatas.sort(
  (a,b) => {

    if(
      Math.abs(
        b.scoreFinal -
        a.scoreFinal
      )
      >
      0.001
    ){

      return (
        b.scoreFinal -
        a.scoreFinal
      );

    }


    if(
      b.backtest.taxa10 !==
      a.backtest.taxa10
    ){

      return (
        b.backtest.taxa10 -
        a.backtest.taxa10
      );

    }


    return (
      b.similaridade -
      a.similaridade
    );

  });


  return candidatas[0];

}


/* =========================================================
   ASSINATURA DO HISTÓRICO

   Evita sobrescrever previsão
   congelada sem novo resultado.
========================================================= */

function assinaturaHistorico(){

  return (
    historico.length +
    "|" +
    historico
    .slice(-32)
    .join(",")
  );

}


/* =========================================================
   SNAPSHOT
========================================================= */

function criarSnapshot(config){

  if(
    !config ||
    !config.valido
  ){
    return null;
  }


  return {

    criadoCom:
    historico.length,

    assinatura:
    assinaturaHistorico(),

    rx:
    config.rx,

    janelaEstado:
    config.janelaEstado,

    perfil:
    config.perfil.id,

    offset:
    config.offset || 0,

    numeros:
    Array.from(
      config.jogada.numerosUsados
    ),

    blocos2:
    config.jogada.blocos2
    .map(b => ({

      centro:
      b.centro,

      numeros:
      b.numeros.slice()

    })),

    blocos1:
    config.jogada.blocos1
    .map(b => ({

      centro:
      b.centro,

      numeros:
      b.numeros.slice()

    })),

    backtest:
    config.backtest
    ?
    {

      taxa:
      config.backtest.taxa,

      taxa5:
      config.backtest.taxa5,

      taxa10:
      config.backtest.taxa10,

      taxa20:
      config.backtest.taxa20,

      testes:
      config.backtest.testes,

      lossSeguidos:
      config.backtest.lossSeguidos

    }
    :
    null

  };

}


/* =========================================================
   DIAGNÓSTICO DO RESULTADO
========================================================= */

function diagnosticarResultado(
  snapshot,
  numero
){

  if(
    !snapshot ||
    !Array.isArray(
      snapshot.numeros
    )
  ){

    return null;

  }


  if(
    snapshot.numeros
    .includes(numero)
  ){

    return {
      green:true,
      distancia:0,
      terminal:
      terminalDoNumero(numero),
      regiao:
      regiaoDoNumero(numero),
      altura:
      classeAltura(numero),
      cor:
      classeCor(numero)
    };

  }


  let menor=99;


  snapshot.numeros
  .forEach(coberto => {

    menor =
    Math.min(
      menor,
      distanciaRoda(
        numero,
        coberto
      )
    );

  });


  const t =
  terminalDoNumero(numero);


  let vizinhoTerminalCoberto=false;


  snapshot.numeros
  .forEach(coberto => {

    const tc =
    terminalDoNumero(
      coberto
    );


    if(
      tc ===
      terminalAnterior(t)
      ||
      tc ===
      terminalSeguinte(t)
    ){

      vizinhoTerminalCoberto=true;

    }

  });


  return {

    green:false,

    distancia:
    menor,

    borda1:
    menor === 1,

    borda2:
    menor === 2,

    terminal:t,

    vizinhoTerminalCoberto,

    regiao:
    regiaoDoNumero(numero),

    altura:
    classeAltura(numero),

    cor:
    classeCor(numero)

  };

}


/* =========================================================
   AVALIAR PREVISÕES CONGELADAS
========================================================= */

function avaliarPendentes(
  novoNumero
){

  const assinaturaAntes =
  assinaturaHistorico();


  RX_DISPONIVEIS
  .forEach(rx => {

    const pendente =
    estado.pendentesRX[rx];


    if(!pendente){
      return;
    }


    /*
      Só avalia se foi realmente
      criado para este estado.
    */

    if(
      pendente.assinatura &&
      pendente.assinatura !==
      assinaturaAntes
    ){

      estado.pendentesRX[rx] =
      null;

      return;

    }


    const green =
    pendente.numeros
    .includes(
      novoNumero
    );


    const diagnostico =
    diagnosticarResultado(
      pendente,
      novoNumero
    );


    estado.timelineRX[rx]
    .push({

      resultado:
      novoNumero,

      green,

      rx,

      janelaEstado:
      pendente.janelaEstado,

      perfil:
      pendente.perfil,

      offset:
      pendente.offset || 0,

      numeros:
      pendente.numeros.slice(),

      diagnostico,

      hora:
      Date.now()

    });


    estado.timelineRX[rx] =
    estado.timelineRX[rx]
    .slice(-MAX_TIMELINE);


    estado.pendentesRX[rx] =
    null;

  });


  if(
    estado.pendenteAuto
  ){

    const p =
    estado.pendenteAuto;


    if(
      !p.assinatura ||
      p.assinatura ===
      assinaturaAntes
    ){

      const green =
      p.numeros
      .includes(
        novoNumero
      );


      const diagnostico =
      diagnosticarResultado(
        p,
        novoNumero
      );


      estado.timelineAuto
      .push({

        resultado:
        novoNumero,

        green,

        rx:
        p.rx,

        janelaEstado:
        p.janelaEstado,

        perfil:
        p.perfil,

        offset:
        p.offset || 0,

        numeros:
        p.numeros.slice(),

        diagnostico,

        backtest:
        p.backtest,

        hora:
        Date.now()

      });


      estado.timelineAuto =
      estado.timelineAuto
      .slice(-MAX_TIMELINE);

    }


    estado.pendenteAuto =
    null;

  }


  salvarEstado();

}


/* =========================================================
   TIMELINE STATS
========================================================= */

function estatisticaTimeline(lista){

  function taxa(itens){

    if(!itens.length){
      return 0;
    }

    return (
      itens.filter(
        x => x.green
      ).length
      /
      itens.length
      *
      100
    );

  }


  let lossSeguidos=0;


  for(
    let i=lista.length-1;
    i>=0;
    i--
  ){

    if(lista[i].green){
      break;
    }

    lossSeguidos++;

  }


  return {

    total:
    lista.length,

    taxa5:
    taxa(
      lista.slice(-5)
    ),

    taxa10:
    taxa(
      lista.slice(-10)
    ),

    taxa20:
    taxa(
      lista.slice(-20)
    ),

    lossSeguidos

  };

}


/* =========================================================
   CONGELAR SOMENTE SE AINDA NÃO
   EXISTE PREVISÃO PARA O ESTADO
========================================================= */

function garantirSnapshotRX(
  rx,
  config
){

  const assinatura =
  assinaturaHistorico();


  const atual =
  estado.pendentesRX[rx];


  if(
    atual &&
    atual.assinatura ===
    assinatura
  ){

    return;

  }


  estado.pendentesRX[rx] =
  criarSnapshot(config);

}


function garantirSnapshotAuto(
  config
){

  const assinatura =
  assinaturaHistorico();


  if(
    estado.pendenteAuto &&
    estado.pendenteAuto
    .assinatura ===
    assinatura
  ){

    return;

  }


  estado.pendenteAuto =
  criarSnapshot(config);

}


/* =========================================================
   PROCESSAR ESTADO ATUAL
========================================================= */

function processarEstadoAtual(){

  const rxConfigs = {};


  RX_DISPONIVEIS
  .forEach(rx => {

    rxConfigs[rx] =
    melhorConfiguracaoDoRX(
      historico,
      rx
    );

  });


  const otimizacao =
  otimizarProximaJogada(
    historico
  );


  /*
    IMPORTANTE:
    render/manual não sobrescreve
    snapshot congelado.
  */

  RX_DISPONIVEIS
  .forEach(rx => {

    garantirSnapshotRX(
      rx,
      rxConfigs[rx]
    );

  });


  garantirSnapshotAuto(
    otimizacao.escolhido
  );


  if(
    otimizacao.escolhido
  ){

    estado.ultimaConfiguracao = {

      rx:
      otimizacao.escolhido.rx,

      janelaEstado:
      otimizacao.escolhido
      .janelaEstado,

      perfil:
      otimizacao.escolhido
      .perfil.id,

      offset:
      otimizacao.escolhido
      .offset || 0

    };

  }


  salvarEstado();


  return {
    rxConfigs,
    otimizacao
  };

}


/* =========================================================
   ADICIONAR NÚMERO
========================================================= */

function adicionarNumero(numero){

  /*
    1. avalia previsão anterior.
  */

  avaliarPendentes(
    numero
  );


  /*
    2. insere resultado.
  */

  historico.push(
    numero
  );


  historico =
  historico.slice(
    -MAX_HISTORICO
  );


  salvarHistorico();


  statusArea.textContent =
  "Número " +
  numero +
  " inserido • recalculando próxima jogada...";


  statusArea.style.color =
  "#00e5ff";


  /*
    3. cria nova previsão.
  */

  render();

}


/* =========================================================
   HISTÓRICO COLADO
========================================================= */

function extrairNumeros(texto){

  const encontrados =
  texto.match(
    /\b(?:[0-9]|[12][0-9]|3[0-6])\b/g
  );


  if(!encontrados){
    return [];
  }


  return encontrados
  .map(Number)
  .filter(n =>
    n >= 0 &&
    n <= 36
  )
  .slice(-MAX_HISTORICO);

}


function inserirHistorico(){

  const campo =
  document.getElementById(
    "entradaHistorico"
  );


  const numeros =
  extrairNumeros(
    campo.value
  );


  if(!numeros.length){

    statusArea.textContent =
    "Nenhum número válido.";

    statusArea.style.color =
    "#ff5252";

    return;

  }


  historico =
  numeros;


  estado.pendenteAuto=null;

  estado.pendentesRX={
    4:null,
    5:null,
    6:null
  };

  estado.timelineRX={
    4:[],
    5:[],
    6:[]
  };

  estado.timelineAuto=[];


  salvarHistorico();
  salvarEstado();


  campo.value="";


  statusArea.textContent =
  historico.length +
  " números carregados.";


  statusArea.style.color =
  "#00e676";


  render();

}


/* =========================================================
   APAGAR
========================================================= */

function apagarUltimo(){

  if(!historico.length){
    return;
  }


  historico.pop();


  estado.pendenteAuto=null;

  estado.pendentesRX={
    4:null,
    5:null,
    6:null
  };


  salvarHistorico();
  salvarEstado();

  render();

}


function apagarTudo(){

  if(
    !confirm(
      "Apagar todo o histórico?"
    )
  ){
    return;
  }


  historico=[];


  estado.pendenteAuto=null;

  estado.pendentesRX={
    4:null,
    5:null,
    6:null
  };

  estado.timelineRX={
    4:[],
    5:[],
    6:[]
  };

  estado.timelineAuto=[];

  estado.ultimaConfiguracao=null;


  salvarHistorico();
  salvarEstado();

  render();

}


/* =========================================================
   AUTO / MANUAL
========================================================= */

function ativarAuto(){

  estado.modo =
  "AUTO";

  salvarEstado();

  render();

}


function ativarManual(rx){

  estado.modo =
  "MANUAL";

  estado.manualRX =
  rx;

  salvarEstado();

  render();

}


/* =========================================================
   INTERFACE
========================================================= */

document.body.innerHTML="";

document.body.style.margin="0";
document.body.style.background="#101010";
document.body.style.color="#fff";
document.body.style.fontFamily="Arial,sans-serif";


const app =
document.createElement("div");


app.innerHTML = `

<style>

*{
box-sizing:border-box;
}

button,
textarea{
font-family:Arial,sans-serif;
}

button{
cursor:pointer;
touch-action:manipulation;
}

.app{
max-width:900px;
margin:auto;
padding:6px;
}

h2{
text-align:center;
margin:5px 0 9px;
font-size:21px;
}

.painel{
background:#1d1d1f;
border:1px solid #444;
border-radius:10px;
padding:8px;
margin-bottom:7px;
}

.titulo{
font-size:10px;
font-weight:900;
color:#aaa;
}

textarea{
width:100%;
height:65px;
background:#111;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:7px;
}

.acoes{
display:flex;
gap:5px;
flex-wrap:wrap;
margin-top:5px;
}

.btn{
background:#333;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:7px 9px;
font-weight:900;
}

.verde{
background:#146238;
}

.vermelho{
background:#762832;
}

.status{
font-size:10px;
font-weight:900;
color:#aaa;
margin-top:5px;
}


/* CONTROLE */

.controle{
display:flex;
gap:4px;
align-items:center;
flex-wrap:wrap;
margin-top:5px;
}

.modo{
background:#222;
border:1px solid #555;
color:#999;
border-radius:7px;
padding:7px 10px;
font-weight:900;
}

.modo.ativo{
background:#007d98;
border-color:#00e5ff;
color:#fff;
}

.modo.vencedor{
border-color:#00e5ff;
color:#00e5ff;
box-shadow:0 0 7px rgba(0,229,255,.45);
}


/* MOTOR */

.motorGrid{
display:grid;
grid-template-columns:repeat(5,1fr);
gap:4px;
margin-top:7px;
}

.motorCard{
background:#111;
border:1px solid #333;
border-radius:7px;
padding:6px;
text-align:center;
}

.motorCard small{
display:block;
font-size:7px;
font-weight:900;
color:#777;
}

.motorCard strong{
display:block;
font-size:15px;
margin-top:3px;
}

.meta90{
color:#00e676;
}

.abaixo90{
color:#ffc107;
}


/* MOMENTO */

.momento{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:4px;
margin-top:7px;
}

.momentoBox{
background:#111;
border:1px solid #333;
border-radius:7px;
padding:6px;
text-align:center;
}

.momentoBox small{
display:block;
font-size:7px;
color:#777;
font-weight:900;
}

.momentoBox strong{
font-size:14px;
}


/* TIMELINE */

.timelineArea{
margin-top:8px;
}

.timelineLinha{
display:grid;
grid-template-columns:45px 1fr 48px;
gap:4px;
align-items:center;
margin-top:4px;
}

.timelineNome{
font-size:10px;
font-weight:900;
text-align:center;
}

.timeline{
display:flex;
gap:2px;
overflow:hidden;
justify-content:flex-end;
}

.gl{
width:16px;
min-width:16px;
height:16px;
border-radius:3px;
display:flex;
align-items:center;
justify-content:center;
font-size:7px;
font-weight:900;
}

.greenGL{
background:#00a651;
}

.lossGL{
background:#c62828;
}

.timelineTaxa{
font-size:9px;
font-weight:900;
text-align:right;
}


/* ÚLTIMOS */

.linha{
display:grid;
grid-template-columns:55px minmax(0,1fr);
gap:4px;
align-items:center;
margin-top:5px;
}

.rotulo{
font-size:8px;
font-weight:900;
color:#888;
}

.scroll{
display:flex;
gap:3px;
overflow-x:auto;
}

.bola,
.regiaoBox,
.idBox{
min-width:33px;
height:33px;
display:flex;
align-items:center;
justify-content:center;
font-size:11px;
font-weight:900;
}

.bola{
border-radius:50%;
border:2px solid #aaa;
}

.regiaoBox{
border-radius:6px;
}

.idBox{
background:#111;
border:1px solid #444;
border-radius:6px;
gap:2px;
}

.idTag{
padding:5px 3px;
border-radius:4px;
}


/* JOGADA */

.jogadaCab{
display:flex;
justify-content:space-between;
align-items:center;
gap:5px;
}

.jogadaInfo{
font-size:11px;
font-weight:900;
color:#00e5ff;
}

.jogadaLinha{
display:flex;
gap:5px;
overflow-x:auto;
margin-top:6px;
}

.bloco{
min-width:138px;
background:#111;
border:1px solid #00e5ff;
border-radius:8px;
padding:7px;
text-align:center;
}

.bloco.um{
border-color:#ffc107;
}

.bloco small{
display:block;
font-size:7px;
font-weight:900;
color:#888;
}

.bloco strong{
display:block;
font-size:21px;
margin:3px;
}

.nums{
border-top:1px solid #333;
padding-top:4px;
font-size:10px;
font-weight:900;
}


/* TECLADO */

.teclado{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:4px;
margin-top:5px;
}

.numeroBtn{
height:38px;
border:1px solid #666;
border-radius:6px;
color:#fff;
font-weight:900;
}

.zeroBtn{
grid-column:span 6;
}


/* MOBILE */

@media(max-width:650px){

.motorGrid{
grid-template-columns:repeat(3,1fr);
}

.momento{
grid-template-columns:repeat(2,1fr);
}

.timelineLinha{
grid-template-columns:39px 1fr 43px;
}

.gl{
width:14px;
min-width:14px;
height:14px;
}

}

</style>


<div class="app">

<h2>
Análise 0 • 6 • 9
</h2>


<section class="painel">

<textarea
id="entradaHistorico"
placeholder="Cole o histórico do mais antigo para o mais recente..."
></textarea>

<div class="acoes">

<button
id="btnInserir"
class="btn verde">
Inserir histórico
</button>

<button
id="btnApagarUltimo"
class="btn">
Apagar último
</button>

<button
id="btnApagarTudo"
class="btn vermelho">
Apagar tudo
</button>

</div>

<div
id="statusArea"
class="status">
Pronto.
</div>

</section>


<section class="painel">

<div class="titulo">
MOTOR ADAPTATIVO
</div>

<div class="controle">

<button id="auto" class="modo">
AUTO
</button>

<button id="rx4" class="modo">
4
</button>

<button id="rx5" class="modo">
5
</button>

<button id="rx6" class="modo">
6
</button>

</div>


<div
id="motorGrid"
class="motorGrid">
</div>


<div
id="momento"
class="momento">
</div>


<div class="timelineArea">

<div class="titulo">
LINHA DO TEMPO REAL — ÚLTIMOS 20
</div>

<div
id="timelineAUTO"
class="timelineLinha">
</div>

<div
id="timeline4"
class="timelineLinha">
</div>

<div
id="timeline5"
class="timelineLinha">
</div>

<div
id="timeline6"
class="timelineLinha">
</div>

</div>

</section>


<section class="painel">

<div class="titulo">
ÚLTIMOS 14
</div>

<div class="linha">

<div class="rotulo">
ROLETA
</div>

<div
id="linhaRoleta"
class="scroll">
</div>

</div>


<div class="linha">

<div class="rotulo">
REGIÃO
</div>

<div
id="linhaRegiao"
class="scroll">
</div>

</div>


<div class="linha">

<div class="rotulo">
ID
</div>

<div
id="linhaID"
class="scroll">
</div>

</div>

</section>


<section class="painel">

<div class="jogadaCab">

<div class="titulo">
PRÓXIMA JOGADA
</div>

<div
id="jogadaInfo"
class="jogadaInfo">
—
</div>

</div>

<div id="jogadaArea">
</div>

</section>


<section class="painel">

<div class="titulo">
TECLADO 0–36
</div>

<div
id="teclado"
class="teclado">
</div>

</section>

</div>
`;


document.body.appendChild(app);


/* =========================================================
   DOM
========================================================= */

const statusArea =
document.getElementById(
  "statusArea"
);


const jogadaArea =
document.getElementById(
  "jogadaArea"
);


const jogadaInfo =
document.getElementById(
  "jogadaInfo"
);


/* =========================================================
   EVENTOS
========================================================= */

document
.getElementById("auto")
.onclick =
ativarAuto;


document
.getElementById("rx4")
.onclick =
() => ativarManual(4);


document
.getElementById("rx5")
.onclick =
() => ativarManual(5);


document
.getElementById("rx6")
.onclick =
() => ativarManual(6);


document
.getElementById("btnInserir")
.onclick =
inserirHistorico;


document
.getElementById("btnApagarUltimo")
.onclick =
apagarUltimo;


document
.getElementById("btnApagarTudo")
.onclick =
apagarTudo;


/* =========================================================
   TECLADO
========================================================= */

const teclado =
document.getElementById(
  "teclado"
);


for(
  let numero=1;
  numero<=36;
  numero++
){

  const botao =
  document.createElement(
    "button"
  );


  botao.className =
  "numeroBtn";


  botao.textContent =
  numero;


  botao.style.background =
  corNumeroRoleta(numero);


  botao.onclick =
  () =>
  adicionarNumero(numero);


  teclado.appendChild(
    botao
  );

}


const zero =
document.createElement(
  "button"
);


zero.className =
"numeroBtn zeroBtn";


zero.textContent="0";


zero.style.background =
"#087c48";


zero.onclick =
() =>
adicionarNumero(0);


teclado.appendChild(
  zero
);


/* =========================================================
   RENDER TIMELINE
========================================================= */

function renderTimeline(
  id,
  nome,
  lista
){

  const area =
  document.getElementById(id);


  const ultimos =
  lista.slice(-20);


  const estatistica =
  estatisticaTimeline(
    lista
  );


  const caixas =
  ultimos
  .map(item => {

    let titulo =
    "Resultado " +
    item.resultado;


    if(
      item.offset !== undefined
    ){

      titulo +=
      " • Offset " +
      item.offset;

    }


    if(
      item.diagnostico &&
      !item.green
    ){

      titulo +=
      " • Dist " +
      item.diagnostico.distancia;

      titulo +=
      " • T" +
      item.diagnostico.terminal;

    }


    return (

      '<span class="' +

      'gl ' +

      (
        item.green
        ?
        'greenGL'
        :
        'lossGL'
      ) +

      '" title="' +

      titulo +

      '">' +

      (
        item.green
        ?
        'G'
        :
        'L'
      ) +

      '</span>'

    );

  })
  .join("");


  area.innerHTML =

  '<div class="timelineNome">' +
  nome +
  '</div>' +

  '<div class="timeline">' +
  caixas +
  '</div>' +

  '<div class="timelineTaxa">' +

  (
    estatistica.total
    ?
    estatistica.taxa20
    .toFixed(0) +
    "%"
    :
    "—"
  ) +

  '</div>';

}


/* =========================================================
   RENDER MOMENTO
========================================================= */

function renderMomento(){

  const estadoAtual =
  descreverEstado(
    historico,
    JANELA_ESTADO
  );


  const totalAB =
  estadoAtual.alto +
  estadoAtual.baixo;


  const totalCor =
  estadoAtual.vermelho +
  estadoAtual.preto;


  const pAlto =
  totalAB
  ?
  estadoAtual.alto /
  totalAB *
  100
  :
  0;


  const pBaixo =
  totalAB
  ?
  estadoAtual.baixo /
  totalAB *
  100
  :
  0;


  const pVermelho =
  totalCor
  ?
  estadoAtual.vermelho /
  totalCor *
  100
  :
  0;


  const pPreto =
  totalCor
  ?
  estadoAtual.preto /
  totalCor *
  100
  :
  0;


  document
  .getElementById(
    "momento"
  )
  .innerHTML =

  '<div class="momentoBox">' +
  '<small>BAIXO 1–18</small>' +
  '<strong>' +
  pBaixo.toFixed(0) +
  '%</strong>' +
  '</div>' +

  '<div class="momentoBox">' +
  '<small>ALTO 19–36</small>' +
  '<strong>' +
  pAlto.toFixed(0) +
  '%</strong>' +
  '</div>' +

  '<div class="momentoBox">' +
  '<small>VERMELHO</small>' +
  '<strong>' +
  pVermelho.toFixed(0) +
  '%</strong>' +
  '</div>' +

  '<div class="momentoBox">' +
  '<small>PRETO</small>' +
  '<strong>' +
  pPreto.toFixed(0) +
  '%</strong>' +
  '</div>';

}


/* =========================================================
   RENDER MOTOR
========================================================= */

function renderMotor(
  otimizacao
){

  const area =
  document.getElementById(
    "motorGrid"
  );


  const escolhido =
  otimizacao.escolhido;


  if(!escolhido){

    area.innerHTML =

    '<div class="motorCard">' +
    '<small>STATUS</small>' +
    '<strong>AGUARDANDO</strong>' +
    '</div>';

    return;

  }


  const bt =
  escolhido.backtest;


  const classe20 =
  bt.taxa20 >= 90
  ?
  "meta90"
  :
  "abaixo90";


  const classe10 =
  bt.taxa10 >= 90
  ?
  "meta90"
  :
  "abaixo90";


  area.innerHTML =

  '<div class="motorCard">' +
  '<small>RX</small>' +
  '<strong>' +
  escolhido.rx +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>ESTADO</small>' +
  '<strong>' +
  escolhido.janelaEstado +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>BACKTEST 10</small>' +
  '<strong class="' +
  classe10 +
  '">' +
  bt.taxa10.toFixed(0) +
  '%</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>BACKTEST 20</small>' +
  '<strong class="' +
  classe20 +
  '">' +
  bt.taxa20.toFixed(0) +
  '%</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>LOSS SEGUIDOS</small>' +
  '<strong>' +
  bt.lossSeguidos +
  '</strong>' +
  '</div>';

}


/* =========================================================
   RENDER CONTROLE
========================================================= */

function renderControle(
  resultado
){

  [
    "auto",
    "rx4",
    "rx5",
    "rx6"
  ]
  .forEach(id => {

    document
    .getElementById(id)
    .classList.remove(
      "ativo",
      "vencedor"
    );

  });


  if(
    estado.modo ===
    "AUTO"
  ){

    document
    .getElementById(
      "auto"
    )
    .classList.add(
      "ativo"
    );


    if(
      resultado.otimizacao
      .escolhido
    ){

      document
      .getElementById(
        "rx" +
        resultado.otimizacao
        .escolhido.rx
      )
      .classList.add(
        "vencedor"
      );

    }

  }

  else{

    document
    .getElementById(
      "rx" +
      estado.manualRX
    )
    .classList.add(
      "ativo"
    );

  }

}


/* =========================================================
   RENDER 14
========================================================= */

function render14(){

  const janela =
  historico.slice(
    -JANELA_VISUAL
  );


  document
  .getElementById(
    "linhaRoleta"
  )
  .innerHTML =

  janela
  .map(numero =>

    '<div class="bola" ' +

    'style="background:' +
    corNumeroRoleta(numero) +
    '">' +

    numero +

    '</div>'

  )
  .join("");


  document
  .getElementById(
    "linhaRegiao"
  )
  .innerHTML =

  janela
  .map(numero => {

    const regiao =
    regiaoDoNumero(numero);


    return (

      '<div class="regiaoBox" ' +

      'style="background:' +

      (
        regiao
        ?
        coresRegioes[regiao]
        :
        "#555"
      ) +

      '">' +

      numero +

      '</div>'

    );

  })
  .join("");


  document
  .getElementById(
    "linhaID"
  )
  .innerHTML =

  janela
  .map(numero => {

    const ids =
    idsQueBatem(numero);


    if(!ids.length){

      return (
        '<div class="idBox">—</div>'
      );

    }


    return (

      '<div class="idBox">' +

      ids
      .map(id =>

        '<span class="idTag" ' +

        'style="background:' +
        corDoId(id) +
        '">' +

        id +

        '</span>'

      )
      .join("") +

      '</div>'

    );

  })
  .join("");

}


/* =========================================================
   RENDER JOGADA
========================================================= */

function renderJogada(config){

  if(
    !config ||
    !config.valido
  ){

    jogadaInfo.textContent =
    "AGUARDANDO";


    jogadaArea.innerHTML =

    '<div style="' +
    'color:#777;' +
    'padding:8px' +
    '">' +

    'Histórico insuficiente.' +

    '</div>';


    return;

  }


  let texto =

  "RX" +
  config.rx +

  " • E" +
  config.janelaEstado +

  " • " +
  config.perfil.id;


  /*
    Offset aparece apenas como
    diagnóstico da configuração.
  */

  if(
    config.offset
  ){

    texto +=

    " • OF" +

    (
      config.offset > 0
      ?
      "+"
      :
      ""
    )

    +

    config.offset;

  }


  if(
    config.backtest
  ){

    texto +=

    " • " +

    config.backtest.taxa20
    .toFixed(0) +

    "%";

  }


  jogadaInfo.textContent =
  texto;


  const html2 =

  config.jogada.blocos2

  .map(bloco =>

    '<div class="bloco">' +

    '<small>2 VIZINHOS DO</small>' +

    '<strong>' +
    bloco.centro +
    '</strong>' +

    '<div class="nums">' +
    bloco.numeros
    .join(" • ") +
    '</div>' +

    '</div>'

  )
  .join("");


  const html1 =

  config.jogada.blocos1

  .map(bloco =>

    '<div class="bloco um">' +

    '<small>1 VIZINHO DO</small>' +

    '<strong>' +
    bloco.centro +
    '</strong>' +

    '<div class="nums">' +
    bloco.numeros
    .join(" • ") +
    '</div>' +

    '</div>'

  )
  .join("");


  jogadaArea.innerHTML =

  '<div class="jogadaLinha">' +
  html2 +
  '</div>' +

  '<div class="jogadaLinha">' +
  html1 +
  '</div>';

}


/* =========================================================
   RENDER
========================================================= */

function render(){

  try{

    const resultado =
    processarEstadoAtual();


    renderControle(
      resultado
    );


    renderMotor(
      resultado.otimizacao
    );


    renderMomento();


    renderTimeline(
      "timelineAUTO",
      "AUTO",
      estado.timelineAuto
    );


    renderTimeline(
      "timeline4",
      "RX4",
      estado.timelineRX[4]
    );


    renderTimeline(
      "timeline5",
      "RX5",
      estado.timelineRX[5]
    );


    renderTimeline(
      "timeline6",
      "RX6",
      estado.timelineRX[6]
    );


    render14();


    let ativa=null;


    if(
      estado.modo ===
      "AUTO"
    ){

      ativa =
      resultado.otimizacao
      .escolhido;

    }

    else{

      ativa =
      resultado.rxConfigs[
        estado.manualRX
      ];

    }


    renderJogada(
      ativa
    );


    console.log(
      "MOTOR ADAPTATIVO",
      {

        modo:
        estado.modo,

        selecionada:
        resultado.otimizacao
        .escolhido,

        RX4:
        resultado.rxConfigs[4],

        RX5:
        resultado.rxConfigs[5],

        RX6:
        resultado.rxConfigs[6],

        top10:
        resultado.otimizacao
        .ranking
        .slice(0,10)
        .map(x => ({

          RX:x.rx,

          ESTADO:
          x.janelaEstado,

          PERFIL:
          x.perfil.id,

          OFFSET:
          x.offset || 0,

          BT5:
          x.backtest.taxa5
          .toFixed(1),

          BT10:
          x.backtest.taxa10
          .toFixed(1),

          BT20:
          x.backtest.taxa20
          .toFixed(1),

          BTGERAL:
          x.backtest.taxa
          .toFixed(1),

          QUEDA:
          x.backtest.deterioracao
          .toFixed(1),

          LOSS:
          x.backtest.lossSeguidos,

          SIM:
          x.similaridade
          .toFixed(1),

          SCORE:
          x.scoreFinal
          .toFixed(1)

        }))

      }
    );


    statusArea.textContent =
    historico.length
    ?
    historico.length +
    " números • próxima jogada calculada."
    :
    "Pronto.";


    statusArea.style.color =
    historico.length
    ?
    "#00e676"
    :
    "#aaa";


  }catch(erro){

    console.error(
      erro
    );


    statusArea.textContent =
    "Erro: " +
    (
      erro &&
      erro.message
      ?
      erro.message
      :
      "erro desconhecido"
    );


    statusArea.style.color =
    "#ff5252";

  }

}


/* =========================================================
   INICIAR
========================================================= */

render();

})();
