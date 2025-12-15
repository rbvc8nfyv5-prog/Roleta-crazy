(function () {

  // ===== CONFIGURAÇÃO BASE =====
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

  const coresCavalos = {
    A:"#9c27b0", // 258
    B:"#2196f3", // 0369
    C:"#4caf50"  // 147
  };

  const cavalos = {
    A:[2,5,8],
    B:[0,3,6,9],
    C:[1,4,7]
  };

  const coresColuna = { 1:"#fbc02d", 2:"#e53935", 3:"#1e88e5" };
  const coresDuzia  = { 1:"#4caf50", 2:"#2196f3", 3:"#9c27b0" };

  const espelhosBase = [11,12,13,21,22,23,31,32,33];

  let modoCavalos = false;
  let modoRotulo = "T"; // T | C | D
  let modoEspelhos = false;
  let hist = [];

  // ===== FUNÇÕES =====
  function terminal(n){ return n % 10; }

  function corNumeroNormal(n){
    if(n === 0) return "#0f0";
    return reds.includes(n) ? "#e74c3c" : "#000";
  }

  function corNumero(n){
    if(!modoCavalos) return corNumeroNormal(n);
    let t = terminal(n);
    if(cavalos.A.includes(t)) return coresCavalos.A;
    if(cavalos.B.includes(t)) return coresCavalos.B;
    if(cavalos.C.includes(t)) return coresCavalos.C;
    return corNumeroNormal(n);
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

  function buildEspelhos(){
    let s = new Set();
    espelhosBase.forEach(n=>{
      let i = track.indexOf(n);
      if(i>=0){
        s.add(track[(i+36)%37]);
        s.add(track[i]);
        s.add(track[(i+1)%37]);
      }
    });
    return s;
  }
  const espelhosSet = buildEspelhos();

  // 🔥 NOVO CRITÉRIO DE PARES (últimos 8, sem falha)
  function melhoresParesSemFalha(){
    if(hist.length < 8) return [];

    let ult = hist.slice(-8);
    let todos = [];

    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let ca = coverTerminal(a);
        let cb = coverTerminal(b);
        let hits = 0;

        ult.forEach(n=>{
          if(ca.has(n) || cb.has(n)) hits++;
        });

        if(hits >= 7){
          todos.push({a,b,hits});
        }
      }
    }

    todos.sort((x,y)=>y.hits-x.hits);
    return todos.slice(0,5);
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:12px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — Pares Sem Falha (8 giros)</h2>

      <div id="linhas"></div>

      <div style="text-align:center;margin-top:10px">
        <button id="btnCavalos">🐎 Cavalos</button>
        <button id="btnColuna">Coluna</button>
        <button id="btnDuzia">Dúzia</button>
        <button id="btnEspelhos">Espelhos</button>
      </div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);
        gap:4px;max-width:520px;margin:12px auto">
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.style=`
      border:1px solid #666;
      background:#222;
      border-radius:6px;
      padding:6px;
      margin-bottom:8px;
      display:grid;
      grid-template-columns:repeat(14,1fr);
      gap:4px;
    `;
    linhasDiv.appendChild(d);
  }

  btnCavalos.onclick = ()=>{ modoCavalos=!modoCavalos; render(); };
  btnColuna.onclick  = ()=>{ modoRotulo = modoRotulo==="C"?"T":"C"; render(); };
  btnDuzia.onclick   = ()=>{ modoRotulo = modoRotulo==="D"?"T":"D"; render(); };
  btnEspelhos.onclick= ()=>{ modoEspelhos=!modoEspelhos; render(); };

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{ hist.push(n); render(); };
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresParesSemFalha();
    let linhas = linhasDiv.children;

    for(let i=0;i<5;i++){
      let h = linhas[i];
      h.innerHTML="";
      let p = pares[i];
      if(!p) continue;

      let ca = coverTerminal(p.a);
      let cb = coverTerminal(p.b);

      ult.forEach(n=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`padding:4px 0;border-radius:6px;background:${corNumero(n)};color:#fff`;
        w.appendChild(d);

        if(modoRotulo==="T" && (ca.has(n)||cb.has(n))){
          let t = ca.has(n)?p.a:p.b;
          let lb=document.createElement("div");
          lb.textContent="T"+t;
          lb.style=`font-size:11px;font-weight:bold;color:${coresT[t]}`;
          w.appendChild(lb);
        }

        if(modoRotulo==="C" && n!==0){
          let c = n%3===1?1:n%3===2?2:3;
          let lb=document.createElement("div");
          lb.textContent="C"+c;
          lb.style=`font-size:11px;font-weight:bold;color:${coresColuna[c]}`;
          w.appendChild(lb);
        }

        if(modoRotulo==="D" && n!==0){
          let d = n<=12?1:n<=24?2:3;
          let lb=document.createElement("div");
          lb.textContent="D"+d;
          lb.style=`font-size:11px;font-weight:bold;color:${coresDuzia[d]}`;
          w.appendChild(lb);
        }

        if(modoEspelhos && espelhosSet.has(n)){
          let e=document.createElement("div");
          e.textContent="E";
          e.style="font-size:11px;font-weight:bold;color:#fff";
          w.appendChild(e);
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
