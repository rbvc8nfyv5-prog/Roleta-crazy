(function () {

const track = [
32,15,19,4,21,2,25,17,34,6,
27,13,36,11,30,8,23,10,5,24,
16,33,1,20,14,31,9,22,18,29,
7,28,12,35,3,26,0
];

const vermelhos = new Set([
1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
]);

const terminal = n => n % 10;

let timeline = [];
let filtrosT = new Set();

function vizinhosRace(n){
const i = track.indexOf(n);
return [
track[(i+36)%37],
n,
track[(i+1)%37]
];
}

document.body.style.background="#111";
document.body.style.color="#fff";
document.body.style.fontFamily="sans-serif";

document.body.innerHTML = `
<div style="max-width:1000px;margin:auto;padding:10px">

<h3 style="text-align:center">CSM</h3>

<div style="display:flex;justify-content:center;margin:10px 0">
<canvas id="radar" width="260" height="260"></canvas>
</div>

<div style="margin:10px 0">
🕒 Timeline:
<span id="tl" style="font-size:18px;font-weight:600"></span>
</div>

<div style="border:1px solid #555;padding:8px;margin-bottom:10px">
Terminais
<div id="btnT" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
</div>

<div id="nums"
style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px">
</div>

</div>
`;

for(let t=0;t<=9;t++){
const b=document.createElement("button");
b.textContent="T"+t;
b.style="padding:6px;background:#444;color:#fff;border:1px solid #666";
b.onclick=()=>{

if(filtrosT.has(t)){
filtrosT.delete(t);
}else{
filtrosT.add(t);
}

render();
};

btnT.appendChild(b);
}

for(let n=0;n<=36;n++){

const b=document.createElement("button");
b.textContent=n;

let cor="#222";

if(vermelhos.has(n)) cor="#ff2d55";
if(n===0) cor="#00c853";

b.style=`
padding:8px;
background:${cor};
color:#fff;
border:none;
border-radius:6px
`;

b.onclick=()=>add(n);

nums.appendChild(b);
}

function add(n){

timeline.unshift(n);

if(timeline.length>14){
timeline.pop();
}

render();
}

function desenharRadar(){

const canvas=document.getElementById("radar");
const ctx=canvas.getContext("2d");

ctx.clearRect(0,0,260,260);

const cx=130;
const cy=130;
const r=110;

const ang=(Math.PI*2)/track.length;

const marcados = new Map();

filtrosT.forEach(t=>{

track.forEach(n=>{

if(terminal(n)===t){

vizinhosRace(n).forEach(v=>{

marcados.set(v,true);

});

}

});

});

for(let i=0;i<track.length;i++){

const a1=i*ang+Math.PI/2;
const a2=a1+ang;

ctx.beginPath();
ctx.moveTo(cx,cy);
ctx.arc(cx,cy,r,a1,a2);
ctx.closePath();

ctx.fillStyle="#1c1c1c";
ctx.fill();

const meio=(a1+a2)/2;

const tx=cx+Math.cos(meio)*(r-25);
const ty=cy+Math.sin(meio)*(r-25);

let corNumero="#fff";

if(vermelhos.has(track[i])){
corNumero="#ff2d55";
}

if(track[i]===0){
corNumero="#00c853";
}

if(marcados.has(track[i])){
ctx.beginPath();
ctx.arc(tx,ty,10,0,Math.PI*2);
ctx.fillStyle="#00e676";
ctx.fill();
}

ctx.fillStyle=corNumero;

ctx.font="9px Arial";
ctx.textAlign="center";
ctx.textBaseline="middle";

ctx.fillText(track[i],tx,ty);

}

ctx.beginPath();
ctx.arc(cx,cy,45,0,Math.PI*2);
ctx.fillStyle="#111";
ctx.fill();
}

function render(){

tl.innerHTML = timeline
.map(n=>{

let cor="#fff";

if(vermelhos.has(n)){
cor="#ff2d55";
}

if(n===0){
cor="#00c853";
}

return `<span style="color:${cor}">${n}</span>`;

})
.join(" · ");

document.querySelectorAll("#btnT button").forEach(b=>{

const t=+b.textContent.slice(1);

b.style.background = filtrosT.has(t)
? "#00e676"
: "#444";

});

desenharRadar();

}

render();

})();
