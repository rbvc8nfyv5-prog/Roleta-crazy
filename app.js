javascript:(function(){

/* ================= CONFIG BASE ================= */
const track=[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

const terminais={
0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
7:[7,17,27],8:[8,18,28],9:[9,19,29]
};

const coresT={0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"};
const corT3="#bdbdbd";

/* ================= ESTADO ================= */
let hist=[];
let contAlvo=0;

let eventoAlvo=null;
let eventoSeco=null;

let alvoAtivo=false;
let secoAtivo=false;

let esperaSeco=-1;
let secoIndicado=false;
let secoValidar=false;

let vxAlvo=[];
let vxSeco=[];
const MAX_VX=6;

/* ================= FUNÇÕES ================= */
function vizinhos(n,d){
 let i=track.indexOf(n);
 let s=new Set([n]);
 for(let k=1;k<=d;k++){
  s.add(track[(i+k)%37]);
  s.add(track[(i-k+37)%37]);
 }
 return s;
}

function analisarCentros(){
 if(hist.length<6)return[];
 let u=hist.slice(-14).reverse();
 let r=[];
 for(let n of u){
  if(r.every(x=>{
   let d=Math.abs(track.indexOf(x)-track.indexOf(n));
   return Math.min(d,37-d)>=6;
  })){
   r.push(n);
   if(r.length===3)break;
  }
 }
 return r;
}

function alvoSeco(){
 let c=analisarCentros();
 if(c.length<3)return[];
 let s=new Set();
 c.forEach(n=>{
  let i=track.indexOf(n);
  for(let d=-4;d<=4;d++)s.add(track[(i+37+d)%37]);
 });
 return [...s].slice(0,6);
}

/* ================= UI ================= */
document.getElementById("caballerroApp")?.remove();

const app=document.createElement("div");
app.id="caballerroApp";
app.style="position:fixed;inset:0;background:#111;color:#fff;z-index:999999;font-family:Arial;overflow:auto";
document.body.appendChild(app);

app.innerHTML=`
<div style="padding:10px;max-width:900px;margin:auto">
<h3 style="text-align:center">App Caballerro</h3>

<div id="box6" style="border:2px solid transparent;padding:6px;margin:6px 0">
🎯 ALVO 6: <span id="alvo6"></span>
<div id="vx6"></div>
</div>

<div id="box8" style="border:2px dashed transparent;padding:6px;margin:6px 0">
🎯 ALVO SECO: <span id="alvo8"></span>
<div id="vx8"></div>
</div>

<div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px"></div>
</div>
`;

const nums=document.getElementById("nums");

/* ================= BOTÕES ================= */
for(let n=0;n<=36;n++){
 let b=document.createElement("button");
 b.textContent=n;
 b.style="padding:8px;border-radius:4px;border:none;background:#333;color:#fff";
 b.onclick=()=>{

  hist.push(n);

  alvoAtivo=false;
  secoAtivo=false;

  /* -------- ALVO 6 -------- */
  contAlvo++;
  if(contAlvo===6){
   eventoAlvo=analisarCentros();
   alvoAtivo=true;
   contAlvo=0;
   esperaSeco=0;
   secoIndicado=false;
   secoValidar=false;
  }
  else if(eventoAlvo){
   let area=new Set();
   eventoAlvo.forEach(c=>vizinhos(c,4).forEach(v=>area.add(v)));
   vxAlvo.push(area.has(n)?"V":"X");
   if(vxAlvo.length>MAX_VX)vxAlvo.shift();
   eventoAlvo=null;
  }

  /* -------- CONTROLE SECO -------- */
  if(esperaSeco>=0){
   esperaSeco++;

   if(esperaSeco===2 && !secoIndicado){
    eventoSeco=alvoSeco();
    secoAtivo=true;
    secoIndicado=true;
    secoValidar=true;
   }
   else if(esperaSeco===3 && secoValidar){
    let area=new Set();
    eventoSeco.forEach(c=>vizinhos(c,1).forEach(v=>area.add(v)));
    vxSeco.push(area.has(n)?"V":"X");
    if(vxSeco.length>MAX_VX)vxSeco.shift();
    eventoSeco=null;
    secoValidar=false;
    esperaSeco=-1;
   }
  }

  render();
 };
 nums.appendChild(b);
}

/* ================= RENDER ================= */
function render(){
 document.getElementById("alvo6").textContent=analisarCentros().join(" · ");
 document.getElementById("alvo8").textContent=eventoSeco?eventoSeco.join(" · "):"";

 document.getElementById("box6").style.borderColor=alvoAtivo?"#ffd600":"transparent";
 document.getElementById("box8").style.borderColor=secoAtivo?"#00e5ff":"transparent";

 document.getElementById("vx6").innerHTML=vxAlvo.join(" ");
 document.getElementById("vx8").innerHTML=vxSeco.join(" ");
}

render();

})();
