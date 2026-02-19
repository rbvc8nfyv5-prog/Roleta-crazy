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
  let duplaPreferida = null;

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
    return estruturalSnapshot.some(c => vizinhos2(c).includes(n));
  }  function gerarEstrutural(){

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

    return centros.slice(0,5);
  }

  function melhorDupla(grupo){

    const duplas=[];
    for(let i=0;i<grupo.length;i++)
      for(let j=i+1;j<grupo.length;j++)
        duplas.push([grupo[i],grupo[j]]);

    const cont={};

    duplas.forEach(dupla=>{
      const key=dupla.join("-");
      cont[key]=0;

      timeline.forEach(n=>{
        if(vizinhos1(n).some(v=>dupla.includes(terminal(v))))
          cont[key]++;
      });
    });

    const ord = Object.entries(cont)
      .sort((a,b)=>b[1]-a[1]);

    return ord.length?ord[0][0]:null;
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
      if(el){
        el.style.border="2px solid #00e676";
        el.style.boxShadow="0 0 8px #00e676";
      }
    }
  }

  estruturaBox.onclick=()=>{
    estruturalAtivo=!estruturalAtivo;
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

    estruturalCentros=gerarEstrutural();
    atualizarBordas();
    render();
  }

  q047.onclick=()=>cliqueQuadro("q047",[0,4,7]);
  q269.onclick=()=>cliqueQuadro("q269",[2,6,9]);
  q581.onclick=()=>cliqueQuadro("q581",[5,8,1]);

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

    estruturalSnapshot = [...estruturalCentros];
    estruturalCentros = gerarEstrutural();

    render();
  }  function render(){

    tl.innerHTML = timeline.map((n,i)=>{
      const r=estruturalRes[i];
      const cor=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${cor}">${n}</span>`;
    }).join(" · ");

    estruturaBox.innerHTML=`
      <b>Leitor Estrutural</b><br><br>
      ${duplaPreferida?`<div style="color:#00e676">Viés Dupla: ${duplaPreferida}</div><br>`:""}
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

      const dupla=melhorDupla(grupo);

      document.getElementById(id).innerHTML=`
        <div style="color:#00e676;font-size:12px">
          Melhor Dupla: ${dupla||"-"}
        </div>
        ${timeline.map(n=>{

          let cor="transparent";

          grupo.forEach((base,index)=>{
            const numBase = track.find(x=>terminal(x)===base);
            if(numBase!==undefined){
              if(vizinhos1(numBase).includes(n)){
                if(index===0) cor="#00e676";
                if(index===1) cor="#ff9800";
                if(index===2) cor="#2196f3";
              }
            }
          });

          return `
            <span style="
              display:inline-block;
              width:18px;
              text-align:center;
              background:${cor};
              margin-right:2px;
            ">${n}</span>
          `;
        }).join("")}
      `;
    });

    atualizarBordas();
  }

  render();

})();
