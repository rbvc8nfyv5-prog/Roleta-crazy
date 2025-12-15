(function () {

  // ===== CONFIGURAÇÃO BASE =====
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds  = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  // cores fixas dos T
  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",
    5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  // 🐎 Cavalos
  const coresCavalos = {
    A:"#9c27b0", // 258
    B:"#2196f3", // 0369
    C:"#4caf50"  // 147
  };

  // 📦 Dúzias
  const coresDuzia = {
    1:"#4caf50",
    2:"#2196f3",
    3:"#9c27b0"
  };

  // 📊 Colunas
  const coresColuna = {
    1:"#fbc02d",
    2:"#e53935",
    3:"#1e88e5"
  };

  let modoCavalos = false;
  let modoRotulo = "T"; // T | D | C
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

  function rotuloDuzia(n){
    if(n === 0) return null;
    if(n <= 12) return { txt:"D1", cor:coresDuzia[1] };
    if(n <= 24) return { txt:"D2", cor:coresDuzia[2] };
    return { txt:"D3", cor:coresDuzia[3] };
  }

  function rotuloColuna(n){
    if(n === 0) return null;
    let c = n % 3 === 1 ? 1 : n % 3 === 2 ? 2 : 3;
    return { txt:"C"+c, cor:coresColuna[c] };
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
      </div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);
               gap:4px;max-width:520px;margin:12px auto">
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  // linhas do tempo
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
  btnColuna.onclick  = ()=>{ modoRotulo = modoRotulo==="C"?"T":"C"; render(); };
  btnDuzia.onclick   = ()=>{ modoRotulo = modoRotulo==="D"?"T":"D"; render(); };

  // botões 0–36
  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{ hist.push(n); render(); };
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let linhas = linhasDiv.children;

    for(let i=0;i<5;i++){
      let h = linhas[i];
      h.innerHTML = "";

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

        let r = null;
        if(modoRotulo==="D") r = rotuloDuzia(n);
        if(modoRotulo==="C") r = rotuloColuna(n);

        if(r){
          let lb=document.createElement("div");
          lb.textContent=r.txt;
          lb.style=`font-size:11px;font-weight:bold;color:${r.cor}`;
          w.appendChild(lb);
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
