(function () {

  // ===== CONFIGURAÇÃO BASE =====
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  // ===== SETORES (MANTIDOS) =====
  const setores = {
    TIER:    new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS:new Set([1,20,14,31,9,17,34,6]),
    ZERO:    new Set([0,3,12,15,26,32,35]),
    VOISINS:new Set([2,4,7,18,19,21,22,25,28,29])
  };

  const coresSetor = {
    TIER:"#e53935",
    ORPHANS:"#1e88e5",
    ZERO:"#43a047",
    VOISINS:"#8e24aa"
  };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  let hist = [];
  let modoSetores = true;

  // ===== FUNÇÕES =====
  const corBase = n => n===0 ? "#0f0" : reds.has(n) ? "#e74c3c" : "#111";

  function setorDoNumero(n){
    for(let s in setores){
      if(setores[s].has(n)) return s;
    }
    return null;
  }

  function corNumero(n){
    if(!modoSetores) return corBase(n);
    let s = setorDoNumero(n);
    return s ? coresSetor[s] : corBase(n);
  }

  function coverTerminal(t){
    let s = new Set();
    terminais[t].forEach(n=>{
      let i = track.indexOf(n);
      s.add(n);
      s.add(track[(i+36)%37]);
      s.add(track[(i+1)%37]);
    });
    return s;
  }

  function melhorPar(){
    if(hist.length < 5) return null;
    let ult = hist.slice(-14);
    let covers = Array.from({length:10},(_,t)=>coverTerminal(t));
    let best = null;

    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits = ult.filter(n=>covers[a].has(n)||covers[b].has(n)).length;
        if(!best || hits > best.hits){
          best = {a,b,hits};
        }
      }
    }
    return best;
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:10px;max-width:1100px;margin:auto;color:#fff">
      <h4 style="text-align:center;margin:6px 0">Roleta</h4>

      <div id="linha"
        style="border:1px solid #555;
               background:#222;
               border-radius:6px;
               padding:6px;
               display:flex;
               flex-wrap:nowrap;
               gap:6px;
               justify-content:center;
               overflow:hidden">
      </div>

      <div style="text-align:center;margin:8px 0">
        <button id="btnSet">Setores</button>
      </div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);gap:5px">
      </div>
    </div>
  `;

  const linhaDiv = document.getElementById("linha");
  const botoesDiv = document.getElementById("botoes");

  document.getElementById("btnSet").onclick = ()=>{
    modoSetores = !modoSetores;
    render();
  };

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{hist.push(n);render();};
    botoesDiv.appendChild(b);
  }

  function render(){
    linhaDiv.innerHTML="";
    let p = melhorPar();
    if(!p) return;

    let ca = coverTerminal(p.a);
    let cb = coverTerminal(p.b);
    let ult = hist.slice(-14);

    ult.forEach(n=>{
      let w=document.createElement("div");
      w.style="display:flex;flex-direction:column;align-items:center;min-width:32px";

      let d=document.createElement("div");
      d.textContent=n;
      d.style=`padding:4px 0;
               width:32px;
               border-radius:6px;
               background:${corNumero(n)};
               color:#fff;
               font-size:14px;
               text-align:center`;

      w.appendChild(d);

      if(ca.has(n)||cb.has(n)){
        let t = ca.has(n)?p.a:p.b;
        let lb=document.createElement("div");
        lb.textContent="T"+t;
        lb.style=`font-size:10px;color:${coresT[t]}`;
        w.appendChild(lb);
      }

      linhaDiv.appendChild(w);
    });
  }

  render();

})();
