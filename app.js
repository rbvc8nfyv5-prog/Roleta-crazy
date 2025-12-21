(function () {

  // ================= CONFIG BASE =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  const ancoras = [12,32,2,22,13,23,33];

  // ================= ESTADO =================
  let hist = [];

  // ================= FUNÇÕES BASE =================
  const terminal = n => n % 10;

  function vizinhos(n){
    let i = track.indexOf(n);
    return [
      track[(i+36)%37],
      track[(i+1)%37]
    ];
  }

  // ================= PAR DE TERMINAIS =================
  function paresDeTerminais(){
    let mapa = {};
    let ult = hist.slice(-14);

    ult.forEach(n=>{
      let t = terminal(n);
      vizinhos(n).forEach(v=>{
        let tv = terminal(v);
        let par = [t, tv].sort().join("-");
        mapa[par] = (mapa[par] || 0) + 1;
      });
    });

    return Object.entries(mapa)
      .sort((a,b)=>b[1]-a[1]);
  }

  // ================= TERMINAIS FORTES =================
  function terminaisFortes(){
    let pares = paresDeTerminais();
    let set = new Set();

    pares.slice(0,3).forEach(p=>{
      let [a,b] = p[0].split("-").map(Number);
      set.add(a);
      set.add(b);
    });

    return [...set].slice(0,3);
  }

  // ================= ALVOS =================
  function alvos(){
    let ts = terminaisFortes();
    let nums = [];

    ts.forEach(t=>{
      terminais[t].forEach(n=>{
        vizinhos(n).forEach(v=>{
          if(!nums.includes(v)) nums.push(v);
        });
      });
    });

    return nums.slice(0,3);
  }

  // ================= ÂNCORAS =================
  function coberturaAncora(a){
    let i = track.indexOf(a);
    return new Set([
      track[(i+35)%37],
      track[(i+36)%37],
      a,
      track[(i+1)%37],
      track[(i+2)%37]
    ]);
  }

  function ancoraDoNumero(n){
    if(n === 14) return 22;
    if(n === 34) return 13;
    for(let a of ancoras){
      if(coberturaAncora(a).has(n)) return a;
    }
  }

  // ================= ALVOS SECOS (INALTERADO) =================
  function alvoSeco(){
    let ts = terminaisFortes();
    let secos = [];

    ts.forEach(t=>{
      terminais[t].forEach(n=>{
        if(secos.every(x=>{
          let d = Math.abs(track.indexOf(x)-track.indexOf(n));
          return Math.min(d,37-d) >= 4;
        })){
          secos.push(n);
        }
      });
    });

    return secos.slice(0,6);
  }

  // ================= UI =================
  document.body.style.background = "#111";
  document.body.style.color = "#fff";

  document.body.innerHTML = `
    <div style="padding:10px">
      <h3 style="text-align:center">App Caballerro</h3>

      <div style="margin-bottom:6px">
        🕒 Linha do tempo: <span id="timeline"></span>
      </div>

      <div>🎯 ALVOS: <span id="alvos"></span></div>
      <div>🎯 ALVOS +: <span id="alvosMais"></span></div>
      <div>🎯 ALVOS SECOS: <span id="alvosSeco"></span></div>
      <div>📊 TERMINAIS FORTES: <span id="tf"></span></div>

      <div id="nums"
           style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px">
      </div>
    </div>
  `;

  const nums = document.getElementById("nums");

  for(let n=0;n<=36;n++){
    let b = document.createElement("button");
    b.textContent = n;
    b.style = "padding:8px;background:#333;color:#fff;border:1px solid #555";
    b.onclick = ()=>{ hist.push(n); render(); };
    nums.appendChild(b);
  }

  function render(){
    document.getElementById("timeline").textContent =
      hist.slice(-14).join(" · ");

    let a = alvos();

    document.getElementById("alvos").textContent =
      a.join(" · ");

    // 🔴 AQUI É A ÚNICA MUDANÇA → 4 ALVOS +
    document.getElementById("alvosMais").textContent =
      a.map(n=>ancoraDoNumero(n)).slice(0,4).join(" · ");

    document.getElementById("alvosSeco").textContent =
      alvoSeco().join(" · ");

    document.getElementById("tf").textContent =
      terminaisFortes().map(t=>"T"+t).join(" · ");
  }

  render();

})();
