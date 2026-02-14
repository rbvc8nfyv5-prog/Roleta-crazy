(function () {

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];

  const terminal = n => n % 10;

  let timeline = [];
  let estruturalCentros = [];
  let estruturalRes = [];
  let estruturalAtivo = false;
  let quadroAtivo = null;
  let trioPreferido = null;

  let faseAtual = "NEUTRA";
  let segundoVizinhoDominante = false;

  function vizinhos1(n){
    const i = track.indexOf(n);
    return [ track[(i-1+37)%37], n, track[(i+1)%37] ];
  }

  function vizinhos2(n){
    const i = track.indexOf(n);
    return [
      track[(i-2+37)%37],
      track[(i-1+37)%37],
      n,
      track[(i+1)%37],
      track[(i+2)%37]
    ];
  }

  function dentroEstrutural(n){
    return estruturalCentros.some(c => vizinhos2(c).includes(n));
  }

  function analisarFase(){

    if(timeline.length < 6){
      faseAtual = "NEUTRA";
      return;
    }

    let saltos = [];
    let segundoCount = 0;
    let primeiroCount = 0;

    for(let i=0;i<timeline.length-1;i++){
      const a = track.indexOf(timeline[i]);
      const b = track.indexOf(timeline[i+1]);
      const d = Math.abs(a-b);
      saltos.push(d);

      if(d === 1) primeiroCount++;
      if(d === 2) segundoCount++;
    }

    const media = saltos.reduce((a,b)=>a+b,0)/saltos.length;

    segundoVizinhoDominante = segundoCount > primeiroCount;

    if(media <= 3) faseAtual = "COMPRESSÃO";
    else if(media >= 8) faseAtual = "INSTÁVEL";
    else faseAtual = "PROGRESSIVA";
  }

  function gerarEstrutural(){

    analisarFase();

    const usados = new Set();
    const centros = [];

    function pode(n){
      return vizinhos2(n).every(x=>!usados.has(x));
    }

    function registrar(n){
      vizinhos2(n).forEach(x=>usados.add(x));
      centros.push(n);
    }

    const freq = {};
    timeline.forEach(n=>freq[n]=(freq[n]||0)+1);

    const permanencia = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>pode(n));

    if(permanencia!==undefined) registrar(permanencia);

    if(permanencia!==undefined){
      const op = track[(track.indexOf(permanencia)+18)%37];
      if(pode(op)) registrar(op);
    }

    const lacuna = track.find(n=>!timeline.includes(n) && pode(n));
    if(lacuna!==undefined) registrar(lacuna);

    const freqViz={};
    timeline.forEach(n=>{
      vizinhos2(n).forEach(v=>{
        freqViz[v]=(freqViz[v]||0)+1;
      });
    });

    const quente = Object.entries(freqViz)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>pode(n));

    if(quente!==undefined) registrar(quente);

    while(centros.length<5){
      const extra = track.find(n=>pode(n));
      if(extra===undefined) break;
      registrar(extra);
    }

    if(trioPreferido){
      const trioTerminais = trioPreferido.split("-").map(x=>+x);

      centros.sort((a,b)=>{
        const aPeso = trioTerminais.includes(terminal(a)) ? 2 : 0;
        const bPeso = trioTerminais.includes(terminal(b)) ? 2 : 0;
        return bPeso - aPeso;
      });
    }

    return centros.slice(0,5);
  }

  function melhorTrio(grupo){

    const trios=[];
    for(let i=0;i<grupo.length;i++)
      for(let j=i+1;j<grupo.length;j++)
        for(let k=j+1;k<grupo.length;k++)
          trios.push([grupo[i],grupo[j],grupo[k]]);

    const cont={};

    trios.forEach(trio=>{
      const key=trio.join("-");
      cont[key]=0;

      timeline.forEach(n=>{
        if(vizinhos1(n).some(v=>trio.includes(terminal(v))))
          cont[key]++;
      });
    });

    const ord = Object.entries(cont)
      .sort((a,b)=>b[1]-a[1]);

    return ord.length?ord[0][0]:null;
  }

  document.body.innerHTML=`
  <div style="max-width:1000px;margin:auto;padding:10px;font-family:sans-serif;color:#fff;background:#111;min-height:100vh">

    <h3>CSM ADAPTATIVO</h3>

    <div>🕒 Timeline:<div id="tl"></div></div>

    <div id="painelFase" style="border:1px solid #00e676;padding:6px;margin:10px 0"></div>

    <div id="estruturaBox" style="border:1px solid #555;padding:8px;margin-bottom:10px;cursor:pointer"></div>

    <div id="q1479" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>1479</b><div id="tl1479"></div>
    </div>

    <div id="q2589" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>2589</b><div id="tl2589"></div>
    </div>

    <div id="q0369" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>0369</b><div id="tl0369"></div>
    </div>

    <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
  </div>
  `;

  function render(){

    estruturalCentros = gerarEstrutural();

    document.getElementById("tl").innerHTML =
      timeline.map((n,i)=>{
        const r=estruturalRes[i];
        const cor=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
        return `<span style="color:${cor}">${n}</span>`;
      }).join(" · ");

    document.getElementById("painelFase").innerHTML =
      `<b>Fase:</b> ${faseAtual} | Segundo Vizinho: ${segundoVizinhoDominante?"SIM":"NÃO"}`;

    document.getElementById("estruturaBox").innerHTML =
      `<b>Leitor Estrutural</b><br><br>`+
      (trioPreferido?`<div style="color:#00e676">Viés Grupo: ${trioPreferido}</div><br>`:"")+
      estruturalCentros.map(n=>`<div style="display:inline-block;border:1px solid #00e676;padding:6px;margin:4px">${n}</div>`).join("");
  }

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    document.getElementById("nums").appendChild(b);
  }

  function add(n){

    if(estruturalAtivo){
      estruturalRes.unshift(dentroEstrutural(n)?"V":"X");
    }

    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();

    render();
  }

  render();

})();
