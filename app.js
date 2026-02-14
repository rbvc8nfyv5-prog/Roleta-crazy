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

  // ================= VIZINHOS =================

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

  // ================= GERADOR ESTRUTURAL =================

  function gerarEstrutural(){

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

    // garante 5 centrais
    while(centros.length<5){
      const extra = track.find(n=>pode(n));
      if(extra===undefined) break;
      registrar(extra);
    }

    // ====== VIÉS DO TRIO (com peso maior) ======
    if(trioPreferido){
      const trioTerminais = trioPreferido.split("-").map(x=>+x);

      centros.sort((a,b)=>{
        let pesoA = 0;
        let pesoB = 0;

        if(trioTerminais.includes(terminal(a))) pesoA += 2;
        if(trioTerminais.includes(terminal(b))) pesoB += 2;

        // segundo vizinho dominante ponderado
        vizinhos2(a).forEach(v=>{
          if(trioTerminais.includes(terminal(v))) pesoA += 1;
        });

        vizinhos2(b).forEach(v=>{
          if(trioTerminais.includes(terminal(v))) pesoB += 1;
        });

        return pesoB - pesoA;
      });
    }

    return centros.slice(0,5);
  }

  // ================= MELHOR TRIO =================

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

  // ================= UI =================

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML=`
  <div style="max-width:1000px;margin:auto;padding:10px">

    <h3>CSM</h3>

    <div>🕒 Timeline:<div id="tl"></div></div>

    <div id="estruturaBox" class="box"
         style="border:1px solid #555;padding:8px;margin:10px 0;cursor:pointer">
    </div>

    <div id="q1479" class="box" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>1479</b><div id="tl1479"></div>
    </div>

    <div id="q2589" class="box" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>2589</b><div id="tl2589"></div>
    </div>

    <div id="q0369" class="box" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>0369</b><div id="tl0369"></div>
    </div>

    <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
  </div>
  `;

  function atualizarBordas(){
    document.querySelectorAll(".box").forEach(b=>{
      b.style.border="1px solid #555";
      b.style.boxShadow="none";
    });

    if(estruturalAtivo){
      estruturaBox.style.border="2px solid #00e676";
      estruturaBox.style.boxShadow="0 0 8px #00e676";
    }

    if(quadroAtivo){
      document.getElementById(quadroAtivo).style.border="2px solid #00e676";
      document.getElementById(quadroAtivo).style.boxShadow="0 0 8px #00e676";
    }
  }

  estruturaBox.onclick=()=>{
    estruturalAtivo = !estruturalAtivo;
    if(!estruturalAtivo){
      trioPreferido=null;
      quadroAtivo=null;
    }
    atualizarBordas();
  };

  function cliqueQuadro(id,grupo){

    if(!estruturalAtivo) return;

    if(quadroAtivo===id){
      quadroAtivo=null;
      trioPreferido=null;
    } else {
      quadroAtivo=id;
      trioPreferido=melhorTrio(grupo);
    }

    estruturalCentros = gerarEstrutural();
    atualizarBordas();
    render();
  }

  q1479.onclick=()=>cliqueQuadro("q1479",[1,4,7,9]);
  q2589.onclick=()=>cliqueQuadro("q2589",[2,5,8,9]);
  q0369.onclick=()=>cliqueQuadro("q0369",[0,3,6,9]);

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    nums.appendChild(b);
  }

  function add(n){

    // valida usando centros anteriores
    if(estruturalAtivo){
      estruturalRes.unshift(dentroEstrutural(n)?"V":"X");
    }

    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();

    estruturalCentros = gerarEstrutural();
    render();
  }

  function render(){

    tl.innerHTML = timeline.map((n,i)=>{
      const r=estruturalRes[i];
      const cor=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${cor}">${n}</span>`;
    }).join(" · ");

    estruturaBox.innerHTML=`
      <b>Leitor Estrutural</b><br><br>
      ${trioPreferido?`<div style="color:#00e676">Viés: ${trioPreferido}</div><br>`:""}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${estruturalCentros.map(n=>`
          <div style="border:1px solid #00e676;padding:6px">${n}</div>
        `).join("")}
      </div>
    `;

    const grupos={
      tl1479:[1,4,7,9],
      tl2589:[2,5,8,9],
      tl0369:[0,3,6,9]
    };

    Object.entries(grupos).forEach(([id,grupo])=>{
      const trio = melhorTrio(grupo);
      document.getElementById(id).innerHTML=`
        <div style="color:#00e676;font-size:12px">Melhor Trio: ${trio||"-"}</div>
        ${timeline.map(n=>`
          <span style="
            display:inline-block;
            width:18px;
            text-align:center;
            background:${vizinhos1(n).some(v=>grupo.includes(terminal(v)))?"#00e676":"transparent"};
            margin-right:2px;
          ">${n}</span>
        `).join("")}
      `;
    });

    atualizarBordas();
  }

  render();

})();
