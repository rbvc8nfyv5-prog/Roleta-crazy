(function () {

  // ================= CONFIG BASE =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  const cavalos = { A:[2,5,8], B:[0,3,6,9], C:[1,4,7] };

  const setores = {
    TIER:new Set([27,13,36,11,30,8,23,10,5,24,16,33]),
    ORPHANS:new Set([1,20,14,31,9,17,34,6]),
    ZERO:new Set([0,3,12,15,26,32,35]),
    VOISINS:new Set([2,4,7,18,19,21,22,25,28,29])
  };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  const coresCavalo = { A:"#9c27b0", B:"#1e88e5", C:"#43a047" };
  const coresSetor = { TIER:"#e53935", ORPHANS:"#1e88e5", ZERO:"#43a047", VOISINS:"#8e24aa" };
  const corT3 = "#bdbdbd";

  // ================= ESTADO =================
  let hist = [];
  let mostrar5 = false;
  let modoCavalos = false;
  let modoSetores = false;

  let contAlvo = 0;
  let esperaSeco = -1; // 👈 controle correto do seco

  let eventoAlvo = null;
  let eventoSeco = null;

  let vxAlvo = [];
  let vxSeco = [];
  const MAX_VX = 6;

  let alvoAtivo = false;
  let secoAtivo = false;

  // ================= FUNÇÕES =================
  function corNumero(n){
    if(modoCavalos){
      if(cavalos.A.includes(n%10)) return coresCavalo.A;
      if(cavalos.B.includes(n%10)) return coresCavalo.B;
      return coresCavalo.C;
    }
    if(modoSetores){
      for(let s in setores) if(setores[s].has(n)) return coresSetor[s];
    }
    if(n===0) return "#00c853";
    return reds.has(n) ? "#e53935" : "#212121";
  }

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
    let range=new Set();
    centros.forEach(c=>{
      let i=track.indexOf(c);
      for(let d=-4;d<=4;d++){
        range.add(track[(i+37+d)%37]);
      }
    });
    return [...range].slice(0,6);
  }

  // ================= UI =================
  let app=document.getElementById("caballerroApp");
  if(app) app.remove();

  app=document.createElement("div");
  app.id="caballerroApp";
  app.style="position:fixed;inset:0;background:#111;color:#fff;z-index:999999;font-family:Arial;overflow:auto";
  document.body.appendChild(app);

  app.innerHTML=`
    <div style="padding:10px;max-width:900px;margin:auto">
      <h3 style="text-align:center">App Caballerro</h3>
      <div id="boxAlvo">🎯 ALVO: <span id="centros"></span></div>
      <div id="boxSeco">🎯 ALVO SECO: <span id="alvoSeco"></span></div>
      <div id="nums"></div>
    </div>
  `;

  const nums=app.querySelector("#nums");

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.style="margin:4px;padding:6px";
    b.onclick=()=>{
      hist.push(n);

      alvoAtivo=false;
      secoAtivo=false;

      // ---------- ALVO 6 ----------
      contAlvo++;
      if(contAlvo===6){
        eventoAlvo = analisarCentros();
        alvoAtivo=true;
        esperaSeco=0;     // 👈 inicia espera do seco
        contAlvo=0;
      } else if(eventoAlvo){
        let area=new Set();
        eventoAlvo.forEach(c=>vizinhos(c,4).forEach(v=>area.add(v)));
        vxAlvo.push(area.has(n)?"V":"X");
        if(vxAlvo.length>MAX_VX) vxAlvo.shift();
        eventoAlvo=null;
      }

      // ---------- CONTROLE SECO ----------
      if(esperaSeco>=0){
        esperaSeco++;

        // 👇 SÓ NO SEGUNDO NÚMERO
        if(esperaSeco===2){
          eventoSeco=alvoSeco();
          secoAtivo=true;
        }

        // 👇 VALIDA NO TERCEIRO
        else if(esperaSeco===3 && eventoSeco){
          let area=new Set();
          eventoSeco.forEach(c=>vizinhos(c,1).forEach(v=>area.add(v)));
          vxSeco.push(area.has(n)?"V":"X");
          if(vxSeco.length>MAX_VX) vxSeco.shift();
          eventoSeco=null;
          esperaSeco=-1;
        }
      }

      render();
    };
    nums.appendChild(b);
  }

  function render(){
    document.getElementById("centros").textContent = analisarCentros().join(" · ");
    document.getElementById("alvoSeco").textContent = eventoSeco ? eventoSeco.join(" · ") : "";
  }

  render();

})();
