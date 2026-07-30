(function () {

  // ================= CONFIGURAÇÃO =================

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];

  const terminal = numero => numero % 10;

  const paresFixos = [
    [1,5],
    [3,9],
    [4,8],
    [0,7],
    [6,2],
    [3,2]
  ];

  const corTerminal = {
    0:"#ff5252",
    1:"#ff9800",
    2:"#ffc107",
    3:"#00e676",
    4:"#00bcd4",
    5:"#2196f3",
    6:"#9c27b0",
    7:"#e91e63",
    8:"#8bc34a",
    9:"#ff00ff"
  };

  const numerosVermelhos = new Set([
    1,3,5,7,9,12,14,16,18,
    19,21,23,25,27,30,32,34,36
  ]);

  const STORAGE_KEY = "CSM_GATILHO_TERMINAL_V1";

  // O histórico fica do mais antigo para o mais recente.
  let historico = carregarHistorico();

  // O último número do histórico define o terminal gatilho.
  let numeroGatilho = historico.length
    ? historico[historico.length - 1]
    : null;

  // ================= ARMAZENAMENTO =================

  function carregarHistorico(){

    try{

      const salvo = localStorage.getItem(STORAGE_KEY);

      if(!salvo){
        return [];
      }

      const dados = JSON.parse(salvo);

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
        "Não foi possível salvar o histórico.",
        erro
      );
    }
  }

  // ================= VIZINHOS DA ROLETA =================

  function vizinhos(numero, quantidade){

    const indice = track.indexOf(numero);

    if(indice === -1){
      return [];
    }

    const resultado = [numero];

    for(
      let distancia = 1;
      distancia <= quantidade;
      distancia++
    ){

      resultado.push(
        track[
          (indice - distancia + 37) % 37
        ]
      );

      resultado.push(
        track[
          (indice + distancia) % 37
        ]
      );
    }

    return resultado;
  }

  function coberturaTerminal(
    numeroTerminal,
    quantidadeVizinhos
  ){

    const cobertura = new Set();

    track.forEach(numero => {

      if(terminal(numero) === numeroTerminal){

        vizinhos(numero, quantidadeVizinhos)
          .forEach(vizinho => {
            cobertura.add(vizinho);
          });
      }
    });

    return cobertura;
  }

  // ================= OCORRÊNCIAS DO GATILHO =================

  function encontrarOcorrencias(){

    if(numeroGatilho === null){
      return [];
    }

    const terminalGatilho =
      terminal(numeroGatilho);

    const ocorrencias = [];

    /*
      Percorre até o penúltimo número porque
      cada gatilho precisa ter um número seguinte.
    */

    for(
      let i = 0;
      i < historico.length - 1;
      i++
    ){

      const numeroAtual = historico[i];
      const numeroSeguinte = historico[i + 1];

      if(
        terminal(numeroAtual) ===
        terminalGatilho
      ){

        ocorrencias.push({
          gatilho: numeroAtual,
          proximo: numeroSeguinte,
          indice: i
        });
      }
    }

    return ocorrencias;
  }

  // ================= ANÁLISE DOS PARES FIXOS =================

  function analisarConfiguracao(
    par,
    vizinhosPrimeiro,
    vizinhosSegundo
  ){

    const coberturaPrimeiro =
      coberturaTerminal(
        par[0],
        vizinhosPrimeiro
      );

    const coberturaSegundo =
      coberturaTerminal(
        par[1],
        vizinhosSegundo
      );

    const coberturaTotal = new Set([
      ...coberturaPrimeiro,
      ...coberturaSegundo
    ]);

    const ocorrencias =
      encontrarOcorrencias();

    const acertos = [];
    const quebras = [];

    ocorrencias.forEach(item => {

      if(
        coberturaTotal.has(item.proximo)
      ){

        acertos.push(item);

      }else{

        quebras.push(item);
      }
    });

    const total = ocorrencias.length;

    const percentual =
      total > 0
        ? (acertos.length / total) * 100
        : 0;

    return {
      par,
      vizinhosPrimeiro,
      vizinhosSegundo,
      coberturaTotal,
      acertos,
      quebras,
      total,
      percentual
    };
  }

  function melhorConfiguracaoDoPar(par){

    /*
      O par é testado das duas formas:

      Primeiro terminal com 2 vizinhos
      Segundo terminal com 1 vizinho

      E depois invertido.
    */

    const configuracoes = [
      analisarConfiguracao(par,2,1),
      analisarConfiguracao(par,1,2)
    ];

    configuracoes.sort((a,b) => {

      if(b.percentual !== a.percentual){
        return b.percentual - a.percentual;
      }

      if(b.acertos.length !== a.acertos.length){
        return b.acertos.length - a.acertos.length;
      }

      return a.quebras.length -
             b.quebras.length;
    });

    return configuracoes[0];
  }

  function encontrarMelhorPar(){

    const resultados =
      paresFixos.map(melhorConfiguracaoDoPar);

    resultados.sort((a,b) => {

      if(b.percentual !== a.percentual){
        return b.percentual - a.percentual;
      }

      if(b.acertos.length !== a.acertos.length){
        return b.acertos.length - a.acertos.length;
      }

      return a.quebras.length -
             b.quebras.length;
    });

    return resultados[0] || null;
  }

  // ================= HISTÓRICO =================

  function extrairNumeros(texto){

    const encontrados = texto.match(
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

  function inserirHistorico(){

    const texto =
      document
        .getElementById("entradaHistorico")
        .value;

    const numeros =
      extrairNumeros(texto);

    if(!numeros.length){

      statusArea.textContent =
        "Nenhum número válido encontrado.";

      statusArea.style.color =
        "#ff5252";

      return;
    }

    historico = numeros.slice(-300);

    numeroGatilho =
      historico[historico.length - 1];

    salvarHistorico();

    document
      .getElementById("entradaHistorico")
      .value = "";

    statusArea.textContent =
      `${historico.length} números carregados. ` +
      `O último número, ${numeroGatilho}, ` +
      `definiu o terminal T${terminal(numeroGatilho)} como gatilho.`;

    statusArea.style.color =
      "#00e676";

    render();
  }

  function adicionarNumero(numero){

    historico.push(numero);

    if(historico.length > 300){
      historico.shift();
    }

    /*
      O número clicado passa imediatamente
      a ser o novo gatilho.
    */

    numeroGatilho = numero;

    salvarHistorico();

    statusArea.textContent =
      `Número ${numero} inserido. ` +
      `Agora o gatilho é o terminal T${terminal(numero)}.`;

    statusArea.style.color =
      "#00e5ff";

    render();
  }

  function apagarUltimo(){

    if(!historico.length){
      return;
    }

    historico.pop();

    numeroGatilho =
      historico.length
        ? historico[historico.length - 1]
        : null;

    salvarHistorico();

    statusArea.textContent =
      numeroGatilho === null
        ? "Histórico vazio."
        : `Último número apagado. ` +
          `O gatilho voltou a ser ${numeroGatilho}, ` +
          `terminal T${terminal(numeroGatilho)}.`;

    statusArea.style.color =
      "#ffc107";

    render();
  }

  function apagarTudo(){

    const confirmar = window.confirm(
      "Apagar todo o histórico?"
    );

    if(!confirmar){
      return;
    }

    historico = [];
    numeroGatilho = null;

    salvarHistorico();

    statusArea.textContent =
      "Histórico apagado.";

    statusArea.style.color =
      "#ff5252";

    render();
  }

  // ================= COR DA ROLETA =================

  function corNumeroRoleta(numero){

    if(numero === 0){

      return {
        fundo:"#f5f5f5",
        texto:"#8d1431"
      };
    }

    if(numerosVermelhos.has(numero)){

      return {
        fundo:"#ef3852",
        texto:"#ffffff"
      };
    }

    return {
      fundo:"#262223",
      texto:"#ffffff"
    };
  }

  // ================= INTERFACE =================

  document.body.style.margin = "0";
  document.body.style.background = "#111";
  document.body.style.color = "#fff";
  document.body.style.fontFamily =
    "Arial, sans-serif";

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
        max-width:1050px;
        margin:auto;
        padding:12px;
      }

      .painel{
        background:#1d1d1f;
        border:1px solid #444;
        border-radius:10px;
        padding:10px;
        margin-bottom:10px;
      }

      textarea{
        width:100%;
        min-height:105px;
        padding:10px;
        background:#222;
        color:#fff;
        border:1px solid #555;
        border-radius:8px;
        font-size:15px;
      }

      .linha{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        align-items:center;
      }

      .btn{
        padding:9px 12px;
        background:#333;
        color:#fff;
        border:1px solid #555;
        border-radius:7px;
        font-weight:800;
      }

      .btn-verde{
        background:#146238;
      }

      .btn-vermelho{
        background:#70242d;
      }

      .resumo{
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:8px;
      }

      .card{
        background:#272729;
        border:1px solid #444;
        border-radius:9px;
        padding:10px;
        min-height:96px;
      }

      .label{
        color:#aaa;
        font-size:12px;
        margin-bottom:6px;
      }

      .valor{
        font-size:22px;
        font-weight:900;
      }

      .terminal{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:50px;
        height:42px;
        margin-right:6px;
        border-radius:8px;
        color:#fff;
        font-size:20px;
        font-weight:900;
        border:2px solid rgba(255,255,255,.6);
      }

      .barra{
        height:12px;
        background:#3a3a3a;
        border-radius:8px;
        overflow:hidden;
        margin-top:8px;
      }

      .barra-interna{
        height:100%;
        width:0%;
        background:linear-gradient(
          90deg,
          #00e5ff,
          #00e676
        );
      }

      .quebras{
        display:flex;
        flex-wrap:wrap;
        gap:7px;
        margin-top:8px;
      }

      .quebra{
        padding:7px 9px;
        background:#5b222a;
        border:1px solid #a04754;
        border-radius:7px;
        font-size:14px;
        font-weight:900;
      }

      .teclado{
        display:grid;
        grid-template-columns:repeat(9,1fr);
        gap:6px;
      }

      .numero-btn{
        min-height:44px;
        border:1px solid #555;
        border-radius:7px;
        font-size:16px;
        font-weight:900;
      }

      .timeline{
        font-size:17px;
        font-weight:800;
        line-height:1.9;
        word-break:break-word;
      }

      .historico{
        display:grid;
        grid-template-columns:repeat(8,1fr);
        gap:7px;
      }

      .historico-item{
        min-height:40px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:7px;
        border:1px solid #555;
        font-weight:900;
      }

      .ocorrencias{
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(95px,1fr));
        gap:6px;
      }

      .ocorrencia{
        padding:7px;
        border-radius:7px;
        background:#262626;
        border:1px solid #444;
        text-align:center;
        font-size:13px;
      }

      .acerto{
        color:#00e676;
        font-weight:900;
      }

      .erro{
        color:#ff5252;
        font-weight:900;
      }

      @media(max-width:720px){

        .resumo{
          grid-template-columns:repeat(2,1fr);
        }

        .teclado{
          grid-template-columns:repeat(6,1fr);
        }

        .historico{
          grid-template-columns:repeat(6,1fr);
        }
      }

    </style>

    <div class="app">

      <h2 style="
        text-align:center;
        margin:4px 0 12px
      ">
        Análise por Terminal Gatilho
      </h2>

      <div class="painel">

        <textarea
          id="entradaHistorico"
          placeholder="Cole até 300 números do mais antigo para o mais recente."
        ></textarea>

        <div class="linha" style="margin-top:8px">

          <button
            id="btnInserirHistorico"
            class="btn btn-verde"
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
            class="btn btn-vermelho"
          >
            Apagar tudo
          </button>

        </div>

        <div
          id="statusArea"
          style="
            margin-top:8px;
            color:#aaa;
            font-size:13px;
            font-weight:800
          "
        >
          Cole o histórico ou use o teclado.
        </div>

      </div>

      <div class="painel">

        <div class="resumo">

          <div class="card">

            <div class="label">
              Último número / gatilho
            </div>

            <div
              id="gatilhoNumero"
              class="valor"
            >
              —
            </div>

          </div>

          <div class="card">

            <div class="label">
              Melhor par fixo
            </div>

            <div id="melhorPar">
              —
            </div>

          </div>

          <div class="card">

            <div class="label">
              Configuração vencedora
            </div>

            <div
              id="configuracao"
              class="valor"
              style="font-size:17px"
            >
              —
            </div>

          </div>

          <div class="card">

            <div class="label">
              Ganho nas ocorrências
            </div>

            <div
              id="percentual"
              class="valor"
            >
              0%
            </div>

            <div class="barra">

              <div
                id="barraPercentual"
                class="barra-interna"
              ></div>

            </div>

          </div>

        </div>

      </div>

      <div class="painel">

        <b>Números que foram quebra</b>

        <div
          id="listaQuebras"
          class="quebras"
        ></div>

      </div>

      <div class="painel">

        <b>
          Ocorrências do gatilho:
          número gatilho → próximo número
        </b>

        <div
          id="listaOcorrencias"
          class="ocorrencias"
          style="margin-top:8px"
        ></div>

      </div>

      <div class="painel">

        <b>
          Teclado para continuar inserindo
        </b>

        <div style="
          color:#aaa;
          font-size:12px;
          margin:5px 0 9px
        ">
          Cada número clicado entra no histórico e passa a ser o novo terminal gatilho.
        </div>

        <div
          id="teclado"
          class="teclado"
        ></div>

      </div>

      <div class="painel">

        <b>
          Histórico armazenado:
          <span id="quantidadeHistorico">0</span>/300
        </b>

        <div
          id="timeline"
          class="timeline"
          style="margin-top:7px"
        ></div>

      </div>

    </div>
  `;

  // ================= ELEMENTOS =================

  const statusArea =
    document.getElementById("statusArea");

  const elementoGatilhoNumero =
    document.getElementById("gatilhoNumero");

  const elementoMelhorPar =
    document.getElementById("melhorPar");

  const elementoConfiguracao =
    document.getElementById("configuracao");

  const elementoPercentual =
    document.getElementById("percentual");

  const elementoBarra =
    document.getElementById("barraPercentual");

  const elementoListaQuebras =
    document.getElementById("listaQuebras");

  const elementoListaOcorrencias =
    document.getElementById("listaOcorrencias");

  const elementoTimeline =
    document.getElementById("timeline");

  const elementoQuantidade =
    document.getElementById("quantidadeHistorico");

  const elementoTeclado =
    document.getElementById("teclado");

  // ================= TECLADO =================

  for(let numero = 0; numero <= 36; numero++){

    const cores =
      corNumeroRoleta(numero);

    const botao =
      document.createElement("button");

    botao.className =
      "numero-btn";

    botao.textContent =
      numero;

    botao.style.background =
      cores.fundo;

    botao.style.color =
      cores.texto;

    botao.onclick = () => {
      adicionarNumero(numero);
    };

    elementoTeclado.appendChild(botao);
  }

  // ================= EVENTOS =================

  document
    .getElementById("btnInserirHistorico")
    .onclick = inserirHistorico;

  document
    .getElementById("btnApagarUltimo")
    .onclick = apagarUltimo;

  document
    .getElementById("btnApagarTudo")
    .onclick = apagarTudo;

  // ================= RENDERIZAÇÃO =================

  function textoConfiguracao(resultado){

    if(!resultado){
      return "—";
    }

    return (
      `T${resultado.par[0]} com ` +
      `${resultado.vizinhosPrimeiro}V` +
      ` + ` +
      `T${resultado.par[1]} com ` +
      `${resultado.vizinhosSegundo}V`
    );
  }

  function render(){

    numeroGatilho =
      historico.length
        ? historico[historico.length - 1]
        : null;

    const ocorrencias =
      encontrarOcorrencias();

    const melhor =
      encontrarMelhorPar();

    elementoQuantidade.textContent =
      historico.length;

    if(numeroGatilho === null){

      elementoGatilhoNumero.textContent =
        "—";

    }else{

      elementoGatilhoNumero.innerHTML = `
        ${numeroGatilho}

        <span
          class="terminal"
          style="
            background:
            ${corTerminal[terminal(numeroGatilho)]};
            margin-left:7px
          "
        >
          T${terminal(numeroGatilho)}
        </span>
      `;
    }

    if(
      melhor &&
      melhor.total > 0
    ){

      elementoMelhorPar.innerHTML =
        melhor.par.map(t => `

          <span
            class="terminal"
            style="
              background:${corTerminal[t]}
            "
          >
            T${t}
          </span>

        `).join("");

      elementoConfiguracao.textContent =
        textoConfiguracao(melhor);

      const percentualArredondado =
        Math.round(melhor.percentual);

      elementoPercentual.textContent =
        percentualArredondado + "%";

      elementoBarra.style.width =
        percentualArredondado + "%";

    }else{

      elementoMelhorPar.textContent =
        "—";

      elementoConfiguracao.textContent =
        "Aguardando ocorrências";

      elementoPercentual.textContent =
        "0%";

      elementoBarra.style.width =
        "0%";
    }

    // ===== QUEBRAS =====

    if(
      melhor &&
      melhor.total > 0 &&
      melhor.quebras.length > 0
    ){

      elementoListaQuebras.innerHTML =
        melhor.quebras.map(item => `

          <span class="quebra">

            ${item.proximo}

          </span>

        `).join("");

    }else if(
      melhor &&
      melhor.total > 0
    ){

      elementoListaQuebras.innerHTML = `

        <span style="
          color:#00e676;
          font-weight:900
        ">
          Nenhuma quebra encontrada
        </span>
      `;

    }else{

      elementoListaQuebras.innerHTML = `

        <span style="color:#aaa">
          Ainda não existem ocorrências anteriores do terminal gatilho com um número depois.
        </span>
      `;
    }

    // ===== OCORRÊNCIAS =====

    if(ocorrencias.length){

      elementoListaOcorrencias.innerHTML =
        ocorrencias.map(item => {

          const acertou =
            melhor &&
            melhor.coberturaTotal.has(
              item.proximo
            );

          return `

            <div class="ocorrencia">

              <span>
                ${item.gatilho}
              </span>

              <span style="
                color:#aaa;
                margin:0 4px
              ">
                →
              </span>

              <span class="${
                acertou
                  ? "acerto"
                  : "erro"
              }">
                ${item.proximo}
              </span>

            </div>
          `;

        }).join("");

    }else{

      elementoListaOcorrencias.innerHTML = `

        <div style="color:#aaa">

          Nenhuma ocorrência anterior do terminal
          ${
            numeroGatilho === null
              ? "—"
              : "T" + terminal(numeroGatilho)
          }.

        </div>
      `;
    }

    // ===== HISTÓRICO =====

    elementoTimeline.innerHTML =
      historico.map((numero,index) => {

        const ultimo =
          index === historico.length - 1;

        const cores =
          corNumeroRoleta(numero);

        return `

          <span style="
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-width:31px;
            height:31px;
            margin:2px;
            padding:3px 5px;
            border-radius:6px;
            background:${cores.fundo};
            color:${cores.texto};
            border:${
              ultimo
                ? "3px solid #00e5ff"
                : "1px solid #555"
            };
            box-shadow:${
              ultimo
                ? "0 0 10px #00e5ff"
                : "none"
            };
          ">
            ${numero}
          </span>
        `;

      }).join("");
  }

  render();

})();
