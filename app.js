(function () {

  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];
  const terminal = n => n % 10;

  const corTerminal = {
    0:"#ff5252",1:"#ff9800",2:"#ffc107",3:"#00e676",4:"#00bcd4",
    5:"#2196f3",6:"#9c27b0",7:"#e91e63",8:"#8bc34a",9:"#ff00ff"
  };

  let timeline = [];
  const analises = { MANUAL: { filtros:new Set(), res:[] } };

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function alvosPorNumero(n, filtros){
    if(!filtros.size) return [];
    return vizinhosRace(n)
      .filter(v => v !== n && filtros.has(terminal(v)));
  }

  function validar(n, filtros, anterior){
    if(anterior == null) return false;
    return alvosPorNumero(anterior, filtros).includes(n);
  }

  function registrar(n, anterior){
    analises.MANUAL.res.unshift(
      validar(n, analises.MANUAL.filtros, anterior) ? "V" : "X"
    );
  }

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1000px;margin:auto">
      <h3 style="text-align:center">CSM</h3>

      <div style="display:flex;justify-content:center;margin-bottom:10px">
        <canvas id="radar" width="260" height="260"></canvas>
      </div>

      <div style="margin:10px 0">
        🕒 Timeline:
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button id="del" style="flex:1;padding:8px;background:#333;color:#fff">Último</button>
        <button id="clear" style="flex:1;padding:8px;background:#900;color:#fff">Limpar Tudo</button>
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        Terminais:
        <div id="btnT" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
      </div>

      <div style="margin-top:10px;border:1px solid #555;padding:8px">
        <b>ALVOS</b>
        <div id="cALVOS"></div>
      </div>

      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
    </div>
  `;

  const tl = document.getElementById("tl");
  const btnT = document.getElementById("btnT");
  const numsEl = document.getElementById("nums");
  const cALVOS = document.getElementById("cALVOS");

  document.getElementById("del").onclick=()=>{
    timeline.shift();
    analises.MANUAL.res.shift();
    render();
  };

  document.getElementById("clear").onclick=()=>{
    timeline=[];
    analises.MANUAL.res=[];
    render();
  };

  for(let t=0;t<=9;t++){
    const b=document.createElement("button");
    b.textContent="T"+t;
    b.style="padding:6px;background:#444;color:#fff;border:1px solid #666";
    b.onclick=()=>{
      if(analises.MANUAL.filtros.has(t)){
        analises.MANUAL.filtros.delete(t);
      } else {
        analises.MANUAL.filtros.add(t);
      }
      render();
    };
    btnT.appendChild(b);
  }

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    numsEl.appendChild(b);
  }

  function add(n){
    const anterior = timeline[0];
    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();
    registrar(n, anterior);
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

      ctx.fillStyle = ativos.has(track[i]) ? "#00e676" : "#fff";
      ctx.font="9px Arial";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText(track[i],tx,ty);
    }

    ctx.beginPath();
    ctx.arc(cx,cy,45,0,Math.PI*2);
    ctx.fillStyle="#111";
    ctx.fill();
  }

  function render(){

    const filtros = analises.MANUAL.filtros;

    // 🔥 TIMELINE INTELIGENTE
    tl.innerHTML = timeline.map(n=>{
      if(!filtros.size){
        return `<span style="color:#aaa">${n}</span>`;
      }

      let cor = "#aaa";

      filtros.forEach(t=>{
        track.forEach(x=>{
          if(terminal(x)===t){
            vizinhosRace(x).forEach(v=>{
              if(v===n){
                cor = corTerminal[t];
              }
            });
          }
        });
      });

      return `<span style="color:${cor}">${n}</span>`;
    }).join(" · ");

    document.querySelectorAll("#btnT button").forEach(b=>{
      const t=+b.textContent.slice(1);
      b.style.background =
        filtros.has(t) ? corTerminal[t] : "#444";
    });

    // 🔥 ALVOS DINÂMICOS (CORRIGIDO)
    let alvosSet = new Set();

    timeline.forEach(n=>{
      let alvos = alvosPorNumero(n, filtros);

      // 🔥 se não gerar alvo → ele entra como base
      if(alvos.length === 0 && filtros.has(n%10)){
        alvosSet.add(n);
      }

      alvos.forEach(a=>alvosSet.add(a));
    });

    cALVOS.innerHTML = [...alvosSet].join(" - ");

    desenharRadar();
  }

  render();

})();
