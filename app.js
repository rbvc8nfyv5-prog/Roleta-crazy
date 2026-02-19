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
let duplaPreferida = null;

const CORES = {
  0:"#00e676",
  4:"#2196f3",
  7:"#ff5252",
  2:"#ff9800",
  6:"#9c27b0",
  9:"#00bcd4",
  5:"#8bc34a",
  8:"#e91e63",
  1:"#ffc107"
};function vizinhos1(n){
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

  if(duplaPreferida){
    const termos = duplaPreferida.split("-").map(Number);
    centros.sort((a,b)=>{
      const pa = termos.includes(terminal(a))?1:0;
      const pb = termos.includes(terminal(b))?1:0;
      return pb-pa;
    });
  }

  return centros.slice(0,5);
}

function melhorDupla(grupo){

  const duplas=[];
  for(let i=0;i<grupo.length;i++)
    for(let j=i+1;j<grupo.length;j++)
      duplas.push([grupo[i],grupo[j]]);

  const cont={};

  duplas.forEach(d=>{
    const key=d.join("-");
    cont[key]=0;
    timeline.forEach(n=>{
      if(vizinhos1(n).some(v=>d.includes(terminal(v))))
        cont[key]++;
    });
  });

  const ord = Object.entries(cont)
    .sort((a,b)=>b[1]-a[1]);

  return ord.length?ord[0][0]:null;
}document.body.style.background="#111";
document.body.style.color="#fff";
document.body.style.fontFamily="sans-serif";

document.body.innerHTML=`
<div style="max-width:1000px;margin:auto;padding:10px">

<h3>CSM</h3>

<div>🕒 Timeline:<div id="tl"></div></div>

<div id="estruturaBox" style="border:1px solid #555;padding:8px;margin:10px 0;cursor:pointer"></div>

<div id="tl047" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer"></div>
<div id="tl269" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer"></div>
<div id="tl581" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer"></div>

<div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>

</div>
`;

estruturaBox.onclick=()=>{
  estruturalAtivo=!estruturalAtivo;
  if(!estruturalAtivo){
    duplaPreferida=null;
    quadroAtivo=null;
  }
  render();
};

function cliqueQuadro(id,grupo){
  if(!estruturalAtivo) return;
  quadroAtivo=id;
  duplaPreferida=melhorDupla(grupo);
  estruturalCentros=gerarEstrutural();
  render();
}

tl047.onclick=()=>cliqueQuadro("tl047",[0,4,7]);
tl269.onclick=()=>cliqueQuadro("tl269",[2,6,9]);
tl581.onclick=()=>cliqueQuadro("tl581",[5,8,1]);

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

  estruturalCentros=gerarEstrutural();
  render();
}function render(){

  tl.innerHTML = timeline.map((n,i)=>{
    const r=estruturalRes[i];
    const cor=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
    return `<span style="color:${cor}">${n}</span>`;
  }).join(" · ");

  estruturaBox.innerHTML=`
    <b>Leitor Estrutural</b><br>
    ${duplaPreferida?`<div style="color:#00e676">Dupla: ${duplaPreferida}</div>`:""}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
      ${estruturalCentros.map(n=>`
        <div style="border:1px solid #00e676;padding:6px">${n}</div>
      `).join("")}
    </div>
  `;

  const quadros={
    tl047:[0,4,7],
    tl269:[2,6,9],
    tl581:[5,8,1]
  };

  Object.entries(quadros).forEach(([id,grupo])=>{

    const dupla=melhorDupla(grupo);

    const mapa={};

    grupo.forEach(t=>{
      track.forEach(num=>{
        if(terminal(num)===t){
          mapa[num]=CORES[t];
          vizinhos1(num).forEach(v=>{
            mapa[v]=CORES[t];
          });
        }
      });
    });

    document.getElementById(id).innerHTML=`
      <b>${id.replace("tl","")}</b>
      <div style="color:#00e676;font-size:12px">
        Melhor Dupla: ${dupla||"-"}
      </div>
      ${timeline.map(n=>{
        const cor=mapa[n]||"transparent";
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
}

render();

})();
