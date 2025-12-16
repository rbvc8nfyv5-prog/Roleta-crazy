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

  const setores = {
    TIER:    new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS:new Set([1,20,14,31,9,17,34,6]),
    ZERO:    new Set([0,3,12,15,26,32,35]),
    VOISINS:new Set([2,4,7,18,19,21,22,25,28,29])
  };

  const espelhosBase = [11,12,13,21,22,23,31,32,33];

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  // ================= ESTADO =================
  let hist = [];
  let mostrar5 = true;
  let modoCavalos = false;
  let modoSetores = false;
  let modoRotulo = "T"; // T | C | D
  let modoEspelho = false;

  // ================= FUNÇÕES =================
  const terminal = n => n % 10;
  const coluna = n => n===0?null:((n-1)%3)+1;
  const duzia = n => n===0?null:Math.ceil(n/12);

  function corBase(n){
    if(n===0) return "#0f0";
    return reds.has(n) ? "#e74c3c" : "#222";
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

  function isEspelho(n){
    let s=new Set();
    espelhosBase.forEach(b=>{
      let i=track.indexOf(b);
      s.add(b);
      s.add(track[(i+36)%37]);
      s.add(track[(i+1)%37]);
    });
    return s.has(n);
  }

  function melhoresPares(){
    let ult=hist.slice(-14);
    let covers=Array.from({length:10},(_,t)=>coverTerminal(t));
    let arr=[];
    for(let a=0;a<10;a++)for(let b=a+1;b<10;b++){
      let h=ult.filter(n=>covers[a].has(n)||covers[b].has(n)).length;
      arr.push({a,b,h});
    }
    return arr.sort((x,y)=>y.h-x.h).slice(0,5);
  }

  function marcar(btn,ativo){
    btn.style.border=ativo?"2px solid #ffd700":"1px solid #444";
  }

  // ================= UI =================
  document.body.innerHTML=`
    <div style="padding:10px;color:#fff;max-width:100vw;overflow-x:hidden">
      <h3 style="text-align:center">App Caballerro</h3>

      <div id="linhas"></div>

      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0">
        <button id="bT">Terminais</button>
        <button id="bCav">Cavalos</button>
        <button id="bCol">Coluna</button>
        <button id="bDuz">Dúzia</button>
        <button id="bSet">Setores</button>
        <button id="bEsp">Espelho</button>
      </div>

      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px"></div>
    </div>
  `;

  const linhas=document.getElementById("linhas");
  const nums=document.getElementById("nums");

  for(let i=0;i<5;i++){
    let q=document.createElement("div");
    q.id="hist"+i;
    q.style="border:1px solid #555;border-radius:8px;padding:6px;margin-bottom:6px;display:flex;gap:4px;justify-content:center;overflow:hidden";
    linhas.appendChild(q);
  }

  bT.onclick=()=>{modoRotulo="T";marcar(bT,true);render();};
  bCav.onclick=()=>{modoCavalos=!modoCavalos;marcar(bCav,modoCavalos);render();};
  bCol.onclick=()=>{modoRotulo=modoRotulo==="C"?"T":"C";marcar(bCol,modoRotulo==="C");render();};
  bDuz.onclick=()=>{modoRotulo=modoRotulo==="D"?"T":"D";marcar(bDuz,modoRotulo==="D");render();};
  bSet.onclick=()=>{modoSetores=!modoSetores;marcar(bSet,modoSetores);render();};
  bEsp.onclick=()=>{modoEspelho=!modoEspelho;marcar(bEsp,modoEspelho);render();};

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.style="font-size:16px;padding:8px";
    b.onclick=()=>{hist.push(n);render();};
    nums.appendChild(b);
  }

  function render(){
    let ult=hist.slice(-14).reverse();
    let pares=melhoresPares();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";
      let p=pares[i];
      if(!p) continue;
      let ca=coverTerminal(p.a),cb=coverTerminal(p.b);

      ult.forEach((n,idx)=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`width:24px;height:24px;line-height:24px;
                 border-radius:4px;background:${corBase(n)};
                 color:#fff;font-size:12px;text-align:center;
                 cursor:${i===0?"pointer":"default"}`;

        if(i===0){
          d.onclick=()=>{
            let pos=hist.length-ult.length+idx;
            hist.splice(pos,1);
            render();
          };
        }

        w.appendChild(d);

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
          lb.style="font-size:10px;color:#4fc3f7";
          w.appendChild(lb);
        }

        if(modoRotulo==="D"&&duzia(n)){
          let lb=document.createElement("div");
          lb.textContent="D"+duzia(n);
          lb.style="font-size:10px;color:#aed581";
          w.appendChild(lb);
        }

        if(modoEspelho&&isEspelho(n)){
          let lb=document.createElement("div");
          lb.textContent="E";
          lb.style="font-size:10px;color:#ffd700";
          w.appendChild(lb);
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
