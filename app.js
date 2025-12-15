(function(){

/* ================= CONFIG ================= */

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

// pares analisados
const pares = [[0,1],[2,3],[4,5],[6,7],[8,9]];

let hist = [];

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

/* 🔥 PADRÃO USANDO OS T VISÍVEIS */
function detectaPadraoPorT(hist, ca, cb, Ta, Tb){
  let seq = [];

  // percorre de trás para frente pegando SOMENTE T visível
  for(let i = hist.length - 1; i >= 0 && seq.length < 6; i--){
    let n = hist[i];
    if(ca.has(n)) seq.unshift("A");
    else if(cb.has(n)) seq.unshift("B");
  }

  // precisa existir T no último giro
  if(seq.length === 0) return null;

  // ABA
  if(seq.length >= 3 && seq.slice(-3).join("") === "ABA"){
    return `🎯 PADRÃO FECHADO: T${Ta}–T${Tb}–T${Ta}`;
  }

  // ABBABB
  if(seq.length >= 6 && seq.slice(-6).join("") === "ABBABB"){
    return `🎯 PADRÃO FECHADO: T${Ta}–T${Tb}–T${Tb}–T${Ta}–T${Tb}–T${Tb}`;
  }

  return null;
}

/* ================= UI ================= */

document.body.innerHTML = `
<div style="padding:14px;max-width:1100px;margin:auto">
  <h2 style="text-align:center">Roleta — Padrões por Terminal (T)</h2>
  <div id="linhas"></div>
  <div id="botoes" style="
    display:grid;
    grid-template-columns:repeat(9,1fr);
    gap:4px;
    max-width:520px;
    margin:12px auto"></div>
</div>
`;

const linhas = document.getElementById("linhas");
const botoes = document.getElementById("botoes");

/* botões 0–36 */
for(let n=0;n<=36;n++){
  let b = document.createElement("button");
  b.textContent = n;
  b.onclick = ()=>{ hist.push(n); render(); };
  botoes.appendChild(b);
}

/* ================= RENDER ================= */

function render(){
  linhas.innerHTML = "";
  let ult = hist.slice(-14).reverse();

  let paresComPadrao = [];

  // 1️⃣ detectar padrões pelos T visíveis
  pares.forEach(par=>{
    let [a,b] = par;
    let ca = coverT(a), cb = coverT(b);
    let texto = detectaPadraoPorT(hist, ca, cb, a, b);
    if(texto){
      paresComPadrao.push({par, texto});
    }
  });

  // 2️⃣ decidir o que mostrar
  let lista = paresComPadrao.length
    ? paresComPadrao.map(p=>p.par)
    : pares;

  lista.forEach(par=>{
    let [a,b] = par;
    let ca = coverT(a), cb = coverT(b);

    let box = document.createElement("div");
    box.style = "border:1px solid #666;background:#222;border-radius:6px;padding:8px;margin-bottom:10px";

    let h = document.createElement("div");
    h.style = "display:flex;gap:6px;flex-wrap:wrap;justify-content:center";

    ult.forEach(n=>{
      let w = document.createElement("div");
      w.style = "display:flex;flex-direction:column;align-items:center";

      let d = document.createElement("div");
      d.textContent = n;
      d.style = `padding:6px 8px;border-radius:6px;font-size:20px;
        background:${corNum(n)};
        color:${corNum(n)==="#000"?"#fff":"#000"}`;
      w.appendChild(d);

      if(ca.has(n) || cb.has(n)){
        let t = ca.has(n) ? a : b;
        let lbl = document.createElement("div");
        lbl.textContent = "T"+t;
        lbl.style = `font-size:12px;font-weight:bold;color:${coresT[t]}`;
        w.appendChild(lbl);
      }

      h.appendChild(w);
    });

    box.appendChild(h);

    let p = paresComPadrao.find(x=>x.par[0]===a && x.par[1]===b);
    if(p){
      let info = document.createElement("div");
      info.style = "text-align:center;font-size:13px;margin-top:4px";
      info.textContent = p.texto;
      box.appendChild(info);
    }

    linhas.appendChild(box);
  });
}

render();

})();
