(function(){

const track=[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
const reds=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

const terminais={
0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
7:[7,17,27],8:[8,18,28],9:[9,19,29]
};

const coresT={0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",
5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"};

let hist=[];
let modoPadrao=1; // 1 ou 2

function corNum(n){ if(n===0)return"#0f0"; return reds.includes(n)?"#e74c3c":"#000"; }

function coverT(t){
 let s=new Set();
 terminais[t].forEach(n=>{
  let i=track.indexOf(n);
  s.add(n); s.add(track[(i+36)%37]); s.add(track[(i+1)%37]);
 });
 return s;
}

function detectaPadrao(seq){
 if(modoPadrao===1){
  let p=["A","B","A"];
  for(let i=0;i<=seq.length-3;i++){
   let a=seq[i],b=seq[i+1],c=seq[i+2];
   if(a!==b && a===c) return true;
  }
 }
 if(modoPadrao===2){
  let p=[0,1,1,0,1,1];
  for(let i=0;i<=seq.length-6;i++){
   let s=seq.slice(i,i+6);
   if(s[0]!==s[1] &&
      s[1]===s[2] &&
      s[0]===s[3] &&
      s[3]!==s[4] &&
      s[4]===s[5]) return true;
  }
 }
 return false;
}

document.body.innerHTML=`
<div style="padding:14px;max-width:1100px;margin:auto">
<h2 style="text-align:center">Roleta – Padrões</h2>
<div id="linhas"></div>
<div id="botoes" style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;max-width:520px;margin:12px auto"></div>
<div style="text-align:center;margin-top:10px">
<button id="p1">PADRÃO T1-T2-T1</button>
<button id="p2">PADRÃO T1-T2-T2-T1-T2-T2</button>
</div>
</div>
`;

const linhas=document.getElementById("linhas");
const botoes=document.getElementById("botoes");

for(let i=0;i<5;i++){
 let b=document.createElement("div");
 b.innerHTML=`
 <div id="hist${i}" style="border:1px solid #666;background:#222;border-radius:6px;
 padding:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center"></div>
 <div id="info${i}" style="text-align:center;font-size:13px;margin-bottom:10px"></div>
 `;
 linhas.appendChild(b);
}

for(let n=0;n<=36;n++){
 let b=document.createElement("button");
 b.textContent=n;
 b.onclick=()=>{hist.push(n);render();};
 botoes.appendChild(b);
}

document.getElementById("p1").onclick=()=>{modoPadrao=1;render();};
document.getElementById("p2").onclick=()=>{modoPadrao=2;render();};

function render(){
 let ult=hist.slice(-14).reverse();
 let pares=[[0,1],[2,3],[4,5],[6,7],[8,9]];

 for(let i=0;i<5;i++){
  let h=document.getElementById("hist"+i);
  let info=document.getElementById("info"+i);
  h.innerHTML=""; info.innerHTML="";
  let [a,b]=pares[i];
  let ca=coverT(a),cb=coverT(b);
  let seq=[];

  ult.forEach((n,idx)=>{
   let w=document.createElement("div");
   w.style="display:flex;flex-direction:column;align-items:center";
   let d=document.createElement("div");
   d.textContent=n;
   d.style=`padding:6px 8px;border-radius:6px;font-size:20px;background:${corNum(n)};
   color:${corNum(n)==="#000"?"#fff":"#000"}`;
   if(i===0){
    d.style.cursor="pointer";
    d.onclick=()=>{hist.splice(hist.length-1-idx,1);render();};
   }
   w.appendChild(d);

   if(ca.has(n)||cb.has(n)){
    let t=ca.has(n)?a:b;
    seq.push(t);
    let l=document.createElement("div");
    l.textContent="T"+t;
    l.style=`font-size:12px;font-weight:bold;color:${coresT[t]}`;
    w.appendChild(l);
   }
   h.appendChild(w);
  });

  if(detectaPadrao(seq)){
   info.innerHTML="🎯 PADRÃO ATIVO";
  }
 }
}

render();

})();
