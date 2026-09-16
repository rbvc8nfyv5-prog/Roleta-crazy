(function () {
"use strict";

/* =========================================================
   ANALISADOR 0 • 6 • 9 — V6 ORGANISMO VIVO
   Base: V5 enviada pelo usuário.

   ATUALIZAÇÕES:
   - 90% = meta operacional
   - <90% = RECALIBRAÇÃO
   - <=85% ou 2 LOSS = RECUPERAÇÃO FORTE
   - 3 LOSS = REESTRUTURAÇÃO
   - aprende com a posição/distância dos LOSS
   - T0–T9 + vizinhos de terminal
   - RX 4/5/6 simultâneos
   - janelas ampliadas na recuperação
   - previsão congelada por assinatura do histórico
   - AUTO/MANUAL não reescreve snapshot pendente
   - clique entra visualmente antes do cálculo pesado
   - 5×2V + 1×1V = 28 casas sem sobreposição
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const STORAGE_KEY =
"ANALISADOR_069_IDS_CORRESPONDENTES_V1";

const STORAGE_ENGINE =
"ANALISADOR_069_ENGINE_ADAPTATIVO_V6_ORGANISMO";

const MAX_HISTORICO = 5000;

const JANELA_VISUAL = 14;
const JANELA_ESTADO = 20;

const MAX_TIMELINE = 300;

const BACKTEST_MAX = 40;
const BACKTEST_MIN = 10;

const PESO_RECENTE_MIN = 0.25;
const PESO_RECENTE_MAX = 1.00;

const PERCENTUAL_REPLICAS_RX = 0.10;
const MIN_REPLICAS_RX = 12;
const MAX_REPLICAS_RX = 40;

const QTD_2V = 5;
const QTD_1V = 1;
const TOTAL_COBERTURA = 28;

const RX_DISPONIVEIS = [4,5,6];

const META_ASSERTIVIDADE = 90;
const LIMITE_FORTE = 85;


/*
  Em condição normal usamos menos alternativas.

  Quando o comportamento deteriora,
  o motor abre novas janelas.
*/

const JANELAS_NORMAL = [
  8,
  10,
  14,
  20
];

const JANELAS_RECALIBRACAO = [
  6,
  8,
  10,
  12,
  14,
  20
];

const JANELAS_RECUPERACAO = [
  5,
  6,
  8,
  10,
  12,
  14,
  20
];


/*
  Deslocamento físico da estrutura.

  NORMAL:
  não desloca.

  RECALIBRAÇÃO:
  testa -1 / 0 / +1.

  RECUPERAÇÃO:
  testa -2 / -1 / 0 / +1 / +2.
*/

const OFFSETS_NORMAL = [
  0
];

const OFFSETS_RECALIBRACAO = [
  -1,
  0,
  1
];

const OFFSETS_RECUPERACAO = [
  -2,
  -1,
  0,
  1,
  2
];


/* =========================================================
   PERFIS INTERNOS
========================================================= */

const PERFIS_BASE = [

  {
    id:"RX",

    rx:1.00,

    roda:0.15,

    altoBaixo:0.00,

    cor:0.00,

    regiao:0.00,

    familia:0.10,

    terminal:0.05,

    borda:0.30,

    erro:0.10
  },


  {
    id:"MOMENTO",

    rx:0.80,

    roda:0.35,

    altoBaixo:0.15,

    cor:0.10,

    regiao:0.15,

    familia:0.20,

    terminal:0.20,

    borda:0.40,

    erro:0.25
  },


  {
    id:"RODA",

    rx:0.70,

    roda:0.55,

    altoBaixo:0.05,

    cor:0.05,

    regiao:0.10,

    familia:0.15,

    terminal:0.20,

    borda:0.55,

    erro:0.35
  },


  {
    id:"CONFLUENCIA",

    rx:0.75,

    roda:0.35,

    altoBaixo:0.20,

    cor:0.15,

    regiao:0.20,

    familia:0.25,

    terminal:0.30,

    borda:0.45,

    erro:0.35
  },


  {
    id:"TERMINAL",

    rx:0.70,

    roda:0.30,

    altoBaixo:0.10,

    cor:0.05,

    regiao:0.10,

    familia:0.15,

    terminal:0.55,

    borda:0.45,

    erro:0.45
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
   REGIÕES
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


  /*
    Previsão AUTO esperando
    o próximo resultado.
  */

  pendenteAuto:null,


  /*
    Cada RX mantém sua própria
    previsão congelada.
  */

  pendentesRX:{

    4:null,

    5:null,

    6:null

  },


  /*
    Histórico fiel RX4/RX5/RX6.
  */

  timelineRX:{

    4:[],

    5:[],

    6:[]

  },


  /*
    Histórico do AUTO.
  */

  timelineAuto:[],


  ultimaConfiguracao:null,


  motor:{

    fase:"APRENDENDO",

    deterioracao:0,

    ultimaTaxa20:0

  }

};


carregarEstado();


/* =========================================================
   CACHE
========================================================= */

let cacheConfig =
new Map();


let cacheEstado =
new Map();


let cacheRX =
new Map();


function limparCaches(){

  cacheConfig.clear();

  cacheEstado.clear();

  cacheRX.clear();

}


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


    if(
      !Array.isArray(
        dados
      )
    ){

      return [];

    }


    return dados

    .map(Number)

    .filter(numero =>

      Number.isInteger(
        numero
      )

      &&

      numero >= 0

      &&

      numero <= 36

    )

    .slice(
      -MAX_HISTORICO
    );


  }catch(e){

    return [];

  }

}


function salvarHistorico(){

  try{

    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(
        historico
      )

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

      salvo.modo === "AUTO"

      ||

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


    if(
      salvo.pendenteAuto
    ){

      estado.pendenteAuto =
      salvo.pendenteAuto;

    }


    if(
      salvo.pendentesRX
    ){

      RX_DISPONIVEIS
      .forEach(rx => {

        if(
          salvo.pendentesRX[rx]
        ){

          estado.pendentesRX[rx] =
          salvo.pendentesRX[rx];

        }

      });

    }


    if(
      salvo.timelineRX
    ){

      RX_DISPONIVEIS
      .forEach(rx => {

        if(
          Array.isArray(
            salvo.timelineRX[rx]
          )
        ){

          estado.timelineRX[rx] =

          salvo.timelineRX[rx]

          .slice(
            -MAX_TIMELINE
          );

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

      .slice(
        -MAX_TIMELINE
      );

    }


    if(
      salvo.ultimaConfiguracao
    ){

      estado.ultimaConfiguracao =
      salvo.ultimaConfiguracao;

    }


    if(
      salvo.motor
    ){

      estado.motor = {

        ...estado.motor,

        ...salvo.motor

      };

    }


  }catch(e){}

}


function salvarEstado(){

  try{

    localStorage.setItem(

      STORAGE_ENGINE,

      JSON.stringify(
        estado
      )

    );

  }catch(e){}

}


/* =========================================================
   ASSINATURA DO HISTÓRICO

   Impede que render/manual altere
   previsão que já estava congelada.
========================================================= */

function assinaturaHistorico(
  base=historico
){

  return (

    base.length

    +

    "|"

    +

    base
    .slice(-32)
    .join(",")

  );

}


/* =========================================================
   HELPERS DA RODA
========================================================= */

function indiceRoda(numero){

  return track.indexOf(
    numero
  );

}


function setorVizinhosOrdenado(
  centro,
  quantidade
){

  const indice =
  indiceRoda(
    centro
  );


  if(
    indice < 0
  ){

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
          indice
          +
          d
          +
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
  indiceRoda(
    numero
  );


  if(
    indice < 0
  ){

    return [];

  }


  const resultado=[
    numero
  ];


  for(
    let d=1;
    d<=quantidade;
    d++
  ){

    resultado.push(

      track[

        (
          indice
          -
          d
          +
          track.length
        )

        %

        track.length

      ]

    );


    resultado.push(

      track[

        (
          indice
          +
          d
        )

        %

        track.length

      ]

    );

  }


  return resultado;

}


function distanciaRoda(
  a,
  b
){

  const ia =
  indiceRoda(a);


  const ib =
  indiceRoda(b);


  if(
    ia < 0
    ||
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


function deslocarCentro(
  centro,
  offset
){

  const indice =
  indiceRoda(
    centro
  );


  if(
    indice < 0
  ){

    return centro;

  }


  return track[

    (
      indice
      +
      offset
      +
      track.length
    )

    %

    track.length

  ];

}


/* =========================================================
   CORES / REGIÕES / FAMÍLIAS
========================================================= */

function corNumeroRoleta(numero){

  if(
    numero === 0
  ){

    return "#087c48";

  }


  return numerosVermelhos
  .has(numero)

  ?

  "#c6283d"

  :

  "#181818";

}


function regiaoDoNumero(numero){

  if(
    regioesRoleta.ZERO
    .has(numero)
  ){

    return "ZERO";

  }


  if(
    regioesRoleta.VOISINS
    .has(numero)
  ){

    return "VOISINS";

  }


  if(
    regioesRoleta.ORPHELINS
    .has(numero)
  ){

    return "ORPHELINS";

  }


  if(
    regioesRoleta.TIERS
    .has(numero)
  ){

    return "TIERS";

  }


  return null;

}


function familiaDoId(id){

  if(
    id === 0
    ||
    id === 10
    ||
    id === 20
    ||
    id === 30
  ){

    return 0;

  }


  if(
    id === 6
    ||
    id === 16
    ||
    id === 26
    ||
    id === 36
  ){

    return 6;

  }


  if(
    id === 9
    ||
    id === 19
    ||
    id === 29
    ||
    id === 39
  ){

    return 9;

  }


  return null;

}


function corDoId(id){

  const familia =
  familiaDoId(id);


  if(
    familia === 0
  ){

    return COR_T0;

  }


  if(
    familia === 6
  ){

    return COR_T6;

  }


  if(
    familia === 9
  ){

    return COR_T9;

  }


  return "#555";

}


/* =========================================================
   COBERTURA DOS IDS
========================================================= */

const coberturaDasBases = {};


BASES_069
.forEach(base => {

  coberturaDasBases[base] =

  new Set(
    vizinhos(
      base,
      1
    )
  );

});


function idsQueBatem(numero){

  const ids=[];


  BASES_069
  .forEach(base => {

    if(

      coberturaDasBases[base]
      .has(numero)

    ){

      ids.push(
        base
      );

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

    .map(
      familiaDoId
    )

    .filter(
      familia =>
      familia !== null
    )

  );

}


/* =========================================================
   TERMINAIS
========================================================= */

function terminalDoNumero(numero){

  return numero % 10;

}


function terminaisVizinhos(
  terminal
){

  return [

    (
      terminal +
      9
    )
    %
    10,

    terminal,

    (
      terminal +
      1
    )
    %
    10

  ];

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


  janela
  .forEach(
  (numero,index) => {

    const familias =
    familiasQueBatem(
      numero
    );


    const b0 =
    familias.has(0)
    ?
    1
    :
    0;


    const b6 =
    familias.has(6)
    ?
    1
    :
    0;


    const b9 =
    familias.has(9)
    ?
    1
    :
    0;


    t0 += b0;

    t6 += b6;

    t9 += b9;


    eventos.push({

      t0:b0,

      t6:b6,

      t9:b9

    });


    pontos.push({

      posicao:
      index+1,

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


  if(
    evento.t0
  ){

    chave+="0";

  }


  if(
    evento.t6
  ){

    chave+="6";

  }


  if(
    evento.t9
  ){

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

    tamanho === 0

    ||

    janelaAntiga.length !==
    tamanho

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

  iguais
  /
  tamanho
  *
  100;


  let erro=0;


  for(
    let i=0;
    i<tamanho;
    i++
  ){

    erro +=

    Math.abs(

      atual.pontos[i].t0

      -

      antiga.pontos[i].t0

    );


    erro +=

    Math.abs(

      atual.pontos[i].t6

      -

      antiga.pontos[i].t6

    );


    erro +=

    Math.abs(

      atual.pontos[i].t9

      -

      antiga.pontos[i].t9

    );

  }


  const maxErro =

  tamanho
  *
  tamanho
  *
  3;


  let scoreForma =

  1

  -

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

    scoreEventos
    *
    0.80

    +

    scoreForma
    *
    0.20

  );

}


/* =========================================================
   DESCREVER ESTADO
========================================================= */

function descreverEstado(
  base,
  tamanho
){

  const chave =

  base.length

  +

  "|"

  +

  tamanho

  +

  "|"

  +

  base
  .slice(
    -Math.max(
      32,
      tamanho
    )
  )
  .join(",");


  if(
    cacheEstado.has(
      chave
    )
  ){

    return cacheEstado
    .get(chave);

  }


  const janela =
  base.slice(
    -tamanho
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

    Array(10)
    .fill(0),


    terminalViz:

    Array(10)
    .fill(0),


    frequenciaRoda:

    new Map()

  };


  track
  .forEach(numero => {

    desc.frequenciaRoda
    .set(
      numero,
      0
    );

  });


  janela
  .forEach(numero => {


    if(
      numero === 0
    ){

      desc.zero++;

    }

    else if(
      numero <= 18
    ){

      desc.baixo++;

    }

    else{

      desc.alto++;

    }


    if(
      numerosVermelhos
      .has(numero)
    ){

      desc.vermelho++;

    }

    else if(
      numero !== 0
    ){

      desc.preto++;

    }


    const regiao =
    regiaoDoNumero(
      numero
    );


    if(regiao){

      desc.regioes[regiao]++;

    }


    familiasQueBatem(numero)
    .forEach(familia => {

      desc.familias[
        familia
      ]++;

    });


    const terminal =
    terminalDoNumero(
      numero
    );


    desc.terminais[
      terminal
    ]++;


    terminaisVizinhos(
      terminal
    )
    .forEach(tv => {

      desc.terminalViz[
        tv
      ]++;

    });


    track
    .forEach(alvo => {

      const distancia =
      distanciaRoda(
        numero,
        alvo
      );


      let incremento=0;


      if(
        distancia === 0
      ){

        incremento=1;

      }

      else if(
        distancia === 1
      ){

        incremento=0.55;

      }

      else if(
        distancia === 2
      ){

        incremento=0.25;

      }


      if(incremento){

        desc.frequenciaRoda
        .set(

          alvo,

          desc.frequenciaRoda
          .get(alvo)

          +

          incremento

        );

      }

    });

  });


  cacheEstado.set(
    chave,
    desc
  );


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

    !atual.tamanho

    ||

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


  campos
  .forEach(par => {

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

      atual.regioes[regiao]
      /
      atual.tamanho

      -

      antigo.regioes[regiao]
      /
      antigo.tamanho

    );

    componentes++;

  });


  [0,6,9]
  .forEach(familia => {

    erro +=
    Math.abs(

      atual.familias[familia]
      /
      atual.tamanho

      -

      antigo.familias[familia]
      /
      antigo.tamanho

    );

    componentes++;

  });


  /*
    Terminais individuais.
  */

  for(
    let t=0;
    t<10;
    t++
  ){

    erro +=
    Math.abs(

      atual.terminais[t]
      /
      atual.tamanho

      -

      antigo.terminais[t]
      /
      antigo.tamanho

    );

    componentes++;

  }


  /*
    Terminal + terminais vizinhos.
  */

  for(
    let t=0;
    t<10;
    t++
  ){

    erro +=
    Math.abs(

      atual.terminalViz[t]
      /
      Math.max(
        1,
        atual.tamanho*3
      )

      -

      antigo.terminalViz[t]
      /
      Math.max(
        1,
        antigo.tamanho*3
      )

    );

    componentes++;

  }


  let erroRoda=0;


  track
  .forEach(numero => {

    const a =

    atual.frequenciaRoda
    .get(numero)

    /

    Math.max(
      1,
      atual.tamanho
    );


    const b =

    antigo.frequenciaRoda
    .get(numero)

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

  erro

  /

  Math.max(
    1,
    componentes
  );


  const score =

  100

  -

  (

    erroMedio
    *
    0.72

    +

    erroRoda
    *
    0.28

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
   ESTATÍSTICA TIMELINE
========================================================= */

function estatisticaTimeline(lista){

  function taxa(itens){

    if(
      !itens.length
    ){

      return 0;

    }


    return (

      itens.filter(
        item =>
        item.green
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

    if(
      lista[i].green
    ){

      break;

    }


    lossSeguidos++;

  }


  const ult5 =
  lista.slice(-5);


  const ult10 =
  lista.slice(-10);


  const ult20 =
  lista.slice(-20);


  const taxa5 =
  taxa(ult5);


  const taxa10 =
  taxa(ult10);


  const taxa20 =
  taxa(ult20);


  const metadeAnterior =
  ult10.slice(
    0,
    5
  );


  const metadeAtual =
  ult10.slice(
    -5
  );


  const tendencia =

  taxa(
    metadeAtual
  )

  -

  taxa(
    metadeAnterior
  );


  return {

    total:
    lista.length,

    taxa5,

    taxa10,

    taxa20,

    lossSeguidos,

    tendencia

  };

}


/* =========================================================
   FASE DO ORGANISMO
========================================================= */

function determinarFase(){

  const stats =
  estatisticaTimeline(
    estado.timelineAuto
  );


  let fase =
  "APRENDENDO";


  let nivel=0;


  if(
    stats.total >= 5
  ){


    if(

      stats.lossSeguidos >= 3

      ||

      stats.taxa20 < 80

    ){

      fase =
      "REESTRUTURAÇÃO";

      nivel=3;

    }


    else if(

      stats.lossSeguidos >= 2

      ||

      stats.taxa20 <=
      LIMITE_FORTE

    ){

      fase =
      "RECUPERAÇÃO FORTE";

      nivel=2;

    }


    else if(

      stats.taxa20 <
      META_ASSERTIVIDADE

      ||

      stats.tendencia <= -20

    ){

      fase =
      "RECALIBRAÇÃO";

      nivel=1;

    }


    else{

      fase =
      "NORMAL";

      nivel=0;

    }

  }


  estado.motor.fase =
  fase;


  estado.motor.ultimaTaxa20 =
  stats.taxa20;


  return {

    fase,

    nivel,

    stats

  };

}


function janelasDaFase(
  fase
){

  if(
    fase.nivel >= 2
  ){

    return JANELAS_RECUPERACAO;

  }


  if(
    fase.nivel === 1
  ){

    return JANELAS_RECALIBRACAO;

  }


  return JANELAS_NORMAL;

}


function offsetsDaFase(
  fase
){

  if(
    fase.nivel >= 2
  ){

    return OFFSETS_RECUPERACAO;

  }


  if(
    fase.nivel === 1
  ){

    return OFFSETS_RECALIBRACAO;

  }


  return OFFSETS_NORMAL;

}


/* =========================================================
   ANÁLISE DOS LOSS
========================================================= */

function distanciaAteCobertura(
  numero,
  numeros
){

  if(
    numeros.includes(
      numero
    )
  ){

    return 0;

  }


  let menor=99;


  numeros
  .forEach(alvo => {

    menor =
    Math.min(

      menor,

      distanciaRoda(
        numero,
        alvo
      )

    );

  });


  return menor;

}


function analisarErrosRecentes(){

  const losses =

  estado.timelineAuto

  .filter(
    item =>
    !item.green
  )

  .slice(-8);


  const resultado = {

    total:
    losses.length,


    fora1:0,

    fora2:0,

    distantes:0,


    terminais:
    Array(10)
    .fill(0),


    terminalViz:
    Array(10)
    .fill(0),


    regioes:{

      ZERO:0,

      VOISINS:0,

      ORPHELINS:0,

      TIERS:0

    },


    alto:0,

    baixo:0,


    vermelho:0,

    preto:0,


    roda:
    new Map()

  };


  track
  .forEach(numero => {

    resultado.roda
    .set(
      numero,
      0
    );

  });


  losses
  .forEach(item => {

    const numero =
    item.resultado;


    const numeros =

    Array.isArray(
      item.numeros
    )

    ?

    item.numeros

    :

    [];


    const distancia =

    distanciaAteCobertura(
      numero,
      numeros
    );


    if(
      distancia === 1
    ){

      resultado.fora1++;

    }

    else if(
      distancia === 2
    ){

      resultado.fora2++;

    }

    else if(
      distancia > 2
    ){

      resultado.distantes++;

    }


    const terminal =
    terminalDoNumero(
      numero
    );


    resultado.terminais[
      terminal
    ]++;


    terminaisVizinhos(
      terminal
    )
    .forEach(tv => {

      resultado.terminalViz[
        tv
      ]++;

    });


    const regiao =
    regiaoDoNumero(
      numero
    );


    if(regiao){

      resultado.regioes[
        regiao
      ]++;

    }


    if(
      numero >= 19
    ){

      resultado.alto++;

    }

    else if(
      numero >= 1
    ){

      resultado.baixo++;

    }


    if(
      numerosVermelhos
      .has(numero)
    ){

      resultado.vermelho++;

    }

    else if(
      numero !== 0
    ){

      resultado.preto++;

    }


    track
    .forEach(alvo => {

      const d =
      distanciaRoda(
        numero,
        alvo
      );


      let peso=0;


      if(
        d === 0
      ){

        peso=1;

      }

      else if(
        d === 1
      ){

        peso=0.65;

      }

      else if(
        d === 2
      ){

        peso=0.30;

      }


      if(peso){

        resultado.roda
        .set(

          alvo,

          resultado.roda
          .get(alvo)

          +

          peso

        );

      }

    });

  });


  return resultado;

}


/* =========================================================
   SELECIONAR RÉPLICAS
========================================================= */

function selecionarReplicas(
  base,
  rx,
  janelaEstado,
  perfil
){

  const chave = [

    base.length,

    base
    .slice(-32)
    .join(","),

    rx,

    janelaEstado,

    perfil.id

  ]
  .join("|");


  if(
    cacheRX.has(
      chave
    )
  ){

    return cacheRX
    .get(chave);

  }


  const total =
  base.length;


  if(

    total

    <

    Math.max(

      rx*2+2,

      janelaEstado*2+2

    )

  ){

    const vazio = {

      estado:
      "AGUARDANDO",

      replicas:[],

      similaridade:0

    };


    cacheRX.set(
      chave,
      vazio
    );


    return vazio;

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

    inicio+rx <
    inicioAtual;

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


    /*
      RX continua sendo o núcleo.

      Estado atual entra como camada
      adaptativa.
    */

    const pesoRX =

    Math.max(
      0.60,
      perfil.rx
    );


    const pesoEstado =

    0.18

    +

    perfil.roda
    *
    0.10

    +

    perfil.altoBaixo
    *
    0.08

    +

    perfil.cor
    *
    0.05

    +

    perfil.regiao
    *
    0.06

    +

    perfil.familia
    *
    0.08

    +

    perfil.terminal
    *
    0.12;


    const similaridade =

    (

      simRX
      *
      pesoRX

      +

      simEstado
      *
      pesoEstado

    )

    /

    (
      pesoRX
      +
      pesoEstado
    );


    candidatos.push({

      inicio,

      proximo,

      simRX,

      simEstado,

      similaridade,

      distancia:

      inicioAtual

      -

      (
        inicio+rx
      )

    });

  }


  candidatos.sort(
  (a,b) => {

    if(

      Math.abs(

        b.similaridade

        -

        a.similaridade

      )

      >

      0.0001

    ){

      return (

        b.similaridade

        -

        a.similaridade

      );

    }


    return (

      a.distancia

      -

      b.distancia

    );

  });


  if(
    !candidatos.length
  ){

    const vazio = {

      estado:
      "SEM DADOS",

      replicas:[],

      similaridade:0

    };


    cacheRX.set(
      chave,
      vazio
    );


    return vazio;

  }


  let quantidade =

  Math.ceil(

    candidatos.length

    *

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

    (s,item) =>
    s+item.similaridade,

    0

  )

  /

  replicas.length;


  const saida = {

    estado:"OK",

    replicas,

    similaridade,

    estadoAtual

  };


  cacheRX.set(
    chave,
    saida
  );


  return saida;

}


/* =========================================================
   FREQUÊNCIA DOS PRÓXIMOS RESULTADOS
========================================================= */

function gerarFrequenciaReplicas(
  replicas
){

  const mapa =
  new Map();


  track
  .forEach(numero => {

    mapa.set(
      numero,
      0
    );

  });


  replicas
  .forEach(item => {

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
   AVALIAR SETOR
========================================================= */

function avaliarSetor(

  centroOriginal,

  quantidade,

  frequencia,

  estadoAtual,

  perfil,

  offset,

  fase,

  erros

){

  const centro =

  deslocarCentro(
    centroOriginal,
    offset
  );


  const numeros =

  setorVizinhosOrdenado(
    centro,
    quantidade
  );


  if(
    !numeros.length
  ){

    return null;

  }


  let suporte=0;

  let scoreRX=0;


  let altos=0;

  let baixos=0;


  let vermelhos=0;

  let pretos=0;


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


  let scoreTerminal=0;

  let scoreErro=0;


  const maxTerminal =

  Math.max(

    1,

    ...estadoAtual
    .terminalViz

  );


  const maxErroTerminal =

  Math.max(

    1,

    ...erros
    .terminalViz

  );


  const maxErroRoda =

  Math.max(

    1,

    ...[
      ...erros.roda.values()
    ]

  );


  numeros
  .forEach(
  (numero,index) => {


    const freq =

    frequencia.get(
      numero
    )

    ||

    0;


    suporte +=
    freq;


    const distancia =

    Math.abs(
      index-quantidade
    );


    let multiplicador=1;


    if(
      quantidade === 2
    ){

      if(
        distancia === 0
      ){

        multiplicador =
        1.40;

      }

      else if(
        distancia === 1
      ){

        multiplicador =
        1.18;

      }

    }

    else{

      if(
        distancia === 0
      ){

        multiplicador =
        1.28;

      }

    }


    scoreRX +=

    freq

    *

    multiplicador;


    if(
      numero >= 19
    ){

      altos++;

    }

    else if(
      numero >= 1
    ){

      baixos++;

    }


    if(
      numerosVermelhos
      .has(numero)
    ){

      vermelhos++;

    }

    else if(
      numero !== 0
    ){

      pretos++;

    }


    const regiao =
    regiaoDoNumero(
      numero
    );


    if(regiao){

      regioes[
        regiao
      ]++;

    }


    familiasQueBatem(
      numero
    )
    .forEach(familia => {

      familias[
        familia
      ]++;

    });


    const terminal =
    terminalDoNumero(
      numero
    );


    scoreTerminal +=

    estadoAtual
    .terminalViz[
      terminal
    ]

    /

    maxTerminal;


    scoreErro +=

    erros
    .terminalViz[
      terminal
    ]

    /

    maxErroTerminal;


    scoreErro +=

    (
      erros.roda
      .get(numero)

      ||

      0
    )

    /

    maxErroRoda;

  });


  const tamanhoSetor =
  numeros.length;


  const tamanhoEstado =

  Math.max(
    1,
    estadoAtual.tamanho
  );


  /* =======================================================
     ALTO / BAIXO
  ======================================================= */

  const pAltoEstado =

  estadoAtual.alto
  /
  tamanhoEstado;


  const pBaixoEstado =

  estadoAtual.baixo
  /
  tamanhoEstado;


  const pAltoSetor =

  altos
  /
  tamanhoSetor;


  const pBaixoSetor =

  baixos
  /
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


  /* =======================================================
     COR
  ======================================================= */

  const pVermelhoEstado =

  estadoAtual.vermelho
  /
  tamanhoEstado;


  const pPretoEstado =

  estadoAtual.preto
  /
  tamanhoEstado;


  const pVermelhoSetor =

  vermelhos
  /
  tamanhoSetor;


  const pPretoSetor =

  pretos
  /
  tamanhoSetor;


  const scoreCor =

  1

  -

  (

    Math.abs(

      pVermelhoEstado

      -

      pVermelhoSetor

    )

    +

    Math.abs(

      pPretoEstado

      -

      pPretoSetor

    )

  )

  /

  2;


  /* =======================================================
     REGIÃO
  ======================================================= */

  let scoreRegiao=0;


  [
    "ZERO",
    "VOISINS",
    "ORPHELINS",
    "TIERS"
  ]
  .forEach(regiao => {

    const pEstado =

    estadoAtual
    .regioes[
      regiao
    ]

    /

    tamanhoEstado;


    const pSetor =

    regioes[
      regiao
    ]

    /

    tamanhoSetor;


    scoreRegiao +=

    1

    -

    Math.abs(
      pEstado-pSetor
    );

  });


  scoreRegiao /=
  4;


  /* =======================================================
     FAMÍLIAS
  ======================================================= */

  let scoreFamilia=0;


  [0,6,9]
  .forEach(familia => {

    const pEstado =

    estadoAtual
    .familias[
      familia
    ]

    /

    tamanhoEstado;


    const pSetor =

    familias[
      familia
    ]

    /

    tamanhoSetor;


    scoreFamilia +=

    1

    -

    Math.abs(
      pEstado-pSetor
    );

  });


  scoreFamilia /=
  3;


  /* =======================================================
     CONCENTRAÇÃO FÍSICA
  ======================================================= */

  let scoreRoda=0;


  numeros
  .forEach(numero => {

    scoreRoda +=

    estadoAtual
    .frequenciaRoda
    .get(numero)

    ||

    0;

  });


  scoreRoda /=

  Math.max(
    1,
    tamanhoSetor
  );


  scoreTerminal /=

  Math.max(
    1,
    tamanhoSetor
  );


  scoreErro /=

  Math.max(
    1,
    tamanhoSetor
  );


  /* =======================================================
     BORDA
  ======================================================= */

  const indice =
  indiceRoda(
    centro
  );


  const foraEsquerda =

  track[

    (
      indice
      -
      quantidade
      -
      1
      +
      track.length
    )

    %

    track.length

  ];


  const foraDireita =

  track[

    (
      indice
      +
      quantidade
      +
      1
    )

    %

    track.length

  ];


  const forcaBorda =

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


  /*
    Quanto pior a fase,
    maior a necessidade de corrigir
    a estrutura atual.
  */

  const fatorRecuperacao =

  fase.nivel === 0

  ?

  1

  :

  fase.nivel === 1

  ?

  1.20

  :

  fase.nivel === 2

  ?

  1.55

  :

  1.90;


  /*
    Se os LOSS estão caindo
    imediatamente fora da cobertura,
    aumenta a sensibilidade de borda.
  */

  const fatorErroBorda =

  1

  +

  erros.fora1
  *
  0.08

  +

  erros.fora2
  *
  0.03;


  const penalBorda =

  forcaBorda

  *

  perfil.borda

  *

  fatorRecuperacao

  *

  fatorErroBorda;


  /* =======================================================
     SCORE FINAL
  ======================================================= */

  const score =

  scoreRX
  *
  perfil.rx

  +

  suporte
  *
  scoreRoda
  *
  perfil.roda
  *
  0.20
  *
  fatorRecuperacao

  +

  suporte
  *
  scoreAltoBaixo
  *
  perfil.altoBaixo
  *
  fatorRecuperacao

  +

  suporte
  *
  scoreCor
  *
  perfil.cor
  *
  fatorRecuperacao

  +

  suporte
  *
  scoreRegiao
  *
  perfil.regiao
  *
  fatorRecuperacao

  +

  suporte
  *
  scoreFamilia
  *
  perfil.familia
  *
  fatorRecuperacao

  +

  suporte
  *
  scoreTerminal
  *
  perfil.terminal
  *
  fatorRecuperacao

  +

  suporte
  *
  scoreErro
  *
  perfil.erro
  *
  (
    fase.nivel >= 1
    ?
    1
    :
    0.25
  )

  -

  penalBorda;


  return {

    centro,

    centroOriginal,

    offset,

    quantidade,

    numeros,

    suporte,

    score,

    scoreAltoBaixo,

    scoreCor,

    scoreRegiao,

    scoreFamilia,

    scoreRoda,

    scoreTerminal,

    scoreErro,

    penalBorda

  };

}


/* =========================================================
   MONTAR JOGADA
========================================================= */

function montarJogada(

  replicas,

  estadoAtual,

  perfil,

  offset,

  fase,

  erros

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

      perfil,

      offset,

      fase,

      erros

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

      estadoAtual,

      perfil,

      offset,

      fase,

      erros

    )

  )

  .filter(Boolean)

  .sort(
    (a,b) =>
    b.score-a.score
  );


  let melhor=null;


  for(
    const bloco1
    of candidatos1
  ){

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

        usados.has(
          numero
        )

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

        usados.add(
          numero
        );

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

      continue;

    }


    if(
      usados.size !==
      TOTAL_COBERTURA
    ){

      continue;

    }


    if(

      !melhor

      ||

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

  }


  if(
    !melhor
  ){

    return {

      valido:false,

      blocos2:[],

      blocos1:[],

      numerosUsados:
      new Set(),

      scoreTotal:0

    };

  }


  melhor.blocos2
  .sort(
    (a,b) =>
    b.score-a.score
  );


  melhor.valido=true;


  return melhor;

}


/* =========================================================
   GERAR CONFIGURAÇÃO
========================================================= */

function gerarConfiguracao(

  base,

  rx,

  janelaEstado,

  perfil,

  offset=0,

  faseOverride=null,

  errosOverride=null

){

  const fase =

  faseOverride

  ||

  determinarFase();


  const erros =

  errosOverride

  ||

  analisarErrosRecentes();


  const chave = [

    base.length,

    base
    .slice(-32)
    .join(","),

    rx,

    janelaEstado,

    perfil.id,

    offset,

    fase.nivel

  ]
  .join("|");


  if(
    cacheConfig.has(
      chave
    )
  ){

    return cacheConfig
    .get(chave);

  }


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

    const vazio = {

      valido:false,

      rx,

      janelaEstado,

      perfil,

      offset

    };


    cacheConfig.set(
      chave,
      vazio
    );


    return vazio;

  }


  const jogada =

  montarJogada(

    selecao.replicas,

    selecao.estadoAtual,

    perfil,

    offset,

    fase,

    erros

  );


  const saida = {

    valido:

    jogada.valido

    &&

    jogada.numerosUsados.size ===
    TOTAL_COBERTURA,


    rx,

    janelaEstado,

    perfil,

    offset,

    fase:
    fase.fase,


    replicas:
    selecao.replicas,


    similaridade:
    selecao.similaridade,


    estadoAtual:
    selecao.estadoAtual,


    jogada

  };


  cacheConfig.set(
    chave,
    saida
  );


  return saida;

}


/* =========================================================
   GERAR CANDIDATAS
========================================================= */

function gerarCandidatas(
  base,
  fase
){

  const candidatas=[];


  const janelas =
  janelasDaFase(
    fase
  );


  const offsets =
  offsetsDaFase(
    fase
  );


  /*
    NORMAL:
    mantém busca menor.

    DETERIORAÇÃO:
    abre todos os perfis.
  */

  const perfis =

  fase.nivel === 0

  ?

  PERFIS_BASE.slice(
    0,
    4
  )

  :

  PERFIS_BASE;


  const erros =
  analisarErrosRecentes();


  RX_DISPONIVEIS
  .forEach(rx => {


    janelas
    .forEach(janelaEstado => {


      perfis
      .forEach(perfil => {


        offsets
        .forEach(offset => {


          const config =

          gerarConfiguracao(

            base,

            rx,

            janelaEstado,

            perfil,

            offset,

            fase,

            erros

          );


          if(
            config.valido
          ){

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
   WALK-FORWARD
========================================================= */

function backtestConfiguracao(
  base,
  template
){

  const minimo =

  Math.max(

    35,

    template.janelaEstado
    *
    2,

    template.rx
    *
    4

  );


  if(
    base.length <= minimo
  ){

    return {

      testes:0,

      acertos:0,

      taxa:0,

      taxa5:0,

      taxa10:0,

      taxa20:0,

      taxaPonderada:0,

      lossSeguidos:0,

      tendencia:0,

      score:0,

      timeline:[]

    };

  }


  const inicio =

  Math.max(

    minimo,

    base.length
    -
    BACKTEST_MAX

  );


  const timeline=[];


  let pesoTotal=0;

  let pesoAcertos=0;


  /*
    O backtest usa uma fase definida
    antes de conhecer o resultado testado.
  */

  const faseTeste = {

    fase:"BACKTEST",

    nivel:

    template.fase ===
    "REESTRUTURAÇÃO"

    ?

    2

    :

    template.fase ===
    "RECUPERAÇÃO FORTE"

    ?

    2

    :

    template.fase ===
    "RECALIBRAÇÃO"

    ?

    1

    :

    0

  };


  /*
    Erros futuros não podem entrar
    retroativamente no backtest.
  */

  const errosVazios = {

    total:0,

    fora1:0,

    fora2:0,

    distantes:0,


    terminais:
    Array(10)
    .fill(0),


    terminalViz:
    Array(10)
    .fill(0),


    regioes:{

      ZERO:0,

      VOISINS:0,

      ORPHELINS:0,

      TIERS:0

    },


    alto:0,

    baixo:0,

    vermelho:0,

    preto:0,


    roda:

    new Map(

      track.map(
        numero =>
        [
          numero,
          0
        ]
      )

    )

  };


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

      template.offset,

      faseTeste,

      errosVazios

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
      indice
      -
      inicio
      +
      1
    )

    /

    Math.max(

      1,

      base.length
      -
      inicio

    );


    const peso =

    PESO_RECENTE_MIN

    +

    progresso

    *

    (

      PESO_RECENTE_MAX

      -

      PESO_RECENTE_MIN

    );


    pesoTotal +=
    peso;


    if(green){

      pesoAcertos +=
      peso;

    }


    timeline.push({

      resultado:
      real,

      green

    });

  }


  const testes =
  timeline.length;


  const acertos =

  timeline.filter(
    item =>
    item.green
  ).length;


  function taxa(lista){

    if(
      !lista.length
    ){

      return 0;

    }


    return (

      lista.filter(
        item =>
        item.green
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

  acertos
  /
  testes
  *
  100

  :

  0;


  const taxaPonderada =

  pesoTotal

  ?

  pesoAcertos
  /
  pesoTotal
  *
  100

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


  const ult10 =

  timeline.slice(-10);


  const tendencia =

  taxa(
    ult10.slice(-5)
  )

  -

  taxa(
    ult10.slice(0,5)
  );


  /*
    SCORE:

    últimos resultados pesam mais.

    Não deixa um histórico antigo
    esconder deterioração atual.
  */

  let score =

  taxa5
  *
  0.25

  +

  taxa10
  *
  0.30

  +

  taxa20
  *
  0.25

  +

  taxaPonderada
  *
  0.12

  +

  taxaGeral
  *
  0.08;


  /*
    Tendência negativa.
  */

  if(
    tendencia < 0
  ){

    score +=

    tendencia
    *
    0.12;

  }


  /*
    LOSS consecutivos derrubam
    a configuração rapidamente.
  */

  if(
    lossSeguidos === 1
  ){

    score -= 5;

  }


  else if(
    lossSeguidos === 2
  ){

    score -= 18;

  }


  else if(
    lossSeguidos >= 3
  ){

    score -=

    35

    +

    (
      lossSeguidos-3
    )
    *
    10;

  }


  /*
    Evita 100% em amostra curtíssima
    dominar uma configuração ruim
    nos últimos 20.
  */

  if(

    taxa5 >= 90

    &&

    taxa20 < 80

  ){

    score -= 10;

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

    lossSeguidos,

    tendencia,

    score,

    timeline

  };

}


/* =========================================================
   OTIMIZADOR PRINCIPAL
========================================================= */

function otimizarProximaJogada(
  base
){

  const fase =
  determinarFase();


  const candidatas =

  gerarCandidatas(
    base,
    fase
  );


  if(
    !candidatas.length
  ){

    return {

      escolhido:null,

      ranking:[],

      fase

    };

  }


  /*
    Primeiro ranking barato.

    Evita backtestar centenas de
    configurações desnecessariamente.
  */

  candidatas.sort(
  (a,b) => {

    const scoreA =

    a.similaridade
    *
    0.60

    +

    a.jogada.scoreTotal
    *
    0.40;


    const scoreB =

    b.similaridade
    *
    0.60

    +

    b.jogada.scoreTotal
    *
    0.40;


    return (
      scoreB-scoreA
    );

  });


  const limiteBacktest =

  fase.nivel === 0

  ?

  16

  :

  fase.nivel === 1

  ?

  24

  :

  32;


  const shortlist =

  candidatas.slice(
    0,
    limiteBacktest
  );


  const avaliadas=[];


  shortlist
  .forEach(config => {

    const bt =

    backtestConfiguracao(
      base,
      config
    );


    const confiancaAmostra =

    Math.min(

      1,

      bt.testes
      /
      BACKTEST_MIN

    );


    let scoreFinal =

    bt.score
    *
    confiancaAmostra

    +

    config.similaridade
    *
    0.08;


    /*
      Configuração realmente sustentada
      acima da meta ganha bônus.
    */

    if(

      bt.taxa20 >= 90

      &&

      bt.taxa10 >= 90

    ){

      scoreFinal += 8;

    }


    /*
      Abaixo de 90:
      começa pressão de substituição.
    */

    if(
      bt.taxa20 < 90
    ){

      scoreFinal -=

      (
        90
        -
        bt.taxa20
      )

      *

      0.45;

    }


    /*
      85 ou menos:
      estrutura perde confiança.
    */

    if(
      bt.taxa20 <= 85
    ){

      scoreFinal -= 8;

    }


    /*
      2 LOSS:
      não continua insistindo.
    */

    if(
      bt.lossSeguidos >= 2
    ){

      scoreFinal -= 15;

    }


    /*
      Em recuperação a configuração
      anterior perde preferência.

      Isso impede o motor de ficar
      preso no mesmo pensamento.
    */

    if(

      fase.nivel >= 1

      &&

      estado.ultimaConfiguracao

      &&

      estado.ultimaConfiguracao.rx
      ===
      config.rx

      &&

      estado.ultimaConfiguracao.janelaEstado
      ===
      config.janelaEstado

      &&

      estado.ultimaConfiguracao.perfil
      ===
      config.perfil.id

      &&

      estado.ultimaConfiguracao.offset
      ===
      config.offset

    ){

      scoreFinal -=

      fase.nivel
      *
      8;

    }


    avaliadas.push({

      ...config,

      backtest:bt,

      scoreFinal

    });

  });


  avaliadas.sort(
  (a,b) => {


    const estavelA =

    a.backtest.testes
    >=
    BACKTEST_MIN

    &&

    a.backtest.taxa10
    >=
    90

    &&

    a.backtest.taxa20
    >=
    90

    &&

    a.backtest.lossSeguidos
    <
    2;


    const estavelB =

    b.backtest.testes
    >=
    BACKTEST_MIN

    &&

    b.backtest.taxa10
    >=
    90

    &&

    b.backtest.taxa20
    >=
    90

    &&

    b.backtest.lossSeguidos
    <
    2;


    if(
      estavelA !==
      estavelB
    ){

      return (

        Number(estavelB)

        -

        Number(estavelA)

      );

    }


    /*
      Quando deteriorou:
      últimos 5 passam a ser muito
      importantes.
    */

    if(
      fase.nivel >= 1
    ){

      if(

        Math.abs(

          b.backtest.taxa5

          -

          a.backtest.taxa5

        )

        >

        0.001

      ){

        return (

          b.backtest.taxa5

          -

          a.backtest.taxa5

        );

      }


      if(

        a.backtest.lossSeguidos

        !==

        b.backtest.lossSeguidos

      ){

        return (

          a.backtest.lossSeguidos

          -

          b.backtest.lossSeguidos

        );

      }

    }


    if(

      Math.abs(

        b.backtest.taxa10

        -

        a.backtest.taxa10

      )

      >

      0.001

    ){

      return (

        b.backtest.taxa10

        -

        a.backtest.taxa10

      );

    }


    if(

      Math.abs(

        b.backtest.taxa20

        -

        a.backtest.taxa20

      )

      >

      0.001

    ){

      return (

        b.backtest.taxa20

        -

        a.backtest.taxa20

      );

    }


    if(

      Math.abs(

        b.scoreFinal

        -

        a.scoreFinal

      )

      >

      0.001

    ){

      return (

        b.scoreFinal

        -

        a.scoreFinal

      );

    }


    return (

      b.similaridade

      -

      a.similaridade

    );

  });


  return {

    escolhido:
    avaliadas[0]
    ||
    null,

    ranking:
    avaliadas,

    fase

  };

}


/* =========================================================
   MELHOR CONFIGURAÇÃO RX4 / RX5 / RX6
========================================================= */

function melhorConfiguracaoDoRX(
  base,
  rx,
  fase
){

  const candidatas=[];


  const janelas =
  janelasDaFase(
    fase
  );


  const erros =
  analisarErrosRecentes();


  janelas
  .forEach(janelaEstado => {


    PERFIS_BASE
    .forEach(perfil => {


      const config =

      gerarConfiguracao(

        base,

        rx,

        janelaEstado,

        perfil,

        0,

        fase,

        erros

      );


      if(
        config.valido
      ){

        candidatas.push(
          config
        );

      }


    });

  });


  if(
    !candidatas.length
  ){

    return null;

  }


  candidatas.sort(
    (a,b) =>
    b.similaridade
    -
    a.similaridade
  );


  return candidatas[0];

}


/* =========================================================
   SNAPSHOT CONGELADO
========================================================= */

function criarSnapshot(
  config,
  assinatura
){

  if(

    !config

    ||

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


    janelaEstado:
    config.janelaEstado,


    perfil:
    config.perfil.id,


    offset:
    config.offset
    ||
    0,


    fase:
    config.fase
    ||
    estado.motor.fase,


    numeros:

    Array.from(
      config.jogada
      .numerosUsados
    ),


    blocos2:

    config.jogada
    .blocos2

    .map(bloco => ({

      centro:
      bloco.centro,

      numeros:
      bloco.numeros.slice()

    })),


    blocos1:

    config.jogada
    .blocos1

    .map(bloco => ({

      centro:
      bloco.centro,

      numeros:
      bloco.numeros.slice()

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
      config.backtest.testes

    }

    :

    null

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


  /*
    RX4 / RX5 / RX6
  */

  RX_DISPONIVEIS
  .forEach(rx => {

    const pendente =
    estado.pendentesRX[
      rx
    ];


    if(
      !pendente
    ){

      return;

    }


    /*
      Se o histórico foi alterado,
      não marca resultado falso.
    */

    if(

      pendente.assinatura

      !==

      assinaturaAntes

    ){

      estado.pendentesRX[
        rx
      ] = null;

      return;

    }


    const green =

    pendente.numeros
    .includes(
      novoNumero
    );


    estado.timelineRX[
      rx
    ]
    .push({

      resultado:
      novoNumero,

      green,

      rx,

      assinatura:
      pendente.assinatura,

      numeros:
      pendente.numeros.slice(),

      blocos2:
      pendente.blocos2,

      blocos1:
      pendente.blocos1,

      offset:
      pendente.offset,

      fase:
      pendente.fase,

      hora:
      Date.now()

    });


    estado.timelineRX[
      rx
    ] =

    estado.timelineRX[
      rx
    ]

    .slice(
      -MAX_TIMELINE
    );


    estado.pendentesRX[
      rx
    ] = null;

  });


  /*
    AUTO
  */

  if(
    estado.pendenteAuto
  ){

    const pendente =
    estado.pendenteAuto;


    if(

      pendente.assinatura

      ===

      assinaturaAntes

    ){

      const green =

      pendente.numeros
      .includes(
        novoNumero
      );


      estado.timelineAuto
      .push({

        resultado:
        novoNumero,

        green,


        rx:
        pendente.rx,


        janelaEstado:
        pendente.janelaEstado,


        perfil:
        pendente.perfil,


        offset:
        pendente.offset,


        fase:
        pendente.fase,


        assinatura:
        pendente.assinatura,


        numeros:
        pendente.numeros.slice(),


        blocos2:
        pendente.blocos2,


        blocos1:
        pendente.blocos1,


        backtest:
        pendente.backtest,


        hora:
        Date.now()

      });


      estado.timelineAuto =

      estado.timelineAuto

      .slice(
        -MAX_TIMELINE
      );

    }


    estado.pendenteAuto =
    null;

  }


  salvarEstado();

}


/* =========================================================
   GARANTIR PENDENTES

   Render ou clique manual não pode
   substituir previsão aberta.
========================================================= */

function garantirPendentes(
  rxConfigs,
  otimizacao
){

  const assinatura =
  assinaturaHistorico();


  RX_DISPONIVEIS
  .forEach(rx => {

    const atual =
    estado.pendentesRX[
      rx
    ];


    if(

      atual

      &&

      atual.assinatura
      ===
      assinatura

    ){

      return;

    }


    estado.pendentesRX[
      rx
    ] =

    criarSnapshot(

      rxConfigs[
        rx
      ],

      assinatura

    );

  });


  const atualAuto =
  estado.pendenteAuto;


  if(

    !(
      atualAuto

      &&

      atualAuto.assinatura
      ===
      assinatura
    )

  ){

    estado.pendenteAuto =

    criarSnapshot(

      otimizacao.escolhido,

      assinatura

    );

  }


  salvarEstado();

}


/* =========================================================
   PROCESSAR ESTADO ATUAL
========================================================= */

function processarEstadoAtual(){

  limparCaches();


  const fase =
  determinarFase();


  const rxConfigs={};


  RX_DISPONIVEIS
  .forEach(rx => {

    rxConfigs[
      rx
    ] =

    melhorConfiguracaoDoRX(

      historico,

      rx,

      fase

    );

  });


  const otimizacao =

  otimizarProximaJogada(
    historico
  );


  garantirPendentes(

    rxConfigs,

    otimizacao

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
      .offset
      ||
      0,


      fase:
      otimizacao.fase.fase

    };

  }


  salvarEstado();


  return {

    rxConfigs,

    otimizacao,

    fase

  };

}


/* =========================================================
   ADICIONAR NÚMERO
========================================================= */

let calculando=false;

let filaCalculo=false;


function adicionarNumero(
  numero
){

  /*
    PRIMEIRO:
    fecha previsão anterior.
  */

  avaliarPendentes(
    numero
  );


  /*
    DEPOIS:
    insere o novo resultado.
  */

  historico.push(
    numero
  );


  historico =

  historico.slice(
    -MAX_HISTORICO
  );


  salvarHistorico();


  /*
    Atualização visual imediata.
  */

  render14();


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


  renderMomento();


  statusArea.textContent =

  "Número "

  +

  numero

  +

  " inserido • organismo recalculando...";


  statusArea.style.color =
  "#00e5ff";


  solicitarRenderPesado();

}


function solicitarRenderPesado(){

  if(
    calculando
  ){

    filaCalculo=true;

    return;

  }


  calculando=true;


  setTimeout(
  () => {

    try{

      renderPesado();

    }

    finally{

      calculando=false;


      if(
        filaCalculo
      ){

        filaCalculo=false;

        solicitarRenderPesado();

      }

    }

  },
  0);

}


/* =========================================================
   HISTÓRICO COLADO
========================================================= */

function extrairNumeros(
  texto
){

  const encontrados =

  texto.match(

    /\b(?:[0-9]|[12][0-9]|3[0-6])\b/g

  );


  if(
    !encontrados
  ){

    return [];

  }


  return encontrados

  .map(Number)

  .filter(numero =>

    numero >= 0

    &&

    numero <= 36

  )

  .slice(
    -MAX_HISTORICO
  );

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


  if(
    !numeros.length
  ){

    statusArea.textContent =
    "Nenhum número válido.";


    statusArea.style.color =
    "#ff5252";


    return;

  }


  historico =
  numeros;


  estado.pendenteAuto =
  null;


  estado.pendentesRX = {

    4:null,

    5:null,

    6:null

  };


  estado.timelineRX = {

    4:[],

    5:[],

    6:[]

  };


  estado.timelineAuto=[];


  estado.ultimaConfiguracao =
  null;


  estado.motor = {

    fase:
    "APRENDENDO",

    deterioracao:0,

    ultimaTaxa20:0

  };


  salvarHistorico();

  salvarEstado();


  campo.value="";


  statusArea.textContent =

  historico.length

  +

  " números carregados.";


  statusArea.style.color =
  "#00e676";


  render14();

  renderMomento();

  solicitarRenderPesado();

}


/* =========================================================
   APAGAR
========================================================= */

function apagarUltimo(){

  if(
    !historico.length
  ){

    return;

  }


  historico.pop();


  estado.pendenteAuto =
  null;


  estado.pendentesRX = {

    4:null,

    5:null,

    6:null

  };


  salvarHistorico();

  salvarEstado();


  render14();

  renderMomento();

  solicitarRenderPesado();

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


  estado.pendenteAuto =
  null;


  estado.pendentesRX = {

    4:null,

    5:null,

    6:null

  };


  estado.timelineRX = {

    4:[],

    5:[],

    6:[]

  };


  estado.timelineAuto=[];


  estado.ultimaConfiguracao =
  null;


  estado.motor = {

    fase:
    "APRENDENDO",

    deterioracao:0,

    ultimaTaxa20:0

  };


  salvarHistorico();

  salvarEstado();


  render14();

  renderMomento();

  solicitarRenderPesado();

}


/* =========================================================
   AUTO / MANUAL
========================================================= */

function ativarAuto(){

  estado.modo =
  "AUTO";


  salvarEstado();


  renderExibicaoAtual();

}


function ativarManual(rx){

  estado.modo =
  "MANUAL";


  estado.manualRX =
  rx;


  salvarEstado();


  renderExibicaoAtual();

}


/* =========================================================
   INTERFACE
========================================================= */

document.body.innerHTML="";


document.body.style.margin="0";

document.body.style.background="#101010";

document.body.style.color="#fff";

document.body.style.fontFamily=
"Arial,sans-serif";


const app =
document.createElement(
  "div"
);


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

.recuperacao{
color:#ff5252;
}


/* MOMENTO */

.momento{
display:grid;
grid-template-columns:repeat(6,1fr);
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
font-size:13px;
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
grid-template-columns:repeat(3,1fr);
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
MOTOR ADAPTATIVO — ORGANISMO VIVO
</div>


<div class="controle">

<button
id="auto"
class="modo">
AUTO
</button>

<button
id="rx4"
class="modo">
4
</button>

<button
id="rx5"
class="modo">
5
</button>

<button
id="rx6"
class="modo">
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


document.body.appendChild(
  app
);


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
  corNumeroRoleta(
    numero
  );


  botao.onclick =
  () =>
  adicionarNumero(
    numero
  );


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


zero.textContent =
"0";


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
  document.getElementById(
    id
  );


  const ultimos =
  lista.slice(-20);


  const estatistica =
  estatisticaTimeline(
    lista
  );


  const caixas =

  ultimos

  .map(item => {


    const detalhe =

    item.rx

    ?

    " • RX"

    +

    item.rx

    +

    (
      item.janelaEstado
      ?
      " E"+item.janelaEstado
      :
      ""
    )

    +

    (
      item.perfil
      ?
      " "+item.perfil
      :
      ""
    )

    +

    (
      item.offset
      ?
      " OFF "+item.offset
      :
      ""
    )

    :

    "";


    return (

      '<span class="gl ' +

      (
        item.green
        ?
        'greenGL'
        :
        'lossGL'
      )

      +

      '" title="Resultado ' +

      item.resultado +

      detalhe +

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
    .toFixed(0)

    +

    "%"

    :

    "—"

  )

  +

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

  estadoAtual.alto

  +

  estadoAtual.baixo;


  const totalCor =

  estadoAtual.vermelho

  +

  estadoAtual.preto;


  const pAlto =

  totalAB

  ?

  estadoAtual.alto
  /
  totalAB
  *
  100

  :

  0;


  const pBaixo =

  totalAB

  ?

  estadoAtual.baixo
  /
  totalAB
  *
  100

  :

  0;


  const pVermelho =

  totalCor

  ?

  estadoAtual.vermelho
  /
  totalCor
  *
  100

  :

  0;


  const pPreto =

  totalCor

  ?

  estadoAtual.preto
  /
  totalCor
  *
  100

  :

  0;


  const topTerminais =

  estadoAtual.terminalViz

  .map(
    (valor,terminal) =>
    ({
      terminal,
      valor
    })
  )

  .sort(
    (a,b) =>
    b.valor-a.valor
  )

  .slice(0,3)

  .map(
    item =>
    "T"+item.terminal
  )

  .join(" • ");


  const regiaoDominante =

  Object.entries(
    estadoAtual.regioes
  )

  .sort(
    (a,b) =>
    b[1]-a[1]
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

  '<small>TERMINAIS</small>' +

  '<strong>' +

  (
    topTerminais
    ||
    "—"
  ) +

  '</strong>' +

  '</div>' +


  '<div class="momentoBox">' +

  '<small>REGIÃO</small>' +

  '<strong>' +

  (
    regiaoDominante
    ?
    regiaoDominante[0]
    :
    "—"
  ) +

  '</strong>' +

  '</div>';

}


/* =========================================================
   RENDER MOTOR
========================================================= */

function classeTaxa(valor){

  if(
    valor >= 90
  ){

    return "meta90";

  }


  if(
    valor >= 85
  ){

    return "abaixo90";

  }


  return "recuperacao";

}


function renderMotor(
  otimizacao
){

  const area =

  document.getElementById(
    "motorGrid"
  );


  const escolhido =
  otimizacao.escolhido;


  const fase =

  otimizacao.fase

  ||

  determinarFase();


  if(
    !escolhido
  ){

    area.innerHTML =

    '<div class="motorCard">' +

    '<small>STATUS</small>' +

    '<strong>AGUARDANDO</strong>' +

    '</div>';


    return;

  }


  const bt =
  escolhido.backtest;


  area.innerHTML =


  '<div class="motorCard">' +

  '<small>FASE</small>' +

  '<strong class="' +

  (

    fase.nivel === 0

    ?

    'meta90'

    :

    fase.nivel === 1

    ?

    'abaixo90'

    :

    'recuperacao'

  )

  +

  '">' +

  fase.fase +

  '</strong>' +

  '</div>' +


  '<div class="motorCard">' +

  '<small>RX / ESTADO</small>' +

  '<strong>' +

  escolhido.rx +

  ' / ' +

  escolhido.janelaEstado +

  '</strong>' +

  '</div>' +


  '<div class="motorCard">' +

  '<small>ÚLTIMOS 5</small>' +

  '<strong class="' +

  classeTaxa(
    bt.taxa5
  ) +

  '">' +

  bt.taxa5.toFixed(0) +

  '%</strong>' +

  '</div>' +


  '<div class="motorCard">' +

  '<small>BACKTEST 10</small>' +

  '<strong class="' +

  classeTaxa(
    bt.taxa10
  ) +

  '">' +

  bt.taxa10.toFixed(0) +

  '%</strong>' +

  '</div>' +


  '<div class="motorCard">' +

  '<small>BACKTEST 20</small>' +

  '<strong class="' +

  classeTaxa(
    bt.taxa20
  ) +

  '">' +

  bt.taxa20.toFixed(0) +

  '%</strong>' +

  '</div>' +


  '<div class="motorCard">' +

  '<small>LOSS SEGUIDOS</small>' +

  '<strong class="' +

  (
    bt.lossSeguidos >= 2
    ?
    'recuperacao'
    :
    ''
  )

  +

  '">' +

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

        "rx"

        +

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

      "rx"

      +

      estado.manualRX

    )
    .classList.add(
      "ativo"
    );

  }

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

    corNumeroRoleta(
      numero
    )

    +

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
    regiaoDoNumero(
      numero
    );


    return (

      '<div class="regiaoBox" ' +

      'style="background:' +

      (
        regiao
        ?
        coresRegioes[
          regiao
        ]
        :
        "#555"
      )

      +

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
    idsQueBatem(
      numero
    );


    if(
      !ids.length
    ){

      return (

        '<div class="idBox">' +

        '—' +

        '</div>'

      );

    }


    return (

      '<div class="idBox">' +

      ids

      .map(id =>

        '<span class="idTag" ' +

        'style="background:' +

        corDoId(id)

        +

        '">' +

        id +

        '</span>'

      )

      .join("")

      +

      '</div>'

    );

  })

  .join("");

}


/* =========================================================
   RENDER JOGADA
========================================================= */

function renderJogada(
  config
){

  if(

    !config

    ||

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

  "RX"

  +

  config.rx

  +

  " • E"

  +

  config.janelaEstado

  +

  " • "

  +

  config.perfil.id

  +

  " • OFF "

  +

  (
    config.offset
    ||
    0
  );


  if(
    config.backtest
  ){

    texto +=

    " • "

    +

    config.backtest
    .taxa20
    .toFixed(0)

    +

    "%";

  }


  jogadaInfo.textContent =
  texto;


  const html2 =

  config.jogada
  .blocos2

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

  config.jogada
  .blocos1

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
   RESULTADO PROCESSADO
========================================================= */

let ultimoResultadoProcessado =
null;


function renderExibicaoAtual(){

  if(
    !ultimoResultadoProcessado
  ){

    solicitarRenderPesado();

    return;

  }


  const resultado =
  ultimoResultadoProcessado;


  renderControle(
    resultado
  );


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

}


/* =========================================================
   RENDER PESADO
========================================================= */

function renderPesado(){

  try{

    const resultado =

    processarEstadoAtual();


    ultimoResultadoProcessado =
    resultado;


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


    const fase =

    resultado.otimizacao
    .fase;


    if(
      fase.nivel === 0
    ){

      statusArea.textContent =

      "Motor estável • próxima jogada congelada.";


      statusArea.style.color =
      "#00e676";

    }


    else if(
      fase.nivel === 1
    ){

      statusArea.textContent =

      "Assertividade deteriorou • recalibração ativa.";


      statusArea.style.color =
      "#ffc107";

    }


    else{

      statusArea.textContent =

      fase.fase

      +

      " • lógica anterior perdeu preferência • nova estrutura congelada.";


      statusArea.style.color =
      "#ff5252";

    }


    console.log(

      "ORGANISMO VIVO V6",

      {

        modo:
        estado.modo,


        fase:
        resultado.otimizacao
        .fase,


        live:

        estatisticaTimeline(
          estado.timelineAuto
        ),


        errosRecentes:

        analisarErrosRecentes(),


        selecionada:

        resultado.otimizacao
        .escolhido,


        top10:

        resultado.otimizacao
        .ranking

        .slice(0,10)

        .map(config => ({

          RX:
          config.rx,


          ESTADO:
          config.janelaEstado,


          PERFIL:
          config.perfil.id,


          OFFSET:
          config.offset,


          BT5:
          config.backtest
          .taxa5
          .toFixed(1),


          BT10:
          config.backtest
          .taxa10
          .toFixed(1),


          BT20:
          config.backtest
          .taxa20
          .toFixed(1),


          TEND:
          config.backtest
          .tendencia
          .toFixed(1),


          LOSS:
          config.backtest
          .lossSeguidos,


          SIM:
          config.similaridade
          .toFixed(1),


          SCORE:
          config.scoreFinal
          .toFixed(1)

        }))

      }

    );


  }catch(erro){

    console.error(
      erro
    );


    statusArea.textContent =

    "Erro: "

    +

    (

      erro

      &&

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

render14();


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


solicitarRenderPesado();


})();
