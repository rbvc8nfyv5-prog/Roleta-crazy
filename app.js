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
    B:"#4caf50", // 147
    C:"#2196f3"  // 0369
  };

  const cavalos = {
    A:[2,5,8],
    B:[1,4,7],
    C:[0,3,6,9]
  };

  let hist = [];

  // ===== FUNÇÕES =====
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

  function cavaloDoNumero(n){
    let t = n % 10;
    if(cavalos.A.includes(t)) return "A";
    if(cavalos.B.includes(t)) return "B";
    return "C";
  }

  // 🔥 NOVA FUNÇÃO: pares baseados em cavalos fortes
  function melhoresParesPorCavalos(){
    if(hist.length < 3) return [];

    let ult = hist.slice(-14);

    // 1) força dos cavalos
    let scoreCavalos = {A:0,B:0,C:0};
    ult.forEach(n=>{
      scoreCavalos[cavaloDoNumero(n)]++;
    });

    // 2) ordenar cavalos
    let ordemCavalos = Object.keys(scoreCavalos)
      .sort((a,b)=>scoreCavalos[b]-scoreCavalos[a]);

    // 3) gerar combinações cavalo x cavalo
    let paresCavalos = [];
    for(let i=0;i<ordemCavalos.length;i++){
      for(let j=i+1;j<ordemCavalos.length;j++){
        paresCavalos.push([ordemCavalos[i],ordemCavalos[j]]);
      }
    }

    let todosPares = [];

    // 4) cavalo x cavalo → pares T–T
    paresCavalos.forEach(([c1,c2])=>{
      cavalos[c1].forEach(t1=>{
        cavalos[c2].forEach(t2=>{
          let ca = coverTerminal(t1);
          let cb = coverTerminal(t2);

          let hits = 0;
          ult.forEach(n=>{
            if(ca.has(n) || cb.has(n)) hits++;
          });

          let erros = ult.length - hits;
          todosPares.push({a:t1,b:t2,erros,hits});
        });
      });
    });

    // 5) ordenar e pegar top 5
    todosPares.sort((x,y)=>{
      if(x.erros !== y.erros) return x.erros - y.erros;
      return y.hits - x.hits;
    });

    return todosPares.slice(0,5);
  }

  // ===== UI BÁSICA =====
  document.body.innerHTML = `
    <div style="padding:12px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — Pares por Cavalos Fortes</h2>
      <div id="linhas"></div>
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

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{ hist.push(n); render(); };
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresParesPorCavalos();
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
        d.style="padding:4px 0;border-radius:6px;background:#333;color:#fff";
        w.appendChild(d);

        if(ca.has(n) || cb.has(n)){
          let t = ca.has(n) ? p.a : p.b;
          let lb=document.createElement("div");
          lb.textContent="T"+t;
          lb.style=`font-size:11px;font-weight:bold;color:${coresT[t]}`;
          w.appendChild(lb);
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
