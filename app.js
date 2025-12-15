(function () {

  // ===== CONFIGURAÇÃO BASE =====
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds  = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  // cores fixas dos T
  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",4:"#d500f9",
    5:"#ffee58",6:"#2979ff",7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  // 🐎 Cavalos (só cor do NÚMERO)
  const cavalos = { A:[2,5,8], B:[0,3,6,9], C:[1,4,7] };
  const coresCavalos = { A:"#9c27b0", B:"#2196f3", C:"#4caf50" };

  // Coluna / Dúzia (rótulo completo quando selecionado)
  const coresColuna = { 1:"#fbc02d", 2:"#e53935", 3:"#1e88e5" };
  const coresDuzia  = { 1:"#4caf50", 2:"#2196f3", 3:"#9c27b0" };

  // Espelhos
  const espelhosBase = [11,12,13,21,22,23,31,32,33];

  // ===== ESTADO =====
  let modoCavalos = false;
  let modoRotulo = "T";     // "T" | "C" | "D"
  let modoEspelhos = false; // marca "E"
  let hist = [];

  // ===== FUNÇÕES =====
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
    const c = cavaloDoTerminal(terminal(n));
    return coresCavalos[c] || corNumeroNormal(n);
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

  // ✅ “Normal” com aleatoriedade leve:
  // - usa últimos 14 giros
  // - calcula erros/hits
  // - pega um pool dos melhores e escolhe 5 com diversidade (max 2 repetições por terminal)
  // - adiciona “jitter” pequeno para não ficar travado sempre igual
  function melhoresParesBalanceadosAleatorios(){
    if(hist.length < 3) return [];

    const ult = hist.slice(-14);
    const covers = Array.from({length:10}, (_,t)=>coverTerminal(t));

    let todos = [];
    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits = 0;
        for(const n of ult){
          if(covers[a].has(n) || covers[b].has(n)) hits++;
        }
        const erros = ult.length - hits;

        // score base: menos erros melhor, mais hits melhor
        // jitter: evita repetir sempre os mesmos (bem leve)
        const jitter = (Math.random() - 0.5) * 0.15; // bem pequeno
        const score = (100 - erros*10 + hits) + jitter;

        todos.push({a,b,hits,erros,score});
      }
    }

    // pega um "pool" dos melhores
    todos.sort((x,y)=>{
      if(x.erros !== y.erros) return x.erros - y.erros;
      if(y.hits !== x.hits) return y.hits - x.hits;
      return y.score - x.score;
    });
    const pool = todos.slice(0, 18); // top 18 pra variar

    // seleção com diversidade (max 2 por terminal)
    let usados = {};
    let escolhidos = [];

    // embaralha levemente o pool mantendo tendência de melhor
    const weighted = pool.map(p => ({...p, w: p.score + Math.random()*0.25}));
    weighted.sort((x,y)=>y.w-x.w);

    for(const p of weighted){
      usados[p.a] = usados[p.a] || 0;
      usados[p.b] = usados[p.b] || 0;
      if(usados[p.a] >= 2 || usados[p.b] >= 2) continue;
      escolhidos.push(p);
      usados[p.a]++; usados[p.b]++;
      if(escolhidos.length === 5) break;
    }

    // fallback se não conseguiu 5 por diversidade
    if(escolhidos.length < 5){
      for(const p of pool){
        if(escolhidos.find(x=>x.a===p.a && x.b===p.b)) continue;
        escolhidos.push(p);
        if(escolhidos.length === 5) break;
      }
    }

    return escolhidos;
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:12px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — 5 pares (14 giros)</h2>

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

  // 5 linhas
  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id = "hist"+i;
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
  function marcarBotao(btn, on){
    btn.style.border = on ? "2px solid #4caf50" : "";
    btn.style.background = on ? "#1b1b1b" : "";
  }

  btnCavalos.onclick = ()=>{
    modoCavalos = !modoCavalos;
    marcarBotao(btnCavalos, modoCavalos);
    render();
  };

  btnColuna.onclick = ()=>{
    modoRotulo = (modoRotulo === "C") ? "T" : "C";
    marcarBotao(btnColuna, modoRotulo==="C");
    marcarBotao(btnDuzia,  false);
    render();
  };

  btnDuzia.onclick = ()=>{
    modoRotulo = (modoRotulo === "D") ? "T" : "D";
    marcarBotao(btnDuzia,  modoRotulo==="D");
    marcarBotao(btnColuna, false);
    render();
  };

  btnEspelhos.onclick = ()=>{
    modoEspelhos = !modoEspelhos;
    marcarBotao(btnEspelhos, modoEspelhos);
    render();
  };

  // botões 0–36
  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{
      hist.push(n);
      if(hist.length>250) hist.shift();
      render();
    };
    botoesDiv.appendChild(b);
  }

  // ===== RENDER =====
  function render(){
    const ult = hist.slice(-14).reverse();
    const pares = melhoresParesBalanceadosAleatorios();

    for(let i=0;i<5;i++){
      const h = document.getElementById("hist"+i);
      h.innerHTML = "";
      const p = pares[i];
      if(!p) continue;

      const ca = coverTerminal(p.a);
      const cb = coverTerminal(p.b);

      ult.forEach((n, idx)=>{
        const w = document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        const d = document.createElement("div");
        d.textContent = n;
        d.style = `
          width:100%;
          padding:4px 0;
          border-radius:6px;
          text-align:center;
          background:${corNumero(n)};
          color:#fff;
          cursor:${i===0 ? "pointer" : "default"};
        `;

        // ✅ NOVO: clique na 1ª linha remove do HISTÓRICO (então some em TODAS)
        if(i===0){
          d.onclick = ()=>{
            const realIndex = hist.length - 1 - idx; // idx é no array invertido
            if(realIndex >= 0){
              hist.splice(realIndex, 1);
              render();
            }
          };
        }

        w.appendChild(d);

        // rótulo embaixo
        let rotulo = null;

        if(modoRotulo === "T"){
          if(ca.has(n) || cb.has(n)){
            const t = ca.has(n) ? p.a : p.b;
            rotulo = { txt:"T"+t, cor:coresT[t] };
          }
        } else if(modoRotulo === "C"){
          if(n !== 0){
            const c = (n%3===1) ? 1 : (n%3===2) ? 2 : 3;
            rotulo = { txt:"C"+c, cor:coresColuna[c] };
          }
        } else if(modoRotulo === "D"){
          if(n !== 0){
            const d = (n<=12) ? 1 : (n<=24) ? 2 : 3;
            rotulo = { txt:"D"+d, cor:coresDuzia[d] };
          }
        }

        if(rotulo){
          const lb = document.createElement("div");
          lb.textContent = rotulo.txt;
          lb.style = `font-size:11px;font-weight:bold;color:${rotulo.cor}`;
          w.appendChild(lb);
        }

        // espelhos (E extra)
        if(modoEspelhos && espelhosSet.has(n)){
          const e = document.createElement("div");
          e.textContent = "E";
          e.style = "font-size:11px;font-weight:bold;color:#fff";
          w.appendChild(e);
        }

        h.appendChild(w);
      });
    }
  }

  // marcações iniciais
  marcarBotao(btnCavalos, false);
  marcarBotao(btnColuna,  false);
  marcarBotao(btnDuzia,   false);
  marcarBotao(btnEspelhos,false);

  render();

})();
