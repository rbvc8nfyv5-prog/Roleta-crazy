(function () {

  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];

  const setores = {
    TIER:    new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS: new Set([1,20,14,31,9,17,34,6]),
    ZERO:    new Set([0,3,12,15,26,32,35]),
    VOISINS: new Set([2,4,7,18,19,21,22,25,28,29])
  };

  let hist = [];

  document.body.innerHTML = `
    <div style="padding:10px;color:#fff;font-family:Arial">
      <h3 style="text-align:center">Linha do Tempo + Análise</h3>
      <div id="linhas"></div>
      <div style="border:1px solid #555;padding:6px;margin:6px 0;text-align:center">
        🎯 CENTRAIS: <span id="centrais"></span>
      </div>
      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;"></div>
    </div>
  `;

  const linhas = document.getElementById("linhas");
  const nums = document.getElementById("nums");

  for (let i = 0; i < 5; i++) {
    let d = document.createElement("div");
    d.id = "h" + i;
    d.style = "display:flex;gap:4px;justify-content:center;margin-bottom:4px";
    linhas.appendChild(d);
  }

  for (let n = 0; n <= 36; n++) {
    let b = document.createElement("button");
    b.textContent = n;
    b.style = "padding:6px;font-size:14px";
    b.onclick = () => { hist.push(n); render(); };
    nums.appendChild(b);
  }

  function duzia(n){ return n===0?null:Math.ceil(n/12); }
  function coluna(n){ return n===0?null:((n-1)%3)+1; }

  function setor(n){
    for(let s in setores) if(setores[s].has(n)) return s;
    return null;
  }

  function vizinhos2(n){
    let i = track.indexOf(n);
    return [
      track[(i-2+37)%37],
      track[(i-1+37)%37],
      n,
      track[(i+1)%37],
      track[(i+2)%37]
    ];
  }

  function gerarCentrais(){

    if(hist.length < 6) return [];

    let ult = hist.slice(-12);

    let contSet = {TIER:0,ORPHANS:0,ZERO:0,VOISINS:0};
    let contDuz = [0,0,0];
    let contCol = [0,0,0];

    ult.forEach(n=>{
      let s = setor(n);
      if(s) contSet[s]++;
      let d = duzia(n);
      if(d) contDuz[d-1]++;
      let c = coluna(n);
      if(c) contCol[c-1]++;
    });

    let candidatos = [];

    for(let n=0;n<=36;n++){

      let peso = 0;

      let s = setor(n);
      if(s) peso += contSet[s]*2;

      let d = duzia(n);
      if(d) peso += (Math.max(...contDuz)-contDuz[d-1])*2;

      let c = coluna(n);
      if(c) peso += (Math.max(...contCol)-contCol[c-1]);

      if(ult.slice(-6).includes(n)) peso -= 5;

      candidatos.push({n,peso});
    }

    candidatos.sort((a,b)=>b.peso-a.peso);

    let usados = new Set();
    let finais = [];

    for(let obj of candidatos){

      let zona = vizinhos2(obj.n);

      if(zona.every(x=>!usados.has(x))){
        zona.forEach(x=>usados.add(x));
        finais.push(obj.n);
      }

      if(finais.length===5) break;
    }

    return finais;
  }

  function render(){

    let ult = hist.slice(-45).reverse();

    for (let i = 0; i < 5; i++) {
      let h = document.getElementById("h" + i);
      h.innerHTML = "";
      let parte = ult.slice(i * 9, i * 9 + 9);

      parte.forEach((n, idx) => {
        let d = document.createElement("div");
        d.textContent = n;
        d.style = `
          width:28px;
          height:28px;
          line-height:28px;
          background:#333;
          color:#fff;
          border-radius:4px;
          text-align:center;
          cursor:pointer;
        `;
        d.onclick = () => {
          let pos = hist.length - 1 - (i * 9 + idx);
          hist.splice(pos, 1);
          render();
        };
        h.appendChild(d);
      });
    }

    document.getElementById("centrais").textContent =
      gerarCentrais().join(" · ");
  }

  render();

})();
