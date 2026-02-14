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

  // ================= ESTRUTURAL COM DOMINÂNCIA =================

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

    const zonas = {
      "1479":[1,4,7,9],
      "2589":[2,5,8,9],
      "0369":[0,3,6,9]
    };

    let pesoZona = null;
    let maiorScore = 0;

    Object.entries(zonas).forEach(([nome,grupo])=>{
      let score = 0;

      timeline.forEach(n=>{
        if(vizinhos1(n).some(v=>grupo.includes(terminal(v))))
          score++;
      });

      if(score > maiorScore){
        maiorScore = score;
        pesoZona = grupo;
      }
    });

    const dominanciaAtiva = maiorScore >= Math.floor(timeline.length * 0.6);

    const freq = {};
    timeline.forEach(n=>freq[n]=(freq[n]||0)+1);

    const candidatos = track.slice().sort((a,b)=>{
      let baseA = freq[a] || 0;
      let baseB = freq[b] || 0;

      if(dominanciaAtiva && pesoZona){
        if(pesoZona.includes(terminal(a))) baseA += 3;
        if(pesoZona.includes(terminal(b))) baseB += 3;
      }

      return baseB - baseA;
    });

    for(const n of candidatos){
      if(pode(n)) registrar(n);
      if(centros.length === 5) break;
    }

    while(centros.length < 5){
      const extra = track.find(n=>pode(n));
      if(!extra) break;
      registrar(extra);
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
      const el = document.getElementById(quadroAtivo);
      el.style.border="2px solid #00e676";
      el.style.boxShadow="0 0 8px #00e676";
    }
  }

  estruturaBox.onclick=()=>{
    estruturalAtivo = !estruturalAtivo;
    atualizarBordas();
  };

  function cliqueQuadro(id,grupo){

    if(!estruturalAtivo) return;

    if(quadroAtivo===id){
      quadroAtivo=null;
    } else {
      quadroAtivo=id;
    }

    atualizarBordas();
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

  estruturalCentros = gerarEstrutural();
  render();

})();
