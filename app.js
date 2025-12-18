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
let hist=[];           // histórico completo (oculto)
let histVisivel=[];    // últimos 14
let eventosT=[];       // sequência de eventos T (oculto)

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

/* ================= EVENTO T ================= */
function eventoT(n,par){
  let ca=coverTerminal(par.a);
  let cb=coverTerminal(par.b);
  if(ca.has(n)) return "T"+par.a;
  if(cb.has(n)) return "T"+par.b;
  return null;
}

/* ================= MEMÓRIA DE PADRÕES ================= */
function analisarPadrao(){
  if(eventosT.length < 4) return null;

  let seqAtual = eventosT.slice(-3).join("-");
  let ocorrencias=[];
  
  for(let i=0;i<=eventosT.length-4;i++){
    let seq = eventosT.slice(i,i+3).join("-");
    if(seq===seqAtual){
      ocorrencias.push({
        prox:eventosT[i+3],
        numero:hist[i+3]
      });
    }
  }

  if(ocorrencias.length < 3) return null;

  let contT={}, contNum={};
  ocorrencias.forEach(o=>{
    if(o.prox){
      contT[o.prox]=(contT[o.prox]||0)+1;
    }
    contNum[o.numero]=(contNum[o.numero]||0)+1;
  });

  let melhorT = Object.entries(contT).sort((a,b)=>b[1]-a[1])[0];
  let melhorNum = Object.entries(contNum).sort((a,b)=>b[1]-a[1])[0];

  if(!melhorT || melhorT[1]/ocorrencias.length < 0.6) return null;

  let t = parseInt(melhorT[0].replace("T",""));
  let nums=[...coverTerminal(t)];
  let idx=nums.indexOf(parseInt(melhorNum[0]));
  let foco = idx>-1 ? [
    nums[idx],
    nums[(idx+1)%nums.length],
    nums[(idx-1+nums.length)%nums.length]
  ] : nums.slice(0,3);

  return {
    seq:seqAtual.replace(/-/g," → "),
    t:melhorT[0],
    nums:foco,
    vezes:ocorrencias.length
  };
}

/* ================= UI ================= */
let app=document.createElement("div");
app.style="position:fixed;inset:0;background:#111;color:#fff;z-index:999999;font-family:Arial;overflow:auto";
document.body.appendChild(app);

app.innerHTML=`
<div style="padding:10px;max-width:900px;margin:auto">
<h3 style="text-align:center">App Caballerro</h3>

<textarea id="txtHist" placeholder="Cole histórico aqui" style="width:100%;height:60px"></textarea>
<button id="bLoad">Carregar Histórico</button>

<div id="indicacao" style="margin:10px 0;font-weight:bold"></div>

<div id="linhas"></div>

<div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px"></div>
</div>
`;

const indicacao=app.querySelector("#indicacao");
const linhas=app.querySelector("#linhas");

/* ================= CONTROLES ================= */
app.querySelector("#bLoad").onclick=()=>{
  let t=app.querySelector("#txtHist").value.match(/\d+/g);
  if(!t) return;
  t.map(Number).forEach(n=>registrarNumero(n));
};

for(let n=0;n<=36;n++){
  let b=document.createElement("button");
  b.textContent=n;
  b.onclick=()=>registrarNumero(n);
  app.querySelector("#nums").appendChild(b);
}

/* ================= REGISTRAR NÚMERO ================= */
function registrarNumero(n){
  hist.push(n);
  histVisivel.push(n);
  if(histVisivel.length>14) histVisivel.shift();

  let pares=melhoresPares();
  pares.forEach(p=>{
    let ev=eventoT(n,p);
    if(ev) eventosT.push(ev);
  });

  render();
}

/* ================= RENDER ================= */
function render(){
  linhas.innerHTML="";
  let pares=melhoresPares();
  let ult=[...histVisivel].reverse();

  for(let i=0;i<5;i++){
    let p=pares[i];
    if(!p) continue;
    let h=document.createElement("div");
    h.style="display:flex;gap:6px;justify-content:center;margin-bottom:6px";

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
      if(t.textContent) box.appendChild(t);
      h.appendChild(box);
    });
    linhas.appendChild(h);
  }

  let padrao=analisarPadrao();
  if(!padrao){
    indicacao.textContent="— Nenhum padrão relevante —";
  }else{
    indicacao.innerHTML=`
📌 PADRÃO DETECTADO<br>
Sequência: ${padrao.seq}<br>
Ocorrências: ${padrao.vezes}<br>
👉 Jogar em ${padrao.t}<br>
🎯 Números: ${padrao.nums.join(" · ")}
`;
  }
}

})();
