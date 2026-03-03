(function () {

  // ================= CONFIG BASE =================
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

  const analises = {
    MANUAL: { filtros:new Set(), res:[] }
  };

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function validar(n, filtros){
    if(!filtros.size) return false;
    return [...filtros].some(t =>
      vizinhosRace(n).some(v => terminal(v) === t)
    );
  }

  function registrar(n){
    analises.MANUAL.res.unshift(
      validar(n,analises.MANUAL.filtros)?"V":"X"
    );
  }

  // ================= UI =================

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML = `
    <div style="padding:10px;max-width:1200px;margin:auto">
      <h3 style="text-align:center">CSM</h3>

      <div style="margin:10px 0">
        🕒 Timeline:
        <span id="tl" style="font-size:18px;font-weight:600"></span>
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        <b>Ímpares / Pares (Últimos 14)</b>
        <div id="parImparBox" style="margin-top:6px;font-weight:700;font-size:16px"></div>
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        <b>Terminais</b>
        <div id="btnT" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
      </div>

      <div style="border:1px solid #555;padding:8px;margin-bottom:10px">
        <button id="toggleTrios"
          style="padding:6px;background:#444;color:#fff;border:1px solid #666">
          Mostrar Trios Pares / Ímpares
        </button>

        <div id="areaTrios"
             style="display:none;margin-top:10px;max-height:350px;overflow:auto">
        </div>
      </div>

      <div style="margin-top:15px;border:1px solid #444;padding:6px">
        <b>Timeline Conjuntos (Colorido por Terminal)</b>
        <div id="tlConj"></div>
      </div>

      <div id="nums"
           style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>
    </div>
  `;

  // ===== BOTÕES TERMINAIS =====
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

  // ===== BOTÕES NÚMEROS =====
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

  // ===== GERAR TRIOS =====
  const todosTrios = [];
  const pares = [0,2,4,6,8];
  const impares = [1,3,5,7,9];

  function gerarTrios(lista){
    for(let i=0;i<lista.length;i++){
      for(let j=i+1;j<lista.length;j++){
        for(let k=j+1;k<lista.length;k++){
          todosTrios.push([lista[i],lista[j],lista[k]]);
        }
      }
    }
  }

  gerarTrios(pares);
  gerarTrios(impares);

  toggleTrios.onclick = ()=>{
    areaTrios.style.display =
      areaTrios.style.display==="none"?"block":"none";
  };

  function render(){

    // ===== TIMELINE PRINCIPAL =====
    tl.innerHTML = timeline.map((n,i)=>{
      const r=analises.MANUAL.res[i];
      const c=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${c}">${n}</span>`;
    }).join(" · ");

    // ===== CONTADOR ÍMPAR / PAR =====
    let paresC=0, imparesC=0;

    timeline.forEach(n=>{
      if(n===0) return;
      n%2===0 ? paresC++ : imparesC++;
    });

    const corMaior="#ff6d00";
    const corMenor="#00e5ff";

    let corPar="#fff", corImpar="#fff";

    if(paresC>imparesC){ corPar=corMaior; corImpar=corMenor; }
    else if(imparesC>paresC){ corImpar=corMaior; corPar=corMenor; }

    parImparBox.innerHTML=`
      <span style="color:${corImpar}">Ímpares: ${imparesC}</span>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <span style="color:${corPar}">Pares: ${paresC}</span>
    `;

    // ===== BOTÕES TERMINAIS =====
    document.querySelectorAll("#btnT button").forEach(b=>{
      const t=+b.textContent.slice(1);
      b.style.background=
        analises.MANUAL.filtros.has(t)?corTerminal[t]:"#444";
    });

    // ===== LINHA SECUNDÁRIA =====
    const mapaCores={};

    analises.MANUAL.filtros.forEach(t=>{
      track.forEach(n=>{
        if(terminal(n)===t){
          vizinhosRace(n).forEach(v=>{
            if(!mapaCores[v]) mapaCores[v]=corTerminal[t];
          });
        }
      });
    });

    tlConj.innerHTML=timeline.map(n=>{
      const cor=mapaCores[n]||"#333";
      return `<span style="color:${cor};font-weight:${mapaCores[n]?"700":"400"}">${n}</span>`;
    }).join(" · ");

    // ===== TRIOSS COM MINI TIMELINE COLORIDA =====
    areaTrios.innerHTML="";

    todosTrios.forEach(trio=>{

      const mapa={};

      trio.forEach(t=>{
        track.forEach(n=>{
          if(terminal(n)===t){
            vizinhosRace(n).forEach(v=>{
              if(!mapa[v]) mapa[v]=corTerminal[t];
            });
          }
        });
      });

      const linha=document.createElement("div");
      linha.style.marginBottom="10px";
      linha.style.borderBottom="1px solid #333";
      linha.style.paddingBottom="6px";

      linha.innerHTML=`
        <div style="cursor:pointer;color:#00e676;font-weight:700;margin-bottom:4px">
          ${trio.join("-")}
        </div>
        <div>
          ${timeline.map(n=>{
            const cor=mapa[n]||"#333";
            return `
              <span style="
                display:inline-block;
                width:18px;
                text-align:center;
                color:${cor};
                font-weight:${mapa[n]?"700":"400"};
              ">${n}</span>
            `;
          }).join("")}
        </div>
      `;

      linha.onclick=()=>{
        analises.MANUAL.filtros.clear();
        trio.forEach(t=>analises.MANUAL.filtros.add(t));
        render();
      };

      areaTrios.appendChild(linha);
    });
  }

  render();

})();
