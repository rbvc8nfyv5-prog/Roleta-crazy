(function () {

  /* ================= CONFIG BASE ================= */
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
    A:"#9c27b0", B:"#1e88e5", C:"#43a047"
  };

  const setores = {
    TIER:new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS:new Set([1,20,14,31,9,17,34,6]),
    ZERO:new Set([0,3,12,15,26,32,35]),
    VOISINS:new Set([2,4,7,18,19,21,22,25,28,29])
  };

  const coresSetor = {
    TIER:"#e53935", ORPHANS:"#1e88e5",
    ZERO:"#43a047", VOISINS:"#8e24aa"
  };

  /* ================= ESTADO ================= */
  let hist = [];
  let modoCavalos=false, modoSetores=false, modoEspelho=false;
  let modoRotulo="T";

  /* ================= FUNÇÕES ================= */
  const terminal = n => n % 10;

  const coluna = n => n===0?null:((n-1)%3)+1;
  const duzia = n => n===0?null:Math.ceil(n/12);

  const espelhosBase = new Set([11,12,13,21,22,23,31,32,33]);

  function isEspelho(n){
    let i = track.indexOf(n);
    for(let b of espelhosBase){
      let ib = track.indexOf(b);
      if(Math.min(Math.abs(i-ib),37-Math.abs(i-ib))<=1) return true;
    }
    return false;
  }

  function corNumero(n){
    if(modoCavalos){
      let t = terminal(n);
      if(cavalos.A.includes(t)) return coresCavalo.A;
      if(cavalos.B.includes(t)) return coresCavalo.B;
      return coresCavalo.C;
    }
    if(modoSetores){
      for(let s in setores) if(setores[s].has(n)) return coresSetor[s];
    }
    if(n===0) return "#0f0";
    return reds.has(n)?"#e74c3c":"#222";
  }

  function coverTerminal(t){
    let s=new Set();
    terminais[t].forEach(n=>{
      let i=track.indexOf(n);
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
    for(let a=0;a<10;a++)for(let b=a+1;b<10;b++){
      let hits = ult.filter(n=>covers[a].has(n)||covers[b].has(n)).length;
      pares.push({a,b,hits});
    }
    return pares.sort((x,y)=>y.hits-x.hits).slice(0,5);
  }

  function analisarCentros(){
    if(hist.length<6) return [];
    let ult = hist.slice(-14).reverse();
    let cand=[...new Set(ult.slice(0,6))];
    const dist=(a,b)=>{
      let d=Math.abs(track.indexOf(a)-track.indexOf(b));
      return Math.min(d,37-d);
    };
    let r=[];
    for(let n of cand){
      if(r.every(x=>dist(x,n)>=6)){r.push(n);if(r.length===3)break;}
    }
    return r;
  }

  /* ================= UI ================= */
  document.body.innerHTML=`
    <div style="padding:10px;color:#fff">
      <h3 style="text-align:center">App Caballerro</h3>

      <div id="linhas"></div>

      <div style="border:1px solid #666;padding:8px;margin:8px 0;text-align:center">
        🎯 ALVOS: <span id="alvos"></span>
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">
        <button id="btnCav">Cavalos</button>
        <button id="btnCol">Coluna</button>
        <button id="btnDuz">Dúzia</button>
        <button id="btnSet">Setores</button>
        <button id="btnEsp">Espelho</button>
      </div>

      <div id="botoes" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px"></div>
    </div>
  `;

  const linhasDiv=document.getElementById("linhas");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style="border:1px solid #555;background:#111;border-radius:6px;padding:6px;margin-bottom:6px;display:flex;gap:6px;justify-content:center";
    linhasDiv.appendChild(d);
  }

  const marcar=(btn,on)=>{
    btn.style.border=on?"2px solid gold":"1px solid #444";
  };

  btnCav.onclick=()=>{modoCavalos=!modoCavalos;marcar(btnCav,modoCavalos);render();};
  btnSet.onclick=()=>{modoSetores=!modoSetores;marcar(btnSet,modoSetores);render();};
  btnEsp.onclick=()=>{modoEspelho=!modoEspelho;marcar(btnEsp,modoEspelho);render();};
  btnCol.onclick=()=>{modoRotulo=modoRotulo==="C"?"T":"C";marcar(btnCol,modoRotulo==="C");render();};
  btnDuz.onclick=()=>{modoRotulo=modoRotulo==="D"?"T":"D";marcar(btnDuz,modoRotulo==="D");render();};

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{hist.push(n);render();};
    document.getElementById("botoes").appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresPares();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";
      let p=pares[i];
      ult.forEach((n,idx)=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`width:26px;height:26px;line-height:26px;border-radius:4px;
                 background:${corNumero(n)};color:#fff;font-size:12px;text-align:center;
                 cursor:${i===0?"pointer":"default"}`;
        if(i===0){
          d.onclick=()=>{
            let pos=hist.length-ult.length+idx;
            hist.splice(pos,1);
            render();
          };
        }
        w.appendChild(d);

        if(p){
          let ca=coverTerminal(p.a),cb=coverTerminal(p.b);
          if(modoRotulo==="T"&&(ca.has(n)||cb.has(n))){
            let t=ca.has(n)?p.a:p.b;
            let lb=document.createElement("div");
            lb.textContent="T"+t;
            lb.style=`font-size:10px;color:${coresT[t]}`;
            w.appendChild(lb);
          }
          if(modoRotulo==="C"&&coluna(n)){
            let lb=document.createElement("div");
            lb.textContent="C"+coluna(n);
            lb.style="font-size:10px;color:#90caf9";
            w.appendChild(lb);
          }
          if(modoRotulo==="D"&&duzia(n)){
            let lb=document.createElement("div");
            lb.textContent="D"+duzia(n);
            lb.style="font-size:10px;color:#a5d6a7";
            w.appendChild(lb);
          }
        }

        if(modoEspelho && isEspelho(n)){
          let lb=document.createElement("div");
          lb.textContent="E";
          lb.style="font-size:10px;color:#ffd700";
          w.appendChild(lb);
        }

        h.appendChild(w);
      });
    }

    document.getElementById("alvos").textContent = analisarCentros().join(" · ");
  }

  render();

})();
