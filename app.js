(function(){

"use strict";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const TAMANHO_JANELA = 14;

const STORAGE_KEY =
"ANALISADOR_069_IDS_CORRESPONDENTES_V1";

const STORAGE_RX =
"ANALISADOR_069_TAMANHO_RX_V1";

const COR_T0 = "#00c853";
const COR_T6 = "#ffc107";
const COR_T9 = "#2196f3";

const PERCENTUAL_REPLICAS_RX = 0.10;
const MIN_REPLICAS_RX = 15;
const MAX_REPLICAS_RX = 40;
const MIN_ZONAS_RX = 8;

/*
  JOGADA FIXA:
  5 x 2 vizinhos = 25 números
  1 x 1 vizinho  =  3 números
  TOTAL          = 28 números
*/

const QTD_BLOCOS_2V = 5;
const QTD_BLOCOS_1V = 1;
const MAX_NUMEROS_JOGADA = 28;

/*
  CALIBRAÇÃO DO OFFSET
*/

const MAX_TESTES_OFFSET = 200;

const OFFSETS_TESTADOS = [
    -2,
    -1,
    0,
    1,
    2
];

let TAMANHO_RX = 6;

try{

    const salvo =
    Number(
        localStorage.getItem(
            STORAGE_RX
        )
    );

    if(
        salvo === 4 ||
        salvo === 5 ||
        salvo === 6
    ){
        TAMANHO_RX = salvo;
    }

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
   HELPERS
========================================================= */

function indiceRoda(numero){

    return track.indexOf(numero);

}


function numeroOffset(
    numero,
    offset
){

    const i =
    indiceRoda(numero);

    if(i < 0){
        return numero;
    }

    return track[
        (
            i +
            offset +
            track.length
        )
        %
        track.length
    ];

}


function setorVizinhosOrdenado(
    centro,
    quantidade
){

    const i =
    indiceRoda(centro);

    if(i < 0){
        return [];
    }

    const resultado = [];

    for(
        let d=-quantidade;
        d<=quantidade;
        d++
    ){

        resultado.push(
            track[
                (
                    i +
                    d +
                    track.length
                )
                %
                track.length
            ]
        );

    }

    return resultado;
}


function vizinhos(
    numero,
    quantidade=1
){

    const i =
    indiceRoda(numero);

    if(i < 0){
        return [];
    }

    const resultado = [numero];

    for(
        let d=1;
        d<=quantidade;
        d++
    ){

        resultado.push(
            track[
                (
                    i -
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
                    i +
                    d
                )
                %
                track.length
            ]
        );

    }

    return resultado;
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


function corFamilia(f){

    if(f === 0){
        return COR_T0;
    }

    if(f === 6){
        return COR_T6;
    }

    if(f === 9){
        return COR_T9;
    }

    return "#777";
}


/* =========================================================
   COBERTURA DAS BASES
========================================================= */

const coberturaDasBases = {};

BASES_069.forEach(function(base){

    coberturaDasBases[base] =
    new Set(
        vizinhos(
            base,
            1
        )
    );

});


function idsQueBatem(numero){

    const ids = [];

    BASES_069.forEach(function(base){

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
        .forEach(function(id){

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

        .filter(function(f){
            return f !== null;
        })

    );
}


/* =========================================================
   VISUAL
========================================================= */

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


function corNumeroRoleta(numero){

    if(numero === 0){

        return {
            fundo:"#087c48",
            texto:"#fff"
        };

    }

    if(
        numerosVermelhos.has(numero)
    ){

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
   HISTÓRICO
========================================================= */

function carregarHistorico(){

    try{

        const salvo =
        localStorage.getItem(
            STORAGE_KEY
        );

        if(!salvo){
            return [];
        }

        const dados =
        JSON.parse(salvo);

        if(!Array.isArray(dados)){
            return [];
        }

        return dados

        .map(Number)

        .filter(function(n){

            return (
                Number.isInteger(n) &&
                n >= 0 &&
                n <= 36
            );

        })

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
            JSON.stringify(
                historico
            )
        );

    }catch(e){}

}


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

    .filter(function(n){

        return (
            n >= 0 &&
            n <= 36
        );

    })

    .slice(-5000);
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

    janela.forEach(function(numero,index){

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


function chaveEvento(e){

    let chave = "";

    if(e.t0) chave += "0";
    if(e.t6) chave += "6";
    if(e.t9) chave += "9";

    return chave || "-";
}


/* =========================================================
   SIMILARIDADE OTIMIZADA
========================================================= */

function calcularSimilaridadeTrajetorias(
    atual,
    antiga
){

    const tamanho =
    atual.eventos.length;

    if(
        tamanho === 0 ||
        antiga.eventos.length !== tamanho
    ){
        return 0;
    }

    let eventosIguais = 0;

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
            eventosIguais++;
        }

    }

    const scoreEventos =
    eventosIguais /
    tamanho *
    100;

    let erro = 0;

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
    erro /
    maxErro;

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
        scoreEventos * 0.80 +
        scoreForma * 0.20
    );
}


/* =========================================================
   PROCURAR RÉPLICAS EM QUALQUER HISTÓRICO
========================================================= */

function procurarReplicasNoHistorico(
    base,
    tamanho
){

    const total =
    base.length;

    if(
        total <
        tamanho * 2 + 1
    ){

        return {
            suficiente:false,
            replicas:[],
            totalJanelas:0
        };

    }

    const inicioAtual =
    total -
    tamanho;

    const janelaAtual =
    base.slice(
        inicioAtual,
        total
    );

    const trajAtual =
    gerarTrajetoria(
        janelaAtual
    );

    const todas = [];

    for(
        let inicio=0;
        inicio+tamanho<inicioAtual;
        inicio++
    ){

        const fim =
        inicio +
        tamanho;

        const proximo =
        base[fim];

        if(
            proximo === undefined
        ){
            continue;
        }

        const antiga =
        gerarTrajetoria(
            base.slice(
                inicio,
                fim
            )
        );

        const similaridade =
        calcularSimilaridadeTrajetorias(
            trajAtual,
            antiga
        );

        todas.push({

            inicio,
            fim,
            proximo,
            similaridade,

            distancia:
            inicioAtual -
            fim

        });

    }


    todas.sort(function(a,b){

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


    return {
        suficiente:true,
        replicas:todas,
        totalJanelas:todas.length
    };
}


/* =========================================================
   ZONAS
========================================================= */

function contarZonasDoGrupo(grupo){

    const zonas =
    new Set();

    grupo.forEach(function(item){

        idsQueBatem(
            item.proximo
        )
        .forEach(function(id){

            if(
                TODOS_IDS_RX.includes(id)
            ){
                zonas.add(id);
            }

        });

    });

    return zonas;
}


/* =========================================================
   SELECIONAR RÉPLICAS
========================================================= */

function selecionarReplicasNoHistorico(
    base,
    tamanho
){

    const busca =
    procurarReplicasNoHistorico(
        base,
        tamanho
    );

    if(
        !busca.suficiente
    ){

        return {
            estado:"AGUARDANDO",
            replicas:[],
            melhor:0,
            nivel:0,
            totalJanelas:0,
            zonasEncontradas:0
        };

    }

    if(
        !busca.replicas.length
    ){

        return {
            estado:"SEM DADOS",
            replicas:[],
            melhor:0,
            nivel:0,
            totalJanelas:0,
            zonasEncontradas:0
        };

    }

    const totalDisponivel =
    busca.replicas.length;

    let quantidade =
    Math.ceil(
        totalDisponivel *
        PERCENTUAL_REPLICAS_RX
    );

    quantidade =
    Math.max(
        quantidade,
        MIN_REPLICAS_RX
    );

    quantidade =
    Math.min(
        quantidade,
        totalDisponivel,
        MAX_REPLICAS_RX
    );

    const grupo =
    busca.replicas.slice(
        0,
        quantidade
    );

    let zonas =
    contarZonasDoGrupo(
        grupo
    );

    let indice =
    quantidade;

    while(
        zonas.size <
        MIN_ZONAS_RX
        &&
        indice <
        totalDisponivel
        &&
        grupo.length <
        MAX_REPLICAS_RX
    ){

        grupo.push(
            busca.replicas[indice]
        );

        indice++;

        zonas =
        contarZonasDoGrupo(
            grupo
        );

    }

    return {

        estado:
        grupo.length
        ?
        "OK"
        :
        "SEM DADOS",

        replicas:
        grupo,

        melhor:
        busca.replicas[0]
        .similaridade,

        nivel:
        grupo.length
        ?
        grupo[
            grupo.length-1
        ].similaridade
        :
        0,

        totalJanelas:
        totalDisponivel,

        zonasEncontradas:
        zonas.size

    };
}


/* =========================================================
   FREQUÊNCIA DAS RÉPLICAS
========================================================= */

function gerarFrequenciaReplicas(
    replicas
){

    const frequencia =
    new Map();

    track.forEach(function(n){

        frequencia.set(
            n,
            0
        );

    });

    replicas.forEach(function(item){

        const n =
        item.proximo;

        if(
            frequencia.has(n)
        ){

            frequencia.set(
                n,
                frequencia.get(n) + 1
            );

        }

    });

    return frequencia;
}


/* =========================================================
   AVALIAÇÃO DO BLOCO

   Continua corrigindo erro de borda:
   - centro mais forte
   - 1V intermediário
   - 2V normal
   - olha também primeira casa externa
========================================================= */

function avaliarSetor(
    centro,
    quantidade,
    frequencia
){

    const numeros =
    setorVizinhosOrdenado(
        centro,
        quantidade
    );

    if(!numeros.length){
        return null;
    }

    const ampliado =
    setorVizinhosOrdenado(
        centro,
        quantidade+1
    );

    let peso = 0;
    let score = 0;
    let alvos = 0;

    numeros.forEach(function(numero,index){

        const qtd =
        frequencia.get(numero) || 0;

        peso += qtd;

        if(qtd > 0){
            alvos++;
        }

        const distancia =
        Math.abs(
            index -
            quantidade
        );

        let multiplicador = 1;

        if(
            quantidade === 2
        ){

            if(distancia === 0){
                multiplicador = 1.45;
            }

            else if(
                distancia === 1
            ){
                multiplicador = 1.20;
            }

            else{
                multiplicador = 1.00;
            }

        }

        else{

            if(distancia === 0){
                multiplicador = 1.30;
            }

            else{
                multiplicador = 1.00;
            }

        }

        score +=
        qtd *
        multiplicador;

    });


    const externoE =
    ampliado[0];

    const externoD =
    ampliado[
        ampliado.length-1
    ];

    const freqExtE =
    frequencia.get(
        externoE
    ) || 0;

    const freqExtD =
    frequencia.get(
        externoD
    ) || 0;


    /*
      Penalidade leve para não deixar
      muita frequência imediatamente fora.
    */

    score -=
    (
        freqExtE +
        freqExtD
    )
    *
    0.35;


    return {

        centro,
        quantidade,
        numeros,
        peso,
        score,
        alvos,

        freqExtE,
        freqExtD

    };
}


/* =========================================================
   SOBREPOSIÇÃO
========================================================= */

function temSobreposicao(
    numeros,
    usados
){

    return numeros.some(
        n => usados.has(n)
    );
}


/* =========================================================
   CANDIDATOS
========================================================= */

function gerarCandidatos(
    quantidade,
    frequencia,
    usados
){

    const lista = [];

    track.forEach(function(centro){

        const item =
        avaliarSetor(
            centro,
            quantidade,
            frequencia
        );

        if(!item){
            return;
        }

        if(
            temSobreposicao(
                item.numeros,
                usados
            )
        ){
            return;
        }

        lista.push(item);

    });


    lista.sort(function(a,b){

        if(
            Math.abs(
                b.score -
                a.score
            )
            >
            0.0001
        ){
            return b.score-a.score;
        }

        if(
            b.peso !==
            a.peso
        ){
            return b.peso-a.peso;
        }

        if(
            b.alvos !==
            a.alvos
        ){
            return b.alvos-a.alvos;
        }

        return (
            indiceRoda(a.centro) -
            indiceRoda(b.centro)
        );

    });


    return lista;
}


/* =========================================================
   CONSUMIR COBERTURA
========================================================= */

function consumirNumeros(
    numeros,
    frequencia
){

    numeros.forEach(function(n){

        frequencia.set(
            n,
            0
        );

    });
}


/* =========================================================
   VERIFICA SE AINDA EXISTE UM 1V LIVRE
========================================================= */

function existe1VLivre(usados){

    return track.some(function(centro){

        const nums =
        setorVizinhosOrdenado(
            centro,
            1
        );

        return !temSobreposicao(
            nums,
            usados
        );

    });
}


/* =========================================================
   MONTA EXATAMENTE:
   5 BLOCOS DE 2V
   1 BLOCO DE 1V
========================================================= */

function montarJogadaBaseDasReplicas(
    replicas
){

    const frequenciaOriginal =
    gerarFrequenciaReplicas(
        replicas
    );

    const frequencia =
    new Map(
        frequenciaOriginal
    );

    const usados =
    new Set();

    const blocos2 = [];
    const blocos1 = [];


    /* =====================================================
       CINCO BLOCOS DE 2 VIZINHOS
    ===================================================== */

    for(
        let etapa=0;
        etapa<QTD_BLOCOS_2V;
        etapa++
    ){

        const candidatos =
        gerarCandidatos(
            2,
            frequencia,
            usados
        );

        if(!candidatos.length){
            break;
        }

        let escolhido = null;


        /*
          No quinto bloco, preservamos
          obrigatoriamente espaço para
          uma zona de 1 vizinho.
        */

        if(
            etapa ===
            QTD_BLOCOS_2V-1
        ){

            for(
                const candidato
                of candidatos
            ){

                const teste =
                new Set(usados);

                candidato.numeros
                .forEach(
                    n => teste.add(n)
                );

                if(
                    existe1VLivre(
                        teste
                    )
                ){

                    escolhido =
                    candidato;

                    break;
                }

            }

        }


        if(!escolhido){

            escolhido =
            candidatos[0];

        }


        blocos2.push(
            escolhido
        );


        escolhido.numeros
        .forEach(
            n => usados.add(n)
        );


        consumirNumeros(
            escolhido.numeros,
            frequencia
        );

    }


    /* =====================================================
       GARANTIA DE CINCO BLOCOS 2V
    ===================================================== */

    while(
        blocos2.length <
        QTD_BLOCOS_2V
    ){

        const candidatos =
        gerarCandidatos(
            2,
            frequencia,
            usados
        );

        if(!candidatos.length){
            break;
        }

        const escolhido =
        candidatos.find(
            function(c){

                const teste =
                new Set(usados);

                c.numeros
                .forEach(
                    n => teste.add(n)
                );

                return existe1VLivre(
                    teste
                );

            }
        )
        ||
        candidatos[0];


        blocos2.push(
            escolhido
        );

        escolhido.numeros
        .forEach(
            n => usados.add(n)
        );

        consumirNumeros(
            escolhido.numeros,
            frequencia
        );

    }


    /* =====================================================
       UMA ZONA DE 1 VIZINHO
    ===================================================== */

    const candidatos1 =
    gerarCandidatos(
        1,
        frequencia,
        usados
    );


    if(
        candidatos1.length
    ){

        const escolhido =
        candidatos1[0];

        blocos1.push(
            escolhido
        );

        escolhido.numeros
        .forEach(
            n => usados.add(n)
        );

    }


    /*
      Segurança:
      se por alguma situação extrema
      não achou 1V após o greedy,
      procura qualquer setor livre.
    */

    if(
        blocos1.length === 0
    ){

        for(
            const centro
            of track
        ){

            const numeros =
            setorVizinhosOrdenado(
                centro,
                1
            );

            if(
                !temSobreposicao(
                    numeros,
                    usados
                )
            ){

                blocos1.push({

                    centro,
                    quantidade:1,
                    numeros,
                    peso:0,
                    score:0,
                    alvos:0

                });

                numeros.forEach(
                    n => usados.add(n)
                );

                break;
            }

        }

    }


    return {

        blocos2:
        blocos2.slice(
            0,
            5
        ),

        blocos1:
        blocos1.slice(
            0,
            1
        ),

        numerosUsados:
        usados

    };
}


/* =========================================================
   APLICAR OFFSET NA JOGADA

   O MESMO DESLOCAMENTO É APLICADO
   A TODOS OS BLOCOS.

   COMO É UMA ROTAÇÃO DA RODA,
   NÃO CRIA SOBREPOSIÇÃO NOVA.
========================================================= */

function aplicarOffsetJogada(
    jogada,
    offset
){

    function deslocarBloco(bloco){

        const novoCentro =
        numeroOffset(
            bloco.centro,
            offset
        );

        return {

            ...bloco,

            centro:
            novoCentro,

            numeros:
            setorVizinhosOrdenado(
                novoCentro,
                bloco.quantidade
            )

        };

    }


    const blocos2 =
    jogada.blocos2.map(
        deslocarBloco
    );

    const blocos1 =
    jogada.blocos1.map(
        deslocarBloco
    );

    const numerosUsados =
    new Set();

    [
        ...blocos2,
        ...blocos1
    ]
    .forEach(function(bloco){

        bloco.numeros
        .forEach(
            n => numerosUsados.add(n)
        );

    });


    return {

        blocos2,
        blocos1,
        numerosUsados,
        offset,
        totalNumeros:
        numerosUsados.size

    };
}


/* =========================================================
   DISTÂNCIA ATÉ A JOGADA
========================================================= */

function distanciaAteCobertura(
    numero,
    cobertura
){

    if(
        cobertura.has(numero)
    ){
        return 0;
    }

    const i =
    indiceRoda(numero);

    let menor =
    Infinity;

    cobertura.forEach(function(alvo){

        const j =
        indiceRoda(alvo);

        let d =
        Math.abs(
            i-j
        );

        d =
        Math.min(
            d,
            track.length-d
        );

        menor =
        Math.min(
            menor,
            d
        );

    });

    return menor;
}


/* =========================================================
   BACKTEST INTERNO DO OFFSET

   IMPORTANTE:
   Para prever base[t], usa somente:
   base[0 ... t-1]

   Portanto o próprio resultado testado
   não participa da montagem da jogada.
========================================================= */

function calibrarOffset(
    base,
    tamanhoRX
){

    const estatisticas =
    OFFSETS_TESTADOS.map(
        function(offset){

            return {
                offset,
                testes:0,
                acertos:0,
                perto1:0,
                perto2:0
            };

        }
    );


    /*
      Precisamos de histórico mínimo
      antes de começar o backtest.
    */

    const minimoHistorico =
    Math.max(
        35,
        tamanhoRX * 4
    );


    if(
        base.length <=
        minimoHistorico
    ){

        return {
            offset:0,
            testes:0,
            estatisticas
        };

    }


    const primeiroTeste =
    Math.max(
        minimoHistorico,
        base.length -
        MAX_TESTES_OFFSET
    );


    for(
        let indice=
        primeiroTeste;
        indice<base.length;
        indice++
    ){

        /*
          Histórico disponível ANTES
          daquele resultado.
        */

        const passado =
        base.slice(
            0,
            indice
        );


        const resultadoReal =
        base[indice];


        const selecao =
        selecionarReplicasNoHistorico(
            passado,
            tamanhoRX
        );


        if(
            selecao.estado !==
            "OK"
            ||
            !selecao.replicas.length
        ){
            continue;
        }


        const jogadaBase =
        montarJogadaBaseDasReplicas(
            selecao.replicas
        );


        /*
          Só testa quando conseguiu
          montar 5 de 2V + 1 de 1V.
        */

        if(
            jogadaBase.blocos2.length !== 5
            ||
            jogadaBase.blocos1.length !== 1
        ){
            continue;
        }


        estatisticas.forEach(
        function(est){

            const jogada =
            aplicarOffsetJogada(
                jogadaBase,
                est.offset
            );


            est.testes++;


            const distancia =
            distanciaAteCobertura(
                resultadoReal,
                jogada.numerosUsados
            );


            if(
                distancia === 0
            ){
                est.acertos++;
            }

            else if(
                distancia === 1
            ){
                est.perto1++;
            }

            else if(
                distancia === 2
            ){
                est.perto2++;
            }

        });

    }


    /* =====================================================
       ESCOLHE OFFSET

       ACERTO VALE MUITO MAIS.

       PROXIMIDADE SÓ DESEMPATA.
    ===================================================== */

    estatisticas.forEach(
    function(est){

        est.score =
        (
            est.acertos *
            100
        )
        +
        (
            est.perto1 *
            5
        )
        +
        (
            est.perto2 *
            1
        );

        est.percentual =
        est.testes
        ?
        est.acertos /
        est.testes *
        100
        :
        0;

    });


    estatisticas.sort(
    function(a,b){

        if(
            b.acertos !==
            a.acertos
        ){
            return (
                b.acertos -
                a.acertos
            );
        }

        if(
            b.perto1 !==
            a.perto1
        ){
            return (
                b.perto1 -
                a.perto1
            );
        }

        if(
            b.perto2 !==
            a.perto2
        ){
            return (
                b.perto2 -
                a.perto2
            );
        }

        /*
          Empate:
          prefere menor deslocamento.
        */

        return (
            Math.abs(a.offset) -
            Math.abs(b.offset)
        );

    });


    const melhor =
    estatisticas[0];


    /*
      Com amostra muito pequena,
      não deslocamos a jogada.
    */

    const offsetFinal =
    melhor &&
    melhor.testes >= 25
    ?
    melhor.offset
    :
    0;


    const resultado = {

        offset:
        offsetFinal,

        testes:
        melhor
        ?
        melhor.testes
        :
        0,

        melhor,

        estatisticas:
        estatisticas.slice()

    };


    console.log(
        "OFFSET RX",
        resultado
    );


    return resultado;
}


/* =========================================================
   MESA ATUAL PARA FALLBACK DO RX
========================================================= */

function analisarMesaAtual(){

    const mapa =
    new Map();

    TODOS_IDS_RX.forEach(function(id){

        mapa.set(
            id,
            {
                id,
                incidencias14:0,
                incidencias20:0,
                maisRecente14:Infinity,
                maisRecente20:Infinity
            }
        );

    });


    function contar(
        janela,
        campo,
        campoRecencia
    ){

        janela.forEach(
        function(numero,index){

            const distancia =
            janela.length -
            1 -
            index;

            idsQueBatem(numero)
            .forEach(function(id){

                if(!mapa.has(id)){
                    return;
                }

                const item =
                mapa.get(id);

                item[campo]++;

                item[campoRecencia] =
                Math.min(
                    item[campoRecencia],
                    distancia
                );

            });

        });

    }


    contar(
        historico.slice(-20),
        "incidencias20",
        "maisRecente20"
    );

    contar(
        historico.slice(-14),
        "incidencias14",
        "maisRecente14"
    );


    const lista =
    Array.from(
        mapa.values()
    );


    lista.sort(function(a,b){

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

        if(
            a.maisRecente20 !==
            b.maisRecente20
        ){
            return (
                a.maisRecente20 -
                b.maisRecente20
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
   RANKING RAIO X
========================================================= */

function gerarRankingRX(
    selecao
){

    const mapa =
    new Map();

    TODOS_IDS_RX.forEach(function(id){

        mapa.set(
            id,
            {
                id,
                ocorrencias:0,
                melhorSimilaridade:0,
                maisRecente:Infinity,
                origem:"RX"
            }
        );

    });


    let somaSimilaridade = 0;

    let cont0 = 0;
    let cont6 = 0;
    let cont9 = 0;

    let totalFamilias = 0;


    selecao.replicas
    .forEach(function(item){

        somaSimilaridade +=
        item.similaridade;


        idsQueBatem(
            item.proximo
        )
        .forEach(function(id){

            if(!mapa.has(id)){
                return;
            }

            const reg =
            mapa.get(id);

            reg.ocorrencias++;

            reg.melhorSimilaridade =
            Math.max(
                reg.melhorSimilaridade,
                item.similaridade
            );

            reg.maisRecente =
            Math.min(
                reg.maisRecente,
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
            1 /
            familias.length;

            familias.forEach(
            function(f){

                if(f === 0){
                    cont0 += fracao;
                }

                if(f === 6){
                    cont6 += fracao;
                }

                if(f === 9){
                    cont9 += fracao;
                }

            });

            totalFamilias++;

        }

    });


    const ranking =
    Array.from(
        mapa.values()
    )
    .filter(
        x => x.ocorrencias > 0
    );


    ranking.sort(function(a,b){

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
            )
            >
            0.0001
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
            TODOS_IDS_RX.indexOf(a.id)
            -
            TODOS_IDS_RX.indexOf(b.id)
        );

    });


    const mesa =
    analisarMesaAtual();


    mesa.forEach(function(item){

        if(
            ranking.some(
                x => x.id === item.id
            )
        ){
            return;
        }

        if(
            item.incidencias14 <= 0
            &&
            item.incidencias20 <= 0
        ){
            return;
        }

        ranking.push({

            id:item.id,

            ocorrencias:
            item.incidencias14 > 0
            ?
            item.incidencias14
            :
            item.incidencias20,

            melhorSimilaridade:0,

            maisRecente:
            item.maisRecente14 !== Infinity
            ?
            item.maisRecente14
            :
            item.maisRecente20,

            origem:
            item.incidencias14 > 0
            ?
            "MESA 14"
            :
            "MESA 20"

        });

    });


    /*
      REGRA 0 + 26:
      só combina se os dois já estiverem
      entre os primeiros 8 antes da compressão.
    */

    const primeiros8 =
    ranking.slice(0,8);

    const tem0 =
    primeiros8.some(
        x => x.id === 0
    );

    const tem26 =
    primeiros8.some(
        x => x.id === 26
    );


    const top = [];
    const usados =
    new Set();


    for(
        let i=0;
        i<ranking.length &&
        top.length<8;
        i++
    ){

        const item =
        ranking[i];

        if(
            usados.has(item.id)
        ){
            continue;
        }


        if(
            tem0 &&
            tem26 &&
            (
                item.id === 0 ||
                item.id === 26
            )
        ){

            const a =
            ranking.find(
                x => x.id === 0
            );

            const b =
            ranking.find(
                x => x.id === 26
            );

            if(a && b){

                top.push({

                    tipo:"ZERO26",
                    ids:[0,26],
                    idPrincipal:0,
                    label:"0 + 3",

                    ocorrencias:
                    a.ocorrencias +
                    b.ocorrencias,

                    ocorrencias0:
                    a.ocorrencias,

                    ocorrencias26:
                    b.ocorrencias,

                    origem:"RX"

                });

                usados.add(0);
                usados.add(26);

                continue;

            }

        }


        top.push({

            tipo:"NORMAL",
            ids:[item.id],
            idPrincipal:item.id,
            label:String(item.id),
            ocorrencias:item.ocorrencias,
            origem:item.origem

        });

        usados.add(
            item.id
        );

    }


    TODOS_IDS_RX.forEach(
    function(id){

        if(top.length >= 8){
            return;
        }

        if(usados.has(id)){
            return;
        }

        top.push({

            tipo:"NORMAL",
            ids:[id],
            idPrincipal:id,
            label:String(id),
            ocorrencias:0,
            origem:"SEM DADOS"

        });

        usados.add(id);

    });


    const p0 =
    totalFamilias
    ?
    cont0 /
    totalFamilias *
    100
    :
    0;

    const p6 =
    totalFamilias
    ?
    cont6 /
    totalFamilias *
    100
    :
    0;

    const p9 =
    totalFamilias
    ?
    cont9 /
    totalFamilias *
    100
    :
    0;


    const familiasOrdenadas = [
        {familia:0,valor:p0},
        {familia:6,valor:p6},
        {familia:9,valor:p9}
    ]
    .sort(
        (a,b) => b.valor-a.valor
    );


    return {

        top8:
        top.slice(0,8),

        familias:{
            0:p0,
            6:p6,
            9:p9
        },

        lider:
        familiasOrdenadas[0].valor > 0
        ?
        familiasOrdenadas[0]
        :
        null,

        similaridade:
        selecao.replicas.length
        ?
        somaSimilaridade /
        selecao.replicas.length
        :
        0

    };
}


/* =========================================================
   ANÁLISE PRINCIPAL
========================================================= */

function analisarRaioX(){

    const selecao =
    selecionarReplicasNoHistorico(
        historico,
        TAMANHO_RX
    );


    if(
        selecao.estado !==
        "OK"
    ){

        return {

            tamanho:TAMANHO_RX,
            replicas:0,
            totalJanelas:
            selecao.totalJanelas || 0,

            zonasEncontradas:0,

            similaridade:0,

            familias:{
                0:0,
                6:0,
                9:0
            },

            lider:null,

            ranking:[],

            jogada:{
                blocos2:[],
                blocos1:[],
                numerosUsados:new Set(),
                offset:0
            },

            calibracao:null

        };

    }


    const ranking =
    gerarRankingRX(
        selecao
    );


    /*
      PRIMEIRO monta a jogada sem offset.
    */

    const jogadaBase =
    montarJogadaBaseDasReplicas(
        selecao.replicas
    );


    /*
      DEPOIS testa até 200 previsões
      anteriores e descobre o offset.
    */

    const calibracao =
    calibrarOffset(
        historico,
        TAMANHO_RX
    );


    /*
      Aplica o offset escolhido
      à jogada atual.
    */

    const jogada =
    aplicarOffsetJogada(
        jogadaBase,
        calibracao.offset
    );


    return {

        tamanho:
        TAMANHO_RX,

        replicas:
        selecao.replicas.length,

        totalJanelas:
        selecao.totalJanelas || 0,

        zonasEncontradas:
        selecao.zonasEncontradas || 0,

        similaridade:
        ranking.similaridade,

        familias:
        ranking.familias,

        lider:
        ranking.lider,

        ranking:
        ranking.top8,

        jogada,

        calibracao

    };
}


/* =========================================================
   ÚLTIMOS 14
========================================================= */

function analisarJanela14(){

    const janela =
    historico.slice(
        -TAMANHO_JANELA
    );

    return {

        janela,

        sequencia:
        janela.map(
            numero => ({
                numero,
                ids:
                idsQueBatem(numero)
            })
        )

    };
}


/* =========================================================
   ALTERAR RX
========================================================= */

function alterarTamanhoRaioX(
    tamanho
){

    if(
        ![4,5,6].includes(tamanho)
    ){
        return;
    }

    TAMANHO_RX =
    tamanho;

    try{

        localStorage.setItem(
            STORAGE_RX,
            String(tamanho)
        );

    }catch(e){}

    invalidarCache();

    atualizarBotoesRX();

    render();
}


/* =========================================================
   AÇÕES
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

    invalidarCache();

    campo.value = "";

    statusArea.textContent =
    historico.length +
    " números carregados.";

    statusArea.style.color =
    "#00e676";

    render();
}


function adicionarNumero(numero){

    historico.push(
        numero
    );

    if(
        historico.length >
        5000
    ){
        historico.shift();
    }

    salvarHistorico();

    invalidarCache();

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

    const numero =
    historico.pop();

    salvarHistorico();

    invalidarCache();

    statusArea.textContent =
    "Número " +
    numero +
    " apagado.";

    statusArea.style.color =
    "#ffc107";

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

    historico = [];

    salvarHistorico();

    invalidarCache();

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
document.createElement(
    "div"
);


app.innerHTML = `

<style>

*{box-sizing:border-box}

button,textarea{
font-family:Arial,sans-serif
}

button{
cursor:pointer;
touch-action:manipulation
}

.app069{
max-width:850px;
margin:auto;
padding:7px
}

h2{
text-align:center;
margin:5px 0 10px;
font-size:22px
}

.painel{
background:#1d1d1f;
border:1px solid #444;
border-radius:10px;
padding:9px;
margin-bottom:8px
}

.tituloPainel{
font-size:11px;
font-weight:900;
color:#aaa
}

.cabecalhoPainel{
display:flex;
align-items:center;
justify-content:space-between;
gap:6px
}

.cabecalhoDireita{
display:flex;
align-items:center;
gap:5px
}

.btnMostrar{
background:#292929;
border:1px solid #555;
color:#ddd;
border-radius:6px;
padding:5px 8px;
font-size:10px;
font-weight:900
}

.conteudoOculto{
display:none;
margin-top:8px
}

.seletorRX{
display:flex;
gap:3px
}

.btnRX{
min-width:29px;
height:27px;
background:#202020;
border:1px solid #555;
border-radius:6px;
color:#888;
font-size:11px;
font-weight:900
}

.btnRX.ativo{
background:#00a6c7;
border-color:#00e5ff;
color:#fff
}

textarea{
width:100%;
height:72px;
background:#111;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:8px
}

.acoes{
display:flex;
gap:5px;
flex-wrap:wrap;
margin-top:6px
}

.btn{
background:#333;
color:#fff;
border:1px solid #555;
border-radius:7px;
padding:8px 10px;
font-weight:900
}

.btnVerde{background:#146238}
.btnVermelho{background:#762832}

.status{
margin-top:6px;
font-size:11px;
font-weight:900;
color:#aaa
}

.linhaAnalise{
display:grid;
grid-template-columns:65px minmax(0,1fr);
gap:5px;
align-items:center;
margin-top:7px
}

.rotulo{
font-size:9px;
font-weight:900;
color:#aaa
}

.scrollLinha{
display:flex;
gap:4px;
overflow-x:auto
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
font-size:13px
}

.numeroRoleta{
border-radius:50%;
border:2px solid rgba(255,255,255,.75)
}

.numeroRegiao{
border-radius:7px;
border:1px solid #aaa
}

.idBox{
border-radius:7px;
background:#111;
border:1px solid #444;
gap:2px;
padding:2px
}

.tagID{
font-size:11px;
font-weight:900;
padding:6px 4px;
border-radius:5px;
color:#fff
}

.semID{color:#555}

.legendaRegioes{
display:flex;
justify-content:center;
gap:8px;
flex-wrap:wrap;
margin-top:8px;
font-size:9px;
color:#aaa
}

.itemRegiao{
display:flex;
align-items:center;
gap:4px
}

.corRegiao{
width:10px;
height:10px;
border-radius:3px
}


/* JOGADA */

.jogadaBox{
background:#101010;
border:1px solid #444;
border-radius:8px;
padding:8px
}

.jogadaSubtitulo{
font-size:9px;
font-weight:900;
color:#aaa;
margin:7px 0 5px
}

.linhaJogadas{
display:flex;
gap:5px;
overflow-x:auto;
padding-bottom:4px
}

.blocoJogada{
min-width:145px;
background:#181818;
border:1px solid #00e5ff;
border-radius:8px;
padding:8px;
text-align:center
}

.blocoJogada.um{
border-color:#ffc107
}

.blocoJogada small{
display:block;
font-size:8px;
font-weight:900;
color:#888
}

.blocoJogada strong{
display:block;
font-size:22px;
margin:3px 0
}

.centro2{color:#00e5ff}
.centro1{color:#ffc107}

.numerosCobertos{
font-size:11px;
font-weight:900;
color:#eee;
line-height:1.5;
padding-top:5px;
border-top:1px solid #333
}


/* RAIO X */

.raiox{
background:#101010;
border:1px solid #444;
border-radius:8px;
padding:8px
}

.rxTopo{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:5px;
margin-bottom:7px
}

.rxCard{
background:#181818;
border:1px solid #333;
border-radius:7px;
padding:6px;
text-align:center
}

.rxCard small{
display:block;
font-size:8px;
color:#888;
font-weight:900
}

.rxCard strong{
display:block;
font-size:15px;
margin-top:3px
}

.rxFamilias{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:5px;
margin-bottom:7px
}

.rxFamilia{
background:#171717;
border:1px solid #333;
border-radius:7px;
padding:6px;
text-align:center
}

.rxFamilia strong{
font-size:17px
}

.rxFamilia small{
display:block;
font-size:8px;
color:#888
}

.rxSinal{
background:#111;
border:1px solid #444;
border-radius:8px;
text-align:center;
padding:8px;
margin-bottom:8px
}

.rxSinal small{
display:block;
font-size:8px;
font-weight:900;
color:#888
}

.rxSinal strong{
display:block;
font-size:26px;
margin-top:3px
}

.rxRanking{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:4px
}

.rxNumero{
background:#181818;
border:1px solid #3c3c3c;
border-radius:7px;
text-align:center;
padding:7px 2px;
min-height:68px
}

.rxNumero strong{
display:block;
font-size:18px
}

.rxNumero small{
display:block;
font-size:8px;
color:#888;
margin-top:2px
}


/* TECLADO */

.teclado{
display:grid;
grid-template-columns:repeat(6,1fr);
gap:4px;
margin-top:7px
}

.numeroBtn{
height:40px;
border:1px solid #666;
border-radius:7px;
color:#fff;
font-weight:900;
font-size:14px
}

.zeroBtn{
grid-column:span 6
}


/* HISTÓRICO */

.historico{
display:flex;
gap:4px;
overflow-x:auto
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
font-weight:900
}

.janelaAtual{
border:2px solid #00e5ff
}

.ultimo{
box-shadow:0 0 8px #00e5ff
}

@media(max-width:600px){

.rxTopo{
grid-template-columns:repeat(2,1fr)
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
<span class="corRegiao" style="background:#9bea2c"></span>
Zero
</div>

<div class="itemRegiao">
<span class="corRegiao" style="background:#8a20d4"></span>
Voisins
</div>

<div class="itemRegiao">
<span class="corRegiao" style="background:#176436"></span>
Orphelins
</div>

<div class="itemRegiao">
<span class="corRegiao" style="background:#29499b"></span>
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
<span id="qtdHistorico">0</span>

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

const jogadaArea =
document.getElementById(
    "jogadaArea"
);

const raioX =
document.getElementById(
    "raioX"
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
   PAINÉIS
========================================================= */

function configurarPainelOculto(
    botaoId,
    conteudoId
){

    const botao =
    document.getElementById(
        botaoId
    );

    const conteudo =
    document.getElementById(
        conteudoId
    );

    botao.onclick =
    function(){

        const aberto =
        conteudo.style.display ===
        "block";

        conteudo.style.display =
        aberto
        ?
        "none"
        :
        "block";

        botao.textContent =
        aberto
        ?
        "Mostrar"
        :
        "Ocultar";

    };

}


configurarPainelOculto(
    "btnMostrarJogada",
    "conteudoJogada"
);

configurarPainelOculto(
    "btnMostrarRaioX",
    "conteudoRaioX"
);

configurarPainelOculto(
    "btnMostrarHistorico",
    "conteudoHistorico"
);


/* =========================================================
   RX 4 / 5 / 6
========================================================= */

function atualizarBotoesRX(){

    [4,5,6]
    .forEach(function(n){

        document
        .getElementById(
            "rx"+n
        )
        .classList.toggle(
            "ativo",
            n === TAMANHO_RX
        );

    });

}


document.getElementById("rx4").onclick =
() => alterarTamanhoRaioX(4);

document.getElementById("rx5").onclick =
() => alterarTamanhoRaioX(5);

document.getElementById("rx6").onclick =
() => alterarTamanhoRaioX(6);


/* =========================================================
   TECLADO
========================================================= */

for(
    let numero=1;
    numero<=36;
    numero++
){

    const botao =
    document.createElement(
        "button"
    );

    const cor =
    corNumeroRoleta(
        numero
    );

    botao.className =
    "numeroBtn";

    botao.textContent =
    numero;

    botao.style.background =
    cor.fundo;

    botao.onclick =
    () => adicionarNumero(numero);

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
() => adicionarNumero(0);

teclado.appendChild(zero);


/* =========================================================
   BOTÕES
========================================================= */

document
.getElementById(
    "btnInserir"
)
.onclick =
inserirHistorico;


document
.getElementById(
    "btnApagarUltimo"
)
.onclick =
apagarUltimo;


document
.getElementById(
    "btnApagarTudo"
)
.onclick =
apagarTudo;


/* =========================================================
   RENDER ÚLTIMOS 14
========================================================= */

function renderJanela(){

    const analise =
    analisarJanela14();

    qtdJanela.textContent =
    analise.janela.length;


    linhaCores.innerHTML =

    analise.janela
    .map(function(numero){

        const cor =
        corNumeroRoleta(numero);

        return (
            '<div class="numeroRoleta" ' +
            'style="background:' +
            cor.fundo +
            '">' +
            numero +
            '</div>'
        );

    })
    .join("");


    linhaRegioes.innerHTML =

    analise.janela
    .map(function(numero){

        const regiao =
        regiaoDoNumero(numero);

        return (
            '<div class="numeroRegiao" ' +
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


    linhaIds.innerHTML =

    analise.sequencia
    .map(function(item){

        if(!item.ids.length){

            return (
                '<div class="idBox">' +
                '<span class="semID">—</span>' +
                '</div>'
            );

        }

        return (

            '<div class="idBox">' +

            item.ids
            .map(function(id){

                return (
                    '<span class="tagID" ' +
                    'style="background:' +
                    corDoId(id) +
                    '">' +
                    id +
                    '</span>'
                );

            })
            .join("") +

            '</div>'

        );

    })
    .join("");

}


/* =========================================================
   RENDER JOGADA

   NÃO MOSTRA OFFSET.
   NÃO MOSTRA TESTE.
   NÃO MOSTRA JOGADA COMPLETA.

   APENAS OS BLOCOS.
========================================================= */

function renderJogada(rx){

    const jogada =
    rx.jogada;


    if(
        !jogada ||
        jogada.blocos2.length !== 5 ||
        jogada.blocos1.length !== 1
    ){

        jogadaArea.innerHTML =
        '<div style="text-align:center;color:#777;padding:8px">' +
        'Aguardando análise.' +
        '</div>';

        return;
    }


    const html2 =
    jogada.blocos2
    .map(function(bloco){

        return (

            '<div class="blocoJogada">' +

            '<small>2 VIZINHOS DO</small>' +

            '<strong class="centro2">' +
            bloco.centro +
            '</strong>' +

            '<div class="numerosCobertos">' +

            bloco.numeros
            .join(" • ") +

            '</div>' +

            '</div>'

        );

    })
    .join("");


    const html1 =
    jogada.blocos1
    .map(function(bloco){

        return (

            '<div class="blocoJogada um">' +

            '<small>1 VIZINHO DO</small>' +

            '<strong class="centro1">' +
            bloco.centro +
            '</strong>' +

            '<div class="numerosCobertos">' +

            bloco.numeros
            .join(" • ") +

            '</div>' +

            '</div>'

        );

    })
    .join("");


    jogadaArea.innerHTML =

    '<div class="jogadaSubtitulo">' +
    '2 VIZINHOS' +
    '</div>' +

    '<div class="linhaJogadas">' +
    html2 +
    '</div>' +

    '<div class="jogadaSubtitulo">' +
    '1 VIZINHO' +
    '</div>' +

    '<div class="linhaJogadas">' +
    html1 +
    '</div>';

}


/* =========================================================
   RENDER RAIO X
========================================================= */

function renderRaioX(rx){

    if(!rx.ranking.length){

        raioX.innerHTML =
        '<div style="text-align:center;color:#777;padding:15px">' +
        'Aguardando histórico suficiente.' +
        '</div>';

        return;
    }


    const rankingHTML =
    rx.ranking
    .map(function(item,index){

        const cor =
        corFamilia(
            familiaDoId(
                item.idPrincipal
            )
        );


        let ocorrencias =
        item.ocorrencias +
        "x";


        if(
            item.tipo ===
            "ZERO26"
        ){

            ocorrencias =
            "0:" +
            item.ocorrencias0 +
            "x • 26:" +
            item.ocorrencias26 +
            "x";

        }


        return (

            '<div class="rxNumero" ' +
            'style="border-color:' +
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
            ocorrencias +
            '</small>' +

            '<small>' +
            item.origem +
            '</small>' +

            '</div>'

        );

    })
    .join("");


    let sinal =
    '<div class="rxSinal">' +
    '<small>SINAL</small>' +
    '<strong style="color:#777">—</strong>' +
    '</div>';


    if(rx.lider){

        sinal =

        '<div class="rxSinal">' +

        '<small>SINAL</small>' +

        '<strong style="color:' +
        corFamilia(
            rx.lider.familia
        ) +
        '">' +

        rx.lider.familia +

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
    '<small>ZONAS DO RX</small>' +
    '<strong>' +
    rx.zonasEncontradas +
    '</strong>' +
    '</div>' +

    '<div class="rxCard">' +
    '<small>SIMILARIDADE</small>' +
    '<strong>' +
    rx.similaridade.toFixed(1) +
    '%</strong>' +
    '</div>' +

    '</div>' +


    '<div class="rxFamilias">' +

    '<div class="rxFamilia">' +
    '<strong style="color:' +
    COR_T0 +
    '">' +
    rx.familias[0].toFixed(0) +
    '%</strong>' +
    '<small>0</small>' +
    '</div>' +

    '<div class="rxFamilia">' +
    '<strong style="color:' +
    COR_T6 +
    '">' +
    rx.familias[6].toFixed(0) +
    '%</strong>' +
    '<small>6</small>' +
    '</div>' +

    '<div class="rxFamilia">' +
    '<strong style="color:' +
    COR_T9 +
    '">' +
    rx.familias[9].toFixed(0) +
    '%</strong>' +
    '<small>9</small>' +
    '</div>' +

    '</div>' +

    sinal +

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


    const visiveis =
    historico.slice(-100);

    const offset =
    historico.length -
    visiveis.length;

    const inicioJanela =
    Math.max(
        0,
        historico.length -
        14
    );


    elementoHistorico.innerHTML =

    visiveis
    .map(function(numero,index){

        const real =
        offset +
        index;

        const cor =
        corNumeroRoleta(numero);


        return (

            '<div class="histNumero ' +

            (
                real >= inicioJanela
                ?
                'janelaAtual '
                :
                ''
            ) +

            (
                real ===
                historico.length-1
                ?
                'ultimo'
                :
                ''
            ) +

            '" style="background:' +
            cor.fundo +
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
   CACHE
========================================================= */

let cacheChave = "";
let cacheAnalise = null;


function invalidarCache(){

    cacheChave = "";
    cacheAnalise = null;

}


function assinaturaHistorico(){

    let hash = 2166136261;

    for(
        let i=0;
        i<historico.length;
        i++
    ){

        hash ^= (
            historico[i] +
            i
        );

        hash =
        Math.imul(
            hash,
            16777619
        );

    }

    return hash >>> 0;
}


function obterAnaliseAtual(){

    const chave =
    TAMANHO_RX +
    "|" +
    historico.length +
    "|" +
    assinaturaHistorico();


    if(
        cacheAnalise &&
        cacheChave === chave
    ){

        return cacheAnalise;

    }


    cacheAnalise =
    analisarRaioX();

    cacheChave =
    chave;

    return cacheAnalise;
}


/* =========================================================
   RENDER
========================================================= */

function render(){

    renderJanela();

    renderHistorico();

    atualizarBotoesRX();


    try{

        const rx =
        obterAnaliseAtual();


        /*
          Mesmo que uma parte dê problema,
          o Raio X não deve desaparecer.
        */

        try{
            renderRaioX(rx);
        }
        catch(e){
            console.error(
                "Erro RX:",
                e
            );
        }


        try{
            renderJogada(rx);
        }
        catch(e){

            console.error(
                "Erro Jogada:",
                e
            );

            jogadaArea.innerHTML =
            "Erro ao montar jogada.";

        }


    }catch(e){

        console.error(
            "Erro geral:",
            e
        );

        statusArea.textContent =
        "Erro: " +
        (
            e.message ||
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
