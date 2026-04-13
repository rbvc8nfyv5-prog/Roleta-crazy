(function () {

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];
  const terminal = n => n % 10;

  const corTerminal = {
    0:"#ff5252",
    1:"#ff9800",
    2:"#ffc107",
    3:"#00e676",
    4:"#00bcd4",
    5:"#2196f3",
    6:"#9c27b0",
    7:"#e91e63",
    8:"#8bc34a",
    9:"#ff00ff"
  };

  let timeline = [];
  let historicoCompleto = []; // 🔥 NOVO
  let expandido = false; // 🔥 NOVO

  const analises = {
    MANUAL: { filtros:new Set(), res:[] }
  };

  let filtrosConjuntos = new Set();
  const modosTerminais = {};
  const ordemSelecionados = [];
  for (let t = 0; t <= 9; t++) modosTerminais[t] = 0;

  function atualizarModosPorOrdem(){
    for(let t=0;t<=9;t++) modosTerminais[t] = 0;
    if(ordemSelecionados.length > 0){
      modosTerminais[ordemSelecionados[0]] = 2;
    }
    for(let i=1;i<ordemSelecionados.length;i++){
      modosTerminais[ordemSelecionados[i]] = 1;
    }
  }

  function vizinhos1(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function vizinhos2(n){
    const i = track.indexOf(n);
    return [
      track[(i+35)%37],
      track[(i+36)%37],
      n,
      track[(i+1)%37],
      track[(i+2)%37]
    ];
  }

  function registrar(n){
    analises.MANUAL.res.unshift("V");
  }

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1000px;margin:auto">

      <!-- 🔥 CAMPO COLAR -->
      <textarea id="inputHist" placeholder="Cole histórico aqui"
      style="width:100%;margin-bottom:10px;background:#222;color:#fff;border:1px solid #555;padding:6px"></textarea>

      <h3 style="text-align:center">CSM</h3>

      <div style="display:flex;justify-content:center;margin-bottom:10px">
        <canvas id="radar" width="260" height="260"></canvas>
      </div>

      <div style="margin:10px 0">
        🕒 Timeline:
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button id="btnUndo" style="padding:6px 10px;background:#444;color:#fff;border:1px solid #666">Apagar último</button>
        <button id="btnClear" style="padding:6px 10px;background:#444;color:#fff;border:1px solid #666">Apagar tudo</button>
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        Terminais:
        <div id="btnT" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
      </div>

      <div style="margin-top:15px;border:1px solid #444;padding:8px">
        <b>Seleção dos terminais</b>
        <div id="modoBox" style="margin-top:6px;font-weight:700;font-size:16px"></div>
      </div>

      <!-- 🔥 SUA LINHA SECUNDÁRIA -->
      <div id="conjArea" style="display:none;margin-top:12px;overflow-x:auto"></div>

      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
    </div>
  `;

  // 🔥 COLAR HISTÓRICO
  inputHist.addEventListener("paste", ()=>{
    setTimeout(()=>{
      historicoCompleto = inputHist.value
        .split(/[\s,;|]+/)
        .map(Number)
        .filter(n=>n>=0 && n<=36);

      timeline = historicoCompleto.slice(-14).reverse();

      inputHist.style.display="none";

      render();
    },0);
  });

  for(let t=0;t<=9;t++){
    const b=document.createElement("button");
    b.textContent="T"+t;
    b.style="padding:6px;background:#444;color:#fff;border:1px solid #666";
    b.onclick=()=>{
      if(analises.MANUAL.filtros.has(t)){
        analises.MANUAL.filtros.delete(t);
        const idx = ordemSelecionados.indexOf(t);
        if(idx !== -1) ordemSelecionados.splice(idx,1);
      } else {
        analises.MANUAL.filtros.add(t);
        ordemSelecionados.push(t);
      }
      atualizarModosPorOrdem();
      render();
    };
    btnT.appendChild(b);
  }

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    nums.appendChild(b);
  }

  btnUndo.onclick = ()=>{
    if(!timeline.length) return;
    timeline.shift();
    analises.MANUAL.res.shift();
    render();
  };

  btnClear.onclick = ()=>{
    timeline = [];
    historicoCompleto = [];
    ordemSelecionados.length = 0;
    analises.MANUAL.filtros.clear();
    render();
  };

  function add(n){
    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();
    historicoCompleto.push(n);
    registrar(n);
    render();
  }

  function desenharRadar(){

    const canvas = document.getElementById("radar");
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0,0,260,260);

    const cx = 130;
    const cy = 130;
    const r = 110;
    const ang = (Math.PI*2)/track.length;

    const ativos = new Set(timeline);

    for(let i=0;i<track.length;i++){
      const a1 = i*ang + Math.PI/2;
      const a2 = a1 + ang;

      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,a1,a2);
      ctx.closePath();

      ctx.fillStyle="#1c1c1c";
      ctx.fill();

      const meio = (a1+a2)/2;

      const tx = cx + Math.cos(meio)*(r-25);
      const ty = cy + Math.sin(meio)*(r-25);

      let corNumero="#fff";
      if(ativos.has(track[i])) corNumero="#00e676";

      ctx.fillStyle=corNumero;
      ctx.font="9px Arial";
      ctx.fillText(track[i],tx,ty);
    }

    ctx.beginPath();
    ctx.arc(cx,cy,45,0,Math.PI*2);
    ctx.fillStyle="#111";
    ctx.fill();
  }

  function render(){

    tl.innerHTML = timeline.join(" · ");

    const filtros = analises.MANUAL.filtros;

    document.querySelectorAll("#btnT button").forEach(b=>{
      const t=+b.textContent.match(/\d+/)[0];
      const ativo = filtros.has(t);

      b.style.background = ativo ? corTerminal[t] : "#444";
      b.style.border = modosTerminais[t] === 2 ? "2px solid #00e676" : "1px solid #666";
      b.textContent =
        modosTerminais[t] === 2 ? `T${t} 2v` :
        modosTerminais[t] === 1 ? `T${t} 1v` :
        `T${t}`;
    });

    if(filtros.size > 0){

      const mapaCores = {};
      const base = expandido ? historicoCompleto.slice().reverse() : timeline;

      filtros.forEach(t=>{
        track.forEach(n=>{
          if(terminal(n)===t){

            if(modosTerminais[t] === 2){
              vizinhos2(n).forEach(v=>mapaCores[v] = corTerminal[t]);
            } else if(modosTerminais[t] === 1){
              vizinhos1(n).forEach(v=>{
                if(!mapaCores[v]) mapaCores[v] = corTerminal[t];
              });
            }

          }
        });
      });

      conjArea.style.display = "block";

      conjArea.innerHTML = `
        <div style="
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(26px, 1fr));
          gap:4px;
        ">
          ${base.map(n=>`
            <div style="
              height:26px;
              display:flex;align-items:center;justify-content:center;
              background:${mapaCores[n] || "#222"};
              color:#fff;
              font-size:10px;
              border-radius:4px;
              border:1px solid #333;
            ">${n}</div>
          `).join("")}
        </div>
      `;
    } else {
      conjArea.style.display = "none";
    }

    desenharRadar();
  }

  // 🔥 EXPANDIR / VOLTAR
  conjArea.onclick = ()=>{
    expandido = !expandido;
    render();
  };

  render();

})();
