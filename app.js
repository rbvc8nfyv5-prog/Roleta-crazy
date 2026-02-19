(function () {

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];

  const terminal = n => n % 10;

  let timeline = [];

  // ================= ESTADO =================

  let estruturalCentros = [];
  let estruturalRes = [];
  let estruturalAtivo = false;

  let quadroAtivo = null;
  let duplaPreferida = null;

  // ================= VIZINHOS =================

  function vizinhos1(n){
    const i = track.indexOf(n);
    return [
      track[(i-1+37)%37],
      n,
      track[(i+1)%37]
    ];
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
  }  // ================= MELHOR DUPLA =================

  function melhorDupla(grupo){

    const duplas = [];

    for(let i=0;i<grupo.length;i++){
      for(let j=i+1;j<grupo.length;j++){
        duplas.push([grupo[i],grupo[j]]);
      }
    }

    const cont = {};

    duplas.forEach(d=>{
      const key = d.join("-");
      cont[key]=0;

      timeline.forEach(n=>{
        if(vizinhos1(n).some(v=>d.includes(terminal(v)))){
          cont[key]++;
        }
      });
    });

    const ord = Object.entries(cont)
      .sort((a,b)=>b[1]-a[1]);

    return ord.length ? ord[0][0] : null;
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
      const oposto = track[(track.indexOf(permanencia)+18)%37];
      if(pode(oposto)) registrar(oposto);
    }

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

    // ================= APLICAR PESO DA DUPLA =================

    if(duplaPreferida){

      const dupl = duplaPreferida.split("-").map(x=>+x);

      const candidatos = track.filter(n=>{
        const term = terminal(n);

        // terminal direto
        if(dupl.includes(term)) return true;

        // vizinho físico de número com terminal da dupla
        return track.some(t=>{
          if(dupl.includes(terminal(t))){
            return vizinhos1(t).includes(n);
          }
          return false;
        });
      });

      candidatos.forEach(n=>{
        if(pode(n)) registrar(n);
      });
    }

    // completar até 5
    while(centros.length<5){
      const extra = track.find(n=>pode(n));
      if(extra===undefined) break;
      registrar(extra);
    }

    return centros.slice(0,5);
  }  // ================= UI =================

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

    <div id="q047" class="box"
         style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>047</b><div id="tl047"></div>
    </div>

    <div id="q269" class="box"
         style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>269</b><div id="tl269"></div>
    </div>

    <div id="q581" class="box"
         style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>581</b><div id="tl581"></div>
    </div>

    <div id="nums"
         style="display:grid;grid-template-columns:repeat(9,1fr);
                gap:6px;margin-top:12px"></div>
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
      quadroAtivo=null;
      duplaPreferida=null;
    }

    atualizarBordas();
  };

  function cliqueQuadro(id,grupo){

    if(!estruturalAtivo) return;

    if(quadroAtivo===id){
      quadroAtivo=null;
      duplaPreferida=null;
    } else {
      quadroAtivo=id;
      duplaPreferida=melhorDupla(grupo);
    }

    estruturalCentros = gerarEstrutural();
    atualizarBordas();
    render();
  }

  q047.onclick=()=>cliqueQuadro("q047",[0,4,7]);
  q269.onclick=()=>cliqueQuadro("q269",[2,6,9]);
  q581.onclick=()=>cliqueQuadro("q581",[5,8,1]);  for(let n=0;n<=36;n++){
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
      const cor =
        r==="V"?"#00e676":
        r==="X"?"#ff5252":
        "#aaa";
      return `<span style="color:${cor}">${n}</span>`;
    }).join(" · ");

    estruturaBox.innerHTML=`
      <b>Leitor Estrutural</b><br><br>
      ${duplaPreferida
        ? `<div style="color:#00e676">Dupla dominante: ${duplaPreferida}</div><br>`
        : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${estruturalCentros.map(n=>`
          <div style="border:1px solid #00e676;padding:6px">
            ${n}
          </div>
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
        <div style="color:#00e676;font-size:12px">
          Melhor Dupla: ${dupla||"-"}
        </div>
        ${timeline.map(n=>`
          <span style="
            display:inline-block;
            width:18px;
            text-align:center;
            background:${
              vizinhos1(n).some(v=>grupo.includes(terminal(v)))
              ? "#00e676"
              : "transparent"
            };
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
