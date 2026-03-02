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
    0:"#ff5252",1:"#ff9800",2:"#ffc107",3:"#00e676",
    4:"#00bcd4",5:"#2196f3",6:"#9c27b0",7:"#e91e63",
    8:"#8bc34a",9:"#ff00ff"
  };

  const eixos = [
    { nome:"ZERO", trios:[[0,32,15],[19,4,21],[2,25,17],[34,6,27]] },
    { nome:"TIERS", trios:[[13,36,11],[30,8,23],[10,5,24],[16,33,1]] },
    { nome:"ORPHELINS", trios:[[20,14,31],[9,22,18],[7,29,28],[12,35,3]] }
  ];

  let timeline = [];
  let janela = 6;

  const analises = {
    MANUAL: { filtros:new Set(), res:[] }
  };

  let filtrosConjuntos = new Set();

  // ================= IA AUTOMÁTICA =================

  const pos = {};
  track.forEach((n,i)=>pos[n]=i);
  const L = track.length;

  function dist(a,b){
    const d=(pos[b]-pos[a]+L)%L;
    return Math.min(d,L-d);
  }

  function vizinhos2(n){
    const i=pos[n];
    return [
      track[(i-2+L)%L],
      track[(i-1+L)%L],
      n,
      track[(i+1)%L],
      track[(i+2)%L]
    ];
  }

  function analisarIA(){
    if(timeline.length<15) return null;

    const ult=timeline.slice(0,20).reverse();
    let offsets=[];

    for(let i=1;i<ult.length;i++){
      offsets.push(dist(ult[i-1],ult[i]));
    }

    const media=offsets.reduce((a,b)=>a+b,0)/offsets.length;

    const curtos=offsets.filter(o=>o<=2).length;
    const medios=offsets.filter(o=>o>2&&o<=9).length;
    const longos=offsets.filter(o=>o>9).length;

    const total=offsets.length;

    return{
      media,
      pCurto:curtos/total,
      pMedio:medios/total,
      pLongo:longos/total
    };
  }

  function gerarIA(){
    const analise=analisarIA();
    if(!analise) return;

    const ultimo=timeline[0];

    const ranking=track.map(n=>{
      const d=dist(ultimo,n);
      let score=0;

      if(d<=2) score+=analise.pCurto*6;
      else if(d<=9) score+=analise.pMedio*6;
      else score+=analise.pLongo*6;

      score+=3-Math.abs(d-analise.media);

      if(n===ultimo) score-=10;

      return{n,score};
    }).sort((a,b)=>b.score-a.score);

    const escolhidos=[];
    const bloqueados=new Set();

    for(let item of ranking){
      const zona=vizinhos2(item.n);
      if(!zona.some(x=>bloqueados.has(x))){
        escolhidos.push(item.n);
        zona.forEach(x=>bloqueados.add(x));
      }
      if(escolhidos.length===5) break;
    }

    analises.MANUAL.filtros.clear();

    escolhidos.forEach(n=>{
      analises.MANUAL.filtros.add(terminal(n));
    });

    return analise;
  }

  function vizinhosRace(n){
    const i = track.indexOf(n);
    return [ track[(i+36)%37], n, track[(i+1)%37] ];
  }

  function triosSelecionados(filtros){
    let lista=[];
    eixos.forEach(e=>{
      e.trios.forEach(trio=>{
        const inter=trio.map(terminal)
          .filter(t=>!filtros.size||filtros.has(t)).length;
        if(inter>0) lista.push({eixo:e.nome,trio});
      });
    });
    return lista.slice(0,9);
  }

  function validar(n,filtros){
    return triosSelecionados(filtros).some(x=>x.trio.includes(n));
  }

  function registrar(n){
    analises.MANUAL.res.unshift(
      validar(n,analises.MANUAL.filtros)?"V":"X"
    );
  }

  document.body.style.background="#111";
  document.body.style.color="#fff";
  document.body.style.fontFamily="sans-serif";

  document.body.innerHTML += `
    <div id="iaBox" style="margin-top:15px;border:1px solid #444;padding:8px">
      <b>IA Automática</b>
      <div id="iaInfo" style="margin-top:6px;font-size:14px"></div>
    </div>
  `;

  function renderIA(){
    const analise=gerarIA();
    if(!analise){
      iaInfo.innerHTML="Aguardando dados...";
      return;
    }

    iaInfo.innerHTML=`
      Curto: ${(analise.pCurto*100).toFixed(1)}% |
      Médio: ${(analise.pMedio*100).toFixed(1)}% |
      Longo: ${(analise.pLongo*100).toFixed(1)}%
    `;
  }

  function add(n){
    timeline.unshift(n);
    if(timeline.length>50) timeline.pop();
    registrar(n);
    render();
  }

  function render(){

    renderIA();

    const res=analises.MANUAL.res;

    tl.innerHTML=timeline.map((n,i)=>{
      const r=res[i];
      const c=r==="V"?"#00e676":r==="X"?"#ff5252":"#aaa";
      return `<span style="color:${c}">${n}</span>`;
    }).join(" · ");

    const filtros=analises.MANUAL.filtros;

    document.querySelectorAll("#btnT button").forEach(b=>{
      const t=+b.textContent.slice(1);
      b.style.background=
        filtros.has(t)?corTerminal[t]:"#444";
    });
  }

  render();

})();
