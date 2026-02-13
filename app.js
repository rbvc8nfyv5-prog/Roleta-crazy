(function () {

  // ================= CONFIG =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];

  const setores = {
    TIER:    new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS: new Set([1,20,14,31,9,17,34,6]),
    ZERO:    new Set([0,3,12,15,26,32,35]),
    VOISINS: new Set([2,4,7,18,19,21,22,25,28,29])
  };

  // ================= ESTADO =================
  let hist = [];

  // ================= UI =================
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
    b.onclick = () => {
      hist.push(n);
      render();
    };
    nums.appendChild(b);
  }

  // ================= FUNÇÕES =================

  function duzia(n){ return n===0?null:Math.ceil(n/12); }
  function coluna(n){ return n===0?null:((n-1)%3)+1; }

  function setorDoNumero(n){
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
    let usados = new Set();
    let finais = [];

    function pesoSetor(n){
      let s = setorDoNumero(n);
      return ult.filter(x => setorDoNumero(x) === s).length;
    }

    function penalidadeRecente(n){
      return ult.slice(-6).includes(n) ? -2 : 0;
    }

    function ajustarNoDisco(n, tentativa=0){
      let i = track.indexOf(n);
      return track[(i + tentativa + 37) % 37];
    }

    function zonaLivre(n){
      let zona = vizinhos2(n);
      return zona.every(x => !usados.has(x));
    }

    let candidatosBase = [30,29,6,0,19];

    candidatosBase.sort((a,b)=>{
      let pa = pesoSetor(a) + penalidadeRecente(a);
      let pb = pesoSetor(b) + penalidadeRecente(b);
      return pb - pa;
    });

    for(let base of candidatosBase){

      let escolhido = null;

      for(let t=0; t<6; t++){
        let candidato = ajustarNoDisco(base, t);
        if(zonaLivre(candidato)){
          escolhido = candidato;
          break;
        }
      }

      if(escolhido !== null){
        let zona = vizinhos2(escolhido);
        zona.forEach(x=>usados.add(x));
        finais.push(escolhido);
      }

      if(finais.length === 5) break;
    }

    return finais;
  }

  // ================= RENDER =================
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
