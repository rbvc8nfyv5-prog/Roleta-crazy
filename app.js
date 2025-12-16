(function () {

  /* ================= BASE ================= */
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  const cavalos = { A:[2,5,8], B:[0,3,6,9], C:[1,4,7] };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  const coresCavalo = {
    A:"#9c27b0",
    B:"#1e88e5",
    C:"#43a047"
  };

  const setores = {
    TIER:new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS:new Set([1,20,14,31,9,17,34,6]),
    ZERO:new Set([0,3,12,15,26,32,35]),
    VOISINS:new Set([2,4,7,18,19,21,22,25,28,29])
  };

  const coresSetor = {
    TIER:"#e53935",
    ORPHANS:"#1e88e5",
    ZERO:"#43a047",
    VOISINS:"#8e24aa"
  };

  /* ================= ESTADO ================= */
  let hist = [];
  let mostrarTodas = false; // 👈 CONTROLE DAS LINHAS
  let modoCavalos = false;
  let modoSetores = false;
  let modoRotulo = "T";

  /* ================= FUNÇÕES ================= */
  const terminal = n => n % 10;

  function corBase(n){
    if(n===0) return "#0f0";
    return reds.has(n) ? "#e74c3c" : "#222";
  }

  function setorDoNumero(n){
    for(let s in setores) if(setores[s].has(n)) return s;
    return null;
  }

  function corNumero(n){
    if(modoCavalos){
      const t = terminal(n);
      if(cavalos.A.includes(t)) return coresCavalo.A;
      if(cavalos.B.includes(t)) return coresCavalo.B;
      return coresCavalo.C;
    }
    if(modoSetores){
      const s = setorDoNumero(n);
      if(s) return coresSetor[s];
    }
    return corBase(n);
  }

  function coverTerminal(t){
    let s = new Set();
    terminais[t].forEach(n=>{
      const i = track.indexOf(n);
      s.add(n);
      s.add(track[(i+36)%37]);
      s.add(track[(i+1)%37]);
    });
    return s;
  }

  function melhoresPares(){
    const ult = hist.slice(-14);
    let pares=[];
    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        const ca = coverTerminal(a), cb = coverTerminal(b);
        const hits = ult.filter(n=>ca.has(n)||cb.has(n)).length;
        pares.push({a,b,hits});
      }
    }
    return pares.sort((x,y)=>y.hits-x.hits).slice(0,5);
  }

  /* ================= UI ================= */
  document.body.innerHTML = `
    <div style="padding:10px;color:#fff">

      <h3 style="text-align:center">App Caballerro</h3>

      <div style="display:flex;gap:6px;justify-content:center;margin-bottom:8px">
        <button id="btnTerm">Terminais</button>
        <button id="btnCav">Cavalos</button>
        <button id="btnCol">Coluna</button>
        <button id="btnDuz">Dúzia</button>
        <button id="btnSet">Setores</button>
      </div>

      <div id="linhas"></div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px">
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");

  for(let i=0;i<5;i++){
    const d=document.createElement("div");
    d.id="linha"+i;
    d.style="border:1px solid #555;border-radius:6px;padding:6px;margin-bottom:6px;display:flex;gap:6px;justify-content:center";
    linhasDiv.appendChild(d);
  }

  function marcar(btn, ativo){
    btn.style.border = ativo ? "2px solid gold" : "1px solid #555";
  }

  btnTerm.onclick=()=>{
    mostrarTodas = !mostrarTodas;
    marcar(btnTerm,mostrarTodas);
    render();
  };
  btnCav.onclick=()=>{modoCavalos=!modoCavalos;marcar(btnCav,modoCavalos);render();};
  btnSet.onclick=()=>{modoSetores=!modoSetores;marcar(btnSet,modoSetores);render();};

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{hist.push(n);render();};
    document.getElementById("botoes").appendChild(b);
  }

  function render(){
    const ult = hist.slice(-14).reverse();
    const pares = melhoresPares();

    for(let i=0;i<5;i++){
      const linha = document.getElementById("linha"+i);
      linha.style.display = (i===0 || mostrarTodas) ? "flex" : "none";
      linha.innerHTML="";
      const p = pares[i];
      if(!p) continue;

      const ca = coverTerminal(p.a), cb = coverTerminal(p.b);

      ult.forEach(n=>{
        const d=document.createElement("div");
        d.textContent=n;
        d.style=`width:26px;height:26px;line-height:26px;
                 background:${corNumero(n)};
                 border-radius:4px;text-align:center;font-size:12px`;
        linha.appendChild(d);
      });
    }
  }

  render();

})();
