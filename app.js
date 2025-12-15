(function () {

  // ===== CONFIGURAÇÃO BASE =====
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds  = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  const cavalos = { A:[2,5,8], B:[0,3,6,9], C:[1,4,7] };

  let hist = [];

  // ===== FUNÇÕES AUXILIARES =====
  function terminal(n){ return n % 10; }

  function distanciaPista(a,b){
    const ia = track.indexOf(a);
    const ib = track.indexOf(b);
    let d = Math.abs(ia - ib);
    return Math.min(d, 37 - d);
  }

  // ===== ANÁLISE INTELIGENTE DOS 3 CENTROS =====
  function analisarCentrosEspalhados(){
    if(hist.length < 8) return [];

    const ult = hist.slice(-14);

    // força por terminal
    let forcaT = {};
    ult.forEach(n=>{
      let t = terminal(n);
      forcaT[t] = (forcaT[t] || 0) + 1;
    });

    // força por cavalo
    let forcaC = {A:0,B:0,C:0};
    ult.forEach(n=>{
      let t = terminal(n);
      if(cavalos.A.includes(t)) forcaC.A++;
      else if(cavalos.B.includes(t)) forcaC.B++;
      else forcaC.C++;
    });

    // candidatos: últimos números dos T e cavalos fortes
    let candidatos = [];

    Object.entries(forcaT)
      .sort((a,b)=>b[1]-a[1])
      .forEach(([t])=>{
        let num = [...ult].reverse().find(n=>terminal(n)==t);
        if(num!=null) candidatos.push({num, peso:2});
      });

    Object.entries(forcaC)
      .sort((a,b)=>b[1]-a[1])
      .forEach(([c])=>{
        let num = [...ult].reverse().find(n=>{
          let t = terminal(n);
          return (c==="A"&&cavalos.A.includes(t)) ||
                 (c==="B"&&cavalos.B.includes(t)) ||
                 (c==="C"&&cavalos.C.includes(t));
        });
        if(num!=null) candidatos.push({num, peso:1});
      });

    // remove duplicados mantendo peso maior
    let mapa = {};
    candidatos.forEach(c=>{
      if(!mapa[c.num] || mapa[c.num]<c.peso) mapa[c.num]=c.peso;
    });

    let lista = Object.keys(mapa)
      .map(n=>({num:parseInt(n), peso:mapa[n]}))
      .sort((a,b)=>b.peso-a.peso);

    // seleção espalhada
    let centros = [];
    for(let c of lista){
      if(centros.every(x=>distanciaPista(x, c.num) >= 6)){
        centros.push(c.num);
      }
      if(centros.length === 3) break;
    }

    // fallback se faltar
    if(centros.length < 3){
      for(let n of track){
        if(!centros.includes(n) &&
           centros.every(x=>distanciaPista(x,n)>=6)){
          centros.push(n);
        }
        if(centros.length===3) break;
      }
    }

    return centros;
  }

  // ===== UI =====
  document.body.innerHTML = `
    <div style="padding:14px;max-width:900px;margin:auto">
      <h2 style="text-align:center">Análise de Centros</h2>

      <div id="centrosBox"
        style="border:1px solid #888;
               background:#111;
               border-radius:8px;
               padding:10px;
               margin-top:12px;
               text-align:center;
               font-size:20px;
               letter-spacing:4px">
      </div>

      <div id="botoes"
        style="display:grid;
               grid-template-columns:repeat(9,1fr);
               gap:6px;
               max-width:520px;
               margin:16px auto">
      </div>
    </div>
  `;

  const centrosBox = document.getElementById("centrosBox");
  const botoesDiv = document.getElementById("botoes");

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
    let centros = analisarCentrosEspalhados();
    centrosBox.textContent = centros.join(" · ");
  }

  render();

})();
