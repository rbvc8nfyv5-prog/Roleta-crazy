(function () {

  // ================= CONFIG BASE =================
  const track = [
    32,15,19,4,21,2,25,17,34,6,
    27,13,36,11,30,8,23,10,5,24,
    16,33,1,20,14,31,9,22,18,29,
    7,28,12,35,3,26,0
  ];
  const terminal = n => n % 10;

  const eixos = [
    { nome:"ZERO", trios:[[0,32,15],[19,4,21],[2,25,17],[34,6,27]] },
    { nome:"TIERS", trios:[[13,36,11],[30,8,23],[10,5,24],[16,33,1]] },
    { nome:"ORPHELINS", trios:[[20,14,31],[9,22,18],[7,29,28],[12,35,3]] }
  ];

  let timeline = [];
  let janela = 6;
  let modoAtivo = "MANUAL";
  let autoTAtivo = null;

  const analises = {
    MANUAL: { filtros:new Set(), res:[] },
    VIZINHO:{ filtros:new Set(), res:[], motor:new Set() },
    NUNUM:  { filtros:new Set(), res:[] },
    AUTO: {
      3:{ filtros:new Set(), res:[] },
      4:{ filtros:new Set(), res:[] },
      5:{ filtros:new Set(), res:[] },
      6:{ filtros:new Set(), res:[] },
      7:{ filtros:new Set(), res:[] }
    }
  };

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function triosSelecionados(filtros){
    let lista=[];
    eixos.forEach(e=>{
      e.trios.forEach(trio=>{
        const inter = trio.map(terminal)
          .filter(t=>!filtros.size||filtros.has(t)).length;
        if(inter>0) lista.push({eixo:e.nome,trio});
      });
    });
    return lista.slice(0,9);
  }

  function validar(n, filtros){
    return triosSelecionados(filtros).some(x=>x.trio.includes(n));
  }

  function registrar(n){
    analises.MANUAL.res.unshift(validar(n,analises.MANUAL.filtros)?"V":"X");
  }

  // ================= UI =================
  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1000px;margin:auto">
      <h3 style="text-align:center">CSM</h3>

      <div style="margin:10px 0">
        🕒 Timeline (14):
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        Terminais:
        <div id="btnT" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        <div><b>ZERO</b><div id="cZERO"></div></div>
        <div><b>TIERS</b><div id="cTIERS"></div></div>
        <div><b>ORPHELINS</b><div id="cORPH"></div></div>
      </div>

      <!-- LINHA SECUNDÁRIA RESTAURADA -->
      <div style="margin-top:15px;border:1px solid #444;padding:6px">
        <b>Timeline Conjuntos</b>
        <div id="tlConj"></div>
      </div>

      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
    </div>
  `;

  for(let t=0;t<=9;t++){
    const b=document.createElement("button");
    b.textContent="T"+t;
    b.style="padding:6px;background:#444;color:#fff;border:1px solid #666";
    b.onclick=()=>{
      analises.MANUAL.filtros.has(t)
        ? analises.MANUAL.filtros.delete(t)
        : analises.MANUAL.filtros.add(t);
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

  function add(n){
    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();
    registrar(n);
    render();
  }

  function render(){

    const res = analises.MANUAL.res;

    // ===== Timeline principal =====
    tl.innerHTML = timeline.map((n,i)=>{
      let r=res[i];
      let cor="#aaa";
      if(r==="V") cor="#00e676";
      if(r==="X") cor="#ff5252";

      // 26 sempre verde
      if(n===26) cor="#00e676";

      return `<span style="color:${cor}">${n}</span>`;
    }).join(" · ");

    const filtros = analises.MANUAL.filtros;

    const trios = triosSelecionados(filtros);
    const por={ZERO:[],TIERS:[],ORPHELINS:[]};
    trios.forEach(x=>por[x.eixo].push(x.trio.join("-")));
    cZERO.innerHTML=por.ZERO.join("<div></div>");
    cTIERS.innerHTML=por.TIERS.join("<div></div>");
    cORPH.innerHTML=por.ORPHELINS.join("<div></div>");

    // Botões T acendem
    document.querySelectorAll("#btnT button").forEach(b=>{
      const t=+b.textContent.slice(1);
      b.style.background = filtros.has(t) ? "#00e676" : "#444";
    });

    // ===== Linha secundária =====
    const numerosMarcados = new Set();

    filtros.forEach(t=>{
      track.forEach(n=>{
        if(terminal(n)===t){
          vizinhosRace(n).forEach(v=>{
            numerosMarcados.add(v);
          });
        }
      });
    });

    tlConj.innerHTML = timeline.map(n=>{
      const ativo = numerosMarcados.has(n);
      return `<span style="
        color:${ativo?"#00e676":"#555"};
        font-weight:${ativo?"700":"400"};
      ">${n}</span>`;
    }).join(" · ");
  }

  render();

})();
