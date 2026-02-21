(function(){

const track = [
  32,15,19,4,21,2,25,17,34,6,
  27,13,36,11,30,8,23,10,5,24,
  16,33,1,20,14,31,9,22,18,29,
  7,28,12,35,3,26,0
];

let timeline = [];

let baseCentros = [];
let baseC6 = null;

let horarioCentros = [];
let horarioC6 = null;

let antiCentros = [];
let antiC6 = null;

let baseRes = [];
let horarioRes = [];
let antiRes = [];

let rotHorario = 0;
let rotAnti = 0;

/* ================= UTIL ================= */

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

/* ================= MOTOR BASE ================= */

function gerarBase(lista){

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

  const candidatos = track
    .map(n=>({n,score:freq[n]||0}))
    .sort((a,b)=>b.score-a.score)
    .map(x=>x.n);

  for(const n of candidatos){
    if(pode(n)) registrar(n);
    if(centros.length>=5) break;
  }

  let ruptura = track.find(n=>!centros.includes(n));

  return {centros,ruptura};
}

/* ================= VALIDAÇÃO ================= */

function validarNumero(n,centros,c6){
  if(centros.some(c=>vizinhos1(c).includes(n))) return "V";
  if(c6 && vizinhos1(c6).includes(n)) return "R";
  return "X";
}

/* ================= ADD ================= */

function add(n){

  // BASE
  const base = gerarBase(timeline);
  baseCentros = base.centros;
  baseC6 = base.ruptura;
  baseRes.unshift(validarNumero(n,baseCentros,baseC6));

  // HORÁRIO
  if(timeline.length){
    const ultimo = timeline[0];
    const v = vizinhos1(ultimo);
    const h = gerarBase(v);

    horarioCentros = h.centros.map(x=>rotacionar(x,rotHorario));
    horarioC6 = rotacionar(h.ruptura,rotHorario);

    horarioRes.unshift(validarNumero(n,horarioCentros,horarioC6));

    const a = gerarBase([v[2],v[1],v[0]]);
    antiCentros = a.centros.map(x=>rotacionar(x,rotAnti));
    antiC6 = rotacionar(a.ruptura,rotAnti);

    antiRes.unshift(validarNumero(n,antiCentros,antiC6));
  }

  timeline.unshift(n);

  render();
}

/* ================= UI ================= */

document.body.style.background="#111";
document.body.style.color="#fff";
document.body.style.fontFamily="sans-serif";

document.body.innerHTML = `
<div style="max-width:1100px;margin:auto;padding:10px">

<h3>CSM Estrutural</h3>

<div>
🕒 Base:
<div id="tlBase"></div>
</div>

<div>
🕒 Horário:
<div id="tlHorario"></div>
</div>

<div>
🕒 Anti:
<div id="tlAnti"></div>
</div>

<div style="margin:10px 0">
Horário Rot:
<input type="range" min="-5" max="5" value="0" id="rotH">
<span id="rotHVal">0</span>

Anti Rot:
<input type="range" min="-5" max="5" value="0" id="rotA">
<span id="rotAVal">0</span>
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

/* ================= CONTROLES ================= */

rotH.oninput=function(){
  rotHorario=parseInt(this.value);
  rotHVal.innerText=rotHorario;
};

rotA.oninput=function(){
  rotAnti=parseInt(this.value);
  rotAVal.innerText=rotAnti;
};

/* ================= RENDER ================= */

function pintar(lista,res,el){
  el.innerHTML = lista.slice(0,14).map((n,i)=>{
    const r = res[i];
    let cor="#aaa";
    if(r==="V") cor="#00e676";
    if(r==="R") cor="#9c27b0";
    if(r==="X") cor="#ff5252";
    return `<span style="color:${cor}">${n}</span>`;
  }).join(" · ");
}

function render(){
  pintar(timeline,baseRes,tlBase);
  pintar(timeline,horarioRes,tlHorario);
  pintar(timeline,antiRes,tlAnti);
}

})();
