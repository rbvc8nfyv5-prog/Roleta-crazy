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
    ESTRUTURAL:{ centros:[], res:[] }
  };

  let modoConjuntos = false;
  let filtrosConjuntos = new Set();

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function pertenceGrupoVizinho(n, grupo){
    return vizinhosRace(n).some(v => grupo.includes(terminal(v)));
  }

  function gerarLeitorEstrutural(){

    if(timeline.length < 8) return [];

    const usados = new Set();
    const centros = [];

    function bloco5(n){
      const i = track.indexOf(n);
      return [
        track[(i-2+37)%37],
        track[(i-1+37)%37],
        n,
        track[(i+1)%37],
        track[(i+2)%37]
      ];
    }

    function podeUsar(n){
      return bloco5(n).every(x => !usados.has(x));
    }

    function registrarCentro(n){
      bloco5(n).forEach(x => usados.add(x));
      centros.push(n);
    }

    const freq = {};
    timeline.forEach(n => freq[n]=(freq[n]||0)+1);

    const permanencia = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));

    if(permanencia!==undefined) registrarCentro(permanencia);

    if(permanencia!==undefined){
      const oposto = track[(track.indexOf(permanencia)+18)%37];
      if(podeUsar(oposto)) registrarCentro(oposto);
    }

    const lacuna = track.find(n=>!timeline.includes(n) && podeUsar(n));
    if(lacuna!==undefined) registrarCentro(lacuna);

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

    if(estrutural!==undefined) registrarCentro(estrutural);

    return centros.slice(0,5);
  }  function registrar(n){

    analises.MANUAL.res.unshift(validar(n,analises.MANUAL.filtros)?"V":"X");
    analises.VIZINHO.res.unshift(analises.VIZINHO.motor.has(n)?"V":"X");
    analises.NUNUM.res.unshift(validar(n,analises.NUNUM.filtros)?"V":"X");

    [3,4,5,6,7].forEach(k=>{
      analises.AUTO[k].res.unshift(
        validar(n,analises.AUTO[k].filtros)?"V":"X"
      );
    });

    if(modoAtivo==="ESTRUTURAL"){
      const ok = analises.ESTRUTURAL.centros.some(c=>{
        const i = track.indexOf(c);
        const bloco = [
          track[(i-2+37)%37],
          track[(i-1+37)%37],
          c,
          track[(i+1)%37],
          track[(i+2)%37]
        ];
        return bloco.includes(n);
      });
      analises.ESTRUTURAL.res.unshift(ok?"V":"X");
    }
  }

  function render(){

    let res;

    if(modoAtivo==="AUTO"){
      res = analises.AUTO[autoTAtivo]?.res || [];
    }
    else if(modoAtivo==="ESTRUTURAL"){
      res = analises.ESTRUTURAL.res;
    }
    else{
      res = analises[modoAtivo].res;
    }

    tl.innerHTML = timeline.map((n,i)=>{
      const r=res[i];
      const c=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${c}">${n}</span>`;
    }).join(" · ");

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
      analises.ESTRUTURAL.centros = estrut;
      analises.ESTRUTURAL.res = [];
      modoAtivo="ESTRUTURAL";
      render();
    };
  }

  render();

})();
