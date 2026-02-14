(function () {

  // ================= CONFIG BASE =================
  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];

  let timeline = [];

  const analises = {
    ESTRUTURAL: { centros:[], res:[], ativo:false }
  };

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

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

  // ================= LEITOR ESTRUTURAL =================
  function gerarLeitorEstrutural(){

    if(timeline.length < 8) return [];

    const usados = new Set();
    const centros = [];

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

    while(centros.length < 5){
      const extra = track.find(n=>podeUsar(n));
      if(extra===undefined) break;
      registrarCentro(extra);
    }

    return centros.slice(0,5);
  }

  function validarEstrutural(n){
    for(const c of analises.ESTRUTURAL.centros){
      if(bloco5(c).includes(n)) return true;
    }
    return false;
  }

  function registrar(n){
    if(analises.ESTRUTURAL.ativo){
      analises.ESTRUTURAL.res.unshift(
        validarEstrutural(n) ? "V" : "X"
      );
    }
  }

  function ativarEstrutural(){
    analises.ESTRUTURAL.centros = gerarLeitorEstrutural();
    analises.ESTRUTURAL.res = [];
    analises.ESTRUTURAL.ativo = true;
    acenderGlow(estruturaBox);
    render();
  }

  function apagarGlow(){
    document.querySelectorAll(".quadro")
      .forEach(q=>q.style.boxShadow="none");
  }

  function acenderGlow(el){
    apagarGlow();
    el.style.boxShadow="0 0 15px #00e676";
  }

  // ================= UI =================
  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1000px;margin:auto">

      <div style="margin:10px 0">
        🕒 Timeline:
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <div id="estruturaBox"
           class="quadro"
           style="border:1px solid #555;padding:8px;margin-bottom:10px;cursor:pointer;">
      </div>

      <div class="quadro" id="q1479"
           style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
        <b>1479</b>
        <div id="tl1479"></div>
      </div>

      <div class="quadro" id="q2589"
           style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
        <b>2589</b>
        <div id="tl2589"></div>
      </div>

      <div class="quadro" id="q0369"
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

  estruturaBox.onclick=ativarEstrutural;

  function render(){

    const res = analises.ESTRUTURAL.res;

    tl.innerHTML = timeline.map((n,i)=>{
      const r=res[i];
      const c=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${c}">${n}</span>`;
    }).join(" · ");

    const estrut = analises.ESTRUTURAL.ativo
      ? analises.ESTRUTURAL.centros
      : gerarLeitorEstrutural();

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
  }

  render();

})();
