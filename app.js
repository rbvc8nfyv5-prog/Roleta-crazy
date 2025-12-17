(function(){

/* ================= BASE ================= */
const track=[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
const terminais={
0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
7:[7,17,27],8:[8,18,28],9:[9,19,29]
};
const coresT={0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"};

let hist=[];
let ultimoDominante=null;
let migracoes={};

/* ================= FUNÇÕES BASE ================= */
function coverTerminal(t){
 let s=new Set();
 terminais[t].forEach(n=>{
  let i=track.indexOf(n);
  s.add(n);
  s.add(track[(i+36)%37]);
  s.add(track[(i+1)%37]);
 });
 return s;
}

function melhoresPares(){
 let ult=hist.slice(-14);
 let pares=[];
 for(let a=0;a<10;a++){
  for(let b=a+1;b<10;b++){
   let ca=coverTerminal(a),cb=coverTerminal(b);
   let hits=ult.filter(n=>ca.has(n)||cb.has(n)).length;
   pares.push({a,b,hits});
  }
 }
 return pares.sort((x,y)=>y.hits-x.hits).slice(0,5);
}

/* ================= PASSO 2 ================= */
function analisarLinhas(){
 let ult10=hist.slice(-10);
 let ult5=hist.slice(-5);
 let pares=melhoresPares();

 return pares.map((p,i)=>{
  let ca=coverTerminal(p.a),cb=coverTerminal(p.b);
  let h10=ult10.filter(n=>ca.has(n)||cb.has(n)).length;
  let h5=ult5.filter(n=>ca.has(n)||cb.has(n)).length;
  return {linha:i+1,par:`T${p.a}-${p.b}`,h10,h5};
 });
}

function detectarMigracao(leitura){
 let dominante=leitura.reduce((a,b)=>b.h10>a.h10?b:a,leitura[0]);

 if(ultimoDominante && ultimoDominante!==dominante.linha){
  let key=`L${ultimoDominante}->L${dominante.linha}`;
  migracoes[key]=(migracoes[key]||0)+1;
 }

 ultimoDominante=dominante.linha;
 return dominante;
}

/* ================= UI ================= */
let app=document.getElementById("caballerroApp");
if(app)app.remove();
app=document.createElement("div");
app.id="caballerroApp";
app.style="position:fixed;inset:0;background:#111;color:#fff;z-index:999999;font-family:Arial;overflow:auto";
document.body.appendChild(app);

app.innerHTML=`
<div style="padding:10px;max-width:900px;margin:auto">
<h3 style="text-align:center">App Caballerro</h3>

<div id="linhas"></div>

<div style="border:1px solid #666;padding:6px;margin:6px 0">
📊 <b>LEITURA DAS LINHAS</b>
<div id="leitura"></div>
</div>

<div style="border:1px dashed #999;padding:6px;margin:6px 0">
📌 <b>SITUAÇÃO DA MESA</b>
<div id="situacao"></div>
</div>

<div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px"></div>

<div style="text-align:center;margin-top:10px">
<button id="bClear" style="padding:8px 16px;border:none;border-radius:6px;background:#c62828;color:#fff">Clear</button>
</div>
</div>
`;

const linhas=app.querySelector("#linhas");
const leituraBox=app.querySelector("#leitura");
const situacaoBox=app.querySelector("#situacao");
const nums=app.querySelector("#nums");

for(let i=0;i<5;i++){
 let d=document.createElement("div");
 d.id="h"+i;
 d.style="display:flex;gap:6px;justify-content:center;margin-bottom:6px";
 linhas.appendChild(d);
}

app.querySelector("#bClear").onclick=()=>{hist=[];ultimoDominante=null;migracoes={};render();};

for(let n=0;n<=36;n++){
 let b=document.createElement("button");
 b.textContent=n;
 b.style="font-size:16px;padding:8px;border:none;border-radius:4px";
 b.onclick=()=>{hist.push(n);render();};
 nums.appendChild(b);
}

/* ================= RENDER ================= */
function render(){
 let ult=hist.slice(-14).reverse();
 let pares=melhoresPares();

 for(let i=0;i<5;i++){
  let h=document.getElementById("h"+i);
  h.innerHTML="";
  let p=pares[i]; if(!p)continue;
  let ca=coverTerminal(p.a),cb=coverTerminal(p.b);

  ult.forEach(n=>{
   let box=document.createElement("div");
   box.style="display:flex;flex-direction:column;align-items:center";
   let d=document.createElement("div");
   d.textContent=n;
   d.style="width:26px;height:26px;line-height:26px;background:#444;border-radius:4px;text-align:center";
   box.appendChild(d);
   let t=document.createElement("div");
   if(ca.has(n)){t.textContent="T"+p.a;t.style.color=coresT[p.a];}
   else if(cb.has(n)){t.textContent="T"+p.b;t.style.color=coresT[p.b];}
   if(t.textContent)box.appendChild(t);
   h.appendChild(box);
  });
 }

 let leitura=analisarLinhas();
 leituraBox.innerHTML="";
 leitura.forEach(l=>{
  let cor=l.h10>=6?"#4caf50":l.h10>=4?"#ffb300":"#e53935";
  leituraBox.innerHTML+=`L${l.linha} (${l.par}): <span style="color:${cor}">${l.h10}/10</span><br>`;
 });

 let dom=detectarMigracao(leitura);
 let migTexto=Object.entries(migracoes).map(([k,v])=>`${k} (${v}x)`).join(" | ");
 situacaoBox.innerHTML=`
Linha dominante: <b>L${dom.linha} (${dom.par})</b><br>
Migrações detectadas: ${migTexto||"nenhuma"}
`;
}

render();

})();
