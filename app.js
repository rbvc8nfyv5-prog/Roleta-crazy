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
  let estruturalSnapshot = [];
  let estruturalRes = [];
  let estruturalAtivo = false;
  let quadroAtivo = null;

  const coresBase = {
    0:"#00e5ff",
    4:"#ff9800",
    7:"#e91e63",
    2:"#8bc34a",
    6:"#9c27b0",
    9:"#ffc107",
    5:"#3f51b5",
    8:"#f44336",
    1:"#009688"
  };  function vizinhos2(n){
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
    return estruturalSnapshot.some(c => vizinhos2(c).includes(n));
  }

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

    const perm = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>pode(n));

    if(perm!==undefined) registrar(perm);

    const lac = track.find(n=>!timeline.includes(n) && pode(n));
    if(lac!==undefined) registrar(lac);

    while(centros.length<5){
      const extra = track.find(n=>pode(n));
      if(extra===undefined) break;
      registrar(extra);
    }

    return centros.slice(0,5);
  }  function melhorDupla(grupo){

    const duplas=[];
    for(let i=0;i<grupo.length;i++)
      for(let j=i+1;j<grupo.length;j++)
        duplas.push([grupo[i],grupo[j]]);

    const cont={};

    duplas.forEach(dupla=>{
      const key=dupla.join("-");
      cont[key]=0;

      timeline.forEach(n=>{
        if(dupla.includes(terminal(n)))
          cont[key]++;
      });
    });

    const ord = Object.entries(cont)
      .sort((a,b)=>b[1]-a[1]);

    return ord.length?ord[0][0]:null;
  }

  function corQuadro(n,grupo){
    const t = terminal(n);
    if(grupo.includes(t)){
      return coresBase[t];
    }
    return "transparent";
  }  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML=`
  <div style="max-width:1000px;margin:auto;padding:10px">

    <h3>CSM</h3>

    <div>🕒 Timeline:<div id="tl"></div></div>

    <div id="estruturaBox" class="box"
         style="border:1px solid #555;padding:8px;margin:10px 0;cursor:pointer">
    </div>

    <div id="q047" class="box" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>047</b><div id="tl047"></div>
    </div>

    <div id="q269" class="box" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>269</b><div id="tl269"></div>
    </div>

    <div id="q581" class="box" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>581</b><div id="tl581"></div>
    </div>

    <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
  </div>
  `;

  estruturaBox.onclick=()=>{
    estruturalAtivo=!estruturalAtivo;
    if(!estruturalAtivo){
      quadroAtivo=null;
      estruturalRes=[];
    }
    atualizarBordas();
  };

  function cliqueQuadro(id){
    if(!estruturalAtivo) return;
    quadroAtivo = quadroAtivo===id ? null : id;
    atualizarBordas();
  }

  q047.onclick=()=>cliqueQuadro("q047");
  q269.onclick=()=>cliqueQuadro("q269");
  q581.onclick=()=>cliqueQuadro("q581");

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

    estruturalSnapshot = estruturalCentros.slice();
    estruturalCentros = gerarEstrutural();

    render();
  }

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
      tl047:[0,4,7],
      tl269:[2,6,9],
      tl581:[5,8,1]
    };

    Object.entries(grupos).forEach(([id,grupo])=>{
      const dupla = melhorDupla(grupo);
      document.getElementById(id).innerHTML=`
        <div style="color:#00e676;font-size:12px">Melhor Dupla: ${dupla||"-"}</div>
        ${timeline.map(n=>`
          <span style="
            display:inline-block;
            width:18px;
            text-align:center;
            background:${corQuadro(n,grupo)};
            margin-right:2px;
          ">${n}</span>
        `).join("")}
      `;
    });

    atualizarBordas();
  }

  render();

})();
