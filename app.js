(function(){

"use strict";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const TAMANHO_JANELA = 14;
const STORAGE_KEY = "ANALISADOR_069_IDS_CORRESPONDENTES_V1";
const STORAGE_RX = "ANALISADOR_069_TAMANHO_RX_V1";

const COR_T0 = "#00c853";
const COR_T6 = "#ffc107";
const COR_T9 = "#2196f3";

const PERCENTUAL_REPLICAS_RX = 0.10;
const MIN_REPLICAS_RX = 15;
const MAX_REPLICAS_RX = 40;
const MIN_ZONAS_RX = 8;

let TAMANHO_RX = 6;

try{
  const salvo = Number(localStorage.getItem(STORAGE_RX));
  if([4,5,6].includes(salvo)) TAMANHO_RX = salvo;
}catch(e){}


/* =========================================================
   ROLETA
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
   REGIÕES VISUAIS
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
   FAMÍLIAS
========================================================= */

function familiaDoId(id){

  if([0,10,20,30].includes(id)) return 0;
  if([6,16,26,36].includes(id)) return 6;
  if([9,19,29,39].includes(id)) return 9;

  return null;
}

function corDoId(id){

  const f = familiaDoId(id);

  if(f === 0) return COR_T0;
  if(f === 6) return COR_T6;
  if(f === 9) return COR_T9;

  return "#555";
}

function corFamilia(f){

  if(f === 0) return COR_T0;
  if(f === 6) return COR_T6;
  if(f === 9) return COR_T9;

  return "#aaa";
}


/* =========================================================
   VIZINHOS
========================================================= */

function vizinhos(numero, quantidade = 1){

  const indice = track.indexOf(numero);

  if(indice === -1) return [];

  const resultado = [numero];

  for(let d=1; d<=quantidade; d++){

    resultado.push(
      track[
        (indice-d+track.length)
        %
        track.length
      ]
    );

    resultado.push(
      track[
        (indice+d)
        %
        track.length
      ]
    );
  }

  return resultado;
}


/* =========================================================
   COBERTURA DAS BASES
========================================================= */

const coberturaDasBases = {};

BASES_069.forEach(base => {

  coberturaDasBases[base] =
    new Set(vizinhos(base,1));

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
    Object.prototype.hasOwnProperty.call(
      IDS_ESPECIAIS,
      numero
    )
  ){

    IDS_ESPECIAIS[numero]
    .forEach(id => {

      if(!ids.includes(id)){
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

    .filter(f => f !== null)

  );
}


/* =========================================================
   REGIÃO / COR
========================================================= */

function regiaoDoNumero(numero){

  if(regioesRoleta.ZERO.has(numero)) return "ZERO";
  if(regioesRoleta.VOISINS.has(numero)) return "VOISINS";
  if(regioesRoleta.ORPHELINS.has(numero)) return "ORPHELINS";
  if(regioesRoleta.TIERS.has(numero)) return "TIERS";

  return null;
}


function corNumeroRoleta(numero){

  if(numero === 0){

    return {
      fundo:"#087c48",
      texto:"#fff"
    };

  }

  if(numerosVermelhos.has(numero)){

    return {
      fundo:"#c6283d",
      texto:"#fff"
    };

  }

  return {
    fundo:"#181818",
    texto:"#fff"
  };
}


/* =========================================================
   STORAGE
========================================================= */

function carregarHistorico(){

  try{

    const salvo =
      localStorage.getItem(STORAGE_KEY);

    if(!salvo) return [];

    const dados =
      JSON.parse(salvo);

    if(!Array.isArray(dados)) return [];

    return dados
      .map(Number)
      .filter(n =>
        Number.isInteger(n) &&
        n >= 0 &&
        n <= 36
      )
      .slice(-5000);

  }catch(e){

    return [];
  }
}


let historico =
  carregarHistorico();


function salvarHistorico(){

  try{

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(historico)
    );

  }catch(e){}
}


/* =========================================================
   EXTRAÇÃO
========================================================= */

function extrairNumeros(texto){

  const encontrados =
    texto.match(
      /\b(?:[0-9]|[12][0-9]|3[0-6])\b/g
    );

  if(!encontrados) return [];

  return encontrados
    .map(Number)
    .filter(n => n >= 0 && n <= 36)
    .slice(-5000);
}


/* =========================================================
   ÚLTIMOS 14
========================================================= */

function analisarJanela14(){

  const janela =
    historico.slice(-TAMANHO_JANELA);

  return {

    janela,

    sequencia:
      janela.map(numero => ({

        numero,
        ids:idsQueBatem(numero)

      }))

  };
}


/* =========================================================
   TRAJETÓRIA
========================================================= */

function gerarTrajetoria(janela){

  let t0 = 0;
  let t6 = 0;
  let t9 = 0;

  const pontos = [];
  const eventos = [];

  janela.forEach((numero,index) => {

    const familias =
      familiasQueBatem(numero);

    const bate0 =
      familias.has(0) ? 1 : 0;

    const bate6 =
      familias.has(6) ? 1 : 0;

    const bate9 =
      familias.has(9) ? 1 : 0;

    t0 += bate0;
    t6 += bate6;
    t9 += bate9;

    eventos.push({
      t0:bate0,
      t6:bate6,
      t9:bate9
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

  let chave = "";

  if(evento.t0) chave += "0";
  if(evento.t6) chave += "6";
  if(evento.t9) chave += "9";

  if(!chave) chave = "-";

  return chave;
}


/* =========================================================
   SIMILARIDADE
========================================================= */

function calcularSimilaridade(
  janelaAtual,
  janelaAntiga
){

  const tamanho =
    janelaAtual.length;

  if(
    !tamanho ||
    janelaAntiga.length !== tamanho
  ){
    return 0;
  }

  const atual =
    gerarTrajetoria(janelaAtual);

  const antiga =
    gerarTrajetoria(janelaAntiga);

  let eventosIguais = 0;

  for(let i=0;i<tamanho;i++){

    if(
      chaveEvento(atual.eventos[i])
      ===
      chaveEvento(antiga.eventos[i])
    ){
      eventosIguais++;
    }

  }

  const scoreEventos =
    (eventosIguais/tamanho)*100;


  let erro = 0;

  for(let i=0;i<tamanho;i++){

    erro += Math.abs(
      atual.pontos[i].t0 -
      antiga.pontos[i].t0
    );

    erro += Math.abs(
      atual.pontos[i].t6 -
      antiga.pontos[i].t6
    );

    erro += Math.abs(
      atual.pontos[i].t9 -
      antiga.pontos[i].t9
    );
  }


  const maxErro =
    tamanho*tamanho*3;

  let scoreForma =
    1-(erro/maxErro);

  scoreForma =
    Math.max(
      0,
      Math.min(1,scoreForma)
    )*100;


  return (
    scoreEventos*0.80 +
    scoreForma*0.20
  );
}


/* =========================================================
   PROCURAR RÉPLICAS
========================================================= */

function procurarReplicas(){

  const tamanho =
    TAMANHO_RX;

  const total =
    historico.length;

  if(total < tamanho*2+1){

    return {
      suficiente:false,
      replicas:[],
      totalJanelas:0
    };

  }


  const inicioAtual =
    total-tamanho;

  const janelaAtual =
    historico.slice(
      inicioAtual,
      total
    );

  const todas = [];


  for(
    let inicio=0;
    inicio+tamanho<inicioAtual;
    inicio++
  ){

    const fim =
      inicio+tamanho;

    const janelaAntiga =
      historico.slice(
        inicio,
        fim
      );

    const proximo =
      historico[fim];

    if(proximo === undefined){
      continue;
    }


    todas.push({

      inicio,
      fim,
      proximo,

      similaridade:
        calcularSimilaridade(
          janelaAtual,
          janelaAntiga
        ),

      distancia:
        inicioAtual-fim

    });

  }


  todas.sort((a,b) => {

    if(
      Math.abs(
        b.similaridade -
        a.similaridade
      ) > 0.0001
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


  return {
    suficiente:true,
    replicas:todas,
    totalJanelas:todas.length
  };
}


/* =========================================================
   CONTAR ZONAS
========================================================= */

function contarZonasDoGrupo(grupo){

  const zonas =
    new Set();

  grupo.forEach(item => {

    idsQueBatem(item.proximo)
    .forEach(id => {

      if(TODOS_IDS_RX.includes(id)){
        zonas.add(id);
      }

    });

  });

  return zonas;
}


/* =========================================================
   SELEÇÃO DINÂMICA
========================================================= */

function selecionarReplicas(){

  const busca =
    procurarReplicas();

  if(!busca.suficiente){

    return {
      estado:"AGUARDANDO",
      replicas:[],
      melhor:0,
      nivel:0,
      totalJanelas:0
    };

  }


  if(!busca.replicas.length){

    return {
      estado:"SEM DADOS",
      replicas:[],
      melhor:0,
      nivel:0,
      totalJanelas:0
    };

  }


  const totalDisponivel =
    busca.replicas.length;


  let quantidadeInicial =
    Math.ceil(
      totalDisponivel *
      PERCENTUAL_REPLICAS_RX
    );


  quantidadeInicial =
    Math.max(
      quantidadeInicial,
      MIN_REPLICAS_RX
    );


  quantidadeInicial =
    Math.min(
      quantidadeInicial,
      totalDisponivel,
      MAX_REPLICAS_RX
    );


  const grupo =
    busca.replicas.slice(
      0,
      quantidadeInicial
    );


  let zonas =
    contarZonasDoGrupo(grupo);


  let indice =
    quantidadeInicial;


  while(
    zonas.size < MIN_ZONAS_RX &&
    indice < totalDisponivel &&
    grupo.length < MAX_REPLICAS_RX
  ){

    grupo.push(
      busca.replicas[indice]
    );

    indice++;

    zonas =
      contarZonasDoGrupo(grupo);

  }


  return {

    estado:
      grupo.length
      ? "OK"
      : "SEM DADOS",

    replicas:grupo,

    melhor:
      busca.replicas[0]
      .similaridade,

    nivel:
      grupo.length
      ? grupo[group.length-1].similaridade
      : 0,

    totalJanelas:
      totalDisponivel

  };
}


/* =========================================================
   MESA ATUAL
========================================================= */

function analisarMesaAtual(){

  const mapa =
    new Map();


  TODOS_IDS_RX.forEach(id => {

    mapa.set(id,{

      id,

      incidencias14:0,
      incidencias20:0,

      maisRecente14:Infinity,
      maisRecente20:Infinity

    });

  });


  function ler(
    janela,
    campoIncidencia,
    campoRecencia
  ){

    janela.forEach((numero,index) => {

      const distancia =
        janela.length-1-index;

      idsQueBatem(numero)
      .forEach(id => {

        if(!mapa.has(id)){
          return;
        }

        const r =
          mapa.get(id);

        r[campoIncidencia]++;

        r[campoRecencia] =
          Math.min(
            r[campoRecencia],
            distancia
          );

      });

    });
  }


  ler(
    historico.slice(-20),
    "incidencias20",
    "maisRecente20"
  );

  ler(
    historico.slice(-14),
    "incidencias14",
    "maisRecente14"
  );


  const lista =
    Array.from(mapa.values());


  lista.sort((a,b) => {

    if(
      b.incidencias14 !==
      a.incidencias14
    ){
      return (
        b.incidencias14 -
        a.incidencias14
      );
    }

    if(
      a.maisRecente14 !==
      b.maisRecente14
    ){
      return (
        a.maisRecente14 -
        b.maisRecente14
      );
    }

    if(
      b.incidencias20 !==
      a.incidencias20
    ){
      return (
        b.incidencias20 -
        a.incidencias20
      );
    }

    return (
      TODOS_IDS_RX.indexOf(a.id)
      -
      TODOS_IDS_RX.indexOf(b.id)
    );

  });


  return lista;
}


/* =========================================================
   RANKING BRUTO RX
========================================================= */

function gerarRankingBrutoRX(){

  const selecao =
    selecionarReplicas();

  const mapa =
    new Map();


  TODOS_IDS_RX.forEach(id => {

    mapa.set(id,{

      id,
      ocorrencias:0,
      melhorSimilaridade:0,
      maisRecente:Infinity,
      origem:"RX"

    });

  });


  if(selecao.estado !== "OK"){

    return {

      selecao,
      ranking:[],

      familias:{
        0:0,
        6:0,
        9:0
      },

      lider:null,
      similaridade:0

    };
  }


  let somaSimilaridade = 0;

  let cont0 = 0;
  let cont6 = 0;
  let cont9 = 0;

  let totalFamilias = 0;


  selecao.replicas
  .forEach(item => {

    somaSimilaridade +=
      item.similaridade;


    idsQueBatem(item.proximo)
    .forEach(id => {

      if(!mapa.has(id)){
        return;
      }

      const r =
        mapa.get(id);

      r.ocorrencias++;

      r.melhorSimilaridade =
        Math.max(
          r.melhorSimilaridade,
          item.similaridade
        );

      r.maisRecente =
        Math.min(
          r.maisRecente,
          item.distancia
        );

    });


    const familias =
      Array.from(
        familiasQueBatem(
          item.proximo
        )
      );


    if(familias.length){

      const fracao =
        1/familias.length;

      familias.forEach(f => {

        if(f === 0) cont0 += fracao;
        if(f === 6) cont6 += fracao;
        if(f === 9) cont9 += fracao;

      });

      totalFamilias++;
    }

  });


  let p0 = 0;
  let p6 = 0;
  let p9 = 0;

  if(totalFamilias){

    p0 =
      cont0/totalFamilias*100;

    p6 =
      cont6/totalFamilias*100;

    p9 =
      cont9/totalFamilias*100;
  }


  const ordem =
    new Map();

  TODOS_IDS_RX
  .forEach((id,index) => {

    ordem.set(id,index);

  });


  const ranking =
    Array.from(mapa.values())
    .filter(
      x => x.ocorrencias > 0
    );


  ranking.sort((a,b) => {

    if(
      b.ocorrencias !==
      a.ocorrencias
    ){

      return (
        b.ocorrencias -
        a.ocorrencias
      );

    }


    if(
      Math.abs(
        b.melhorSimilaridade -
        a.melhorSimilaridade
      ) > 0.0001
    ){

      return (
        b.melhorSimilaridade -
        a.melhorSimilaridade
      );

    }


    if(
      a.maisRecente !==
      b.maisRecente
    ){

      return (
        a.maisRecente -
        b.maisRecente
      );

    }


    return (
      ordem.get(a.id) -
      ordem.get(b.id)
    );

  });


  const familiasOrdenadas = [

    {
      familia:0,
      valor:p0
    },

    {
      familia:6,
      valor:p6
    },

    {
      familia:9,
      valor:p9
    }

  ].sort(
    (a,b) => b.valor-a.valor
  );


  const lider =
    familiasOrdenadas[0].valor > 0
    ? familiasOrdenadas[0]
    : null;


  return {

    selecao,
    ranking,

    familias:{
      0:p0,
      6:p6,
      9:p9
    },

    lider,

    similaridade:
      selecao.replicas.length
      ?
      somaSimilaridade/
      selecao.replicas.length
      :
      0

  };
}


/* =========================================================
   COBERTURA DE CADA ID
========================================================= */

function coberturaDoIdParaJogada(id){

  if(id === 39){
    return [25];
  }


  if(
    Object.prototype
    .hasOwnProperty
    .call(
      coberturaDasBases,
      id
    )
  ){

    return Array.from(
      coberturaDasBases[id]
    );

  }

  return [];
}


/* =========================================================
   TOP 8

   0 + 26:
   UM QUADRO = 0 + 3
========================================================= */

function gerarTop8Efetivo(){

  const bruto =
    gerarRankingBrutoRX();


  const candidatos =
    bruto.ranking
    .map(x => ({...x}));


  const mesa =
    analisarMesaAtual();


  mesa.forEach(item => {

    if(
      candidatos.some(
        x => x.id === item.id
      )
    ){
      return;
    }


    if(
      item.incidencias14 <= 0 &&
      item.incidencias20 <= 0
    ){
      return;
    }


    candidatos.push({

      id:item.id,

      ocorrencias:
        item.incidencias14 > 0
        ? item.incidencias14
        : item.incidencias20,

      melhorSimilaridade:0,

      maisRecente:
        item.maisRecente14,

      origem:
        item.incidencias14 > 0
        ? "MESA 14"
        : "MESA 20"

    });

  });


  const selecionados = [];
  const usados = new Set();


  for(
    let i=0;
    i<candidatos.length;
    i++
  ){

    if(selecionados.length >= 8){
      break;
    }


    const atual =
      candidatos[i];


    if(usados.has(atual.id)){
      continue;
    }


    /* =====================================================
       ZERO + 26
    ===================================================== */

    if(
      atual.id === 0 ||
      atual.id === 26
    ){

      const outro =
        atual.id === 0
        ? 26
        : 0;


      const outroCandidato =
        candidatos.find(
          x => x.id === outro
        );


      if(
        outroCandidato &&
        !usados.has(outro)
      ){

        selecionados.push({

          tipo:"ZERO26",

          ids:[0,26],

          idPrincipal:0,

          label:"0 + 3",

          ocorrencias:
            atual.ocorrencias +
            outroCandidato.ocorrencias,

          detalhes:[
            {
              label:"0",
              ocorrencias:
                candidatos.find(
                  x => x.id === 0
                ).ocorrencias
            },
            {
              label:"26",
              ocorrencias:
                candidatos.find(
                  x => x.id === 26
                ).ocorrencias
            }
          ],

          origem:"RX",

          cobertura:
            new Set([
              26,
              0,
              32,
              3
            ])

        });


        usados.add(0);
        usados.add(26);

        continue;
      }
    }


    selecionados.push({

      tipo:"NORMAL",

      ids:[atual.id],

      idPrincipal:
        atual.id,

      label:
        String(atual.id),

      ocorrencias:
        atual.ocorrencias,

      detalhes:[
        {
          label:String(atual.id),
          ocorrencias:
            atual.ocorrencias
        }
      ],

      origem:
        atual.origem,

      cobertura:
        new Set(
          coberturaDoIdParaJogada(
            atual.id
          )
        )

    });


    usados.add(
      atual.id
    );
  }


  /* =====================================================
     COMPLEMENTO SOMENTE SE REALMENTE FALTAR
  ===================================================== */

  if(selecionados.length < 8){

    TODOS_IDS_RX
    .forEach(id => {

      if(selecionados.length >= 8){
        return;
      }

      if(usados.has(id)){
        return;
      }


      selecionados.push({

        tipo:"NORMAL",

        ids:[id],

        idPrincipal:id,

        label:String(id),

        ocorrencias:0,

        detalhes:[
          {
            label:String(id),
            ocorrencias:0
          }
        ],

        origem:"SEM DADOS",

        cobertura:
          new Set(
            coberturaDoIdParaJogada(id)
          )

      });


      usados.add(id);

    });

  }


  return {

    ...bruto,

    top8:
      selecionados.slice(0,8)

  };
}


/* =========================================================
   ALVOS
========================================================= */

function gerarAlvosDaJogada(top8){

  const alvos =
    new Set();

  top8.forEach(item => {

    item.cobertura
    .forEach(numero => {

      alvos.add(numero);

    });

  });

  return alvos;
}


/* =========================================================
   ZONAS RX ATINGIDAS POR UM BLOCO

   IMPORTANTE:
   NÃO SOMA TUDO EM UM ÚNICO "RANK".

   MOSTRA AS ZONAS INDIVIDUALMENTE.
========================================================= */

function zonasAtingidasPeloBloco(
  numeros,
  top8
){

  const conjunto =
    new Set(numeros);

  const resultado = [];


  top8.forEach((item,index) => {

    let intersecao = 0;


    item.cobertura
    .forEach(numero => {

      if(conjunto.has(numero)){
        intersecao++;
      }

    });


    if(intersecao > 0){

      resultado.push({

        indiceRX:index,

        label:item.label,

        ocorrencias:
          item.ocorrencias,

        intersecao:
          intersecao

      });

    }

  });


  resultado.sort((a,b) => {

    if(
      b.ocorrencias !==
      a.ocorrencias
    ){

      return (
        b.ocorrencias -
        a.ocorrencias
      );

    }

    return (
      a.indiceRX -
      b.indiceRX
    );

  });


  return resultado;
}


/* =========================================================
   CENTROS PERMITIDOS PARA A JOGADA

   A JOGADA NASCE DO PRÓPRIO TOP 8.

   NÃO VARRE MAIS 37 CENTROS ALEATÓRIOS.
========================================================= */

function centrosDaJogada(top8){

  const centros =
    new Set();


  top8.forEach(item => {

    if(item.tipo === "ZERO26"){

      /*
        2 vizinhos do 0 cobrem:
        3 • 26 • 0 • 32 • 15
      */

      centros.add(0);
      return;
    }


    if(item.idPrincipal === 39){

      /*
        39 é ID.
        Número real correspondente = 25
      */

      centros.add(25);
      return;
    }


    if(
      track.includes(
        item.idPrincipal
      )
    ){

      centros.add(
        item.idPrincipal
      );

    }

  });


  return Array.from(centros);
}


/* =========================================================
   QUANTOS ALVOS AINDA FALTANTES UM BLOCO PEGA
========================================================= */

function novosCobertos(
  numeros,
  faltando
){

  return numeros.filter(
    numero => faltando.has(numero)
  );
}


/* =========================================================
   SCORE DO BLOCO

   A PRIORIDADE É:
   1. COBRIR MAIS NÚMEROS NECESSÁRIOS
   2. COBRIR ZONAS MAIS FORTES DO RX
   3. MENOS NÚMEROS FORA DOS ALVOS
========================================================= */

function avaliarBloco(
  centro,
  quantidade,
  faltando,
  alvos,
  top8
){

  const numeros =
    vizinhos(
      centro,
      quantidade
    );


  const novos =
    novosCobertos(
      numeros,
      faltando
    );


  const zonas =
    zonasAtingidasPeloBloco(
      numeros,
      top8
    );


  let maiorIncidencia = 0;
  let somaIncidencias = 0;


  zonas.forEach(zona => {

    maiorIncidencia =
      Math.max(
        maiorIncidencia,
        zona.ocorrencias
      );

    somaIncidencias +=
      zona.ocorrencias;

  });


  const extras =
    numeros.filter(
      n => !alvos.has(n)
    ).length;


  return {

    centro,
    quantidade,
    numeros,
    novos,
    zonas,

    ganho:
      novos.length,

    maiorIncidencia,
    somaIncidencias,
    extras

  };
}


/* =========================================================
   COMPARAÇÃO DE BLOCOS
========================================================= */

function melhorQue(
  candidato,
  atual
){

  if(!atual){
    return true;
  }


  if(
    candidato.ganho !==
    atual.ganho
  ){

    return (
      candidato.ganho >
      atual.ganho
    );

  }


  if(
    candidato.maiorIncidencia !==
    atual.maiorIncidencia
  ){

    return (
      candidato.maiorIncidencia >
      atual.maiorIncidencia
    );

  }


  if(
    candidato.somaIncidencias !==
    atual.somaIncidencias
  ){

    return (
      candidato.somaIncidencias >
      atual.somaIncidencias
    );

  }


  if(
    candidato.extras !==
    atual.extras
  ){

    return (
      candidato.extras <
      atual.extras
    );

  }


  return (
    track.indexOf(candidato.centro)
    <
    track.indexOf(atual.centro)
  );
}


/* =========================================================
   MONTAGEM DA JOGADA

   1ª LINHA:
   2 VIZINHOS

   2ª LINHA:
   1 VIZINHO SOMENTE PARA COMPLETAR

   TODOS OS CENTROS VÊM DO TOP 8 DO RX.
========================================================= */

function montarJogada(top8){

  const alvos =
    gerarAlvosDaJogada(top8);

  const faltando =
    new Set(alvos);

  const centros =
    centrosDaJogada(top8);

  const blocos2 = [];
  const blocos1 = [];

  const centrosUsados2 =
    new Set();

  const centrosUsados1 =
    new Set();


  /* =====================================================
     PRIMEIRO — 2 VIZINHOS
  ===================================================== */

  while(faltando.size){

    let melhor = null;


    centros.forEach(centro => {

      if(
        centrosUsados2.has(centro)
      ){
        return;
      }


      const candidato =
        avaliarBloco(
          centro,
          2,
          faltando,
          alvos,
          top8
        );


      /*
        Só cria 2V se realmente estiver
        cobrindo pelo menos 2 números
        necessários que ainda faltam.
      */

      if(candidato.ganho < 2){
        return;
      }


      if(
        melhorQue(
          candidato,
          melhor
        )
      ){

        melhor =
          candidato;

      }

    });


    if(!melhor){
      break;
    }


    blocos2.push(
      melhor
    );


    centrosUsados2.add(
      melhor.centro
    );


    melhor.novos
    .forEach(numero => {

      faltando.delete(
        numero
      );

    });

  }


  /* =====================================================
     DEPOIS — 1 VIZINHO
  ===================================================== */

  while(faltando.size){

    let melhor = null;


    centros.forEach(centro => {

      if(
        centrosUsados1.has(centro)
      ){
        return;
      }


      const candidato =
        avaliarBloco(
          centro,
          1,
          faltando,
          alvos,
          top8
        );


      if(candidato.ganho < 1){
        return;
      }


      if(
        melhorQue(
          candidato,
          melhor
        )
      ){

        melhor =
          candidato;

      }

    });


    if(!melhor){
      break;
    }


    blocos1.push(
      melhor
    );


    centrosUsados1.add(
      melhor.centro
    );


    melhor.novos
    .forEach(numero => {

      faltando.delete(
        numero
      );

    });

  }


  /* =====================================================
     CASOS ESPECIAIS QUE NÃO FORAM COBERTOS

     Aqui entra somente o necessário.
  ===================================================== */

  if(faltando.size){

    Array.from(faltando)
    .forEach(numero => {

      /*
        Procura um centro RX natural
        que consiga cobrir esse número
        com 1 vizinho.
      */

      let melhor = null;


      centros.forEach(centro => {

        const numeros =
          vizinhos(centro,1);

        if(!numeros.includes(numero)){
          return;
        }


        const candidato =
          avaliarBloco(
            centro,
            1,
            faltando,
            alvos,
            top8
          );


        if(
          melhorQue(
            candidato,
            melhor
          )
        ){

          melhor =
            candidato;

        }

      });


      if(
        melhor &&
        !blocos1.some(
          x => x.centro === melhor.centro
        )
      ){

        blocos1.push(
          melhor
        );


        melhor.novos
        .forEach(n => {

          faltando.delete(n);

        });

      }

    });

  }


  /* =====================================================
     ORDENAR DO MAIOR RX PARA O MENOR
  ===================================================== */

  function ordenar(a,b){

    if(
      b.maiorIncidencia !==
      a.maiorIncidencia
    ){

      return (
        b.maiorIncidencia -
        a.maiorIncidencia
      );

    }


    if(
      b.somaIncidencias !==
      a.somaIncidencias
    ){

      return (
        b.somaIncidencias -
        a.somaIncidencias
      );

    }


    if(
      b.ganho !==
      a.ganho
    ){

      return (
        b.ganho -
        a.ganho
      );

    }


    return (
      track.indexOf(a.centro)
      -
      track.indexOf(b.centro)
    );

  }


  blocos2.sort(ordenar);
  blocos1.sort(ordenar);


  return {

    alvos,
    blocos2,
    blocos1,
    faltando,

    completa:
      faltando.size === 0

  };
}


/* =========================================================
   ANÁLISE FINAL
========================================================= */

function analisarRaioX(){

  const dados =
    gerarTop8Efetivo();

  const jogada =
    montarJogada(
      dados.top8
    );


  return {

    estado:
      dados.lider
      ?
      "SINAL " +
      dados.lider.familia
      :
      "SEM SINAL",

    tamanho:
      TAMANHO_RX,

    replicas:
      dados.selecao
      .replicas.length,

    totalJanelas:
      dados.selecao
      .totalJanelas || 0,

    similaridade:
      dados.similaridade,

    familias:
      dados.familias,

    lider:
      dados.lider,

    ranking:
      dados.top8,

    jogada

  };
}


/* =========================================================
   ALTERAR RX
========================================================= */

function alterarTamanhoRaioX(tamanho){

  if(![4,5,6].includes(tamanho)){
    return;
  }

  TAMANHO_RX =
    tamanho;

  try{

    localStorage.setItem(
      STORAGE_RX,
      String(TAMANHO_RX)
    );

  }catch(e){}

  atualizarBotoesRX();
  render();
}


/* =========================================================
   AÇÕES DO HISTÓRICO
========================================================= */

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
    numeros.slice(-5000);

  salvarHistorico();

  campo.value = "";

  statusArea.textContent =
    historico.length +
    " números carregados.";

  statusArea.style.color =
    "#00e676";

  render();
}


function adicionarNumero(numero){

  historico.push(numero);

  if(historico.length > 5000){
    historico.shift();
  }

  salvarHistorico();

  statusArea.textContent =
    "Número " +
    numero +
    " inserido.";

  statusArea.style.color =
    "#00e5ff";

  render();
}


function apagarUltimo(){

  if(!historico.length){
    return;
  }

  const apagado =
    historico.pop();

  salvarHistorico();

  statusArea.textContent =
    "Número " +
    apagado +
    " apagado.";

  statusArea.style.color =
    "#ffc107";

  render();
}


function apagarTudo(){

  if(
    !window.confirm(
      "Apagar todo o histórico?"
    )
  ){
    return;
  }

  historico = [];

  salvarHistorico();

  statusArea.textContent =
    "Histórico apagado.";

  statusArea.style.color =
    "#ff5252";

  render();
}


/* =========================================================
   INTERFACE
========================================================= */

document.body.innerHTML = "";

document.body.style.margin = "0";
document.body.style.background = "#101010";
document.body.style.color = "#fff";
document.body.style.fontFamily = "Arial,sans-serif";


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

.app069{
max-width:850px;
margin:auto;
padding:7px;
}

h2{
text-align:center;
margin:5px 0 10px;
font-size:22px;
}

.painel{
background:#1d1d1f;
border:1px solid #444;
border-radius:10px;
padding:9px;
margin-bottom:8px;
}

.tituloPainel{
font-size:11px;
font-weight:900;
color:#aaa;
}

.cabecalhoPainel{
display:flex;
align-items:center;
justify-content:space-between;
gap:6px;
}

.cabecalhoDireita{
display:flex;
align-items:center;
gap:5px;
}

.btnMostrar{
background:#292929;
border:1px solid #555;
color:#ddd;
border-radius:6px;
padding:5px 8px;
font-size:10px;
font-weight:900;
}

.conteudoOculto{
display:none;
margin-top:8px;
}


/* RX SELECTOR */

.seletorRX{
display:flex;
gap:3px;
}

.btnRX{
min-width:29px;
height:27px;
padding:0 6px;
background:#202020;
border:1px solid #555;
border-radius:6px;
color:#888;
font-size:11px;
font-weight:900;
}

.btnRX.ativo{
background:#00a6c7;
border-color:#00e5ff;
color:#fff;
}


/* INPUT */

textarea{
width:100%;
height:72px;
background:#111;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:8px;
resize:vertical;
}

.acoes{
display:flex;
gap:5px;
flex-wrap:wrap;
margin-top:6px;
}

.btn{
background:#333;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:8px 10px;
font-weight:900;
}

.btnVerde{
background:#146238;
}

.btnVermelho{
background:#762832;
}

.status{
margin-top:6px;
font-size:11px;
font-weight:900;
color:#aaa;
}


/* ÚLTIMOS 14 */

.linhaAnalise{
display:grid;
grid-template-columns:65px minmax(0,1fr);
gap:5px;
align-items:center;
margin-top:7px;
}

.rotulo{
font-size:9px;
font-weight:900;
color:#aaa;
}

.scrollLinha{
display:flex;
gap:4px;
overflow-x:auto;
padding-bottom:2px;
}

.numeroRoleta,
.numeroRegiao,
.idBox{
min-width:35px;
height:35px;
display:flex;
align-items:center;
justify-content:center;
font-weight:900;
font-size:13px;
}

.numeroRoleta{
border-radius:50%;
border:2px solid rgba(255,255,255,.75);
}

.numeroRegiao{
border-radius:7px;
border:1px solid #aaa;
}

.idBox{
border-radius:7px;
background:#111;
border:1px solid #444;
gap:2px;
padding:2px;
}

.tagID{
font-size:11px;
font-weight:900;
padding:6px 4px;
border-radius:5px;
color:#fff;
}

.semID{
color:#555;
}

.legendaRegioes{
display:flex;
justify-content:center;
gap:8px;
flex-wrap:wrap;
margin-top:8px;
font-size:9px;
color:#aaa;
}

.itemRegiao{
display:flex;
align-items:center;
gap:4px;
}

.corRegiao{
width:10px;
height:10px;
border-radius:3px;
}


/* JOGADA */

.jogadaBox{
background:#101010;
border:1px solid #444;
border-radius:8px;
padding:8px;
}

.jogadaSubtitulo{
font-size:9px;
font-weight:900;
color:#aaa;
margin:5px 0;
}

.linhaJogadas{
display:flex;
gap:5px;
overflow-x:auto;
padding:2px 0 5px;
}

.blocoJogada{
min-width:145px;
background:#181818;
border:1px solid #00e5ff;
border-radius:8px;
padding:8px;
text-align:center;
}

.blocoJogada.um{
border-color:#ffc107;
}

.blocoJogada small{
display:block;
font-size:8px;
font-weight:900;
color:#888;
}

.blocoJogada strong{
display:block;
font-size:22px;
margin:3px 0;
}

.centro2{
color:#00e5ff;
}

.centro1{
color:#ffc107;
}

.numerosCobertos{
font-size:10px;
font-weight:900;
color:#ddd;
line-height:1.5;
margin-top:5px;
padding-top:5px;
border-top:1px solid #333;
}

.zonasBloco{
margin-top:6px;
display:flex;
gap:3px;
flex-wrap:wrap;
justify-content:center;
}

.zonaMini{
background:#292929;
border:1px solid #555;
border-radius:5px;
padding:3px 5px;
font-size:9px;
font-weight:900;
white-space:nowrap;
}


/* RAIO X */

.raiox{
background:#101010;
border:1px solid #444;
border-radius:8px;
padding:8px;
}

.rxTopo{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:5px;
margin-bottom:7px;
}

.rxCard{
background:#181818;
border:1px solid #333;
border-radius:7px;
padding:6px;
text-align:center;
}

.rxCard small{
display:block;
font-size:8px;
color:#888;
font-weight:900;
}

.rxCard strong{
display:block;
font-size:15px;
margin-top:3px;
}

.rxFamilias{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:5px;
margin-bottom:7px;
}

.rxFamilia{
background:#171717;
border:1px solid #333;
border-radius:7px;
padding:6px 3px;
text-align:center;
}

.rxFamilia strong{
font-size:17px;
}

.rxFamilia small{
display:block;
font-size:8px;
color:#888;
}

.rxSinal{
background:#111;
border:1px solid #444;
border-radius:8px;
text-align:center;
padding:8px;
margin-bottom:8px;
}

.rxSinal small{
display:block;
font-size:8px;
font-weight:900;
color:#888;
}

.rxSinal strong{
display:block;
font-size:26px;
margin-top:3px;
}

.rxRanking{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:4px;
}

.rxNumero{
background:#181818;
border:1px solid #3c3c3c;
border-radius:7px;
text-align:center;
padding:7px 2px;
min-height:68px;
}

.rxNumero strong{
display:block;
font-size:18px;
}

.rxNumero small{
display:block;
font-size:8px;
color:#888;
margin-top:2px;
}

.rxOrigem{
font-size:7px !important;
font-weight:900;
}

.zero26{
border-width:2px;
}


/* TECLADO */

.teclado{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:4px;
margin-top:7px;
}

.numeroBtn{
height:40px;
border:1px solid #666;
border-radius:7px;
color:#fff;
font-weight:900;
font-size:14px;
}

.zeroBtn{
grid-column:span 6;
}


/* HISTÓRICO */

.historico{
display:flex;
gap:4px;
overflow-x:auto;
}

.histNumero{
min-width:31px;
height:31px;
display:flex;
align-items:center;
justify-content:center;
border-radius:6px;
border:1px solid #555;
font-size:12px;
font-weight:900;
}

.janelaAtual{
border:2px solid #00e5ff;
}

.ultimo{
box-shadow:0 0 8px #00e5ff;
}


@media(max-width:600px){

.app069{
padding:5px;
}

.painel{
padding:7px;
}

.linhaAnalise{
grid-template-columns:58px minmax(0,1fr);
}

.numeroRoleta,
.numeroRegiao,
.idBox{
min-width:34px;
height:34px;
}

.blocoJogada{
min-width:138px;
}

}

</style>


<div class="app069">

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
class="btn btnVerde"
>
Inserir histórico
</button>

<button
id="btnApagarUltimo"
class="btn"
>
Apagar último
</button>

<button
id="btnApagarTudo"
class="btn btnVermelho"
>
Apagar tudo
</button>

</div>

<div
id="statusArea"
class="status"
>
Cole o histórico ou use o teclado.
</div>

</section>


<section class="painel">

<div class="tituloPainel">
ÚLTIMOS
<span id="qtdJanela">0</span>/14
</div>


<div class="linhaAnalise">

<div class="rotulo">
ROLETA
</div>

<div
id="linhaCores"
class="scrollLinha"
></div>

</div>


<div class="linhaAnalise">

<div class="rotulo">
REGIÕES
</div>

<div
id="linhaRegioes"
class="scrollLinha"
></div>

</div>


<div class="linhaAnalise">

<div class="rotulo">
ID<br>0 • 6 • 9
</div>

<div
id="linhaIds"
class="scrollLinha"
></div>

</div>


<div class="legendaRegioes">

<div class="itemRegiao">
<span
class="corRegiao"
style="background:#9bea2c"
></span>
Zero
</div>

<div class="itemRegiao">
<span
class="corRegiao"
style="background:#8a20d4"
></span>
Voisins
</div>

<div class="itemRegiao">
<span
class="corRegiao"
style="background:#176436"
></span>
Orphelins
</div>

<div class="itemRegiao">
<span
class="corRegiao"
style="background:#29499b"
></span>
Tiers
</div>

</div>

</section>


<section class="painel">

<div class="cabecalhoPainel">

<div class="tituloPainel">
JOGADA SUGERIDA
</div>

<button
id="btnMostrarJogada"
class="btnMostrar"
>
Mostrar
</button>

</div>

<div
id="conteudoJogada"
class="conteudoOculto"
>

<div
id="jogadaArea"
class="jogadaBox"
></div>

</div>

</section>


<section class="painel">

<div class="cabecalhoPainel">

<div class="tituloPainel">
RAIO X
</div>

<div class="cabecalhoDireita">

<div class="seletorRX">

<button id="rx4" class="btnRX">4</button>
<button id="rx5" class="btnRX">5</button>
<button id="rx6" class="btnRX">6</button>

</div>

<button
id="btnMostrarRaioX"
class="btnMostrar"
>
Mostrar
</button>

</div>

</div>

<div
id="conteudoRaioX"
class="conteudoOculto"
>

<div
id="raioX"
class="raiox"
></div>

</div>

</section>


<section class="painel">

<div class="tituloPainel">
TECLADO 0–36
</div>

<div
id="teclado"
class="teclado"
></div>

</section>


<section class="painel">

<div class="cabecalhoPainel">

<div class="tituloPainel">

HISTÓRICO OCULTO —
<span id="qtdHistorico">
0
</span>

</div>

<button
id="btnMostrarHistorico"
class="btnMostrar"
>
Mostrar
</button>

</div>

<div
id="conteudoHistorico"
class="conteudoOculto"
>

<div
id="historico"
class="historico"
></div>

</div>

</section>

</div>

`;


document.body.appendChild(app);


/* =========================================================
   ELEMENTOS
========================================================= */

const statusArea =
  document.getElementById(
    "statusArea"
  );

const qtdJanela =
  document.getElementById(
    "qtdJanela"
  );

const linhaCores =
  document.getElementById(
    "linhaCores"
  );

const linhaRegioes =
  document.getElementById(
    "linhaRegioes"
  );

const linhaIds =
  document.getElementById(
    "linhaIds"
  );

const raioX =
  document.getElementById(
    "raioX"
  );

const jogadaArea =
  document.getElementById(
    "jogadaArea"
  );

const teclado =
  document.getElementById(
    "teclado"
  );

const qtdHistorico =
  document.getElementById(
    "qtdHistorico"
  );

const elementoHistorico =
  document.getElementById(
    "historico"
  );


/* =========================================================
   RX 4 / 5 / 6
========================================================= */

function atualizarBotoesRX(){

  [4,5,6].forEach(numero => {

    const botao =
      document.getElementById(
        "rx"+numero
      );

    botao.classList.toggle(
      "ativo",
      numero === TAMANHO_RX
    );

  });
}


document.getElementById("rx4").onclick =
  () => alterarTamanhoRaioX(4);

document.getElementById("rx5").onclick =
  () => alterarTamanhoRaioX(5);

document.getElementById("rx6").onclick =
  () => alterarTamanhoRaioX(6);

atualizarBotoesRX();


/* =========================================================
   PAINÉIS
========================================================= */

function configurarPainelOculto(
  botaoId,
  conteudoId,
  callback
){

  const botao =
    document.getElementById(
      botaoId
    );

  const conteudo =
    document.getElementById(
      conteudoId
    );


  botao.onclick = function(){

    const aberto =
      conteudo.style.display ===
      "block";


    if(aberto){

      conteudo.style.display =
        "none";

      botao.textContent =
        "Mostrar";

    }else{

      conteudo.style.display =
        "block";

      botao.textContent =
        "Ocultar";

      if(callback){
        callback();
      }

    }

  };
}


configurarPainelOculto(
  "btnMostrarJogada",
  "conteudoJogada",
  renderJogada
);

configurarPainelOculto(
  "btnMostrarRaioX",
  "conteudoRaioX",
  renderRaioX
);

configurarPainelOculto(
  "btnMostrarHistorico",
  "conteudoHistorico",
  function(){

    elementoHistorico.scrollLeft =
      elementoHistorico.scrollWidth;

  }
);


/* =========================================================
   TECLADO
========================================================= */

for(let numero=1; numero<=36; numero++){

  const botao =
    document.createElement("button");

  const cor =
    corNumeroRoleta(numero);

  botao.className =
    "numeroBtn";

  botao.textContent =
    numero;

  botao.style.background =
    cor.fundo;

  botao.onclick =
    () => adicionarNumero(numero);

  teclado.appendChild(botao);
}


const zero =
  document.createElement("button");

zero.className =
  "numeroBtn zeroBtn";

zero.textContent =
  "0";

zero.style.background =
  "#087c48";

zero.onclick =
  () => adicionarNumero(0);

teclado.appendChild(zero);


/* =========================================================
   BOTÕES
========================================================= */

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
   RENDER 14
========================================================= */

function renderJanela(){

  const analise =
    analisarJanela14();

  qtdJanela.textContent =
    analise.janela.length;


  if(!analise.janela.length){

    linhaCores.innerHTML =
      "Sem números.";

    linhaRegioes.innerHTML =
      "Sem números.";

    linhaIds.innerHTML =
      "Sem números.";

    return;
  }


  linhaCores.innerHTML =
    analise.janela
    .map(numero => {

      const cor =
        corNumeroRoleta(numero);

      return (
        '<div class="numeroRoleta" ' +
        'style="background:' +
        cor.fundo +
        ';color:' +
        cor.texto +
        '">' +
        numero +
        '</div>'
      );

    })
    .join("");


  linhaRegioes.innerHTML =
    analise.janela
    .map(numero => {

      const regiao =
        regiaoDoNumero(numero);

      const cor =
        regiao
        ? coresRegioes[regiao]
        : "#555";

      return (
        '<div class="numeroRegiao" ' +
        'style="background:' +
        cor +
        '">' +
        numero +
        '</div>'
      );

    })
    .join("");


  linhaIds.innerHTML =
    analise.sequencia
    .map(item => {

      if(!item.ids.length){

        return (
          '<div class="idBox">' +
          '<span class="semID">—</span>' +
          '</div>'
        );

      }


      const tags =
        item.ids
        .map(id => {

          return (
            '<span class="tagID" ' +
            'style="background:' +
            corDoId(id) +
            '">' +
            id +
            '</span>'
          );

        })
        .join("");


      return (
        '<div class="idBox">' +
        tags +
        '</div>'
      );

    })
    .join("");
}


/* =========================================================
   RENDER JOGADA

   MOSTRA:
   - CENTRO
   - NÚMEROS COBERTOS
   - ZONAS RX + VEZES

   NÃO MOSTRA "JOGADA COMPLETA".
========================================================= */

function htmlZonasDoBloco(bloco){

  if(!bloco.zonas.length){

    return "";
  }


  return (

    '<div class="zonasBloco">' +

    bloco.zonas
    .map(zona => {

      return (

        '<span class="zonaMini">' +

        zona.label +
        ' ' +
        zona.ocorrencias +
        'x' +

        '</span>'

      );

    })
    .join("") +

    '</div>'

  );
}


function renderJogada(){

  const rx =
    analisarRaioX();

  const jogada =
    rx.jogada;


  if(
    !jogada ||
    !jogada.alvos.size
  ){

    jogadaArea.innerHTML =
      '<div style="color:#777;text-align:center;">Sem dados suficientes.</div>';

    return;
  }


  let html2 = "";


  jogada.blocos2
  .forEach(bloco => {

    html2 +=

      '<div class="blocoJogada">' +

      '<small>2 VIZINHOS DO</small>' +

      '<strong class="centro2">' +
      bloco.centro +
      '</strong>' +

      '<div class="numerosCobertos">' +

      bloco.numeros.join(" • ") +

      '</div>' +

      htmlZonasDoBloco(bloco) +

      '</div>';

  });


  if(!html2){

    html2 =
      '<div style="font-size:9px;color:#666;padding:6px;">' +
      'Nenhum bloco de 2 vizinhos.' +
      '</div>';

  }


  let html1 = "";


  jogada.blocos1
  .forEach(bloco => {

    html1 +=

      '<div class="blocoJogada um">' +

      '<small>1 VIZINHO DO</small>' +

      '<strong class="centro1">' +
      bloco.centro +
      '</strong>' +

      '<div class="numerosCobertos">' +

      bloco.numeros.join(" • ") +

      '</div>' +

      htmlZonasDoBloco(bloco) +

      '</div>';

  });


  if(!html1){

    html1 =
      '<div style="font-size:9px;color:#666;padding:6px;">' +
      'Não precisa completar com 1 vizinho.' +
      '</div>';

  }


  jogadaArea.innerHTML =

    '<div class="jogadaSubtitulo">' +
    '1ª LINHA — 2 VIZINHOS' +
    '</div>' +

    '<div class="linhaJogadas">' +
    html2 +
    '</div>' +

    '<div class="jogadaSubtitulo">' +
    '2ª LINHA — 1 VIZINHO PARA COMPLETAR' +
    '</div>' +

    '<div class="linhaJogadas">' +
    html1 +
    '</div>';

}


/* =========================================================
   RENDER RAIO X NORMAL
========================================================= */

function renderRaioX(){

  const rx =
    analisarRaioX();

  let rankingHTML = "";


  rx.ranking
  .forEach((item,index) => {

    const familia =
      familiaDoId(
        item.idPrincipal
      );

    const cor =
      corFamilia(familia);

    const classe =
      item.tipo === "ZERO26"
      ? " zero26"
      : "";


    rankingHTML +=

      '<div class="rxNumero' +
      classe +
      '" style="border-color:' +
      cor +
      '">' +

      '<small>#' +
      (index+1) +
      '</small>' +

      '<strong style="color:' +
      cor +
      '">' +

      item.label +

      '</strong>' +

      '<small>' +
      item.ocorrencias +
      'x' +
      '</small>' +

      '<small class="rxOrigem">' +
      item.origem +
      '</small>' +

      '</div>';

  });


  let sinalHTML = "";


  if(rx.lider){

    const cor =
      corFamilia(
        rx.lider.familia
      );

    sinalHTML =

      '<div class="rxSinal">' +

      '<small>SINAL</small>' +

      '<strong style="color:' +
      cor +
      '">' +

      rx.lider.familia +

      '</strong>' +

      '</div>';

  }else{

    sinalHTML =

      '<div class="rxSinal">' +

      '<small>SINAL</small>' +

      '<strong style="color:#777;font-size:18px">' +

      'SEM SINAL' +

      '</strong>' +

      '</div>';

  }


  raioX.innerHTML =

    '<div class="rxTopo">' +

    '<div class="rxCard">' +
    '<small>RÉPLICAS USADAS</small>' +
    '<strong>' +
    rx.replicas +
    '</strong>' +
    '</div>' +

    '<div class="rxCard">' +
    '<small>JANELAS</small>' +
    '<strong>' +
    rx.totalJanelas +
    '</strong>' +
    '</div>' +

    '<div class="rxCard">' +
    '<small>SIMILARIDADE</small>' +
    '<strong>' +
    rx.similaridade.toFixed(1) +
    '%' +
    '</strong>' +
    '</div>' +

    '</div>' +


    '<div class="rxFamilias">' +

    '<div class="rxFamilia">' +
    '<strong style="color:' +
    COR_T0 +
    '">' +
    rx.familias[0].toFixed(0) +
    '%' +
    '</strong>' +
    '<small>0</small>' +
    '</div>' +

    '<div class="rxFamilia">' +
    '<strong style="color:' +
    COR_T6 +
    '">' +
    rx.familias[6].toFixed(0) +
    '%' +
    '</strong>' +
    '<small>6</small>' +
    '</div>' +

    '<div class="rxFamilia">' +
    '<strong style="color:' +
    COR_T9 +
    '">' +
    rx.familias[9].toFixed(0) +
    '%' +
    '</strong>' +
    '<small>9</small>' +
    '</div>' +

    '</div>' +

    sinalHTML +

    '<div class="tituloPainel" style="margin-bottom:5px">' +

    '8 ZONAS — RAIO X ' +
    rx.tamanho +

    '</div>' +

    '<div class="rxRanking">' +

    rankingHTML +

    '</div>';

}


/* =========================================================
   HISTÓRICO
========================================================= */

function renderHistorico(){

  qtdHistorico.textContent =
    historico.length;


  if(!historico.length){

    elementoHistorico.innerHTML =
      "Histórico vazio.";

    return;
  }


  const inicioJanela =
    Math.max(
      0,
      historico.length -
      TAMANHO_JANELA
    );


  const visiveis =
    historico.slice(-100);


  const offset =
    historico.length -
    visiveis.length;


  elementoHistorico.innerHTML =
    visiveis

    .map((numero,index) => {

      const indiceReal =
        offset+index;

      const cor =
        corNumeroRoleta(numero);

      const dentroJanela =
        indiceReal >=
        inicioJanela;

      const ultimo =
        indiceReal ===
        historico.length-1;


      return (

        '<div class="' +

        'histNumero ' +

        (
          dentroJanela
          ? 'janelaAtual '
          : ''
        ) +

        (
          ultimo
          ? 'ultimo'
          : ''
        ) +

        '" style="' +

        'background:' +
        cor.fundo +
        ';color:' +
        cor.texto +

        '">' +

        numero +

        '</div>'

      );

    })

    .join("");


  elementoHistorico.scrollLeft =
    elementoHistorico.scrollWidth;
}


/* =========================================================
   RENDER GERAL
========================================================= */

function render(){

  renderJanela();
  renderJogada();
  renderRaioX();
  renderHistorico();

}


/* =========================================================
   INICIAR
========================================================= */

render();

})();
