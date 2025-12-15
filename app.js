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

  let hist = [];

  // ===== FUNÇÕES =====
  function corNumero(n){
    if(n===0) return "#0f0";
    return reds.includes(n) ? "#e74c3c" : "#000";
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

  // 🔥 melhores pares = MENOS ERROS nos últimos 14
  function melhoresParesAssertivos(){
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
        todos.push({a,b,hits,erros});
      }
    }

    // ordena por MENOS erros, depois mais hits
    todos.sort((x,y)=>{
      if(x.erros !== y.erros) return x.erros - y.erros;
      return y.hits - x.hits;
    });

    let usados = {};
    let escolhidos = [];

    for(let p of todos){
      usados[p.a] = usados[p.a] || 0;
      usados[p.b] = usados[p.b] || 0;

      if(usados[p.a] >= 2 || usados[p.b] >= 2) continue;

      escolhidos.push(p);
      usados[p.a]++;
      usados[p.b]++;

      if(escolhidos.length === 5) break;
    }

    return escolhidos;
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:14px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — Pares Mais Assertivos (14 giros)</h2>

      <div id="linhas"></div>

      <div id="botoes"
        style="display:grid;grid-template-columns:repeat(9,1fr);
               gap:4px;max-width:520px;margin:12px auto">
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  // cria 5 linhas
  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style="border:1px solid #666;background:#222;border-radius:6px;padding:8px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center";
    linhasDiv.appendChild(d);
  }

  // botões 0–36
  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{
      hist.push(n);
      if(hist.length>200) hist.shift();
      render();
    };
    botoesDiv.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresParesAssertivos();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";
      if(!pares[i]) continue;

      let p = pares[i];
      let ca = coverTerminal(p.a);
      let cb = coverTerminal(p.b);

      ult.forEach((n,idx)=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`padding:6px 8px;border-radius:6px;font-size:20px;
                 background:${corNumero(n)};
                 color:${corNumero(n)==="#000"?"#fff":"#000"};
                 cursor:${i===0?"pointer":"default"}`;

        // 🟢 CLIQUE NA 1ª LINHA → REMOVE SOMENTE O NÚMERO
        if(i === 0){
          d.onclick = ()=>{
            let realIndex = hist.length - 1 - idx;
            if(realIndex >= 0){
              hist.splice(realIndex, 1);
              render();
            }
          };
        }

        w.appendChild(d);

        if(ca.has(n) || cb.has(n)){
          let terminal = ca.has(n) ? p.a : p.b;
          let t=document.createElement("div");
          t.textContent="T"+terminal;
          t.style=`font-size:12px;font-weight:bold;color:${coresT[terminal]}`;
          w.appendChild(t);
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
