(function () {

  // ================= CONFIG BASE =================
  const track=[32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const terminais={
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  // ================= ESTADO =================
  let hist=[];
  let contAlvo=0;

  let eventoAlvo=null;
  let eventoSeco=null;

  let esperaSeco=-1;        // controla N7 / N8
  let eventoSecoAtivo=false;

  let alvoAtivo=false;
  let secoAtivo=false;

  let vxAlvo=[];
  let vxSeco=[];
  const MAX_VX=6;

  // ================= FUNÇÕES =================
  function vizinhos(n,dist){
    let i=track.indexOf(n);
    let s=new Set([n]);
    for(let d=1;d<=dist;d++){
      s.add(track[(i+d)%37]);
      s.add(track[(i-d+37)%37]);
    }
    return s;
  }

  function analisarCentros(){
    if(hist.length<6) return [];
    let ult=hist.slice(-14).reverse();
    let usados=[];
    for(let n of ult){
      if(usados.every(x=>{
        let d=Math.abs(track.indexOf(x)-track.indexOf(n));
        return Math.min(d,37-d)>=6;
      })){
        usados.push(n);
        if(usados.length===3) break;
      }
    }
    return usados;
  }

  function alvoSeco(){
    let centros=analisarCentros();
    if(centros.length<3) return [];
    let s=new Set();
    centros.forEach(c=>{
      let i=track.indexOf(c);
      for(let d=-4;d<=4;d++){
        s.add(track[(i+37+d)%37]);
      }
    });
    return [...s].slice(0,6);
  }

  // ================= UI =================
  document.body.innerHTML=`
    <div style="background:#111;color:#fff;padding:10px">
      <h3>App Caballerro</h3>

      <div id="box6" style="border:2px solid transparent;padding:6px;margin:6px 0">
        🎯 ALVO 6: <span id="alvo6"></span>
        <div id="vx6"></div>
      </div>

      <div id="box8" style="border:2px dashed transparent;padding:6px;margin:6px 0">
        🎯 ALVO SECO: <span id="alvo8"></span>
        <div id="vx8"></div>
      </div>

      <div id="nums"></div>
    </div>
  `;

  const nums=document.getElementById("nums");
  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.style="margin:2px";
    b.onclick=()=>{

      hist.push(n);

      alvoAtivo=false;
      secoAtivo=false;

      // ---------- ALVO 6 ----------
      contAlvo++;
      if(contAlvo===6){
        eventoAlvo=analisarCentros();
        alvoAtivo=true;
        esperaSeco=0;       // inicia contagem pós-6
        contAlvo=0;
      } else if(eventoAlvo){
        let area=new Set();
        eventoAlvo.forEach(c=>vizinhos(c,4).forEach(v=>area.add(v)));
        vxAlvo.push(area.has(n)?"V":"X");
        if(vxAlvo.length>MAX_VX) vxAlvo.shift();
        eventoAlvo=null;
      }

      // ---------- CONTROLE DO SECO ----------
      if(esperaSeco>=0 && !eventoSecoAtivo){
        esperaSeco++;
        if(esperaSeco===2){
          eventoSeco=alvoSeco();   // 👉 INDICA NO N8
          secoAtivo=true;
          eventoSecoAtivo=true;    // aguarda validação
        }
      }
      else if(eventoSecoAtivo){
        let area=new Set();
        eventoSeco.forEach(c=>vizinhos(c,1).forEach(v=>area.add(v)));
        vxSeco.push(area.has(n)?"V":"X"); // 👉 VALIDA NO N9
        if(vxSeco.length>MAX_VX) vxSeco.shift();
        eventoSecoAtivo=false;
        eventoSeco=null;
        esperaSeco=-1;
      }

      render();
    };
    nums.appendChild(b);
  }

  function render(){
    document.getElementById("alvo6").textContent=analisarCentros().join(" · ");
    document.getElementById("alvo8").textContent=eventoSeco?eventoSeco.join(" · "):"";

    document.getElementById("box6").style.borderColor=alvoAtivo?"#ffd600":"transparent";
    document.getElementById("box8").style.borderColor=secoAtivo?"#00e5ff":"transparent";

    document.getElementById("vx6").innerHTML=vxAlvo.join(" ");
    document.getElementById("vx8").innerHTML=vxSeco.join(" ");
  }

})();
