(function () {
"use strict";

/* =========================================================
   ANALISADOR 0 • 6 • 9
   MOTOR ORIGINAL + CAMADA ADAPTATIVA

   REGRA PRINCIPAL DESTA VERSÃO:

   O RAIO X NÃO FOI SUBSTITUÍDO.

   MOTOR-BASE:
   1. RX 4 / 5 / 6
   2. Similaridade original:
      80% eventos 0/6/9
      20% formato da trajetória
   3. Réplicas históricas
   4. Próximos números reais das réplicas
   5. 5 setores de 2 vizinhos
   6. 1 setor de 1 vizinho
   7. 28 números sem sobreposição

   CAMADA NOVA:
   - AUTO adaptativo
   - offset -2/-1/0/+1/+2
   - borda
   - alto/baixo
   - vermelho/preto
   - regiões
   - terminais
   - vizinhos de terminal
   - concentração física
   - recuperação quando taxa deteriora
   - timelines RX4/RX5/RX6 congeladas
   - timeline AUTO congelada

   IMPORTANTE:
   As informações auxiliares NÃO mudam
   a seleção histórica das réplicas RX.

   Elas trabalham depois do RX.
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const STORAGE_KEY =
"ANALISADOR_069_IDS_CORRESPONDENTES_V1";

const STORAGE_ENGINE =
"ANALISADOR_069_ENGINE_ORIGINAL_ADAPTATIVO_V8";

const MAX_HISTORICO = 5000;

const JANELA_VISUAL = 14;
const JANELA_ESTADO = 20;

const MAX_TIMELINE = 300;

const RX_DISPONIVEIS = [4,5,6];

const PERCENTUAL_REPLICAS_RX = 0.10;
const MIN_REPLICAS_RX = 15;
const MAX_REPLICAS_RX = 40;

const QTD_2V = 5;
const TOTAL_COBERTURA = 28;

const OFFSETS_TESTADOS = [-2,-1,0,1,2];

const MAX_TESTES_OFFSET = 60;
const MIN_TESTES_OFFSET = 8;

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

  offsetAtual:0,

  ultimaConfiguracao:null,

  fase:"APRENDENDO"

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


    if(
      Number.isInteger(
        salvo.offsetAtual
      )
    ){

      estado.offsetAtual =
      salvo.offsetAtual;

    }


    if(salvo.ultimaConfiguracao){

      estado.ultimaConfiguracao =
      salvo.ultimaConfiguracao;

    }


    if(salvo.fase){

      estado.fase =
      salvo.fase;

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


  const numeros=[];


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
          indice-d+
          track.length
        )
        %
        track.length
      ]

    );


    resultado.push(

      track[
        (
          indice+d
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


function moverNaRoda(
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


/* =========================================================
   CORES / REGIÕES
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


/* =========================================================
   TERMINAIS
========================================================= */

function terminal(numero){

  return numero % 10;

}


function terminalAnterior(t){

  return (
    t+9
  ) % 10;

}


function terminalSeguinte(t){

  return (
    t+1
  ) % 10;

}


/* =========================================================
   FAMÍLIAS
========================================================= */

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

  const familia =
  familiaDoId(id);


  if(familia === 0){
    return COR_T0;
  }


  if(familia === 6){
    return COR_T6;
  }


  if(familia === 9){
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

  const ids=[];


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
   TRAJETÓRIA ORIGINAL 0/6/9

   NÃO ALTERAR A LÓGICA DO RX.
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


/* =========================================================
   SIMILARIDADE ORIGINAL

   80% sequência
   20% formato

   ALTO/BAIXO, COR, REGIÃO E TERMINAL
   NÃO ENTRAM AQUI.
========================================================= */

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
   RAIO X ORIGINAL

   IMPORTANTE:

   A seleção das réplicas volta a ser
   determinada SOMENTE pelo RX.

   Nenhum:
   - alto/baixo
   - vermelho/preto
   - região
   - terminal
   entra na seleção.
========================================================= */

function selecionarReplicasRX(
  base,
  rx
){

  const total =
  base.length;


  if(
    total <
    rx*2+2
  ){

    return {
      estado:"AGUARDANDO",
      replicas:[],
      similaridade:0
    };

  }


  const inicioAtual =
  total-rx;


  const janelaAtual =
  base.slice(
    inicioAtual,
    total
  );


  const candidatos=[];


  for(
    let inicio=0;
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


    const similaridade =
    calcularSimilaridade(
      janelaAtual,
      janelaAntiga
    );


    candidatos.push({

      inicio,

      proximo,

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


  let replicas =
  candidatos.slice(
    0,
    quantidade
  );


  /*
    Expansão até termos diversidade
    suficiente de IDs.

    Não muda a ordenação histórica.
  */

  function contarIDs(lista){

    const ids =
    new Set();


    lista.forEach(item => {

      idsQueBatem(
        item.proximo
      )
      .forEach(id => {

        ids.add(id);

      });

    });


    return ids.size;

  }


  while(
    replicas.length <
    Math.min(
      MAX_REPLICAS_RX,
      candidatos.length
    )
    &&
    contarIDs(replicas) < 8
  ){

    replicas.push(
      candidatos[
        replicas.length
      ]
    );

  }


  const similaridade =
  replicas.reduce(
    (s,x) =>
      s+x.similaridade,
    0
  )
  /
  Math.max(
    1,
    replicas.length
  );


  return {

    estado:"OK",

    replicas,

    similaridade

  };

}


/* =========================================================
   FREQUÊNCIA REAL DOS PRÓXIMOS

   ESSA É A BASE DA JOGADA.

   Não é frequência inventada pelo
   momento atual.

   São os resultados reais que vieram
   depois das réplicas históricas.
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
   ESTADO ATUAL AUXILIAR

   NÃO ALTERA AS RÉPLICAS.
========================================================= */

function analisarMomento(
  base,
  tamanho=JANELA_ESTADO
){

  const janela =
  base.slice(-tamanho);


  const resultado = {

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
    Array(10).fill(0),

    vizinhancaTerminal:
    Array(10).fill(0),

    roda:
    new Map()

  };


  track.forEach(n => {

    resultado.roda.set(
      n,
      0
    );

  });


  janela.forEach(numero => {

    if(numero === 0){

      resultado.zero++;

    }

    else if(numero <= 18){

      resultado.baixo++;

    }

    else{

      resultado.alto++;

    }


    if(
      numerosVermelhos.has(numero)
    ){

      resultado.vermelho++;

    }

    else if(numero !== 0){

      resultado.preto++;

    }


    const regiao =
    regiaoDoNumero(numero);


    if(regiao){

      resultado.regioes[
        regiao
      ]++;

    }


    familiasQueBatem(numero)
    .forEach(f => {

      resultado.familias[f]++;

    });


    resultado.terminais[
      terminal(numero)
    ]++;


    /*
      Densidade física recente.
    */

    track.forEach(alvo => {

      const d =
      distanciaRoda(
        numero,
        alvo
      );


      let peso=0;


      if(d === 0){
        peso=1;
      }

      else if(d === 1){
        peso=0.55;
      }

      else if(d === 2){
        peso=0.25;
      }


      if(peso){

        resultado.roda.set(

          alvo,

          resultado.roda.get(alvo)
          +
          peso

        );

      }

    });

  });


  for(
    let t=0;
    t<=9;
    t++
  ){

    resultado.vizinhancaTerminal[t] =

    resultado.terminais[
      terminalAnterior(t)
    ]

    +

    resultado.terminais[t]

    +

    resultado.terminais[
      terminalSeguinte(t)
    ];

  }


  return resultado;

}


/* =========================================================
   ESTATÍSTICA DA TIMELINE
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


  const ultimos5 =
  lista.slice(-5);

  const ultimos10 =
  lista.slice(-10);

  const ultimos20 =
  lista.slice(-20);


  return {

    total:
    lista.length,

    taxa5:
    taxa(ultimos5),

    taxa10:
    taxa(ultimos10),

    taxa20:
    taxa(ultimos20),

    taxaGeral:
    taxa(lista),

    lossSeguidos

  };

}


/* =========================================================
   FASE DO MOTOR

   90% = alvo de estabilidade.

   Não fabrica taxa.
========================================================= */

function determinarFase(){

  const stats =
  estatisticaTimeline(
    estado.timelineAuto
  );


  if(stats.total < 5){

    return "APRENDENDO";

  }


  if(
    stats.lossSeguidos >= 3 ||
    (
      stats.total >= 10 &&
      stats.taxa10 < 80
    )
  ){

    return "REESTRUTURAÇÃO";

  }


  if(
    stats.lossSeguidos >= 2 ||
    (
      stats.total >= 10 &&
      stats.taxa10 < 85
    )
  ){

    return "RECUPERAÇÃO";

  }


  if(
    stats.total >= 10 &&
    stats.taxa10 < 90
  ){

    return "RECALIBRAÇÃO";

  }


  return "NORMAL";

}


/* =========================================================
   ANÁLISE DE BORDA
========================================================= */

function pesoBordaAtual(){

  const fase =
  determinarFase();


  if(
    fase === "REESTRUTURAÇÃO"
  ){
    return 0.60;
  }


  if(
    fase === "RECUPERAÇÃO"
  ){
    return 0.50;
  }


  if(
    fase === "RECALIBRAÇÃO"
  ){
    return 0.42;
  }


  return 0.35;

}


/* =========================================================
   PONTUAÇÃO DE UM SETOR

   A frequência das réplicas continua
   sendo a força principal.

   Momento atual apenas auxilia
   desempate e borda.
========================================================= */

function avaliarSetor(
  centro,
  quantidade,
  frequencia,
  momento
){

  const numeros =
  setorVizinhosOrdenado(
    centro,
    quantidade
  );


  if(!numeros.length){
    return null;
  }


  let scoreBase=0;
  let suporte=0;


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
        multiplicador=1.45;
      }

      else if(distancia === 1){
        multiplicador=1.20;
      }

      else{
        multiplicador=1.00;
      }

    }

    else{

      if(distancia === 0){
        multiplicador=1.30;
      }

      else{
        multiplicador=1.00;
      }

    }


    scoreBase +=
    freq *
    multiplicador;

  });


  /*
    ERRO DE BORDA

    Penaliza quando existe frequência
    histórica imediatamente do lado de
    fora do setor.
  */

  const indiceCentro =
  indiceRoda(centro);


  const foraEsquerda =
  track[
    (
      indiceCentro -
      quantidade -
      1 +
      track.length
    )
    %
    track.length
  ];


  const foraDireita =
  track[
    (
      indiceCentro +
      quantidade +
      1
    )
    %
    track.length
  ];


  const freqFora =

  (
    frequencia.get(
      foraEsquerda
    )
    ||
    0
  )

  +

  (
    frequencia.get(
      foraDireita
    )
    ||
    0
  );


  const penalidadeBorda =
  freqFora *
  pesoBordaAtual();


  /*
    AUXÍLIO DO MOMENTO.

    Pequeno de propósito.

    Não substitui o RX.
  */

  let bonusMomento=0;


  if(
    momento &&
    momento.tamanho
  ){

    const total =
    Math.max(
      1,
      momento.tamanho
    );


    numeros.forEach(numero => {

      /*
        Concentração física.
      */

      bonusMomento +=
      (
        momento.roda.get(numero)
        ||
        0
      )
      *
      0.025;


      /*
        Terminal.
      */

      const t =
      terminal(numero);


      bonusMomento +=
      (
        momento.vizinhancaTerminal[t]
        /
        total
      )
      *
      0.10;


      /*
        Alto / baixo.
      */

      if(numero >= 19){

        bonusMomento +=
        (
          momento.alto /
          total
        )
        *
        0.025;

      }

      else if(numero >= 1){

        bonusMomento +=
        (
          momento.baixo /
          total
        )
        *
        0.025;

      }


      /*
        Cor.
      */

      if(
        numerosVermelhos.has(numero)
      ){

        bonusMomento +=
        (
          momento.vermelho /
          total
        )
        *
        0.02;

      }

      else if(numero !== 0){

        bonusMomento +=
        (
          momento.preto /
          total
        )
        *
        0.02;

      }


      /*
        Região.
      */

      const regiao =
      regiaoDoNumero(numero);


      if(regiao){

        bonusMomento +=
        (
          momento.regioes[regiao]
          /
          total
        )
        *
        0.025;

      }

    });

  }


  /*
    RX manda.
  */

  const score =

  scoreBase

  -

  penalidadeBorda

  +

  bonusMomento;


  return {

    centro,

    quantidade,

    numeros,

    suporte,

    scoreBase,

    penalidadeBorda,

    bonusMomento,

    score

  };

}


/* =========================================================
   MONTAGEM ORIGINAL DA JOGADA

   5 blocos de 2V
   1 bloco de 1V
   28 números únicos
========================================================= */

function montarJogadaBase(
  replicas,
  base
){

  const frequencia =
  gerarFrequenciaReplicas(
    replicas
  );


  const momento =
  analisarMomento(
    base,
    JANELA_ESTADO
  );


  const candidatos2 =
  track
  .map(centro =>

    avaliarSetor(
      centro,
      2,
      frequencia,
      momento
    )

  )
  .filter(Boolean)
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
      momento
    )

  )
  .filter(Boolean)
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
   APLICAR OFFSET GLOBAL

   Move TODOS os blocos igualmente.

   Portanto:
   - mantém geometria
   - mantém ausência de sobreposição
   - mantém 28 números
========================================================= */

function aplicarOffsetJogada(
  jogada,
  offset
){

  if(
    !jogada ||
    !jogada.valido
  ){
    return jogada;
  }


  if(offset === 0){

    return {

      ...jogada,

      offset:0,

      numerosUsados:
      new Set(
        jogada.numerosUsados
      )

    };

  }


  const blocos2 =
  jogada.blocos2
  .map(bloco => {

    const centro =
    moverNaRoda(
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
    moverNaRoda(
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


  const usados =
  new Set();


  blocos2
  .forEach(bloco => {

    bloco.numeros
    .forEach(numero => {

      usados.add(numero);

    });

  });


  blocos1
  .forEach(bloco => {

    bloco.numeros
    .forEach(numero => {

      usados.add(numero);

    });

  });


  return {

    ...jogada,

    blocos2,

    blocos1,

    numerosUsados:
    usados,

    offset,

    valido:
    usados.size ===
    TOTAL_COBERTURA

  };

}


/* =========================================================
   CONFIGURAÇÃO RX PURA
========================================================= */

function gerarConfiguracaoRX(
  base,
  rx,
  offset=0
){

  const selecao =
  selecionarReplicasRX(
    base,
    rx
  );


  if(
    selecao.estado !== "OK"
  ){

    return {
      valido:false,
      rx,
      offset,
      replicas:[],
      similaridade:0
    };

  }


  const jogadaBase =
  montarJogadaBase(
    selecao.replicas,
    base
  );


  if(!jogadaBase.valido){

    return {
      valido:false,
      rx,
      offset,
      replicas:
      selecao.replicas,
      similaridade:
      selecao.similaridade
    };

  }


  const jogada =
  aplicarOffsetJogada(
    jogadaBase,
    offset
  );


  return {

    valido:
    jogada.valido
    &&
    jogada.numerosUsados.size ===
    TOTAL_COBERTURA,

    rx,

    offset,

    replicas:
    selecao.replicas,

    similaridade:
    selecao.similaridade,

    jogada

  };

}


/* =========================================================
   TAXA AUXILIAR
========================================================= */

function taxaResultados(lista){

  if(!lista.length){
    return 0;
  }


  return (
    lista.filter(Boolean).length
    /
    lista.length
    *
    100
  );

}


/* =========================================================
   BACKTEST DO OFFSET

   WALK-FORWARD:

   Para prever resultado N,
   só utiliza dados anteriores a N.

   O resultado N nunca entra
   na própria previsão.
========================================================= */

function backtestOffset(
  base,
  rx
){

  const minimo =
  Math.max(
    30,
    rx*5
  );


  if(
    base.length <= minimo
  ){

    return {
      offset:0,
      testes:0,
      ranking:[]
    };

  }


  const inicio =
  Math.max(
    minimo,
    base.length -
    MAX_TESTES_OFFSET
  );


  const stats = {};


  OFFSETS_TESTADOS
  .forEach(offset => {

    stats[offset] = {
      offset,
      resultados:[],
      acertos:0,
      testes:0
    };

  });


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


    /*
      Uma única jogada-base.

      Depois testamos rotações dela.
    */

    const configBase =
    gerarConfiguracaoRX(
      passado,
      rx,
      0
    );


    if(!configBase.valido){
      continue;
    }


    const real =
    base[indice];


    OFFSETS_TESTADOS
    .forEach(offset => {

      const jogada =
      aplicarOffsetJogada(
        configBase.jogada,
        offset
      );


      const green =
      jogada.valido
      &&
      jogada.numerosUsados
      .has(real);


      const s =
      stats[offset];


      s.testes++;


      if(green){
        s.acertos++;
      }


      s.resultados.push(
        green
      );


      if(
        s.resultados.length >
        MAX_TESTES_OFFSET
      ){

        s.resultados.shift();

      }

    });

  }


  const ranking =
  Object.values(stats)
  .map(s => {

    const ult10 =
    s.resultados.slice(-10);

    const ult20 =
    s.resultados.slice(-20);

    const ult40 =
    s.resultados.slice(-40);


    const taxa10 =
    taxaResultados(
      ult10
    );


    const taxa20 =
    taxaResultados(
      ult20
    );


    const taxa40 =
    taxaResultados(
      ult40
    );


    const geral =
    s.testes
    ?
    s.acertos /
    s.testes *
    100
    :
    0;


    /*
      Recente manda mais.

      Sem near-miss na escolha.
      Só GREEN real.
    */

    let score =

    taxa10 *
    0.40

    +

    taxa20 *
    0.35

    +

    taxa40 *
    0.15

    +

    geral *
    0.10;


    /*
      Pequena preferência por offset
      menor quando desempenho empata.
    */

    score -=
    Math.abs(s.offset) *
    0.15;


    return {

      ...s,

      taxa10,
      taxa20,
      taxa40,
      geral,
      score

    };

  })
  .sort(
    (a,b) => {

      if(
        Math.abs(
          b.score-a.score
        )
        >
        0.001
      ){

        return (
          b.score-a.score
        );

      }


      return (
        Math.abs(a.offset) -
        Math.abs(b.offset)
      );

    });


  let melhor =
  ranking[0];


  if(
    !melhor ||
    melhor.testes <
    MIN_TESTES_OFFSET
  ){

    melhor =
    ranking.find(
      x => x.offset === 0
    )
    ||
    {
      offset:0,
      testes:0
    };

  }


  return {

    offset:
    melhor.offset,

    testes:
    melhor.testes,

    melhor,

    ranking

  };

}


/* =========================================================
   QUALIDADE RECENTE DE CADA RX
========================================================= */

function qualidadeRX(rx){

  const lista =
  estado.timelineRX[rx];


  const stats =
  estatisticaTimeline(
    lista
  );


  if(!stats.total){

    return {
      rx,
      ...stats,
      score:0
    };

  }


  /*
    Não deixamos uma amostra de
    2 ou 3 resultados dominar.
  */

  const conf5 =
  Math.min(
    1,
    stats.total/5
  );


  const conf10 =
  Math.min(
    1,
    stats.total/10
  );


  const conf20 =
  Math.min(
    1,
    stats.total/20
  );


  let score =

  stats.taxa5 *
  0.30 *
  conf5

  +

  stats.taxa10 *
  0.35 *
  conf10

  +

  stats.taxa20 *
  0.25 *
  conf20

  +

  stats.taxaGeral *
  0.10;


  if(stats.lossSeguidos === 1){

    score -= 3;

  }

  else if(stats.lossSeguidos === 2){

    score -= 12;

  }

  else if(stats.lossSeguidos >= 3){

    score -=
    25
    +
    (
      stats.lossSeguidos-3
    )
    *
    8;

  }


  return {
    rx,
    ...stats,
    score
  };

}


/* =========================================================
   AUTO

   O AUTO NÃO CRIA OUTRO MOTOR.

   Ele escolhe RX4/RX5/RX6 e offset
   usando o desempenho real recente.
========================================================= */

function escolherAuto(
  configs,
  offsets
){

  const fase =
  determinarFase();


  const candidatos =
  RX_DISPONIVEIS
  .map(rx => {

    const config =
    configs[rx];


    if(
      !config ||
      !config.valido
    ){
      return null;
    }


    const qualidade =
    qualidadeRX(rx);


    const offsetInfo =
    offsets[rx];


    /*
      Similaridade original entra
      como estabilidade/desempate.
    */

    let score =

    qualidade.score

    +

    config.similaridade *
    0.08;


    /*
      Offset só auxilia.

      Não substitui o RX.
    */

    if(
      offsetInfo &&
      offsetInfo.melhor &&
      offsetInfo.melhor.testes >=
      MIN_TESTES_OFFSET
    ){

      score +=
      offsetInfo.melhor.score *
      0.08;

    }


    /*
      Em recuperação o motor reage
      mais aos LOSS reais recentes.
    */

    if(
      fase === "RECUPERAÇÃO" ||
      fase === "REESTRUTURAÇÃO"
    ){

      score -=
      qualidade.lossSeguidos *
      8;

    }


    return {

      rx,

      config,

      qualidade,

      offsetInfo,

      score

    };

  })
  .filter(Boolean);


  if(!candidatos.length){

    return {
      escolhido:null,
      ranking:[]
    };

  }


  candidatos.sort(
    (a,b) => {

      /*
        Evita ficar preso no mesmo RX
        quando ele começou a deteriorar.
      */

      if(
        a.qualidade.lossSeguidos !==
        b.qualidade.lossSeguidos
      ){

        return (
          a.qualidade.lossSeguidos -
          b.qualidade.lossSeguidos
        );

      }


      if(
        Math.abs(
          b.score-a.score
        )
        >
        0.001
      ){

        return (
          b.score-a.score
        );

      }


      return (
        b.config.similaridade -
        a.config.similaridade
      );

    });


  return {

    escolhido:
    candidatos[0],

    ranking:
    candidatos

  };

}


/* =========================================================
   ASSINATURA DO HISTÓRICO

   Impede que clique manual reescreva
   previsão congelada.
========================================================= */

function assinaturaHistorico(){

  return (

    historico.length

    +

    "|"

    +

    historico
    .slice(-32)
    .join(",")

  );

}


/* =========================================================
   SNAPSHOT
========================================================= */

function criarSnapshot(
  config,
  assinatura
){

  if(
    !config ||
    !config.valido
  ){
    return null;
  }


  return {

    assinatura,

    criadoCom:
    historico.length,

    rx:
    config.rx,

    offset:
    config.offset || 0,

    numeros:
    Array.from(
      config.jogada.numerosUsados
    ),

    blocos2:
    config.jogada.blocos2
    .map(b => ({

      centro:b.centro,

      numeros:
      b.numeros.slice()

    })),

    blocos1:
    config.jogada.blocos1
    .map(b => ({

      centro:b.centro,

      numeros:
      b.numeros.slice()

    })),

    similaridade:
    config.similaridade

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
      Só vale se realmente foi criada
      para o histórico anterior ao
      novo resultado.
    */

    if(
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


    estado.timelineRX[rx]
    .push({

      resultado:
      novoNumero,

      green,

      rx,

      offset:
      pendente.offset,

      numeros:
      pendente.numeros.slice(),

      assinatura:
      pendente.assinatura,

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
      p.assinatura ===
      assinaturaAntes
    ){

      const green =
      p.numeros
      .includes(
        novoNumero
      );


      estado.timelineAuto
      .push({

        resultado:
        novoNumero,

        green,

        rx:
        p.rx,

        offset:
        p.offset,

        numeros:
        p.numeros.slice(),

        assinatura:
        p.assinatura,

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


  estado.fase =
  determinarFase();


  salvarEstado();

}


/* =========================================================
   PROCESSAR ESTADO ATUAL
========================================================= */

function processarEstadoAtual(){

  const assinatura =
  assinaturaHistorico();


  const configsBase = {};

  const offsets = {};

  const configsFinais = {};


  /*
    Primeiro:
    gera RX puro 4 / 5 / 6.
  */

  RX_DISPONIVEIS
  .forEach(rx => {

    configsBase[rx] =
    gerarConfiguracaoRX(
      historico,
      rx,
      0
    );

  });


  /*
    Depois:
    calibra offset separadamente.

    Isso não muda as réplicas.
  */

  RX_DISPONIVEIS
  .forEach(rx => {

    offsets[rx] =
    backtestOffset(
      historico,
      rx
    );


    const base =
    configsBase[rx];


    if(
      !base ||
      !base.valido
    ){

      configsFinais[rx] =
      base;

      return;

    }


    const offset =
    offsets[rx].offset || 0;


    const jogada =
    aplicarOffsetJogada(
      base.jogada,
      offset
    );


    configsFinais[rx] = {

      ...base,

      offset,

      jogada

    };

  });


  /*
    AUTO escolhe entre os motores
    originais já existentes.
  */

  const auto =
  escolherAuto(
    configsFinais,
    offsets
  );


  /*
    CONGELAMENTO RX4/RX5/RX6

    Se já existe previsão para a mesma
    assinatura, NÃO substitui.
  */

  RX_DISPONIVEIS
  .forEach(rx => {

    const existente =
    estado.pendentesRX[rx];


    if(
      existente &&
      existente.assinatura ===
      assinatura
    ){

      return;

    }


    estado.pendentesRX[rx] =
    criarSnapshot(
      configsFinais[rx],
      assinatura
    );

  });


  /*
    AUTO congelado.
  */

  if(
    !(
      estado.pendenteAuto &&
      estado.pendenteAuto.assinatura ===
      assinatura
    )
  ){

    if(auto.escolhido){

      estado.pendenteAuto =
      criarSnapshot(
        auto.escolhido.config,
        assinatura
      );

    }

    else{

      estado.pendenteAuto =
      null;

    }

  }


  if(auto.escolhido){

    estado.offsetAtual =
    auto.escolhido.config.offset;


    estado.ultimaConfiguracao = {

      rx:
      auto.escolhido.rx,

      offset:
      auto.escolhido.config.offset,

      similaridade:
      auto.escolhido.config
      .similaridade

    };

  }


  estado.fase =
  determinarFase();


  salvarEstado();


  return {

    configs:
    configsFinais,

    configsBase,

    offsets,

    auto

  };

}


/* =========================================================
   ADICIONAR NÚMERO
========================================================= */

function adicionarNumero(numero){

  avaliarPendentes(
    numero
  );


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


  /*
    Histórico substituído:
    previsões e timelines anteriores
    deixam de pertencer à sequência.
  */

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

  estado.offsetAtual=0;

  estado.fase="APRENDENDO";


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


  /*
    Previsões abertas deixam de valer.

    Timeline fechada permanece.
  */

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

  estado.offsetAtual=0;

  estado.ultimaConfiguracao=null;

  estado.fase="APRENDENDO";


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
grid-template-columns:repeat(6,1fr);
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
font-size:14px;
margin-top:3px;
}

.meta90{
color:#00e676;
}

.abaixo90{
color:#ffc107;
}

.critico{
color:#ff5252;
}


/* MOMENTO */

.momento{
display:grid;
grid-template-columns:repeat(5,1fr);
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
MOTOR ADAPTATIVO — RX ORIGINAL PRESERVADO
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
LINHA DO TEMPO REAL — PREVISÃO CONGELADA
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

      'Resultado ' +
      item.resultado +

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

  const momento =
  analisarMomento(
    historico,
    JANELA_ESTADO
  );


  const totalAB =
  momento.alto +
  momento.baixo;


  const totalCor =
  momento.vermelho +
  momento.preto;


  const pAlto =
  totalAB
  ?
  momento.alto /
  totalAB *
  100
  :
  0;


  const pBaixo =
  totalAB
  ?
  momento.baixo /
  totalAB *
  100
  :
  0;


  const pVermelho =
  totalCor
  ?
  momento.vermelho /
  totalCor *
  100
  :
  0;


  const pPreto =
  totalCor
  ?
  momento.preto /
  totalCor *
  100
  :
  0;


  const terminalMaisAtivo =
  momento.terminais
  .map(
    (valor,t) => ({
      t,
      valor
    })
  )
  .sort(
    (a,b) =>
      b.valor-a.valor
  )[0];


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
  '</div>' +

  '<div class="momentoBox">' +
  '<small>TERMINAL ATIVO</small>' +
  '<strong>T' +
  (
    terminalMaisAtivo
    ?
    terminalMaisAtivo.t
    :
    "—"
  ) +
  '</strong>' +
  '</div>';

}


/* =========================================================
   RENDER MOTOR
========================================================= */

function classeTaxa(taxa){

  if(taxa >= 90){
    return "meta90";
  }


  if(taxa >= 85){
    return "abaixo90";
  }


  return "critico";

}


function renderMotor(resultado){

  const area =
  document.getElementById(
    "motorGrid"
  );


  const escolhido =
  resultado.auto.escolhido;


  const autoStats =
  estatisticaTimeline(
    estado.timelineAuto
  );


  if(!escolhido){

    area.innerHTML =

    '<div class="motorCard">' +
    '<small>STATUS</small>' +
    '<strong>AGUARDANDO</strong>' +
    '</div>';

    return;

  }


  const qualidade =
  escolhido.qualidade;


  area.innerHTML =

  '<div class="motorCard">' +
  '<small>RX ATIVO</small>' +
  '<strong>' +
  escolhido.rx +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>OFFSET</small>' +
  '<strong>' +
  (
    escolhido.config.offset > 0
    ?
    "+"
    :
    ""
  ) +
  escolhido.config.offset +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>REAL 10</small>' +
  '<strong class="' +
  classeTaxa(
    autoStats.taxa10
  ) +
  '">' +
  (
    autoStats.total
    ?
    autoStats.taxa10.toFixed(0) +
    "%"
    :
    "—"
  ) +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>RX 20</small>' +
  '<strong class="' +
  classeTaxa(
    qualidade.taxa20
  ) +
  '">' +
  (
    qualidade.total
    ?
    qualidade.taxa20.toFixed(0) +
    "%"
    :
    "—"
  ) +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>LOSS</small>' +
  '<strong>' +
  autoStats.lossSeguidos +
  '</strong>' +
  '</div>' +

  '<div class="motorCard">' +
  '<small>FASE</small>' +
  '<strong style="font-size:10px">' +
  estado.fase +
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
      resultado.auto.escolhido
    ){

      const rx =
      resultado.auto
      .escolhido.rx;


      const botao =
      document.getElementById(
        "rx"+rx
      );


      botao.classList.add(
        "vencedor"
      );


      botao.textContent =
      rx + " ★";

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


  RX_DISPONIVEIS
  .forEach(rx => {

    const botao =
    document.getElementById(
      "rx"+rx
    );


    if(
      !botao.classList
      .contains("vencedor")
    ){

      botao.textContent =
      String(rx);

    }

  });

}


/* =========================================================
   RENDER ÚLTIMOS 14
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

  " • OFFSET " +

  (
    config.offset > 0
    ?
    "+"
    :
    ""
  ) +

  config.offset +

  " • SIM " +

  config.similaridade
  .toFixed(0) +

  "%";


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
      resultado
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
      resultado.auto.escolhido
      ?
      resultado.auto.escolhido
      .config
      :
      null;

    }

    else{

      ativa =
      resultado.configs[
        estado.manualRX
      ];

    }


    renderJogada(
      ativa
    );


    statusArea.textContent =

    historico.length
    ?
    historico.length +
    " números • " +
    estado.fase
    :
    "Pronto.";


    if(
      estado.fase ===
      "NORMAL"
    ){

      statusArea.style.color =
      "#00e676";

    }

    else if(
      estado.fase ===
      "REESTRUTURAÇÃO"
    ){

      statusArea.style.color =
      "#ff5252";

    }

    else{

      statusArea.style.color =
      "#ffc107";

    }


    console.log(
      "MOTOR 0/6/9 — RX ORIGINAL + ADAPTAÇÃO",
      {

        fase:
        estado.fase,

        modo:
        estado.modo,

        escolhido:
        resultado.auto.escolhido
        ?
        {
          rx:
          resultado.auto.escolhido.rx,

          offset:
          resultado.auto.escolhido
          .config.offset,

          similaridade:
          resultado.auto.escolhido
          .config.similaridade,

          qualidade:
          resultado.auto.escolhido
          .qualidade,

          score:
          resultado.auto.escolhido
          .score
        }
        :
        null,

        rankingAuto:
        resultado.auto.ranking
        .map(x => ({

          RX:x.rx,

          OFFSET:
          x.config.offset,

          T5:
          x.qualidade.taxa5
          .toFixed(1),

          T10:
          x.qualidade.taxa10
          .toFixed(1),

          T20:
          x.qualidade.taxa20
          .toFixed(1),

          LOSS:
          x.qualidade.lossSeguidos,

          SIM:
          x.config.similaridade
          .toFixed(1),

          SCORE:
          x.score.toFixed(1)

        })),

        offsets:{
          RX4:
          resultado.offsets[4],

          RX5:
          resultado.offsets[5],

          RX6:
          resultado.offsets[6]
        }

      }
    );


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
