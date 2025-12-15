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

  const coresColuna = { 1:"#fbc02d", 2:"#e53935", 3:"#1e88e5" };
  const coresDuzia  = { 1:"#4caf50", 2:"#2196f3", 3:"#9c27b0" };

  const espelhosBase = [11,12,13,21,22,23,31,32,33];

  let modoCavalos = false;
  let modoRotulo = "T"; // T | C | D
  let modoEspelhos = false;
  let hist = [];

  // ===== FUNÇÕES =====
  function terminalDoNumero(n){ return n % 10; }

  function corNumeroNormal(n){
    if(n === 0) return "#0f0";
    return reds.includes(n) ? "#e74c3c" : "#000";
  }

  function corNumeroCavalos(n){
    let t = terminalDoNumero(n);
    if([2,5,8].includes(t)) return coresCavalos.A;
    if([0,3,6,9].includes(t)) return coresCavalos.B;
    if([1,4,7].includes(t)) return coresCavalos.C;
    return corNumeroNormal(n);
  }

  function corNumero(n){
    return modoCavalos ? corNumeroCavalos(n) : corNumeroNormal(n);
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
      if(i >= 0){
        s.add(track[(i+36)%37]);
        s.add(track[i]);
        s.add(track[(i+1)%37]);
      }
    });
    return s;
  }

  const espelhosSet = buildEspelhos();

  function melhoresPares(){
    if(hist.length < 3) return [];

    let ult = hist.slice(-14);
    let covers = [];
    for(let t=0;t<10;t++) covers[t] = coverTerminal(t);

    let todos = [];
    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits = 0;
        ult.forEach(n=>{
          if(covers[a].has(n) || covers[b].has(n)) hits++;
        });
        let erros = ult.length - hits;
        todos.push({a,b,erros,hits});
      }
    }

    todos.sort((x,y)=>{
      if(x.erros !== y.erros) return x.erros - y.erros;
      return y.hits - x.hits;
    });

    return todos.slice(0,5);
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:12px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — Pares Mais Assertivos</h2>

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

  // linhas
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

  // botões modo
  btnCavalos.onclick = ()=>{ modoCavalos=!modoCavalos; render(); };
  btnColuna.onclick  = ()=>{ modoRotulo = modoRotulo==="C" ? "T" : "C"; render(); };
  btnDuzia.onclick   = ()=>{ modoRotulo = modoRotulo==="D" ? "T" : "D"; render(); };
  btnEspelhos.onclick= ()=>{ modoEspelhos=!modoEspelhos; render(); };

  // botões 0–36
  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{ hist.push(n); render(); };
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresPares();
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
        d.style=`
          width:100%;
          padding:4px 0;
          border-radius:6px;
          text-align:center;
          background:${corNumero(n)};
          color:#fff;
        `;
        w.appendChild(d);

        // T / C / D
        let rotulo = null;

        if(modoRotulo==="T" && (ca.has(n) || cb.has(n))){
          let t = ca.has(n) ? p.a : p.b;
          rotulo = { txt:"T"+t, cor:coresT[t] };
        }

        if(modoRotulo==="C" && n!==0){
          let c = n%3===1 ? 1 : n%3===2 ? 2 : 3;
          rotulo = { txt:"C"+c, cor:coresColuna[c] };
        }

        if(modoRotulo==="D" && n!==0){
          let d = n<=12 ? 1 : n<=24 ? 2 : 3;
          rotulo = { txt:"D"+d, cor:coresDuzia[d] };
        }

        if(rotulo){
          let lb=document.createElement("div");
          lb.textContent=rotulo.txt;
          lb.style=`font-size:11px;font-weight:bold;color:${rotulo.cor}`;
          w.appendChild(lb);
        }

        // ESPELHOS
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
