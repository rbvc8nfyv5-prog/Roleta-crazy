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
let rotHorario = 0;
let rotAnti = 0;

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
  const i = track.indexOf(n);
  return track[(i + offset + 37) % 37];
}

/* ================= MOTOR BASE (NÃO MEXER) ================= */

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

/* ================= UI ================= */

document.body.style.background="#111";
document.body.style.color="#fff";
document.body.style.fontFamily="sans-serif";

document.body.innerHTML = `
<div style="max-width:1100px;margin:auto;padding:10px">

<h3>CSM Estrutural</h3>

<div style="margin-bottom:10px">
🕒 Timeline:
<div id="tlBase" style="font-weight:600;font-size:18px"></div>
</div>

<div style="border:1px solid #555;padding:10px;margin-bottom:10px">
<b>Núcleo Base</b><br>
Rotação:
<input type="range" min="-5" max="5" value="0" id="rotB">
<span id="rotBVal">0</span>
<div id="estruturaBox"></div>
</div>

<div style="display:flex;gap:20px">

  <div style="flex:1;border:1px solid #00e676;padding:10px">
    <b>Horário</b><br>
    Rotação:
    <input type="range" min="-5" max="5" value="0" id="rotH">
    <span id="rotHVal">0</span>
    <div id="horarioBox"></div>
  </div>

  <div style="flex:1;border:1px solid #2196f3;padding:10px">
    <b>Anti-Horário</b><br>
    Rotação:
    <input type="range" min="-5" max="5" value="0" id="rotA">
    <span id="rotAVal">0</span>
    <div id="antiBox"></div>
  </div>

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

/* ================= VALIDAÇÃO BASE (1 VIZINHO) ================= */
/* IMPORTANTÍSSIMO: valida com o núcleo ATUAL (antes do recálculo) */
function validarBaseAntesDoRecalculo(n){
  // se ainda não existe núcleo calculado na tela, não valida (neutro)
  if(!estruturalCentros || estruturalCentros.length < 5) return "N";

  const centrosRot = estruturalCentros.map(c => rotacionar(c, rotBase));
  const c6Rot = (estruturalC6 !== null && estruturalC6 !== undefined)
    ? rotacionar(estruturalC6, rotBase)
    : null;

  if(centrosRot.some(c => vizinhos1(c).includes(n))) return "V";
  if(c6Rot !== null && vizinhos1(c6Rot).includes(n)) return "R";
  return "X";
}

/* ================= ADD ================= */

function add(n){

  // 1) VALIDAR COM O NÚCLEO QUE ESTAVA NA TELA
  const res = validarBaseAntesDoRecalculo(n);
  estruturalRes.unshift(res);

  // 2) AGORA INSERE O NÚMERO
  timeline.unshift(n);

  // 3) RECALCULA O NÚCLEO PARA O PRÓXIMO NÚMERO
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

    let cor = "#aaa"; // neutro
    if(r==="V") cor="#00e676";
    if(r==="R") cor="#9c27b0";
    if(r==="X") cor="#ff5252";
    // "N" fica cinza mesmo

    return `<span style="color:${cor}">${n}</span>`;
  }).join(" · ");

  const baseRot = (estruturalCentros || []).map(c=>rotacionar(c,rotBase));
  const c6Rot = (estruturalC6!==null && estruturalC6!==undefined)
    ? rotacionar(estruturalC6,rotBase)
    : null;

  estruturaBox.innerHTML = `
  C1–C5: ${baseRot.join(" , ")}<br>
  C6: <span style="color:#9c27b0">${c6Rot}</span>
  `;

  if(timeline.length){

    const ultimo = timeline[0];
    const v = vizinhos1(ultimo);

    let horario = gerarEstruturalBase(v);
    let anti = gerarEstruturalBase([v[2],v[1],v[0]]);

    horario.centros = horario.centros.map(n=>rotacionar(n,rotHorario));
    horario.ruptura = rotacionar(horario.ruptura,rotHorario);

    anti.centros = anti.centros.map(n=>rotacionar(n,rotAnti));
    anti.ruptura = rotacionar(anti.ruptura,rotAnti);

    horarioBox.innerHTML = `
      C1–C5: ${horario.centros.join(" , ")}<br>
      C6: ${horario.ruptura}
    `;

    antiBox.innerHTML = `
      C1–C5: ${anti.centros.join(" , ")}<br>
      C6: ${anti.ruptura}
    `;
  }
}

/* ================= CONTROLES ================= */

rotB.oninput = function(){
  rotBase = parseInt(this.value);
  rotBVal.innerText = rotBase;
  render();
};

rotH.oninput = function(){
  rotHorario = parseInt(this.value);
  rotHVal.innerText = rotHorario;
  render();
};

rotA.oninput = function(){
  rotAnti = parseInt(this.value);
  rotAVal.innerText = rotAnti;
  render();
};

// estado inicial: calcula núcleo quando tiver números (por enquanto vazio)
render();

})();
