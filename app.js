(function () {

  // ================= CONFIGURAÇÃO BASE =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds  = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  // ================= SETORES CORRETOS =================
  const setores = {
    TIER: new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS: new Set([1,20,14,31,9,17,34,6]),
    ZERO: new Set([0,3,12,15,26,32,35]),
    VOISINS: new Set([2,4,7,18,19,21,22,25,28,29])
  };

  const coresSetor = {
    TIER: "#1e88e5",
    ORPHANS: "#43a047",
    ZERO: "#fdd835",
    VOISINS: "#8e24aa"
  };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  let hist = [];
  let modo = "T"; // T | COLUNA | DUZIA
  let mostrarSetores = false;

  // ================= FUNÇÕES =================
  const corNumero = n => n===0 ? "#0f0" : reds.has(n) ? "#e74c3c" : "#000";

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
    if(hist.length < 5) return [];
    let ult = hist.slice(-14);
    let covers = Array.from({length:10},(_,t)=>coverTerminal(t));
    let pares=[];

    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits=ult.filter(n=>covers[a].has(n)||covers[b].has(n)).length;
        pares.push({a,b,hits});
      }
    }

    return pares.sort((x,y)=>y.hits-x.hits).slice(0,5);
  }

  function setorDoNumero(n){
    for(let k in setores) if(setores[k].has(n)) return k;
    return null;
  }

  // ================= UI =================
  document.body.innerHTML = `
    <div style="padding:14px;max-width:1200px;margin:auto;color:#fff">
      <h2 style="text-align:center">Roleta — 5 pares (14 giros)</h2>

      <div id="linhas"></div>

      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0">
        <button id="btnT">Terminais</button>
        <button id="btnCav">Cavalos</button>
        <button id="btnCol">Coluna</button>
        <button id="btnDuz">Dúzia</button>
        <button id="btnEsp">Espelhos</button>
        <button id="btnSet">Setores</button>
      </div>

      <div id="botoes" style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px"></div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style="border:1px solid #555;background:#222;border-radius:8px;padding:8px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center";
    linhasDiv.appendChild(d);
  }

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{hist.push(n);render();};
    botoesDiv.appendChild(b);
  }

  document.getElementById("btnSet").onclick=()=>{mostrarSetores=!mostrarSetores;render();};
  document.getElementById("btnCol").onclick=()=>{modo=modo==="COL"?"T":"COL";render();};
  document.getElementById("btnDuz").onclick=()=>{modo=modo==="DUZ"?"T":"DUZ";render();};
  document.getElementById("btnT").onclick=()=>{modo="T";render();};

  // ================= RENDER =================
  function render(){
    let ult = hist.slice(-14);
    let pares = melhoresPares();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";
      if(!pares[i]) continue;

      let p = pares[i];
      let ca = coverTerminal(p.a);
      let cb = coverTerminal(p.b);

      ult.forEach((n,idx)=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center;min-width:44px";

        let d=document.createElement("div");
        let bg = corNumero(n);

        if(mostrarSetores){
          let s=setorDoNumero(n);
          if(s) bg=coresSetor[s];
        }

        d.textContent=n;
        d.style=`padding:6px 10px;border-radius:8px;font-size:18px;background:${bg};color:#000;cursor:pointer`;
        if(i===0) d.onclick=()=>{hist=hist.filter((_,k)=>k!==hist.length-ult.length+idx);render();};

        w.appendChild(d);

        let label="";
        if(modo==="T" && (ca.has(n)||cb.has(n))){
          let t = ca.has(n)?p.a:p.b;
          label="T"+t;
          w.appendChild(Object.assign(document.createElement("div"),{
            textContent:label,
            style:`font-size:12px;color:${coresT[t]}`
          }));
        }

        if(modo==="COL" && n!==0){
          let c=((n-1)%3)+1;
          w.appendChild(Object.assign(document.createElement("div"),{
            textContent:"C"+c,
            style:"font-size:12px;color:#4fc3f7"
          }));
        }

        if(modo==="DUZ" && n!==0){
          let dzz=Math.ceil(n/12);
          w.appendChild(Object.assign(document.createElement("div"),{
            textContent:"D"+dzz,
            style:"font-size:12px;color:#aed581"
          }));
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
