(function () {

  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];

  let hist = [];

  document.body.innerHTML = `
    <div style="padding:10px;color:#fff;font-family:Arial">
      <h3 style="text-align:center">Modelo Dinâmico Original</h3>
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

  function offset(a,b){
    let d = Math.abs(a-b);
    return Math.min(d,37-d);
  }

  function gerarCentrais(){

    if(hist.length < 5) return [];

    let ult = hist.slice(-5);
    let idx = ult.map(n => track.indexOf(n));
    let ultimo = idx[idx.length-1];

    let candidatos = [];

    // 1️⃣ Angular
    let offs = [];
    for(let i=1;i<idx.length;i++){
      offs.push(offset(idx[i-1],idx[i]));
    }
    let media = offs.reduce((a,b)=>a+b)/offs.length;

    if(media <= 4) candidatos.push(track[ultimo]);
    else if(media <= 9){
      let proj = (ultimo + Math.round(media)) % 37;
      candidatos.push(track[proj]);
    } else {
      let oposto = (ultimo + 18) % 37;
      candidatos.push(track[oposto]);
    }

    // 2️⃣ Permanência lateral
    candidatos.push(track[(ultimo+1)%37]);

    // 3️⃣ Compensação simples (lado oposto curto)
    candidatos.push(track[(ultimo+9)%37]);

    // 4️⃣ Lacuna física (ponto mais distante do último)
    let maior = 0;
    let centroLacuna = null;
    for(let i=0;i<37;i++){
      let dist = offset(i,ultimo);
      if(dist > maior){
        maior = dist;
        centroLacuna = track[i];
      }
    }
    candidatos.push(centroLacuna);

    // 5️⃣ Preenchimento angular
    let mediaPos = Math.round(idx.reduce((a,b)=>a+b)/idx.length) % 37;
    candidatos.push(track[mediaPos]);

    // Remover duplicados
    candidatos = [...new Set(candidatos)];

    // GARANTIR 5 SEM CONFLITO
    let finais = [];
    let usados = new Set();

    for(let base of candidatos){

      let escolhido = null;

      for(let t=0;t<6;t++){
        let pos = (track.indexOf(base)+t)%37;
        let cand = track[pos];
        let zona = vizinhos2(cand);

        if(zona.every(n=>!usados.has(n))){
          escolhido = cand;
          break;
        }
      }

      if(escolhido){
        vizinhos2(escolhido).forEach(n=>usados.add(n));
        finais.push(escolhido);
      }

      if(finais.length===5) break;
    }

    // Se ainda faltar, completa girando disco
    let i=0;
    while(finais.length<5 && i<37){
      let cand = track[i];
      let zona = vizinhos2(cand);
      if(zona.every(n=>!usados.has(n))){
        vizinhos2(cand).forEach(n=>usados.add(n));
        finais.push(cand);
      }
      i++;
    }

    return finais.slice(0,5);
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
