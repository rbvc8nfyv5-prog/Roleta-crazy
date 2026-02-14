(function () {

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
  let quadroAtivo = null;

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
    },
    ESTRUTURAL:{ centros:[], res:[], ativo:false }
  };

  let modoConjuntos = false;
  let filtrosConjuntos = new Set();

  function ativarQuadro(el){
    document.querySelectorAll(".quadroSelect").forEach(q=>{
      q.style.boxShadow="none";
      q.style.border="1px solid #555";
    });
    el.style.boxShadow="0 0 15px #00e676";
    el.style.border="1px solid #00e676";
    quadroAtivo = el;
  }

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function bloco5(c){
    const i = track.indexOf(c);
    return [
      track[(i-2+37)%37],
      track[(i-1+37)%37],
      c,
      track[(i+1)%37],
      track[(i+2)%37]
    ];
  }

  function distanciaCircular(a,b){
    const d = Math.abs(a-b);
    return Math.min(d,37-d);
  }  function gerarLeitorEstrutural(){

    if(timeline.length < 8) return [];

    const usados = new Set();
    const centros = [];

    function podeUsar(n){
      return bloco5(n).every(x => !usados.has(x));
    }

    function registrar(n){
      bloco5(n).forEach(x => usados.add(x));
      centros.push(n);
    }

    const freq = {};
    timeline.forEach(n=>freq[n]=(freq[n]||0)+1);

    const permanencia = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));
    if(permanencia!==undefined) registrar(permanencia);

    if(permanencia!==undefined){
      const oposto = track[(track.indexOf(permanencia)+18)%37];
      if(podeUsar(oposto)) registrar(oposto);
    }

    const lacuna = track
      .filter(n=>!timeline.includes(n))
      .find(n=>podeUsar(n));
    if(lacuna!==undefined) registrar(lacuna);

    const freqViz = {};
    timeline.forEach(n=>{
      bloco5(n).forEach(v=>{
        freqViz[v]=(freqViz[v]||0)+1;
      });
    });

    const estrutural = Object.entries(freqViz)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));
    if(estrutural!==undefined) registrar(estrutural);

    const saltos = [];
    for(let i=0;i<timeline.length-1;i++){
      const a = track.indexOf(timeline[i]);
      const b = track.indexOf(timeline[i+1]);
      saltos.push({n:timeline[i],d:distanciaCircular(a,b)});
    }

    const ruptura = saltos
      .sort((a,b)=>b.d-a.d)
      .map(x=>x.n)
      .find(n=>podeUsar(n));
    if(ruptura!==undefined) registrar(ruptura);

    // GARANTIR SEMPRE 5
    if(centros.length < 5){
      for(const n of track){
        if(centros.length >= 5) break;
        if(podeUsar(n)) registrar(n);
      }
    }

    return centros.slice(0,5);
  }

  function registrar(n){

    analises.MANUAL.res.unshift("X");
    analises.VIZINHO.res.unshift("X");
    analises.NUNUM.res.unshift("X");

    [3,4,5,6,7].forEach(k=>{
      analises.AUTO[k].res.unshift("X");
    });

    if(analises.ESTRUTURAL.ativo){
      const hit = analises.ESTRUTURAL.centros
        .some(c=>bloco5(c).includes(n));
      analises.ESTRUTURAL.res.unshift(hit?"V":"X");
    }
  }  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1000px;margin:auto">

      <div id="estruturaBox"
           class="quadroSelect"
           style="border:1px solid #555;padding:8px;margin-bottom:10px;cursor:pointer;">
      </div>

      <div class="quadroSelect" id="q1479"
           style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
        <b>1479</b>
        <div id="tl1479"></div>
      </div>

      <div class="quadroSelect" id="q2589"
           style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
        <b>2589</b>
        <div id="tl2589"></div>
      </div>

      <div class="quadroSelect" id="q0369"
           style="border:1px solid #555;padding:6px;margin-bottom:10px;cursor:pointer">
        <b>0369</b>
        <div id="tl0369"></div>
      </div>

      <div id="nums"
           style="display:grid;grid-template-columns:repeat(9,1fr);
                  gap:6px;margin-top:12px"></div>
    </div>
  `;

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    nums.appendChild(b);
  }

  function add(n){
    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();
    registrar(n);
    render();
  }

  function render(){

    const estrut = gerarLeitorEstrutural();

    estruturaBox.innerHTML = `
      <b>Leitor Estrutural</b><br><br>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${estrut.map(n=>`
          <div style="
            background:#222;
            padding:8px;
            border:1px solid #00e676;
            min-width:50px;
            text-align:center;
            font-weight:bold;
          ">${n}</div>
        `).join("")}
      </div>
    `;

    estruturaBox.onclick=()=>{
      ativarQuadro(estruturaBox);
      analises.ESTRUTURAL.centros = estrut.slice(0,5);
      analises.ESTRUTURAL.res=[];
      analises.ESTRUTURAL.ativo=true;
      modoAtivo="ESTRUTURAL";
    };

    document.getElementById("q1479").onclick=function(){
      ativarQuadro(this);
    };

    document.getElementById("q2589").onclick=function(){
      ativarQuadro(this);
    };

    document.getElementById("q0369").onclick=function(){
      ativarQuadro(this);
    };
  }

  render();

})();
