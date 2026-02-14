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
  let estruturalCentrosAtivos = [];
  let estruturalRes = [];
  let estruturalAtivo = false;

  // ================= VIZINHOS =================
  function vizinhos5(n){
    const i = track.indexOf(n);
    return [
      track[(i-2+37)%37],
      track[(i-1+37)%37],
      n,
      track[(i+1)%37],
      track[(i+2)%37]
    ];
  }

  function estaDentroEstrutural(n){
    return estruturalCentrosAtivos.some(c =>
      vizinhos5(c).includes(n)
    );
  }

  // ================= GERAR 5 CENTRAIS SEMPRE =================
  function gerarLeitorEstrutural(){

    const usados = new Set();
    const centros = [];

    function podeUsar(n){
      return vizinhos5(n).every(x=>!usados.has(x));
    }

    function registrar(n){
      vizinhos5(n).forEach(x=>usados.add(x));
      centros.push(n);
    }

    // 1 Permanência
    const freq = {};
    timeline.forEach(n=>freq[n]=(freq[n]||0)+1);
    const perm = Object.entries(freq)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));

    if(perm!==undefined) registrar(perm);

    // 2 Compensação (oposto)
    if(perm!==undefined){
      const op = track[(track.indexOf(perm)+18)%37];
      if(podeUsar(op)) registrar(op);
    }

    // 3 Lacuna
    const lac = track.find(n=>!timeline.includes(n) && podeUsar(n));
    if(lac!==undefined) registrar(lac);

    // 4 Estrutural quente
    const freqViz={};
    timeline.forEach(n=>{
      vizinhos5(n).forEach(v=>{
        freqViz[v]=(freqViz[v]||0)+1;
      });
    });

    const quente = Object.entries(freqViz)
      .sort((a,b)=>b[1]-a[1])
      .map(x=>+x[0])
      .find(n=>podeUsar(n));

    if(quente!==undefined) registrar(quente);

    // 5 Ruptura
    const saltos=[];
    for(let i=0;i<timeline.length-1;i++){
      const a=track.indexOf(timeline[i]);
      const b=track.indexOf(timeline[i+1]);
      saltos.push({n:timeline[i],d:Math.abs(a-b)});
    }

    const ruptura = saltos
      .sort((a,b)=>b.d-a.d)
      .map(x=>x.n)
      .find(n=>podeUsar(n));

    if(ruptura!==undefined) registrar(ruptura);

    // GARANTIA DE 5
    while(centros.length<5){
      const extra = track.find(n=>podeUsar(n));
      if(extra===undefined) break;
      registrar(extra);
    }

    return centros.slice(0,5);
  }

  // ================= MELHOR TRIO REAL =================
  function melhorTrioGrupo(grupo){

    const trios=[];
    for(let i=0;i<grupo.length;i++)
      for(let j=i+1;j<grupo.length;j++)
        for(let k=j+1;k<grupo.length;k++)
          trios.push([grupo[i],grupo[j],grupo[k]]);

    const cont={};

    trios.forEach(trio=>{
      const key=trio.join("-");
      cont[key]=0;

      timeline.forEach(n=>{
        if(vizinhos5(n).some(v=>trio.includes(terminal(v))))
          cont[key]++;
      });
    });

    const ordenado = Object.entries(cont)
      .sort((a,b)=>b[1]-a[1]);

    return ordenado.length?ordenado[0][0]:null;
  }

  // ================= UI =================
  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML=`
  <div style="max-width:1000px;margin:auto;padding:10px">

    <h3>CSM</h3>

    <div>
      🕒 Timeline:
      <div id="tl" style="font-weight:bold"></div>
    </div>

    <div id="estruturaBox" class="quadro"
         style="border:1px solid #555;padding:8px;margin:10px 0;cursor:pointer">
    </div>

    <div id="q1479" class="quadro" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>1479</b>
      <div id="tl1479"></div>
    </div>

    <div id="q2589" class="quadro" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>2589</b>
      <div id="tl2589"></div>
    </div>

    <div id="q0369" class="quadro" style="border:1px solid #555;padding:6px;margin-bottom:6px;cursor:pointer">
      <b>0369</b>
      <div id="tl0369"></div>
    </div>

    <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:12px"></div>

  </div>
  `;

  for(let n=0;n<=36;n++){
    const b=document.createElement("button");
    b.textContent=n;
    b.style="padding:8px;background:#333;color:#fff";
    b.onclick=()=>add(n);
    nums.appendChild(b);
  }

  function ativarQuadro(el){
    document.querySelectorAll(".quadro").forEach(q=>{
      q.style.border="1px solid #555";
      q.style.boxShadow="none";
    });
    el.style.border="2px solid #00e676";
    el.style.boxShadow="0 0 10px #00e676";
  }

  estruturaBox.onclick=()=>{
    estruturalAtivo=true;
    ativarQuadro(estruturaBox);
  };

  function add(n){

    // VALIDAR COM CENTRAIS ATUAIS
    if(estruturalAtivo){
      estruturalRes.unshift(
        estaDentroEstrutural(n)?"V":"X"
      );
    }

    timeline.unshift(n);
    if(timeline.length>14) timeline.pop();

    // ATUALIZAR CENTRAIS PARA PRÓXIMA JOGADA
    estruturalCentrosAtivos = gerarLeitorEstrutural();

    render();
  }

  function render(){

    tl.innerHTML = timeline.map((n,i)=>{
      const r=estruturalRes[i];
      const cor=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${cor}">${n}</span>`;
    }).join(" · ");

    estruturaBox.innerHTML=`
      <b>Leitor Estrutural</b><br><br>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${estruturalCentrosAtivos.map(n=>`
          <div style="border:1px solid #00e676;padding:6px">${n}</div>
        `).join("")}
      </div>
    `;

    const grupos={
      tl1479:[1,4,7,9],
      tl2589:[2,5,8,9],
      tl0369:[0,3,6,9]
    };

    Object.entries(grupos).forEach(([id,grupo])=>{
      const melhor = melhorTrioGrupo(grupo);
      document.getElementById(id).innerHTML=`
        <div style="color:#00e676;font-size:12px">Melhor Trio: ${melhor||"-"}</div>
        ${timeline.map(n=>`
          <span style="
            display:inline-block;
            width:18px;
            text-align:center;
            background:${vizinhos5(n).some(v=>grupo.includes(terminal(v)))?"#00e676":"transparent"};
            margin-right:2px;
          ">${n}</span>
        `).join("")}
      `;
    });
  }

  render();

})();
