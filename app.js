(function () {

  // ================= CONFIG BASE =================
  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];
  const terminal = n => n % 10;

  const eixos = [
    { nome:"ZERO", trios:[[0,32,15],[19,4,21],[2,25,17],[34,6,27]] },
    { nome:"TIERS", trios:[[13,36,11],[30,8,23],[10,5,24],[16,33,1]] },
    { nome:"ORPHELINS", trios:[[20,14,31],[9,22,18],[7,29,28],[12,35,3]] }
  ];

  let timeline = [];
  let janela = 6;
  let modoAtivo = "MANUAL";
  let autoTAtivo = null;

  const analises = {
    MANUAL: { filtros:new Set(), res:[] },
    VIZINHO:{ filtros:new Set(), res:[], motor:new Set() },
    NUNUM:  { filtros:new Set(), res:[] },
    AUTO: {
      3:{ filtros:new Set(), res:[] },
      4:{ filtros:new Set(), res:[] },
      5:{ filtros:new Set(), res:[] },
      6:{ filtros:new Set(), res:[] },
      7:{ filtros:new Set(), res:[] }
    }
  };

  let modoConjuntos = false;
  let filtrosConjuntos = new Set();

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [
      track[(i-2+37)%37],
      track[(i-1+37)%37],
      n,
      track[(i+1)%37],
      track[(i+2)%37]
    ];
  }

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1100px;margin:auto">
      <h3 style="text-align:center">CSM</h3>

      <div style="border:1px solid #444;padding:8px">
        Histórico:
        <input id="inp" style="width:100%;padding:6px;background:#222;color:#fff"/>
        <div style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap">
          <button id="col">Colar</button>
          <button id="lim">Limpar</button>
          Janela:
          <select id="jan">
            ${Array.from({length:8},(_,i)=>`<option ${i+3===6?'selected':''}>${i+3}</option>`).join("")}
          </select>
        </div>
      </div>

      <div style="margin:10px 0">
        🕒 Timeline (14):
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <!-- ===== NOVO QUADRO ESTRUTURAL ===== -->
      <div id="estruturaBox"
           style="border:1px solid #00e676;
                  padding:10px;
                  margin-bottom:10px;">
      </div>      <div style="display:flex;gap:6px;margin-bottom:6px">
        ${["MANUAL","VIZINHO","NUNUM"].map(m=>`
          <button class="modo" data-m="${m}"
            style="padding:6px;background:#444;color:#fff;border:1px solid #666">${m}</button>`).join("")}
        <button id="btnConj" style="padding:6px;background:#444;color:#fff;border:1px solid #666">
          CONJUNTOS
        </button>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:10px">
        ${[3,4,5,6,7].map(n=>`
          <button class="auto" data-a="${n}"
            style="padding:6px;background:#444;color:#fff;border:1px solid #666">A${n}</button>`).join("")}
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        Terminais:
        <div id="btnT" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <div><b>ZERO</b><div id="cZERO"></div></div>
        <div><b>TIERS</b><div id="cTIERS"></div></div>
        <div><b>ORPHELINS</b><div id="cORPH"></div></div>
      </div>

      <div id="conjArea" style="display:none;margin-top:12px;overflow-x:auto"></div>
      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
    </div>
  `;

  // ================= LÓGICA DOS 5 NÚMEROS =================

  function gerarEstrutura(){

    if(timeline.length < 8) return [];

    const usados = new Set();
    const escolhidos = [];

    function podeUsar(n){
      const bloco = vizinhosRace(n);
      return bloco.every(x => !usados.has(x));
    }

    function registrarBloco(n){
      vizinhosRace(n).forEach(x=>usados.add(x));
      escolhidos.push(n);
    }

    // 1️⃣ Permanência → número mais repetido
    const freq = {};
    timeline.forEach(n=>{
      freq[n] = (freq[n]||0)+1;
    });

    const permanencia = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));

    if(permanencia!==undefined) registrarBloco(permanencia);

    // 2️⃣ Compensação → oposto no cilindro
    if(permanencia!==undefined){
      const idx = track.indexOf(permanencia);
      const compensacao = track[(idx+18)%37];
      if(podeUsar(compensacao)) registrarBloco(compensacao);
    }

    // 3️⃣ Lacuna → número que não saiu
    const naoSaiu = track.filter(n=>!timeline.includes(n));
    const lacuna = naoSaiu.find(n=>podeUsar(n));
    if(lacuna!==undefined) registrarBloco(lacuna);

    // 4️⃣ Permanência estrutural → vizinho mais frequente
    const freqViz = {};
    timeline.forEach(n=>{
      vizinhosRace(n).forEach(v=>{
        freqViz[v] = (freqViz[v]||0)+1;
      });
    });

    const estrutural = Object.entries(freqViz)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));

    if(estrutural!==undefined) registrarBloco(estrutural);

    // 5️⃣ Ruptura → maior salto recente
    const saltos = [];
    for(let i=0;i<timeline.length-1;i++){
      const a = track.indexOf(timeline[i]);
      const b = track.indexOf(timeline[i+1]);
      saltos.push({n:timeline[i], salto:Math.abs(a-b)});
    }

    const ruptura = saltos
      .sort((a,b)=>b.salto-a.salto)
      .map(x=>x.n)
      .find(n=>podeUsar(n));

    if(ruptura!==undefined) registrarBloco(ruptura);

    return escolhidos.slice(0,5);
  }

  // ================= RESTANTE DO SEU CÓDIGO ORIGINAL =================

  jan.onchange=e=>{ janela=+e.target.value; render(); };

  document.querySelectorAll(".modo").forEach(b=>{
    b.onclick=()=>{
      modoAtivo=b.dataset.m;
      render();
    };
  });

  document.querySelectorAll(".auto").forEach(b=>{
    b.onclick=()=>{
      modoAtivo="AUTO";
      autoTAtivo=+b.dataset.a;
      calcularAutoT(autoTAtivo);
      render();
    };
  });

  btnConj.onclick=()=>{
    modoConjuntos=!modoConjuntos;
    btnConj.style.background = modoConjuntos?"#00e676":"#444";
    modoAtivo="MANUAL";
    render();
  };

  function render(){

    tl.innerHTML = timeline.join(" · ");

    // ===== RENDER ESTRUTURAL =====
    const estrutura = gerarEstrutura();

    estruturaBox.innerHTML = `
      <b>Leitura Estrutural</b><br><br>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${estrutura.map(n=>`
          <div style="
            background:#222;
            padding:8px;
            border:1px solid #00e676;
            min-width:50px;
            text-align:center;
          ">
            ${n}
          </div>
        `).join("")}
      </div>
    `;

  }

  render();

})();
