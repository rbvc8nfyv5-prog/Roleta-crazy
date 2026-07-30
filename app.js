(function () {

  // ================= CONFIGURAÇÃO =================

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];

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

  const terminal = numero => numero % 10;

  let historicoOriginal = [];
  let historicoCronologico = [];
  let terminalGatilho = 8;

  // ================= VIZINHOS DA ROLETA =================

  function vizinhos(numero, quantidade){

    const indice = track.indexOf(numero);

    if(indice === -1){
      return [];
    }

    const resultado = [numero];

    for(let distancia = 1; distancia <= quantidade; distancia++){

      resultado.push(
        track[(indice - distancia + 37) % 37]
      );

      resultado.push(
        track[(indice + distancia) % 37]
      );
    }

    return resultado;
  }

  function coberturaTerminal(numeroTerminal, quantidadeVizinhos){

    const cobertura = new Set();

    track.forEach(numero => {

      if(terminal(numero) === numeroTerminal){

        vizinhos(numero, quantidadeVizinhos)
          .forEach(v => cobertura.add(v));
      }
    });

    return cobertura;
  }

  // ================= EXTRAÇÃO DAS OCORRÊNCIAS =================

  function encontrarOcorrencias(){

    const ocorrencias = [];

    for(let i = 0; i < historicoCronologico.length - 1; i++){

      const numeroGatilho = historicoCronologico[i];

      if(terminal(numeroGatilho) === terminalGatilho){

        ocorrencias.push({
          gatilho: numeroGatilho,
          proximo: historicoCronologico[i + 1],
          posicao: i + 1
        });
      }
    }

    return ocorrencias;
  }

  // ================= ANÁLISE DE UMA CONFIGURAÇÃO =================

  function analisarConfiguracao(par, vizinhosPrimeiro, vizinhosSegundo){

    const coberturaPrimeiro =
      coberturaTerminal(par[0], vizinhosPrimeiro);

    const coberturaSegundo =
      coberturaTerminal(par[1], vizinhosSegundo);

    const coberturaTotal = new Set([
      ...coberturaPrimeiro,
      ...coberturaSegundo
    ]);

    const ocorrencias = encontrarOcorrencias();

    const acertos = [];
    const quebras = [];

    ocorrencias.forEach(item => {

      if(coberturaTotal.has(item.proximo)){
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

  // ================= MELHOR CONFIGURAÇÃO DO PAR =================

  function analisarParFixo(par){

    const configuracoes = [
      analisarConfiguracao(par, 1, 1),
      analisarConfiguracao(par, 2, 1),
      analisarConfiguracao(par, 1, 2)
    ];

    configuracoes.sort((a,b) => {

      if(b.percentual !== a.percentual){
        return b.percentual - a.percentual;
      }

      if(b.acertos.length !== a.acertos.length){
        return b.acertos.length - a.acertos.length;
      }

      return a.quebras.length - b.quebras.length;
    });

    return configuracoes[0];
  }

  function analisarTodosPares(){

    return paresFixos
      .map(analisarParFixo)
      .sort((a,b) => {

        if(b.percentual !== a.percentual){
          return b.percentual - a.percentual;
        }

        if(b.acertos.length !== a.acertos.length){
          return b.acertos.length - a.acertos.length;
        }

        return a.quebras.length - b.quebras.length;
      });
  }

  // ================= LEITURA DO HISTÓRICO =================

  function lerHistorico(){

    const texto =
      document.getElementById("entradaHistorico").value;

    const numeros = texto
      .match(/\b(?:[0-9]|[12][0-9]|3[0-6])\b/g);

    historicoOriginal = numeros
      ? numeros.map(Number).slice(0,300)
      : [];

    const maisRecentePrimeiro =
      document.getElementById("ordemHistorico").checked;

    historicoCronologico =
      maisRecentePrimeiro
        ? historicoOriginal.slice().reverse()
        : historicoOriginal.slice();

    render();
  }

  // ================= INTERFACE =================

  document.body.style.margin = "0";
  document.body.style.background = "#111";
  document.body.style.color = "#fff";
  document.body.style.fontFamily = "Arial, sans-serif";

  document.body.innerHTML = `
    <style>

      *{
        box-sizing:border-box;
      }

      button,
      textarea,
      select{
        font-family:Arial,sans-serif;
      }

      button{
        cursor:pointer;
        touch-action:manipulation;
      }

      .app{
        width:100%;
        max-width:1000px;
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

      .linha{
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        align-items:center;
      }

      textarea{
        width:100%;
        min-height:110px;
        padding:10px;
        background:#222;
        color:#fff;
        border:1px solid #555;
        border-radius:8px;
        font-size:15px;
      }

      select{
        padding:8px;
        background:#222;
        color:#fff;
        border:1px solid #555;
        border-radius:7px;
        font-size:16px;
        font-weight:800;
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
        min-height:90px;
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
        min-width:48px;
        height:40px;
        border-radius:8px;
        margin-right:5px;
        color:#fff;
        font-size:19px;
        font-weight:900;
        border:2px solid rgba(255,255,255,.55);
      }

      .barra{
        height:12px;
        background:#3b3b3b;
        border-radius:7px;
        overflow:hidden;
        margin-top:7px;
      }

      .barra-interna{
        height:100%;
        background:linear-gradient(
          90deg,
          #00e5ff,
          #00e676
        );
      }

      .tabela{
        width:100%;
        border-collapse:collapse;
      }

      .tabela th,
      .tabela td{
        border-bottom:1px solid #3d3d3d;
        padding:8px 5px;
        text-align:center;
        font-size:13px;
      }

      .tabela th{
        color:#aaa;
      }

      .melhor-linha{
        background:rgba(0,230,118,.12);
        box-shadow:inset 3px 0 #00e676;
      }

      .quebras{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin-top:8px;
      }

      .quebra{
        padding:6px 8px;
        background:#5b222a;
        border:1px solid #a04754;
        border-radius:7px;
        font-size:13px;
        font-weight:800;
      }

      .ocorrencias{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(100px,1fr));
        gap:6px;
      }

      .ocorrencia{
        background:#252525;
        border:1px solid #414141;
        border-radius:7px;
        padding:7px;
        text-align:center;
        font-size:13px;
      }

      .seta{
        color:#aaa;
        margin:0 4px;
      }

      .acerto{
        color:#00e676;
        font-weight:900;
      }

      .erro{
        color:#ff5252;
        font-weight:900;
      }

      @media(max-width:700px){

        .resumo{
          grid-template-columns:repeat(2,1fr);
        }

        .tabela th,
        .tabela td{
          font-size:11px;
          padding:7px 2px;
        }
      }

    </style>

    <div class="app">

      <h2 style="text-align:center;margin:4px 0 12px">
        Análise de Terminal e Pares Fixos
      </h2>

      <div class="painel">

        <textarea
          id="entradaHistorico"
          placeholder="Cole até 300 números aqui. Exemplo: 8 13 28 22 18 5 34 12..."
        ></textarea>

        <div class="linha" style="margin-top:8px">

          <button
            id="btnAnalisar"
            class="btn btn-verde"
          >
            Analisar histórico
          </button>

          <button
            id="btnLimpar"
            class="btn"
          >
            Limpar
          </button>

          <label style="font-size:13px">

            <input
              id="ordemHistorico"
              type="checkbox"
              checked
            >

            O primeiro número colado é o mais recente

          </label>

        </div>

      </div>

      <div class="painel">

        <div class="linha">

          <b>Terminal gatilho:</b>

          <select id="terminalGatilho">

            ${Array.from(
              {length:10},
              (_,t) =>
                `<option value="${t}" ${t===8 ? "selected" : ""}>
                  T${t}
                </option>`
            ).join("")}

          </select>

          <span style="color:#aaa;font-size:13px">
            O sistema analisa o número que saiu logo depois de cada ocorrência.
          </span>

        </div>

      </div>

      <div class="painel">

        <div class="resumo">

          <div class="card">

            <div class="label">
              Melhor par fixo
            </div>

            <div id="melhorPar"></div>

          </div>

          <div class="card">

            <div class="label">
              Melhor configuração
            </div>

            <div
              id="melhorConfiguracao"
              class="valor"
            >
              —
            </div>

          </div>

          <div class="card">

            <div class="label">
              Percentual de ganho
            </div>

            <div
              id="melhorPercentual"
              class="valor"
            >
              0%
            </div>

            <div class="barra">

              <div
                id="barraPercentual"
                class="barra-interna"
                style="width:0%"
              ></div>

            </div>

          </div>

          <div class="card">

            <div class="label">
              Ocorrências do gatilho
            </div>

            <div
              id="totalOcorrencias"
              class="valor"
            >
              0
            </div>

          </div>

        </div>

      </div>

      <div class="painel">

        <b>Comparação dos pares fixos</b>

        <div style="overflow-x:auto;margin-top:7px">

          <table class="tabela">

            <thead>

              <tr>
                <th>Par</th>
                <th>Configuração</th>
                <th>Acertos</th>
                <th>Quebras</th>
                <th>Resultado</th>
              </tr>

            </thead>

            <tbody id="tabelaPares"></tbody>

          </table>

        </div>

      </div>

      <div class="painel">

        <b>Quebras do melhor par</b>

        <div
          id="listaQuebras"
          class="quebras"
        ></div>

      </div>

      <div class="painel">

        <b>
          Sequências encontradas:
          terminal gatilho → próximo número
        </b>

        <div
          id="listaOcorrencias"
          class="ocorrencias"
          style="margin-top:8px"
        ></div>

      </div>

    </div>
  `;

  // ================= EVENTOS =================

  document
    .getElementById("btnAnalisar")
    .onclick = lerHistorico;

  document
    .getElementById("btnLimpar")
    .onclick = () => {

      historicoOriginal = [];
      historicoCronologico = [];

      document
        .getElementById("entradaHistorico")
        .value = "";

      render();
    };

  document
    .getElementById("terminalGatilho")
    .onchange = event => {

      terminalGatilho =
        Number(event.target.value);

      render();
    };

  document
    .getElementById("ordemHistorico")
    .onchange = () => {

      if(historicoOriginal.length){
        lerHistorico();
      }
    };

  // ================= RENDERIZAÇÃO =================

  function textoConfiguracao(analise){

    return (
      `T${analise.par[0]}: ${analise.vizinhosPrimeiro}V` +
      ` + ` +
      `T${analise.par[1]}: ${analise.vizinhosSegundo}V`
    );
  }

  function render(){

    const resultados =
      analisarTodosPares();

    const melhor =
      resultados[0];

    const ocorrencias =
      encontrarOcorrencias();

    document
      .getElementById("totalOcorrencias")
      .textContent =
        ocorrencias.length;

    document
      .getElementById("melhorPar")
      .innerHTML = melhor
        ? melhor.par.map(t => `
            <span
              class="terminal"
              style="background:${corTerminal[t]}"
            >
              T${t}
            </span>
          `).join("")
        : "—";

    document
      .getElementById("melhorConfiguracao")
      .textContent =
        melhor && melhor.total
          ? textoConfiguracao(melhor)
          : "—";

    const percentual =
      melhor
        ? Math.round(melhor.percentual)
        : 0;

    document
      .getElementById("melhorPercentual")
      .textContent =
        percentual + "%";

    document
      .getElementById("barraPercentual")
      .style.width =
        percentual + "%";

    document
      .getElementById("tabelaPares")
      .innerHTML =
        resultados.map((resultado,index) => `

          <tr class="${index === 0 ? "melhor-linha" : ""}">

            <td>

              <span style="
                color:${corTerminal[resultado.par[0]]};
                font-weight:900
              ">
                T${resultado.par[0]}
              </span>

              +

              <span style="
                color:${corTerminal[resultado.par[1]]};
                font-weight:900
              ">
                T${resultado.par[1]}
              </span>

            </td>

            <td>
              ${textoConfiguracao(resultado)}
            </td>

            <td style="color:#00e676;font-weight:900">
              ${resultado.acertos.length}
            </td>

            <td style="color:#ff5252;font-weight:900">
              ${resultado.quebras.length}
            </td>

            <td>
              ${Math.round(resultado.percentual)}%
            </td>

          </tr>

        `).join("");

    if(melhor && melhor.quebras.length){

      document
        .getElementById("listaQuebras")
        .innerHTML =
          melhor.quebras.map(item => `

            <span class="quebra">

              ${item.gatilho}

              <span class="seta">→</span>

              ${item.proximo}

            </span>

          `).join("");

    }else{

      document
        .getElementById("listaQuebras")
        .innerHTML =
          ocorrencias.length
            ? `
              <span style="
                color:#00e676;
                font-weight:900
              ">
                Nenhuma quebra encontrada
              </span>
            `
            : `
              <span style="color:#aaa">
                Nenhuma ocorrência do terminal T${terminalGatilho}
              </span>
            `;
    }

    document
      .getElementById("listaOcorrencias")
      .innerHTML =
        ocorrencias.map(item => {

          const acertou =
            melhor &&
            melhor.coberturaTotal.has(item.proximo);

          return `

            <div class="ocorrencia">

              <span>
                ${item.gatilho}
              </span>

              <span class="seta">
                →
              </span>

              <span class="${acertou ? "acerto" : "erro"}">
                ${item.proximo}
              </span>

            </div>

          `;

        }).join("");

  }

  render();

})();
