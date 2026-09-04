(function () {

  "use strict";

  // =========================================================
  // CONFIGURAÇÃO
  // =========================================================

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];

  const TAMANHO_JANELA = 14;

  const STORAGE_KEY =
    "ANALISADOR_TRIOS_0369_1V_J14_V1";

  const trios = [

    {
      nome:"0–3–6",
      terminais:[0,3,6]
    },

    {
      nome:"0–3–9",
      terminais:[0,3,9]
    },

    {
      nome:"0–6–9",
      terminais:[0,6,9]
    },

    {
      nome:"3–6–9",
      terminais:[3,6,9]
    }

  ];

  const numerosVermelhos = new Set([
    1,3,5,7,9,
    12,14,16,18,
    19,21,23,25,27,
    30,32,34,36
  ]);

  let historico =
    carregarHistorico();


  // =========================================================
  // TERMINAL
  // =========================================================

  function terminal(numero){

    return numero % 10;
  }


  // =========================================================
  // ARMAZENAMENTO
  // =========================================================

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
        .filter(numero =>
          Number.isInteger(numero) &&
          numero >= 0 &&
          numero <= 36
        )
        .slice(-300);

    }catch(erro){

      return [];
    }
  }


  function salvarHistorico(){

    try{

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(historico)
      );

    }catch(erro){

      console.error(
        "Erro ao salvar histórico.",
        erro
      );
    }
  }


  // =========================================================
  // VIZINHOS NA RACE
  // =========================================================

  function vizinhos(
    numero,
    quantidade = 1
  ){

    const indice =
      track.indexOf(numero);

    if(indice === -1){
      return [];
    }

    const resultado =
      [numero];

    for(
      let distancia = 1;
      distancia <= quantidade;
      distancia++
    ){

      resultado.push(
        track[
          (
            indice -
            distancia +
            track.length
          ) %
          track.length
        ]
      );

      resultado.push(
        track[
          (
            indice +
            distancia
          ) %
          track.length
        ]
      );
    }

    return resultado;
  }


  // =========================================================
  // COBERTURA DE UM TERMINAL COM 1 VIZINHO
  // =========================================================

  function coberturaTerminal1V(
    numeroTerminal
  ){

    const cobertura =
      new Set();

    track.forEach(numero => {

      if(
        terminal(numero) ===
        numeroTerminal
      ){

        vizinhos(numero,1)
          .forEach(numeroCoberto => {

            cobertura.add(
              numeroCoberto
            );
          });
      }
    });

    return cobertura;
  }


  // =========================================================
  // COBERTURA DE UM TRIO
  // =========================================================

  function coberturaTrio1V(
    terminaisTrio
  ){

    const cobertura =
      new Set();

    terminaisTrio
      .forEach(t => {

        coberturaTerminal1V(t)
          .forEach(numero => {

            cobertura.add(numero);
          });
      });

    return cobertura;
  }


  // =========================================================
  // FORÇA INDIVIDUAL DOS TERMINAIS
  // =========================================================

  function analisarForcaDosTerminais(
    terminaisTrio,
    janela
  ){

    const analises =
      terminaisTrio.map(t => {

        const cobertura =
          coberturaTerminal1V(t);

        const acertos =
          janela.filter(numero =>
            cobertura.has(numero)
          );

        return {

          terminal:t,

          quantidade:
            acertos.length,

          acertos

        };
      });


    const quantidades =
      analises.map(item =>
        item.quantidade
      );


    const maximo =
      Math.max(...quantidades);

    const minimo =
      Math.min(...quantidades);


    analises.forEach(item => {

      /*
        TODOS EMPATADOS
      */

      if(maximo === minimo){

        item.nivel =
          "medio";

        item.cor =
          "#ffc107";

        return;
      }


      /*
        MAIS QUENTE
      */

      if(
        item.quantidade ===
        maximo
      ){

        item.nivel =
          "quente";

        item.cor =
          "#00e676";

        return;
      }


      /*
        MAIS FRIO
      */

      if(
        item.quantidade ===
        minimo
      ){

        item.nivel =
          "frio";

        item.cor =
          "#2196f3";

        return;
      }


      /*
        INTERMEDIÁRIO
      */

      item.nivel =
        "medio";

      item.cor =
        "#ffc107";

    });


    return analises;
  }


  // =========================================================
  // ANÁLISE DOS ÚLTIMOS 14
  // =========================================================

  function analisarJanela14(){

    const janela =
      historico.slice(
        -TAMANHO_JANELA
      );


    const resultados =
      trios.map(trio => {

        const cobertura =
          coberturaTrio1V(
            trio.terminais
          );


        const acertos = [];

        const quebras = [];


        janela.forEach(numero => {

          if(
            cobertura.has(numero)
          ){

            acertos.push(numero);

          }else{

            quebras.push(numero);
          }
        });


        const percentual =
          janela.length
            ? (
                acertos.length /
                janela.length
              ) * 100
            : 0;


        const forcaTerminais =
          analisarForcaDosTerminais(
            trio.terminais,
            janela
          );


        return {

          nome:
            trio.nome,

          terminais:
            trio.terminais,

          cobertura,

          acertos,

          quebras,

          quantidadeAcertos:
            acertos.length,

          quantidadeQuebras:
            quebras.length,

          percentual,

          forcaTerminais

        };
      });


    resultados.sort((a,b) => {

      /*
        PRIMEIRO:
        MAIOR NÚMERO DE ACERTOS
      */

      if(
        b.quantidadeAcertos !==
        a.quantidadeAcertos
      ){

        return (
          b.quantidadeAcertos -
          a.quantidadeAcertos
        );
      }


      /*
        SEGUNDO:
        MENOR NÚMERO DE QUEBRAS
      */

      if(
        a.quantidadeQuebras !==
        b.quantidadeQuebras
      ){

        return (
          a.quantidadeQuebras -
          b.quantidadeQuebras
        );
      }


      return 0;
    });


    return {

      janela,

      resultados,

      melhor:
        resultados[0] || null

    };
  }


  // =========================================================
  // EXTRAIR NÚMEROS DO TEXTO
  // =========================================================

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
      .filter(numero =>
        numero >= 0 &&
        numero <= 36
      )
      .slice(-300);
  }


  // =========================================================
  // INSERIR HISTÓRICO
  // =========================================================

  function inserirHistorico(){

    const entrada =
      document.getElementById(
        "entradaHistorico"
      );


    const numeros =
      extrairNumeros(
        entrada.value
      );


    if(!numeros.length){

      statusArea.textContent =
        "Nenhum número válido encontrado.";

      statusArea.style.color =
        "#ff5252";

      return;
    }


    historico =
      numeros.slice(-300);


    salvarHistorico();


    entrada.value = "";


    statusArea.textContent =
      `${historico.length} números carregados.`;

    statusArea.style.color =
      "#00e676";


    render();
  }


  // =========================================================
  // ADICIONAR NÚMERO
  // =========================================================

  function adicionarNumero(numero){

    historico.push(numero);


    if(
      historico.length > 300
    ){

      historico.shift();
    }


    salvarHistorico();


    statusArea.textContent =
      `Número ${numero} inserido.`;

    statusArea.style.color =
      "#00e5ff";


    render();
  }


  // =========================================================
  // APAGAR ÚLTIMO
  // =========================================================

  function apagarUltimo(){

    if(!historico.length){
      return;
    }


    const apagado =
      historico.pop();


    salvarHistorico();


    statusArea.textContent =
      `Número ${apagado} apagado.`;

    statusArea.style.color =
      "#ffc107";


    render();
  }


  // =========================================================
  // APAGAR TUDO
  // =========================================================

  function apagarTudo(){

    const confirmar =
      window.confirm(
        "Apagar todo o histórico?"
      );


    if(!confirmar){
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


  // =========================================================
  // COR DA ROLETA
  // =========================================================

  function corNumeroRoleta(
    numero
  ){

    if(numero === 0){

      return {

        fundo:"#07874b",

        texto:"#ffffff"

      };
    }


    if(
      numerosVermelhos.has(
        numero
      )
    ){

      return {

        fundo:"#c6283d",

        texto:"#ffffff"

      };
    }


    return {

      fundo:"#181818",

      texto:"#ffffff"

    };
  }


  // =========================================================
  // INTERFACE
  // =========================================================

  document.body.style.margin =
    "0";

  document.body.style.background =
    "#101010";

  document.body.style.color =
    "#ffffff";

  document.body.style.fontFamily =
    "Arial,sans-serif";


  document.body.innerHTML = `

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
      width:100%;
      max-width:820px;
      margin:auto;
      padding:8px;
    }

    h2{
      text-align:center;
      margin:5px 0 10px;
      font-size:21px;
    }

    .painel{
      background:#1d1d1f;
      border:1px solid #444;
      border-radius:10px;
      padding:9px;
      margin-bottom:8px;
    }

    .tituloPainel{
      color:#aaa;
      font-size:12px;
      font-weight:900;
      margin-bottom:7px;
    }

    textarea{
      width:100%;
      min-height:75px;
      padding:8px;
      background:#111;
      color:#fff;
      border:1px solid #555;
      border-radius:7px;
      font-size:14px;
    }

    .acoes{
      display:flex;
      gap:6px;
      flex-wrap:wrap;
      margin-top:7px;
    }

    .btn{
      padding:8px 11px;
      background:#333;
      color:#fff;
      border:1px solid #555;
      border-radius:7px;
      font-weight:900;
    }

    .verde{
      background:#146238;
    }

    .vermelho{
      background:#762832;
    }


    /* ================= MELHOR TRIO ================= */

    .melhorTrio{
      background:#111;
      border:2px solid #00e676;
      border-radius:10px;
      padding:10px;
    }

    .melhorTitulo{
      text-align:center;
      color:#aaa;
      font-size:12px;
      font-weight:900;
    }

    .nomeTrio{
      text-align:center;
      font-size:28px;
      font-weight:900;
      margin:4px 0;
    }

    .placar{
      text-align:center;
      font-size:18px;
      font-weight:900;
      margin-bottom:9px;
    }

    .terminaisTrio{
      display:flex;
      justify-content:center;
      gap:9px;
      margin-top:7px;
    }

    .terminalTrio{
      min-width:70px;
      height:55px;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      border-radius:9px;
      color:#fff;
      font-size:21px;
      font-weight:900;
      border:2px solid rgba(255,255,255,.55);
    }

    .terminalQtd{
      font-size:11px;
      margin-top:2px;
      opacity:.9;
    }


    /* ================= BARRA ================= */

    .barra{
      width:100%;
      height:10px;
      margin-top:7px;
      background:#333;
      border-radius:10px;
      overflow:hidden;
    }

    .barraInterna{
      height:100%;
      background:
        linear-gradient(
          90deg,
          #00bcd4,
          #00e676
        );
    }


    /* ================= TRIOS ================= */

    .listaTrios{
      display:grid;
      grid-template-columns:
        repeat(2,1fr);
      gap:7px;
    }

    .cardTrio{
      background:#111;
      border:1px solid #444;
      border-radius:8px;
      padding:8px;
    }

    .cardTrio.primeiro{
      border-color:#00e676;
    }

    .trioLinha{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:5px;
    }

    .trioNome{
      font-size:18px;
      font-weight:900;
    }

    .trioResultado{
      font-weight:900;
    }

    .miniTerminais{
      display:flex;
      gap:4px;
      margin-top:6px;
    }

    .miniTerminal{
      flex:1;
      min-height:28px;
      border-radius:5px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-size:13px;
      font-weight:900;
    }


    /* ================= JANELA ================= */

    .janela14{
      display:flex;
      gap:5px;
      overflow-x:auto;
      padding-bottom:3px;
    }

    .numeroJanela{
      min-width:37px;
      height:37px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      border:2px solid #00e5ff;
      font-size:14px;
      font-weight:900;
    }

    .numeroJanela.quebra{
      opacity:.35;
      border-color:#ff5252;
    }


    /* ================= TECLADO ================= */

    .teclado{
      display:grid;
      grid-template-columns:
        repeat(6,1fr);
      gap:4px;
    }

    .numeroBtn{
      min-height:40px;
      border:1px solid #666;
      border-radius:7px;
      font-size:15px;
      font-weight:900;
      color:#fff;
    }

    .numeroBtn:active{
      transform:scale(.96);
    }

    .zeroBtn{
      grid-column:span 6;
    }


    /* ================= HISTÓRICO ================= */

    .historico{
      display:flex;
      gap:4px;
      overflow-x:auto;
      min-height:34px;
    }

    .histNumero{
      min-width:31px;
      height:31px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:6px;
      font-size:13px;
      font-weight:900;
      border:1px solid #555;
    }

    .histNumero.janelaAtual{
      border:2px solid #00e5ff;
    }

    .histNumero.ultimo{
      box-shadow:
        0 0 8px #00e5ff;
    }

    .status{
      margin-top:7px;
      color:#aaa;
      font-size:12px;
      font-weight:900;
    }

    .legenda{
      display:flex;
      justify-content:center;
      gap:12px;
      flex-wrap:wrap;
      margin-top:8px;
      color:#aaa;
      font-size:11px;
    }

    .legendaItem{
      display:flex;
      align-items:center;
      gap:4px;
    }

    .legendaCor{
      width:12px;
      height:12px;
      border-radius:3px;
    }


    @media(max-width:600px){

      .app{
        padding:5px;
      }

      .painel{
        padding:7px;
      }

      .listaTrios{
        grid-template-columns:1fr 1fr;
        gap:5px;
      }

      .terminalTrio{
        min-width:62px;
        height:51px;
      }

      .teclado{
        gap:3px;
      }

      .numeroBtn{
        min-height:38px;
      }
    }

  </style>


  <main class="app">

    <h2>
      Análise 0 • 3 • 6 • 9
    </h2>


    <!-- ENTRADA -->

    <section class="painel">

      <textarea
        id="entradaHistorico"
        placeholder="Cole o histórico do mais antigo para o mais recente..."
      ></textarea>

      <div class="acoes">

        <button
          id="btnInserir"
          class="btn verde"
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
          class="btn vermelho"
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


    <!-- MELHOR TRIO -->

    <section class="painel">

      <div
        id="melhorTrio"
        class="melhorTrio"
      ></div>

    </section>


    <!-- TODOS OS TRIOS -->

    <section class="painel">

      <div class="tituloPainel">
        COMPARAÇÃO DOS 4 TRIOS — JANELA 14 / 1V
      </div>

      <div
        id="listaTrios"
        class="listaTrios"
      ></div>

    </section>


    <!-- JANELA 14 -->

    <section class="painel">

      <div class="tituloPainel">

        ÚLTIMOS
        <span id="qtdJanela">0</span>/14

      </div>

      <div
        id="janela14"
        class="janela14"
      ></div>

    </section>


    <!-- TECLADO -->

    <section class="painel">

      <div class="tituloPainel">
        TECLADO 0–36
      </div>

      <div
        id="teclado"
        class="teclado"
      ></div>

    </section>


    <!-- HISTÓRICO -->

    <section class="painel">

      <div class="tituloPainel">

        HISTÓRICO —
        <span id="qtdHistorico">
          0
        </span>

      </div>

      <div
        id="historico"
        class="historico"
      ></div>

    </section>

  </main>
  `;


  // =========================================================
  // ELEMENTOS
  // =========================================================

  const statusArea =
    document.getElementById(
      "statusArea"
    );

  const elementoMelhorTrio =
    document.getElementById(
      "melhorTrio"
    );

  const elementoListaTrios =
    document.getElementById(
      "listaTrios"
    );

  const elementoJanela =
    document.getElementById(
      "janela14"
    );

  const elementoTeclado =
    document.getElementById(
      "teclado"
    );

  const elementoHistorico =
    document.getElementById(
      "historico"
    );

  const elementoQtdJanela =
    document.getElementById(
      "qtdJanela"
    );

  const elementoQtdHistorico =
    document.getElementById(
      "qtdHistorico"
    );


  // =========================================================
  // TECLADO
  // =========================================================

  for(
    let numero = 1;
    numero <= 36;
    numero++
  ){

    const cores =
      corNumeroRoleta(numero);


    const botao =
      document.createElement(
        "button"
      );


    botao.className =
      "numeroBtn";


    botao.textContent =
      numero;


    botao.style.background =
      cores.fundo;


    botao.style.color =
      cores.texto;


    botao.onclick = () => {

      adicionarNumero(numero);

    };


    elementoTeclado
      .appendChild(botao);
  }


  const botaoZero =
    document.createElement(
      "button"
    );


  botaoZero.className =
    "numeroBtn zeroBtn";


  botaoZero.textContent =
    "0";


  botaoZero.style.background =
    "#07874b";


  botaoZero.onclick = () => {

    adicionarNumero(0);

  };


  elementoTeclado
    .appendChild(botaoZero);


  // =========================================================
  // EVENTOS
  // =========================================================

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


  // =========================================================
  // RENDER MELHOR TRIO
  // =========================================================

  function renderMelhorTrio(
    analise
  ){

    const melhor =
      analise.melhor;


    if(
      !melhor ||
      !analise.janela.length
    ){

      elementoMelhorTrio.innerHTML = `

        <div class="melhorTitulo">
          MELHOR TRIO
        </div>

        <div class="nomeTrio">
          —
        </div>

        <div style="
          text-align:center;
          color:#888;
        ">
          Insira números para iniciar.
        </div>
      `;

      return;
    }


    const percentual =
      Math.round(
        melhor.percentual
      );


    const terminaisHTML =
      melhor.forcaTerminais
        .map(item => `

          <div
            class="terminalTrio"
            style="
              background:${item.cor}
            "
          >

            T${item.terminal}

            <div class="terminalQtd">
              ${item.quantidade}/${analise.janela.length}
            </div>

          </div>

        `)
        .join("");


    elementoMelhorTrio.innerHTML = `

      <div class="melhorTitulo">
        MELHOR TRIO — 1 VIZINHO
      </div>

      <div class="nomeTrio">
        ${melhor.nome}
      </div>

      <div class="placar">

        ${melhor.quantidadeAcertos}
        /
        ${analise.janela.length}

        &nbsp;•&nbsp;

        ${percentual}%

      </div>


      <div class="terminaisTrio">

        ${terminaisHTML}

      </div>


      <div class="legenda">

        <div class="legendaItem">

          <span
            class="legendaCor"
            style="background:#00e676"
          ></span>

          Mais quente

        </div>

        <div class="legendaItem">

          <span
            class="legendaCor"
            style="background:#ffc107"
          ></span>

          Intermediário

        </div>

        <div class="legendaItem">

          <span
            class="legendaCor"
            style="background:#2196f3"
          ></span>

          Mais frio

        </div>

      </div>


      <div class="barra">

        <div
          class="barraInterna"
          style="
            width:${percentual}%
          "
        ></div>

      </div>
    `;
  }


  // =========================================================
  // RENDER TODOS OS TRIOS
  // =========================================================

  function renderTrios(
    analise
  ){

    if(!analise.janela.length){

      elementoListaTrios.innerHTML = `

        <span style="
          color:#888;
          font-size:12px;
        ">
          Aguardando números.
        </span>
      `;

      return;
    }


    elementoListaTrios.innerHTML =
      analise.resultados
        .map(
          (
            resultado,
            indice
          ) => {


            const percentual =
              Math.round(
                resultado.percentual
              );


            const mini =
              resultado
                .forcaTerminais
                .map(item => `

                  <div
                    class="miniTerminal"
                    style="
                      background:${item.cor}
                    "
                  >

                    T${item.terminal}

                  </div>

                `)
                .join("");


            return `

              <div
                class="
                  cardTrio
                  ${
                    indice === 0
                      ? "primeiro"
                      : ""
                  }
                "
              >

                <div class="trioLinha">

                  <span class="trioNome">
                    ${resultado.nome}
                  </span>

                  <span class="trioResultado">

                    ${resultado.quantidadeAcertos}
                    /
                    ${analise.janela.length}

                  </span>

                </div>


                <div
                  style="
                    color:#aaa;
                    font-size:11px;
                    margin-top:3px;
                  "
                >

                  ${percentual}%
                  •
                  ${resultado.quantidadeQuebras}
                  quebra(s)

                </div>


                <div class="miniTerminais">

                  ${mini}

                </div>

              </div>
            `;

          }
        )
        .join("");
  }


  // =========================================================
  // RENDER JANELA 14
  // =========================================================

  function renderJanela(
    analise
  ){

    elementoQtdJanela.textContent =
      analise.janela.length;


    if(!analise.janela.length){

      elementoJanela.innerHTML = `

        <span style="
          color:#888;
          font-size:12px;
        ">
          Sem números.
        </span>
      `;

      return;
    }


    const melhor =
      analise.melhor;


    elementoJanela.innerHTML =
      analise.janela
        .map(numero => {


          const cores =
            corNumeroRoleta(numero);


          const acertou =
            melhor
              ? melhor.cobertura.has(
                  numero
                )
              : false;


          return `

            <div
              class="
                numeroJanela
                ${
                  acertou
                    ? ""
                    : "quebra"
                }
              "
              style="
                background:${cores.fundo};
                color:${cores.texto};
              "
            >
              ${numero}
            </div>

          `;

        })
        .join("");
  }


  // =========================================================
  // RENDER HISTÓRICO
  // =========================================================

  function renderHistorico(){

    elementoQtdHistorico.textContent =
      historico.length;


    if(!historico.length){

      elementoHistorico.innerHTML = `

        <span style="
          color:#888;
          font-size:12px;
        ">
          Histórico vazio.
        </span>
      `;

      return;
    }


    const inicioJanela =
      Math.max(
        0,
        historico.length -
        TAMANHO_JANELA
      );


    const visiveis =
      historico.slice(-60);


    const offset =
      historico.length -
      visiveis.length;


    elementoHistorico.innerHTML =
      visiveis
        .map((numero,index) => {

          const indiceReal =
            offset + index;


          const cores =
            corNumeroRoleta(numero);


          const dentroJanela =
            indiceReal >=
            inicioJanela;


          const ultimo =
            indiceReal ===
            historico.length - 1;


          return `

            <div
              class="
                histNumero
                ${
                  dentroJanela
                    ? "janelaAtual"
                    : ""
                }
                ${
                  ultimo
                    ? "ultimo"
                    : ""
                }
              "
              style="
                background:${cores.fundo};
                color:${cores.texto};
              "
            >

              ${numero}

            </div>

          `;

        })
        .join("");


    elementoHistorico.scrollLeft =
      elementoHistorico.scrollWidth;
  }


  // =========================================================
  // RENDER PRINCIPAL
  // =========================================================

  function render(){

    const analise =
      analisarJanela14();


    renderMelhorTrio(
      analise
    );


    renderTrios(
      analise
    );


    renderJanela(
      analise
    );


    renderHistorico();
  }


  // =========================================================
  // INICIAR
  // =========================================================

  render();

})();
