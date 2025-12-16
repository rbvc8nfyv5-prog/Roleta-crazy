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
    A:"#9c27b0",
    B:"#1e88e5",
    C:"#43a047"
  };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

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

  // ================= ESTADO =================
  let hist = [];
  let mostrar5Linhas = false;
  let modoCavalos = false;
  let modoRotulo = "T"; // T | C | D
  let modoSetores = false;

  // ================= FUNÇÕES =================
  const terminal = n => n % 10;

  function cavaloDoTerminal(t){
    if(cavalos.A.includes(t)) return "A";
    if(cavalos.B.includes(t)) return "B";
    return "C";
  }

  function corBase(n){
    if(n === 0) return "#0f0";
    return reds.has(n) ? "#e74c3c" : "#222";
  }

  function setorDoNumero(n){
    for(let s in setores){
      if(setores[s].has(n)) return s;
    }
    return null;
  }

  function corNumero(n){
    if(modoCavalos){
      return coresCavalo[cavaloDoTerminal(terminal(n))];
    }
    if(modoSetores){
      let s = setorDoNumero(n);
      if(s) return coresSetor[s];
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

  function analisarCentros(){
    if(hist.length < 6) return [];
    let ult = hist.slice(-14).reverse();
    let candidatos = [...new Set(ult.slice(0,6))];

    function dist(a,b){
      let ia=track.indexOf(a), ib=track.indexOf(b);
      let d=Math.abs(ia-ib);
      return Math.min(d,37-d);
    }

    let centros=[];
    for(let n of candidatos){
      if(centros.every(x=>dist(x,n)>=6)){
        centros.push(n);
        if(centros.length===3) break;
      }
    }
    return centros;
  }

  // ================= UI =================
  document.body.innerHTML = `
    <div style="padding:10px;max-width:100vw;overflow-x:hidden;color:#fff">

      <h3 style="text-align:center;margin:6px 0">App Caballerro</h3>

      <div id="linhas"></div>

      <div style="border:2px solid #ffd700;background:#111;border-radius:8px;
                  padding:10px;margin:8px 0;text-align:center">
        <div style="font-size:18px;font-weight:bold;color:#ffd700">🎯 ALVOS</div>
        <div id="centrosTxt"
             style="font-size:22px;font-weight:bold;letter-spacing:2px;margin-top:4px"></div>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 0">
        <button id="btnTerm">Terminais</button>
        <button id="btnCav">🐎 Cavalos</button>
        <button id="btnCol">Coluna</button>
        <button id="btnDuz">Dúzia</button>
        <button id="btnSet">Setores</button>
      </div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);gap:8px">
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style="border:1px solid #444;background:#111;border-radius:6px;padding:6px;margin-bottom:6px;display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;overflow:hidden";
    linhasDiv.appendChild(d);
  }

  function marcarAtivo(btn, ativo){
    btn.style.border = ativo ? "2px solid #ffd700" : "1px solid #444";
    btn.style.boxShadow = ativo ? "0 0 6px #ffd700" : "none";
    btn.style.fontSize = "16px";
    btn.style.padding = "8px 12px";
  }

  btnTerm.onclick=()=>{mostrar5Linhas=!mostrar5Linhas;marcarAtivo(btnTerm,mostrar5Linhas);render();};
  btnCav.onclick =()=>{modoCavalos=!modoCavalos;marcarAtivo(btnCav,modoCavalos);render();};
  btnCol.onclick =()=>{modoRotulo=(modoRotulo==="C"?"T":"C");marcarAtivo(btnCol,modoRotulo==="C");render();};
  btnDuz.onclick =()=>{modoRotulo=(modoRotulo==="D"?"T":"D");marcarAtivo(btnDuz,modoRotulo==="D");render();};
  btnSet.onclick =()=>{modoSetores=!modoSetores;marcarAtivo(btnSet,modoSetores);render();};

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.style="font-size:18px;padding:10px;border-radius:6px";
    b.onclick=()=>{hist.push(n);render();};
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresPares();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.style.display = (mostrar5Linhas || i===0) ? "flex" : "none";
      h.innerHTML="";

      ult.forEach((n,idx)=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center;min-width:24px";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`width:24px;height:24px;
                 line-height:24px;
                 border-radius:5px;
                 background:${corNumero(n)};
                 color:#fff;
                 font-size:12px;
                 text-align:center;
                 cursor:${i===0?"pointer":"default"}`;

        if(i===0){
          d.onclick=()=>{
            let pos = hist.length - ult.length + idx;
            hist.splice(pos,1);
            render();
          };
        }

        w.appendChild(d);

        let p = pares[i];
        if(p){
          let ca = coverTerminal(p.a);
          let cb = coverTerminal(p.b);

          if(modoRotulo==="T" && (ca.has(n)||cb.has(n))){
            let t = ca.has(n)?p.a:p.b;
            let lb=document.createElement("div");
            lb.textContent="T"+t;
            lb.style=`font-size:10px;color:${coresT[t]}`;
            w.appendChild(lb);
          }
        }

        h.appendChild(w);
      });
    }

    document.getElementById("centrosTxt").textContent =
      analisarCentros().join("   ");
  }

  render();

})();
