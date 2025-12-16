(function () {

  // ================= CONFIGURAÇÃO BASE =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  const cavalos = { A:[2,5,8], B:[0,3,6,9], C:[1,4,7] };

  const coresCavalo = {
    A:"#9c27b0", B:"#1e88e5", C:"#43a047"
  };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  // 🎯 CORES COLUNA / DÚZIA
  const coresColuna = { 1:"#2196f3", 2:"#4caf50", 3:"#9c27b0" };
  const coresDuzia  = { 1:"#4caf50", 2:"#2196f3", 3:"#e53935" };

  // ================= ESTADO =================
  let hist = [];
  let modoCavalos = false;
  let modoRotulo = "T"; // T | C | D

  // ================= FUNÇÕES =================
  const terminal = n => n % 10;

  const coluna = n => n === 0 ? null : ((n - 1) % 3) + 1;
  const duzia  = n => n === 0 ? null : Math.ceil(n / 12);

  function corBase(n){
    if(n === 0) return "#0f0";
    return reds.has(n) ? "#e74c3c" : "#222";
  }

  function corNumero(n){
    if(modoCavalos){
      const t = terminal(n);
      if(cavalos.A.includes(t)) return coresCavalo.A;
      if(cavalos.B.includes(t)) return coresCavalo.B;
      return coresCavalo.C;
    }
    return corBase(n);
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

  function melhoresPares(){
    let ult = hist.slice(-14);
    let covers = Array.from({length:10},(_,t)=>coverTerminal(t));
    let pares=[];
    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits = ult.filter(n=>covers[a].has(n)||covers[b].has(n)).length;
        pares.push({a,b,hits});
      }
    }
    return pares.sort((x,y)=>y.hits-x.hits).slice(0,5);
  }

  // ================= UI =================
  document.body.innerHTML = `
    <div style="padding:12px;max-width:100vw;overflow-x:hidden;color:#fff">

      <!-- 🎄 TEMA DE NATAL -->
      <div style="
        border:2px solid #2e7d32;
        background:linear-gradient(135deg,#0b1f0f,#122b18);
        border-radius:12px;
        padding:14px;
        margin-bottom:10px;
        text-align:center;
        box-shadow:0 0 12px rgba(255,215,0,.3)
      ">
        <div style="font-size:22px;font-weight:bold;color:#ffd700">
          🎄 App Caballerro ✨
        </div>
        <div style="font-size:14px;color:#c8e6c9">
          Estratégia • Pares • Leitura Avançada
        </div>
      </div>

      <div id="linhas"></div>

      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:10px 0">
        <button id="btnCav">🐎 Cavalos</button>
        <button id="btnCol">Coluna</button>
        <button id="btnDuz">Dúzia</button>
      </div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);gap:10px">
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style="border:1px solid #444;background:#111;border-radius:8px;padding:8px;margin-bottom:8px;display:flex;gap:6px;justify-content:center";
    linhasDiv.appendChild(d);
  }

  btnCav.onclick =()=>{modoCavalos=!modoCavalos;render();};
  btnCol.onclick =()=>{modoRotulo = modoRotulo==="C"?"T":"C";render();};
  btnDuz.onclick =()=>{modoRotulo = modoRotulo==="D"?"T":"D";render();};

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.style="font-size:20px;padding:12px;border-radius:8px";
    b.onclick=()=>{hist.push(n);render();};
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresPares();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";
      let p = pares[i];

      ult.forEach(n=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`
          width:26px;height:26px;line-height:26px;
          border-radius:6px;
          background:${corNumero(n)};
          color:#fff;
          font-size:13px;
          text-align:center;
        `;
        w.appendChild(d);

        if(p){
          if(modoRotulo==="T"){
            let ca=coverTerminal(p.a), cb=coverTerminal(p.b);
            if(ca.has(n)||cb.has(n)){
              let t = ca.has(n)?p.a:p.b;
              let lb=document.createElement("div");
              lb.textContent="T"+t;
              lb.style=`font-size:11px;color:${coresT[t]}`;
              w.appendChild(lb);
            }
          }

          if(modoRotulo==="C" && coluna(n)){
            let c = coluna(n);
            let lb=document.createElement("div");
            lb.textContent="C"+c;
            lb.style=`font-size:11px;color:${coresColuna[c]}`;
            w.appendChild(lb);
          }

          if(modoRotulo==="D" && duzia(n)){
            let dzz = duzia(n);
            let lb=document.createElement("div");
            lb.textContent="D"+dzz;
            lb.style=`font-size:11px;color:${coresDuzia[dzz]}`;
            w.appendChild(lb);
          }
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
