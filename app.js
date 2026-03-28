<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>MESA PRO</title>

<style>
body{background:#000;color:#0f0;font-family:monospace;text-align:center;margin:0;padding:10px;}
#hist{font-size:20px;margin:10px 0;}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;}
.num{padding:14px;font-size:16px;border:none;border-radius:8px;color:white;font-weight:bold;}
.red{background:#c62828;}
.black{background:#111;}
.green{background:#2e7d32;}
.main{margin-top:10px;padding:14px;font-size:18px;width:100%;background:#0f0;color:#000;border:none;border-radius:10px;}
.btn2{margin-top:5px;padding:10px;width:48%;background:#222;color:#0f0;border:none;border-radius:8px;}
.area{margin-top:10px;}
canvas{margin-top:10px;border:1px solid #0f0;}
</style>
</head>

<body>

<h2>MESA PRO (MOTOR COMPLETO REAL)</h2>

<div id="hist">-</div>

<canvas id="radar" width="320" height="320"></canvas>

<div style="display:flex; gap:4%;">
<button class="btn2" id="limpar1">Último</button>
<button class="btn2" id="limpar2">Limpar</button>
</div>

<div class="grid" id="teclado"></div>

<button class="main" id="btn">PROTOCOLO</button>

<div class="area">STATUS: <span id="status">AGUARDANDO</span></div>
<div class="area">TERMINAIS: <span id="terms"></span></div>
<div class="area">AUX: <span id="aux"></span></div>
<div class="area">ALVOS: <span id="alvos"></span></div>
<div class="area">GL: <span id="gl"></span></div>

<script>
document.addEventListener("DOMContentLoaded", function(){

const roda=[
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const reds=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

let nums=[];
let lastAlvos=[];
let glHist=[];
let ultimaBase="";
let liberado=false;
let aguardandoResultado=false;

const hist=document.getElementById("hist");
const teclado=document.getElementById("teclado");
const alvosEl=document.getElementById("alvos");
const statusEl=document.getElementById("status");
const glEl=document.getElementById("gl");
const termsEl=document.getElementById("terms");
const auxEl=document.getElementById("aux");

const canvas=document.getElementById("radar");
const ctx=canvas.getContext("2d");

function desenharRadar(){

  ctx.clearRect(0,0,320,320);

  let cx=160, cy=160;

  ctx.strokeStyle="#0f0";
  ctx.beginPath();
  ctx.arc(cx,cy,140,0,Math.PI*2);
  ctx.stroke();

  roda.forEach((n,i)=>{
    let ang=(i/37)*2*Math.PI + Math.PI/2;
    let x=cx + Math.cos(ang)*120;
    let y=cy + Math.sin(ang)*120;

    ctx.fillStyle = n===0 ? "#0f0" : (reds.includes(n)?"#f44":"#fff");
    ctx.fillText(n,x-6,y+4);
  });

  nums.forEach(n=>{
    let i=roda.indexOf(n);
    let ang=(i/37)*2*Math.PI + Math.PI/2;
    let x=cx + Math.cos(ang)*70;
    let y=cy + Math.sin(ang)*70;

    ctx.fillStyle="#0f0";
    ctx.beginPath();
    ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fill();

    ctx.fillText(n,x+6,y+3);
  });

  lastAlvos.forEach(n=>{
    let idx = roda.indexOf(n);

    for(let k=-4;k<=4;k++){

      let num = roda[(idx + k + 37) % 37];
      let i=roda.indexOf(num);
      let ang=(i/37)*2*Math.PI + Math.PI/2;

      let x=cx + Math.cos(ang)*140;
      let y=cy + Math.sin(ang)*140;

      if(k===0){
        ctx.fillStyle="#00ffff";
        ctx.beginPath();
        ctx.arc(x,y,8,0,Math.PI*2);
        ctx.fill();

        ctx.font="bold 18px monospace";
        ctx.fillText(num,x-10,y-14);
      } else {
        ctx.fillStyle="#004444";
        ctx.beginPath();
        ctx.arc(x,y,4,0,Math.PI*2);
        ctx.fill();
      }
    }
  });
}

function atualizar(){
  hist.innerText=[...nums].reverse().join(" - ");
}

function vizinhos(n){
  let i=roda.indexOf(n);
  return [roda[(i-1+37)%37], n, roda[(i+1)%37]];
}

function conflita(n, usados){
  let zn=vizinhos(n);
  return usados.some(u=>{
    let zu=vizinhos(u);
    return zn.some(x=>zu.includes(x));
  });
}

function add(n){

  if(aguardandoResultado){
    let win=false;

    lastAlvos.forEach(a=>{
      if(vizinhos(a).includes(n)) win=true;
    });

    let bolinha=(win?"🟢":"🔴")+n;
    glHist.unshift(bolinha);
    if(glHist.length>30) glHist.pop();
    glEl.innerText=glHist.join(" ");
  }

  aguardandoResultado=false;

  nums.push(n);
  if(nums.length>14) nums.shift();

  atualizar();
  liberado=true;

  desenharRadar();
}

for(let i=0;i<=36;i++){
  let b=document.createElement("button");

  b.className="num";
  if(i===0)b.classList.add("green");
  else if(reds.includes(i))b.classList.add("red");
  else b.classList.add("black");

  b.innerText=i;
  b.onclick=()=>add(i);

  teclado.appendChild(b);
}

limpar1.onclick=()=>{ nums.pop(); atualizar(); desenharRadar(); };
limpar2.onclick=()=>{ nums=[]; glHist=[]; atualizar(); glEl.innerText=""; desenharRadar(); };

btn.onclick=()=>{

  let baseAtual=nums.join("-");
  if(!liberado || baseAtual===ultimaBase) return;

  ultimaBase=baseAtual;
  liberado=false;
  aguardandoResultado=true;

  if(nums.length<5) return;

  let base=nums.slice(-14);
  let micro=nums.slice(-7);

  let termScore={};

  base.forEach(n=>{
    let t=n%10;
    termScore[t]=(termScore[t]||0)+1;
  });

  micro.forEach(n=>{
    let t=n%10;
    termScore[t]=(termScore[t]||0)+3;
  });

  let termTop=Object.entries(termScore)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(x=>parseInt(x[0]));

  termsEl.innerText=termTop.join(" - ");

  let cont={rp:0,ri:0,bp:0,bi:0};
  base.forEach(n=>{
    if(n===0)return;
    let cor=reds.includes(n)?"r":"b";
    let par=n%2===0?"p":"i";
    cont[cor+par]++;
  });

  let auxTop=Object.entries(cont).sort((a,b)=>b[1]-a[1])[0][0];

  auxEl.innerText=
    auxTop==="rp"?"VERMELHO PAR":
    auxTop==="ri"?"VERMELHO ÍMPAR":
    auxTop==="bp"?"PRETO PAR":
    "PRETO ÍMPAR";

  let seed=base.reduce((a,b)=>a+b,0);
  let offset=seed%37;

  let usados=[], final=[];

  let ultimo = base[base.length-1];
  let idxUlt = roda.indexOf(ultimo);
  let inicio = (idxUlt + offset + 37) % 37;

  for(let i=0;i<37;i++){

    let n = roda[(inicio + i) % 37];

    let cor=reds.includes(n)?"r":"b";
    let par=n%2===0?"p":"i";

    if(cor+par===auxTop){

      let grupo=vizinhos(n);

      for(let g of grupo){
        if(final.length>=9) break;
        if(!conflita(g,usados)){
          final.push(g);
          usados.push(g);
        }
      }
    }

    if(final.length>=6) break;
  }

  for(let i=0;i<37;i++){
    let n = roda[(inicio + i) % 37];
    if(!conflita(n,usados)){
      final.push(n);
      usados.push(n);
    }
    if(final.length>=9) break;
  }

  lastAlvos=[...final];
  alvosEl.innerText=final.join(" - ");
  statusEl.innerText="DINÂMICO";

  desenharRadar();
};

desenharRadar();

});
</script>

</body>
</html>
