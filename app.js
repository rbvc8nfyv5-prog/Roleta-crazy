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

// todos os pares possíveis
const pares = [];
for(let a=0;a<10;a++){
  for(let b=a+1;b<10;b++){
    pares.push([a,b]);
  }
}

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

/* ================= UI ================= */

document.body.innerHTML = `
<div style="padding:14px;max-width:1100px;margin:auto">
  <h2 style="text-align:center">Roleta — Melhores Pares</h2>
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

  let ult14 = hist.slice(-14).reverse();

  // calcula força dos pares
  let scores = pares.map(([a,b])=>{
    let ca = coverT(a);
    let cb = coverT(b);
    let c = 0;
    hist.slice(-14).forEach(n=>{
      if(ca.has(n) || cb.has(n)) c++;
    });
    return { par:[a,b], score:c };
  });

  scores.sort((x,y)=>y.score - x.score);

  // pega os 5 melhores
  let top5 = scores.slice(0,5).map(x=>x.par);

  top5.forEach(([a,b],i)=>{
    let ca = coverT(a);
    let cb = coverT(b);

    let box = document.createElement("div");
    box.style = "border:1px solid #666;background:#222;border-radius:6px;padding:8px;margin-bottom:10px";

    let titulo = document.createElement("div");
    titulo.style = "text-align:center;font-size:13px;margin-bottom:6px";
    titulo.innerHTML = `Par: <b>T${a}</b> & <b>T${b}</b>`;
    box.appendChild(titulo);

    let h = document.createElement("div");
    h.style = "display:flex;gap:6px;flex-wrap:wrap;justify-content:center";

    ult14.forEach((n,idx)=>{
      let w = document.createElement("div");
      w.style = "display:flex;flex-direction:column;align-items:center";

      let d = document.createElement("div");
      d.textContent = n;
      d.style = `
        padding:6px 8px;
        border-radius:6px;
        font-size:20px;
        background:${corNum(n)};
        color:${corNum(n)==="#000"?"#fff":"#000"};
        cursor:${i===0?"pointer":"default"}
      `;

      // remover número clicando (somente 1ª linha)
      if(i === 0){
        d.onclick = ()=>{
          let realIndex = hist.length - 1 - idx;
          if(realIndex >= 0){
            hist.splice(realIndex,1);
            render();
          }
        };
      }

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
    linhas.appendChild(box);
  });
}

render();

})();
