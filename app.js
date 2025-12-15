(function(){

/* ================= CONFIGURAÇÃO ================= */

const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
const reds  = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

const terminais = {
 0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
 4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
 7:[7,17,27],8:[8,18,28],9:[9,19,29]
};

const coresT = {
 0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",
 5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"
};

// 5 pares fixos (visual)
const pares = [[0,1],[2,3],[4,5],[6,7],[8,9]];

let hist = [];

// estado por linha
let estado = Array(5).fill(null).map(()=>({
  ativo:false,
  tipo:null,     // "curto" | "longo"
  ultimoLado:null
}));

/* ================= FUNÇÕES ================= */

function corNum(n){
  if(n === 0) return "#0f0";
  return reds.includes(n) ? "#e74c3c" : "#000";
}

function coverT(t){
  let s = new Set();
  terminais[t].forEach(n=>{
    let i = track.indexOf(n);
    s.add(n);
    s.add(track[(i+36)%37]);
    s.add(track[(i+1)%37]);
  });
  return s;
}

/* 🔒 PADRÃO RELATIVO AO PAR (A/B) — SÓ FECHA NO FINAL */
function fechaPadrao(seq){
  let len = seq.length;

  // PADRÃO CURTO: A-B-A
  if(len >= 3){
    if(seq[len-3] === "A" && seq[len-2] === "B" && seq[len-1] === "A"){
      return { tipo:"curto", ultimo:"A" };
    }
  }

  // PADRÃO LONGO: A-B-B-A-B-B
  if(len >= 6){
    if(seq.slice(len-6).join("") === "ABBABB"){
      return { tipo:"longo", ultimo:"B" };
    }
  }

  return null;
}

/* ================= UI ================= */

document.body.innerHTML = `
<div style="padding:14px;max-width:1100px;margin:auto">
  <h2 style="text-align:center">Roleta — Análise de Padrões</h2>
  <div id="linhas"></div>
  <div id="botoes" style="
    display:grid;
    grid-template-columns:repeat(9,1fr);
    gap:4px;
    max-width:520px;
    margin:12px auto">
  </div>
</div>
`;

const linhas = document.getElementById("linhas");
const botoes = document.getElementById("botoes");

/* cria linhas */
for(let i=0;i<5;i++){
  let box = document.createElement("div");
  box.innerHTML = `
    <div id="hist${i}" style="
      border:1px solid #666;
      background:#222;
      border-radius:6px;
      padding:8px;
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      justify-content:center"></div>
    <div id="info${i}" style="
      text-align:center;
      font-size:13px;
      margin-bottom:12px"></div>
  `;
  linhas.appendChild(box);
}

/* botões 0–36 */
for(let n=0;n<=36;n++){
  let b = document.createElement("button");
  b.textContent = n;
  b.onclick = ()=>{ hist.push(n); render(); };
  botoes.appendChild(b);
}

/* ================= RENDER ================= */

function render(){
  let ult = hist.slice(-14).reverse();

  for(let i=0;i<5;i++){
    let h = document.getElementById("hist"+i);
    let info = document.getElementById("info"+i);
    h.innerHTML = ""; info.innerHTML = "";

    let [a,b] = pares[i];
    let ca = coverT(a);
    let cb = coverT(b);
    let seq = [];

    ult.forEach((n,idx)=>{
      let w = document.createElement("div");
      w.style = "display:flex;flex-direction:column;align-items:center";

      let d = document.createElement("div");
      d.textContent = n;
      d.style = `
        padding:6px 8px;
        border-radius:6px;
        font-size:20px;
        background:${corNum(n)};
        color:${corNum(n)==="#000"?"#fff":"#000"}
      `;

      // remover global apenas pela 1ª linha
      if(i === 0){
        d.style.cursor = "pointer";
        d.onclick = ()=>{
          hist.splice(hist.length-1-idx,1);
          render();
        };
      }

      w.appendChild(d);

      // marcação relativa A / B
      if(ca.has(n) || cb.has(n)){
        let lado = ca.has(n) ? "A" : "B";
        seq.push(lado);

        let t = ca.has(n) ? a : b;
        let lbl = document.createElement("div");
        lbl.textContent = "T"+t;
        lbl.style = `font-size:12px;font-weight:bold;color:${coresT[t]}`;
        w.appendChild(lbl);
      }

      h.appendChild(w);
    });

    /* ===== CONTINUIDADE CORRETA ===== */
    let e = estado[i];

    if(!e.ativo){
      let f = fechaPadrao(seq);
      if(f){
        e.ativo = true;
        e.tipo = f.tipo;
        e.ultimoLado = f.ultimo;
      }
    } else {
      // só quebra se entrar no par e quebrar a lógica
      if(seq.length){
        let atual = seq[seq.length-1];
        if(atual !== e.ultimoLado){
          e.ativo = false;
          e.tipo = null;
          e.ultimoLado = null;
        }
      }
    }

    if(e.ativo){
      info.textContent = e.tipo === "curto"
        ? "🎯 PADRÃO ATIVO (CONTÍNUO): T1–T2–T1"
        : "🎯 PADRÃO ATIVO (CONTÍNUO): T1–T2–T2–T1–T2–T2";
    }
  }
}

render();

})();
