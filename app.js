(function(){

/* ================= CONFIG BASE ================= */
const track=[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
const terminais={
0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
7:[7,17,27],8:[8,18,28],9:[9,19,29]
};
const coresT={0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"};

/* ================= ESTADO ================= */
let hist=[];
let memoria=[]; // padrões históricos

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

function melhoresPares(h){
 let ult=h.slice(-14);
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

/* ================= ANÁLISE DE JANELA ================= */
function estadoJanela(janela){
 let pares=melhoresPares(janela);
 let scores=pares.map(p=>{
  let ca=coverTerminal(p.a),cb=coverTerminal(p.b);
  let hits=janela.filter(n=>ca.has(n)||cb.has(n)).length;
  return {par:`T${p.a}-${p.b}`,hits};
 });
 scores.sort((a,b)=>b.hits-a.hits);
 return {
  dominante:scores[0].par,
  score:scores.map(s=>s.hits),
 };
}

/* ================= CONSTRUIR MEMÓRIA ================= */
function construirMemoria(){
 memoria=[];
 for(let i=0;i<=hist.length-11;i++){
  let janela=hist.slice(i,i+10);
  let prox=hist[i+10];
  let estado=estadoJanela(janela);
  memoria.push({
   assinatura:estado.score.join(","),
   dominante:estado.dominante,
   prox
  });
 }
}

/* ================= COMPARAR COM AGORA ================= */
function analisarAgora(){
 if(hist.length<10||memoria.length<5) return null;

 let atual=estadoJanela(hist.slice(-10));
 let iguais=memoria.filter(m=>m.assinatura===atual.score.join(","));

 if(iguais.length<3) return null;

 let cont=0, mig=0;
 iguais.forEach(m=>{
  if(m.dominante===atual.dominante) cont++;
  else mig++;
 });

 if(cont/iguais.length>=0.7){
  return {
   tipo:"CONTINUIDADE",
   msg:"🟢 PADRÃO CONFIRMADO — continuar no mesmo par",
   alvo:"Alvo Seco 6"
  };
 }

 if(mig/iguais.length>=0.7){
  return {
   tipo:"MIGRACAO",
   msg:"🔄 PADRÃO DE MIGRAÇÃO — mudar leitura",
   alvo:"Alvo Seco 15"
  };
 }

 return {
  tipo:"EVITAR",
  msg:"⛔ PADRÃO INCONSISTENTE — evitar entrada",
  alvo:null
 };
}

/* ================= UI ================= */
let app=document.createElement("div");
app.style="position:fixed;inset:0;background:#111;color:#fff;z-index:999999;font-family:Arial;overflow:auto";
document.body.appendChild(app);

app.innerHTML=`
<div style="padding:10px;max-width:900px;margin:auto">
<h3 style="text-align:center">App Caballerro</h3>

<textarea id="txtHist" placeholder="Cole o histórico aqui"
 style="width:100%;height:80px"></textarea>
<button id="bLoad">Analisar Histórico</button>

<div id="indicacao" style="margin:10px 0;font-weight:bold"></div>

<div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px"></div>
</div>
`;

const indicacao=app.querySelector("#indicacao");

/* ================= EVENTOS ================= */
app.querySelector("#bLoad").onclick=()=>{
 let txt=app.querySelector("#txtHist").value;
 let nums=txt.match(/\d+/g);
 if(!nums) return;
 hist=nums.map(Number);
 construirMemoria();
 render();
};

for(let n=0;n<=36;n++){
 let b=document.createElement("button");
 b.textContent=n;
 b.onclick=()=>{
  hist.push(n);
  construirMemoria();
  render();
 };
 app.querySelector("#nums").appendChild(b);
}

/* ================= RENDER ================= */
function render(){
 let res=analisarAgora();
 if(!res){
  indicacao.textContent="— Nenhum padrão relevante —";
 }else{
  indicacao.innerHTML=`
${res.msg}<br>
🎯 ${res.alvo||"Sem alvo recomendado"}
`;
 }
}

})();
