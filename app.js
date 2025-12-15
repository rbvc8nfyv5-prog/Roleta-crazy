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

  // Cavalos (cores dos números)
  const cavalos = { A:[2,5,8], B:[0,3,6,9], C:[1,4,7] };
  const coresCavalos = { A:"#9c27b0", B:"#2196f3", C:"#4caf50" };

  const coresColuna = { 1:"#fbc02d", 2:"#e53935", 3:"#1e88e5" };
  const coresDuzia  = { 1:"#4caf50", 2:"#2196f3", 3:"#9c27b0" };

  const espelhosBase = [11,12,13,21,22,23,31,32,33];

  // ===== ESTADO =====
  let modoCavalos = false;
  let modoRotulo = "T";      // T | C | D
  let modoEspelhos = false;  // E
  let hist = [];

  // ✅ NOVO: abre com 1 linha
  let mostrar5Linhas = false; // false = 1 linha | true = 5 linhas

  // ===== FUNÇÕES BASE =====
  function terminal(n){ return n % 10; }

  function corNumeroNormal(n){
    if(n === 0) return "#0f0";
    return reds.includes(n) ? "#e74c3c" : "#000";
  }

  function cavaloDoTerminal(t){
    if(cavalos.A.includes(t)) return "A";
    if(cavalos.B.includes(t)) return "B";
    return "C";
  }

  function corNumero(n){
    if(!modoCavalos) return corNumeroNormal(n);
    return coresCavalos[cavaloDoTerminal(terminal(n))] || corNumeroNormal(n);
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

  // ===== MELHORES 5 PARES (inalterado) =====
  function melhoresPares(){
    if(hist.length < 3) return [];
    const ult = hist.slice(-14);
    const covers = Array.from({length:10}, (_,t)=>coverTerminal(t));

    let todos = [];
    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits = 0;
        ult.forEach(n=>{
          if(covers[a].has(n) || covers[b].has(n)) hits++;
        });
        const erros = ult.length - hits;
        const score = (100 - erros*10 + hits) + (Math.random()-0.5)*0.15;
        todos.push({a,b,hits,erros,score});
      }
    }

    todos.sort((x,y)=>{
      if(x.erros!==y.erros) return x.erros-y.erros;
      if(y.hits!==x.hits) return y.hits-x.hits;
      return y.score-x.score;
    });

    let pool = todos.slice(0,18);
    let usados={}, escolhidos=[];
    pool.sort((a,b)=> (b.score+Math.random()*0.2)-(a.score+Math.random()*0.2));

    for(const p of pool){
      usados[p.a]=usados[p.a]||0;
      usados[p.b]=usados[p.b]||0;
      if(usados[p.a]>=2||usados[p.b]>=2) continue;
      escolhidos.push(p);
      usados[p.a]++; usados[p.b]++;
      if(escolhidos.length===5) break;
    }
    return escolhidos;
  }

  // ===== ANÁLISE DOS 3 CENTROS (SEM SOBREPOSIÇÃO) =====
  function analisarCentros(){
    if(hist.length < 8) return [];
    const ult = hist.slice(-14);

    let forcaT = {};
    let forcaC = {A:0,B:0,C:0};

    ult.forEach(n=>{
      let t = terminal(n);
      forcaT[t] = (forcaT[t]||0)+1;
      if(cavalos.A.includes(t)) forcaC.A++;
      else if(cavalos.B.includes(t)) forcaC.B++;
      else forcaC.C++;
    });

    let candidatos = [];

    Object.entries(forcaT).sort((a,b)=>b[1]-a[1]).forEach(([t])=>{
      let num=[...ult].reverse().find(n=>terminal(n)==t);
      if(num!=null) candidatos.push(num);
    });

    Object.entries(forcaC).sort((a,b)=>b[1]-a[1]).forEach(([c])=>{
      let num=[...ult].reverse().find(n=>{
        let t=terminal(n);
        return (c==="A"&&cavalos.A.includes(t)) ||
               (c==="B"&&cavalos.B.includes(t)) ||
               (c==="C"&&cavalos.C.includes(t));
      });
      if(num!=null) candidatos.push(num);
    });

    candidatos=[...new Set(candidatos)];

    function dist(a,b){
      let ia=track.indexOf(a), ib=track.indexOf(b);
      let d=Math.abs(ia-ib);
      return Math.min(d,37-d);
    }

    let centros=[];
    for(let n of candidatos){
      if(centros.every(x=>dist(x,n)>=6)){
        centros.push(n);
      }
      if(centros.length===3) break;
    }

    if(centros.length<3){
      for(let n of track){
        if(!centros.includes(n)&&centros.every(x=>dist(x,n)>=6)){
          centros.push(n);
          if(centros.length===3) break;
        }
      }
    }
    return centros;
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:12px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — Pares (14 giros)</h2>

      <div id="linhas"></div>

      <div id="boxCentros"
        style="border:1px solid #888;background:#111;border-radius:8px;
               padding:8px;margin:10px 0;text-align:center;font-size:20px">
        🎯 Centros: <span id="centrosTxt"></span>
      </div>

      <div style="text-align:center;margin-top:10px">
        <button id="btnTerminais">Terminais</button>
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

  const linhasDiv=document.getElementById("linhas");
  const botoesDiv=document.getElementById("botoes");

  // cria SEMPRE 5 linhas, mas vamos esconder/mostrar
  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style=`border:1px solid #666;background:#222;border-radius:6px;
             padding:6px;margin-bottom:8px;display:grid;
             grid-template-columns:repeat(14,1fr);gap:4px`;
    linhasDiv.appendChild(d);
  }

  // botão Terminais: alterna 1 linha / 5 linhas
  btnTerminais.onclick = ()=>{
    mostrar5Linhas = !mostrar5Linhas;
    btnTerminais.style.border = mostrar5Linhas ? "2px solid #4caf50" : "";
    render();
  };

  btnCavalos.onclick=()=>{modoCavalos=!modoCavalos;render();};
  btnColuna.onclick =()=>{modoRotulo=(modoRotulo==="C"?"T":"C");render();};
  btnDuzia.onclick  =()=>{modoRotulo=(modoRotulo==="D"?"T":"D");render();};
  btnEspelhos.onclick=()=>{modoEspelhos=!modoEspelhos;render();};

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{hist.push(n);render();};
    botoesDiv.appendChild(b);
  }

  function render(){
    const ult=hist.slice(-14).reverse();
    const pares=melhoresPares();

    // ✅ controla linhas visíveis
    for(let i=0;i<5;i++){
      const linha = document.getElementById("hist"+i);
      linha.style.display = (mostrar5Linhas || i===0) ? "grid" : "none";
    }

    // renderiza só as linhas que estiverem ativas
    const limite = mostrar5Linhas ? 5 : 1;

    for(let i=0;i<limite;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";
      let p=pares[i];
      if(!p) continue;

      let ca=coverTerminal(p.a), cb=coverTerminal(p.b);

      ult.forEach((n,idx)=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`padding:4px 0;border-radius:6px;
                 background:${corNumero(n)};color:#fff;
                 cursor:${i===0?"pointer":"default"}`;

        // clique na 1ª linha remove do histórico (todas linhas)
        if(i===0){
          d.onclick=()=>{
            const real=hist.length-1-idx;
            if(real>=0){hist.splice(real,1);render();}
          };
        }
        w.appendChild(d);

        // rótulos
        if(modoRotulo==="T"&&(ca.has(n)||cb.has(n))){
          let t=ca.has(n)?p.a:p.b;
          let lb=document.createElement("div");
          lb.textContent="T"+t;
          lb.style=`font-size:11px;font-weight:bold;color:${coresT[t]}`;
          w.appendChild(lb);
        }

        if(modoRotulo==="C"&&n!==0){
          let c=(n%3===1)?1:(n%3===2)?2:3;
          let lb=document.createElement("div");
          lb.textContent="C"+c;
          lb.style=`font-size:11px;font-weight:bold;color:${coresColuna[c]}`;
          w.appendChild(lb);
        }

        if(modoRotulo==="D"&&n!==0){
          let d2=(n<=12)?1:(n<=24)?2:3;
          let lb=document.createElement("div");
          lb.textContent="D"+d2;
          lb.style=`font-size:11px;font-weight:bold;color:${coresDuzia[d2]}`;
          w.appendChild(lb);
        }

        if(modoEspelhos&&espelhosSet.has(n)){
          let e=document.createElement("div");
          e.textContent="E";
          e.style="font-size:11px;font-weight:bold;color:#fff";
          w.appendChild(e);
        }

        h.appendChild(w);
      });
    }

    document.getElementById("centrosTxt").textContent =
      analisarCentros().join(" · ");
  }

  // inicia com 1 linha visível
  btnTerminais.style.border = "";
  render();

})();
