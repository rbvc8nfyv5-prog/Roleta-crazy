(function () {

  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  let hist = [];

  function cor(n){
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

  function melhoresPares(){
    if(hist.length < 2) return [];
    let ult = hist.slice(-6);
    let pares = [];
    let covers = [];
    for(let t=0;t<10;t++) covers[t] = coverTerminal(t);

    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let hits = 0;
        ult.forEach(n=>{
          if(covers[a].has(n) || covers[b].has(n)) hits++;
        });
        pares.push({a,b,hits});
      }
    }

    pares.sort((x,y)=>y.hits-x.hits);
    return pares.slice(0,5);
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:14px;max-width:1100px;margin:auto">
      <h2 style="text-align:center">Roleta — 5 melhores pares (±1)</h2>
      <div id="linhas"></div>
      <div id="botoes"
           style="display:grid;grid-template-columns:repeat(9,1fr);gap:4px;
                  max-width:520px;margin:12px auto"></div>
      <div style="text-align:center">
        <button id="clearBtn">Clear</button>
      </div>
    </div>
  `;

  const linhasDiv = document.getElementById("linhas");
  const botoesDiv = document.getElementById("botoes");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="hist"+i;
    d.style="border:1px solid #666;background:#222;border-radius:6px;padding:8px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center";
    linhasDiv.appendChild(d);
  }

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.onclick=()=>{
      hist.push(n);
      if(hist.length>50) hist.shift();
      render();
    };
    botoesDiv.appendChild(b);
  }

  document.getElementById("clearBtn").onclick = () => {
    hist = [];
    render();
  };

  function render(){
    let ult = hist.slice(-6).reverse();
    let pares = melhoresPares();

    for(let i=0;i<5;i++){
      let h=document.getElementById("hist"+i);
      h.innerHTML="";

      if(!pares[i]) continue;
      let p = pares[i];
      let ca = coverTerminal(p.a);
      let cb = coverTerminal(p.b);

      ult.forEach(n=>{
        let w=document.createElement("div");
        w.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style=`padding:6px 8px;border-radius:6px;font-size:20px;
                 background:${cor(n)};
                 color:${cor(n)==="#000"?"#fff":"#000"}`;
        w.appendChild(d);

        if(ca.has(n) || cb.has(n)){
          let t=document.createElement("div");
          t.textContent = ca.has(n) ? "T"+p.a : "T"+p.b;
          t.style="font-size:12px;color:#39ff14";
          w.appendChild(t);
        }

        h.appendChild(w);
      });
    }
  }

  render();

})();
