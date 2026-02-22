(function(){

const track = [
  32,15,19,4,21,2,25,17,34,6,
  27,13,36,11,30,8,23,10,5,24,
  16,33,1,20,14,31,9,22,18,29,
  7,28,12,35,3,26,0
];

let timeline = [];
let estruturalCentros = [];
let estruturalC6 = null;

let estruturalRes = [];

let rotBase = 0;
let modoVizinho = 2; // 🔥 1 ou 2 vizinhos

/* ================= UTIL ================= */

function dist(a,b){
  const ia = track.indexOf(a);
  const ib = track.indexOf(b);
  const d = Math.abs(ia-ib);
  return Math.min(d,37-d);
}

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

function rotacionar(n,offset){
  if(n===null) return null;
  const i = track.indexOf(n);
  return track[(i + offset + 37) % 37];
}

/* ================= MOTOR BASE ================= */

function gerarEstruturalBase(lista){

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
  lista.forEach(n=>freq[n]=(freq[n]||0)+1);

  const freqViz = {};
  lista.forEach(n=>{
    vizinhos2(n).forEach(v=>{
      freqViz[v]=(freqViz[v]||0)+1;
    });
  });

  const candidatos = track.map(n=>{
    const permanencia = freq[n] || 0;
    const calor = freqViz[n] || 0;
    const score = (permanencia * 1.2) + (calor * 1.0);
    return {n,score};
  })
  .sort((a,b)=>b.score-a.score)
  .map(x=>x.n);

  for(const n of candidatos){
    if(pode(n)) registrar(n);
    if(centros.length>=5) break;
  }

  let melhorScore = -1;
  let melhorC6 = null;

  track.forEach(n=>{
    if(centros.includes(n)) return;
    const dMedia = centros.reduce((acc,c)=>acc+dist(c,n),0)/centros.length;
    if(dMedia > melhorScore){
      melhorScore = dMedia;
      melhorC6 = n;
    }
  });

  return { centros, ruptura: melhorC6 };
}

/* ================= VALIDAÇÃO ================= */

function dentroNucleo(n){

  for(const c of estruturalCentros){

    const zona = modoVizinho === 1
      ? vizinhos1(c)
      : vizinhos2(c);

    if(zona.includes(n)) return true;
  }

  return false;
}

/* ================= UI ================= */

document.body.style.background="#111";
document.body.style.color="#fff";
document.body.style.fontFamily="sans-serif";

document.body.innerHTML = `
<div style="max-width:1100px;margin:auto;padding:10px">

<h3>CSM Estrutural</h3>

<div style="margin-bottom:10px">
🕒 Timeline Base:
<div id="tlBase" style="font-weight:600;font-size:18px"></div>
</div>

<div style="margin-bottom:10px">
Modo Validação:
<select id="modoSel">
  <option value="1">1 vizinho</option>
  <option value="2" selected>2 vizinhos</option>
</select>
</div>

<div style="border:1px solid #555;padding:10px;margin:10px 0">
  <b>Núcleo Base</b><br>
  Rotação:
  <input type="range" min="-5" max="5" value="0" id="rotB">
  <span id="rotBVal">0</span>
  <div id="baseBox"></div>
</div>

<div id="nums"
     style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px">
</div>

</div>
`;

for(let n=0;n<=36;n++){
  const b=document.createElement("button");
  b.textContent=n;
  b.style="padding:10px;background:#222;color:#fff;border:1px solid #444";
  b.onclick=()=>add(n);
  nums.appendChild(b);
}

/* ================= ADD ================= */

function add(n){

  if(estruturalCentros.length){
    estruturalRes.unshift(
      dentroNucleo(n) ? "V" : "X"
    );
  }

  timeline.unshift(n);

  const base = gerarEstruturalBase(timeline);
  estruturalCentros = base.centros;
  estruturalC6 = base.ruptura;

  render();
}

/* ================= RENDER ================= */

function render(){

  const ultimos14 = timeline.slice(0,14);
  const ultRes = estruturalRes.slice(0,14);

  tlBase.innerHTML = ultimos14.map((n,i)=>{
    const r = ultRes[i];
    let cor = "#aaa";
    if(r==="V") cor="#00e676";
    if(r==="X") cor="#ff5252";
    return `<span style="color:${cor}">${n}</span>`;
  }).join(" · ");

  let centrosRot = estruturalCentros.map(n=>rotacionar(n,rotBase));

  baseBox.innerHTML = `
    C1–C5: ${centrosRot.join(" , ")}<br>
    C6: ${rotacionar(estruturalC6,rotBase)}
  `;
}

/* ================= CONTROLES ================= */

rotB.oninput = function(){
  rotBase = parseInt(this.value);
  rotBVal.innerText = rotBase;
  render();
};

modoSel.onchange = function(){
  modoVizinho = parseInt(this.value);
};

render();

})();
