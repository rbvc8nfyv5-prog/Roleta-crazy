(function () {

  // ================= CONFIG BASE =================
  const track = [32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26,0];

  const terminais = {
    0:[0,10,20,30],1:[1,11,21,31],2:[2,12,22,32],3:[3,13,23,33],
    4:[4,14,24,34],5:[5,15,25,35],6:[6,16,26,36],
    7:[7,17,27],8:[8,18,28],9:[9,19,29]
  };

  const coresT = {
    0:"#00e5ff",1:"#ff1744",2:"#00e676",3:"#ff9100",
    4:"#d500f9",5:"#ffee58",6:"#2979ff",
    7:"#ff4081",8:"#76ff03",9:"#8d6e63"
  };

  const corT3 = "#bbbbbb"; // terceiro T (neutro)

  // ================= ESTADO =================
  let hist = [];

  // ================= FUNÇÕES =================
  function coverTerminal(t){
    let s = new Set();
    terminais[t].forEach(n=>{
      let i = track.indexOf(n);
      s.add(n);
      s.add(track[(i+36)%37]);
      s.add(track[(i+1)%37]);
    });
    return s;
  }

  function melhoresPares(){
    let ult = hist.slice(-14);
    let pares = [];
    for(let a=0;a<10;a++){
      for(let b=a+1;b<10;b++){
        let ca = coverTerminal(a), cb = coverTerminal(b);
        let hits = ult.filter(n=>ca.has(n)||cb.has(n)).length;
        pares.push({a,b,hits});
      }
    }
    return pares.sort((x,y)=>y.hits-x.hits).slice(0,5);
  }

  // 👉 escolhe o TERCEIRO T que cobre as falhas do par
  function terceiroT(par){
    let ult = hist.slice(-14);
    let ca = coverTerminal(par.a);
    let cb = coverTerminal(par.b);

    let melhor = null;
    let melhorHits = -1;

    for(let t=0;t<10;t++){
      if(t===par.a || t===par.b) continue;
      let ct = coverTerminal(t);
      let hits = ult.filter(n =>
        !ca.has(n) && !cb.has(n) && ct.has(n)
      ).length;

      if(hits > melhorHits){
        melhorHits = hits;
        melhor = t;
      }
    }
    return melhor;
  }

  // ================= UI =================
  let app = document.getElementById("caballerroApp");
  if(app) app.remove();

  app = document.createElement("div");
  app.id = "caballerroApp";
  app.style = `
    position:fixed;
    inset:0;
    background:#111;
    color:#fff;
    z-index:999999;
    font-family:Arial;
    overflow:auto;
  `;
  document.body.appendChild(app);

  app.innerHTML = `
    <div style="padding:10px;max-width:900px;margin:auto">
      <h3 style="text-align:center">App Caballerro</h3>
      <div id="linhas"></div>
      <div id="nums" style="display:grid;grid-template-columns:repeat(9,1fr);gap:6px;margin-top:10px"></div>
    </div>
  `;

  const linhas = app.querySelector("#linhas");
  const nums   = app.querySelector("#nums");

  for(let i=0;i<5;i++){
    let d=document.createElement("div");
    d.id="h"+i;
    d.style="display:flex;gap:6px;justify-content:center;margin-bottom:6px";
    linhas.appendChild(d);
  }

  for(let n=0;n<=36;n++){
    let b=document.createElement("button");
    b.textContent=n;
    b.style="font-size:16px;padding:8px;border-radius:4px;border:none;cursor:pointer";
    b.onclick=()=>{
      hist.push(n);
      render();
    };
    nums.appendChild(b);
  }

  function render(){
    let ult = hist.slice(-14).reverse();
    let pares = melhoresPares();

    for(let i=0;i<5;i++){
      let h = document.getElementById("h"+i);
      h.innerHTML="";
      let par = pares[i];
      if(!par) continue;

      let ca = coverTerminal(par.a);
      let cb = coverTerminal(par.b);
      let tc = terceiroT(par);
      let cc = tc!==null ? coverTerminal(tc) : null;

      ult.forEach(n=>{
        let box=document.createElement("div");
        box.style="display:flex;flex-direction:column;align-items:center";

        let d=document.createElement("div");
        d.textContent=n;
        d.style="width:26px;height:26px;line-height:26px;font-size:12px;background:#444;border-radius:4px;text-align:center";
        box.appendChild(d);

        let t=document.createElement("div");
        t.style="font-size:10px;line-height:10px";

        if(ca.has(n)){ t.textContent="T"+par.a; t.style.color=coresT[par.a]; }
        else if(cb.has(n)){ t.textContent="T"+par.b; t.style.color=coresT[par.b]; }
        else if(cc && cc.has(n)){ t.textContent="T"+tc; t.style.color=corT3; }

        if(t.textContent) box.appendChild(t);
        h.appendChild(box);
      });
    }
  }

  render();

})();
