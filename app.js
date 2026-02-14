(function () {

  // ================= CONFIG BASE =================
  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];
  const terminal = n => n % 10;

  // ================= ESTADO =================
  let timeline = [];
  let modoEstruturalAtivo = false;
  let centraisAtivos = [];

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  // ================= LEITOR ESTRUTURAL =================
  function gerarLeitorEstrutural(){

    if(timeline.length < 5) return [];

    const usados = new Set();
    const centros = [];

    function bloco5(n){
      const i = track.indexOf(n);
      return [
        track[(i-2+37)%37],
        track[(i-1+37)%37],
        n,
        track[(i+1)%37],
        track[(i+2)%37]
      ];
    }

    function podeUsar(n){
      return bloco5(n).every(x => !usados.has(x));
    }

    function registrarCentro(n){
      bloco5(n).forEach(x => usados.add(x));
      centros.push(n);
    }

    const freq = {};
    timeline.forEach(n => freq[n]=(freq[n]||0)+1);

    Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .forEach(n=>{
        if(centros.length<5 && podeUsar(n)) registrarCentro(n);
      });

    while(centros.length < 5){
      const aleatorio = track[Math.floor(Math.random()*37)];
      if(podeUsar(aleatorio)) registrarCentro(aleatorio);
    }

    return centros.slice(0,5);
  }

  function validarEstrutural(numero, centros){
    return centros.some(c=>{
      const i = track.indexOf(c);
      const bloco = [
        track[(i-2+37)%37],
        track[(i-1+37)%37],
        c,
        track[(i+1)%37],
        track[(i+2)%37]
      ];
      return bloco.includes(numero);
    });
  }

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1000px;margin:auto">

      <div style="margin-bottom:10px">
        🕒 Timeline:
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <div id="estruturaBox"
           style="border:1px solid #00e676;
                  padding:8px;
                  margin-bottom:10px;
                  cursor:pointer;">
      </div>

      <div style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
        <b>1479</b>
        <div id="tl1479"></div>
      </div>

      <div style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
        <b>2589</b>
        <div id="tl2589"></div>
      </div>

      <div style="border:1px solid #555;padding:6px;margin-bottom:10px;cursor:pointer">
        <b>0369</b>
        <div id="tl0369"></div>
      </div>

      <div id="nums"
           style="display:grid;grid-template-columns:repeat(9,1fr);
                  gap:6px;margin-top:12px"></div>
    </div>
  `;

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    nums.appendChild(b);
  }

  function add(n){

    let resultado = null;

    if(modoEstruturalAtivo){
      resultado = validarEstrutural(n, centraisAtivos);
    }

    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();

    if(modoEstruturalAtivo){
      timeline[0] = {numero:n, ok:resultado};
    }

    centraisAtivos = gerarLeitorEstrutural();

    render();
  }

  function render(){

    tl.innerHTML = timeline.map(item=>{
      if(typeof item === "object"){
        const cor = item.ok ? "#00e676" : "#ff5252";
        return `<span style="color:${cor}">${item.numero}</span>`;
      } else {
        return `<span style="color:#aaa">${item}</span>`;
      }
    }).join(" · ");

    estruturaBox.innerHTML = `
      <b>Leitor Estrutural</b><br><br>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${centraisAtivos.map(n=>`
          <div style="
            background:#222;
            padding:8px;
            border:1px solid #00e676;
            min-width:50px;
            text-align:center;
            font-weight:bold;
          ">${n}</div>
        `).join("")}
      </div>
    `;

    estruturaBox.onclick=()=>{
      modoEstruturalAtivo=true;
      centraisAtivos = gerarLeitorEstrutural();
      estruturaBox.style.boxShadow="0 0 12px #00e676";
    };

    const grupos = {
      tl1479:[1,4,7,9],
      tl2589:[2,5,8,9],
      tl0369:[0,3,6,9]
    };

    Object.entries(grupos).forEach(([id,grupo])=>{
      document.getElementById(id).innerHTML =
        timeline.map(item=>{
          const n = typeof item==="object"?item.numero:item;
          const verde = vizinhosRace(n)
            .some(v=>grupo.includes(terminal(v)));
          return `<span style="
            display:inline-block;
            width:18px;
            text-align:center;
            background:${verde?"#00e676":"transparent"};
            border-radius:3px;
            margin-right:2px;
          ">${n}</span>`;
        }).join("");
    });
  }

  centraisAtivos = gerarLeitorEstrutural();
  render();

})();
